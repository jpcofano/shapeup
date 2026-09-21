import { ymdLocal } from "./semana";
import type { DiaActivo } from "./racha";

const DAY_LETTERS = ["L", "M", "X", "J", "V", "S", "D"] as const;

export type ChipEstado = "done" | "movimiento" | "today" | "pending";

export interface WeekChip {
  letter: string;
  fecha: string;
  estado: ChipEstado;
}

/**
 * Piso de minutos para que un día sin sesión cuente como "me moví" **en la
 * tira de la semana**.
 *
 * Es un número de la vista, y no tiene nada que ver con los otros dos que
 * andan cerca:
 *
 *   · **20 (este)** — cuándo el chip del día se enciende tenue. Solo decide
 *     cómo se pinta un día que ya pasó.
 *   · **30** (`DURACION_MIN_ACTIVIDAD_MIN`) — cuándo una actividad de /cardio
 *     se MUESTRA en el historial, junto a las sesiones. Otra pregunta: ahí se
 *     decide si una caminata figura como entrenamiento.
 *   · **la meta semanal** (`sesObj`, del programa del miembro) — cuántas
 *     sesiones de la app te propusiste hacer. Ni este piso ni el otro la
 *     mueven: la adherencia y `rachaDelPlan` siguen contando solo ShapeUp.
 *
 * Veinte minutos es una caminata de verdad, y deja afuera el traslado de ocho
 * minutos hasta el colectivo. Tres de esas ocho sí suman, y está bien que
 * sumen: es el mismo rato de movimiento.
 */
export const MINUTOS_MOVIMIENTO_CHIP = 20;

/**
 * Chips L→D de la semana que arranca en `semanaInicio` (lunes, "YYYY-MM-DD").
 *
 * Tres estados para un día que ya pasó, más "today":
 *   · `"done"`       — hubo una sesión de ShapeUp: entrenaste.
 *   · `"movimiento"` — no hubo sesión, pero el día suma al menos
 *                      `MINUTOS_MOVIMIENTO_CHIP` minutos de actividad.
 *   · `"pending"`    — nada.
 *
 * La tira responde "¿me moví este día?", no "¿cumplí el plan?" — de eso se
 * ocupan la adherencia y `rachaDelPlan`, que sí filtran y que este cambio no
 * toca. Marcar en gris un día que saliste a caminar sería quitarte el crédito
 * por haberte movido; marcarlo igual que un día de gimnasio sería mentir.
 *
 * Recibe los DÍAS con sus marcas y minutos (de `getDiasActivos`), no el
 * historial: desde P75b ninguna pantalla trae el historial completo, y desde
 * P76b las actividades ni siquiera están ahí.
 */
export function calcularWeekChips(
  dias: DiaActivo[],
  semanaInicio: string,
  hoy: string = ymdLocal(),
): WeekChip[] {
  const porFecha = new Map(dias.map((d) => [d.fecha, d]));
  const lunes = new Date(semanaInicio + "T00:00:00");

  return DAY_LETTERS.map((letter, i) => {
    const d = new Date(lunes);
    d.setDate(lunes.getDate() + i);
    const fecha = ymdLocal(d);
    const dia = porFecha.get(fecha);

    const estado: ChipEstado =
      fecha === hoy                                     ? "today"
      : dia?.shapeUp                                    ? "done"
      : (dia?.minutos ?? 0) >= MINUTOS_MOVIMIENTO_CHIP  ? "movimiento"
      :                                                   "pending";

    return { letter, fecha, estado };
  });
}
