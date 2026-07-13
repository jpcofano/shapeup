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
  it("usa inicioMs/finMs del Historial si existen (ADR #019) — no sintética", () => {
    const h = historial({ idHist: "H-1", fechaRealizada: "2024-03-15", inicioMs: 1000, finMs: 5000 });
    const v = ventanaDeHistorial(h);
    expect(v).toEqual({ inicioMs: 1000, finMs: 5000, sintetica: false, fecha: "2024-03-15" });
  });

  it("deriva ventana desde las series cuando no hay inicioMs/finMs sellados — no sintética", () => {
    const h = historial({
      idHist: "H-2", fechaRealizada: "2024-03-15",
      bloques: [bloque(1, [{ inicioMs: 2000, finMs: 3000 }, { inicioMs: 4000, finMs: 5000 }])],
    });
    const v = ventanaDeHistorial(h);
    expect(v).toEqual({ inicioMs: 2000, finMs: 5000, sintetica: false, fecha: "2024-03-15" });
  });

  it("fallback a fechaRealizada ± duracionRealMin cuando no hay timestamps — sintética", () => {
    const h = historial({
      idHist: "H-3", fechaRealizada: "2024-03-15", duracionRealMin: 60,
      bloques: [bloque(1, [{ reps: 10 }])],
    });
    const v = ventanaDeHistorial(h);
    expect(v).not.toBeNull();
    const mediodia = new Date("2024-03-15T12:00:00").getTime();
    expect(v!.inicioMs).toBe(mediodia - 60 * 60_000);
    expect(v!.finMs).toBe(mediodia + 60 * 60_000);
    expect(v!.sintetica).toBe(true);
    expect(v!.fecha).toBe("2024-03-15");
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
    expect(v!.sintetica).toBe(true);
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

  it("matchea por 'dia' cuando la ventana es sintética y hay exactamente 1 ShapeUp ese día", () => {
    // Sin inicioMs/finMs sellados ni series con timestamps → ventana sintética (fallback fecha ± duracion)
    const histSintetico = historial({
      idHist: "H-DIA", fechaRealizada: "2026-07-07", duracionRealMin: 56,
      bloques: [],
    });
    // Candidata lejos en el tiempo (no solapa por ventana/custom-id), misma fecha local
    const sesDia = {
      datauuid: "uuid-dia-unico", startMs: 5_000_000_000, endMs: 5_003_600_000,
      customId: CUSTOM_ID, fcMedia: 130, fcMax: 157, kcal: 300,
      fecha: "2026-07-07",
    };
    const r = calcularEnriquecimiento([histSintetico], {
      ...EXTRACCION_BASE,
      sesionesSamsung: [sesDia],
    });
    expect(r.matcheadas).toBe(1);
    expect(r.porDia).toBe(1);
    expect(r.updates[0].biometria.matchPor).toBe("dia");
    expect(r.updates[0].biometria.datauuidSamsung).toBe("uuid-dia-unico");
  });

  it("cuenta como ambigua cuando hay 2+ ShapeUp ese día con ventana sintética", () => {
    const histSintetico = historial({
      idHist: "H-AMBIGUO", fechaRealizada: "2026-07-07", duracionRealMin: 56,
      bloques: [],
    });
    const sesA = {
      datauuid: "uuid-a", startMs: 5_000_000_000, endMs: 5_003_600_000,
      customId: CUSTOM_ID, fecha: "2026-07-07",
    };
    const sesB = {
      datauuid: "uuid-b", startMs: 5_100_000_000, endMs: 5_103_600_000,
      customId: CUSTOM_ID, fecha: "2026-07-07",
    };
    const r = calcularEnriquecimiento([histSintetico], {
      ...EXTRACCION_BASE,
      sesionesSamsung: [sesA, sesB],
    });
    expect(r.matcheadas).toBe(0);
    expect(r.ambiguas).toBe(1);
    expect(r.updates).toHaveLength(0);
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

  // ── Desglose de sinMatch (P57) ──────────────────────────────────────────────

  it("desglosa sinMatch: ventana real sin candidatas cercanas → sinSolape", () => {
    const r = calcularEnriquecimiento([HIST_C], EXTRACCION_BASE);
    expect(r.sinMatch).toBe(1);
    expect(r.sinSolape).toBe(1);
    expect(r.sinCandidatasEseDia).toBe(0);
  });

  it("desglosa sinMatch: ventana sintética sin ShapeUp ese día → sinCandidatasEseDia", () => {
    const histSintetico = historial({
      idHist: "H-SIN-DIA", fechaRealizada: "2026-01-01", duracionRealMin: 56, bloques: [],
    });
    // Las candidatas de EXTRACCION_BASE no tienen `fecha` seteada → nunca matchean "2026-01-01"
    const r = calcularEnriquecimiento([histSintetico], EXTRACCION_BASE);
    expect(r.sinMatch).toBe(1);
    expect(r.sinCandidatasEseDia).toBe(1);
    expect(r.sinSolape).toBe(0);
  });

  // ── Nivel "rango" (P57) ───────────────────────────────────────────────────────

  describe("nivel 'rango' (muestras crudas de FC)", () => {
    it("matchea por 'rango' con ≥10 muestras crudas dentro de la ventana, sin candidatas Samsung", () => {
      const histRango = historial({
        idHist: "H-RANGO", fechaRealizada: "2024-03-20",
        inicioMs: 2_000_000, finMs: 2_600_000, bloques: [],
      });
      const muestras = Array.from({ length: 12 }, (_, i) => ({ ms: 2_000_000 + i * 50_000, fc: 100 + i }));
      const r = calcularEnriquecimiento([histRango], {
        sesionesSamsung: [], liveData: {}, shapeUpCustomId: undefined,
        muestrasFcCrudas: muestras,
      });
      expect(r.matcheadas).toBe(1);
      expect(r.porRango).toBe(1);
      expect(r.updates[0].biometria.matchPor).toBe("rango");
      expect(r.updates[0].biometria.datauuidSamsung).toBeUndefined();
      expect(r.updates[0].biometria.kcal).toBeUndefined();
    });

    it("con menos de 10 muestras en la ventana, no matchea por rango (queda sinMatch)", () => {
      const histRango = historial({
        idHist: "H-RANGO-POCAS", fechaRealizada: "2024-03-20",
        inicioMs: 2_000_000, finMs: 2_600_000, bloques: [],
      });
      const muestras = Array.from({ length: 9 }, (_, i) => ({ ms: 2_000_000 + i * 50_000, fc: 100 + i }));
      const r = calcularEnriquecimiento([histRango], {
        sesionesSamsung: [], liveData: {}, shapeUpCustomId: undefined,
        muestrasFcCrudas: muestras,
      });
      expect(r.porRango).toBe(0);
      expect(r.sinMatch).toBe(1);
    });

    it("sin muestrasFcCrudas (p.ej. rematch-salud, sin ZIP) → nunca matchea por rango", () => {
      const r = calcularEnriquecimiento([HIST_C], EXTRACCION_BASE); // sin muestrasFcCrudas en el extraccion
      expect(r.porRango).toBe(0);
    });

    it("ventana sintética también puede llegar a 'rango' si 'dia' no aplicó (S-fix-b + P57)", () => {
      const histSintetico = historial({
        idHist: "H-SIN-DIA-RANGO", fechaRealizada: "2026-01-02", duracionRealMin: 56, bloques: [],
      });
      const ventana = ventanaDeHistorial(histSintetico)!;
      expect(ventana.sintetica).toBe(true);
      const muestras = Array.from({ length: 10 }, (_, i) => ({ ms: ventana.inicioMs + i * 5_000, fc: 90 + i }));
      const r = calcularEnriquecimiento([histSintetico], {
        sesionesSamsung: [], liveData: {}, shapeUpCustomId: undefined,
        muestrasFcCrudas: muestras,
      });
      expect(r.updates[0].biometria.matchPor).toBe("rango");
    });
  });

  // ── Última serie: tope de recuperación explícito (P57) ───────────────────────

  it("última serie de la sesión: recuperacionBpm se calcula con tope de 90s (no queda undefined por efecto colateral)", () => {
    const inicioVentana = 1_000_000;
    const finVentana = inicioVentana + 100_000;
    const histTope = historial({
      idHist: "H-TOPE", fechaRealizada: "2024-03-15",
      inicioMs: inicioVentana, finMs: finVentana,
      bloques: [bloque(1, [{ inicioMs: inicioVentana, finMs: inicioVentana + 50_000 }])], // única serie, sin serie siguiente
    });
    const curva = [
      { ms: inicioVentana + 10_000, fc: 100 },
      { ms: inicioVentana + 40_000, fc: 160 }, // pico dentro de la serie
      { ms: inicioVentana + 50_000, fc: 150 }, // fin de la serie
      { ms: inicioVentana + 150_000, fc: 130 }, // dentro del tope (finVentana + 90_000)
      { ms: inicioVentana + 250_000, fc: 50 },  // más allá del tope — un corte olvidado no debe absorber esto
    ];
    const r = calcularEnriquecimiento([histTope], {
      sesionesSamsung: [{
        datauuid: "uuid-tope", startMs: inicioVentana, endMs: finVentana + 300_000, // "olvido de corte": sigue grabando de más
        customId: CUSTOM_ID,
      }],
      liveData: { "uuid-tope": curva },
      shapeUpCustomId: CUSTOM_ID,
    });
    const serie = r.updates[0].bloques![0].series[0];
    expect(serie.recuperacionBpm).toBe(160 - 130); // pico(160) - fc a los +150_000ms (dentro del tope)
  });

  // ── Sin claves undefined al persistir (hotfix P57) ───────────────────────────
  // Firestore (admin SDK, sin ignoreUndefinedProperties) rechaza escribir un
  // campo con valor `undefined` explícito. `calcularEnriquecimiento` es lo que
  // ambos escritores (cliente `enriquecerHistorial`, admin `rematch-salud.ts`)
  // persisten tal cual — tiene que salir limpio de acá, en el origen.

  it("serie enriquecida sin recuperacionBpm (última serie, sin datos tras el tope) no lleva la clave", () => {
    const histSinRecuperacion = historial({
      idHist: "H-SIN-REC", fechaRealizada: "2024-03-15",
      inicioMs: 1710488400000, finMs: 1710488500000,
      bloques: [bloque(1, [{ inicioMs: 1710488400000, finMs: 1710488450000 }])], // única serie
    });
    // Curva sin ninguna muestra después del fin de la serie → sin fcFinDescanso → sin recuperacionBpm
    const curva = [{ ms: 1710488410000, fc: 130 }];
    const r = calcularEnriquecimiento([histSinRecuperacion], {
      ...EXTRACCION_BASE,
      liveData: { "uuid-shapeup": curva },
    });
    const serie = r.updates[0].bloques![0].series[0];
    expect(Object.prototype.hasOwnProperty.call(serie, "recuperacionBpm")).toBe(false);
  });

  it("ningún update (biometria ni series) tiene una clave con valor undefined — serializa sin pérdidas", () => {
    const r = calcularEnriquecimiento(
      [HIST_A, HIST_B, HIST_C],
      EXTRACCION_BASE,
    );
    for (const { biometria, bloques } of r.updates) {
      for (const [k, v] of Object.entries(biometria)) {
        expect(v, `biometria.${k} no debería ser undefined`).not.toBeUndefined();
      }
      expect(Object.keys(JSON.parse(JSON.stringify(biometria)))).toEqual(Object.keys(biometria));
      for (const bloque of bloques ?? []) {
        for (const serie of bloque.series) {
          for (const [k, v] of Object.entries(serie)) {
            expect(v, `serie.${k} no debería ser undefined`).not.toBeUndefined();
          }
        }
      }
    }
  });
});
