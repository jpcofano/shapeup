import { describe, expect, it } from "vitest";
import type { EscalonVR, ModoEscaleraVR, PerfilMiembro } from "../types/models";
import {
  EJ_BEAT_THE_BEATS, EJ_BODYCOMBAT, EJ_CREED, EJ_POWERBEATS, RUTINAS_VR, RUT_A_MEDIDA, RUT_COMBAT_LARGO,
} from "./catalogoVR";
import {
  RESPALDO_GENERICO_AMEDIDA, ajustarAlRango, esAMedida, juegosAMedida, moverEnRango, prescriptoAMedida,
  puedeMover, valoresInicialesAMedida,
} from "./vrAMedida";

const aMedida = RUTINAS_VR.find((r) => r.idRutina === RUT_A_MEDIDA)!;
const combatLargo = RUTINAS_VR.find((r) => r.idRutina === RUT_COMBAT_LARGO)!;
const rangos = aMedida.vr!.aMedida!;

function ses(
  idEjercicio: string, prescripto: EscalonVR, inicioMs: number | undefined,
  fecha = "2026-10-01", idRutina = RUT_A_MEDIDA,
) {
  return {
    idRutina, inicioMs, fechaRealizada: fecha,
    vr: {
      modo: "bloques" as ModoEscaleraVR, escalon: 1, idEjercicio, prescripto,
      completoDeclarado: true, dificultad: "intermedio",
    },
  };
}
const e = (b: number, m: number, d: number, dif = "x"): EscalonVR =>
  ({ bloques: b, minutosBloque: m, descansoSeg: d, dificultad: dif });

describe("esAMedida / juegosAMedida", () => {
  it("solo la rutina con aMedida", () => {
    expect(esAMedida(aMedida)).toBe(true);
    expect(esAMedida(combatLargo)).toBe(false);
    expect(juegosAMedida(combatLargo)).toEqual([]);
  });
  it("Les Mills primero, después las alternativas", () => {
    expect(juegosAMedida(aMedida)).toEqual([EJ_BODYCOMBAT, EJ_CREED, EJ_BEAT_THE_BEATS, EJ_POWERBEATS]);
  });
});

