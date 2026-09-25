import { describe, it, expect } from "vitest";
import {
  planificarCorrecciones, camposDeActualizacion,
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

