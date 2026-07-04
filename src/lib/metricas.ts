// ════════════════════════════════════════════════════════════════════════════
//  lib/metricas.ts — INTELIGENCIA de métricas derivadas
//
//  Análogo de lib/macros.ts (que derivaba kcal/proteínas de los ingredientes).
//  Acá derivamos, a partir de los bloques de una Rutina:
//    · duración estimada (min)        → Rutina.duracionEstimadaMin (cache)
//    · series totales                 → Rutina.totalSeries (cache)
//    · equipo necesario               → Rutina.equipoNecesario (cache)
//    · balance por región muscular    → para detectar rutinas desbalanceadas
//  y, a partir del Historial real:
//    · tonelaje (Σ reps×carga)
//    · sugerencia de progresión (doble progresión)
//
//  Todas las funciones son puras y testeables (replicar macros.test.ts).
// ════════════════════════════════════════════════════════════════════════════

import type {
  Rutina, BloqueEjercicio, Prescripcion, Equipo,
  GrupoMuscular, RegionMuscular, Ejercicio, Historial, RangoNumerico,
} from "../types/models";
import { GRUPOS_MUSCULARES_REGION } from "../types/models";

// Tiempo "de trabajo" por defecto de una serie de fuerza cuando no hay tempo,
// para estimar duración (segundos por serie, sin contar descanso).
const SEG_TRABAJO_SERIE_FUERZA = 40;
const SEG_POR_REP_DEFAULT = 3; // si querés estimar por reps×tempo

// ─── Duración de UN bloque (trabajo + descansos), en segundos ─────────────────
export function duracionBloqueSeg(p: Prescripcion): number {
  switch (p.modalidad) {
    case "Fuerza": {
      const trabajo = p.repsObjetivo?.value
        ? Math.max(SEG_TRABAJO_SERIE_FUERZA, p.repsObjetivo.value * SEG_POR_REP_DEFAULT)
        : SEG_TRABAJO_SERIE_FUERZA;
      // N series de trabajo + (N-1) descansos entre ellas
      return p.series * trabajo + Math.max(0, p.series - 1) * p.descansoSeg;
    }
    case "Isométrico": {
      const trabajoSerie = p.duracionHoldSeg * (p.porLado ? 2 : 1);
      return p.series * trabajoSerie + Math.max(0, p.series - 1) * p.descansoSeg;
    }
    case "Movilidad": {
      const trabajoRonda = (p.duracionHoldSeg ?? 30) * (p.porLado ? 2 : 1);
      return p.rondas * trabajoRonda + Math.max(0, p.rondas - 1) * p.descansoSeg;
    }
    case "Cardio": {
      if (p.formato === "Intervalos") {
        const r = p.rondas ?? 1;
        return r * (p.trabajoSeg ?? 0) + Math.max(0, r - 1) * (p.descansoSeg ?? 0);
      }
      return (p.duracionMin ?? 0) * 60;
    }
  }
}

// ─── Duración estimada de la rutina (min) ─────────────────────────────────────
// Las superseries (mismo grupoSet) se solapan: tomamos el descanso del grupo una
// sola vez por ronda (aproximación simple: si hay grupoSet, no doble-contamos
// descansos intra-grupo). Para v1 alcanza con sumar bloques.
export function estimarDuracionMin(rutina: Rutina): number {
  const totalSeg = rutina.bloques.reduce((acc, b) => acc + duracionBloqueSeg(b.prescripcion), 0);
  // + ~8% de transición entre ejercicios (acomodar, anotar)
  return Math.round((totalSeg * 1.08) / 60);
}

// ─── Series totales de la rutina ──────────────────────────────────────────────
export function totalSeries(rutina: Rutina): number {
  return rutina.bloques.reduce((acc, b) => acc + seriesObjetivo(b.prescripcion), 0);
}

