import { describe, it, expect } from "vitest";
import { picoSuavizado } from "./curvaSuavizada";

const curva = (fcs: number[]) => fcs.map((fc, i) => ({ ms: 1_000_000 + i * 1000, fc }));

describe("picoSuavizado (P97)", () => {
  it("un salto del sensor de una o dos muestras no mueve el pico", () => {
    const base = Array(60).fill(150);
    base[30] = 200; base[31] = 198;
    // Los 5 s que contienen las dos muestras: (150·3 + 200 + 198) / 5 ≈ 170.
    expect(picoSuavizado(curva(base))).toBe(170);
    expect(Math.max(...base)).toBe(200);
  });
  it("un esfuerzo sostenido sí llega al pico", () => {
    const fcs = [...Array(30).fill(140), ...Array(20).fill(168), ...Array(30).fill(140)];
    expect(picoSuavizado(curva(fcs))).toBe(168);
  });
  it("sin suficientes muestras en la ventana, no hay pico", () => {
    expect(picoSuavizado(curva([150, 160, 170]))).toBeNull();
    // Muestras cada 3 s: nunca hay 4 dentro de 5 s.
    expect(picoSuavizado([0, 1, 2, 3, 4].map((i) => ({ ms: i * 3000, fc: 150 })))).toBeNull();
  });
  it("no depende del orden de la curva", () => {
    const fcs = [...Array(20).fill(140), ...Array(10).fill(160)];
    expect(picoSuavizado(curva(fcs).reverse())).toBe(160);
  });
});
