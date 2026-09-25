import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";

// El hook trae los módulos de data/ para las dependencias reales; acá no se usan.
vi.mock("../firebase", () => ({ db: {}, auth: {} }));

import {
  useSincronizacionAutomatica, correrSincronizacionAutomatica,
  _reiniciarSincronizacionAutomatica, reabrirApp, useGeneracionDatosSalud,
  type DepsSincronizacion,
} from "./useSincronizacionAutomatica";
import { leerMarcas, type Almacen } from "../lib/sincronizacionAutomatica";
import { MSG_CUOTA_AGOTADA, ok, err } from "../lib/result";
import type { ResumenSincronizacion } from "../data/sincronizarPuente";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const AHORA = Date.UTC(2026, 8, 25, 15, 0);
const CORRIDA = AHORA - 60 * 60 * 1000;

function almacenMemoria(): Almacen {
  const datos = new Map<string, string>();
  return { getItem: (k) => datos.get(k) ?? null, setItem: (k, v) => { datos.set(k, v); } };
}

function resumen(uuids: string[]): ResumenSincronizacion {
  return {
    clasificadas: uuids.map((u) => ({ item: { _uuid: u } })),
    escritos: { cardio: uuids.length, mediciones: 0 },
    enriquecimiento: { matcheadas: 1 },
  } as unknown as ResumenSincronizacion;
}

function deps(over: Partial<DepsSincronizacion> = {}): DepsSincronizacion {
  return {
    leerEstado: vi.fn(() => Promise.resolve(ok({ ultimaCorridaMs: CORRIDA }))),
    sincronizar: vi.fn(() => Promise.resolve(ok(resumen(["a", "b"])))),
    almacen: almacenMemoria(),
    ahora: () => AHORA,
    online: () => true,
    trasEscribir: vi.fn(),
    ...over,
  };
}

beforeEach(() => { _reiniciarSincronizacionAutomatica(); });

describe("correrSincronizacionAutomatica", () => {
  it("sincroniza y deja las marcas", async () => {
    const d = deps();
    expect(await correrSincronizacionAutomatica("u1", "juanpablo", d)).toBe(true);
    expect(d.sincronizar).toHaveBeenCalledTimes(1);
    expect(d.trasEscribir).toHaveBeenCalledTimes(1);
    expect(leerMarcas(d.almacen, "u1")).toEqual({
      ultimaImportadaMs: CORRIDA, ultimaAutoMs: AHORA, uuidsConocidos: ["a", "b"],
    });
  });

  it("caso normal (el puente no corrió desde la última): una sola lectura, sin sincronizar", async () => {
    const d = deps();
    d.almacen!.setItem("sync-puente-u1", JSON.stringify({ ultimaImportadaMs: CORRIDA, ultimaAutoMs: AHORA - 7 * 3_600_000 }));
    expect(await correrSincronizacionAutomatica("u1", "juanpablo", d)).toBe(false);
    expect(d.leerEstado).toHaveBeenCalledTimes(1);
    expect(d.sincronizar).not.toHaveBeenCalled();
  });

  it("con una sincronización de hace 2 h no lee ni el estado", async () => {
    const d = deps();
    d.almacen!.setItem("sync-puente-u1", JSON.stringify({ ultimaAutoMs: AHORA - 2 * 3_600_000 }));
    await correrSincronizacionAutomatica("u1", "juanpablo", d);
    expect(d.leerEstado).not.toHaveBeenCalled();
  });

  it("dos llamadas en la misma carga sincronizan una sola vez", async () => {
    const d = deps();
    await Promise.all([
      correrSincronizacionAutomatica("u1", "juanpablo", d),
      correrSincronizacionAutomatica("u1", "juanpablo", d),
    ]);
    await correrSincronizacionAutomatica("u1", "juanpablo", d);
    expect(d.sincronizar).toHaveBeenCalledTimes(1);
  });

  it("con la cuota agotada no reintenta en esa carga y no deja marcas", async () => {
    const d = deps({ sincronizar: vi.fn(() => Promise.resolve(err<ResumenSincronizacion>(MSG_CUOTA_AGOTADA))) });
    expect(await correrSincronizacionAutomatica("u1", "juanpablo", d)).toBe(false);
    expect(await correrSincronizacionAutomatica("u1", "juanpablo", d)).toBe(false);
    expect(d.sincronizar).toHaveBeenCalledTimes(1);
    expect(leerMarcas(d.almacen, "u1")).toEqual({});
  });

  it("al volver a primer plano dentro de las 6 h no lee nada", async () => {
    const d = deps();
    await correrSincronizacionAutomatica("u1", "juanpablo", d);
    reabrirApp();
    await correrSincronizacionAutomatica("u1", "juanpablo", d);
    expect(d.leerEstado).toHaveBeenCalledTimes(1);   // solo la de la primera apertura
    expect(d.sincronizar).toHaveBeenCalledTimes(1);
  });

  it("al volver a primer plano después de 6 h, con el puente corrido, sincroniza de nuevo", async () => {
    let ahora = AHORA;
    let corrida = CORRIDA;
    const d = deps({
      ahora: () => ahora,
      leerEstado: vi.fn(() => Promise.resolve(ok({ ultimaCorridaMs: corrida }))),
    });
    await correrSincronizacionAutomatica("u1", "juanpablo", d);
    ahora += 7 * 3_600_000;
    corrida = ahora - 60_000;
    reabrirApp();
    expect(await correrSincronizacionAutomatica("u1", "juanpablo", d)).toBe(true);
    expect(d.sincronizar).toHaveBeenCalledTimes(2);
  });

  it("si falló por cuota, volver a primer plano tampoco reintenta en esta carga", async () => {
    const d = deps({
      ahora: () => AHORA,
      sincronizar: vi.fn(() => Promise.resolve(err<ResumenSincronizacion>(MSG_CUOTA_AGOTADA))),
    });
    await correrSincronizacionAutomatica("u1", "juanpablo", d);
    reabrirApp();
    await correrSincronizacionAutomatica("u1", "juanpablo", d);
    expect(d.sincronizar).toHaveBeenCalledTimes(1);
  });

  it("un rechazo inesperado no tira", async () => {
    const d = deps({ sincronizar: vi.fn(() => Promise.reject(new Error("boom"))) });
    await expect(correrSincronizacionAutomatica("u1", "juanpablo", d)).resolves.toBe(false);
  });
});

