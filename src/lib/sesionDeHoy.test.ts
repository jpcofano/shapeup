import { describe, it, expect } from "vitest";
import { sesionDeHoy, jsDayToNum } from "./sesionDeHoy";
import type { Programa, Historial, DiaPrograma } from "../types/models";

// ── Fixture: programa de 4 días/sem con diaSemana ────────────────────────────

const D = (orden: number, diaSemana: DiaPrograma["diaSemana"], tipo: DiaPrograma["tipo"], idRutina?: string, etiqueta = ""): DiaPrograma =>
  ({ orden, diaSemana, etiqueta: etiqueta || `Día ${orden}`, tipo, idRutina, opcional: false });

const BASE_PROG: Programa = {
  idPrograma: "PRG-TEST",
  nombre: "Test",
  nombreCanonico: "test",
  objetivo: "Fuerza",
  nivel: "Intermedio",
  estado: "Activo",
  diasPorSemana: 4,
  vecesUsado: 0,
  dias: [
    D(1, "lunes",     "rutina",   "RUT-001", "Lunes — Fuerza A"),
    D(2, "martes",    "descanso", undefined, "Martes — Descanso"),
    D(3, "miércoles", "rutina",   "RUT-002", "Miérc — Fuerza B"),
    D(4, "jueves",    "descanso", undefined, "Jueves — Descanso"),
    D(5, "viernes",   "rutina",   "RUT-003", "Viernes — Fuerza C"),
  ],
};

const SIN_DIA_SEMANA: Programa = {
  ...BASE_PROG,
  dias: BASE_PROG.dias.map((d) => ({ ...d, diaSemana: undefined })),
};

const HIST_LUNES: Historial[] = [{
  idHist: "H1", miembro: "juanpablo", fechaRealizada: "2024-03-11",
  fechaRealizadaTimestamp: {} as any,
  idSesion: "SES-1", nombreRutina: "Fuerza A",
  semanaInicio: "2024-03-11", idRutina: "RUT-001",
  bloques: [], duracionRealMin: 30, tonelajeKg: 0, rpe: null, totalSeriesHechas: null,
}];

// ── Tests ────────────────────────────────────────────────────────────────────

describe("sesionDeHoy", () => {
  it("día de rutina sin hacer → tipo rutina, yaHecha=false", () => {
    const r = sesionDeHoy(BASE_PROG, 0 /* lunes */, []);
    expect(r.tipo).toBe("rutina");
    if (r.tipo === "rutina") {
      expect(r.idRutina).toBe("RUT-001");
      expect(r.yaHecha).toBe(false);
    }
  });

  it("día de rutina ya hecha → yaHecha=true", () => {
    const r = sesionDeHoy(BASE_PROG, 0 /* lunes */, HIST_LUNES);
    expect(r.tipo).toBe("rutina");
    if (r.tipo === "rutina") expect(r.yaHecha).toBe(true);
  });

  it("día de descanso → tipo descanso", () => {
    const r = sesionDeHoy(BASE_PROG, 1 /* martes */, []);
    expect(r.tipo).toBe("descanso");
  });

  it("día sin planificar → tipo dia-libre", () => {
    const r = sesionDeHoy(BASE_PROG, 5 /* sábado */, []);
    expect(r.tipo).toBe("dia-libre");
  });

  it("programa sin diaSemana → tipo sin-programa", () => {
    const r = sesionDeHoy(SIN_DIA_SEMANA, 0, []);
    expect(r.tipo).toBe("sin-programa");
  });

  it("viernes → RUT-003", () => {
    const r = sesionDeHoy(BASE_PROG, 4 /* viernes */, []);
    expect(r.tipo).toBe("rutina");
    if (r.tipo === "rutina") expect(r.idRutina).toBe("RUT-003");
  });
});

describe("jsDayToNum", () => {
  it("domingo (JS=0) → 6",  () => expect(jsDayToNum(0)).toBe(6));
  it("lunes (JS=1) → 0",   () => expect(jsDayToNum(1)).toBe(0));
  it("martes (JS=2) → 1",  () => expect(jsDayToNum(2)).toBe(1));
  it("sábado (JS=6) → 5",  () => expect(jsDayToNum(6)).toBe(5));
});
