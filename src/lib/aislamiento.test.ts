// ════════════════════════════════════════════════════════════════════════════
//  aislamiento.test.ts — las entradas externas no mueven ninguna métrica de
//  plan ni de progresión (P74).
//
//  La forma de casi todos estos tests es la misma: calcular con
//  `HISTORIAL_MIXTO` y con `SOLO_SHAPEUP`, y exigir resultados IDÉNTICOS. Si
//  mañana alguien saca un filtro, el test falla acá y no en producción.
//
//  Los que cuentan TODO (días activos, chips de la semana) tienen su propio
//  bloque al final, donde lo que se prueba es lo contrario: que SÍ cambien.
// ════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import type { Historial, Programa } from "../types/models";
import type { SenalSalud as SenalSaludResumen } from "./resumenSalud";
import type { CardioInput } from "../import/samsungHealth";

import { diasActivos } from "./racha";
import { seriesDeAdherencia, rachaActual, tasaCumplimiento, metaSemanal } from "./adherencia";
import { calcularWeekChips } from "./weekChips";
import { semanasSinDescarga, calcularRecomendacion } from "./recomendaciones";
import { sesionesDelEjercicio, sugerirProgresion } from "./progresion";
import { deltaEjercicio, esPR } from "./resumenSesion";
import { compararConPrevias, serieCostoRutina } from "./costoCardiaco";
import { tonelajeKg, totalSeriesHechas } from "./metricas";
import { sesionDeHoy } from "./sesionDeHoy";
import { proximaSesion } from "./proximaSesion";
import {
  clasificarImport, ACTIVIDADES_SIEMPRE_RELEVANTES, DURACION_MIN_ACTIVIDAD_MIN,
  type ConfigClasificacion,
} from "./importSelectivo";
import { calcularEnriquecimiento } from "./enriquecerImport";
import { agruparDiasActivos, type ActividadDia } from "./racha";
import { actividadRelevante, soloRelevantes, marcasDe } from "./actividadRelevante";
import { adaptarEjercicio } from "./adaptadorSdk";
import { CRUDO_CAMINATA } from "./__fixtures__/crudoSdk";
import { soloShapeUp } from "./tipoHistorial";

import {
  HISTORIAL_MIXTO, SOLO_SHAPEUP, EXTERNAS, ID_EJERCICIO, ID_RUTINA, SEMANA,
  rutinaLunes, rutinaMiercoles, caminataMismoDia,
} from "./__fixtures__/historialMixto";

const MIEMBRO = "juanpablo" as const;
/** Domingo de la semana de la fixture: todo lo de la fixture ya pasó. */
const HOY = "2026-09-13";

function programa(dias: Array<{ orden: number; tipo: "rutina" | "descanso"; idRutina?: string; diaSemana?: string }>): Programa {
  return {
    idPrograma: "PRG-TEST", nombre: "Test", nombreCanonico: "test", estado: "Activo",
    objetivo: "General / salud", nivel: "Principiante",
    diasPorSemana: dias.filter((d) => d.tipo !== "descanso").length, descripcion: "",
    dias: dias.map((d) => ({
      orden: d.orden, etiqueta: `Día ${d.orden}`, tipo: d.tipo,
      idRutina: d.idRutina, diaSemana: d.diaSemana, opcional: false,
    })),
    vecesUsado: 0,
  } as unknown as Programa;
}

function senal(clave: SenalSaludResumen["clave"], estado: SenalSaludResumen["estado"]): SenalSaludResumen {
  return { clave, estado, valorActual: 60, unidad: "bpm", serie14d: [] };
}

// ════════════════════════════════════════════════════════════════════════════
//  Solo ShapeUp — mixto y sin externas tienen que dar lo mismo
// ════════════════════════════════════════════════════════════════════════════

