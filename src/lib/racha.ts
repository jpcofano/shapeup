// ════════════════════════════════════════════════════════════════════════════
//  lib/racha.ts — racha del plan y días activos (P74).
//
//  Separa dos cosas que no son la misma:
//
//    · la adherencia — cumpliste el plan: SOLO sesiones hechas en la app.
//    · `diasActivos` — te moviste: TODO, actividades incluidas.
//
//  Es la separación que pide el roadmap (Bloque 5): que una caminata no infle
//  la adherencia, pero que tampoco te quite el crédito por haberte movido.
//
//  **`rachaDelPlan` vivía acá y se fue en P77a.** Contaba semanas con AL MENOS
//  una sesión, que no es cumplir el plan: una semana con una sesión de cuatro
//  mantenía la racha viva. La reemplaza `lib/adherencia.ts`, que cuenta días
//  contra la meta. No queremos dos definiciones de racha conviviendo.
//
//  Núcleo puro (ADR #009).
// ════════════════════════════════════════════════════════════════════════════

import type { Historial } from "../types/models";
import { esShapeUp } from "./tipoHistorial";
import { type ActividadFiltrable } from "./actividadRelevante";

/**
 * Días DISTINTOS con alguna actividad entre `desde` y `hasta`, ambos inclusive
 * ("YYYY-MM-DD"). Dos sesiones el mismo día son un día.
 *
 * Cuenta TODO, externas incluidas: habla de moverse, no de cumplir el plan.
 */
export function diasActivos(historial: Historial[], desde: string, hasta: string): number {
  const dias = new Set<string>();
  for (const h of historial) {
    if (h.fechaRealizada >= desde && h.fechaRealizada <= hasta) dias.add(h.fechaRealizada);
  }
  return dias.size;
}

// ── Días activos con su origen (P75b) ────────────────────────────────────────

/**
 * Un día con actividad y de dónde vino. Las tres marcas no son excluyentes: un
 * día puede tener una sesión de la app Y una caminata.
 */
export interface DiaActivo {
  fecha: string;               // "YYYY-MM-DD"
  shapeUp: boolean;            // entrenaste en la app
  externaDeclarada: boolean;   // actividad que arrancaste vos
  autodetectada: boolean;      // el reloj la registró solo
  /**
   * Minutos de movimiento del día: las sesiones de la app más las actividades
   * de `/cardio`. Las marcas dicen QUÉ hubo; esto dice CUÁNTO, que es lo que
   * un consumidor necesita para poner un piso sin que el agrupador se lo
   * imponga (una caminata de 8 min y tres de 8 min no son lo mismo).
   *
   * Una actividad que enriqueció una sesión de la app **no se suma dos veces**:
   * es el mismo hecho medido por el reloj y registrado en la app.
   */
  minutos: number;
}

/** Lo que el agrupador necesita de una actividad de `/cardio` (P76b). */
export type ActividadDia = ActividadFiltrable & {
  fecha: string;
  /** `CAR-{datauuid}`. Con esto se detecta la que ya enriqueció una sesión. */
  idCardio?: string;
};

/**
 * Agrupa las dos fuentes en días, con las marcas de cada origen.
 * Núcleo puro de `data/historial.getDiasActivos`.
 *
 * Desde P76b las actividades **no están en `/historial`**: llegan aparte, de
 * `/cardio`. Por eso son dos parámetros y no uno.
 *
 * **`actividadRelevante` NO se aplica acá, a propósito.** Ese filtro decide qué
 * se MUESTRA en el historial, no si te moviste: una caminata declarada de 20
 * minutos no es una sesión de entrenamiento, pero el día igual fue un día
 * activo. Aplicarlo acá además era incoherente — una autodetectada marcaba el
 * día siempre, y una declarada más corta que el umbral no marcaba nada.
 *
 * Toda actividad marca su día, según su origen: el reloj la registró solo
 * (`autodetectada`) o la arrancaste vos (`externaDeclarada`).
 *
 * **No decide por el consumidor**: devuelve las tres marcas y los `minutos`, y
 * cada quien elige qué cuenta. La racha del plan mira `shapeUp`; la tira de la
 * semana mira `minutos`. Ordenado por fecha ascendente.
 */
export function agruparDiasActivos(
  historial: Historial[],
  actividades: ActividadDia[] = [],
): DiaActivo[] {
  const porFecha = new Map<string, DiaActivo>();
  const diaDe = (fecha: string): DiaActivo => {
    const dia = porFecha.get(fecha)
      ?? { fecha, shapeUp: false, externaDeclarada: false, autodetectada: false, minutos: 0 };
    porFecha.set(fecha, dia);
    return dia;
  };

  // Las actividades que ya están contadas adentro de una sesión de la app: el
  // reloj midió el mismo entrenamiento que la app registró, y sumarlas otra vez
  // daría el doble de minutos.
  const yaEnUnaSesion = new Set(
    historial
      .filter((h) => h.biometria?.datauuidSamsung)
      .map((h) => `CAR-${h.biometria!.datauuidSamsung}`),
  );

  for (const h of historial) {
    const fecha = h.fechaRealizada;
    if (!fecha) continue;
    const dia = diaDe(fecha);
    dia.minutos += h.duracionRealMin ?? 0;

    if (esShapeUp(h)) {
      dia.shapeUp = true;
    } else if (h.externa?.origen === "autodetectada") {
      // Entradas de P75 que hayan quedado escritas: se siguen leyendo.
      dia.autodetectada = true;
    } else {
      // Externa sin marca de origen (anterior a P75b): se asume declarada, que
      // es lo conservador — no la escondemos detrás del filtro de autodetectadas.
      dia.externaDeclarada = true;
    }
  }

  for (const a of actividades) {
    if (!a.fecha) continue;
    const dia = diaDe(a.fecha);
    if (!a.idCardio || !yaEnUnaSesion.has(a.idCardio)) dia.minutos += a.duracionMin ?? 0;
    // Sin filtro de duración: el día se marca por el ORIGEN de la actividad, y
    // el consumidor decide qué cuenta como "me moví".
    if (a.autodetectada === true) dia.autodetectada = true;
    else                          dia.externaDeclarada = true;
  }

  return [...porFecha.values()].sort((a, b) => a.fecha.localeCompare(b.fecha));
}
