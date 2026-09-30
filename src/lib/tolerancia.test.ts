// P92 — la tolerancia del 12 %, lo que dice Health, y los minutos por zona.
import { describe, it, expect } from "vitest";
import {
  construirBiometriaDeTramos, evaluarTolerancia, TOLERANCIA_DURACION, OLVIDO_CORTE_MS, VERSION_ENRIQUECIMIENTO,
  type SesionApp, type SesionSamsung, type TramoSamsung,
} from "./matchBiometrico";
import { calcularEnriquecimiento } from "./enriquecerImport";
import { totalMinutos } from "./minutosPorZona";
import type { Historial, PerfilMiembro } from "../types/models";
import type { LiveDataPoint } from "../import/samsungLiveData";

const MIN = 60_000;
const T0 = 1_790_000_000_000;
const APP: SesionApp = { inicioMs: T0, finMs: T0 + 50 * MIN };   // 50 min de app
const PERFIL: PerfilMiembro = {
  fcMaxTeorica: 169,
  zonasFC: {
    Z1: { min: 85, max: 101 }, Z2: { min: 101, max: 118 }, Z3: { min: 118, max: 135 },
    Z4: { min: 135, max: 152 }, Z5: { min: 152, max: 169 },
  },
};

function curva(desdeMs: number, hastaMs: number, fc: number): LiveDataPoint[] {
  const out: LiveDataPoint[] = [];
  for (let ms = desdeMs; ms <= hastaMs; ms += 1000) out.push({ ms, fc });
  return out;
}

/** Un tramo de reloj de `startMs` a `endMs`, con curva y 500 kcal. */
function tramo(startMs: number, endMs: number, extra: Partial<SesionSamsung> = {}): TramoSamsung {
  return {
    sesion: { datauuid: "U1", startMs, endMs, kcal: 500, fcMedia: 130, fcMax: 160, fcMin: 90, ...extra },
    curva: curva(startMs, endMs, 125),
  };
}

/** El reloj empieza 1 s antes y dura `durMin`. */
const conDuracion = (durMin: number) => tramo(T0 - 1000, T0 - 1000 + durMin * MIN);

describe("tolerancia del 12 %", () => {
  it("11,9 % adopta", () => {
    expect(evaluarTolerancia([conDuracion(50 * 1.119)], APP).adopta).toBe(true);
  });
  it("12,1 % recorta", () => {
    expect(evaluarTolerancia([conDuracion(50 * 1.121)], APP).adopta).toBe(false);
  });
  it("exactamente 12 % adopta (el <= es la decisión)", () => {
    const t = tramo(T0, T0 + 56 * MIN);   // 56/50 − 1 = 0,12 justo
    const r = evaluarTolerancia([t], APP);
    expect(r).toEqual({ adopta: true, desfasePct: 12 });
    expect(TOLERANCIA_DURACION).toBe(0.12);
  });
  it("los dos signos: Samsung más largo y Samsung más corto", () => {
    expect(evaluarTolerancia([tramo(T0 - 30_000, T0 + 53 * MIN)], APP)).toEqual({ adopta: true, desfasePct: 7 });
    expect(evaluarTolerancia([tramo(T0 + 30_000, T0 + 47 * MIN)], APP)).toEqual({ adopta: true, desfasePct: -7 });
    expect(evaluarTolerancia([tramo(T0, T0 + 40 * MIN)], APP)).toEqual({ adopta: false, desfasePct: -20 });
  });
  it("Samsung 16 min pasado del fin NO adopta aunque el porcentaje diera", () => {
    // Sesión de 150 min: 16 min de más son 10,7 %, dentro del 12 %.
    const larga: SesionApp = { inicioMs: T0, finMs: T0 + 150 * MIN };
    const r = evaluarTolerancia([tramo(T0, T0 + 166 * MIN)], larga);
    expect(r.desfasePct).toBeLessThan(12);
    expect(r.adopta).toBe(false);
    expect(OLVIDO_CORTE_MS).toBe(15 * MIN);
  });
  it("ventana sintética nunca adopta, y no inventa un porcentaje", () => {
    expect(evaluarTolerancia([tramo(T0, T0 + 50 * MIN)], { ...APP, sintetica: true })).toEqual({ adopta: false });
  });
  it("la duración de Samsung es la UNIÓN de los tramos, no la suma", () => {
    // Dos tramos que se pisan 10 min: unión 50 (0 %), suma 60 (+20 %).
    const a = tramo(T0, T0 + 30 * MIN);
    const b = { ...tramo(T0 + 20 * MIN, T0 + 50 * MIN), sesion: { ...tramo(T0 + 20 * MIN, T0 + 50 * MIN).sesion, datauuid: "U2" } };
    expect(evaluarTolerancia([a, b], APP)).toEqual({ adopta: true, desfasePct: 0 });
  });
  it("guarda simétrica: un reloj que arrancó más de 15 min antes no adopta aunque dure lo mismo", () => {
    expect(evaluarTolerancia([tramo(T0 - 16 * MIN, T0 + 34 * MIN)], APP)).toEqual({ adopta: false, desfasePct: 0 });
  });
});

