import { describe, it, expect } from "vitest";
import type { Historial, BloqueRegistro } from "../types/models";
import { ventanaDeHistorial, calcularEnriquecimiento } from "./enriquecerImport";
import { ventanaDeBloques } from "./metricas";

// ── Helpers de fixtures ───────────────────────────────────────────────────────

function bloque(orden: number, series: Partial<BloqueRegistro["series"][number]>[]): BloqueRegistro {
  return {
    orden,
    idEjercicio: `EJ-${orden}`,
    nombreEjercicio: `Ejercicio ${orden}`,
    modalidad: "Fuerza",
    series: series.map((s, i) => ({ serie: i + 1, completada: true, ...s })),
  };
}

function historial(
  override: Partial<Historial> & Pick<Historial, "idHist" | "fechaRealizada">,
): Historial {
  return {
    idSesion: "SES-1",
    nombreRutina: "Fuerza A",
    miembro: "juanpablo",
    semanaInicio: "2024-03-11",
    duracionRealMin: 60,
    rpe: 7,
    tonelajeKg: 1000,
    totalSeriesHechas: 12,
    bloques: [],
    notas: "",
    fechaRealizadaTimestamp: { seconds: 0, nanoseconds: 0 },
    ...override,
  };
}

// ── ventanaDeBloques ──────────────────────────────────────────────────────────

describe("ventanaDeBloques", () => {
  it("extrae mín de inicioMs y máx de finMs de todas las series", () => {
    const bloques = [
      bloque(1, [{ inicioMs: 1000, finMs: 2000 }, { inicioMs: 3000, finMs: 4000 }]),
      bloque(2, [{ inicioMs: 500, finMs: 5000 }]),
    ];
    const v = ventanaDeBloques(bloques);
    expect(v.inicioMs).toBe(500);
    expect(v.finMs).toBe(5000);
  });

  it("devuelve ambos undefined si no hay timestamps", () => {
    const bloques = [bloque(1, [{ reps: 10 }, { reps: 8 }])];
    const v = ventanaDeBloques(bloques);
    expect(v.inicioMs).toBeUndefined();
    expect(v.finMs).toBeUndefined();
  });

  it("ignora series sin timestamp (solo cuenta las que tienen)", () => {
    const bloques = [bloque(1, [
      { inicioMs: 1000, finMs: 2000 },
      { reps: 10 },                      // sin timestamps
    ])];
    const v = ventanaDeBloques(bloques);
    expect(v.inicioMs).toBe(1000);
    expect(v.finMs).toBe(2000);
  });

  it("devuelve ambos undefined para bloques vacíos", () => {
    expect(ventanaDeBloques([])).toEqual({});
  });
});

// ── ventanaDeHistorial ────────────────────────────────────────────────────────

describe("ventanaDeHistorial", () => {
  it("usa inicioMs/finMs del Historial si existen (ADR #019)", () => {
    const h = historial({ idHist: "H-1", fechaRealizada: "2024-03-15", inicioMs: 1000, finMs: 5000 });
    const v = ventanaDeHistorial(h);
    expect(v).toEqual({ inicioMs: 1000, finMs: 5000 });
  });

  it("deriva ventana desde las series cuando no hay inicioMs/finMs sellados", () => {
    const h = historial({
      idHist: "H-2", fechaRealizada: "2024-03-15",
      bloques: [bloque(1, [{ inicioMs: 2000, finMs: 3000 }, { inicioMs: 4000, finMs: 5000 }])],
    });
    const v = ventanaDeHistorial(h);
    expect(v).toEqual({ inicioMs: 2000, finMs: 5000 });
  });

  it("fallback a fechaRealizada ± duracionRealMin cuando no hay timestamps", () => {
    const h = historial({
      idHist: "H-3", fechaRealizada: "2024-03-15", duracionRealMin: 60,
      bloques: [bloque(1, [{ reps: 10 }])],
    });
    const v = ventanaDeHistorial(h);
    expect(v).not.toBeNull();
    const mediodia = new Date("2024-03-15T12:00:00").getTime();
    expect(v!.inicioMs).toBe(mediodia - 60 * 60_000);
    expect(v!.finMs).toBe(mediodia + 60 * 60_000);
  });

  it("fallback usa ±60 min si duracionRealMin es null", () => {
    const h = historial({
      idHist: "H-4", fechaRealizada: "2024-03-15", duracionRealMin: null,
      bloques: [],
    });
    const v = ventanaDeHistorial(h);
    const mediodia = new Date("2024-03-15T12:00:00").getTime();
    expect(v!.finMs! - v!.inicioMs!).toBe(120 * 60_000);
    expect(v!.inicioMs).toBe(mediodia - 60 * 60_000);
  });
});

// ── calcularEnriquecimiento ───────────────────────────────────────────────────

const CUSTOM_ID = "mq1mz4gd_gq";

// Sesión Samsung con custom_id que solapa con H-A
const SES_SHAPEUP = {
  datauuid: "uuid-shapeup",
  startMs:  1710488000000,
  endMs:    1710491600000, // ~1h
  customId: CUSTOM_ID,
  fcMedia:  145, fcMax: 175, fcMin: 85, kcal: 400,
};

// Sesión Samsung sin custom_id que solapa con H-B
const SES_CAMINATA = {
  datauuid: "uuid-caminata",
  startMs:  1710574400000,
  endMs:    1710576200000, // ~30min
  fcMedia:  115, fcMax: 140, kcal: 180,
};

const HIST_A = historial({
  idHist: "H-A", fechaRealizada: "2024-03-15",
  inicioMs: 1710488400000, finMs: 1710492000000, // dentro de SES_SHAPEUP
  bloques: [],
});