/** Series / rondas objetivo de un bloque según su modalidad. Cardio continuo = 1. */
export function seriesObjetivo(p: Prescripcion): number {
  switch (p.modalidad) {
    case "Fuerza":     return p.series;
    case "Isométrico": return p.series;
    case "Movilidad":  return p.rondas;
    case "Cardio":     return p.formato === "Intervalos" ? (p.rondas ?? 1) : 1;
  }
}

// ─── Equipo necesario (unión de los equipos de cada ejercicio del bloque) ─────
// Requiere el catálogo para resolver idEjercicio → equipo[]. Si no lo tenés a
// mano, podés cachear `equipo` en el bloque al armar la rutina.
export function equipoNecesario(
  rutina: Rutina,
  catalogo: Map<string, Ejercicio>,
): Equipo[] {
  const set = new Set<Equipo>();
  for (const b of rutina.bloques) {
    const ej = catalogo.get(b.idEjercicio);
    ej?.equipo.forEach((e) => set.add(e));
  }
  return [...set];
}

// ─── Balance por región muscular ──────────────────────────────────────────────
// Cuenta series por región (empuje, tracción, pierna, core…). Sirve para
// advertir desbalances ("4 bloques de empuje, 0 de tracción") al armar/elegir.
export function seriesPorRegion(
  rutina: Rutina,
  catalogo: Map<string, Ejercicio>,
): Record<RegionMuscular, number> {
  const out = Object.fromEntries(
    Object.keys(GRUPOS_MUSCULARES_REGION).map((r) => [r, 0]),
  ) as Record<RegionMuscular, number>;

  for (const b of rutina.bloques) {
    const ej = catalogo.get(b.idEjercicio);
    if (!ej) continue;
    const region = regionDe(ej.grupoMuscularPrimario);
    if (region) out[region] += seriesObjetivo(b.prescripcion);
  }
  return out;
}

function regionDe(grupo: GrupoMuscular): RegionMuscular | null {
  for (const [region, hojas] of Object.entries(GRUPOS_MUSCULARES_REGION)) {
    if (hojas.includes(grupo)) return region as RegionMuscular;
  }
  return null;
}

/** Detecta desbalance empuje/tracción (ratio fuera de [0.6, 1.7] avisa). */
export function avisoBalanceEmpujeTraccion(
  rutina: Rutina,
  catalogo: Map<string, Ejercicio>,
): string | null {
  const reg = seriesPorRegion(rutina, catalogo);
  const empuje = reg["Tren superior - empuje"] ?? 0;
  const traccion = reg["Tren superior - tracción"] ?? 0;
  if (empuje === 0 && traccion === 0) return null;
  if (traccion === 0) return "Tenés empuje pero nada de tracción. Sumá una fila o dominada.";
  if (empuje === 0) return "Tenés tracción pero nada de empuje. Sumá un press o flexiones.";
  const ratio = empuje / traccion;
  if (ratio > 1.7) return "Mucho empuje en relación a la tracción; considerá equilibrar.";
  if (ratio < 0.6) return "Mucha tracción en relación al empuje; considerá equilibrar.";
  return null;
}

// ════════════════════════════════════════════════════════════════════════════
//  Métricas del Historial real (post-sesión)
// ════════════════════════════════════════════════════════════════════════════

/** Tonelaje total de una sesión: Σ (reps × carga) sobre todas las series. */
export function tonelajeKg(historial: Pick<Historial, "bloques">): number {
  let total = 0;
  for (const b of historial.bloques) {
    for (const s of b.series) {
      if (s.completada && s.reps != null && s.cargaKg != null) {
        total += s.reps * s.cargaKg;
      }
    }
  }
  return Math.round(total);
}

