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
 * La `BiometriaSesion` de una sesión con **un solo** tramo de Samsung.
 *
 * Desde P78 es un atajo sobre `construirBiometriaDeTramos`: el recorte a la
 * ventana de la app dejó de ser el caso especial del "olvido de corte" y pasó a
 * ser la regla. Con curva, la FC **siempre** se recalcula sobre la curva
 * recortada al intervalo efectivo; nunca más se leen las columnas de la fila.
 *
 * **Ventana sintética o ausente**: no hay intervalo confiable contra el cual
 * recortar, así que se usa la fila tal cual, como antes de P78.
 */
export function construirBiometriaSesion(
  sesionSamsung: SesionSamsung,
  matchPor: "custom-id" | "ventana" | "dia",
  perfil?: PerfilMiembro,
  ventanaApp?: SesionApp,
  curva?: LiveDataPoint[],
  muestrasCrudas: LiveDataPoint[] = [],
): BiometriaSesion {
  if (ventanaApp != null && !ventanaApp.sintetica) {
    return construirBiometriaDeTramos(
      [{ sesion: sesionSamsung, curva }], matchPor, ventanaApp, muestrasCrudas, perfil,
    );
  }

  const fcMedia = sesionSamsung.fcMedia;
  return stripUndef({
    fuente:          "samsung-health-csv",
    datauuidSamsung: sesionSamsung.datauuid,
    tramosSamsung:   [sesionSamsung.datauuid],
    fcMedia,
    fcMax:           sesionSamsung.fcMax,
    fcMin:           sesionSamsung.fcMin,
    zonaPrincipal:   fcMedia !== undefined ? derivarZona(fcMedia, perfil) : undefined,
    kcal:            sesionSamsung.kcal,
    matchPor,
    granularidad:    "sesion",
  });
}

// ════════════════════════════════════════════════════════════════════════════
//  P78 — La ventana de la app manda
//
//  El principio: **la ventana de la sesión de la app define el intervalo.
//  Samsung aporta muestras, no el contenedor.** La fila de Samsung tiene un
//  solo dato confiable, el inicio (lo apretaste vos): el fin no lo es —te
//  podés olvidar de cortar, o cortar antes— y que haya una fila no significa
//  que cubra la sesión entera.
//
//  Hasta acá el código aplicaba esto en dos lugares sin nombrarlo (el olvido de
//  corte y el nivel "rango"). Desde P78 es la regla general.
// ════════════════════════════════════════════════════════════════════════════

/** Solape mínimo de un tramo **relativo al tramo** para entrar en la agregación. */
export const SOLAPE_TRAMO_MIN = 0.80;

/** Debajo de esto, el detalle de sesión dice qué pasó (P78). */
export const COBERTURA_MINIMA = 0.80;

/** Un workout de Samsung con su curva, si la tiene. */
export interface TramoSamsung {
  sesion: SesionSamsung;
  curva?: LiveDataPoint[];
}

/** Intersección de dos intervalos; `ms` es 0 si no se tocan. */
export function interseccion(
  aIni: number, aFin: number, bIni: number, bFin: number,
): { inicioMs: number; finMs: number; ms: number } {
  const inicioMs = Math.max(aIni, bIni);
  const finMs = Math.min(aFin, bFin);
  return { inicioMs, finMs, ms: Math.max(0, finMs - inicioMs) };
}

/**
 * Cuánto de un tramo cae adentro de la ventana, **relativo al tramo**.
 *
 * Relativo al tramo y no a la ventana a propósito: un workout de tres horas sin
 * cortar tiene solape relativo chico y por eso **no entra como tramo
 * adicional**. Si igual es el más cercano al inicio, entra como principal y lo
 * resuelve el recorte.
 */
export function solapeRelativo(tramo: SesionSamsung, ventana: SesionApp): number {
  const dur = tramo.endMs - tramo.startMs;
  if (dur <= 0) return 0;
  return interseccion(ventana.inicioMs, ventana.finMs, tramo.startMs, tramo.endMs).ms / dur;
}

/**
 * De las candidatas sobrantes, las que son tramos de la misma sesión.
 *
 * El principal ya fue elegido por `elegirSesionSamsung`; estas son las demás
 * del pool custom-id que caen casi enteras adentro de la ventana.
 */
export function elegirTramosAdicionales(
  ventana: SesionApp,
  candidatas: SesionSamsung[],
  principalUuid: string,
  shapeUpCustomId?: string,
): SesionSamsung[] {
  if (ventana.sintetica) return [];   // sobre una ventana estimada no se agrega nada
  return candidatas
    .filter((c) => c.datauuid !== principalUuid)
    .filter((c) => shapeUpCustomId == null || c.customId === shapeUpCustomId)
    .filter((c) => solapeRelativo(c, ventana) >= SOLAPE_TRAMO_MIN)
    .sort((a, b) => a.startMs - b.startMs);
}

