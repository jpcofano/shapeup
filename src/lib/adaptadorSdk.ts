// ════════════════════════════════════════════════════════════════════════════
//  lib/adaptadorSdk.ts — traduce el crudo del puente Android al formato que ya
//  producen los parsers del ZIP (PU4).
//
//  La decisión de arquitectura de PU4: el adaptador **no abre un segundo camino
//  de ingesta**. Devuelve `EjercicioItem` y `MedicionInput` — exactamente lo que
//  devuelven `parsearEjercicio` y `parsearPeso` — y de ahí en adelante se reusa
//  el pipeline de P75/P75b: `clasificarImport`, `construirEntradaExterna`,
//  `importarMedicionesIdempotente`. El día que se
//  corrija una regla, se corrige en un solo lugar.
//
//  Los ids salen del uuid de Samsung, igual que en el ZIP (`CAR-{uuid}`,
//  `MED-{uuid}`, `EXT-{uuid}`). Verificado con datos reales en el Paso 0: el
//  `uid` del SDK ES el `datauuid` del CSV, para el mismo hecho. Eso es lo que
//  hace que una sesión que ya entró por el ZIP se pise en vez de duplicarse.
//
//  Núcleo puro (ADR #009): sin Firebase, se testea solo.
// ════════════════════════════════════════════════════════════════════════════

import type { MiembroId, ZonaFC } from "../types/models";
import type { EjercicioItem, MedicionInput } from "../import/samsungHealth";
import type { LiveDataPoint } from "../import/samsungLiveData";
import type { SesionSamsung } from "./matchBiometrico";
import { derivarZona, stripUndef } from "../import/samsungHealth";

// ── La forma del crudo (verificada en el Paso 0 de PU4) ────────────────────

export interface TiempoSdk { epochMs: number; iso: string }

export interface SesionSdk {
  startTime: TiempoSdk;
  endTime: TiempoSdk | null;
  duration: { ms: number; iso: string } | null;
  /** Enum de texto: "WALKING", "OTHER", "AEROBICS"… NO el código numérico del ZIP. */
  exerciseType: string | null;
  /** "ShapeUp" en las sesiones de la app; `null` en todo lo demás. */
  customTitle: string | null;
  calories: number | null;
  distance: number | null;          // metros
  maxHeartRate: number | null;
  meanHeartRate: number | null;
  minHeartRate: number | null;
  /** Lo registró el reloj solo. El SDK lo dice; el ZIP no (ver `esAutodetectada`). */
  autoDetected: boolean | null;
  logSize: number | null;
  logWithHeartRate: number | null;
  log: { timestamp: TiempoSdk; heartRate: number | null }[] | null;
}

export interface CrudoEjercicio {
  uid: string;
  appId: string | null;
  deviceId: string | null;
  startTime: TiempoSdk;
  endTime: TiempoSdk | null;
  zoneOffset: string | null;
  startLocalDateTime: string | null;
  fields: { sessions: SesionSdk[] };
}

export interface CrudoComposicion {
  uid: string;
  appId: string | null;
  startTime: TiempoSdk;
  startLocalDateTime: string | null;
  fields: {
    weight: number | null;
    body_fat: number | null;
    muscle_mass: number | null;
    body_fat_mass: number | null;
    total_body_water: number | null;
    height: number | null;
    bmi: number | null;
    [k: string]: unknown;
  };
}

/** Un registro ya rearmado y parseado, listo para adaptar. */
export interface RegistroSdk {
  id: string;
  dataType: string;
  crudo: unknown;
}

// ── Tipos de actividad: enum del SDK → el mismo nombre que usa el ZIP ──────

/**
 * El ZIP trae `exercise_type` numérico y lo resuelve con su propia tabla; el
 * SDK trae un enum de texto. Los nombres de acá son **los mismos** que los de
 * `EXERCISE_TYPE` en `import/samsungHealth.ts`, a propósito: la regla 4 del
 * clasificador (`actividadesSiempreRelevantes`) compara por nombre, así que si
 * las dos vías no coinciden, la misma actividad se clasificaría distinto según
 * por dónde entró.
 */
