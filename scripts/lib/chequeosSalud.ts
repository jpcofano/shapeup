// ════════════════════════════════════════════════════════════════════════════
//  scripts/lib/chequeosSalud.ts — los chequeos de calidad de los datos de salud
//  (P105). Puros: reciben lo leído de Firestore y devuelven hallazgos; los usa
//  scripts/auditoria-calidad-salud.ts, que solo lee.
//
//  Cuatro chequeos por métrica: plausibilidad (rango y unidad), día asignado
//  (la zona horaria), duplicados y origen. La presión, aparte y primero.
// ════════════════════════════════════════════════════════════════════════════
import type { MedicionCorporal, MetricaSalud, RegistroSueno, TipoMetrica } from "../../src/types/models";

/** Rango plausible y unidad esperada por tipo. Fuera de esto, se lista para mirar. */
export const RANGOS: Partial<Record<TipoMetrica, { min: number; max: number; unidad: string }>> = {
  "fc-reposo":               { min: 30,  max: 110,    unidad: "bpm" },
  "fc-media-dia":            { min: 35,  max: 150,    unidad: "bpm" },
  "fc-max-dia":              { min: 40,  max: 230,    unidad: "bpm" },
  "hrv":                     { min: 5,   max: 300,    unidad: "ms" },
  "estres":                  { min: 0,   max: 100,    unidad: "" },
  "pasos":                   { min: 0,   max: 100000, unidad: "pasos" },
  "spo2":                    { min: 70,  max: 100,    unidad: "%" },
  "frecuencia-respiratoria": { min: 6,   max: 40,     unidad: "rpm" },
  "temperatura-piel":        { min: 25,  max: 40,     unidad: "°C" },
  "presion-sistolica":       { min: 60,  max: 260,    unidad: "mmHg" },
  "presion-diastolica":      { min: 30,  max: 160,    unidad: "mmHg" },
  "vo2max":                  { min: 10,  max: 90,     unidad: "ml/kg/min" },
};

/** Una métrica leída, con el id del documento (puede no coincidir con `idMetrica`). */
export type MetricaLeida = MetricaSalud & { idDoc: string };

const contar = (xs: (string | undefined)[]): Record<string, number> => {
  const out: Record<string, number> = {};
  for (const x of xs) out[x ?? "(sin dato)"] = (out[x ?? "(sin dato)"] ?? 0) + 1;
  return out;
};

const diasEntre = (desde: string, hasta: string): number =>
  Math.round((Date.parse(`${hasta}T12:00:00Z`) - Date.parse(`${desde}T12:00:00Z`)) / 86_400_000);

// ── Presión ───────────────────────────────────────────────────────────────────

export interface ChequeoPresion {
  diasSistolica: number;
  diasDiastolica: number;
  diasConPar: number;
  soloSistolica: string[];
  soloDiastolica: string[];
  invertidas: { fecha: string; sistolica: number; diastolica: number }[];
  fueraDeRango: { fecha: string; sistolica?: number; diastolica?: number }[];
  unidades: Record<string, number>;
  fuentes: Record<string, number>;
  agregaciones: Record<string, number>;
  ultimaFecha: string | null;
  diasDesdeUltima: number | null;
  /** Lo que muestra Resumen: el último día con los dos valores (resumenSalud.ts). */
  ultimoParResumen: { fecha: string; sistolica: number; diastolica: number } | null;
  /** Lo último que dibuja Progreso: la sistólica más nueva, tenga o no par. */
  ultimaSistolicaProgreso: { fecha: string; valor: number } | null;
}

