import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { X, AlignJustify, Zap, RotateCcw } from "lucide-react";
import { Bicep } from "../components/Bicep";
import type { Rutina, Ejercicio, SerieRegistro } from "../types/models";
import { getRutina } from "../data/rutinas";
import { getEjercicio } from "../data/ejercicios";
import { finalizarSesion } from "../data/historial";
import { crearSesion, iniciarSesion } from "../data/sesiones";
import { useAuth } from "../auth/useAuth";
import {
  rutinaCompleta, seriesObjetivo, valorPrefillSerie,
} from "../lib/entrenarState";
import { useEntrenarState } from "../hooks/useEntrenarState";
import { useWakeLock } from "../hooks/useWakeLock";
import { unlockAudio } from "../lib/audioAlert";
import { DescansoTimer } from "../components/entrenar/DescansoTimer";
import { SerieTimer } from "../components/entrenar/SerieTimer";
import { TiempoTotal } from "../components/entrenar/TiempoTotal";
import { BloqueGuiado } from "../components/entrenar/BloqueGuiado";
import { BloqueScroll } from "../components/entrenar/BloqueScroll";
import { lunesDeSemana, ymdLocal } from "../lib/semana";

/**
 * Pantalla de entrenamiento — fullscreen, fuera del AppShell.
 * Ruta: /entrenar/:rutinaId
 */
