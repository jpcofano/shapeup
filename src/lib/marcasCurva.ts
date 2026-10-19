// ════════════════════════════════════════════════════════════════════════════
//  lib/marcasCurva.ts — las marcas que salen de la curva fina (P99).
//
//  Catálogo en docs/ANALISIS-ASISTIDO.md §3. Esto es lo MEDIDO, en números:
//  ninguna marca interpreta (ADR #044). Se calcula al enriquecer, con la curva
//  de 1 muestra por segundo en memoria, y se guarda en `biometria.marcas`; la
//  curva fina no se persiste (ADR #016), solo su resumen de 30 s.
//
//  El método:
//   1. Se recorta la curva a la ventana del análisis y se descartan las FC no
//      finitas.
//   2. Se arman dos series: la CRUDA (lo que midió el reloj) y la SUAVIZADA de
//      5 s (la misma media móvil hacia atrás de P97: para cada muestra, el
//      promedio de las que cayeron en los 5 s anteriores, ella incluida; con
//      menos de 4 queda con su valor crudo). Los umbrales de zona se miran
//      sobre la suavizada, salvo los tramos y las mitades, que miran la cruda
//      con tolerancia de huecos.
//   3. Las zonas son las GUARDADAS en la sesión, nunca las vigentes: la
//      historia no se reescribe (P97).
//   4. Todos los tiempos salen en segundos ENTEROS desde `ventana.inicioMs`,
//      la misma escala que la curva del paquete. Ninguna clave sale con valor
//      `undefined`: Firestore no la acepta, se omite.
//
//  Puro (ADR #009).
// ════════════════════════════════════════════════════════════════════════════
import type { LiveDataPoint } from "../import/samsungLiveData";
import type {
  BajadaCurva, BloqueRegistro, CurvaGuardada, MarcaSesion, TramoMarca, ZonaFC,
} from "../types/models";
import { IDS_MARCA } from "../types/models";
import { PASO_CURVA_MS } from "./analisis";
import { MIN_MUESTRAS_SUAVIZADO, VENTANA_SUAVIZADO_MS } from "./curvaSuavizada";
import { submuestrear } from "./paqueteAnalisis";

// ── Constantes ───────────────────────────────────────────────────────────────

/**
 * Cuánto puede salir del umbral un tramo sin cortarse. El sensor pierde un
 * par de muestras o la FC cabecea un instante por debajo; 10 s deja pasar eso
 * y todavía corta un descanso de verdad. Se mide entre la última muestra
 * dentro y la siguiente dentro: más de 10 s corta, 10 s o menos no.
 */
export const TOLERANCIA_TRAMO_MS = 10_000;
/** Un tramo de menos de un minuto es ruido, no una fase de la sesión. */
export const MIN_TRAMO_MS = 60_000;
/**
 * La caída mínima, en bpm, para que una bajada cuente. Debajo de eso el
 * cabeceo normal de la curva se confunde con recuperación.
 */
export const CAIDA_MINIMA_BPM = 15;
/**
 * Para ser pico, nadie más alto a ±60 s: es la escala de la recuperación que
 * se mide después (60 y 120 s), y evita contar cada rebote de un mismo esfuerzo.
 */
export const VECINDAD_PICO_MS = 60_000;
/**
 * La caída se mide contra la media de ±2,5 s alrededor del instante (una
 * ventana de 5 s, como el suavizado): una sola muestra suelta no la mueve.
 */
export const MEDIA_ALREDEDOR_MS = 2_500;
/**
 * Una entrada a Z5 cuenta si dura al menos 10 s: un roce de dos o tres
 * muestras no es un esfuerzo máximo sostenido.
 */
export const MIN_ENTRADA_Z5_MS = 10_000;

// ── La curva resumida ────────────────────────────────────────────────────────

/**
 * La curva resumida que se guarda en `biometria.curva`: submuestreada a
 * `PASO_CURVA_MS` desde el inicio de la ventana, en dos listas paralelas
 * (Firestore no guarda listas dentro de listas). `null` si no queda ningún punto.
 */
