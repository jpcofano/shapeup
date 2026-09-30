import { describe, it, expect } from "vitest";
import {
  planificarCorrecciones, camposDeActualizacion,
  planificarReversion, camposDeReversion, censoArranques, TOLERANCIA_RELOJ_MS,
  planificarReanclaje, msDelIdHist,
  type SesionConVentana,
} from "./ventanasViejas";
import type { BiometriaSesion } from "../types/models";

const MIN = 60_000;
const T0 = Date.UTC(2026, 8, 14, 22, 0); // 14/09 19:00 local

function sesion(p: Partial<SesionConVentana> & { idHist: string }): SesionConVentana {
  return {
    miembro: "juanpablo",
    fechaRealizada: "2026-09-14",
    nombreRutina: "Body Combat",
    idRutina: "RUT-VR",
    tipo: "rutina",
    inicioMs: T0,
    finMs: T0 + 9 * MIN,
    duracionRealMin: 33,
    ...p,
  };
}

const VR = new Set(["RUT-VR"]);

const biometria = {
  fuente: "samsung-health-csv",
  fcMedia: 128,
  fcMax: 170,
  granularidad: "serie",
  versionEnriquecimiento: 5,
} as unknown as BiometriaSesion;

describe("planificarCorrecciones", () => {
  it("corrige una ventana corta con el tiempo de la app", () => {
    const { correcciones } = planificarCorrecciones([sesion({ idHist: "H-1" })], VR);
    expect(correcciones).toHaveLength(1);
    const c = correcciones[0];
    expect(c.nuevoFinMs).toBe(T0 + 33 * MIN);
    expect(c).toMatchObject({ viejaMin: 9, nuevaMin: 33, ganaMin: 24, recortada: false, categoria: "vr" });
  });

  it("no toca una ventana dentro de la tolerancia de 2 minutos", () => {
    const s = sesion({ idHist: "H-1", finMs: T0 + 31.5 * MIN });
    expect(planificarCorrecciones([s], VR).correcciones).toHaveLength(0);
  });

  it("sin duracionRealMin no se toca y se informa", () => {
    const { correcciones, omitidas } = planificarCorrecciones(
      [sesion({ idHist: "H-1", duracionRealMin: null })], VR,
    );
    expect(correcciones).toHaveLength(0);
    expect(omitidas).toEqual([expect.objectContaining({ idHist: "H-1", motivo: "sin-duracion" })]);
  });

  it("sin inicioMs no se toca y se informa", () => {
    const { correcciones, omitidas } = planificarCorrecciones(
      [sesion({ idHist: "H-1", inicioMs: undefined })], VR,
    );
    expect(correcciones).toHaveLength(0);
    expect(omitidas[0].motivo).toBe("sin-inicio");
  });

  it("recorta la ventana nueva al arranque de la sesión siguiente del mismo miembro", () => {
    const siguiente = sesion({
      idHist: "H-2", inicioMs: T0 + 20 * MIN, finMs: T0 + 50 * MIN, duracionRealMin: 30,
    });
    const { correcciones } = planificarCorrecciones([sesion({ idHist: "H-1" }), siguiente], VR);
    expect(correcciones).toHaveLength(1);
    expect(correcciones[0]).toMatchObject({ idHist: "H-1", recortada: true, nuevaMin: 20, ganaMin: 11 });
    expect(correcciones[0].nuevoFinMs).toBe(T0 + 20 * MIN);
  });

  it("la sesión de otro miembro no recorta", () => {
    const otra = sesion({ idHist: "H-2", miembro: "maria", inicioMs: T0 + 20 * MIN, finMs: T0 + 50 * MIN, duracionRealMin: 30 });
    const { correcciones } = planificarCorrecciones([sesion({ idHist: "H-1" }), otra], VR);
    expect(correcciones[0].recortada).toBe(false);
  });

  it("una sesión que no es de VR se clasifica aparte", () => {
    const fuerza = sesion({ idHist: "H-1", idRutina: "RUT-0001", nombreRutina: "Fuerza A" });
    expect(planificarCorrecciones([fuerza], VR).correcciones[0].categoria).toBe("otra");
  });

  it("ignora las externas", () => {
    const ext = sesion({ idHist: "H-1", tipo: "externa" });
    const r = planificarCorrecciones([ext], VR);
    expect(r.correcciones).toHaveLength(0);
    expect(r.omitidas).toHaveLength(0);
  });

  it("no muta la entrada", () => {
    const s = sesion({ idHist: "H-1", biometria });
    const copia = JSON.parse(JSON.stringify(s));
    planificarCorrecciones([s], VR);
    expect(s).toEqual(copia);
  });
});

