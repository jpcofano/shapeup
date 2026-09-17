import { describe, it, expect } from "vitest";
import {
  cifrasSesion, deltaEjercicio, esPR, e1rmKg, leyendaRpe, historialPrevio, mejorCarga,
} from "./resumenSesion";
import type { BloqueRegistro, Historial, Modalidad, SerieRegistro } from "../types/models";

// ── Fixtures ─────────────────────────────────────────────────────────────────

function serie(reps: number | undefined, cargaKg: number | undefined, completada = true): SerieRegistro {
  return {
    serie: 1,
    completada,
    ...(reps !== undefined ? { reps } : {}),
    ...(cargaKg !== undefined ? { cargaKg } : {}),
  };
}

function bloque(series: SerieRegistro[], idEjercicio = "EJ-1", modalidad: Modalidad = "Fuerza"): BloqueRegistro {
  return { orden: 1, idEjercicio, nombreEjercicio: "Press", modalidad, series };
}

function sesion(fecha: string, bloques: BloqueRegistro[], extra: Partial<Historial> = {}): Historial {
  return {
    idHist: `H-${fecha}`,
    fechaRealizada: fecha,
    idSesion: `SES-${fecha}`,
    nombreRutina: "Torso",
    semanaInicio: fecha,
    miembro: "juanpablo",
    duracionRealMin: 40,
    rpe: null,
    tonelajeKg: null,
    totalSeriesHechas: null,
    bloques,
    ...extra,
  } as Historial;
}

// ── cifrasSesion ─────────────────────────────────────────────────────────────

describe("cifrasSesion", () => {
  it("suma tonelaje de Fuerza, cuenta series completadas (extras incluidas) y calcula minutos", () => {
    const bloques = [
      bloque([serie(10, 20), serie(10, 20), serie(8, 20), serie(6, 20)]), // 4 con una extra
      bloque([serie(undefined, undefined), serie(undefined, undefined, false)], "EJ-2", "Cardio"),
    ];
    const c = cifrasSesion(bloques, 0, 45 * 60_000 + 20_000);
    expect(c.tonelajeKg).toBe(10 * 20 + 10 * 20 + 8 * 20 + 6 * 20);
    expect(c.seriesEfectivas).toBe(5);
    expect(c.duracionMin).toBe(45);
  });

  it("sin inicioMs, la duración es null", () => {
    expect(cifrasSesion([], null, 1000).duracionMin).toBeNull();
  });
});

// ── deltaEjercicio ───────────────────────────────────────────────────────────

describe("deltaEjercicio", () => {
  const hoy = bloque([serie(10, 22.5), serie(9, 22.5)]);

  it("primera vez", () => {
    expect(deltaEjercicio(hoy, [])).toEqual({ tipo: "primera-vez" });
    expect(deltaEjercicio(hoy, [sesion("2026-09-01", [bloque([serie(10, 20)], "EJ-OTRO")])]))
      .toEqual({ tipo: "primera-vez" });
  });

  it("sin carga hoy o la última vez", () => {
    const previa = [sesion("2026-09-01", [bloque([serie(10, 20)])])];
    expect(deltaEjercicio(bloque([serie(12, undefined)]), previa)).toEqual({ tipo: "sin-carga" });
    const previaSinCarga = [sesion("2026-09-01", [bloque([serie(12, undefined)])])];
    expect(deltaEjercicio(hoy, previaSinCarga)).toEqual({ tipo: "sin-carga" });
  });

  it("carga que sube y carga que baja", () => {
    const previa = [sesion("2026-09-01", [bloque([serie(10, 20)])])];
    expect(deltaEjercicio(hoy, previa)).toEqual({ tipo: "carga", deltaKg: 2.5 });
    const bajo = bloque([serie(10, 17.5)]);
    expect(deltaEjercicio(bajo, previa)).toEqual({ tipo: "carga", deltaKg: -2.5 });
  });

  it("redondea los kg a 2 decimales", () => {
    const previa = [sesion("2026-09-01", [bloque([serie(10, 20.1)])])];
    expect(deltaEjercicio(bloque([serie(10, 20.2)]), previa)).toEqual({ tipo: "carga", deltaKg: 0.1 });
  });

  it("misma carga: compara reps máximas con esa carga", () => {
    const previa = [sesion("2026-09-01", [bloque([serie(8, 22.5), serie(12, 15)])])];
    expect(deltaEjercicio(hoy, previa)).toEqual({ tipo: "reps", deltaReps: 2 });
    const peor = bloque([serie(7, 22.5)]);
    expect(deltaEjercicio(peor, previa)).toEqual({ tipo: "reps", deltaReps: -1 });
    const igual = bloque([serie(8, 22.5)]);
    expect(deltaEjercicio(igual, previa)).toEqual({ tipo: "reps", deltaReps: 0 });
  });

  it("ignora las series no completadas", () => {
    const previa = [sesion("2026-09-01", [bloque([serie(10, 20), serie(10, 30, false)])])];
    const conIncompleta = bloque([serie(10, 22.5), serie(10, 40, false)]);
    expect(deltaEjercicio(conIncompleta, previa)).toEqual({ tipo: "carga", deltaKg: 2.5 });
  });

  it("usa la última sesión anterior aunque haya otras más viejas", () => {
    const historial = [
      sesion("2026-08-01", [bloque([serie(10, 30)])]),
      sesion("2026-09-10", [bloque([serie(10, 20)])]),
      sesion("2026-08-20", [bloque([serie(10, 25)])]),
    ];
    expect(deltaEjercicio(hoy, historial)).toEqual({ tipo: "carga", deltaKg: 2.5 });
  });

  it("un bloque con campo de sustitución no se compara", () => {
    const sustituido = { ...hoy, idEjercicioOriginal: "EJ-9" } as BloqueRegistro;
    const previa = [sesion("2026-09-01", [bloque([serie(10, 20)])])];
    expect(deltaEjercicio(sustituido, previa)).toEqual({ tipo: "sustituido" });
  });

  it("un bloque que no es de Fuerza no se compara", () => {
    const cardio = bloque([serie(undefined, undefined)], "EJ-1", "Cardio");
    expect(deltaEjercicio(cardio, [])).toEqual({ tipo: "sin-carga" });
  });
});

