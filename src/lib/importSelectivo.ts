// ════════════════════════════════════════════════════════════════════════════
//  lib/importSelectivo.ts — clasificador puro del import (P75, ADR #020)
//
//  Hasta P74 esto FILTRABA: cada actividad quedaba "relevante" o "descartada",
//  y lo descartado se perdía sin dejar rastro. Desde P75 **nada se descarta en
//  silencio**: cada item se clasifica en uno de tres destinos, y el que no
//  entra dice por qué.
//
//    · "enriquece"  — es una sesión que ya entrenaste en la app. El dato se
//                     suma a ese Historial; NO se crea una entrada nueva.
//    · "externa"    — no matchea nada, pero es entrenamiento igual. Entra como
//                     Historial con `tipo: "externa"` (lib/entradaExterna.ts).
//    · "descartada" — ni matchea ni llega al umbral. No se escribe, pero se
//                     muestra con su explicación.
//
//  Reglas en orden; la primera que aplica define el destino:
//    1. "shapeup"   — _customId en shapeUpCustomIds        → enriquece,
//                     o externa si no hay sesión que enriquecer (P75b)
//    2. "historial" — la ventana solapa con una sesión app → enriquece
//    3. "vr"        — esVR, SIN mínimo de duración         → externa
//    4. "actividad" — actividad configurada y ≥ umbral     → externa
//    5. "duracion"  — ≥ umbral                             → externa
//    6. "sin-match" — lo demás                             → descartada
//
//  P75b: "descartada" ya no significa que el dato se pierda — TODAS las filas
//  van igual a /cardio. Lo que el destino decide es si además entra al historial.
//
//  ADR #009: lógica pura, sin Firebase.
// ════════════════════════════════════════════════════════════════════════════

import type { Historial, MotivoIngreso, OrigenExterna } from "../types/models";
import type { CardioInput } from "../import/samsungHealth";
import { TOLERANCIA_MS } from "./matchBiometrico";
import { ventanaDeHistorial } from "./enriquecerImport";
import { soloShapeUp } from "./tipoHistorial";

// ── Tipos públicos ─────────────────────────────────────────────────────────

export type DestinoImport = "enriquece" | "externa" | "descartada";

export type MotivoClasificacion =
  | "shapeup" | "historial" | "vr" | "actividad" | "duracion" | "sin-match";

export interface ItemClasificado<T> {
  item: T;
  destino: DestinoImport;
  motivo: MotivoClasificacion;
  /** Solo si `destino === "enriquece"`: el Historial que este dato enriquece. */
  idHist?: string;
  /** Solo si `destino === "externa"`: qué regla la hizo entrar al historial. */
  motivoIngreso?: MotivoIngreso;
  /** Una línea en castellano para mostrarle al usuario. */
  explicacion: string;
}

/** Lo que el clasificador necesita de la configuración (`/config/import`). */
export interface ConfigClasificacion {
  duracionMinimaMin: number;
  actividadesSiempreRelevantes: string[];
}

/** Item de cardio con los campos técnicos que agrega el parser de Samsung. */
export type CardioClasificable = CardioInput & {
  _startMs?: number;
  _endMs?: number;
  _customId?: string;
  /** Muestras de la curva de FC de esta sesión, si el origen las entrega. */
  _muestrasCurva?: number;
};

// ── ¿La registró el reloj solo? (ADR #035) ─────────────────────────────────

/** Lo mínimo para decidir el `origen` de una actividad. */
export interface ItemAutodetectable {
  fcPromedio?: number;
  fcMaxima?: number;
  /** Cuántos puntos de curva de FC hay para esta sesión. Ausente o 0 = ninguna. */
  _muestrasCurva?: number;
}

