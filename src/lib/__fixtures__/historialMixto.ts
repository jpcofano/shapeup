// ════════════════════════════════════════════════════════════════════════════
//  __fixtures__/historialMixto.ts — historial con entradas externas (P74).
//
//  La forma del test de aislamiento es siempre la misma: calcular con
//  `HISTORIAL_MIXTO` y con `SOLO_SHAPEUP`, y exigir que dé IDÉNTICO en todo lo
//  que cuenta solo ShapeUp. Si una externa mueve la aguja, el test falla.
//
//  Las externas se arman como las va a crear P75: SIN bloques (la propiedad no
//  existe, no es un array vacío — así el test también prueba que nada explote
//  al leer `h.bloques`), sin tonelaje, con duración, kcal y FC.
// ════════════════════════════════════════════════════════════════════════════

import type { Historial, BloqueRegistro, SerieRegistro } from "../../types/models";

const EJ = "EJ-0001";
const TS = { seconds: 0, nanoseconds: 0 };

function serie(n: number, reps: number, cargaKg: number): SerieRegistro {
  return { serie: n, reps, cargaKg, completada: true };
}

function bloquePress(series: SerieRegistro[]): BloqueRegistro {
  return {
    orden: 1, idEjercicio: EJ, nombreEjercicio: "Press banca",
    modalidad: "Fuerza", series,
  };
}

/** Ejercicio de la fixture, para los tests de progresión / PR / deltas. */
export const ID_EJERCICIO = EJ;
/** Rutina de la fixture, para los tests de costo cardíaco. */
export const ID_RUTINA = "RUT-0001";
/** Semana (lunes) en la que cae todo lo de la fixture. */
export const SEMANA = "2026-09-07";

// ── Sesiones ShapeUp ─────────────────────────────────────────────────────────

/** Rutina del plan, lunes. Tonelaje 3×10×40 = 1200. */
const rutinaLunes: Historial = {
  idHist: "H-20260907", fechaRealizada: "2026-09-07", fechaRealizadaTimestamp: TS,
  idSesion: "SES-1", idRutina: ID_RUTINA, nombreRutina: "Fuerza A", tipo: "rutina",
  semanaInicio: SEMANA, miembro: "juanpablo",
  duracionRealMin: 55, rpe: 7, tonelajeKg: 1200, totalSeriesHechas: 3,
  inicioMs: Date.UTC(2026, 8, 7, 12, 0), finMs: Date.UTC(2026, 8, 7, 12, 55),
  bloques: [bloquePress([serie(1, 10, 40), serie(2, 10, 40), serie(3, 10, 40)])],
  biometria: {
    fuente: "samsung-health-csv", datauuidSamsung: "uuid-lunes", fcMedia: 130,
    matchPor: "custom-id", granularidad: "serie", kcal: 330,
  },
};

/** Rutina del plan, miércoles. Más carga que el lunes: es PR y delta positivo. */
const rutinaMiercoles: Historial = {
  idHist: "H-20260909", fechaRealizada: "2026-09-09", fechaRealizadaTimestamp: TS,
  idSesion: "SES-2", idRutina: ID_RUTINA, nombreRutina: "Fuerza A", tipo: "rutina",
  semanaInicio: SEMANA, miembro: "juanpablo",
  duracionRealMin: 58, rpe: 8, tonelajeKg: 1350, totalSeriesHechas: 3,
  inicioMs: Date.UTC(2026, 8, 9, 12, 0), finMs: Date.UTC(2026, 8, 9, 12, 58),
  bloques: [bloquePress([serie(1, 10, 45), serie(2, 10, 45), serie(3, 10, 45)])],
  biometria: {
    fuente: "samsung-health-csv", datauuidSamsung: "uuid-miercoles", fcMedia: 126,
    matchPor: "custom-id", granularidad: "serie", kcal: 340,
  },
};

/** Sesión libre (sin idRutina), jueves. Cuenta como ShapeUp. */
const libreJueves: Historial = {
  idHist: "H-20260910", fechaRealizada: "2026-09-10", fechaRealizadaTimestamp: TS,
  idSesion: "SES-3", nombreRutina: "Sesión libre", tipo: "libre",
  semanaInicio: SEMANA, miembro: "juanpablo",
  duracionRealMin: 30, rpe: 6, tonelajeKg: 600, totalSeriesHechas: 2,
  inicioMs: Date.UTC(2026, 8, 10, 12, 0), finMs: Date.UTC(2026, 8, 10, 12, 30),
  bloques: [bloquePress([serie(1, 10, 30), serie(2, 10, 30)])],
};

