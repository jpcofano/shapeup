// ════════════════════════════════════════════════════════════════════════════
//  lib/progresionVR.ts — cómo progresa una sesión de VR (P79, Bloque 9).
//
//  Tres de los seis días del plan son VR, y hasta P79 **una sesión VR no
//  progresaba**: la app registraba rondas y tiempos, pero no sabía si el juego
//  costó, y la próxima vez proponía exactamente lo mismo.
//
//  ── La escalera, ordenada por lo que cuesta en tiempo ─────────────────────
//      dificultad del juego  →  recortar descanso  →  sumar ronda
//  Subir la dificultad no alarga la sesión; recortar descanso la acorta un
//  poco; sumar una ronda le suma de 4 a 10 minutos. Por eso ese orden.
//
//  ── Por qué la FC de SESIÓN no sirve, que es lo que motiva el módulo ──────
//  `biometria.fcMedia` promedia la sesión entera, **descansos incluidos**. En
//  una rutina de rondas de 4 minutos con 1 de descanso, esa media queda
//  sistemáticamente por debajo de la FC real de trabajo. Una regla que la
//  usara leería siempre "por debajo de la zona" y pediría subir la dificultad
//  para siempre. Acá se usa la **FC de trabajo**: el promedio de las rondas,
//  ponderado por su duración, y solo de las rondas que midieron bien.
//
//  ── El sistema decide solo con lo que mide ────────────────────────────────
//  ⛔ **Ninguna regla lee `dificultadPercibida`.** La sensación de la persona
//  no es una medición confiable y no entra en ninguna decisión; se registra
//  para el análisis y nada más. Cuando no hay nada medido con qué decidir, el
//  módulo **no inventa una sugerencia**: devuelve `palanca: null` y deja
//  elegir a la persona.
//
//  `palanca: null` **no es `mantener`**. `mantener` es una decisión medida
//  ("estás en el techo", "estás una zona arriba"); `null` es la ausencia de
//  decisión, y la UI lo trata distinto.
//
//  ── Y también se mide si el dato SIRVE (P79b) ─────────────────────────────
//  "Decidir solo con lo que se mide" no alcanza si no se mide además si el
//  dato vale. Con los datos reales del 21/09: Creed registró 8 rondas para una
//  rutina de 5, tres de ellas de 1 a 2 segundos —dobles toques—, y el descanso
//  real dio 1 s; Body Combat tenía 29 minutos entre la ronda 1 y la 2, que es
//  una pausa y no un descanso, y con solo dos intervalos la mediana se la
//  comía entera. Basura que entra, basura que sale.
//
//  Por eso: una ronda que duró menos de `FRACCION_RONDA_MINIMA` del trabajo
//  previsto **no es una ronda**, y un intervalo de más de `FACTOR_PAUSA` veces
//  el descanso previsto **no es un descanso**.
//
//  Núcleo puro (ADR #009): sin Firebase, se testea solo.
// ════════════════════════════════════════════════════════════════════════════

import type {
  BloqueRegistro, Historial, PerfilMiembro, PrescripcionCardio, Rutina,
  SerieRegistro, ZonaFC,
} from "../types/models";
import { derivarZona, COBERTURA_MINIMA } from "./matchBiometrico";

// ── Constantes, para ajustar sin tocar la lógica ───────────────────────────

/** Cuánto se recorta el descanso por vez. */
export const PASO_DESCANSO_SEG = 15;
/** Menos que esto no es descanso. */
export const PISO_DESCANSO_SEG = 30;
/** Rondas máximas por encima de la rutina. Cada ronda suma de 4 a 10 minutos. */
export const TECHO_RONDAS_EXTRA = 2;
/**
 * Recuperación mínima esperada entre rondas, sobre la **mediana** de
 * `recuperacionBpm`. ⚠ **Punto de partida para ajustar, no un umbral
 * clínico**: sale de mirar los datos, no de la literatura.
 */
export const RECUPERACION_MINIMA_BPM = 12;
/** Descanso real ≤ esta fracción del prescripto → te sobró descanso. */
export const DESCANSO_SOBRA = 0.7;
/** Descanso real ≥ esta fracción del prescripto → necesitaste más del previsto. */
export const DESCANSO_FALTA = 1.3;
// ── Qué dato sirve (P79b) ──────────────────────────────────────────────────