export const TIPO_SDK: Record<string, string> = {
  WALKING: "Caminata",
  RUNNING: "Carrera",
  CYCLING: "Ciclismo",
  SWIMMING: "Natación",
  POOL_SWIMMING: "Natación",
  OPEN_WATER_SWIMMING: "Natación",
  INDOOR_CYCLING: "Ciclismo indoor",
  AEROBICS: "Aeróbico",
  FITNESS: "Fitness",
  DANCING: "Baile",
  SOCCER: "Fútbol",
  BASKETBALL: "Básquet",
  TENNIS: "Tenis",
  YOGA: "Yoga",
  CLIMBING: "Escalada",
  SKIING: "Esquí",
  CANOEING: "Kayak",
  HIKING: "Senderismo",
  CIRCUIT_TRAINING: "Entrenamiento en circuito",
  WEIGHT_MACHINE: "Entrenamiento de fuerza",
  TREADMILL: "Carrera",
  ELLIPTICAL: "Elíptica",
  ROWING_MACHINE: "Remo",
  STAIR_CLIMBING: "Escalones",
};

/** El `customTitle` que el reloj le pone a las sesiones hechas con la app. */
export const TITULO_SHAPEUP = "ShapeUp";

/**
 * Nombre de la actividad, con la misma precedencia que `resolverActividad` del
 * ZIP: un título propio manda sobre el tipo; `OTHER` sin título es
 * "Personalizado"; un tipo desconocido queda a la vista como `Otro (ENUM)`.
 */
export function actividadDeTipo(tipo: string | null, customTitle: string | null): string {
  const titulo = customTitle?.trim();
  if (titulo) return titulo;                       // "ShapeUp" y cualquier otro nombre propio
  const t = (tipo ?? "").trim();
  if (t === "OTHER" || t === "") return "Personalizado";
  return TIPO_SDK[t] ?? `Otro (${t})`;
}

// ── Adaptación de ejercicio ───────────────────────────────────────────────

/**
 * Un `EjercicioItem` idéntico al que produce el parser del ZIP, o `null` si el
 * crudo no tiene la forma esperada.
 *
 * Tres cosas que el SDK resuelve distinto que el ZIP:
 *
 * · **`_customId` no existe.** El SDK no transporta el `custom_id` de Samsung,
 *   pero sí el `customTitle`, que en las sesiones de la app es literalmente
 *   "ShapeUp". Se usa en su lugar: al clasificador hay que pasarle
 *   `shapeUpCustomIds: [TITULO_SHAPEUP]`.
 *
 * · **`esVR` queda siempre en `false`.** El reloj usa un solo workout custom
 *   para fuerza y para VR (ADR #028), así que por el SDK las dos llegan como
 *   `OTHER` + `customTitle: "ShapeUp"`, indistinguibles. Quien sabe si fue VR
 *   es el Historial de la app: estas sesiones lo enriquecen por la regla 1 del
 *   clasificador, y ahí el dato ya está.
 *
 * · **La FC media se usa tal cual.** Samsung la computa sobre las muestras
 *   crudas; recalcularla sobre el `log`, que viene agregado a ~1 Hz, daría un
 *   número peor (ADR corregido en P66g).
 *
 * La curva **no se persiste**: solo se cuenta para `_muestrasCurva`. Son más de
 * 100 KB por sesión y ninguna pantalla los muestra.
 */
