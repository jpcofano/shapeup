// ════════════════════════════════════════════════════════════════════════════
//  lib/analisis.ts — las constantes y las piezas compartidas del análisis
//  asistido (P93). Diseño en docs/ANALISIS-ASISTIDO.md.
//
//  La persona arma un paquete, lo pega en un chat y trae de vuelta un JSON que
//  la app valida y guarda al lado de la sesión. Sin claves, sin servidor, sin
//  costo: la persona es el transporte, a propósito.
//
//  ⛔ ADR #044: lo medido y lo interpretado no se mezclan. Nada de lo que vive
//  acá alimenta una métrica.
//
//  Puro (ADR #009).
// ════════════════════════════════════════════════════════════════════════════
import type { AnalisisGuardado, ArmadoAnalisis, ContenidoAnalisis, Historial } from "../types/models";
import { ventanaDeBloques } from "./metricas";

/** Lo que hace falta de la sesión para saber su ventana. */
export type SesionParaVentana = Pick<Historial, "inicioMs" | "finMs" | "biometria"> & Partial<Pick<Historial, "bloques">>;

/**
 * Versión del prompt de sesión (`docs/analisis/prompt-sesion-v{N}.md`). **Si el
 * prompt cambia, se crea el archivo nuevo y sube esto**: dentro de tres meses
 * tiene que poderse saber con qué se generó cada análisis.
 */
export const VERSION_PROMPT_SESION = 3;

/**
 * Versión del esquema del JSON que vuelve. Sube si cambia la forma. La 2
 * (prompt v3) suma `datosFaltantes` y achica los topes.
 */
export const VERSION_ESQUEMA_ANALISIS = 2;

/** Tope del paquete que se copia al chat, en bytes UTF-8. */
export const TOPE_PAQUETE_BYTES = 60 * 1024;

/** Paso de la curva submuestreada (decisión 1 de P93). */
export const PASO_CURVA_MS = 30_000;
/** Paso al que se baja la curva si el paquete no entra. */
export const PASO_CURVA_RECORTADA_MS = 60_000;

/**
 * Rango por defecto del análisis global, en semanas (decisión 2 de P93): la
 * misma ventana que ya usa la tasa de cumplimiento. Lo usa P94; vive en
 * `/config/import` como el resto de lo configurable.
 */
export const SEMANAS_ANALISIS_GLOBAL_DEFAULT = 8;

/**
 * La ventana con la que se lee la sesión: la misma que usó la biometría. Si la
 * tolerancia del 12 % adoptó la del reloj, es la unión de la app y el reloj
 * (así la arma `construirBiometriaDeTramos`); si no, la de la app.
 *
 * Las sesiones viejas no tienen `inicioMs`/`finMs` en el documento: ahí cae a
 * la de las series, igual que `ventanaDeHistorial` del enriquecimiento. Sin
 * ninguna de las dos, `null`.
 */
export function ventanaDelAnalisis(h: SesionParaVentana): { inicioMs: number; finMs: number } | null {
  let inicio = h.inicioMs;
  let fin = h.finMs;
  if (inicio == null || fin == null) {
    const b = ventanaDeBloques(h.bloques ?? []);
    inicio = b.inicioMs;
    fin = b.finMs;
  }
  if (inicio == null || fin == null || fin <= inicio) return null;
  const s = h.biometria?.samsung;
  if (h.biometria?.ventanaAdoptada === "samsung" && s) {
    return { inicioMs: Math.min(inicio, s.inicioMs), finMs: Math.max(fin, s.finMs) };
  }
  return { inicioMs: inicio, finMs: fin };
}

/**
 * De dónde salió la ventana (enmienda de P93). `"sesion"` = el arranque y el
 * cierre de la app, del mismo par que la duración (P84c). `"series"` = el
 * respaldo para sesiones viejas sin `inicioMs`/`finMs`: va contra esa regla, y
 * por eso el paquete lo declara. `null` = no hay ventana.
 */
export function origenVentana(h: SesionParaVentana): "sesion" | "series" | null {
  if (h.inicioMs != null && h.finMs != null && h.finMs > h.inicioMs) return "sesion";
  const b = ventanaDeBloques(h.bloques ?? []);
  return b.inicioMs != null && b.finMs != null && b.finMs > b.inicioMs ? "series" : null;
}

/** Diferencia relativa a partir de la cual la duración y el tramo de las series "no cierran". */
export const TOLERANCIA_DISCREPANCIA_DURACION = 0.12;

/**
 * Cuando la ventana sale de las series: si la duración registrada no coincide
 * con el tramo de las series (más de 12 %), los dos números. `null` si la
 * ventana es de la sesión, si no hay duración o si coinciden.
 */
export function discrepanciaDuracion(
  h: SesionParaVentana & Pick<Historial, "duracionRealMin">,
): { duracionRegistradaMin: number; tramoSeriesMin: number } | null {
  if (origenVentana(h) !== "series" || h.duracionRealMin == null || h.duracionRealMin <= 0) return null;
  const b = ventanaDeBloques(h.bloques ?? []);
  const tramo = (b.finMs! - b.inicioMs!) / 60_000;
  if (Math.abs(tramo - h.duracionRealMin) / h.duracionRealMin <= TOLERANCIA_DISCREPANCIA_DURACION) return null;
  return { duracionRegistradaMin: h.duracionRealMin, tramoSeriesMin: Math.round(tramo * 10) / 10 };
}

/** Con qué se arma el paquete de esta sesión, hoy. Es lo que se guarda (decisión 3). */
export function armadoDe(h: SesionParaVentana): ArmadoAnalisis {
  return {
    versionPrompt: VERSION_PROMPT_SESION,
    versionEsquema: VERSION_ESQUEMA_ANALISIS,
    ventana: ventanaDelAnalisis(h),
    versionEnriquecimiento: h.biometria ? (h.biometria.versionEnriquecimiento ?? 1) : null,
  };
}

/**
 * Lo que se guarda en `historial.analisis`: el contenido validado, con qué se
 * armó el paquete y cuándo se cargó. `armado` sale del eco del chat si lo
 * devolvió; si no, de la sesión en este momento (y queda dicho en
 * `armadoOrigen`).
 */
export function analisisParaGuardar(
  v: { contenido: ContenidoAnalisis; armadoEco: ArmadoAnalisis | null },
  sesion: SesionParaVentana,
  ahora: number,
): AnalisisGuardado {
  return {
    ...v.contenido,
    armado: v.armadoEco ?? armadoDe(sesion),
    armadoOrigen: v.armadoEco ? "eco" : "carga",
    cargadoMs: ahora,
  };
}
