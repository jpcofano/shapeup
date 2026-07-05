import { describe, it, expect } from "vitest";
import {
  calcularResumenSalud,
  senalPeor,
  UMBRAL_FC_REPOSO_ATENCION_BPM,
  UMBRAL_FC_REPOSO_ALERTA_BPM,
  MIN_DATOS_BASELINE,
} from "./resumenSalud";
import type { MetricaSalud, RegistroSueno, MedicionCorporal } from "../types/models";

// ── Helpers ───────────────────────────────────────────────────────────────────

const HOY = "2026-01-20";

function offsetDate(base: string, n: number): string {
  const d = new Date(base + "T12:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function mkFc(fecha: string, valor: number): MetricaSalud {
  return {
    idMetrica: `jp-fc-reposo-${fecha}`, miembro: "juanpablo",
    tipo: "fc-reposo", fecha, valor, unidad: "bpm",
    agregacion: "dia", fuente: "samsung-health-csv",
  };
}

function mkHrv(fecha: string, valor: number): MetricaSalud {
  return {
    idMetrica: `jp-hrv-${fecha}`, miembro: "juanpablo",
    tipo: "hrv", fecha, valor, unidad: "ms",
    agregacion: "dia", fuente: "samsung-health-csv",
  };
}

function mkPasos(fecha: string, valor: number): MetricaSalud {
  return {
    idMetrica: `jp-pasos-${fecha}`, miembro: "juanpablo",
    tipo: "pasos", fecha, valor,
    agregacion: "dia", fuente: "samsung-health-csv",
  };
}

function mkSueno(fecha: string, horas: number): RegistroSueno {
  return { idSueno: `SUE-${fecha}`, miembro: "juanpablo", fecha, horas, fuente: "samsung-health-csv" };
}

function mkMedicion(fecha: string, pesoKg: number): MedicionCorporal {
  return { idMedicion: `MED-${fecha}`, miembro: "juanpablo", fecha, pesoKg, fuente: "samsung-health-csv" };
}

/** 7 items en la ventana baseline (-35 a -8) con el mismo valor. */
function baselineFc(valor: number): MetricaSalud[] {
  return Array.from({ length: 7 }, (_, i) => mkFc(offsetDate(HOY, -35 + i * 3), valor));
}

function baselineHrv(valor: number): MetricaSalud[] {
  return Array.from({ length: 7 }, (_, i) => mkHrv(offsetDate(HOY, -35 + i * 3), valor));
}

function baselinePasos(valor: number): MetricaSalud[] {
  return Array.from({ length: 7 }, (_, i) => mkPasos(offsetDate(HOY, -35 + i * 3), valor));
}

function baselineSueno(valor: number): RegistroSueno[] {
  return Array.from({ length: 7 }, (_, i) => mkSueno(offsetDate(HOY, -35 + i * 3), valor));
}

function actualFc(valor: number): MetricaSalud[] {
  return [
    mkFc(offsetDate(HOY, -1), valor),
    mkFc(offsetDate(HOY, -2), valor),
    mkFc(offsetDate(HOY, -3), valor),
  ];
}

// ── Baseline ──────────────────────────────────────────────────────────────────

describe("calcularResumenSalud — baseline", () => {
  it("mediana correcta en ventana 8–35", () => {
    const items = [
      ...baselineFc(60),
      mkFc(offsetDate(HOY, -34), 50), // añade diversidad para mediana real
    ];
    const actual = actualFc(60);
    const senales = calcularResumenSalud([...actual, ...items], [], [], HOY);
    const fc = senales.find((s) => s.clave === "fc-reposo")!;
    expect(fc.baseline).toBeDefined();
    expect(fc.estado).not.toBe("sin-datos");
  });

  it("< 7 datos en ventana → sin-datos (valorActual presente si hay dato reciente)", () => {
    const escasos = Array.from({ length: MIN_DATOS_BASELINE - 1 }, (_, i) =>
      mkFc(offsetDate(HOY, -35 + i * 4), 60),
    );
    const actual = actualFc(65);
    const senales = calcularResumenSalud([...actual, ...escasos], [], [], HOY);
    const fc = senales.find((s) => s.clave === "fc-reposo")!;
    expect(fc.estado).toBe("sin-datos");
    expect(fc.valorActual).toBe(65);
  });

  it("datos con huecos (días sin métrica) no rompen la ventana", () => {
    const conHuecos = [
      mkFc(offsetDate(HOY, -35), 60), mkFc(offsetDate(HOY, -28), 62),
      mkFc(offsetDate(HOY, -21), 58), mkFc(offsetDate(HOY, -17), 61),
      mkFc(offsetDate(HOY, -14), 59), mkFc(offsetDate(HOY, -12), 63),
      mkFc(offsetDate(HOY, -10), 60),
    ];
    const actual = actualFc(60);
    const senales = calcularResumenSalud([...actual, ...conHuecos], [], [], HOY);
    const fc = senales.find((s) => s.clave === "fc-reposo")!;
    expect(fc.baseline).toBeDefined();
    expect(fc.estado).toBe("ok");
  });

  it("baseline exact: exactamente 7 datos → computa baseline", () => {
    const senales = calcularResumenSalud([...actualFc(60), ...baselineFc(60)], [], [], HOY);
    const fc = senales.find((s) => s.clave === "fc-reposo")!;
    expect(fc.baseline).toBe(60);
    expect(fc.estado).toBe("ok");
  });
});

// ── FC en reposo — umbrales exactos ──────────────────────────────────────────

describe("fc-reposo — umbrales", () => {
  it("+4.9 bpm → ok", () => {
    const senales = calcularResumenSalud(
      [...actualFc(60 + 4.9), ...baselineFc(60)], [], [], HOY,
    );
    expect(senales.find((s) => s.clave === "fc-reposo")!.estado).toBe("ok");
  });

  it(`+${UMBRAL_FC_REPOSO_ATENCION_BPM}.0 bpm → atencion`, () => {
    const senales = calcularResumenSalud(
      [...actualFc(60 + UMBRAL_FC_REPOSO_ATENCION_BPM), ...baselineFc(60)], [], [], HOY,
    );
    const fc = senales.find((s) => s.clave === "fc-reposo")!;
    expect(fc.estado).toBe("atencion");
    expect(fc.motivo).toContain(`+${UMBRAL_FC_REPOSO_ATENCION_BPM}.0`);
  });

  it(`+${UMBRAL_FC_REPOSO_ALERTA_BPM - 0.1} bpm → atencion (justo debajo de alerta)`, () => {
    const senales = calcularResumenSalud(
      [...actualFc(60 + UMBRAL_FC_REPOSO_ALERTA_BPM - 0.1), ...baselineFc(60)], [], [], HOY,
    );
    expect(senales.find((s) => s.clave === "fc-reposo")!.estado).toBe("atencion");
  });

  it(`+${UMBRAL_FC_REPOSO_ALERTA_BPM}.0 bpm → alerta`, () => {
    const senales = calcularResumenSalud(
      [...actualFc(60 + UMBRAL_FC_REPOSO_ALERTA_BPM), ...baselineFc(60)], [], [], HOY,
    );
    const fc = senales.find((s) => s.clave === "fc-reposo")!;
    expect(fc.estado).toBe("alerta");
    expect(fc.motivo).toContain(`+${UMBRAL_FC_REPOSO_ALERTA_BPM}.0`);
  });

  it("motivo contiene el valor concreto en bpm", () => {
    const senales = calcularResumenSalud(
      [...actualFc(60 + 6.5), ...baselineFc(60)], [], [], HOY,
    );
    const fc = senales.find((s) => s.clave === "fc-reposo")!;
    expect(fc.motivo).toContain("6.5");
  });
});

// ── Sueño — umbrales y baseline independiente ─────────────────────────────────

describe("sueno — umbrales", () => {
  it("< 5.5h → alerta (independiente del baseline)", () => {
    const reciente = [mkSueno(offsetDate(HOY, -1), 5.0), mkSueno(offsetDate(HOY, -2), 5.0), mkSueno(offsetDate(HOY, -3), 5.0)];
    // Baseline alto (durmiendo bien históricamente) → no importa
    const senales = calcularResumenSalud([], [...reciente, ...baselineSueno(8.0)], [], HOY);
    expect(senales.find((s) => s.clave === "sueno")!.estado).toBe("alerta");
  });

  it("5.5h ≤ x < 6.5h → atencion", () => {
    const reciente = [mkSueno(offsetDate(HOY, -1), 6.0), mkSueno(offsetDate(HOY, -2), 6.0), mkSueno(offsetDate(HOY, -3), 6.0)];
    const senales = calcularResumenSalud([], [...reciente, ...baselineSueno(8.0)], [], HOY);
    expect(senales.find((s) => s.clave === "sueno")!.estado).toBe("atencion");
  });

  it(">= 6.5h → ok aunque el baseline sea muy diferente", () => {
    const reciente = [mkSueno(offsetDate(HOY, -1), 7.0), mkSueno(offsetDate(HOY, -2), 7.0), mkSueno(offsetDate(HOY, -3), 7.0)];
    const senales = calcularResumenSalud([], [...reciente, ...baselineSueno(4.0)], [], HOY);
    expect(senales.find((s) => s.clave === "sueno")!.estado).toBe("ok");
  });

  it("promedio de 3 noches con una noche faltante (2 noches disponibles)", () => {
    const reciente = [
      mkSueno(offsetDate(HOY, -1), 7.0),
      mkSueno(offsetDate(HOY, -2), 8.0),
    ];
    const senales = calcularResumenSalud([], [...reciente, ...baselineSueno(7.5)], [], HOY);
    const s = senales.find((s) => s.clave === "sueno")!;
    expect(s.valorActual).toBe(7.5); // (7 + 8) / 2 = 7.5
    expect(s.estado).toBe("ok");
  });

  it("siempre poco sueño → estado se fija por umbral absoluto, no por baseline", () => {
    // Baseline = 5h (duerme siempre poco) pero el umbral sigue siendo 6.5h
    const reciente = [mkSueno(offsetDate(HOY, -1), 5.0), mkSueno(offsetDate(HOY, -2), 5.0), mkSueno(offsetDate(HOY, -3), 5.0)];
    const senales = calcularResumenSalud([], [...reciente, ...baselineSueno(5.0)], [], HOY);
    // Aunque deltaPct ≈ 0 (sin cambio vs baseline), sigue siendo alerta
    expect(senales.find((s) => s.clave === "sueno")!.estado).toBe("alerta");
  });
});

// ── HRV ──────────────────────────────────────────────────────────────────────

describe("hrv", () => {
  it("HRV ausente → no aparece en el array", () => {
    const senales = calcularResumenSalud([], [], [], HOY);
    expect(senales.find((s) => s.clave === "hrv")).toBeUndefined();
  });

  it("HRV ausente aunque haya otras métricas → no aparece", () => {
    const senales = calcularResumenSalud(actualFc(60), [], [], HOY);
    expect(senales.find((s) => s.clave === "hrv")).toBeUndefined();
  });

  it("−14.9% → ok (justo por debajo del umbral de atencion)", () => {
    const BASE = 100;
    const actual = [mkHrv(offsetDate(HOY, -1), 85.1), mkHrv(offsetDate(HOY, -2), 85.1), mkHrv(offsetDate(HOY, -3), 85.1)];
    const senales = calcularResumenSalud([...actual, ...baselineHrv(BASE)], [], [], HOY);
    expect(senales.find((s) => s.clave === "hrv")!.estado).toBe("ok");
  });

  it("−15% exacto → atencion", () => {
    const BASE = 100;
    const actual = [mkHrv(offsetDate(HOY, -1), 85), mkHrv(offsetDate(HOY, -2), 85), mkHrv(offsetDate(HOY, -3), 85)];
    const senales = calcularResumenSalud([...actual, ...baselineHrv(BASE)], [], [], HOY);
    const h = senales.find((s) => s.clave === "hrv")!;
    expect(h.estado).toBe("atencion");
    expect(h.motivo).toContain("85");
  });

  it("−25% exacto → alerta", () => {
    const BASE = 100;
    const actual = [mkHrv(offsetDate(HOY, -1), 75), mkHrv(offsetDate(HOY, -2), 75), mkHrv(offsetDate(HOY, -3), 75)];
    const senales = calcularResumenSalud([...actual, ...baselineHrv(BASE)], [], [], HOY);
    expect(senales.find((s) => s.clave === "hrv")!.estado).toBe("alerta");
  });
});

// ── Pasos ─────────────────────────────────────────────────────────────────────

describe("pasos", () => {
  it("−39.9% → ok", () => {
    const base = 10000;
    const actual = Array.from({ length: 7 }, (_, i) => mkPasos(offsetDate(HOY, -(i + 1)), 6001));
    const senales = calcularResumenSalud([...actual, ...baselinePasos(base)], [], [], HOY);
    expect(senales.find((s) => s.clave === "pasos")!.estado).toBe("ok");
  });

  it("−40% exacto → atencion", () => {
    const base = 10000;
    const actual = Array.from({ length: 7 }, (_, i) => mkPasos(offsetDate(HOY, -(i + 1)), 6000));
    const senales = calcularResumenSalud([...actual, ...baselinePasos(base)], [], [], HOY);
    const p = senales.find((s) => s.clave === "pasos")!;
    expect(p.estado).toBe("atencion");
    expect(p.motivo).toContain("40");
  });

  it("−60% → atencion (nunca alerta para pasos)", () => {
    const base = 10000;
    const actual = Array.from({ length: 7 }, (_, i) => mkPasos(offsetDate(HOY, -(i + 1)), 4000));
    const senales = calcularResumenSalud([...actual, ...baselinePasos(base)], [], [], HOY);
    expect(senales.find((s) => s.clave === "pasos")!.estado).toBe("atencion");
  });
});

// ── Peso ──────────────────────────────────────────────────────────────────────

describe("peso", () => {
  it("nunca sale de ok aunque el delta sea grande (+43%)", () => {
    const base = [
      ...Array.from({ length: 7 }, (_, i) => mkMedicion(offsetDate(HOY, -35 + i * 4), 70.0)),
    ];
    const senales = calcularResumenSalud([], [], [...base, mkMedicion(offsetDate(HOY, -1), 100.0)], HOY);
    const p = senales.find((s) => s.clave === "peso")!;
    expect(p.estado).toBe("ok");
    expect(p.deltaPct).toBeGreaterThan(0.4);
  });

  it("sin datos de peso → no aparece", () => {
    const senales = calcularResumenSalud([], [], [], HOY);
    expect(senales.find((s) => s.clave === "peso")).toBeUndefined();
  });

  it("con datos pero sin baseline → ok con valorActual", () => {
    const senales = calcularResumenSalud([], [], [mkMedicion(offsetDate(HOY, -1), 75.5)], HOY);
    const p = senales.find((s) => s.clave === "peso")!;
    expect(p.estado).toBe("ok");
    expect(p.valorActual).toBe(75.5);
    expect(p.baseline).toBeUndefined();
  });
});

// ── senalPeor ─────────────────────────────────────────────────────────────────

describe("senalPeor", () => {
  it("array vacío → sin-datos", () => {
    expect(senalPeor([])).toBe("sin-datos");
  });

  it("prioridad: alerta > atencion > ok > sin-datos", () => {
    const base: Parameters<typeof senalPeor>[0][number] = {
      clave: "fc-reposo", unidad: "bpm", estado: "ok", serie14d: [],
    };
    expect(senalPeor([{ ...base, estado: "sin-datos" }])).toBe("sin-datos");
    expect(senalPeor([{ ...base, estado: "ok" }, { ...base, estado: "sin-datos" }])).toBe("ok");
    expect(senalPeor([{ ...base, estado: "ok" }, { ...base, estado: "atencion" }])).toBe("atencion");
    expect(senalPeor([{ ...base, estado: "atencion" }, { ...base, estado: "alerta" }])).toBe("alerta");
    expect(senalPeor([{ ...base, estado: "alerta" }, { ...base, estado: "ok" }, { ...base, estado: "sin-datos" }])).toBe("alerta");
  });
});

// ── serie14d ─────────────────────────────────────────────────────────────────

describe("serie14d", () => {
  it("incluye solo los últimos 14 días, orden cronológico", () => {
    const items = [
      mkFc(offsetDate(HOY, -20), 60), // fuera de ventana
      mkFc(offsetDate(HOY, -14), 61), // borde incluido
      mkFc(offsetDate(HOY, -7),  62),
      mkFc(offsetDate(HOY, -1),  63),
    ];
    const senales = calcularResumenSalud([...items, ...baselineFc(60)], [], [], HOY);
    const fc = senales.find((s) => s.clave === "fc-reposo")!;
    expect(fc.serie14d).toHaveLength(3); // -20 excluido
    // cronológico: el primero es el más antiguo
    expect(fc.serie14d[0].fecha).toBe(offsetDate(HOY, -14));
    expect(fc.serie14d[fc.serie14d.length - 1].fecha).toBe(offsetDate(HOY, -1));
  });
});
