// ════════════════════════════════════════════════════════════════════════════
//  progresionVR.test.ts — la escalera de progresión de VR (P79).
// ════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  sugerirProgresionVR, fcDeTrabajo, coberturaFcDeTrabajo, descansoRealSeg,
  recuperacionMediana, parametrosDeArranque, munecaNoMide, subidasAceptadasSeguidas,
  bloqueVRDeRutina, esRutinaVR,
  PISO_DESCANSO_SEG, PASO_DESCANSO_SEG, TECHO_RONDAS_EXTRA, RECUPERACION_MINIMA_BPM,
  rondasValidas, medirSesionVR, FRACCION_RONDA_MINIMA, FACTOR_PAUSA,
  prescripcionDeRutina, tiempoObjetivoMin, modoOfrecidoVR,
} from "./progresionVR";
import type { Historial, PerfilMiembro, Rutina, SerieRegistro } from "../types/models";

// ── Fixtures ───────────────────────────────────────────────────────────────

/** El perfil real de juanpablo: zonas a medida, FC máx 169. */
const PERFIL: PerfilMiembro = {
  fcMaxTeorica: 169,
  zonasFC: {
    Z1: { min: 85, max: 101 }, Z2: { min: 101, max: 118 }, Z3: { min: 118, max: 135 },
    Z4: { min: 135, max: 152 }, Z5: { min: 152, max: 169 },
  },
};

const ID_EJ = "EJ-9009";

function rutinaVR(over: Partial<{ rondas: number; trabajoSeg: number; descansoSeg: number; zonaObjetivo: string }> = {}): Rutina {
  return {
    idRutina: "RUT-0004", nombre: "VR — Quema full-body", nombreCanonico: "vr",
    foco: "Cuerpo completo", objetivo: "General / salud", nivel: "Intermedio",
    nivelOrden: 2, lugar: "Casa", duracionEstimadaMin: 30, estado: "Activa", vecesUsada: 0,
    bloques: [{
      orden: 1, idEjercicio: ID_EJ, nombreEjercicio: "PowerBeatsVR (VR)", modalidad: "Cardio",
      prescripcion: {
        modalidad: "Cardio", formato: "Intervalos", juegoSugerido: "PowerBeatsVR",
        rondas: over.rondas ?? 5, trabajoSeg: over.trabajoSeg ?? 300,
        descansoSeg: over.descansoSeg ?? 60, zonaObjetivo: over.zonaObjetivo ?? "Z4",
      },
    }],
  } as unknown as Rutina;
}

const T0 = Date.UTC(2026, 8, 18, 12, 0);

/**
 * Una sesión de VR. `fcs` da la FC media de cada ronda (`null` = sin medir),
 * `descansoSeg` el hueco real entre rondas.
 */
function sesion(opts: {
  fecha: string;
  fcs: Array<number | null>;
  descansoSeg?: number;
  trabajoSeg?: number;
  completadas?: number;
  dudosas?: number[];
  recuperacion?: number;
  prescripcionUsada?: { rondas: number; trabajoSeg: number; descansoSeg: number };
  progresionVR?: Historial["progresionVR"];
  dificultadPercibida?: Historial["dificultadPercibida"];
}): Historial {
  const trabajo = (opts.trabajoSeg ?? 300) * 1000;
  const descanso = (opts.descansoSeg ?? 60) * 1000;
  const completadas = opts.completadas ?? opts.fcs.length;

  const series: SerieRegistro[] = opts.fcs.map((fc, i) => {
    const ini = T0 + i * (trabajo + descanso);
    return {
      serie: i + 1,
      completada: i < completadas,
      inicioMs: ini,
      finMs: ini + trabajo,
      ...(fc != null ? { fcMedia: fc } : {}),
      ...(opts.dudosas?.includes(i + 1) ? { fcDudosa: true } : {}),
      ...(opts.recuperacion != null ? { recuperacionBpm: opts.recuperacion } : {}),
    };
  });

  return {
    idHist: `H-${opts.fecha}`, fechaRealizada: opts.fecha,
    fechaRealizadaTimestamp: { seconds: 0, nanoseconds: 0 },
    idSesion: "SES", idRutina: "RUT-0004", nombreRutina: "VR", semanaInicio: opts.fecha,
    miembro: "juanpablo", duracionRealMin: 30, rpe: null, tonelajeKg: null,
    totalSeriesHechas: null,
    ...(opts.progresionVR ? { progresionVR: opts.progresionVR } : {}),
    ...(opts.dificultadPercibida ? { dificultadPercibida: opts.dificultadPercibida } : {}),
    bloques: [{
      orden: 1, idEjercicio: ID_EJ, nombreEjercicio: "PowerBeatsVR (VR)", modalidad: "Cardio",
      series,
      ...(opts.prescripcionUsada ? { prescripcionUsada: opts.prescripcionUsada } : {}),
    }],
  } as unknown as Historial;
}

const sugerir = (ultima: Historial, anteriores: Historial[] = [], rutina = rutinaVR()) =>
  sugerirProgresionVR({ ultima, anteriores, rutina, perfil: PERFIL })!;

// ════════════════════════════════════════════════════════════════════════════
//  Parte 2 — FC de trabajo y descanso real
// ════════════════════════════════════════════════════════════════════════════

