// ════════════════════════════════════════════════════════════════════════════
//  lib/tipoHistorial.ts — de qué tipo es una entrada del historial (P74).
//
//  El riesgo que ataca este módulo: cuando P75 empiece a crear entradas con
//  `tipo: "externa"` (una caminata, un partido, cualquier cosa que venga de los
//  datos de salud y no de una sesión hecha en la app), las métricas que hablan
//  de CUMPLIR EL PLAN o de PROGRESAR EN UN EJERCICIO no pueden contarlas: una
//  caminata de 40 minutos no es una sesión de fuerza. Las que hablan de
//  MOVERSE (días activos, minutos, la vista de historial) sí las cuentan.
//
//  Por qué un módulo y no un `.filter` suelto en cada llamador: cuando aparezca
//  un cuarto tipo, se cambia acá y no en quince lugares.
//
//  Núcleo puro (ADR #009).
// ════════════════════════════════════════════════════════════════════════════

import type { Historial } from "../types/models";

export type TipoHistorial = NonNullable<Historial["tipo"]>;

/** Lo mínimo para clasificar: acepta un Historial entero o un objeto parcial. */
type ConTipo = { tipo?: Historial["tipo"] };

/** El tipo de la entrada. Sin campo → `"rutina"` (retrocompat pre-P74). */
export function tipoDe(h: ConTipo): TipoHistorial {
  return h.tipo ?? "rutina";
}

/**
 * ¿Se entrenó en la app? Rutina del plan o sesión libre — las dos cuentan.
 *
 * **Lista positiva, a propósito** (P81). Antes era `tipo !== "externa"`, y con
 * eso cualquier tipo nuevo empezaba a contar como entrenamiento por omisión:
 * los juegos de VR se habrían metido solos en la racha, la meta, la
 * adherencia, el tonelaje y la progresión. Lo que cuenta se declara.
 */
export function esShapeUp(h: ConTipo): boolean {
  const t = tipoDe(h);
  return t === "rutina" || t === "libre";
}

/** ¿Es un juego de VR que se registra pero no cuenta como ejercicio (P81)? */
export function esJuego(h: ConTipo): boolean {
  return tipoDe(h) === "juego";
}

/**
 * ¿Se le busca biometría en el import?
 *
 * **No es lo mismo que `esShapeUp`**, y por eso son dos nombres: un juego no
 * cuenta como entrenamiento, pero su FC es justamente el dato que puede decir
 * si ese juego mueve a alguien o no (P81). Las externas quedan afuera: ya
 * vienen de los datos de salud, no hay nada que enriquecer.
 */
export function seEnriquece(h: ConTipo): boolean {
  return esShapeUp(h) || esJuego(h);
}

/** ¿Vino de afuera (datos de salud) y no de una sesión hecha en la app? */
export function esExterna(h: ConTipo): boolean {
  return tipoDe(h) === "externa";
}

/** Solo lo entrenado en la app. El filtro de toda métrica de plan o progresión. */
export function soloShapeUp<T extends ConTipo>(hs: T[]): T[] {
  return hs.filter(esShapeUp);
}

/** Solo los juegos. */
export function soloJuegos<T extends ConTipo>(hs: T[]): T[] {
  return hs.filter(esJuego);
}

/** Solo lo que entró de afuera. */
export function soloExternas<T extends ConTipo>(hs: T[]): T[] {
  return hs.filter(esExterna);
}
