import { describe, it, expect } from "vitest";
import {
  zonasDesdeFcMax, validarZonas, validarDuracionMinima,
  alternarPrograma, alternarRutina, visibilidadCambio,
} from "./configuracion";
import type { Programa } from "../types/models";

describe("zonasDesdeFcMax", () => {
  it("con 169 da las bandas estándar, contiguas y sin pisarse", () => {
    const z = zonasDesdeFcMax(169);
    expect(z.Z1).toEqual({ min: 85, max: 101 });
    expect(z.Z5!.max).toBe(169);
    expect(validarZonas(z, 169)).toBeNull();
    expect(z.Z2!.min).toBe(z.Z1!.max + 1);
    expect(z.Z5!.min).toBe(z.Z4!.max + 1);
  });
});

describe("validarZonas", () => {
  it("acepta zonas parciales en orden", () => {
    expect(validarZonas({ Z2: { min: 100, max: 120 }, Z3: { min: 121, max: 140 } }, 170)).toBeNull();
    expect(validarZonas({}, null)).toBeNull();
  });
  it("rechaza mínimo mayor que máximo", () => {
    expect(validarZonas({ Z2: { min: 130, max: 120 } }, null)).toMatch(/Z2/);
  });
  it("rechaza zonas que se pisan", () => {
    expect(validarZonas({ Z1: { min: 90, max: 110 }, Z2: { min: 105, max: 125 } }, null)).toMatch(/se pisan/);
  });
  it("rechaza una zona que pasa la FC máxima", () => {
    expect(validarZonas({ Z5: { min: 150, max: 190 } }, 180)).toMatch(/FC máxima/);
  });
  it("rechaza una FC máxima fuera de rango y valores incompletos", () => {
    expect(validarZonas({}, 80)).toMatch(/entre/);
    expect(validarZonas({ Z1: { min: NaN, max: 100 } }, null)).toMatch(/completá/);
  });
});

describe("validarDuracionMinima", () => {
  it("entero entre 0 y 240", () => {
    expect(validarDuracionMinima(30)).toBeNull();
    expect(validarDuracionMinima(0)).toBeNull();
    expect(validarDuracionMinima(-1)).not.toBeNull();
    expect(validarDuracionMinima(300)).not.toBeNull();
    expect(validarDuracionMinima(12.5)).not.toBeNull();
  });
});

const PRG = {
  idPrograma: "PRG-0001", nombre: "Plan",
  dias: [
    { orden: 1, etiqueta: "A", tipo: "rutina", idRutina: "RUT-0001", opcional: false },
    { orden: 2, etiqueta: "B", tipo: "rutina", idRutina: "RUT-0002", opcional: false },
    { orden: 3, etiqueta: "D", tipo: "descanso", opcional: false },
  ],
} as unknown as Programa;

describe("visibilidad", () => {
  it("prender un programa suma sus rutinas, sin duplicar", () => {
    const v = alternarPrograma({ programas: [], rutinas: ["RUT-0002"] }, PRG);
    expect(v.programas).toEqual(["PRG-0001"]);
    expect(v.rutinas.sort()).toEqual(["RUT-0001", "RUT-0002"]);
  });
  it("apagarlo deja las rutinas", () => {
    const v = alternarPrograma({ programas: ["PRG-0001"], rutinas: ["RUT-0001", "RUT-0002"] }, PRG);
    expect(v).toEqual({ programas: [], rutinas: ["RUT-0001", "RUT-0002"] });
  });
  it("alternar rutina", () => {
    expect(alternarRutina({ programas: [], rutinas: [] }, "R").rutinas).toEqual(["R"]);
    expect(alternarRutina({ programas: [], rutinas: ["R"] }, "R").rutinas).toEqual([]);
  });
  it("el cambio se compara como conjunto", () => {
    expect(visibilidadCambio({ programas: ["a", "b"], rutinas: [] }, { programas: ["b", "a"], rutinas: [] })).toBe(false);
    expect(visibilidadCambio({ programas: ["a"], rutinas: [] }, { programas: [], rutinas: [] })).toBe(true);
  });
  it("no muta la entrada", () => {
    const v = { programas: [], rutinas: ["RUT-0002"] };
    alternarPrograma(v, PRG);
    expect(v).toEqual({ programas: [], rutinas: ["RUT-0002"] });
  });
});