/** Series efectivamente completadas en la sesión. */
export function totalSeriesHechas(historial: Pick<Historial, "bloques">): number {
  return historial.bloques.reduce(
    (acc, b) => acc + b.series.filter((s) => s.completada).length, 0,
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  Sugerencia de progresión — DOBLE PROGRESIÓN (regla simple y robusta).
//
//  Idea: para un ejercicio de fuerza con rango de reps [min,max] y una carga:
//   · Si en la última sesión completaste TODAS las series llegando al tope del
//     rango → subí la carga (y volvé al piso de reps).
//   · Si no llegaste al tope en todas → mantené carga y apuntá a más reps.
//
//  Devuelve una sugerencia textual + la carga/reps propuestas. Es opcional y se
//  muestra al agregar el ejercicio a una rutina o al empezar la sesión.
// ════════════════════════════════════════════════════════════════════════════
export interface SugerenciaProgresion {
  texto: string;
  cargaSugeridaKg?: number;
  repsSugeridas?: string;
}

export function sugerirProgresionFuerza(opts: {
  rango: RangoNumerico;          // reps objetivo, ej. {min:8,max:12,...}
  cargaActualKg: number;
  ultimaSesion: { reps: number; carga: number; completada: boolean }[]; // series reales
  incrementoKg?: number;         // default 2.5
}): SugerenciaProgresion {
  const { rango, cargaActualKg, ultimaSesion } = opts;
  const incremento = opts.incrementoKg ?? 2.5;
  const max = rango.max ?? rango.value;
  const min = rango.min ?? rango.value;

  const seriesValidas = ultimaSesion.filter((s) => s.carga === cargaActualKg);
  if (seriesValidas.length === 0) {
    return { texto: "Sin datos de la última vez; mantené y registrá la sesión." };
  }
  const todasAlTope = seriesValidas.every((s) => s.completada && s.reps >= max);

  if (todasAlTope) {
    const nuevaCarga = Math.round((cargaActualKg + incremento) * 2) / 2;
    return {
      texto: `Completaste todo a ${max} reps: subí a ${nuevaCarga} kg y volvé a ${min} reps.`,
      cargaSugeridaKg: nuevaCarga,
      repsSugeridas: `${min}`,
    };
  }
  return {
    texto: `Mantené ${cargaActualKg} kg y apuntá a sumar reps hasta ${max}.`,
    cargaSugeridaKg: cargaActualKg,
    repsSugeridas: rango.raw,
  };
}

// ─── Recalcular y devolver el patch de cache de una Rutina ────────────────────
// Llamar al crear/editar una rutina, antes de persistir (como se hacía con los
// derivados de Receta). Mantiene duracionEstimadaMin/totalSeries/equipoNecesario.
export function calcularCacheRutina(
  rutina: Rutina,
  catalogo: Map<string, Ejercicio>,
): Pick<Rutina, "duracionEstimadaMin" | "totalSeries" | "equipoNecesario"> {
  return {
    duracionEstimadaMin: estimarDuracionMin(rutina),
    totalSeries: totalSeries(rutina),
    equipoNecesario: equipoNecesario(rutina, catalogo),
  };
}

export type { BloqueEjercicio };

// ─── ADR #019: ventana de la sesión completa ─────────────────────────────────

import type { BloqueRegistro } from "../types/models";

/**
 * Deriva la ventana (inicioMs / finMs) de una sesión a partir de sus bloques.
 * Toma el mínimo de `serie.inicioMs` y el máximo de `serie.finMs` de todas
 * las series de todos los bloques. Devuelve los campos que existan (ambos,
 * uno, o ninguno si no hay timestamps).
 */
export function ventanaDeBloques(
  bloques: BloqueRegistro[],
): { inicioMs?: number; finMs?: number } {
  let inicio: number | undefined;
  let fin: number | undefined;
  for (const bloque of bloques) {
    for (const serie of bloque.series) {
      if (serie.inicioMs != null) inicio = inicio == null ? serie.inicioMs : Math.min(inicio, serie.inicioMs);
      if (serie.finMs    != null) fin    = fin    == null ? serie.finMs    : Math.max(fin,    serie.finMs);
    }
  }
  return { inicioMs: inicio, finMs: fin };
}
