import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useBlocker } from "react-router-dom";
import { X, AlignJustify, Zap, Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import type { Ejercicio, Historial, SerieRegistro, PrescripcionFuerza } from "../types/models";
import { finalizarSesion, getHistorialMiembro } from "../data/historial";
import { historialPrevio } from "../lib/resumenSesion";
import { getEjercicio, getEjerciciosPorId } from "../data/ejercicios";
import { useAuth } from "../auth/useAuth";
import {
  rutinaCompleta, rutinaTerminada, seriesHechasTotales,
  buildBloqueLibre, buildVirtualRutina,
  duracionParcialMin, sesionVieja, mensajeSesionVieja, quitarBloques,
  bloqueCompleto, seriesObjetivo, nombreSiguientePendiente, aContinuacionDescanso,
  type EntrenarState,
} from "../lib/entrenarState";
import {
  cargarConfigLibre, guardarConfigLibre, borrarConfigLibre,
  mismosEjercicios, restaurarConfig,
  type EjDefaults, type Restauracion,
} from "../lib/sesionLibre";
import { useEntrenarState } from "../hooks/useEntrenarState";
import { useConfirmarReinicio } from "../hooks/useConfirmarReinicio";
import { ExercisePicker } from "../components/rutina/ExercisePicker";
import { RegistroSerie } from "../components/entrenar/RegistroSerie";
import { ConfirmarReinicio } from "../components/entrenar/ConfirmarReinicio";
import { HojaSalida } from "../components/entrenar/HojaSalida";
import { VistaDia } from "../components/entrenar/VistaDia";
import { BloqueAnteriorChip } from "../components/entrenar/BloqueAnteriorChip";
import { ResumenSesion } from "../components/entrenar/ResumenSesion";
import { SinConexion } from "../components/entrenar/SinConexion";
import { GuardadoPendiente } from "../components/entrenar/GuardadoPendiente";
import { DescansoTimer } from "../components/entrenar/DescansoTimer";
import { SerieTimer } from "../components/entrenar/SerieTimer";
import { TiempoTotal } from "../components/entrenar/TiempoTotal";
import { BloqueGuiado } from "../components/entrenar/BloqueGuiado";
import { BloqueScroll } from "../components/entrenar/BloqueScroll";

const SESSION_KEY = "libre:temp";
const CONTEXTO_ATAJO = "Tenés una sesión libre sin cerrar";
const AVISO_NO_RESTAURADA =
  "No se pudo recuperar la sesión libre guardada. Revisá la conexión y volvé a entrar.";

/** Defaults del atajo F4 y de "Sumá ejercicio": 3 series × 10 reps. Exportado para test. */
export function defaultsParaEj(ej: Ejercicio): EjDefaults {
  return { series: 3, reps: ej.modalidad === "Fuerza" ? 10 : 10 };
}

function avisoQuitados(n: number): string {
  return n === 1
    ? "1 ejercicio ya no está en el catálogo"
    : `${n} ejercicios ya no están en el catálogo`;
}

/**
 * Sesión libre (ad-hoc): el usuario elige ejercicios del catálogo y los
 * entrena sin una Rutina persistida. Se registra en Historial con tipo "libre".
 * Ruta: /entrenar/libre (fullscreen, sin AppShell).
 *
 * También sirve de atajo "Empezar este ejercicio" (F4) vía
 * /entrenar/ejercicio/:idEjercicio — pre-carga ese único ejercicio (3×10)
 * y entra directo a fase 2. Si el id no carga (inválido/offline), degrada
 * al selector vacío normal (o a la sesión libre guardada, si hay).
 *
 * La lista de ejercicios se guarda en `lib/sesionLibre` (P68): una recarga
 * retoma la sesión en vez de volver al selector.
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

  // ── Restauración y atajo F4 ───────────────────────────────────────────────
  const [viaAtajo,       setViaAtajo]       = useState(false);
  const [restaurando,    setRestaurando]    = useState(
    () => !!idEjercicioAtajo || cargarConfigLibre() != null,
  );
  const [avisoLibre,     setAvisoLibre]     = useState<string | null>(null);
  const [atajoPendiente, setAtajoPendiente] = useState<Ejercicio | null>(null);
  const [sumarAbierto,   setSumarAbierto]   = useState(false);

  // ── Hoja de salida (P68) ──────────────────────────────────────────────────
  const [salida,          setSalida]          = useState<{ contexto?: string } | null>(null);
  const [guardandoSalida, setGuardandoSalida] = useState(false);
  const [errorSalida,     setErrorSalida]     = useState<string | null>(null);
  /** true antes de navegar desde la hoja, la pantalla de fin o el atajo: el bloqueo del "atrás" no aplica. */
  const saliendo = useRef(false);

  /**
   * Guardado que no confirmó a tiempo (P69). `destino` es a dónde navega "Listo";
   * `null` si ya estamos donde iba (el atajo en espera arrancó).
   */
  const [avisoPendiente, setAvisoPendiente] = useState<{ destino: string | null } | null>(null);

  // Vista del día (P68b): en la sesión libre solo se abre desde el contador.
  const [vistaDiaAbierta, setVistaDiaAbierta] = useState(false);

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

  // Historial del miembro para los deltas del resumen (P70). `null` si no cargó.
  const [historialMiembro, setHistorialMiembro] = useState<Historial[] | null>(null);
  useEffect(() => {
    if (!memberId) return;
    getHistorialMiembro(memberId).then((r) => { if (r.ok) setHistorialMiembro(r.value); });
  }, [memberId]);
  const [saving,    setSaving]    = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [logReps,   setLogReps]   = useState("");
  const [logCarga,  setLogCarga]  = useState("");

  /**
   * Reinicia el estado y sella el inicio de la sesión nueva. Las dos
   * actualizaciones se encolan en orden: el sello se aplica sobre el estado ya
   * reiniciado.
   */
  function reiniciarYSellar() {
    session.reiniciar();
    session.asegurarInicioSesion();
  }

  // Reiniciar (hoja de salida y pantalla de fin): confirma si hay series registradas.
  const reinicio = useConfirmarReinicio(seriesHechasTotales(state), reiniciarYSellar);

  function abrirSalida(contexto?: string) {
    setErrorSalida(null);
    setSalida({ contexto });
  }

  /** Arranca el atajo con un solo ejercicio: sesión nueva y config guardada. */
  function arrancarAtajo(ej: Ejercicio) {
    const defaults = [defaultsParaEj(ej)];
    guardarConfigLibre({ idsEjercicio: [ej.idEjercicio], defaults });
    setEjercicios([ej]);
    setEjDefaults(defaults);
    setAvisoLibre(null);
    reiniciarYSellar();
    setSesionIniciada(true);
  }

  /**
   * Retoma una sesión guardada. Si faltan ejercicios, los saca del progreso
   * también (corre los índices). Con `evaluarVieja`, aplica la regla de sesión
   * vieja (P68) sobre el estado recién cargado.
   */
  function retomar(r: Restauracion<Ejercicio>, inicial: EntrenarState, evaluarVieja: boolean) {
    setEjercicios(r.ejercicios);
    setEjDefaults(r.defaults);
    setSesionIniciada(true);

    let s = inicial;
    if (r.quitados.length > 0) {
      session.quitarBloques(r.quitados, r.ejercicios.length);
      s = quitarBloques(inicial, r.quitados, r.ejercicios.length);
      guardarConfigLibre({ idsEjercicio: r.ejercicios.map((e) => e.idEjercicio), defaults: r.defaults });
      setAvisoLibre(avisoQuitados(r.quitados.length));
    }

    if (evaluarVieja && s.inicioMs != null && sesionVieja(s, Date.now())) {
      if (seriesHechasTotales(s) > 0) abrirSalida(mensajeSesionVieja(s.inicioMs));
      else reiniciarYSellar();
      return;
    }
    session.asegurarInicioSesion();
  }

  // Al montar: restaurar la sesión guardada y resolver el atajo (P68). Todo lo
  // que decide lee el estado recién cargado (`inicial`), una vez por montaje.
  useEffect(() => {
    let activo = true;
    const inicial = state;
    (async () => {
      const config = cargarConfigLibre();
      let restaurada: Restauracion<Ejercicio> | null = null;
      let fallo = false;
      if (config) {
        const r = await getEjerciciosPorId(config.idsEjercicio);
        if (!activo) return;
        if (r.ok) {
          restaurada = restaurarConfig(config, r.value.encontrados);
          if (restaurada.ejercicios.length === 0) {
            borrarConfigLibre();
            restaurada = null;
          }
        } else {
          fallo = true;
        }
      }
      const seriesGuardadas = seriesHechasTotales(inicial);

      if (idEjercicioAtajo) {
        const ra = await getEjercicio(idEjercicioAtajo);
        if (!activo) return;
        if (ra.ok) {
          const ej = ra.value;
          setViaAtajo(true);
          if (config && mismosEjercicios(config.idsEjercicio, [ej.idEjercicio])) {
            // Misma sesión: se retoma sin reiniciar.
            retomar(restaurada ?? { ejercicios: [ej], defaults: config.defaults, quitados: [] }, inicial, true);
          } else if (fallo && seriesGuardadas > 0) {
            // No se pudo leer la sesión guardada: no se pisa con el atajo.
            setAvisoLibre(AVISO_NO_RESTAURADA);
          } else if (restaurada && seriesGuardadas > 0) {
            // Otra sesión con series: primero se guarda o se descarta.
            retomar(restaurada, inicial, false);
            setAtajoPendiente(ej);
            abrirSalida(CONTEXTO_ATAJO);
          } else {
            if (config) borrarConfigLibre();
            arrancarAtajo(ej);
          }
        } else if (restaurada) {
          retomar(restaurada, inicial, true);
        } else if (fallo) {
          setAvisoLibre(AVISO_NO_RESTAURADA);
        }
      } else if (restaurada) {
        retomar(restaurada, inicial, true);
      } else if (fallo) {
        setAvisoLibre(AVISO_NO_RESTAURADA);
      }

      setRestaurando(false);
    })();
    return () => { activo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idEjercicioAtajo]);

  // Sella el inicio del cronómetro de trabajo al montar y al cambiar de bloque.
  useEffect(() => {
    if (!virtualRutina) return;
    session.asegurarInicioSerie(state.bloqueActual);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.bloqueActual, virtualRutina]);

  /** Salida (hoja / fin de sesión): si entramos por el atajo, volvemos al catálogo. */
  function salir() {
    saliendo.current = true;
    if (viaAtajo) navigate(-1);
    else navigate("/entrenar");
  }

  // "Atrás" del sistema (P68b): con la sesión en curso, pasa por la hoja de salida.
  const blocker = useBlocker(({ currentLocation, nextLocation }) =>
    !restaurando
    && sesionIniciada
    && state.inicioMs != null
    && !saliendo.current
    && currentLocation.pathname !== nextLocation.pathname);
  useEffect(() => {
    if (blocker.state !== "blocked") return;
    blocker.reset();
    abrirSalida();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocker]);

  /** Borra el progreso y la lista guardados. Usar justo antes de salir. */
  function cerrarSesionLocal() {
    session.limpiar();
    borrarConfigLibre();
  }

  /** Con un atajo en espera, la sesión guardada se cerró: arranca el atajo en su lugar. */
  function continuarConAtajo(ej: Ejercicio) {
    setSalida(null);
    setAtajoPendiente(null);
    borrarConfigLibre();
    arrancarAtajo(ej);
  }

  function salirSinGuardar() {
    if (atajoPendiente) { continuarConAtajo(atajoPendiente); return; }
    cerrarSesionLocal();
    salir();
  }

  /** Guardar y salir: parcial, salvo que justo esté completa. RPE va en P70. */
  async function guardarYSalir() {
    if (!virtualRutina) return;
    if (!memberId) { setErrorSalida("No se pudo identificar al miembro."); return; }
    setGuardandoSalida(true);
    setErrorSalida(null);
    const result = await finalizarSesion({
      tipo:        "libre",
      nombreLibre: "Sesión libre",
      miembro:     memberId,
      bloques:     session.bloquesRegistro(),
      rpe:         null,
      duracionMin: duracionParcialMin(state) || null,
      completitud: rutinaCompleta(state, virtualRutina) ? "completa" : "parcial",
    });
    setGuardandoSalida(false);
    if (!result.ok) { setErrorSalida(result.error); return; }
    const { pendiente } = result.value;
    if (atajoPendiente) {
      continuarConAtajo(atajoPendiente);
      if (pendiente) setAvisoPendiente({ destino: null });
      return;
    }
    cerrarSesionLocal();
    saliendo.current = true;
    if (pendiente) {
      setSalida(null);
      setAvisoPendiente({ destino: "/historial" });
      return;
    }
    navigate("/historial");
  }

  function seguirEntrenando() {
    setSalida(null);
    setAtajoPendiente(null);
  }

  // ── Handlers fase 1 ───────────────────────────────────────────────────────

  function agregarEjercicio(ej: Ejercicio) {
    setEjercicios((prev) => [...prev, ej]);
    setEjDefaults((prev) => [...prev, defaultsParaEj(ej)]);
    setPickerAbierto(false);
  }

  /** "Sumar otro ejercicio" desde la pantalla de fin: agrega el bloque y sigue la sesión. */
  function sumarYContinuar(ej: Ejercicio) {
    const nuevoIdx      = ejercicios.length;
    const nuevosEj      = [...ejercicios, ej];
    const nuevosDefault = [...ejDefaults, defaultsParaEj(ej)];
    setEjercicios(nuevosEj);
    setEjDefaults(nuevosDefault);
    guardarConfigLibre({ idsEjercicio: nuevosEj.map((e) => e.idEjercicio), defaults: nuevosDefault });
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
    guardarConfigLibre({ idsEjercicio: ejercicios.map((e) => e.idEjercicio), defaults: ejDefaults });
    setAvisoLibre(null);
    reiniciarYSellar();
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

  function handleSerie(rir?: number) {
    session.completarSerie(state.bloqueActual, { ...getLogValues(), ...(rir != null ? { rir } : {}) });
    setLogReps("");
    setLogCarga("");
  }

  const hojaSalida = salida && (
    <HojaSalida
      series={seriesHechasTotales(state)}
      contexto={salida.contexto}
      guardando={guardandoSalida}
      error={errorSalida}
      onGuardar={() => void guardarYSalir()}
      onDescartar={salirSinGuardar}
      onSeguir={seguirEntrenando}
      onReiniciar={() => { seguirEntrenando(); reinicio.pedir(); }}
    />
  );

  const hojaPendiente = avisoPendiente && (
    <GuardadoPendiente
      onListo={() => {
        if (avisoPendiente.destino) navigate(avisoPendiente.destino);
        else setAvisoPendiente(null);
      }}
    />
  );

  const aviso = avisoLibre && (
    <p className="banner banner-amber" style={{ margin: 0 }}>{avisoLibre}</p>
  );

  // ── Render: restaurando la sesión guardada / cargando el atajo ────────────

  if (restaurando) {
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
          <SinConexion />
        </div>

        <div className="workout-content" style={{ padding: "16px 16px 0" }}>
          {aviso}
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

  if (!virtualRutina) return null;

  // Chip del último bloque cerrado (P68b). "+ serie" repite los valores de su última serie.
  const rutinaLibre = virtualRutina;
  const idxCerrado  = state.ultimoBloqueCerrado;
  function chipAnterior(soloExtra: boolean) {
    if (idxCerrado == null) return null;
    if (soloExtra && !bloqueCompleto(state, rutinaLibre, idxCerrado)) return null;
    const b = rutinaLibre.bloques[idxCerrado];
    return (
      <BloqueAnteriorChip
        rutina={rutinaLibre}
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

  const terminada = rutinaTerminada(state, virtualRutina);
  const completa  = rutinaCompleta(state, virtualRutina);
  const bloquesFin = terminada ? session.bloquesRegistro() : [];

  if (terminada) {
    return (
      <div className="workout-screen">
        <div className="workout-header">
          <p className="workout-title">Sesión libre</p>
          <SinConexion />
        </div>
        <ResumenSesion
          rutina={virtualRutina}
          state={state}
          bloques={bloquesFin}
          historial={historialMiembro && historialPrevio(historialMiembro, bloquesFin, state.idSesion)}
          completa={completa}
          saving={saving}
          saveError={saveError}
          onRetomar={session.retomarBloque}
          onEmpezarDeNuevo={reinicio.pedir}
          chipAnterior={chipAnterior(true)}
          accionesExtra={
            <button className="btn-secondary" style={{ width: "100%" }}
              onClick={() => setSumarAbierto(true)}>
              <Plus size={16} /> Sumar otro ejercicio
            </button>
          }
          onFinalizar={async (datos) => {
            if (!memberId) { cerrarSesionLocal(); salir(); return; }
            setSaving(true);
            setSaveError(null);
            const durMin = state.inicioMs != null
              ? Math.round((Date.now() - state.inicioMs) / 60_000)
              : null;
            const result = await finalizarSesion({
              tipo:        "libre",
              nombreLibre: "Sesión libre",
              miembro:     memberId,
              bloques:     bloquesFin,
              ...datos,
              duracionMin: durMin || null,
              completitud: completa ? "completa" : "parcial",
            });
            if (!result.ok) { setSaveError(result.error); setSaving(false); return; }
            cerrarSesionLocal();
            saliendo.current = true;
            if (result.value.pendiente) {
              setAvisoPendiente({ destino: "/historial" });
              return;
            }
            navigate("/historial");
          }}
        />

        {sumarAbierto && (
          <ExercisePicker
            onSelect={sumarYContinuar}
            onClose={() => setSumarAbierto(false)}
          />
        )}

        {hojaSalida}
        {hojaPendiente}
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

  // ── Render: fase 2 — workout en curso ─────────────────────────────────────

  const blq      = virtualRutina.bloques[state.bloqueActual];
  const ejercicio = blq ? ejercicios.find((e) => e.idEjercicio === blq.idEjercicio) : undefined;
  const saltadoActual = state.saltados[state.bloqueActual];
  const mostrarChipAnterior =
    !state.descanso && idxCerrado != null && idxCerrado !== state.bloqueActual;

  function handleSerieExtra() {
    session.completarSerie(state.bloqueActual, getLogValues(), { extra: true });
    setLogReps("");
    setLogCarga("");
  }

  return (
    <div className="workout-screen">
      <div className="workout-header">
        <button className="btn-icon-sm" onClick={() => abrirSalida()} title="Salir">
          <X size={18} />
        </button>
        <p className="workout-title">Sesión libre</p>
        <TiempoTotal startMs={state.inicioMs} estimadoMin={virtualRutina.duracionEstimadaMin} />
        <button className="btn-icon-sm" onClick={session.toggleModo}
          title={state.modoVista === "guiada" ? "Modo scroll" : "Modo guiado"}>
          {state.modoVista === "guiada" ? <AlignJustify size={18} /> : <Zap size={18} />}
        </button>
        <SinConexion />
      </div>

      {state.modoVista === "scroll" && (
        <div className="workout-content">
          {aviso}
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
            {aviso}
            <DescansoTimer
              state={state}
              onSkip={session.saltarDescanso}
              onAjustar={session.ajustarDescanso}
              aContinuacion={aContinuacionDescanso(state, virtualRutina)}
            />
            {mostrarChipAnterior && chipAnterior(false)}
            {!state.descanso && (
              <SerieTimer
                state={state}
                rutina={virtualRutina}
                onAjustar={(d) => session.ajustarTrabajo(state.bloqueActual, d)}
              />
            )}
            {!state.descanso && (
              <BloqueGuiado
                bloque={blq}
                bloqueIdx={state.bloqueActual}
                total={virtualRutina.bloques.length}
                seriesHechas={state.seriesHechas[state.bloqueActual] ?? 0}
                ejercicio={ejercicio}
                onIrASerie={(i) => void i}
                aContinuacion={nombreSiguientePendiente(state, virtualRutina, state.bloqueActual)}
                saltado={saltadoActual}
                onAbrirDia={() => setVistaDiaAbierta(true)}
                onRetomar={() => session.retomarBloque(state.bloqueActual)}
              />
            )}
          </div>

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
              onEjercicioChange={(ej) =>
                setEjercicios((prev) => prev.map((e) => (e.idEjercicio === ej.idEjercicio ? ej : e)))}
            />
          )}
        </>
      )}

      {vistaDiaAbierta && (
        <VistaDia
          titulo="Sesión libre"
          minutos={null}
          rutina={virtualRutina}
          state={state}
          onIr={(i) => { session.irABloque(i); setVistaDiaAbierta(false); }}
          onCerrar={() => setVistaDiaAbierta(false)}
        />
      )}
      {hojaSalida}
      {hojaPendiente}
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