/**
 * Una ronda que duró menos de esta fracción de `trabajoSeg` **no es una
 * ronda**: es un doble toque en "Serie hecha".
 */
export const FRACCION_RONDA_MINIMA = 0.25;

/**
 * Un intervalo de más de estas veces el descanso previsto **es una pausa**, no
 * un descanso: fuiste a atender el teléfono, no estabas recuperándote.
 */
export const FACTOR_PAUSA = 3;

/** Con menos intervalos válidos que esto, el descanso no decide. */
export const MIN_DESCANSOS_VALIDOS = 2;

/** Cuántas de las últimas sesiones se miran para el aviso de muñeca (§9.3). */
export const VENTANA_MUNECA = 5;
/** Cuántas de ésas con FC dudosa disparan el aviso. */
export const MINIMO_MUNECA_DUDOSA = 3;

export type Palanca =
  | "subir-dificultad" | "recortar-descanso" | "sumar-ronda" | "mantener" | "bajar";

export interface PrescripcionVR {
  rondas: number;
  trabajoSeg: number;
  descansoSeg: number;
}

export interface SugerenciaVR {
  /** `null` = no hay medición con qué decidir. No es `mantener`. */
  palanca: Palanca | null;
  motivo: string;
  fuente: "fc" | "descanso" | "sin-medicion";
  nuevaPrescripcion: PrescripcionVR;
}

// ── Lectura de la rutina ───────────────────────────────────────────────────

/** El bloque de VR de una rutina: Cardio, Intervalos y con juego sugerido. */
export function bloqueVRDeRutina(rutina: Rutina): { idEjercicio: string; prescripcion: PrescripcionCardio } | null {
  for (const b of rutina.bloques ?? []) {
    const p = b.prescripcion as PrescripcionCardio;
    if (p?.modalidad === "Cardio" && p.formato === "Intervalos" && p.juegoSugerido) {
      return { idEjercicio: b.idEjercicio, prescripcion: p };
    }
  }
  return null;
}

/** ¿Esta rutina es de VR? */
export function esRutinaVR(rutina: Rutina): boolean {
  return bloqueVRDeRutina(rutina) !== null;
}

/** La prescripción base que declara la rutina. */
export function prescripcionDeRutina(p: PrescripcionCardio): PrescripcionVR {
  return {
    rondas: p.rondas ?? 1,
    trabajoSeg: p.trabajoSeg ?? 0,
    descansoSeg: p.descansoSeg ?? 0,
  };
}

// ── Lectura de una sesión ──────────────────────────────────────────────────

/** El bloque registrado que corresponde al ejercicio de VR. */
export function bloqueVRDeSesion(h: Historial, idEjercicio: string): BloqueRegistro | null {
  return (h.bloques ?? []).find((b) => b.idEjercicio === idEjercicio) ?? null;
}

/** Duración de una serie en ms, o 0 si no tiene ventana. */
function duracionMs(s: SerieRegistro): number {
  if (s.inicioMs == null || s.finMs == null) return 0;
  return Math.max(0, s.finMs - s.inicioMs);
}

/**
 * Las rondas que **cuentan**: completadas y con una duración creíble (P79b).
 *
 * Son las únicas que entran en "rondas hechas", en la FC de trabajo y en la
 * medición del descanso. Una ronda de dos segundos sobre un trabajo de cinco
 * minutos no es una ronda corta: es un toque de más.
 *
 * Sin `trabajoSeg` declarado no se puede juzgar la duración, así que pasan
 * todas las completadas — no se descarta por no poder medir.
 */
export function rondasValidas(series: SerieRegistro[], trabajoSeg: number): SerieRegistro[] {
  const completas = series.filter((s) => s.completada);
  if (trabajoSeg <= 0) return completas;
  const minimoMs = trabajoSeg * 1000 * FRACCION_RONDA_MINIMA;
  return completas.filter((s) => {
    const d = duracionMs(s);
    // Sin ventana no hay con qué juzgarla: se conserva.
    return d === 0 ? true : d >= minimoMs;
  });
}

/**
 * FC de trabajo: el promedio de las rondas **completadas y sin artefactos**,
 * ponderado por la duración de cada una (mismo criterio que P78).
 *
 * `null` si ninguna ronda tiene `fcMedia` utilizable.
 */
