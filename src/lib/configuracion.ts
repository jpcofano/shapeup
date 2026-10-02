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

export type ZonasFC = Partial<Record<ZonaFC, { min: number; max: number }>>;

// ── Zonas de frecuencia cardíaca ─────────────────────────────────────────────

// De la FC máxima a las zonas: `zonasDesdeFcMax`, en lib/zonas (P97). Acá no
// hay otra copia del cálculo.

/** FC máxima aceptable: fuera de esto casi seguro es un error de tipeo. */
export const FC_MAX_RANGO = { min: 120, max: 230 } as const;

/**
 * El problema de las zonas, en castellano, o `null` si están bien. No exige
 * que estén las cinco —un perfil puede tener solo algunas—, pero las que están
 * tienen que tener sentido, estar en orden y ser **contiguas** (P97): cada una
 * arranca un latido después de que termina la anterior, sin pisarse ni dejar
 * hueco, y no falta ninguna entre dos que están.
 */
export function validarZonas(zonas: ZonasFC, fcMax: number | null): string | null {
  if (fcMax != null && (fcMax < FC_MAX_RANGO.min || fcMax > FC_MAX_RANGO.max)) {
    return `La FC máxima tiene que estar entre ${FC_MAX_RANGO.min} y ${FC_MAX_RANGO.max}.`;
  }
  let previa: { zona: ZonaFC; max: number; i: number } | null = null;
  for (const [i, z] of ZONAS_FC.entries()) {
    const r = zonas[z];
    if (!r) continue;
    if (!Number.isFinite(r.min) || !Number.isFinite(r.max) || r.min <= 0) {
      return `${z}: completá los dos valores.`;
    }
    if (r.min > r.max) return `${z}: el mínimo no puede ser mayor que el máximo.`;
    if (previa && r.min <= previa.max) {
      return `${z} arranca en ${r.min}, y ${previa.zona} termina en ${previa.max}: se pisan.`;
    }
    if (previa && i > previa.i + 1) {
      return `Falta ${ZONAS_FC[previa.i + 1]} entre ${previa.zona} y ${z}.`;
    }
    if (previa && r.min !== previa.max + 1) {
      return `${previa.zona} termina en ${previa.max} y ${z} arranca en ${r.min}: queda un hueco. ${z} tiene que arrancar en ${previa.max + 1}.`;
    }
    if (fcMax != null && r.max > fcMax) return `${z} pasa la FC máxima (${fcMax}).`;
    previa = { zona: z, max: r.max, i };
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

/** Rango aceptable del análisis global, en semanas (P93). */
export const SEMANAS_ANALISIS_RANGO = { min: 1, max: 52 } as const;

/** El problema del rango del análisis global, o `null` si está bien (P93). */
export function validarSemanasAnalisis(semanas: number): string | null {
  if (!Number.isFinite(semanas) || !Number.isInteger(semanas)) return "Las semanas tienen que ser un número entero.";
  if (semanas < SEMANAS_ANALISIS_RANGO.min || semanas > SEMANAS_ANALISIS_RANGO.max) {
    return `Las semanas tienen que estar entre ${SEMANAS_ANALISIS_RANGO.min} y ${SEMANAS_ANALISIS_RANGO.max}.`;
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