export function adaptarEjercicio(
  crudo: unknown,
  miembro: MiembroId,
  zonasFC?: Partial<Record<ZonaFC, { min: number; max: number }>>,
): EjercicioItem | null {
  const c = crudo as CrudoEjercicio | null;
  const ses = c?.fields?.sessions?.[0];
  if (!c?.uid || !ses) return null;

  const inicioMs = ses.startTime?.epochMs ?? c.startTime?.epochMs;
  if (inicioMs == null) return null;

  const durMs = ses.duration?.ms
    ?? (ses.endTime?.epochMs != null ? ses.endTime.epochMs - inicioMs : undefined);
  const finMs = ses.endTime?.epochMs ?? c.endTime?.epochMs
    ?? (durMs != null ? inicioMs + durMs : undefined);

  const fecha = fechaLocal(c.startLocalDateTime, inicioMs);
  const actividad = actividadDeTipo(ses.exerciseType, ses.customTitle);
  const fcMedia = numOpt(ses.meanHeartRate);

  return stripUndef({
    _uuid:     c.uid,
    _startMs:  inicioMs,
    _endMs:    finMs,
    // El SDK no trae custom_id; el customTitle cumple ese papel (ver arriba).
    _customId: ses.customTitle ?? undefined,
    _fcMin:    numOpt(ses.minHeartRate),
    // Cuántos puntos de curva hay. No se guarda la curva, solo el conteo.
    _muestrasCurva: ses.log?.length ?? numOpt(ses.logSize) ?? 0,
    // El SDK sabe si la registró el reloj solo; el ZIP tiene que deducirlo.
    _autoDetected: ses.autoDetected ?? undefined,
    // Por el SDK, el `customTitle` es lo que hace de marca (P76b).
    _marcadaShapeUp: ses.customTitle === "ShapeUp",

    miembro,
    fecha,
    actividad,
    esVR: false,
    duracionMin:   durMs != null ? Math.round(durMs / 60_000) : undefined,
    distanciaKm:   ses.distance != null ? redondear2(ses.distance / 1000) : undefined,
    kcal:          numOpt(ses.calories),
    fcPromedio:    fcMedia,
    fcMaxima:      numOpt(ses.maxHeartRate),
    zonaPrincipal: fcMedia != null ? derivarZona(fcMedia, zonasFC) : undefined,
    fuente:        "samsung-health-csv" as const,
  }) as EjercicioItem;
}

// ── Adaptación de composición corporal ────────────────────────────────────

/** Puentes que transportan la medición de la balanza, en orden de preferencia. */
export const PREFERENCIA_PUENTES = [
  "nl.appyhapps.healthsync",
  "com.garmin.android.apps.connectmobile",
] as const;

/** El reloj: escribe un peso heredado del perfil, sin medirlo. */
export const APP_RELOJ = "com.sec.android.app.shealth";

export type MedicionSdk = MedicionInput & { _uuid: string; _appId: string; _inicioMs: number };

/**
 * Un `MedicionInput` como el del ZIP, o `null` si no hay peso medido.
 *
 * **El peso del reloj se descarta** (`appId` = `com.sec.android.app.shealth`):
 * la bioimpedancia de muñeca no pesa, hereda el valor del perfil. Un número
 * plausible con fecha fresca es peor que un cero, porque nadie lo cuestiona.
 *
 * `imc` sale del `bmi` que ya calcula Samsung, en vez de recalcularlo.
 */
export function adaptarComposicion(crudo: unknown, miembro: MiembroId): MedicionSdk | null {
  const c = crudo as CrudoComposicion | null;
  const f = c?.fields;
  if (!c?.uid || !f) return null;
  if (c.appId === APP_RELOJ) return null;          // peso heredado, no medido
  if (numOpt(f.weight) == null) return null;       // sin peso no hay medición

  const inicioMs = c.startTime?.epochMs;
  if (inicioMs == null) return null;

  return stripUndef({
    _uuid:   c.uid,
    _appId:  c.appId ?? "",
    _inicioMs: inicioMs,
    miembro,
    fecha:          fechaLocal(c.startLocalDateTime, inicioMs),
    pesoKg:         numOpt(f.weight),
    grasaPct:       numOpt(f.body_fat),
    masaMuscularKg: numOpt(f.muscle_mass),
    masaGrasaKg:    numOpt(f.body_fat_mass),
    aguaPct:        numOpt(f.total_body_water),
    imc:            numOpt(f.bmi),
    fuente:         "samsung-health-csv" as const,
  }) as MedicionSdk;
}

