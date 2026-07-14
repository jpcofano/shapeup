import { describe, it, expect } from "vitest";
import { serieTendencia, MIN_DATOS_DELTA_ANUAL, MIN_DATOS_CHIP, alcanzaMinimoChip } from "./tendencias";
import { lunesDeSemana } from "./semana";

const HOY = "2026-07-13";

function offsetDate(base: string, n: number): string {
  const d = new Date(base + "T12:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

// ── Bucketing por rango ───────────────────────────────────────────────────────

describe("serieTendencia — bucketing por rango", () => {
  it("'3m' bucketea diario (una fecha = un punto)", () => {
    const valores = [
      { fecha: offsetDate(HOY, -1), valor: 60 },
      { fecha: offsetDate(HOY, -2), valor: 62 },
    ];
    const s = serieTendencia(valores, "3m", HOY);
    expect(s.puntos).toHaveLength(2);
    expect(s.puntos.map((p) => p.fecha)).toEqual([offsetDate(HOY, -2), offsetDate(HOY, -1)]);
  });

  it("'1a' bucketea semanal (agrupa por lunes de la semana)", () => {
    // Dos fechas de la misma semana caen en el mismo bucket
    const valores = [
      { fecha: "2026-07-06", valor: 60 }, // lunes
      { fecha: "2026-07-08", valor: 64 }, // miércoles, misma semana
      { fecha: "2026-06-15", valor: 70 }, // otra semana
    ];
    const s = serieTendencia(valores, "1a", HOY);
    expect(s.puntos).toHaveLength(2);
    const bucketJulio = s.puntos.find((p) => p.fecha === lunesDeSemana("2026-07-06"));
    expect(bucketJulio?.valor).toBe(62); // mediana(60,64)
    expect(bucketJulio?.min).toBe(60);
    expect(bucketJulio?.max).toBe(64);
  });

  it("'5a' y 'todo' bucketean mensual (agrupa por mes)", () => {
    const valores = [
      { fecha: "2026-07-01", valor: 60 },
      { fecha: "2026-07-10", valor: 70 },
      { fecha: "2026-06-15", valor: 50 },
    ];
    for (const rango of ["5a", "todo"] as const) {
      const s = serieTendencia(valores, rango, HOY);
      expect(s.puntos).toHaveLength(2);
      const bucketJulio = s.puntos.find((p) => p.fecha === "2026-07-01");
      expect(bucketJulio?.valor).toBe(65); // mediana(60,70)
    }
  });

  it("orden cronológico ascendente en los puntos", () => {
    const valores = [
      { fecha: offsetDate(HOY, -1), valor: 1 },
      { fecha: offsetDate(HOY, -30), valor: 2 },
      { fecha: offsetDate(HOY, -10), valor: 3 },
    ];
    const s = serieTendencia(valores, "3m", HOY);
    const fechas = s.puntos.map((p) => p.fecha);
    expect(fechas).toEqual([...fechas].sort());
  });

  it("un bucket con una sola lectura no lleva min/max (no hay banda)", () => {
    const s = serieTendencia([{ fecha: offsetDate(HOY, -1), valor: 60 }], "3m", HOY);
    expect(s.puntos[0].min).toBeUndefined();
    expect(s.puntos[0].max).toBeUndefined();
  });

  it("huecos no se interpolan: bucket sin lecturas simplemente no existe", () => {
    // Dejamos un hueco de una semana entera sin datos
    const valores = [
      { fecha: "2026-01-01", valor: 10 },
      { fecha: "2026-03-01", valor: 20 },
    ];
    const s = serieTendencia(valores, "5a", HOY);
    expect(s.puntos).toHaveLength(2); // no hay puntos "fantasma" para enero/febrero intermedios
  });

  it("respeta el corte de rango (3m no incluye datos de hace 6 meses)", () => {
    const valores = [
      { fecha: offsetDate(HOY, -10), valor: 60 },
      { fecha: offsetDate(HOY, -180), valor: 90 },
    ];
    const s = serieTendencia(valores, "3m", HOY);
    expect(s.puntos).toHaveLength(1);
    expect(s.puntos[0].valor).toBe(60);
  });

  it("'todo' no filtra por fecha (incluye datos de hace 10 años)", () => {
    const valores = [
      { fecha: "2015-11-22", valor: 60 },
      { fecha: offsetDate(HOY, -1), valor: 70 },
    ];
    const s = serieTendencia(valores, "todo", HOY);
    expect(s.puntos).toHaveLength(2);
  });

  it("serie vacía → puntos vacíos, actual/haceUnAnio/deltaAnualPct undefined", () => {
    const s = serieTendencia([], "1a", HOY);
    expect(s.puntos).toEqual([]);
    expect(s.actual).toBeUndefined();
    expect(s.haceUnAnio).toBeUndefined();
    expect(s.deltaAnualPct).toBeUndefined();
  });

  it("no cuenta lecturas con fecha futura respecto a 'hoy'", () => {
    const valores = [
      { fecha: offsetDate(HOY, 5), valor: 999 },
      { fecha: offsetDate(HOY, -1), valor: 60 },
    ];
    const s = serieTendencia(valores, "3m", HOY);
    expect(s.puntos).toHaveLength(1);
    expect(s.puntos[0].valor).toBe(60);
  });
});

// ── actual / haceUnAnio / deltaAnualPct ───────────────────────────────────────

describe("serieTendencia — actual, haceUnAnio y deltaAnualPct", () => {
  it("'actual' es la mediana de las últimas 7 lecturas con dato", () => {
    const valores = Array.from({ length: 7 }, (_, i) => ({ fecha: offsetDate(HOY, -(i + 1)), valor: 60 + i }));
    const s = serieTendencia(valores, "1a", HOY);
    expect(s.actual).toBe(mediana7(valores.map((v) => v.valor)));
  });

  function mediana7(nums: number[]): number {
    const sorted = [...nums].sort((a, b) => a - b);
    return sorted[3]; // 7 elementos → mediana es el del medio
  }

  it("deltaAnualPct se computa cuando ambas ventanas tienen ≥ 5 datos", () => {
    const actualVals = Array.from({ length: 7 }, (_, i) => ({ fecha: offsetDate(HOY, -(i + 1)), valor: 66 }));
    const haceUnAnioVals = Array.from({ length: 6 }, (_, i) => ({
      fecha: offsetDate(HOY, -365 + (i - 3)), valor: 71,
    }));
    const s = serieTendencia([...actualVals, ...haceUnAnioVals], "5a", HOY);
    expect(s.actual).toBe(66);
    expect(s.haceUnAnio).toBe(71);
    expect(s.deltaAnualPct).toBeCloseTo((66 - 71) / 71, 5);
  });

  it("sin deltaAnualPct si la ventana 'hace un año' tiene < 5 datos", () => {
    const actualVals = Array.from({ length: 7 }, (_, i) => ({ fecha: offsetDate(HOY, -(i + 1)), valor: 66 }));
    const haceUnAnioVals = Array.from({ length: 4 }, (_, i) => ({ fecha: offsetDate(HOY, -365 + i), valor: 71 }));
    const s = serieTendencia([...actualVals, ...haceUnAnioVals], "5a", HOY);
    expect(s.haceUnAnio).toBe(71); // sí se calcula el valor
    expect(s.deltaAnualPct).toBeUndefined(); // pero no el delta (no alcanza MIN_DATOS_DELTA_ANUAL)
  });

  it("sin deltaAnualPct si la ventana 'actual' tiene < 5 datos", () => {
    const actualVals = Array.from({ length: 3 }, (_, i) => ({ fecha: offsetDate(HOY, -(i + 1)), valor: 66 }));
    const haceUnAnioVals = Array.from({ length: 7 }, (_, i) => ({ fecha: offsetDate(HOY, -365 + i), valor: 71 }));
    const s = serieTendencia([...actualVals, ...haceUnAnioVals], "5a", HOY);
    expect(s.actual).toBeDefined(); // hay mediana con las 3 que hay
    expect(s.haceUnAnio).toBe(71);  // esa ventana sí llega a 5+
    expect(s.deltaAnualPct).toBeUndefined(); // pero "actual" no alcanza el mínimo
  });

  it("'actual' no busca más allá de 90 días: sin lecturas recientes, queda undefined", () => {
    const soloViejas = Array.from({ length: 7 }, (_, i) => ({ fecha: offsetDate(HOY, -200 - i), valor: 66 }));
    const s = serieTendencia(soloViejas, "5a", HOY);
    expect(s.actual).toBeUndefined();
  });

  it("sin datos hace un año → haceUnAnio y deltaAnualPct ambos undefined", () => {
    const valores = Array.from({ length: 7 }, (_, i) => ({ fecha: offsetDate(HOY, -(i + 1)), valor: 66 }));
    const s = serieTendencia(valores, "1a", HOY);
    expect(s.actual).toBeDefined();
    expect(s.haceUnAnio).toBeUndefined();
    expect(s.deltaAnualPct).toBeUndefined();
  });

  it("MIN_DATOS_DELTA_ANUAL es 5", () => {
    expect(MIN_DATOS_DELTA_ANUAL).toBe(5);
  });
});

// ── Chips: mínimo de datos para aparecer como métrica seleccionable ──────────

describe("alcanzaMinimoChip", () => {
  it("MIN_DATOS_CHIP es 10", () => {
    expect(MIN_DATOS_CHIP).toBe(10);
  });

  it("9 datos no alcanza, la métrica no aparece como chip", () => {
    expect(alcanzaMinimoChip(9)).toBe(false);
  });

  it("10 datos sí alcanza", () => {
    expect(alcanzaMinimoChip(10)).toBe(true);
  });
});

// ── Presión: series independientes, sin mezclar fechas ────────────────────────

describe("serieTendencia — uso con presión (sistólica/diastólica como series independientes)", () => {
  it("cada serie (sistólica, diastólica) bucketea sus propias fechas sin mezclarse entre sí", () => {
    const sistolica = [
      { fecha: "2026-07-01", valor: 120 },
      { fecha: "2026-06-01", valor: 118 },
    ];
    const diastolica = [
      { fecha: "2026-07-01", valor: 80 },
      // la diastólica no tiene lectura en junio — no debe "heredar" la de sistólica
    ];
    const sSis = serieTendencia(sistolica, "5a", HOY);
    const sDia = serieTendencia(diastolica, "5a", HOY);
    expect(sSis.puntos).toHaveLength(2);
    expect(sDia.puntos).toHaveLength(1);
    expect(sDia.puntos[0].valor).toBe(80);
  });
});
