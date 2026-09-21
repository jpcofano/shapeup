// ════════════════════════════════════════════════════════════════════════════
//  lib/cacheDiasActivos.ts — caché de días activos por semana cerrada (P77b).
//
//  El problema: la serie de adherencia de Progreso mira 12 semanas, y traer 12
//  semanas de `/cardio` son cientos de lecturas. Pero **una semana cerrada no
//  cambia nunca** salvo que llegue un import: su domingo ya pasó y no va a
//  aparecer una caminata nueva del martes pasado.
//
//  Entonces se guarda y no se vuelve a leer. Steady state: la primera visita a
//  Progreso después de un import lee las 12 semanas; las siguientes, solo la
//  semana en curso.
//
//  ── Esto NO contradice el ADR #037 ────────────────────────────────────────
//  La racha se sigue derivando del historial en cada cálculo. Lo que se guarda
//  acá son **los días leídos de `/cardio`**, que se reconstruyen enteros desde
//  la fuente y solo evitan releerlos. Es una caché, no un acumulador: si se
//  borra, el resultado es exactamente el mismo, solo que más lento.
//
//  ── Reglas ───────────────────────────────────────────────────────────────
//  · La semana EN CURSO nunca se cachea: todavía le pueden entrar días.
//  · El prefijo lleva versión (`da1-`): si cambia la forma de `DiaActivo`, se
//    sube a `da2-` y las claves viejas dejan de leerse solas.
//  · Un import borra todas las claves: puede reescribir semanas viejas.
//  · Si `localStorage` no está o tira, se sigue sin caché. **Nunca se rompe
//    por esto** — es una optimización, no una fuente de verdad.
//
//  Núcleo puro salvo por `localStorage` (ADR #009): sin Firebase, se testea
//  con un doble del storage.
// ════════════════════════════════════════════════════════════════════════════

import type { DiaActivo } from "./racha";

/**
 * Versión del formato. Subila si cambia la forma de `DiaActivo`: las claves
 * viejas quedan huérfanas y se ignoran, en vez de leerse mal.
 */
export const PREFIJO_CACHE_DIAS = "da1-";

function claveDe(miembro: string, semanaInicio: string): string {
  return `${PREFIJO_CACHE_DIAS}${miembro}-${semanaInicio}`;
}

/** El storage, o `null` si no está disponible (SSR, modo privado, bloqueado). */
function storage(): Storage | null {
  try {
    return typeof localStorage !== "undefined" ? localStorage : null;
  } catch {
    return null;
  }
}

/**
 * Los días guardados de esa semana, o `null` si no hay nada.
 *
 * `null` es "no está en la caché", y el llamador tiene que leerla. Un array
 * vacío es un dato: "esa semana no tuvo ninguna actividad".
 */
export function leerSemanaCache(miembro: string, semanaInicio: string): DiaActivo[] | null {
  const ls = storage();
  if (!ls) return null;
  try {
    const crudo = ls.getItem(claveDe(miembro, semanaInicio));
    if (crudo == null) return null;
    const dias = JSON.parse(crudo) as unknown;
    return Array.isArray(dias) ? (dias as DiaActivo[]) : null;
  } catch {
    return null;   // JSON roto o storage caído: se lee de Firestore y listo
  }
}

/**
 * Guarda los días de una semana **cerrada**. Con `enCurso` en true no guarda
 * nada: esa semana todavía puede recibir días.
 */
export function guardarSemanaCache(
  miembro: string,
  semanaInicio: string,
  dias: DiaActivo[],
  enCurso: boolean,
): void {
  if (enCurso) return;
  const ls = storage();
  if (!ls) return;
  try {
    ls.setItem(claveDe(miembro, semanaInicio), JSON.stringify(dias));
  } catch {
    // Cuota de localStorage llena, o modo privado: seguir sin caché.
  }
}

/**
 * Borra todas las claves de la caché, de todos los miembros.
 *
 * Se llama **al terminar un import**: un import puede reescribir semanas
 * viejas (el ZIP trae dos años de historia), y una caché que sobreviviera a
 * eso mostraría las semanas viejas como estaban antes.
 */
export function limpiarCacheDiasActivos(): void {
  const ls = storage();
  if (!ls) return;
  try {
    const aBorrar: string[] = [];
    for (let i = 0; i < ls.length; i++) {
      const k = ls.key(i);
      if (k?.startsWith(PREFIJO_CACHE_DIAS)) aBorrar.push(k);
    }
    aBorrar.forEach((k) => ls.removeItem(k));
  } catch {
    // Sin storage no hay nada que borrar.
  }
}
