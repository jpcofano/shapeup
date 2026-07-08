// ════════════════════════════════════════════════════════════════════════════
//  lib/entrenarState.ts — INTELIGENCIA del flujo guiado "Entrenar"
//
//  Análogo de useCocinarState.ts + la lógica de navegación de Cocinar.tsx, pero
//  consciente de SERIES y DESCANSOS. Acá vive la "máquina" de qué hacer y cuándo.
//
//  Diseño: funciones PURAS sobre un estado serializable. Code las envuelve en un
//  hook React `useEntrenarState(sessionKey)` que:
//    1) carga estado inicial con loadEntrenarState() (localStorage, como el original),
//    2) en cada acción llama al reducer y persiste con persistEntrenarState(),
//    3) (opcional) espeja `progreso` a Firestore en la SesionProgramada para
//       reanudar en otro dispositivo.
//
//  El cronómetro de descanso reusa EXACTAMENTE el patrón de StepTimer.tsx
//  (Web Audio + Notification + descartar timers vencidos al montar). Acá solo
//  se modela el ESTADO del descanso (startMs/durMs); el render/beep es del componente.
// ════════════════════════════════════════════════════════════════════════════

import type {
  Rutina, BloqueEjercicio, Prescripcion, SerieRegistro, Modalidad, Ejercicio,
} from "../types/models";
import { seriesObjetivo } from "./metricas";
export { seriesObjetivo } from "./metricas";

// ─── Estado (serializable; espejo de ProgresoSesion) ──────────────────────────
export interface DescansoActivo {
  bloqueIdx: number;
  startMs: number;
  durMs: number;
}

export interface EntrenarState {
  modoVista: "guiada" | "scroll";
  bloqueActual: number;                       // índice en rutina.bloques
  seriesHechas: Record<number, number>;       // bloqueIdx → series completadas
  registro: Record<number, SerieRegistro[]>;  // bloqueIdx → log real por serie (opcional)
  descanso: DescansoActivo | null;            // cronómetro de descanso en curso
  /** Epoch ms cuando empieza la serie actual de cada bloque (set al saltarDescanso). */
  serieInicioMs: Record<number, number>;
  /** Último reps/carga ingresado por bloque (prefill de la próxima serie). */
  ultimoLog: Record<number, { reps?: number; cargaKg?: number }>;
}

export const INITIAL_ENTRENAR_STATE: EntrenarState = {
  modoVista: "guiada",
  bloqueActual: 0,
  seriesHechas: {},
  registro: {},
  descanso: null,
  serieInicioMs: {},
  ultimoLog: {},
};

// ════════════════════════════════════════════════════════════════════════════
//  Helpers de prescripción — "¿cuántas series tiene este bloque?" etc.
//  Encapsula la unión discriminada por modalidad.
// ════════════════════════════════════════════════════════════════════════════


/** Descanso (seg) tras completar una serie de este bloque. 0 = sin descanso. */
export function descansoSeg(p: Prescripcion): number {
  switch (p.modalidad) {
    case "Fuerza":      return p.descansoSeg;
    case "Isométrico":  return p.descansoSeg;
    case "Movilidad":   return p.descansoSeg;
    case "Cardio":      return p.formato === "Intervalos" ? (p.descansoSeg ?? 0) : 0;
  }
}

/**
 * Valores por defecto para el log rápido de la serie siguiente.
 * Orden de prioridad: último registrado > prescripción > vacío.
 * Solo aplica a bloques de modalidad Fuerza.
 */
export function valorPrefillSerie(
  rutina: Rutina,
  idx: number,
  state: EntrenarState,
): { reps?: number; cargaKg?: number } {
  const bloque = rutina.bloques[idx];
  if (!bloque || bloque.prescripcion.modalidad !== "Fuerza") return {};
  const previo = state.ultimoLog[idx];
  if (previo) return previo;
  const p = bloque.prescripcion;
  return {
    ...(p.repsObjetivo.value > 0 ? { reps: p.repsObjetivo.value } : {}),
    ...(p.cargaKg != null        ? { cargaKg: p.cargaKg }         : {}),
  };
}