export function curvaGuardadaDe(
  curva: LiveDataPoint[],
  ventana: { inicioMs: number; finMs: number },
): CurvaGuardada | null {
  const puntos = submuestrear(curva, PASO_CURVA_MS, ventana.inicioMs, ventana.finMs);
  if (puntos.length === 0) return null;
  return {
    origenMs: ventana.inicioMs,
    pasoSeg: Math.round(PASO_CURVA_MS / 1000),
    seg: puntos.map((p) => p[0]),
    fc: puntos.map((p) => p[1]),
  };
}

// ── Suavizado ────────────────────────────────────────────────────────────────

interface PuntoSuave { ms: number; fc: number; ok: boolean }

function suavizarConFlag(pts: LiveDataPoint[]): PuntoSuave[] {
  const out: PuntoSuave[] = [];
  let desde = 0;
  let suma = 0;
  for (let i = 0; i < pts.length; i++) {
    suma += pts[i].fc;
    while (pts[i].ms - pts[desde].ms >= VENTANA_SUAVIZADO_MS) {
      suma -= pts[desde].fc;
      desde++;
    }
    const n = i - desde + 1;
    const ok = n >= MIN_MUESTRAS_SUAVIZADO;
    out.push({ ms: pts[i].ms, fc: ok ? suma / n : pts[i].fc, ok });
  }
  return out;
}

/**
 * La serie suavizada punto a punto: para cada muestra, el promedio de las que
 * cayeron en los 5 s anteriores (ella incluida); si hay menos de 4, la muestra
 * queda con su valor crudo. Sin redondear.
 */
export function suavizarCurva(curva: LiveDataPoint[]): LiveDataPoint[] {
  const pts = [...curva].filter((p) => Number.isFinite(p.fc)).sort((a, b) => a.ms - b.ms);
  return suavizarConFlag(pts).map(({ ms, fc }) => ({ ms, fc }));
}

// ── Tramos ───────────────────────────────────────────────────────────────────

/**
 * El tramo continuo más largo de `pts` que cumple `dentro`, con tolerancia de
 * huecos. Va de la primera a la última muestra dentro. `null` si el más largo
 * no llega a `MIN_TRAMO_MS`.
 */
function tramoMasLargo(
  pts: LiveDataPoint[], dentro: (fc: number) => boolean,
): { inicioMs: number; finMs: number } | null {
  let mejor: { inicioMs: number; finMs: number } | null = null;
  let actual: { inicioMs: number; finMs: number } | null = null;
  const cerrar = () => {
    if (actual && (!mejor || actual.finMs - actual.inicioMs > mejor.finMs - mejor.inicioMs)) mejor = actual;
    actual = null;
  };
  for (const p of pts) {
    if (!dentro(p.fc)) continue;
    if (actual && p.ms - actual.finMs > TOLERANCIA_TRAMO_MS) cerrar();
    if (actual) actual.finMs = p.ms;
    else actual = { inicioMs: p.ms, finMs: p.ms };
  }
  cerrar();
  const m = mejor as { inicioMs: number; finMs: number } | null;
  return m && m.finMs - m.inicioMs >= MIN_TRAMO_MS ? m : null;
}

// ── Las marcas ───────────────────────────────────────────────────────────────

export interface EntradaMarcasCurva {
  /** La curva fina (1/s). Se recorta acá a la ventana. */
  curva: LiveDataPoint[];
  ventana: { inicioMs: number; finMs: number };
  zonas: Partial<Record<ZonaFC, { min: number; max: number }>> | undefined;
  /** La FC máxima con que se calcularon las zonas (biometria.fcMaxUsada). */
  fcMaxUsada?: number;
  /** Los bloques de la sesión (ya enriquecidos), para las pausas entre series. */
  bloques?: Pick<BloqueRegistro, "orden" | "series">[];
}

/**
 * Las marcas de la curva, en el orden de `IDS_MARCA`. Sin curva en la ventana
 * o sin zonas: `[]`.
 */
