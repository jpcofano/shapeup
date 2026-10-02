// ════════════════════════════════════════════════════════════════════════════
//  lib/fcMaxima.ts — la FC máxima declarada, la estimación de ShapeUp y la
//  revisión trimestral (P97, ADR #045).
//
//  La FC máxima vigente es un valor **declarado, con su origen**. ShapeUp
//  calcula su propia estimación pero **nunca la aplica sola**: cada tres meses
//  (o antes, si la estimación supera el valor vigente) muestra la estimación,
//  el vigente y el valor de Samsung que anota la persona, y la persona elige.
//
//  La estimación:
//  - mira las sesiones de las últimas `SEMANAS_ESTIMACION` semanas;
//  - solo con buena cobertura del reloj (`coberturaFina >= COBERTURA_MINIMA`)
//    y sin `fcDudosa`;
//  - de cada una, el pico de la curva suavizada (`biometria.fcPicoSuavizado`,
//    ver `lib/curvaSuavizada`);
//  - usa el **segundo** pico más alto, para que un pico aislado no mueva todo;
//  - **solo sube**: nunca da menos que una estimación ya registrada en una
//    revisión. No alcanzar el máximo en una sesión no significa que haya bajado.
//
//  Puro (ADR #009).
// ════════════════════════════════════════════════════════════════════════════
import type {
  BiometriaSesion, Historial, OrigenFcMax, PerfilMiembro, RevisionFcMax,
} from "../types/models";
import { COBERTURA_MINIMA, MARGEN_SOBRE_FC_MAX_BPM } from "./matchBiometrico";
import { FC_MAX_RANGO } from "./configuracion";
import { zonasDesdeFcMax } from "./zonas";
import { ymdLocal } from "./semana";

/** Cuántas semanas hacia atrás mira la estimación. */
export const SEMANAS_ESTIMACION = 12;
/** Cada cuántos meses toca revisar, desde el último cambio o la última revisión. */
export const MESES_REVISION = 3;
/** Cuántos picos se guardan como evidencia en una revisión. */
export const PICOS_EVIDENCIA = 5;

export const ETIQUETA_ORIGEN: Record<OrigenFcMax, string> = {
  "samsung": "Samsung Health",
  "estimacion-shapeup": "Estimación de ShapeUp",
  "medida": "Medida",
  "edad-provisoria": "Por edad (provisoria)",
};

export interface PicoSesion { idHist: string; fecha: string; pico: number }

/**
 * Por qué una sesión de la ventana no entró en la estimación (P97).
 * - `pico-sobre-vigente`: `fcDudosa` por la regla del pico de P79 (pico crudo
 *   > FC máxima vigente + 10). **Por esta regla la estimación sube como mucho
 *   10 latidos por revisión**: un pico real más alto queda afuera igual que uno
 *   falso. Lo que los distingue sería la cadencia como testigo (backlog).
 * - `saltos`: `fcDudosa` por saltos que el corazón no puede dar.
 * - `cobertura`: el reloj cubrió menos de `COBERTURA_MINIMA` de la ventana.
 */
export type MotivoExclusion = "pico-sobre-vigente" | "saltos" | "cobertura";

export const TEXTO_EXCLUSION: Record<MotivoExclusion, string> = {
  "pico-sobre-vigente": `pico > vigente + ${MARGEN_SOBRE_FC_MAX_BPM}`,
  "saltos": "saltos",
  "cobertura": "cobertura baja",
};

export interface SesionExcluida {
  idHist: string;
  fecha: string;
  nombre: string;
  /** El pico suavizado, si la sesión lo tiene. */
  pico: number | null;
  motivo: MotivoExclusion;
}

export interface EstimacionFcMax {
  /** La estimación: el segundo pico, o la última estimación registrada si era mayor. */
  valor: number | null;
  /** El segundo pico de la ventana, el que se usa. `null` con menos de dos sesiones. */
  segundoPico: PicoSesion | null;
  /** Todos los picos que entraron, de mayor a menor. */
  picos: PicoSesion[];
  /** La estimación más alta ya registrada en una revisión. */
  estimacionPrevia: number | null;
  /** Por qué quedaron afuera las demás sesiones de la ventana. */
  excluidas: { fcDudosa: number; cobertura: number; sinPico: number };
  /** Las excluidas por `fcDudosa` o cobertura, de la más nueva a la más vieja. */
  sesionesExcluidas: SesionExcluida[];
}

