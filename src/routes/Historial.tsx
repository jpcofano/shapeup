import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TabBar } from "../components/TabBar";
import { Trophy, Trash2, Footprints } from "lucide-react";
import type { Historial, SesionCardio, MiembroId } from "../types/models";
import {
  getHistorialShapeUp, borrarSesionHistorial, borrarHistorialMiembro,
  cargarDiasActivosConCache,
} from "../data/historial";
import { getCardioRango, type CursorCardio } from "../data/salud";
import { getConfigImport, CONFIG_IMPORT_DEFAULT } from "../data/configImport";
import { soloRelevantes } from "../lib/actividadRelevante";
import { agruparDiasActivos } from "../lib/racha";
import { metaSemanal, seriesDeAdherencia, type SemanaAdherencia } from "../lib/adherencia";
import type { DiaActivo } from "../lib/racha";
import { lunesDeSemana } from "../lib/semana";
import { limpiarCacheDiasActivos } from "../lib/cacheDiasActivos";
import { SerieAdherencia } from "../components/SerieAdherencia";
import { getProgramaActivo } from "../data/programas";
import { getPerfiles } from "../data/perfiles";
import { ymdLocal } from "../lib/semana";
import { useAuth } from "../auth/useAuth";
import { soloShapeUp } from "../lib/tipoHistorial";
import { Bicep } from "../components/Bicep";
import { Sparkline } from "../components/Sparkline";

function formatFecha(s: string): string {
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
}

// ── Filas de la lista: sesiones de la app + actividades de /cardio (P76b) ────
//
// Las actividades NO están en /historial: se leen de /cardio y se filtran al
// mostrar (`lib/actividadRelevante.ts`). Por eso la lista es de una unión y no
// de un solo tipo — y por eso una actividad no se puede borrar desde acá: el
// dato crudo vive en Salud.

type Fila =
  | { clase: "sesion";    fecha: string; h: Historial }
  | { clase: "actividad"; fecha: string; c: SesionCardio };

/** Une las dos fuentes y ordena de la más reciente a la más vieja. */
export function combinarFilas(sesiones: Historial[], actividades: SesionCardio[]): Fila[] {
  return [
    ...sesiones.map((h): Fila => ({ clase: "sesion", fecha: h.fechaRealizada, h })),
    ...actividades.map((c): Fila => ({ clase: "actividad", fecha: c.fecha, c })),
  ].sort((a, b) => b.fecha.localeCompare(a.fecha));
}

