// ════════════════════════════════════════════════════════════════════════════
//  lib/costoCardiaco.ts — costo cardíaco por rutina (I2, segundo insight de
//  la serie I).
//
//  Núcleo puro (ADR #009): con las sesiones matcheadas, la FC media a igual
//  rutina a lo largo del tiempo es una medida directa de mejora aeróbica —
//  misma rutina con menos bpm = tu corazón hace el mismo trabajo con menos
//  esfuerzo. La comparación es SIEMPRE contra uno mismo y a igual rutina
//  (nunca entre miembros, nunca entre rutinas distintas: comparar FC de
//  Fuerza A vs HIIT no significa nada). Sesiones libres (sin idRutina)
//  quedan fuera — no hay "igual trabajo" contra qué comparar.
//  Ver docs/prompts/59-i2-costo-cardiaco.md.
// ════════════════════════════════════════════════════════════════════════════

import type { Historial } from "../types/models";

export interface ComparativaCardiaca {
  fcMediaActual: number;
  fcMediaPrevias: number;      // mediana de las previas de la misma rutina
  deltaBpm: number;            // actual − previas (negativo = mejora)
  sesionesPrevias: number;     // cuántas respaldan la mediana
  kcalMinActual?: number;
  kcalMinPrevias?: number;
}

export interface PuntoCosto {
  fecha: string;
  fcMedia: number;
  kcalMin?: number;
}

/** Con menos previas, la "mediana" sería una anécdota — sin dato suficiente, silencio. */
const MIN_PREVIAS = 2;
/** Sesiones con biometría mínimas para que "Costo cardíaco" aparezca en RutinaDetalle. */
export const MIN_SESIONES_SECCION = 3;

function mediana(nums: number[]): number {
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function kcalPorMin(h: Historial): number | undefined {
  const kcal = h.biometria?.kcal;
  const min = h.duracionRealMin;
  return kcal != null && min != null && min > 0 ? kcal / min : undefined;
}

/**
 * Compara la FC media de `sesion` contra la mediana de sus previas elegibles
 * (misma rutina, con biometría, fecha anterior). `null` si la sesión es libre,
 * no tiene FC propia, o hay menos de `MIN_PREVIAS` previas para respaldar la
 * mediana.
 *
 * No se normaliza por duración en la FC: la mediana de FC media ya es
 * comparable a igual rutina (mismo trabajo esperado) — kcal/min es una
 * medida aparte, no un ajuste de la FC.
 */
export function compararConPrevias(
  sesion: Historial,
  historial: Historial[],
): ComparativaCardiaca | null {
  if (sesion.idRutina == null) return null;
  const fcMediaActual = sesion.biometria?.fcMedia;
  if (fcMediaActual == null) return null;

  const previas = historial.filter((h) =>
    h.idRutina === sesion.idRutina &&
    h.idHist !== sesion.idHist &&
    h.biometria?.fcMedia != null &&
    h.fechaRealizada < sesion.fechaRealizada,
  );
  if (previas.length < MIN_PREVIAS) return null;

  const fcMediaPrevias = mediana(previas.map((h) => h.biometria!.fcMedia!));

  // kcalMin solo si la sesión actual Y al menos una previa tienen kcal+duración
  // (el anti-"olvido de corte" puede omitir kcal en cualquiera de las dos partes
  // — ahí no se computa kcalMin, no se inventa).
  const kcalMinActualCrudo = kcalPorMin(sesion);
  const kcalMinPreviasValores = previas.map(kcalPorMin).filter((v): v is number => v != null);
  const hayKcalDeAmbasPartes = kcalMinActualCrudo != null && kcalMinPreviasValores.length > 0;

  return {
    fcMediaActual,
    fcMediaPrevias,
    deltaBpm: fcMediaActual - fcMediaPrevias,
    sesionesPrevias: previas.length,
    kcalMinActual: hayKcalDeAmbasPartes ? kcalMinActualCrudo : undefined,
    kcalMinPrevias: hayKcalDeAmbasPartes ? mediana(kcalMinPreviasValores) : undefined,
  };
}

/** Serie cronológica de FC media (y kcal/min si hay dato) para una rutina, lista para graficar. */
export function serieCostoRutina(idRutina: string, historial: Historial[]): PuntoCosto[] {
  return historial
    .filter((h) => h.idRutina === idRutina && h.biometria?.fcMedia != null)
    .map((h) => ({
      fecha: h.fechaRealizada,
      fcMedia: h.biometria!.fcMedia!,
      kcalMin: kcalPorMin(h),
    }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
}
