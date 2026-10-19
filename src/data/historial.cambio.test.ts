// P102: lo que tocaba hoy viaja del estado de la sesión al documento.
//   - la prevista sobrevive a cerrar la app (EntrenarState en el teléfono) y a
//     reiniciar, y llega a `finalizarSesion`;
//   - sin cambio, el documento no lleva nada nuevo;
//   - la sesión vieja que se guarda «la de ese día» queda en ese día.
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../firebase", () => ({ db: {}, auth: { currentUser: { uid: "u1" } } }));

const escritos: Record<string, unknown>[] = [];
vi.mock("firebase/firestore", () => ({
  collection: vi.fn(), doc: vi.fn((_db, ...p: string[]) => ({ path: p.join("/") })),
  getDocs: vi.fn(), getDoc: vi.fn(), getDocFromServer: vi.fn(),
  serverTimestamp: vi.fn(() => "TS"), updateDoc: vi.fn(),
  query: vi.fn(), where: vi.fn(), orderBy: vi.fn(), limit: vi.fn(),
  writeBatch: vi.fn(() => ({
    set: (ref: { path: string }, data: Record<string, unknown>) => {
      if (ref.path.startsWith("historial/")) escritos.push(data);
    },
    commit: () => Promise.resolve(),
  })),
}));
vi.mock("./pedidoPuente", () => ({ pedirSincronizacion: () => Promise.resolve({ ok: true, value: 1 }) }));

import { finalizarSesion } from "./historial";
import {
  INITIAL_ENTRENAR_STATE, fijarCambio, camposCambio, estadoReiniciado, estadoNuevo,
  persistEntrenarState, loadEntrenarState,
} from "../lib/entrenarState";

beforeEach(() => { escritos.length = 0; localStorage.clear(); });

const BASE = { miembro: "juanpablo" as const, bloques: [], rpe: null, duracionMin: 40 };

describe("la prevista en EntrenarState (P102)", () => {
  it("sobrevive a cerrar la app y a reiniciar", () => {
    const s = fijarCambio({ ...INITIAL_ENTRENAR_STATE, idSesion: "SES-1" },
      { rutinaPrevista: "RUT-0027", motivo: "poco-tiempo" }, "RUT-0030");
    persistEntrenarState("rutina:RUT-0030", s);
    const cargado = loadEntrenarState("rutina:RUT-0030");
    expect(cargado.cambio).toEqual({ rutinaPrevista: "RUT-0027", motivo: "poco-tiempo" });
    expect(estadoReiniciado(cargado).cambio).toEqual(cargado.cambio);
  });

  it("un estado guardado antes de P102 carga sin cambio", () => {
    const { cambio: _, ...viejo } = INITIAL_ENTRENAR_STATE;
    localStorage.setItem("entrenar:rutina:RUT-0026", JSON.stringify(viejo));
    expect(loadEntrenarState("rutina:RUT-0026").cambio).toBeNull();
  });

  it("una prevista igual a la rutina de la sesión no es un cambio", () => {
    const s = fijarCambio(INITIAL_ENTRENAR_STATE, { rutinaPrevista: "RUT-0026", motivo: null }, "RUT-0026");
    expect(s.cambio).toBeNull();
  });

  it("empezar de nuevo lleva el cambio de hoy, no el de la sesión vieja", () => {
    const vieja = fijarCambio(INITIAL_ENTRENAR_STATE, { rutinaPrevista: "RUT-0027", motivo: null });
    expect(estadoNuevo(vieja, "SES-NUEVA", null)).toMatchObject({ idSesion: "SES-NUEVA", cambio: null });
  });
});

describe("finalizarSesion con cambio (P102)", () => {
  it("la prevista y el motivo llegan al documento", async () => {
    const s = fijarCambio(INITIAL_ENTRENAR_STATE, { rutinaPrevista: "RUT-0027", motivo: "cansado" }, "RUT-0030");
    const r = await finalizarSesion({ ...BASE, rutinaId: "RUT-0030", ...camposCambio(s) });
    expect(r.ok).toBe(true);
    expect(escritos.at(-1)).toMatchObject({ idRutina: "RUT-0030", rutinaPrevista: "RUT-0027", motivoCambio: "cansado" });
  });

  it("sin motivo, solo la prevista", async () => {
    const s = fijarCambio(INITIAL_ENTRENAR_STATE, { rutinaPrevista: "RUT-0027", motivo: null });
    await finalizarSesion({ ...BASE, tipo: "libre", ...camposCambio(s) });
    const h = escritos.at(-1)!;
    expect(h.rutinaPrevista).toBe("RUT-0027");
    expect("motivoCambio" in h).toBe(false);
    expect(h.tipo).toBe("libre");
  });

  it("sin cambio no se escribe nada nuevo", async () => {
    await finalizarSesion({ ...BASE, rutinaId: "RUT-0026", ...camposCambio(INITIAL_ENTRENAR_STATE) });
    const h = escritos.at(-1)!;
    expect("rutinaPrevista" in h).toBe(false);
    expect("motivoCambio" in h).toBe(false);
  });

  it("«la de ese día»: la fecha y la semana salen del día de la sesión", async () => {
    const viernes0210 = new Date(2026, 9, 2, 20, 56).getTime();
    await finalizarSesion({ ...BASE, rutinaId: "RUT-0026", fechaMs: viernes0210 });
    expect(escritos.at(-1)).toMatchObject({ fechaRealizada: "2026-10-02", semanaInicio: "2026-09-28" });
  });
});

describe("finalizarSesion con el plan de la semana (P99)", () => {
  it("guarda la meta y el programa vigentes ese día, solo si vienen", async () => {
    await finalizarSesion({ ...BASE, rutinaId: "RUT-0026", planSemana: { metaDias: 5, idPrograma: "PRG-0013" } });
    expect(escritos.at(-1)).toMatchObject({ planSemana: { metaDias: 5, idPrograma: "PRG-0013" } });
    await finalizarSesion({ ...BASE, rutinaId: "RUT-0026" });
    expect("planSemana" in escritos.at(-1)!).toBe(false);
  });
});