describe("camposDeActualizacion", () => {
  it("baja la versión de la biometría y no toca el resto", () => {
    const [c] = planificarCorrecciones([sesion({ idHist: "H-1", biometria })], VR).correcciones;
    const campos = camposDeActualizacion(c);
    expect(campos).toEqual({ finMs: T0 + 33 * MIN, "biometria.versionEnriquecimiento": 0 });
    // Solo esa clave bajo biometria.*: fcMedia, fcMax, granularidad quedan como están.
    expect(Object.keys(campos).filter((k) => k.startsWith("biometria"))).toEqual(["biometria.versionEnriquecimiento"]);
    expect(campos).not.toHaveProperty("inicioMs");
  });

  it("sin biometría solo escribe finMs", () => {
    const [c] = planificarCorrecciones([sesion({ idHist: "H-1" })], VR).correcciones;
    expect(camposDeActualizacion(c)).toEqual({ finMs: T0 + 33 * MIN });
  });
});


// ── P84b ─────────────────────────────────────────────────────────────────────

describe("planificarReversion (P84b)", () => {
  // La sesión real del 16/09: fin viejo 20:56, P84 la dejó 19:55→21:18, reloj 19:33.
  const FIN_VIEJO = T0 + 61 * MIN;              // app antes de P84: T0 → T0+61
  const DUR = 83;
  const FIN_P84 = T0 + DUR * MIN;               // P84: T0 → T0+83
  const RELOJ = FIN_VIEJO - DUR * MIN + 30_000; // el reloj arrancó 30 s después del inicio calculado
  const linea = { idHist: "H-1", finMsViejo: FIN_VIEJO, finMsNuevo: FIN_P84 };
  const hoy = (p: Partial<SesionConVentana> = {}) =>
    sesion({ idHist: "H-1", inicioMs: T0, finMs: FIN_P84, duracionRealMin: DUR, biometria, ...p });
  const reloj = (ms: number[]) => new Map([["H-1", ms]]);

  it("revierte: fin = el viejo del respaldo, inicio = fin − duración; el reloj confirma", () => {
    const { reversiones, noRevertidas } = planificarReversion([linea], [hoy()], reloj([RELOJ]));
    expect(noRevertidas).toEqual([]);
    expect(reversiones[0].nueva).toEqual({ inicioMs: FIN_VIEJO - DUR * MIN, finMs: FIN_VIEJO });
    expect(reversiones[0].difRelojMin).toBe(-0.5);
  });

  it("no escribe si el estado actual difiere de lo que dejó P84", () => {
    const { reversiones, noRevertidas } = planificarReversion([linea], [hoy({ finMs: FIN_P84 + 1 })], reloj([RELOJ]));
    expect(reversiones).toEqual([]);
    expect(noRevertidas[0].motivo).toBe("estado-distinto");
  });

  it("no escribe si el inicio calculado difiere más de 5 min del reloj, y sí si difiere menos", () => {
    const lejos = planificarReversion([linea], [hoy()], reloj([FIN_VIEJO - DUR * MIN - TOLERANCIA_RELOJ_MS - 1000]));
    expect(lejos.reversiones).toEqual([]);
    expect(lejos.noRevertidas[0].motivo).toBe("reloj-no-confirma");
    const cerca = planificarReversion([linea], [hoy()], reloj([FIN_VIEJO - DUR * MIN - 4 * MIN]));
    expect(cerca.reversiones).toHaveLength(1);
  });

  it("no escribe si no hay tramo de Samsung", () => {
    const r = planificarReversion([linea], [hoy()], new Map());
    expect(r.reversiones).toEqual([]);
    expect(r.noRevertidas[0].motivo).toBe("sin-tramo");
  });

  it("no escribe si la ventana nueva pisa la sesión anterior del mismo miembro", () => {
    const anterior = sesion({ idHist: "H-0", inicioMs: T0 - 60 * MIN, finMs: T0 - 5 * MIN, duracionRealMin: 55 });
    // El inicio nuevo (T0 − 22 min) cae antes del fin de la anterior (T0 − 5 min).
    const r = planificarReversion([linea], [anterior, hoy()], reloj([RELOJ]));
    expect(r.reversiones).toEqual([]);
    expect(r.noRevertidas[0].motivo).toBe("pisa-anterior");
  });

  it("duracionRealMin no cambia en ningún caso: no está entre los campos y la ventana nueva la respeta", () => {
    const [rev] = planificarReversion([linea], [hoy()], reloj([RELOJ])).reversiones;
    const campos = camposDeReversion(rev);
    expect(campos).not.toHaveProperty("duracionRealMin");
    expect(Object.keys(campos).sort()).toEqual(["biometria.versionEnriquecimiento", "finMs", "inicioMs"]);
    expect((rev.nueva.finMs - rev.nueva.inicioMs) / MIN).toBe(DUR);
  });
});

