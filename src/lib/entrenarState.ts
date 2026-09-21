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
  Rutina, BloqueEjercicio, BloqueRegistro, Prescripcion, SerieRegistro, Modalidad, Ejercicio,
  MotivoSalto, Lugar, MotivoSustitucion, ZonaMolestia,
} from "../types/models";
import { seriesObjetivo } from "./metricas";
import { e1rmKg } from "./resumenSesion";
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
  /**
   * Epoch ms del inicio de la sesión. Persistido para que reanudar no reinicie
   * el reloj (`TiempoTotal`) ni acorte `duracionRealMin`. `null` hasta sellarlo
   * con `asegurarInicioSesion`.
   */
  inicioMs: number | null;
  /**
   * `SesionProgramada` de esta sesión en /sesiones (P68). Se crea una sola vez
   * y se reusa al reanudar; reiniciar la conserva. `null` en la sesión libre.
   */
  idSesion: string | null;
  /** Bloques salteados → motivo (`null` = salteado sin motivo). P68b. */
  saltados: Record<number, MotivoSalto | null>;
  /**
   * Último bloque que se dejó por completarlo o saltearlo (chip "+ serie de…" /
   * "Saltaste… · Volver"). Se limpia al trabajar otro bloque, al navegar o al retomar.
   */
  ultimoBloqueCerrado: number | null;
  /**
   * Dónde se está entrenando esta sesión (P72). `null` hasta sellarlo con
   * `sellarLugar` al montar. Reiniciar lo conserva: seguís en el mismo lugar.
   * En P72 no filtra nada todavía — lo usa la sustitución de P73.
   */
  lugar: Lugar | null;
  /**
   * Sustituciones de esta sesión, por índice de bloque (P73).
   *
   * Vive en el estado y no en la rutina: la rutina no se toca, lo que cambia
   * es lo que hiciste hoy.
   */
  sustituciones: Record<number, SustitucionBloque>;
  /**
   * Parámetros de VR con los que se está jugando esta sesión (P79, ADR #039).
   *
   * Salen de la historia, no de la rutina: `/rutinas` es compartida y no se
   * muta. `null` hasta sellarlos al montar, o si la rutina no es de VR.
   */
  prescripcionVR: { rondas: number; trabajoSeg: number; descansoSeg: number } | null;
  /** Qué sugirió la app al empezar y qué eligió la persona (P79). */
  progresionVR: {
    palanca: "subir-dificultad" | "recortar-descanso" | "sumar-ronda" | "mantener" | "bajar";
    aceptada: boolean;
    fuente: "fc" | "descanso" | "manual";
  } | null;
}

/** Un ejercicio cambiado por otro en el momento (P73). */
export interface SustitucionBloque {
  idOriginal: string;
  idNuevo: string;
  nombreNuevo: string;
  motivo: MotivoSustitucion;
  zona?: ZonaMolestia;
  /** Posición en el ranking, desde 1. `0` = vino del buscador. */
  posicion: number;
}

export const INITIAL_ENTRENAR_STATE: EntrenarState = {
  modoVista: "guiada",
  bloqueActual: 0,
  seriesHechas: {},
  registro: {},
  descanso: null,
  serieInicioMs: {},
  ultimoLog: {},
  inicioMs: null,
  idSesion: null,
  saltados: {},
  ultimoBloqueCerrado: null,
  lugar: null,
  sustituciones: {},
  prescripcionVR: null,
  progresionVR: null,
};

/**
 * Sella los parámetros de VR de la sesión y la decisión tomada (P79).
 *
 * Una vez sellados no se vuelven a tocar: la sesión entera se juega con los
 * mismos. Reiniciar los conserva, igual que el lugar.
 */
export function sellarProgresionVR(
  state: EntrenarState,
  prescripcion: EntrenarState["prescripcionVR"],
  progresion: EntrenarState["progresionVR"],
): EntrenarState {
  if (state.prescripcionVR) return state;
  return { ...state, prescripcionVR: prescripcion, progresionVR: progresion };
}