/**
 * ¿La actividad la registró el reloj solo, sin que vos la arrancaras?
 *
 * **La condición es la ausencia de FC**: ni curva ni valores. Es la que se
 * cumple siempre, venga el dato por ZIP o por la vía D del puente — a una
 * sesión que arrancás a mano el reloj le mide el pulso; a una que detecta solo
 * (caminatas, sobre todo) no.
 *
 * Relación con el ADR #035: el ADR describe tres marcas de las autodetectadas
 * en el ZIP — `live_data_internal` vacío, sin FC, y los milisegundos del inicio
 * en `.000`. Las tres se verificaron contra el export del 14/09 (2554 filas):
 * 987 sin `live_data_internal`, 1036 sin FC media, 800 con los ms en `.000`, y
 * solo 772 con las tres juntas. Los milisegundos redondos se quedan cortos y
 * además son un detalle del formato del ZIP, no del hecho: por eso no deciden.
 * Acá **no se descarta nada** (ese era el planteo del ADR): se marca, que es
 * reversible, y P76 decide qué hacer con lo marcado.
 */
export function esAutodetectada(item: ItemAutodetectable): boolean {
  if (item.fcPromedio != null || item.fcMaxima != null) return false;
  return (item._muestrasCurva ?? 0) === 0;
}

/** El `origen` que le corresponde a una actividad. */
export function origenDe(item: ItemAutodetectable): OrigenExterna {
  return esAutodetectada(item) ? "autodetectada" : "declarada";
}

// ── Defaults de configuración ──────────────────────────────────────────────

/**
 * DEFAULT de `/config/import.actividadesSiempreRelevantes` — se usa tal cual si
 * el documento no existe. Los nombres deben coincidir con la salida exacta de
 * `resolverActividad()`.
 */
export const ACTIVIDADES_SIEMPRE_RELEVANTES: string[] = [
  "Body Combat",
  "Aeróbico",            // código 28 en EXERCISE_TYPE
  "HIIT",                // nombre libre/custom — el código 1001 es Caminata, no HIIT (S-fix, P55)
  "Entrenamiento en circuito",
  "Entrenamiento de fuerza",
];

/**
 * DEFAULT de `/config/import.duracionMinimaMin`. Diez minutos: por debajo de
 * eso no es entrenamiento, se llame como se llame (S-fix, P55 — el bug de mapeo
 * etiquetaba caminatas de 1 min como "HIIT"). Configurable desde P75, pero el
 * valor no cambia.
 */
export const DURACION_MIN_ACTIVIDAD_MIN = 10;

// ── Función principal ──────────────────────────────────────────────────────

/**
 * Clasifica cada item del import en enriquece / externa / descartada.
 *
 * `now` (epoch ms) solo se usa para redactar la explicación ("de hoy" vs "del
 * 14/9"): no cambia ninguna decisión.
 *
 * No muta la entrada. Antes de persistir, sacá los campos `_`.
 */
export function clasificarImport<T extends CardioClasificable>(
  items: T[],
  historial: Historial[],
  shapeUpCustomIds: string[],
  config: ConfigClasificacion,
  now: number,
): ItemClasificado<T>[] {
  // Solo ShapeUp (P74): si una externa de un import anterior contara como
  // historial, cada actividad se enriquecería a sí misma en la próxima corrida.
  const propias = soloShapeUp(historial);
  return items.map((item) => clasificar(item, propias, shapeUpCustomIds, config, now));
}

