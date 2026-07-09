import type { MetricaSalud, RegistroSueno, MedicionCorporal } from "../types/models";
import { consolidarNoches, promedioNoches } from "./sueno";

export type EstadoSenal = "ok" | "atencion" | "alerta" | "sin-datos";

export interface SenalSalud {
  clave: "fc-reposo" | "sueno" | "hrv" | "pasos" | "peso" | "presion" | "spo2";
  valorActual?: number;
  /** Override de texto para el valor mostrado (p.ej. presión «113/78»). Si está, la UI lo prioriza sobre `valorActual`. */
  valorTexto?: string;
  unidad: string;
  baseline?: number;
  deltaPct?: number;
  estado: EstadoSenal;
  motivo?: string;
  serie14d: { fecha: string; valor: number }[];
}

// Rango de recencia: no mostrar como "actual" un valor de hace más de 60 días
// (presión/SpO2 se miden por rachas, no todos los días — ver decisión owner S-fix-b).
const DIAS_RECENCIA_INFORMATIVA = 60;

// Rangos de referencia publicados (AHA/ACC 2017 para presión; guías clínicas
// generales de SpO2 en reposo a nivel del mar). Solo para el texto del motivo
// — la app nunca diagnostica ni cambia el semáforo por esto.
export const PRESION_SISTOLICA_MIN_TIPICA  = 90;
export const PRESION_SISTOLICA_MAX_TIPICA  = 140;
export const PRESION_DIASTOLICA_MIN_TIPICA = 60;
export const PRESION_DIASTOLICA_MAX_TIPICA = 90;
export const SPO2_MIN_TIPICO               = 95;

const MOTIVO_FUERA_DE_RANGO = "Valor fuera del rango típico — vale la pena comentarlo con tu médico.";

// Umbrales exportados — los reutiliza S3 (motor de recomendaciones).
export const UMBRAL_FC_REPOSO_ATENCION_BPM = 5;
export const UMBRAL_FC_REPOSO_ALERTA_BPM   = 8;
export const UMBRAL_SUENO_ATENCION_H       = 6.5;
export const UMBRAL_SUENO_ALERTA_H         = 5.5;
export const UMBRAL_HRV_ATENCION_PCT       = 0.15;
export const UMBRAL_HRV_ALERTA_PCT         = 0.25;
export const UMBRAL_PASOS_ATENCION_PCT     = 0.40;
export const MIN_DATOS_BASELINE            = 7;

// ── Helpers internos ──────────────────────────────────────────────────────────

