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

import { rachaDelPlan, diasActivos } from "./racha";
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
import { construirEntradaExterna } from "./entradaExterna";
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
  it("rachaDelPlan no cambia con externas", () => {
    expect(rachaDelPlan(HISTORIAL_MIXTO, SEMANA)).toBe(rachaDelPlan(SOLO_SHAPEUP, SEMANA));
  });

  it("rachaDelPlan no se sostiene sola con una semana de puras externas", () => {
    // Semana siguiente a la fixture, con una única caminata: la racha del plan
    // arranca en 0 ahí, aunque haya "actividad".
    const soloCaminata: Historial[] = [{ ...caminataMismoDia, semanaInicio: "2026-09-14" }];
    expect(rachaDelPlan(soloCaminata, "2026-09-14")).toBe(0);
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
  it("un día con solo una caminata queda marcado como hecho", () => {
    const chips = calcularWeekChips(HISTORIAL_MIXTO, SEMANA, HOY);
    const martes = chips.find((c) => c.fecha === "2026-09-08");
    expect(martes?.estado).toBe("done");
    // Y sin las externas, ese mismo día queda pendiente: la diferencia es real.
    const sinExternas = calcularWeekChips(SOLO_SHAPEUP, SEMANA, HOY);
    expect(sinExternas.find((c) => c.fecha === "2026-09-08")?.estado).toBe("pending");
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  Robustez: nada explota, y una sesión sin `tipo` cuenta como ShapeUp
// ════════════════════════════════════════════════════════════════════════════

describe("robustez ante entradas externas", () => {
  it("ninguna función tira excepción con un historial de puras externas", () => {
    const prog = programa([{ orden: 1, tipo: "rutina", idRutina: ID_RUTINA, diaSemana: "lunes" }]);
    expect(() => {
      rachaDelPlan(EXTERNAS, SEMANA);
      diasActivos(EXTERNAS, "2026-09-01", "2026-09-30");
      calcularWeekChips(EXTERNAS, SEMANA, HOY);
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
    expect(rachaDelPlan(SOLO_SHAPEUP, "2026-08-31")).toBe(1);
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  P75: las entradas externas REALES (las que construye el import) tampoco
//  mueven la aguja. La fixture de P74 las simula; esto usa el constructor de
//  verdad, que es lo que va a escribir el import de acá en más.
// ════════════════════════════════════════════════════════════════════════════

describe("aislamiento · entradas externas construidas por el import (P75)", () => {
  /** Tres actividades reales, una el mismo día que la rutina del lunes. */
  const nuevas: Historial[] = [
    { fecha: "2026-09-07", actividad: "Caminata", uuid: "u-1", dur: 35, inicio: Date.UTC(2026, 8, 7, 19, 0) },
    { fecha: "2026-09-08", actividad: "Ciclismo", uuid: "u-2", dur: 50, inicio: Date.UTC(2026, 8, 8, 18, 0) },
    { fecha: "2026-09-12", actividad: "Caminata", uuid: "u-3", dur: 25, inicio: Date.UTC(2026, 8, 12, 9, 0) },
  ].map((a) => construirEntradaExterna({
    fecha: a.fecha, actividad: a.actividad, esVR: false, fuente: "samsung-health-csv",
    duracionMin: a.dur, kcal: 200, fcPromedio: 115, _uuid: a.uuid,
    _startMs: a.inicio, _endMs: a.inicio + a.dur * 60_000,
  }, MIEMBRO));

  const conNuevas = [...SOLO_SHAPEUP, ...nuevas];

  it("la racha del plan no cambia", () => {
    expect(rachaDelPlan(conNuevas, SEMANA)).toBe(rachaDelPlan(SOLO_SHAPEUP, SEMANA));
  });

  it("la adherencia de la semana no cambia", () => {
    // Adherencia = sesiones ShapeUp de la semana, como la cuenta Home.
    const dela = (hs: Historial[]) => soloShapeUp(hs).filter((h) => h.semanaInicio === SEMANA).length;
    expect(dela(conNuevas)).toBe(dela(SOLO_SHAPEUP));
  });

  it("el tonelaje no cambia", () => {
    const suma = (hs: Historial[]) => hs.reduce((acc, h) => acc + tonelajeKg(h), 0);
    expect(suma(conNuevas)).toBe(suma(SOLO_SHAPEUP));
  });

  it("la progresión no cambia", () => {
    expect(sesionesDelEjercicio(ID_EJERCICIO, conNuevas))
      .toEqual(sesionesDelEjercicio(ID_EJERCICIO, SOLO_SHAPEUP));
  });

  it("el costo cardíaco de la rutina no cambia", () => {
    expect(serieCostoRutina(ID_RUTINA, conNuevas)).toEqual(serieCostoRutina(ID_RUTINA, SOLO_SHAPEUP));
  });

  it("semanasSinDescarga no cambia", () => {
    expect(semanasSinDescarga(conNuevas, HOY)).toBe(semanasSinDescarga(SOLO_SHAPEUP, HOY));
  });

  it("pero los días activos SÍ suben: te moviste", () => {
    // El 7/9 ya estaba entrenado, así que suma 8/9 y 12/9: dos días nuevos.
    expect(diasActivos(conNuevas, "2026-09-07", "2026-09-13"))
      .toBe(diasActivos(SOLO_SHAPEUP, "2026-09-07", "2026-09-13") + 2);
  });

  it("reimportar las mismas actividades no duplica nada: mismo idHist", () => {
    const otraVez = nuevas.map((h) => construirEntradaExterna({
      fecha: h.fechaRealizada, actividad: h.externa!.actividad, esVR: false,
      fuente: "samsung-health-csv", duracionMin: h.duracionRealMin ?? 0,
      _uuid: h.externa!.datauuid,
    }, MIEMBRO));
    expect(otraVez.map((h) => h.idHist)).toEqual(nuevas.map((h) => h.idHist));
    expect(new Set([...nuevas, ...otraVez].map((h) => h.idHist)).size).toBe(nuevas.length);
  });
});