describe("aislamiento · métricas del plan", () => {
  it("la racha de adherencia no cambia con externas", () => {
    const con = seriesDeAdherencia(agruparDiasActivos(HISTORIAL_MIXTO), 2, HOY);
    const sin = seriesDeAdherencia(agruparDiasActivos(SOLO_SHAPEUP), 2, HOY);
    expect(con.map((s) => s.diasPlan)).toEqual(sin.map((s) => s.diasPlan));
    expect(rachaActual(con)).toBe(rachaActual(sin));
  });

  it("una semana de puras externas no sostiene la racha del plan", () => {
    // Una única caminata, sin ninguna sesión: no hay serie que medir, y por lo
    // tanto tampoco racha. "Actividad" no es "cumplí el plan".
    const soloCaminata: Historial[] = [{ ...caminataMismoDia, semanaInicio: "2026-09-14" }];
    const serie = seriesDeAdherencia(agruparDiasActivos(soloCaminata), 2, "2026-09-16");
    expect(serie).toEqual([]);
    expect(rachaActual(serie)).toBe(0);
  });

  it("semanasSinDescarga no cambia con externas", () => {
    expect(semanasSinDescarga(HISTORIAL_MIXTO, HOY))
      .toBe(semanasSinDescarga(SOLO_SHAPEUP, HOY));
  });

  it("calcularRecomendacion no cambia con externas", () => {
    const senales = [senal("sueno", "ok"), senal("fc-reposo", "ok"), senal("hrv", "ok")];
    expect(calcularRecomendacion(senales, HISTORIAL_MIXTO, HOY, MIEMBRO))
      .toEqual(calcularRecomendacion(senales, SOLO_SHAPEUP, HOY, MIEMBRO));
  });

  it("la felicitación no se dispara con puras externas", () => {
    // Todas las señales en verde + 3 caminatas en la semana: "venís entrenando"
    // no se cumple, porque ninguna es una sesión de la app.
    const senales = [senal("sueno", "ok"), senal("fc-reposo", "ok"), senal("hrv", "ok")];
    expect(calcularRecomendacion(senales, EXTERNAS, HOY, MIEMBRO)).toBeNull();
  });
});

describe("aislamiento · progresión y PR", () => {
  it("sesionesDelEjercicio no cambia con externas", () => {
    expect(sesionesDelEjercicio(ID_EJERCICIO, HISTORIAL_MIXTO))
      .toEqual(sesionesDelEjercicio(ID_EJERCICIO, SOLO_SHAPEUP));
  });

  it("sugerirProgresion no cambia con externas", () => {
    const presc = {
      modalidad: "Fuerza" as const, series: 3,
      repsObjetivo: { value: 8, min: 8, max: 10, raw: "8-10" }, descansoSeg: 90,
    };
    expect(sugerirProgresion(ID_EJERCICIO, HISTORIAL_MIXTO, presc))
      .toEqual(sugerirProgresion(ID_EJERCICIO, SOLO_SHAPEUP, presc));
  });

  it("deltaEjercicio no cambia con externas", () => {
    const bloque = rutinaMiercoles.bloques[0];
    const previo = (hs: Historial[]) => hs.filter((h) => h.idHist !== rutinaMiercoles.idHist);
    expect(deltaEjercicio(bloque, previo(HISTORIAL_MIXTO)))
      .toEqual(deltaEjercicio(bloque, previo(SOLO_SHAPEUP)));
  });

  it("esPR no cambia con externas", () => {
    const bloque = rutinaMiercoles.bloques[0];
    const previo = (hs: Historial[]) => hs.filter((h) => h.idHist !== rutinaMiercoles.idHist);
    expect(esPR(bloque, previo(HISTORIAL_MIXTO)))
      .toBe(esPR(bloque, previo(SOLO_SHAPEUP)));
  });
});

