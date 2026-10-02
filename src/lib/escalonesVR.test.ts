import { describe, it, expect } from "vitest";
import {
  aplicarSubida, contoCompletada, escalonActual, escalonDeHoy, evaluarReglaVR, evaluarSeriesVR, minutosPrescriptos,
  modosDe, motivoExclusionVR, normalizarConfigProgresion, sinArchivadas, validarConfigProgresion,
  CONFIG_PROGRESION_DEFAULT,
} from "./escalonesVR";
import { RUTINAS_VR, RUT_COMBAT_LARGO, RUT_COMBAT_CORTO, RUT_RITMO_SUAVE, EJ_BODYCOMBAT, EJ_BEAT_THE_BEATS, EJ_POWERBEATS } from "./catalogoVR";
import type { Historial, ModoEscaleraVR, PerfilMiembro, Rutina, SubidaVR } from "../types/models";

const rutina = (id: string) => RUTINAS_VR.find((r) => r.idRutina === id)! as Rutina;
const COMBAT = rutina(RUT_COMBAT_LARGO);
const CORTO = rutina(RUT_COMBAT_CORTO);
const RITMO = rutina(RUT_RITMO_SUAVE);

let n = 0;
/** Una sesión de VR por escalones. `semana` = lunes; la ventana dura `minutos`. */
function sesion(o: {
  rutina?: Rutina; modo?: ModoEscaleraVR; escalon?: number; juego?: string; fc: number;
  semana: string; minutos?: number; completo?: boolean | null; bio?: Partial<NonNullable<Historial["biometria"]>>;
  dificultadPercibida?: Historial["dificultadPercibida"];
  /** La dificultad declarada al cerrar. Ausente = la prevista por el escalón. */
  dificultad?: string | null;
}): Historial {
  const r = o.rutina ?? COMBAT;
  const modo = o.modo ?? "bloques";
  const escalon = o.escalon ?? 1;
  const prescripto = r.vr!.escaleras[modo]![escalon - 1];
  const inicio = Date.parse(`${o.semana}T18:00:00`) + (n++) * 60_000;
  const minutos = o.minutos ?? minutosPrescriptos(prescripto);
  return {
    idHist: `H-${n}`, idRutina: r.idRutina, nombreRutina: r.nombre, tipo: "rutina",
    fechaRealizada: o.semana, semanaInicio: o.semana, miembro: "juanpablo",
    inicioMs: inicio, finMs: inicio + minutos * 60_000, duracionRealMin: Math.round(minutos),
    rpe: null, tonelajeKg: null, totalSeriesHechas: 1, bloques: [],
    biometria: { fuente: "samsung-health-csv", matchPor: "custom-id", granularidad: "serie", fcMedia: o.fc, coberturaFina: 0.98, ...o.bio },
    vr: {
      modo, escalon, idEjercicio: o.juego ?? r.vr!.idEjercicio, prescripto,
      completoDeclarado: o.completo === undefined ? true : o.completo,
      dificultad: o.dificultad === undefined ? prescripto.dificultad : o.dificultad,
    },
    ...(o.dificultadPercibida ? { dificultadPercibida: o.dificultadPercibida } : {}),
  } as unknown as Historial;
}
const evaluar = (historial: Historial[], o: { rutina?: Rutina; modo?: ModoEscaleraVR; juego?: string; perfil?: PerfilMiembro } = {}) => {
  const r = o.rutina ?? COMBAT;
  return evaluarReglaVR({
    historial, rutina: r, modo: o.modo ?? "bloques", idEjercicio: o.juego ?? r.vr!.idEjercicio, perfil: o.perfil,
  })!;
};

const S1 = "2026-10-05", S2 = "2026-10-12", S3 = "2026-10-19";