/** Un pedazo de la ventana con FC conocida, y de qué densidad viene. */
interface Segmento {
  inicioMs: number;
  finMs: number;
  fcs: number[];
  fina: boolean;
}

/** Los huecos de `ventana` que ningún tramo cubre, ordenados. */
function huecosDe(
  ventana: SesionApp,
  cubiertos: { inicioMs: number; finMs: number }[],
): { inicioMs: number; finMs: number }[] {
  const ordenados = [...cubiertos].sort((a, b) => a.inicioMs - b.inicioMs);
  const huecos: { inicioMs: number; finMs: number }[] = [];
  let cursor = ventana.inicioMs;
  for (const c of ordenados) {
    if (c.inicioMs > cursor) huecos.push({ inicioMs: cursor, finMs: c.inicioMs });
    cursor = Math.max(cursor, c.finMs);
  }
  if (cursor < ventana.finMs) huecos.push({ inicioMs: cursor, finMs: ventana.finMs });
  return huecos;
}

/**
 * FC media **ponderada por duración**, no por cantidad de muestras.
 *
 * Es el detalle que no se puede pasar por alto: promediar juntas muestras de
 * 1/s con muestras de `tracker.heart_rate` (mucho más ralas) pondera mal — el
 * tramo fino domina el promedio por cantidad, no por tiempo. Cuarenta minutos a
 * 150 y veinte a 100 dan 133, no el promedio de todas las muestras.
 */
function fcMediaPonderada(segmentos: Segmento[]): number | undefined {
  let suma = 0;
  let peso = 0;
  for (const seg of segmentos) {
    if (seg.fcs.length === 0) continue;
    const dur = Math.max(1, seg.finMs - seg.inicioMs);
    suma += (seg.fcs.reduce((a, b) => a + b, 0) / seg.fcs.length) * dur;
    peso += dur;
  }
  return peso > 0 ? suma / peso : undefined;
}

/** Dónde está el hueco más grande, para poder decir QUÉ pasó y no solo que falta. */
function motivoDeCobertura(
  ventana: SesionApp,
  huecos: { inicioMs: number; finMs: number }[],
  excedeVentana: boolean,
): BiometriaSesion["motivoCobertura"] | undefined {
  if (huecos.length === 0) return excedeVentana ? "sin-cortar" : undefined;
  const mayor = huecos.reduce((a, b) => (b.finMs - b.inicioMs > a.finMs - a.inicioMs ? b : a));
  if (mayor.finMs >= ventana.finMs)       return "cortado-antes";
  if (mayor.inicioMs <= ventana.inicioMs) return "arranco-tarde";
  return "hueco-entre-tramos";
}

/**
 * La biometría de una sesión a partir de uno o más tramos de Samsung, recortados
 * a la ventana de la app y completados con muestras crudas en los huecos (P78).
 *
 * **Sesgo conocido del prorrateo de kcal:** repartir por tiempo supone
 * intensidad constante. Si el pedazo recortado era sofá, sus calorías reales
 * eran bajas y el prorrateo le saca de más — o sea **subestima**. Es la
 * dirección segura: quedarse corto en el esfuerzo es mejor que inflarlo.
 */