describe("fcDeTrabajo", () => {
  it("una sesión con rondas a 150 y descansos a 110 da 150, no el promedio de sesión", () => {
    // ⭐ El test que atrapa el sesgo que motiva todo el prompt. La FC media de
    // la SESIÓN promediaría los descansos y daría ~136; la de TRABAJO da 150.
    const s = sesion({ fecha: "2026-09-18", fcs: [150, 150, 150, 150, 150] });
    expect(fcDeTrabajo(s.bloques[0].series)).toBe(150);
  });

  it("pondera por duración, no por cantidad de rondas", () => {
    // Una ronda larga a 150 y una corta a 100: el resultado se corre hacia 150.
    const series: SerieRegistro[] = [
      { serie: 1, completada: true, inicioMs: 0, finMs: 400_000, fcMedia: 150 },
      { serie: 2, completada: true, inicioMs: 500_000, finMs: 600_000, fcMedia: 100 },
    ];
    // (150×400 + 100×100) / 500 = 140
    expect(fcDeTrabajo(series)).toBe(140);
  });

  it("las rondas dudosas no entran", () => {
    const s = sesion({ fecha: "2026-09-18", fcs: [150, 150, 190, 150, 150], dudosas: [3] });
    expect(fcDeTrabajo(s.bloques[0].series)).toBe(150);
  });

  it("las rondas sin completar tampoco", () => {
    const s = sesion({ fecha: "2026-09-18", fcs: [150, 150, 90], completadas: 2 });
    expect(fcDeTrabajo(s.bloques[0].series)).toBe(150);
  });

  it("sin ninguna ronda medida da null", () => {
    const s = sesion({ fecha: "2026-09-18", fcs: [null, null, null] });
    expect(fcDeTrabajo(s.bloques[0].series)).toBeNull();
  });
});

describe("coberturaFcDeTrabajo", () => {
  it("todas medidas y limpias dan 1", () => {
    const s = sesion({ fecha: "2026-09-18", fcs: [150, 150, 150, 150] });
    expect(coberturaFcDeTrabajo(s.bloques[0].series)).toBe(1);
  });

  it("una dudosa de cuatro baja la cobertura a 0,75", () => {
    const s = sesion({ fecha: "2026-09-18", fcs: [150, 150, 150, 150], dudosas: [2] });
    expect(coberturaFcDeTrabajo(s.bloques[0].series)).toBeCloseTo(0.75, 5);
  });
});