/** Sesión vieja SIN el campo `tipo` (retrocompat): se lee como "rutina". */
const viejaSinTipo: Historial = {
  idHist: "H-20260831", fechaRealizada: "2026-08-31", fechaRealizadaTimestamp: TS,
  idSesion: "SES-0", idRutina: ID_RUTINA, nombreRutina: "Fuerza A",
  semanaInicio: "2026-08-31", miembro: "juanpablo",
  duracionRealMin: 50, rpe: 7, tonelajeKg: 1100, totalSeriesHechas: 3,
  inicioMs: Date.UTC(2026, 7, 31, 12, 0), finMs: Date.UTC(2026, 7, 31, 12, 50),
  bloques: [bloquePress([serie(1, 10, 35), serie(2, 10, 35), serie(3, 10, 35)])],
  biometria: {
    fuente: "samsung-health-csv", datauuidSamsung: "uuid-vieja", fcMedia: 134,
    matchPor: "ventana", granularidad: "sesion", kcal: 300,
  },
};

// ── Entradas externas (las que va a crear P75) ───────────────────────────────

/**
 * Caminata de 40 min, martes. Sin `bloques` ni tonelaje: el `as Historial` es
 * deliberado — así es como llega el dato real, y los tests prueban que nadie
 * explote al leer `h.bloques`.
 */
const caminataMartes = {
  idHist: "H-20260908-EXT", fechaRealizada: "2026-09-08", fechaRealizadaTimestamp: TS,
  idSesion: "SES-EXT-1", nombreRutina: "Caminata", tipo: "externa",
  semanaInicio: SEMANA, miembro: "juanpablo",
  duracionRealMin: 40, rpe: null, tonelajeKg: null, totalSeriesHechas: null,
  inicioMs: Date.UTC(2026, 8, 8, 12, 0), finMs: Date.UTC(2026, 8, 8, 12, 40),
  biometria: {
    fuente: "samsung-health-csv", datauuidSamsung: "uuid-caminata", fcMedia: 108,
    matchPor: "custom-id", granularidad: "sesion", kcal: 180,
  },
} as unknown as Historial;

/** Caminata corta de 12 min, viernes. */
const caminataViernes = {
  idHist: "H-20260911-EXT", fechaRealizada: "2026-09-11", fechaRealizadaTimestamp: TS,
  idSesion: "SES-EXT-2", nombreRutina: "Caminata", tipo: "externa",
  semanaInicio: SEMANA, miembro: "juanpablo",
  duracionRealMin: 12, rpe: null, tonelajeKg: null, totalSeriesHechas: null,
  inicioMs: Date.UTC(2026, 8, 11, 12, 0), finMs: Date.UTC(2026, 8, 11, 12, 12),
  biometria: {
    fuente: "samsung-health-csv", datauuidSamsung: "uuid-caminata-corta", fcMedia: 102,
    matchPor: "dia", granularidad: "sesion", kcal: 55,
  },
} as unknown as Historial;

/**
 * Externa EL MISMO DÍA que `rutinaLunes` — el caso que rompe el conteo por
 * días: son dos sesiones, pero un solo día activo.
 */
const caminataMismoDia = {
  idHist: "H-20260907-EXT", fechaRealizada: "2026-09-07", fechaRealizadaTimestamp: TS,
  idSesion: "SES-EXT-3", nombreRutina: "Caminata", tipo: "externa",
  semanaInicio: SEMANA, miembro: "juanpablo",
  duracionRealMin: 25, rpe: null, tonelajeKg: null, totalSeriesHechas: null,
  inicioMs: Date.UTC(2026, 8, 7, 19, 0), finMs: Date.UTC(2026, 8, 7, 19, 25),
  biometria: {
    fuente: "samsung-health-csv", datauuidSamsung: "uuid-caminata-noche", fcMedia: 110,
    matchPor: "dia", granularidad: "sesion", kcal: 120,
  },
} as unknown as Historial;

// ── Lo que consumen los tests ────────────────────────────────────────────────

/** Las tres externas, para armar casos sueltos. */
export const EXTERNAS: Historial[] = [caminataMartes, caminataViernes, caminataMismoDia];

