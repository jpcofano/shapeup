// P103 Bloque 4 — la salida de la sesión de juego. La ✕ y el «atrás» abren la
// hoja: salir sin guardar confirma por los minutos jugados y borra la sesión
// del teléfono; seguir jugando la cierra; terminar y guardar guarda como hoy.
import { describe, it, expect, vi, afterEach } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { createMemoryRouter, RouterProvider } from "react-router-dom";

vi.mock("../firebase", () => ({ db: {}, auth: {} }));
vi.mock("../auth/useAuth", () => ({
  useAuth: () => ({ user: { uid: "u1" }, memberId: "juanpablo", loading: false }),
}));
vi.mock("../data/visibilidad", () => ({ esOwner: () => false }));
vi.mock("../data/diccionarios", () => ({
  getJuegosSinEjercicio: vi.fn(() => Promise.resolve({ ok: true, value: ["Beat Saber"] })),
}));
vi.mock("../data/historial", () => ({
  finalizarSesion: vi.fn(() => Promise.resolve({ ok: true, value: { pendiente: false } })),
}));
vi.mock("../lib/audioAlert", () => ({ unlockAudio: vi.fn(), playPitidoVR: vi.fn(), audioSuspendido: vi.fn(() => false) }));

import { SesionJuego } from "./SesionJuego";
import { finalizarSesion } from "../data/historial";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const CLAVE = "shapeup:sesion-juego";
const MIN = 60_000;

let root: Root | null = null;
afterEach(() => {
  act(() => root?.unmount());
  root = null;
  localStorage.clear();
  vi.clearAllMocks();
});

const esperar = () => act(async () => { await new Promise((r) => setTimeout(r, 20)); });

/** Juego en curso desde hace `hace` minutos, con `/entrenar` atrás en la historia. */
async function montar(hace: number) {
  localStorage.setItem(CLAVE, JSON.stringify({ juego: "Beat Saber", inicioMs: Date.now() - hace * MIN }));
  const router = createMemoryRouter(
    [
      { path: "/entrenar", element: createElement("div", null, "lista") },
      { path: "/entrenar/juego", element: createElement(SesionJuego) },
      { path: "/historial", element: createElement("div", null, "historial") },
    ],
    { initialEntries: ["/entrenar", "/entrenar/juego"], initialIndex: 1 },
  );
  const div = document.createElement("div");
  root = createRoot(div);
  await act(async () => { root!.render(createElement(RouterProvider, { router })); });
  await esperar();
  const boton = (texto: string) =>
    [...div.querySelectorAll("button")].find((b) => b.textContent?.trim() === texto || b.title === texto);
  const tocar = async (texto: string) => {
    const b = boton(texto);
    if (!b) throw new Error(`no está el botón «${texto}»`);
    await act(async () => { b.click(); });
    await esperar();
  };
  return { router, div, boton, tocar };
}

describe("La salida de la sesión de juego (P103)", () => {
  it("la ✕ abre la hoja con las tres opciones, sin «Reiniciar»", async () => {
    const { div, boton, tocar, router } = await montar(12);
    await tocar("Salir");
    expect(div.querySelector("[role=dialog]")).not.toBeNull();
    expect(boton("Terminar y guardar")).toBeDefined();
    expect(boton("Terminar y guardar")!.disabled).toBe(false);
    expect(boton("Salir sin guardar")).toBeDefined();
    expect(boton("Seguir jugando")).toBeDefined();
    expect(boton("Reiniciar sesión")).toBeUndefined();
    expect(div.textContent).not.toContain("Todavía no hay series");
    expect(router.state.location.pathname).toBe("/entrenar/juego");
  });

  it("«Salir sin guardar» confirma con los minutos jugados, borra la sesión y vuelve a la lista", async () => {
    const { div, tocar, router } = await montar(12);
    await tocar("Salir");
    await tocar("Salir sin guardar");
    expect(div.textContent).toContain("Se descartan 12 min jugados.");
    // Volver no descarta nada.
    await tocar("Volver");
    expect(localStorage.getItem(CLAVE)).not.toBeNull();
    await tocar("Salir sin guardar");
    await tocar("Descartar");
    expect(localStorage.getItem(CLAVE)).toBeNull();
    expect(router.state.location.pathname).toBe("/entrenar");
    expect(finalizarSesion).not.toHaveBeenCalled();
  });

  it("«Seguir jugando» cierra la hoja y el juego sigue", async () => {
    const { div, tocar, router } = await montar(5);
    await tocar("Salir");
    await tocar("Seguir jugando");
    expect(div.querySelector("[role=dialog]")).toBeNull();
    expect(localStorage.getItem(CLAVE)).not.toBeNull();
    expect(router.state.location.pathname).toBe("/entrenar/juego");
  });

  it("«Terminar y guardar» guarda como el botón «Terminar» y va al historial", async () => {
    const { tocar, router } = await montar(20);
    await tocar("Salir");
    await tocar("Terminar y guardar");
    expect(finalizarSesion).toHaveBeenCalledOnce();
    expect(vi.mocked(finalizarSesion).mock.calls[0][0]).toMatchObject({
      tipo: "juego", nombreJuego: "Beat Saber", miembro: "juanpablo", bloques: [], rpe: null,
    });
    expect(localStorage.getItem(CLAVE)).toBeNull();
    expect(router.state.location.pathname).toBe("/historial");
  });

  it("el «atrás» del sistema pasa por la hoja; descartar después sí sale", async () => {
    const { div, tocar, router } = await montar(3);
    await act(async () => { await router.navigate(-1); });
    await esperar();
    expect(router.state.location.pathname).toBe("/entrenar/juego");
    expect(div.querySelector("[role=dialog]")).not.toBeNull();
    await tocar("Salir sin guardar");
    await tocar("Descartar");
    expect(router.state.location.pathname).toBe("/entrenar");
  });

  it("con menos de un minuto jugado, salir sin guardar no pregunta", async () => {
    const { tocar, router } = await montar(0.5);
    await tocar("Salir");
    await tocar("Salir sin guardar");
    expect(localStorage.getItem(CLAVE)).toBeNull();
    expect(router.state.location.pathname).toBe("/entrenar");
  });

  it("si guardar falla, la hoja queda abierta con el error y se puede reintentar", async () => {
    vi.mocked(finalizarSesion).mockResolvedValueOnce({ ok: false, error: "Sin conexión" } as never);
    const { div, tocar, router } = await montar(10);
    await tocar("Salir");
    await tocar("Terminar y guardar");
    const hoja = div.querySelector("[role=dialog]");
    expect(hoja?.textContent).toContain("Sin conexión");
    expect(router.state.location.pathname).toBe("/entrenar/juego");
    expect(localStorage.getItem(CLAVE)).not.toBeNull();
    await tocar("Terminar y guardar");
    expect(finalizarSesion).toHaveBeenCalledTimes(2);
    expect(router.state.location.pathname).toBe("/historial");
  });

  it("el botón «Terminar» del reloj sigue guardando directo, sin hoja", async () => {
    const { div, tocar, router } = await montar(8);
    await tocar("Terminar");
    expect(div.querySelector("[role=dialog]")).toBeNull();
    expect(finalizarSesion).toHaveBeenCalledOnce();
    expect(router.state.location.pathname).toBe("/historial");
  });
});
