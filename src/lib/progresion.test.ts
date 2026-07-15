import { describe, it, expect } from "vitest";
import { sugerirProgresion, incrementoPara } from "./progresion";
import type { Historial, Prescripcion, SerieRegistro } from "../types/models";

const EJ = "EJ-0001";

function mkSerie(reps: number, cargaKg?: number): SerieRegistro {
  return { serie: 1, reps, cargaKg, completada: true };
}

let contador = 0;
function mkHistorial(fecha: string, series: SerieRegistro[], idEjercicio = EJ): Historial {
  contador++;
  return {
    idHist: `H-${fecha.replace(/-/g, "")}-${contador}`,
    fechaRealizada: fecha,
    fechaRealizadaTimestamp: { seconds: 0, nanoseconds: 0 },
    idSesion: `SES-${contador}`,
    idRutina: "RUT-0001",
    nombreRutina: "Fuerza A",
    semanaInicio: fecha,
    miembro: "juanpablo",
    duracionRealMin: 60,
    rpe: null,
    tonelajeKg: null,
    totalSeriesHechas: null,
    bloques: [
      { orden: 1, idEjercicio, nombreEjercicio: "Press banca", modalidad: "Fuerza", series },
    ],
  };
}

const RANGO: Prescripcion = {
  modalidad: "Fuerza", series: 3,
  repsObjetivo: { value: 8, min: 8, max: 12, raw: "8-12" },
  descansoSeg: 90,
};
const FIJO: Prescripcion = {
  modalidad: "Fuerza", series: 3,
  repsObjetivo: { value: 10, raw: "10" },
  descansoSeg: 90,
};
const CARDIO: Prescripcion = { modalidad: "Cardio", formato: "Continuo", duracionMin: 20 };

describe("incrementoPara", () => {
  it("< 10 kg → 1 kg", () => {
    expect(incrementoPara(8)).toBe(1);
    expect(incrementoPara(9.5)).toBe(1);
  });
  it(">= 10 kg → 2 kg", () => {
    expect(incrementoPara(10)).toBe(2);
    expect(incrementoPara(25)).toBe(2);
  });
});

describe("sugerirProgresion — silencios", () => {
  it("sin sesiones previas del ejercicio → null", () => {
    expect(sugerirProgresion(EJ, [], RANGO)).toBeNull();
  });

  it("historia de OTRO ejercicio → null", () => {
    const hist = [mkHistorial("2026-06-29", [mkSerie(12, 10), mkSerie(12, 10)], "EJ-9999")];
    expect(sugerirProgresion(EJ, hist, RANGO)).toBeNull();
  });

  it("modalidad sin peso (Cardio) → null aunque haya historia", () => {
    const hist = [mkHistorial("2026-06-29", [mkSerie(12, 10)])];
    expect(sugerirProgresion(EJ, hist, CARDIO)).toBeNull();
  });

  it("ejercicio de Fuerza sin carga registrada (bodyweight) → null", () => {
    const hist = [mkHistorial("2026-06-29", [mkSerie(12), mkSerie(10)])];
    expect(sugerirProgresion(EJ, hist, RANGO)).toBeNull();
  });

  it("objetivo no numérico (AMRAP) → null", () => {
    const amrap: Prescripcion = {
      modalidad: "Fuerza", series: 3,
      repsObjetivo: { value: 0, raw: "AMRAP" },
      descansoSeg: 90,
    };
    const hist = [mkHistorial("2026-06-29", [mkSerie(12, 10)])];
    expect(sugerirProgresion(EJ, hist, amrap)).toBeNull();
  });
});

describe("sugerirProgresion — regla A · subir-peso", () => {
  it("todas las series al techo exacto (rango 8-12) → sube peso, reps al piso", () => {
    const hist = [mkHistorial("2026-06-29", [mkSerie(12, 10), mkSerie(12, 10), mkSerie(12, 10)])];
    const s = sugerirProgresion(EJ, hist, RANGO);
    expect(s).not.toBeNull();
    expect(s!.tipo).toBe("subir-peso");
    expect(s!.pesoKg).toBe(12); // incremento 2 kg (peso >= 10)
    expect(s!.repsObjetivo).toBe(8); // piso
    expect(s!.motivo).toContain("10 kg");
    expect(s!.motivo).toContain("12 kg");
    expect(s!.basadoEnFecha).toBe("2026-06-29");
  });

  it("una serie por encima del techo también cuenta como 'llegó'", () => {
    const hist = [mkHistorial("2026-06-29", [mkSerie(13, 10), mkSerie(12, 10)])];
    const s = sugerirProgresion(EJ, hist, RANGO);
    expect(s!.tipo).toBe("subir-peso");
  });

  it("reps fijas: todas las series al objetivo → sube peso, reps al objetivo", () => {
    const hist = [mkHistorial("2026-06-29", [mkSerie(10, 8), mkSerie(10, 8), mkSerie(10, 8)])];
    const s = sugerirProgresion(EJ, hist, FIJO);
    expect(s!.tipo).toBe("subir-peso");
    expect(s!.pesoKg).toBe(9); // incremento 1 kg (peso < 10)
    expect(s!.repsObjetivo).toBe(10);
  });
});