function horaDe(ms?: number): string | null {
  if (ms == null) return null;
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/**
 * Una actividad de /cardio en la lista del historial.
 *
 * Tocarla **no navega**: despliega acá el mismo detalle que muestra la pestaña
 * Cardio (duración, kcal, FC, zona). No hay una pantalla nueva que mantener.
 */
function ActividadRow({ c, abierta, onToggle }: {
  c: SesionCardio; abierta: boolean; onToggle: () => void;
}) {
  const hora = horaDe(c.inicioMs);
  return (
    <div
      className="rutina-card"
      style={{ display: "flex", gap: 12, alignItems: "flex-start" }}
      onClick={onToggle}
    >
      <span style={{
        width: 38, height: 38, borderRadius: 10,
        background: "var(--card-hover)",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, color: "var(--muted)",
      }}>
        <Footprints size={20} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
          <p className="rutina-card-title" style={{ margin: 0 }}>{c.actividad}</p>
          {/* El chip que la distingue de una sesión de la app. */}
          <span className="badge badge-muted" style={{ flexShrink: 0 }}>Actividad</span>
        </div>
        <div className="rutina-card-meta">
          <span>{formatFecha(c.fecha)}</span>
          {hora != null && <span>· {hora}</span>}
          {c.duracionMin != null && <span>· {Math.round(c.duracionMin)} min</span>}
          {c.kcal != null && <span>· {Math.round(c.kcal)} kcal</span>}
          {c.zonaPrincipal && <span className="badge badge-muted">{c.zonaPrincipal}</span>}
        </div>
        {abierta && (
          <div style={{ marginTop: 8, fontSize: 12, color: "var(--muted)", display: "flex", flexWrap: "wrap", gap: 10 }}>
            {c.distanciaKm != null && <span>{c.distanciaKm} km</span>}
            {c.fcPromedio  != null && <span>FC media {Math.round(c.fcPromedio)} bpm</span>}
            {c.fcMaxima    != null && <span>FC máx {Math.round(c.fcMaxima)} bpm</span>}
            {c.fcMinima    != null && <span>FC mín {Math.round(c.fcMinima)} bpm</span>}
            {c.fcPromedio == null && <span>Sin datos del reloj para esta actividad</span>}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tab Sesiones ──────────────────────────────────────────────────────────────

function SesionesList({ filas, navigate, editMode, onDeleteOne, hayMas, cargandoMas, onCargarMas }: {
  filas: Fila[];
  /** Queda historia más vieja sin traer. */
  hayMas?: boolean;
  cargandoMas?: boolean;
  onCargarMas?: () => void;
  navigate: (to: string) => void;
  editMode: boolean;
  onDeleteOne: (idHist: string) => void;
}) {
  const [abierta, setAbierta] = useState<string | null>(null);

  if (filas.length === 0) {
    return (
      <div className="empty-state">
        <p>Todavía no completaste ninguna sesión.</p>
      </div>
    );
  }
  return (
    <div className="card-list">
      {filas.map((f) => {
        if (f.clase === "actividad") {
          return (
            <ActividadRow
              key={f.c.idCardio}
              c={f.c}
              abierta={abierta === f.c.idCardio}
              onToggle={() => setAbierta((v) => (v === f.c.idCardio ? null : f.c.idCardio))}
            />
          );
        }
        const h = f.h;
        return (
        <div
          key={h.idHist}
          className="rutina-card"
          style={{ display: "flex", gap: 12, alignItems: "flex-start" }}
          onClick={() => { if (!editMode) navigate(`/historial/${h.idHist}`); }}
        >
          <span style={{
            width: 38, height: 38, borderRadius: 10,
            background: "var(--accent-dim)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, color: "var(--accent)",
          }}>
            <Bicep size={20} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
              <p className="rutina-card-title" style={{ margin: 0 }}>{h.nombreRutina}</p>
              {h.rpe != null && (
                <span className="badge badge-muted" style={{ flexShrink: 0 }}>RPE {h.rpe}</span>
              )}
            </div>
            <div className="rutina-card-meta">
              <span>{formatFecha(h.fechaRealizada)}</span>
              {h.duracionRealMin  != null && <span>· {h.duracionRealMin} min</span>}
              {h.totalSeriesHechas != null && <span>· {h.totalSeriesHechas} series</span>}
              {h.tonelajeKg != null && h.tonelajeKg > 0 && (
                <span style={{ fontWeight: 600, color: "var(--fg)" }}>· {h.tonelajeKg.toLocaleString("es")} kg</span>
              )}
              {h.tipo === "libre" && <span className="badge badge-muted">Libre</span>}
              {h.completitud === "parcial" && <span className="badge badge-warn">Parcial</span>}
            </div>
          </div>
          {editMode && (
            <button
              className="btn-icon-sm danger"
              style={{ flexShrink: 0 }}
              onClick={(e) => { e.stopPropagation(); onDeleteOne(h.idHist); }}
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
        );
      })}
      {hayMas && onCargarMas && (
        <button
          className="btn-secondary"
          style={{ width: "100%", marginTop: 4, fontSize: 13 }}
          disabled={cargandoMas}
          onClick={onCargarMas}
        >
          {cargandoMas ? "Trayendo…" : "Traer más viejas"}
        </button>
      )}
    </div>
  );
}

// ── Hoja de confirmación ────────────────────────────────────────────────────────

function ConfirmBorrarSheet({ titulo, onConfirm, onCancel, busy }: {
  titulo: string;
  onConfirm: () => void;
  onCancel: () => void;
  busy: boolean;
}) {
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-sheet" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header"><span>{titulo}</span></div>
        <div style={{ padding: 16 }}>
          <p style={{ margin: "0 0 6px", fontSize: 13, color: "var(--danger)", fontWeight: 600 }}>
            No se puede deshacer.
          </p>
          <p style={{ margin: "0 0 16px", fontSize: 13, color: "var(--muted)" }}>
            Tus rutinas y ejercicios no se tocan.
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-secondary" style={{ flex: 1 }} onClick={onCancel} disabled={busy}>
              Cancelar
            </button>
            <button
              className="btn-primary"
              style={{ flex: 1, background: "var(--danger)" }}
              onClick={onConfirm}
              disabled={busy}
            >
              {busy ? "Borrando…" : "Borrar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Tab Progreso ──────────────────────────────────────────────────────────────

function ProgresoTab({ entries, actividades, serie, serieTruncada }: {
  entries: Historial[];
  /** Las de /cardio que pasan el filtro (P76b). No están en /historial. */
  actividades: SesionCardio[];
  /** Serie de adherencia semanal (P77a). Vacía si no hay meta o no hay sesiones. */
  serie: SemanaAdherencia[];
  /** Se alcanzó el tope de paginado: faltan actividades del rango (P77b). */
  serieTruncada?: boolean;
}) {
  // Mixto (P74, se mantiene en P76b): volumen y PR son del plan — solo
  // ShapeUp; los totales de sesiones y minutos hablan de moverse — cuentan
  // también las actividades que pasan el filtro.
  const propias = soloShapeUp(entries);

  // Volumen semanal
  const byWeek = new Map<string, number>();
  for (const h of propias) {
    if (!h.semanaInicio) continue;
    byWeek.set(h.semanaInicio, (byWeek.get(h.semanaInicio) ?? 0) + (h.tonelajeKg ?? 0));
  }
  const weeks = Array.from(byWeek.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12);
  const volData  = weeks.map(([, v]) => v);
  const volLabels = weeks.map(([k]) => k.slice(5));
  const volDelta = volData.length >= 2
    ? volData[volData.length - 1] - volData[volData.length - 2]
    : null;

  // Totales: sesiones + actividades que pasan el filtro.
  const totalSesiones = entries.length + actividades.length;
  const totalMin = entries.reduce((s, h) => s + (h.duracionRealMin ?? 0), 0)
    + actividades.reduce((s, c) => s + (c.duracionMin ?? 0), 0);
  const totalHoras = (totalMin / 60).toFixed(1);

  // Records personales (PR): max tonelaje por rutina
  const prByRutina = new Map<string, { nombre: string; kg: number; fecha: string }>();
  for (const h of propias) {
    if (!h.idRutina || !h.tonelajeKg || h.tonelajeKg <= 0) continue;
    const cur = prByRutina.get(h.idRutina);
    if (!cur || h.tonelajeKg > cur.kg) {
      prByRutina.set(h.idRutina, { nombre: h.nombreRutina, kg: h.tonelajeKg, fecha: h.fechaRealizada });
    }
  }
  const prs = Array.from(prByRutina.values())
    .sort((a, b) => b.kg - a.kg)
    .slice(0, 5);

  if (totalSesiones === 0) {
    return (
      <div className="empty-state"><p>Sin sesiones todavía para calcular progreso.</p></div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Adherencia semanal (P77a): días contra la meta, últimas 12 semanas. */}
      {serie.length > 0 && <SerieAdherencia serie={serie} truncada={serieTruncada} />}

      {/* Sparkline volumen semanal */}
      {volData.length >= 2 && (
        <div className="card">
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 6 }}>
            <p className="section-title" style={{ margin: 0 }}>Volumen semanal</p>
            {volDelta !== null && (
              <span style={{ fontSize: 12, fontWeight: 700,
                color: volDelta >= 0 ? "var(--accent)" : "var(--danger)" }}>
                {volDelta >= 0 ? "↑" : "↓"} {Math.abs(Math.round(volDelta)).toLocaleString("es")} kg vs ant.
              </span>
            )}
          </div>
          <Sparkline data={volData} color="var(--info)" height={52} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
            <span style={{ fontSize: 9, color: "var(--muted)" }}>{volLabels[0]}</span>
            <span style={{ fontSize: 9, color: "var(--muted)" }}>{volLabels[volLabels.length - 1]}</span>
          </div>
        </div>
      )}

      {/* Totales */}
      <div className="card">
        <p className="section-title" style={{ marginBottom: 10 }}>Totales</p>
        <div className="stats-row">
          <div className="stat">
            <span className="stat-value">{totalSesiones}</span>
            <span className="stat-label">sesiones</span>
          </div>
          <div className="stat">
            <span className="stat-value">{totalHoras}</span>
            <span className="stat-label">horas</span>
          </div>
        </div>
      </div>

      {/* Records personales */}
      {prs.length > 0 && (
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <Trophy size={14} color="var(--accent)" strokeWidth={1.8} />
            <p className="section-title" style={{ margin: 0 }}>Records personales</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {prs.map((pr, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: 13 }}>
                <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--muted)" }}>
                  {pr.nombre}
                </span>
                <div style={{ display: "flex", gap: 8, flexShrink: 0, alignItems: "baseline" }}>
                  <span style={{ fontWeight: 700 }}>{pr.kg.toLocaleString("es")} kg</span>
                  <span style={{ fontSize: 11, color: "var(--muted)" }}>{formatFecha(pr.fecha)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const HIST_TABS = [
  { key: "sesiones" as const, label: "Sesiones" },
  { key: "progreso" as const, label: "Progreso" },
];

// ── Historial ─────────────────────────────────────────────────────────────────

/** Los últimos 12 meses en hora local: la ventana inicial de actividades. */
function haceUnAno(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function diaAnterior(fecha: string): string {
  const [y, m, dd] = fecha.split("-").map(Number);
  const d = new Date(y, m - 1, dd - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function Historial() {
  const navigate     = useNavigate();
  const { memberId } = useAuth();
  const [entries, setEntries] = useState<Historial[]>([]);
  /** Todas las de /cardio traídas, sin filtrar: la serie cuenta el movimiento entero. */
  const [cardio, setCardio] = useState<SesionCardio[]>([]);
  /** Umbral vigente, para filtrar al mostrar (P76b). */
  const [umbral, setUmbral] = useState(CONFIG_IMPORT_DEFAULT);
  /** Meta de días por semana: del plan, o el override del perfil (P77a). */
  const [meta, setMeta] = useState<number | null>(null);
  /**
   * Días activos de las últimas 12 semanas, para la serie de Progreso (P77b).
   * Se piden **al abrir Progreso**, no al montar la pantalla, y las semanas
   * cerradas salen de `localStorage`.
   */
  const [diasSerie, setDiasSerie] = useState<DiaActivo[] | null>(null);
  const [serieTruncada, setSerieTruncada] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [tab,     setTab]     = useState<"sesiones" | "progreso">("sesiones");

  const [editMode, setEditMode] = useState(false);
  const [confirm,  setConfirm]  = useState<{ tipo: "uno"; idHist: string } | { tipo: "todo" } | null>(null);
  const [borrando, setBorrando] = useState(false);
  const [errorBorrado, setErrorBorrado] = useState<string | null>(null);
  // Paginado de las actividades, igual que en Salud (P76b).
  const [cursor,       setCursor]       = useState<CursorCardio | null>(null);
  const [ventanaDesde, setVentanaDesde] = useState<string | null>(null);
  const [cargandoMas,  setCargandoMas]  = useState(false);

  // Las sesiones de la app completas, y la primera página de actividades del
  // último año, filtradas al leer (P76b): nada de esto está duplicado en
  // /historial, así que la unión se arma acá y no en Firestore.
  useEffect(() => {
    if (!memberId) return;
    const desde = haceUnAno();
    setVentanaDesde(desde);
    Promise.all([
      getHistorialShapeUp(memberId),
      getCardioRango(memberId as MiembroId, { desde }),
      getConfigImport(),
    ]).then(([propias, cardio, cfg]) => {
      if (!propias.ok) { setError(propias.error); setLoading(false); return; }
      if (!cardio.ok)  { setError(cardio.error);  setLoading(false); return; }
      setEntries(propias.value);
      setCardio(cardio.value.sesiones);
      setUmbral(cfg.ok ? cfg.value : CONFIG_IMPORT_DEFAULT);
      setCursor(cardio.value.siguienteCursor);
      setLoading(false);
    });

    // La meta, para la serie de adherencia. Las dos lecturas cachean en
    // memoria (`getProgramaActivo` desde P77a, `getPerfiles` desde antes): si
    // ya pasaste por Home, esto no lee nada.
    Promise.all([
      getProgramaActivo(memberId as MiembroId),
      getPerfiles(),
    ]).then(([prog, perf]) => {
      setMeta(metaSemanal(
        prog.ok ? prog.value : null,
        perf.ok ? perf.value[memberId as MiembroId] : undefined,
      ));
    });
  }, [memberId]);

  // Las 12 semanas de la serie: una sola vez, y solo si abrís Progreso. La
  // primera visita después de un import lee las 12; las siguientes, la semana
  // en curso y nada más (P77b).
  useEffect(() => {
    if (!memberId || tab !== "progreso" || diasSerie != null) return;
    const hoy = ymdLocal();
    const desde = lunesDeSemana(new Date(new Date(lunesDeSemana(hoy) + "T00:00:00").getTime() - 11 * 7 * 86_400_000));
    cargarDiasActivosConCache(memberId as MiembroId, desde, hoy).then((r) => {
      if (!r.ok) { setError(r.error); return; }
      setDiasSerie(r.value.dias);
      setSerieTruncada(r.value.truncado);
    });
  }, [memberId, tab, diasSerie]);

  /** Trae la página siguiente de actividades, hacia atrás. */
  async function cargarMas() {
    if (!memberId || cargandoMas) return;
    setCargandoMas(true);
    const opciones = cursor
      ? { desde: ventanaDesde ?? undefined, cursor }
      : { hasta: diaAnterior(ventanaDesde ?? haceUnAno()) };
    const [r, cfg] = await Promise.all([
      getCardioRango(memberId as MiembroId, opciones),
      getConfigImport(),
    ]);
    if (r.ok) {
      setCardio((prev) => [...prev, ...r.value.sesiones]);
      if (cfg.ok) setUmbral(cfg.value);
      setCursor(r.value.siguienteCursor);
      if (!cursor) setVentanaDesde(null);
    } else {
      setError(r.error);
    }
    setCargandoMas(false);
  }

  // Lo que se MUESTRA pasa por el filtro; la serie cuenta todo el movimiento.
  const actividades = soloRelevantes(cardio, umbral);
  const filas = combinarFilas(entries, actividades);
  const hayMas = cursor != null || ventanaDesde != null;
  // Los días de plan salen del historial completo, así que las barras y la
  // meta son exactas siempre. El MOVIMIENTO sale de las 12 semanas cargadas
  // aparte: las semanas de más atrás quedan en `null` y no dibujan sufijo,
  // en vez de mostrar un cero que no se midió (P77b).
  const serie = (() => {
    if (meta == null) return [];
    const hoy = ymdLocal();
    const semanaHoy = lunesDeSemana(hoy);
    const desdeSerie = lunesDeSemana(new Date(new Date(semanaHoy + "T00:00:00").getTime() - 11 * 7 * 86_400_000));
    const cargados = diasSerie ?? [];
    const fechasCargadas = new Set(cargados.map((d) => d.fecha));
    const viejos = agruparDiasActivos(entries.filter((h) => !fechasCargadas.has(h.fechaRealizada)));
    const domingo = ymdLocal(new Date(new Date(semanaHoy + "T00:00:00").getTime() + 6 * 86_400_000));
    return seriesDeAdherencia(
      [...viejos, ...cargados], meta, hoy,
      diasSerie != null ? { desde: desdeSerie, hasta: domingo } : undefined,
    );
  })();

  async function confirmarBorrado() {
    if (!confirm || !memberId) return;
    setBorrando(true);
    setErrorBorrado(null);

    // Borrar toca semanas ya cerradas, que es justo lo que la caché da por
    // inmutable: se tira entera y se vuelve a leer (P77b).
    limpiarCacheDiasActivos();
    setDiasSerie(null);

    if (confirm.tipo === "uno") {
      const r = await borrarSesionHistorial(confirm.idHist);
      if (r.ok) setEntries((prev) => prev.filter((h) => h.idHist !== confirm.idHist));
      else      setErrorBorrado(r.error);
    } else {
      const r = await borrarHistorialMiembro(memberId);
      if (r.ok) { setEntries([]); setEditMode(false); }
      else      setErrorBorrado(r.error);
    }

    setBorrando(false);
    setConfirm(null);
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Historial</h1>
        {tab === "sesiones" && filas.length > 0 && (
          <button className="btn-icon-sm" onClick={() => setEditMode((v) => !v)}>
            {editMode ? "Listo" : <Trash2 size={18} />}
          </button>
        )}
      </div>

      <TabBar tabs={HIST_TABS} active={tab} onChange={setTab} style={{ marginBottom: 8 }} />

      {loading && <div className="empty-state"><div className="spinner" /></div>}
      {error   && <p className="inline-error">{error}</p>}
      {errorBorrado && <p className="inline-error">{errorBorrado}</p>}

      {!loading && !error && tab === "sesiones" && (
        <>
          <SesionesList
            filas={filas}
            navigate={navigate}
            editMode={editMode}
            onDeleteOne={(idHist) => setConfirm({ tipo: "uno", idHist })}
            hayMas={hayMas}
            cargandoMas={cargandoMas}
            onCargarMas={cargarMas}
          />
          {editMode && entries.length > 0 && (
            <button
              className="btn-secondary"
              style={{ marginTop: 12, color: "var(--danger)" }}
              onClick={() => setConfirm({ tipo: "todo" })}
            >
              Borrar todo el historial
            </button>
          )}
        </>
      )}
      {!loading && !error && tab === "progreso" && (
        <ProgresoTab
          entries={entries} actividades={actividades}
          serie={serie} serieTruncada={serieTruncada}
        />
      )}

      {confirm && (
        <ConfirmBorrarSheet
          titulo={confirm.tipo === "uno" ? "Borrar sesión" : "Borrar todo el historial"}
          busy={borrando}
          onCancel={() => setConfirm(null)}
          onConfirm={confirmarBorrado}
        />
      )}
    </div>
  );
}