function clasificar<T extends CardioClasificable>(
  c: T,
  propias: Historial[],
  shapeUpCustomIds: string[],
  config: ConfigClasificacion,
  now: number,
): ItemClasificado<T> {
  const dur = c.duracionMin;

  // Regla 1 — marcada como ShapeUp en el reloj.
  if (shapeUpCustomIds.length > 0 && c._customId && shapeUpCustomIds.includes(c._customId)) {
    const h = buscarHistorialSolapado(c, propias);
    if (h) {
      return {
        item: c, destino: "enriquece", motivo: "shapeup", idHist: h.idHist,
        explicacion: `Marcada como ShapeUp en el reloj — enriquece tu ${nombreSesion(h)} ${cuando(h.fechaRealizada, now)}`,
      };
    }
    // Sin sesión que enriquecer: es un entrenamiento tuyo real, anterior a la
    // app. Antes desaparecía en silencio; ahora entra marcado y P76 lo va a
    // poder convertir en una sesión de verdad (P75b).
    return {
      item: c, destino: "externa", motivo: "shapeup", motivoIngreso: "shapeup-sin-sesion",
      explicacion: `Entrenamiento tuyo${duracionTexto(dur)} sin sesión en la app — entra para poder convertirlo`,
    };
  }

  // Regla 2 — la ventana solapa con una sesión entrenada en la app.
  const solapada = buscarHistorialSolapado(c, propias);
  if (solapada) {
    return {
      item: c, destino: "enriquece", motivo: "historial", idHist: solapada.idHist,
      explicacion: `Ya estaba en tu ${nombreSesion(solapada)} ${cuando(solapada.fechaRealizada, now)}`,
    };
  }

  // Regla 3 — VR entra siempre: una partida corta también es entrenamiento.
  if (c.esVR) {
    return {
      item: c, destino: "externa", motivo: "vr", motivoIngreso: "vr",
      explicacion: `Sesión de VR${duracionTexto(dur)} — entra como entrenamiento`,
    };
  }

  const llegaAlUmbral = dur != null && dur >= config.duracionMinimaMin;

  // Regla 4 — actividad de la lista configurada, con el piso de duración.
  if (config.actividadesSiempreRelevantes.includes(c.actividad) && llegaAlUmbral) {
    return {
      item: c, destino: "externa", motivo: "actividad", motivoIngreso: "actividad",
      explicacion: `${c.actividad}${duracionTexto(dur)} — actividad que siempre se importa`,
    };
  }

  // Regla 5 — cualquier cosa que dure lo suficiente. La regla nueva de P75:
  // una caminata de 40 minutos ya no se pierde.
  if (llegaAlUmbral) {
    return {
      item: c, destino: "externa", motivo: "duracion", motivoIngreso: "duracion",
      explicacion: `${c.actividad}${duracionTexto(dur)} — entra por duración`,
    };
  }

  // Regla 6 — ni matchea ni llega al umbral.
  return {
    item: c, destino: "descartada", motivo: "sin-match",
    explicacion: dur == null
      ? `${c.actividad} sin duración registrada, sin sesión que la respalde`
      : `${c.actividad} de ${Math.round(dur)} min, sin sesión que la respalde`,
  };
}

// ── Helpers internos ───────────────────────────────────────────────────────

/**
 * El Historial de ShapeUp cuya ventana solapa con la del item, o `null`.
 * Con timestamps, solapamiento real con `TOLERANCIA_MS`; sin ellos, el mismo día.
 */
function buscarHistorialSolapado<T extends CardioClasificable>(
  c: T,
  propias: Historial[],
): Historial | null {
  if (c._startMs != null && c._endMs != null) {
    for (const h of propias) {
      const ventana = ventanaDeHistorial(h);
      if (!ventana) continue;
      if (
        c._startMs <= ventana.finMs + TOLERANCIA_MS &&
        c._endMs   >= ventana.inicioMs - TOLERANCIA_MS
      ) {
        return h;
      }
    }
    return null;
  }
  // Sin timestamps: fallback por fecha (mismo día = solape).
  return propias.find((h) => c.fecha === h.fechaRealizada) ?? null;
}

/** "sesión de Fuerza A" / "sesión" — para la explicación. */
function nombreSesion(h: Historial): string {
  return h.nombreRutina ? `sesión de ${h.nombreRutina}` : "sesión";
}

/** "de hoy" o "del 14/9". `fecha` es "YYYY-MM-DD". */
function cuando(fecha: string, now: number): string {
  const d = new Date(now);
  const hoy = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  if (fecha === hoy) return "de hoy";
  const [, mes, dia] = fecha.split("-");
  return `del ${Number(dia)}/${Number(mes)}`;
}

/** " de 40 min", o "" si no hay duración. */
function duracionTexto(dur: number | undefined): string {
  return dur != null ? ` de ${Math.round(dur)} min` : "";
}