describe("sugerirProgresion — regla B · bajar-peso", () => {
  it("dos sesiones seguidas con la mitad de las series bajo el piso → baja peso", () => {
    const hist = [
      mkHistorial("2026-07-06", [mkSerie(7, 12), mkSerie(6, 12), mkSerie(9, 12), mkSerie(9, 12)]),
      mkHistorial("2026-06-29", [mkSerie(7, 12), mkSerie(6, 12), mkSerie(9, 12), mkSerie(9, 12)]),
    ];
    const s = sugerirProgresion(EJ, hist, RANGO);
    expect(s!.tipo).toBe("bajar-peso");
    expect(s!.pesoKg).toBe(10); // 12 - 2
    expect(s!.motivo).toContain("12 kg");
  });

  it("piso exacto NO cuenta como 'bajo el piso' (borde)", () => {
    const hist = [
      mkHistorial("2026-07-06", [mkSerie(8, 12), mkSerie(8, 12)]),
      mkHistorial("2026-06-29", [mkSerie(8, 12), mkSerie(8, 12)]),
    ];
    const s = sugerirProgresion(EJ, hist, RANGO);
    expect(s!.tipo).not.toBe("bajar-peso");
  });

  it("solo una sesión mala (no dos seguidas) → no baja peso", () => {
    const hist = [
      mkHistorial("2026-07-06", [mkSerie(6, 12), mkSerie(6, 12)]),
      mkHistorial("2026-06-29", [mkSerie(10, 12), mkSerie(10, 12)]),
    ];
    const s = sugerirProgresion(EJ, hist, RANGO);
    expect(s!.tipo).not.toBe("bajar-peso");
  });
});

describe("sugerirProgresion — regla C · subir-reps", () => {
  it("completó todas las series pero sin llegar al techo → mejor serie + 1", () => {
    const hist = [mkHistorial("2026-06-29", [mkSerie(9, 10), mkSerie(10, 10), mkSerie(9, 10)])];
    const s = sugerirProgresion(EJ, hist, RANGO);
    expect(s!.tipo).toBe("subir-reps");
    expect(s!.pesoKg).toBe(10); // mismo peso
    expect(s!.repsObjetivo).toBe(11); // mejor serie (10) + 1
    expect(s!.motivo).toContain("10 kg");
    expect(s!.motivo).toContain("10 reps");
  });

  it("reps fijas nunca dispara subir-reps (no hay rango que completar)", () => {
    const hist = [mkHistorial("2026-06-29", [mkSerie(9, 8), mkSerie(8, 8), mkSerie(9, 8)])];
    const s = sugerirProgresion(EJ, hist, FIJO);
    expect(s!.tipo).not.toBe("subir-reps");
  });
});

describe("sugerirProgresion — regla D · repetir", () => {
  it("reps fijas sin llegar al objetivo (una sola sesión) → repetir mismo esquema", () => {
    const hist = [mkHistorial("2026-06-29", [mkSerie(9, 8), mkSerie(8, 8), mkSerie(9, 8)])];
    const s = sugerirProgresion(EJ, hist, FIJO);
    expect(s!.tipo).toBe("repetir");
    expect(s!.pesoKg).toBe(8);
    expect(s!.repsObjetivo).toBe(10);
    expect(s!.motivo).toContain("8 kg");
  });
});

describe("sugerirProgresion — incrementoKg explícito", () => {
  it("override del incremento por defecto", () => {
    const hist = [mkHistorial("2026-06-29", [mkSerie(12, 20), mkSerie(12, 20)])];
    const s = sugerirProgresion(EJ, hist, RANGO, 5);
    expect(s!.pesoKg).toBe(25);
  });
});