function mediana(valores: number[]): number {
  const sorted = [...valores].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

function addDays(fecha: string, n: number): string {
  const d = new Date(fecha + "T12:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Mediana de los valores en la ventana días 8–35 antes de `hoy`.
 *  Devuelve `undefined` si hay menos de MIN_DATOS_BASELINE puntos en la ventana. */
function calcBaseline(
  items: { fecha: string; valor: number }[],
  hoy: string,
): number | undefined {
  const desde = addDays(hoy, -35);
  const hasta = addDays(hoy, -8);
  const enVentana = items.filter((i) => i.fecha >= desde && i.fecha <= hasta);
  if (enVentana.length < MIN_DATOS_BASELINE) return undefined;
  return mediana(enVentana.map((i) => i.valor));
}

/** Últimos 14 días con dato, ordenados cronológicamente (para sparkline). */
function calcSerie14d(
  items: { fecha: string; valor: number }[],
  hoy: string,
): { fecha: string; valor: number }[] {
  const desde = addDays(hoy, -14);
  return items
    .filter((i) => i.fecha >= desde && i.fecha <= hoy)
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
}

/** Promedio de los primeros N items (ya ordenados fecha desc → los más recientes). */
function promedioUltimosN(
  items: { valor: number }[],
  n: number,
): number | undefined {
  const chunk = items.slice(0, n);
  if (chunk.length === 0) return undefined;
  return chunk.reduce((s, i) => s + i.valor, 0) / chunk.length;
}

// ── Función principal ─────────────────────────────────────────────────────────

export function calcularResumenSalud(
  metricas: MetricaSalud[],       // ya filtradas por miembro
  sueno: RegistroSueno[],
  mediciones: MedicionCorporal[],
  hoy: string,                    // "YYYY-MM-DD" inyectado (testeable)
): SenalSalud[] {
  const senales: SenalSalud[] = [];

  // ── FC en reposo ────────────────────────────────────────────────────────────
  {
    const items = metricas
      .filter((m) => m.tipo === "fc-reposo")
      .map((m) => ({ fecha: m.fecha, valor: m.valor }))
      .sort((a, b) => b.fecha.localeCompare(a.fecha));

    if (items.length > 0) {
      const baseline = calcBaseline(items, hoy);
      const actual   = promedioUltimosN(items, 3);
      const s14      = calcSerie14d(items, hoy);

      // sin-datos (sin actual o sin baseline): nunca mostrar valorActual — un
      // número "huérfano" junto a "sin-datos" es confuso (y puede ser un
      // valor viejo si la última lectura quedó lejos de `hoy`). Card ausente
      // o explícitamente vacía, no un número suelto (S-fix-b).
      if (actual == null || baseline == null) {
        senales.push({ clave: "fc-reposo", unidad: "bpm", estado: "sin-datos", serie14d: s14 });
      } else {
        const delta    = actual - baseline;
        const deltaPct = delta / baseline;
        let estado: EstadoSenal = "ok";
        let motivo: string | undefined;
        if (delta >= UMBRAL_FC_REPOSO_ALERTA_BPM) {
          estado = "alerta";
          motivo = `FC reposo +${delta.toFixed(1)} bpm vs tus últimas 4 semanas`;
        } else if (delta >= UMBRAL_FC_REPOSO_ATENCION_BPM) {
          estado = "atencion";
          motivo = `FC reposo +${delta.toFixed(1)} bpm vs tus últimas 4 semanas`;
        }
        senales.push({
          clave: "fc-reposo", valorActual: Math.round(actual), unidad: "bpm",
          baseline: Math.round(baseline), deltaPct, estado, motivo, serie14d: s14,
        });
      }
    }
  }

  // ── Sueño (consolidado por noche) ──────────────────────────────────────────
  {
    const noches = consolidarNoches(sueno); // una entrada por fecha, suma noche+siestas
    if (noches.length > 0) {
      // promedioNoches requiere ≥ 3 noches; aquí usamos 3 recientes
      const actual   = promedioNoches(noches, 3);
      // Para baseline y serie14d usamos los horasTotal como items fecha/valor
      const items    = noches.map((n) => ({ fecha: n.fecha, valor: n.horasTotal }));
      const baseline = calcBaseline(items, hoy);
      const s14      = calcSerie14d(items, hoy);
      const deltaPct = actual != null && baseline != null
        ? (actual - baseline) / baseline : undefined;

      let estado: EstadoSenal;
      let motivo: string | undefined;
      if (actual == null) {
        // Menos de 3 noches → sin-datos (pero mostramos la última si hay)
        const ultimaVal = noches[0]?.horasTotal;
        estado = "sin-datos";
        senales.push({
          clave: "sueno",
          valorActual: ultimaVal != null ? +ultimaVal.toFixed(1) : undefined,
          unidad: "h", estado, serie14d: s14,
        });
      } else if (actual < UMBRAL_SUENO_ALERTA_H) {
        estado = "alerta";
        motivo = `Promedio ${actual.toFixed(1)} h/noche (últimas noches)`;
        senales.push({
          clave: "sueno", valorActual: +actual.toFixed(1), unidad: "h",
          baseline: baseline != null ? +baseline.toFixed(1) : undefined,
          deltaPct, estado, motivo, serie14d: s14,
        });
      } else if (actual < UMBRAL_SUENO_ATENCION_H) {
        estado = "atencion";
        motivo = `Promedio ${actual.toFixed(1)} h/noche (últimas noches)`;
        senales.push({
          clave: "sueno", valorActual: +actual.toFixed(1), unidad: "h",
          baseline: baseline != null ? +baseline.toFixed(1) : undefined,
          deltaPct, estado, motivo, serie14d: s14,
        });
      } else {
        estado = "ok";
        senales.push({
          clave: "sueno", valorActual: +actual.toFixed(1), unidad: "h",
          baseline: baseline != null ? +baseline.toFixed(1) : undefined,
          deltaPct, estado, serie14d: s14,
        });
      }
    }
  }

  // ── HRV ─────────────────────────────────────────────────────────────────────
  // Si no hay datos HRV en absoluto → no listar (no todos los relojes la exportan).
  {
    const items = metricas
      .filter((m) => m.tipo === "hrv")
      .map((m) => ({ fecha: m.fecha, valor: m.valor }))
      .sort((a, b) => b.fecha.localeCompare(a.fecha));

    if (items.length > 0) {
      const baseline = calcBaseline(items, hoy);
      const actual   = promedioUltimosN(items, 3);
      const s14      = calcSerie14d(items, hoy);

      if (actual != null && baseline != null) {
        const deltaPct = (actual - baseline) / baseline;
        let estado: EstadoSenal = "ok";
        let motivo: string | undefined;
        if (deltaPct <= -UMBRAL_HRV_ALERTA_PCT) {
          estado = "alerta";
          motivo = `HRV ${Math.round(actual)} ms · −${Math.abs(deltaPct * 100).toFixed(0)}% vs tus últimas 4 semanas`;
        } else if (deltaPct <= -UMBRAL_HRV_ATENCION_PCT) {
          estado = "atencion";
          motivo = `HRV ${Math.round(actual)} ms · −${Math.abs(deltaPct * 100).toFixed(0)}% vs tus últimas 4 semanas`;
        }
        senales.push({
          clave: "hrv", valorActual: Math.round(actual), unidad: "ms",
          baseline: Math.round(baseline), deltaPct, estado, motivo, serie14d: s14,
        });
      }
    }
  }

  // ── Pasos ───────────────────────────────────────────────────────────────────
  {
    const items = metricas
      .filter((m) => m.tipo === "pasos")
      .map((m) => ({ fecha: m.fecha, valor: m.valor }))
      .sort((a, b) => b.fecha.localeCompare(a.fecha));

    if (items.length > 0) {
      const baseline = calcBaseline(items, hoy);
      const actual   = promedioUltimosN(items, 7);
      const s14      = calcSerie14d(items, hoy);

      if (actual == null) {
        senales.push({ clave: "pasos", unidad: "pasos", estado: "sin-datos", serie14d: s14 });
      } else if (baseline == null) {
        senales.push({
          clave: "pasos", valorActual: Math.round(actual),
          unidad: "pasos", estado: "sin-datos", serie14d: s14,
        });
      } else {
        const deltaPct = (actual - baseline) / baseline;
        let estado: EstadoSenal = "ok";
        let motivo: string | undefined;
        if (deltaPct <= -UMBRAL_PASOS_ATENCION_PCT) {
          estado = "atencion";
          motivo = `Pasos −${Math.abs(deltaPct * 100).toFixed(0)}% vs tus últimas 4 semanas`;
        }
        senales.push({
          clave: "pasos", valorActual: Math.round(actual), unidad: "pasos",
          baseline: Math.round(baseline), deltaPct, estado, motivo, serie14d: s14,
        });
      }
    }
  }

  // ── Peso ─────────────────────────────────────────────────────────────────────
  {
    const items = mediciones
      .filter((m) => m.pesoKg != null)
      .map((m) => ({ fecha: m.fecha, valor: m.pesoKg! }))
      .sort((a, b) => b.fecha.localeCompare(a.fecha));

    if (items.length > 0) {
      const actual   = items[0].valor;
      const baseline = calcBaseline(items, hoy);
      const s14      = calcSerie14d(items, hoy);
      const deltaPct = baseline != null ? (actual - baseline) / baseline : undefined;

      senales.push({
        clave: "peso", valorActual: actual, unidad: "kg",
        baseline, deltaPct, estado: "ok", serie14d: s14,
      });
    }
  }

  // ── Presión arterial (informativa, sin semáforo) ────────────────────────────
  {
    const sisPorFecha = new Map<string, number>();
    const diaPorFecha = new Map<string, number>();
    for (const m of metricas) {
      if (m.tipo === "presion-sistolica")  sisPorFecha.set(m.fecha, m.valor);
      if (m.tipo === "presion-diastolica") diaPorFecha.set(m.fecha, m.valor);
    }
    // Último día con AMBOS valores (el par tiene que ser del mismo día, no mezclar fechas).
    const fechaMasReciente = [...sisPorFecha.keys()]
      .filter((f) => diaPorFecha.has(f))
      .sort((a, b) => b.localeCompare(a))[0];

    if (fechaMasReciente != null && addDays(hoy, -DIAS_RECENCIA_INFORMATIVA) <= fechaMasReciente) {
      const sistolica  = sisPorFecha.get(fechaMasReciente)!;
      const diastolica = diaPorFecha.get(fechaMasReciente)!;
      const itemsSis   = [...sisPorFecha.entries()].map(([fecha, valor]) => ({ fecha, valor }));
      const baseline   = calcBaseline(itemsSis, hoy);
      const deltaPct   = baseline != null ? (sistolica - baseline) / baseline : undefined;
      const fueraDeRango =
        sistolica  < PRESION_SISTOLICA_MIN_TIPICA  || sistolica  > PRESION_SISTOLICA_MAX_TIPICA ||
        diastolica < PRESION_DIASTOLICA_MIN_TIPICA || diastolica > PRESION_DIASTOLICA_MAX_TIPICA;

      senales.push({
        clave: "presion",
        valorActual: Math.round(sistolica),
        valorTexto: `${Math.round(sistolica)}/${Math.round(diastolica)}`,
        unidad: "mmHg", baseline, deltaPct, estado: "ok",
        motivo: fueraDeRango ? MOTIVO_FUERA_DE_RANGO : undefined,
        serie14d: calcSerie14d(itemsSis, hoy),
      });
    }
  }

  // ── SpO2 (informativa, sin semáforo) ────────────────────────────────────────
  {
    const items = metricas
      .filter((m) => m.tipo === "spo2")
      .map((m) => ({ fecha: m.fecha, valor: m.valor }))
      .sort((a, b) => b.fecha.localeCompare(a.fecha));

    if (items.length > 0 && addDays(hoy, -DIAS_RECENCIA_INFORMATIVA) <= items[0].fecha) {
      const actual   = items[0].valor;
      const baseline = calcBaseline(items, hoy);
      const deltaPct = baseline != null ? (actual - baseline) / baseline : undefined;

      senales.push({
        clave: "spo2", valorActual: actual, unidad: "%",
        baseline, deltaPct, estado: "ok",
        motivo: actual < SPO2_MIN_TIPICO ? MOTIVO_FUERA_DE_RANGO : undefined,
        serie14d: calcSerie14d(items, hoy),
      });
    }
  }

  return senales;
}

/** Peor estado entre todas las señales (usado para el badge de la tab y S3). */
export function senalPeor(senales: SenalSalud[]): EstadoSenal {
  const PRIO: Record<EstadoSenal, number> = {
    "alerta": 3, "atencion": 2, "ok": 1, "sin-datos": 0,
  };
  let peor: EstadoSenal = "sin-datos";
  for (const s of senales) {
    if (PRIO[s.estado] > PRIO[peor]) peor = s.estado;
  }
  return peor;
}
