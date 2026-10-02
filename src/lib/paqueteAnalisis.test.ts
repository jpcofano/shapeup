// P93 — el paquete del análisis asistido. Con biometría completa (la sesión
// testigo real del 27/09), con biometría sin curva y sin biometría.
import { describe, it, expect } from "vitest";
import { armarPaqueteSesion, submuestrear } from "./paqueteAnalisis";
import { calcularEnriquecimiento } from "./enriquecerImport";
import { TOPE_PAQUETE_BYTES, VERSION_ESQUEMA_ANALISIS, VERSION_PROMPT_SESION } from "./analisis";
import type { Historial, PerfilMiembro } from "../types/models";
import { CURVA, DATAUUID, HISTORIAL, SESION_SAMSUNG, ZONAS_PERFIL } from "./__fixtures__/sesionTestigo20260927";

const PERFIL = { zonasFC: ZONAS_PERFIL, fcMaxTeorica: 169, objetivos: ["Recomposición"] } as PerfilMiembro;
const PROMPT = "# prompt de prueba";

/** La sesión testigo, enriquecida por el camino real. */
const CONBIO: Historial = (() => {
  const r = calcularEnriquecimiento([HISTORIAL], {
    sesionesSamsung: [SESION_SAMSUNG], liveData: { [DATAUUID]: CURVA }, shapeUpCustomId: "ShapeUp", muestrasFcCrudas: [],
  }, PERFIL);
  const u = r.updates[0];
  return { ...HISTORIAL, biometria: u.biometria, bloques: u.bloques ?? HISTORIAL.bloques };
})();

const contexto = (historial: Historial[] = []) => ({ historial, perfil: PERFIL, metaSemanalDias: 3 });

describe("submuestrear", () => {
  it("una curva de 50 min a 30 s da 100 puntos, promedio redondeado", () => {
    const origen = 1_000_000;
    const curva = Array.from({ length: 50 * 60 }, (_, i) => ({ ms: origen + i * 1000, fc: 100 + (i % 2) }));
    const puntos = submuestrear(curva, 30_000, origen);
    expect(puntos).toHaveLength(100);
    expect(puntos[0]).toEqual([0, 101]);          // 100,5 → 101
    expect(puntos[1][0]).toBe(30);
  });

  it("no interpola: un hueco de 2 min se ve como 4 baldes que faltan", () => {
    const origen = 0;
    const curva = Array.from({ length: 10 * 60 }, (_, i) => ({ ms: i * 1000, fc: 120 }))
      .filter((p) => p.ms < 3 * 60_000 || p.ms >= 5 * 60_000);
    const segs = submuestrear(curva, 30_000, origen).map(([s]) => s);
    expect(segs).toHaveLength(16);
    expect(segs).not.toContain(180);
    expect(segs).not.toContain(270);
    expect(segs).toContain(300);
  });

  it("solo entran las muestras de la ventana", () => {
    const curva = [{ ms: -1000, fc: 200 }, { ms: 0, fc: 100 }, { ms: 61_000, fc: 200 }];
    expect(submuestrear(curva, 30_000, 0, 60_000)).toEqual([[0, 100]]);
  });
});

