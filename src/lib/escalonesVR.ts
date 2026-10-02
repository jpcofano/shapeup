// ════════════════════════════════════════════════════════════════════════════
//  lib/escalonesVR.ts — las rutinas de VR por escalones y su regla (P98, ADR #046).
//
//  Cada rutina tiene una escalera por modo (por bloques o de corrido), y se sube
//  de a un escalón. **La rutina nunca se muta** (ADR #039): el escalón actual de
//  cada miembro se deriva de sus subidas aceptadas (`perfiles.{miembro}.subidasVR`).
//
//  La regla se evalúa por rutina, **por modo y por juego**, y nunca mezcla:
//  - **Subir** si hay al menos 3 sesiones en el escalón, en al menos 2 semanas,
//    todas completadas, y la FC media de la última está por lo menos 5 latidos
//    por debajo del promedio de las dos primeras del escalón.
//  - **Mantener** si la FC subió 5 o más, si no se completó en dos sesiones
//    seguidas, o si no se dan las condiciones para subir.
//  - **Sin datos suficientes** si faltan sesiones o semanas.
//  - **Bajar dificultad**, solo en Ritmo suave: si la FC media pasa el techo de
//    Z3 en dos sesiones seguidas.
//
//  La evidencia es la **FC media de toda la ventana**, descansos incluidos. Vale
//  porque se compara contra el mismo escalón y el mismo modo, donde la estructura
//  de descansos es la misma (enmienda del ADR #039).
//
//  "Completó" exige las dos cosas: que la persona lo confirme al cerrar **y** que
//  la ventana dure al menos el 90 % del tiempo prescripto. La confirmación es la
//  excepción al principio de P79: **puede frenar una subida, nunca causarla**.
//  `dificultadPercibida` sigue sin entrar en ninguna regla.
//
//  Fuera del cálculo: `fcDudosa`, cobertura del reloj baja, ventana de las series
//  con discrepancia de duración, y sesiones sin FC media.
//
//  Nada de esto entra en la racha, la adherencia ni el tonelaje, y el análisis no
//  lo recibe (enmienda del 01/10).
//
//  Puro (ADR #009).
// ════════════════════════════════════════════════════════════════════════════
import type {
  ConfigProgresion, EscalonVR, Historial, ModoEscaleraVR, PerfilMiembro, Rutina,
  SubidaVR,
} from "../types/models";
import { MODOS_ESCALERA_VR } from "../types/models";
import { COBERTURA_MINIMA } from "./matchBiometrico";
import { discrepanciaDuracion } from "./analisis";
import { ventanaDeBloques } from "./metricas";
import { zonasDesdeFcMax } from "./zonas";

// ── Dificultades ───────────────────────────────────────────────────────────

/** Se jugó en más de una dificultad. */
export const DIFICULTAD_MIXTA = "mixto";

export const DIFICULTADES_BODYCOMBAT = [
  { id: "principiante", etiqueta: "Principiante" },
  { id: "intermedio", etiqueta: "Intermedio" },
  { id: "avanzado", etiqueta: "Avanzado" },
];

/** Para los juegos sin lista propia, por ahora (P98). Se renombran sin tocar el historial. */
export const DIFICULTADES_RELATIVAS = [
  { id: "base", etiqueta: "Por defecto" },
  { id: "+1", etiqueta: "+1" },
  { id: "+2", etiqueta: "+2" },
];

/** La etiqueta de una dificultad, con las del ejercicio, o el id tal cual. */
export function etiquetaDificultad(
  id: string, dificultades?: { id: string; etiqueta: string }[],
): string {
  if (id === DIFICULTAD_MIXTA) return "Mixto";
  return dificultades?.find((d) => d.id === id)?.etiqueta ?? id;
}

// ── Configuración ──────────────────────────────────────────────────────────

/** ⚠ El umbral es provisorio (decisión 10 de P98): revisarlo con un mes de datos. */
export const CONFIG_PROGRESION_DEFAULT: ConfigProgresion = {
  umbralFcBpm: 5,
  sesionesMinimas: 3,
  semanasMinimas: 2,
  fraccionTiempo: 0.9,
};