/** Etiquetas de los motivos de sustitución, en el orden en que se ofrecen (P73). */
export const MOTIVOS_SUSTITUCION: ReadonlyArray<readonly [MotivoSustitucion, string]> = [
  ["dolor",          "Me duele algo"],
  ["equipo-ocupado", "Equipo ocupado"],
  ["no-me-sale",     "No me sale"],
  ["otro",           "Otro"],
];

/**
 * Registra una sustitución en un bloque (P73).
 *
 * **Borra las series registradas de ese bloque**: eran de otro ejercicio, y
 * dejarlas sería atribuirle a la sentadilla búlgara las repeticiones que
 * hiciste en prensa. También limpia el cronómetro de serie.
 */
export function sustituirBloque(
  state: EntrenarState,
  idx: number,
  datos: SustitucionBloque,
): EntrenarState {
  const registro = { ...state.registro };
  const seriesHechas = { ...state.seriesHechas };
  const serieInicioMs = { ...state.serieInicioMs };
  const ultimoLog = { ...state.ultimoLog };
  delete registro[idx];
  delete seriesHechas[idx];
  delete serieInicioMs[idx];
  delete ultimoLog[idx];

  return {
    ...state,
    registro, seriesHechas, serieInicioMs, ultimoLog,
    sustituciones: { ...state.sustituciones, [idx]: datos },
  };
}

/** Vuelve al ejercicio original. Borra las series por el mismo motivo (P73). */
export function deshacerSustitucion(state: EntrenarState, idx: number): EntrenarState {
  if (!state.sustituciones[idx]) return state;
  const sustituciones = { ...state.sustituciones };
  delete sustituciones[idx];

  const registro = { ...state.registro };
  const seriesHechas = { ...state.seriesHechas };
  const serieInicioMs = { ...state.serieInicioMs };
  const ultimoLog = { ...state.ultimoLog };
  delete registro[idx];
  delete seriesHechas[idx];
  delete serieInicioMs[idx];
  delete ultimoLog[idx];

  return { ...state, registro, seriesHechas, serieInicioMs, ultimoLog, sustituciones };
}

/** Etiquetas de los motivos de salto, en el orden en que se ofrecen. */
export const MOTIVOS_SALTO: ReadonlyArray<readonly [MotivoSalto, string]> = [
  ["dolor",          "Dolor"],
  ["equipo-ocupado", "Equipo ocupado"],
  ["sin-tiempo",     "Sin tiempo"],
  ["otro",           "Otro"],
];

/** "Dolor", "Equipo ocupado"… o `null` si el salto no tiene motivo. */
export function motivoSaltoLabel(m: MotivoSalto | null | undefined): string | null {
  if (!m) return null;
  return MOTIVOS_SALTO.find(([v]) => v === m)?.[1] ?? null;
}

/**
 * Dos registros de serie más cerca que esto son el mismo toque, no dos series
 * (P79b). El segundo se descarta.
 */
export const DOBLE_TOQUE_MS = 3000;

/** Una sesión abierta hace más de esto se considera abandonada (P68). */
export const UMBRAL_SESION_VIEJA_MS = 12 * 60 * 60 * 1000;

/** Último recurso al sellar el lugar: ni la rutina ni el perfil lo dicen (P72). */
export const LUGAR_SESION_POR_DEFECTO: Lugar = "Casa";

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

/** ¿La rutina entera está completa (todos los bloques con sus series)? Decide la completitud. */
export function rutinaCompleta(state: EntrenarState, rutina: Rutina): boolean {
  return rutina.bloques.length > 0 && bloquesCompletados(state, rutina) === rutina.bloques.length;
}

/** ¿El bloque se salteó? */
export function bloqueSaltado(state: EntrenarState, idx: number): boolean {
  return state.saltados[idx] !== undefined;
}

/** Bloque resuelto: completo o salteado. */
export function bloqueResuelto(state: EntrenarState, rutina: Rutina, idx: number): boolean {
  return bloqueCompleto(state, rutina, idx) || bloqueSaltado(state, idx);
}

