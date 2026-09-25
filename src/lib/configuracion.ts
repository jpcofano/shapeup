// ════════════════════════════════════════════════════════════════════════════
//  lib/configuracion.ts — lo que se edita en Perfil → Configuración (P86).
//
//  Todo lo configurable vive en un solo lugar. Antes había cosas que solo se
//  cambiaban desde la consola de Firebase (/config/import, /config/visibilidad),
//  cosas de solo lectura (las zonas de FC) y una lista que se editaba adentro
//  de la sesión de juego. Acá están las reglas de cada una, puras (ADR #009).
// ════════════════════════════════════════════════════════════════════════════
import {
  ZONAS_FC, type Programa, type VisibilidadMiembro, type ZonaFC,
} from "../types/models";
import { BANDAS_PCT_FC_MAX } from "./matchBiometrico";

export type ZonasFC = Partial<Record<ZonaFC, { min: number; max: number }>>;

// ── Zonas de frecuencia cardíaca ─────────────────────────────────────────────

/**
 * Las cinco zonas desde la FC máxima, con las mismas bandas estándar que usa
 * `derivarZona` cuando no hay zonas a medida (Z1 50–60 % … Z5 90–100 %).
 * Contiguas y sin pisarse: cada zona arranca un latido después de la anterior.
 */
export function zonasDesdeFcMax(fcMax: number): ZonasFC {
  const out: ZonasFC = {};
  let previoMax: number | null = null;
  for (const z of ZONAS_FC) {
    const banda = BANDAS_PCT_FC_MAX[z];
    const min = previoMax == null ? Math.round(banda.min * fcMax) : previoMax + 1;
    const max = z === "Z5" ? Math.round(fcMax) : Math.round(banda.max * fcMax);
    out[z] = { min, max };
    previoMax = max;
  }
  return out;
}

/** FC máxima aceptable: fuera de esto casi seguro es un error de tipeo. */
export const FC_MAX_RANGO = { min: 120, max: 230 } as const;

/**
 * El problema de las zonas, en castellano, o `null` si están bien. No exige
 * que estén las cinco —un perfil puede tener solo algunas—, pero las que están
 * tienen que tener sentido y estar en orden.
 */
export function validarZonas(zonas: ZonasFC, fcMax: number | null): string | null {
  if (fcMax != null && (fcMax < FC_MAX_RANGO.min || fcMax > FC_MAX_RANGO.max)) {
    return `La FC máxima tiene que estar entre ${FC_MAX_RANGO.min} y ${FC_MAX_RANGO.max}.`;
  }
  let previa: { zona: ZonaFC; max: number } | null = null;
  for (const z of ZONAS_FC) {
    const r = zonas[z];
    if (!r) continue;
    if (!Number.isFinite(r.min) || !Number.isFinite(r.max) || r.min <= 0) {
      return `${z}: completá los dos valores.`;
    }
    if (r.min > r.max) return `${z}: el mínimo no puede ser mayor que el máximo.`;
    if (previa && r.min <= previa.max) {
      return `${z} arranca en ${r.min}, y ${previa.zona} termina en ${previa.max}: se pisan.`;
    }
    if (fcMax != null && r.max > fcMax) return `${z} pasa la FC máxima (${fcMax}).`;
    previa = { zona: z, max: r.max };
  }
  return null;
}

// ── Import de salud (/config/import) ─────────────────────────────────────────

export const DURACION_MINIMA_RANGO = { min: 0, max: 240 } as const;

export function validarDuracionMinima(min: number): string | null {
  if (!Number.isFinite(min) || !Number.isInteger(min)) return "La duración tiene que ser un número entero de minutos.";
  if (min < DURACION_MINIMA_RANGO.min || min > DURACION_MINIMA_RANGO.max) {
    return `La duración tiene que estar entre ${DURACION_MINIMA_RANGO.min} y ${DURACION_MINIMA_RANGO.max} minutos.`;
  }
  return null;
}

// ── Visibilidad (/config/visibilidad) ────────────────────────────────────────

/**
 * Prende o apaga un programa para un miembro. **Al prenderlo también se suman
 * sus rutinas**: un programa visible con rutinas ocultas se ve vacío. Al
 * apagarlo las rutinas quedan: pueden estar asignadas por separado, y sacarlas
 * sin preguntar escondería cosas que nadie pidió esconder.
 */
export function alternarPrograma(vis: VisibilidadMiembro, programa: Programa): VisibilidadMiembro {
  const activo = vis.programas.includes(programa.idPrograma);
  if (activo) {
    return { ...vis, programas: vis.programas.filter((p) => p !== programa.idPrograma) };
  }
  const deRutinas = programa.dias.map((d) => d.idRutina).filter((r): r is string => !!r);
  return {
    programas: [...vis.programas, programa.idPrograma],
    rutinas: [...new Set([...vis.rutinas, ...deRutinas])],
  };
}

export function alternarRutina(vis: VisibilidadMiembro, idRutina: string): VisibilidadMiembro {
  return vis.rutinas.includes(idRutina)
    ? { ...vis, rutinas: vis.rutinas.filter((r) => r !== idRutina) }
    : { ...vis, rutinas: [...vis.rutinas, idRutina] };
}

/** ¿Cambió algo? Compara como conjuntos: el orden no importa. */
export function visibilidadCambio(a: VisibilidadMiembro, b: VisibilidadMiembro): boolean {
  const igual = (x: string[], y: string[]) => x.length === y.length && x.every((v) => y.includes(v));
  return !igual(a.programas, b.programas) || !igual(a.rutinas, b.rutinas);
}
