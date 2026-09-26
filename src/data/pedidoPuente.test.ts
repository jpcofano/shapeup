import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("../firebase", () => ({ db: {} }));

type Listener = { next: (snap: unknown) => void; error: (e: unknown) => void; cortado: boolean };
const listeners: Listener[] = [];
const setDocMock = vi.fn((_ref: unknown, _data: unknown) => Promise.resolve());

vi.mock("firebase/firestore", () => ({
  doc: vi.fn((_db, ...path: string[]) => ({ path: path.join("/") })),
  getDoc: vi.fn(),
  setDoc: (ref: unknown, data: unknown) => setDocMock(ref, data),
  onSnapshot: vi.fn((_ref, next: Listener["next"], error: Listener["error"]) => {
    const l: Listener = { next, error, cortado: false };
    listeners.push(l);
    return () => { l.cortado = true; };
  }),
}));

import { esperarCorridaDelPuente, pedirSincronizacion, ESPERA_PUENTE_MS } from "./pedidoPuente";

const snap = (ultimaCorridaMs?: number) => ({
  exists: () => ultimaCorridaMs != null,
  data: () => ({ ultimaCorridaMs }),
});

beforeEach(() => { listeners.length = 0; setDocMock.mockClear(); vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); });

describe("esperarCorridaDelPuente", () => {
  it("resuelve cuando ultimaCorridaMs avanza, y corta el listener", async () => {
    const p = esperarCorridaDelPuente("u1", 1000, ESPERA_PUENTE_MS);
    listeners[0].next(snap(900));          // el inicial: todavía la corrida vieja
    listeners[0].next(snap(1500));         // el puente corrió
    await expect(p).resolves.toEqual({ contesto: true, estado: { ultimaCorridaMs: 1500 } });
    expect(listeners[0].cortado).toBe(true);
  });

  it("devuelve 'no contestó' al vencer, y corta el listener", async () => {
    const p = esperarCorridaDelPuente("u1", 1000, 45_000);
    listeners[0].next(snap(900));
    vi.advanceTimersByTime(45_000);
    await expect(p).resolves.toEqual({ contesto: false, motivo: "timeout" });
    expect(listeners[0].cortado).toBe(true);
  });

  it("un error del listener también lo corta y no deja la promesa colgada", async () => {
    const p = esperarCorridaDelPuente("u1", 1000, 45_000);
    listeners[0].error(new Error("permission-denied"));
    await expect(p).resolves.toEqual({ contesto: false, motivo: "error" });
    expect(listeners[0].cortado).toBe(true);
  });

  it("una corrida igual a desdeMs no cuenta como respuesta", async () => {
    const p = esperarCorridaDelPuente("u1", 1000, 10);
    listeners[0].next(snap(1000));
    vi.advanceTimersByTime(10);
    await expect(p).resolves.toMatchObject({ contesto: false });
  });
});

describe("pedirSincronizacion", () => {
  it("escribe pedidoMs y origen en estado/pedido", async () => {
    vi.useRealTimers();
    const r = await pedirSincronizacion("u1", "boton", 1234);
    expect(r).toEqual({ ok: true, value: 1234 });
    expect(setDocMock).toHaveBeenCalledWith({ path: "ingesta-sdk/u1/estado/pedido" }, { pedidoMs: 1234, origen: "boton" });
  });

  it("si la escritura falla devuelve error, no tira", async () => {
    vi.useRealTimers();
    setDocMock.mockImplementationOnce(() => Promise.reject(new Error("permission-denied")));
    expect(await pedirSincronizacion("u1", "fin-sesion", 1)).toEqual({ ok: false, error: "permission-denied" });
  });
});