export function fcDeTrabajo(series: SerieRegistro[], trabajoSeg = 0): number | null {
  const utiles = rondasValidas(series, trabajoSeg)
    .filter((s) => s.fcMedia != null && !s.fcDudosa);
  let suma = 0;
  let peso = 0;
  for (const s of utiles) {
    const d = duracionMs(s) || 1;
    suma += s.fcMedia! * d;
    peso += d;
  }
  return peso > 0 ? suma / peso : null;
}

/**
 * Qué fracción del tiempo de trabajo midió bien.
 *
 * Denominador: todas las rondas completadas. Numerador: las que tienen
 * `fcMedia` y no son dudosas.
 */
export function coberturaFcDeTrabajo(series: SerieRegistro[], trabajoSeg = 0): number {
  const completas = rondasValidas(series, trabajoSeg);
  const total = completas.reduce((a, s) => a + (duracionMs(s) || 1), 0);
  if (total === 0) return 0;
  const buenas = completas
    .filter((s) => s.fcMedia != null && !s.fcDudosa)
    .reduce((a, s) => a + (duracionMs(s) || 1), 0);
  return buenas / total;
}

/** Mediana de una lista. `null` si está vacía. */
function mediana(nums: number[]): number | null {
  if (nums.length === 0) return null;
  const ord = [...nums].sort((a, b) => a - b);
  const m = Math.floor(ord.length / 2);
  return ord.length % 2 === 1 ? ord[m] : (ord[m - 1] + ord[m]) / 2;
}

/**
 * El descanso que **realmente** se tomó entre rondas, en segundos.
 *
 * Sale de los timestamps que `SerieRegistro` ya guarda: si arrancaste la ronda
 * siguiente antes de que terminara el timer, o le sumaste 30 s, queda
 * registrado. No se guarda nada: se calcula.
 *
 * **Entre rondas VÁLIDAS y sin las pausas** (P79b): una pausa de 29 minutos no
 * es un descanso largo, es otra cosa, y con pocos intervalos la mediana no
 * alcanza para defenderse de ella. Se informan aparte, para poder decirlo.
 */
export function descansoRealSeg(
  series: SerieRegistro[],
  trabajoSeg = 0,
  descansoPrevistoSeg = 0,
): { seg: number | null; validos: number; pausas: number; pausaMayorSeg: number | null } {
  const ord = rondasValidas(series, trabajoSeg)
    .filter((s) => s.inicioMs != null && s.finMs != null)
    .sort((a, b) => a.inicioMs! - b.inicioMs!);

  const topePausaSeg = descansoPrevistoSeg > 0 ? descansoPrevistoSeg * FACTOR_PAUSA : Infinity;
  const huecos: number[] = [];
  const pausas: number[] = [];

  for (let i = 1; i < ord.length; i++) {
    const gap = (ord[i].inicioMs! - ord[i - 1].finMs!) / 1000;
    if (gap < 0) continue;
    if (gap > topePausaSeg) pausas.push(gap);
    else huecos.push(gap);
  }

  return {
    seg: mediana(huecos),
    validos: huecos.length,
    pausas: pausas.length,
    pausaMayorSeg: pausas.length > 0 ? Math.max(...pausas) : null,
  };
}

/** Mediana de la recuperación entre rondas, o `null`. */
export function recuperacionMediana(series: SerieRegistro[]): number | null {
  return mediana(series.map((s) => s.recuperacionBpm).filter((r): r is number => r != null));
}

// ── Zonas ──────────────────────────────────────────────────────────────────

const ORDEN_ZONAS: ZonaFC[] = ["Z1", "Z2", "Z3", "Z4", "Z5"];

/** Cuántas zonas hay entre `zona` y `objetivo`. Positivo = por encima. */
export function distanciaDeZonas(zona: ZonaFC, objetivo: ZonaFC): number {
  return ORDEN_ZONAS.indexOf(zona) - ORDEN_ZONAS.indexOf(objetivo);
}

/** ¿El perfil alcanza para derivar una zona? Sin esto, la FC no decide. */
export function perfilPuedeDerivarZona(perfil?: PerfilMiembro): boolean {
  return !!(perfil?.zonasFC || perfil?.fcMaxTeorica);
}

