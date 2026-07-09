// ════════════════════════════════════════════════════════════════════════════
//  lib/matchBiometrico.ts — cruce sesión ShapeUp ↔ Samsung Health
//
//  Llave de identificación: custom_id de la sesión "ShapeUp" en Samsung.
//  Curva fina:             live_data.json (~1 muestra FC/seg, epoch ms).
//  Degradación elegante:   sin curva → solo nivel sesión. Nunca tira error.
//
//  ADR: match por custom_id (resuelto por nombre "ShapeUp", no hardcodeado).
//  Si ninguna candidata trae custom_id → fallback por ventana de solapamiento.
// ════════════════════════════════════════════════════════════════════════════

import type {
  BiometriaSesion, SerieRegistro, ZonaFC, PerfilMiembro,
} from "../types/models";
import type { LiveDataPoint } from "../import/samsungLiveData";

/** Representación mínima de una fila exercise de Samsung necesaria para el match. */
export interface SesionSamsung {
  datauuid: string;
  startMs: number;
  endMs: number;
  /** Presente si la sesión fue de tipo ShapeUp (custom_id coincide). */
  customId?: string;
  fcMedia?: number;
  fcMax?: number;
  fcMin?: number;
  kcal?: number;
  /** Fecha local "YYYY-MM-DD" de la sesión — solo para el fallback "día único". */
  fecha?: string;
}

/** Ventana de la sesión de la app (epoch ms). */
export interface SesionApp {
  inicioMs: number;
  finMs: number;
  /** true si la ventana vino del fallback por fecha (ver ventanaDeHistorial, caso 3). */
  sintetica?: boolean;
  /** Fecha local "YYYY-MM-DD" de la sesión app — requerida para el fallback "día único". */
  fecha?: string;
}

/** Tolerancia de solapamiento (5 min) para el fallback por ventana. */
export const TOLERANCIA_MS = 5 * 60 * 1000;

/**
 * De las candidatas Samsung, elige la que más solapa con la sesión de la app.
 *
 * 1. Si se conoce `shapeUpCustomId`, filtra solo las filas con ese custom_id.
 * 2. Entre ellas, toma la de mayor solapamiento con la ventana de la app.
 * 3. Fallback: si no hay match por custom_id, busca en todas las candidatas
 *    (matchPor = "ventana").
 * 4. Fallback "día único" (S-fix-b): si la ventana es **sintética** (no hay
 *    timestamps reales — la superposición horaria no es confiable) y en el
 *    pool por custom_id hay **exactamente una** candidata con la misma fecha
 *    local que la sesión app, se matchea por día (`matchPor: "dia"`). Con dos
 *    o más candidatas ese día, la situación es ambigua y no se adivina:
 *    devuelve `{ sesion: null, matchPor: "ambiguo" }`. Con ventana real esto
 *    no aplica — rigen los techos de solapamiento de siempre.
 *
 * Retorna null si ninguna candidata solapa (ni siquiera por día).
 */
export function elegirSesionSamsung(
  sesionApp: SesionApp,
  candidatas: SesionSamsung[],
  shapeUpCustomId?: string,
):
  | { sesion: SesionSamsung; matchPor: "custom-id" | "ventana" | "dia" }
  | { sesion: null; matchPor: "ambiguo" }
  | null {
  function maxSolapo(pool: SesionSamsung[]) {
    return pool
      .map((c) => {
        const solapo =
          Math.min(c.endMs, sesionApp.finMs + TOLERANCIA_MS) -
          Math.max(c.startMs, sesionApp.inicioMs - TOLERANCIA_MS);
        return { sesion: c, solapo };
      })
      .filter((x) => x.solapo > 0)
      .sort((a, b) => b.solapo - a.solapo)[0] ?? null;
  }

  // Intento 1: custom_id conocido
  const poolCustomId = shapeUpCustomId
    ? candidatas.filter((c) => c.customId === shapeUpCustomId)
    : [];
  if (shapeUpCustomId) {
    const match = maxSolapo(poolCustomId);
    if (match) return { sesion: match.sesion, matchPor: "custom-id" };
  }

  // Fallback: mayor solapamiento entre todas
  const matchVentana = maxSolapo(candidatas);
  if (matchVentana) return { sesion: matchVentana.sesion, matchPor: "ventana" };

  // Fallback "día único": solo para ventanas sintéticas, solo dentro del pool ShapeUp
  if (sesionApp.sintetica && shapeUpCustomId && sesionApp.fecha) {
    const delDia = poolCustomId.filter((c) => c.fecha === sesionApp.fecha);
    if (delDia.length === 1) return { sesion: delDia[0], matchPor: "dia" };
    if (delDia.length >= 2) return { sesion: null, matchPor: "ambiguo" };
  }

  return null;
}