/** Todos los bloques resueltos: decide cuándo se muestra la pantalla de fin (P68b). */
export function rutinaTerminada(state: EntrenarState, rutina: Rutina): boolean {
  return rutina.bloques.length > 0
    && rutina.bloques.every((_b, idx) => bloqueResuelto(state, rutina, idx));
}

/**
 * Próximo bloque pendiente (ni completo ni salteado) después de `desde`, para el
 * auto-avance. Si no hay más adelante, vuelve a buscar desde el principio (puede
 * devolver `desde` mismo). -1 si todos están resueltos.
 */
export function proximoBloqueIncompleto(state: EntrenarState, rutina: Rutina, desde: number): number {
  for (let i = desde + 1; i < rutina.bloques.length; i++) {
    if (!bloqueResuelto(state, rutina, i)) return i;
  }
  // fallback: cualquier pendiente desde el inicio
  for (let i = 0; i < rutina.bloques.length; i++) {
    if (!bloqueResuelto(state, rutina, i)) return i;
  }
  return -1;
}

/** Próximo pendiente distinto de `idx` ("A continuación"). -1 si no hay otro. */
export function siguientePendiente(state: EntrenarState, rutina: Rutina, idx: number): number {
  const prox = proximoBloqueIncompleto(state, rutina, idx);
  return prox === idx ? -1 : prox;
}

/** Nombre del próximo pendiente después de `idx`, o `null` si es el último. */
export function nombreSiguientePendiente(state: EntrenarState, rutina: Rutina, idx: number): string | null {
  const s = siguientePendiente(state, rutina, idx);
  return s >= 0 ? rutina.bloques[s].nombreEjercicio : null;
}

/**
 * "A continuación" del descanso: solo en el descanso previo a la última serie
 * del bloque, con el nombre del próximo pendiente. `undefined` en cualquier otro caso.
 */