// ── Ajustes sobre la prescripción ──────────────────────────────────────────

function recortarDescanso(p: PrescripcionVR): PrescripcionVR {
  return { ...p, descansoSeg: Math.max(PISO_DESCANSO_SEG, p.descansoSeg - PASO_DESCANSO_SEG) };
}

function sumarRonda(p: PrescripcionVR): PrescripcionVR {
  return { ...p, rondas: p.rondas + 1 };
}

function enElPiso(p: PrescripcionVR): boolean {
  return p.descansoSeg <= PISO_DESCANSO_SEG;
}

function enElTecho(p: PrescripcionVR, base: PrescripcionVR): boolean {
  return p.rondas >= base.rondas + TECHO_RONDAS_EXTRA;
}

// ── La función principal ───────────────────────────────────────────────────

/** Lo que se pudo medir de una sesión, ya filtrado por validez (P79b). */
export interface MedicionSesionVR {
  /** Rondas que cuentan: completadas y de duración creíble. */
  validas: number;
  /** Rondas completadas que se descartaron por durar muy poco. */
  descartadas: number;
  /** Duración de las descartadas, en segundos, para poder decirlo. */
  durDescartadasSeg: number[];
  fcTrabajo: number | null;
  cobertura: number;
  descansoSeg: number | null;
  descansosValidos: number;
  pausas: number;
  pausaMayorSeg: number | null;
}

/** Mide una sesión de VR contra los parámetros con los que se jugó (P79b). */
export function medirSesionVR(
  series: SerieRegistro[],
  usada: PrescripcionVR,
): MedicionSesionVR {
  const completas = series.filter((s) => s.completada);
  const validas = rondasValidas(series, usada.trabajoSeg);
  const descartadas = completas.filter((s) => !validas.includes(s));
  const d = descansoRealSeg(series, usada.trabajoSeg, usada.descansoSeg);

  return {
    validas: validas.length,
    descartadas: descartadas.length,
    durDescartadasSeg: descartadas.map((s) => Math.round(duracionMs(s) / 1000)),
    fcTrabajo: fcDeTrabajo(series, usada.trabajoSeg),
    cobertura: coberturaFcDeTrabajo(series, usada.trabajoSeg),
    descansoSeg: d.seg,
    descansosValidos: d.validos,
    pausas: d.pausas,
    pausaMayorSeg: d.pausaMayorSeg,
  };
}

export interface EntradaProgresionVR {
  /** La última sesión de esta rutina y este juego. */
  ultima: Historial;
  /** Las anteriores, de la misma rutina y juego. Orden indistinto. */
  anteriores: Historial[];
  rutina: Rutina;
  perfil?: PerfilMiembro;
}

/**
 * Qué proponer para la próxima sesión de esta rutina de VR.
 *
 * Las reglas, en orden: **gana la primera que aplica**.
 */
