// P97 — el script de corrección de zonas en simulación no escribe nada. La
// lógica del plan tiene sus tests en src/lib/correccionZonas.test.ts; acá se
// pasa el plan por la corrida tal como lo hace el script.
import { describe, it, expect, vi } from "vitest";
import { planificarCorreccionZonas } from "../src/lib/correccionZonas";
import { crearCorrida } from "./lib/corrida";

const DOC = {
  juanpablo: {
    fcMaxTeorica: 169,
    zonasFC: { Z1: { min: 85, max: 101 }, Z2: { min: 101, max: 118 }, Z3: { min: 118, max: 135 },
      Z4: { min: 135, max: 152 }, Z5: { min: 152, max: 169 } },
  },
  ultimaActualizacion: { _seconds: 1, _nanoseconds: 0 },
};

describe("corregir-zonas-perfiles (P97)", () => {
  it("en simulación no llama a ninguna escritura", async () => {
    const lineas: string[] = [];
    const c = crearCorrida({ nombre: "corregir-zonas", argv: [], log: (l) => lineas.push(l) });
    const update = vi.fn(async () => {});
    const plan = planificarCorreccionZonas(DOC, 1);
    for (const k of plan.correcciones) await c.escribir(k.miembro, update);
    expect(c.resumen()).toBe(0);
    expect(update).not.toHaveBeenCalled();
    expect(lineas.join("\n")).toContain("se escribirían: 1");
  });
  it("con --aplicar sí escribe, y solo después del respaldo", async () => {
    const archivos: string[] = [];
    const c = crearCorrida({
      nombre: "corregir-zonas", argv: ["--aplicar"], log: () => {},
      escribirArchivo: (ruta) => archivos.push(ruta), dirRespaldos: "x",
    });
    const update = vi.fn(async () => {});
    expect(c.abrirRespaldo({ juanpablo: {} })).toBe(true);
    await c.escribir("juanpablo", update);
    expect(archivos).toHaveLength(1);
    expect(update).toHaveBeenCalledTimes(1);
  });
});
