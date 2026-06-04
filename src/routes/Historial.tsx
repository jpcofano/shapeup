import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { Historial } from "../types/models";
import { getHistorialMiembro } from "../data/historial";
import { useAuth } from "../auth/useAuth";

function formatFecha(s: string): string {
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
}

export function Historial() {
  const navigate     = useNavigate();
  const { memberId } = useAuth();
  const [entries, setEntries] = useState<Historial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

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

      {loading && <div className="empty-state"><div className="spinner" /></div>}
      {error   && <p className="inline-error">{error}</p>}

      {!loading && !error && entries.length === 0 && (
        <div className="empty-state">
          <p>Todavía no completaste ninguna sesión.</p>
        </div>
      )}

      {entries.map((h) => (
        <div
          key={h.idHist}
          className="rutina-card"
          onClick={() => navigate(`/historial/${h.idHist}`)}
        >
          <p className="rutina-card-title">{h.nombreRutina}</p>
          <div className="rutina-card-meta">
            <span>{formatFecha(h.fechaRealizada)}</span>
            {h.duracionRealMin != null && <span>⏱ {h.duracionRealMin} min</span>}
            {h.totalSeriesHechas != null && <span>· {h.totalSeriesHechas} series</span>}
            {h.tonelajeKg != null && h.tonelajeKg > 0 && (
              <span>· {h.tonelajeKg} kg</span>
            )}
            {h.rpe != null && (
              <span className="badge badge-muted">RPE {h.rpe}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