describe("evaluarReglaVR · los estados (P98)", () => {
  it("subir: 3 sesiones, 2 semanas, todas completadas, y la última 5 por debajo de las dos primeras", () => {
    const r = evaluar([sesion({ fc: 140, semana: S1 }), sesion({ fc: 138, semana: S1 }), sesion({ fc: 133, semana: S2 })]);
    expect(r.estado).toBe("subir");
    expect(r.numeros).toMatchObject({ fcUltima: 133, fcReferencia: 139, diferencia: -6, umbral: 5, ultimaCompletada: true, semanas: 2 });
  });
  it("mantener por FC: subió 5 o más", () => {
    const r = evaluar([sesion({ fc: 130, semana: S1 }), sesion({ fc: 132, semana: S1 }), sesion({ fc: 137, semana: S2 })]);
    expect([r.estado, r.motivo]).toEqual(["mantener", "fc-subio"]);
  });
  it("mantener por no completar dos sesiones seguidas", () => {
    const r = evaluar([sesion({ fc: 140, semana: S1 }), sesion({ fc: 135, semana: S2, completo: false }), sesion({ fc: 130, semana: S2, completo: false })]);
    expect([r.estado, r.motivo]).toEqual(["mantener", "no-completo-dos-seguidas"]);
  });
  it("mantener si alguna no contó como completada, aunque la FC baje", () => {
    const r = evaluar([sesion({ fc: 140, semana: S1, completo: false }), sesion({ fc: 138, semana: S1 }), sesion({ fc: 130, semana: S2 })]);
    expect([r.estado, r.motivo]).toEqual(["mantener", "incompletas"]);
  });
  it("mantener si la FC no bajó el umbral", () => {
    const r = evaluar([sesion({ fc: 140, semana: S1 }), sesion({ fc: 138, semana: S1 }), sesion({ fc: 136, semana: S2 })]);
    expect([r.estado, r.motivo]).toEqual(["mantener", "fc-sin-bajar"]);
  });
  it("sin datos suficientes: menos de 3 sesiones, o todas en una semana", () => {
    expect(evaluar([sesion({ fc: 140, semana: S1 }), sesion({ fc: 130, semana: S2 })]).estado).toBe("sin-datos");
    const unaSemana = evaluar([sesion({ fc: 140, semana: S1 }), sesion({ fc: 138, semana: S1 }), sesion({ fc: 130, semana: S1 })]);
    expect([unaSemana.estado, unaSemana.motivo]).toEqual(["sin-datos", "pocas-semanas"]);
  });
  it("en el último escalón, no propone subir", () => {
    const tope = COMBAT.vr!.escaleras.bloques!.length;
    const perfil = { subidasVR: [{ idRutina: RUT_COMBAT_LARGO, modo: "bloques", de: tope - 1, a: tope } as SubidaVR] };
    const hs = [140, 138, 130].map((fc, i) => sesion({ fc, semana: i < 2 ? S1 : S2, escalon: tope }));
    expect(evaluar(hs, { perfil }).motivo).toBe("en-el-tope");
  });
  it("Ritmo suave: bajar dificultad si pasa el techo de Z3 en dos sesiones seguidas", () => {
    const z = { zonasUsadas: { Z3: { min: 119, max: 135 } } };
    const pasa = evaluar([sesion({ rutina: RITMO, modo: "corrido", fc: 137, semana: S1, bio: z }), sesion({ rutina: RITMO, modo: "corrido", fc: 138, semana: S2, bio: z })], { rutina: RITMO, modo: "corrido" });
    expect([pasa.estado, pasa.numeros.techoZ3]).toEqual(["bajar-dificultad", 135]);
    const una = evaluar([sesion({ rutina: RITMO, modo: "corrido", fc: 137, semana: S1, bio: z }), sesion({ rutina: RITMO, modo: "corrido", fc: 130, semana: S2, bio: z })], { rutina: RITMO, modo: "corrido" });
    expect([una.estado, una.motivo]).toEqual(["mantener", "debajo-techo"]);
  });
});

describe("evaluarReglaVR · lo que no se mezcla (P98)", () => {
  it("las sesiones de corrido no cuentan para el escalón por bloques, y al revés", () => {
    const hs = [
      sesion({ fc: 140, semana: S1 }), sesion({ fc: 138, semana: S1 }),
      sesion({ fc: 120, semana: S2, modo: "corrido" }), sesion({ fc: 121, semana: S2, modo: "corrido" }),
    ];
    const bloques = evaluar(hs);
    expect(bloques.numeros.sesiones).toHaveLength(2);
    expect(bloques.estado).toBe("sin-datos");
    const corrido = evaluar(hs, { modo: "corrido" });
    expect(corrido.numeros.sesiones.map((s) => s.fcMedia)).toEqual([120, 121]);
  });
  it("Ritmo suave por juego: Beat the Beats y PowerBeats nunca se mezclan", () => {
    const z = { zonasUsadas: { Z3: { min: 119, max: 135 } } };
    const hs = [
      sesion({ rutina: RITMO, modo: "corrido", juego: EJ_BEAT_THE_BEATS, fc: 140, semana: S1, bio: z }),
      sesion({ rutina: RITMO, modo: "corrido", juego: EJ_POWERBEATS, fc: 140, semana: S2, bio: z }),
    ];
    expect(evaluar(hs, { rutina: RITMO, modo: "corrido", juego: EJ_BEAT_THE_BEATS }).estado).toBe("sin-datos");
    expect(evaluar(hs, { rutina: RITMO, modo: "corrido", juego: EJ_POWERBEATS }).estado).toBe("sin-datos");
  });
  it("Combat corto no cuenta para Combat largo", () => {
    const cortas = [140, 138, 130].map((fc, i) => sesion({ rutina: CORTO, fc, semana: i < 2 ? S1 : S2 }));
    expect(evaluar(cortas).numeros.sesiones).toHaveLength(0);
    expect(evaluarReglaVR({ historial: cortas, rutina: CORTO, modo: "bloques", idEjercicio: EJ_BODYCOMBAT })).toBeNull();
  });
  it("las sesiones de otro escalón no cuentan", () => {
    const hs = [sesion({ fc: 140, semana: S1, escalon: 2 }), sesion({ fc: 138, semana: S1, escalon: 2 }), sesion({ fc: 130, semana: S2, escalon: 2 })];
    expect(evaluar(hs).numeros.sesiones).toHaveLength(0);
  });
  it("dificultadPercibida no entra en la regla (P79)", () => {
    const base = [sesion({ fc: 140, semana: S1 }), sesion({ fc: 138, semana: S1 }), sesion({ fc: 133, semana: S2 })];
    const con = base.map((h) => ({ ...h, dificultadPercibida: "intenso" as const }));
    expect(evaluar(con)).toEqual(evaluar(base));
  });
});

