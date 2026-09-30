// ════════════════════════════════════════════════════════════════════════════
//  lib/zonas.ts — de qué zona es una FC. Una sola regla (P92, enmienda).
//
//  **La zona es la más alta cuyo piso se alcanzó.** Se recorre Z5 → Z1 y gana
//  la primera con `fc >= min`. El techo no se mira. Con eso no hay grietas:
//    - entre el techo de una zona y el piso de la siguiente → la de abajo;
//    - por encima del techo de Z5 → Z5;
//    - por debajo del piso de Z1 → ninguna ("bajo zonas", no "sin dato").
//
//  La usan `derivarZona` (la zona principal de una sesión o actividad) y
//  `minutosPorZona` (el reparto de la curva). Una sola implementación: dos
//  versiones de lo mismo se desincronizan solas.
//
//  De dónde salen los pisos: las `zonasFC` a medida si el perfil las tiene; si
//  no, las bandas estándar de `fcMaxTeorica`. Sin ninguna, no hay zonas.
//
//  Puro (ADR #009).
// ════════════════════════════════════════════════════════════════════════════
import type { PerfilMiembro, ZonaFC } from "../types/models";

/**
 * Bandas estándar de %FCmáx (fallback cuando no hay `zonasFC` a medida):
 * Z1 50-60 %, Z2 60-70 %, Z3 70-80 %, Z4 80-90 %, Z5 90-100 %.
 */
export const BANDAS_PCT_FC_MAX: Record<ZonaFC, { min: number; max: number }> = {
  Z1: { min: 0.50, max: 0.60 },
  Z2: { min: 0.60, max: 0.70 },
  Z3: { min: 0.70, max: 0.80 },
  Z4: { min: 0.80, max: 0.90 },
  Z5: { min: 0.90, max: 1.00 },
};

const DE_ARRIBA_A_ABAJO: ZonaFC[] = ["Z5", "Z4", "Z3", "Z2", "Z1"];

/** Un piso por zona, de Z5 a Z1. */
export type Pisos = { zona: ZonaFC; min: number }[];

/**
 * Los pisos del perfil, o `null` si no hay con qué armar zonas. Las zonas a
 * medida mandan; las bandas de `fcMaxTeorica` son el respaldo cuando no hay
 * ninguna zona a medida.
 */
export function pisosDe(
  perfil?: Pick<PerfilMiembro, "zonasFC" | "fcMaxTeorica"> | null,
): Pisos | null {
  const aMedida = perfil?.zonasFC;
  if (aMedida && DE_ARRIBA_A_ABAJO.some((z) => aMedida[z])) {
    return DE_ARRIBA_A_ABAJO
      .filter((z) => aMedida[z] != null)
      .map((z) => ({ zona: z, min: aMedida[z]!.min }));
  }
  const fcMax = perfil?.fcMaxTeorica;
  if (fcMax) {
    return DE_ARRIBA_A_ABAJO.map((z) => ({ zona: z, min: BANDAS_PCT_FC_MAX[z].min * fcMax }));
  }
  return null;
}

/**
 * La zona de `fc` según los pisos: la más alta cuyo piso alcanzó. `null` =
 * por debajo de todos los pisos ("bajo zonas").
 */
export function zonaPorPiso(fc: number, pisos: Pisos): ZonaFC | null {
  for (const p of pisos) if (fc >= p.min) return p.zona;
  return null;
}
