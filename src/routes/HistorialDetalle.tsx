import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import type { Historial, RegistroSueno, MetricaSalud, MiembroId } from "../types/models";
import { getHistorialEntry } from "../data/historial";
import { getRegistrosSueno, getMetricasSalud } from "../data/salud";

function formatFecha(s: string): string {
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
}

function diaAnterior(fecha: string): string {
  const d = new Date(fecha + "T12:00:00");
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function HistorialDetalle() {
  const { id }     = useParams<{ id: string }>();
  const navigate   = useNavigate();
  const [h, setH]  = useState<Historial | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [suenoAnterior, setSuenoAnterior] = useState<RegistroSueno | null>(null);
  const [fcDia,         setFcDia]         = useState<MetricaSalud | null>(null);

  useEffect(() => {
    if (!id) return;
    getHistorialEntry(id).then(async (r) => {
      if (!r.ok) { setError(r.error); setLoading(false); return; }
      setH(r.value);
      setLoading(false);

      // Carga contexto del día: sueño noche anterior + FC en reposo del día
      const entry = r.value;
      const noche = diaAnterior(entry.fechaRealizada);
      const [sRes, fRes] = await Promise.all([
        getRegistrosSueno(entry.miembro as MiembroId),
        getMetricasSalud(entry.miembro as MiembroId, "fc-reposo"),
      ]);
      if (sRes.ok) {
        const reg = sRes.value.find((s) => s.fecha === noche && s.horas != null && s.horas > 0);
        if (reg) setSuenoAnterior(reg);
      }
      if (fRes.ok) {
        const met = fRes.value.find((m) => m.fecha === entry.fechaRealizada);
        if (met) setFcDia(met);
      }
    });
  }, [id]);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (error)   return <p className="inline-error" style={{ margin: 16 }}>{error}</p>;
  if (!h)      return null;

  return (
    <div className="page">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Historial
        </button>
      </div>

      {/* Título + fecha */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: "-.01em" }}>
            {h.nombreRutina}
          </h1>
          {h.tipo === "libre" && (
            <span className="badge badge-muted">Libre</span>
          )}
        </div>
        <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
          {formatFecha(h.fechaRealizada)}
        </p>
      </div>

      {/* Stats */}
      <div className="card">
        <div className="stats-row" style={{ flexWrap: "wrap", gap: 20 }}>
          {h.duracionRealMin != null && (
            <div className="stat">
              <span className="stat-value">{h.duracionRealMin}</span>
              <span className="stat-label">minutos</span>
            </div>
          )}
          {h.totalSeriesHechas != null && (
            <div className="stat">
              <span className="stat-value">{h.totalSeriesHechas}</span>
              <span className="stat-label">series</span>
            </div>
          )}
          {h.tonelajeKg != null && h.tonelajeKg > 0 && (
            <div className="stat">
              <span className="stat-value">{h.tonelajeKg.toLocaleString("es")}</span>
              <span className="stat-label">kg tonelaje</span>
            </div>
          )}
          {h.rpe != null && (
            <div className="stat">
              <span className="stat-value">{h.rpe}</span>
              <span className="stat-label">RPE</span>
            </div>
          )}
        </div>
      </div>

      {/* Series registradas por bloque */}
      <div className="card">
        <p className="section-title" style={{ marginBottom: 12 }}>Series registradas</p>
        {h.bloques.map((b, i) => {
          const completadas = b.series.filter((s) => s.completada);
          const detalle = completadas
            .filter((s) => s.cargaKg != null)
            .map((s) => `${s.reps ?? "?"}×${s.cargaKg}kg`)
            .join(", ");

          return (
            <div key={i} className="bloque-row">
              <span className="bloque-num">{i + 1}</span>
              <div className="bloque-info">
                <p className="bloque-nombre">{b.nombreEjercicio}</p>
                <p className="bloque-prescripcion">
                  {completadas.length}/{b.series.length} series
                  {detalle ? ` · ${detalle}` : ""}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Biometría de Samsung Health */}
      {h.biometria && (
        <div className="card">
          <p className="section-title" style={{ marginBottom: 10 }}>FC Samsung Health</p>
          <div className="stats-row" style={{ flexWrap: "wrap", gap: 16 }}>
            {h.biometria.fcMedia != null && (
              <div className="stat">
                <span className="stat-value">{Math.round(h.biometria.fcMedia)}</span>
                <span className="stat-label">FC media</span>
              </div>
            )}
            {h.biometria.fcMax != null && (
              <div className="stat">
                <span className="stat-value">{h.biometria.fcMax}</span>
                <span className="stat-label">FC máx</span>
              </div>
            )}
            {h.biometria.kcal != null && (
              <div className="stat">
                <span className="stat-value">{h.biometria.kcal}</span>
                <span className="stat-label">kcal</span>
              </div>
            )}
          </div>
          {h.biometria.zonaPrincipal && (
            <div style={{ marginTop: 10 }}>
              <span style={{
                padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600,
                background: `var(--zona-${h.biometria.zonaPrincipal.toLowerCase()}-dim)`,
                color:      `var(--zona-${h.biometria.zonaPrincipal.toLowerCase()})`,
              }}>
                {h.biometria.zonaPrincipal}
              </span>
              <span style={{ fontSize: 11, color: "var(--muted)", marginLeft: 8 }}>
                Match por: {h.biometria.matchPor} · {h.biometria.granularidad}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Contexto del día: sueño noche anterior + FC en reposo */}
      {(suenoAnterior || fcDia) && (
        <div className="card">
          <p className="section-title" style={{ marginBottom: 8 }}>Contexto del día</p>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            {suenoAnterior && suenoAnterior.horas != null && (
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 18 }}>
                  {suenoAnterior.horas.toFixed(1)} <span style={{ fontSize: 13, fontWeight: 500, color: "var(--muted)" }}>h</span>
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".05em" }}>
                  sueño noche anterior
                </p>
              </div>
            )}
            {fcDia && (
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 18 }}>
                  {Math.round(fcDia.valor)} <span style={{ fontSize: 13, fontWeight: 500, color: "var(--muted)" }}>bpm</span>
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".05em" }}>
                  FC en reposo
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {h.notas && (
        <div className="card">
          <p className="section-title" style={{ marginBottom: 6 }}>Notas</p>
          <p style={{ margin: 0, fontSize: 14, color: "var(--muted)", lineHeight: 1.5 }}>{h.notas}</p>
        </div>
      )}
    </div>
  );
}