export function sugerirProgresionVR(e: EntradaProgresionVR): SugerenciaVR | null {
  const vr = bloqueVRDeRutina(e.rutina);
  if (!vr) return null;

  const base = prescripcionDeRutina(vr.prescripcion);
  const bloque = bloqueVRDeSesion(e.ultima, vr.idEjercicio);
  if (!bloque) return null;

  const usada: PrescripcionVR = bloque.prescripcionUsada ?? base;
  const series = bloque.series ?? [];
  const medicion = medirSesionVR(series, usada);
  // "Rondas hechas" son las VÁLIDAS (P79b). Y completa es tener al menos las
  // del objetivo: las extra válidas no rompen nada.
  const completadas = medicion.validas;

  const sin = (palanca: Palanca | null, motivo: string, fuente: SugerenciaVR["fuente"],
               nueva: PrescripcionVR = usada): SugerenciaVR =>
    ({ palanca, motivo, fuente, nuevaPrescripcion: nueva });

  // ── Regla 1 — rondas incompletas ────────────────────────────────────────
  if (completadas < usada.rondas) {
    const anteriorIncompleta = sesionAnteriorIncompleta(e, vr.idEjercicio, base);
    if (anteriorIncompleta) {
      return sin("bajar",
        `Dos sesiones seguidas sin terminar las ${usada.rondas} rondas. Bajemos un poco.`,
        "fc", deshacerUltimoAjuste(e, usada, base, vr.prescripcion.juegoSugerido));
    }
    return sin("mantener",
      `Quedaron ${completadas} de ${usada.rondas} rondas. Va de nuevo igual.`, "fc");
  }

  // ── Regla 2 — FC confiable ──────────────────────────────────────────────
  const fcTrabajo = medicion.fcTrabajo;
  const cobertura = medicion.cobertura;
  const objetivo = vr.prescripcion.zonaObjetivo;
  const fcConfiable = fcTrabajo != null
    && cobertura >= COBERTURA_MINIMA
    && perfilPuedeDerivarZona(e.perfil)
    && objetivo != null;

  if (fcConfiable) {
    const zona = derivarZona(fcTrabajo!, e.perfil);
    if (zona) {
      const dist = distanciaDeZonas(zona, objetivo!);
      const fc = Math.round(fcTrabajo!);

      if (dist < 0) {
        // Dos subidas aceptadas y sigue por debajo: el juego no da más.
        if (subidasAceptadasSeguidas(e) >= 2) {
          return enElPiso(usada)
            ? sin("mantener",
                `Ya subiste la dificultad dos veces y el descanso está en el piso: esta rutina no te exige más.`,
                "fc")
            : sin("recortar-descanso",
                `Subiste la dificultad dos veces y seguís en ${zona} con objetivo ${objetivo}. Probemos con menos descanso.`,
                "fc", recortarDescanso(usada));
        }
        return sin("subir-dificultad",
          `FC de trabajo ${fc} (${zona}), y el objetivo es ${objetivo}. Subí un nivel la dificultad de ${vr.prescripcion.juegoSugerido}.`,
          "fc");
      }

      if (dist === 0) {
        const rec = recuperacionMediana(rondasValidas(series, usada.trabajoSeg));
        if (rec != null && rec < RECUPERACION_MINIMA_BPM) {
          return sin("mantener",
            `Estás en ${zona}, pero entre rondas bajás solo ${Math.round(rec)} bpm. Repetí igual antes de exigir más.`,
            "fc");
        }
        if (!enElPiso(usada)) {
          return sin("recortar-descanso",
            `FC de trabajo ${fc} (${zona}), justo en el objetivo. Probemos con ${recortarDescanso(usada).descansoSeg} s de descanso.`,
            "fc", recortarDescanso(usada));
        }
        if (!enElTecho(usada, base)) {
          return sin("sumar-ronda",
            `En ${zona} y con el descanso en el piso: sumemos una ronda (${sumarRonda(usada).rondas}).`,
            "fc", sumarRonda(usada));
        }
        return sin("mantener",
          "Esta rutina ya no te exige más: es hora de otra.", "fc");
      }

      if (dist === 1) {
        return sin("mantener",
          `FC de trabajo ${fc} (${zona}), una zona por encima del objetivo. Así está bien.`, "fc");
      }

      return sin("bajar",
        `FC de trabajo ${fc} (${zona}), dos zonas por encima de ${objetivo}.`,
        "fc", deshacerUltimoAjuste(e, usada, base, vr.prescripcion.juegoSugerido));
    }
  }

  // ── Regla 3 — sin FC confiable, pero el descanso dice algo ──────────────
  // Con menos de `MIN_DESCANSOS_VALIDOS` intervalos el descanso no decide: una
  // mediana de un solo número es ese número, y basta una pausa para torcerla.
  const descanso = medicion.descansosValidos >= MIN_DESCANSOS_VALIDOS
    ? medicion.descansoSeg
    : null;
  if (descanso != null && usada.descansoSeg > 0) {
    const razon = descanso / usada.descansoSeg;
    if (razon <= DESCANSO_SOBRA) {
      if (enElPiso(usada)) {
        return sin("mantener",
          `Arrancaste cada ronda a los ${Math.round(descanso)} s de los ${usada.descansoSeg} previstos, pero el descanso ya está en el piso.`,
          "descanso");
      }
      return sin("recortar-descanso",
        `Arrancaste cada ronda a los ${Math.round(descanso)} s de los ${usada.descansoSeg} previstos.`,
        "descanso", recortarDescanso(usada));
    }
    if (razon >= DESCANSO_FALTA) {
      return sin("mantener",
        `Necesitaste ${Math.round(descanso)} s entre rondas, más que los ${usada.descansoSeg} previstos. Va de nuevo igual.`,
        "descanso");
    }
  }

  // ── Regla 4 — nada medido con qué decidir ───────────────────────────────
  return sin(null, motivoSinMedicion(series, usada, medicion, e.perfil, objetivo), "sin-medicion");
}

