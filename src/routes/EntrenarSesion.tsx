import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate, useBlocker } from "react-router-dom";
import { X, AlignJustify, Zap } from "lucide-react";
import { Bicep } from "../components/Bicep";
import type { Rutina, Ejercicio, SerieRegistro, Historial } from "../types/models";
import { getRutina } from "../data/rutinas";
import { getEjercicio } from "../data/ejercicios";
import { finalizarSesion, getHistorialMiembro } from "../data/historial";
import { crearSesion, iniciarSesion, descartarSesion } from "../data/sesiones";
import { useAuth } from "../auth/useAuth";
import {
  rutinaCompleta, rutinaTerminada, seriesHechasTotales, valorPrefillSerie,
  duracionParcialMin, sesionVieja, mensajeSesionVieja,
  bloqueCompleto, seriesObjetivo, nombreSiguientePendiente, aContinuacionDescanso,
} from "../lib/entrenarState";
import { estimarDuracionMin } from "../lib/metricas";
import { sugerirProgresion } from "../lib/progresion";
import { useEntrenarState } from "../hooks/useEntrenarState";
import { useConfirmarReinicio } from "../hooks/useConfirmarReinicio";
import { useWakeLock } from "../hooks/useWakeLock";
import { unlockAudio } from "../lib/audioAlert";
import { DescansoTimer } from "../components/entrenar/DescansoTimer";
import { SerieTimer } from "../components/entrenar/SerieTimer";
import { TiempoTotal } from "../components/entrenar/TiempoTotal";
import { BloqueGuiado } from "../components/entrenar/BloqueGuiado";
import { BloqueScroll } from "../components/entrenar/BloqueScroll";
import { SugerenciaChip } from "../components/entrenar/SugerenciaChip";
import { RegistroSerie } from "../components/entrenar/RegistroSerie";
import { ConfirmarReinicio } from "../components/entrenar/ConfirmarReinicio";
import { HojaSalida } from "../components/entrenar/HojaSalida";
import { VistaDia } from "../components/entrenar/VistaDia";
import { BloqueAnteriorChip } from "../components/entrenar/BloqueAnteriorChip";
import { ResumenSalteados } from "../components/entrenar/ResumenSalteados";
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

  // Hoja de salida (P68)
  const [salida,          setSalida]          = useState<{ contexto?: string } | null>(null);
  const [guardandoSalida, setGuardandoSalida] = useState(false);
  const [errorSalida,     setErrorSalida]     = useState<string | null>(null);
  /** true antes de navegar desde la hoja o la pantalla de fin: el bloqueo del "atrás" no aplica. */
  const saliendo = useRef(false);

  // Vista del día (P68b)
  const [vistaDiaAbierta, setVistaDiaAbierta] = useState(false);

  // Progresión de cargas (I3): historial del miembro para sugerir doble progresión.
  const [historialMiembro, setHistorialMiembro] = useState<Historial[]>([]);
  const [sugerenciasDescartadas, setSugerenciasDescartadas] = useState<Set<number>>(new Set());

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

  // Reiniciar (hoja de salida y pantalla de fin): confirma si hay series. Sella
  // el inicio de la sesión nueva en el mismo handler: si ya estábamos en el
  // bloque 0, el efecto de montaje no se vuelve a disparar.
  function reiniciarYSellar() {
    session.reiniciar();
    session.asegurarInicioSesion();
  }
  const reinicio = useConfirmarReinicio(seriesHechasTotales(state), reiniciarYSellar);

  function abrirSalida(contexto?: string) {
    setErrorSalida(null);
    setSalida({ contexto });
  }

  /** Salir sin guardar: borra el estado local y la SesionProgramada, sin esperar. */
  function salirSinGuardar() {
    const idSesion = state.idSesion;
    session.limpiar();
    if (idSesion) void descartarSesion(idSesion);
    saliendo.current = true;
    navigate("/entrenar");
  }

  /** Guardar y salir: parcial, salvo que justo esté completa. RPE va en P70. */
  async function guardarYSalir() {
    if (!rutina || !rutinaId) return;
    if (!memberId) { setErrorSalida("No se pudo identificar al miembro."); return; }
    setGuardandoSalida(true);
    setErrorSalida(null);
    const result = await finalizarSesion({
      rutinaId,
      miembro:     memberId,
      bloques:     session.bloquesRegistro(),
      rpe:         null,
      duracionMin: duracionParcialMin(state) || null,
      idSesion:    state.idSesion ?? undefined,
      completitud: rutinaCompleta(state, rutina) ? "completa" : "parcial",
    });
    if (!result.ok) { setErrorSalida(result.error); setGuardandoSalida(false); return; }
    session.limpiar();
    saliendo.current = true;
    navigate("/historial");
  }

  // Al montar, una vez, con el estado recién cargado:
  //  - sesión vieja con series → hoja de salida (P68);
  //  - sesión vieja sin series → se reinicia sola (P68);
  //  - sin series y en modo guiado (o recién reiniciada) → vista del día (P68b).
  const evaluoMontaje = useRef(false);
  useEffect(() => {
    if (evaluoMontaje.current) return;
    evaluoMontaje.current = true;
    const series = seriesHechasTotales(state);
    const vieja  = sesionVieja(state, Date.now());
    if (vieja && series > 0 && state.inicioMs != null) {
      abrirSalida(mensajeSesionVieja(state.inicioMs));
      return;
    }
    if (vieja) reiniciarYSellar();
    if (series === 0 && (vieja || state.modoVista === "guiada")) setVistaDiaAbierta(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // "Atrás" del sistema (P68b): con la sesión en curso, pasa por la hoja de salida.
  const blocker = useBlocker(({ currentLocation, nextLocation }) =>
    !loading
    && state.inicioMs != null
    && !saliendo.current
    && currentLocation.pathname !== nextLocation.pathname);
  useEffect(() => {
    if (blocker.state !== "blocked") return;
    blocker.reset();
    abrirSalida();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocker]);

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
  // (serie 1 de la sesión no tenía inicio hasta ahora; ver ADR de P51), y el
  // inicio de la sesión al montar (P67). Ninguno pisa un valor ya sellado.
  useEffect(() => {
    if (!rutina) return;
    session.asegurarInicioSesion();
    session.asegurarInicioSerie(state.bloqueActual);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.bloqueActual, rutina]);

  // Cargar rutina, pre-fetch ejercicios y crear sesión en Firestore — una sola
  // SesionProgramada por sesión: si el estado guardado ya tiene una, se reusa (P68).
  useEffect(() => {
    if (!rutinaId || !memberId) return;
    const idSesionGuardada = state.idSesion;
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
      if (!idSesionGuardada) {
        const hoy     = new Date();
        const lunes   = lunesDeSemana(hoy);
        const domingo = new Date(hoy); domingo.setDate(hoy.getDate() + (7 - (hoy.getDay() || 7)));
        const semanaFin = ymdLocal(domingo);
        const sesRes = await crearSesion({
          miembro: memberId, rutinaId, nombreRutina: rutina.nombre,
          tipoSeleccion: "rutina", semanaInicio: lunes, semanaFin,
        });
        if (sesRes.ok) {
          session.asignarIdSesion(sesRes.value.idSesion);
          iniciarSesion(sesRes.value.idSesion); // fire-and-forget: Programada → En curso
        }
      }

      setLoading(false);
    });
    // Solo al montar (o al cambiar de rutina/miembro): state.idSesion se lee una vez.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rutinaId, memberId]);

  // Historial del miembro para la sugerencia de progresión (I3) — una sola carga.
  useEffect(() => {
    if (!memberId) return;
    getHistorialMiembro(memberId).then((r) => { if (r.ok) setHistorialMiembro(r.value); });
  }, [memberId]);

  const sugerencia = useMemo(() => {
    if (!blq || blq.modalidad !== "Fuerza") return null;
    if (sugerenciasDescartadas.has(state.bloqueActual)) return null;
    return sugerirProgresion(blq.idEjercicio, historialMiembro, blq.prescripcion);
  }, [blq, historialMiembro, sugerenciasDescartadas, state.bloqueActual]);

  function usarSugerencia() {
    if (!sugerencia) return;
    if (sugerencia.pesoKg != null) setLogCarga(String(sugerencia.pesoKg));
    if (sugerencia.repsObjetivo != null) setLogReps(String(sugerencia.repsObjetivo));
  }

  const hojaSalida = salida && (
    <HojaSalida
      series={seriesHechasTotales(state)}
      contexto={salida.contexto}
      guardando={guardandoSalida}
      error={errorSalida}
      onGuardar={() => void guardarYSalir()}
      onDescartar={salirSinGuardar}
      onSeguir={() => setSalida(null)}
      onReiniciar={() => { setSalida(null); reinicio.pedir(); }}
    />
  );

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

  // Chip del último bloque cerrado (P68b). "+ serie" repite los valores de su última serie.
  const idxCerrado = state.ultimoBloqueCerrado;
  function chipAnterior(soloExtra: boolean) {
    if (idxCerrado == null || !rutina) return null;
    if (soloExtra && !bloqueCompleto(state, rutina, idxCerrado)) return null;
    const b = rutina.bloques[idxCerrado];
    return (
      <BloqueAnteriorChip
        rutina={rutina}
        state={state}
        idx={idxCerrado}
        onExtra={(i) => session.completarSerie(i, state.ultimoLog[i], { extra: true })}
        onDeshacerExtra={(i) => {
          if (b && (state.seriesHechas[i] ?? 0) > seriesObjetivo(b.prescripcion)) session.deshacerSerie(i);
        }}
        onVolver={(i) => session.retomarBloque(i)}
      />
    );
  }

  const terminada = rutinaTerminada(state, rutina);
  const completa  = rutinaCompleta(state, rutina);

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
          <h2 className="finish-title">{completa ? "¡Sesión completada!" : "Sesión terminada"}</h2>
          <p style={{ color: "var(--muted)", fontSize: 14, margin: 0 }}>
            {rutina.bloques.reduce((acc, _, i) => acc + (state.seriesHechas[i] ?? 0), 0)} series totales
          </p>

          <ResumenSalteados rutina={rutina} state={state} onRetomar={session.retomarBloque} />
          {chipAnterior(true) && <div style={{ width: "100%" }}>{chipAnterior(true)}</div>}

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
              if (!rutinaId || !memberId) {
                session.limpiar();
                saliendo.current = true;
                navigate("/entrenar");
                return;
              }
              setSaving(true);
              setSaveError(null);
              const durMin = state.inicioMs != null
                ? Math.round((Date.now() - state.inicioMs) / 60_000)
                : null;
              const result = await finalizarSesion({
                rutinaId,
                miembro: memberId,
                bloques: session.bloquesRegistro(),
                rpe,
                duracionMin: durMin || null,
                idSesion: state.idSesion ?? undefined,
                completitud: completa ? "completa" : "parcial",
              });
              if (!result.ok) { setSaveError(result.error); setSaving(false); return; }
              // limpiar, no reiniciar: reiniciar conserva idSesion y la próxima
              // sesión reusaría una SesionProgramada ya Registrada.
              session.limpiar();
              saliendo.current = true;
              navigate("/historial");
            }}
          >
            {saving ? "Guardando…" : "Finalizar y guardar"}
          </button>
          <button className="btn-secondary" style={{ width: "100%" }}
            onClick={reinicio.pedir}>
            Empezar de nuevo
          </button>
        </div>

        {hojaSalida}
        {reinicio.abierto && (
          <ConfirmarReinicio
            series={seriesHechasTotales(state)}
            onConfirmar={reinicio.confirmar}
            onCancelar={reinicio.cancelar}
          />
        )}
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

  function handleSerieExtra() {
    if (!blq) return;
    setSeriePulsing(true);
    window.setTimeout(() => setSeriePulsing(false), 220);
    session.completarSerie(state.bloqueActual, getLogValues(), { extra: true });
  }

  const saltadoActual = state.saltados[state.bloqueActual];
  const mostrarChipAnterior =
    !state.descanso && idxCerrado != null && idxCerrado !== state.bloqueActual;

  // ── Render modo guiado ────────────────────────────────────────────────────
  return (
    // onPointerDown desbloquea el AudioContext en el primer toque del usuario
    <div className="workout-screen" onPointerDown={unlockAudio}>
      {/* Header */}
      <div className="workout-header">
        <button className="btn-icon-sm" onClick={() => abrirSalida()} title="Salir">
          <X size={18} />
        </button>
        <p className="workout-title">{rutina.nombre}</p>
        <TiempoTotal startMs={state.inicioMs} estimadoMin={rutina.duracionEstimadaMin} />
        <button
          className="btn-icon-sm"
          onClick={session.toggleModo}
          title={state.modoVista === "guiada" ? "Modo scroll" : "Modo guiado"}
        >
          {state.modoVista === "guiada" ? <AlignJustify size={18} /> : <Zap size={18} />}
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
                aContinuacion={aContinuacionDescanso(state, rutina)}
              />

              {/* Último bloque cerrado: "+ serie de…" / "Saltaste… · Volver" (P68b) */}
              {mostrarChipAnterior && chipAnterior(false)}

              {/* Cronómetro de trabajo (cardio en intervalos / isométrico) */}
              {!state.descanso && (
                <SerieTimer
                  state={state}
                  rutina={rutina}
                  onAjustar={(d) => session.ajustarTrabajo(state.bloqueActual, d)}
                />
              )}

              {/* Sugerencia de progresión (I3) — propuesta, nunca se autocompleta */}
              {!state.descanso && sugerencia && (
                <SugerenciaChip
                  sugerencia={sugerencia}
                  onUsar={usarSugerencia}
                  onDescartar={() => setSugerenciasDescartadas((s) => new Set(s).add(state.bloqueActual))}
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
                  aContinuacion={nombreSiguientePendiente(state, rutina, state.bloqueActual)}
                  saltado={saltadoActual}
                  onAbrirDia={() => setVistaDiaAbierta(true)}
                  onRetomar={() => session.retomarBloque(state.bloqueActual)}
                />
              )}
            </div>
            {showScrim && <div className="workout-scrim" />}
          </div>

          {/* Footer con registro de la serie (no en un bloque salteado) */}
          {!state.descanso && saltadoActual === undefined && (
            <RegistroSerie
              bloque={blq}
              ejercicio={ejercicio}
              seriesHechas={state.seriesHechas[state.bloqueActual] ?? 0}
              reps={logReps}
              carga={logCarga}
              onRepsChange={setLogReps}
              onCargaChange={setLogCarga}
              onSerie={handleSerie}
              onSerieExtra={handleSerieExtra}
              onDeshacer={() => session.deshacerSerie(state.bloqueActual)}
              onSaltar={(motivo) => session.saltarBloque(state.bloqueActual, motivo)}
              onEjercicioChange={(ej) => setCatalogo((prev) => new Map(prev).set(ej.idEjercicio, ej))}
              pulsing={seriePulsing}
            />
          )}
        </>
      )}

      {vistaDiaAbierta && (
        <VistaDia
          titulo={rutina.nombre}
          minutos={rutina.duracionEstimadaMin ?? estimarDuracionMin(rutina)}
          rutina={rutina}
          state={state}
          onIr={(i) => { session.irABloque(i); setVistaDiaAbierta(false); }}
          onCerrar={() => setVistaDiaAbierta(false)}
        />
      )}
      {hojaSalida}
      {reinicio.abierto && (
        <ConfirmarReinicio
          series={seriesHechasTotales(state)}
          onConfirmar={reinicio.confirmar}
          onCancelar={reinicio.cancelar}
        />
      )}
    </div>
  );
}
