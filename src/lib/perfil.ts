// ════════════════════════════════════════════════════════════════════════════
//  lib/perfil.ts — núcleo PURO del perfil (P72).
//
//  El equipo se declara POR LUGAR: lo que tenés en casa no es lo que tenés en
//  el gimnasio. La sustitución de ejercicios (P73) pregunta "qué equipo tengo
//  en el lugar donde estoy hoy", y esa respuesta sale de acá.
//
//  `equipoDisponible` (lista plana) es el modelo viejo: se sigue leyendo como
//  el equipo del `lugarHabitual` mientras queden perfiles sin migrar.
//
//  Sin Firebase: se testea sin emulador (ADR #009).
// ════════════════════════════════════════════════════════════════════════════

import type { Equipo, Lugar, PerfilMiembro } from "../types/models";

/**
 * Con qué se puede entrenar en `lugar`, en orden de precedencia:
 *   1. lo declarado para ese lugar en `equipoPorLugar` — incluso si es una
 *      lista vacía: declarar "acá no tengo nada" es una decisión, no un hueco;
 *   2. el `equipoDisponible` viejo, solo si `lugar` es el `lugarHabitual`
 *      (es el único lugar al que esa lista plana se refería);
 *   3. peso corporal.
 *
 * El fallback existe porque un lugar sin equipo declarado igual permite
 * entrenar: la sustitución de P73 nunca se queda sin candidatos.
 */
export function equipoDe(perfil: PerfilMiembro | undefined, lugar: Lugar): Equipo[] {
  const declarado = perfil?.equipoPorLugar?.[lugar];
  if (declarado !== undefined) return declarado;
  if (perfil?.equipoDisponible && perfil.lugarHabitual === lugar) return perfil.equipoDisponible;
  return ["Peso corporal"];
}

/** Lugar al que va el equipo plano de un perfil sin migrar. */
export const LUGAR_POR_DEFECTO: Lugar = "Casa";

/**
 * Pasa un perfil del modelo plano al modelo por lugar: mueve `equipoDisponible`
 * al `lugarHabitual` (o a Casa si no lo tiene) y lo saca.
 *
 * Idempotente: un perfil que ya tiene `equipoPorLugar` vuelve tal cual, así que
 * correr la migración dos veces no cambia nada la segunda vez. Un perfil sin
 * equipo queda migrado con el mapa vacío — no hay nada que mover.
 */
export function migrarEquipoPorLugar(perfil: PerfilMiembro): PerfilMiembro {
  if (perfil.equipoPorLugar !== undefined) return perfil;

  const { equipoDisponible, ...resto } = perfil;
  const lugar = perfil.lugarHabitual ?? LUGAR_POR_DEFECTO;
  const equipoPorLugar: Partial<Record<Lugar, Equipo[]>> =
    equipoDisponible && equipoDisponible.length > 0 ? { [lugar]: [...equipoDisponible] } : {};

  return { ...resto, equipoPorLugar };
}
