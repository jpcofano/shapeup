import { describe, it, expect } from "vitest";
import { aplicarRevision, estimarFcMax, tocaRevision, type EstimacionFcMax } from "./fcMaxima";
import { zonasDesdeFcMax } from "./zonas";
import type { BiometriaSesion, Historial, PerfilMiembro, RevisionFcMax } from "../types/models";

const HOY = new Date("2026-10-01T12:00:00").getTime();
const DIA = 86_400_000;

function sesion(id: string, fecha: string, pico: number, extra: Partial<BiometriaSesion> = {}) {
  return {
    idHist: id, fechaRealizada: fecha,
    biometria: { coberturaFina: 0.95, fcPicoSuavizado: pico, ...extra } as BiometriaSesion,
    nombreRutina: "Sesión",
  } as Pick<Historial, "idHist" | "fechaRealizada" | "biometria" | "nombreRutina" | "nombreJuego">;
}

describe("estimarFcMax (P97, decisión 4)", () => {
  it("usa el segundo pico, no el primero", () => {
    const e = estimarFcMax([
      sesion("a", "2026-09-27", 168), sesion("b", "2026-09-20", 175), sesion("c", "2026-09-10", 166),
    ], HOY);
    expect(e.valor).toBe(168);
    expect(e.segundoPico).toEqual({ idHist: "a", fecha: "2026-09-27", pico: 168 });
    expect(e.picos.map((p) => p.pico)).toEqual([175, 168, 166]);
  });
  it("con una sola sesión no estima", () => {
    expect(estimarFcMax([sesion("a", "2026-09-27", 168)], HOY).valor).toBeNull();
  });
  it("excluye fcDudosa y cobertura baja, y las cuenta", () => {
    const e = estimarFcMax([
      sesion("a", "2026-09-27", 168),
      sesion("b", "2026-09-26", 190, { fcDudosa: true }),
      sesion("c", "2026-09-25", 185, { coberturaFina: 0.5 }),
      sesion("d", "2026-09-24", 160),
      sesion("e", "2026-09-23", 0, { fcPicoSuavizado: undefined }),
    ], HOY);
    expect(e.picos.map((p) => p.idHist)).toEqual(["a", "d"]);
    expect(e.valor).toBe(160);
    expect(e.excluidas).toEqual({ fcDudosa: 1, cobertura: 1, sinPico: 1 });
  });
  it("lista las excluidas aparte, con su motivo: el pico sobre la vigente + 10, los saltos o la cobertura", () => {
    const e = estimarFcMax([
      { ...sesion("a", "2026-09-29", 183, { fcDudosa: true, fcMax: 184, fcMaxUsada: 169 }), nombreRutina: "VR — Quema" },
      { ...sesion("b", "2026-09-28", 150, { fcDudosa: true, fcMax: 160 }), nombreRutina: "Fuerza A" },
      { ...sesion("c", "2026-09-27", 168, { coberturaFina: 0.4 }), nombreRutina: "Libre" },
      sesion("d", "2026-09-26", 165),
    ], HOY, [], 169);
    expect(e.sesionesExcluidas).toEqual([
      { idHist: "a", fecha: "2026-09-29", nombre: "VR — Quema", pico: 183, motivo: "pico-sobre-vigente" },
      { idHist: "b", fecha: "2026-09-28", nombre: "Fuerza A", pico: 150, motivo: "saltos" },
      { idHist: "c", fecha: "2026-09-27", nombre: "Libre", pico: 168, motivo: "cobertura" },
    ]);
  });
  it("por la regla del pico, la estimación sube como mucho 10 latidos por revisión", () => {
    // Un pico sostenido de 183 con vigente 169 queda afuera: es fcDudosa.
    const e = estimarFcMax([
      sesion("a", "2026-09-29", 183, { fcDudosa: true, fcMax: 184 }),
      sesion("b", "2026-09-20", 176), sesion("c", "2026-09-14", 173),
    ], HOY, [], 169);
    expect(e.valor).toBe(173);
    expect(e.sesionesExcluidas[0].motivo).toBe("pico-sobre-vigente");
  });
  it("mira solo las últimas 12 semanas", () => {
    const e = estimarFcMax([
      sesion("vieja", "2026-07-01", 180), sesion("vieja2", "2026-07-02", 179),
      sesion("a", "2026-09-27", 168), sesion("b", "2026-09-20", 165),
    ], HOY);
    expect(e.picos.map((p) => p.idHist)).toEqual(["a", "b"]);
    expect(e.valor).toBe(165);
  });
  it("nunca baja: no da menos que una estimación ya registrada", () => {
    const revisiones = [{ estimacion: 171 } as RevisionFcMax];
    const e = estimarFcMax([sesion("a", "2026-09-27", 168), sesion("b", "2026-09-20", 165)], HOY, revisiones);
    expect(e.valor).toBe(171);
    expect(e.estimacionPrevia).toBe(171);
    // Y sin sesiones en la ventana tampoco desaparece.
    expect(estimarFcMax([], HOY, revisiones).valor).toBe(171);
  });
});

