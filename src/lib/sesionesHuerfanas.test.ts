import { describe, it, expect } from "vitest";
import {
  generarIdSesion, idsSesionLocales, esSesionHuerfana, UMBRAL_HUERFANA_MS,
} from "./sesionesHuerfanas";

/** Storage mínimo en memoria para no depender del localStorage real. */
function storage(datos: Record<string, string>) {
  const claves = Object.keys(datos);
  return {
    get length() { return claves.length; },
    key: (i: number) => claves[i] ?? null,
    getItem: (k: string) => datos[k] ?? null,
  };
}

describe("generarIdSesion", () => {
  it("dos llamadas en el mismo milisegundo dan ids distintos", () => {
    const ahora = new Date("2026-09-16T12:34:56.789Z");
    const a = generarIdSesion(ahora);
    const b = generarIdSesion(ahora);
    expect(a).not.toBe(b);
    expect(a.startsWith("SES-20260916123456-")).toBe(true);
  });

  it("formato: prefijo, timestamp y sufijo de 6 caracteres", () => {
    const id = generarIdSesion(new Date("2026-09-16T12:34:56.789Z"), () => 0);
    expect(id).toBe("SES-20260916123456-000000");
    expect(generarIdSesion(new Date(0), () => 0.999999)).toMatch(/^SES-\d{14}-[0-9a-z]{6}$/);
  });
});

describe("idsSesionLocales", () => {
  it("junta los idSesion de las claves entrenar:*", () => {
    const ids = idsSesionLocales(storage({
      "entrenar:rutina:RUT-0001": JSON.stringify({ idSesion: "SES-A", seriesHechas: {} }),
      "entrenar:rutina:RUT-0002": JSON.stringify({ idSesion: "SES-B" }),
    }));
    expect([...ids].sort()).toEqual(["SES-A", "SES-B"]);
  });

  it("ignora otras claves, JSON inválido y estados sin id", () => {
    const ids = idsSesionLocales(storage({
      "otra:clave": JSON.stringify({ idSesion: "SES-X" }),
      "entrenar:rutina:roto": "{no es json",
      "entrenar:libre:temp": JSON.stringify({ idSesion: null }),
      "entrenar:libre:temp:config": JSON.stringify({ idsEjercicio: ["EJ-1"] }),
      "entrenar:vacio": JSON.stringify({ idSesion: "" }),
      "entrenar:numero": "42",
      "entrenar:ok": JSON.stringify({ idSesion: "SES-OK" }),
    }));
    expect([...ids]).toEqual(["SES-OK"]);
  });
});

describe("esSesionHuerfana", () => {
  const ahora = 10 * UMBRAL_HUERFANA_MS;
  const vieja = ahora - UMBRAL_HUERFANA_MS - 1;
  const reciente = ahora - UMBRAL_HUERFANA_MS + 1;

  it("más de 24 h y no abierta en este teléfono → se borra", () => {
    expect(esSesionHuerfana({ idSesion: "S1", fechaProgramacionMs: vieja }, new Set(), ahora)).toBe(true);
  });

  it("abierta en este teléfono → no se borra", () => {
    expect(esSesionHuerfana({ idSesion: "S1", fechaProgramacionMs: vieja }, new Set(["S1"]), ahora)).toBe(false);
  });

  it("24 h o menos → no se borra", () => {
    expect(esSesionHuerfana({ idSesion: "S1", fechaProgramacionMs: reciente }, new Set(), ahora)).toBe(false);
    expect(esSesionHuerfana(
      { idSesion: "S1", fechaProgramacionMs: ahora - UMBRAL_HUERFANA_MS }, new Set(), ahora,
    )).toBe(false);
  });

  it("sin fecha conocida → no se borra", () => {
    expect(esSesionHuerfana({ idSesion: "S1", fechaProgramacionMs: null }, new Set(), ahora)).toBe(false);
  });
});
