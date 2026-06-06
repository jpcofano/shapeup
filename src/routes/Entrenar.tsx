import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Zap } from "lucide-react";
import type { Rutina } from "../types/models";
import { getRutinas } from "../data/rutinas";

/** Picker de rutina para iniciar una sesión de entrenamiento. */
export function Entrenar() {
  const navigate = useNavigate();
  const [rutinas, setRutinas]  = useState<Rutina[]>([]);
  const [loading, setLoading]  = useState(true);
  const [error,   setError]    = useState<string | null>(null);

  useEffect(() => {
    getRutinas().then((r) => {
      if (r.ok) setRutinas(r.value);
      else      setError(r.error);
      setLoading(false);
    });
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Entrenar</h1>
      </div>

      {loading && <div className="empty-state"><div className="spinner" /></div>}
      {error   && <p className="inline-error">{error}</p>}

      {!loading && !error && rutinas.length === 0 && (
        <div className="empty-state">
          <p>No hay rutinas. Creá una en Rutinas primero.</p>
        </div>
      )}

      {rutinas.map((r) => (
        <div
          key={r.idRutina}
          className="rutina-card"
          onClick={() => navigate(`/entrenar/${r.idRutina}`)}
        >
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
            <p className="rutina-card-title" style={{ margin: 0 }}>{r.nombre}</p>
            <span style={{ color: "var(--accent)", flexShrink: 0, marginTop: 2 }}>
              <Zap size={16} fill="currentColor" strokeWidth={0} />
            </span>
          </div>
          <div className="rutina-card-meta" style={{ marginTop: 10 }}>
            <span className="badge badge-accent">{r.foco}</span>
            <span className="badge badge-muted">{r.nivel}</span>
            <span className="badge badge-muted">{r.lugar}</span>
            {r.duracionEstimadaMin != null && (
              <span className="badge badge-muted">⏱ {r.duracionEstimadaMin} min</span>
            )}
            {r.totalSeries != null && (
              <span style={{ fontSize: 12, color: "var(--muted)" }}>{r.totalSeries} series</span>
            )}
          </div>
        </div>
      ))}

      {rutinas.length > 0 && (
        <p style={{ fontSize: 12, color: "var(--muted)", textAlign: "center", marginTop: 4 }}>
          Tocá una rutina para empezar
        </p>
      )}
    </div>
  );
}
