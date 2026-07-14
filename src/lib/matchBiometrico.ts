// ════════════════════════════════════════════════════════════════════════════
//  lib/matchBiometrico.ts — cruce sesión ShapeUp ↔ Samsung Health
//
//  Llave de identificación: custom_id de la sesión "ShapeUp" en Samsung.
//  Curva fina:             live_data.json (~1 muestra FC/seg, epoch ms).
//  Degradación elegante:   sin curva → solo nivel sesión. Nunca tira error.
//
//  Spec autoritativa del match: docs/prompts/57-s-match-robusto.md (S-match).
//  El P46 original ("1c — Robustez del match") nunca se implementó — este
//  archivo es la versión vigente, no una variación de aquel.
//
//  ADR: ranking por Δinicio, no por solapamiento (P57): el owner puede
//  olvidarse de cortar Samsung Health, y una sesión que sigue corriendo horas
//  "solapa perfecto" con cualquier ventana — el inicio es la señal confiable.
//  Ventanas sintéticas (S-fix-b) no rankean por Δinicio: van directo a la
//  regla "día único" (ambigüedad por fecha, no por Δinicio).
// ════════════════════════════════════════════════════════════════════════════

import type {
  BiometriaSesion, SerieRegistro, ZonaFC, PerfilMiembro,
} from "../types/models";
import type { LiveDataPoint } from "../import/samsungLiveData";
import { stripUndef } from "../import/samsungHealth";

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

/**
 * Tolerancia de solapamiento (5 min) para otros consumidores (`lib/importSelectivo.ts`,
 * ADR #020). Ya no la usa `elegirSesionSamsung` — el ranking ahí es por Δinicio (P57).
 */
export const TOLERANCIA_MS = 5 * 60 * 1000;

// ── Techos del ranking por Δinicio (P57, spec autoritativa: docs/prompts/57-*.md) ──

/** Pool custom-id: gana el menor Δinicio, sin mínimo de solape (la identidad ya la valida el nombre). */
export const TECHO_CUSTOM_ID_MS = 30 * 60 * 1000;
/** Pool ventana (sin custom-id): candidata válida si Δinicio ≤ este techo Y solapa > 0. */
export const TECHO_VENTANA_MS = 10 * 60 * 1000;
/** Ambigüedad en el pool ventana: si el top-2 difiere menos que esto en Δinicio, no se adivina. */
export const AMBIGUEDAD_VENTANA_MS = 5 * 60 * 1000;

function deltaInicio(candidata: SesionSamsung, sesionApp: SesionApp): number {
  return Math.abs(candidata.startMs - sesionApp.inicioMs);
}

function solapa(candidata: SesionSamsung, sesionApp: SesionApp): boolean {
  return Math.min(candidata.endMs, sesionApp.finMs) - Math.max(candidata.startMs, sesionApp.inicioMs) > 0;
}

/**
 * De las candidatas Samsung, elige la sesión que matchea con la de la app.
 *
 * **Ventana real** (`sesionApp.sintetica` falsy — hay timestamps reales de la sesión):
 * rankeo por Δinicio (P57) — el fin y el solape total no son confiables (el owner
 * puede olvidarse de cortar Samsung Health y una sesión que sigue corriendo horas
 * "solapa perfecto" con cualquier ventana).
 * 1. Pool **custom-id** (candidatas con `customId === shapeUpCustomId`): gana la de
 *    menor Δinicio, techo `≤ 30 min`, sin requisito de solape.
 * 2. Pool **ventana** (fallback si el pool custom-id no dio nada): candidata válida
 *    si `Δinicio ≤ 10 min` **y** solapa > 0. Gana la de menor Δinicio.
 *    Guardia de ambigüedad: si las dos mejores difieren `< 5 min` de Δinicio entre
 *    sí → `{ sesion: null, matchPor: "ambiguo" }` (no se adivina).
 *
 * **Ventana sintética** (S-fix-b, sin cambios): no rankea por Δinicio (no es
 * confiable sobre una ventana estimada). Con **exactamente una** candidata del pool
 * custom-id en la misma fecha local → `matchPor: "dia"`. Con dos o más → ambiguo
 * por fecha. Sin ninguna → `null` (el nivel "rango" se intenta aparte, en
 * `calcularEnriquecimiento`/`construirBiometriaRango`).
 *
 * Retorna `null` si no hay match en ningún nivel.
 */