/**
 * Deja una sola medición por instante, por orden de preferencia de puente.
 *
 * Dos apps transportan la MISMA medición de la balanza. No se mezclan campos
 * (PU1: el reloj y la balanza llenan campos casi complementarios, y el único
 * que comparten difiere en casi cuatro kilos — un merge "tomo el que no sea
 * nulo" fabricaría un registro que no existió). Es por preferencia declarada y
 * **no por lista negra**: si Health Sync deja de escribir, el de Garmin entra
 * solo y el peso se sigue guardando.
 */
export function elegirPorPuente(mediciones: MedicionSdk[]): {
  elegidas: MedicionSdk[];
  descartadas: { medicion: MedicionSdk; motivo: string }[];
} {
  const porInstante = new Map<number, MedicionSdk[]>();
  for (const m of mediciones) {
    porInstante.set(m._inicioMs, [...(porInstante.get(m._inicioMs) ?? []), m]);
  }

  const elegidas: MedicionSdk[] = [];
  const descartadas: { medicion: MedicionSdk; motivo: string }[] = [];

  for (const grupo of porInstante.values()) {
    if (grupo.length === 1) { elegidas.push(grupo[0]); continue; }
    const rank = (m: MedicionSdk) => {
      const i = PREFERENCIA_PUENTES.indexOf(m._appId as typeof PREFERENCIA_PUENTES[number]);
      return i === -1 ? PREFERENCIA_PUENTES.length : i;
    };
    const ordenado = [...grupo].sort((a, b) => rank(a) - rank(b));
    elegidas.push(ordenado[0]);
    for (const m of ordenado.slice(1)) {
      descartadas.push({ medicion: m, motivo: `mismo instante que ${ordenado[0]._appId}` });
    }
  }

  return { elegidas, descartadas };
}

// ── Reparto por dataType ──────────────────────────────────────────────────

export interface ResultadoAdaptacion {
  ejercicios: EjercicioItem[];
  mediciones: MedicionSdk[];
  /** Mediciones que no entran, con el motivo (para el resumen del import). */
  medicionesDescartadas: { uid: string; motivo: string }[];
  /** Registros que no se pudieron adaptar: dataType desconocido o forma inesperada. */
  ignorados: { id: string; motivo: string }[];
  /**
   * Lo que el enriquecimiento biométrico necesita, con la MISMA forma que
   * produce el ZIP (P82): así corre `calcularEnriquecimiento` sin tocarlo, y no
   * hay un segundo camino de match que mantener.
   */
  sesionesSamsung: SesionSamsung[];
  /** Curvas de FC por `uid`, que ES el `datauuid` del ZIP para el mismo hecho. */
  liveData: Record<string, LiveDataPoint[]>;
}

/**
 * La curva de FC de una sesión del SDK (P82).
 *
 * Es lo mismo que `live_data.json` transporta en el ZIP: un punto por segundo.
 * Las entradas con `heartRate` nulo se descartan — en la sesión de referencia
 * son 21 de 4133, y un cero ahí sería un dato inventado (ADR #034).
 *
 * **No se persiste** (ADR #016 y PU4): vive en memoria durante la
 * sincronización, se usa para calcular la biometría y se descarta.
 */
export function curvaDeSesion(ses: SesionSdk): LiveDataPoint[] {
  const puntos: LiveDataPoint[] = [];
  for (const e of ses.log ?? []) {
    const ms = e?.timestamp?.epochMs;
    if (ms == null || e.heartRate == null || !Number.isFinite(e.heartRate)) continue;
    puntos.push({ ms, fc: e.heartRate });
  }
  return puntos.sort((a, b) => a.ms - b.ms);
}

/**
 * La sesión del SDK con la forma que espera el match biométrico (P82).
 *
 * `customId` sale de `customTitle`: el SDK no transporta `custom_id`, y el
 * título cumple ese papel — la misma decisión que PU4 tomó para clasificar.
 *
 * `fcMedia` es `meanHeartRate` **tal cual**. Samsung la computa sobre las
 * muestras crudas (12.839 en la sesión de referencia); recalcularla sobre el
 * `log`, que viene agregado a 1 Hz, daría otro número y peor.
 */
