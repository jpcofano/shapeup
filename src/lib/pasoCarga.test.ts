import { describe, it, expect } from "vitest";
import { pasoCarga, pasoCargaPorEquipo, aplicarPaso, PASO_CARGA_DEFAULT } from "./pasoCarga";
import type { Ejercicio, Equipo } from "../types/models";

function ej(equipo: Equipo[], pasoCargaKg?: number): Ejercicio {
  return { equipo, ...(pasoCargaKg !== undefined ? { pasoCargaKg } : {}) } as Ejercicio;
}

describe("pasoCarga", () => {
  it("usa el override del ejercicio", () => {
    expect(pasoCarga(ej(["Barra"], 1.25))).toBe(1.25);
  });

  it("ignora un override 0 o negativo", () => {
    expect(pasoCarga(ej(["Barra"], 0))).toBe(5);
    expect(pasoCarga(ej(["Kettlebell"], -2))).toBe(4);
  });

  it("con varios equipos gana la prioridad, no el orden del array", () => {
    expect(pasoCarga(ej(["Mancuernas", "Barra"]))).toBe(5);
    expect(pasoCarga(ej(["Peso corporal", "Kettlebell"]))).toBe(4);
    expect(pasoCarga(ej(["Peso corporal", "Mancuernas"]))).toBe(2.5);
  });

  it("paso por cada equipo de la tabla", () => {
    expect(pasoCarga(ej(["Polea"]))).toBe(5);
    expect(pasoCarga(ej(["Máquina"]))).toBe(5);
    expect(pasoCarga(ej(["Peso corporal"]))).toBe(1.25);
  });

  it("sin equipo conocido devuelve el default", () => {
    expect(pasoCarga(ej(["Banda elástica", "Otro"]))).toBe(PASO_CARGA_DEFAULT);
    expect(pasoCarga(ej([]))).toBe(2.5);
  });

  it("undefined devuelve el default", () => {
    expect(pasoCarga(undefined)).toBe(2.5);
    expect(pasoCargaPorEquipo(undefined)).toBe(2.5);
  });

  it("pasoCargaPorEquipo ignora el override", () => {
    expect(pasoCargaPorEquipo(ej(["Barra"], 1))).toBe(5);
  });
});

describe("aplicarPaso", () => {
  it("suma y resta sobre el valor actual", () => {
    expect(aplicarPaso("20", 0, 2.5, 0, 2)).toBe("22.5");
    expect(aplicarPaso("10", 1, -1, 1, 0)).toBe("9");
  });

  it("campo vacío parte de la base", () => {
    expect(aplicarPaso("", 10, 1, 1, 0)).toBe("11");
    expect(aplicarPaso("", 0, 1.25, 0, 2)).toBe("1.25");
  });

  it("no baja del mínimo", () => {
    expect(aplicarPaso("1", 1, -1, 1, 0)).toBe("1");
    expect(aplicarPaso("1", 0, -2.5, 0, 2)).toBe("0");
  });

  it("redondea a los decimales pedidos", () => {
    expect(aplicarPaso("0.1", 0, 0.2, 0, 2)).toBe("0.3");
  });
});