export function aContinuacionDescanso(state: EntrenarState, rutina: Rutina): string | undefined {
  const d = state.descanso;
  if (!d) return undefined;
  const b = rutina.bloques[d.bloqueIdx];
  if (!b) return undefined;
  const hechas = state.seriesHechas[d.bloqueIdx] ?? 0;
  if (hechas !== seriesObjetivo(b.prescripcion) - 1) return undefined;
  return nombreSiguientePendiente(state, rutina, d.bloqueIdx) ?? undefined;
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
 *
 * `ultimoBloqueCerrado` (P68b): una serie de otro bloque lo limpia; completar
 * el bloque lo setea en `idx`.
 *
 * Con `{ extra: true }` (P68b) registra aunque el bloque ya esté completo —
 * serie de más, numerada a continuación—, sin descanso, sin avanzar y sin tocar
 * `ultimoBloqueCerrado`. Si es el bloque actual, sella el inicio de la próxima
 * extra en `now` (no hay descanso que lo selle).
 */
export function completarSerie(
  state: EntrenarState,
  rutina: Rutina,
  idx: number,
  reg?: Partial<SerieRegistro>,
  now: number = Date.now(),
  opts: { extra?: boolean } = {},
): EntrenarState {
  const bloque = rutina.bloques[idx];
  if (!bloque) return state;

  const objetivo = seriesObjetivo(bloque.prescripcion);
  const hechasPrev = state.seriesHechas[idx] ?? 0;
  const extra = opts.extra === true;
  if (hechasPrev >= objetivo && !extra) return state; // ya estaba completo

  // Doble toque (P79b): dos "Serie hecha" a menos de 3 s es el botón, no una
  // serie. Pasó de verdad — Creed registró 8 rondas para una rutina de 5, con
  // rondas de 1 y 2 segundos en el medio, y la progresión calculó un descanso
  // real de 1 s sobre esa basura. Vale para todas las modalidades: una serie de
  // fuerza tampoco se hace en 3 segundos.
  //
  // Se ignora en silencio: no hay nada que mostrar, porque no pasó nada.
  const ultimaRegistrada = (state.registro[idx] ?? []).at(-1);
  if (ultimaRegistrada?.finMs != null) {
    const delta = now - ultimaRegistrada.finMs;
    // Solo cuenta como doble toque lo que llega DESPUÉS y muy pegado. Un delta
    // negativo es un reloj desordenado, no dos toques: no se descarta.
    if (delta >= 0 && delta < DOBLE_TOQUE_MS) return state;
  }

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

  if (extra) {
    if (idx === state.bloqueActual) next.serieInicioMs = { ...serieInicioMs, [idx]: now };
    return next;
  }

  if (state.ultimoBloqueCerrado != null && state.ultimoBloqueCerrado !== idx) {
    next.ultimoBloqueCerrado = null;
  }

  if (hechas < objetivo) {
    // Quedan series → descanso
    const d = descansoSeg(bloque.prescripcion);
    next.descanso = d > 0 ? { bloqueIdx: idx, startMs: now, durMs: d * 1000 } : null;
    return next;
  }

  // Bloque completo → cortar descanso y avanzar
  next.descanso = null;
  next.ultimoBloqueCerrado = idx;
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

/**
 * Extender/recortar el descanso (delta en segundos, +/-).
 *  - Mientras corre: suma o resta a `durMs`, sin bajar de 0.
 *  - Ya terminado y delta > 0: arranca una cuenta nueva de `delta` desde `now`
 *    (`durMs = (now − startMs) + delta`). Sumar a un `durMs` vencido dejaba el
 *    descanso en 0 y la alarma volvía a sonar.
 */
export function ajustarDescanso(
  state: EntrenarState,
  deltaSeg: number,
  now: number = Date.now(),
): EntrenarState {
  if (!state.descanso) return state;
  const { startMs, durMs } = state.descanso;
  const deltaMs = deltaSeg * 1000;
  if (deltaMs > 0 && startMs + durMs <= now) {
    return { ...state, descanso: { ...state.descanso, durMs: now - startMs + deltaMs } };
  }
  return { ...state, descanso: { ...state.descanso, durMs: Math.max(0, durMs + deltaMs) } };
}

/** Sella el inicio de la sesión si todavía no lo tiene. No pisa uno existente. */
export function asegurarInicioSesion(state: EntrenarState, now: number = Date.now()): EntrenarState {
  if (state.inicioMs != null) return state;
  return { ...state, inicioMs: now };
}

/** Total de series marcadas como hechas en toda la sesión. */
export function seriesHechasTotales(state: EntrenarState): number {
  return Object.values(state.seriesHechas).reduce((acc, n) => acc + n, 0);
}

/** Estado de una sesión empezada de nuevo: todo en cero, pero la misma `SesionProgramada`. */
export function estadoReiniciado(state: EntrenarState): EntrenarState {
  // Los parámetros de VR se conservan igual que el lugar: reiniciar la sesión
  // no vuelve a negociar con qué se juega (P79).
  return {
    ...INITIAL_ENTRENAR_STATE,
    idSesion: state.idSesion,
    lugar: state.lugar,
    prescripcionVR: state.prescripcionVR,
    progresionVR: state.progresionVR,
  };
}

// ─── Lugar de la sesión (P72) ────────────────────────────────────────────────

/**
 * Sella el lugar al montar, con la primera regla que aplique: el de la rutina,
 * el `lugarHabitual` del perfil, o Casa. Una vez sellado no se vuelve a tocar
 * acá — cambiarlo es decisión del usuario (`cambiarLugar`).
 *
 * `lugarRutina` es `undefined` en la sesión libre: su rutina virtual no declara
 * un lugar real, así que ahí manda el perfil.
 */
export function sellarLugar(
  state: EntrenarState,
  lugarRutina: Lugar | undefined,
  lugarHabitual: Lugar | undefined,
): EntrenarState {
  if (state.lugar !== null) return state;
  return { ...state, lugar: lugarRutina ?? lugarHabitual ?? LUGAR_SESION_POR_DEFECTO };
}

/** Cambia el lugar a mano desde la vista del día. No toca nada más. */
export function cambiarLugar(state: EntrenarState, lugar: Lugar): EntrenarState {
  return { ...state, lugar };
}

/** Guarda el id de la `SesionProgramada` creada para esta sesión. */
export function asignarIdSesion(state: EntrenarState, idSesion: string): EntrenarState {
  return { ...state, idSesion };
}

/**
 * Duración (min) de una sesión guardada como parcial: desde `inicioMs` hasta el
 * `finMs` más alto entre las series registradas. No cuenta el tiempo entre la
 * última serie y el momento de salir. `null` si falta alguno de los dos.
 */
export function duracionParcialMin(state: EntrenarState): number | null {
  if (state.inicioMs == null) return null;
  let fin: number | null = null;
  for (const series of Object.values(state.registro)) {
    for (const s of series) {
      if (s.finMs != null && (fin == null || s.finMs > fin)) fin = s.finMs;
    }
  }
  if (fin == null) return null;
  return Math.max(0, Math.round((fin - state.inicioMs) / 60_000));
}

/** ¿La sesión se abrió hace más de `umbralMs`? Falso si no tiene inicio. */
export function sesionVieja(
  state: EntrenarState,
  now: number,
  umbralMs: number = UMBRAL_SESION_VIEJA_MS,
): boolean {
  return state.inicioMs != null && now - state.inicioMs > umbralMs;
}

/** Contexto de la hoja de salida para una sesión vieja, en hora local. */
export function mensajeSesionVieja(inicioMs: number): string {
  const d   = new Date(inicioMs);
  const dia = d.toLocaleDateString("es-AR", { weekday: "long" });
  const dd  = String(d.getDate()).padStart(2, "0");
  const mm  = String(d.getMonth() + 1).padStart(2, "0");
  const hh  = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `Esta sesión quedó abierta desde el ${dia} ${dd}/${mm} a las ${hh}:${min}.`;
}

/**
 * Saca bloques de la sesión y corre los índices del resto (sesión libre cuyo
 * ejercicio ya no está en el catálogo). Sin esto, el progreso guardado por
 * índice quedaría asignado al ejercicio equivocado. `totalRestante` es la
 * cantidad de bloques que quedan, para acotar `bloqueActual`.
 */
export function quitarBloques(
  state: EntrenarState,
  quitados: number[],
  totalRestante: number,
): EntrenarState {
  if (quitados.length === 0) return state;
  const fuera = new Set(quitados);
  const nuevoIdx = (i: number) => i - quitados.filter((q) => q < i).length;
  function remap<T>(rec: Record<number, T>): Record<number, T> {
    const out: Record<number, T> = {};
    for (const [k, v] of Object.entries(rec)) {
      const i = Number(k);
      if (!fuera.has(i)) out[nuevoIdx(i)] = v;
    }
    return out;
  }
  const descanso = state.descanso && !fuera.has(state.descanso.bloqueIdx)
    ? { ...state.descanso, bloqueIdx: nuevoIdx(state.descanso.bloqueIdx) }
    : null;
  const cerrado = state.ultimoBloqueCerrado;
  return {
    ...state,
    seriesHechas:  remap(state.seriesHechas),
    registro:      remap(state.registro),
    serieInicioMs: remap(state.serieInicioMs),
    ultimoLog:     remap(state.ultimoLog),
    saltados:      remap(state.saltados),
    sustituciones: remap(state.sustituciones),
    descanso,
    bloqueActual:  Math.max(0, Math.min(nuevoIdx(state.bloqueActual), totalRestante - 1)),
    ultimoBloqueCerrado: cerrado == null || fuera.has(cerrado) ? null : nuevoIdx(cerrado),
  };
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

/**
 * Ir a un bloque puntual (vista del día). Del bloque que se deja borra el inicio
 * de serie sellado y cancela su descanso; limpia `ultimoBloqueCerrado`.
 */
export function irABloque(state: EntrenarState, idx: number): EntrenarState {
  const deja = state.bloqueActual;
  const next: EntrenarState = { ...state, bloqueActual: idx, ultimoBloqueCerrado: null };
  if (deja !== idx) {
    const serieInicioMs = { ...state.serieInicioMs };
    delete serieInicioMs[deja];
    next.serieInicioMs = serieInicioMs;
    if (state.descanso?.bloqueIdx === deja) next.descanso = null;
  }
  return next;
}

/**
 * Saltea el bloque `idx` con motivo opcional. Cancela su descanso, borra su
 * inicio de serie, lo deja como `ultimoBloqueCerrado` y avanza al próximo
 * pendiente (sellándole el inicio de serie). No-op si el bloque ya está completo.
 */
export function saltarBloque(
  state: EntrenarState,
  rutina: Rutina,
  idx: number,
  motivo: MotivoSalto | null,
  now: number = Date.now(),
): EntrenarState {
  if (!rutina.bloques[idx] || bloqueCompleto(state, rutina, idx)) return state;
  const serieInicioMs = { ...state.serieInicioMs };
  delete serieInicioMs[idx];
  const next: EntrenarState = {
    ...state,
    saltados: { ...state.saltados, [idx]: motivo },
    descanso: state.descanso?.bloqueIdx === idx ? null : state.descanso,
    serieInicioMs,
    ultimoBloqueCerrado: idx,
  };
  const prox = proximoBloqueIncompleto(next, rutina, idx);
  if (prox >= 0) {
    next.bloqueActual = prox;
    return asegurarInicioSerie(next, prox, now);
  }
  return next;
}

/**
 * Vuelve a un bloque salteado: quita el salto, lo pone como actual en modo
 * guiado y limpia `ultimoBloqueCerrado`. Las series ya hechas se conservan.
 */
export function retomarBloque(state: EntrenarState, idx: number): EntrenarState {
  const saltados = { ...state.saltados };
  delete saltados[idx];
  return {
    ...state,
    saltados,
    bloqueActual: idx,
    modoVista: "guiada",
    ultimoBloqueCerrado: null,
  };
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
/** ¿Este bloque es el de VR? Cardio en intervalos con juego sugerido (P79). */
function esBloqueVR_(b: BloqueEjercicio): boolean {
  const p = b.prescripcion as { modalidad?: string; formato?: string; juegoSugerido?: string };
  return p?.modalidad === "Cardio" && p.formato === "Intervalos" && !!p.juegoSugerido;
}

export function construirBloquesRegistro(state: EntrenarState, rutina: Rutina): BloqueRegistro[] {
  return rutina.bloques.map((b, idx) => {
    const motivo = state.saltados[idx];
    const sust = state.sustituciones[idx];
    const series: SerieRegistro[] = state.registro[idx]
      ?? Array.from({ length: state.seriesHechas[idx] ?? 0 }, (_v, i) => ({
        serie: i + 1, completada: true,
      }));
    // 1RM estimado, solo Fuerza y solo si hay valor (P70).
    const e1rm = b.modalidad === "Fuerza" ? e1rmKg(series) : undefined;
    return {
      orden: b.orden,
      // Con sustitución, el bloque guarda el ejercicio que SE HIZO (P73).
      idEjercicio: sust ? sust.idNuevo : b.idEjercicio,
      nombreEjercicio: sust ? sust.nombreNuevo : b.nombreEjercicio,
      modalidad: b.modalidad as Modalidad,
      series,
      // Solo en bloques salteados (P68b).
      ...(motivo !== undefined ? { saltado: true } : {}),
      ...(motivo ? { motivoSalto: motivo } : {}),
      ...(e1rm !== undefined ? { e1rmKg: e1rm } : {}),
      // Solo en el bloque de VR (P79): con qué parámetros se jugó.
      ...(state.prescripcionVR && esBloqueVR_(b) ? { prescripcionUsada: state.prescripcionVR } : {}),
      // Solo en bloques sustituidos (P73).
      ...(sust ? {
        idEjercicioOriginal: sust.idOriginal,
        nombreEjercicioOriginal: b.nombreEjercicio,
        motivoSustitucion: sust.motivo,
        posicionSustituto: sust.posicion,
        ...(sust.zona ? { zonaMolestia: sust.zona } : {}),
      } : {}),
    };
  });
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