/**
 * `/config/progresion` campo por campo: lo ausente o inválido cae a su default
 * por separado. El documento puede no existir; la app no depende de que alguien
 * lo siembre.
 */
export function normalizarConfigProgresion(data: Record<string, unknown> | undefined): ConfigProgresion {
  const d = CONFIG_PROGRESION_DEFAULT;
  const ent = (v: unknown, min: number, max: number, def: number) =>
    typeof v === "number" && Number.isInteger(v) && v >= min && v <= max ? v : def;
  const fr = data?.fraccionTiempo;
  return {
    umbralFcBpm: ent(data?.umbralFcBpm, 1, 30, d.umbralFcBpm),
    sesionesMinimas: ent(data?.sesionesMinimas, 3, 20, d.sesionesMinimas),
    semanasMinimas: ent(data?.semanasMinimas, 1, 12, d.semanasMinimas),
    fraccionTiempo: typeof fr === "number" && fr >= 0.5 && fr <= 1 ? fr : d.fraccionTiempo,
  };
}

/** El problema de la configuración, en castellano, o `null`. */
export function validarConfigProgresion(c: ConfigProgresion): string | null {
  const entero = (n: number, min: number, max: number) => Number.isInteger(n) && n >= min && n <= max;
  if (!entero(c.umbralFcBpm, 1, 30)) return "El umbral tiene que ser un entero entre 1 y 30 latidos.";
  if (!entero(c.sesionesMinimas, 3, 20)) return "Las sesiones tienen que ser un entero entre 3 y 20.";
  if (!entero(c.semanasMinimas, 1, 12)) return "Las semanas tienen que ser un entero entre 1 y 12.";
  if (!(c.fraccionTiempo >= 0.5 && c.fraccionTiempo <= 1)) return "La fracción del tiempo tiene que estar entre 50 % y 100 %.";
  return null;
}

// ── La escalera ────────────────────────────────────────────────────────────

/** Los modos que la rutina ofrece, en el orden de siempre. */
export function modosDe(rutina: Pick<Rutina, "vr">): ModoEscaleraVR[] {
  return MODOS_ESCALERA_VR.filter((m) => (rutina.vr?.escaleras[m]?.length ?? 0) > 0);
}

/**
 * El escalón actual de un miembro en una rutina y un modo, de 1 en adelante: el
 * de su última subida aceptada, o 1 si no hubo. Nunca pasa del tope.
 */
export function escalonActual(
  perfil: Pick<PerfilMiembro, "subidasVR"> | undefined,
  rutina: Pick<Rutina, "idRutina" | "vr">,
  modo: ModoEscaleraVR,
): number {
  const tope = rutina.vr?.escaleras[modo]?.length ?? 0;
  if (tope === 0) return 0;
  const subidas = (perfil?.subidasVR ?? []).filter((s) => s.idRutina === rutina.idRutina && s.modo === modo);
  const ultima = subidas.length > 0 ? subidas[subidas.length - 1].a : 1;
  return Math.min(Math.max(1, ultima), tope);
}

/**
 * El escalón que toca, con su dificultad efectiva. Si la rutina sigue a otra
 * (Combat corto → Combat largo por bloques), la dificultad es la del escalón
 * actual de esa otra.
 */
export function escalonDeHoy(
  rutina: Pick<Rutina, "idRutina" | "vr">,
  modo: ModoEscaleraVR,
  perfil: Pick<PerfilMiembro, "subidasVR"> | undefined,
  seguida?: Pick<Rutina, "idRutina" | "vr"> | null,
): { numero: number; escalon: EscalonVR; tope: number } | null {
  const escalera = rutina.vr?.escaleras[modo];
  if (!escalera || escalera.length === 0) return null;
  const numero = escalonActual(perfil, rutina, modo);
  let escalon = escalera[numero - 1];
  const sigue = rutina.vr?.sigueA;
  if (sigue && seguida && seguida.idRutina === sigue.idRutina) {
    const otro = escalonDeHoy(seguida, sigue.modo, perfil);
    if (otro) escalon = { ...escalon, dificultad: otro.escalon.dificultad };
  }
  return { numero, escalon, tope: escalera.length };
}