/** Historial completo: 4 sesiones ShapeUp (una sin `tipo`) + 3 externas. */
export const HISTORIAL_MIXTO: Historial[] = [
  viejaSinTipo, rutinaLunes, caminataMismoDia, caminataMartes,
  rutinaMiercoles, libreJueves, caminataViernes,
];

/** El mismo historial sin las externas: el resultado de referencia. */
export const SOLO_SHAPEUP: Historial[] = [
  viejaSinTipo, rutinaLunes, rutinaMiercoles, libreJueves,
];

export { rutinaLunes, rutinaMiercoles, libreJueves, viejaSinTipo, caminataMismoDia };

// ── Sesiones de juego (P81) ──────────────────────────────────────────────────
//
//  Juegos de VR que Juan registra pero que NO son entrenamiento. Sin bloques,
//  sin tonelaje, sin RPE — como las externas. Lo que las distingue es que las
//  hizo en la app, con la ventana de la app, y por eso se enriquecen con FC:
//  el único dato que puede contestar si esos juegos lo mueven o no.

/** Behemoth, sábado. 45 min con FC de Z2. */
const juegoSabado = {
  idHist: "H-20260912-JUEGO", fechaRealizada: "2026-09-12", fechaRealizadaTimestamp: TS,
  idSesion: "SES-JUE-1", nombreRutina: "Behemoth", tipo: "juego", nombreJuego: "Behemoth",
  semanaInicio: SEMANA, miembro: "juanpablo",
  duracionRealMin: 45, rpe: null, tonelajeKg: null, totalSeriesHechas: null,
  inicioMs: Date.UTC(2026, 8, 12, 21, 0), finMs: Date.UTC(2026, 8, 12, 21, 45),
  biometria: {
    fuente: "samsung-health-csv", datauuidSamsung: "uuid-behemoth", fcMedia: 112,
    matchPor: "custom-id", granularidad: "sesion", kcal: 240,
  },
} as unknown as Historial;

/**
 * Drums Rock EL MISMO DÍA que `rutinaLunes`: si un juego contara, el día
 * sumaría 30 minutos de movimiento que no son movimiento.
 */
const juegoMismoDia = {
  idHist: "H-20260907-JUEGO", fechaRealizada: "2026-09-07", fechaRealizadaTimestamp: TS,
  idSesion: "SES-JUE-2", nombreRutina: "Drums Rock", tipo: "juego", nombreJuego: "Drums Rock",
  semanaInicio: SEMANA, miembro: "juanpablo",
  duracionRealMin: 30, rpe: null, tonelajeKg: null, totalSeriesHechas: null,
  inicioMs: Date.UTC(2026, 8, 7, 22, 0), finMs: Date.UTC(2026, 8, 7, 22, 30),
} as unknown as Historial;

/**
 * Un juego en un día que, si no fuera por él, estaría vacío. Es el caso que
 * distingue "no suma minutos" de "no crea un día": el martes 8 ya tiene una
 * caminata, así que hace falta un día propio para probarlo.
 */
const juegoDiaSolo = {
  idHist: "H-20260913-JUEGO", fechaRealizada: "2026-09-13", fechaRealizadaTimestamp: TS,
  idSesion: "SES-JUE-3", nombreRutina: "Rock", tipo: "juego", nombreJuego: "Rock",
  semanaInicio: SEMANA, miembro: "juanpablo",
  duracionRealMin: 50, rpe: null, tonelajeKg: null, totalSeriesHechas: null,
  inicioMs: Date.UTC(2026, 8, 13, 20, 0), finMs: Date.UTC(2026, 8, 13, 20, 50),
} as unknown as Historial;

/** Las tres sesiones de juego, para armar casos sueltos. */
export const JUEGOS: Historial[] = [juegoSabado, juegoMismoDia, juegoDiaSolo];

/** `HISTORIAL_MIXTO` con los juegos adentro: el insumo del test de P81. */
export const HISTORIAL_CON_JUEGOS: Historial[] = [
  viejaSinTipo, rutinaLunes, juegoMismoDia, caminataMismoDia, caminataMartes,
  rutinaMiercoles, libreJueves, caminataViernes, juegoSabado, juegoDiaSolo,
];

export { juegoSabado, juegoMismoDia, juegoDiaSolo };