describe("tocaRevision (P97)", () => {
  const est = (valor: number | null) => ({ valor }) as Pick<EstimacionFcMax, "valor">;

  it("por edad, sin revisar nunca: toca confirmar", () => {
    expect(tocaRevision({ fcMaxTeorica: 203, fcMaxOrigen: "edad-provisoria", fcMaxDesdeMs: HOY }, null, HOY)).toBe("confirmar");
    expect(tocaRevision({ fcMaxTeorica: 203 }, null, HOY)).toBe("confirmar");
  });
  it("aparece a los 3 meses del último cambio, no antes", () => {
    const desde = new Date("2026-07-01T12:00:00").getTime();
    const p: PerfilMiembro = { fcMaxTeorica: 169, fcMaxOrigen: "samsung", fcMaxDesdeMs: desde };
    expect(tocaRevision(p, est(165), new Date("2026-09-30T12:00:00").getTime())).toBeNull();
    expect(tocaRevision(p, est(165), new Date("2026-10-01T12:00:00").getTime())).toBe("trimestral");
  });
  it("antes de los 3 meses, si la estimación supera el vigente", () => {
    const p: PerfilMiembro = { fcMaxTeorica: 169, fcMaxOrigen: "samsung", fcMaxDesdeMs: HOY - 10 * DIA };
    expect(tocaRevision(p, est(171), HOY)).toBe("estimacion-supera");
    expect(tocaRevision(p, est(169), HOY)).toBeNull();
  });
  it("una estimación que ya se vio y se dejó como estaba no vuelve a avisar", () => {
    const p: PerfilMiembro = {
      fcMaxTeorica: 169, fcMaxOrigen: "samsung", fcMaxDesdeMs: HOY - 40 * DIA,
      revisionesFcMax: [{ fechaMs: HOY - 5 * DIA, estimacion: 171, eleccion: "mantener" } as RevisionFcMax],
    };
    expect(tocaRevision(p, est(171), HOY)).toBeNull();
    expect(tocaRevision(p, est(172), HOY)).toBe("estimacion-supera");
  });
  it("después de revisar, el reloj de los 3 meses arranca de nuevo", () => {
    const p: PerfilMiembro = {
      fcMaxTeorica: 203, fcMaxOrigen: "edad-provisoria", fcMaxDesdeMs: HOY - 200 * DIA,
      revisionesFcMax: [{ fechaMs: HOY - 30 * DIA, estimacion: null, eleccion: "mantener" } as RevisionFcMax],
    };
    expect(tocaRevision(p, null, HOY)).toBeNull();
    expect(tocaRevision(p, null, HOY + 70 * DIA)).toBe("trimestral");
  });
  it("sin FC máxima no hay nada que revisar", () => {
    expect(tocaRevision({}, est(170), HOY)).toBeNull();
    expect(tocaRevision(undefined, null, HOY)).toBeNull();
  });
});

describe("aplicarRevision (P97)", () => {
  const estimacion = estimarFcMax([sesion("a", "2026-09-27", 172), sesion("b", "2026-09-20", 171)], HOY);
  const base: PerfilMiembro = { fcMaxTeorica: 169, fcMaxOrigen: "samsung", zonasFC: zonasDesdeFcMax(169) };

  it("aplicar la estimación cambia el valor, el origen, la fecha y las zonas", () => {
    const r = aplicarRevision(base, "estimacion", { estimacion, samsung: 169 }, HOY);
    if (!r.ok) throw new Error(r.error);
    expect(r.cambio.fcMaxTeorica).toBe(171);
    expect(r.cambio.fcMaxOrigen).toBe("estimacion-shapeup");
    expect(r.cambio.fcMaxDesdeMs).toBe(HOY);
    expect(r.cambio.zonasFC).toEqual(zonasDesdeFcMax(171));
    expect(r.cambio.revisionesFcMax).toEqual([{
      fechaMs: HOY, vigente: 169, origenVigente: "samsung", estimacion: 171,
      evidencia: estimacion.picos, samsung: 169, eleccion: "estimacion", aplicado: 171,
    }]);
  });
  it("dejar como está solo registra la revisión", () => {
    const r = aplicarRevision(base, "mantener", { estimacion, samsung: null }, HOY);
    if (!r.ok) throw new Error(r.error);
    expect(Object.keys(r.cambio)).toEqual(["revisionesFcMax"]);
    expect(r.cambio.revisionesFcMax![0]).toMatchObject({ eleccion: "mantener", aplicado: 169 });
  });
  it("el mismo valor con otro origen: cambia el origen, no las zonas", () => {
    const porEdad: PerfilMiembro = { ...base, fcMaxOrigen: "edad-provisoria" };
    const r = aplicarRevision(porEdad, "samsung", { estimacion: null, samsung: 169 }, HOY);
    if (!r.ok) throw new Error(r.error);
    expect(r.cambio.fcMaxOrigen).toBe("samsung");
    expect(r.cambio.fcMaxTeorica).toBeUndefined();
    expect(r.cambio.zonasFC).toBeUndefined();
  });
  it("las revisiones se acumulan, no se pisan", () => {
    const previa = { fechaMs: 1, eleccion: "mantener" } as RevisionFcMax;
    const r = aplicarRevision({ ...base, revisionesFcMax: [previa] }, "mantener", { estimacion: null, samsung: null }, HOY);
    if (!r.ok) throw new Error(r.error);
    expect(r.cambio.revisionesFcMax).toHaveLength(2);
    expect(r.cambio.revisionesFcMax![0]).toBe(previa);
  });
  it("rechaza elegir lo que no está", () => {
    expect(aplicarRevision(base, "samsung", { estimacion, samsung: null }, HOY)).toMatchObject({ ok: false });
    expect(aplicarRevision(base, "estimacion", { estimacion: null, samsung: null }, HOY)).toMatchObject({ ok: false });
    expect(aplicarRevision(base, "samsung", { estimacion: null, samsung: 90 }, HOY)).toMatchObject({ ok: false });
    expect(aplicarRevision({}, "mantener", { estimacion: null, samsung: null }, HOY)).toMatchObject({ ok: false });
  });
});
