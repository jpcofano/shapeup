// ════════════════════════════════════════════════════════════════════════════
//  lib/tendencias.ts — agregación pura para tendencias largas de salud (I1).
//
//  Núcleo puro (ADR #009): recibe lecturas ya filtradas por métrica, agrupa en
//  buckets según el rango pedido y devuelve la serie lista para graficar. El
//  componente (`TrendChart`) solo dibuja — ningún cálculo vive ahí.
//
//  Origen: auditoría 2026-07-13 — diez años de datos dormidos (1537 días de
//  FC, 552 de SpO2, 154 de presión, 251 pesajes, 1363 noches) sin forma de
//  verse como tendencia. Ver docs/prompts/58-i1-progreso-tendencias.md.
// ════════════════════════════════════════════════════════════════════════════

import { lunesDeSemana } from "./semana";

export type RangoTendencia = "3m" | "1a" | "5a" | "todo";

export interface PuntoTendencia {
  fecha: string;      // representante del bucket (día, semana o mes)
  valor: number;       // mediana del bucket
  min?: number;        // banda min-máx del bucket (solo si hay ≥ 2 lecturas)
  max?: number;
}

export interface SerieTendencia {
  puntos: PuntoTendencia[];
  actual?: number;          // mediana de las últimas 7 lecturas, dentro de los últimos 90 días
  haceUnAnio?: number;      // mediana de lecturas en ventana ±14 días alrededor de hoy−365
  deltaAnualPct?: number;   // (actual − haceUnAnio) / haceUnAnio — solo si ambas ventanas alcanzan
}

/** Lecturas mínimas en cada ventana (actual / hace un año) para confiar en `deltaAnualPct`. */
export const MIN_DATOS_DELTA_ANUAL = 5;
/** Datos totales mínimos para que una métrica aparezca como chip seleccionable en Progreso. */
export const MIN_DATOS_CHIP = 10;
/** El componente solo llama a esto — ninguna decisión de "qué mostrar" vive ahí (ADR #009). */
export function alcanzaMinimoChip(cantidadDatos: number): boolean {
  return cantidadDatos >= MIN_DATOS_CHIP;
}
/** Cantidad de lecturas recientes que arma la ventana "actual". */
const N_ACTUAL = 7;
/** Tope de antigüedad para "actual": sin lecturas en los últimos 90 días, no hay "ahora" honesto que mostrar. */
const VENTANA_ACTUAL_DIAS = 90;
/** Medio ancho (días) de la ventana "hace un año" — ventana total de 28 días. */
const MEDIO_ANCHO_HACE_UN_ANIO_DIAS = 14;

const DIAS_POR_RANGO: Record<RangoTendencia, number | undefined> = {
  "3m": 90, "1a": 365, "5a": 5 * 365, "todo": undefined,
};

// ── Helpers de fecha ──────────────────────────────────────────────────────────

function addDays(fecha: string, n: number): string {
  const d = new Date(fecha + "T12:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function mediana(nums: number[]): number {
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** Clave de bucket según el rango: diario (3m), semanal (1a, lunes de la semana), mensual (5a/todo). */
function claveBucket(fecha: string, rango: RangoTendencia): string {
  if (rango === "3m") return fecha;
  if (rango === "1a") return lunesDeSemana(fecha);
  return fecha.slice(0, 7) + "-01"; // "YYYY-MM-01": representante del mes
}

// ── Núcleo puro ───────────────────────────────────────────────────────────────

/**
 * Agrega `valores` en una `SerieTendencia` lista para graficar.
 *
 * Bucketing (para no renderizar miles de puntos): "3m" → diario, "1a" →
 * semanal, "5a"/"todo" → mensual. Un bucket sin lecturas simplemente no
 * genera punto — no se interpola (el chart corta la línea ahí; mejor
 * honesto que inventar continuidad donde hubo épocas sin reloj).
 */
export function serieTendencia(
  valores: { fecha: string; valor: number }[],
  rango: RangoTendencia,
  hoy: string,
): SerieTendencia {
  const dias = DIAS_POR_RANGO[rango];
  const desde = dias != null ? addDays(hoy, -dias) : undefined;
  const enRango = valores.filter((v) => v.fecha <= hoy && (desde == null || v.fecha >= desde));

  // ── Bucketing para el chart ──────────────────────────────────────────────
  const buckets = new Map<string, number[]>();
  for (const v of enRango) {
    const clave = claveBucket(v.fecha, rango);
    const arr = buckets.get(clave) ?? [];
    arr.push(v.valor);
    buckets.set(clave, arr);
  }
  const puntos: PuntoTendencia[] = [...buckets.entries()]
    .map(([fecha, nums]) => ({
      fecha,
      valor: mediana(nums),
      min: nums.length > 1 ? Math.min(...nums) : undefined,
      max: nums.length > 1 ? Math.max(...nums) : undefined,
    }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha));

  // ── Resumen "ahora vs. hace un año" (usa TODAS las lecturas, no el bucketing) ──
  // "actual" no busca más allá de VENTANA_ACTUAL_DIAS: sin lecturas recientes,
  // mostrar una mediana armada con datos de hace meses como si fuera "ahora"
  // sería engañoso, no "honesto" (mismo espíritu que la recencia de S-fix-b).
  const desdeActual = addDays(hoy, -VENTANA_ACTUAL_DIAS);
  const recientes = [...valores]
    .filter((v) => v.fecha <= hoy && v.fecha >= desdeActual)
    .sort((a, b) => b.fecha.localeCompare(a.fecha));
  const ultimasN = recientes.slice(0, N_ACTUAL);
  const actual = ultimasN.length > 0 ? mediana(ultimasN.map((v) => v.valor)) : undefined;

  const centroHaceUnAnio = addDays(hoy, -365);
  const desdeHaceUnAnio = addDays(centroHaceUnAnio, -MEDIO_ANCHO_HACE_UN_ANIO_DIAS);
  const hastaHaceUnAnio = addDays(centroHaceUnAnio, MEDIO_ANCHO_HACE_UN_ANIO_DIAS);
  const ventanaHaceUnAnio = valores.filter((v) => v.fecha >= desdeHaceUnAnio && v.fecha <= hastaHaceUnAnio);
  const haceUnAnio = ventanaHaceUnAnio.length > 0 ? mediana(ventanaHaceUnAnio.map((v) => v.valor)) : undefined;

  const deltaAnualPct =
    actual != null && haceUnAnio != null && haceUnAnio !== 0 &&
    ultimasN.length >= MIN_DATOS_DELTA_ANUAL && ventanaHaceUnAnio.length >= MIN_DATOS_DELTA_ANUAL
      ? (actual - haceUnAnio) / haceUnAnio
      : undefined;

  return { puntos, actual, haceUnAnio, deltaAnualPct };
}