export function EntrenarSesion() {
  const { rutinaId } = useParams<{ rutinaId: string }>();
  const navigate      = useNavigate();

  const { memberId } = useAuth();
  const [rutina,   setRutina]   = useState<Rutina | null>(null);
  const [catalogo, setCatalogo] = useState<Map<string, Ejercicio>>(new Map());
  const [loading,  setLoading]  = useState(true);
  const [rpe,      setRpe]      = useState<number | null>(null);
  const [saving,   setSaving]   = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [sesionId, setSesionId] = useState<string | null>(null);
  const startRef = useRef<number>(Date.now());

  // Log rápido para modo guiado
  const [logReps,      setLogReps]      = useState("");
  const [logCarga,     setLogCarga]     = useState("");
  const [seriePulsing, setSeriePulsing] = useState(false);

  // Scrim de contenido scrolleable (B8)
  const contentRef = useRef<HTMLDivElement>(null);
  const [showScrim, setShowScrim] = useState(false);

  const sessionKey = `rutina:${rutinaId}`;
  const session    = useEntrenarState(sessionKey, rutina);
  const state      = session.state;

  // Mantener pantalla encendida durante toda la sesión
  useWakeLock(!loading && !!rutina);

  // Bloque actual (declarado acá, después de state, para que el useEffect de prefill pueda usarlo)
  const blq = rutina?.bloques[state.bloqueActual];

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const check = () => {
      setShowScrim(el.scrollHeight > el.clientHeight + 4 && el.scrollHeight - el.scrollTop - el.clientHeight > 8);
    };
    check();
    el.addEventListener("scroll", check, { passive: true });
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => { el.removeEventListener("scroll", check); ro.disconnect(); };
  }, [state.descanso, state.bloqueActual]);

  // Prefill log rápido desde la prescripción / último valor registrado al cambiar de bloque
  useEffect(() => {
    if (!rutina || !blq || blq.modalidad !== "Fuerza") {
      setLogReps(""); setLogCarga(""); return;
    }
    const { reps, cargaKg } = valorPrefillSerie(rutina, state.bloqueActual, state);
    setLogReps(reps != null ? String(reps) : "");
    setLogCarga(cargaKg != null ? String(cargaKg) : "");
  // state.ultimoLog cambia al completar una serie pero NO queremos re-setear los
  // inputs (el usuario puede estar editando); solo re-seeda al cambiar de bloque.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.bloqueActual, blq?.idEjercicio, rutina]);

  // Sella el inicio del cronómetro de trabajo al montar y al cambiar de bloque
  // (serie 1 de la sesión no tenía inicio hasta ahora; ver ADR de P51).
  useEffect(() => {
    if (!rutina) return;
    session.asegurarInicioSerie(state.bloqueActual);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.bloqueActual, rutina]);

  // Cargar rutina, pre-fetch ejercicios y crear sesión en Firestore
  useEffect(() => {
    if (!rutinaId || !memberId) return;
    getRutina(rutinaId).then(async (r) => {
      if (!r.ok) { setLoading(false); return; }
      const rutina = r.value;
      setRutina(rutina);

      // Pre-fetch ejercicios en paralelo (para instrucciones/puntos/errores)
      const map = new Map<string, Ejercicio>();
      await Promise.all(
        rutina.bloques.map(async (b) => {
          const ej = await getEjercicio(b.idEjercicio);
          if (ej.ok) map.set(b.idEjercicio, ej.value);
        }),
      );
      setCatalogo(map);

      // Crear sesión real (Programada → En curso) para que finalizarSesion la cierre
      const hoy     = new Date();
      const lunes   = lunesDeSemana(hoy);
      const domingo = new Date(hoy); domingo.setDate(hoy.getDate() + (7 - (hoy.getDay() || 7)));
      const semanaFin = ymdLocal(domingo);
      const sesRes = await crearSesion({
        miembro: memberId, rutinaId, nombreRutina: rutina.nombre,
        tipoSeleccion: "rutina", semanaInicio: lunes, semanaFin,
      });
      if (sesRes.ok) {
        setSesionId(sesRes.value.idSesion);
        iniciarSesion(sesRes.value.idSesion); // fire-and-forget: Programada → En curso
      }

      setLoading(false);
    });
  }, [rutinaId, memberId]);

  if (loading) {
    return (
      <div className="workout-screen">
        <div className="loading-screen"><div className="spinner" /></div>
      </div>
    );
  }

  if (!rutina) {
    return (
      <div className="workout-screen">
        <div className="empty-state"><p>Rutina no encontrada.</p></div>
      </div>
    );
  }

  const terminada = rutinaCompleta(state, rutina);

  // ── Pantalla de finalización ──────────────────────────────────────────────
  if (terminada) {
    return (
      <div className="workout-screen">
        <div className="workout-header">
          <p className="workout-title">{rutina.nombre}</p>
        </div>
        <div className="finish-screen">
          <span style={{ color: "var(--accent)", lineHeight: 0, display: "block" }}>
            <Bicep size={52} />
          </span>
          <h2 className="finish-title">¡Sesión completada!</h2>
          <p style={{ color: "var(--muted)", fontSize: 14, margin: 0 }}>
            {rutina.bloques.reduce((acc, _, i) => acc + (state.seriesHechas[i] ?? 0), 0)} series totales
          </p>

          <div style={{ width: "100%", textAlign: "left" }}>
            <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 8 }}>
              ¿Cómo fue el esfuerzo? (RPE)
            </p>
            <div className="rpe-selector">
              {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                <button
                  key={n}
                  className={`rpe-btn${rpe === n ? " selected" : ""}`}
                  onClick={() => setRpe(n)}
                >
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
              if (!rutinaId || !memberId) { session.reiniciar(); navigate("/entrenar"); return; }
              setSaving(true);
              setSaveError(null);
              const durMin = Math.round((Date.now() - startRef.current) / 60_000);
              const result = await finalizarSesion({
                rutinaId,
                miembro: memberId,
                bloques: session.bloquesRegistro(),
                rpe,
                duracionMin: durMin || null,
                idSesion: sesionId ?? undefined,
              });
              if (!result.ok) { setSaveError(result.error); setSaving(false); return; }
              session.reiniciar();
              navigate("/historial");
            }}
          >
            {saving ? "Guardando…" : "Finalizar y guardar"}
          </button>
          <button className="btn-secondary" style={{ width: "100%" }}
            onClick={() => { session.reiniciar(); }}>
            Empezar de nuevo
          </button>
        </div>
      </div>
    );
  }

  // ── Bloque actual ─────────────────────────────────────────────────────────
  const ejercicio = blq ? catalogo.get(blq.idEjercicio) : undefined;

  // Valores para el log rápido
  function getLogValues(): Partial<SerieRegistro> {
    if (!blq || blq.modalidad !== "Fuerza") return {};
    const reps  = logReps  ? parseInt(logReps,  10) : undefined;
    const carga = logCarga ? parseFloat(logCarga) : undefined;
    return { reps, cargaKg: carga };
  }

  function handleSerie() {
    if (!blq) return;
    setSeriePulsing(true);
    window.setTimeout(() => setSeriePulsing(false), 220);
    session.completarSerie(state.bloqueActual, getLogValues());
    // No reset: los valores quedan para la próxima serie del mismo bloque
    // (herencia). El useEffect los actualiza solo al cambiar de bloque.
  }

  // ── Render modo guiado ────────────────────────────────────────────────────
  return (
    // onPointerDown desbloquea el AudioContext en el primer toque del usuario
    <div className="workout-screen" onPointerDown={unlockAudio}>
      {/* Header */}
      <div className="workout-header">
        <button className="btn-icon-sm" onClick={() => navigate("/entrenar")} title="Salir">
          <X size={18} />
        </button>
        <p className="workout-title">{rutina.nombre}</p>
        <TiempoTotal startMs={startRef.current} estimadoMin={rutina.duracionEstimadaMin} />
        <button
          className="btn-icon-sm"
          onClick={session.toggleModo}
          title={state.modoVista === "guiada" ? "Modo scroll" : "Modo guiado"}
        >
          {state.modoVista === "guiada" ? <AlignJustify size={18} /> : <Zap size={18} />}
        </button>
        <button className="btn-icon-sm" onClick={session.reiniciar} title="Reiniciar sesión">
          <RotateCcw size={16} />
        </button>
      </div>

      {/* ── MODO SCROLL ───────────────────────────────────────────────────── */}
      {state.modoVista === "scroll" && (
        <div className="workout-content">
          {rutina.bloques.map((b, i) => (
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

      {/* ── MODO GUIADO ───────────────────────────────────────────────────── */}
      {state.modoVista === "guiada" && blq && (
        <>
          <div className="workout-content-wrap">
            <div className="workout-content" ref={contentRef}>
              {/* Cronómetro de descanso */}
              <DescansoTimer
                state={state}
                onSkip={session.saltarDescanso}
                onAjustar={session.ajustarDescanso}
              />

              {/* Cronómetro de trabajo (cardio en intervalos / isométrico) */}
              {!state.descanso && (
                <SerieTimer
                  state={state}
                  rutina={rutina}
                  onAjustar={(d) => session.ajustarTrabajo(state.bloqueActual, d)}
                />
              )}

              {/* Bloque actual */}
              {!state.descanso && (
                <BloqueGuiado
                  bloque={blq}
                  bloqueIdx={state.bloqueActual}
                  total={rutina.bloques.length}
                  seriesHechas={state.seriesHechas[state.bloqueActual] ?? 0}
                  ejercicio={ejercicio}
                  onIrASerie={(i) => void i}
                />
              )}
            </div>
            {showScrim && <div className="workout-scrim" />}
          </div>

          {/* Footer con log rápido + botón */}
          {!state.descanso && (
            <div className="workout-footer">
              {blq.modalidad === "Fuerza" && (
                <div className="quick-log">
                  <div className="quick-log-field">
                    <span className="quick-log-label">Reps</span>
                    <input
                      className="quick-log-input"
                      type="number"
                      min={1}
                      placeholder={String(
                        (blq.prescripcion as { repsObjetivo: { value: number } }).repsObjetivo?.value ?? "—",
                      )}
                      value={logReps}
                      onChange={(e) => setLogReps(e.target.value)}
                    />
                  </div>
                  <div className="quick-log-field">
                    <span className="quick-log-label">Carga (kg)</span>
                    <input
                      className="quick-log-input"
                      type="number"
                      min={0}
                      step={0.5}
                      placeholder={
                        (blq.prescripcion as { cargaKg?: number }).cargaKg != null
                          ? String((blq.prescripcion as { cargaKg: number }).cargaKg)
                          : "—"
                      }
                      value={logCarga}
                      onChange={(e) => setLogCarga(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <button
                className={`btn-serie-hecha${seriePulsing ? " btn-pulsing" : ""}`}
                onClick={handleSerie}
                disabled={(state.seriesHechas[state.bloqueActual] ?? 0) >= seriesObjetivo(blq.prescripcion)}
              >
                Serie {(state.seriesHechas[state.bloqueActual] ?? 0) + 1} hecha ✓
              </button>

              {/* Deshacer */}
              {(state.seriesHechas[state.bloqueActual] ?? 0) > 0 && (
                <button
                  style={{ marginTop: 8, width: "100%" }}
                  className="btn-secondary"
                  onClick={() => session.deshacerSerie(state.bloqueActual)}
                >
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
