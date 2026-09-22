// ════════════════════════════════════════════════════════════════════════════
//  juegos.test.ts — la lista de juegos y su análisis (P81).
// ════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import type { Historial, ZonaFC } from "../types/models";
import {
  JUEGOS_SIN_EJERCICIO_DEFAULT, normalizarJuegos,
  agregarJuego, quitarJuego, renombrarJuego, resumenPorJuego,
} from "./juegos";

const TS = { seconds: 0, nanoseconds: 0 };

/** Una sesión de juego. `fc` null = sin biometría; `dudosa` = con artefactos. */
function juego(opts: {
  id: string; nombre: string; fecha: string; min: number;
  fc?: number; zona?: ZonaFC; dudosa?: boolean;
}): Historial {
  return {
    idHist: opts.id, fechaRealizada: opts.fecha, fechaRealizadaTimestamp: TS,
    idSesion: `SES-${opts.id}`, nombreRutina: opts.nombre, tipo: "juego",
    nombreJuego: opts.nombre, semanaInicio: opts.fecha, miembro: "juanpablo",
    duracionRealMin: opts.min, rpe: null, tonelajeKg: null, totalSeriesHechas: null,
    bloques: [],
    ...(opts.fc != null ? {
      biometria: {
        fuente: "samsung-health-csv", matchPor: "custom-id", granularidad: "sesion",
        fcMedia: opts.fc,
        ...(opts.zona ? { zonaPrincipal: opts.zona } : {}),
        ...(opts.dudosa ? { fcDudosa: true } : {}),
      },
    } : {}),
  } as unknown as Historial;
}

// ── La lista ────────────────────────────────────────────────────────────────

describe("la lista de juegos", () => {
  it("sin documento, los tres de siempre", () => {
    expect(normalizarJuegos(undefined)).toEqual(["Behemoth", "Drums Rock", "Rock"]);
    expect(normalizarJuegos(JUEGOS_SIN_EJERCICIO_DEFAULT)).toEqual(["Behemoth", "Drums Rock", "Rock"]);
  });

  it("un documento a medio completar no rompe nada", () => {
    expect(normalizarJuegos("Behemoth")).toEqual([...JUEGOS_SIN_EJERCICIO_DEFAULT]);
    expect(normalizarJuegos([1, null, "  Pistol Whip  ", "", "Pistol whip"]))
      .toEqual(["Pistol Whip"]);
  });

  it("agregar, quitar y renombrar", () => {
    const base = ["Behemoth", "Rock"];
    expect(agregarJuego(base, "Drums Rock")).toEqual(["Behemoth", "Drums Rock", "Rock"]);
    expect(agregarJuego(base, "behemoth")).toEqual(base);        // ya estaba
    expect(quitarJuego(base, "behemoth")).toEqual(["Rock"]);     // sin distinguir mayúsculas
    expect(renombrarJuego(base, "Rock", "Rock Band")).toEqual(["Behemoth", "Rock Band"]);
  });

  it("quitar un juego de la lista no toca sus sesiones", () => {
    const historial = [
      juego({ id: "H-1", nombre: "Rock", fecha: "2026-09-12", min: 40, fc: 120, zona: "Z2" }),
    ];
    const lista = quitarJuego(["Behemoth", "Rock"], "Rock");
    expect(lista).toEqual(["Behemoth"]);
    // La sesión sigue entera, con su nombre, y el análisis la sigue mostrando:
    // la lista dice qué se puede elegir, no qué pasó.
    expect(historial[0].nombreJuego).toBe("Rock");
    expect(resumenPorJuego(historial).map((f) => f.juego)).toEqual(["Rock"]);
  });
});

// ── El análisis ─────────────────────────────────────────────────────────────

