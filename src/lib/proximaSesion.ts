import type { Programa, DiaPrograma, Historial } from "../types/models";
import { soloShapeUp } from "./tipoHistorial";

export interface ProximaSesionResult {
  /** El día del programa que sigue (no descanso). */
  dia: DiaPrograma;
  /** Posición 1-based entre los días activos (no descanso). */
  indice: number;
  /** Total de días activos del programa. */
  total: number;
}

/**
 * Devuelve el primer día activo del programa sin sesión registrada esta semana.
 *
 * - No usa el día de la semana para decidir — es secuencial por `orden`.
 * - Contempla rutinas repetidas: si la misma `idRutina` aparece en 2 días,
 *   se necesitan 2 sesiones para cubrirlos.
 * - **Un día sin `idRutina` se cubre con cualquier sesión sobrante** (P77a).
 *   Antes se devolvía siempre como próximo, y como no hay forma de cubrir un
 *   día que no apunta a ninguna rutina, la semana quedaba trabada ahí para
 *   siempre. Hoy no se dispara —los días de VR del plan sembrado tienen
 *   `idRutina` real— pero el modelo admite `tipo: "vr"` sin ella.
 * - Devuelve `null` si todos los días activos tienen sesión ("semana completa").
 * - Función pura, sin Firestore.
 */
export function proximaSesion(
  programa: Programa,
  historialSemana: Historial[],
): ProximaSesionResult | null {
  const activos = programa.dias
    .filter((d) => d.tipo !== "descanso")
    .sort((a, b) => a.orden - b.orden);

  const total = activos.length;
  if (total === 0) return null;

  // Sesiones de la semana agrupadas por idRutina.
  // Solo ShapeUp: cubrir un día del plan es haberlo entrenado en la app (P74).
  const propias = soloShapeUp(historialSemana);
  const realizadas = new Map<string, number>();
  for (const h of propias) {
    if (h.idRutina) realizadas.set(h.idRutina, (realizadas.get(h.idRutina) ?? 0) + 1);
  }

  // Primera pasada: qué días CON rutina quedan cubiertos. Hace falta saberlo
  // antes de recorrer, para poder contar cuántas sesiones sobran.
  const asignadas = new Map<string, number>();
  const cubierto = activos.map((dia) => {
    const rid = dia.idRutina;
    if (!rid) return false;
    const yaAsignadas = asignadas.get(rid) ?? 0;
    if ((realizadas.get(rid) ?? 0) - yaAsignadas > 0) {
      asignadas.set(rid, yaAsignadas + 1);
      return true;
    }
    return false;
  });

  // Las que no quedaron asignadas a ningún día con rutina: una sesión libre, o
  // una de una rutina que el plan no pide, cubre un día sin `idRutina`.
  let sobrantes = propias.length - cubierto.filter(Boolean).length;

  for (let i = 0; i < activos.length; i++) {
    const dia = activos[i];

    if (!dia.idRutina) {
      if (sobrantes > 0) { sobrantes--; continue; }   // cubierto por una sobrante
      return { dia, indice: i + 1, total };
    }

    if (!cubierto[i]) return { dia, indice: i + 1, total };  // primer día sin cubrir
  }

  return null; // semana completa
}
