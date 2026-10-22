// P105 — los chequeos de calidad de los datos de salud. Casos inventados.
import { describe, it, expect } from "vitest";
import {
  chequearPresion, chequearMetricas, chequearSueno, chequearMediciones, fechaBuenosAires,
  type MetricaLeida,
} from "./chequeosSalud";
import type { MedicionCorporal, RegistroSueno } from "../../src/types/models";

const met = (tipo: string, fecha: string, valor: number, extra: Partial<MetricaLeida> = {}): MetricaLeida => ({
  idDoc: `juanpablo-${tipo}-${fecha}`, idMetrica: `juanpablo-${tipo}-${fecha}`, miembro: "juanpablo",
  tipo, fecha, valor, unidad: tipo.startsWith("presion") ? "mmHg" : "bpm",
  agregacion: tipo.startsWith("presion") ? "ultimo-del-dia" : "dia", fuente: "samsung-health-csv", ...extra,
} as MetricaLeida);

describe("chequearPresion", () => {
  const datos = [
    met("presion-sistolica", "2026-01-01", 120), met("presion-diastolica", "2026-01-01", 80),
    met("presion-sistolica", "2026-01-05", 70),  met("presion-diastolica", "2026-01-05", 75),   // invertida
    met("presion-sistolica", "2026-01-08", 300), met("presion-diastolica", "2026-01-08", 90),   // fuera de rango
    met("presion-sistolica", "2026-01-10", 118),                                                 // sin diastólica
  ];
  const r = chequearPresion(datos, "2026-01-20");

  it("cuenta pares, medios pares, invertidas y fuera de rango", () => {
    expect(r).toMatchObject({ diasSistolica: 4, diasDiastolica: 3, diasConPar: 3, soloSistolica: ["2026-01-10"], soloDiastolica: [] });
    expect(r.invertidas).toEqual([{ fecha: "2026-01-05", sistolica: 70, diastolica: 75 }]);
    expect(r.fueraDeRango.map((x) => x.fecha)).toEqual(["2026-01-08"]);
  });

  it("Resumen y Progreso pueden mostrar días distintos: el par contra la sistólica suelta", () => {
    expect(r.ultimoParResumen).toEqual({ fecha: "2026-01-08", sistolica: 300, diastolica: 90 });
    expect(r.ultimaSistolicaProgreso).toEqual({ fecha: "2026-01-10", valor: 118 });
  });

  it("la antigüedad del último dato, en días", () => {
    expect(r.ultimaFecha).toBe("2026-01-10");
    expect(r.diasDesdeUltima).toBe(10);
  });

  it("sin datos, todo vacío", () => {
    expect(chequearPresion([], "2026-01-20")).toMatchObject({ diasConPar: 0, ultimaFecha: null, diasDesdeUltima: null, ultimoParResumen: null });
  });
});

describe("chequearMetricas", () => {
  it("rango, unidad, duplicados del día e ids fuera del esquema", () => {
    const [fc] = chequearMetricas([
      met("fc-reposo", "2026-02-01", 55),
      met("fc-reposo", "2026-02-02", 140),
      met("fc-reposo", "2026-02-02", 60, { idDoc: "otro-id" }),
      met("fc-reposo", "2026-02-03", 58, { unidad: "lpm" }),
    ]);
    expect(fc).toMatchObject({ tipo: "fc-reposo", total: 4, primera: "2026-02-01", ultima: "2026-02-03", unidadInesperada: 1 });
    expect(fc.fueraDeRango).toEqual([{ fecha: "2026-02-02", valor: 140 }]);
    expect(fc.diasDuplicados).toEqual(["2026-02-02"]);
    expect(fc.idsFueraDeEsquema).toEqual(["otro-id"]);
  });
});

describe("chequearSueno", () => {
  const ms = (iso: string) => Date.parse(iso);
  it("la fecha es la del inicio en Buenos Aires; horas imposibles; inicios repetidos", () => {
    const r = chequearSueno([
      // 23:30 local del 10/03 → 07:00 del 11/03: fecha correcta, la del inicio.
      { idSueno: "a", miembro: "juanpablo", fecha: "2026-03-10", inicioMs: ms("2026-03-11T02:30:00Z"), finMs: ms("2026-03-11T10:00:00Z"), fuente: "samsung-health-csv" },
      // Empieza a las 23:00 local del 11/03 (02:00 UTC del 12) pero quedó en el 12: la fecha UTC.
      { idSueno: "b", miembro: "juanpablo", fecha: "2026-03-12", inicioMs: ms("2026-03-12T02:00:00Z"), finMs: ms("2026-03-12T09:00:00Z"), fuente: "samsung-health-csv" },
      { idSueno: "c", miembro: "juanpablo", fecha: "2026-03-11", inicioMs: ms("2026-03-12T02:00:00Z"), finMs: ms("2026-03-13T09:00:00Z"), fuente: "samsung-health-csv" },
      { idSueno: "d", miembro: "juanpablo", fecha: "2026-03-14", horas: 7, fuente: "manual" },
    ] as RegistroSueno[]);
    expect(r.fechaNoEsElInicio).toEqual([{ fecha: "2026-03-12", inicio: "2026-03-11" }]);
    expect(r.horasFueraDeRango.map((x) => x.fecha)).toEqual(["2026-03-11"]);
    expect(r.iniciosRepetidos).toEqual(["2026-03-11", "2026-03-12"]);
    expect(r.tramosIdenticos).toEqual([]);   // mismo inicio, distinto fin
    expect(r.sinEpoch).toBe(1);
    expect(r.fuentes).toEqual({ "samsung-health-csv": 3, manual: 1 });
  });

  it("fechaBuenosAires: las 22:00 locales siguen siendo ese día", () => {
    expect(fechaBuenosAires(Date.parse("2026-03-14T01:00:00Z"))).toBe("2026-03-13");
  });
});

describe("chequearMediciones", () => {
  it("rangos por campo, días repetidos por fuente y días con varias fuentes", () => {
    const r = chequearMediciones([
      { idMedicion: "MED-1", miembro: "juanpablo", fecha: "2026-04-01", pesoKg: 80, grasaPct: 20, fuente: "samsung-health-csv" },
      { idMedicion: "MED-2", miembro: "juanpablo", fecha: "2026-04-01", pesoKg: 80.2, fuente: "samsung-health-csv" },
      { idMedicion: "MED-3", miembro: "juanpablo", fecha: "2026-04-02", pesoKg: 8, fuente: "manual" },
      { idMedicion: "MED-4", miembro: "juanpablo", fecha: "2026-04-02", pesoKg: 81, fuente: "samsung-health-csv" },
    ] as MedicionCorporal[]);
    expect(r.fueraDeRango).toEqual([{ fecha: "2026-04-02", campo: "pesoKg", valor: 8 }]);
    expect(r.diasRepetidos).toEqual(["2026-04-01"]);
    expect(r.diasDuplicadoExacto).toEqual([]);
    const dup = chequearMediciones([
      { idMedicion: "MED-1", miembro: "juanpablo", fecha: "2026-04-03", pesoKg: 80, fuente: "samsung-health-csv" },
      { idMedicion: "MED-2", miembro: "juanpablo", fecha: "2026-04-03", pesoKg: 80, fuente: "samsung-health-csv" },
    ] as MedicionCorporal[]);
    expect(dup.diasDuplicadoExacto).toEqual(["2026-04-03"]);
    expect(r.diasConVariasFuentes).toEqual(["2026-04-02"]);
  });
});