/** Qué falta para poder decidir, dicho para que se pueda arreglar. */
function motivoSinMedicion(
  series: SerieRegistro[],
  usada: PrescripcionVR,
  medicion: MedicionSesionVR,
  perfil: PerfilMiembro | undefined,
  objetivo: ZonaFC | undefined,
): string {
  const completas = rondasValidas(series, usada.trabajoSeg);
  const conFc = completas.filter((s) => s.fcMedia != null);
  const dudosas = conFc.filter((s) => s.fcDudosa);

  if (conFc.length === 0) {
    // Sin FC, lo que quedaba era el descanso: si tampoco alcanza, se dice.
    if (medicion.descansosValidos < MIN_DESCANSOS_VALIDOS) {
      return "no hay suficientes descansos medibles";
    }
    return "no hubo curva de FC en esta sesión";
  }
  if (dudosas.length > 0) {
    return `la FC vino con artefactos en ${dudosas.length} de ${completas.length} rondas`;
  }
  if (!perfilPuedeDerivarZona(perfil)) {
    return "tu perfil no tiene FC máxima para calcular la zona";
  }
  if (!objetivo) return "esta rutina no declara una zona objetivo";
  return "no hay suficiente FC medida para decidir";
}

/** ¿La sesión anterior también quedó incompleta? */
function sesionAnteriorIncompleta(
  e: EntradaProgresionVR, idEjercicio: string, base: PrescripcionVR,
): boolean {
  const previa = [...e.anteriores]
    .sort((a, b) => b.fechaRealizada.localeCompare(a.fechaRealizada))[0];
  if (!previa) return false;
  const b = bloqueVRDeSesion(previa, idEjercicio);
  if (!b) return false;
  const usada = b.prescripcionUsada ?? base;
  return rondasValidas(b.series, usada.trabajoSeg).length < usada.rondas;
}

/**
 * Cuántas veces seguidas, hacia atrás, se aceptó `subir-dificultad`.
 *
 * Es lo que resuelve el techo de dificultad de un juego **sin tener que
 * registrar en qué nivel está**: si ya se subió dos veces y la zona sigue por
 * debajo, el juego no da más.
 */
export function subidasAceptadasSeguidas(e: EntradaProgresionVR): number {
  const orden = [e.ultima, ...e.anteriores]
    .sort((a, b) => b.fechaRealizada.localeCompare(a.fechaRealizada));
  let n = 0;
  for (const h of orden) {
    const p = h.progresionVR;
    if (p?.palanca === "subir-dificultad" && p.aceptada) n++;
    else break;
  }
  return n;
}

/**
 * `bajar` deshace primero el último ajuste de la app que se haya aceptado:
 * devuelve los 15 s de descanso o saca la ronda. Si no hay nada que deshacer,
 * el consejo es bajar el nivel del juego, que la app no puede tocar.
 */
function deshacerUltimoAjuste(
  e: EntradaProgresionVR,
  usada: PrescripcionVR,
  base: PrescripcionVR,
  juego?: string,
): PrescripcionVR {
  if (usada.rondas > base.rondas) return { ...usada, rondas: usada.rondas - 1 };
  if (usada.descansoSeg < base.descansoSeg) {
    return { ...usada, descansoSeg: Math.min(base.descansoSeg, usada.descansoSeg + PASO_DESCANSO_SEG) };
  }
  void e; void juego;
  return usada;   // no hay ajuste que deshacer: el consejo es del juego
}

/** ¿`bajar` tiene un ajuste que deshacer, o es solo un consejo? */
export function bajarEsSoloConsejo(usada: PrescripcionVR, base: PrescripcionVR): boolean {
  return usada.rondas <= base.rondas && usada.descansoSeg >= base.descansoSeg;
}

// ── §9.3 — cuando la muñeca no sirve para ese juego ────────────────────────

