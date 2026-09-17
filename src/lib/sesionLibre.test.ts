import { describe, it, expect, beforeEach } from "vitest";
import {
  cargarConfigLibre, guardarConfigLibre, borrarConfigLibre,
  mismosEjercicios, restaurarConfig, CLAVE_CONFIG_LIBRE,
  type ConfigSesionLibre,
} from "./sesionLibre";

const config: ConfigSesionLibre = {
  idsEjercicio: ["EJ-0001", "EJ-0002"],
  defaults: [{ series: 3, reps: 10 }, { series: 4, reps: 8 }],
};

describe("sesionLibre — persistencia", () => {
  beforeEach(() => borrarConfigLibre());

  it("ida y vuelta", () => {
    guardarConfigLibre(config);
    expect(cargarConfigLibre()).toEqual(config);
  });

  it("sin config guardada devuelve null", () => {
    expect(cargarConfigLibre()).toBeNull();
  });

  it("borrar la deja en null", () => {
    guardarConfigLibre(config);
    borrarConfigLibre();
    expect(cargarConfigLibre()).toBeNull();
  });

  it("JSON corrupto cuenta como que no hay", () => {
    localStorage.setItem(CLAVE_CONFIG_LIBRE, "{no es json");
    expect(cargarConfigLibre()).toBeNull();
  });

  it("forma inválida cuenta como que no hay", () => {
    const invalidas: unknown[] = [
      null,
      [],
      { idsEjercicio: "EJ-0001", defaults: [] },
      { idsEjercicio: [], defaults: [] },
      { idsEjercicio: ["EJ-0001"], defaults: [] },
      { idsEjercicio: ["EJ-0001"], defaults: [{ series: "3", reps: 10 }] },
      { idsEjercicio: [""], defaults: [{ series: 3, reps: 10 }] },
      { idsEjercicio: [1], defaults: [{ series: 3, reps: 10 }] },
    ];
    for (const x of invalidas) {
      localStorage.setItem(CLAVE_CONFIG_LIBRE, JSON.stringify(x));
      expect(cargarConfigLibre()).toBeNull();
    }
  });
});

describe("mismosEjercicios", () => {
  it("compara ids en orden", () => {
    expect(mismosEjercicios(["A"], ["A"])).toBe(true);
    expect(mismosEjercicios(["A", "B"], ["B", "A"])).toBe(false);
    expect(mismosEjercicios(["A", "B"], ["A"])).toBe(false);
  });
});

describe("restaurarConfig", () => {
  it("descarta los ids que ya no existen y sus defaults", () => {
    const encontrados = new Map([["EJ-0002", { id: "EJ-0002" }]]);
    const r = restaurarConfig(config, encontrados);
    expect(r.ejercicios).toEqual([{ id: "EJ-0002" }]);
    expect(r.defaults).toEqual([{ series: 4, reps: 8 }]);
    expect(r.quitados).toEqual([0]);
  });

  it("con todos presentes no quita nada", () => {
    const encontrados = new Map([["EJ-0001", 1], ["EJ-0002", 2]]);
    const r = restaurarConfig(config, encontrados);
    expect(r.ejercicios).toEqual([1, 2]);
    expect(r.quitados).toEqual([]);
  });
});
