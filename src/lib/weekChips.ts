import type { Historial } from "../types/models";
import { ymdLocal } from "./semana";

const DAY_LETTERS = ["L", "M", "X", "J", "V", "S", "D"] as const;

export type ChipEstado = "done" | "today" | "pending";

export interface WeekChip {
  letter: string;
  fecha: string;
  estado: ChipEstado;
}

/**
 * Chips L→D de la semana que arranca en `semanaInicio` (lunes, "YYYY-MM-DD").
 * "done" = hay un Historial con esa `fechaRealizada`; "today" = es la fecha de hoy.
 */
export function calcularWeekChips(
  historial: Historial[],
  semanaInicio: string,
  hoy: string = ymdLocal(),
): WeekChip[] {
  const fechasConSesion = new Set(historial.map((h) => h.fechaRealizada));
  const lunes = new Date(semanaInicio + "T00:00:00");

  return DAY_LETTERS.map((letter, i) => {
    const d = new Date(lunes);
    d.setDate(lunes.getDate() + i);
    const fecha = ymdLocal(d);
    const estado: ChipEstado = fecha === hoy ? "today" : fechasConSesion.has(fecha) ? "done" : "pending";
    return { letter, fecha, estado };
  });
}
