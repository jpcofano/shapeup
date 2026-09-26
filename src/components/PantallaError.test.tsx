import { describe, it, expect, vi, afterEach } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { ErrorBoundary, PantallaErrorRuta, esVersionVieja, detalleDe } from "./PantallaError";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function Explota(): never {
  throw new Error("Rendered more hooks than during the previous render.");
}

let root: Root | null = null;
afterEach(() => { act(() => root?.unmount()); root = null; });

function montar(el: ReturnType<typeof createElement>) {
  const div = document.createElement("div");
  root = createRoot(div);
  act(() => root!.render(el));
  return div;
}

describe("PantallaError", () => {
  it("una pantalla que explota muestra el mensaje en castellano y ofrece recargar", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const router = createMemoryRouter(
      [{ errorElement: createElement(PantallaErrorRuta), children: [{ path: "/", element: createElement(Explota) }] }],
      { initialEntries: ["/"] },
    );
    const div = montar(createElement(RouterProvider, { router }));
    spy.mockRestore();

    expect(div.textContent).toContain("Algo se rompió en esta pantalla");
    expect(div.textContent).toContain("Recargar");
    expect(div.textContent).toContain("Ir al inicio");
    expect(div.textContent).not.toMatch(/Hey developer/i);
    // El detalle técnico está, pero plegado y sin stack.
    expect(div.querySelector("details")?.textContent).toContain("Rendered more hooks");
    expect(div.textContent).not.toMatch(/at \w+ \(/);
  });

  it("el ErrorBoundary de clase agarra lo que explota fuera del router", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const div = montar(createElement(ErrorBoundary, null, createElement(Explota)));
    spy.mockRestore();
    expect(div.textContent).toContain("Algo se rompió en esta pantalla");
    expect(div.textContent).toContain("Recargar");
  });

  it("un archivo del build que ya no existe se explica como versión nueva", () => {
    expect(esVersionVieja(new TypeError("Failed to fetch dynamically imported module: /assets/x.js"))).toBe(true);
    expect(esVersionVieja(new Error("otra cosa"))).toBe(false);
    expect(detalleDe(new Error("boom"))).toBe("boom");
  });
});