export function marcasDeCurva(e: EntradaMarcasCurva): MarcaSesion[] {
  const { ventana, zonas } = e;
  if (!zonas) return [];
  const pts = e.curva
    .filter((p) => Number.isFinite(p.fc) && p.ms >= ventana.inicioMs && p.ms <= ventana.finMs)
    .sort((a, b) => a.ms - b.ms);
  if (pts.length === 0) return [];

  const seg = (ms: number) => Math.round((ms - ventana.inicioMs) / 1000);
  const tramoDe = (a: number, b: number): TramoMarca => ({ inicioS: seg(a), finS: seg(b) });
  const suav = suavizarConFlag(pts);
  const z3 = zonas.Z3?.min;
  const z4 = zonas.Z4?.min;
  const z5 = zonas.Z5?.min;
  const marcas: MarcaSesion[] = [];

  // 1. Entrada en calor: primer instante suavizado en Z4 o más.
  let entradaMs: number | null = null;
  if (z4 != null) {
    const p = suav.find((s) => s.fc >= z4);
    if (p) {
      entradaMs = p.ms;
      const segundos = seg(p.ms);
      marcas.push({ id: "entradaEnCalor", nivel: 2, segundos, tramo: { inicioS: 0, finS: segundos } });
    }
  }

  // 2. Tramo sostenido en Z4+ (cruda).
  if (z4 != null) {
    const t = tramoMasLargo(pts, (fc) => fc >= z4);
    if (t) {
      marcas.push({
        id: "tramoSostenido", nivel: 2,
        duracionSeg: Math.round((t.finMs - t.inicioMs) / 1000),
        tramo: tramoDe(t.inicioMs, t.finMs),
      });
    }
  }

  // 3. Tramo bajo (< Z3), solo después de la entrada en calor.
  if (z3 != null && entradaMs != null) {
    const t = tramoMasLargo(pts.filter((p) => p.ms >= entradaMs!), (fc) => fc < z3);
    if (t) {
      marcas.push({
        id: "tramoBajo", nivel: 2,
        duracionSeg: Math.round((t.finMs - t.inicioMs) / 1000),
        tramo: tramoDe(t.inicioMs, t.finMs),
      });
    }
  }

  // 4. Mitades, sin la entrada en calor.
  {
    const desde = entradaMs ?? ventana.inicioMs;
    const corte = desde + (ventana.finMs - desde) / 2;
    const a = pts.filter((p) => p.ms >= desde && p.ms < corte);
    const b = pts.filter((p) => p.ms >= corte && p.ms <= ventana.finMs);
    if (a.length > 0 && b.length > 0) {
      const media = (l: LiveDataPoint[]) => l.reduce((s, p) => s + p.fc, 0) / l.length;
      const r1 = (n: number) => Math.round(n * 10) / 10;
      const primera = r1(media(a));
      const segunda = r1(media(b));
      marcas.push({
        id: "mitades", nivel: 2, primera, segunda,
        diferencia: r1(media(b) - media(a)), corteS: seg(corte),
      });
    }
  }

  // 5. Recuperación entre series.
  {
    const bajadas: (BajadaCurva & { mejor: number; enSeg: 60 | 120 })[] = [];
    if (z4 != null) {
      let ultimoMs = -Infinity;
      for (let i = 0; i < suav.length; i++) {
        const s = suav[i];
        if (s.fc < z4) continue;
        let esPico = true;
        for (let j = i - 1; j >= 0 && s.ms - suav[j].ms <= VECINDAD_PICO_MS; j--) {
          if (suav[j].fc > s.fc) { esPico = false; break; }
        }
        for (let j = i + 1; esPico && j < suav.length && suav[j].ms - s.ms <= VECINDAD_PICO_MS; j++) {
          if (suav[j].fc > s.fc) esPico = false;
        }
        if (!esPico || s.ms - ultimoMs < VECINDAD_PICO_MS) continue;
        ultimoMs = s.ms;
        const caida = (dt: number): number | null => {
          const centro = s.ms + dt;
          const cerca = suav.filter((x) => Math.abs(x.ms - centro) <= MEDIA_ALREDEDOR_MS);
          if (cerca.length === 0) return null;
          return s.fc - cerca.reduce((acc, x) => acc + x.fc, 0) / cerca.length;
        };
        const c60 = caida(60_000);
        const c120 = caida(120_000);
        if ((c60 ?? -Infinity) < CAIDA_MINIMA_BPM && (c120 ?? -Infinity) < CAIDA_MINIMA_BPM) continue;
        const usa120 = (c120 ?? -Infinity) > (c60 ?? -Infinity);
        bajadas.push({
          picoS: seg(s.ms),
          pico: Math.round(s.fc),
          caida60: c60 == null ? null : Math.round(c60),
          caida120: c120 == null ? null : Math.round(c120),
          mejor: usa120 ? c120! : c60!,
          enSeg: usa120 ? 120 : 60,
        });
      }
    }
    const pausas: { orden: number; serie: number; bpm: number }[] = [];
    for (const b of e.bloques ?? []) {
      if (b.series.length < 2) continue;
      for (const s of b.series) {
        if (s.recuperacionBpm != null) pausas.push({ orden: b.orden, serie: s.serie, bpm: s.recuperacionBpm });
      }
    }
    if (bajadas.length > 0 || pausas.length > 0) {
      let mayor: { picoS: number; caida: number; enSeg: 60 | 120 } | null = null;
      let mayorMejor = -Infinity;
      for (const b of bajadas) {
        if (b.mejor > mayorMejor) {
          mayorMejor = b.mejor;
          mayor = { picoS: b.picoS, caida: Math.round(b.mejor), enSeg: b.enSeg };
        }
      }
      const limpias: BajadaCurva[] = bajadas.map(({ picoS, pico, caida60, caida120 }) => ({ picoS, pico, caida60, caida120 }));
      marcas.push({
        id: "recuperacionSeries", nivel: 2,
        bajadas: limpias, mayor, pausas,
        // Acotado a la ventana: la media de ±2,5 s puede mirar hasta 2,5 s después del fin.
        ...(mayor ? { tramo: {
          inicioS: mayor.picoS,
          finS: Math.min(mayor.picoS + mayor.enSeg, Math.round((e.ventana.finMs - e.ventana.inicioMs) / 1000)),
        } } : {}),
      });
    }
  }

  // 6. Picos en Z5: corridas maximales de la suavizada en Z5 o más.
  if (z5 != null) {
    let entradas = 0;
    let larga: { a: number; b: number } | null = null;
    let corrida: { a: number; b: number } | null = null;
    const cerrar = () => {
      if (corrida && corrida.b - corrida.a >= MIN_ENTRADA_Z5_MS) {
        entradas++;
        if (!larga || corrida.b - corrida.a > larga.b - larga.a) larga = corrida;
      }
      corrida = null;
    };
    for (const s of suav) {
      if (s.fc >= z5) {
        if (corrida) corrida.b = s.ms;
        else corrida = { a: s.ms, b: s.ms };
      } else cerrar();
    }
    cerrar();
    const l = larga as { a: number; b: number } | null;
    if (l) {
      marcas.push({
        id: "picosZ5", nivel: 2, entradas,
        masLargaSeg: Math.round((l.b - l.a) / 1000),
        tramo: tramoDe(l.a, l.b),
      });
    }
  }

  // 7. Pico: el máximo suavizado (solo ventanas con las muestras mínimas, como
  //    `picoSuavizado`) y el máximo crudo.
  {
    let max: PuntoSuave | null = null;
    for (const s of suav) if (s.ok && (!max || s.fc > max.fc)) max = s;
    if (max) {
      const suavizado = Math.round(max.fc);
      const crudo = Math.round(Math.max(...pts.map((p) => p.fc)));
      const tramo = tramoDe(max.ms, max.ms);
      if (e.fcMaxUsada != null && suavizado > e.fcMaxUsada) {
        marcas.push({ id: "picoSobreVigente", nivel: 1, suavizado, crudo, fcMaxVigente: e.fcMaxUsada, tramo });
      } else {
        marcas.push({ id: "pico", nivel: 2, suavizado, crudo, tramo });
      }
    }
  }

  return marcas.sort((a, b) => IDS_MARCA.indexOf(a.id) - IDS_MARCA.indexOf(b.id));
}
