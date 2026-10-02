import { describe, it, expect } from "vitest";
import { pisosDe, zonaPorPiso, zonasCorresponden, zonasDesdeFcMax, zonasEfectivas } from "./zonas";
import { derivarZona } from "./matchBiometrico";
import { derivarZona as derivarZonaCardio } from "../import/samsungHealth";
import type { PerfilMiembro } from "../types/models";

// Zonas a medida CON grietas (Z1 termina en 101, Z2 empieza en 102).
const CON_GRIETAS: PerfilMiembro = {
  zonasFC: {
    Z1: { min: 85, max: 101 }, Z2: { min: 102, max: 118 }, Z3: { min: 119, max: 135 },
    Z4: { min: 136, max: 152 }, Z5: { min: 153, max: 169 },
  },
};

describe("zonaPorPiso: la más alta cuyo piso se alcanzó (P92, enmienda)", () => {
  const pisos = pisosDe(CON_GRIETAS)!;
  it("FC en una grieta entre zonas a medida → la de abajo", () => {
    expect(zonaPorPiso(101.5, pisos)).toBe("Z1");
    expect(derivarZona(101.5, CON_GRIETAS)).toBe("Z1");
    expect(derivarZonaCardio(101.5, CON_GRIETAS.zonasFC)).toBe("Z1");
  });
  it("FC por encima del techo de Z5 → Z5", () => {
    expect(zonaPorPiso(180, pisos)).toBe("Z5");
    expect(derivarZona(180, CON_GRIETAS)).toBe("Z5");
    expect(derivarZonaCardio(180, CON_GRIETAS.zonasFC)).toBe("Z5");
  });
  it("por debajo del piso de Z1 → ninguna (bajo zonas)", () => {
    expect(zonaPorPiso(70, pisos)).toBeNull();
    expect(derivarZona(70, CON_GRIETAS)).toBeUndefined();
  });
  it("exactamente en el piso ya es esa zona", () => {
    expect(zonaPorPiso(102, pisos)).toBe("Z2");
  });
  it("con bandas de FC máxima: por encima del techo de Z5 ahora es Z5", () => {
    expect(derivarZona(185, { fcMaxTeorica: 180 })).toBe("Z5");
  });
  it("las zonas a medida mandan sobre las bandas; sin ninguna, no hay pisos", () => {
    expect(pisosDe({ ...CON_GRIETAS, fcMaxTeorica: 999 })![0]).toEqual({ zona: "Z5", min: 153 });
    expect(pisosDe({})).toBeNull();
    expect(pisosDe(undefined)).toBeNull();
  });
});

describe("zonasDesdeFcMax: la convención de Samsung (P97, ADR #045)", () => {
  it("con 169 da exactamente las zonas de Samsung", () => {
    expect(zonasDesdeFcMax(169)).toEqual({
      Z1: { min: 84, max: 101 }, Z2: { min: 102, max: 118 }, Z3: { min: 119, max: 135 },
      Z4: { min: 136, max: 152 }, Z5: { min: 153, max: 169 },
    });
  });
  it("con 170 calcula con enteros: 70 % de 170 es 119, no 118 (0.7 × 170 = 118.999… en flotante)", () => {
    expect(zonasDesdeFcMax(170)).toEqual({
      Z1: { min: 85, max: 102 }, Z2: { min: 103, max: 119 }, Z3: { min: 120, max: 136 },
      Z4: { min: 137, max: 153 }, Z5: { min: 154, max: 170 },
    });
  });
  it("los perfiles de los menores, 203 y 204", () => {
    expect(zonasDesdeFcMax(203)).toEqual({
      Z1: { min: 101, max: 121 }, Z2: { min: 122, max: 142 }, Z3: { min: 143, max: 162 },
      Z4: { min: 163, max: 182 }, Z5: { min: 183, max: 203 },
    });
    expect(zonasDesdeFcMax(204)).toEqual({
      Z1: { min: 102, max: 122 }, Z2: { min: 123, max: 142 }, Z3: { min: 143, max: 163 },
      Z4: { min: 164, max: 183 }, Z5: { min: 184, max: 204 },
    });
  });
  it("de 120 a 230: contiguas, sin pisarse, y el techo de Z5 es la FC máxima", () => {
    const orden = ["Z1", "Z2", "Z3", "Z4", "Z5"] as const;
    for (let fc = 120; fc <= 230; fc++) {
      const z = zonasDesdeFcMax(fc);
      expect(z.Z1.min, String(fc)).toBe(Math.floor(fc / 2));
      expect(z.Z5.max, String(fc)).toBe(fc);
      for (let i = 1; i < orden.length; i++) {
        expect(z[orden[i]].min, `${fc} ${orden[i]}`).toBe(z[orden[i - 1]].max + 1);
      }
      for (const k of orden) expect(z[k].min, `${fc} ${k}`).toBeLessThanOrEqual(z[k].max);
    }
  });
});

describe("el respaldo de pisosDe usa la misma función (P97)", () => {
  it("sin zonas a medida, los pisos son los de zonasDesdeFcMax", () => {
    expect(pisosDe({ fcMaxTeorica: 169 })).toEqual([
      { zona: "Z5", min: 153 }, { zona: "Z4", min: 136 }, { zona: "Z3", min: 119 },
      { zona: "Z2", min: 102 }, { zona: "Z1", min: 84 },
    ]);
    expect(zonasEfectivas({ fcMaxTeorica: 169 })).toEqual(zonasDesdeFcMax(169));
  });
  it("con zonas a medida, zonasEfectivas devuelve esas, tal cual", () => {
    expect(zonasEfectivas(CON_GRIETAS)).toEqual(CON_GRIETAS.zonasFC);
    expect(zonasEfectivas({})).toBeNull();
  });
});

describe("zonasCorresponden: el aviso del editor (P97)", () => {
  it("las de la función, sí; las del seed viejo o las de otra FC máxima, no", () => {
    expect(zonasCorresponden(zonasDesdeFcMax(169), 169)).toBe(true);
    expect(zonasCorresponden(CON_GRIETAS.zonasFC, 169)).toBe(false);   // Z1 desde 85, no 84
    expect(zonasCorresponden(zonasDesdeFcMax(169), 175)).toBe(false);
  });
  it("sin zonas o sin FC máxima no hay nada que avisar", () => {
    expect(zonasCorresponden({}, 169)).toBe(true);
    expect(zonasCorresponden(undefined, 169)).toBe(true);
    expect(zonasCorresponden(zonasDesdeFcMax(169), null)).toBe(true);
  });
});
