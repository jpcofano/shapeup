import { describe, it, expect } from "vitest";
import {
  finPrevistoMs, guiaBloquesVR, horaLocal, relojMinSeg, pitidoDeTransicion, lineasGuiaVR,
} from "./guiaBloquesVR";

const INI = new Date(2026, 9, 15, 16, 0, 0).getTime();
const MIN = 60000;
const SEG = 1000;
// 2 bloques de 20 min, descanso de 2 min: total 42 min (fin 16:42)
const P = { bloques: 2, minutosBloque: 20, descansoSeg: 120 };

describe("guiaBloquesVR", () => {
  it("al empezar: bloque 1 completo", () => {
    const g = guiaBloquesVR(P, INI, INI);
    expect(g).toMatchObject({ fase: "bloque", bloque: 1, totalBloques: 2, quedaSeg: 1200, finFaseMs: INI + 20 * MIN, deMasSeg: 0 });
    expect(g.finPrevistoMs).toBe(INI + 42 * MIN);
  });

  it("en medio de un bloque", () => {
    const g = guiaBloquesVR(P, INI, INI + 7 * MIN + 26 * SEG);
    expect(g).toMatchObject({ fase: "bloque", bloque: 1, quedaSeg: 12 * 60 + 34 });
  });

  it("justo al fin de un bloque ya es descanso completo", () => {
    const g = guiaBloquesVR(P, INI, INI + 20 * MIN);
    expect(g).toMatchObject({ fase: "descanso", bloque: 2, quedaSeg: 120, finFaseMs: INI + 22 * MIN });
  });

  it("en el descanso", () => {
    const g = guiaBloquesVR(P, INI, INI + 20 * MIN + 45 * SEG);
    expect(g).toMatchObject({ fase: "descanso", bloque: 2, quedaSeg: 75 });
  });

  it("justo al fin del descanso empieza el bloque siguiente", () => {
    const g = guiaBloquesVR(P, INI, INI + 22 * MIN);
    expect(g).toMatchObject({ fase: "bloque", bloque: 2, quedaSeg: 1200, finFaseMs: INI + 42 * MIN });
  });

  it("último bloque: sin descanso después", () => {
    const g = guiaBloquesVR(P, INI, INI + 41 * MIN + 59 * SEG);
    expect(g).toMatchObject({ fase: "bloque", bloque: 2, quedaSeg: 1 });
  });

  it("justo en el total: terminado con +0", () => {
    const g = guiaBloquesVR(P, INI, INI + 42 * MIN);
    expect(g).toMatchObject({ fase: "terminado", bloque: 2, quedaSeg: 0, finFaseMs: null, deMasSeg: 0 });
  });

  it("pasado el fin: +3:10", () => {
    const g = guiaBloquesVR(P, INI, INI + 42 * MIN + 190 * SEG + 500);
    expect(g.fase).toBe("terminado");
    expect(g.deMasSeg).toBe(190);
  });

  it("descansoSeg 0 con 2 bloques: bloque a bloque", () => {
    const p = { bloques: 2, minutosBloque: 10, descansoSeg: 0 };
    expect(finPrevistoMs(p, INI)).toBe(INI + 20 * MIN);
    expect(guiaBloquesVR(p, INI, INI + 10 * MIN)).toMatchObject({ fase: "bloque", bloque: 2, quedaSeg: 600 });
    expect(guiaBloquesVR(p, INI, INI + 9 * MIN)).toMatchObject({ fase: "bloque", bloque: 1 });
  });

  it("1 bloque (corrido): principal null", () => {
    const p = { bloques: 1, minutosBloque: 30, descansoSeg: 120 };
    const g = guiaBloquesVR(p, INI, INI + 5 * MIN);
    expect(g).toMatchObject({ fase: "bloque", bloque: 1, quedaSeg: 25 * 60 });
    expect(lineasGuiaVR(g)).toEqual({ principal: null, fin: "Fin previsto 16:30" });
  });

  it("now < inicioMs se trata como el arranque", () => {
    const g = guiaBloquesVR(P, INI, INI - 5 * MIN);
    expect(g).toMatchObject({ fase: "bloque", bloque: 1, quedaSeg: 1200 });
  });

  it("redondea hacia arriba los segundos que quedan", () => {
    expect(guiaBloquesVR(P, INI, INI + 20 * MIN - 500).quedaSeg).toBe(1);
  });
});

