// ════════════════════════════════════════════════════════════════════════════
//  lib/resumenSesion.ts — cálculos de la pantalla de fin (P70): cifras de la
//  sesión, comparación con la última vez, PR, 1RM estimado y escala de RPE.
//  Puro, sin Firebase (ADR #009).
// ════════════════════════════════════════════════════════════════════════════

import type { BloqueRegistro, Historial, SerieRegistro, ZonaMolestia } from "../types/models";
import { tonelajeKg, totalSeriesHechas, ventanaDeBloques } from "./metricas";
import { sesionesDelEjercicio } from "./progresion";

// ── Cifras ───────────────────────────────────────────────────────────────────

export interface CifrasSesion {
  tonelajeKg:      number;
  /** Series completadas, extras incluidas. */
  seriesEfectivas: number;
  duracionMin:     number | null;
}

export function cifrasSesion(
  bloques: BloqueRegistro[],
  inicioMs: number | null,
  now: number,
): CifrasSesion {
  return {
    tonelajeKg:      tonelajeKg({ bloques }),
    seriesEfectivas: totalSeriesHechas({ bloques }),
    duracionMin:     inicioMs != null ? Math.round((now - inicioMs) / 60_000) : null,
  };
}

// ── Helpers de series ────────────────────────────────────────────────────────

function completadas(series: SerieRegistro[]): SerieRegistro[] {
  return series.filter((s) => s.completada);
}

function redondear(n: number, decimales: number): number {
  const f = 10 ** decimales;
  return Math.round(n * f) / f;
}

/** Carga máxima entre las series completadas con carga registrada. */
function cargaMaxima(series: SerieRegistro[]): number | undefined {
  const cargas = completadas(series)
    .map((s) => s.cargaKg)
    .filter((c): c is number => c != null);
  return cargas.length > 0 ? Math.max(...cargas) : undefined;
}

/** Reps máximas hechas con una carga dada (series completadas). */
function repsMaximasCon(series: SerieRegistro[], cargaKg: number): number {
  const reps = completadas(series)
    .filter((s) => s.cargaKg === cargaKg && s.reps != null)
    .map((s) => s.reps!);
  return reps.length > 0 ? Math.max(...reps) : 0;
}

/** Mejor carga de hoy, para la fila "series × carga". */
export function mejorCarga(bloque: BloqueRegistro): number | undefined {
  return cargaMaxima(bloque.series);
}

// ── Comparación con la última vez ────────────────────────────────────────────

export type DeltaEjercicio =
  | { tipo: "primera-vez" }
  | { tipo: "sin-carga" }
  | { tipo: "carga"; deltaKg: number }
  | { tipo: "reps"; deltaReps: number }
  | { tipo: "sustituido" };

/**
 * Campo que va a agregar el bloque 3 (sustitución). Todavía no está en el
 * modelo: se lee sin tipar para que `deltaEjercicio` ya lo contemple.
 */
const CAMPO_SUSTITUCION = "idEjercicioOriginal";

function esSustituido(bloque: BloqueRegistro): boolean {
  return (bloque as unknown as Record<string, unknown>)[CAMPO_SUSTITUCION] != null;
}

/**
 * Compara el bloque de hoy con la última sesión anterior del mismo ejercicio
 * (Fuerza, con series completadas). `historial` no debe incluir la sesión actual.
 * Un bloque que no es de Fuerza no tiene comparación de carga: `sin-carga`.
 *
 * Solo ShapeUp: el filtro por tipo lo aplica `sesionesDelEjercicio` (P74).
 */
export function deltaEjercicio(bloque: BloqueRegistro, historial: Historial[]): DeltaEjercicio {
  if (esSustituido(bloque)) return { tipo: "sustituido" };
  if (bloque.modalidad !== "Fuerza") return { tipo: "sin-carga" };

  const previas = sesionesDelEjercicio(bloque.idEjercicio, historial);
  if (previas.length === 0) return { tipo: "primera-vez" };

  const cargaHoy = cargaMaxima(bloque.series);
  const cargaAntes = cargaMaxima(previas[0].series);
  if (cargaHoy == null || cargaAntes == null) return { tipo: "sin-carga" };

  const hoy = redondear(cargaHoy, 2);
  const antes = redondear(cargaAntes, 2);
  if (hoy !== antes) return { tipo: "carga", deltaKg: redondear(hoy - antes, 2) };

  return {
    tipo: "reps",
    deltaReps: repsMaximasCon(bloque.series, cargaHoy) - repsMaximasCon(previas[0].series, cargaAntes),
  };
}