/** Minutos que dura un escalón: los bloques más los descansos entre ellos. */
export function minutosPrescriptos(e: EscalonVR): number {
  return e.bloques * e.minutosBloque + Math.max(0, e.bloques - 1) * (e.descansoSeg / 60);
}

// ── Lectura de una sesión ──────────────────────────────────────────────────

type SesionRegla = Pick<Historial,
  "idHist" | "idRutina" | "fechaRealizada" | "semanaInicio" | "inicioMs" | "finMs"
  | "duracionRealMin" | "bloques" | "biometria" | "vr" | "tipo">;

/** Minutos de la ventana de la sesión; si no la tiene, la de las series. */
export function minutosVentana(h: Pick<Historial, "inicioMs" | "finMs" | "bloques">): number | null {
  if (h.inicioMs != null && h.finMs != null && h.finMs > h.inicioMs) return (h.finMs - h.inicioMs) / 60_000;
  const b = ventanaDeBloques(h.bloques ?? []);
  return b.inicioMs != null && b.finMs != null && b.finMs > b.inicioMs ? (b.finMs - b.inicioMs) / 60_000 : null;
}

/** ¿Contó como completada? La persona lo confirmó **y** la ventana llegó al 90 %. */
export function contoCompletada(h: SesionRegla, config: ConfigProgresion = CONFIG_PROGRESION_DEFAULT): boolean {
  if (!h.vr || h.vr.completoDeclarado !== true) return false;
  const min = minutosVentana(h);
  // El borde cuenta: sin la tolerancia, 0,9 × 42 da 37,800000000000004 y 37,8 min no llegaba.
  return min != null && min + 1e-9 >= config.fraccionTiempo * minutosPrescriptos(h.vr.prescripto);
}

export type MotivoExclusionVR = "fc-dudosa" | "cobertura" | "discrepancia-duracion" | "sin-fc";

/** Por qué una sesión queda fuera del cálculo, o `null` si entra. */
export function motivoExclusionVR(h: SesionRegla): MotivoExclusionVR | null {
  const b = h.biometria;
  if (b?.fcDudosa) return "fc-dudosa";
  if (b?.fcMedia == null) return "sin-fc";
  if ((b.coberturaFina ?? 0) < COBERTURA_MINIMA) return "cobertura";
  if (discrepanciaDuracion(h)) return "discrepancia-duracion";
  return null;
}

/** El techo de Z3 con que se calculó la sesión (P97), o el del perfil si es anterior. */
export function techoZ3(
  h: Pick<Historial, "biometria">,
  perfil?: Pick<PerfilMiembro, "zonasFC" | "fcMaxTeorica">,
): number | null {
  const z = h.biometria?.zonasUsadas?.Z3?.max ?? perfil?.zonasFC?.Z3?.max;
  if (z != null) return z;
  return perfil?.fcMaxTeorica != null ? zonasDesdeFcMax(perfil.fcMaxTeorica).Z3.max : null;
}

// ── La regla ───────────────────────────────────────────────────────────────

export type EstadoReglaVR = "subir" | "mantener" | "sin-datos" | "bajar-dificultad";

export type MotivoReglaVR =
  | "listo"                     // subir
  | "fc-subio"                  // mantener: la FC subió el umbral o más
  | "no-completo-dos-seguidas"  // mantener
  | "incompletas"               // mantener: alguna no contó como completada
  | "fc-sin-bajar"              // mantener: no bajó lo suficiente
  | "en-el-tope"                // mantener: ya está en el último escalón
  | "pocas-sesiones"            // sin datos
  | "pocas-semanas"             // sin datos
  | "pasa-techo"                // bajar dificultad
  | "debajo-techo";             // Ritmo suave: mantener