/** "N min" si `seg` es múltiplo de 60, si no "N s". Para labels legibles. */
function fmtTrabajo(seg: number): string {
  return seg % 60 === 0 ? `${seg / 60} min` : `${seg} s`;
}

/** Texto del objetivo de la serie actual, para mostrar en el modo guiado. */
export function objetivoSerieLabel(p: Prescripcion): string {
  switch (p.modalidad) {
    case "Fuerza": {
      const carga = p.cargaKg != null ? `${p.cargaKg} kg`
        : p.porcentajeRM != null ? `${p.porcentajeRM}% 1RM`
        : "peso a elección";
      const reps = p.alFallo ? "al fallo" : `${p.repsObjetivo.raw} reps`;
      const rir = p.rirObjetivo != null ? ` · RIR ${p.rirObjetivo}` : "";
      return `${reps} · ${carga}${rir}`;
    }
    case "Isométrico":
      return `${p.duracionHoldSeg} s${p.porLado ? " por lado" : ""}`;
    case "Movilidad":
      return p.duracionHoldSeg != null
        ? `${p.duracionHoldSeg} s${p.porLado ? " por lado" : ""}`
        : `${p.repsObjetivo?.raw ?? "—"} reps${p.porLado ? " por lado" : ""}`;
    case "Cardio":
      if (p.formato === "Intervalos") {
        if (p.juegoSugerido) {
          return `${fmtTrabajo(p.trabajoSeg ?? 0)} de juego · ${p.descansoSeg ?? 0} s de descanso`;
        }
        return `${p.trabajoSeg ?? 0} s fuerte / ${p.descansoSeg ?? 0} s suave`;
      }
      return p.duracionMin != null ? `${p.duracionMin} min`
        : p.distanciaKm != null ? `${p.distanciaKm} km` : "cardio";
  }
}

/**
 * Segundos de trabajo cronometrable de una serie según modalidad.
 * `null` cuando la modalidad no tiene cuenta regresiva de trabajo (Fuerza,
 * Movilidad) o cuando la prescripción no trae el dato necesario.
 */
export function trabajoObjetivoSeg(p: Prescripcion): number | null {
  switch (p.modalidad) {
    case "Cardio":
      return p.formato === "Intervalos"
        ? p.trabajoSeg ?? null
        : p.duracionMin != null ? p.duracionMin * 60 : null;
    case "Isométrico":
      return p.duracionHoldSeg;
    default:
      return null;
  }
}

/**
 * Milisegundos restantes de trabajo del bloque actual (`state.bloqueActual`).
 * `null` si el bloque no tiene trabajo cronometrable o todavía no arrancó
 * (sin `serieInicioMs`). `0` si el objetivo ya venció.
 */
export function trabajoRestanteMs(
  state: EntrenarState,
  rutina: Rutina,
  ahoraMs: number = Date.now(),
): number | null {
  const idx = state.bloqueActual;
  const bloque = rutina.bloques[idx];
  if (!bloque) return null;
  const objetivo = trabajoObjetivoSeg(bloque.prescripcion);
  if (objetivo == null) return null;
  const inicio = state.serieInicioMs[idx];
  if (inicio == null) return null;
  return Math.max(0, inicio + objetivo * 1000 - ahoraMs);
}

// ════════════════════════════════════════════════════════════════════════════
//  Derivados de estado
// ════════════════════════════════════════════════════════════════════════════

/** ¿El bloque está 100% completo (todas sus series hechas)? */
export function bloqueCompleto(state: EntrenarState, rutina: Rutina, idx: number): boolean {
  const b = rutina.bloques[idx];
  if (!b) return false;
  return (state.seriesHechas[idx] ?? 0) >= seriesObjetivo(b.prescripcion);
}

/** Cantidad de bloques completos. */
export function bloquesCompletados(state: EntrenarState, rutina: Rutina): number {
  return rutina.bloques.reduce((n, _b, idx) => n + (bloqueCompleto(state, rutina, idx) ? 1 : 0), 0);
}

/** ¿La rutina entera está completa? */
export function rutinaCompleta(state: EntrenarState, rutina: Rutina): boolean {
  return rutina.bloques.length > 0 && bloquesCompletados(state, rutina) === rutina.bloques.length;
}

