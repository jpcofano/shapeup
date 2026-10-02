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
//  no, las de `fcMaxTeorica` con la convención de Samsung. Sin ninguna, no hay
//  zonas.
//
//  **De la FC máxima a las zonas hay una sola función** (P97, ADR #045):
//  `zonasDesdeFcMax`. La usan el seed, el botón de Configuración, la revisión
//  de la FC máxima y el respaldo de `pisosDe`. No hay otra copia del cálculo.
//
//  Puro (ADR #009).
// ════════════════════════════════════════════════════════════════════════════
import type { PerfilMiembro, ZonaFC } from "../types/models";

export type RangosZonas = Record<ZonaFC, { min: number; max: number }>;

/** Piso de Z1, en % de la FC máxima (P97). */
export const PCT_PISO_Z1 = 50;
/** Techo de Z1 a Z4, en % de la FC máxima. El de Z5 es la FC máxima. */
export const PCT_TECHO: Record<Exclude<ZonaFC, "Z5">, number> = { Z1: 60, Z2: 70, Z3: 80, Z4: 90 };

/**
 * Las cinco zonas desde la FC máxima, como las cuenta Samsung (P97, ADR #045),
 * deducido de sus números con 169 → 84-101 · 102-118 · 119-135 · 136-152 · 153-169:
 *   - techo de Z1 a Z4 = `floor(pct × fcMax)`, con 60 / 70 / 80 / 90 %;
 *   - piso de la zona siguiente = techo anterior + 1;
 *   - piso de Z1 = `floor(50 % × fcMax)`; techo de Z5 = `fcMax`.
 *
 * **Con enteros, a propósito**: en punto flotante `0.7 × 170` da
 * `118.99999999999999` y el `floor` lo baja a 118. `70 × 170 / 100` es exacto.
 */
export function zonasDesdeFcMax(fcMax: number): RangosZonas {
  const f = Math.round(fcMax);
  const techo = (pct: number) => Math.floor((pct * f) / 100);
  const z1 = { min: techo(PCT_PISO_Z1), max: techo(PCT_TECHO.Z1) };
  const z2 = { min: z1.max + 1, max: techo(PCT_TECHO.Z2) };
  const z3 = { min: z2.max + 1, max: techo(PCT_TECHO.Z3) };
  const z4 = { min: z3.max + 1, max: techo(PCT_TECHO.Z4) };
  const z5 = { min: z4.max + 1, max: f };
  return { Z1: z1, Z2: z2, Z3: z3, Z4: z4, Z5: z5 };
}

const DE_ARRIBA_A_ABAJO: ZonaFC[] = ["Z5", "Z4", "Z3", "Z2", "Z1"];

/** Un piso por zona, de Z5 a Z1. */
export type Pisos = { zona: ZonaFC; min: number }[];

/**
 * ¿Las zonas son las de esta FC máxima? (P97) Para el aviso del editor, que no
 * bloquea: las zonas a medida se pueden guardar igual. Sin zonas, no hay nada
 * que no corresponda.
 */
export function zonasCorresponden(
  zonas: Partial<RangosZonas> | undefined, fcMax: number | null | undefined,
): boolean {
  if (fcMax == null || !zonas || Object.keys(zonas).length === 0) return true;
  const esperadas = zonasDesdeFcMax(fcMax);
  return (["Z1", "Z2", "Z3", "Z4", "Z5"] as const).every((z) =>
    zonas[z]?.min === esperadas[z].min && zonas[z]?.max === esperadas[z].max);
}

/**
 * Las zonas con que se calcula, o `null` si no hay con qué armarlas. Las zonas
 * a medida mandan; si no hay ninguna, salen de `fcMaxTeorica` con
 * `zonasDesdeFcMax`. Es lo que cada sesión guarda como `zonasUsadas` (P97).
 */
export function zonasEfectivas(
  perfil?: Pick<PerfilMiembro, "zonasFC" | "fcMaxTeorica"> | null,
): Partial<RangosZonas> | null {
  const aMedida = perfil?.zonasFC;
  if (aMedida && DE_ARRIBA_A_ABAJO.some((z) => aMedida[z])) {
    const out: Partial<RangosZonas> = {};
    for (const z of [...DE_ARRIBA_A_ABAJO].reverse()) {
      const r = aMedida[z];
      if (r) out[z] = { min: r.min, max: r.max };
    }
    return out;
  }
  const fcMax = perfil?.fcMaxTeorica;
  return fcMax ? zonasDesdeFcMax(fcMax) : null;
}

/** Los pisos del perfil, de Z5 a Z1, o `null` si no hay con qué armar zonas. */
export function pisosDe(
  perfil?: Pick<PerfilMiembro, "zonasFC" | "fcMaxTeorica"> | null,
): Pisos | null {
  const zonas = zonasEfectivas(perfil);
  if (!zonas) return null;
  return DE_ARRIBA_A_ABAJO
    .filter((z) => zonas[z] != null)
    .map((z) => ({ zona: z, min: zonas[z]!.min }));
}

/**
 * La zona de `fc` según los pisos: la más alta cuyo piso alcanzó. `null` =
 * por debajo de todos los pisos ("bajo zonas").
 */
export function zonaPorPiso(fc: number, pisos: Pisos): ZonaFC | null {
  for (const p of pisos) if (fc >= p.min) return p.zona;
  return null;
}
