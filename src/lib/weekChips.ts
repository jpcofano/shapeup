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
 *
 * Cuenta TODO, externas incluidas (P74): la tira responde "¿me moví este día?",
 * no "¿cumplí el plan?" — de eso se ocupan la adherencia y `rachaDelPlan`, que
 * sí filtran. Marcar en gris un día que saliste a caminar sería quitarte el
 * crédito por haberte movido.
 *
 * Recibe las FECHAS con actividad, no el historial (P75b): desde que ninguna
 * pantalla trae el historial completo, quien llama arma esa lista con
 * `getDiasActivos` y decide ahí qué orígenes cuentan.
 */
export function calcularWeekChips(
  fechasConActividad: string[],
  semanaInicio: string,
  hoy: string = ymdLocal(),
): WeekChip[] {
  const fechasConSesion = new Set(fechasConActividad);
  const lunes = new Date(semanaInicio + "T00:00:00");

  return DAY_LETTERS.map((letter, i) => {
    const d = new Date(lunes);
    d.setDate(lunes.getDate() + i);
    const fecha = ymdLocal(d);
    const estado: ChipEstado = fecha === hoy ? "today" : fechasConSesion.has(fecha) ? "done" : "pending";
    return { letter, fecha, estado };
  });
}