/** Próximo bloque incompleto después de `desde` (para auto-avance). -1 si no hay. */
export function proximoBloqueIncompleto(state: EntrenarState, rutina: Rutina, desde: number): number {
  for (let i = desde + 1; i < rutina.bloques.length; i++) {
    if (!bloqueCompleto(state, rutina, i)) return i;
  }
  // fallback: cualquier incompleto desde el inicio (si quedaron salteados)
  for (let i = 0; i < rutina.bloques.length; i++) {
    if (!bloqueCompleto(state, rutina, i)) return i;
  }
  return -1;
}

/** Tiempo restante del descanso (ms). 0 si no hay descanso o ya venció. */
export function descansoRestanteMs(state: EntrenarState, now: number = Date.now()): number {
  if (!state.descanso) return 0;
  return Math.max(0, state.descanso.startMs + state.descanso.durMs - now);
}

// ════════════════════════════════════════════════════════════════════════════
//  REDUCER — transiciones puras. Cada una devuelve un EntrenarState nuevo.
// ════════════════════════════════════════════════════════════════════════════

/**
 * Completa la serie en curso del bloque `idx`.
 *  - Suma 1 a seriesHechas[idx] y guarda el registro real (opcional).
 *  - Si quedan series → arranca el cronómetro de descanso (si descanso > 0).
 *  - Si era la última → cancela descanso y avanza al próximo bloque incompleto.
 *
 * `reg` es el log opcional de la serie (reps/carga reales). Si no se captura,
 * se guarda { serie, completada:true } para poder reconstruir el Historial.
 */
export function completarSerie(
  state: EntrenarState,
  rutina: Rutina,
  idx: number,
  reg?: Partial<SerieRegistro>,
  now: number = Date.now(),
): EntrenarState {
  const bloque = rutina.bloques[idx];
  if (!bloque) return state;

  const objetivo = seriesObjetivo(bloque.prescripcion);
  const hechasPrev = state.seriesHechas[idx] ?? 0;
  if (hechasPrev >= objetivo) return state; // ya estaba completo

  const hechas = hechasPrev + 1;
  const serieNum = hechas;

  // Registro real (espejo para Historial) — incluye timestamps de la serie
  const prevRegistro = state.registro[idx] ?? [];
  const nuevoRegistro: SerieRegistro[] = [
    ...prevRegistro,
    {
      serie: serieNum,
      completada: true,
      inicioMs: state.serieInicioMs[idx],
      finMs: now,
      ...reg,
    },
  ];

  // Limpiar serieInicioMs para este bloque (ya fue consumido)
  const serieInicioMs = { ...state.serieInicioMs };
  delete serieInicioMs[idx];

  // Actualizar ultimoLog[idx] con los valores registrados (para prefill de la próxima serie)
  const prevLog = state.ultimoLog[idx] ?? {};
  const nuevoLog = {
    ...(reg?.reps    != null ? { reps:    reg.reps }    : prevLog.reps    != null ? { reps:    prevLog.reps }    : {}),
    ...(reg?.cargaKg != null ? { cargaKg: reg.cargaKg } : prevLog.cargaKg != null ? { cargaKg: prevLog.cargaKg } : {}),
  };

  const next: EntrenarState = {
    ...state,
    seriesHechas: { ...state.seriesHechas, [idx]: hechas },
    registro: { ...state.registro, [idx]: nuevoRegistro },
    serieInicioMs,
    ultimoLog: Object.keys(nuevoLog).length > 0
      ? { ...state.ultimoLog, [idx]: nuevoLog }
      : state.ultimoLog,
  };

  if (hechas < objetivo) {
    // Quedan series → descanso
    const d = descansoSeg(bloque.prescripcion);
    next.descanso = d > 0 ? { bloqueIdx: idx, startMs: now, durMs: d * 1000 } : null;
    return next;
  }

  // Bloque completo → cortar descanso y avanzar
  next.descanso = null;
  const prox = proximoBloqueIncompleto(next, rutina, idx);
  if (prox >= 0) next.bloqueActual = prox;
  return next;
}

