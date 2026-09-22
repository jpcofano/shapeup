// ════════════════════════════════════════════════════════════════════════════
//  lib/juegos.ts — los juegos de VR que se registran pero no cuentan (P81).
//
//  Juan juega juegos que no son entrenamiento —Behemoth, Drums Rock, Rock— y
//  quiere que queden en el historial y en el análisis sin meterse en la racha,
//  la meta, la adherencia, el tonelaje ni la progresión. **No sabe si le sirven
//  de algo**, y justamente para eso: que los datos lo digan.
//
//  Por eso lo único que vale acá es la FC. "40 minutos de Behemoth" solo no
//  dice nada; "40 minutos de Behemoth con la FC en Z2" sí.
//
//  Qué NO se muestra: las kcal. En actividades de brazos el reloj las infla
//  (roadmap §9.5), y mostrar un número que sabemos que está mal es peor que no
//  mostrar nada.
//
//  Núcleo puro (ADR #009).
// ════════════════════════════════════════════════════════════════════════════

import type { Historial, ZonaFC } from "../types/models";
import { ZONAS_FC } from "../types/models";
import { esJuego } from "./tipoHistorial";

/** Los juegos con los que arranca `/config/diccionarios` (P81, Parte 3). */
export const JUEGOS_SIN_EJERCICIO_DEFAULT: readonly string[] = [
  "Behemoth", "Drums Rock", "Rock",
];

// ── La lista ────────────────────────────────────────────────────────────────

/**
 * Normaliza la lista guardada: descarta lo que no sea texto, recorta, saca
 * vacíos y duplicados (sin distinguir mayúsculas) y ordena alfabéticamente.
 *
 * Un documento a medio completar no rompe nada: si el campo no está o viene con
 * el tipo equivocado, se usan los defaults.
 */
export function normalizarJuegos(valor: unknown): string[] {
  if (!Array.isArray(valor)) return [...JUEGOS_SIN_EJERCICIO_DEFAULT];
  const vistos = new Set<string>();
  const out: string[] = [];
  for (const v of valor) {
    if (typeof v !== "string") continue;
    const nombre = v.trim();
    if (!nombre) continue;
    const clave = nombre.toLocaleLowerCase("es");
    if (vistos.has(clave)) continue;
    vistos.add(clave);
    out.push(nombre);
  }
  return out.sort((a, b) => a.localeCompare(b, "es"));
}

/** Agrega un juego. Si ya estaba (sin distinguir mayúsculas), no hace nada. */
export function agregarJuego(lista: string[], nombre: string): string[] {
  return normalizarJuegos([...lista, nombre]);
}

/** Saca un juego de la lista. **No toca sus sesiones**: quedan con su nombre. */
export function quitarJuego(lista: string[], nombre: string): string[] {
  const clave = nombre.trim().toLocaleLowerCase("es");
  return lista.filter((j) => j.toLocaleLowerCase("es") !== clave);
}

/** Renombra un juego de la lista. Tampoco toca las sesiones ya guardadas. */
export function renombrarJuego(lista: string[], viejo: string, nuevo: string): string[] {
  return normalizarJuegos(quitarJuego(lista, viejo).concat(nuevo));
}

// ── El análisis ─────────────────────────────────────────────────────────────

/** Una fila de la sección "Juegos" de Progreso. */
export interface ResumenJuego {
  juego: string;
  sesiones: number;
  minutos: number;
  /**
   * FC media **ponderada por duración**, solo sobre las sesiones con FC
   * confiable. `null` si no hay ninguna: ahí la fila dice "sin FC todavía" en
   * vez de mostrar un número inventado.
   */
  fcMedia: number | null;
  /** Minutos con FC confiable, que es sobre lo que se calcula el reparto. */
  minutosConFc: number;
  /** Cuánto tiempo cayó en cada zona, por la zona principal de cada sesión. */
  minutosPorZona: Record<ZonaFC, number>;
  /**
   * El tramo de zonas donde cayó la mayor parte del tiempo, y qué porcentaje.
   * `null` cuando no hay FC confiable.
   */
  zonaDominante: { desde: ZonaFC; hasta: ZonaFC; porcentaje: number } | null;
}

