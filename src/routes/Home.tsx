import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Zap, Flame, Check, Moon, AlertTriangle, Lightbulb, Info } from "lucide-react";
import type { Programa, Historial, MedicionCorporal, MetricaSalud, RegistroSueno, Recomendacion } from "../types/models";
import type { MiembroId } from "../types/models";
import { getProgramaActivo } from "../data/programas";
import { getPerfiles } from "../data/perfiles";
import { getHistorialShapeUp, getDiasActivos, conciliarPendientes } from "../data/historial";
import { barrerSesionesHuerfanas } from "../data/sesiones";
import { usePendientes } from "../hooks/usePendientes";
import { PendientesChip } from "../components/PendientesChip";
import { getMediciones, getMetricasSalud, getRegistrosSueno } from "../data/salud";
import { calcularResumenSalud, type SenalSalud } from "../lib/resumenSalud";
import { calcularRecomendacion, seleccionarEstadoDiario, type EstadoDiario } from "../lib/recomendaciones";
import { useTheme } from "../contexts/ThemeProvider";
import { useAuth } from "../auth/useAuth";
import { MemberAvatar } from "../components/MemberAvatar";
import { WeekStrip } from "../components/WeekStrip";
import { ShapeUpMark, ShapeUpWordmark } from "../components/Brand";
import { VistaSemanal } from "../components/VistaSemanal";
import { proximaSesion, type ProximaSesionResult } from "../lib/proximaSesion";
import { lunesDeSemana, ymdLocal } from "../lib/semana";
import { sesionDeHoy, jsDayToNum, type SesionDeHoyResult } from "../lib/sesionDeHoy";
import { getHomeLayout, type HomeLayout } from "../lib/homeLayout";
import { calcularWeekChips } from "../lib/weekChips";
import type { DiaActivo } from "../lib/racha";
import { agruparDiasActivos } from "../lib/racha";
import {
  metaSemanal, seriesDeAdherencia, rachaActual, rachaRecord, tasaCumplimiento,
  semanaEnCurso,
} from "../lib/adherencia";
import { AdherenciaCard } from "../components/AdherenciaCard";
import { HomeReduxContent, type HomeReduxData, type HomeReduxButton } from "../components/homeRedux/HomeReduxContent";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** El barrido de sesiones huérfanas corre una vez por carga de la app (P69). */
let barridoHuerfanasHecho = false;

const DIA_SEMANA_IDX: Partial<Record<string, number>> = {
  lunes: 0, martes: 1, "miércoles": 2, jueves: 3, viernes: 4, sábado: 5, domingo: 6,
};
const PRIMER_NOMBRE: Record<MiembroId, string> = {
  juanpablo: "Juan Pablo", maria: "María", sofia: "Sofía", federico: "Federico",
};
const DIAS_LARGOS = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];

function iniciales(nombre: string): string {
  return nombre.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

function diasEntrenamiento(programa: Programa): number[] {
  return programa.dias
    .filter((d) => d.tipo !== "descanso" && d.diaSemana)
    .map((d) => DIA_SEMANA_IDX[d.diaSemana!])
    .filter((i): i is number => i !== undefined);
}

function fmtKg(kg: number): string {
  return kg >= 1000 ? `${(kg / 1000).toFixed(1)}k` : String(Math.round(kg));
}

// ── RecCard ───────────────────────────────────────────────────────────────────

function RecCard({ rec, onDescartar, onVerRutina }: {
  rec: Recomendacion;
  onDescartar: () => void;
  onVerRutina: () => void;
}) {
  const color = rec.severidad === "importante" ? "var(--danger)"
    : rec.severidad === "sugerencia"  ? "var(--warning)"
    : "var(--info)";
  const Icon = rec.severidad === "importante" ? AlertTriangle
    : rec.severidad === "sugerencia"  ? Lightbulb
    : Info;
  const tieneAccion = !!(rec.accionSugerida?.idRutina ?? rec.accionSugerida?.idPrograma);
  return (
    <div className="card" style={{ padding: "12px 14px" }}>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        <Icon size={16} color={color} style={{ flexShrink: 0, marginTop: 2 }} strokeWidth={2} />
        <p style={{ margin: 0, fontSize: 13, flex: 1, color: "var(--fg)", lineHeight: 1.4 }}>
          {rec.mensaje}
        </p>
        <button
          onClick={onDescartar}
          style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", padding: 0, lineHeight: 1, fontSize: 14 }}
          aria-label="Descartar recomendación"
        >✕</button>
      </div>
      {tieneAccion && (
        <button
          className="btn-secondary"
          style={{ marginTop: 8, fontSize: 12, padding: "5px 12px" }}
          onClick={onVerRutina}
        >
          Ver rutina
        </button>
      )}
    </div>
  );
}

function EstadoDiarioLinea({ estado, onClick }: { estado: EstadoDiario; onClick: () => void }) {
  if (estado.tipo !== "linea") return null;
  const color = estado.severidad === "alerta" ? "var(--danger)"
    : estado.severidad === "atencion" ? "var(--warning)"
    : "var(--accent)";
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 6, background: "none", border: "none",
        padding: "2px 0", cursor: "pointer", font: "inherit", fontSize: 12, color: "var(--muted)",
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />
      {estado.texto}
    </button>
  );
}