describe("armarPaqueteSesion", () => {
  it("con biometría completa: sesión, ejercicios, curva y contexto, en ese orden", () => {
    const p = armarPaqueteSesion({ sesion: CONBIO, contexto: contexto(), curva: CURVA, prompt: PROMPT });
    expect(Object.keys(p.datos)).toEqual(["paquete", "quienEntrena", "sesion", "ejercicios", "curva", "contexto"]);
    expect(p.texto.startsWith(PROMPT)).toBe(true);
    expect(p.recortes).toEqual([]);
    expect(p.bytes).toBeLessThan(TOPE_PAQUETE_BYTES);
    // ~49 min de ventana a 30 s
    expect(p.datos.curva!.puntos.length).toBeGreaterThan(90);
    expect(p.datos.curva!.puntos.length).toBeLessThanOrEqual(99);
    expect(p.datos.paquete.responderCon).toMatchObject({
      version: VERSION_ESQUEMA_ANALISIS, tipo: "sesion", idHist: CONBIO.idHist,
      armado: { versionPrompt: VERSION_PROMPT_SESION, versionEnriquecimiento: CONBIO.biometria!.versionEnriquecimiento },
    });
  });

  it("la calidad del dato va siempre, y las dos duraciones cuando se adoptó la del reloj", () => {
    const p = armarPaqueteSesion({ sesion: CONBIO, contexto: contexto(), curva: CURVA, prompt: PROMPT });
    const reloj = p.datos.sesion.medidoPorElReloj as Record<string, Record<string, unknown>>;
    expect(Object.keys(reloj.calidad).sort()).toEqual(["coberturaFina", "coberturaTotal", "fcDudosa", "kcalEstimada", "motivoCobertura"]);
    expect(reloj.comoSeCruzo).toMatchObject({ ventanaAdoptada: "samsung", duracionAppMin: 49, duracionRelojMin: 47.8 });
    expect(typeof reloj.comoSeCruzo.desfaseDuracionPct).toBe("number");
    expect(reloj.minutosPorZona).toEqual(CONBIO.biometria!.minutosPorZona);
    expect(reloj).toHaveProperty("minutosSinDato");
  });

  it("los minutos por zona de cada ejercicio viajan tal cual", () => {
    const p = armarPaqueteSesion({ sesion: CONBIO, contexto: contexto(), curva: CURVA, prompt: PROMPT });
    expect(p.datos.ejercicios[0].minutosPorZona).toEqual(CONBIO.bloques[0].minutosPorZona);
  });

  it("con biometría pero sin curva: no hay curva y lo avisa", () => {
    const p = armarPaqueteSesion({ sesion: CONBIO, contexto: contexto(), curva: null, prompt: PROMPT });
    expect(p.datos.curva).toBeNull();
    expect(p.datos.paquete.avisos.join(" ")).toMatch(/no la curva/);
    expect(p.datos.sesion.medidoPorElReloj).not.toBeNull();
  });

  it("sin biometría: igual sirve, y dice que no puede prometer lo fisiológico", () => {
    const { biometria: _b, ...sinBio } = CONBIO;
    const p = armarPaqueteSesion({ sesion: sinBio, contexto: contexto(), curva: null, prompt: PROMPT });
    expect(p.datos.sesion.medidoPorElReloj).toBeNull();
    expect(p.datos.curva).toBeNull();
    expect(p.datos.ejercicios).toHaveLength(1);
    expect(p.datos.paquete.avisos[0]).toMatch(/no se puede concluir nada fisiológico/);
    expect(p.datos.paquete.responderCon.armado.versionEnriquecimiento).toBeNull();
  });

  it("pasado el tope, recorta primero el contexto y lo declara", () => {
    const completo = armarPaqueteSesion({ sesion: CONBIO, contexto: contexto([CONBIO]), curva: CURVA, prompt: PROMPT });
    const sinContexto = armarPaqueteSesion({ sesion: CONBIO, contexto: contexto([CONBIO]), curva: CURVA, prompt: PROMPT, tope: 1 });
    // Con un tope de 1 byte no entra nunca: recorta todo, en orden, y lo dice.
    expect(sinContexto.recortes[0]).toMatch(/^contexto/);
    expect(sinContexto.recortes).toEqual([
      "contexto (sesiones previas, semana y día)", "curva bajada a un punto cada 60 s", "curva entera",
    ]);
    expect(sinContexto.datos.contexto).toBeNull();
    expect(sinContexto.datos.paquete.recortes).toEqual(sinContexto.recortes);
    expect(sinContexto.excedeTope).toBe(true);

    // Con un tope que solo exige sacar el contexto, la curva queda a 30 s.
    const tope = completo.bytes - 10;
    const justo = armarPaqueteSesion({ sesion: CONBIO, contexto: contexto([CONBIO]), curva: CURVA, prompt: PROMPT, tope });
    expect(justo.recortes).toEqual(["contexto (sesiones previas, semana y día)"]);
    expect(justo.datos.curva!.pasoSeg).toBe(30);
    expect(justo.excedeTope).toBe(false);
  });

  it("las series llevan su descanso real y su posición en la ventana", () => {
    const dos: Historial = {
      ...CONBIO,
      bloques: [{
        ...CONBIO.bloques[0], modalidad: "Fuerza",
        series: [
          { serie: 1, completada: true, reps: 10, cargaKg: 20, inicioMs: CONBIO.inicioMs!, finMs: CONBIO.inicioMs! + 40_000 },
          { serie: 2, completada: true, reps: 9, cargaKg: 20, inicioMs: CONBIO.inicioMs! + 135_000, finMs: CONBIO.inicioMs! + 175_000 },
        ],
      }],
    };
    const p = armarPaqueteSesion({ sesion: dos, contexto: contexto(), curva: null, prompt: PROMPT });
    const series = p.datos.ejercicios[0].series as Record<string, unknown>[];
    expect(series[1]).toMatchObject({ descansoAntesSeg: 95, duracionSeg: 40, reps: 9, cargaKg: 20 });
    expect(series[0].descansoAntesSeg).toBeUndefined();
  });

  it("una sesión vieja sin ventana en el documento usa la de sus series", () => {
    const { inicioMs: _i, finMs: _f, ...vieja } = CONBIO;
    const p = armarPaqueteSesion({ sesion: vieja, contexto: contexto(), curva: CURVA, prompt: PROMPT });
    expect(p.datos.paquete.responderCon.armado.ventana).not.toBeNull();
    expect(p.datos.curva!.origen).toMatch(/inicio de la ventana/);
    expect(p.datos.curva!.puntos.length).toBeGreaterThan(90);
  });

  it("sin ventana ni series selladas, la curva se alinea desde su primera muestra y lo dice", () => {
    const { inicioMs: _i, finMs: _f, ...vieja } = CONBIO;
    const sinSeries = { ...vieja, bloques: vieja.bloques.map((b) => ({ ...b, series: b.series.map(({ inicioMs: _a, finMs: _b, ...x }) => x) })) };
    const p = armarPaqueteSesion({ sesion: sinSeries, contexto: contexto(), curva: CURVA, prompt: PROMPT });
    expect(p.datos.paquete.responderCon.armado.ventana).toBeNull();
    expect(p.datos.curva!.origen).toMatch(/primera muestra/);
    expect(p.datos.curva!.puntos[0][0]).toBe(0);
  });
});

