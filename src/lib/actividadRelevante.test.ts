// ════════════════════════════════════════════════════════════════════════════
//  actividadRelevante.test.ts — el filtro de lectura del historial (P76b).
//
//  Lo que se prueba acá es lo que decide si una actividad de /cardio aparece
//  junto a las sesiones de la app. Nada de esto decide qué se escribe: en
//  /cardio están todas, siempre.
// ════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { actividadRelevante, soloRelevantes } from "./actividadRelevante";
import { DURACION_MIN_ACTIVIDAD_MIN } from "./importSelectivo";

const CONFIG = { duracionMinimaMin: 30 };

describe("actividadRelevante", () => {
  it("una de VR entra aunque dure tres minutos", () => {
    expect(actividadRelevante(
      { esVR: true, duracionMin: 3, autodetectada: false }, CONFIG,
    )).toBe(true);
  });

  it("una marcada como ShapeUp entra aunque dure cinco minutos", () => {
    expect(actividadRelevante(
      { marcadaShapeUp: true, duracionMin: 5, autodetectada: false }, CONFIG,
    )).toBe(true);
  });

  it("y entra aunque la haya detectado el reloj: la marca manda", () => {
    expect(actividadRelevante(
      { marcadaShapeUp: true, duracionMin: 5, autodetectada: true }, CONFIG,
    )).toBe(true);
  });

  it("29 minutos declarada no entra", () => {
    expect(actividadRelevante(
      { duracionMin: 29, autodetectada: false }, CONFIG,
    )).toBe(false);
  });

  it("30 minutos declarada entra: el umbral es inclusivo", () => {
    expect(actividadRelevante(
      { duracionMin: 30, autodetectada: false }, CONFIG,
    )).toBe(true);
  });

  it("45 minutos autodetectada no entra", () => {
    expect(actividadRelevante(
      { duracionMin: 45, autodetectada: true }, CONFIG,
    )).toBe(false);
  });

  it("sin duración no entra", () => {
    expect(actividadRelevante({ autodetectada: false }, CONFIG)).toBe(false);
  });

  it("el umbral sale de la config, no de una constante escondida", () => {
    const corta = { duracionMin: 15, autodetectada: false };
    expect(actividadRelevante(corta, { duracionMinimaMin: 10 })).toBe(true);
    expect(actividadRelevante(corta, { duracionMinimaMin: 20 })).toBe(false);
  });

  it("el default del código es 30 minutos (P76b)", () => {
    expect(DURACION_MIN_ACTIVIDAD_MIN).toBe(30);
  });
});

describe("soloRelevantes", () => {
  it("filtra conservando el orden", () => {
    const lista = [
      { fecha: "a", duracionMin: 40, autodetectada: false },
      { fecha: "b", duracionMin: 40, autodetectada: true  },
      { fecha: "c", duracionMin: 10, esVR: true, autodetectada: false },
      { fecha: "d", duracionMin: 10, autodetectada: false },
    ];
    expect(soloRelevantes(lista, CONFIG).map((a) => a.fecha)).toEqual(["a", "c"]);
  });
});
