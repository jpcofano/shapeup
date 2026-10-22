// P102 — «Ver todas»: el cambio viaja por la URL de Biblioteca a la rutina y a
// la sesión, y llega a `finalizarSesion`. Con la ✕ de la franja, no llega.
import { describe, it, expect, vi, afterEach } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { RUTINAS_VR, RUT_COMBAT_LARGO, RUT_CREED } from "../lib/catalogoVR";
import type { Rutina } from "../types/models";

vi.mock("../firebase", () => ({ db: {}, auth: {} }));
vi.mock("../auth/useAuth", () => ({
  useAuth: () => ({ user: { uid: "u1" }, memberId: "juanpablo", loading: false }),
}));

const COMBAT = RUTINAS_VR.find((r) => r.idRutina === RUT_COMBAT_LARGO)! as Rutina;
const CREED = RUTINAS_VR.find((r) => r.idRutina === RUT_CREED)! as Rutina;

vi.mock("../data/rutinas", () => ({
  getRutinas: vi.fn(() => Promise.resolve({ ok: true, value: [COMBAT] })),
  getRutina: vi.fn((id: string) => Promise.resolve({ ok: true, value: id === RUT_CREED ? CREED : COMBAT })),
  getRutinasDelMiembro: vi.fn(() => Promise.resolve({ ok: true, value: [COMBAT] })),
}));
vi.mock("../data/ejercicios", () => ({
  getEjercicio: vi.fn(() => Promise.resolve({ ok: false, error: "sin catálogo en el test" })),
  getEjerciciosMap: vi.fn(() => Promise.resolve(new Map())),
}));
vi.mock("../data/historial", () => ({
  finalizarSesion: vi.fn(() => Promise.resolve({ ok: true, value: { pendiente: false } })),
  getHistorialEnLaApp: vi.fn(() => Promise.resolve({ ok: true, value: [] })),
}));
vi.mock("../data/programas", () => ({
  getProgramas: vi.fn(() => Promise.resolve({ ok: true, value: [] })),
  getProgramaActivo: vi.fn(() => Promise.resolve({ ok: true, value: null })),
}));
vi.mock("../data/visibilidad", () => ({
  getVisibilidad: vi.fn(() => Promise.resolve({ ok: true, value: null })),
  programaVisible: () => true,
}));
vi.mock("../data/sesiones", () => ({
  crearSesion: vi.fn(() => ({ idSesion: "SES-NUEVA" })),
  iniciarSesion: vi.fn(() => Promise.resolve({ ok: true, value: undefined })),
  descartarSesion: vi.fn(() => Promise.resolve({ ok: true, value: undefined })),
}));
vi.mock("../data/perfiles", () => ({
  getPerfiles: vi.fn(() => Promise.resolve({ ok: true, value: {} })),
  actualizarPerfil: vi.fn(),
}));
vi.mock("../data/configProgresion", () => ({
  getConfigProgresion: vi.fn(() => Promise.resolve({ ok: false, error: "default" })),
}));
vi.mock("../lib/audioAlert", () => ({
  unlockAudio: vi.fn(), playPitidoVR: vi.fn(), audioSuspendido: vi.fn(() => false),
}));
vi.mock("./Catalogo", () => ({ Catalogo: () => null }));

import { Biblioteca } from "./Biblioteca";
import { RutinaDetalle } from "./RutinaDetalle";
import { EntrenarSesion } from "./EntrenarSesion";
import { finalizarSesion } from "../data/historial";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
class RO { observe() {} unobserve() {} disconnect() {} }
(globalThis as unknown as { ResizeObserver: typeof RO }).ResizeObserver ??= RO;
window.matchMedia ??= ((q: string) => ({
  matches: false, media: q, onchange: null,
  addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {},
  dispatchEvent: () => false,
})) as unknown as typeof window.matchMedia;

let root: Root | null = null;
afterEach(() => {
  act(() => root?.unmount());
  root = null;
  localStorage.clear();
  vi.clearAllMocks();
});

const esperar = () => act(async () => { await new Promise((r) => setTimeout(r, 20)); });

