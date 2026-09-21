// ════════════════════════════════════════════════════════════════════════════
//  cacheDiasActivos.test.ts — la caché de semanas cerradas (P77b).
// ════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  leerSemanaCache, guardarSemanaCache, limpiarCacheDiasActivos, PREFIJO_CACHE_DIAS,
} from "./cacheDiasActivos";
import type { DiaActivo } from "./racha";

/** Doble de `localStorage`: lo mínimo que usa el módulo. */
class StorageFalso {
  private datos = new Map<string, string>();
  get length() { return this.datos.size; }
  key(i: number) { return [...this.datos.keys()][i] ?? null; }
  getItem(k: string) { return this.datos.get(k) ?? null; }
  setItem(k: string, v: string) { this.datos.set(k, v); }
  removeItem(k: string) { this.datos.delete(k); }
  clear() { this.datos.clear(); }
}

let store: StorageFalso;

beforeEach(() => {
  store = new StorageFalso();
  vi.stubGlobal("localStorage", store);
});

const dia = (fecha: string): DiaActivo => ({
  fecha, shapeUp: false, externaDeclarada: true, autodetectada: false, minutos: 40,
});

describe("cacheDiasActivos", () => {
  it("lo guardado se vuelve a leer igual", () => {
    const dias = [dia("2026-09-07"), dia("2026-09-09")];
    guardarSemanaCache("juanpablo", "2026-09-07", dias, false);
    expect(leerSemanaCache("juanpablo", "2026-09-07")).toEqual(dias);
  });

  it("una semana sin nada se guarda como lista vacía, que NO es lo mismo que ausente", () => {
    guardarSemanaCache("juanpablo", "2026-09-07", [], false);
    // `[]` = "esa semana no tuvo actividad"; `null` = "no está en la caché".
    expect(leerSemanaCache("juanpablo", "2026-09-07")).toEqual([]);
    expect(leerSemanaCache("juanpablo", "2026-08-31")).toBeNull();
  });

  it("la semana EN CURSO nunca se guarda", () => {
    guardarSemanaCache("juanpablo", "2026-09-14", [dia("2026-09-14")], true);
    expect(leerSemanaCache("juanpablo", "2026-09-14")).toBeNull();
  });

  it("cada miembro tiene su propia clave", () => {
    guardarSemanaCache("juanpablo", "2026-09-07", [dia("2026-09-07")], false);
    expect(leerSemanaCache("maria", "2026-09-07")).toBeNull();
  });

  it("limpiar borra todas las claves de la caché, de todos los miembros", () => {
    guardarSemanaCache("juanpablo", "2026-09-07", [dia("2026-09-07")], false);
    guardarSemanaCache("maria",     "2026-08-31", [dia("2026-08-31")], false);
    store.setItem("otra-cosa", "no tocar");

    limpiarCacheDiasActivos();

    expect(leerSemanaCache("juanpablo", "2026-09-07")).toBeNull();
    expect(leerSemanaCache("maria", "2026-08-31")).toBeNull();
    expect(store.getItem("otra-cosa")).toBe("no tocar");
  });

  it("las claves llevan el prefijo con versión", () => {
    guardarSemanaCache("juanpablo", "2026-09-07", [], false);
    expect(store.key(0)?.startsWith(PREFIJO_CACHE_DIAS)).toBe(true);
  });

  it("un JSON roto se lee como ausente, no rompe", () => {
    store.setItem(`${PREFIJO_CACHE_DIAS}juanpablo-2026-09-07`, "{esto no es json");
    expect(leerSemanaCache("juanpablo", "2026-09-07")).toBeNull();
  });

  it("sin localStorage no rompe nada: se sigue sin caché", () => {
    vi.stubGlobal("localStorage", undefined);
    expect(() => guardarSemanaCache("juanpablo", "2026-09-07", [], false)).not.toThrow();
    expect(leerSemanaCache("juanpablo", "2026-09-07")).toBeNull();
    expect(() => limpiarCacheDiasActivos()).not.toThrow();
  });

  it("si el storage tira al escribir, se sigue igual", () => {
    vi.stubGlobal("localStorage", {
      ...store,
      setItem: () => { throw new Error("QuotaExceeded"); },
      getItem: () => null,
      get length() { return 0; },
      key: () => null,
      removeItem: () => {},
    });
    expect(() => guardarSemanaCache("juanpablo", "2026-09-07", [], false)).not.toThrow();
  });
});
