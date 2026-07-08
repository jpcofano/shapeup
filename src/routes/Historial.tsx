import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TabBar } from "../components/TabBar";
import { Trophy, Trash2 } from "lucide-react";
import type { Historial } from "../types/models";
import { getHistorialMiembro, borrarSesionHistorial, borrarHistorialMiembro } from "../data/historial";
import { useAuth } from "../auth/useAuth";
import { Bicep } from "../components/Bicep";
import { Sparkline } from "../components/Sparkline";

function formatFecha(s: string): string {
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
}

// ── Tab Sesiones ──────────────────────────────────────────────────────────────

function SesionesList({ entries, navigate, editMode, onDeleteOne }: {
  entries: Historial[];
  navigate: (to: string) => void;
  editMode: boolean;
  onDeleteOne: (idHist: string) => void;
}) {
  if (entries.length === 0) {
    return (
      <div className="empty-state">
        <p>Todavía no completaste ninguna sesión.</p>
      </div>
    );
  }
  return (
    <div className="card-list">
      {entries.map((h) => (
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
      ))}
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

function ProgresoTab({ entries }: { entries: Historial[] }) {
  // Volumen semanal
  const byWeek = new Map<string, number>();
  for (const h of entries) {
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

  // Totales
  const totalSesiones = entries.length;
  const totalMin = entries.reduce((s, h) => s + (h.duracionRealMin ?? 0), 0);
  const totalHoras = (totalMin / 60).toFixed(1);

  // Records personales (PR): max tonelaje por rutina
  const prByRutina = new Map<string, { nombre: string; kg: number; fecha: string }>();
  for (const h of entries) {
    if (!h.idRutina || !h.tonelajeKg || h.tonelajeKg <= 0) continue;
    const cur = prByRutina.get(h.idRutina);
    if (!cur || h.tonelajeKg > cur.kg) {
      prByRutina.set(h.idRutina, { nombre: h.nombreRutina, kg: h.tonelajeKg, fecha: h.fechaRealizada });
    }
  }
  const prs = Array.from(prByRutina.values())
    .sort((a, b) => b.kg - a.kg)
    .slice(0, 5);

  if (entries.length === 0) {
    return (
      <div className="empty-state"><p>Sin sesiones todavía para calcular progreso.</p></div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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

export function Historial() {
  const navigate     = useNavigate();
  const { memberId } = useAuth();
  const [entries, setEntries] = useState<Historial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [tab,     setTab]     = useState<"sesiones" | "progreso">("sesiones");

  const [editMode, setEditMode] = useState(false);
  const [confirm,  setConfirm]  = useState<{ tipo: "uno"; idHist: string } | { tipo: "todo" } | null>(null);
  const [borrando, setBorrando] = useState(false);
  const [errorBorrado, setErrorBorrado] = useState<string | null>(null);

  useEffect(() => {
    if (!memberId) return;
    getHistorialMiembro(memberId).then((r) => {
      if (r.ok) setEntries(r.value);
      else      setError(r.error);
      setLoading(false);
    });
  }, [memberId]);

  async function confirmarBorrado() {
    if (!confirm || !memberId) return;
    setBorrando(true);
    setErrorBorrado(null);

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
        {tab === "sesiones" && entries.length > 0 && (
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
            entries={entries}
            navigate={navigate}
            editMode={editMode}
            onDeleteOne={(idHist) => setConfirm({ tipo: "uno", idHist })}
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
        <ProgresoTab entries={entries} />
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
