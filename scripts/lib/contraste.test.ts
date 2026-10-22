// P105 — contraste WCAG para el diagnóstico de diseño.
import { describe, it, expect } from "vitest";
import { parsearColor, razonContraste, pasaAA, componer, variablesDe } from "./contraste";

describe("contraste", () => {
  it("blanco sobre negro es 21 y negro sobre negro es 1", () => {
    expect(razonContraste("#ffffff", "#000000")).toBe(21);
    expect(razonContraste("#000", "#000000")).toBe(1);
  });

  it("es simétrico", () => {
    expect(razonContraste("#767676", "#ffffff")).toBe(razonContraste("#ffffff", "#767676"));
  });

  it("el gris #767676 sobre blanco es el límite conocido de AA (4,54)", () => {
    const r = razonContraste("#767676", "#ffffff");
    expect(r).toBe(4.54);
    expect(pasaAA(r)).toBe(true);
    expect(pasaAA(razonContraste("#777777", "#ffffff"))).toBe(false);
  });

  it("AA grande pide 3", () => {
    expect(pasaAA(3.2)).toBe(false);
    expect(pasaAA(3.2, true)).toBe(true);
  });

  it("un color con alfa se compone sobre el fondo antes de medir", () => {
    expect(componer(parsearColor("rgba(255,255,255,0.5)")!, parsearColor("#000000")!)).toEqual({ r: 128, g: 128, b: 128, a: 1 });
    expect(razonContraste("rgba(255,255,255,0)", "#000000")).toBe(1);
  });

  it("no entiende nombres ni var(): lo dice", () => {
    expect(parsearColor("red")).toBeNull();
    expect(() => razonContraste("var(--x)", "#000")).toThrow(/no se entiende/);
  });

  it("lee las variables de un bloque por su selector exacto", () => {
    const css = `:root {\n  --fg: #fff;\n}\n[data-theme="ion"] { --bg: #081519; --accent: #22d3ee; }\n[data-theme="ion"][data-mode="light"] { --accent: #0e7490; }`;
    expect(variablesDe(css, '[data-theme="ion"]')).toEqual({ bg: "#081519", accent: "#22d3ee" });
    expect(variablesDe(css, ":root")).toEqual({ fg: "#fff" });
    expect(variablesDe(css, ".nada")).toEqual({});
  });
});
