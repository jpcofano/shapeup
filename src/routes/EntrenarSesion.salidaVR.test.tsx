// P99 — la ✕ en VR por escalones. En el reloj no hay series hasta «Terminar»,
// así que salir sin guardar confirma por los minutos jugados; el cierre suma la
// ✕ y la hoja; «Guardar y salir» no se ofrece (se guarda desde el cierre, con
// la dificultad); «Reiniciar» vuelve al arranque.
import { describe, it, expect, vi, afterEach } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { RUTINAS_VR, RUT_COMBAT_LARGO, RUT_A_MEDIDA } from "../lib/catalogoVR";
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
vi.mock("../lib/audioAlert", () => ({ unlockAudio: vi.fn(), playPitidoVR: vi.fn(), audioSuspendido: vi.fn(() => false) }));

import { EntrenarSesion } from "./EntrenarSesion";
import { descartarSesion, crearSesion } from "../data/sesiones";
import { getRutina } from "../data/rutinas";
import { finalizarSesion } from "../data/historial";
import { playPitidoVR, audioSuspendido } from "../lib/audioAlert";
import { fijarCambio } from "../lib/entrenarState";

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

async function montar(state: EntrenarState | null, navState?: unknown) {
  if (state) localStorage.setItem(CLAVE, JSON.stringify(state));
  const router = createMemoryRouter(
    [
      { path: "/entrenar/:rutinaId", element: createElement(EntrenarSesion) },
      { path: "/entrenar", element: createElement("div", { id: "lista" }, "lista") },
      { path: "/historial", element: createElement("div", { id: "historial" }, "historial") },
    ],
    { initialEntries: [{ pathname: `/entrenar/${COMBAT.idRutina}`, state: navState }] },
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

// ════════════════════════════════════════════════════════════════════════════
//  P102 — la sesión vieja que quedó en el cierre
//
//  La de prueba del 02/10 quedó en el cierre: al montar se abría la hoja
//  «quedó abierta desde…» encima del cierre, y «Seguir entrenando» dejaba a
//  Juan en un cierre de hace 13 días que, si guardaba, registraba 0 minutos.
// ════════════════════════════════════════════════════════════════════════════
const HACE_13_DIAS = 13 * 24 * 60;

describe("Sesión vieja de VR en el cierre (P102)", () => {
  it("con menos de 1 minuto jugado, se reinicia sola y arranca en «Empezar»", async () => {
    const { div, boton } = await montar(sesionVR(HACE_13_DIAS, 0.5));
    expect(boton("Empezar")).toBeDefined();
    expect(div.textContent).not.toContain("quedó abierta");
    expect(div.textContent).not.toContain("Elegí la dificultad para guardar.");
  });

  it("con 40 minutos: la hoja sin «Seguir entrenando», y «Guardar la de ese día» lleva al cierre", async () => {
    const vieja = sesionVR(HACE_13_DIAS, 40);
    const { div, boton, tocar } = await montar(vieja);
    expect(div.textContent).toContain("quedó abierta desde");
    expect(boton("Seguir entrenando")).toBeUndefined();
    expect(boton("Reiniciar sesión")).toBeUndefined();
    expect(boton("Salir sin guardar")).toBeDefined();

    await tocar("Guardar la de ese día");
    expect(div.textContent).not.toContain("quedó abierta desde");
    expect(div.textContent).toContain("Elegí la dificultad para guardar.");

    // Se guarda en el día en que se jugó, no hoy.
    await tocar("Mixto");
    await tocar("Guardar");
    const opts = vi.mocked(finalizarSesion).mock.calls[0][0];
    expect(opts.fechaMs).toBe(vieja.vrInicioMs);
    expect(opts.duracionMin).toBe(40);
  });

  it("«Descartar y empezar de nuevo» descarta en Firestore y en el teléfono, y deja el arranque con una sesión nueva", async () => {
    const { div, boton, tocar } = await montar(sesionVR(HACE_13_DIAS, 40));
    await tocar("Descartar y empezar de nuevo");

    expect(descartarSesion).toHaveBeenCalledWith("SES-VR");
    expect(crearSesion).toHaveBeenCalled();
    expect(boton("Empezar")).toBeDefined();
    expect(div.textContent).not.toContain("quedó abierta");
    const guardado = JSON.parse(localStorage.getItem(CLAVE)!) as EntrenarState;
    expect(guardado.idSesion).toBe("SES-NUEVA");
    expect(guardado.vrEscalon).toBeNull();
    expect(guardado.registro).toEqual({});
    expect(finalizarSesion).not.toHaveBeenCalled();
  });

  it("con el reloj corriendo (sin «Terminar»), se reinicia sola como siempre", async () => {
    const { boton } = await montar(sesionVR(HACE_13_DIAS));
    expect(boton("Empezar")).toBeDefined();
  });
});

describe("La guía de bloques en el reloj (P102)", () => {
  it("dice el bloque, cuánto queda, la hora y el fin previsto; no suena al montar", async () => {
    // Combat largo E1: 2 × 20 con 2:00. A los 25 min: bloque 2, quedan 17:00.
    const { div } = await montar(sesionVR(25));
    const fase = div.querySelector("[data-testid=guia-fase]")!.textContent!;
    expect(fase).toMatch(/^Bloque 2 de 2 · quedan 1[67]:\d\d \(hasta las \d\d:\d\d\)$/);
    expect(div.querySelector("[data-testid=guia-fin]")!.textContent).toMatch(/^Fin previsto \d\d:\d\d$/);
    expect(playPitidoVR).not.toHaveBeenCalled();
  });

  it("en el descanso, cuándo arranca el bloque siguiente", async () => {
    const { div } = await montar(sesionVR(21));
    expect(div.querySelector("[data-testid=guia-fase]")!.textContent).toMatch(/^Descanso · quedan [01]:\d\d \(bloque 2 a las \d\d:\d\d\)$/);
  });
});

describe("Lo que tocaba hoy llega al guardado (P102)", () => {
  it("desde «Cambiar»: la prevista se fija al montar y viaja a finalizarSesion", async () => {
    const cambio = { rutinaPrevista: "RUT-0027", motivo: "poco-tiempo" as const };
    await montar(null, { cambio });
    const guardado = JSON.parse(localStorage.getItem(CLAVE)!) as EntrenarState;
    expect(guardado.cambio).toEqual(cambio);
  });

  it("al cerrar la sesión, el historial lleva la prevista y el motivo", async () => {
    const s = fijarCambio(sesionVR(45, 40), { rutinaPrevista: "RUT-0027", motivo: "cansado" }, COMBAT.idRutina);
    const { tocar } = await montar(s);
    await tocar("Mixto");
    await tocar("Guardar");
    expect(finalizarSesion).toHaveBeenCalledWith(expect.objectContaining({
      rutinaId: COMBAT.idRutina, rutinaPrevista: "RUT-0027", motivoCambio: "cansado",
    }));
  });

  it("sin cambio, no se manda nada nuevo", async () => {
    const { tocar } = await montar(sesionVR(45, 40));
    await tocar("Mixto");
    await tocar("Guardar");
    const opts = vi.mocked(finalizarSesion).mock.calls[0][0];
    expect("rutinaPrevista" in opts).toBe(false);
    expect("motivoCambio" in opts).toBe(false);
  });
});

describe("VR a medida: el arranque (P102)", () => {
  const A_MEDIDA = RUTINAS_VR.find((r) => r.idRutina === RUT_A_MEDIDA)! as Rutina;

  it("ofrece los controles y, con 1 bloque, sella de corrido sin descanso", async () => {
    vi.mocked(getRutina).mockImplementation((id: string) =>
      Promise.resolve({ ok: true, value: id === RUT_A_MEDIDA ? A_MEDIDA : COMBAT }));
    const router = createMemoryRouter(
      [{ path: "/entrenar/:rutinaId", element: createElement(EntrenarSesion) }],
      { initialEntries: [`/entrenar/${RUT_A_MEDIDA}`] },
    );
    const div = document.createElement("div");
    root = createRoot(div);
    await act(async () => { root!.render(createElement(RouterProvider, { router })); });
    await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
    const boton = (t: string) => [...div.querySelectorAll("button")].find((b) => b.textContent === t || b.getAttribute("aria-label") === t);

    // Sin historia, con Les Mills: el escalón 1 de Combat largo, 2 × 20 con 2:00.
    expect(div.textContent).toContain("2 × 20 min, 2:00 de descanso");
    expect(div.textContent).toContain("Si empezás ahora, terminás a las");
    await act(async () => { boton("Menos bloques")!.click(); });
    expect(boton("Menos bloques")!.disabled).toBe(true);
    expect(div.textContent).toContain("20 min de corrido");

    await act(async () => { boton("Empezar")!.click(); });
    const guardado = JSON.parse(localStorage.getItem(`entrenar:rutina:${RUT_A_MEDIDA}`)!) as EntrenarState;
    expect(guardado.vrEscalon).toMatchObject({
      modo: "corrido", escalon: 1, prescripto: { bloques: 1, minutosBloque: 20, descansoSeg: 0 },
    });
    vi.mocked(getRutina).mockImplementation(() => Promise.resolve({ ok: true, value: COMBAT }));
  });
});

describe("Reiniciar una sesión vieja toma el cambio de hoy (P102)", () => {
  const viejaConCambio = () => fijarCambio(sesionVR(HACE_13_DIAS, 0.5), { rutinaPrevista: "RUT-0027", motivo: "cansado" }, COMBAT.idRutina);

  it("sin cambio hoy, la sesión reiniciada no hereda el de ese día", async () => {
    await montar(viejaConCambio());
    const guardado = JSON.parse(localStorage.getItem(CLAVE)!) as EntrenarState;
    expect(guardado.cambio).toBeNull();
  });

  it("con cambio hoy, se queda con el de hoy", async () => {
    await montar(viejaConCambio(), { cambio: { rutinaPrevista: "RUT-0028", motivo: null } });
    const guardado = JSON.parse(localStorage.getItem(CLAVE)!) as EntrenarState;
    expect(guardado.cambio).toEqual({ rutinaPrevista: "RUT-0028", motivo: null });
  });

  it("una sesión de hoy conserva el suyo aunque se llegue sin cambio", async () => {
    await montar(fijarCambio(sesionVR(10), { rutinaPrevista: "RUT-0027", motivo: null }, COMBAT.idRutina));
    const guardado = JSON.parse(localStorage.getItem(CLAVE)!) as EntrenarState;
    expect(guardado.cambio).toEqual({ rutinaPrevista: "RUT-0027", motivo: null });
  });
});

describe("El aviso de sonido al reabrir (P102)", () => {
  it("con el contexto suspendido, el reloj pide un toque; el primer toque lo saca", async () => {
    vi.mocked(audioSuspendido).mockReturnValue(true);
    const { div } = await montar(sesionVR(25));
    expect(div.textContent).toContain("Tocá la pantalla para activar el sonido");
    await act(async () => { window.dispatchEvent(new Event("pointerdown")); });
    expect(div.textContent).not.toContain("Tocá la pantalla para activar el sonido");
    vi.mocked(audioSuspendido).mockReturnValue(false);
  });

  it("con el sonido andando, no hay aviso", async () => {
    const { div } = await montar(sesionVR(25));
    expect(div.textContent).not.toContain("Tocá la pantalla para activar el sonido");
  });
});
