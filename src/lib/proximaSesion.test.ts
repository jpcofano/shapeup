import { describe, it, expect } from "vitest";
import { proximaSesion } from "./proximaSesion";
import type { Programa, Historial } from "../types/models";
// ── Fixtures ──────────────────────────────────────────────────────────────────
function mkPrograma(dias: Array<{ orden: number; tipo: "rutina" | "vr" | "descanso"; idRutina?: string }>): Programa {
  return {
    idPrograma: "PRG-TEST",
    nombre: "Test",
    nombreCanonico: "test",
    estado: "Activo",
    objetivo: "General / salud",
    nivel: "Principiante",
    diasPorSemana: dias.filter((d) => d.tipo !== "descanso").length,
    descripcion: "",
    dias: dias.map((d) => ({
      orden: d.orden,
      etiqueta: `Día ${d.orden}`,
      tipo: d.tipo,
      idRutina: d.idRutina,
      opcional: false,
    })),
    vecesUsado: 0,
  } as unknown as Programa;
}
function mkHistorial(idRutinas: string[]): Historial[] {
  return idRutinas.map((idRutina, i) => ({
    idHist: `H-${i}`,
    fechaRealizada: "2026-06-08",
    fechaRealizadaTimestamp: { seconds: 0, nanoseconds: 0 },
    idSesion: `SES-${i}`,
    idRutina,
    nombreRutina: idRutina,
    semanaInicio: "2026-06-08",
    miembro: "juanpablo",
    duracionRealMin: 30,
    rpe: 7,
    tonelajeKg: 1000,
    totalSeriesHechas: 10,
    bloques: [],
    notas: "",
  }));
}
const PROG_ABC = mkPrograma([
  { orden: 1, tipo: "rutina", idRutina: "RUT-A" },
  { orden: 2, tipo: "rutina", idRutina: "RUT-B" },
  { orden: 3, tipo: "rutina", idRutina: "RUT-C" },
]);
const PROG_CON_DESCANSO = mkPrograma([
  { orden: 1, tipo: "rutina",   idRutina: "RUT-A" },
  { orden: 2, tipo: "descanso" },
  { orden: 3, tipo: "rutina",   idRutina: "RUT-B" },
  { orden: 4, tipo: "descanso" },
  { orden: 5, tipo: "rutina",   idRutina: "RUT-C" },
]);
const PROG_REPETIDA = mkPrograma([
  { orden: 1, tipo: "rutina", idRutina: "RUT-A" },
  { orden: 2, tipo: "rutina", idRutina: "RUT-B" },
  { orden: 3, tipo: "rutina", idRutina: "RUT-A" }, // A repite
]);
// ── Tests ─────────────────────────────────────────────────────────────────────
describe("proximaSesion — semana vacía", () => {
  it("devuelve día 1 si no hay sesiones", () => {
    const res = proximaSesion(PROG_ABC, []);
    expect(res).not.toBeNull();
    expect(res!.indice).toBe(1);
    expect(res!.total).toBe(3);
    expect(res!.dia.idRutina).toBe("RUT-A");
  });
});
describe("proximaSesion — progresión normal", () => {
  it("con A hecho → devuelve día 2 (B)", () => {
    const res = proximaSesion(PROG_ABC, mkHistorial(["RUT-A"]));
    expect(res!.indice).toBe(2);
    expect(res!.dia.idRutina).toBe("RUT-B");
  });
  it("con A+B hechos → devuelve día 3 (C)", () => {
    const res = proximaSesion(PROG_ABC, mkHistorial(["RUT-A", "RUT-B"]));
    expect(res!.indice).toBe(3);
    expect(res!.dia.idRutina).toBe("RUT-C");
  });
  it("con A+B+C hechos → null (semana completa)", () => {
    const res = proximaSesion(PROG_ABC, mkHistorial(["RUT-A", "RUT-B", "RUT-C"]));
    expect(res).toBeNull();
  });
});
describe("proximaSesion — descansos intercalados", () => {
  it("salta días de descanso y devuelve el primer activo libre", () => {
    const res = proximaSesion(PROG_CON_DESCANSO, []);
    expect(res!.indice).toBe(1);
    expect(res!.total).toBe(3); // solo 3 días activos
    expect(res!.dia.idRutina).toBe("RUT-A");
  });
  it("con A hecho → salta descanso y devuelve B (índice 2)", () => {
    const res = proximaSesion(PROG_CON_DESCANSO, mkHistorial(["RUT-A"]));
    expect(res!.indice).toBe(2);
    expect(res!.dia.idRutina).toBe("RUT-B");
  });
});
describe("proximaSesion — rutina repetida", () => {
  it("1 sesión de A cubre sólo el primer día con A", () => {
    // días: A(1), B(2), A(3) → hecha: A×1 → cubre orden 1, devuelve orden 2 (B)
    const res = proximaSesion(PROG_REPETIDA, mkHistorial(["RUT-A"]));
    expect(res!.indice).toBe(2);
    expect(res!.dia.idRutina).toBe("RUT-B");
  });
  it("A+B hechos → A cubre orden 1, B cubre orden 2, devuelve orden 3 (A de nuevo)", () => {
    const res = proximaSesion(PROG_REPETIDA, mkHistorial(["RUT-A", "RUT-B"]));
    expect(res!.indice).toBe(3);
    expect(res!.dia.idRutina).toBe("RUT-A");
  });
  it("A×2 + B hechos → todos cubiertos → null", () => {
    const res = proximaSesion(PROG_REPETIDA, mkHistorial(["RUT-A", "RUT-B", "RUT-A"]));
    expect(res).toBeNull();
  });
});
describe("proximaSesion — programa vacío", () => {
  it("programa sin días activos devuelve null", () => {
    const soloDescansos = mkPrograma([{ orden: 1, tipo: "descanso" }]);
    expect(proximaSesion(soloDescansos, [])).toBeNull();
  });
});
// ════════════════════════════════════════════════════════════════════════════
//  P77a — un día sin `idRutina` ya no traba la semana
//
//  Antes se devolvía SIEMPRE como próximo: como no hay rutina que entrenar
//  para cubrirlo, la semana quedaba clavada en ese día para siempre.
// ════════════════════════════════════════════════════════════════════════════
describe("proximaSesion · día sin idRutina (P77a)", () => {
  const PROG_CON_VR = mkPrograma([
    { orden: 1, tipo: "rutina", idRutina: "RUT-A" },
    { orden: 2, tipo: "vr" },                          // sin idRutina
    { orden: 3, tipo: "rutina", idRutina: "RUT-C" },
  ]);
  it("sin sesiones, el día sin rutina sigue siendo el próximo cuando le toca", () => {
    const res = proximaSesion(PROG_CON_VR, mkHistorial(["RUT-A"]));
    expect(res).not.toBeNull();
    expect(res!.indice).toBe(2);
    expect(res!.dia.idRutina).toBeUndefined();
  });
  it("una sesión sobrante lo cubre y la semana avanza", () => {
    // RUT-A cubre el día 1; la sesión libre cubre el día de VR; falta RUT-C.
    const libre = mkHistorial(["RUT-A", "RUT-LIBRE"]);
    const res = proximaSesion(PROG_CON_VR, libre);
    expect(res).not.toBeNull();
    expect(res!.indice).toBe(3);
    expect(res!.dia.idRutina).toBe("RUT-C");
  });
  it("con todo cubierto la semana se completa: ya no queda trabada", () => {
    const res = proximaSesion(PROG_CON_VR, mkHistorial(["RUT-A", "RUT-LIBRE", "RUT-C"]));
    expect(res).toBeNull();
  });
  it("una sesión sin idRutina también sirve para cubrirlo", () => {
    // Sesión libre de verdad: la que se entrena sin rutina del plan.
    const sinRutina = mkHistorial(["RUT-A"]).concat(
      mkHistorial(["X"]).map((h) => ({ ...h, idRutina: undefined })),
    );
    const res = proximaSesion(PROG_CON_VR, sinRutina);
    expect(res!.indice).toBe(3);
  });
  it("no le roba la sesión a un día con rutina que viene después", () => {
    // La única sesión es de RUT-C: el día de VR NO se la puede quedar, porque
    // está asignada al día 3.
    const res = proximaSesion(PROG_CON_VR, mkHistorial(["RUT-C"]));
    expect(res!.indice).toBe(1);   // falta RUT-A, que va primero
    const res2 = proximaSesion(PROG_CON_VR, mkHistorial(["RUT-A", "RUT-C"]));
    expect(res2!.indice).toBe(2);  // el de VR sigue sin cubrir
    expect(res2!.dia.idRutina).toBeUndefined();
  });
});
