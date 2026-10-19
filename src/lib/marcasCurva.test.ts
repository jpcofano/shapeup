import { describe, expect, it } from "vitest";
import type { LiveDataPoint } from "../import/samsungLiveData";
import type { MarcaSesion } from "../types/models";
import { IDS_MARCA } from "../types/models";
import { picoSuavizado } from "./curvaSuavizada";
import { curvaGuardadaDe, marcasDeCurva, suavizarCurva } from "./marcasCurva";
import { zonasDesdeFcMax } from "./zonas";
import { APP, CURVA, SESION_SAMSUNG } from "./__fixtures__/sesionTestigo20260927";

const T0 = 1_000_000_000_000;
const ZONAS = { Z3: { min: 120, max: 139 }, Z4: { min: 140, max: 159 }, Z5: { min: 160, max: 180 } };

/** Curva de 1 muestra por segundo: cada tramo es [segundos, fc]. */
function gen(tramos: [number, number][], inicio = T0): LiveDataPoint[] {
  const out: LiveDataPoint[] = [];
  let ms = inicio;
  for (const [dur, fc] of tramos) {
    for (let i = 0; i < dur; i++) { out.push({ ms, fc }); ms += 1000; }
  }
  return out;
}
const ventanaDe = (c: LiveDataPoint[]) => ({ inicioMs: c[0].ms, finMs: c[c.length - 1].ms });
function marcas(c: LiveDataPoint[], extra: Partial<Parameters<typeof marcasDeCurva>[0]> = {}) {
  return marcasDeCurva({ curva: c, ventana: ventanaDe(c), zonas: ZONAS, ...extra });
}
function de<I extends MarcaSesion["id"]>(ms: MarcaSesion[], id: I) {
  return ms.find((m) => m.id === id) as Extract<MarcaSesion, { id: I }> | undefined;
}

function sinUndefined(v: unknown, ruta = "$"): void {
  if (Array.isArray(v)) v.forEach((x, i) => sinUndefined(x, `${ruta}[${i}]`));
  else if (v && typeof v === "object") {
    for (const [k, x] of Object.entries(v)) {
      expect(x, `${ruta}.${k}`).not.toBeUndefined();
      sinUndefined(x, `${ruta}.${k}`);
    }
  }
}

describe("marcasDeCurva — casos vacíos", () => {
  it("sin zonas o sin curva en la ventana: []", () => {
    const c = gen([[100, 150]]);
    expect(marcasDeCurva({ curva: c, ventana: ventanaDe(c), zonas: undefined })).toEqual([]);
    expect(marcasDeCurva({ curva: [], ventana: { inicioMs: T0, finMs: T0 + 1000 }, zonas: ZONAS })).toEqual([]);
    expect(marcasDeCurva({ curva: c, ventana: { inicioMs: T0 + 1e6, finMs: T0 + 2e6 }, zonas: ZONAS })).toEqual([]);
  });

  it("nunca llega a Z4: sin entrada, sin tramo sostenido, sin tramoBajo; el pico sí", () => {
    const c = gen([[120, 130]]);
    const ms = marcas(c);
    expect(de(ms, "entradaEnCalor")).toBeUndefined();
    expect(de(ms, "tramoSostenido")).toBeUndefined();
    expect(de(ms, "tramoBajo")).toBeUndefined();
    expect(de(ms, "recuperacionSeries")).toBeUndefined();
    expect(de(ms, "pico")).toMatchObject({ suavizado: 130, crudo: 130 });
    expect(de(ms, "mitades")).toBeDefined();
  });
});

describe("entradaEnCalor", () => {
  it("primer instante suavizado en Z4: segundos y tramo {0, segundos}", () => {
    const c = gen([[30, 100], [100, 150]]);
    const m = de(marcas(c), "entradaEnCalor")!;
    // la media móvil de 5 s llega a 140 unas muestras después del salto
    expect(m.segundos).toBeGreaterThanOrEqual(30);
    expect(m.segundos).toBeLessThanOrEqual(34);
    expect(m.tramo).toEqual({ inicioS: 0, finS: m.segundos });
  });
});

describe("tramoSostenido", () => {
  it("salir 10 s del umbral no corta; salir 11 s corta", () => {
    // 9 muestras fuera: hueco entre dentros = 10 s -> no corta
    const sinCorte = gen([[70, 150], [9, 100], [70, 150]]);
    expect(de(marcas(sinCorte), "tramoSostenido")!.duracionSeg).toBe(70 + 9 + 70 - 1);
    // 10 muestras fuera: 11 s -> corta; queda el más largo (70 s de 69 s de span)
    const conCorte = gen([[70, 150], [10, 100], [60, 150]]);
    const m = de(marcas(conCorte), "tramoSostenido")!;
    expect(m.duracionSeg).toBe(69);
    expect(m.tramo).toEqual({ inicioS: 0, finS: 69 });
  });

  it("mínimo de 60 s: 61 muestras (60 s de span) entra, 60 muestras no", () => {
    expect(de(marcas(gen([[30, 100], [61, 150], [30, 100]])), "tramoSostenido")!.duracionSeg).toBe(60);
    expect(de(marcas(gen([[30, 100], [60, 150], [30, 100]])), "tramoSostenido")).toBeUndefined();
  });
});

