import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { X, AlignJustify, Zap, RotateCcw, Plus, Trash2 } from "lucide-react";
import { Bicep } from "../components/Bicep";
import type { Ejercicio, SerieRegistro } from "../types/models";
import { finalizarSesion } from "../data/historial";
import { useAuth } from "../auth/useAuth";
import {
  rutinaCompleta, seriesObjetivo,
  buildBloqueLibre, buildVirtualRutina,
  clearEntrenarState,
} from "../lib/entrenarState";
import { useEntrenarState } from "../hooks/useEntrenarState";
import { ExercisePicker } from "../components/rutina/ExercisePicker";
import { DescansoTimer } from "../components/entrenar/DescansoTimer";
import { BloqueGuiado } from "../components/entrenar/BloqueGuiado";
import { BloqueScroll } from "../components/entrenar/BloqueScroll";

const SESSION_KEY = "libre:temp";

/**
 * Sesión libre (ad-hoc): el usuario elige ejercicios del catálogo y los
 * entrena sin una Rutina persistida. Se registra en Historial con tipo "libre".
 * Ruta: /entrenar/libre (fullscreen, sin AppShell).
 */
export function EntrenarSesionLibre() {
  const navigate      = useNavigate();
  const { memberId }  = useAuth();

  // ── Fase 1 — selector ─────────────────────────────────────────────────────
  const [ejercicios,     setEjercicios]     = useState<Ejercicio[]>([]);
  const [pickerAbierto,  setPickerAbierto]  = useState(false);
  const [sesionIniciada, setSesionIniciada] = useState(false);

  // ── Fase 2 — workout ──────────────────────────────────────────────────────
  const bloques       = ejercicios.map((ej, i) => buildBloqueLibre(ej, i + 1));
  const virtualRutina = sesionIniciada ? buildVirtualRutina(bloques) : null;

  const session    = useEntrenarState(SESSION_KEY, virtualRutina);
  const state      = session.state;

  const [rpe,       setRpe]       = useState<number | null>(null);
  const [saving,    setSaving]    = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [logReps,   setLogReps]   = useState("");
  const [logCarga,  setLogCarga]  = useState("");
  const startRef = useRef<number>(Date.now());

  // ── Handlers fase 1 ───────────────────────────────────────────────────────

  function agregarEjercicio(ej: Ejercicio) {
    setEjercicios((prev) => [...prev, ej]);
    setPickerAbierto(false);
  }

  function quitarEjercicio(idx: number) {
    setEjercicios((prev) => prev.filter((_, i) => i !== idx));
  }

  function empezarSesion() {
    session.reiniciar();          // limpia localStorage + reset state
    startRef.current = Date.now();
    setSesionIniciada(true);
  }

  // ── Handlers fase 2 ───────────────────────────────────────────────────────

  function getLogValues(): Partial<SerieRegistro> {
    const blq = virtualRutina?.bloques[state.bloqueActual];
    if (!blq || blq.modalidad !== "Fuerza") return {};
    return {
      reps:    logReps  ? parseInt(logReps, 10)   : undefined,
      cargaKg: logCarga ? parseFloat(logCarga)    : undefined,
    };
  }

  function handleSerie() {
    session.completarSerie(state.bloqueActual, getLogValues());
    setLogReps("");
    setLogCarga("");
  }

  // ── Render: fase 1 — selector ─────────────────────────────────────────────

  if (!sesionIniciada) {
    return (
      <div className="workout-screen">
        <div className="workout-header">
          <button className="btn-icon-sm" onClick={() => navigate("/entrenar")} title="Volver">
            <X size={18} />
          </button>
          <p className="workout-title">Sesión libre</p>
          <div style={{ width: 32 }} />
        </div>

        <div className="workout-content" style={{ padding: "16px 16px 0" }}>
          {ejercicios.length === 0 ? (
            <div className="empty-state" style={{ minHeight: 120 }}>
              <p>Agregá ejercicios para armar tu sesión.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
              {ejercicios.map((ej, i) => (
                <div key={`${ej.idEjercicio}-${i}`} className="card"
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px" }}>
                  <span style={{
                    width: 28, height: 28, borderRadius: 8,
                    background: "var(--accent-dim)", color: "var(--accent)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: 700, flexShrink: 0,
                  }}>
                    {i + 1}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {ej.nombre}
                    </p>
                    <p style={{ margin: 0, fontSize: 11, color: "var(--muted)" }}>
                      {ej.modalidad} · 3×10
                    </p>
                  </div>
                  <button className="btn-icon-sm" onClick={() => quitarEjercicio(i)} title="Quitar">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <button className="btn-secondary" style={{ width: "100%" }}
            onClick={() => setPickerAbierto(true)}>
            <Plus size={16} /> Agregar ejercicio
          </button>
        </div>

        <div style={{ padding: "12px 16px 24px", marginTop: "auto" }}>
          <button
            className="btn-primary"
            style={{ width: "100%" }}
            disabled={ejercicios.length === 0}
            onClick={empezarSesion}
          >
            <Zap size={18} /> Empezar sesión
          </button>
        </div>

        {pickerAbierto && (
          <ExercisePicker
            onSelect={agregarEjercicio}
            onClose={() => setPickerAbierto(false)}
          />
        )}
      </div>
    );
  }

  // ── Render: fase 2 — workout terminado ────────────────────────────────────

  const terminada = virtualRutina ? rutinaCompleta(state, virtualRutina) : false;

  if (terminada && virtualRutina) {
    return (
      <div className="workout-screen">
        <div className="workout-header">
          <p className="workout-title">Sesión libre</p>
        </div>
        <div className="finish-screen">
          <span style={{ color: "var(--accent)", lineHeight: 0, display: "block" }}>
            <Bicep size={52} />
          </span>
          <h2 className="finish-title">¡Sesión completada!</h2>
          <p style={{ color: "var(--muted)", fontSize: 14, margin: 0 }}>
            {virtualRutina.bloques.reduce((acc, _, i) => acc + (state.seriesHechas[i] ?? 0), 0)} series totales
          </p>

          <div style={{ width: "100%", textAlign: "left" }}>
            <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 8 }}>
              ¿Cómo fue el esfuerzo? (RPE)
            </p>
            <div className="rpe-selector">
              {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                <button key={n} className={`rpe-btn${rpe === n ? " selected" : ""}`}
                  onClick={() => setRpe(n)}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          {saveError && <p className="inline-error">{saveError}</p>}
          <button
            className="btn-primary"
            style={{ width: "100%", marginTop: 8 }}
            disabled={saving}
            onClick={async () => {
              if (!memberId) { session.reiniciar(); navigate("/entrenar"); return; }
              setSaving(true);
              setSaveError(null);
              const durMin = Math.round((Date.now() - startRef.current) / 60_000);
              const result = await finalizarSesion({
                tipo:        "libre",
                nombreLibre: "Sesión libre",
                miembro:     memberId,
                bloques:     session.bloquesRegistro(),
                rpe,
                duracionMin: durMin || null,
              });
              if (!result.ok) { setSaveError(result.error); setSaving(false); return; }
              session.reiniciar();
              navigate("/historial");
            }}
          >
            {saving ? "Guardando…" : "Finalizar y guardar"}
          </button>
          <button className="btn-secondary" style={{ width: "100%" }}
            onClick={() => session.reiniciar()}>
            Empezar de nuevo
          </button>
        </div>
      </div>
    );
  }

  // ── Render: fase 2 — workout en curso ─────────────────────────────────────

  if (!virtualRutina) return null;

  const blq      = virtualRutina.bloques[state.bloqueActual];
  const ejercicio = blq ? ejercicios.find((e) => e.idEjercicio === blq.idEjercicio) : undefined;

  return (
    <div className="workout-screen">
      <div className="workout-header">
        <button className="btn-icon-sm" onClick={() => navigate("/entrenar")} title="Salir">
          <X size={18} />
        </button>
        <p className="workout-title">Sesión libre</p>
        <button className="btn-icon-sm" onClick={session.toggleModo}
          title={state.modoVista === "guiada" ? "Modo scroll" : "Modo guiado"}>
          {state.modoVista === "guiada" ? <AlignJustify size={18} /> : <Zap size={18} />}
        </button>
        <button className="btn-icon-sm" onClick={() => session.reiniciar()} title="Reiniciar sesión">
          <RotateCcw size={16} />
        </button>
      </div>

      {state.modoVista === "scroll" && (
        <div className="workout-content">
          {virtualRutina.bloques.map((b, i) => (
            <BloqueScroll
              key={i}
              bloque={b}
              bloqueIdx={i}
              state={state}
              onCompletar={(bIdx) => session.completarSerie(bIdx)}
              onDeshacer={(bIdx) => session.deshacerSerie(bIdx)}
            />
          ))}
        </div>
      )}

      {state.modoVista === "guiada" && blq && (
        <>
          <div className="workout-content">
            <DescansoTimer
              state={state}
              onSkip={session.saltarDescanso}
              onAjustar={session.ajustarDescanso}
            />
            {!state.descanso && (
              <BloqueGuiado
                bloque={blq}
                bloqueIdx={state.bloqueActual}
                total={virtualRutina.bloques.length}
                seriesHechas={state.seriesHechas[state.bloqueActual] ?? 0}
                ejercicio={ejercicio}
                onIrASerie={(i) => void i}
              />
            )}
          </div>

          {!state.descanso && (
            <div className="workout-footer">
              {blq.modalidad === "Fuerza" && (
                <div className="quick-log">
                  <div className="quick-log-field">
                    <span className="quick-log-label">Reps</span>
                    <input className="quick-log-input" type="number" min={1}
                      placeholder={String(
                        (blq.prescripcion as { repsObjetivo: { value: number } }).repsObjetivo?.value ?? "—",
                      )}
                      value={logReps}
                      onChange={(e) => setLogReps(e.target.value)}
                    />
                  </div>
                  <div className="quick-log-field">
                    <span className="quick-log-label">Carga (kg)</span>
                    <input className="quick-log-input" type="number" min={0} step={0.5}
                      placeholder="—"
                      value={logCarga}
                      onChange={(e) => setLogCarga(e.target.value)}
                    />
                  </div>
                </div>
              )}
              <button
                className="btn-serie-hecha"
                onClick={handleSerie}
                disabled={(state.seriesHechas[state.bloqueActual] ?? 0) >= seriesObjetivo(blq.prescripcion)}
              >
                Serie {(state.seriesHechas[state.bloqueActual] ?? 0) + 1} hecha ✓
              </button>
              {(state.seriesHechas[state.bloqueActual] ?? 0) > 0 && (
                <button className="btn-secondary" style={{ marginTop: 8, width: "100%" }}
                  onClick={() => session.deshacerSerie(state.bloqueActual)}>
                  Deshacer última serie
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
