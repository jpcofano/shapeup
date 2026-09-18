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
import { soloShapeUp, esShapeUp } from "./tipoHistorial";
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

// ── Días activos con su origen (P75b) ────────────────────────────────────────

/**
 * Un día con actividad y de dónde vino. Las tres marcas no son excluyentes: un
 * día puede tener una sesión de la app Y una caminata.
 */
export interface DiaActivo {
  fecha: string;               // "YYYY-MM-DD"
  shapeUp: boolean;            // entrenaste en la app
  externaDeclarada: boolean;   // actividad que arrancaste vos
  autodetectada: boolean;      // el reloj la registró solo
}

/**
 * Agrupa entradas de historial en días, con las marcas de cada origen.
 * Núcleo puro de `data/historial.getDiasActivos`.
 *
 * **No decide por el consumidor**: devuelve las tres marcas y cada quien elige
 * qué cuenta. La racha del plan mira `shapeUp`; "me moví" puede incluir o no lo
 * autodetectado. Ordenado por fecha ascendente.
 */
export function agruparDiasActivos(historial: Historial[]): DiaActivo[] {
  const porFecha = new Map<string, DiaActivo>();

  for (const h of historial) {
    const fecha = h.fechaRealizada;
    if (!fecha) continue;
    const dia = porFecha.get(fecha)
      ?? { fecha, shapeUp: false, externaDeclarada: false, autodetectada: false };

    if (esShapeUp(h)) {
      dia.shapeUp = true;
    } else if (h.externa?.origen === "autodetectada") {
      dia.autodetectada = true;
    } else {
      // Externa sin marca de origen (anterior a P75b): se asume declarada, que
      // es lo conservador — no la escondemos detrás del filtro de autodetectadas.
      dia.externaDeclarada = true;
    }

    porFecha.set(fecha, dia);
  }

  return [...porFecha.values()].sort((a, b) => a.fecha.localeCompare(b.fecha));
}
