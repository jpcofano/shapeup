import type { RangoNumerico } from "../types/models";

/**
 * Parsea un string de reps/rondas a RangoNumerico.
 *   "8-12"  → { value: 8, min: 8, max: 12, raw: "8-12" }
 *   "10"    → { value: 10, raw: "10" }
 *   "30 s"  → { value: 30, raw: "30 s" }
 *   "AMRAP" → { value: 0, raw: "AMRAP" }
 */
export function parseRango(raw: string): RangoNumerico {
  const t = raw.trim();
  if (!t) return { value: 0, raw: "" };

  const rangeM = t.match(/^(\d+)\s*[-–]\s*(\d+)$/);
  if (rangeM) {
    const min = parseInt(rangeM[1], 10);
    const max = parseInt(rangeM[2], 10);
    return { value: min, min, max, raw: t };
  }

  const numM = t.match(/^(\d+)/);
  if (numM) return { value: parseInt(numM[1], 10), raw: t };

  return { value: 0, raw: t };
}

/** Formatea un RangoNumerico de vuelta a string legible. */
export function formatRango(r: RangoNumerico): string {
  return r.raw || String(r.value);
}