export function chequearPresion(metricas: MetricaSalud[], hoy: string): ChequeoPresion {
  const sis = new Map<string, number>();
  const dia = new Map<string, number>();
  const deBp = metricas.filter((m) => m.tipo === "presion-sistolica" || m.tipo === "presion-diastolica");
  for (const m of deBp) (m.tipo === "presion-sistolica" ? sis : dia).set(m.fecha, m.valor);

  const fechas = [...new Set([...sis.keys(), ...dia.keys()])].sort();
  const conPar = fechas.filter((f) => sis.has(f) && dia.has(f));
  const invertidas = conPar
    .filter((f) => sis.get(f)! <= dia.get(f)!)
    .map((f) => ({ fecha: f, sistolica: sis.get(f)!, diastolica: dia.get(f)! }));
  const rs = RANGOS["presion-sistolica"]!, rd = RANGOS["presion-diastolica"]!;
  const fueraDeRango = fechas
    .filter((f) => {
      const s = sis.get(f), d = dia.get(f);
      return (s != null && (s < rs.min || s > rs.max)) || (d != null && (d < rd.min || d > rd.max));
    })
    .map((f) => ({ fecha: f, sistolica: sis.get(f), diastolica: dia.get(f) }));

  const ultimaFecha = fechas.at(-1) ?? null;
  const ultimoPar = conPar.at(-1);
  const sisOrden = [...sis.keys()].sort();
  const ultSis = sisOrden.at(-1);
  return {
    diasSistolica: sis.size,
    diasDiastolica: dia.size,
    diasConPar: conPar.length,
    soloSistolica: fechas.filter((f) => sis.has(f) && !dia.has(f)),
    soloDiastolica: fechas.filter((f) => dia.has(f) && !sis.has(f)),
    invertidas,
    fueraDeRango,
    unidades: contar(deBp.map((m) => m.unidad)),
    fuentes: contar(deBp.map((m) => m.fuente)),
    agregaciones: contar(deBp.map((m) => m.agregacion)),
    ultimaFecha,
    diasDesdeUltima: ultimaFecha ? diasEntre(ultimaFecha, hoy) : null,
    ultimoParResumen: ultimoPar ? { fecha: ultimoPar, sistolica: sis.get(ultimoPar)!, diastolica: dia.get(ultimoPar)! } : null,
    ultimaSistolicaProgreso: ultSis ? { fecha: ultSis, valor: sis.get(ultSis)! } : null,
  };
}

// ── Métricas genéricas ────────────────────────────────────────────────────────

export interface ChequeoTipo {
  tipo: string;
  total: number;
  primera: string | null;
  ultima: string | null;
  fueraDeRango: { fecha: string; valor: number }[];
  unidades: Record<string, number>;
  /** Unidad distinta de la esperada (sin contar las que no tienen unidad). */
  unidadInesperada: number;
  fuentes: Record<string, number>;
  agregaciones: Record<string, number>;
  /** Más de un documento para el mismo tipo y día. */
  diasDuplicados: string[];
  /** Documentos cuyo id no es `${miembro}-${tipo}-${fecha}`. */
  idsFueraDeEsquema: string[];
}

export function chequearMetricas(metricas: MetricaLeida[]): ChequeoTipo[] {
  const porTipo = new Map<string, MetricaLeida[]>();
  for (const m of metricas) porTipo.set(m.tipo, [...(porTipo.get(m.tipo) ?? []), m]);
  return [...porTipo].sort(([a], [b]) => a.localeCompare(b)).map(([tipo, ms]) => {
    const rango = RANGOS[tipo as TipoMetrica];
    const fechas = ms.map((m) => m.fecha).sort();
    const porDia = contar(ms.map((m) => m.fecha));
    return {
      tipo,
      total: ms.length,
      primera: fechas[0] ?? null,
      ultima: fechas.at(-1) ?? null,
      fueraDeRango: rango
        ? ms.filter((m) => m.valor < rango.min || m.valor > rango.max)
            .map((m) => ({ fecha: m.fecha, valor: m.valor })).sort((a, b) => a.fecha.localeCompare(b.fecha))
        : [],
      unidades: contar(ms.map((m) => m.unidad)),
      unidadInesperada: rango ? ms.filter((m) => m.unidad != null && m.unidad !== rango.unidad).length : 0,
      fuentes: contar(ms.map((m) => m.fuente)),
      agregaciones: contar(ms.map((m) => m.agregacion)),
      diasDuplicados: Object.entries(porDia).filter(([, n]) => n > 1).map(([f]) => f).sort(),
      idsFueraDeEsquema: ms
        .filter((m) => m.idDoc !== `${m.miembro}-${m.tipo}-${m.fecha}` || m.idMetrica !== m.idDoc)
        .map((m) => m.idDoc),
    };
  });
}

// ── Sueño ─────────────────────────────────────────────────────────────────────

/** "YYYY-MM-DD" de un epoch en Buenos Aires (−03:00, sin horario de verano desde 2009). */
export function fechaBuenosAires(ms: number): string {
  return new Date(ms - 3 * 3_600_000).toISOString().slice(0, 10);
}

export interface ChequeoSueno {
  total: number;
  fuentes: Record<string, number>;
  /** Tramos de más de 16 h o de 0 h o menos. */
  horasFueraDeRango: { fecha: string; horas: number }[];
  /**
   * Candidatos, no errores confirmados: `fecha` distinta del día local de
   * `inicioMs` en Buenos Aires (−03:00 fijo). El parser toma `fecha` de
   * `start_time` con el `time_offset` de la fila, pero `inicioMs` sale de
   * `original_bed_time`; un viaje o una hora de acostarse antes de medianoche
   * con inicio después explican la diferencia sin que haya error.
   */
  fechaNoEsElInicio: { fecha: string; inicio: string }[];
  /** Fechas con dos tramos del mismo inicio. */
  iniciosRepetidos: string[];
  /** Fechas con dos tramos idénticos (inicio y fin): desde P105 `consolidarNoches` cuenta uno. */
  tramosIdenticos: string[];
  sinEpoch: number;
}

