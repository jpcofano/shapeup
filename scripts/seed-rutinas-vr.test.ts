// P98 — el seed de las rutinas de VR en simulación no escribe nada. La lógica
// del plan tiene sus tests en src/lib/catalogoVR.test.ts; acá se pasa el plan
// por la corrida tal como lo hace el script.
import { describe, it, expect, vi } from "vitest";
import { planificarSeedVR, aplicarPlanSeedVR, type EstadoActualVR } from "../src/lib/catalogoVR";
import { crearCorrida } from "./lib/corrida";

const ANTES: EstadoActualVR = {
  ejercicios: { "EJ-9003": {}, "EJ-9004": {}, "EJ-9009": {}, "EJ-9010": {} },
  rutinas: { "RUT-0004": {}, "RUT-0005": {}, "RUT-0007": {}, "RUT-0008": {} },
  programas: { "PRG-0004": { estado: "Plantilla" } },
  programaActivo: { juanpablo: "PRG-0004" },
};

describe("seed-rutinas-vr (P98)", () => {
  it("en simulación no llama a ninguna escritura", async () => {
    const lineas: string[] = [];
    const c = crearCorrida({ nombre: "seed-rutinas-vr", argv: [], log: (l) => lineas.push(l) });
    const escribir = vi.fn(async () => {});
    const plan = planificarSeedVR(ANTES);
    for (const p of plan.pasos) await c.escribir(p.tipo, escribir);
    expect(c.resumen()).toBe(0);
    expect(escribir).not.toHaveBeenCalled();
    expect(lineas.join("\n")).toContain(`se escribirían: ${plan.pasos.length}`);
  });
  it("correrlo dos veces no duplica nada", () => {
    const una = aplicarPlanSeedVR(ANTES, planificarSeedVR(ANTES));
    const dos = aplicarPlanSeedVR(una, planificarSeedVR(una));
    expect(dos).toEqual(una);
    expect(planificarSeedVR(dos).pasos).toHaveLength(0);
  });
});
