import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TabBar } from "../components/TabBar";
import { Trophy } from "lucide-react";
import type { Historial } from "../types/models";
import { getHistorialMiembro } from "../data/historial";
import { useAuth } from "../auth/useAuth";
import { Bicep } from "../components/Bicep";
import { Sparkline } from "../components/Sparkline";

function formatFecha(s: string): string {
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
}

// ── Tab Sesiones ──────────────────────────────────────────────────────────────

function SesionesList({ entries, navigate }: { entries: Historial[]; navigate: (to: string) => void }) {
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
          onClick={() => navigate(`/historial/${h.idHist}`)}
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
        </div>
      ))}
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

  useEffect(() => {
    if (!memberId) return;
    getHistorialMiembro(memberId).then((r) => {
      if (r.ok) setEntries(r.value);
      else      setError(r.error);
      setLoading(false);
    });
  }, [memberId]);

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Historial</h1>
      </div>

      <TabBar tabs={HIST_TABS} active={tab} onChange={setTab} style={{ marginBottom: 8 }} />

      {loading && <div className="empty-state"><div className="spinner" /></div>}
      {error   && <p className="inline-error">{error}</p>}

      {!loading && !error && tab === "sesiones" && (
        <SesionesList entries={entries} navigate={navigate} />
      )}
      {!loading && !error && tab === "progreso" && (
        <ProgresoTab entries={entries} />
      )}
    </div>
  );
}