describe("censoArranques (P84b)", () => {
  it("lista las que arrancan más de 5 min lejos del reloj, separadas por categoría", () => {
    const vr = sesion({ idHist: "H-VR", inicioMs: T0 });
    const fuerza = sesion({ idHist: "H-F", idRutina: "RUT-F", nombreRutina: "Fuerza", inicioMs: T0 });
    const bien = sesion({ idHist: "H-OK", inicioMs: T0 });
    const r = censoArranques([vr, fuerza, bien],
      new Map([["H-VR", [T0 - 20 * MIN]], ["H-F", [T0 + 8 * MIN]], ["H-OK", [T0 - 2 * MIN]]]),
      VR, new Set());
    expect(r.map((x) => [x.idHist, x.categoria, x.difMin])).toEqual([["H-VR", "vr", 20], ["H-F", "otra", -8]]);
  });
});

// ── P84c ─────────────────────────────────────────────────────────────────────

describe("planificarReanclaje (P84c)", () => {
  // La libre del 25/09: ventana 20:46→21:15 (29 min), app 50, reloj 20:26.
  const FIN = Date.UTC(2026, 8, 26, 0, 15, 12);
  const P84 = Date.UTC(2026, 8, 25, 19, 42, 57);
  const libre = sesion({
    idHist: `H-20260925-${FIN + 2_000}`, tipo: "libre", idRutina: undefined, nombreRutina: "Sesión libre",
    inicioMs: FIN - 29 * MIN, finMs: FIN, duracionRealMin: 50, biometria,
  });
  const reloj = new Map([[libre.idHist, [FIN - 49 * MIN - 10_000]]]);

  it("lee el ms del id", () => {
    expect(msDelIdHist("H-20260925-1790381714256")).toBe(1790381714256);
    expect(msDelIdHist("H-X")).toBeNull();
  });

  it("ancla en el fin y resta la duración; el reloj confirma", () => {
    const { reversiones, noRevertidas } = planificarReanclaje([libre], reloj, P84, new Set(), MIN);
    expect(noRevertidas).toEqual([]);
    expect(reversiones).toHaveLength(1);
    expect(reversiones[0].nueva).toEqual({ inicioMs: FIN - 50 * MIN, finMs: FIN });
    expect(Math.abs(reversiones[0].difRelojMin)).toBeLessThan(1);
  });

  it("guarda 1: si la ventana ya mide lo del cronómetro, no se toca", () => {
    const bien = { ...libre, inicioMs: FIN - 50 * MIN + 30_000 };
    expect(planificarReanclaje([bien], reloj, P84, new Set(), MIN).reversiones).toEqual([]);
  });

  it("guarda 1: si la ventana mide MÁS que el cronómetro, tampoco (no es este caso)", () => {
    const larga = { ...libre, inicioMs: FIN - 70 * MIN };
    expect(planificarReanclaje([larga], reloj, P84, new Set(), MIN).reversiones).toEqual([]);
  });

  it("solo las guardadas después de P84, y no las que ya cubre la reversión", () => {
    const vieja = { ...libre, idHist: `H-20260920-${P84 - 1}` };
    expect(planificarReanclaje([vieja], new Map([[vieja.idHist, reloj.get(libre.idHist)!]]), P84, new Set(), MIN).reversiones).toEqual([]);
    expect(planificarReanclaje([libre], reloj, P84, new Set([libre.idHist]), MIN).reversiones).toEqual([]);
  });

  it("sin tramo o con el reloj lejos, no se escribe", () => {
    expect(planificarReanclaje([libre], new Map(), P84, new Set(), MIN).noRevertidas[0].motivo).toBe("sin-tramo");
    const lejos = new Map([[libre.idHist, [FIN - 60 * MIN]]]);
    expect(planificarReanclaje([libre], lejos, P84, new Set(), MIN).noRevertidas[0].motivo).toBe("reloj-no-confirma");
  });

  it("no pisa la sesión anterior del mismo miembro", () => {
    const antes = sesion({ idHist: "H-20260925-1", inicioMs: FIN - 80 * MIN, finMs: FIN - 45 * MIN });
    const { noRevertidas } = planificarReanclaje([antes, libre], reloj, P84, new Set(), MIN);
    expect(noRevertidas.map((n) => n.motivo)).toEqual(["pisa-anterior"]);
  });
});
