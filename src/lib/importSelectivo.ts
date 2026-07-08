// ════════════════════════════════════════════════════════════════════════════
//  lib/importSelectivo.ts — filtro puro de cardio por relevancia (ADR #020)
//
//  Una sesión de cardio es relevante si cumple al menos una de estas reglas
//  (en orden; el primero que aplica define _motivo):
//    1. "shapeup"   — _customId en shapeUpCustomIds (sesión propia marcada en el reloj)
//    2. "historial" — ventana [_startMs, _endMs] solapa ±TOLERANCIA_MS con algún Historial
//    3. "vr"        — esVR === true (entrenamiento VR de la familia)
//    4. "actividad" — actividad figura en ACTIVIDADES_SIEMPRE_RELEVANTES
//
//  ADR #009: lógica pura, sin Firebase.
// ════════════════════════════════════════════════════════════════════════════

import type { Historial } from "../types/models";
import type { CardioInput } from "../import/samsungHealth";
import { TOLERANCIA_MS } from "./matchBiometrico";
import { ventanaDeHistorial } from "./enriquecerImport";

// ── Tipos públicos ─────────────────────────────────────────────────────────

export type MotivoRelevancia = "shapeup" | "historial" | "vr" | "actividad";

export interface FiltroCardio<T> {
  relevantes: (T & { _motivo: MotivoRelevancia })[];
  descartadas: T[];
}

// ── Constante editable ─────────────────────────────────────────────────────

/**
 * Actividades que siempre se importan aunque no haya Historial que las respalde.
 * Los nombres deben coincidir con la salida exacta de resolverActividad().
 * Constante exportada para que el owner pueda ampliarla sin editar la lógica.
 */
export const ACTIVIDADES_SIEMPRE_RELEVANTES: string[] = [
  "Body Combat",
  "Aeróbico",           // código 28 en EXERCISE_TYPE
  "HIIT",               // código 1001
  "Entrenamiento en circuito",
  "Entrenamiento de fuerza",
];

// ── Función principal ──────────────────────────────────────────────────────

/**
 * Clasifica cada sesión de cardio en relevante o descartada.
 *
 * @param cardio          Items parseados (pueden traer _startMs/_endMs/_customId).
 * @param historial       Historial del miembro para el match por ventana.
 * @param shapeUpCustomIds IDs custom de ShapeUp ([] si viene de CSV suelto).
 *
 * No muta la entrada. Stripeá `_motivo` antes de persistir:
 *   `relevantes.map(({ _motivo: _, ...rest }) => rest)`
 */
export function filtrarCardioRelevante<
  T extends CardioInput & { _startMs?: number; _endMs?: number; _customId?: string },
>(
  cardio: T[],
  historial: Historial[],
  shapeUpCustomIds: string[],
): FiltroCardio<T> {
  const relevantes: (T & { _motivo: MotivoRelevancia })[] = [];
  const descartadas: T[] = [];

  for (const c of cardio) {
    const motivo = clasificar(c, historial, shapeUpCustomIds);
    if (motivo !== null) {
      relevantes.push({ ...c, _motivo: motivo });
    } else {
      descartadas.push(c);
    }
  }

  return { relevantes, descartadas };
}

// ── Helpers internos ───────────────────────────────────────────────────────

function clasificar<
  T extends CardioInput & { _startMs?: number; _endMs?: number; _customId?: string },
>(
  c: T,
  historial: Historial[],
  shapeUpCustomIds: string[],
): MotivoRelevancia | null {
  // Regla 1: ShapeUp custom ID (lista no vacía, _customId no vacío)
  if (shapeUpCustomIds.length > 0 && c._customId && shapeUpCustomIds.includes(c._customId)) {
    return "shapeup";
  }

  // Regla 2: Solape con ventana de algún Historial
  if (solapaConHistorial(c, historial)) {
    return "historial";
  }

  // Regla 3: Sesión VR
  if (c.esVR) {
    return "vr";
  }

  // Regla 4: Actividad siempre relevante
  if (ACTIVIDADES_SIEMPRE_RELEVANTES.includes(c.actividad)) {
    return "actividad";
  }

  return null;
}

function solapaConHistorial<
  T extends CardioInput & { _startMs?: number; _endMs?: number },
>(c: T, historial: Historial[]): boolean {
  if (c._startMs != null && c._endMs != null) {
    // Tiene timestamps: chequeá solapamiento con tolerancia
    for (const h of historial) {
      const ventana = ventanaDeHistorial(h);
      if (!ventana) continue;
      if (
        c._startMs <= ventana.finMs + TOLERANCIA_MS &&
        c._endMs   >= ventana.inicioMs - TOLERANCIA_MS
      ) {
        return true;
      }
    }
  } else {
    // Sin timestamps: fallback por fecha (mismo día = solape)
    for (const h of historial) {
      if (c.fecha === h.fechaRealizada) return true;
    }
  }
  return false;
}