/** ¿La FC de esta sesión sirve para contarla? Medida y sin pinta de artefacto. */
function fcConfiable(h: Historial): number | null {
  const b = h.biometria;
  if (!b || b.fcMedia == null || b.fcDudosa) return null;
  return b.fcMedia;
}

function zonasVacias(): Record<ZonaFC, number> {
  return Object.fromEntries(ZONAS_FC.map((z) => [z, 0])) as Record<ZonaFC, number>;
}

/**
 * El tramo de una o dos zonas contiguas con más tiempo adentro.
 *
 * Una sola zona alcanza cuando ya se lleva la mayoría; si no, el par contiguo
 * que más junta. Es lo que hace legible la línea: "70 % del tiempo en Z2–Z3"
 * dice más que cinco porcentajes sueltos.
 */
function tramoDominante(
  porZona: Record<ZonaFC, number>, total: number,
): ResumenJuego["zonaDominante"] {
  if (total <= 0) return null;

  let mejor: { desde: ZonaFC; hasta: ZonaFC; min: number } | null = null;
  const considerar = (desde: ZonaFC, hasta: ZonaFC, min: number) => {
    if (!mejor || min > mejor.min) mejor = { desde, hasta, min };
  };

  for (const z of ZONAS_FC) considerar(z, z, porZona[z]);
  const unaSola = mejor!;
  if (unaSola.min / total < 0.6) {
    for (let i = 0; i < ZONAS_FC.length - 1; i++) {
      const a = ZONAS_FC[i], b = ZONAS_FC[i + 1];
      considerar(a, b, porZona[a] + porZona[b]);
    }
  }

  const m = mejor!;
  return { desde: m.desde, hasta: m.hasta, porcentaje: Math.round((m.min / total) * 100) };
}

/**
 * Una fila por juego, ordenadas por tiempo jugado.
 *
 * Solo con lo medido: las sesiones sin FC confiable suman minutos y sesiones,
 * pero no entran en la FC media ni en el reparto por zona. Un juego sin
 * ninguna FC confiable queda con `fcMedia: null`, que es lo que la pantalla
 * traduce a "sin FC todavía".
 */
export function resumenPorJuego(historial: Historial[]): ResumenJuego[] {
  const porJuego = new Map<string, ResumenJuego>();

  for (const h of historial) {
    if (!esJuego(h)) continue;
    const juego = (h.nombreJuego ?? h.nombreRutina ?? "Sin nombre").trim() || "Sin nombre";

    const fila = porJuego.get(juego) ?? {
      juego, sesiones: 0, minutos: 0, fcMedia: null,
      minutosConFc: 0, minutosPorZona: zonasVacias(), zonaDominante: null,
    };
    porJuego.set(juego, fila);

    const min = h.duracionRealMin ?? 0;
    fila.sesiones++;
    fila.minutos += min;

    const fc = fcConfiable(h);
    if (fc == null || min <= 0) continue;

    // La media se pondera por duración: una sesión de 45 min pesa más que una
    // de 10, que es lo que uno quiere decir con "la FC de este juego".
    fila.fcMedia = ((fila.fcMedia ?? 0) * fila.minutosConFc + fc * min) / (fila.minutosConFc + min);
    fila.minutosConFc += min;

    const zona = h.biometria?.zonaPrincipal;
    if (zona) fila.minutosPorZona[zona] += min;
  }

  const filas = [...porJuego.values()];
  for (const f of filas) {
    if (f.fcMedia != null) f.fcMedia = Math.round(f.fcMedia);
    const enZonas = ZONAS_FC.reduce((a, z) => a + f.minutosPorZona[z], 0);
    f.zonaDominante = tramoDominante(f.minutosPorZona, enZonas);
  }
  return filas.sort((a, b) => b.minutos - a.minutos || a.juego.localeCompare(b.juego, "es"));
}
