// ════════════════════════════════════════════════════════════════════════════
//  lib/correccionZonas.ts — la corrección de las zonas de los perfiles (P97).
//
//  Las zonas guardadas salieron del seed viejo, que redondeaba cada borde y
//  usaba el mismo número como techo de una zona y piso de la siguiente: se
//  pisaban, y el piso de Z5 de juanpablo quedaba en 152 en vez de 153. Esto
//  recalcula las zonas de cada perfil con `zonasDesdeFcMax`, a partir de su FC
//  máxima actual, y declara el origen de la FC máxima donde falta:
//    - juanpablo: `samsung` (169, la que muestra Samsung);
//    - maria, sofia y federico: `edad-provisoria` (220 − edad, a confirmar).
//
//  Idempotente: un perfil que ya está bien no genera cambios. Lo usa
//  `scripts/corregir-zonas-perfiles.ts`.
//
//  Puro (ADR #009).
// ════════════════════════════════════════════════════════════════════════════
import { MIEMBRO_IDS, type MiembroId, type OrigenFcMax, type PerfilMiembro } from "../types/models";
import { zonasDesdeFcMax, type RangosZonas } from "./zonas";

/** El origen que se declara donde falta (decisión del 01/10). */
export const ORIGEN_INICIAL: Record<MiembroId, OrigenFcMax> = {
  juanpablo: "samsung",
  maria: "edad-provisoria",
  sofia: "edad-provisoria",
  federico: "edad-provisoria",
};

export type CambioPerfilZonas = Partial<Pick<PerfilMiembro, "zonasFC" | "fcMaxOrigen" | "fcMaxDesdeMs">>;

export interface CorreccionPerfil {
  miembro: MiembroId;
  fcMax: number;
  zonasAntes: PerfilMiembro["zonasFC"] | undefined;
  zonasDespues: RangosZonas;
  origenAntes: OrigenFcMax | undefined;
  origenDespues: OrigenFcMax;
  /** Lo que hay que escribir. Vacío = el perfil ya está bien. */
  cambio: CambioPerfilZonas;
}

export interface PlanCorreccionZonas {
  correcciones: CorreccionPerfil[];
  omitidos: { clave: string; motivo: string }[];
}

const mismasZonas = (a: PerfilMiembro["zonasFC"] | undefined, b: RangosZonas) =>
  JSON.stringify(ordenadas(a)) === JSON.stringify(ordenadas(b));

function ordenadas(z: PerfilMiembro["zonasFC"] | undefined) {
  if (!z) return null;
  return (["Z1", "Z2", "Z3", "Z4", "Z5"] as const).map((k) => (z[k] ? [z[k]!.min, z[k]!.max] : null));
}

/**
 * Qué hay que corregir en `/config/perfiles`. `documento` es el documento
 * entero: las claves que no son miembros (como `ultimaActualizacion`) se
 * saltean y se listan en `omitidos`.
 */
export function planificarCorreccionZonas(
  documento: Record<string, unknown>,
  ahoraMs: number,
): PlanCorreccionZonas {
  const plan: PlanCorreccionZonas = { correcciones: [], omitidos: [] };
  for (const clave of Object.keys(documento).sort()) {
    if (!(MIEMBRO_IDS as readonly string[]).includes(clave)) {
      plan.omitidos.push({ clave, motivo: "no es un miembro" });
      continue;
    }
    const miembro = clave as MiembroId;
    const p = documento[clave] as PerfilMiembro | undefined;
    const fcMax = p?.fcMaxTeorica;
    if (fcMax == null) {
      plan.omitidos.push({ clave, motivo: "sin FC máxima" });
      continue;
    }
    const zonasDespues = zonasDesdeFcMax(fcMax);
    const origenDespues = p?.fcMaxOrigen ?? ORIGEN_INICIAL[miembro];
    const cambio: CambioPerfilZonas = {};
    if (!mismasZonas(p?.zonasFC, zonasDespues)) cambio.zonasFC = zonasDespues;
    if (p?.fcMaxOrigen == null) cambio.fcMaxOrigen = origenDespues;
    if (p?.fcMaxDesdeMs == null) cambio.fcMaxDesdeMs = ahoraMs;
    plan.correcciones.push({
      miembro, fcMax,
      zonasAntes: p?.zonasFC, zonasDespues,
      origenAntes: p?.fcMaxOrigen, origenDespues,
      cambio,
    });
  }
  return plan;
}

/** Las zonas en una línea: `84-101 · 102-118 · …`. */
export function zonasEnLinea(z: PerfilMiembro["zonasFC"] | undefined): string {
  if (!z) return "(sin zonas)";
  return (["Z1", "Z2", "Z3", "Z4", "Z5"] as const)
    .map((k) => (z[k] ? `${z[k]!.min}-${z[k]!.max}` : "—"))
    .join(" · ");
}