describe("resumenPorJuego", () => {
  it("sin juegos, no hay filas", () => {
    expect(resumenPorJuego([])).toEqual([]);
    const rutina = { ...juego({ id: "H-R", nombre: "x", fecha: "2026-09-12", min: 30 }), tipo: "rutina" } as Historial;
    expect(resumenPorJuego([rutina])).toEqual([]);
  });

  it("la FC media se pondera por duración, no por cantidad de sesiones", () => {
    // 45 min a 130 y 5 min a 100: por sesiones daría 115; por duración, 127.
    const filas = resumenPorJuego([
      juego({ id: "H-1", nombre: "Behemoth", fecha: "2026-09-12", min: 45, fc: 130, zona: "Z3" }),
      juego({ id: "H-2", nombre: "Behemoth", fecha: "2026-09-13", min: 5, fc: 100, zona: "Z1" }),
    ]);
    expect(filas).toHaveLength(1);
    expect(filas[0].sesiones).toBe(2);
    expect(filas[0].minutos).toBe(50);
    expect(filas[0].fcMedia).toBe(127);
  });

  it("un juego sin FC confiable dice que no la tiene", () => {
    const filas = resumenPorJuego([
      juego({ id: "H-1", nombre: "Drums Rock", fecha: "2026-09-12", min: 30 }),
      // Con FC pero marcada como dudosa: tampoco cuenta. Un artefacto de muñeca
      // no es un dato, y mostrarlo sería peor que decir que no hay.
      juego({ id: "H-2", nombre: "Drums Rock", fecha: "2026-09-13", min: 20, fc: 190, dudosa: true }),
    ]);
    expect(filas[0].sesiones).toBe(2);
    expect(filas[0].minutos).toBe(50);
    expect(filas[0].fcMedia).toBeNull();
    expect(filas[0].zonaDominante).toBeNull();
  });

  it("las sesiones sin FC suman minutos pero no torcen la media", () => {
    const filas = resumenPorJuego([
      juego({ id: "H-1", nombre: "Rock", fecha: "2026-09-12", min: 30, fc: 120, zona: "Z2" }),
      juego({ id: "H-2", nombre: "Rock", fecha: "2026-09-13", min: 60 }),
    ]);
    expect(filas[0].minutos).toBe(90);
    expect(filas[0].minutosConFc).toBe(30);
    expect(filas[0].fcMedia).toBe(120);
  });

  it("el tramo de zonas: una sola cuando ya se lleva la mayoría", () => {
    const filas = resumenPorJuego([
      juego({ id: "H-1", nombre: "Behemoth", fecha: "2026-09-12", min: 80, fc: 125, zona: "Z3" }),
      juego({ id: "H-2", nombre: "Behemoth", fecha: "2026-09-13", min: 20, fc: 105, zona: "Z2" }),
    ]);
    expect(filas[0].zonaDominante).toEqual({ desde: "Z3", hasta: "Z3", porcentaje: 80 });
  });

  it("y el par contiguo cuando ninguna sola alcanza", () => {
    const filas = resumenPorJuego([
      juego({ id: "H-1", nombre: "Behemoth", fecha: "2026-09-12", min: 35, fc: 105, zona: "Z2" }),
      juego({ id: "H-2", nombre: "Behemoth", fecha: "2026-09-13", min: 35, fc: 125, zona: "Z3" }),
      juego({ id: "H-3", nombre: "Behemoth", fecha: "2026-09-14", min: 30, fc: 90, zona: "Z1" }),
    ]);
    expect(filas[0].zonaDominante).toEqual({ desde: "Z2", hasta: "Z3", porcentaje: 70 });
  });

  it("las filas van por tiempo jugado, de mayor a menor", () => {
    const filas = resumenPorJuego([
      juego({ id: "H-1", nombre: "Drums Rock", fecha: "2026-09-12", min: 30 }),
      juego({ id: "H-2", nombre: "Behemoth", fecha: "2026-09-13", min: 90 }),
    ]);
    expect(filas.map((f) => f.juego)).toEqual(["Behemoth", "Drums Rock"]);
  });
});