// ── ProgressRing ──────────────────────────────────────────────────────────────

const R = 56;
const SIZE = 150;
const C = 2 * Math.PI * R;

function ProgressRing({ done, total }: { done: number; total: number }) {
  const pct      = total > 0 ? Math.min(1, done / total) : 0;
  const target   = C * (1 - pct);
  const complete = done >= total && total > 0;
  const [offset,      setOffset]      = useState(C);
  const [displayDone, setDisplayDone] = useState(0);
  const rafRef      = useRef<number>(0);
  const prevDoneRef = useRef(0);

  useEffect(() => {
    const id = setTimeout(() => setOffset(complete ? 0 : target), 60);
    return () => clearTimeout(id);
  }, [target, complete]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplayDone(done);
      prevDoneRef.current = done;
      return;
    }
    cancelAnimationFrame(rafRef.current);
    const startVal = prevDoneRef.current;
    const endVal   = done;
    const dur      = 420; // --dur-slow
    const t0       = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      setDisplayDone(Math.round(startVal + e * (endVal - startVal)));
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
      else prevDoneRef.current = endVal;
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [done]);

  return (
    <div style={{ position: "relative", width: SIZE, height: SIZE, flexShrink: 0 }}>
      {/* Glow ambiental */}
      <div style={{
        position: "absolute", inset: -24,
        background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)",
        opacity: 0.14, filter: "blur(18px)", borderRadius: "50%", pointerEvents: "none",
      }} />

      <svg width={SIZE} height={SIZE} style={{ transform: "rotate(-90deg)", display: "block" }}>
        <defs>
          <linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   style={{ stopColor: "var(--ring-from)" }} />
            <stop offset="100%" style={{ stopColor: "var(--ring-to)" }} />
          </linearGradient>
        </defs>
        {/* Track */}
        <circle cx={SIZE / 2} cy={SIZE / 2} r={R}
          fill="none" stroke="var(--border)" strokeWidth={10} />
        {/* Progress */}
        {(pct > 0 || complete) && (
          <circle cx={SIZE / 2} cy={SIZE / 2} r={R}
            fill="none" stroke="url(#rg)" strokeWidth={10} strokeLinecap="round"
            strokeDasharray={C} strokeDashoffset={offset}
            className="ring-progress"
            style={{ filter: "drop-shadow(0 0 5px var(--accent))" }}
          />
        )}
      </svg>

      {/* Centro */}
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: 2,
      }}>
        {complete ? (
          <span style={{ color: "var(--accent)" }}><Check size={30} strokeWidth={3} /></span>
        ) : (
          <>
            <span style={{
              fontSize: 26, fontWeight: 800, fontVariantNumeric: "tabular-nums",
              letterSpacing: "-.03em", lineHeight: 1, color: "var(--fg)",
            }}>
              {displayDone}/{total}
            </span>
            <span className="t-label" style={{ fontSize: 10 }}>sesiones</span>
          </>
        )}
      </div>
    </div>
  );
}

// ── Bento tile ────────────────────────────────────────────────────────────────

