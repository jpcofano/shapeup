// P102 — la sesión libre no hereda un cambio de otra visita. Si se abrió desde
// «Cambiar» y se salió sin empezar, el estado queda guardado con la prevista;
// la próxima libre, abierta sin cambio, no la tiene que llevar.
import { describe, it, expect, vi, afterEach } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { INITIAL_ENTRENAR_STATE, fijarCambio, type EntrenarState } from "../lib/entrenarState";

vi.mock("../firebase", () => ({ db: {}, auth: {} }));
vi.mock("../auth/useAuth", () => ({
  useAuth: () => ({ user: { uid: "u1" }, memberId: "juanpablo", loading: false }),
}));
vi.mock("../data/historial", () => ({
  finalizarSesion: vi.fn(() => Promise.resolve({ ok: true, value: { pendiente: false } })),
  getHistorialEnLaApp: vi.fn(() => Promise.resolve({ ok: true, value: [] })),
}));
vi.mock("../data/perfiles", () => ({ getPerfiles: vi.fn(() => Promise.resolve({ ok: true, value: {} })) }));
vi.mock("../data/ejercicios", () => ({
  getEjercicio: vi.fn(() => Promise.resolve({ ok: false, error: "x" })),
  getEjerciciosPorId: vi.fn(() => Promise.resolve({ ok: true, value: { encontrados: [] } })),
  getEjercicios: vi.fn(() => Promise.resolve({ ok: true, value: [] })),
}));

import { EntrenarSesionLibre } from "./EntrenarSesionLibre";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
class RO { observe() {} unobserve() {} disconnect() {} }
(globalThis as unknown as { ResizeObserver: typeof RO }).ResizeObserver ??= RO;

const CLAVE = "entrenar:libre:temp";
let root: Root | null = null;
afterEach(() => { act(() => root?.unmount()); root = null; localStorage.clear(); });

async function montar(state: EntrenarState, navState?: unknown) {
  localStorage.setItem(CLAVE, JSON.stringify(state));
  const router = createMemoryRouter(
    [{ path: "/entrenar/libre", element: createElement(EntrenarSesionLibre) }],
    { initialEntries: [{ pathname: "/entrenar/libre", state: navState }] },
  );
  root = createRoot(document.createElement("div"));
  await act(async () => { root!.render(createElement(RouterProvider, { router })); });
  await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
  return JSON.parse(localStorage.getItem(CLAVE)!) as EntrenarState;
}

describe("Sesión libre y el cambio (P102)", () => {
  const conCambioViejo = fijarCambio(INITIAL_ENTRENAR_STATE, { rutinaPrevista: "RUT-0026", motivo: null });

  it("sin empezar y sin cambio hoy: no hereda el de otra visita", async () => {
    expect((await montar(conCambioViejo)).cambio).toBeNull();
  });

  it("sin empezar y con cambio hoy: toma el de hoy", async () => {
    const s = await montar(conCambioViejo, { cambio: { rutinaPrevista: "RUT-0027", motivo: "dolor" } });
    expect(s.cambio).toEqual({ rutinaPrevista: "RUT-0027", motivo: "dolor" });
  });
});