// ── Enmienda de P93 ──────────────────────────────────────────────────────────

describe("las zonas del paquete (P97)", () => {
  it("son las que la sesión usó, no las del perfil de hoy", () => {
    const hoy = { ...PERFIL, fcMaxTeorica: 180, zonasFC: { Z5: { min: 162, max: 180 } } } as PerfilMiembro;
    const p = armarPaqueteSesion({ sesion: CONBIO, contexto: { ...contexto(), perfil: hoy }, curva: CURVA, prompt: PROMPT });
    expect(p.datos.quienEntrena.zonasFC).toEqual(CONBIO.biometria!.zonasUsadas);
    expect(p.datos.quienEntrena.fcMaxTeorica).toBe(169);
  });
});

describe("de dónde salió la ventana (enmienda P93)", () => {
  const MIN = 60_000;
  /** Una sesión vieja, sin ventana propia, con series que abarcan `tramoMin`. */
  function vieja(duracionRealMin: number | null, tramoMin: number): Historial {
    const t0 = CONBIO.inicioMs!;
    const { inicioMs: _i, finMs: _f, biometria: _b, ...resto } = CONBIO;
    return {
      ...resto, duracionRealMin,
      bloques: [{
        ...CONBIO.bloques[0], modalidad: "Fuerza", prescripcionUsada: undefined,
        series: [
          { serie: 1, completada: true, reps: 10, inicioMs: t0, finMs: t0 + MIN },
          { serie: 2, completada: true, reps: 10, inicioMs: t0 + (tramoMin - 1) * MIN, finMs: t0 + tramoMin * MIN },
        ],
      }],
    };
  }

  it("con inicio y cierre propios, ventanaOrigen es \"sesion\" y no hay nota", () => {
    const p = armarPaqueteSesion({ sesion: CONBIO, contexto: contexto(), curva: CURVA, prompt: PROMPT });
    expect(p.datos.sesion.ventanaOrigen).toBe("sesion");
    expect(p.datos.sesion).not.toHaveProperty("discrepanciaDuracion");
  });

  it("el caso del 29/06: 17 min registrados contra 38,6 de las series → los dos números y la nota", () => {
    const p = armarPaqueteSesion({ sesion: vieja(17, 38.6), contexto: contexto(), curva: null, prompt: PROMPT });
    expect(p.datos.sesion.ventanaOrigen).toBe("series");
    expect(p.datos.sesion.discrepanciaDuracion).toMatchObject({ duracionRegistradaMin: 17, tramoSeriesMin: 38.6 });
    expect(p.datos.paquete.avisos[0]).toMatch(/no cierran.*17 min.*38,6 min/);
    expect(p.datos.paquete.avisos[0]).toMatch(/duración ni de densidad/);
  });

  it("con la ventana de las series pero la duración coincidiendo (≤ 12 %), sin nota", () => {
    const p = armarPaqueteSesion({ sesion: vieja(40, 38.6), contexto: contexto(), curva: null, prompt: PROMPT });
    expect(p.datos.sesion.ventanaOrigen).toBe("series");
    expect(p.datos.sesion).not.toHaveProperty("discrepanciaDuracion");
    expect(p.datos.paquete.avisos.join(" ")).not.toMatch(/no cierran/);
  });

  it("sin duración registrada no se inventa la discrepancia", () => {
    const p = armarPaqueteSesion({ sesion: vieja(null, 38.6), contexto: contexto(), curva: null, prompt: PROMPT });
    expect(p.datos.sesion).not.toHaveProperty("discrepanciaDuracion");
  });

  it("sin ventana de ningún tipo, ventanaOrigen es null", () => {
    const { inicioMs: _i, finMs: _f, ...sinVentana } = CONBIO;
    const sinSeries = { ...sinVentana, bloques: [{ ...CONBIO.bloques[0], series: [{ serie: 1, completada: true }] }] };
    const p = armarPaqueteSesion({ sesion: sinSeries, contexto: contexto(), curva: null, prompt: PROMPT });
    expect(p.datos.sesion.ventanaOrigen).toBeNull();
  });
});

