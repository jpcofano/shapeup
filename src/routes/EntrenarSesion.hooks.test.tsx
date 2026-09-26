// Regresión del Minified React error #310 ("Rendered more hooks than during the
// previous render"). EntrenarSesion tenía dos useEffect (P79) DESPUÉS de los
// returns tempranos de carga: el primer render (cargando) llamaba menos hooks
// que el siguiente, y React cortaba. Este test monta la pantalla con la capa de
// datos mockeada, deja que la carga termine y verifica que no explote.
import { describe, it, expect, vi, afterEach } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { createMemoryRouter, RouterProvider } from "react-router-dom";

vi.mock("../firebase", () => ({ db: {}, auth: {} }));
vi.mock("../auth/useAuth", () => ({
  useAuth: () => ({ user: { uid: "u1" }, memberId: "juanpablo", loading: false }),
}));

const RUTINA = {
  idRutina: "RUT-TEST", nombre: "Fuerza de prueba", nombreCanonico: "fuerza de prueba",
  bloques: [{
    orden: 1, idEjercicio: "EJ-0001", nombreEjercicio: "Sentadilla",
    prescripcion: {
      modalidad: "Fuerza", series: 3, descansoSeg: 60,
      repsObjetivo: { value: 10, min: 8, max: 12, raw: "8-12" },
    },
  }],
};

vi.mock("../data/rutinas", () => ({
  getRutina: vi.fn(() => Promise.resolve({ ok: true, value: RUTINA })),
}));
vi.mock("../data/ejercicios", () => ({
  getEjercicio: vi.fn(() => Promise.resolve({ ok: false, error: "sin catálogo en el test" })),
}));
vi.mock("../data/historial", () => ({
  finalizarSesion: vi.fn(() => Promise.resolve({ ok: true, value: undefined })),
  getHistorialEnLaApp: vi.fn(() => Promise.resolve({ ok: true, value: [] })),
}));
vi.mock("../data/sesiones", () => ({
  crearSesion: vi.fn(() => ({ idSesion: "SES-TEST" })),
  iniciarSesion: vi.fn(() => Promise.resolve({ ok: true, value: undefined })),
  descartarSesion: vi.fn(() => Promise.resolve({ ok: true, value: undefined })),
}));
vi.mock("../data/perfiles", () => ({
  getPerfiles: vi.fn(() => Promise.resolve({ ok: true, value: {} })),
}));

import { EntrenarSesion } from "./EntrenarSesion";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// jsdom no trae ResizeObserver; la pantalla lo usa para el degradé de scroll.
class RO { observe() {} unobserve() {} disconnect() {} }
(globalThis as unknown as { ResizeObserver: typeof RO }).ResizeObserver ??= RO;
// Ni matchMedia (MediaTabs lo usa para prefers-reduced-motion).
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
});

describe("EntrenarSesion — orden de hooks (React #310)", () => {
  it("monta, termina de cargar y no cambia la cantidad de hooks entre renders", async () => {
    const errores: unknown[] = [];
    const spy = vi.spyOn(console, "error").mockImplementation((...a) => { errores.push(a); });

    const router = createMemoryRouter(
      [{ path: "/entrenar/:rutinaId", element: createElement(EntrenarSesion),
         errorElement: createElement("div", { id: "boundary" }, "crash") }],
      { initialEntries: ["/entrenar/RUT-TEST"] },
    );
    const contenedor = document.createElement("div");
    root = createRoot(contenedor);
    await act(async () => { root!.render(createElement(RouterProvider, { router })); });
    // Deja resolver la carga (getRutina → setLoading(false)) y los efectos siguientes.
    await act(async () => { await new Promise((r) => setTimeout(r, 20)); });

    spy.mockRestore();
    const texto = errores.map((e) => String((e as unknown[])[0] instanceof Error ? (e as Error[])[0].message : (e as unknown[])[0])).join("\n");
    expect(texto).not.toMatch(/Rendered more hooks|Rendered fewer hooks|change in the order of Hooks/);
    expect(contenedor.querySelector("#boundary")).toBeNull();
    expect(contenedor.textContent).toContain("Sentadilla");
  });
});
