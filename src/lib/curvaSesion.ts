// ════════════════════════════════════════════════════════════════════════════
//  lib/curvaSesion.ts — la geometría de la curva de FC de una sesión (P99).
//
//  La pantalla de la sesión dibuja `biometria.curva` con bandas de zona y las
//  marcas encima. Acá va solo la cuenta, sin DOM: el componente SVG pinta lo
//  que sale de estas funciones.
//
//  El método:
//   1. Los `seg` de la curva cuentan desde `curva.origenMs`; los tramos de las
//      marcas, desde el inicio de la ventana del análisis. No tienen por qué
//      coincidir: `desplazamientoS = round((origenMs - ventanaInicioMs) / 1000)`
//      y `seg + desplazamientoS` son los segundos de la ventana.
//   2. El eje X va de 0 a la duración de la ventana; el eje Y, de la FC mínima
//      a la máxima (contando los bordes de Z1 y Z5 si vienen), con 5 bpm de
//      aire y redondeado a múltiplos de 5.
//   3. La curva se corta donde hay un hueco (dos puntos separados por más de
//      2 × pasoSeg): un segmento por tramo continuo, para no inventar FC.
//   4. Las marcas dibujables son las de la app con tramo y las del análisis
//      (con `refMarca`, sobre el tramo de ESA marca de la app; con tramo
//      propio, el suyo). Todo recortado a la ventana.
//
//  5. P109: la curva se pinta por zona. `tramos` corta la curva donde cambia
//     la zona (el punto del cambio queda en los dos tramos, así no hay
//     huecos), con la zona de cada punto según los pisos de `zonas`; por
//     debajo de Z1, `zona` es null. `guias` son los pisos de zona (y el techo
//     de Z5) para las líneas punteadas; `marcasTiempo`, el eje de tiempo con
//     marcas redondas; `punto(seg)`, dónde cae la curva en un segundo dado
//     (para el punto del pico).
//
//  Coordenadas con 1 decimal. Sin claves `undefined`: se omiten.
//  Puro (ADR #009).
// ════════════════════════════════════════════════════════════════════════════
import type { CurvaGuardada, MarcaAnalisis, MarcaSesion, ZonaFC } from "../types/models";
import { ZONAS_FC } from "../types/models";
import { zonaPorPiso, type Pisos } from "./zonas";

const ANCHO_DEFECTO = 340;
const ALTO_DEFECTO = 140;
/** Aire arriba y abajo del eje Y, en bpm. */
const AIRE_BPM = 5;

export interface GeometriaCurva {
  ancho: number; alto: number;               // las del viewBox
  /** Segundos de la ventana en el eje X: [0, duracionS]. */
  duracionS: number;
  fcMin: number; fcMax: number;              // el eje Y
  x: (seg: number) => number;                // seg de la ventana → px
  y: (fc: number) => number;                 // bpm → px (arriba = más alto)
  /** La curva, cortada donde hay un hueco: cada segmento es un "M x y L x y …" para un <path>. */
  segmentos: string[];
  /** Una banda por zona presente en `zonas`, recortada al eje Y; de Z1 a Z5. */
  bandas: { zona: ZonaFC; y: number; alto: number }[];
  /** P109: la curva por zona, para un <polyline points> cada uno. `zona` null = debajo de Z1. */
  tramos: { zona: ZonaFC | null; puntos: string }[];
  /** P109: los pisos de las zonas (y el techo de Z5), dentro del eje Y. */
  guias: { fc: number; y: number }[];
  /** P109: el eje de tiempo: marcas redondas y la duración al final. */
  marcasTiempo: { x: number; texto: string }[];
  /** P109: dónde cae la curva en un segundo de la ventana (el punto más cercano a menos de 2 pasos). */
  punto: (seg: number) => { x: number; y: number } | null;
}

/** La zona de una FC con la regla única de `lib/zonas` (la más alta cuyo piso se alcanzó). null = debajo de Z1. */
function zonaDe(fc: number, zonas: EntradaGeometria["zonas"]): ZonaFC | null {
  const pisos: Pisos = [...ZONAS_FC].reverse().filter((z) => zonas?.[z]).map((z) => ({ zona: z, min: zonas![z]!.min }));
  return zonaPorPiso(fc, pisos);
}

/** «m:ss» desde segundos. */
function mmss(s: number): string {
  const t = Math.round(s);
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
}

/** Un paso redondo en minutos para unas 4 marcas: el más cercano a duración / 4. */
export function pasoDeTiempoMin(duracionS: number): number {
  const PASOS = [1, 2, 5, 10, 12, 15, 20, 30, 45, 60, 90, 120];
  const ideal = duracionS / 60 / 4;
  return PASOS.reduce((a, b) => (Math.abs(b - ideal) < Math.abs(a - ideal) ? b : a));
}

