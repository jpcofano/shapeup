// P103 Bloque 3 — «Ver todas» por la pestaña Ejercicios: «Empezar este
// ejercicio» lleva la prevista a la sesión de un ejercicio suelto, que la sella
// y la saca de la navegación.
import { describe, it, expect, vi, afterEach } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import type { Ejercicio } from "../types/models";
import { INITIAL_ENTRENAR_STATE } from "../lib/entrenarState";
import { CLAVE_CONFIG_LIBRE } from "../lib/sesionLibre";

vi.mock("../firebase", () => ({ db: {}, auth: {} }));
vi.mock("../auth/useAuth", () => ({
  useAuth: () => ({ user: { uid: "u1" }, memberId: "juanpablo", loading: false }),
}));

const EJ = {
  idEjercicio: "EJ-0001", nombre: "Sentadilla", nombreCanonico: "sentadilla", sinonimos: [],
  modalidad: "Fuerza", grupoMuscularPrimario: "Cuádriceps", gruposSecundarios: [],
  equipo: [], nivel: "Principiante", imagenes: [], descansoSugeridoSeg: 90,
  instrucciones: [], erroresComunes: [], puntosClave: [], consejosSeguridad: [],
} as unknown as Ejercicio;

vi.mock("../data/ejercicios", () => ({
  getEjercicios: vi.fn(() => Promise.resolve({ ok: true, value: [EJ] })),
  getEjercicio: vi.fn(() => Promise.resolve({ ok: true, value: EJ })),
  getEjerciciosPorId: vi.fn(() => Promise.resolve({ ok: true, value: { encontrados: new Map() } })),
}));
vi.mock("../data/rutinas", () => ({
  getRutina: vi.fn(() => Promise.resolve({ ok: true, value: { idRutina: "RUT-0027", nombre: "VR — Creed" } })),
  getRutinas: vi.fn(() => Promise.resolve({ ok: true, value: [] })),
}));
vi.mock("../data/programas", () => ({
  getProgramas: vi.fn(() => Promise.resolve({ ok: true, value: [] })),
  getProgramaActivo: vi.fn(() => Promise.resolve({ ok: true, value: null })),
}));
vi.mock("../data/visibilidad", () => ({
  getVisibilidad: vi.fn(() => Promise.resolve({ ok: true, value: null })),
  programaVisible: () => true,
}));
vi.mock("../data/historial", () => ({
  finalizarSesion: vi.fn(() => Promise.resolve({ ok: true, value: { pendiente: false } })),
  getHistorialEnLaApp: vi.fn(() => Promise.resolve({ ok: true, value: [] })),
}));
vi.mock("../data/perfiles", () => ({ getPerfiles: vi.fn(() => Promise.resolve({ ok: true, value: {} })) }));

import { Biblioteca } from "./Biblioteca";
import { EntrenarSesionLibre } from "./EntrenarSesionLibre";
import { getEjerciciosPorId } from "../data/ejercicios";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
class RO { observe() {} unobserve() {} disconnect() {} }
(globalThis as unknown as { ResizeObserver: typeof RO }).ResizeObserver ??= RO;
window.matchMedia ??= ((q: string) => ({
  matches: false, media: q, onchange: null,
  addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {},
  dispatchEvent: () => false,
})) as unknown as typeof window.matchMedia;

let root: Root | null = null;
afterEach(() => { act(() => root?.unmount()); root = null; localStorage.clear(); vi.clearAllMocks(); });
const esperar = () => act(async () => { await new Promise((r) => setTimeout(r, 20)); });

describe("«Ver todas» por Ejercicios (P103)", () => {
  it("la franja se ve y «Empezar este ejercicio» lleva la prevista; la sesión la sella y limpia la URL", async () => {
    const router = createMemoryRouter(
      [
        { path: "/biblioteca", element: createElement(Biblioteca) },
        { path: "/entrenar/ejercicio/:idEjercicio", element: createElement(EntrenarSesionLibre) },
      ],
      { initialEntries: ["/biblioteca?tab=ejercicios&enLugarDe=RUT-0027&motivo=cansado"] },
    );
    const div = document.createElement("div");
    root = createRoot(div);
    await act(async () => { root!.render(createElement(RouterProvider, { router })); });
    await esperar();

    expect(div.querySelector("[data-testid=franja-cambio]")?.textContent).toContain("Cambiando VR — Creed");
    // Se abre la tarjeta del ejercicio y se empieza.
    const cabecera = [...div.querySelectorAll("button")].find((b) => b.textContent?.includes("Sentadilla"))!;
    await act(async () => { cabecera.click(); });
    const empezar = [...div.querySelectorAll("button")].find((b) => b.textContent?.trim() === "Empezar este ejercicio")!;
    await act(async () => { empezar.click(); });
    await esperar();
    await esperar();

    expect(router.state.location.pathname).toBe("/entrenar/ejercicio/EJ-0001");
    expect(JSON.parse(localStorage.getItem("entrenar:libre:temp")!).cambio).toEqual({ rutinaPrevista: "RUT-0027", motivo: "cansado" });
    // Consumido: «atrás» no lo vuelve a aplicar.
    expect(router.state.location.search).toBe("");
  });

  it("con otra sesión libre pendiente, el cambio no se le sella a ella: lo lleva la sesión nueva del atajo", async () => {
    const OTRO = { ...EJ, idEjercicio: "EJ-0002", nombre: "Remo" } as Ejercicio;
    vi.mocked(getEjerciciosPorId).mockResolvedValue({ ok: true, value: { encontrados: new Map([["EJ-0002", OTRO]]) } } as never);
    localStorage.setItem(CLAVE_CONFIG_LIBRE, JSON.stringify({ idsEjercicio: ["EJ-0002"], defaults: [{ series: 3, reps: 10 }] }));
    localStorage.setItem("entrenar:libre:temp", JSON.stringify({
      ...INITIAL_ENTRENAR_STATE, inicioMs: Date.now() - 10 * 60_000, seriesHechas: { 0: 1 },
    }));
    const router = createMemoryRouter(
      [
        { path: "/entrenar/ejercicio/:idEjercicio", element: createElement(EntrenarSesionLibre) },
        { path: "/entrenar", element: createElement("div", null, "lista") },
      ],
      { initialEntries: ["/entrenar/ejercicio/EJ-0001?enLugarDe=RUT-0027&motivo=cansado"] },
    );
    const div = document.createElement("div");
    root = createRoot(div);
    await act(async () => { root!.render(createElement(RouterProvider, { router })); });
    await esperar();
    await esperar();

    // La hoja pregunta por la sesión pendiente; esa sesión no recibe el cambio.
    expect(div.textContent).toContain("Tenés una sesión libre sin cerrar");
    expect(JSON.parse(localStorage.getItem("entrenar:libre:temp")!).cambio).toBeNull();
    expect(router.state.location.search).toBe("");

    // Se descarta: arranca la del atajo, y esa sí lleva el cambio.
    const salir = [...div.querySelectorAll("button")].find((b) => b.textContent?.trim() === "Salir sin guardar")!;
    await act(async () => { salir.click(); });
    expect(div.textContent).toContain("Se descarta 1 serie.");
    const descartar = [...div.querySelectorAll("button")].find((b) => b.textContent?.trim() === "Descartar")!;
    await act(async () => { descartar.click(); });
    await esperar();
    const nueva = JSON.parse(localStorage.getItem("entrenar:libre:temp")!);
    expect(nueva.cambio).toEqual({ rutinaPrevista: "RUT-0027", motivo: "cansado" });
    expect(nueva.seriesHechas).toEqual({});
  });
});
