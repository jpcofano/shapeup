// P109 — Salud → Resumen: el sueño de anoche y las tarjetas de «Tu cuerpo». Datos inventados.
import { describe, it, expect } from "vitest";
import { suenoParaResumen, tarjetasCuerpo, partesSueno, fechaEncabezado } from "./resumenCuerpo";
import { calcularResumenSalud } from "./resumenSalud";
import type { MedicionCorporal, MetricaSalud, RegistroSueno } from "../types/models";

const HOY = "2026-10-22";
const dia = (n: number) => {
  const d = new Date(2026, 9, 22 - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/** Una noche que termina a las 7:00 del día `n` (hace n días) y dura `h` horas. */
function noche(n: number, h: number): RegistroSueno {
  const [y, m, d] = dia(n).split("-").map(Number);
  const fin = new Date(y, m - 1, d, 7, 0).getTime();
  return { idSueno: `S${n}`, miembro: "juanpablo", fecha: dia(n), horas: h, inicioMs: fin - h * 3_600_000, finMs: fin, fuente: "manual" };
}
const med = (n: number, extra: Partial<MedicionCorporal>): MedicionCorporal =>
  ({ idMedicion: `M${n}`, miembro: "juanpablo", fecha: dia(n), fuente: "manual", ...extra });
const met = (tipo: MetricaSalud["tipo"], n: number, valor: number): MetricaSalud =>
  ({ idMetrica: `${tipo}-${n}`, miembro: "juanpablo", tipo, fecha: dia(n), valor, agregacion: "dia", fuente: "manual" });

describe("fechaEncabezado y partesSueno", () => {
  it("«Jueves 22 de octubre»", () => {
    expect(fechaEncabezado(new Date(2026, 9, 22, 10))).toBe("Jueves 22 de octubre");
  });
  it("6,9 h → «6 h 54» y «min»", () => {
    expect(partesSueno(6.9)).toEqual({ valor: "6 h 54", unidad: "min" });
  });
});

describe("suenoParaResumen", () => {
  it("sin sueño, null", () => {
    expect(suenoParaResumen([], HOY)).toBeNull();
  });

  it("la última noche, si es la de hoy, y las 7 noches de la más vieja a la última con su inicial", () => {
    const sueno = Array.from({ length: 10 }, (_, n) => noche(n, 7 + (n % 2) * 0.5));
    const r = suenoParaResumen(sueno, HOY)!;
    expect(r.noche.fecha).toBe(HOY);
    expect(r.esAnoche).toBe(true);
    expect(r.noches).toHaveLength(7);
    expect(r.noches[6].fecha).toBe(HOY);
    expect(r.noches[6].inicial).toBe("J");   // 22/10/2026 es jueves
    expect(r.noches[0].fecha).toBe(dia(6));
  });

  it("las 7 son días de calendario: una noche que falta queda vacía, sin correr las iniciales", () => {
    const sueno = [0, 1, 2, 4, 5, 6].map((n) => noche(n, 7));   // falta la de hace 3 días
    const r = suenoParaResumen(sueno, HOY)!;
    expect(r.noches.map((n) => n.fecha)).toEqual([6, 5, 4, 3, 2, 1, 0].map(dia));
    expect(r.noches[3].horas).toBeNull();
    expect(r.noches.map((n) => n.inicial).join("")).toBe("VSDLMMJ");
  });

  it("si la última noche es vieja, no es «anoche»", () => {
    expect(suenoParaResumen([noche(3, 7)], HOY)!.esAnoche).toBe(false);
  });

  it("«Tu promedio» es la línea de base de resumenSalud si la hay; si no, el de las últimas 7", () => {
    const sueno = Array.from({ length: 5 }, (_, n) => noche(n, 7));
    expect(suenoParaResumen(sueno, HOY)!.promedio).toBeCloseTo(7);
    const conBase = suenoParaResumen(sueno, HOY, { clave: "sueno", baseline: 7.4, estado: "ok", unidad: "h", serie14d: [] });
    expect(conBase!.promedio).toBe(7.4);
  });
});

describe("tarjetasCuerpo", () => {
  const mediciones = [
    ...Array.from({ length: 30 }, (_, n) => med(n, { pesoKg: 80 - n * 0.02 })),
    med(0, { grasaPct: 21.2 }), med(4, { grasaPct: 21.6 }),
  ];
  const metricas = [
    ...Array.from({ length: 20 }, (_, n) => [met("presion-sistolica", n + 2, 120), met("presion-diastolica", n + 2, 78)]).flat(),
    ...Array.from({ length: 20 }, (_, n) => met("spo2", n, 97)),
  ];

  it("con todo: peso, grasa, presión y oxígeno en sangre, en ese orden y sin FC de reposo", () => {
    const fc = Array.from({ length: 20 }, (_, n) => met("fc-reposo", n, 58));
    const senales = calcularResumenSalud([...metricas, ...fc], [], mediciones, HOY);
    const t = tarjetasCuerpo(senales, mediciones, HOY);
    expect(t.map((x) => x.clave)).toEqual(["peso", "grasa", "presion", "spo2"]);
    expect(t.find((x) => x.clave === "spo2")!.titulo).toBe("Oxígeno en sangre");
  });

  it("la grasa sale de las mediciones: la última contra la anterior, en puntos", () => {
    const t = tarjetasCuerpo(calcularResumenSalud([], [], mediciones, HOY), mediciones, HOY);
    const grasa = t.find((x) => x.clave === "grasa")!;
    expect(grasa.valor).toBe("21,2");
    expect(grasa.cambio).toBe("−0,4 puntos");
    expect(grasa.cuando).toBe("hoy");
    expect(grasa.serie).toEqual([21.6, 21.2]);
  });

  it("sin grasa, no hay tarjeta de grasa", () => {
    const sinGrasa = mediciones.filter((m) => m.grasaPct == null);
    const t = tarjetasCuerpo(calcularResumenSalud(metricas, [], sinGrasa, HOY), sinGrasa, HOY);
    expect(t.map((x) => x.clave)).toEqual(["peso", "presion", "spo2"]);
  });

  it("la presión trae el texto de antigüedad de P106 y el cambio como número, sin juicio", () => {
    const t = tarjetasCuerpo(calcularResumenSalud(metricas, [], [], HOY), [], HOY);
    const p = t.find((x) => x.clave === "presion")!;
    expect(p.valor).toBe("120/78");
    expect(p.cuando).toBe("hace 2 días");
    expect(p.cambio).toMatch(/^sistólica /);
    expect(p.cambio).not.toMatch(/lecturas/);
  });

  it("sin datos, ninguna tarjeta", () => {
    expect(tarjetasCuerpo(calcularResumenSalud([], [], [], HOY), [], HOY)).toEqual([]);
  });
});