export function chequearSueno(registros: RegistroSueno[]): ChequeoSueno {
  const horasDe = (r: RegistroSueno) =>
    r.horas ?? (r.inicioMs != null && r.finMs != null ? (r.finMs - r.inicioMs) / 3_600_000 : null);
  const inicios = contar(registros.filter((r) => r.inicioMs != null).map((r) => String(r.inicioMs)));
  const repetidos = new Set(Object.entries(inicios).filter(([, n]) => n > 1).map(([ms]) => Number(ms)));
  return {
    total: registros.length,
    fuentes: contar(registros.map((r) => r.fuente)),
    horasFueraDeRango: registros
      .map((r) => ({ fecha: r.fecha, horas: horasDe(r) }))
      .filter((x): x is { fecha: string; horas: number } => x.horas != null && (x.horas <= 0 || x.horas > 16)),
    fechaNoEsElInicio: registros
      .filter((r) => r.inicioMs != null && fechaBuenosAires(r.inicioMs) !== r.fecha)
      .map((r) => ({ fecha: r.fecha, inicio: fechaBuenosAires(r.inicioMs!) })),
    tramosIdenticos: (() => {
      const claves = contar(registros.filter((r) => r.inicioMs != null && r.finMs != null).map((r) => `${r.inicioMs}-${r.finMs}`));
      return [...new Set(registros.filter((r) => (claves[`${r.inicioMs}-${r.finMs}`] ?? 0) > 1).map((r) => r.fecha))].sort();
    })(),
    iniciosRepetidos: [...new Set(registros.filter((r) => r.inicioMs != null && repetidos.has(r.inicioMs)).map((r) => r.fecha))].sort(),
    sinEpoch: registros.filter((r) => r.inicioMs == null || r.finMs == null).length,
  };
}

// ── Mediciones ────────────────────────────────────────────────────────────────

const RANGOS_MEDICION: Partial<Record<keyof MedicionCorporal, [number, number]>> = {
  pesoKg: [30, 250], grasaPct: [3, 60], masaMuscularKg: [10, 120], aguaPct: [30, 80], imc: [12, 60],
};

export interface ChequeoMediciones {
  total: number;
  fuentes: Record<string, number>;
  fueraDeRango: { fecha: string; campo: string; valor: number }[];
  /** Días con más de una medición de la misma fuente. */
  diasRepetidos: string[];
  /** Días con dos mediciones idénticas (mismo peso y grasa): duplicado probable, no dos pesadas. */
  diasDuplicadoExacto: string[];
  /** Días con mediciones de más de una fuente (por diseño no se mezclan). */
  diasConVariasFuentes: string[];
}

export function chequearMediciones(mediciones: MedicionCorporal[]): ChequeoMediciones {
  const fueraDeRango: ChequeoMediciones["fueraDeRango"] = [];
  for (const m of mediciones) {
    for (const [campo, [min, max]] of Object.entries(RANGOS_MEDICION) as [keyof MedicionCorporal, [number, number]][]) {
      const v = m[campo];
      if (typeof v === "number" && (v < min || v > max)) fueraDeRango.push({ fecha: m.fecha, campo, valor: v });
    }
  }
  const porDiaFuente = contar(mediciones.map((m) => `${m.fecha}|${m.fuente}`));
  const exactos = contar(mediciones.map((m) => `${m.fecha}|${m.fuente}|${m.pesoKg ?? ""}|${m.grasaPct ?? ""}`));
  const fuentesPorDia = new Map<string, Set<string>>();
  for (const m of mediciones) fuentesPorDia.set(m.fecha, (fuentesPorDia.get(m.fecha) ?? new Set()).add(m.fuente));
  return {
    total: mediciones.length,
    fuentes: contar(mediciones.map((m) => m.fuente)),
    fueraDeRango: fueraDeRango.sort((a, b) => a.fecha.localeCompare(b.fecha)),
    diasRepetidos: Object.entries(porDiaFuente).filter(([, n]) => n > 1).map(([k]) => k.split("|")[0]).sort(),
    diasDuplicadoExacto: Object.entries(exactos).filter(([, n]) => n > 1).map(([k]) => k.split("|")[0]).sort(),
    diasConVariasFuentes: [...fuentesPorDia].filter(([, s]) => s.size > 1).map(([f]) => f).sort(),
  };
}