export interface SesionEvaluadaVR {
  idHist: string;
  fecha: string;
  fcMedia: number;
  completada: boolean;
  minutosVentana: number | null;
  minutosPrescriptos: number;
}

export interface ResultadoReglaVR {
  estado: EstadoReglaVR;
  motivo: MotivoReglaVR;
  modo: ModoEscaleraVR;
  idEjercicio: string;
  /** El escalón evaluado (en Ritmo suave, el único). */
  escalon: number;
  tope: number;
  /** Solo datos medidos: lo que muestra la pantalla de la rutina (enmienda del 01/10). */
  numeros: {
    fcUltima: number | null;
    fcReferencia: number | null;
    /** `fcUltima − fcReferencia`. Negativo = bajó. */
    diferencia: number | null;
    umbral: number;
    ultimaCompletada: boolean | null;
    semanas: number;
    /** Solo en Ritmo suave. */
    techoZ3: number | null;
    sesiones: SesionEvaluadaVR[];
    excluidas: { idHist: string; fecha: string; motivo: MotivoExclusionVR }[];
  };
}

export interface EntradaReglaVR {
  historial: SesionRegla[];
  rutina: Pick<Rutina, "idRutina" | "vr">;
  modo: ModoEscaleraVR;
  /** El juego: la regla nunca mezcla juegos. */
  idEjercicio: string;
  perfil?: Pick<PerfilMiembro, "subidasVR" | "zonasFC" | "fcMaxTeorica">;
  config?: ConfigProgresion;
}

const redondear1 = (n: number) => Math.round(n * 10) / 10;

/** El estado de la regla de progresión de una rutina de VR, en un modo y con un juego. `null` si la rutina no tiene regla. */
export function evaluarReglaVR(e: EntradaReglaVR): ResultadoReglaVR | null {
  const vr = e.rutina.vr;
  if (!vr || vr.regla === "ninguna") return null;
  const escalera = vr.escaleras[e.modo];
  if (!escalera || escalera.length === 0) return null;
  const config = e.config ?? CONFIG_PROGRESION_DEFAULT;
  const escalon = vr.regla === "subir" ? escalonActual(e.perfil, e.rutina, e.modo) : 1;

  // Solo esta rutina, este modo, este juego y este escalón (Ritmo suave tiene uno solo).
  const delEscalon = e.historial
    .filter((h) => h.idRutina === e.rutina.idRutina && h.vr != null
      && h.vr.modo === e.modo && h.vr.idEjercicio === e.idEjercicio
      && (vr.regla !== "subir" || h.vr.escalon === escalon))
    .sort((a, b) => (a.inicioMs ?? 0) - (b.inicioMs ?? 0) || a.fechaRealizada.localeCompare(b.fechaRealizada));

  const excluidas: ResultadoReglaVR["numeros"]["excluidas"] = [];
  const sesiones: SesionEvaluadaVR[] = [];
  const semanasSet = new Set<string>();
  for (const h of delEscalon) {
    const motivo = motivoExclusionVR(h);
    if (motivo) { excluidas.push({ idHist: h.idHist, fecha: h.fechaRealizada, motivo }); continue; }
    sesiones.push({
      idHist: h.idHist, fecha: h.fechaRealizada, fcMedia: h.biometria!.fcMedia!,
      completada: contoCompletada(h, config),
      minutosVentana: minutosVentana(h) != null ? redondear1(minutosVentana(h)!) : null,
      minutosPrescriptos: redondear1(minutosPrescriptos(h.vr!.prescripto)),
    });
    semanasSet.add(h.semanaInicio);
  }

  const ultima = sesiones.length > 0 ? sesiones[sesiones.length - 1] : null;
  const base = {
    modo: e.modo, idEjercicio: e.idEjercicio, escalon, tope: escalera.length,
  };
  const numeros = (ref: number | null, techo: number | null = null): ResultadoReglaVR["numeros"] => ({
    fcUltima: ultima ? redondear1(ultima.fcMedia) : null,
    fcReferencia: ref != null ? redondear1(ref) : null,
    diferencia: ultima && ref != null ? redondear1(ultima.fcMedia - ref) : null,
    umbral: config.umbralFcBpm,
    ultimaCompletada: ultima ? ultima.completada : null,
    semanas: semanasSet.size,
    techoZ3: techo,
    sesiones, excluidas,
  });
  const res = (estado: EstadoReglaVR, motivo: MotivoReglaVR, ref: number | null, techo: number | null = null): ResultadoReglaVR =>
    ({ ...base, estado, motivo, numeros: numeros(ref, techo) });

  // ── Ritmo suave: no sube; sugiere bajar si se pasa del techo de Z3 ───────
  if (vr.regla === "bajar-si-pasa-techo") {
    if (sesiones.length < 2) return res("sin-datos", "pocas-sesiones", null);
    const dos = sesiones.slice(-2);
    const ids = new Set(dos.map((s) => s.idHist));
    const techos = delEscalon.filter((h) => ids.has(h.idHist)).map((h) => techoZ3(h, e.perfil));
    const techo = techos[techos.length - 1] ?? null;
    const pasan = dos.every((s, i) => techos[i] != null && s.fcMedia > techos[i]!);
    return pasan ? res("bajar-dificultad", "pasa-techo", null, techo) : res("mantener", "debajo-techo", null, techo);
  }

  // ── La escalera ──────────────────────────────────────────────────────────
  if (sesiones.length >= 2 && !sesiones[sesiones.length - 1].completada && !sesiones[sesiones.length - 2].completada) {
    return res("mantener", "no-completo-dos-seguidas", null);
  }
  const ref = sesiones.length >= 2 ? (sesiones[0].fcMedia + sesiones[1].fcMedia) / 2 : null;
  if (sesiones.length < config.sesionesMinimas) return res("sin-datos", "pocas-sesiones", ref);
  if (semanasSet.size < config.semanasMinimas) return res("sin-datos", "pocas-semanas", ref);

  const diferencia = ultima!.fcMedia - ref!;
  if (diferencia >= config.umbralFcBpm) return res("mantener", "fc-subio", ref);
  if (!sesiones.every((s) => s.completada)) return res("mantener", "incompletas", ref);
  if (diferencia <= -config.umbralFcBpm) {
    return escalon >= escalera.length ? res("mantener", "en-el-tope", ref) : res("subir", "listo", ref);
  }
  return res("mantener", "fc-sin-bajar", ref);
}

