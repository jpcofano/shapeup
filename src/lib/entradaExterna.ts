// ════════════════════════════════════════════════════════════════════════════
//  lib/entradaExterna.ts — construye un Historial `tipo: "externa"` (P75).
//
//  Una entrada externa es una actividad que NO se entrenó en la app (una
//  caminata, un partido) y que igual merece quedar registrada: no matcheó
//  ninguna sesión, pero pasó el umbral de duración.
//
//  No tiene bloques ni tonelaje, y por eso ninguna métrica de plan o de
//  progresión la cuenta — de eso se ocupan los predicados de P74
//  (`lib/tipoHistorial.ts`), que leen justamente el `tipo`.
//
//  **Idempotencia:** `idHist` sale del `datauuid` de Samsung, así que
//  reimportar el mismo ZIP pisa la misma entrada en vez de duplicarla. Es la
//  misma estrategia que `idMetrica` y que `CAR-{datauuid}`.
//
//  Núcleo puro (ADR #009): sin Firebase, se testea sola.
// ════════════════════════════════════════════════════════════════════════════

import type {
  Historial, MiembroId, BiometriaSesion, FirestoreTimestamp, FuenteDato, ZonaFC,
  MotivoIngreso,
} from "../types/models";
import { lunesDeSemana } from "./semana";
import { origenDe } from "./importSelectivo";

/** Lo que el parser de Samsung entrega para una actividad. */
export interface ItemExterno {
  fecha: string;                 // "YYYY-MM-DD"
  actividad: string;
  esVR: boolean;
  fuente: FuenteDato;
  duracionMin?: number;
  distanciaKm?: number;
  kcal?: number;
  fcPromedio?: number;
  fcMaxima?: number;
  zonaPrincipal?: ZonaFC;
  /** `datauuid` de Samsung: lo que hace determinístico el `idHist`. */
  _uuid: string;
  _startMs?: number;
  _endMs?: number;
  _fcMin?: number;
  /** Puntos de curva de FC de esta sesión. Sin curva ni FC → autodetectada (P75b). */
  _muestrasCurva?: number;
  /** Lo que dice el origen, si lo dice (PU4). Manda sobre la heurística. */
  _autoDetected?: boolean;
}

/** El `idHist` de una entrada externa. Determinístico: mismo uuid, mismo id. */
export function idEntradaExterna(datauuid: string): string {
  return `EXT-${datauuid}`;
}

/** ¿Este Historial es una entrada externa por su id? (sin mirar `tipo`). */
export function esIdEntradaExterna(idHist: string): boolean {
  return idHist.startsWith("EXT-");
}

/**
 * Arma el Historial de una actividad externa. No muta la entrada.
 *
 * `fechaRealizadaTimestamp` se deriva del inicio real (o del mediodía de la
 * fecha si no hay timestamps): es un campo del modelo, y una función pura no
 * puede pedirle la hora al servidor.
 *
 * `motivoIngreso` lo trae el clasificador: es la regla que la hizo entrar.
 * El `origen` se deduce del propio dato con `esAutodetectada` (P75b).
 */
export function construirEntradaExterna(
  item: ItemExterno,
  miembro: MiembroId,
  motivoIngreso: MotivoIngreso,
): Historial {
  const biometria = construirBiometria(item);

  return {
    idHist: idEntradaExterna(item._uuid),
    fechaRealizada: item.fecha,
    fechaRealizadaTimestamp: timestampDe(item),
    // No hay sesión programada detrás, y `idRutina` va AUSENTE (no vacío): con
    // string vacío, las métricas por rutina la agruparían bajo la rutina "".
    idSesion: "",
    nombreRutina: item.actividad,   // así se ve bien en las listas de historial
    tipo: "externa",
    semanaInicio: lunesDeSemana(item.fecha),
    miembro,

    duracionRealMin: item.duracionMin ?? null,
    rpe: null,
    tonelajeKg: null,
    totalSeriesHechas: null,

    ...(item._startMs != null ? { inicioMs: item._startMs } : {}),
    ...(item._endMs   != null ? { finMs:    item._endMs   } : {}),

    bloques: [],

    ...(biometria ? { biometria } : {}),

    externa: {
      actividad: item.actividad,
      datauuid: item._uuid,
      fuente: item.fuente,
      ...(item.distanciaKm != null ? { distanciaKm: item.distanciaKm } : {}),
      // Marcada, no descartada (P75b): una caminata que el reloj registró solo
      // entra igual, y se ve distinto en la lista.
      origen: origenDe(item),
      motivoIngreso,
    },
  };
}

/**
 * Biometría de la entrada: `matchPor: "directo"` porque el dato no se matcheó
 * contra nada — ES el de esta actividad. `undefined` si no hay ni FC ni kcal:
 * un objeto con solo las etiquetas no dice nada.
 */
function construirBiometria(item: ItemExterno): BiometriaSesion | undefined {
  const hayDato = item.fcPromedio != null || item.fcMaxima != null
    || item._fcMin != null || item.kcal != null;
  if (!hayDato) return undefined;

  return {
    fuente: item.fuente,
    datauuidSamsung: item._uuid,
    ...(item.fcPromedio    != null ? { fcMedia: item.fcPromedio }        : {}),
    ...(item.fcMaxima      != null ? { fcMax:   item.fcMaxima }          : {}),
    ...(item._fcMin        != null ? { fcMin:   item._fcMin }            : {}),
    ...(item.zonaPrincipal != null ? { zonaPrincipal: item.zonaPrincipal } : {}),
    ...(item.kcal          != null ? { kcal:    item.kcal }              : {}),
    matchPor: "directo",
    granularidad: "sesion",   // nunca hay curva por serie: no hay series
  };
}

function timestampDe(item: ItemExterno): FirestoreTimestamp {
  const ms = item._startMs ?? new Date(`${item.fecha}T12:00:00`).getTime();
  return { seconds: Math.floor(ms / 1000), nanoseconds: 0 };
}
