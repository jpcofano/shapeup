// P105 Bloque 2 — /qa/sesion carga sin login y muestra los cuatro casos.
import { describe, it, expect, vi, afterEach } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";

vi.mock("../firebase", () => ({ db: {}, auth: {} }));
// Sin usuario y todavía cargando: si la ruta no estuviera en QA_SIN_LOGIN, se vería el spinner.
vi.mock("../auth/useAuth", () => ({ useAuth: () => ({ user: null, memberId: null, loading: true }) }));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
class RO { observe() {} unobserve() {} disconnect() {} }
(globalThis as unknown as { ResizeObserver: typeof RO }).ResizeObserver ??= RO;
window.matchMedia ??= ((q: string) => ({
  matches: false, media: q, onchange: null,
  addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {},
  dispatchEvent: () => false,
})) as unknown as typeof window.matchMedia;

let root: Root | null = null;
afterEach(() => { act(() => root?.unmount()); root = null; });

/** Por `App` entero: lo que importa es que la ruta pase sin login. Es lento (importa todas las rutas). */
async function montarApp(url: string) {
  window.history.pushState({}, "", url);
  vi.resetModules();
  const { default: App } = await import("../App");
  const div = document.createElement("div");
  root = createRoot(div);
  await act(async () => { root!.render(createElement(App)); });
  // La ruta es lazy: espera a que cargue el módulo.
  for (let i = 0; i < 1500 && !div.querySelector("[data-caso]"); i++) {
    await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
  }
  return div;
}

/** La página sola, en un router de memoria: rápido, para lo que se ve. */
async function montar(url: string) {
  const { MemoryRouter } = await import("react-router-dom");
  const { QaSesion } = await import("./QaSesion");
  const div = document.createElement("div");
  root = createRoot(div);
  await act(async () => { root!.render(createElement(MemoryRouter, { initialEntries: [url] }, createElement(QaSesion))); });
  return div;
}

describe("/qa/sesion (P105)", () => {
  it("pasa sin login: App la muestra aunque no haya usuario", async () => {
    const div = await montarApp("/qa/sesion");
    expect(div.querySelector(".loading-screen")).toBeNull();
    expect(div.querySelectorAll("[data-caso]")).toHaveLength(5);
  }, 120_000);   // importa App entero y la ruta lazy; con la suite en paralelo tarda

  it("muestra los cinco casos, con el detalle de la sesión (P109)", async () => {
    const div = await montar("/qa/sesion");
    const casos = [...div.querySelectorAll("[data-caso]")].map((e) => e.getAttribute("data-caso"));
    expect(casos).toEqual(["curva-esquema3", "curva-sin-analisis", "sin-curva", "esquema2", "fuerza"]);

    const caso = (id: string) => div.querySelector(`[data-caso=${id}]`)!;
    // 1: curva, veredicto y detalle plegado.
    expect(caso("curva-esquema3").querySelector("[data-seccion=curva]")).not.toBeNull();
    expect(caso("curva-esquema3").querySelector("[data-seccion=veredicto]")).not.toBeNull();
    expect(caso("curva-esquema3").querySelector("[data-testid=detalle-plegado]")).not.toBeNull();
    // 2: curva sin veredicto.
    expect(caso("curva-sin-analisis").querySelector("[data-seccion=curva]")).not.toBeNull();
    expect(caso("curva-sin-analisis").querySelector("[data-seccion=veredicto]")).toBeNull();
    // 3: sin curva.
    expect(caso("sin-curva").querySelector("[data-seccion=curva]")).toBeNull();
    // 4: esquema 2, sin plegar.
    expect(caso("esquema2").textContent).toContain("esquema 2");
    expect(caso("esquema2").querySelector("[data-testid=detalle-plegado]")).toBeNull();
  });

  it("no usa el id de la sesión real: guardar o borrar no puede tocarla", async () => {
    const { sesionTestigo } = await import("./QaSesion");
    const { HISTORIAL } = await import("../lib/__fixtures__/sesionTestigo20260927");
    const h = sesionTestigo();
    expect(h.idHist).toBe("H-QA-SESION");
    expect(h.idHist).not.toBe(HISTORIAL.idHist);
    expect(h.biometria?.curva).toBeDefined();
  });

  it("el tema y el modo salen de la URL", async () => {
    const div = await montar("/qa/sesion?tema=volt&modo=claro");
    const raiz = div.querySelector("[data-theme]")!;
    expect(raiz.getAttribute("data-theme")).toBe("volt");
    expect(raiz.getAttribute("data-mode")).toBe("light");
    expect((div.querySelector("select[aria-label=Tema]") as HTMLSelectElement).value).toBe("volt");
  });
});
