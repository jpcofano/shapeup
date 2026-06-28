import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { X, AlignJustify, Zap, RotateCcw, Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { Bicep } from "../components/Bicep";
import type { Ejercicio, SerieRegistro, PrescripcionFuerza } from "../types/models";
import { finalizarSesion } from "../data/historial";
import { getEjercicio } from "../data/ejercicios";
import { useAuth } from "../auth/useAuth";
import {
  rutinaCompleta, seriesObjetivo,
  buildBloqueLibre, buildVirtualRutina,
} from "../lib/entrenarState";
import { useEntrenarState } from "../hooks/useEntrenarState";
import { ExercisePicker } from "../components/rutina/ExercisePicker";
import { DescansoTimer } from "../components/entrenar/DescansoTimer";
import { BloqueGuiado } from "../components/entrenar/BloqueGuiado";
import { BloqueScroll } from "../components/entrenar/BloqueScroll";

const SESSION_KEY = "libre:temp";

type EjDefaults = { series: number; reps: number };

/** Defaults del atajo F4 y de "Sumá ejercicio": 3 series × 10 reps. Exportado para test. */
export function defaultsParaEj(ej: Ejercicio): EjDefaults {
  return { series: 3, reps: ej.modalidad === "Fuerza" ? 10 : 10 };
}

/**
 * Sesión libre (ad-hoc): el usuario elige ejercicios del catálogo y los
 * entrena sin una Rutina persistida. Se registra en Historial con tipo "libre".
 * Ruta: /entrenar/libre (fullscreen, sin AppShell).
 *
 * También sirve de atajo "Empezar este ejercicio" (F4) vía
 * /entrenar/ejercicio/:idEjercicio — pre-carga ese único ejercicio (3×10)
 * y entra directo a fase 2. Si el id no carga (inválido/offline), degrada
 * al selector vacío normal.
 */
export function EntrenarSesionLibre() {
  const navigate         = useNavigate();
  const { memberId }     = useAuth();
  const { idEjercicio: idEjercicioAtajo } = useParams<{ idEjercicio?: string }>();

  // ── Fase 1 — selector ─────────────────────────────────────────────────────
  const [ejercicios,     setEjercicios]     = useState<Ejercicio[]>([]);
  const [ejDefaults,     setEjDefaults]     = useState<EjDefaults[]>([]);
  const [pickerAbierto,  setPickerAbierto]  = useState(false);
  const [sesionIniciada, setSesionIniciada] = useState(false);

  // ── Atajo F4 — pre-seed de 1 ejercicio ───────────────────────────────────
  const [viaAtajo,      setViaAtajo]      = useState(false);
  const [cargandoAtajo, setCargandoAtajo] = useState(!!idEjercicioAtajo);
  const [sumarAbierto,  setSumarAbierto]  = useState(false);

  // ── Fase 2 — workout ──────────────────────────────────────────────────────
  const bloques = ejercicios.map((ej, i) => {
    const bl = buildBloqueLibre(ej, i + 1);
    const defs = ejDefaults[i];
    if (bl.modalidad === "Fuerza" && defs) {
      const p = bl.prescripcion as PrescripcionFuerza;
      return {
        ...bl,
        prescripcion: {
          ...p,
          series: defs.series,
          repsObjetivo: { value: defs.reps, raw: String(defs.reps) },
        } as PrescripcionFuerza,
      };
    }
    return bl;
  });
  const virtualRutina = sesionIniciada ? buildVirtualRutina(bloques) : null;

  const session    = useEntrenarState(SESSION_KEY, virtualRutina);
  const state      = session.state;

  const [rpe,       setRpe]       = useState<number | null>(null);
  const [saving,    setSaving]    = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [logReps,   setLogReps]   = useState("");
  const [logCarga,  setLogCarga]  = useState("");
  const startRef = useRef<number>(Date.now());

  // Pre-seed: si entramos por /entrenar/ejercicio/:idEjercicio, cargá ese
  // ejercicio y arrancá directo en fase 2. Sin id → no hace nada (selector normal).
  useEffect(() => {
    if (!idEjercicioAtajo) return;
    let activo = true;
    (async () => {
      const result = await getEjercicio(idEjercicioAtajo);
      if (activo && result.ok) {
        setEjercicios([result.value]);
        setEjDefaults([defaultsParaEj(result.value)]);
        setViaAtajo(true);
        session.reiniciar();
        startRef.current = Date.now();
        setSesionIniciada(true);
      }
      if (activo) setCargandoAtajo(false);
    })();
    return () => { activo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idEjercicioAtajo]);

  /** Salida (X / fin de sesión): si entramos por el atajo, volvemos al catálogo. */
  function salir() {
    if (viaAtajo) navigate(-1);
    else navigate("/entrenar");
  }

  // ── Handlers fase 1 ───────────────────────────────────────────────────────

  function agregarEjercicio(ej: Ejercicio) {
    setEjercicios((prev) => [...prev, ej]);
    setEjDefaults((prev) => [...prev, defaultsParaEj(ej)]);
    setPickerAbierto(false);
  }

  /** "Sumar otro ejercicio" desde la pantalla de fin: agrega el bloque y sigue la sesión. */
  function sumarYContinuar(ej: Ejercicio) {
    const nuevoIdx = ejercicios.length;
    setEjercicios((prev) => [...prev, ej]);
    setEjDefaults((prev) => [...prev, defaultsParaEj(ej)]);
    setSumarAbierto(false);
    session.irABloque(nuevoIdx);
  }

  function quitarEjercicio(idx: number) {
    setEjercicios((prev) => prev.filter((_, i) => i !== idx));
    setEjDefaults((prev) => prev.filter((_, i) => i !== idx));
  }

  function moverEjercicio(idx: number, dir: -1 | 1) {
    const next = idx + dir;
    if (next < 0 || next >= ejercicios.length) return;
    setEjercicios((prev) => {
      const arr = [...prev];
      [arr[idx], arr[next]] = [arr[next], arr[idx]];
      return arr;
    });
    setEjDefaults((prev) => {
      const arr = [...prev];
      [arr[idx], arr[next]] = [arr[next], arr[idx]];
      return arr;
    });
  }

  function updateDefault(idx: number, field: keyof EjDefaults, raw: string) {
    const value = Math.max(1, parseInt(raw) || 1);
    setEjDefaults((prev) => prev.map((d, i) => i === idx ? { ...d, [field]: value } : d));
  }

  function empezarSesion() {
    session.reiniciar();
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

  // ── Render: cargando el atajo (pre-seed de 1 ejercicio) ───────────────────

  if (cargandoAtajo) {
    return (
      <div className="workout-screen">
        <div className="loading-screen">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  // ── Render: fase 1 — selector ─────────────────────────────────────────────

  if (!sesionIniciada) {
    return (
      <div className="workout-screen">
        <div className="workout-header">
          <button className="btn-icon-sm" onClick={() => navigate("/entrenar")} title="Volver">
            <X size={18} />
          </button>
          <p className="workout-title">Armá tu sesión</p>
          <div style={{ width: 32 }} />
        </div>

        <div className="workout-content" style={{ padding: "16px 16px 0" }}>
          {ejercicios.length === 0 ? (
            <div className="empty-state" style={{ minHeight: 120 }}>
              <p>Sumá ejercicios del catálogo para empezar.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
              {ejercicios.map((ej, i) => (
                <div key={`${ej.idEjercicio}-${i}`} className="card libre-item"
                  style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px" }}>

                  {/* Número de orden */}
                  <span style={{
                    width: 28, height: 28, borderRadius: 8,
                    background: "var(--accent-dim)", color: "var(--accent)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: 700, flexShrink: 0, marginTop: 2,
                  }}>
                    {i + 1}
                  </span>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: "0 0 5px", fontWeight: 600, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {ej.nombre}
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>
                      <span className="badge badge-accent">{ej.grupoMuscularPrimario}</span>
                      <span className="badge badge-muted">{ej.modalidad}</span>
                      {ej.equipo.slice(0, 1).map((eq) => (
                        <span key={eq} className="badge badge-muted">{eq}</span>
                      ))}
                    </div>
                    {ej.modalidad === "Fuerza" && ejDefaults[i] && (
                      <div className="libre-defaults">
                        <label className="libre-defaults-label">
                          <span className="t-label">Series</span>
                          <input
                            type="number" min={1} max={10}
                            className="libre-defaults-input"
                            value={ejDefaults[i].series}
                            onChange={(e) => updateDefault(i, "series", e.target.value)}
                          />
                        </label>
                        <label className="libre-defaults-label">
                          <span className="t-label">Reps</span>
                          <input
                            type="number" min={1} max={50}
                            className="libre-defaults-input"
                            value={ejDefaults[i].reps}
                            onChange={(e) => updateDefault(i, "reps", e.target.value)}
                          />
                        </label>
                      </div>
                    )}
                    {ej.modalidad !== "Fuerza" && (
                      <p style={{ margin: 0, fontSize: 11, color: "var(--muted)" }}>
                        {ej.modalidad === "Cardio" ? "20 min continuo" :
                         ej.modalidad === "Movilidad" ? "3 rondas" :
                         "3 series · 30 s"}
                      </p>
                    )}
                  </div>

                  {/* Acciones: reordenar + quitar */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 2, flexShrink: 0 }}>
                    <button className="btn-icon-sm" onClick={() => moverEjercicio(i, -1)}
                      disabled={i === 0} title="Mover arriba">
                      <ChevronUp size={14} />
                    </button>
                    <button className="btn-icon-sm" onClick={() => moverEjercicio(i, 1)}
                      disabled={i === ejercicios.length - 1} title="Mover abajo">
                      <ChevronDown size={14} />
                    </button>
                    <button className="btn-icon-sm" onClick={() => quitarEjercicio(i)} title="Quitar">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button className="btn-secondary" style={{ width: "100%" }}
            onClick={() => setPickerAbierto(true)}>
            <Plus size={16} /> Sumá ejercicio
          </button>
        </div>

        <div style={{ padding: "12px 16px 24px", marginTop: "auto" }}>
          <button
            className="btn-primary"
            style={{ width: "100%" }}
            disabled={ejercicios.length === 0}
            onClick={empezarSesion}
          >
            <Zap size={18} /> Empezar
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
              if (!memberId) { session.reiniciar(); salir(); return; }
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
            onClick={() => setSumarAbierto(true)}>
            <Plus size={16} /> Sumar otro ejercicio
          </button>
          <button className="btn-secondary" style={{ width: "100%" }}
            onClick={() => session.reiniciar()}>
            Empezar de nuevo
          </button>
        </div>

        {sumarAbierto && (
          <ExercisePicker
            onSelect={sumarYContinuar}
            onClose={() => setSumarAbierto(false)}
          />
        )}
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
        <button className="btn-icon-sm" onClick={salir} title="Salir">
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
