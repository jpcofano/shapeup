import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Zap, List, Dumbbell, Moon } from "lucide-react";
import type { Rutina, Programa } from "../types/models";
import type { MiembroId } from "../types/models";
import { getRutinasDelMiembro } from "../data/rutinas";
import { getProgramaActivo } from "../data/programas";
import { getHistorialMiembro } from "../data/historial";
import { useAuth } from "../auth/useAuth";
import { proximaSesion, type ProximaSesionResult } from "../lib/proximaSesion";
import { sesionDeHoy, jsDayToNum, type SesionDeHoyResult } from "../lib/sesionDeHoy";
import { lunesDeSemana } from "../lib/semana";

/** Chooser de 3 puertas: próxima sesión · elegir rutina · libre (próximamente). */
export function Entrenar() {
  const navigate     = useNavigate();
  const { memberId } = useAuth();

  const [rutinas,  setRutinas]  = useState<Rutina[]>([]);
  const [proxima,  setProxima]  = useState<ProximaSesionResult | null | undefined>(undefined);
  const [hoy,      setHoy]      = useState<SesionDeHoyResult | null>(null);
  const [programa, setPrograma] = useState<Programa | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  useEffect(() => {
    if (!memberId) return;
    const semanaInicio = lunesDeSemana();

    Promise.all([
      getRutinasDelMiembro(memberId as MiembroId),
      getProgramaActivo(memberId as MiembroId),
      getHistorialMiembro(memberId as MiembroId),
    ]).then(([rutinasR, progR, histR]) => {
      if (rutinasR.ok) setRutinas(rutinasR.value);
      else             setError(rutinasR.error);

      if (progR.ok && progR.value) {
        const prog = progR.value;
        setPrograma(prog);
        const estaSemana = histR.ok
          ? histR.value.filter((h) => h.semanaInicio === semanaInicio)
          : [];
        setProxima(proximaSesion(prog, estaSemana));
        const hoyNum = jsDayToNum(new Date().getDay());
        setHoy(sesionDeHoy(prog, hoyNum, estaSemana));
      } else {
        setProxima(null);
        setHoy(null);
      }

      setLoading(false);
    });
  }, [memberId]);

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Entrenar</h1>
      </div>

      {loading && <div className="empty-state"><div className="spinner" /></div>}
      {error   && <p className="inline-error">{error}</p>}

      {/* ── Puerta 1 — Hoy toca / próxima sesión ─────────────────────── */}
      {!loading && (hoy !== null || proxima !== undefined) && (
        <section>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            {hoy?.tipo === "descanso"
              ? <Moon size={15} color="var(--muted)" strokeWidth={1.5} />
              : <Zap  size={15} color="var(--accent)" fill="var(--accent)" strokeWidth={0} />
            }
            <span className="t-label">
              {hoy?.tipo === "descanso" ? "Hoy — descanso" : "Hoy toca"}
            </span>
          </div>

          {hoy?.tipo === "descanso" ? (
            <div className="card" style={{ textAlign: "center", padding: "14px 16px" }}>
              <Moon size={24} color="var(--muted)" strokeWidth={1.5} style={{ marginBottom: 6 }} />
              <p style={{ margin: 0, fontWeight: 700 }}>Día de descanso</p>
              <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: 13 }}>
                Recuperá. La recuperación es parte del entrenamiento.
              </p>
            </div>
          ) : hoy?.tipo === "rutina" ? (
            <div
              className="card"
              style={{ borderColor: "var(--accent)", borderWidth: 1.5, cursor: hoy.yaHecha ? "default" : "pointer" }}
              onClick={() => !hoy.yaHecha && navigate(`/entrenar/${hoy.idRutina}`)}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: "0 0 4px", fontWeight: 800, fontSize: 18, letterSpacing: "-.01em" }}>
                    {hoy.etiqueta.replace(/^[^—–]*[—–]\s*/, "")}
                  </p>
                  <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>
                    {hoy.yaHecha ? "Ya entrenaste hoy ✓" : "Programado para hoy"}
                  </p>
                </div>
                <span style={{
                  width: 38, height: 38, borderRadius: "50%",
                  background: hoy.yaHecha ? "var(--card-hover)" : "var(--accent)",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <Zap size={18} color={hoy.yaHecha ? "var(--muted)" : "var(--on-accent)"} />
                </span>
              </div>
              {!hoy.yaHecha && (
                <button
                  className="btn-primary"
                  style={{ marginTop: 12 }}
                  onClick={(e) => { e.stopPropagation(); navigate(`/entrenar/${hoy.idRutina}`); }}
                >
                  Empezar
                </button>
              )}
            </div>
          ) : proxima !== null && proxima !== undefined ? (
            <div
              className="card"
              style={{ borderColor: "var(--accent)", borderWidth: 1.5, cursor: "pointer" }}
              onClick={() => proxima.dia.idRutina && navigate(`/entrenar/${proxima.dia.idRutina}`)}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: "0 0 4px", fontWeight: 800, fontSize: 18, letterSpacing: "-.01em" }}>
                    {proxima.dia.idRutina
                      ? proxima.dia.etiqueta.replace(/^[^—–]*[—–]\s*/, "")
                      : proxima.dia.etiqueta}
                  </p>
                  <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>
                    Día {proxima.indice} de {proxima.total}
                    {proxima.dia.diaSemana && ` · planificado: ${proxima.dia.diaSemana}`}
                  </p>
                </div>
                <span style={{
                  width: 38, height: 38, borderRadius: "50%", background: "var(--accent)",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <Zap size={18} color="var(--on-accent)" />
                </span>
              </div>
              {proxima.dia.idRutina && (
                <button
                  className="btn-primary"
                  style={{ marginTop: 12 }}
                  onClick={(e) => { e.stopPropagation(); navigate(`/entrenar/${proxima.dia.idRutina}`); }}
                >
                  Empezar
                </button>
              )}
            </div>
          ) : (
            <div className="card" style={{ textAlign: "center", padding: "14px 16px" }}>
              <p style={{ margin: 0, fontWeight: 700 }}>🎉 Semana completa</p>
              <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: 13 }}>
                Elegí otra rutina abajo si querés seguir.
              </p>
            </div>
          )}
        </section>
      )}

      {/* ── Puerta 2 — Elegir una rutina ──────────────────────────────── */}
      {!loading && rutinas.length > 0 && (
        <section>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, marginTop: 4 }}>
            <List size={15} color="var(--muted)" />
            <span className="t-label">Elegir una rutina</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
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
                <div className="rutina-card-meta" style={{ marginTop: 8 }}>
                  <span className="badge badge-accent">{r.foco}</span>
                  <span className="badge badge-muted">{r.nivel}</span>
                  {r.duracionEstimadaMin != null && (
                    <span className="badge badge-muted">⏱ {r.duracionEstimadaMin} min</span>
                  )}
                  {r.totalSeries != null && (
                    <span style={{ fontSize: 12, color: "var(--muted)" }}>{r.totalSeries} series</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Puerta 3 — Sesión libre ────────────────────────────────────── */}
      {!loading && (
        <section>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, marginTop: 4 }}>
            <Dumbbell size={15} color="var(--muted)" />
            <span className="t-label">Sesión libre</span>
          </div>
          <div
            className="card"
            style={{ display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }}
            onClick={() => navigate("/entrenar/libre")}
          >
            <span style={{
              width: 38, height: 38, borderRadius: "50%", background: "var(--card-hover)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <Dumbbell size={18} color="var(--muted)" />
            </span>
            <div>
              <p style={{ margin: 0, fontWeight: 600 }}>Elegir ejercicios sueltos</p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--muted)" }}>Armá tu sesión desde el catálogo</p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