/**
 * ¿La muñeca viene midiendo mal en este juego?
 *
 * Criterio medido, no comparado con la sensación: 3 de las últimas 5 sesiones
 * con FC **dudosa por artefactos**. La falta de curva es otro problema y no
 * cuenta acá. Se recalcula del historial cada vez; no se guarda.
 */
export function munecaNoMide(
  sesiones: Historial[],
  idEjercicio: string,
): { aplica: boolean; conArtefactos: number; miradas: number } {
  const ultimas = [...sesiones]
    .sort((a, b) => b.fechaRealizada.localeCompare(a.fechaRealizada))
    .slice(0, VENTANA_MUNECA);

  let conArtefactos = 0;
  for (const h of ultimas) {
    const b = bloqueVRDeSesion(h, idEjercicio);
    if (!b) continue;
    const completas = b.series.filter((s) => s.completada);
    const conFc = completas.filter((s) => s.fcMedia != null);
    // Solo artefactos: una sesión sin curva no cuenta como muñeca que no mide.
    if (conFc.length > 0 && conFc.some((s) => s.fcDudosa)) conArtefactos++;
  }

  return {
    aplica: conArtefactos >= MINIMO_MUNECA_DUDOSA,
    conArtefactos,
    miradas: ultimas.length,
  };
}

/**
 * La rutina con la que se JUEGA esta sesión: la de `/rutinas` con el bloque de
 * VR pisado por los parámetros que vienen de la historia (P79, ADR #039).
 *
 * ⛔ **No muta nada**: devuelve una copia. `/rutinas` es compartida por la
 * familia y cambiarla por la progresión de un miembro se la cambia a todos —
 * por eso la sesión corre sobre una rutina efectiva y el documento queda
 * intacto.
 */
export function aplicarPrescripcionVR(rutina: Rutina, p: PrescripcionVR | null): Rutina {
  if (!p) return rutina;
  const vr = bloqueVRDeRutina(rutina);
  if (!vr) return rutina;

  return {
    ...rutina,
    bloques: rutina.bloques.map((b) =>
      b.idEjercicio === vr.idEjercicio
        ? {
            ...b,
            prescripcion: {
              ...(b.prescripcion as PrescripcionCardio),
              rondas: p.rondas,
              trabajoSeg: p.trabajoSeg,
              descansoSeg: p.descansoSeg,
            },
          }
        : b,
    ),
  };
}

// ── Parte 4 — los parámetros de arranque salen de la historia ──────────────

/**
 * Con qué parámetros arranca la próxima sesión de esta rutina y este juego.
 *
 * La clave es `(miembro, idRutina, idEjercicio)`: si en la última sesión se
 * sustituyó el juego (P73), es otro juego y tiene su propia historia. Sin
 * historia, los de la rutina.
 */
export function parametrosDeArranque(
  historial: Historial[],
  rutina: Rutina,
): { prescripcion: PrescripcionVR; desdeHistoria: boolean } {
  const vr = bloqueVRDeRutina(rutina);
  if (!vr) return { prescripcion: { rondas: 1, trabajoSeg: 0, descansoSeg: 0 }, desdeHistoria: false };

  const base = prescripcionDeRutina(vr.prescripcion);
  const deEstaRutina = historial
    .filter((h) => h.idRutina === rutina.idRutina && bloqueVRDeSesion(h, vr.idEjercicio))
    .sort((a, b) => b.fechaRealizada.localeCompare(a.fechaRealizada));

  const ultima = deEstaRutina[0];
  if (!ultima) return { prescripcion: base, desdeHistoria: false };

  const bloque = bloqueVRDeSesion(ultima, vr.idEjercicio)!;
  const usada = bloque.prescripcionUsada ?? base;

  // El ajuste de la sesión anterior solo cuenta si se aceptó.
  const prog = ultima.progresionVR;
  if (!prog?.aceptada) return { prescripcion: usada, desdeHistoria: true };

  if (prog.palanca === "recortar-descanso") return { prescripcion: recortarDescanso(usada), desdeHistoria: true };
  if (prog.palanca === "sumar-ronda")       return { prescripcion: sumarRonda(usada), desdeHistoria: true };
  return { prescripcion: usada, desdeHistoria: true };
}
