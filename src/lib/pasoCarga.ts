// ════════════════════════════════════════════════════════════════════════════
//  lib/pasoCarga.ts — paso del stepper de carga y aritmética de los steppers
//  del registro de serie (P67). Puro: sin Firebase (ADR #009).
// ════════════════════════════════════════════════════════════════════════════

import type { Ejercicio, Equipo } from "../types/models";

/** Paso por defecto cuando el ejercicio no tiene override ni equipo conocido. */
export const PASO_CARGA_DEFAULT = 2.5;

/**
 * Paso por equipo, en orden de prioridad: gana el primero de esta lista que
 * esté en `ejercicio.equipo`, sin importar el orden del array del ejercicio.
 */
export const PASO_POR_EQUIPO: ReadonlyArray<readonly [Equipo, number]> = [
  ["Barra", 5],
  ["Polea", 5],
  ["Máquina", 5],
  ["Kettlebell", 4],
  ["Mancuernas", 2.5],
  ["Peso corporal", 1.25],
];

/** Chips que ofrece el editor de paso (toque largo sobre el stepper de carga). */
export const PASOS_CARGA_OPCIONES = [1, 1.25, 2, 2.5, 4, 5] as const;

/** Paso que corresponde al equipo del ejercicio, ignorando el override. */
export function pasoCargaPorEquipo(ej: Ejercicio | undefined): number {
  if (!ej) return PASO_CARGA_DEFAULT;
  for (const [equipo, paso] of PASO_POR_EQUIPO) {
    if (ej.equipo.includes(equipo)) return paso;
  }
  return PASO_CARGA_DEFAULT;
}

/** Paso efectivo: override del ejercicio si es > 0; si no, el default del equipo. */
export function pasoCarga(ej: Ejercicio | undefined): number {
  if (ej?.pasoCargaKg != null && ej.pasoCargaKg > 0) return ej.pasoCargaKg;
  return pasoCargaPorEquipo(ej);
}

/**
 * Nuevo valor (como string para el input) tras tocar `−` o `+`.
 *  - `actual` vacío o no numérico → parte de `base` (el placeholder o el default).
 *  - Nunca baja de `min`. Redondea a `decimales`.
 */
export function aplicarPaso(
  actual: string,
  base: number,
  delta: number,
  min: number,
  decimales: number,
): string {
  const parsed = parseFloat(actual);
  const desde = Number.isFinite(parsed) ? parsed : base;
  const f = 10 ** decimales;
  const siguiente = Math.round((desde + delta) * f) / f;
  return String(Math.max(min, siguiente));
}
