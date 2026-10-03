// ════════════════════════════════════════════════════════════════════════════
//  styles/home-redux.test.ts — ningún [data-mode=…] suelto en home-redux.css.
//
//  <html> tiene data-mode desde P65 (lo pone ThemeProvider). Un selector que
//  empiece en [data-mode=…] sin [data-accent] también aplica a <html>, y en
//  home-redux.css eso pisaba --accent con un var(--acc-d) que en <html> no
//  existe: toda la app se quedaba sin acento en modo oscuro (diagnóstico del
//  02/10/2026, el botón principal invisible). Los selectores de este archivo
//  tienen que ir con [data-accent] o pegados a una clase (.dir-a, .dir-c).
// ════════════════════════════════════════════════════════════════════════════
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const CSS = readFileSync(resolve(process.cwd(), "src/styles/home-redux.css"), "utf8");

/** Cada selector compuesto del archivo (sin comentarios ni reglas @). */
function compuestosConDataMode(css: string): string[] {
  const sinComentarios = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const selectores = [...sinComentarios.matchAll(/([^{}]+)\{/g)]
    .map((m) => m[1].trim())
    .filter((s) => s && !s.startsWith("@"));
  return selectores
    .flatMap((s) => s.split(","))
    .flatMap((s) => s.trim().split(/\s*[>+~]\s*|\s+/))
    .filter((c) => c.includes("[data-mode"));
}

/** Un compuesto que puede matchear <html>: empieza en [data-mode=…] y no lleva [data-accent]. */
function sueltos(css: string): string[] {
  return compuestosConDataMode(css).filter((c) => c.startsWith("[data-mode") && !c.includes("[data-accent]"));
}

describe("home-redux.css no toca <html> (diagnóstico del 02/10)", () => {
  it("hay selectores con data-mode para chequear (guarda contra un parser roto)", () => {
    expect(compuestosConDataMode(CSS).length).toBeGreaterThan(4);
  });
  it("ningún [data-mode=…] suelto: van con [data-accent] o pegados a una clase", () => {
    expect(sueltos(CSS)).toEqual([]);
  });
  it("el chequeo detecta el caso que rompió el modo oscuro", () => {
    expect(sueltos(`[data-mode="dark"] { --accent: var(--acc-d); }`)).toEqual([`[data-mode="dark"]`]);
    expect(sueltos(`.x, [data-mode="light"] .y { color: red; }`)).toEqual([`[data-mode="light"]`]);
    expect(sueltos(`[data-accent][data-mode="dark"] { } .dir-a[data-mode="dark"] { }`)).toEqual([]);
  });
});