/**
 * La subida que se registra al aceptar la propuesta (P98). Devuelve la lista de
 * subidas nueva, para escribir en el perfil, o un error. Solo con `subir`.
 */
export function aplicarSubida(
  perfil: Pick<PerfilMiembro, "subidasVR"> | undefined,
  rutina: Pick<Rutina, "idRutina">,
  resultado: ResultadoReglaVR,
  hoyMs: number,
): { ok: true; subidasVR: SubidaVR[] } | { ok: false; error: string } {
  if (resultado.estado !== "subir") return { ok: false, error: "La regla no propone subir." };
  if (resultado.escalon >= resultado.tope) return { ok: false, error: "Ya estás en el último escalón." };
  const n = resultado.numeros;
  const subida: SubidaVR = {
    fechaMs: hoyMs,
    idRutina: rutina.idRutina,
    modo: resultado.modo,
    de: resultado.escalon,
    a: resultado.escalon + 1,
    datos: {
      fcUltima: n.fcUltima!, fcReferencia: n.fcReferencia!, diferencia: n.diferencia!,
      umbral: n.umbral, sesiones: n.sesiones.map((s) => s.idHist),
    },
  };
  return { ok: true, subidasVR: [...(perfil?.subidasVR ?? []), subida] };
}

// ── Archivo ────────────────────────────────────────────────────────────────

/** Las rutinas que se listan en Biblioteca y para entrenar: sin las archivadas (P98). */
export function sinArchivadas<T extends Pick<Rutina, "archivada">>(rutinas: T[]): T[] {
  return rutinas.filter((r) => !r.archivada);
}
