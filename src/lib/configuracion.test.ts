import { describe, it, expect } from "vitest";
import {
  validarZonas, validarDuracionMinima,
  alternarPrograma, alternarRutina, visibilidadCambio,
} from "./configuracion";
import { zonasDesdeFcMax } from "./zonas";
import type { Programa } from "../types/models";

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
  it("rechaza zonas que se pisan por un latido: las del seed viejo (P97)", () => {
    const delSeed = {
      Z1: { min: 85, max: 101 }, Z2: { min: 101, max: 118 }, Z3: { min: 118, max: 135 },
      Z4: { min: 135, max: 152 }, Z5: { min: 152, max: 169 },
    };
    expect(validarZonas(delSeed, 169)).toBe("Z2 arranca en 101, y Z1 termina en 101: se pisan.");
  });
  it("rechaza un hueco entre dos zonas (P97)", () => {
    expect(validarZonas({ Z1: { min: 84, max: 101 }, Z2: { min: 103, max: 118 } }, 169))
      .toBe("Z1 termina en 101 y Z2 arranca en 103: queda un hueco. Z2 tiene que arrancar en 102.");
  });
  it("rechaza que falte una zona entre dos que están (P97)", () => {
    expect(validarZonas({ Z2: { min: 102, max: 118 }, Z4: { min: 136, max: 152 } }, 169))
      .toBe("Falta Z3 entre Z2 y Z4.");
  });
  it("acepta las zonas de la función única para cualquier FC máxima (P97)", () => {
    for (const fc of [120, 150, 169, 170, 185, 199, 203, 204, 230]) {
      expect(validarZonas(zonasDesdeFcMax(fc), fc), String(fc)).toBeNull();
    }
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