function restarDias(hoyMs: number, dias: number): string {
  const d = new Date(hoyMs);
  d.setDate(d.getDate() - dias);
  return ymdLocal(d);
}

/**
 * Qué regla marcó `fcDudosa`: la del pico (crudo > FC máxima + 10) o la de los
 * saltos. No se guarda; se deduce con la FC máxima con que se calculó la
 * sesión (`fcMaxUsada`) o, si es anterior a P97, con la vigente.
 */
function motivoDudosa(b: BiometriaSesion, fcMaxVigente: number | undefined): MotivoExclusion {
  const fcMax = b.fcMaxUsada ?? fcMaxVigente;
  return fcMax != null && b.fcMax != null && b.fcMax > fcMax + MARGEN_SOBRE_FC_MAX_BPM
    ? "pico-sobre-vigente" : "saltos";
}

/** La estimación de ShapeUp de la FC máxima (P97, decisión 4). */
export function estimarFcMax(
  historial: Pick<Historial, "idHist" | "fechaRealizada" | "biometria" | "nombreRutina" | "nombreJuego">[],
  hoyMs: number,
  revisiones: RevisionFcMax[] = [],
  fcMaxVigente?: number,
): EstimacionFcMax {
  const desde = restarDias(hoyMs, SEMANAS_ESTIMACION * 7);
  const hasta = ymdLocal(new Date(hoyMs));
  const excluidas = { fcDudosa: 0, cobertura: 0, sinPico: 0 };
  const picos: PicoSesion[] = [];
  const sesionesExcluidas: SesionExcluida[] = [];
  const excluir = (h: (typeof historial)[number], b: BiometriaSesion, motivo: MotivoExclusion) =>
    sesionesExcluidas.push({
      idHist: h.idHist, fecha: h.fechaRealizada, nombre: h.nombreJuego ?? h.nombreRutina ?? "",
      pico: b.fcPicoSuavizado ?? null, motivo,
    });
  for (const h of historial) {
    if (h.fechaRealizada < desde || h.fechaRealizada > hasta) continue;
    const b: BiometriaSesion | undefined = h.biometria;
    if (!b) continue;
    if (b.fcDudosa) { excluidas.fcDudosa++; excluir(h, b, motivoDudosa(b, fcMaxVigente)); continue; }
    if ((b.coberturaFina ?? 0) < COBERTURA_MINIMA) { excluidas.cobertura++; excluir(h, b, "cobertura"); continue; }
    if (b.fcPicoSuavizado == null) { excluidas.sinPico++; continue; }
    picos.push({ idHist: h.idHist, fecha: h.fechaRealizada, pico: b.fcPicoSuavizado });
  }
  picos.sort((a, b) => b.pico - a.pico || b.fecha.localeCompare(a.fecha));
  sesionesExcluidas.sort((a, b) => b.fecha.localeCompare(a.fecha));
  const segundoPico = picos.length >= 2 ? picos[1] : null;
  const previas = revisiones.map((r) => r.estimacion).filter((v): v is number => v != null);
  const estimacionPrevia = previas.length > 0 ? Math.max(...previas) : null;
  const candidatos = [segundoPico?.pico, estimacionPrevia].filter((v): v is number => v != null);
  return {
    valor: candidatos.length > 0 ? Math.max(...candidatos) : null,
    segundoPico, picos, estimacionPrevia, excluidas, sesionesExcluidas,
  };
}

export type MotivoRevision =
  /** Origen por edad o sin declarar, y nunca se revisó. */
  | "confirmar"
  /** La estimación supera el vigente, y no es una que ya se vio. */
  | "estimacion-supera"
  /** Pasaron `MESES_REVISION` meses desde el último cambio o la última revisión. */
  | "trimestral";

export const TEXTO_MOTIVO: Record<MotivoRevision, string> = {
  "confirmar": "Tu FC máxima sale de la edad y falta confirmarla.",
  "estimacion-supera": "La estimación de ShapeUp supera tu FC máxima vigente.",
  "trimestral": "Pasaron tres meses: toca revisar tu FC máxima.",
};

function sumarMeses(ms: number, meses: number): number {
  const d = new Date(ms);
  d.setMonth(d.getMonth() + meses);
  return d.getTime();
}

/**
 * Si toca revisar la FC máxima, y por qué. `null` si no toca, o si el perfil
 * no tiene FC máxima (no hay nada que revisar).
 *
 * El reloj de los tres meses arranca en lo último que pasó: el cambio de valor
 * o la última revisión, también si se eligió dejarla como estaba.
 */
