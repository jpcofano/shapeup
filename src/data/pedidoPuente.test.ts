import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("../firebase", () => ({ db: {} }));

type Listener = { next: (snap: unknown) => void; error: (e: unknown) => void; cortado: boolean };
const listeners: Listener[] = [];
const setDocMock = vi.fn((_ref: unknown, _data: unknown) => Promise.resolve());
const getDocMock = vi.fn((_ref: unknown) => Promise.resolve({ exists: () => true, data: () => ({ ultimaCorridaMs: 777 }) }));

vi.mock("firebase/firestore", () => ({
  doc: vi.fn((_db, ...path: string[]) => ({ path: path.join("/") })),
  getDoc: (ref: unknown) => getDocMock(ref),
  setDoc: (ref: unknown, data: unknown) => setDocMock(ref, data),
  onSnapshot: vi.fn((_ref, next: Listener["next"], error: Listener["error"]) => {
    const l: Listener = { next, error, cortado: false };
    listeners.push(l);
    return () => { l.cortado = true; };
  }),
}));

import { esperarCorridaDelPuente, pedirSincronizacion, ESPERA_PUENTE_MS } from "./pedidoPuente";
import { MIN_ENTRE_PEDIDOS_MS, clavePedido } from "../lib/pedidoLocal";
import type { Almacen } from "../lib/sincronizacionAutomatica";

const snap = (ultimaCorridaMs?: number) => ({
  exists: () => ultimaCorridaMs != null,
  data: () => ({ ultimaCorridaMs }),
});

function almacen(): Almacen & { datos: Map<string, string> } {
  const datos = new Map<string, string>();
  return { datos, getItem: (k) => datos.get(k) ?? null, setItem: (k, v) => { datos.set(k, v); } };
}

beforeEach(() => { listeners.length = 0; setDocMock.mockClear(); getDocMock.mockClear(); });
afterEach(() => { vi.useRealTimers(); });

describe("esperarCorridaDelPuente (P91: contra el contador, no contra el reloj)", () => {
  beforeEach(() => { vi.useFakeTimers(); });

  it("resuelve cuando el contador se mueve respecto de corridaPreviaMs, y corta el listener", async () => {
    const p = esperarCorridaDelPuente("u1", 1000, ESPERA_PUENTE_MS);
    listeners[0].next(snap(1000));         // el inicial: la misma corrida que se vio antes de pedir
    listeners[0].next(snap(1500));         // el puente corrió
    await expect(p).resolves.toEqual({ contesto: true, estado: { ultimaCorridaMs: 1500 } });
    expect(listeners[0].cortado).toBe(true);
  });

  it("reloj corrido: una corrida con ultimaCorridaMs MENOR que el pedidoMs igual cuenta si el contador se movió", async () => {
    // pedidoMs sería 10_000 (PC adelantada); la corrida nueva del teléfono es 1500.
    const p = esperarCorridaDelPuente("u1", 1000, ESPERA_PUENTE_MS);
    listeners[0].next(snap(1500));
    await expect(p).resolves.toMatchObject({ contesto: true });
  });

  it("sin corridaPreviaMs, la base es el primer valor que llega", async () => {
    const p = esperarCorridaDelPuente("u1", undefined, ESPERA_PUENTE_MS);
    listeners[0].next(snap(2000));         // base
    listeners[0].next(snap(2000));         // sin cambio
    listeners[0].next(snap(2600));         // se movió
    await expect(p).resolves.toMatchObject({ contesto: true, estado: { ultimaCorridaMs: 2600 } });
  });

  it("devuelve 'no contestó' al vencer, y corta el listener", async () => {
    const p = esperarCorridaDelPuente("u1", 1000, 45_000);
    listeners[0].next(snap(1000));
    vi.advanceTimersByTime(45_000);
    await expect(p).resolves.toEqual({ contesto: false, motivo: "timeout" });
    expect(listeners[0].cortado).toBe(true);
  });

  it("al cancelarse (pantalla desmontada) corta el listener", async () => {
    const control = new AbortController();
    const p = esperarCorridaDelPuente("u1", 1000, 3 * 60_000, control.signal);
    control.abort();
    await expect(p).resolves.toEqual({ contesto: false, motivo: "cancelado" });
    expect(listeners[0].cortado).toBe(true);
  });

  it("un error del listener también lo corta", async () => {
    const p = esperarCorridaDelPuente("u1", 1000, 45_000);
    listeners[0].error(new Error("permission-denied"));
    await expect(p).resolves.toEqual({ contesto: false, motivo: "error" });
    expect(listeners[0].cortado).toBe(true);
  });
});

describe("pedirSincronizacion", () => {
  it("escribe pedidoMs, origen y la corridaPreviaMs que le pasan (sin leer)", async () => {
    const a = almacen();
    const r = await pedirSincronizacion("u1", "boton", { ahora: 1234, almacen: a, corridaPreviaMs: 900 });
    expect(r).toEqual({ ok: true, value: { yaPedido: false, pedidoMs: 1234, corridaPreviaMs: 900 } });
    expect(setDocMock).toHaveBeenCalledWith({ path: "ingesta-sdk/u1/estado/pedido" },
      { pedidoMs: 1234, origen: "boton", corridaPreviaMs: 900 });
    expect(getDocMock).not.toHaveBeenCalled();
  });

  it("sin corridaPreviaMs del llamador, la lee de estado/puente", async () => {
    const r = await pedirSincronizacion("u1", "fin-sesion", { ahora: 1, almacen: almacen() });
    expect(r).toMatchObject({ ok: true, value: { corridaPreviaMs: 777 } });
    expect(getDocMock).toHaveBeenCalledTimes(1);
  });

  it("dos llamadas seguidas escriben una sola vez; la segunda devuelve yaPedido", async () => {
    const a = almacen();
    await pedirSincronizacion("u1", "fin-sesion", { ahora: 10_000, almacen: a, corridaPreviaMs: 0 });
    const r2 = await pedirSincronizacion("u1", "boton", { ahora: 25_000, almacen: a, corridaPreviaMs: 0 });
    expect(r2).toEqual({ ok: true, value: { yaPedido: true, haceMs: 15_000 } });
    expect(setDocMock).toHaveBeenCalledTimes(1);
  });

  it("pasado el minuto vuelve a escribir", async () => {
    const a = almacen();
    await pedirSincronizacion("u1", "boton", { ahora: 10_000, almacen: a, corridaPreviaMs: 0 });
    await pedirSincronizacion("u1", "boton", { ahora: 10_000 + MIN_ENTRE_PEDIDOS_MS, almacen: a, corridaPreviaMs: 0 });
    expect(setDocMock).toHaveBeenCalledTimes(2);
  });

  it("con la marca en el futuro (reloj movido), escribe", async () => {
    const a = almacen();
    a.datos.set(clavePedido("u1"), JSON.stringify({ ms: 99_999_999 }));
    const r = await pedirSincronizacion("u1", "boton", { ahora: 10_000, almacen: a, corridaPreviaMs: 0 });
    expect(r).toMatchObject({ ok: true, value: { yaPedido: false } });
    expect(setDocMock).toHaveBeenCalledTimes(1);
  });

  it("si la escritura falla devuelve error, no tira, y no deja marca", async () => {
    const a = almacen();
    setDocMock.mockImplementationOnce(() => Promise.reject(new Error("permission-denied")));
    expect(await pedirSincronizacion("u1", "fin-sesion", { ahora: 1, almacen: a, corridaPreviaMs: 0 }))
      .toEqual({ ok: false, error: "permission-denied" });
    expect(a.datos.size).toBe(0);
  });
});