describe("construirBiometriaDeTramos con la ventana adoptada", () => {
  it("adoptada: kcal enteras, sin kcalEstimada, y el desfase con su signo", () => {
    const bio = construirBiometriaDeTramos([tramo(T0 - 30_000, T0 + 52 * MIN)], "custom-id", APP, [], PERFIL, "U1");
    expect(bio.ventanaAdoptada).toBe("samsung");
    expect(bio.kcal).toBe(500);
    expect(bio.kcalEstimada).toBeUndefined();
    expect(bio.desfaseDuracionPct).toBe(5);
    expect(bio.inicioMsEfectivo).toBeUndefined();   // no hubo recorte
  });

  it("no adoptada: se recorta y prorratea como P78", () => {
    const bio = construirBiometriaDeTramos([tramo(T0, T0 + 100 * MIN)], "custom-id", APP, [], PERFIL, "U1");
    expect(bio.ventanaAdoptada).toBe("app");
    expect(bio.desfaseDuracionPct).toBe(100);
    expect(bio.kcal).toBe(250);
    expect(bio.kcalEstimada).toBe(true);
  });

  it("samsung: lo que dice Health, siempre, con las dos duraciones", () => {
    const t = tramo(T0, T0 + 52 * MIN, { duracionDeclaradaMs: 48 * MIN });   // la fila trae 4 min de pausa
    const bio = construirBiometriaDeTramos([t], "custom-id", APP, [], PERFIL, "U1");
    expect(bio.samsung).toEqual({
      inicioMs: T0, finMs: T0 + 52 * MIN, duracionVentanaMin: 52, duracionDeclaradaMin: 48,
      kcal: 500, fcMedia: 130, fcMax: 160, fcMin: 90, datauuids: ["U1"],
    });
    // La tolerancia decide con la de VENTANA (52 → +4 %), no con la declarada (48 → −4 %).
    expect(bio.desfaseDuracionPct).toBe(4);
  });

  it("minutos por zona de la sesión: la invariante cierra sobre la ventana usada", () => {
    const bio = construirBiometriaDeTramos([tramo(T0, T0 + 50 * MIN)], "custom-id", APP, [], PERFIL, "U1");
    expect(bio.minutosPorZona).toEqual({ Z3: 50 });
    expect(totalMinutos({
      porZona: bio.minutosPorZona!, minutosBajoZonas: bio.minutosBajoZonas!, minutosSinDato: bio.minutosSinDato!,
    })).toBe(50);
  });

  it("sin curva no hay minutos por zona", () => {
    const sinCurva = { sesion: tramo(T0, T0 + 50 * MIN).sesion };
    const bio = construirBiometriaDeTramos([sinCurva], "custom-id", APP, [], PERFIL, "U1");
    expect(bio.minutosPorZona).toBeUndefined();
  });
});

describe("minutos por zona por ejercicio", () => {
  const serie = (ini: number, fin: number) => ({ serie: 1, completada: true, inicioMs: T0 + ini * MIN, finMs: T0 + fin * MIN });
  const h = {
    idHist: "H-1", fechaRealizada: "2026-09-27", tipo: "rutina", miembro: "juanpablo",
    nombreRutina: "Fuerza", duracionRealMin: 50, inicioMs: T0, finMs: T0 + 50 * MIN,
    bloques: [
      { orden: 1, idEjercicio: "EJ-1", nombreEjercicio: "Sentadilla", modalidad: "Fuerza",
        series: [serie(0, 2), serie(5, 7), serie(10, 12)] },
      { orden: 2, idEjercicio: "EJ-2", nombreEjercicio: "Remo", modalidad: "Fuerza",
        series: [serie(20, 22), serie(25, 27)] },
      { orden: 3, idEjercicio: "EJ-3", nombreEjercicio: "Plancha", modalidad: "Fuerza",
        series: [{ serie: 1, completada: true }] },             // sin sellar
    ],
  } as unknown as Historial;
  // 0–15 min en Z4 (145), 15–30 en Z2 (110), 30–50 bajo Z1 (70).
  const curvaSesion = [...curva(T0, T0 + 15 * MIN, 145), ...curva(T0 + 15 * MIN + 1000, T0 + 30 * MIN, 110), ...curva(T0 + 30 * MIN + 1000, T0 + 50 * MIN, 70)];

  const r = calcularEnriquecimiento([h], {
    sesionesSamsung: [{ datauuid: "U1", startMs: T0, endMs: T0 + 50 * MIN, customId: "ShapeUp", kcal: 400 }],
    liveData: { U1: curvaSesion },
    shapeUpCustomId: "ShapeUp",
  }, PERFIL);
  const bloques = r.updates[0].bloques!;

  it("dos ejercicios en ventanas distintas reparten distinto", () => {
    expect(bloques[0].minutosPorZona).toEqual({ Z4: 12 });   // 0 → 12 min, descansos adentro
    expect(bloques[1].minutosPorZona).toEqual({ Z2: 7 });    // 20 → 27 min
  });
  it("un bloque sin series selladas no recibe el campo", () => {
    expect(bloques[2].minutosPorZona).toBeUndefined();
    expect(bloques[2].minutosBajoZonas).toBeUndefined();
  });
  it("la sesión lleva el tiempo bajo Z1 aparte de sin dato", () => {
    const bio = r.updates[0].biometria;
    expect(bio.minutosBajoZonas).toBeCloseTo(20, 0);
    expect(bio.minutosSinDato).toBeLessThan(1);
    expect(bio.versionEnriquecimiento).toBe(VERSION_ENRIQUECIMIENTO);
  });
});
