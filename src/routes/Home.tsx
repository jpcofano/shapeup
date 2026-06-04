import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Zap } from "lucide-react";
import type { Programa, DiaPrograma, Rutina } from "../types/models";
import { getProgramaActivo } from "../data/programas";
import { getRutina } from "../data/rutinas";
import { useAuth } from "../auth/useAuth";

const DIAS_ES = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"] as const;

function diaHoy(): string {
  return DIAS_ES[new Date().getDay()];
}

function diaDeHoy(programa: Programa): DiaPrograma | null {
  const hoy = diaHoy();
  return programa.dias.find((d) => d.diaSemana === hoy) ?? null;
}

export function Home() {
  const navigate             = useNavigate();
  const { memberId }         = useAuth();
  const [programa, setPrograma] = useState<Programa | null>(null);
  const [dia,      setDia]      = useState<DiaPrograma | null>(null);
  const [rutina,   setRutina]   = useState<Rutina | null>(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    getProgramaActivo().then(async (r) => {
      if (!r.ok || !r.value) { setLoading(false); return; }
      const prog = r.value;
      setPrograma(prog);
      const d = diaDeHoy(prog);
      setDia(d);
      if (d?.tipo === "rutina" && d.idRutina) {
        const rr = await getRutina(d.idRutina);
        if (rr.ok) setRutina(rr.value);
      }
      setLoading(false);
    });
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Inicio</h1>
      </div>

      {loading && <div className="loading-screen" style={{ minHeight: 120 }}><div className="spinner" /></div>}

      {/* Sin programa activo */}
      {!loading && !programa && (
        <div className="card" style={{ textAlign: "center", padding: "32px 20px" }}>
          <p style={{ color: "var(--muted)", fontSize: 14, margin: "0 0 16px" }}>
            No hay un programa activo. Creá uno en Biblioteca para ver qué toca cada día.
          </p>
          <button className="btn-secondary" style={{ maxWidth: 200, margin: "0 auto" }}
            onClick={() => navigate("/biblioteca")}>
            Ver rutinas
          </button>
        </div>
      )}

      {/* Programa activo */}
      {!loading && programa && (
        <>
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <p style={{ margin: 0, fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Programa activo
            </p>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 16 }}>{programa.nombre}</p>
            <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>
              {programa.diasPorSemana} días / semana · {programa.objetivo}
            </p>
          </div>

          {/* Hoy */}
          {!dia && (
            <div className="card" style={{ textAlign: "center", padding: "24px 16px" }}>
              <p style={{ margin: 0, color: "var(--muted)", fontSize: 14 }}>
                Hoy ({diaHoy()}) no hay sesión programada.
              </p>
            </div>
          )}

          {dia?.tipo === "descanso" && (
            <div className="card" style={{ textAlign: "center", padding: "24px 16px" }}>
              <p style={{ margin: 0, fontSize: 22 }}>😴</p>
              <p style={{ margin: "8px 0 0", fontWeight: 700 }}>Día de descanso</p>
              <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: 13 }}>
                Descansá. La recuperación es parte del entrenamiento.
              </p>
            </div>
          )}

          {dia?.tipo === "vr" && (
            <div className="card" style={{ textAlign: "center", padding: "24px 16px" }}>
              <p style={{ margin: 0, fontSize: 22 }}>🥽</p>
              <p style={{ margin: "8px 0 0", fontWeight: 700 }}>Día VR</p>
              {dia.vrSugerido && (
                <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: 13 }}>
                  Sugerido: {dia.vrSugerido}
                </p>
              )}
            </div>
          )}

          {dia?.tipo === "rutina" && (
            <div className="card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <p style={{ margin: "0 0 4px", fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Hoy toca
                </p>
                <p style={{ margin: 0, fontWeight: 800, fontSize: 22 }}>
                  {rutina?.nombre ?? dia.etiqueta}
                </p>
                {rutina && (
                  <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                    <span className="badge badge-accent">{rutina.foco}</span>
                    <span className="badge badge-muted">{rutina.nivel}</span>
                    {rutina.duracionEstimadaMin != null && (
                      <span className="badge badge-muted">⏱ {rutina.duracionEstimadaMin} min</span>
                    )}
                  </div>
                )}
              </div>
              {rutina && (
                <button
                  className="btn-primary"
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                  onClick={() => navigate(`/entrenar/${rutina.idRutina}`)}
                >
                  <Zap size={18} /> Empezar sesión
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