// ── Helpers de curva ─────────────────────────────────────────────────────────

function fcEnVentana(
  curva: LiveDataPoint[],
  desdeMs: number,
  hastaMs: number,
): { pico: number | undefined; ultimo: number | undefined } {
  const ventana = curva.filter((p) => p.ms >= desdeMs && p.ms <= hastaMs);
  if (ventana.length === 0) return { pico: undefined, ultimo: undefined };
  return {
    pico:   Math.max(...ventana.map((p) => p.fc)),
    ultimo: ventana[ventana.length - 1].fc,
  };
}

/**
 * Enriquece una serie con datos de FC de la curva live_data.
 * Requiere `serie.inicioMs` y `serie.finMs`; sin ellos devuelve {}.
 * `inicioSiguienteMs` permite calcular recuperaciónBpm (FC al final del descanso).
 */
export function enriquecerSerie(
  serie: SerieRegistro,
  curva: LiveDataPoint[],
  inicioSiguienteMs?: number,
): Pick<SerieRegistro, "fcPico" | "fcFinSerie" | "recuperacionBpm"> {
  if (!serie.inicioMs || !serie.finMs) return {};

  const { pico, ultimo } = fcEnVentana(curva, serie.inicioMs, serie.finMs);

  let recuperacionBpm: number | undefined;
  if (pico !== undefined && inicioSiguienteMs !== undefined) {
    const { ultimo: fcFinDescanso } = fcEnVentana(curva, serie.finMs, inicioSiguienteMs);
    if (fcFinDescanso !== undefined) {
      const delta = pico - fcFinDescanso;
      if (delta > 0) recuperacionBpm = delta;
    }
  }

  return { fcPico: pico, fcFinSerie: ultimo, recuperacionBpm };
}

/**
 * Deriva la zona de FC de un valor numérico usando el perfil del miembro.
 * Retorna undefined si no hay zonasFC configuradas o la FC no cae en ninguna zona.
 */
export function derivarZona(
  fcMedia: number,
  perfil?: PerfilMiembro,
): ZonaFC | undefined {
  const zonasFC = perfil?.zonasFC;
  if (!zonasFC) return undefined;
  for (const zona of (["Z5", "Z4", "Z3", "Z2", "Z1"] as ZonaFC[])) {
    const z = zonasFC[zona];
    if (!z) continue;
    if (fcMedia >= z.min && fcMedia <= z.max) return zona;
  }
  return undefined;
}

/**
 * Construye la `BiometriaSesion` a nivel sesión (cuando no hay curva fina).
 * Degradación elegante: nunca tira error. `granularidad: "sesion"`.
 */
export function construirBiometriaSesion(
  sesionSamsung: SesionSamsung,
  matchPor: "custom-id" | "ventana" | "dia",
  perfil?: PerfilMiembro,
): BiometriaSesion {
  const fcMedia = sesionSamsung.fcMedia;
  return {
    fuente:          "samsung-health-csv",
    datauuidSamsung: sesionSamsung.datauuid,
    fcMedia,
    fcMax:           sesionSamsung.fcMax,
    fcMin:           sesionSamsung.fcMin,
    zonaPrincipal:   fcMedia !== undefined ? derivarZona(fcMedia, perfil) : undefined,
    kcal:            sesionSamsung.kcal,
    matchPor,
    granularidad:    "sesion",
  };
}