describe("formatos", () => {
  it("horaLocal y relojMinSeg", () => {
    expect(horaLocal(INI)).toBe("16:00");
    expect(horaLocal(new Date(2026, 9, 15, 7, 5).getTime())).toBe("07:05");
    expect(relojMinSeg(75)).toBe("1:15");
    expect(relojMinSeg(65 * 60 + 10)).toBe("65:10");
    expect(relojMinSeg(0)).toBe("0:00");
  });
});

describe("lineasGuiaVR", () => {
  const p2 = { bloques: 2, minutosBloque: 20, descansoSeg: 120 };
  it("bloque", () => {
    const g = guiaBloquesVR(p2, INI, INI + 7 * MIN + 26 * SEG);
    expect(lineasGuiaVR(g)).toEqual({
      principal: "Bloque 1 de 2 · quedan 12:34 (hasta las 16:20)",
      fin: "Fin previsto 16:42",
    });
  });
  it("descanso", () => {
    const g = guiaBloquesVR(p2, INI, INI + 20 * MIN + 45 * SEG);
    expect(lineasGuiaVR(g)).toEqual({
      principal: "Descanso · quedan 1:15 (bloque 2 a las 16:22)",
      fin: "Fin previsto 16:42",
    });
  });
  it("terminado", () => {
    const g = guiaBloquesVR(p2, INI, INI + 42 * MIN + 190 * SEG);
    expect(lineasGuiaVR(g)).toEqual({ principal: null, fin: "Cumplido a las 16:42 · +3:10" });
  });
});

describe("pitidoDeTransicion", () => {
  const p = { bloques: 3, minutosBloque: 10, descansoSeg: 60 };
  const en = (min: number) => guiaBloquesVR(p, INI, INI + min * MIN);
  const bloque1 = en(1), desc1 = en(10.5), bloque2 = en(11.5), desc2 = en(21.5), bloque3 = en(23), fin = en(40);

  it("primera observación: nunca suena, aunque ya hayan pasado fases", () => {
    expect(pitidoDeTransicion(null, bloque1)).toBeNull();
    expect(pitidoDeTransicion(null, desc2)).toBeNull();
    expect(pitidoDeTransicion(null, fin)).toBeNull();
  });
  it("misma fase y bloque: null", () => {
    expect(pitidoDeTransicion(bloque1, en(2))).toBeNull();
    expect(pitidoDeTransicion(desc1, en(10.8))).toBeNull();
    expect(pitidoDeTransicion(fin, en(50))).toBeNull();
  });
  it("bloque -> descanso: fin-bloque", () => {
    expect(pitidoDeTransicion(bloque1, desc1)).toBe("fin-bloque");
  });
  it("descanso -> bloque: fin-descanso", () => {
    expect(pitidoDeTransicion(desc1, bloque2)).toBe("fin-descanso");
  });
  it("último bloque -> terminado: fin-sesion", () => {
    expect(pitidoDeTransicion(bloque3, fin)).toBe("fin-sesion");
  });
  it("bloque -> bloque con descanso 0: fin-bloque", () => {
    const q = { bloques: 2, minutosBloque: 10, descansoSeg: 0 };
    const a = guiaBloquesVR(q, INI, INI + 5 * MIN);
    const b = guiaBloquesVR(q, INI, INI + 10 * MIN);
    expect(pitidoDeTransicion(a, b)).toBe("fin-bloque");
  });
  it("salto de varias fases: un solo pitido, el de la fase nueva", () => {
    expect(pitidoDeTransicion(bloque1, bloque3)).toBe("fin-bloque");
    expect(pitidoDeTransicion(bloque1, fin)).toBe("fin-sesion");
    expect(pitidoDeTransicion(desc1, desc2)).toBe("fin-bloque");
  });
});