/** Deshace la última serie marcada del bloque `idx` (corrige mis-taps). */
export function deshacerSerie(state: EntrenarState, idx: number): EntrenarState {
  const hechas = state.seriesHechas[idx] ?? 0;
  if (hechas <= 0) return state;
  const reg = (state.registro[idx] ?? []).slice(0, -1);
  // Limpiar el inicio sellado (la serie deshecha ya no cuenta)
  const serieInicioMs = { ...state.serieInicioMs };
  delete serieInicioMs[idx];
  return {
    ...state,
    seriesHechas: { ...state.seriesHechas, [idx]: hechas - 1 },
    registro: { ...state.registro, [idx]: reg },
    serieInicioMs,
    descanso: state.descanso?.bloqueIdx === idx ? null : state.descanso,
  };
}

/** Saltar el descanso en curso. Sella el inicio de la próxima serie (now). */
export function saltarDescanso(state: EntrenarState, now: number = Date.now()): EntrenarState {
  if (!state.descanso) return state;
  const { bloqueIdx } = state.descanso;
  return {
    ...state,
    descanso: null,
    serieInicioMs: { ...state.serieInicioMs, [bloqueIdx]: now },
  };
}

/** Extender/recortar el descanso en curso (delta en segundos, +/-). */
export function ajustarDescanso(state: EntrenarState, deltaSeg: number): EntrenarState {
  if (!state.descanso) return state;
  const durMs = Math.max(0, state.descanso.durMs + deltaSeg * 1000);
  return { ...state, descanso: { ...state.descanso, durMs } };
}

/**
 * Sella el inicio de la serie del bloque `idx` si todavía no lo tiene (y no
 * hay descanso en curso). Llamar al montar la sesión y al cambiar de bloque:
 * hoy `serieInicioMs` solo se setea al salir del descanso, así que la
 * primera serie de la sesión (o de un bloque al que se entra directo) queda
 * sin inicio. No pisa un inicio ya sellado (volver atrás con los dots no
 * reinicia el reloj de trabajo).
 */
export function asegurarInicioSerie(
  state: EntrenarState,
  idx: number,
  now: number = Date.now(),
): EntrenarState {
  if (state.descanso) return state;
  if (state.serieInicioMs[idx] != null) return state;
  return { ...state, serieInicioMs: { ...state.serieInicioMs, [idx]: now } };
}

/**
 * Extender/recortar el cronómetro de trabajo en curso del bloque `idx`
 * (delta en segundos, +/-). Espejo de `ajustarDescanso`: como el objetivo
 * de trabajo sale de la prescripción (no del estado), "sumar tiempo" es
 * correr el inicio sellado hacia adelante. No-op si el bloque no arrancó.
 */
export function ajustarTrabajo(state: EntrenarState, idx: number, deltaSeg: number): EntrenarState {
  const inicio = state.serieInicioMs[idx];
  if (inicio == null) return state;
  return { ...state, serieInicioMs: { ...state.serieInicioMs, [idx]: inicio + deltaSeg * 1000 } };
}

/** Ir a un bloque puntual (tap en el dot de progreso). */
export function irABloque(state: EntrenarState, idx: number): EntrenarState {
  return { ...state, bloqueActual: idx };
}

/** Bloque siguiente (sin completar nada). */
export function siguienteBloque(state: EntrenarState, rutina: Rutina): EntrenarState {
  const idx = Math.min(rutina.bloques.length - 1, state.bloqueActual + 1);
  return { ...state, bloqueActual: idx };
}

/** Bloque anterior. */
export function anteriorBloque(state: EntrenarState): EntrenarState {
  return { ...state, bloqueActual: Math.max(0, state.bloqueActual - 1) };
}

/** Alternar guiada ↔ scroll (al volver a guiada, salta al primer incompleto). */
export function toggleModoVista(state: EntrenarState, rutina: Rutina): EntrenarState {
  if (state.modoVista === "guiada") return { ...state, modoVista: "scroll" };
  const prox = proximoBloqueIncompleto(state, rutina, -1);
  return { ...state, modoVista: "guiada", bloqueActual: prox >= 0 ? prox : 0 };
}

// ════════════════════════════════════════════════════════════════════════════
//  Persistencia (idéntico patrón a useCocinarState.ts: localStorage + descarte
//  de descansos vencidos al cargar). sessionKey ej.: `sesion:${idSesion}`.
// ════════════════════════════════════════════════════════════════════════════
function lsKey(sessionKey: string): string {
  return `entrenar:${sessionKey}`;
}

