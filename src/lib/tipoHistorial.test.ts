import { describe, it, expect } from "vitest";
import type { Historial } from "../types/models";
import { tipoDe, esShapeUp, esExterna, soloShapeUp, soloExternas } from "./tipoHistorial";
import { HISTORIAL_MIXTO, SOLO_SHAPEUP, EXTERNAS, viejaSinTipo } from "./__fixtures__/historialMixto";

describe("tipoDe", () => {
  it("devuelve el tipo declarado", () => {
    expect(tipoDe({ tipo: "libre" })).toBe("libre");
    expect(tipoDe({ tipo: "externa" })).toBe("externa");
  });

  it("sin campo, lo lee como rutina (retrocompat pre-P74)", () => {
    expect(tipoDe({})).toBe("rutina");
    expect(tipoDe(viejaSinTipo)).toBe("rutina");
  });
});

describe("esShapeUp / esExterna", () => {
  it("rutina y libre son ShapeUp; externa no", () => {
    expect(esShapeUp({ tipo: "rutina" })).toBe(true);
    expect(esShapeUp({ tipo: "libre" })).toBe(true);
    expect(esShapeUp({ tipo: "externa" })).toBe(false);
  });

  it("una sesión sin tipo es ShapeUp", () => {
    expect(esShapeUp(viejaSinTipo)).toBe(true);
    expect(esExterna(viejaSinTipo)).toBe(false);
  });

  it("son complementarios", () => {
    for (const h of HISTORIAL_MIXTO) expect(esShapeUp(h)).toBe(!esExterna(h));
  });
});

describe("soloShapeUp / soloExternas", () => {
  it("parten el historial mixto sin perder ni duplicar nada", () => {
    const propias = soloShapeUp(HISTORIAL_MIXTO);
    const ajenas  = soloExternas(HISTORIAL_MIXTO);
    expect(propias).toHaveLength(SOLO_SHAPEUP.length);
    expect(ajenas).toHaveLength(EXTERNAS.length);
    expect(propias.length + ajenas.length).toBe(HISTORIAL_MIXTO.length);
  });

  it("soloShapeUp conserva el orden y devuelve exactamente las sesiones propias", () => {
    expect(soloShapeUp(HISTORIAL_MIXTO).map((h) => h.idHist))
      .toEqual(SOLO_SHAPEUP.map((h) => h.idHist));
  });

  it("no muta la entrada", () => {
    const copia = [...HISTORIAL_MIXTO];
    soloShapeUp(HISTORIAL_MIXTO);
    soloExternas(HISTORIAL_MIXTO);
    expect(HISTORIAL_MIXTO).toEqual(copia);
  });

  it("sobre un historial sin externas es la identidad", () => {
    expect(soloShapeUp(SOLO_SHAPEUP)).toEqual(SOLO_SHAPEUP);
    expect(soloExternas(SOLO_SHAPEUP)).toEqual([]);
  });

  it("lista vacía no rompe", () => {
    expect(soloShapeUp([] as Historial[])).toEqual([]);
    expect(soloExternas([] as Historial[])).toEqual([]);
  });
});