export interface EntradaGeometria {
  curva: CurvaGuardada;
  /** Inicio de la ventana del análisis (epoch ms). */
  ventanaInicioMs: number;
  /** Duración de la ventana en segundos. Si falta, la de la curva (último seg + paso, corregido). */
  duracionS?: number;
  zonas?: Partial<Record<ZonaFC, { min: number; max: number }>>;
  ancho?: number;   // default 340
  alto?: number;    // default 140
}

const r1 = (n: number): number => Math.round(n * 10) / 10;

export function geometriaCurva(e: EntradaGeometria): GeometriaCurva | null {
  const { curva, zonas } = e;
  const n = Math.min(curva.seg.length, curva.fc.length);
  if (n === 0) return null;

  const ancho = e.ancho ?? ANCHO_DEFECTO;
  const alto = e.alto ?? ALTO_DEFECTO;
  const desplazamientoS = Math.round((curva.origenMs - e.ventanaInicioMs) / 1000);
  const paso = curva.pasoSeg > 0 ? curva.pasoSeg : 30;

  // Puntos en segundos de la ventana, con FC finita.
  const puntos: { s: number; fc: number }[] = [];
  for (let i = 0; i < n; i++) {
    const s = curva.seg[i] + desplazamientoS;
    const fc = curva.fc[i];
    if (Number.isFinite(s) && Number.isFinite(fc)) puntos.push({ s, fc });
  }
  if (puntos.length === 0) return null;

  const duracionS = e.duracionS !== undefined && e.duracionS > 0
    ? e.duracionS
    : Math.max(1, puntos[puntos.length - 1].s + paso);

  // Eje Y.
  let minFc = Math.min(...puntos.map((p) => p.fc));
  let maxFc = Math.max(...puntos.map((p) => p.fc));
  if (zonas?.Z1) minFc = Math.min(minFc, zonas.Z1.min);
  if (zonas?.Z5) maxFc = Math.max(maxFc, zonas.Z5.max);
  const fcMin = Math.floor((minFc - AIRE_BPM) / 5) * 5;
  const fcMax = Math.ceil((maxFc + AIRE_BPM) / 5) * 5;

  const x = (seg: number): number => r1((seg / duracionS) * ancho);
  const y = (fc: number): number => r1(alto - ((fc - fcMin) / (fcMax - fcMin)) * alto);

  // Segmentos: fuera de la ventana no se dibuja; un hueco corta.
  const dentro = puntos.filter((p) => p.s >= 0 && p.s <= duracionS);
  const segmentos: string[] = [];
  let actual: { s: number; fc: number }[] = [];
  const cerrar = (): void => {
    if (actual.length === 0) return;
    const trozos = actual.map((p, i) => `${i === 0 ? "M" : "L"} ${x(p.s)} ${y(p.fc)}`);
    // Un punto solo: se repite para que el trazo con cabo redondo deje un punto.
    if (actual.length === 1) trozos.push(`L ${x(actual[0].s)} ${y(actual[0].fc)}`);
    segmentos.push(trozos.join(" "));
    actual = [];
  };
  for (const p of dentro) {
    const ult = actual[actual.length - 1];
    if (ult && p.s - ult.s > 2 * paso) cerrar();
    actual.push(p);
  }
  cerrar();

  // Bandas: cada zona recortada al eje Y; si queda fuera del eje, no se pinta.
  const bandas: GeometriaCurva["bandas"] = [];
  for (const z of ZONAS_FC) {
    const r = zonas?.[z];
    if (!r) continue;
    const arriba = Math.min(r.max, fcMax);
    const abajo = Math.max(r.min, fcMin);
    if (arriba <= abajo) continue;
    const yArriba = y(arriba);
    bandas.push({ zona: z, y: yArriba, alto: r1(y(abajo) - yArriba) });
  }

  // P109: la curva por zona. Se corta en los huecos (como los segmentos) y
  // donde cambia la zona; el punto del cambio queda en los dos tramos.
  const tramos: GeometriaCurva["tramos"] = [];
  let tramo: { zona: ZonaFC | null; ps: { s: number; fc: number }[] } | null = null;
  const cerrarTramo = (): void => {
    if (tramo && tramo.ps.length > 0) {
      const ps = tramo.ps.length === 1 ? [tramo.ps[0], tramo.ps[0]] : tramo.ps;
      tramos.push({ zona: tramo.zona, puntos: ps.map((p) => `${x(p.s)},${y(p.fc)}`).join(" ") });
    }
    tramo = null;
  };
  let previo: { s: number; fc: number } | null = null;
  for (const p of dentro) {
    const z = zonaDe(p.fc, zonas);
    if (previo && p.s - previo.s > 2 * paso) { cerrarTramo(); previo = null; }
    if (!tramo) tramo = { zona: z, ps: [] };
    else if (tramo.zona !== z) {
      tramo.ps.push(p);
      cerrarTramo();
      tramo = { zona: z, ps: [] };
    }
    tramo.ps.push(p);
    previo = p;
  }
  cerrarTramo();

  // Las guías: los pisos de cada zona y el techo de Z5, si caen en el eje.
  const valores = new Set<number>();
  for (const z of ZONAS_FC) if (zonas?.[z]) valores.add(zonas[z]!.min);
  if (zonas?.Z5) valores.add(zonas.Z5.max);
  const guias = [...valores]
    .filter((fc) => fc >= fcMin && fc <= fcMax)
    .sort((a, b) => b - a)
    .map((fc) => ({ fc, y: y(fc) }));

  // El eje de tiempo: múltiplos de un paso redondo, sin pisar la duración del final.
  const pasoS = pasoDeTiempoMin(duracionS) * 60;
  const marcasTiempo: GeometriaCurva["marcasTiempo"] = [];
  for (let s = 0; s < duracionS - pasoS * 0.4; s += pasoS) marcasTiempo.push({ x: x(s), texto: mmss(s) });
  marcasTiempo.push({ x: x(duracionS), texto: mmss(duracionS) });

  const punto = (seg: number): { x: number; y: number } | null => {
    let mejor: { s: number; fc: number } | null = null;
    for (const p of dentro) if (!mejor || Math.abs(p.s - seg) < Math.abs(mejor.s - seg)) mejor = p;
    if (!mejor || Math.abs(mejor.s - seg) > 2 * paso) return null;
    return { x: x(mejor.s), y: y(mejor.fc) };
  };

  return { ancho, alto, duracionS, fcMin, fcMax, x, y, segmentos, bandas, tramos, guias, marcasTiempo, punto };
}

