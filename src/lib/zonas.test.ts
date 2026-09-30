import { describe, it, expect } from "vitest";
import { pisosDe, zonaPorPiso } from "./zonas";
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