describe("contoCompletada: la confirmación y el 90 % (P98)", () => {
  it("exige las dos cosas", () => {
    const presc = minutosPrescriptos(COMBAT.vr!.escaleras.bloques![0]);   // 42
    expect(contoCompletada(sesion({ fc: 140, semana: S1, minutos: presc * 0.9 }))).toBe(true);
    expect(contoCompletada(sesion({ fc: 140, semana: S1, minutos: presc * 0.89 }))).toBe(false);
    expect(contoCompletada(sesion({ fc: 140, semana: S1, completo: false }))).toBe(false);
    expect(contoCompletada(sesion({ fc: 140, semana: S1, completo: null }))).toBe(false);
  });
  it("la confirmación frena una subida pero no la causa", () => {
    const sinConfirmar = [140, 138, 130].map((fc, i) => sesion({ fc, semana: i < 2 ? S1 : S2, completo: null }));
    expect(evaluar(sinConfirmar).estado).not.toBe("subir");
    const confirmadasCortas = [140, 138, 130].map((fc, i) => sesion({ fc, semana: i < 2 ? S1 : S2, minutos: 20 }));
    expect(evaluar(confirmadasCortas).estado).not.toBe("subir");
  });
  it("los minutos prescriptos suman los descansos entre bloques", () => {
    expect(minutosPrescriptos({ bloques: 2, minutosBloque: 20, descansoSeg: 120, dificultad: "x" })).toBe(42);
    expect(minutosPrescriptos({ bloques: 1, minutosBloque: 40, descansoSeg: 0, dificultad: "x" })).toBe(40);
  });
});

describe("las exclusiones (P98)", () => {
  it("fcDudosa, cobertura baja y discrepancia de duración quedan afuera, y se cuentan", () => {
    const dudosa = sesion({ fc: 120, semana: S1, bio: { fcDudosa: true } });
    const cobertura = sesion({ fc: 120, semana: S1, bio: { coberturaFina: 0.5 } });
    const discrepancia = { ...sesion({ fc: 120, semana: S1 }), inicioMs: undefined, finMs: undefined, duracionRealMin: 60,
      bloques: [{ orden: 1, idEjercicio: "EJ-9003", nombreEjercicio: "x", modalidad: "Cardio",
        series: [{ serie: 1, completada: true, inicioMs: 0, finMs: 20 * 60_000 }] }] } as unknown as Historial;
    expect(motivoExclusionVR(dudosa)).toBe("fc-dudosa");
    expect(motivoExclusionVR(cobertura)).toBe("cobertura");
    expect(motivoExclusionVR(discrepancia)).toBe("discrepancia-duracion");
    const r = evaluar([dudosa, cobertura, discrepancia, sesion({ fc: 140, semana: S1 })]);
    expect(r.numeros.excluidas.map((x) => x.motivo).sort()).toEqual(["cobertura", "discrepancia-duracion", "fc-dudosa"]);
    expect(r.numeros.sesiones).toHaveLength(1);
  });
});