export function tocaRevision(
  perfil: Pick<PerfilMiembro, "fcMaxTeorica" | "fcMaxOrigen" | "fcMaxDesdeMs" | "revisionesFcMax"> | undefined,
  estimacion: Pick<EstimacionFcMax, "valor"> | null,
  hoyMs: number,
): MotivoRevision | null {
  const vigente = perfil?.fcMaxTeorica;
  if (vigente == null) return null;
  const revisiones = perfil?.revisionesFcMax ?? [];
  const ultima = revisiones.length > 0 ? revisiones[revisiones.length - 1] : null;
  const origen = perfil?.fcMaxOrigen;
  if (!ultima && (origen == null || origen === "edad-provisoria")) return "confirmar";
  if (estimacion?.valor != null && estimacion.valor > vigente
      && estimacion.valor > (ultima?.estimacion ?? -Infinity)) {
    return "estimacion-supera";
  }
  const referencia = Math.max(perfil?.fcMaxDesdeMs ?? 0, ultima?.fechaMs ?? 0);
  if (referencia === 0 || hoyMs >= sumarMeses(referencia, MESES_REVISION)) return "trimestral";
  return null;
}

export type EleccionRevision = RevisionFcMax["eleccion"];

/** Lo que una revisión escribe en el perfil. */
export type CambioRevision = Pick<PerfilMiembro, "revisionesFcMax">
  & Partial<Pick<PerfilMiembro, "fcMaxTeorica" | "fcMaxOrigen" | "fcMaxDesdeMs" | "zonasFC">>;

/**
 * Aplica la elección de una revisión (P97). Devuelve lo que hay que escribir
 * en el perfil, o un error en castellano.
 *
 * - Las zonas se recalculan con `zonasDesdeFcMax` **solo si cambia el valor**.
 * - Si cambia solo el origen (p. ej. 169 por edad → 169 de Samsung), se
 *   registra el origen y la fecha, y las zonas quedan como están.
 * - "Dejar como está" no toca nada más que el registro de la revisión.
 * - Siempre se agrega la revisión: qué se vio, qué se eligió y cuándo.
 */
export function aplicarRevision(
  perfil: Pick<PerfilMiembro, "fcMaxTeorica" | "fcMaxOrigen" | "revisionesFcMax">,
  eleccion: EleccionRevision,
  datos: { estimacion: EstimacionFcMax | null; samsung: number | null },
  hoyMs: number,
): { ok: true; cambio: CambioRevision } | { ok: false; error: string } {
  const vigente = perfil.fcMaxTeorica;
  if (vigente == null) return { ok: false, error: "Primero cargá una FC máxima." };
  const samsung = datos.samsung;
  if (samsung != null && (!Number.isInteger(samsung) || samsung < FC_MAX_RANGO.min || samsung > FC_MAX_RANGO.max)) {
    return { ok: false, error: `El valor de Samsung tiene que ser un entero entre ${FC_MAX_RANGO.min} y ${FC_MAX_RANGO.max}.` };
  }
  const estimacion = datos.estimacion?.valor ?? null;

  let nuevo = vigente;
  let origen: OrigenFcMax | null = perfil.fcMaxOrigen ?? null;
  if (eleccion === "estimacion") {
    if (estimacion == null) return { ok: false, error: "Todavía no hay estimación de ShapeUp." };
    nuevo = estimacion;
    origen = "estimacion-shapeup";
  } else if (eleccion === "samsung") {
    if (samsung == null) return { ok: false, error: "Anotá el valor que muestra Samsung." };
    nuevo = samsung;
    origen = "samsung";
  }

  const revision: RevisionFcMax = {
    fechaMs: hoyMs,
    vigente,
    origenVigente: perfil.fcMaxOrigen ?? null,
    estimacion,
    evidencia: (datos.estimacion?.picos ?? []).slice(0, PICOS_EVIDENCIA),
    samsung,
    eleccion,
    aplicado: nuevo,
  };
  const cambio: CambioRevision = { revisionesFcMax: [...(perfil.revisionesFcMax ?? []), revision] };
  if (eleccion !== "mantener" && (nuevo !== vigente || origen !== (perfil.fcMaxOrigen ?? null))) {
    cambio.fcMaxOrigen = origen!;
    cambio.fcMaxDesdeMs = hoyMs;
    if (nuevo !== vigente) {
      cambio.fcMaxTeorica = nuevo;
      cambio.zonasFC = zonasDesdeFcMax(nuevo);
    }
  }
  return { ok: true, cambio };
}