describe("de dónde salió la prescripción (enmienda P93)", () => {
  const RUTINA = {
    nombre: "R", nivel: "Avanzado", objetivo: "Pérdida de grasa",
    bloques: [
      { orden: 1, idEjercicio: "EJ-9009", nombreEjercicio: "PowerBeatsVR (VR)", modalidad: "Cardio",
        prescripcion: { modalidad: "Cardio", formato: "Intervalos", rondas: 8, trabajoSeg: 240, descansoSeg: 30 } },
      { orden: 2, idEjercicio: "EJ-0001", nombreEjercicio: "Sentadilla", modalidad: "Fuerza",
        prescripcion: { modalidad: "Fuerza", series: 3, repsObjetivo: { value: 10, raw: "8-10" }, descansoSeg: 90 } },
    ],
  } as unknown as NonNullable<Parameters<typeof armarPaqueteSesion>[0]["contexto"]["rutina"]>;
  const conFuerza: Historial = {
    ...CONBIO,
    bloques: [
      CONBIO.bloques[0],
      { orden: 2, idEjercicio: "EJ-0001", nombreEjercicio: "Sentadilla", modalidad: "Fuerza", series: [{ serie: 1, completada: true, reps: 10 }] },
    ],
  };
  const armar = (rutina = RUTINA) =>
    armarPaqueteSesion({ sesion: conFuerza, contexto: { ...contexto(), rutina }, curva: null, prompt: PROMPT });

  it("si la sesión guardó con qué se hizo (VR), usa eso y no la rutina actual", () => {
    const [vr] = armar().datos.ejercicios;
    expect(vr.prescripcionOrigen).toBe("sesion");
    expect(vr.prescripcion).toEqual(CONBIO.bloques[0].prescripcionUsada);   // 5 × 300 s, no los 8 × 240 de hoy
    expect(vr).not.toHaveProperty("prescripcionAclaracion");
  });

  it("si no la guardó, lee la rutina actual y lo dice", () => {
    const [, fuerza] = armar().datos.ejercicios;
    expect(fuerza.prescripcionOrigen).toBe("rutina-actual");
    expect(fuerza.prescripcion).toMatchObject({ series: 3, reps: "8-10", descansoSeg: 90 });
    expect(fuerza.prescripcionAclaracion).toMatch(/puede diferir de la que regía/);
  });

  it("sin rutina y sin nada guardado, no hay prescripción ni origen", () => {
    const [, fuerza] = armar(null as never).datos.ejercicios;
    expect(fuerza).not.toHaveProperty("prescripcion");
    expect(fuerza).not.toHaveProperty("prescripcionOrigen");
  });
});