describe("tramoBajo", () => {
  it("solo después de la entrada en calor", () => {
    // arranca bajo (no cuenta), entra en calor, después baja de Z3 90 s
    const c = gen([[120, 100], [60, 150], [90, 100]]);
    const m = de(marcas(c), "tramoBajo")!;
    expect(m.duracionSeg).toBe(89);
    expect(m.tramo!.inicioS).toBe(180);
  });

  it("sin entrada en calor no hay tramoBajo", () => {
    expect(de(marcas(gen([[200, 100]])), "tramoBajo")).toBeUndefined();
  });
});

describe("mitades", () => {
  it("parte desde la entrada en calor y redondea a 1 decimal", () => {
    const c = gen([[60, 100], [100, 150], [100, 160]]);
    const m = de(marcas(c), "mitades")!;
    expect(m.primera).toBeLessThan(m.segunda);
    expect(m.diferencia).toBe(Math.round((m.segunda - m.primera) * 10) / 10);
    expect(m.tramo).toBeUndefined();
  });
});

describe("recuperacionSeries", () => {
  it("una bajada que cuenta, con caída a 60 y 120 s y la mayor", () => {
    const c = gen([[30, 100], [30, 170], [200, 120]]);
    const m = de(marcas(c), "recuperacionSeries")!;
    expect(m.bajadas).toHaveLength(1);
    expect(m.bajadas[0].pico).toBe(170);
    expect(m.bajadas[0].caida60).toBe(50);
    expect(m.bajadas[0].caida120).toBe(50);
    expect(m.mayor).toMatchObject({ caida: 50, enSeg: 60 });
    expect(m.tramo).toEqual({ inicioS: m.mayor!.picoS, finS: m.mayor!.picoS + 60 });
  });

  it("caída null si ya no hay curva (fin de la ventana)", () => {
    const c = gen([[30, 100], [30, 170], [90, 120]]);
    const m = de(marcas(c), "recuperacionSeries")!;
    expect(m.bajadas[0].caida60).toBe(50);
    expect(m.bajadas[0].caida120).toBeNull();
  });

  it("una caída de menos de 15 bpm no cuenta", () => {
    const c = gen([[30, 100], [30, 165], [200, 155]]);
    expect(de(marcas(c), "recuperacionSeries")).toBeUndefined();
  });

  it("las pausas entran solo con 2 o más series", () => {
    const c = gen([[200, 100]]);
    const bloques = [
      { orden: 1, series: [{ serie: 1, completada: true, recuperacionBpm: 20 }] },
      { orden: 2, series: [
        { serie: 1, completada: true, recuperacionBpm: 18 },
        { serie: 2, completada: true },
      ] },
    ];
    const m = de(marcas(c, { bloques }), "recuperacionSeries")!;
    expect(m.bajadas).toEqual([]);
    expect(m.mayor).toBeNull();
    expect(m.tramo).toBeUndefined();
    expect(m.pausas).toEqual([{ orden: 2, serie: 1, bpm: 18 }]);
  });
});

describe("picosZ5", () => {
  it("cuenta las corridas de al menos 10 s y devuelve la más larga", () => {
    const c = gen([[30, 130], [40, 170], [60, 130], [20, 170], [60, 130], [3, 170], [60, 130]]);
    const m = de(marcas(c), "picosZ5")!;
    expect(m.entradas).toBe(2);
    expect(m.masLargaSeg).toBeGreaterThanOrEqual(36);
    expect(m.masLargaSeg).toBeLessThanOrEqual(42);
  });

  it("sin ninguna de 10 s, no hay marca", () => {
    expect(de(marcas(gen([[60, 130], [3, 170], [60, 130]])), "picosZ5")).toBeUndefined();
  });
});

describe("pico / picoSobreVigente", () => {
  const c = gen([[60, 130], [30, 170], [60, 130]]);
  it("suavizado igual a picoSuavizado", () => {
    const m = de(marcas(c), "pico")!;
    expect(m.suavizado).toBe(picoSuavizado(c));
  });
  it("en el borde (suavizado == fcMaxUsada) es pico; arriba, picoSobreVigente; nunca los dos", () => {
    const borde = marcas(c, { fcMaxUsada: 170 });
    expect(de(borde, "pico")).toBeDefined();
    expect(de(borde, "picoSobreVigente")).toBeUndefined();
    const sobre = marcas(c, { fcMaxUsada: 169 });
    expect(de(sobre, "pico")).toBeUndefined();
    expect(de(sobre, "picoSobreVigente")).toMatchObject({ nivel: 1, suavizado: 170, crudo: 170, fcMaxVigente: 169 });
  });
  it("el tramo es el momento del máximo", () => {
    const t = de(marcas(c), "pico")!.tramo!;
    expect(t.inicioS).toBe(t.finS);
  });
});