describe("valoresInicialesAMedida", () => {
  const base = { rutina: aMedida, seguida: combatLargo };

  it("toma lo último usado con ese juego, ignorando otro juego y otra rutina", () => {
    const historial = [
      ses(EJ_CREED, e(3, 20, 60), 100),
      ses(EJ_CREED, e(2, 25, 90), 300),
      ses(EJ_CREED, e(1, 40, 0), 900, "2026-10-09", "RUT-0099"),
      ses(EJ_BODYCOMBAT, e(4, 15, 30), 500),
    ];
    const v = valoresInicialesAMedida({ ...base, idEjercicio: EJ_CREED, historial });
    expect(v).toMatchObject({ bloques: 2, minutosBloque: 25, descansoSeg: 90 });
  });

  it("si falta inicioMs, desempata por fechaRealizada", () => {
    const historial = [
      ses(EJ_CREED, e(3, 20, 60), undefined, "2026-10-01"),
      ses(EJ_CREED, e(2, 30, 120), undefined, "2026-10-05"),
    ];
    const v = valoresInicialesAMedida({ ...base, idEjercicio: EJ_CREED, historial });
    expect(v.minutosBloque).toBe(30);
  });

  it("Les Mills sin historia: escalón 1 de Combat largo", () => {
    const v = valoresInicialesAMedida({ ...base, idEjercicio: EJ_BODYCOMBAT, historial: [] });
    expect(v).toEqual(e(2, 20, 120, "intermedio"));
  });

  it("Les Mills sin historia, con subida aceptada: escalón 2 y dificultad avanzado", () => {
    const perfil: Pick<PerfilMiembro, "subidasVR"> = {
      subidasVR: [{
        fechaMs: 1, idRutina: RUT_COMBAT_LARGO, modo: "bloques", de: 1, a: 2,
        datos: { fcUltima: 0, fcReferencia: 0, diferencia: 0, umbral: 5, sesiones: [] },
      }],
    };
    const v = valoresInicialesAMedida({ ...base, idEjercicio: EJ_BODYCOMBAT, historial: [], perfil });
    expect(v).toEqual(e(2, 20, 120, "avanzado"));
  });

  it("Les Mills sin seguida: el escalón único de la propia rutina", () => {
    const v = valoresInicialesAMedida({ rutina: aMedida, idEjercicio: EJ_BODYCOMBAT, historial: [] });
    expect(v).toEqual(e(2, 20, 120, "intermedio"));
  });

  it("otro juego sin historia: 2 × 15 con 2:00 y base", () => {
    const v = valoresInicialesAMedida({ ...base, idEjercicio: EJ_CREED, historial: [] });
    expect(v).toEqual(RESPALDO_GENERICO_AMEDIDA);
    expect(v).toEqual(e(2, 15, 120, "base"));
  });

  it("la dificultad no sale del historial", () => {
    const h = [ses(EJ_CREED, e(3, 20, 60, "+2"), 100), ses(EJ_BODYCOMBAT, e(3, 20, 60, "avanzado"), 100)];
    expect(valoresInicialesAMedida({ ...base, idEjercicio: EJ_CREED, historial: h }).dificultad).toBe("base");
    expect(valoresInicialesAMedida({ ...base, idEjercicio: EJ_BODYCOMBAT, historial: h }).dificultad).toBe("intermedio");
  });

  it("ajusta a los rangos un valor del historial fuera de rango", () => {
    const h1 = [ses(EJ_CREED, e(2, 12, 120), 100)];
    expect(valoresInicialesAMedida({ ...base, idEjercicio: EJ_CREED, historial: h1 }).minutosBloque).toBe(15);
    const h2 = [ses(EJ_CREED, e(2, 50, 120), 100)];
    expect(valoresInicialesAMedida({ ...base, idEjercicio: EJ_CREED, historial: h2 }).minutosBloque).toBe(40);
    const h3 = [ses(EJ_CREED, e(2, 20, 75), 100)];
    expect([60, 90]).toContain(valoresInicialesAMedida({ ...base, idEjercicio: EJ_CREED, historial: h3 }).descansoSeg);
    const h4 = [ses(EJ_CREED, e(7, 20, 400), 100)];
    expect(valoresInicialesAMedida({ ...base, idEjercicio: EJ_CREED, historial: h4 })).toMatchObject({ bloques: 4, descansoSeg: 180 });
  });
});

describe("rangos y controles", () => {
  it("ajustarAlRango acota y va al paso más cercano", () => {
    expect(ajustarAlRango(12, rangos.minutosBloque)).toBe(15);
    expect(ajustarAlRango(50, rangos.minutosBloque)).toBe(40);
    expect(ajustarAlRango(22, rangos.minutosBloque)).toBe(20);
    expect(ajustarAlRango(23, rangos.minutosBloque)).toBe(25);
  });

  it.each([
    ["bloques", rangos.bloques],
    ["minutosBloque", rangos.minutosBloque],
    ["descansoSeg", rangos.descansoSeg],
  ])("límites de %s", (_n, r) => {
    expect(puedeMover(r.min, r, -1)).toBe(false);
    expect(puedeMover(r.min, r, 1)).toBe(true);
    expect(puedeMover(r.max, r, 1)).toBe(false);
    expect(puedeMover(r.max, r, -1)).toBe(true);
    expect(moverEnRango(r.min, r, -1)).toBe(r.min);
    expect(moverEnRango(r.max, r, 1)).toBe(r.max);
    expect(moverEnRango(r.min, r, 1)).toBe(r.min + r.paso);
    expect(moverEnRango(r.max, r, -1)).toBe(r.max - r.paso);
  });
});

describe("prescriptoAMedida", () => {
  it("1 bloque: corrido y descanso 0 aunque viniera 120", () => {
    const r = prescriptoAMedida(e(1, 30, 120, "base"));
    expect(r.modo).toBe("corrido");
    expect(r.prescripto).toEqual(e(1, 30, 0, "base"));
  });
  it("2 bloques con descanso 0: bloques", () => {
    const r = prescriptoAMedida(e(2, 20, 0));
    expect(r.modo).toBe("bloques");
    expect(r.prescripto.descansoSeg).toBe(0);
  });
  it("3 × 20 con 60: bloques", () => {
    const r = prescriptoAMedida(e(3, 20, 60));
    expect(r.modo).toBe("bloques");
    expect(r.prescripto).toEqual(e(3, 20, 60));
  });
});
