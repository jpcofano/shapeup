// P99 — la ✕ en VR por escalones. En el reloj no hay series hasta «Terminar»,
// así que salir sin guardar confirma por los minutos jugados; el cierre suma la
// ✕ y la hoja; «Guardar y salir» no se ofrece (se guarda desde el cierre, con
// la dificultad); «Reiniciar» vuelve al arranque.
import { describe, it, expect, vi, afterEach } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { RUTINAS_VR, RUT_COMBAT_LARGO } from "../lib/catalogoVR";
import {
  INITIAL_ENTRENAR_STATE, sellarEscalonVR, cerrarPorTiempo, type EntrenarState,
} from "../lib/entrenarState";
import type { Rutina } from "../types/models";

vi.mock("../firebase", () => ({ db: {}, auth: {} }));
vi.mock("../auth/useAuth", () => ({
  useAuth: () => ({ user: { uid: "u1" }, memberId: "juanpablo", loading: false }),
}));

const COMBAT = RUTINAS_VR.find((r) => r.idRutina === RUT_COMBAT_LARGO)! as Rutina;

vi.mock("../data/rutinas", () => ({
  getRutina: vi.fn(() => Promise.resolve({ ok: true, value: COMBAT })),
}));
vi.mock("../data/ejercicios", () => ({
  getEjercicio: vi.fn(() => Promise.resolve({ ok: false, error: "sin catálogo en el test" })),
}));
vi.mock("../data/historial", () => ({
  finalizarSesion: vi.fn(() => Promise.resolve({ ok: true, value: { pendiente: false } })),
  getHistorialEnLaApp: vi.fn(() => Promise.resolve({ ok: true, value: [] })),
}));
vi.mock("../data/sesiones", () => ({
  crearSesion: vi.fn(() => ({ idSesion: "SES-NUEVA" })),
  iniciarSesion: vi.fn(() => Promise.resolve({ ok: true, value: undefined })),
  descartarSesion: vi.fn(() => Promise.resolve({ ok: true, value: undefined })),
}));
vi.mock("../data/perfiles", () => ({
  getPerfiles: vi.fn(() => Promise.resolve({ ok: true, value: {} })),
}));
vi.mock("../data/configProgresion", () => ({
  getConfigProgresion: vi.fn(() => Promise.resolve({ ok: false, error: "default" })),
}));

import { EntrenarSesion } from "./EntrenarSesion";
import { descartarSesion } from "../data/sesiones";
import { finalizarSesion } from "../data/historial";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
class RO { observe() {} unobserve() {} disconnect() {} }
(globalThis as unknown as { ResizeObserver: typeof RO }).ResizeObserver ??= RO;
window.matchMedia ??= ((q: string) => ({
  matches: false, media: q, onchange: null,
  addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {},
  dispatchEvent: () => false,
})) as unknown as typeof window.matchMedia;

const CLAVE = `entrenar:rutina:${COMBAT.idRutina}`;
const MIN = 60_000;

/** Sesión empezada hace `hace` minutos; con `jugados`, ya se tocó «Terminar». */
function sesionVR(hace: number, jugados?: number): EntrenarState {
  const inicio = Date.now() - hace * MIN;
  const s = sellarEscalonVR({ ...INITIAL_ENTRENAR_STATE, inicioMs: inicio, idSesion: "SES-VR" }, {
    modo: "bloques", escalon: 1, idEjercicio: COMBAT.vr!.idEjercicio, nombreEjercicio: "Body Combat",
    prescripto: COMBAT.vr!.escaleras.bloques![0],
  }, inicio);
  return jugados != null ? cerrarPorTiempo(s, COMBAT, inicio + jugados * MIN) : s;
}

let root: Root | null = null;
afterEach(() => {
  act(() => root?.unmount());
  root = null;
  localStorage.clear();
  vi.clearAllMocks();
});

async function montar(state: EntrenarState) {
  localStorage.setItem(CLAVE, JSON.stringify(state));
  const router = createMemoryRouter(
    [
      { path: "/entrenar/:rutinaId", element: createElement(EntrenarSesion) },
      { path: "/entrenar", element: createElement("div", { id: "lista" }, "lista") },
    ],
    { initialEntries: [`/entrenar/${COMBAT.idRutina}`] },
  );
  const div = document.createElement("div");
  root = createRoot(div);
  await act(async () => { root!.render(createElement(RouterProvider, { router })); });
  await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
  const boton = (texto: string) =>
    [...div.querySelectorAll("button")].find((b) => b.textContent === texto || b.title === texto);
  const tocar = async (texto: string) => {
    const b = boton(texto);
    if (!b) throw new Error(`no está el botón «${texto}»`);
    await act(async () => { b.click(); });
  };
  return { div, boton, tocar };
}

describe("Cierre de VR por escalones: la ✕ (P99)", () => {
  it("✕ → salir sin guardar → confirmar descarta en Firestore y en el teléfono", async () => {
    const { div, boton, tocar } = await montar(sesionVR(45, 40));
    expect(div.textContent).toContain("Elegí la dificultad para guardar.");

    await tocar("Salir");
    expect(boton("Guardar y salir")).toBeUndefined();
    await tocar("Salir sin guardar");
    expect(div.textContent).toContain("Se descartan 40 min jugados.");
    expect(descartarSesion).not.toHaveBeenCalled();

    await tocar("Descartar");
    expect(descartarSesion).toHaveBeenCalledWith("SES-VR");
    expect(finalizarSesion).not.toHaveBeenCalled();
    expect(localStorage.getItem(CLAVE)).toBeNull();
    expect(div.querySelector("#lista")).not.toBeNull();
  });
});

describe("Reloj de VR por escalones (P99)", () => {
  it("salir sin guardar pide confirmación por los minutos jugados, aunque no haya series", async () => {
    const { div, boton, tocar } = await montar(sesionVR(25));
    await tocar("Salir");
    expect(boton("Guardar y salir")).toBeUndefined();
    expect(div.textContent).not.toContain("Todavía no hay series para guardar");

    await tocar("Salir sin guardar");
    expect(div.textContent).toContain("Se descartan 25 min jugados.");
    expect(descartarSesion).not.toHaveBeenCalled();
    expect(localStorage.getItem(CLAVE)).not.toBeNull();

    await tocar("Volver");
    expect(div.textContent).toContain("¿Salir de la sesión?");
  });

  it("«Reiniciar sesión» confirma por los minutos y vuelve al arranque", async () => {
    const { div, boton, tocar } = await montar(sesionVR(25));
    await tocar("Salir");
    await tocar("Reiniciar sesión");
    expect(div.textContent).toContain("¿Reiniciar la sesión?");
    expect(div.textContent).toContain("Se descartan 25 min jugados.");

    await tocar("Reiniciar");
    expect(boton("Empezar")).toBeDefined();
    const guardado = JSON.parse(localStorage.getItem(CLAVE)!) as EntrenarState;
    expect(guardado.vrEscalon).toBeNull();
    expect(guardado.idSesion).toBe("SES-VR");
    expect(descartarSesion).not.toHaveBeenCalled();
  });
});