describe("generales", () => {
  it("salen en el orden de IDS_MARCA y sin claves undefined", () => {
    const c = gen([[30, 100], [60, 170], [130, 120], [60, 170], [100, 110]]);
    const ms = marcas(c, {
      fcMaxUsada: 165,
      bloques: [{ orden: 1, series: [
        { serie: 1, completada: true, recuperacionBpm: 12 },
        { serie: 2, completada: true, recuperacionBpm: 14 },
      ] }],
    });
    expect(ms.length).toBeGreaterThan(5);
    const idx = ms.map((m) => IDS_MARCA.indexOf(m.id));
    expect(idx).toEqual([...idx].sort((a, b) => a - b));
    sinUndefined(ms);
  });

  it("suavizarCurva: menos de 4 muestras queda con el valor crudo", () => {
    const s = suavizarCurva([{ ms: 0, fc: 100 }, { ms: 1000, fc: 110 }]);
    expect(s.map((p) => p.fc)).toEqual([100, 110]);
  });

  it("curvaGuardadaDe: null sin puntos", () => {
    expect(curvaGuardadaDe([], { inicioMs: 0, finMs: 1000 })).toBeNull();
  });
});

describe("sesión testigo del 27/09", () => {
  const ventana = { inicioMs: APP.inicioMs, finMs: SESION_SAMSUNG.endMs };
  const ms = marcasDeCurva({ curva: CURVA, ventana, zonas: zonasDesdeFcMax(169), fcMaxUsada: 169 });
  const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  it("entradaEnCalor 8:51", () => {
    expect(de(ms, "entradaEnCalor")!.segundos).toBe(531);
  });
  it("tramoSostenido 30:06 → 48:02, 17:56 ±1 s", () => {
    const m = de(ms, "tramoSostenido")!;
    expect(m.tramo).toEqual({ inicioS: 1806, finS: 2882 });
    expect(Math.abs(m.duracionSeg - 1076)).toBeLessThanOrEqual(1);
  });
  it("tramoBajo no aparece", () => {
    expect(de(ms, "tramoBajo")).toBeUndefined();
  });
  it("mitades", () => {
    const m = de(ms, "mitades")!;
    expect(m.primera).toBe(140.0);
    expect(m.segunda).toBe(145.5);
    expect(m.diferencia).toBe(5.5);
    expect(Math.abs(m.corteS - 1734)).toBeLessThanOrEqual(1);
  });
  it("recuperacionSeries: 5 bajadas, la mayor −30 a los 60 s", () => {
    const m = de(ms, "recuperacionSeries")!;
    expect(m.bajadas).toHaveLength(5);
    const esperados = [10 * 60 + 9, 23 * 60 + 24, 26 * 60 + 49, 37 * 60 + 49, 47 * 60 + 33];
    m.bajadas.forEach((b, i) => expect(Math.abs(b.picoS - esperados[i]), mmss(b.picoS)).toBeLessThanOrEqual(2));
    expect(m.mayor).toMatchObject({ caida: 30, enSeg: 60 });
    expect(Math.abs(m.mayor!.picoS - esperados[4])).toBeLessThanOrEqual(2);
    expect(m.bajadas[4].caida120).toBeNull();
  });
  it("picosZ5: 5 entradas, la más larga 67 s desde ~37:08", () => {
    const m = de(ms, "picosZ5")!;
    expect(m.entradas).toBe(5);
    expect(m.masLargaSeg).toBe(67);
    expect(Math.abs(m.tramo!.inicioS - (37 * 60 + 8))).toBeLessThanOrEqual(2);
  });
  it("pico 169 / 170, no es picoSobreVigente", () => {
    expect(de(ms, "pico")).toMatchObject({ suavizado: 169, crudo: 170 });
    expect(de(ms, "picoSobreVigente")).toBeUndefined();
    const vent = CURVA.filter((p) => p.ms >= ventana.inicioMs && p.ms <= ventana.finMs);
    expect(de(ms, "pico")!.suavizado).toBe(picoSuavizado(vent));
  });
  it("sin undefined", () => sinUndefined(ms));
  it("curvaGuardadaDe", () => {
    const c = curvaGuardadaDe(CURVA, ventana)!;
    expect(c.pasoSeg).toBe(30);
    expect(c.seg[0]).toBe(60);
    expect(c.seg.length).toBe(c.fc.length);
    expect(c.seg.length).toBeGreaterThanOrEqual(91);
    expect(c.seg.length).toBeLessThanOrEqual(99);
  });
});
