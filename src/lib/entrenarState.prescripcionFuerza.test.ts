// P103 Bloque 5 — cada bloque de fuerza guarda la prescripción con la que se
// entrenó (series, reps, carga y descanso de la rutina en ese momento). No toca
// `prescripcionUsada` (VR) ni ningún cálculo.
import { describe, it, expect } from "vitest";
import {
  INITIAL_ENTRENAR_STATE, construirBloquesRegistro, prescripcionFuerzaDelBloque, buildVirtualRutina,
  type EntrenarState,
} from "./entrenarState";
import type { BloqueEjercicio, Rutina } from "../types/models";

const SENTADILLA: BloqueEjercicio = {
  orden: 1, idEjercicio: "EJ-0001", nombreEjercicio: "Sentadilla", modalidad: "Fuerza",
  prescripcion: {
    modalidad: "Fuerza", series: 4, repsObjetivo: { value: 10, min: 8, max: 12, raw: "8-12" },
    cargaKg: 40, rirObjetivo: 2, tempo: "3-1-1-0", descansoSeg: 120,
  },
};
const REMO: BloqueEjercicio = {
  orden: 2, idEjercicio: "EJ-0002", nombreEjercicio: "Remo", modalidad: "Fuerza",
  prescripcion: { modalidad: "Fuerza", series: 3, repsObjetivo: { value: 10, raw: "10" }, descansoSeg: 90 },
};
const BICI: BloqueEjercicio = {
  orden: 3, idEjercicio: "EJ-0003", nombreEjercicio: "Bici", modalidad: "Cardio",
  prescripcion: { modalidad: "Cardio", formato: "Continuo", duracionMin: 20 },
};
const PLANCHA: BloqueEjercicio = {
  orden: 4, idEjercicio: "EJ-0004", nombreEjercicio: "Plancha", modalidad: "Isométrico",
  prescripcion: { modalidad: "Isométrico", series: 3, duracionHoldSeg: 30, porLado: false, descansoSeg: 60 },
};
const RUTINA = {
  idRutina: "RUT-0001", nombre: "Fuerza A", bloques: [SENTADILLA, REMO, BICI, PLANCHA],
} as unknown as Rutina;

const ESTADO: EntrenarState = {
  ...INITIAL_ENTRENAR_STATE, inicioMs: 1_000, seriesHechas: { 0: 2, 1: 3 },
  registro: { 0: [{ serie: 1, completada: true, reps: 10, cargaKg: 40 }, { serie: 2, completada: true, reps: 9, cargaKg: 40 }] },
  saltados: { 3: null },
};

describe("prescripcionFuerzaDelBloque (P103)", () => {
  it("toma series, reps, carga y descanso, y RIR y tempo si están", () => {
    expect(prescripcionFuerzaDelBloque(SENTADILLA)).toEqual({
      series: 4, repsObjetivo: { value: 10, min: 8, max: 12, raw: "8-12" }, cargaKg: 40, descansoSeg: 120,
      rirObjetivo: 2, tempo: "3-1-1-0",
    });
  });

  it("sin carga ni rango, no escribe claves vacías", () => {
    const p = prescripcionFuerzaDelBloque(REMO)!;
    expect(p).toEqual({ series: 3, repsObjetivo: { value: 10, raw: "10" }, descansoSeg: 90 });
    expect(Object.values(p).some((v) => v === undefined)).toBe(false);
    expect(Object.keys(p.repsObjetivo)).toEqual(["value", "raw"]);
  });

  it("fuera de Fuerza no hay prescripción de fuerza", () => {
    expect(prescripcionFuerzaDelBloque(BICI)).toBeUndefined();
    expect(prescripcionFuerzaDelBloque(PLANCHA)).toBeUndefined();
  });

  it("es una copia: cambiar la rutina después no cambia lo guardado", () => {
    const rutina = structuredClone(RUTINA);
    const bloques = construirBloquesRegistro(ESTADO, rutina);
    const p = rutina.bloques[0].prescripcion as { repsObjetivo: { raw: string }; series: number };
    p.repsObjetivo.raw = "5";
    p.series = 9;
    expect(bloques[0].prescripcionFuerza).toEqual(prescripcionFuerzaDelBloque(SENTADILLA));
  });
});

describe("construirBloquesRegistro guarda la prescripción de fuerza (P103)", () => {
  const bloques = construirBloquesRegistro(ESTADO, RUTINA);

  it("en cada bloque de fuerza, con o sin carga registrada", () => {
    expect(bloques[0].prescripcionFuerza?.series).toBe(4);
    expect(bloques[1].prescripcionFuerza).toEqual({ series: 3, repsObjetivo: { value: 10, raw: "10" }, descansoSeg: 90 });
  });

  it("no en cardio ni en isométricos, y nunca toca prescripcionUsada", () => {
    expect("prescripcionFuerza" in bloques[2]).toBe(false);
    expect("prescripcionFuerza" in bloques[3]).toBe(false);
    expect(bloques.every((b) => !("prescripcionUsada" in b))).toBe(true);
  });

  it("la sesión libre no la guarda: sus valores son los de por defecto", () => {
    const libre = construirBloquesRegistro(ESTADO, buildVirtualRutina([SENTADILLA, REMO]));
    expect(libre.some((b) => "prescripcionFuerza" in b)).toBe(false);
  });

  it("un bloque sustituido guarda la prescripción del bloque de la rutina", () => {
    const conSust: EntrenarState = {
      ...ESTADO,
      sustituciones: { 1: { idOriginal: "EJ-0002", idNuevo: "EJ-0099", nombreNuevo: "Remo con banda", motivo: "equipo-ocupado", posicion: 1 } },
    } as EntrenarState;
    const b = construirBloquesRegistro(conSust, RUTINA)[1];
    expect(b.idEjercicio).toBe("EJ-0099");
    expect(b.prescripcionFuerza).toEqual(prescripcionFuerzaDelBloque(REMO));
  });

  it("lo demás del bloque no cambia", () => {
    expect(bloques[0]).toMatchObject({ orden: 1, idEjercicio: "EJ-0001", modalidad: "Fuerza" });
    expect(bloques[0].series).toEqual(ESTADO.registro[0]);
    expect(bloques[3]).toMatchObject({ saltado: true });
  });
});