describe("aislamiento · costo cardíaco", () => {
  it("compararConPrevias no cambia con externas", () => {
    expect(compararConPrevias(rutinaMiercoles, HISTORIAL_MIXTO))
      .toEqual(compararConPrevias(rutinaMiercoles, SOLO_SHAPEUP));
  });

  it("serieCostoRutina no cambia con externas", () => {
    expect(serieCostoRutina(ID_RUTINA, HISTORIAL_MIXTO))
      .toEqual(serieCostoRutina(ID_RUTINA, SOLO_SHAPEUP));
  });

  it("una externa con FC alta no entra en la serie de la rutina", () => {
    const disfrazada = { ...caminataMismoDia, idRutina: ID_RUTINA } as Historial;
    expect(serieCostoRutina(ID_RUTINA, [...SOLO_SHAPEUP, disfrazada]))
      .toEqual(serieCostoRutina(ID_RUTINA, SOLO_SHAPEUP));
  });
});

describe("aislamiento · tonelaje y series de una sesión", () => {
  it("una externa suma 0 y no rompe por no tener bloques", () => {
    for (const ext of EXTERNAS) {
      expect(tonelajeKg(ext)).toBe(0);
      expect(totalSeriesHechas(ext)).toBe(0);
    }
  });

  it("el total del historial no cambia con externas", () => {
    const suma = (hs: Historial[]) => hs.reduce((acc, h) => acc + tonelajeKg(h), 0);
    expect(suma(HISTORIAL_MIXTO)).toBe(suma(SOLO_SHAPEUP));
    const series = (hs: Historial[]) => hs.reduce((acc, h) => acc + totalSeriesHechas(h), 0);
    expect(series(HISTORIAL_MIXTO)).toBe(series(SOLO_SHAPEUP));
  });

  it("una sesión ShapeUp sigue contando igual que siempre", () => {
    expect(tonelajeKg(rutinaLunes)).toBe(1200);
    expect(totalSeriesHechas(rutinaLunes)).toBe(3);
  });
});

describe("aislamiento · plan de la semana", () => {
  const prog = programa([
    { orden: 1, tipo: "rutina", idRutina: ID_RUTINA, diaSemana: "lunes" },
    { orden: 2, tipo: "rutina", idRutina: "RUT-0002", diaSemana: "miércoles" },
  ]);

  it("sesionDeHoy no cambia con externas", () => {
    expect(sesionDeHoy(prog, 0, HISTORIAL_MIXTO)).toEqual(sesionDeHoy(prog, 0, SOLO_SHAPEUP));
  });

  it("una externa no marca como hecha la rutina del día", () => {
    const r = sesionDeHoy(prog, 2, EXTERNAS);   // miércoles (0=lunes), solo caminatas
    expect(r).toEqual({ tipo: "rutina", idRutina: "RUT-0002", etiqueta: "Día 2", yaHecha: false });
  });

  it("proximaSesion no cambia con externas", () => {
    expect(proximaSesion(prog, HISTORIAL_MIXTO)).toEqual(proximaSesion(prog, SOLO_SHAPEUP));
  });

  it("una externa no cubre un día del programa", () => {
    expect(proximaSesion(prog, EXTERNAS)?.dia.idRutina).toBe(ID_RUTINA);
  });
});

