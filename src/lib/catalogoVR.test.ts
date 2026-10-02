import { describe, it, expect } from "vitest";
import {
  aplicarPlanSeedVR, planificarSeedVR, PROGRAMA_VR, RUTINAS_VR, RUTINAS_A_ARCHIVAR,
  PRG_VR_5_DIAS, type EstadoActualVR,
} from "./catalogoVR";
import { esRutinaVR } from "./progresionVR";
import { metaSemanal } from "./adherencia";
import type { Programa, Rutina } from "../types/models";

/** Firestore como estaba el 02/10, lo justo para el plan. */
const ANTES: EstadoActualVR = {
  ejercicios: { "EJ-9003": {}, "EJ-9004": {}, "EJ-9009": {}, "EJ-9010": {} },
  rutinas: { "RUT-0004": {}, "RUT-0005": {}, "RUT-0007": {}, "RUT-0008": {} },
  programas: { "PRG-0004": { estado: "Plantilla" } },
  programaActivo: { juanpablo: "PRG-0004" },
};

describe("planificarSeedVR (P98)", () => {
  const plan = planificarSeedVR(ANTES);

  it("dificultades, 4 rutinas, 4 archivos, el programa, la pausa y la activación", () => {
    const tipos = plan.pasos.map((p) => p.tipo);
    expect(tipos.filter((t) => t === "dificultades")).toHaveLength(4);
    expect(tipos.filter((t) => t === "crear-rutina")).toHaveLength(4);
    expect(plan.pasos.filter((p) => p.tipo === "archivar-rutina").map((p) => "idRutina" in p && p.idRutina)).toEqual(RUTINAS_A_ARCHIVAR);
    expect(plan.pasos).toContainEqual({ tipo: "pausar-programa", idPrograma: "PRG-0004", estadoAntes: "Plantilla" });
    expect(plan.pasos).toContainEqual({ tipo: "activar-programa", miembro: "juanpablo", idPrograma: PRG_VR_5_DIAS, antes: "PRG-0004" });
    expect(plan.problemas).toEqual([]);
  });
  it("no toca la RUT-0014 ni el PRG-0012 de María", () => {
    const json = JSON.stringify(plan.pasos);
    expect(json).not.toContain("RUT-0014");
    expect(json).not.toContain("PRG-0012");
    expect(json).not.toContain("maria");
  });
  it("es idempotente: aplicado una vez, la segunda corrida no tiene pasos", () => {
    const despues = aplicarPlanSeedVR(ANTES, plan);
    expect(planificarSeedVR(despues).pasos).toEqual([]);
  });
  it("una rutina o un programa que ya existen no se pisan", () => {
    const conRutina = { ...ANTES, rutinas: { ...ANTES.rutinas, "RUT-0026": {} }, programas: { ...ANTES.programas, [PRG_VR_5_DIAS]: { estado: "Plantilla" } } };
    const p = planificarSeedVR(conRutina);
    expect(p.pasos.some((x) => x.tipo === "crear-rutina" && x.idRutina === "RUT-0026")).toBe(false);
    expect(p.pasos.some((x) => x.tipo === "crear-programa")).toBe(false);
  });
  it("si falta un ejercicio, lo dice y no lo inventa", () => {
    const p = planificarSeedVR({ ...ANTES, ejercicios: { ...ANTES.ejercicios, "EJ-9004": undefined } });
    expect(p.problemas).toEqual(["EJ-9004 no existe en /ejercicios (lo crea seed:vr)"]);
  });
});

describe("las rutinas y el programa nuevos (P98)", () => {
  it("van en Casa con el visor como equipo, y no entran en la progresión de P79", () => {
    for (const r of RUTINAS_VR) {
      expect(r.lugar).toBe("Casa");
      expect(r.equipoNecesario).toEqual(["VR"]);
      expect(esRutinaVR(r as Rutina)).toBe(false);
    }
  });
  it("ningún bloque baja de 12 minutos", () => {
    for (const r of RUTINAS_VR) for (const esc of Object.values(r.vr!.escaleras)) {
      for (const e of esc!) expect(e.minutosBloque, r.idRutina).toBeGreaterThanOrEqual(12);
    }
  });
  it("el programa es de 5 días, todos de VR, y la meta sale 5", () => {
    expect(PROGRAMA_VR.dias.map((d) => d.idRutina)).toEqual(["RUT-0026", "RUT-0028", "RUT-0027", "RUT-0028", "RUT-0026"]);
    expect(metaSemanal(PROGRAMA_VR as Programa)).toBe(5);
    // «Plantilla»: un programa «Activo» sería el respaldo de los miembros sin programa.
    expect(PROGRAMA_VR.estado).toBe("Plantilla");
  });
});