describe("el escalón actual se deriva de las subidas (ADR #046)", () => {
  it("sin subidas, E1; con subidas, la última de esa rutina y ese modo", () => {
    expect(escalonActual(undefined, COMBAT, "bloques")).toBe(1);
    const perfil = { subidasVR: [
      { idRutina: RUT_COMBAT_LARGO, modo: "bloques", de: 1, a: 2 },
      { idRutina: RUT_COMBAT_LARGO, modo: "corrido", de: 1, a: 2 },
      { idRutina: RUT_COMBAT_LARGO, modo: "bloques", de: 2, a: 3 },
    ] as SubidaVR[] };
    expect(escalonActual(perfil, COMBAT, "bloques")).toBe(3);
    expect(escalonActual(perfil, COMBAT, "corrido")).toBe(2);
  });
  it("Combat corto sigue la dificultad del escalón actual de Combat largo por bloques", () => {
    expect(escalonDeHoy(CORTO, "bloques", undefined, COMBAT)!.escalon.dificultad).toBe("intermedio");
    const perfil = { subidasVR: [{ idRutina: RUT_COMBAT_LARGO, modo: "bloques", de: 1, a: 2 } as SubidaVR] };
    const hoy = escalonDeHoy(CORTO, "bloques", perfil, COMBAT)!;
    expect(hoy.escalon).toEqual({ bloques: 1, minutosBloque: 20, descansoSeg: 0, dificultad: "avanzado" });
  });
  it("aplicarSubida registra de qué escalón a cuál, en qué modo y con qué datos", () => {
    const r = evaluar([sesion({ fc: 140, semana: S1 }), sesion({ fc: 138, semana: S1 }), sesion({ fc: 133, semana: S2 })]);
    const a = aplicarSubida(undefined, COMBAT, r, 99);
    if (!a.ok) throw new Error(a.error);
    expect(a.subidasVR).toEqual([{
      fechaMs: 99, idRutina: RUT_COMBAT_LARGO, modo: "bloques", de: 1, a: 2,
      datos: { fcUltima: 133, fcReferencia: 139, diferencia: -6, umbral: 5, sesiones: r.numeros.sesiones.map((s) => s.idHist) },
    }]);
    expect(escalonActual({ subidasVR: a.subidasVR }, COMBAT, "bloques")).toBe(2);
    const mantener = evaluar([sesion({ fc: 140, semana: S1 })]);
    expect(aplicarSubida(undefined, COMBAT, mantener, 1).ok).toBe(false);
  });
  it("Combat corto ofrece solo un modo; las demás, dos", () => {
    expect(modosDe(CORTO)).toEqual(["bloques"]);
    expect(modosDe(COMBAT)).toEqual(["bloques", "corrido"]);
  });
});

describe("configuración y archivo (P98)", () => {
  it("/config/progresion: lo ausente o inválido cae a su default, campo por campo", () => {
    expect(normalizarConfigProgresion(undefined)).toEqual(CONFIG_PROGRESION_DEFAULT);
    expect(normalizarConfigProgresion({ umbralFcBpm: 6, sesionesMinimas: "x", fraccionTiempo: 2 }))
      .toEqual({ ...CONFIG_PROGRESION_DEFAULT, umbralFcBpm: 6 });
    expect(validarConfigProgresion(CONFIG_PROGRESION_DEFAULT)).toBeNull();
    expect(validarConfigProgresion({ ...CONFIG_PROGRESION_DEFAULT, umbralFcBpm: 0 })).toMatch(/umbral/);
  });
  it("el umbral de la configuración es el que usa la regla", () => {
    const hs = [sesion({ fc: 140, semana: S1 }), sesion({ fc: 138, semana: S1 }), sesion({ fc: 133, semana: S2 })];
    const estricto = evaluarReglaVR({ historial: hs, rutina: COMBAT, modo: "bloques", idEjercicio: EJ_BODYCOMBAT,
      config: { ...CONFIG_PROGRESION_DEFAULT, umbralFcBpm: 8 } })!;
    expect([estricto.estado, estricto.numeros.umbral]).toEqual(["mantener", 8]);
  });
  it("sinArchivadas saca las archivadas de las listas", () => {
    expect(sinArchivadas([{ archivada: true }, {}, { archivada: false }])).toHaveLength(2);
  });
});

