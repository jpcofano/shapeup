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

/** Comparación "ahora vs. X" — X depende del rango activo (P64: antes era siempre "hace un año"). */
export interface ComparacionTendencia {
  etiqueta: string;    // "hace 3 meses" | "hace un año" | "hace 5 años" | "vs 2021" | "primera medición (2015)"
  valor: number;
  deltaPct?: number;   // (actual − valor) / valor — solo si ambas ventanas alcanzan MIN_DATOS_DELTA_ANUAL
}

export interface SerieTendencia {
  puntos: PuntoTendencia[];
  actual?: number;                    // mediana de las últimas 7 lecturas, dentro de los últimos 90 días
  comparacion?: ComparacionTendencia;
  minMax?: { min: number; max: number }; // extremos del período — solo rango "todo"
}

/** Lecturas mínimas en cada ventana (actual / hace un año) para confiar en `deltaAnualPct`. */
export const MIN_DATOS_DELTA_ANUAL = 5;
/** Datos totales mínimos para que una métrica aparezca como chip seleccionable en Progreso. */
export const MIN_DATOS_CHIP = 10;
/** El componente solo llama a esto — ninguna decisión de "qué mostrar" vive ahí (ADR #009). */
export function alcanzaMinimoChip(cantidadDatos: number): boolean {
  return cantidadDatos >= MIN_DATOS_CHIP;
}
/** Cantidad de lecturas recientes que arma la ventana "actual" (y las ventanas de comparación). */
const N_ACTUAL = 7;
/** Tope de antigüedad para "actual": sin lecturas en los últimos 90 días, no hay "ahora" honesto que mostrar. */
const VENTANA_ACTUAL_DIAS = 90;

const DIAS_POR_RANGO: Record<RangoTendencia, number | undefined> = {
  "3m": 90, "1a": 365, "5a": 5 * 365, "todo": undefined,
};

/** Punto de comparación y medio ancho de la ventana (días) alrededor de él, por rango. "todo" se resuelve aparte. */
const CONFIG_COMPARACION: Record<"3m" | "1a" | "5a", { diasAtras: number; medioAncho: number; etiqueta: string }> = {
  "3m": { diasAtras: 90,        medioAncho: 7,  etiqueta: "hace 3 meses" },
  "1a": { diasAtras: 365,       medioAncho: 14, etiqueta: "hace un año" },
  "5a": { diasAtras: 5 * 365,   medioAncho: 30, etiqueta: "hace 5 años" },
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

  // ── Comparación "ahora vs. X": X depende del rango activo, no siempre "hace un año" ──
  let comparacion: ComparacionTendencia | undefined;
  if (actual != null) {
    if (rango === "todo") {
      // "Primera medición": mediana de las N_ACTUAL lecturas más viejas (mismo
      // criterio de robustez que "actual", pero en el otro extremo del tiempo).
      const masViejas = [...valores]
        .filter((v) => v.fecha <= hoy)
        .sort((a, b) => a.fecha.localeCompare(b.fecha))
        .slice(0, N_ACTUAL);
      if (masViejas.length > 0) {
        const valor = mediana(masViejas.map((v) => v.valor));
        const anio  = masViejas[0].fecha.slice(0, 4);
        const deltaPct = valor !== 0 && masViejas.length >= MIN_DATOS_DELTA_ANUAL && ultimasN.length >= MIN_DATOS_DELTA_ANUAL
          ? (actual - valor) / valor : undefined;
        comparacion = { etiqueta: `primera medición (${anio})`, valor, deltaPct };
      }
    } else {
      const cfg = CONFIG_COMPARACION[rango];
      const centro = addDays(hoy, -cfg.diasAtras);
      const ventana = valores.filter(
        (v) => v.fecha >= addDays(centro, -cfg.medioAncho) && v.fecha <= addDays(centro, cfg.medioAncho),
      );
      if (ventana.length > 0) {
        const valor = mediana(ventana.map((v) => v.valor));
        const deltaPct = valor !== 0 && ventana.length >= MIN_DATOS_DELTA_ANUAL && ultimasN.length >= MIN_DATOS_DELTA_ANUAL
          ? (actual - valor) / valor : undefined;
        comparacion = { etiqueta: cfg.etiqueta, valor, deltaPct };
      } else if (rango === "5a" && enRango.length > 0) {
        // Sin dato en la ventana de "hace 5 años": el más viejo dentro del rango de 5 años.
        const masViejasEnRango = [...enRango].sort((a, b) => a.fecha.localeCompare(b.fecha)).slice(0, N_ACTUAL);
        const valor = mediana(masViejasEnRango.map((v) => v.valor));
        const anio  = masViejasEnRango[0].fecha.slice(0, 4);
        const deltaPct = valor !== 0 && masViejasEnRango.length >= MIN_DATOS_DELTA_ANUAL && ultimasN.length >= MIN_DATOS_DELTA_ANUAL
          ? (actual - valor) / valor : undefined;
        comparacion = { etiqueta: `vs ${anio}`, valor, deltaPct };
      }
    }
  }

  // Extremos del período — solo tienen sentido narrativo en rangos largos ("todo").
  const minMax = rango === "todo" && enRango.length > 0
    ? { min: Math.min(...enRango.map((v) => v.valor)), max: Math.max(...enRango.map((v) => v.valor)) }
    : undefined;

  return { puntos, actual, comparacion, minMax };
}
