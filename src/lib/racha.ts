// ════════════════════════════════════════════════════════════════════════════
//  lib/racha.ts — racha del plan y días activos (P74).
//
//  Vivía adentro de Home.tsx (`calcRacha`), donde no se podía testear. La
//  mudanza además separa dos cosas que no son la misma:
//
//    · `rachaDelPlan`  — cumpliste el plan: SOLO sesiones hechas en la app.
//    · `diasActivos`   — te moviste: TODO, externas incluidas.
//
//  Es la separación que pide el roadmap (Bloque 5): que una caminata no infle
//  la adherencia, pero que tampoco te quite el crédito por haberte movido.
//
//  Núcleo puro (ADR #009).
// ════════════════════════════════════════════════════════════════════════════

import type { Historial } from "../types/models";
import { soloShapeUp } from "./tipoHistorial";
import { ymdLocal } from "./semana";

/**
 * Semanas consecutivas con al menos una sesión, contando hacia atrás desde
 * `semanaActual` (lunes, "YYYY-MM-DD"). Corta en la primera semana vacía.
 *
 * Cuenta SOLO ShapeUp: es la racha del plan, y una caminata no es cumplirlo.
 */
export function rachaDelPlan(historial: Historial[], semanaActual: string): number {
  const porSemana = new Set(soloShapeUp(historial).map((h) => h.semanaInicio));
  let racha = 0;
  const d = new Date(semanaActual + "T00:00:00");
  while (porSemana.has(ymdLocal(d))) {
    racha++;
    d.setDate(d.getDate() - 7);
  }
  return racha;
}

/**
 * Días DISTINTOS con alguna actividad entre `desde` y `hasta`, ambos inclusive
 * ("YYYY-MM-DD"). Dos sesiones el mismo día son un día.
 *
 * Cuenta TODO, externas incluidas: habla de moverse, no de cumplir el plan.
 */
export function diasActivos(historial: Historial[], desde: string, hasta: string): number {
  const dias = new Set<string>();
  for (const h of historial) {
    if (h.fechaRealizada >= desde && h.fechaRealizada <= hasta) dias.add(h.fechaRealizada);
  }
  return dias.size;
}