export function loadEntrenarState(sessionKey: string): EntrenarState {
  try {
    const raw = localStorage.getItem(lsKey(sessionKey));
    if (!raw) return { ...INITIAL_ENTRENAR_STATE };
    const parsed = JSON.parse(raw) as EntrenarState;
    // Descartar descanso vencido al montar (como los timers en el original)
    const descanso = parsed.descanso && parsed.descanso.startMs + parsed.descanso.durMs > Date.now()
      ? parsed.descanso
      : null;
    return { ...INITIAL_ENTRENAR_STATE, ...parsed, descanso };
  } catch {
    return { ...INITIAL_ENTRENAR_STATE };
  }
}

export function persistEntrenarState(sessionKey: string, state: EntrenarState): void {
  try {
    localStorage.setItem(lsKey(sessionKey), JSON.stringify(state));
  } catch {
    /* ignore quota */
  }
}

export function clearEntrenarState(sessionKey: string): void {
  try { localStorage.removeItem(lsKey(sessionKey)); } catch { /* ignore */ }
}

// ════════════════════════════════════════════════════════════════════════════
//  Cierre de sesión → arma el array de BloqueRegistro para el Historial.
//  Lo consume data/sesiones.finalizarSesion(), análogo a marcarCocinada +
//  _cerrarEvaluacion del original.
// ════════════════════════════════════════════════════════════════════════════
export function construirBloquesRegistro(state: EntrenarState, rutina: Rutina) {
  return rutina.bloques.map((b, idx) => ({
    orden: b.orden,
    idEjercicio: b.idEjercicio,
    nombreEjercicio: b.nombreEjercicio,
    modalidad: b.modalidad as Modalidad,
    series: state.registro[idx]
      ?? Array.from({ length: state.seriesHechas[idx] ?? 0 }, (_v, i) => ({
        serie: i + 1, completada: true,
      })),
  }));
}

// ════════════════════════════════════════════════════════════════════════════
//  Sesión libre — construcción de bloques y rutina virtual
// ════════════════════════════════════════════════════════════════════════════

/** Prescripción por defecto para un ejercicio ad-hoc en sesión libre. */
export function buildBloqueLibre(ej: Ejercicio, orden: number): BloqueEjercicio {
  let prescripcion: Prescripcion;
  switch (ej.modalidad) {
    case "Cardio":
      prescripcion = { modalidad: "Cardio", formato: "Continuo", duracionMin: 20 };
      break;
    case "Movilidad":
      prescripcion = {
        modalidad: "Movilidad", rondas: 3, porLado: false,
        descansoSeg: ej.descansoSugeridoSeg || 30,
      };
      break;
    case "Isométrico":
      prescripcion = {
        modalidad: "Isométrico", series: 3, duracionHoldSeg: 30, porLado: false,
        descansoSeg: ej.descansoSugeridoSeg || 60,
      };
      break;
    default: // Fuerza
      prescripcion = {
        modalidad: "Fuerza", series: 3,
        repsObjetivo: { value: 10, raw: "10" },
        descansoSeg: ej.descansoSugeridoSeg || 90,
      };
  }
  return {
    orden,
    idEjercicio:     ej.idEjercicio,
    nombreEjercicio: ej.nombre,
    modalidad:       ej.modalidad,
    prescripcion,
  };
}

/**
 * Crea una Rutina virtual (solo en memoria, sin Firestore) a partir de
 * BloqueEjercicio[] ad-hoc. Permite reusar el reducer y useEntrenarState
 * sin modificación para la sesión libre.
 */
export function buildVirtualRutina(bloques: BloqueEjercicio[]): Rutina {
  return {
    idRutina: "libre",
    nombre: "Sesión libre",
    nombreCanonico: "sesion libre",
    foco: "Cuerpo completo",
    objetivo: "General / salud",
    nivel: "Principiante",
    nivelOrden: 1,
    lugar: "Casa",
    equipoNecesario: [],
    duracionEstimadaMin: null,
    totalSeries: null,
    bloques,
    vecesEntrenada: 0,
  };
}

// Re-export para que el componente no tenga que conocer la forma del bloque.
export type { BloqueEjercicio };
