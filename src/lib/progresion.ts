// ════════════════════════════════════════════════════════════════════════════
//  lib/progresion.ts — progresión de cargas por doble progresión (I3, tercer
//  y último insight de la serie I).
//
//  Núcleo puro (ADR #009): doble progresión clásica — primero subir reps
//  hasta el techo del rango prescripto, después subir peso (y las reps
//  vuelven al piso). Compara SIEMPRE contra la última sesión del mismo
//  ejercicio del propio miembro; sin sesiones previas, silencio (`null`) —
//  la prescripción de la rutina manda. Ver docs/prompts/60-i3-progresion-cargas.md.
//
//  Limitación conocida: `SerieRegistro` no distingue series de calentamiento,
//  así que todas las series completadas del ejercicio entran al cálculo.
// ════════════════════════════════════════════════════════════════════════════

import type { Historial, Prescripcion, SerieRegistro } from "../types/models";

export type TipoSugerencia = "subir-peso" | "subir-reps" | "repetir" | "bajar-peso";

export interface SugerenciaProgresion {
  tipo: TipoSugerencia;
  pesoKg?: number;             // peso sugerido para la próxima
  repsObjetivo?: number;
  motivo: string;              // "Completaste 3×12 con 10 kg — probá 12 kg"
  basadoEnFecha: string;       // última sesión que fundamenta
}

interface SesionEjercicio {
  fecha: string;
  series: SerieRegistro[];
}

/** Cargas livianas (mancuernas, típico de accesorios/juveniles) progresan de a 1 kg. */
export function incrementoPara(pesoKg: number): number {
  return pesoKg < 10 ? 1 : 2;
}

/** Peso "de la sesión": el más repetido entre las series con carga (empate → el más reciente). */
function pesoDeSesion(series: SerieRegistro[]): number | undefined {
  const cargas = series.map((s) => s.cargaKg).filter((c): c is number => c != null);
  if (cargas.length === 0) return undefined;
  const conteo = new Map<number, number>();
  for (const c of cargas) conteo.set(c, (conteo.get(c) ?? 0) + 1);
  let mejor = cargas[cargas.length - 1];
  let mejorConteo = 0;
  for (const [c, n] of conteo) {
    if (n > mejorConteo) { mejor = c; mejorConteo = n; }
  }
  return mejor;
}

/** Sesiones (más reciente primero) donde el miembro hizo este ejercicio de Fuerza con series completadas. */
function sesionesDelEjercicio(idEjercicio: string, historial: Historial[]): SesionEjercicio[] {
  const sesiones: SesionEjercicio[] = [];
  for (const h of historial) {
    const bloque = h.bloques.find((b) => b.idEjercicio === idEjercicio && b.modalidad === "Fuerza");
    if (!bloque) continue;
    const series = bloque.series.filter((s) => s.completada && s.reps != null);
    if (series.length === 0) continue;
    sesiones.push({ fecha: h.fechaRealizada, series });
  }
  return sesiones.sort((a, b) => b.fecha.localeCompare(a.fecha));
}

export function sugerirProgresion(
  idEjercicio: string,
  historial: Historial[],
  prescripcion: Prescripcion,
  incrementoKg?: number,
): SugerenciaProgresion | null {
  if (prescripcion.modalidad !== "Fuerza") return null; // isométricos/cardio/movilidad no usan peso

  const sesiones = sesionesDelEjercicio(idEjercicio, historial);
  if (sesiones.length === 0) return null; // sin historia → la prescripción manda

  const ultima = sesiones[0];
  const pesoUltimo = pesoDeSesion(ultima.series);
  if (pesoUltimo == null) return null; // ejercicio sin carga registrada (bodyweight)

  const { repsObjetivo } = prescripcion;
  const esRango = repsObjetivo.min != null && repsObjetivo.max != null && repsObjetivo.max > repsObjetivo.min;
  if (repsObjetivo.value === 0 && repsObjetivo.min == null) return null; // objetivo no numérico (AMRAP)

  const techo = repsObjetivo.max ?? repsObjetivo.value;
  const piso  = repsObjetivo.min ?? repsObjetivo.value;
  const incremento = incrementoKg ?? incrementoPara(pesoUltimo);

  const repsUltima = ultima.series.map((s) => s.reps!);
  const mejorSerie = Math.max(...repsUltima);

  // A · subir-peso: TODAS las series de la última sesión llegaron al techo (o al objetivo, si es fijo).
  if (repsUltima.every((r) => r >= techo)) {
    const nuevoPeso = pesoUltimo + incremento;
    return {
      tipo: "subir-peso",
      pesoKg: nuevoPeso,
      repsObjetivo: piso,
      motivo: `Completaste ${ultima.series.length}×${techo} con ${pesoUltimo} kg — probá ${nuevoPeso} kg`,
      basadoEnFecha: ultima.fecha,
    };
  }

  // B · bajar-peso: dos sesiones seguidas sin llegar al piso en ≥ la mitad de las series.
  if (sesiones.length >= 2) {
    const previa = sesiones[1];
    const bajoElPiso = (s: SesionEjercicio) => {
      const reps = s.series.map((x) => x.reps!);
      const bajas = reps.filter((r) => r < piso).length;
      return bajas >= reps.length / 2;
    };
    if (bajoElPiso(ultima) && bajoElPiso(previa)) {
      const nuevoPeso = Math.max(0, pesoUltimo - incremento);
      return {
        tipo: "bajar-peso",
        pesoKg: nuevoPeso,
        repsObjetivo: piso,
        motivo: `Dos sesiones seguidas sin llegar a ${piso} reps con ${pesoUltimo} kg — probá ${nuevoPeso} kg y consolidá antes de volver a subir`,
        basadoEnFecha: ultima.fecha,
      };
    }
  }

  // C · subir-reps: completó todas las series pero sin llegar al techo del rango.
  if (esRango && mejorSerie < techo) {
    const nuevoObjetivo = mejorSerie + 1;
    return {
      tipo: "subir-reps",
      pesoKg: pesoUltimo,
      repsObjetivo: nuevoObjetivo,
      motivo: `Completaste ${ultima.series.length} series con ${pesoUltimo} kg, mejor serie ${mejorSerie} reps — probá ${nuevoObjetivo}`,
      basadoEnFecha: ultima.fecha,
    };
  }

  // D · repetir: cualquier otro caso con historia.
  return {
    tipo: "repetir",
    pesoKg: pesoUltimo,
    repsObjetivo: techo,
    motivo: `Te faltó poco en la última — repetí ${pesoUltimo} kg × ${techo}`,
    basadoEnFecha: ultima.fecha,
  };
}