describe("aislamiento · import de salud", () => {
  const CONFIG: ConfigClasificacion = {
    duracionMinimaMin: DURACION_MIN_ACTIVIDAD_MIN,
    actividadesSiempreRelevantes: ACTIVIDADES_SIEMPRE_RELEVANTES,
  };
  const AHORA = Date.UTC(2026, 8, 13, 12, 0);
  const cardio: CardioInput & { _startMs?: number; _endMs?: number } = {
    miembro: MIEMBRO, fecha: "2026-09-08", actividad: "Ciclismo", esVR: false,
    fuente: "samsung-health-csv", duracionMin: 35,
    _startMs: Date.UTC(2026, 8, 8, 12, 5), _endMs: Date.UTC(2026, 8, 8, 12, 40),
  };

  it("clasificarImport no cambia con externas en el historial", () => {
    expect(clasificarImport([cardio], HISTORIAL_MIXTO, [], CONFIG, AHORA))
      .toEqual(clasificarImport([cardio], SOLO_SHAPEUP, [], CONFIG, AHORA));
  });

  it("un cardio que solo solapa con una externa no enriquece: entra como externa", () => {
    // La caminata del martes cubre esa misma ventana. Si contara como historial,
    // el dato se enriquecería a sí mismo en cada import (P74 + P75).
    const [r] = clasificarImport([cardio], EXTERNAS, [], CONFIG, AHORA);
    expect(r.destino).toBe("externa");
    expect(r.motivo).toBe("duracion");
    expect(r.idHist).toBeUndefined();
  });

  it("calcularEnriquecimiento no cambia con externas", () => {
    const extraccion = {
      sesionesSamsung: [{
        datauuid: "uuid-nuevo",
        startMs: Date.UTC(2026, 8, 9, 12, 2), endMs: Date.UTC(2026, 8, 9, 12, 56),
        fcMedia: 128, kcal: 320, fecha: "2026-09-09",
      }],
      liveData: {},
      shapeUpCustomId: undefined,
    };
    const mixto  = calcularEnriquecimiento(HISTORIAL_MIXTO, extraccion);
    const propio = calcularEnriquecimiento(SOLO_SHAPEUP, extraccion);
    expect(mixto.updates).toEqual(propio.updates);
    expect(mixto.matcheadas).toBe(propio.matcheadas);
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  Cuentan TODO — acá lo que se prueba es que las externas SÍ sumen
// ════════════════════════════════════════════════════════════════════════════

describe("diasActivos cuenta todo", () => {
  const DESDE = "2026-09-07";
  const HASTA = "2026-09-13";

  it("sí cambia al sacar las externas", () => {
    expect(diasActivos(HISTORIAL_MIXTO, DESDE, HASTA))
      .toBeGreaterThan(diasActivos(SOLO_SHAPEUP, DESDE, HASTA));
  });

  it("cuenta días distintos, no sesiones: el día compartido cuenta una sola vez", () => {
    // Lunes (rutina + caminata), martes, miércoles, jueves, viernes = 5 días,
    // con 6 sesiones adentro de la ventana.
    expect(diasActivos(HISTORIAL_MIXTO, DESDE, HASTA)).toBe(5);
    expect(HISTORIAL_MIXTO.filter((h) => h.fechaRealizada >= DESDE && h.fechaRealizada <= HASTA))
      .toHaveLength(6);
  });

  it("sin externas quedan los 3 días entrenados en la app de esa semana", () => {
    expect(diasActivos(SOLO_SHAPEUP, DESDE, HASTA)).toBe(3);
  });

  it("respeta los bordes del rango, inclusive", () => {
    expect(diasActivos(HISTORIAL_MIXTO, "2026-09-08", "2026-09-08")).toBe(1);
    expect(diasActivos(HISTORIAL_MIXTO, "2026-09-12", "2026-09-13")).toBe(0);
  });
});

describe("calcularWeekChips cuenta todo", () => {
  it("un día con solo una caminata larga queda como movimiento, no como entrenamiento", () => {
    const chips = calcularWeekChips(agruparDiasActivos(HISTORIAL_MIXTO), SEMANA, HOY);
    const martes = chips.find((c) => c.fecha === "2026-09-08");
    // "movimiento" y no "done": te moviste, pero no entrenaste en la app.
    expect(martes?.estado).toBe("movimiento");
    // Y sin las externas, ese mismo día queda pendiente: la diferencia es real.
    const sinExternas = calcularWeekChips(agruparDiasActivos(SOLO_SHAPEUP), SEMANA, HOY);
    expect(sinExternas.find((c) => c.fecha === "2026-09-08")?.estado).toBe("pending");
  });

  it("un día con sesión de la app sigue siendo 'done'", () => {
    const chips = calcularWeekChips(agruparDiasActivos(HISTORIAL_MIXTO), SEMANA, HOY);
    expect(chips.find((c) => c.fecha === "2026-09-07")?.estado).toBe("done");
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  Robustez: nada explota, y una sesión sin `tipo` cuenta como ShapeUp
// ════════════════════════════════════════════════════════════════════════════

describe("robustez ante entradas externas", () => {
  it("ninguna función tira excepción con un historial de puras externas", () => {
    const prog = programa([{ orden: 1, tipo: "rutina", idRutina: ID_RUTINA, diaSemana: "lunes" }]);
    expect(() => {
      diasActivos(EXTERNAS, "2026-09-01", "2026-09-30");
      calcularWeekChips(agruparDiasActivos(EXTERNAS), SEMANA, HOY);
      seriesDeAdherencia(agruparDiasActivos(EXTERNAS), 3, HOY);
      semanasSinDescarga(EXTERNAS, HOY);
      calcularRecomendacion([senal("sueno", "ok")], EXTERNAS, HOY, MIEMBRO);
      sesionesDelEjercicio(ID_EJERCICIO, EXTERNAS);
      serieCostoRutina(ID_RUTINA, EXTERNAS);
      compararConPrevias(rutinaLunes, EXTERNAS);
      sesionDeHoy(prog, 0, EXTERNAS);
      proximaSesion(prog, EXTERNAS);
      clasificarImport([], EXTERNAS, [], {
        duracionMinimaMin: DURACION_MIN_ACTIVIDAD_MIN,
        actividadesSiempreRelevantes: ACTIVIDADES_SIEMPRE_RELEVANTES,
      }, Date.UTC(2026, 8, 13));
      calcularEnriquecimiento(EXTERNAS, { sesionesSamsung: [], liveData: {}, shapeUpCustomId: undefined });
      EXTERNAS.forEach((h) => { tonelajeKg(h); totalSeriesHechas(h); });
    }).not.toThrow();
  });

  it("una sesión sin `tipo` cuenta como ShapeUp en todas", () => {
    // La fixture incluye `viejaSinTipo`; si se leyera como externa, estas
    // métricas la perderían.
    expect(sesionesDelEjercicio(ID_EJERCICIO, SOLO_SHAPEUP).some((s) => s.fecha === "2026-08-31")).toBe(true);
    expect(serieCostoRutina(ID_RUTINA, SOLO_SHAPEUP).some((p) => p.fecha === "2026-08-31")).toBe(true);
    const serie = seriesDeAdherencia(agruparDiasActivos(SOLO_SHAPEUP), 1, "2026-09-02");
    expect(serie.some((s) => s.semanaInicio === "2026-08-31" && s.diasPlan > 0)).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  P76b: las actividades ya no se copian al historial. Viven en /cardio y el
//  historial las filtra al leer, así que el aislamiento es estructural. Lo que
//  queda por probar es el filtro y el día activo.
// ════════════════════════════════════════════════════════════════════════════

describe("aislamiento · actividades de /cardio (P76b)", () => {
  // Desde P76b las actividades NO se copian a /historial: viven en /cardio y el
  // historial las filtra al leer. El aislamiento pasa a ser estructural -- las
  // métricas del plan reciben `Historial[]` y una actividad no lo es —, pero
  // sigue habiendo algo que probar: que el día activo SÍ las cuente, y que el
  // filtro deje pasar lo que corresponde.
  const CONFIG = { duracionMinimaMin: 30 };

  /** Tres actividades reales, una el mismo día que la rutina del lunes. */
  const actividades: ActividadDia[] = [
    { fecha: "2026-09-07", duracionMin: 35, autodetectada: false, esVR: false, marcadaShapeUp: false },
    { fecha: "2026-09-08", duracionMin: 50, autodetectada: false, esVR: false, marcadaShapeUp: false },
    { fecha: "2026-09-12", duracionMin: 25, autodetectada: false, esVR: false, marcadaShapeUp: false },
  ];

  it("el filtro deja entrar las dos largas y no la de 25 min", () => {
    expect(soloRelevantes(actividades, CONFIG)).toHaveLength(2);
  });

  it("las métricas del plan no las ven: no están en /historial", () => {
    // El historial que reciben es el mismo con o sin actividades: una
    // SesionCardio no es un Historial y no hay camino que la convierta.
    expect(soloShapeUp(SOLO_SHAPEUP)).toEqual(SOLO_SHAPEUP);
    expect(sesionesDelEjercicio(ID_EJERCICIO, SOLO_SHAPEUP))
      .toEqual(sesionesDelEjercicio(ID_EJERCICIO, HISTORIAL_MIXTO));
  });

  it("pero los días activos SÍ suben: te moviste", () => {
    const sin = agruparDiasActivos(SOLO_SHAPEUP, []);
    const con = agruparDiasActivos(SOLO_SHAPEUP, actividades);
    // Las tres marcan su día, la de 25 min incluida: el filtro de duración
    // decide qué se muestra en el historial, no si te moviste. El 7/9 ya
    // estaba entrenado, así que suma el 8/9 y el 12/9.
    expect(con.filter((d) => d.externaDeclarada)).toHaveLength(3);
    expect(con.length).toBe(sin.length + 2);
  });
});

// ============================================================================
//  P75b/P76b a escala. El ZIP real da ~2562 actividades: si alguna métrica
//  del plan se moviera con ese volumen, el aislamiento no serviría de nada.
// ============================================================================

describe("aislamiento · 2000 actividades de /cardio (P76b)", () => {
  const CONFIG = { duracionMinimaMin: 30 };

  /** Dos mil caminatas repartidas en dos años, la mitad autodetectadas. */
  const muchas: ActividadDia[] = Array.from({ length: 2000 }, (_v, i) => {
    const dia = new Date(Date.UTC(2025, 0, 1) + i * 12 * 3_600_000);  // dos por día
    return {
      fecha: dia.toISOString().slice(0, 10),
      duracionMin: 40,
      esVR: false,
      marcadaShapeUp: false,
      autodetectada: i % 2 === 0,
    };
  });

  it("la fixture es del tamaño que se esperaba, y mitad autodetectada", () => {
    expect(muchas).toHaveLength(2000);
    expect(muchas.filter((a) => a.autodetectada)).toHaveLength(1000);
  });

  it("el filtro deja pasar las declaradas y frena las autodetectadas", () => {
    expect(soloRelevantes(muchas, CONFIG)).toHaveLength(1000);
  });

  it("ninguna métrica del plan cambia con 2000 actividades en juego", () => {
    const suma = (hs: Historial[]) => hs.reduce((acc, h) => acc + tonelajeKg(h), 0);
    expect(suma(SOLO_SHAPEUP)).toBe(suma(HISTORIAL_MIXTO));
    expect(serieCostoRutina(ID_RUTINA, SOLO_SHAPEUP)).toEqual(serieCostoRutina(ID_RUTINA, HISTORIAL_MIXTO));
    expect(semanasSinDescarga(SOLO_SHAPEUP, HOY)).toBe(semanasSinDescarga(HISTORIAL_MIXTO, HOY));
  });

  it("los días activos SÍ las cuentan, con su origen separado", () => {
    const dias = agruparDiasActivos(SOLO_SHAPEUP, muchas);
    // Dos actividades por día: 2000 caen en 1000 días, cada uno con una
    // declarada y una autodetectada.
    expect(dias.filter((d) => d.autodetectada && d.externaDeclarada)).toHaveLength(1000);
    expect(dias.filter((d) => d.shapeUp)).toHaveLength(
      new Set(SOLO_SHAPEUP.map((h) => h.fechaRealizada)).size,
    );
  });

  it("la meta, la racha y la tasa no se mueven con 2000 actividades (P77a)", () => {
    const META = 2;
    const sinCardio = seriesDeAdherencia(agruparDiasActivos(SOLO_SHAPEUP), META, HOY);
    const conCardio = seriesDeAdherencia(agruparDiasActivos(SOLO_SHAPEUP, muchas), META, HOY);

    // La meta sale del plan y del perfil: ninguna actividad la toca.
    expect(metaSemanal(null, { metaSemanalDias: META })).toBe(META);
    // Los días de plan por semana son los mismos.
    expect(conCardio.map((s) => s.diasPlan)).toEqual(sinCardio.map((s) => s.diasPlan));
    expect(conCardio.map((s) => s.cumplida)).toEqual(sinCardio.map((s) => s.cumplida));
    expect(rachaActual(conCardio)).toBe(rachaActual(sinCardio));
    expect(tasaCumplimiento(conCardio)).toEqual(tasaCumplimiento(sinCardio));
    // Y sin embargo el movimiento SÍ quedó informado, al lado, cuando se
    // cargó el rango; sin cargarlo queda en `null` y no en cero (P77b).
    const RANGO = { desde: "2025-01-01", hasta: "2030-01-01" };
    const conRango = seriesDeAdherencia(agruparDiasActivos(SOLO_SHAPEUP, muchas), META, HOY, RANGO);
    expect(conRango.some((s) => (s.diasMovimiento ?? 0) > 0)).toBe(true);
    expect(conCardio.every((s) => s.diasMovimiento === null)).toBe(true);
    expect(sinCardio.every((s) => s.diasMovimiento === null)).toBe(true);
  });

  it("la autodetectada se informa aunque no pase el filtro", () => {
    const soloAuto: ActividadDia[] = [
      { fecha: "2026-09-20", duracionMin: 90, autodetectada: true, esVR: false, marcadaShapeUp: false },
    ];
    expect(actividadRelevante(soloAuto[0], CONFIG)).toBe(false);
    expect(agruparDiasActivos([], soloAuto)).toEqual([
      { fecha: "2026-09-20", shapeUp: false, externaDeclarada: false, autodetectada: true, minutos: 90 },
    ]);
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  PU4: lo que entra por el puente tampoco mueve la aguja. Es la misma prueba
//  de siempre, pero sobre entradas construidas desde el crudo real del SDK.
// ════════════════════════════════════════════════════════════════════════════

describe("aislamiento · actividades que entran por el puente (PU4)", () => {
  const CONFIG = { duracionMinimaMin: 30 };

  /** Veinte caminatas adaptadas del crudo real del puente. */
  const delPuente = Array.from({ length: 20 }, (_v, i) => {
    const inicio = Date.UTC(2026, 7, 6, 18, 26) + i * 86_400_000;
    const crudo = {
      ...CRUDO_CAMINATA,
      uid: `puente-${i}`,
      startTime: { epochMs: inicio, iso: new Date(inicio).toISOString() },
      startLocalDateTime: new Date(inicio - 3 * 3_600_000).toISOString().slice(0, 19),
      fields: { sessions: [{ ...CRUDO_CAMINATA.fields.sessions[0] }] },
    };
    const item = adaptarEjercicio(crudo, MIEMBRO)!;
    return { ...item, ...marcasDe(item) };
  });

  it("quedan marcadas como autodetectadas, por el flag del SDK", () => {
    expect(delPuente.every((a) => a.autodetectada)).toBe(true);
  });

  it("y por eso el historial no las muestra, aunque traigan FC", () => {
    expect(delPuente.every((a) => a.fcPromedio != null)).toBe(true);
    expect(soloRelevantes(delPuente, CONFIG)).toHaveLength(0);
  });

  it("pero cuentan como día activo", () => {
    const dias = agruparDiasActivos([], delPuente);
    expect(dias.every((d) => d.autodetectada)).toBe(true);
    expect(dias).toHaveLength(20);
  });

  it("ninguna métrica del plan las ve: no entran a /historial", () => {
    expect(() => {
      SOLO_SHAPEUP.forEach((h) => { tonelajeKg(h); totalSeriesHechas(h); });
      semanasSinDescarga(SOLO_SHAPEUP, HOY);
      compararConPrevias(rutinaLunes, SOLO_SHAPEUP);
    }).not.toThrow();
    expect(serieCostoRutina(ID_RUTINA, SOLO_SHAPEUP)).toEqual(serieCostoRutina(ID_RUTINA, HISTORIAL_MIXTO));
  });
});
