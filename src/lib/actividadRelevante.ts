// ════════════════════════════════════════════════════════════════════════════
//  lib/actividadRelevante.ts — qué actividad de /cardio se muestra en el
//  historial (P76b).
//
//  El cambio de diseño de P76b: esto **no decide qué se escribe**. Todas las
//  actividades se guardan enteras en /cardio; esta función decide, AL LEER,
//  cuáles merecen aparecer en el historial junto a las sesiones de la app.
//
//  La ventaja de que sea un filtro de lectura: mover el umbral no obliga a
//  reimportar ni a migrar nada, porque no hay copias que corregir. Antes de
//  P76b cada actividad que pasaba el umbral se copiaba a /historial — 2257
//  documentos duplicando filas que ya estaban en /cardio.
//
//  Núcleo puro (ADR #009): sin Firebase, se testea solo.
// ════════════════════════════════════════════════════════════════════════════

import { esAutodetectada } from "./importSelectivo";

/** Lo mínimo que el filtro necesita de una actividad de /cardio. */
export interface ActividadFiltrable {
  duracionMin?: number;
  /** Actividad de realidad virtual. Entra siempre, dure lo que dure. */
  esVR?: boolean;
  /** El reloj la marcó como ShapeUp (custom_id o customTitle). */
  marcadaShapeUp?: boolean;
  /** La registró el reloj solo, sin que la arrancaras. */
  autodetectada?: boolean;
}

/** Lo que el filtro necesita de `/config/import`. */
export interface ConfigRelevancia {
  duracionMinimaMin: number;
}

/**
 * ¿Esta actividad se muestra en el historial?
 *
 * Tres caminos, y alcanza con uno:
 *   1. es de VR — **sin mínimo de duración**: una canción de Beat Saber dura
 *      tres minutos y es entrenamiento igual;
 *   2. el reloj la marcó como ShapeUp — la marcaste vos, así que entra;
 *   3. dura al menos `duracionMinimaMin` **y no la detectó el reloj solo**.
 *
 * Lo que no entra por ninguno queda solo en Salud: no se pierde, no se muestra
 * como entrenamiento.
 *
 * El corte por autodetectada es el que hace el trabajo pesado: sin él, con el
 * umbral en 10 minutos entraban 2262 de las 2562 actividades del export real,
 * casi todas caminatas que el reloj registró por su cuenta.
 */
export function actividadRelevante(
  actividad: ActividadFiltrable,
  config: ConfigRelevancia,
): boolean {
  if (actividad.esVR === true) return true;
  if (actividad.marcadaShapeUp === true) return true;
  if (actividad.autodetectada === true) return false;
  return (actividad.duracionMin ?? 0) >= config.duracionMinimaMin;
}

// ── Derivar las marcas al guardar ──────────────────────────────────────────

/** Lo que el parser o el adaptador entregan, antes de guardar. */
export interface ItemConMarcas {
  esVR?: boolean;
  fcPromedio?: number;
  fcMaxima?: number;
  _muestrasCurva?: number;
  _autoDetected?: boolean;
  _marcadaShapeUp?: boolean;
}

/**
 * Las tres marcas que el filtro consulta, derivadas de los campos técnicos.
 *
 * Se persisten con nombre estable y sin guión bajo justamente porque **ahora se
 * consultan**: `_customId` y `_muestrasCurva` no sobreviven al guardado, así
 * que sin esto no habría con qué filtrar al leer.
 */
export function marcasDe(item: ItemConMarcas): {
  esVR: boolean; marcadaShapeUp: boolean; autodetectada: boolean;
} {
  return {
    esVR: item.esVR === true,
    marcadaShapeUp: item._marcadaShapeUp === true,
    autodetectada: esAutodetectada(item),
  };
}

/** Filtra una lista, conservando el orden. */
export function soloRelevantes<T extends ActividadFiltrable>(
  actividades: T[],
  config: ConfigRelevancia,
): T[] {
  return actividades.filter((a) => actividadRelevante(a, config));
}