async function recorrer({ cancelar }: { cancelar: boolean }) {
  const router = createMemoryRouter(
    [
      { path: "/biblioteca", element: createElement(Biblioteca) },
      { path: "/biblioteca/:id", element: createElement(RutinaDetalle) },
      { path: "/entrenar/:rutinaId", element: createElement(EntrenarSesion) },
      { path: "/historial", element: createElement("div", { id: "historial" }) },
    ],
    { initialEntries: [`/biblioteca?tab=rutinas&enLugarDe=${RUT_CREED}&motivo=poco-tiempo`] },
  );
  const div = document.createElement("div");
  root = createRoot(div);
  await act(async () => { root!.render(createElement(RouterProvider, { router })); });
  await esperar();
  const tocar = async (texto: string) => {
    const b = [...div.querySelectorAll("button")].find((x) => x.textContent?.trim() === texto || x.title === texto);
    if (!b) throw new Error(`no está el botón «${texto}»`);
    await act(async () => { b.click(); });
    await esperar();
  };

  expect(div.querySelector("[data-testid=franja-cambio]")?.textContent).toContain(`Cambiando ${CREED.nombre}`);
  if (cancelar) {
    await tocar("Cancelar el cambio");
    expect(div.querySelector("[data-testid=franja-cambio]")).toBeNull();
  }

  await act(async () => { (div.querySelector(".rutina-card") as HTMLElement).click(); });
  await esperar();
  expect(router.state.location.pathname).toBe(`/biblioteca/${COMBAT.idRutina}`);
  expect(!!div.querySelector("[data-testid=franja-cambio]")).toBe(!cancelar);

  await tocar("Empezar sesión");
  expect(router.state.location.pathname).toBe(`/entrenar/${COMBAT.idRutina}`);
  await tocar("Empezar");
  await tocar("Terminar");
  await tocar("Mixto");
  await tocar("Guardar");
  expect(finalizarSesion).toHaveBeenCalledOnce();
  return vi.mocked(finalizarSesion).mock.calls[0][0];
}

describe("«Ver todas»: el cambio viaja por la URL (P102)", () => {
  it("la prevista y el motivo llegan a finalizarSesion por Biblioteca y la rutina", async () => {
    const opts = await recorrer({ cancelar: false });
    expect(opts).toMatchObject({ rutinaId: COMBAT.idRutina, rutinaPrevista: RUT_CREED, motivoCambio: "poco-tiempo" });
  });

  it("con la ✕ de la franja, no llega", async () => {
    const opts = await recorrer({ cancelar: true });
    expect(opts.rutinaId).toBe(COMBAT.idRutina);
    expect("rutinaPrevista" in opts).toBe(false);
    expect("motivoCambio" in opts).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  P103 Bloque 3 — los restos de P102
// ════════════════════════════════════════════════════════════════════════════
describe("Los restos de P102 (P103)", () => {
  async function montarEn(entradas: string[], indice?: number) {
    const router = createMemoryRouter(
      [
        { path: "/biblioteca", element: createElement(Biblioteca) },
        { path: "/biblioteca/:id", element: createElement(RutinaDetalle) },
        { path: "/entrenar/:rutinaId", element: createElement(EntrenarSesion) },
        { path: "/entrenar", element: createElement("div", { id: "lista" }, "lista") },
        { path: "/historial", element: createElement("div", { id: "historial" }) },
      ],
      { initialEntries: entradas, initialIndex: indice },
    );
    const div = document.createElement("div");
    root = createRoot(div);
    await act(async () => { root!.render(createElement(RouterProvider, { router })); });
    await esperar();
    const tocar = async (texto: string) => {
      const b = [...div.querySelectorAll("button")].find((x) => x.textContent?.trim() === texto || x.title === texto);
      if (!b) throw new Error(`no está el botón «${texto}»`);
      await act(async () => { b.click(); });
      await esperar();
    };
    return { router, div, tocar };
  }

  it("en la pestaña Programas la franja se oculta: por ahí no se empieza ninguna sesión", async () => {
    const { div, router } = await montarEn([`/biblioteca?tab=programas&enLugarDe=${RUT_CREED}`]);
    expect(div.querySelector("[data-testid=franja-cambio]")).toBeNull();
    // El cambio sigue en la URL: al volver a Rutinas, la franja vuelve.
    expect(router.state.location.search).toContain("enLugarDe");
  });

  it("al empezar, el cambio sale de la navegación: «atrás» no lo vuelve a aplicar", async () => {
    const { router, tocar } = await montarEn(
      ["/biblioteca", `/entrenar/${COMBAT.idRutina}?enLugarDe=${RUT_CREED}&motivo=poco-tiempo`], 1,
    );
    // Se selló en el estado de la sesión, y la URL quedó limpia (con replace).
    const clave = `entrenar:rutina:${COMBAT.idRutina}`;
    expect(JSON.parse(localStorage.getItem(clave)!).cambio).toEqual({ rutinaPrevista: RUT_CREED, motivo: "poco-tiempo" });
    expect(router.state.location.search).toBe("");
    expect(router.state.location.state).toBeNull();

    // Sale sin guardar y vuelve con «atrás»: la sesión nueva no trae el cambio.
    await tocar("Salir");
    await tocar("Salir sin guardar");
    expect(router.state.location.pathname).toBe("/entrenar");
    await act(async () => { await router.navigate(-1); });
    await esperar();
    expect(router.state.location.pathname).toBe(`/entrenar/${COMBAT.idRutina}`);
    expect(JSON.parse(localStorage.getItem(clave)!).cambio).toBeNull();
  });
});