describe("series por dificultad declarada (enmienda del 02/10)", () => {
  const series = (hs: Historial[], o: { rutina?: Rutina; modo?: ModoEscaleraVR; juego?: string } = {}) => {
    const r = o.rutina ?? COMBAT;
    return evaluarSeriesVR({ historial: hs, rutina: r, modo: o.modo ?? "bloques", idEjercicio: o.juego ?? r.vr!.idEjercicio });
  };

  it("dos dificultades en el mismo escalón son dos series, y no se mezclan", () => {
    // Combat largo E1 prevé Intermedio.
    const hs = [
      sesion({ fc: 140, semana: S1 }), sesion({ fc: 150, semana: S1, dificultad: "avanzado" }),
      sesion({ fc: 138, semana: S1 }), sesion({ fc: 152, semana: S1, dificultad: "avanzado" }),
      sesion({ fc: 133, semana: S2 }), sesion({ fc: 160, semana: S2, dificultad: "avanzado" }),
    ];
    const [prevista, avanzado, ...resto] = series(hs);
    expect(resto).toEqual([]);
    expect([prevista.dificultad, prevista.esPropuesta, prevista.estado]).toEqual(["intermedio", true, "subir"]);
    expect(prevista.numeros).toMatchObject({ fcReferencia: 139, fcUltima: 133, diferencia: -6 });
    expect([avanzado.dificultad, avanzado.esPropuesta, avanzado.estado, avanzado.motivo]).toEqual(["avanzado", false, "mantener", "fc-subio"]);
    expect(avanzado.numeros).toMatchObject({ fcReferencia: 151, fcUltima: 160 });
  });
  it("solo la serie de la dificultad prevista propone subir; las otras se calculan igual", () => {
    const hs = [140, 138, 133].map((fc, i) => sesion({ fc, semana: i < 2 ? S1 : S2, dificultad: "avanzado" }));
    const [prevista, avanzado] = series(hs);
    expect([prevista.dificultad, prevista.estado, prevista.numeros.sesiones.length]).toEqual(["intermedio", "sin-datos", 0]);
    expect([avanzado.estado, avanzado.esPropuesta]).toEqual(["subir", false]);
    expect(aplicarSubida(undefined, COMBAT, avanzado, 1)).toEqual({ ok: false, error: "Solo propone la serie de la dificultad prevista." });
  });
  it("«Mixto» es su propia serie y nunca propone; las sin declarar van al final", () => {
    const hs = [
      ...[140, 138, 133].map((fc, i) => sesion({ fc, semana: i < 2 ? S1 : S2, dificultad: "mixto" })),
      sesion({ fc: 145, semana: S2, dificultad: null }),
    ];
    const s = series(hs);
    expect(s.map((x) => [x.dificultad, x.esPropuesta])).toEqual([["intermedio", true], ["mixto", false], [null, false]]);
    expect(s[1].estado).toBe("subir");
  });
  it("ninguna sesión se excluye por la dificultad", () => {
    const hs = [sesion({ fc: 140, semana: S1, dificultad: "principiante" }), sesion({ fc: 140, semana: S1, dificultad: "mixto" })];
    for (const x of series(hs)) expect(x.numeros.excluidas).toEqual([]);
    expect(series(hs).reduce((n, x) => n + x.numeros.sesiones.length, 0)).toBe(2);
  });
  it("las «dos seguidas», las 3 sesiones y las 2 semanas se cuentan dentro de la serie", () => {
    // Las incompletas son de Avanzado: no frenan a Intermedio.
    const hs = [
      sesion({ fc: 140, semana: S1 }), sesion({ fc: 150, semana: S1, dificultad: "avanzado", completo: false }),
      sesion({ fc: 138, semana: S1 }), sesion({ fc: 150, semana: S2, dificultad: "avanzado", completo: false }),
      sesion({ fc: 133, semana: S2 }),
    ];
    const [prevista, avanzado] = series(hs);
    expect(prevista.estado).toBe("subir");
    expect([avanzado.estado, avanzado.motivo]).toEqual(["mantener", "no-completo-dos-seguidas"]);
  });
  it("evaluarReglaVR sin dificultad evalúa la prevista", () => {
    const hs = [140, 138, 133].map((fc, i) => sesion({ fc, semana: i < 2 ? S1 : S2, dificultad: "avanzado" }));
    expect(evaluarReglaVR({ historial: hs, rutina: COMBAT, modo: "bloques", idEjercicio: EJ_BODYCOMBAT })!.dificultad).toBe("intermedio");
  });
  it("Ritmo suave: el «bajar» de otra dificultad es informativo", () => {
    const z = { zonasUsadas: { Z3: { min: 119, max: 135 } } };
    const hs = [137, 138].map((fc, i) => sesion({ rutina: RITMO, modo: "corrido", fc, semana: i ? S2 : S1, bio: z, dificultad: "+1" }));
    const [base, mas1] = series(hs, { rutina: RITMO, modo: "corrido" });
    expect([base.dificultad, base.estado]).toEqual(["base", "sin-datos"]);
    expect([mas1.estado, mas1.esPropuesta]).toEqual(["bajar-dificultad", false]);
  });
});
