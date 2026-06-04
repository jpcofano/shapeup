// ════════════════════════════════════════════════════════════════════════════
//  lib/elegibilidad.ts — Filtra rutinas/programas según visibilidad.
//  Análogo de lib/elegibilidad.ts de Comida Familiar.
// ════════════════════════════════════════════════════════════════════════════
import type { Rutina, Programa, VisibilidadMiembro } from "../types/models";

/**
 * Filtra rutinas según la visibilidad del miembro.
 * null = owner = ve todo.
 */
export function rutinasElegibles(
  rutinas: Rutina[],
  visibilidad: VisibilidadMiembro | null,
): Rutina[] {
  if (visibilidad === null) return rutinas;
  return rutinas.filter((r) => visibilidad.rutinas.includes(r.idRutina));
}

/**
 * Filtra programas según la visibilidad del miembro.
 */
export function programasElegibles(
  programas: Programa[],
  visibilidad: VisibilidadMiembro | null,
): Programa[] {
  if (visibilidad === null) return programas;
  return programas.filter((p) => visibilidad.programas.includes(p.idPrograma));
}