// ── Marcas ───────────────────────────────────────────────────────────────────

export interface MarcaDibujable {
  /** "app" sólida; "analisis" con borde punteado y la etiqueta «análisis». */
  origen: "app" | "analisis";
  /** El id de la marca de la app (en las del análisis con refMarca, el id al que apuntan). */
  idMarca?: string;
  /** Índice en `marcasAnalisis`, para las del análisis. */
  indiceAnalisis?: number;
  tipo: "tramo" | "momento";
  inicioS: number; finS: number;
  /** El texto que se muestra al tocarla. */
  texto: string;
  tono?: "positivo" | "atencion";
}

/** Recorta a [0, duracionS]; null si lo que queda es vacío (un tramo sin ancho, o un momento afuera). */
function recortar(
  inicioS: number, finS: number, duracionS: number,
): { inicioS: number; finS: number; tipo: "tramo" | "momento" } | null {
  if (!Number.isFinite(inicioS) || !Number.isFinite(finS)) return null;
  const a = Math.min(inicioS, finS);
  const b = Math.max(inicioS, finS);
  const momento = a === b;
  const ini = Math.max(0, a);
  const fin = Math.min(duracionS, b);
  if (momento) return a < 0 || a > duracionS ? null : { inicioS: a, finS: a, tipo: "momento" };
  if (fin <= ini) return null;
  return { inicioS: ini, finS: fin, tipo: "tramo" };
}

/**
 * Lo que se dibuja sobre la curva: las marcas de la app con tramo, y las del
 * análisis (con refMarca → el tramo de ESA marca de la app; con tramo propio →
 * el suyo). Una marca del análisis con refMarca a una marca sin tramo, o
 * inexistente, no se dibuja. Primero van las de la app, después las del análisis.
 */
export function marcasDibujables(
  marcasApp: MarcaSesion[],
  marcasAnalisis: MarcaAnalisis[] | undefined,
  textoApp: (m: MarcaSesion) => string,
  duracionS: number,
): MarcaDibujable[] {
  const salida: MarcaDibujable[] = [];

  for (const m of marcasApp) {
    if (!m.tramo) continue;
    const t = recortar(m.tramo.inicioS, m.tramo.finS, duracionS);
    if (!t) continue;
    salida.push({ origen: "app", idMarca: m.id, texto: textoApp(m), ...t });
  }

  (marcasAnalisis ?? []).forEach((a, indiceAnalisis) => {
    let base: { inicioS: number; finS: number } | undefined;
    let idMarca: string | undefined;
    if (a.refMarca) {
      const ref = marcasApp.find((m) => m.id === a.refMarca);
      if (!ref?.tramo) return;
      base = ref.tramo;
      idMarca = ref.id;
    } else if (a.tramo) {
      base = a.tramo;
    } else {
      return;
    }
    const t = recortar(base.inicioS, base.finS, duracionS);
    if (!t) return;
    salida.push({
      origen: "analisis",
      ...(idMarca !== undefined ? { idMarca } : {}),
      indiceAnalisis,
      texto: a.texto,
      tono: a.tono,
      ...t,
    });
  });

  return salida;
}