export function sesionSamsungDe(crudo: unknown): SesionSamsung | null {
  const c = crudo as CrudoEjercicio | null;
  const ses = c?.fields?.sessions?.[0];
  if (!c?.uid || !ses) return null;

  const startMs = ses.startTime?.epochMs ?? c.startTime?.epochMs;
  if (startMs == null) return null;
  const endMs = ses.endTime?.epochMs ?? c.endTime?.epochMs
    ?? (ses.duration?.ms != null ? startMs + ses.duration.ms : undefined);
  if (endMs == null) return null;

  return {
    datauuid: c.uid,
    startMs,
    endMs,
    ...(ses.customTitle ? { customId: ses.customTitle } : {}),
    ...(numOpt(ses.meanHeartRate) != null ? { fcMedia: numOpt(ses.meanHeartRate) } : {}),
    ...(numOpt(ses.maxHeartRate) != null ? { fcMax: numOpt(ses.maxHeartRate) } : {}),
    ...(numOpt(ses.minHeartRate) != null ? { fcMin: numOpt(ses.minHeartRate) } : {}),
    ...(numOpt(ses.calories) != null ? { kcal: numOpt(ses.calories) } : {}),
    fecha: fechaLocal(c.startLocalDateTime, startMs),
  };
}

/** Reparte los registros por `dataType` y adapta cada uno. No muta la entrada. */
export function adaptarRegistros(
  registros: RegistroSdk[],
  miembro: MiembroId,
  zonasFC?: Partial<Record<ZonaFC, { min: number; max: number }>>,
): ResultadoAdaptacion {
  const ejercicios: EjercicioItem[] = [];
  const crudasMediciones: MedicionSdk[] = [];
  const medicionesDescartadas: { uid: string; motivo: string }[] = [];
  const ignorados: { id: string; motivo: string }[] = [];
  const sesionesSamsung: SesionSamsung[] = [];
  const liveData: Record<string, LiveDataPoint[]> = {};

  for (const r of registros) {
    if (r.dataType === "exercise") {
      const item = adaptarEjercicio(r.crudo, miembro, zonasFC);
      // Para el match (P82): la sesión con su forma de SesionSamsung y su curva.
      const sam = sesionSamsungDe(r.crudo);
      if (sam) {
        sesionesSamsung.push(sam);
        const ses = (r.crudo as CrudoEjercicio).fields?.sessions?.[0];
        const curva = ses ? curvaDeSesion(ses) : [];
        if (curva.length > 0) liveData[sam.datauuid] = curva;
      }
      if (item) ejercicios.push(item);
      else ignorados.push({ id: r.id, motivo: "ejercicio sin sesión legible" });
    } else if (r.dataType === "body_composition") {
      const m = adaptarComposicion(r.crudo, miembro);
      if (m) {
        crudasMediciones.push(m);
      } else {
        const c = r.crudo as CrudoComposicion | null;
        medicionesDescartadas.push({
          id: r.id, uid: c?.uid ?? r.id,
          motivo: c?.appId === APP_RELOJ ? "peso del reloj (heredado, no medido)" : "sin peso",
        } as { uid: string; motivo: string });
      }
    } else {
      ignorados.push({ id: r.id, motivo: `dataType no soportado: ${r.dataType}` });
    }
  }

  const { elegidas, descartadas } = elegirPorPuente(crudasMediciones);
  for (const d of descartadas) {
    medicionesDescartadas.push({ uid: d.medicion._uuid, motivo: d.motivo });
  }

  return { ejercicios, mediciones: elegidas, medicionesDescartadas, ignorados, sesionesSamsung, liveData };
}

// ── Helpers ───────────────────────────────────────────────────────────────

/** "YYYY-MM-DD" local. El SDK ya da la hora local; el epoch es el respaldo. */
function fechaLocal(startLocalDateTime: string | null | undefined, epochMs: number): string {
  if (startLocalDateTime && startLocalDateTime.length >= 10) return startLocalDateTime.slice(0, 10);
  const d = new Date(epochMs);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function numOpt(v: number | null | undefined): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

function redondear2(n: number): number {
  return parseFloat(n.toFixed(2));
}