export function elegirSesionSamsung(
  sesionApp: SesionApp,
  candidatas: SesionSamsung[],
  shapeUpCustomId?: string,
):
  | { sesion: SesionSamsung; matchPor: "custom-id" | "ventana" | "dia" }
  | { sesion: null; matchPor: "ambiguo" }
  | null {
  const poolCustomId = shapeUpCustomId
    ? candidatas.filter((c) => c.customId === shapeUpCustomId)
    : [];

  if (!sesionApp.sintetica) {
    // ── Pool custom-id: menor Δinicio, techo 30 min, sin mínimo de solape ──────
    if (shapeUpCustomId) {
      const rankeadas = poolCustomId
        .map((c) => ({ sesion: c, delta: deltaInicio(c, sesionApp) }))
        .filter((x) => x.delta <= TECHO_CUSTOM_ID_MS)
        .sort((a, b) => a.delta - b.delta);
      if (rankeadas.length > 0) return { sesion: rankeadas[0].sesion, matchPor: "custom-id" };
    }

    // ── Pool ventana: Δinicio ≤ 10 min Y solapa > 0, gana el menor Δinicio ─────
    const rankeadasVentana = candidatas
      .map((c) => ({ sesion: c, delta: deltaInicio(c, sesionApp) }))
      .filter((x) => x.delta <= TECHO_VENTANA_MS && solapa(x.sesion, sesionApp))
      .sort((a, b) => a.delta - b.delta);

    if (rankeadasVentana.length > 0) {
      const [mejor, segunda] = rankeadasVentana;
      if (segunda && (segunda.delta - mejor.delta) < AMBIGUEDAD_VENTANA_MS) {
        return { sesion: null, matchPor: "ambiguo" };
      }
      return { sesion: mejor.sesion, matchPor: "ventana" };
    }

    return null;
  }

  // ── Ventana sintética: regla "día único" (S-fix-b), sin ranking por Δinicio ──
  if (shapeUpCustomId && sesionApp.fecha) {
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
 * Tope para el `inicioSiguienteMs` de la **última serie** de la sesión (P57):
 * antes quedaba `undefined` por efecto colateral (no hay "serie siguiente" que
 * buscar) y por eso nunca tenía `recuperacionBpm`. Ahora se calcula explícito,
 * pero acotado a 90 s después del fin de la ventana de la app — así un corte
 * olvidado de Samsung Health (que sigue grabando horas) no "absorbe" ese tiempo
 * como si fuera descanso. Nunca más allá del fin real de los datos disponibles.
 */
export const TOPE_RECUPERACION_ULTIMA_SERIE_MS = 90 * 1000;

export function topeInicioSiguiente(finVentanaAppMs: number, finDatosDisponiblesMs: number): number {
  return Math.min(finVentanaAppMs + TOPE_RECUPERACION_ULTIMA_SERIE_MS, finDatosDisponiblesMs);
}

/**
 * Bandas estándar de %FCmáx (fallback cuando no hay `zonasFC` configuradas a
 * medida): Z1 50-60%, Z2 60-70%, Z3 70-80%, Z4 80-90%, Z5 90-100%.
 */
const BANDAS_PCT_FC_MAX: Record<ZonaFC, { min: number; max: number }> = {
  Z1: { min: 0.50, max: 0.60 },
  Z2: { min: 0.60, max: 0.70 },
  Z3: { min: 0.70, max: 0.80 },
  Z4: { min: 0.80, max: 0.90 },
  Z5: { min: 0.90, max: 1.00 },
};

/**
 * Deriva la zona de FC de un valor numérico usando el perfil del miembro.
 * Prioridad: 1) `zonasFC` a medida si están configuradas; 2) bandas estándar
 * de `fcMaxTeorica` (hotfix P58, auditoría 2026-07-13: `config/perfiles` está
 * vacío para el owner — zonaPrincipal salía siempre "—" aunque el perfil se
 * cargara bien). Sin ninguna de las dos, `undefined` (degradación elegante).
 *
 * NOTA: `PerfilMiembro` no tiene campo de edad/fecha de nacimiento — el
 * fallback "220−edad" que pedía el prompt no es calculable sin ese dato.
 * Si se agrega a futuro, se suma acá como tercer nivel.
 */
export function derivarZona(
  fcMedia: number,
  perfil?: PerfilMiembro,
): ZonaFC | undefined {
  const zonasFC = perfil?.zonasFC;
  if (zonasFC) {
    for (const zona of (["Z5", "Z4", "Z3", "Z2", "Z1"] as ZonaFC[])) {
      const z = zonasFC[zona];
      if (!z) continue;
      if (fcMedia >= z.min && fcMedia <= z.max) return zona;
    }
  }

  const fcMaxTeorica = perfil?.fcMaxTeorica;
  if (fcMaxTeorica) {
    for (const zona of (["Z5", "Z4", "Z3", "Z2", "Z1"] as ZonaFC[])) {
      const banda = BANDAS_PCT_FC_MAX[zona];
      if (fcMedia >= banda.min * fcMaxTeorica && fcMedia <= banda.max * fcMaxTeorica) return zona;
    }
  }

  return undefined;
}

/** Umbral de "olvido de corte" (P57): Samsung siguió grabando más de esto tras el fin de la app. */
export const OLVIDO_CORTE_MS = 15 * 60 * 1000;

function promedio(nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

/**
 * Construye la `BiometriaSesion` a nivel sesión (cuando no hay curva fina).
 * Degradación elegante: nunca tira error. `granularidad: "sesion"`.
 *
 * Anti-"olvido de corte" (P57): si `ventanaApp` es una ventana **real** y Samsung
 * siguió grabando más de `OLVIDO_CORTE_MS` después del fin de la app
 * (`sesionSamsung.endMs - ventanaApp.finMs > OLVIDO_CORTE_MS`), la fila de Samsung
 * ya no es confiable tal cual (fcMedia/kcal incluyen tiempo que no fue entrenamiento):
 * - con curva: recalcula fcMedia/fcMax/fcMin solo con muestras dentro de la ventana
 *   de la app y **omite `kcal`** (no se puede prorratear honestamente).
 * - sin curva: conserva solo `fcMax` (el pico casi seguro fue entrenando) y omite
 *   `fcMedia`/`kcal`.
 * En ambos casos sella `finMsEfectivo` (el fin real usado para los cálculos).
 * Ventana sintética o ausente: no hay fin confiable de la app — se usa la fila tal
 * cual, sin marcar `finMsEfectivo`.
 */
export function construirBiometriaSesion(
  sesionSamsung: SesionSamsung,
  matchPor: "custom-id" | "ventana" | "dia",
  perfil?: PerfilMiembro,
  ventanaApp?: SesionApp,
  curva?: LiveDataPoint[],
): BiometriaSesion {
  const huboOlvidoDeCorte =
    ventanaApp != null && !ventanaApp.sintetica &&
    (sesionSamsung.endMs - ventanaApp.finMs) > OLVIDO_CORTE_MS;

  if (huboOlvidoDeCorte) {
    const ventana = ventanaApp!;
    if (curva && curva.length > 0) {
      const enVentana = curva.filter((p) => p.ms >= ventana.inicioMs && p.ms <= ventana.finMs);
      const fcs = enVentana.map((p) => p.fc);
      const fcMedia = fcs.length > 0 ? promedio(fcs) : undefined;
      return stripUndef({
        fuente:          "samsung-health-csv",
        datauuidSamsung: sesionSamsung.datauuid,
        fcMedia,
        fcMax:           fcs.length > 0 ? Math.max(...fcs) : undefined,
        fcMin:           fcs.length > 0 ? Math.min(...fcs) : undefined,
        zonaPrincipal:   fcMedia !== undefined ? derivarZona(fcMedia, perfil) : undefined,
        // kcal omitido a propósito: no se puede prorratear honestamente.
        matchPor,
        granularidad:    "sesion",
        finMsEfectivo:   ventana.finMs,
      });
    }
    return stripUndef({
      fuente:          "samsung-health-csv",
      datauuidSamsung: sesionSamsung.datauuid,
      fcMax:           sesionSamsung.fcMax, // el pico casi seguro fue entrenando
      // fcMedia/kcal omitidos a propósito: la fila incluye tiempo post-sesión.
      matchPor,
      granularidad:    "sesion",
      finMsEfectivo:   ventana.finMs,
    });
  }

  const fcMedia = sesionSamsung.fcMedia;
  return stripUndef({
    fuente:          "samsung-health-csv",
    datauuidSamsung: sesionSamsung.datauuid,
    fcMedia,
    fcMax:           sesionSamsung.fcMax,
    fcMin:           sesionSamsung.fcMin,
    zonaPrincipal:   fcMedia !== undefined ? derivarZona(fcMedia, perfil) : undefined,
    kcal:            sesionSamsung.kcal,
    matchPor,
    granularidad:    "sesion",
  });
}

/** Mínimo de muestras crudas de FC dentro de la ventana para el nivel "rango" (P57). */
export const MIN_MUESTRAS_RANGO = 10;

/**
 * Nivel "rango" (P57): cuando ningún pool (custom-id/ventana/día) dio match,
 * arma biometría directo de muestras crudas de FC dentro de la ventana (real o
 * sintética) — el pedido del owner: «si no hay ninguna actividad debería tomar
 * lo que pueda dentro del rango horario». Sin sesión Samsung única detrás:
 * `datauuidSamsung` queda ausente, `kcal` también (no hay de dónde derivarla).
 * Guardrail: menos de `MIN_MUESTRAS_RANGO` muestras en la ventana → `null` (sin
 * match; no alcanza para confiar en el dato).
 */
export function construirBiometriaRango(
  ventanaApp: SesionApp,
  muestras: LiveDataPoint[],
  perfil?: PerfilMiembro,
): BiometriaSesion | null {
  const enVentana = muestras.filter((p) => p.ms >= ventanaApp.inicioMs && p.ms <= ventanaApp.finMs);
  if (enVentana.length < MIN_MUESTRAS_RANGO) return null;

  const fcs = enVentana.map((p) => p.fc);
  const fcMedia = promedio(fcs);
  return stripUndef<BiometriaSesion>({
    fuente:        "samsung-health-csv",
    fcMedia,
    fcMax:         Math.max(...fcs),
    fcMin:         Math.min(...fcs),
    zonaPrincipal: derivarZona(fcMedia, perfil),
    matchPor:      "rango",
    granularidad:  "sesion",
  });
}