export function construirBiometriaDeTramos(
  tramos: TramoSamsung[],
  matchPor: "custom-id" | "ventana" | "dia",
  ventanaApp: SesionApp,
  muestrasCrudas: LiveDataPoint[] = [],
  perfil?: PerfilMiembro,
): BiometriaSesion {
  const principal = tramos[0].sesion;
  const ventanaMs = Math.max(1, ventanaApp.finMs - ventanaApp.inicioMs);

  const segmentos: Segmento[] = [];
  const cubiertos: { inicioMs: number; finMs: number }[] = [];
  const curvaTotal: LiveDataPoint[] = [];
  let kcal = 0;
  let hayKcal = false;
  let kcalEstimada = false;
  let msMedidos = 0;
  let msFinos = 0;
  let excedeVentana = false;
  let algunRecorte = false;
  // Con curva, el máximo y el mínimo salen de las muestras. Sin curva, lo
  // mejor que hay es lo que declara la fila.
  const fcMaxFila: number[] = [];
  const fcMinFila: number[] = [];

  for (const { sesion, curva } of tramos) {
    const inter = interseccion(ventanaApp.inicioMs, ventanaApp.finMs, sesion.startMs, sesion.endMs);
    if (inter.ms <= 0) continue;
    const durWorkout = Math.max(1, sesion.endMs - sesion.startMs);
    const recortado = inter.ms < durWorkout;
    if (recortado) algunRecorte = true;
    if (sesion.endMs - ventanaApp.finMs > OLVIDO_CORTE_MS) excedeVentana = true;

    msMedidos += inter.ms;
    cubiertos.push({ inicioMs: inter.inicioMs, finMs: inter.finMs });

    // kcal: prorrateadas por tiempo, y marcadas si hubo recorte. **Siempre**,
    // haya curva o no: prorratear no necesita la curva, solo la fila y los
    // tiempos. Lo que sí necesita curva es recortar la FC media.
    if (sesion.kcal != null) {
      hayKcal = true;
      kcal += sesion.kcal * (inter.ms / durWorkout);
      if (recortado) kcalEstimada = true;
    }

    if (curva && curva.length > 0) {
      const dentro = curva.filter((pt) => pt.ms >= inter.inicioMs && pt.ms <= inter.finMs);
      if (dentro.length > 0) {
        segmentos.push({ inicioMs: inter.inicioMs, finMs: inter.finMs, fcs: dentro.map((pt) => pt.fc), fina: true });
        curvaTotal.push(...dentro);
        msFinos += inter.ms;
      }
    } else if (sesion.endMs - ventanaApp.finMs > OLVIDO_CORTE_MS) {
      // Sin curva no hay con qué recortar la FC: se conserva solo el pico, que
      // casi seguro fue entrenando. **La media se omite** — la de la fila
      // incluye el tiempo post-sesión y no es un número sumable. Las kcal sí
      // se prorratean (arriba): para eso alcanza con la fila y los tiempos.
      if (sesion.fcMax != null) fcMaxFila.push(sesion.fcMax);
    } else {
      // Sin curva y sin exceso: la fila sirve como promedio del tramo, y su
      // máximo y mínimo son lo mejor que hay.
      if (sesion.fcMedia != null) {
        segmentos.push({ inicioMs: inter.inicioMs, finMs: inter.finMs, fcs: [sesion.fcMedia], fina: false });
      }
      if (sesion.fcMax != null) fcMaxFila.push(sesion.fcMax);
      if (sesion.fcMin != null) fcMinFila.push(sesion.fcMin);
    }
  }

  // Los huecos de la ventana se completan con las muestras crudas que caigan ahí.
  const huecos = huecosDe(ventanaApp, cubiertos);
  let msCubiertosCrudos = 0;
  for (const hueco of huecos) {
    const dentro = muestrasCrudas.filter((pt) => pt.ms >= hueco.inicioMs && pt.ms <= hueco.finMs);
    if (dentro.length < MIN_MUESTRAS_RANGO) continue;
    segmentos.push({ ...hueco, fcs: dentro.map((pt) => pt.fc), fina: false });
    msCubiertosCrudos += hueco.finMs - hueco.inicioMs;
  }

  const finasYCrudas = segmentos.filter((seg) => seg.fina).flatMap((seg) => seg.fcs)
    .concat(segmentos.filter((seg) => !seg.fina && seg.fcs.length > 1).flatMap((seg) => seg.fcs));
  const fcMedia = fcMediaPonderada(segmentos);
  const candidatosMax = [...finasYCrudas, ...fcMaxFila];
  const candidatosMin = [...finasYCrudas, ...fcMinFila];
  const fcMax = candidatosMax.length > 0 ? Math.max(...candidatosMax) : undefined;
  const fcMin = candidatosMin.length > 0 ? Math.min(...candidatosMin) : undefined;
  const huboRecorte = algunRecorte || excedeVentana;

  const coberturaFina = Math.min(1, msFinos / ventanaMs);
  const coberturaTotal = Math.min(1, (msFinos + msCubiertosCrudos) / ventanaMs);

  return stripUndef<BiometriaSesion>({
    fuente:          "samsung-health-csv",
    datauuidSamsung: principal.datauuid,
    tramosSamsung:   tramos.map((t) => t.sesion.datauuid),
    fcMedia,
    fcMax,
    fcMin,
    zonaPrincipal:   fcMedia !== undefined ? derivarZona(fcMedia, perfil) : undefined,
    kcal:            hayKcal ? Math.round(kcal) : undefined,
    kcalEstimada:    hayKcal && kcalEstimada ? true : undefined,
    duracionMedidaMin: msMedidos > 0 ? Math.round(msMedidos / 60_000) : undefined,
    matchPor,
    granularidad:    "sesion",
    ...(huboRecorte
      ? { inicioMsEfectivo: Math.min(...cubiertos.map((c) => c.inicioMs)),
          finMsEfectivo:    Math.max(...cubiertos.map((c) => c.finMs)) }
      : {}),
    coberturaFina,
    coberturaTotal,
    motivoCobertura: coberturaFina < COBERTURA_MINIMA
      ? motivoDeCobertura(ventanaApp, huecos, excedeVentana)
      : undefined,
  });
}

/** La curva de todos los tramos, ordenada y sin duplicados (P78). */
export function curvaDeTramos(tramos: TramoSamsung[]): LiveDataPoint[] {
  const porMs = new Map<number, LiveDataPoint>();
  for (const t of tramos) for (const pt of t.curva ?? []) porMs.set(pt.ms, pt);
  return [...porMs.values()].sort((a, b) => a.ms - b.ms);
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