function BentoTile({ label, children, animClass }: {
  label: string; children: React.ReactNode; animClass?: string;
}) {
  return (
    <div className={`bento-tile ${animClass ?? ""}`.trim()}>
      <span className="t-label">{label}</span>
      {children}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  Home
// ══════════════════════════════════════════════════════════════════════════════

export function Home() {
  const navigate             = useNavigate();
  const { memberId }         = useAuth();
  const { tema, modoEfectivo } = useTheme();

  const [programa,  setPrograma]  = useState<Programa | null>(null);
  const [proxima,   setProxima]   = useState<ProximaSesionResult | null | undefined>(undefined);
  const [hoy,       setHoy]       = useState<SesionDeHoyResult | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [color,     setColor]     = useState<string | undefined>(undefined);
  const [layout,    setLayout]    = useState<HomeLayout>("aurora");

  const [sesHechas,  setSesHechas]  = useState(0);
  const [sesObj,     setSesObj]     = useState(0);
  const [volumen,    setVolumen]    = useState(0);
  /** Todas las sesiones de la app: la serie de adherencia se deriva de acá. */
  const [historial,  setHistorial]  = useState<Historial[]>([]);
  /** Override de la meta declarado en el perfil (P77a). `null` = manda el plan. */
  const [metaPerfil, setMetaPerfil] = useState<number | null>(null);
  const [numSemana,  setNumSemana]  = useState<number | null>(null);
  const [lastMed,    setLastMed]    = useState<MedicionCorporal | null>(null);
  const [prevMed,    setPrevMed]    = useState<MedicionCorporal | null>(null);
  const [recomendacion, setRecomendacion] = useState<Recomendacion | null>(null);
  const [senalesSalud, setSenalesSalud] = useState<SenalSalud[]>([]);
  const [recDescartada, setRecDescartada] = useState(false);
  /** Sesiones de la app de esta semana: adherencia, próxima sesión y sesión de hoy. */
  const [estaSemana, setEstaSemana] = useState<Historial[]>([]);
  /**
   * Los días con actividad de esta semana, con su origen y sus minutos. Los
   * chips cuentan todo (P74); la racha y la adherencia, solo ShapeUp.
   */
  const [diasActivos, setDiasActivos] = useState<DiaActivo[]>([]);

  const semanaRef = useRef(lunesDeSemana());

  // Sesiones guardadas en el teléfono que faltan subir (P69).
  const pendientes = usePendientes();

  // Conciliación de pendientes: una vez por montaje, solo con señal, sin bloquear.
  useEffect(() => {
    if (!navigator.onLine) return;
    void conciliarPendientes();
  }, []);

  // Barrido de sesiones huérfanas: una vez por carga de la app, solo con señal.
  useEffect(() => {
    if (!memberId || barridoHuerfanasHecho || !navigator.onLine) return;
    barridoHuerfanasHecho = true;
    void barrerSesionesHuerfanas(memberId as MiembroId).then((r) => {
      if (r.ok) console.info(`Barrido de sesiones huérfanas: ${r.value} borrada(s).`);
      else console.warn("Barrido de sesiones huérfanas:", r.error);
    });
  }, [memberId]);

  useEffect(() => {
    if (!memberId) return;
    setLayout(getHomeLayout(memberId));
    getPerfiles().then((r) => {
      if (!r.ok) return;
      const perfil = r.value[memberId as MiembroId];
      setColor(perfil?.color);
      // El override de la meta vive en el perfil, que ya se estaba leyendo y
      // además cachea en memoria: esto no agrega una lectura (P77a).
      setMetaPerfil(perfil?.metaSemanalDias ?? null);
    });

    // Verificar descarte del día (localStorage)
    const dismissKey = `rec-descartada-${memberId}-${ymdLocal()}`;
    if (localStorage.getItem(dismissKey) === "1") setRecDescartada(true);

    const semanaInicio = semanaRef.current;
    // Cargamos salud solo si el miembro tiene datos importados (evitar 2 queries vacías por visita)
    const loadSalud = sessionStorage.getItem(`su-${memberId}`) !== "0";

    // Los chips de la semana cuentan TODO (P74), pero la adherencia solo lo
    // entrenado en la app: por eso son dos consultas y no una que traiga todo.
    //
    // **Solo la semana en curso** (P77b). P77a había ampliado esto a 12
    // semanas para la serie de adherencia, y eran ~300 lecturas de /cardio por
    // visita a la pantalla de aterrizaje. No hacen falta: la racha, el récord y
    // la tasa dependen solo de `diasPlan`, que sale del historial de ShapeUp
    // que Home ya trae entero. El movimiento se usa para el sufijo de ESTA
    // semana y nada más; las 12 semanas viven en Progreso.
    const domingo = ymdLocal(new Date(new Date(semanaInicio + "T00:00:00").getTime() + 6 * 86_400_000));
    getDiasActivos(memberId as MiembroId, semanaInicio, domingo).then((r) => {
      if (r.ok) setDiasActivos(r.value.dias);
    });

    Promise.all([
      getProgramaActivo(memberId as MiembroId),
      getHistorialShapeUp(memberId as MiembroId),
      getMediciones(memberId as MiembroId),
      loadSalud
        ? getMetricasSalud(memberId as MiembroId)
        : Promise.resolve({ ok: true as const, value: [] as MetricaSalud[] }),
      loadSalud
        ? getRegistrosSueno(memberId as MiembroId)
        : Promise.resolve({ ok: true as const, value: [] as RegistroSueno[] }),
    ]).then(([progR, histR, medR, metR, sueR]) => {
      if (histR.ok) {
        const hist = histR.value;
        // `hist` ya viene solo con sesiones de la app (P75b), así que no hace
        // falta volver a filtrar por tipo acá.
        const estaShapeUp = hist.filter((h) => h.semanaInicio === semanaInicio);

        const prog = progR.ok ? progR.value : null;
        const obj  = prog ? prog.dias.filter((d) => d.tipo !== "descanso").length : 0;

        setSesHechas(estaShapeUp.length);
        setEstaSemana(estaShapeUp);
        setHistorial(hist);
        setSesObj(obj);
        setVolumen(estaShapeUp.reduce((s, h) => s + (h.tonelajeKg ?? 0), 0));

        // Número de semana del plan: se cuenta desde la primera semana entrenada
        // en la app, no desde la primera caminata importada (P74).
        const semanas = [...new Set(hist.map((h) => h.semanaInicio).filter((s): s is string => !!s))].sort();
        if (semanas.length > 0) {
          const diff = new Date(semanaInicio + "T12:00:00").getTime() - new Date(semanas[0] + "T12:00:00").getTime();
          setNumSemana(Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1);
        }

        if (prog) {
          setPrograma(prog);
          setProxima(proximaSesion(prog, estaShapeUp));
          const hoyNum = jsDayToNum(new Date().getDay());
          const sesHoy = sesionDeHoy(prog, hoyNum, estaShapeUp);
          setHoy(sesHoy);
        } else {
          setProxima(null);
          setHoy(null);
        }

        // Motor de recomendaciones (usa historial ya cargado)
        const metricas  = metR.ok ? metR.value : [];
        const sueno     = sueR.ok ? sueR.value : [];
        const mediciones = medR.ok ? medR.value : [];
        const tieneDatos = metricas.length > 0 || sueno.length > 0;
        // Solo cachear "sin datos" si ambas queries realmente resolvieron — un
        // error de carga nunca debe quedar guardado como "este miembro no tiene salud".
        if (loadSalud && metR.ok && sueR.ok) sessionStorage.setItem(`su-${memberId}`, tieneDatos ? "1" : "0");
        if (tieneDatos) {
          const hoy = ymdLocal();
          const senales = calcularResumenSalud(metricas, sueno, mediciones, hoy);
          setSenalesSalud(senales);
          const rec = calcularRecomendacion(senales, hist, hoy, memberId as MiembroId);
          setRecomendacion(rec);
        }
      }

      if (medR.ok && medR.value.length > 0) {
        setLastMed(medR.value[0]);
        setPrevMed(medR.value[1] ?? null);
      }

      setLoading(false);
    });
  }, [memberId]);

  const primerNombre  = memberId ? PRIMER_NOMBRE[memberId as MiembroId] : "";

  function descartar() {
    if (memberId) localStorage.setItem(`rec-descartada-${memberId}-${ymdLocal()}`, "1");
    setRecDescartada(true);
  }

  function navegarAccion(rec: Recomendacion) {
    if (rec.accionSugerida?.idRutina)   navigate(`/biblioteca/${rec.accionSugerida.idRutina}`);
    else if (rec.accionSugerida?.idPrograma) navigate(`/programa/${rec.accionSugerida.idPrograma}`);
  }

  // ── Adherencia (P77a, sin cuota desde P77b) ───────────────────────────────
  // Todo derivado, nada guardado (ADR #037), y **cero lecturas nuevas**: la
  // serie entera se arma con el historial de ShapeUp que Home ya tiene, más los
  // días de ESTA semana para el sufijo de movimiento. Las semanas anteriores
  // quedan con `diasMovimiento: null` — no se sabe, y no se inventa un cero.
  const meta = metaSemanal(programa, metaPerfil != null ? { metaSemanalDias: metaPerfil } : undefined);
  const serie = (() => {
    if (meta == null) return [];
    const estaSemanaFechas = new Set(diasActivos.map((d) => d.fecha));
    const viejos = agruparDiasActivos(historial.filter((h) => !estaSemanaFechas.has(h.fechaRealizada)));
    const domingo = ymdLocal(new Date(new Date(semanaRef.current + "T00:00:00").getTime() + 6 * 86_400_000));
    return seriesDeAdherencia(
      [...viejos, ...diasActivos], meta, ymdLocal(),
      { desde: semanaRef.current, hasta: domingo },
    );
  })();
  const racha = rachaActual(serie);
  const record = rachaRecord(serie);
  const tasa = tasaCumplimiento(serie);
  const semanaActual = semanaEnCurso(serie);

  /**
   * Hoy toca entrenar pero el día del plan no tiene rutina cargada (P77a).
   * Se dice; no se navega a `/entrenar/` con un id vacío.
   */
  const diaSinRutina = hoy?.tipo === "dia-sin-rutina" ? hoy.etiqueta : null;

  const recVisible = !recDescartada && recomendacion !== null ? recomendacion : null;
  const estadoDiario = seleccionarEstadoDiario(senalesSalud, recVisible !== null);
  const semanaCompleta = proxima === null && sesObj > 0;

  const subtitulo = semanaCompleta
    ? "¡Semana completa!"
    : sesObj > 0
    ? numSemana != null
      ? `Semana ${numSemana} · ${sesHechas} de ${sesObj} sesiones`
      : `${sesHechas} de ${sesObj} sesiones esta semana`
    : null;

  const pesoDelta = lastMed?.pesoKg != null && prevMed?.pesoKg != null
    ? lastMed.pesoKg - prevMed.pesoKg
    : null;
  const hasPeso   = lastMed?.pesoKg != null;

  // ── Helpers de sesión resueltos ──────────────────────────────────────────────
  const sesionNombre = hoy?.tipo === "rutina"
    ? hoy.etiqueta.replace(/^[^—–]*[—–]\s*/, "")
    : proxima?.dia
    ? (proxima.dia.etiqueta.replace(/^[^—–]*[—–]\s*/, ""))
    : null;

  const sesionRutinaId = hoy?.tipo === "rutina"
    ? hoy.idRutina
    : proxima?.dia.idRutina ?? null;

  const canStart = hoy?.tipo === "rutina" ? !hoy.yaHecha : !!proxima?.dia.idRutina;

  // ── Pulse / Premium layouts (P53 — home-redux) ───────────────────────────
  if (!loading && (layout === "pulse" || layout === "premium")) {
    const direccion = layout === "pulse" ? "pulse" as const : "premium" as const;
    const nombreDiaHoy = DIAS_LARGOS[jsDayToNum(new Date().getDay())];
    const heroIcon = semanaCompleta ? Check : hoy?.tipo === "descanso" ? Moon : sesionNombre ? Zap : Moon;
    const heroTag = semanaCompleta
      ? "Esta semana"
      : diaSinRutina
      ? `Hoy · ${nombreDiaHoy}`
      : hoy?.tipo === "descanso"
      ? `Hoy · ${nombreDiaHoy}`
      : hoy?.tipo === "rutina"
      ? (hoy.yaHecha ? "Ya entrenaste hoy" : "Hoy toca")
      : proxima
      ? `Próxima sesión · Día ${proxima.indice} de ${proxima.total}`
      : "Sin programa";
    const heroTitle = semanaCompleta
      ? "¡Semana completa!"
      : diaSinRutina
      ? `Tocaba ${diaSinRutina.replace(/^[^—–]*[—–]\s*/, "")}`
      : hoy?.tipo === "descanso"
      ? "Día de descanso"
      : sesionNombre ?? "No hay un programa activo";
    const heroMsg = semanaCompleta
      ? "Descansá o elegí otra rutina para seguir."
      : diaSinRutina
      ? "Ese día del plan no tiene una rutina cargada."
      : hoy?.tipo === "descanso"
      ? "Recuperá. La recuperación también es parte del entrenamiento."
      : !sesionNombre
      ? "Elegí un programa en Biblioteca."
      : undefined;
    const heroButtons: HomeReduxButton[] = semanaCompleta
      ? [{ label: "Elegir otra rutina", variant: "secondary", onClick: () => navigate("/entrenar") }]
      : diaSinRutina
      ? [{ label: "Elegir una rutina", variant: "secondary", onClick: () => navigate("/entrenar") }]
      : hoy?.tipo === "descanso"
      ? [{ label: "Entrenar igual", variant: "secondary", onClick: () => navigate("/entrenar") }]
      : sesionNombre
      ? (canStart ? [{ label: "Empezar", variant: "primary", icon: Zap, onClick: () => sesionRutinaId && navigate(`/entrenar/${sesionRutinaId}`) }] : [])
      : [{ label: "Ver programas", variant: "secondary", onClick: () => navigate("/biblioteca") }];

    const data: HomeReduxData = {
      primerNombre,
      avatarIniciales: iniciales(primerNombre),
      sesHechas,
      sesObj: sesObj > 0 ? sesObj : 1,
      diaLabel: semanaCompleta
        ? "¡Semana completa!"
        : sesObj > 0
        ? `Día ${sesHechas} de ${sesObj} · esta semana`
        : "Sin programa activo",
      hero: { icon: heroIcon, tag: heroTag, title: heroTitle, message: heroMsg, buttons: heroButtons },
      metrics: {
        volumen: volumen > 0 ? fmtKg(volumen) : "—",
        volumenSub: "kg semana",
        peso: hasPeso ? {
          valor: `${lastMed!.pesoKg}`,
          delta: pesoDelta !== null ? `${pesoDelta > 0 ? "+" : ""}${pesoDelta.toFixed(1)} kg` : null,
          deltaFavorable: pesoDelta !== null && pesoDelta < 0,
        } : null,
        racha,
      },
      weekLabel: "Tu semana",
      weekChips: calcularWeekChips(diasActivos, semanaRef.current, ymdLocal()),
      adherencia: meta != null ? {
        hechos: semanaActual?.diasPlan ?? 0,
        meta,
        movimiento: semanaActual?.diasMovimiento ?? null,
        racha, record, tasa,
      } : null,
    };

    return (
      <div className={`page ${direccion === "pulse" ? "dir-a" : "dir-c v21"}`} data-mode={modoEfectivo} data-accent={tema}>
        <PendientesChip pendientes={pendientes} />
        {recVisible && (
          <RecCard rec={recVisible} onDescartar={descartar} onVerRutina={() => navegarAccion(recVisible)} />
        )}
        <EstadoDiarioLinea estado={estadoDiario} onClick={() => navigate("/salud")} />
        <HomeReduxContent direccion={direccion} data={data} onAvatarClick={() => navigate("/perfil")} />
      </div>
    );
  }

  // ── Stadium layout ────────────────────────────────────────────────────────
  if (!loading && layout === "stadium") {
    return (
      <div className="page">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, color: "var(--accent)" }}>
            <ShapeUpMark size={24} /><ShapeUpWordmark size={16} />
          </div>
          {memberId && (
            <button onClick={() => navigate("/perfil")} style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}>
              <MemberAvatar memberId={memberId as MiembroId} color={color} size={32} />
            </button>
          )}
        </div>

        <PendientesChip pendientes={pendientes} />
        {recVisible && (
          <RecCard rec={recVisible} onDescartar={descartar} onVerRutina={() => navegarAccion(recVisible)} />
        )}
        <EstadoDiarioLinea estado={estadoDiario} onClick={() => navigate("/salud")} />

        {/* Hero Stadium */}
        <div className="stadium-hero">
          <div className="stadium-glow" />
          {semanaCompleta ? (
            <div style={{ textAlign: "center", position: "relative" }}>
              <p style={{ fontSize: 22, margin: "0 0 6px" }}>🎉</p>
              <h1 className="stadium-title">¡Semana completa!</h1>
              <button className="btn-secondary" style={{ marginTop: 12 }} onClick={() => navigate("/entrenar")}>
                Elegir otra rutina
              </button>
            </div>
          ) : diaSinRutina ? (
            <>
              <p className="stadium-kicker">Hoy</p>
              <h1 className="stadium-title">{diaSinRutina.replace(/^[^—–]*[—–]\s*/, "")}</h1>
              <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--muted)" }}>
                No tiene rutina cargada.{" "}
                <button
                  onClick={() => navigate("/entrenar")}
                  style={{ background: "none", border: "none", padding: 0, cursor: "pointer",
                           color: "var(--accent)", font: "inherit", fontWeight: 600 }}
                >
                  Elegí una
                </button>
              </p>
            </>
          ) : hoy?.tipo === "descanso" ? (
            <div style={{ textAlign: "center", position: "relative" }}>
              <Moon size={32} color="var(--muted)" strokeWidth={1.5} style={{ marginBottom: 8 }} />
              <h1 className="stadium-title" style={{ fontSize: 24 }}>Día de descanso</h1>
              <p style={{ color: "var(--muted)", fontSize: 13, margin: "4px 0 12px" }}>
                Recuperá. Es parte del entrenamiento.
              </p>
              <button className="btn-secondary" onClick={() => navigate("/entrenar")}>Entrenar igual</button>
            </div>
          ) : sesionNombre ? (
            <div style={{ position: "relative", width: "100%" }}>
              <p className="t-label" style={{ margin: "0 0 8px" }}>
                {hoy?.tipo === "rutina" ? "Hoy toca" : "Próxima sesión"}
              </p>
              <h1 className="stadium-title">{sesionNombre}</h1>
              {canStart && (
                <button
                  className="btn-primary"
                  style={{ width: "100%", marginTop: 16 }}
                  onClick={() => sesionRutinaId && navigate(`/entrenar/${sesionRutinaId}`)}
                >
                  <Zap size={18} /> Empezar ahora
                </button>
              )}
            </div>
          ) : (
            <p style={{ color: "var(--muted)", textAlign: "center" }}>Sin programa activo</p>
          )}
        </div>

        {/* Stats strip horizontal */}
        <div className="stadium-stats">
          <div className="stadium-stat">
            <Flame size={14} fill="var(--accent)" strokeWidth={0} color="var(--accent)" />
            <span className="stadium-stat-value">{racha > 0 ? racha : "—"}</span>
            <span className="stadium-stat-label">racha</span>
          </div>
          <div className="stadium-stat">
            <span className="stadium-stat-value">{volumen > 0 ? fmtKg(volumen) : "—"}</span>
            <span className="stadium-stat-label">kg vol.</span>
          </div>
          <div className="stadium-stat">
            {/* Días, no sesiones (P77a): dos sesiones el mismo día son un día. */}
            <span className="stadium-stat-value">
              {semanaActual?.diasPlan ?? 0}/{meta ?? "—"}
            </span>
            <span className="stadium-stat-label">días</span>
          </div>
          {hasPeso && (
            <div className="stadium-stat">
              <span className="stadium-stat-value">{lastMed!.pesoKg}</span>
              <span className="stadium-stat-label">kg peso</span>
            </div>
          )}
        </div>

        {programa && (
          <div className="card" style={{ padding: "14px 16px" }}>
            <WeekStrip semanaInicio={semanaRef.current} marcados={diasEntrenamiento(programa)} />
          </div>
        )}
      </div>
    );
  }

  // ── Clásico layout ────────────────────────────────────────────────────────
  if (!loading && layout === "clasico") {
    const pct = sesObj > 0 ? Math.round((sesHechas / sesObj) * 100) : 0;
    return (
      <div className="page">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, color: "var(--accent)" }}>
            <ShapeUpMark size={24} /><ShapeUpWordmark size={16} />
          </div>
          {memberId && (
            <button onClick={() => navigate("/perfil")} style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}>
              <MemberAvatar memberId={memberId as MiembroId} color={color} size={32} />
            </button>
          )}
        </div>

        <h1 style={{ margin: "4px 0 0", fontSize: 26, fontWeight: 800, letterSpacing: "-.02em" }}>
          Dale, {primerNombre}<span style={{ color: "var(--accent)" }}>.</span>
        </h1>

        <PendientesChip pendientes={pendientes} />
        {recVisible && (
          <RecCard rec={recVisible} onDescartar={descartar} onVerRutina={() => navegarAccion(recVisible)} />
        )}
        <EstadoDiarioLinea estado={estadoDiario} onClick={() => navigate("/salud")} />

        {programa && (
          <div className="card" style={{ padding: "14px 16px" }}>
            <WeekStrip semanaInicio={semanaRef.current} marcados={diasEntrenamiento(programa)} />
          </div>
        )}

        {/* Tu semana — adherencia derivada (P77a) */}
        <AdherenciaCard
          semana={semanaActual} meta={meta} racha={racha} record={record} tasa={tasa}
          diasActivos={diasActivos.filter((d) => d.fecha >= semanaRef.current).length}
          onElegirPlan={() => navigate("/biblioteca")}
        />
        {volumen > 0 && (
          <div className="card" style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
            <span className="section-title">Volumen</span>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 18, fontWeight: 800 }}>{fmtKg(volumen)}</div>
              <div className="t-label">kg esta sem.</div>
            </div>
          </div>
        )}

        {/* Hoy toca */}
        {diaSinRutina && (
          <div className="card">
            <p className="t-label" style={{ margin: "0 0 4px" }}>Hoy</p>
            <p style={{ margin: "0 0 6px", fontWeight: 800, fontSize: 20, letterSpacing: "-.01em" }}>
              {diaSinRutina.replace(/^[^—–]*[—–]\s*/, "")}
            </p>
            <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
              Ese día del plan no tiene una rutina cargada.
            </p>
            <button className="btn-secondary" style={{ marginTop: 10, width: "100%" }}
              onClick={() => navigate("/entrenar")}>
              Elegir una rutina
            </button>
          </div>
        )}
        {!diaSinRutina && (sesionNombre || semanaCompleta) && (
          <div className="card">
            {semanaCompleta ? (
              <div style={{ textAlign: "center" }}>
                <p style={{ margin: 0, fontWeight: 700 }}>🎉 ¡Semana completa!</p>
                <button className="btn-secondary" style={{ marginTop: 10 }} onClick={() => navigate("/entrenar")}>Elegir otra rutina</button>
              </div>
            ) : hoy?.tipo === "descanso" ? (
              <div style={{ textAlign: "center" }}>
                <Moon size={22} color="var(--muted)" strokeWidth={1.5} style={{ marginBottom: 6 }} />
                <p style={{ margin: 0, fontWeight: 700 }}>Día de descanso</p>
              </div>
            ) : sesionNombre ? (
              <>
                <p className="t-label" style={{ margin: "0 0 4px" }}>Hoy toca</p>
                <p style={{ margin: "0 0 10px", fontWeight: 800, fontSize: 20, letterSpacing: "-.01em" }}>{sesionNombre}</p>
                {canStart && (
                  <button className="btn-primary" style={{ width: "100%" }}
                    onClick={() => sesionRutinaId && navigate(`/entrenar/${sesionRutinaId}`)}>
                    <Zap size={18} /> Empezar
                  </button>
                )}
              </>
            ) : null}
          </div>
        )}
      </div>
    );
  }

  // ── Aurora layout (default) ───────────────────────────────────────────────
  return (
    <div className="page">

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, color: "var(--accent)" }}>
          <ShapeUpMark size={24} />
          <ShapeUpWordmark size={16} />
        </div>
        {memberId && (
          <button onClick={() => navigate("/perfil")}
            style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}>
            <MemberAvatar memberId={memberId as MiembroId} color={color} size={32} />
          </button>
        )}
      </div>

      {/* ── Saludo ──────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: -4 }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: "-.02em", lineHeight: 1.1 }}>
          Dale, {primerNombre}<span style={{ color: "var(--accent)" }}>.</span>
        </h1>
        {subtitulo && (
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--muted)" }}>{subtitulo}</p>
        )}
      </div>

      {loading && (
        <div className="loading-screen" style={{ minHeight: 120 }}><div className="spinner" /></div>
      )}

      <PendientesChip pendientes={pendientes} />
      {!loading && recVisible && (
        <RecCard rec={recVisible} onDescartar={descartar} onVerRutina={() => navegarAccion(recVisible)} />
      )}
      {!loading && <EstadoDiarioLinea estado={estadoDiario} onClick={() => navigate("/salud")} />}

      {/* ── Hero Aurora ─────────────────────────────────────────────────── */}
      {!loading && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, position: "relative" }}>
          {/* Glow de fondo */}
          <div style={{
            position: "absolute", top: -20, left: "50%", transform: "translateX(-50%)",
            width: 280, height: 180,
            background: "radial-gradient(ellipse, var(--accent) 0%, transparent 70%)",
            opacity: 0.08, filter: "blur(24px)", pointerEvents: "none",
          }} />

          {/* Anillo */}
          <ProgressRing done={sesHechas} total={sesObj > 0 ? sesObj : 1} />

          {/* Glass card — hoy toca / próxima sesión */}
          <div
            className={`glass-card aurora-anim aurora-anim-1`}
            style={{ width: "100%", maxWidth: 360, cursor: programa ? "pointer" : "default" }}
            onClick={() => programa && navigate(`/programa/${programa.idPrograma}`)}
          >
            {semanaCompleta ? (
              <div style={{ textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: 20 }}>🎉</p>
                <p style={{ margin: "6px 0 4px", fontWeight: 700, fontSize: 16 }}>¡Semana completa!</p>
                <p style={{ margin: "0 0 12px", color: "var(--muted)", fontSize: 13 }}>
                  Descansá o elegí otra rutina para seguir.
                </p>
                <button className="btn-secondary" onClick={(e) => { e.stopPropagation(); navigate("/entrenar"); }}>
                  Elegir otra rutina
                </button>
              </div>
            ) : hoy?.tipo === "descanso" ? (
              <div style={{ textAlign: "center" }}>
                <Moon size={28} color="var(--muted)" strokeWidth={1.5} style={{ marginBottom: 8 }} />
                <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: 16 }}>Día de descanso</p>
                <p style={{ margin: "0 0 12px", color: "var(--muted)", fontSize: 13 }}>
                  Recuperá. La recuperación es parte del entrenamiento.
                </p>
                <button
                  className="btn-secondary"
                  onClick={(e) => { e.stopPropagation(); navigate("/entrenar"); }}
                >
                  Entrenar igual
                </button>
              </div>
            ) : diaSinRutina ? (
              <div style={{ textAlign: "center" }}>
                <p className="t-label" style={{ margin: "0 0 6px" }}>Hoy</p>
                <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: 16 }}>
                  {diaSinRutina.replace(/^[^—–]*[—–]\s*/, "")}
                </p>
                <p style={{ margin: "0 0 12px", color: "var(--muted)", fontSize: 13 }}>
                  Ese día del plan no tiene una rutina cargada.
                </p>
                <button className="btn-secondary" onClick={(e) => { e.stopPropagation(); navigate("/entrenar"); }}>
                  Elegir una rutina
                </button>
              </div>
            ) : hoy?.tipo === "rutina" ? (
              <>
                <p className="t-label" style={{ margin: "0 0 6px" }}>
                  {hoy.yaHecha ? "Ya entrenaste hoy" : "Hoy toca"}
                </p>
                <p style={{ margin: "0 0 8px", fontWeight: 800, fontSize: 18, letterSpacing: "-.01em" }}>
                  {hoy.etiqueta.replace(/^[^—–]*[—–]\s*/, "")}
                </p>
                {!hoy.yaHecha && (
                  <button
                    className="btn-primary"
                    onClick={(e) => { e.stopPropagation(); navigate(`/entrenar/${hoy.idRutina}`); }}
                  >
                    <Zap size={18} /> Empezar
                  </button>
                )}
              </>
            ) : proxima ? (
              <>
                <p className="t-label" style={{ margin: "0 0 6px" }}>
                  Próxima sesión · Día {proxima.indice} de {proxima.total}
                </p>
                <p style={{ margin: "0 0 8px", fontWeight: 800, fontSize: 18, letterSpacing: "-.01em" }}>
                  {proxima.dia.idRutina
                    ? proxima.dia.etiqueta.replace(/^[^—–]*[—–]\s*/, "")
                    : proxima.dia.etiqueta}
                </p>
                {proxima.dia.diaSemana && (
                  <p style={{ margin: "0 0 12px", fontSize: 12, color: "var(--muted)" }}>
                    Planificado: {proxima.dia.diaSemana}
                  </p>
                )}
                <button
                  className="btn-primary"
                  onClick={(e) => { e.stopPropagation(); proxima.dia.idRutina && navigate(`/entrenar/${proxima.dia.idRutina}`); }}
                  disabled={!proxima.dia.idRutina}
                >
                  <Zap size={18} /> Empezar
                </button>
              </>
            ) : (
              <div style={{ textAlign: "center" }}>
                <p style={{ margin: "0 0 12px", color: "var(--muted)", fontSize: 14 }}>
                  No hay un programa activo. Elegí uno en Biblioteca.
                </p>
                <button className="btn-secondary" onClick={(e) => { e.stopPropagation(); navigate("/biblioteca"); }}>
                  Ver programas
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Bento row ───────────────────────────────────────────────────── */}
      {!loading && sesObj > 0 && (
        <div className={`bento-row ${hasPeso ? "bento-row-3" : "bento-row-2"}`}>
          {/* Volumen */}
          <BentoTile label="Volumen" animClass="aurora-anim aurora-anim-2">
            <span className="bento-value">{volumen > 0 ? fmtKg(volumen) : "—"}</span>
            <span style={{ fontSize: 11, color: "var(--muted)" }}>kg esta sem.</span>
          </BentoTile>

          {/* Peso — solo si hay medición */}
          {hasPeso && (
            <BentoTile label="Peso" animClass="aurora-anim aurora-anim-3">
              <span className="bento-value">{lastMed!.pesoKg} kg</span>
              {pesoDelta !== null && (
                <span className="bento-delta" style={{
                  color: pesoDelta < 0 ? "var(--accent)" : pesoDelta > 0 ? "var(--danger)" : "var(--muted)",
                }}>
                  {pesoDelta > 0 ? "+" : ""}{pesoDelta.toFixed(1)} kg
                </span>
              )}
            </BentoTile>
          )}

          {/* Racha */}
          <BentoTile label="Racha" animClass={`aurora-anim ${hasPeso ? "aurora-anim-4" : "aurora-anim-3"}`}>
            <span className="bento-value" style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {racha > 0
                ? <><Flame size={18} fill="var(--accent)" strokeWidth={0} style={{ flexShrink: 0 }} /> {racha}</>
                : "—"}
            </span>
            {racha > 0 && (
              <span style={{ fontSize: 11, color: "var(--muted)" }}>{racha === 1 ? "sem" : "sems"}</span>
            )}
          </BentoTile>
        </div>
      )}

      {/* ── Adherencia de la semana (P77a) ──────────────────────────────── */}
      {!loading && (
        <AdherenciaCard
          semana={semanaActual} meta={meta} racha={racha} record={record} tasa={tasa}
          diasActivos={diasActivos.filter((d) => d.fecha >= semanaRef.current).length}
          onElegirPlan={() => navigate("/biblioteca")}
        />
      )}

      {/* ── Vista semanal del programa activo (Aurora) ──────────────────── */}
      {!loading && programa && (
        <div
          className="card"
          style={{ padding: "14px 16px", cursor: "pointer" }}
          onClick={() => navigate(`/programa/${programa.idPrograma}`)}
        >
          <p className="t-label" style={{ marginBottom: 10 }}>
            {programa.nombre} · {programa.dias.filter((d) => d.tipo !== "descanso").length} días/sem
          </p>
          <VistaSemanal
            dias={programa.dias}
            hoy={jsDayToNum(new Date().getDay())}
          />
        </div>
      )}
    </div>
  );
}