/**
 * ¿La carga máxima de hoy supera la de todas las sesiones anteriores del
 * ejercicio? La primera vez nunca es PR; un empate tampoco.
 *
 * Solo ShapeUp, vía `sesionesDelEjercicio`: un PR es de lo levantado en la app (P74).
 */
export function esPR(bloque: BloqueRegistro, historial: Historial[]): boolean {
  if (bloque.modalidad !== "Fuerza" || esSustituido(bloque)) return false;
  const cargaHoy = cargaMaxima(bloque.series);
  if (cargaHoy == null) return false;
  const previas = sesionesDelEjercicio(bloque.idEjercicio, historial)
    .map((s) => cargaMaxima(s.series))
    .filter((c): c is number => c != null);
  if (previas.length === 0) return false;
  return redondear(cargaHoy, 2) > redondear(Math.max(...previas), 2);
}

/**
 * 1RM estimado (Epley: carga × (1 + reps / 30)). Solo series completadas con
 * carga > 0 y entre 1 y 10 reps: por encima de 10 la estimación no es confiable.
 */
export function e1rmKg(series: SerieRegistro[]): number | undefined {
  const estimaciones = completadas(series)
    .filter((s) => s.cargaKg != null && s.cargaKg > 0 && s.reps != null && s.reps >= 1 && s.reps <= 10)
    .map((s) => s.cargaKg! * (1 + s.reps! / 30));
  return estimaciones.length > 0 ? redondear(Math.max(...estimaciones), 1) : undefined;
}

/**
 * Historial sin la sesión actual (P70): si un guardado pendiente ya dejó el
 * documento en la caché, no tiene que compararse consigo mismo. Se reconoce
 * por `idSesion` o por el inicio de la ventana de series.
 *
 * NO filtra por tipo a propósito (P74): solo saca la sesión actual. Quien
 * consume el resultado (`deltaEjercicio`, `esPR`) ya filtra adentro.
 */
export function historialPrevio(
  historial: Historial[],
  bloquesActuales: BloqueRegistro[],
  idSesion: string | null,
): Historial[] {
  const inicio = ventanaDeBloques(bloquesActuales).inicioMs;
  return historial.filter((h) =>
    !(idSesion != null && h.idSesion === idSesion)
    && !(inicio != null && h.inicioMs === inicio));
}

// ── Escala de RPE y opciones de cierre ───────────────────────────────────────

export function leyendaRpe(n: number): string {
  if (n >= 1 && n <= 5) return "Liviano — te sobraban muchas reps";
  switch (n) {
    case 6:  return "Moderado — 4 o más en reserva";
    case 7:  return "Exigente — unas 3 en reserva";
    case 8:  return "Duro — unas 2 en reserva";
    case 9:  return "Muy duro — 1 en reserva";
    case 10: return "Máximo — no quedaba ninguna";
    default: return "";
  }
}

export const SENSACIONES = ["Con energía", "Normal", "Cansado", "Muy cansado"] as const;

export const ZONAS_MOLESTIA: ReadonlyArray<readonly [ZonaMolestia, string]> = [
  ["hombro",  "Hombro"],
  ["codo",    "Codo"],
  ["muñeca",  "Muñeca"],
  ["espalda", "Espalda"],
  ["cadera",  "Cadera"],
  ["rodilla", "Rodilla"],
  ["tobillo", "Tobillo"],
  ["otra",    "Otra"],
];

export const MEJORAS = [
  "Técnica", "Descanso entre series", "Subir carga", "Dormir mejor", "Comer mejor",
] as const;
