import type { Programa, DiaPrograma, Historial } from "../types/models";

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

  // Sesiones de la semana agrupadas por idRutina
  const realizadas = new Map<string, number>();
  for (const h of historialSemana) {
    if (h.idRutina) realizadas.set(h.idRutina, (realizadas.get(h.idRutina) ?? 0) + 1);
  }

  // Cuántas sesiones ya "asignamos" a días previos para la misma rutina
  const asignadas = new Map<string, number>();

  for (let i = 0; i < activos.length; i++) {
    const dia = activos[i];
    const rid  = dia.idRutina;

    if (!rid) {
      // VR puro u otro día sin rutina → siempre se muestra como próximo
      return { dia, indice: i + 1, total };
    }

    const yaAsignadas = asignadas.get(rid) ?? 0;
    const disponibles = (realizadas.get(rid) ?? 0) - yaAsignadas;

    if (disponibles > 0) {
      asignadas.set(rid, yaAsignadas + 1); // este día está cubierto
    } else {
      return { dia, indice: i + 1, total }; // primer día sin cubrir
    }
  }

  return null; // semana completa
}
