import { describe, it, expect, afterEach } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { BarraZonas } from "./BarraZonas";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root | null = null;
afterEach(() => { act(() => root?.unmount()); root = null; });

function montar(props: Parameters<typeof BarraZonas>[0]) {
  const div = document.createElement("div");
  root = createRoot(div);
  act(() => root!.render(createElement(BarraZonas, props)));
  return div;
}

describe("BarraZonas (P92)", () => {
  it("bajo Z1 y sin dato van aparte, con su etiqueta", () => {
    const t = montar({ porZona: { Z2: 10, Z4: 20 }, bajoZonas: 12, sinDato: 3 }).textContent ?? "";
    expect(t).toContain("bajo Z1 · 12 min");
    expect(t).toContain("sin dato · 3 min");
    expect(t).toContain("Z4 · 20 min");
  });
  it("bajo Z1 y sin dato solo si pasan de un minuto", () => {
    const t = montar({ porZona: { Z3: 30 }, bajoZonas: 0.8, sinDato: 1 }).textContent ?? "";
    expect(t).not.toContain("bajo Z1");
    expect(t).not.toContain("sin dato");
  });
});
