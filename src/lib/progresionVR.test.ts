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
  it("incompleta → mantener", () => {
    const s = sesion({ fecha: "2026-09-18", fcs: [150, 150, 150], completadas: 3 });
    const r = sugerir(s);   // la rutina pide 5
    expect(r.palanca).toBe("mantener");
    expect(r.motivo).toContain("3 de 5");
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
    expect(r.nuevaPrescripcion).toEqual({ rondas: 5, trabajoSeg: 300, descansoSeg: 60 });
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
    expect(r.prescripcion).toEqual({ rondas: 5, trabajoSeg: 300, descansoSeg: 60 });
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
    expect(r.prescripcion).toEqual({ rondas: 5, trabajoSeg: 300, descansoSeg: 60 });
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
