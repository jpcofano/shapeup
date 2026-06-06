import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import type { Historial } from "../types/models";
import { getHistorialEntry } from "../data/historial";

function formatFecha(s: string): string {
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
}

export function HistorialDetalle() {
  const { id }     = useParams<{ id: string }>();
  const navigate   = useNavigate();
  const [h, setH]  = useState<Historial | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getHistorialEntry(id).then((r) => {
      if (r.ok) setH(r.value);
      else      setError(r.error);
      setLoading(false);
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
        <h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800, letterSpacing: "-.01em" }}>
          {h.nombreRutina}
        </h1>
        <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
          {formatFecha(h.fechaRealizada)}
        </p>
      </div>

      {/* Stats — valores tabulares */}
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

      {h.notas && (
        <div className="card">
          <p className="section-title" style={{ marginBottom: 6 }}>Notas</p>
          <p style={{ margin: 0, fontSize: 14, color: "var(--muted)", lineHeight: 1.5 }}>{h.notas}</p>
        </div>
      )}
    </div>
  );
}