describe("descansoRealSeg", () => {
  it("es la mediana de los huecos entre rondas", () => {
    const s = sesion({ fecha: "2026-09-18", fcs: [150, 150, 150, 150], descansoSeg: 45 });
    expect(descansoRealSeg(s.bloques[0].series).seg).toBe(45);
  });

  it("un intervalo raro no la mueve", () => {
    // Cuatro huecos de 60 s y uno de 20 minutos: la mediana sigue en 60.
    const series: SerieRegistro[] = [];
    let t = T0;
    for (let i = 0; i < 6; i++) {
      series.push({ serie: i + 1, completada: true, inicioMs: t, finMs: t + 300_000 });
      t += 300_000 + (i === 2 ? 1_200_000 : 60_000);
    }
    expect(descansoRealSeg(series).seg).toBe(60);
  });

  it("sin timestamps da null", () => {
    expect(descansoRealSeg([{ serie: 1, completada: true }]).seg).toBeNull();
  });

  it("recuperacionMediana ignora las rondas sin dato", () => {
    const series: SerieRegistro[] = [
      { serie: 1, completada: true, recuperacionBpm: 10 },
      { serie: 2, completada: true },
      { serie: 3, completada: true, recuperacionBpm: 20 },
    ];
    expect(recuperacionMediana(series)).toBe(15);
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  Parte 5 — una por regla
// ════════════════════════════════════════════════════════════════════════════

describe("sugerirProgresionVR · regla 1, rondas incompletas", () => {
  it("incompleta → mantener, y el motivo se dice en minutos (P80)", () => {
    const s = sesion({ fecha: "2026-09-18", fcs: [150, 150, 150], completadas: 3 });
    const r = sugerir(s);   // la rutina pide 25 min; se jugaron 15
    expect(r.palanca).toBe("mantener");
    expect(r.motivo).toContain("15 de 25 min");
  });

  it("dos incompletas seguidas → bajar", () => {
    const previa = sesion({ fecha: "2026-09-16", fcs: [150, 150], completadas: 2 });
    const s = sesion({ fecha: "2026-09-18", fcs: [150, 150, 150], completadas: 3 });
    expect(sugerir(s, [previa]).palanca).toBe("bajar");
  });
});

describe("sugerirProgresionVR · regla 2, FC confiable", () => {
  it("por debajo del objetivo → subir dificultad", () => {
    // Z4 es 135–152; 125 cae en Z3.
    const s = sesion({ fecha: "2026-09-18", fcs: [125, 125, 125, 125, 125] });
    const r = sugerir(s);
    expect(r.palanca).toBe("subir-dificultad");
    expect(r.fuente).toBe("fc");
    expect(r.motivo).toContain("PowerBeatsVR");
  });

  it("por debajo con dos subidas aceptadas → recortar descanso", () => {
    const prog = { palanca: "subir-dificultad" as const, aceptada: true, fuente: "fc" as const };
    const a = sesion({ fecha: "2026-09-14", fcs: [125, 125, 125, 125, 125], progresionVR: prog });
    const b = sesion({ fecha: "2026-09-16", fcs: [125, 125, 125, 125, 125], progresionVR: prog });
    const s = sesion({ fecha: "2026-09-18", fcs: [125, 125, 125, 125, 125], progresionVR: prog });
    const r = sugerir(s, [a, b]);
    expect(subidasAceptadasSeguidas({ ultima: s, anteriores: [a, b], rutina: rutinaVR() })).toBe(3);
    expect(r.palanca).toBe("recortar-descanso");
    expect(r.nuevaPrescripcion.descansoSeg).toBe(60 - PASO_DESCANSO_SEG);
  });

  it("en zona con mala recuperación → mantener", () => {
    const s = sesion({
      fecha: "2026-09-18", fcs: [142, 142, 142, 142, 142],
      recuperacion: RECUPERACION_MINIMA_BPM - 5,
    });
    const r = sugerir(s);
    expect(r.palanca).toBe("mantener");
    expect(r.motivo).toContain("bpm");
  });

  it("en zona → recortar descanso", () => {
    const s = sesion({ fecha: "2026-09-18", fcs: [142, 142, 142, 142, 142], recuperacion: 20 });
    const r = sugerir(s);
    expect(r.palanca).toBe("recortar-descanso");
    expect(r.nuevaPrescripcion.descansoSeg).toBe(45);
  });

  it("en zona con el descanso en el piso → sumar ronda", () => {
    const usada = { rondas: 5, trabajoSeg: 300, descansoSeg: PISO_DESCANSO_SEG };
    const s = sesion({
      fecha: "2026-09-18", fcs: [142, 142, 142, 142, 142], recuperacion: 20,
      prescripcionUsada: usada,
    });
    const r = sugerir(s);
    expect(r.palanca).toBe("sumar-ronda");
    expect(r.nuevaPrescripcion.rondas).toBe(6);
  });

  it("en zona con las rondas en el techo → mantener, y lo dice", () => {
    const usada = {
      rondas: 5 + TECHO_RONDAS_EXTRA, trabajoSeg: 300, descansoSeg: PISO_DESCANSO_SEG,
    };
    const s = sesion({
      fecha: "2026-09-18", fcs: Array(usada.rondas).fill(142), recuperacion: 20,
      prescripcionUsada: usada,
    });
    const r = sugerir(s);
    expect(r.palanca).toBe("mantener");
    expect(r.motivo).toContain("es hora de otra");
  });

  it("una zona por encima → mantener", () => {
    // Z5 es 152–169, una arriba de Z4.
    const s = sesion({ fecha: "2026-09-18", fcs: [160, 160, 160, 160, 160], recuperacion: 20 });
    expect(sugerir(s).palanca).toBe("mantener");
  });

  it("dos zonas por encima deshace el último ajuste", () => {
    // Objetivo Z2; midió Z4 ⇒ dos zonas arriba. Venía con una ronda extra.
    const rutina = rutinaVR({ zonaObjetivo: "Z2" });
    const usada = { rondas: 6, trabajoSeg: 300, descansoSeg: 60 };
    const s = sesion({
      fecha: "2026-09-18", fcs: Array(6).fill(142), recuperacion: 20, prescripcionUsada: usada,
    });
    const r = sugerirProgresionVR({ ultima: s, anteriores: [], rutina, perfil: PERFIL })!;
    expect(r.palanca).toBe("bajar");
    expect(r.nuevaPrescripcion.rondas).toBe(5);
  });

  it("dos zonas por encima sin ajuste que deshacer deja la prescripción igual: es un consejo", () => {
    const rutina = rutinaVR({ zonaObjetivo: "Z2" });
    const s = sesion({ fecha: "2026-09-18", fcs: Array(5).fill(142), recuperacion: 20 });
    const r = sugerirProgresionVR({ ultima: s, anteriores: [], rutina, perfil: PERFIL })!;
    expect(r.palanca).toBe("bajar");
    expect(r.nuevaPrescripcion).toEqual({ rondas: 5, trabajoSeg: 300, descansoSeg: 60, duracionObjetivoMin: 25 });
  });
});

describe("sugerirProgresionVR · regla 3, el descanso decide", () => {
  it("sin FC y con descanso de sobra → recortar, con el número en el motivo", () => {
    const s = sesion({ fecha: "2026-09-18", fcs: [null, null, null, null, null], descansoSeg: 38 });
    const r = sugerir(s);
    expect(r.palanca).toBe("recortar-descanso");
    expect(r.fuente).toBe("descanso");
    expect(r.motivo).toContain("38");
    expect(r.motivo).toContain("60");
  });

  it("sin FC y con descanso de más → mantener", () => {
    const s = sesion({ fecha: "2026-09-18", fcs: [null, null, null, null, null], descansoSeg: 90 });
    const r = sugerir(s);
    expect(r.palanca).toBe("mantener");
    expect(r.fuente).toBe("descanso");
  });
});

describe("sugerirProgresionVR · regla 4, sin medición", () => {
  it("sin FC y con descanso normal → palanca null, y dice qué falta", () => {
    const s = sesion({ fecha: "2026-09-18", fcs: [null, null, null, null, null], descansoSeg: 60 });
    const r = sugerir(s);
    expect(r.palanca).toBeNull();
    expect(r.fuente).toBe("sin-medicion");
    expect(r.motivo).toBe("no hubo curva de FC en esta sesión");
  });

  it("el motivo distingue los artefactos de la falta de curva", () => {
    const s = sesion({
      fecha: "2026-09-18", fcs: [150, 150, 150, 150, 150],
      dudosas: [1, 2, 3, 4], descansoSeg: 60,
    });
    const r = sugerir(s);
    expect(r.palanca).toBeNull();
    expect(r.motivo).toContain("artefactos en 4 de 5");
  });

  it("sin perfil con zonas, la FC no decide y lo dice", () => {
    const s = sesion({ fecha: "2026-09-18", fcs: [142, 142, 142, 142, 142], descansoSeg: 60 });
    const r = sugerirProgresionVR({ ultima: s, anteriores: [], rutina: rutinaVR(), perfil: {} })!;
    expect(r.palanca).toBeNull();
    expect(r.motivo).toContain("FC máxima");
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  La sensación NO decide
// ════════════════════════════════════════════════════════════════════════════

describe("dificultadPercibida no entra en ninguna regla", () => {
  it("la misma sesión con suave, normal, intenso o ausente da la misma sugerencia", () => {
    const base = { fecha: "2026-09-18", fcs: [125, 125, 125, 125, 125] };
    const variantes: Array<Historial["dificultadPercibida"]> = [undefined, "suave", "normal", "intenso"];
    const resultados = variantes.map((d) =>
      sugerir(sesion({ ...base, ...(d ? { dificultadPercibida: d } : {}) })));

    for (const r of resultados) {
      expect(r.palanca).toBe(resultados[0].palanca);
      expect(r.motivo).toBe(resultados[0].motivo);
      expect(r.fuente).toBe(resultados[0].fuente);
      expect(r.nuevaPrescripcion).toEqual(resultados[0].nuevaPrescripcion);
    }
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  Parte 4 — los parámetros salen de la historia
// ════════════════════════════════════════════════════════════════════════════

describe("parametrosDeArranque", () => {
  const rutina = rutinaVR();

  it("sin historia, los de la rutina", () => {
    const r = parametrosDeArranque([], rutina);
    expect(r.desdeHistoria).toBe(false);
    expect(r.prescripcion).toEqual({ rondas: 5, trabajoSeg: 300, descansoSeg: 60, duracionObjetivoMin: 25 });
  });

  it("la segunda sesión arranca con los de la primera MÁS el ajuste aceptado", () => {
    const primera = sesion({
      fecha: "2026-09-16", fcs: [142, 142, 142, 142, 142],
      prescripcionUsada: { rondas: 5, trabajoSeg: 300, descansoSeg: 60 },
      progresionVR: { palanca: "recortar-descanso", aceptada: true, fuente: "fc" },
    });
    const r = parametrosDeArranque([primera], rutina);
    expect(r.desdeHistoria).toBe(true);
    expect(r.prescripcion.descansoSeg).toBe(45);
  });

  it("con el ajuste rechazado, arranca igual que la primera", () => {
    const primera = sesion({
      fecha: "2026-09-16", fcs: [142, 142, 142, 142, 142],
      prescripcionUsada: { rondas: 5, trabajoSeg: 300, descansoSeg: 60 },
      progresionVR: { palanca: "recortar-descanso", aceptada: false, fuente: "fc" },
    });
    expect(parametrosDeArranque([primera], rutina).prescripcion.descansoSeg).toBe(60);
  });

  it("un juego sustituido no hereda la historia del otro", () => {
    // La sesión anterior se jugó con otro ejercicio (P73 sustituyó el juego):
    // no hay bloque de ESTE idEjercicio, así que no hay historia que heredar.
    const otra = sesion({
      fecha: "2026-09-16", fcs: [142, 142],
      prescripcionUsada: { rondas: 9, trabajoSeg: 999, descansoSeg: 15 },
    });
    otra.bloques[0].idEjercicio = "EJ-9999";
    const r = parametrosDeArranque([otra], rutina);
    expect(r.desdeHistoria).toBe(false);
    expect(r.prescripcion).toEqual({ rondas: 5, trabajoSeg: 300, descansoSeg: 60, duracionObjetivoMin: 25 });
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  §9.3 — cuando la muñeca no sirve para ese juego
// ════════════════════════════════════════════════════════════════════════════

describe("munecaNoMide (§9.3)", () => {
  it("3 de 5 con artefactos aplica", () => {
    const conArtefactos = (f: string) => sesion({ fecha: f, fcs: [150, 150, 150], dudosas: [1] });
    const limpia = (f: string) => sesion({ fecha: f, fcs: [150, 150, 150] });
    const r = munecaNoMide([
      conArtefactos("2026-09-18"), conArtefactos("2026-09-16"), conArtefactos("2026-09-14"),
      limpia("2026-09-12"), limpia("2026-09-10"),
    ], ID_EJ);
    expect(r.aplica).toBe(true);
    expect(r.conArtefactos).toBe(3);
  });

  it("3 de 5 SIN curva no aplica: es otro problema", () => {
    const sinCurva = (f: string) => sesion({ fecha: f, fcs: [null, null, null] });
    const limpia = (f: string) => sesion({ fecha: f, fcs: [150, 150, 150] });
    const r = munecaNoMide([
      sinCurva("2026-09-18"), sinCurva("2026-09-16"), sinCurva("2026-09-14"),
      limpia("2026-09-12"), limpia("2026-09-10"),
    ], ID_EJ);
    expect(r.aplica).toBe(false);
    expect(r.conArtefactos).toBe(0);
  });

  it("2 de 5 no alcanza", () => {
    const conArtefactos = (f: string) => sesion({ fecha: f, fcs: [150, 150], dudosas: [1] });
    const limpia = (f: string) => sesion({ fecha: f, fcs: [150, 150] });
    expect(munecaNoMide([
      conArtefactos("2026-09-18"), conArtefactos("2026-09-16"),
      limpia("2026-09-14"), limpia("2026-09-12"), limpia("2026-09-10"),
    ], ID_EJ).aplica).toBe(false);
  });
});

describe("lectura de la rutina", () => {
  it("reconoce una rutina VR por Cardio + Intervalos + juegoSugerido", () => {
    expect(esRutinaVR(rutinaVR())).toBe(true);
    expect(bloqueVRDeRutina(rutinaVR())?.idEjercicio).toBe(ID_EJ);
  });

  it("una rutina de fuerza no es VR", () => {
    const fuerza = {
      idRutina: "RUT-0001", bloques: [{
        orden: 1, idEjercicio: "EJ-1", nombreEjercicio: "Press", modalidad: "Fuerza",
        prescripcion: { modalidad: "Fuerza", series: 3, descansoSeg: 90 },
      }],
    } as unknown as Rutina;
    expect(esRutinaVR(fuerza)).toBe(false);
    expect(sugerirProgresionVR({ ultima: sesion({ fecha: "2026-09-18", fcs: [150] }), anteriores: [], rutina: fuerza })).toBeNull();
  });
});


// ════════════════════════════════════════════════════════════════════════════
//  P79b — que el dato sucio no se crea
//
//  Las dos fixtures son los casos REALES que el reporte de P79 encontró.
// ════════════════════════════════════════════════════════════════════════════

describe("rondasValidas", () => {
  /** Una serie de `seg` segundos, arrancando en `ini`. */
  const ronda = (n: number, ini: number, seg: number): SerieRegistro =>
    ({ serie: n, completada: true, inicioMs: ini, finMs: ini + seg * 1000 });

  it("una ronda al 24 % del trabajo previsto NO cuenta", () => {
    const corta = ronda(1, T0, 300 * 0.24);
    expect(rondasValidas([corta], 300)).toHaveLength(0);
  });

  it("al 26 % sí", () => {
    const justa = ronda(1, T0, 300 * 0.26);
    expect(rondasValidas([justa], 300)).toHaveLength(1);
    expect(FRACCION_RONDA_MINIMA).toBe(0.25);
  });

  it("sin trabajoSeg declarado no se descarta nada: no hay con qué juzgar", () => {
    expect(rondasValidas([ronda(1, T0, 2)], 0)).toHaveLength(1);
  });

  it("una ronda sin ventana se conserva: tampoco hay con qué juzgarla", () => {
    expect(rondasValidas([{ serie: 1, completada: true }], 300)).toHaveLength(1);
  });

  it("las no completadas nunca cuentan", () => {
    expect(rondasValidas([{ ...ronda(1, T0, 300), completada: false }], 300)).toHaveLength(0);
  });
});

describe("P79b · el caso Creed", () => {
  // 8 registros para una rutina de 5 rondas de 240 s con 90 s de descanso:
  // cinco rondas de verdad y tres de 1 a 2 segundos (dobles toques).
  const TRABAJO = 240, DESCANSO = 90;

  function creed(): SerieRegistro[] {
    const series: SerieRegistro[] = [];
    let t = T0;
    // Tres rondas reales, separadas por el descanso previsto.
    for (let i = 0; i < 3; i++) {
      series.push({ serie: i + 1, completada: true, inicioMs: t, finMs: t + TRABAJO * 1000 });
      t += (TRABAJO + DESCANSO) * 1000;
    }
    // Tres dobles toques de 1 a 2 s, pegados.
    for (let i = 0; i < 3; i++) {
      series.push({ serie: 4 + i, completada: true, inicioMs: t, finMs: t + (i === 1 ? 2000 : 1000) });
      t += 1500;
    }
    // Dos rondas reales más.
    for (let i = 0; i < 2; i++) {
      series.push({ serie: 7 + i, completada: true, inicioMs: t, finMs: t + TRABAJO * 1000 });
      t += (TRABAJO + DESCANSO) * 1000;
    }
    return series;
  }

  const usada = { rondas: 5, trabajoSeg: TRABAJO, descansoSeg: DESCANSO };

  it("de 8 registros quedan 5 rondas válidas: la sesión está completa", () => {
    const m = medirSesionVR(creed(), usada);
    expect(m.validas).toBe(5);
    expect(m.descartadas).toBe(3);
    expect(m.durDescartadasSeg).toEqual([1, 2, 1]);
  });

  it("el descanso se mide entre válidas y NO da 1 s", () => {
    const m = medirSesionVR(creed(), usada);
    expect(m.descansoSeg).not.toBe(1);
    expect(m.descansoSeg).toBeGreaterThan(DESCANSO * 0.5);
  });

  it("y por eso ya no sugiere recortar el descanso por basura", () => {
    const s = sesion({ fecha: "2026-09-18", fcs: [] });
    s.bloques[0].series = creed();
    s.bloques[0].prescripcionUsada = usada;
    const rutina = rutinaVR({ rondas: 5, trabajoSeg: TRABAJO, descansoSeg: DESCANSO });
    const r = sugerirProgresionVR({ ultima: s, anteriores: [], rutina, perfil: PERFIL })!;
    expect(r.motivo).not.toContain("a los 1 s");
  });
});

describe("P79b · el caso Body Combat", () => {
  // 3 rondas de 600 s con 60 s de descanso, pero entre la 1 y la 2 hay 29 min.
  const TRABAJO = 600, DESCANSO = 60;
  const usada = { rondas: 3, trabajoSeg: TRABAJO, descansoSeg: DESCANSO };

  function bodyCombat(): SerieRegistro[] {
    const s1 = { serie: 1, completada: true, inicioMs: T0, finMs: T0 + TRABAJO * 1000 };
    const ini2 = s1.finMs + 29 * 60 * 1000;            // la pausa
    const s2 = { serie: 2, completada: true, inicioMs: ini2, finMs: ini2 + TRABAJO * 1000 };
    const ini3 = s2.finMs + DESCANSO * 1000;           // un descanso normal
    const s3 = { serie: 3, completada: true, inicioMs: ini3, finMs: ini3 + TRABAJO * 1000 };
    return [s1, s2, s3];
  }

  it("la pausa de 29 min no se cuenta como descanso", () => {
    const m = medirSesionVR(bodyCombat(), usada);
    expect(m.validas).toBe(3);
    expect(m.pausas).toBe(1);
    expect(Math.round(m.pausaMayorSeg! / 60)).toBe(29);
    expect(m.descansosValidos).toBe(1);
    expect(m.descansoSeg).toBe(DESCANSO);
  });

  it("con un solo descanso válido y sin FC, la palanca es null y lo dice", () => {
    const s = sesion({ fecha: "2026-09-16", fcs: [] });
    s.bloques[0].series = bodyCombat();
    s.bloques[0].prescripcionUsada = usada;
    const rutina = rutinaVR({ rondas: 3, trabajoSeg: TRABAJO, descansoSeg: DESCANSO, zonaObjetivo: "Z3" });
    const r = sugerirProgresionVR({ ultima: s, anteriores: [], rutina, perfil: PERFIL })!;
    expect(r.palanca).toBeNull();
    expect(r.fuente).toBe("sin-medicion");
    expect(r.motivo).toBe("no hay suficientes descansos medibles");
  });
});

describe("P79b · el corte de la pausa", () => {
  const usada = { rondas: 4, trabajoSeg: 300, descansoSeg: 60 };

  /** Cuatro rondas con `gapSeg` entre todas. */
  function conGap(gapSeg: number): SerieRegistro[] {
    const series: SerieRegistro[] = [];
    let t = T0;
    for (let i = 0; i < 4; i++) {
      series.push({ serie: i + 1, completada: true, inicioMs: t, finMs: t + 300_000 });
      t += 300_000 + gapSeg * 1000;
    }
    return series;
  }

  it("un intervalo a 2,9 veces el descanso cuenta como descanso", () => {
    const m = medirSesionVR(conGap(60 * 2.9), usada);
    expect(m.pausas).toBe(0);
    expect(m.descansosValidos).toBe(3);
  });

  it("a 3,1 veces es pausa", () => {
    const m = medirSesionVR(conGap(60 * 3.1), usada);
    expect(m.pausas).toBe(3);
    expect(m.descansosValidos).toBe(0);
    expect(FACTOR_PAUSA).toBe(3);
  });
});


// ════════════════════════════════════════════════════════════════════════════
//  `bajar` exige una medición limpia
//
//  Una sesión con rondas descartadas no se sabe si quedó incompleta de verdad
//  o si el registro se perdió una ronda que sí se hizo. `mantener` no necesita
//  esa garantía porque no castiga; `bajar` sí.
// ════════════════════════════════════════════════════════════════════════════

describe("regla 1 · bajar exige dato limpio", () => {
  const TRABAJO = 600, DESCANSO = 60;
  const usada = { rondas: 3, trabajoSeg: TRABAJO, descansoSeg: DESCANSO };
  // Lo que `conObjetivo` arma adentro: las sesiones viejas no guardaron el
  // objetivo de tiempo, y lo heredan de la rutina.
  const usadaConObjetivo = { ...usada, duracionObjetivoMin: 30 };
  const rutinaBC = rutinaVR({ rondas: 3, trabajoSeg: TRABAJO, descansoSeg: DESCANSO, zonaObjetivo: "Z3" });

  /** Una sesión de Body Combat con las series dadas, en ms absolutos. */
  function bc(fecha: string, series: Array<{ ini?: number; fin: number }>): Historial {
    const h = sesion({ fecha, fcs: [] });
    h.bloques[0].series = series.map((x, i) => ({
      serie: i + 1, completada: true,
      ...(x.ini != null ? { inicioMs: x.ini } : {}),
      finMs: x.fin,
    }));
    h.bloques[0].prescripcionUsada = usada;
    return h;
  }

  // Los timestamps son los reales de /historial, leídos el 21/09.
  const REAL_14 = bc("2026-09-14", [
    { fin: 1789419533331 },                              // sin inicioMs: se conserva
    { ini: 1789419534872, fin: 1789419536019 },          // 1,1 s → descartada
    { ini: 1789419537209, fin: 1789420075994 },          // 538,8 s
  ]);
  const REAL_16 = bc("2026-09-16", [
    { ini: 1789599348866, fin: 1789599891473 },          // 542,6 s
    { ini: 1789601624864, fin: 1789603014004 },          // 1389,1 s
    { ini: 1789603015175, fin: 1789603017368 },          // 2,2 s → descartada
  ]);

  it("las dos sesiones reales de Body Combat están sucias", () => {
    expect(medirSesionVR(REAL_16.bloques[0].series, usadaConObjetivo))
      .toMatchObject({ validas: 2, descartadas: 1 });
    expect(medirSesionVR(REAL_14.bloques[0].series, usadaConObjetivo))
      .toMatchObject({ validas: 2, descartadas: 1 });
  });

  // P80 disuelve el caso que P79c había tenido que resolver con una regla: la
  // sesión del 16/09 **estaba completa**, 32 minutos de los 30 previstos. Lo
  // que faltaba eran las rondas registradas, no el entrenamiento.
  it("con los datos reales, la sesión del 16/09 está completa por tiempo", () => {
    const m = medirSesionVR(REAL_16.bloques[0].series, usadaConObjetivo);
    expect(Math.round(m.minutosReales!)).toBe(32);
    expect(m.completa).toBe(true);
  });

  it("completa y sin nada medido, Body Combat no inventa una palanca", () => {
    const r = sugerirProgresionVR({
      ultima: REAL_16, anteriores: [REAL_14], rutina: rutinaBC, perfil: PERFIL,
    })!;
    expect(r.palanca).toBeNull();
  });

  /** Sesión incompleta y LIMPIA: rondas de duración plena, sin descartes. */
  function incompletaLimpia(fecha: string, validas: number): Historial {
    const h = sesion({ fecha, fcs: [] });
    let t = T0;
    h.bloques[0].series = Array.from({ length: validas }, (_v, i) => {
      const ini = t;
      t += (TRABAJO + DESCANSO) * 1000;
      return { serie: i + 1, completada: true, inicioMs: ini, finMs: ini + TRABAJO * 1000 };
    });
    h.bloques[0].prescripcionUsada = usada;
    return h;
  }

  it("dos incompletas LIMPIAS seguidas siguen dando bajar", () => {
    const previa = incompletaLimpia("2026-09-16", 2);
    const ultima = incompletaLimpia("2026-09-18", 2);
    expect(medirSesionVR(ultima.bloques[0].series, usada).descartadas).toBe(0);
    const r = sugerirProgresionVR({ ultima, anteriores: [previa], rutina: rutinaBC, perfil: PERFIL })!;
    expect(r.palanca).toBe("bajar");
  });

  it("una limpia más una sucia da mantener", () => {
    // La última limpia, la anterior sucia: la anterior no cuenta como medición.
    const r1 = sugerirProgresionVR({
      ultima: incompletaLimpia("2026-09-18", 2), anteriores: [REAL_14],
      rutina: rutinaBC, perfil: PERFIL,
    })!;
    expect(r1.palanca).toBe("mantener");

    // Y al revés: la última sucia no habilita el bajar aunque la anterior esté limpia.
    const r2 = sugerirProgresionVR({
      ultima: REAL_14, anteriores: [incompletaLimpia("2026-09-12", 2)],
      rutina: rutinaBC, perfil: PERFIL,
    })!;
    expect(r2.palanca).toBe("mantener");
  });

  it("una sola sesión sucia e incompleta sigue dando mantener", () => {
    const r = sugerirProgresionVR({
      ultima: REAL_14, anteriores: [], rutina: rutinaBC, perfil: PERFIL,
    })!;
    expect(r.palanca).toBe("mantener");
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  P80 — en VR se mide el tiempo, no las rondas
//
//  Las cuatro rutinas daban `mantener` porque ninguna completaba sus rondas, y
//  la causa no era la regla: con el casco puesto no se ve el teléfono. Las
//  sesiones estaban completas; el registro no.
// ════════════════════════════════════════════════════════════════════════════

describe("P80 · completitud por tiempo", () => {
  const rutina30 = rutinaVR({ rondas: 3, trabajoSeg: 600, descansoSeg: 60 });
  const base30 = prescripcionDeRutina(rutina30.bloques[0].prescripcion as never);

  it("el objetivo de tiempo sale de la rutina: rondas × trabajo", () => {
    expect(base30.duracionObjetivoMin).toBe(30);
    expect(tiempoObjetivoMin(rutinaVR().bloques[0].prescripcion as never)).toBe(25);   // 5 × 300 s
  });

  /** Una sesión con una sola ronda registrada, que abarca toda la ventana. */
  function deCorrido(min: number): { series: SerieRegistro[]; ventana: { inicioMs: number; finMs: number } } {
    const finMs = T0 + min * 60_000;
    return {
      series: [{ serie: 1, completada: true, inicioMs: T0, finMs }],
      ventana: { inicioMs: T0, finMs },
    };
  }

  it("27 min sobre 30 completa; 26 no", () => {
    const a = deCorrido(27);
    expect(medirSesionVR(a.series, base30, a.ventana).completa).toBe(true);
    const b = deCorrido(26);
    expect(medirSesionVR(b.series, base30, b.ventana).completa).toBe(false);
  });

  it("una ronda registrada y 30 min de ventana está completa — el caso real", () => {
    const { series, ventana } = deCorrido(30);
    const m = medirSesionVR(series, base30, ventana);
    expect(m.validas).toBe(1);          // una sola ronda, contra las 3 pedidas
    expect(m.completa).toBe(true);      // y aun así, completa
    expect(m.minutosReales).toBe(30);
  });

  it("sin ventana cae a la suma de las rondas válidas, sin restar pausas dos veces", () => {
    // Dos rondas de 10 min con 29 min de pausa en el medio: la suma de las
    // rondas ya deja el hueco afuera. Restarlo otra vez daría −9 minutos.
    const series: SerieRegistro[] = [
      { serie: 1, completada: true, inicioMs: T0, finMs: T0 + 600_000 },
      { serie: 2, completada: true, inicioMs: T0 + 2_340_000, finMs: T0 + 2_940_000 },
    ];
    expect(medirSesionVR(series, base30).minutosReales).toBe(20);
  });
});

describe("P80 · el modo se deriva, no se elige", () => {
  const base = prescripcionDeRutina(rutinaVR({ rondas: 5, trabajoSeg: 300, descansoSeg: 60 })
    .bloques[0].prescripcion as never);

  /** `n` rondas seguidas con 60 s de hueco: `n − 1` descansos. */
  function conDescansos(n: number): SerieRegistro[] {
    return Array.from({ length: n }, (_v, i) => {
      const ini = T0 + i * (300 + 60) * 1000;
      return { serie: i + 1, completada: true, inicioMs: ini, finMs: ini + 300_000 };
    });
  }

  it("2 descansos válidos → rondas; 1 → tiempo", () => {
    expect(medirSesionVR(conDescansos(3), base).modo).toBe("rondas");
    expect(medirSesionVR(conDescansos(2), base).modo).toBe("tiempo");
  });

  it("la forma que se ofrece primero sale de la última sesión", () => {
    const rutina = rutinaVR();
    // Sin historia: de corrido, que es como se juega de verdad.
    expect(modoOfrecidoVR([], rutina)).toBe("tiempo");

    // Con el modo guardado, manda lo que se eligió.
    const porTiempo = sesion({ fecha: "2026-09-18", fcs: [null] });
    porTiempo.bloques[0].prescripcionUsada = {
      rondas: 5, trabajoSeg: 300, descansoSeg: 60, modo: "tiempo", duracionObjetivoMin: 25,
    };
    expect(modoOfrecidoVR([porTiempo], rutina)).toBe("tiempo");

    const porRondas = sesion({ fecha: "2026-09-18", fcs: [null] });
    porRondas.bloques[0].prescripcionUsada = {
      rondas: 5, trabajoSeg: 300, descansoSeg: 60, modo: "rondas", duracionObjetivoMin: 25,
    };
    expect(modoOfrecidoVR([porRondas], rutina)).toBe("rondas");

    // Sesión anterior a P80, sin modo guardado: se deriva de los descansos.
    const vieja = sesion({ fecha: "2026-09-16", fcs: [null, null, null] });
    expect(modoOfrecidoVR([vieja], rutina)).toBe("rondas");

    // Y la más reciente es la que decide, no la primera que aparezca.
    expect(modoOfrecidoVR([vieja, porTiempo], rutina)).toBe("tiempo");
  });
});

describe("P80 · las palancas en modo tiempo", () => {
  const rutina = rutinaVR({ rondas: 3, trabajoSeg: 600, descansoSeg: 60, zonaObjetivo: "Z4" });
  const base = prescripcionDeRutina(rutina.bloques[0].prescripcion as never);

  /** Sesión completa jugada de corrido: una ronda de `min` con `fc` de media. */
  function corrida(fecha: string, min: number, fc: number | null, over: Partial<Historial> = {}): Historial {
    const h = sesion({ fecha, fcs: [] });
    const finMs = T0 + min * 60_000;
    h.bloques[0].series = [{
      serie: 1, completada: true, inicioMs: T0, finMs,
      ...(fc != null ? { fcMedia: fc } : {}),
    }];
    h.bloques[0].prescripcionUsada = { ...base, modo: "tiempo" };
    h.inicioMs = T0;
    h.finMs = finMs;
    return { ...h, ...over };
  }

  it("por debajo del objetivo → subir dificultad", () => {
    // FC 125 es Z3, y el objetivo es Z4.
    const r = sugerirProgresionVR({ ultima: corrida("2026-09-18", 30, 125), anteriores: [], rutina, perfil: PERFIL })!;
    expect(r.palanca).toBe("subir-dificultad");
  });

  it("por debajo con dos subidas aceptadas → cambiar de juego", () => {
    const aceptada = { palanca: "subir-dificultad" as const, aceptada: true, fuente: "fc" as const };
    const r = sugerirProgresionVR({
      ultima: corrida("2026-09-18", 30, 125, { progresionVR: aceptada }),
      anteriores: [
        corrida("2026-09-16", 30, 125, { progresionVR: aceptada }),
        corrida("2026-09-14", 30, 125, { progresionVR: aceptada }),
      ],
      rutina, perfil: PERFIL,
    })!;
    expect(r.palanca).toBe("cambiar-juego");
  });

  it("en zona → sumar 5 min", () => {
    const r = sugerirProgresionVR({ ultima: corrida("2026-09-18", 30, 142), anteriores: [], rutina, perfil: PERFIL })!;
    expect(r.palanca).toBe("sumar-tiempo");
    expect(r.nuevaPrescripcion?.duracionObjetivoMin).toBe(35);
  });

  it("en el techo de tiempo → mantener", () => {
    const enElTecho = corrida("2026-09-18", 46, 142);
    enElTecho.bloques[0].prescripcionUsada = { ...base, modo: "tiempo", duracionObjetivoMin: 45 };
    const r = sugerirProgresionVR({ ultima: enElTecho, anteriores: [], rutina, perfil: PERFIL })!;
    expect(r.palanca).toBe("mantener");
  });

  it("dos zonas por encima deshace el último sumar-tiempo", () => {
    // Con objetivo Z2, una FC de 142 (Z4) está dos zonas arriba.
    const conObjetivoZ2 = rutinaVR({ rondas: 3, trabajoSeg: 600, descansoSeg: 60, zonaObjetivo: "Z2" });
    const estirada = corrida("2026-09-18", 36, 142);
    estirada.bloques[0].prescripcionUsada = { ...base, modo: "tiempo", duracionObjetivoMin: 35 };
    const r = sugerirProgresionVR({ ultima: estirada, anteriores: [], rutina: conObjetivoZ2, perfil: PERFIL })!;
    expect(r.palanca).toBe("bajar");
    expect(r.nuevaPrescripcion?.duracionObjetivoMin).toBe(30);   // vuelve al de la rutina
  });

  it("sin FC no inventa nada: palanca null", () => {
    const r = sugerirProgresionVR({ ultima: corrida("2026-09-18", 30, null), anteriores: [], rutina, perfil: PERFIL })!;
    expect(r.palanca).toBeNull();
  });

  it("de corrido, el descanso no decide: no hay descansos que medir", () => {
    const m = medirSesionVR(corrida("2026-09-18", 30, null).bloques[0].series, base);
    expect(m.modo).toBe("tiempo");
    expect(m.descansosValidos).toBeLessThan(2);
  });
});
