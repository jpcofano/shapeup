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
    const r = sesionDeHoy(BASE_PROG, 0 /* lunes */, [], "2024-03-11");
    expect(r.tipo).toBe("rutina");
    if (r.tipo === "rutina") {
      expect(r.idRutina).toBe("RUT-001");
      expect(r.yaHecha).toBe(false);
    }
  });
  it("día de rutina ya hecha → yaHecha=true", () => {
    const r = sesionDeHoy(BASE_PROG, 0 /* lunes */, HIST_LUNES, "2024-03-11");
    expect(r.tipo).toBe("rutina");
    if (r.tipo === "rutina") expect(r.yaHecha).toBe(true);
  });
  it("día de descanso → tipo descanso", () => {
    const r = sesionDeHoy(BASE_PROG, 1 /* martes */, [], "2024-03-11");
    expect(r.tipo).toBe("descanso");
  });
  it("día sin planificar → tipo dia-libre", () => {
    const r = sesionDeHoy(BASE_PROG, 5 /* sábado */, [], "2024-03-11");
    expect(r.tipo).toBe("dia-libre");
  });
  it("programa sin diaSemana → tipo sin-programa", () => {
    const r = sesionDeHoy(SIN_DIA_SEMANA, 0, [], "2024-03-11");
    expect(r.tipo).toBe("sin-programa");
  });
  it("viernes → RUT-003", () => {
    const r = sesionDeHoy(BASE_PROG, 4 /* viernes */, [], "2024-03-11");
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
// ════════════════════════════════════════════════════════════════════════════
//  P77a — el día de entrenamiento sin rutina cargada
//
//  El modelo admite `tipo: "vr"` con `vrSugerido` y sin `idRutina`. Antes eso
//  devolvía `{ tipo: "rutina", idRutina: "" }` y la app navegaba a una rutina
//  que no existe.
// ════════════════════════════════════════════════════════════════════════════
describe("sesionDeHoy · día sin idRutina (P77a)", () => {
  const PROG_VR_SIN_RUTINA: Programa = {
    ...BASE_PROG,
    dias: [
      D(1, "lunes",  "rutina", "RUT-001", "Lunes — Fuerza A"),
      { orden: 2, diaSemana: "martes", etiqueta: "Martes — VR", tipo: "vr",
        vrSugerido: "Beat Saber", opcional: false } as DiaPrograma,
    ],
  };
  it("devuelve 'dia-sin-rutina' con la etiqueta, no una rutina vacía", () => {
    const r = sesionDeHoy(PROG_VR_SIN_RUTINA, 1 /* martes */, [], "2024-03-11");
    expect(r).toEqual({ tipo: "dia-sin-rutina", etiqueta: "Martes — VR" });
  });
  it("nunca devuelve idRutina vacío", () => {
    const r = sesionDeHoy(PROG_VR_SIN_RUTINA, 1, [], "2024-03-11");
    expect(r.tipo === "rutina" && r.idRutina === "").toBe(false);
  });
  it("el día que SÍ tiene rutina sigue igual", () => {
    const r = sesionDeHoy(PROG_VR_SIN_RUTINA, 0 /* lunes */, [], "2024-03-11");
    expect(r).toEqual({ tipo: "rutina", idRutina: "RUT-001", etiqueta: "Lunes — Fuerza A", yaHecha: false });
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  P102 — «Ya entrenaste hoy» mira el día, no la semana
//
//  En el PRG-0013 Combat largo va lunes y viernes. Antes, con el del lunes
//  hecho, el viernes la tarjeta decía «Ya entrenaste hoy» y no dejaba empezar.
// ════════════════════════════════════════════════════════════════════════════
describe("sesionDeHoy · el día, no la semana (P102)", () => {
  const PROG_VR: Programa = {
    ...BASE_PROG,
    dias: [
      D(1, "lunes",     "rutina", "RUT-0026", "Lunes — Combat largo"),
      D(2, "martes",    "rutina", "RUT-0028", "Martes — Ritmo suave"),
      D(3, "miércoles", "rutina", "RUT-0027", "Miércoles — Creed"),
      D(4, "jueves",    "rutina", "RUT-0028", "Jueves — Ritmo suave"),
      D(5, "viernes",   "rutina", "RUT-0026", "Viernes — Combat largo"),
    ],
  };
  const LUNES = "2026-10-12";
  const MIERCOLES = "2026-10-14";
  const VIERNES = "2026-10-16";
  const ses = (fecha: string, extra: Partial<Historial>): Historial => ({
    ...HIST_LUNES[0], idHist: `H-${fecha}-${extra.idRutina ?? "libre"}`, fechaRealizada: fecha,
    semanaInicio: LUNES, nombreRutina: extra.nombreRutina ?? "VR", ...extra,
  });

  it("Combat largo el lunes: el viernes sí muestra «Empezar»", () => {
    const hist = [ses(LUNES, { idRutina: "RUT-0026" })];
    const r = sesionDeHoy(PROG_VR, 4 /* viernes */, hist, VIERNES);
    expect(r).toMatchObject({ tipo: "rutina", idRutina: "RUT-0026", yaHecha: false });
  });

  it("la misma rutina hecha hoy sí cuenta", () => {
    const hist = [ses(VIERNES, { idRutina: "RUT-0026" })];
    const r = sesionDeHoy(PROG_VR, 4, hist, VIERNES);
    expect(r).toMatchObject({ yaHecha: true });
    expect(r.tipo === "rutina" && r.enSuLugar).toBeFalsy();
  });

  it("un cambio hecho hoy: ya entrenaste, y dice qué hiciste en su lugar", () => {
    const hist = [ses(MIERCOLES, { idRutina: "RUT-0030", nombreRutina: "VR — A medida", rutinaPrevista: "RUT-0027" })];
    const r = sesionDeHoy(PROG_VR, 2 /* miércoles */, hist, MIERCOLES);
    expect(r).toMatchObject({ tipo: "rutina", idRutina: "RUT-0027", yaHecha: true, enSuLugar: "VR — A medida" });
  });

  it("un cambio hecho otro día no marca hoy", () => {
    const hist = [ses(LUNES, { idRutina: "RUT-0029", rutinaPrevista: "RUT-0026" })];
    const r = sesionDeHoy(PROG_VR, 4 /* viernes */, hist, VIERNES);
    expect(r).toMatchObject({ yaHecha: false });
  });

  it("una libre con prevista hoy cubre el día", () => {
    const hist = [ses(MIERCOLES, { idRutina: undefined, tipo: "libre", nombreRutina: "Sesión libre", rutinaPrevista: "RUT-0027" })];
    const r = sesionDeHoy(PROG_VR, 2, hist, MIERCOLES);
    expect(r).toMatchObject({ yaHecha: true, enSuLugar: "Sesión libre" });
  });

  it("una sesión de hoy con la rutina del día pero hecha en lugar de otra también cuenta", () => {
    // Hoy es miércoles (Creed) y se hizo Creed en lugar de otra cosa: sigue siendo la del día.
    const hist = [ses(MIERCOLES, { idRutina: "RUT-0027", rutinaPrevista: "RUT-0026" })];
    expect(sesionDeHoy(PROG_VR, 2, hist, MIERCOLES)).toMatchObject({ yaHecha: true });
  });
});