describe("useSincronizacionAutomatica", () => {
  let contenedor: HTMLDivElement;
  let root: Root;

  function Armazon({ d }: { d: DepsSincronizacion }) {
    useSincronizacionAutomatica("u1", "juanpablo", d);
    return null;
  }

  beforeEach(() => {
    contenedor = document.createElement("div");
    root = createRoot(contenedor);
  });
  afterEach(() => { act(() => root.unmount()); });

  it("corre una sola vez por montaje", async () => {
    const d = deps();
    await act(async () => { root.render(createElement(Armazon, { d })); });
    await act(async () => { root.render(createElement(Armazon, { d })); }); // re-render
    expect(d.sincronizar).toHaveBeenCalledTimes(1);
  });

  it("dos montajes seguidos no disparan dos sincronizaciones", async () => {
    const d = deps();
    await act(async () => { root.render(createElement(Armazon, { d })); });
    await act(async () => { root.unmount(); });
    root = createRoot(contenedor);
    await act(async () => { root.render(createElement(Armazon, { d })); });
    expect(d.sincronizar).toHaveBeenCalledTimes(1);
  });

  it("cuando entra algo sube la generación de datos (Home recarga)", async () => {
    const vistas: number[] = [];
    function Home() { vistas.push(useGeneracionDatosSalud()); return null; }
    const d = deps();
    await act(async () => { root.render(createElement("div", null,
      createElement(Armazon, { d }), createElement(Home))); });
    expect(vistas.at(-1)).toBe(1);
  });

  it("sin nada nuevo la generación no se mueve", async () => {
    const vistas: number[] = [];
    function Home() { vistas.push(useGeneracionDatosSalud()); return null; }
    const vacio = { ...resumen([]), escritos: { cardio: 0, mediciones: 0 }, enriquecimiento: { matcheadas: 0 } } as unknown as ResumenSincronizacion;
    const d = deps({ sincronizar: vi.fn(() => Promise.resolve(ok(vacio))) });
    await act(async () => { root.render(createElement("div", null,
      createElement(Armazon, { d }), createElement(Home))); });
    expect(vistas.at(-1)).toBe(0);
  });

  it("volver a primer plano dispara un intento más", async () => {
    const d = deps();
    await act(async () => { root.render(createElement(Armazon, { d })); });
    expect(d.leerEstado).toHaveBeenCalledTimes(1);
    // Las marcas dicen "hace nada": el intento corre pero no lee nada.
    // Para ver que se dispara, borramos las marcas.
    d.almacen!.setItem("sync-puente-u1", "{}");
    Object.defineProperty(document, "visibilityState", { value: "visible", configurable: true });
    await act(async () => { document.dispatchEvent(new Event("visibilitychange")); });
    expect(d.leerEstado).toHaveBeenCalledTimes(2);
  });

  it("con la cuota agotada, remontar no reintenta", async () => {
    const d = deps({ sincronizar: vi.fn(() => Promise.resolve(err<ResumenSincronizacion>(MSG_CUOTA_AGOTADA))) });
    await act(async () => { root.render(createElement(Armazon, { d })); });
    await act(async () => { root.unmount(); });
    root = createRoot(contenedor);
    await act(async () => { root.render(createElement(Armazon, { d })); });
    expect(d.sincronizar).toHaveBeenCalledTimes(1);
  });
});