// ── esPR ─────────────────────────────────────────────────────────────────────

describe("esPR", () => {
  const hoy = bloque([serie(5, 50)]);

  it("supera a todas las anteriores", () => {
    const h = [sesion("2026-09-01", [bloque([serie(5, 45)])]), sesion("2026-08-01", [bloque([serie(5, 40)])])];
    expect(esPR(hoy, h)).toBe(true);
  });

  it("empata: no es PR", () => {
    expect(esPR(hoy, [sesion("2026-09-01", [bloque([serie(3, 50)])])])).toBe(false);
  });

  it("primera vez: no es PR", () => {
    expect(esPR(hoy, [])).toBe(false);
  });

  it("supera a la última pero no a una más vieja: no es PR", () => {
    const h = [sesion("2026-09-10", [bloque([serie(5, 45)])]), sesion("2026-06-01", [bloque([serie(3, 55)])])];
    expect(esPR(hoy, h)).toBe(false);
  });
});

// ── e1rmKg ───────────────────────────────────────────────────────────────────

describe("e1rmKg", () => {
  it("Epley: carga × (1 + reps / 30), el máximo", () => {
    // 100 × (1 + 5/30) = 116.67 · 90 × (1 + 10/30) = 120
    expect(e1rmKg([serie(5, 100), serie(10, 90)])).toBe(120);
  });

  it("redondea a 1 decimal", () => {
    expect(e1rmKg([serie(5, 100)])).toBe(116.7);
  });

  it("ignora reps mayores a 10, carga 0 y series no completadas", () => {
    expect(e1rmKg([serie(12, 200), serie(5, 0), serie(3, 300, false), serie(1, 50)])).toBe(51.7);
  });

  it("undefined sin series válidas", () => {
    expect(e1rmKg([])).toBeUndefined();
    expect(e1rmKg([serie(15, 20), serie(5, undefined), serie(0, 30)])).toBeUndefined();
  });
});

// ── leyendaRpe ───────────────────────────────────────────────────────────────

describe("leyendaRpe", () => {
  it("bordes 1, 5, 6 y 10", () => {
    expect(leyendaRpe(1)).toBe("Liviano — te sobraban muchas reps");
    expect(leyendaRpe(5)).toBe("Liviano — te sobraban muchas reps");
    expect(leyendaRpe(6)).toBe("Moderado — 4 o más en reserva");
    expect(leyendaRpe(7)).toBe("Exigente — unas 3 en reserva");
    expect(leyendaRpe(10)).toBe("Máximo — no quedaba ninguna");
  });
});

// ── historialPrevio y mejorCarga ─────────────────────────────────────────────

describe("historialPrevio", () => {
  it("excluye la sesión actual por idSesion o por inicio de la ventana", () => {
    const actuales = [bloque([{ ...serie(10, 20), inicioMs: 5000, finMs: 6000 }])];
    const h = [
      sesion("2026-09-17", [], { idSesion: "SES-ACTUAL" }),
      sesion("2026-09-16", [], { inicioMs: 5000 }),
      sesion("2026-09-15", []),
    ];
    expect(historialPrevio(h, actuales, "SES-ACTUAL").map((x) => x.fechaRealizada)).toEqual(["2026-09-15"]);
  });

  it("sin idSesion ni ventana no excluye nada", () => {
    const h = [sesion("2026-09-15", [])];
    expect(historialPrevio(h, [], null)).toHaveLength(1);
  });
});

describe("mejorCarga", () => {
  it("máximo entre series completadas con carga", () => {
    expect(mejorCarga(bloque([serie(10, 20), serie(8, 25), serie(5, 40, false)]))).toBe(25);
    expect(mejorCarga(bloque([serie(10, undefined)]))).toBeUndefined();
  });
});
