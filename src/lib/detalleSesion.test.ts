// P109 — los textos del detalle de la sesión. Casos inventados, salvo la sesión testigo (pública).
import { describe, it, expect } from "vitest";
import { tituloSesion, lineaFecha, zonaDominante, horasYMinutos, minutosDelBloque } from "./detalleSesion";
import { HISTORIAL } from "./__fixtures__/sesionTestigo20260927";
import type { BloqueRegistro, Historial } from "../types/models";

const fuerza = {
  ...HISTORIAL, tipo: "rutina", nombreRutina: "Fuerza A — Tren superior", prescripcionUsada: undefined,
  bloques: [{ orden: 1, idEjercicio: "EJ-1", nombreEjercicio: "Press de banca", modalidad: "Fuerza", series: [] }],
} as unknown as Historial;

describe("tituloSesion (P109)", () => {
  it("VR: el juego arriba y el nombre sin «VR — » ni el juego entre paréntesis", () => {
    expect(tituloSesion(HISTORIAL)).toEqual({ sobre: "VR · PowerBeatsVR", nombre: "Quema full-body" });
  });

  it("fuerza: la modalidad arriba y el nombre tal cual", () => {
    expect(tituloSesion(fuerza)).toEqual({ sobre: "Fuerza", nombre: "Fuerza A — Tren superior" });
  });

  it("juego y sesión libre", () => {
    expect(tituloSesion({ ...fuerza, tipo: "juego", nombreJuego: "Beat Saber" } as Historial)).toEqual({ sobre: "Juego", nombre: "Beat Saber" });
    expect(tituloSesion({ ...fuerza, tipo: "libre", nombreRutina: "Sesión libre" } as Historial).sobre).toBe("Sesión libre");
  });
});

describe("lineaFecha (P109)", () => {
  it("«Dom 27/09 · 16:09 · 49 min», con la hora local (la referencia dice «Sáb», pero el 27/09/2026 es domingo)", () => {
    const inicioMs = new Date(2026, 8, 27, 16, 9).getTime();
    expect(lineaFecha({ ...HISTORIAL, inicioMs, duracionRealMin: 49 } as Historial)).toBe("Dom 27/09 · 16:09 · 49 min");
  });

  it("sin hora ni duración, solo el día", () => {
    expect(lineaFecha({ ...HISTORIAL, inicioMs: undefined, duracionRealMin: null } as unknown as Historial)).toBe("Dom 27/09");
  });
});

describe("zonaDominante, horasYMinutos y minutosDelBloque (P109)", () => {
  it("la zona con más minutos; sin minutos, null", () => {
    expect(zonaDominante({ minutosPorZona: { Z2: 4, Z4: 28, Z3: 10 } })).toBe("Z4");
    expect(zonaDominante({ minutosPorZona: { Z2: 5, Z3: 5 } })).toBe("Z3");
    expect(zonaDominante({})).toBeNull();
  });

  it("«6 h 30»", () => {
    expect(horasYMinutos(6.5)).toBe("6 h 30");
    expect(horasYMinutos(7.05)).toBe("7 h 03");
  });

  it("los minutos del ejercicio, de la primera serie a la última", () => {
    const b = { series: [{ serie: 1, completada: true, inicioMs: 0, finMs: 60_000 }, { serie: 2, completada: true, inicioMs: 600_000, finMs: 720_000 }] } as BloqueRegistro;
    expect(minutosDelBloque(b)).toBe(12);
    expect(minutosDelBloque({ series: [{ serie: 1, completada: true }] } as BloqueRegistro)).toBeNull();
  });
});