const HIST_B = historial({
  idHist: "H-B", fechaRealizada: "2024-03-16",
  inicioMs: 1710574800000, finMs: 1710576600000, // dentro de SES_CAMINATA
  bloques: [],
});

const HIST_C = historial({
  idHist: "H-C", fechaRealizada: "2024-03-17",
  inicioMs: 1_999_000_000, finMs: 2_000_000_000, // sin match
  bloques: [],
});

const HIST_YA_ENRIQUECIDO = historial({
  idHist: "H-D", fechaRealizada: "2024-03-15",
  inicioMs: 1710488400000, finMs: 1710492000000,
  biometria: {
    fuente: "samsung-health-csv", datauuidSamsung: "uuid-old",
    matchPor: "custom-id", granularidad: "serie",
  },
  bloques: [],
});

const EXTRACCION_BASE = {
  sesionesSamsung: [SES_SHAPEUP, SES_CAMINATA],
  liveData:        {} as Record<string, import("../import/samsungLiveData").LiveDataPoint[]>,
  shapeUpCustomId: CUSTOM_ID,
};

describe("calcularEnriquecimiento", () => {
  it("matchea H-A por custom-id", () => {
    const r = calcularEnriquecimiento([HIST_A], EXTRACCION_BASE);
    expect(r.matcheadas).toBe(1);
    expect(r.porCustomId).toBe(1);
    expect(r.updates[0].idHist).toBe("H-A");
    expect(r.updates[0].biometria.matchPor).toBe("custom-id");
  });

  it("matchea H-B por ventana (no tiene custom_id)", () => {
    const r = calcularEnriquecimiento([HIST_B], { ...EXTRACCION_BASE, shapeUpCustomId: CUSTOM_ID });
    expect(r.matcheadas).toBe(1);
    expect(r.porVentana).toBe(1);
    expect(r.updates[0].biometria.matchPor).toBe("ventana");
  });

  it("cuenta H-C como sinMatch", () => {
    const r = calcularEnriquecimiento([HIST_C], EXTRACCION_BASE);
    expect(r.sinMatch).toBe(1);
    expect(r.updates).toHaveLength(0);
  });

  it("omite H-D ya enriquecido con granularidad 'serie' (ADR #021)", () => {
    const r = calcularEnriquecimiento([HIST_YA_ENRIQUECIDO], EXTRACCION_BASE);
    expect(r.omitidas).toBe(1);
    expect(r.updates).toHaveLength(0);
  });

  it("mejora granularidad 'sesion' → 'serie' si hay curva", () => {
    const histConBioSesion = historial({
      idHist: "H-E", fechaRealizada: "2024-03-15",
      inicioMs: 1710488400000, finMs: 1710492000000,
      biometria: {
        fuente: "samsung-health-csv", datauuidSamsung: "uuid-old",
        matchPor: "ventana", granularidad: "sesion",
      },
      bloques: [bloque(1, [{ inicioMs: 1710488400000, finMs: 1710488450000 }])],
    });
    const curva = [
      { ms: 1710488410000, fc: 130 },
      { ms: 1710488440000, fc: 145 },
    ];
    const r = calcularEnriquecimiento([histConBioSesion], {
      ...EXTRACCION_BASE,
      liveData: { "uuid-shapeup": curva },
    });
    expect(r.matcheadas).toBe(1);
    expect(r.updates[0].biometria.granularidad).toBe("serie");
    expect(r.updates[0].bloques).toBeDefined();
  });

  it("una sesión Samsung no matchea dos Historiales (sin doble asignación de datauuid)", () => {
    const histA2 = historial({
      idHist: "H-A2", fechaRealizada: "2024-03-15",
      inicioMs: 1710488400000, finMs: 1710492000000,
      bloques: [],
    });
    const r = calcularEnriquecimiento([HIST_A, histA2], EXTRACCION_BASE);
    // Solo uno puede matchear uuid-shapeup
    expect(r.matcheadas).toBe(1);
    expect(r.updates.map((u) => u.biometria.datauuidSamsung).filter((d) => d === "uuid-shapeup")).toHaveLength(1);
  });

  it("no muta los Historial de entrada", () => {
    const histCopy = historial({
      idHist: "H-F", fechaRealizada: "2024-03-15",
      inicioMs: 1710488400000, finMs: 1710492000000,
      bloques: [bloque(1, [{ inicioMs: 1710488400000, finMs: 1710488450000 }])],
    });
    const bloquesAntes = JSON.stringify(histCopy.bloques);
    calcularEnriquecimiento([histCopy], {
      ...EXTRACCION_BASE,
      liveData: { "uuid-shapeup": [{ ms: 1710488410000, fc: 130 }] },
    });
    expect(JSON.stringify(histCopy.bloques)).toBe(bloquesAntes);
  });

  it("serie enriquecida con curva tiene fcPico correcta", () => {
    const histConSeries = historial({
      idHist: "H-G", fechaRealizada: "2024-03-15",
      inicioMs: 1710488400000, finMs: 1710492000000,
      bloques: [bloque(1, [
        { inicioMs: 1710488400000, finMs: 1710488450000 },  // serie 1
        { inicioMs: 1710488510000, finMs: 1710488560000 },  // serie 2
      ])],
    });
    const curva = [
      { ms: 1710488410000, fc: 130 },
      { ms: 1710488440000, fc: 160 },  // pico serie 1
      { ms: 1710488500000, fc: 120 },  // durante descanso
      { ms: 1710488520000, fc: 135 },
    ];
    const r = calcularEnriquecimiento([histConSeries], {
      ...EXTRACCION_BASE,
      liveData: { "uuid-shapeup": curva },
    });
    const serie1 = r.updates[0].bloques![0].series[0];
    expect(serie1.fcPico).toBe(160);
  });
});
