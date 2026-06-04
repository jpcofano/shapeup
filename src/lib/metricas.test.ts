import { describe, it, expect } from "vitest";
import {
  duracionBloqueSeg, estimarDuracionMin, tonelajeKg,
  totalSeriesHechas, sugerirProgresionFuerza,
} from "./metricas";
import type { BloqueEjercicio, Rutina, Historial } from "../types/models";

// ── Fixtures ──────────────────────────────────────────────────────────────────

const bloqueFuerza: BloqueEjercicio = {
  orden: 1,
  idEjercicio: "EJ-0001",
  nombreEjercicio: "Press de banca",
  modalidad: "Fuerza",
  prescripcion: {
    modalidad: "Fuerza",
    series: 3,
    repsObjetivo: { value: 10, min: 8, max: 12, raw: "8-12" },
    descansoSeg: 90,
  },
};

const bloqueIsometrico: BloqueEjercicio = {
  orden: 2,
  idEjercicio: "EJ-0002",
  nombreEjercicio: "Plancha",
  modalidad: "Isométrico",
  prescripcion: {
    modalidad: "Isométrico",
    series: 3,
    duracionHoldSeg: 30,
    porLado: false,
    descansoSeg: 60,
  },
};

const bloqueMovilidad: BloqueEjercicio = {
  orden: 3,
  idEjercicio: "EJ-0003",
  nombreEjercicio: "Hip flexor stretch",
  modalidad: "Movilidad",
  prescripcion: {
    modalidad: "Movilidad",
    rondas: 2,
    duracionHoldSeg: 30,
    porLado: true,
    descansoSeg: 0,
  },
};

const bloqueCardio: BloqueEjercicio = {
  orden: 4,
  idEjercicio: "EJ-0004",
  nombreEjercicio: "Trote",
  modalidad: "Cardio",
  prescripcion: {
    modalidad: "Cardio",
    formato: "Continuo",
    duracionMin: 20,
  },
};

const bloqueIntervalos: BloqueEjercicio = {
  orden: 5,
  idEjercicio: "EJ-0005",
  nombreEjercicio: "Sprints",
  modalidad: "Cardio",
  prescripcion: {
    modalidad: "Cardio",
    formato: "Intervalos",
    rondas: 8,
    trabajoSeg: 20,
    descansoSeg: 40,
  },
};

// ── duracionBloqueSeg ─────────────────────────────────────────────────────────

describe("duracionBloqueSeg", () => {
  it("fuerza: 3 series × (máx 40s trabajo) + 2 descansos de 90s", () => {
    const seg = duracionBloqueSeg(bloqueFuerza.prescripcion);
    // trabajo = max(40, 10*3) = 40s; 3*40 + 2*90 = 120+180 = 300
    expect(seg).toBe(300);
  });

  it("isométrico: 3 series × 30s + 2 descansos de 60s", () => {
    const seg = duracionBloqueSeg(bloqueIsometrico.prescripcion);
    // 3*30 + 2*60 = 90+120 = 210
    expect(seg).toBe(210);
  });

  it("movilidad: 2 rondas × (30s×2 lados) + 1 descanso de 0s", () => {
    const seg = duracionBloqueSeg(bloqueMovilidad.prescripcion);
    // 2*(30*2) + 1*0 = 120
    expect(seg).toBe(120);
  });

  it("cardio continuo: duracionMin en segundos", () => {
    const seg = duracionBloqueSeg(bloqueCardio.prescripcion);
    expect(seg).toBe(20 * 60);
  });

  it("cardio intervalos: rondas × trabajoSeg + (rondas-1) × descansoSeg", () => {
    const seg = duracionBloqueSeg(bloqueIntervalos.prescripcion);
    // 8*20 + 7*40 = 160+280 = 440
    expect(seg).toBe(440);
  });
});

// ── estimarDuracionMin ────────────────────────────────────────────────────────

describe("estimarDuracionMin", () => {
  it("suma bloques + 8% de transición, redondeado", () => {
    const rutina = {
      bloques: [bloqueFuerza, bloqueIsometrico],
    } as unknown as Rutina;
    // 300 + 210 = 510 seg → *1.08 = 550.8 → /60 = 9.18 → round = 9
    expect(estimarDuracionMin(rutina)).toBe(9);
  });
});

// ── tonelajeKg ────────────────────────────────────────────────────────────────

describe("tonelajeKg", () => {
  const historial = {
    bloques: [
      {
        orden: 1,
        idEjercicio: "EJ-0001",
        nombreEjercicio: "Press",
        modalidad: "Fuerza" as const,
        series: [
          { serie: 1, reps: 10, cargaKg: 60, completada: true },
          { serie: 2, reps: 9,  cargaKg: 60, completada: true },
          { serie: 3, reps: 8,  cargaKg: 60, completada: true },
        ],
      },
    ],
  } satisfies Pick<Historial, "bloques">;

  it("suma reps × carga de series completadas", () => {
    expect(tonelajeKg(historial)).toBe((10 + 9 + 8) * 60);
  });

  it("ignora series no completadas", () => {
    const h: Pick<Historial, "bloques"> = {
      bloques: [{
        ...historial.bloques[0],
        series: [
          { serie: 1, reps: 10, cargaKg: 60, completada: true },
          { serie: 2, completada: false },
        ],
      }],
    };
    expect(tonelajeKg(h)).toBe(600);
  });
});

// ── totalSeriesHechas ─────────────────────────────────────────────────────────

describe("totalSeriesHechas", () => {
  it("cuenta series completadas en todos los bloques", () => {
    const h: Pick<Historial, "bloques"> = {
      bloques: [
        {
          orden: 1,
          idEjercicio: "EJ-0001",
          nombreEjercicio: "Press",
          modalidad: "Fuerza",
          series: [
            { serie: 1, completada: true },
            { serie: 2, completada: true },
            { serie: 3, completada: false },
          ],
        },
        {
          orden: 2,
          idEjercicio: "EJ-0002",
          nombreEjercicio: "Remo",
          modalidad: "Fuerza",
          series: [
            { serie: 1, completada: true },
          ],
        },
      ],
    };
    expect(totalSeriesHechas(h)).toBe(3);
  });
});

// ── sugerirProgresionFuerza ───────────────────────────────────────────────────

describe("sugerirProgresionFuerza", () => {
  const rango = { value: 8, min: 8, max: 12, raw: "8-12" };

  it("sube carga cuando todas las series alcanzaron el tope de reps", () => {
    const resultado = sugerirProgresionFuerza({
      rango,
      cargaActualKg: 60,
      ultimaSesion: [
        { reps: 12, carga: 60, completada: true },
        { reps: 12, carga: 60, completada: true },
        { reps: 12, carga: 60, completada: true },
      ],
    });
    expect(resultado.cargaSugeridaKg).toBe(62.5);
    expect(resultado.repsSugeridas).toBe("8");
  });

  it("mantiene carga cuando no se alcanzó el tope", () => {
    const resultado = sugerirProgresionFuerza({
      rango,
      cargaActualKg: 60,
      ultimaSesion: [
        { reps: 10, carga: 60, completada: true },
        { reps: 9,  carga: 60, completada: true },
        { reps: 8,  carga: 60, completada: true },
      ],
    });
    expect(resultado.cargaSugeridaKg).toBe(60);
  });
});
