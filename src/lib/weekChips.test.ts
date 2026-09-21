import { describe, it, expect } from "vitest";
import { calcularWeekChips, MINUTOS_MOVIMIENTO_CHIP } from "./weekChips";
import { agruparDiasActivos, type ActividadDia, type DiaActivo } from "./racha";
import type { Historial } from "../types/models";

describe("calcularWeekChips", () => {
  const semanaInicio = "2026-07-06"; // lunes

  /** Día ya resuelto, para los casos que no necesitan pasar por el agrupador. */
  function dia(fecha: string, p: Partial<DiaActivo> = {}): DiaActivo {
    return {
      fecha, shapeUp: false, externaDeclarada: false, autodetectada: false,
      minutos: 0, ...p,
    };
  }

  it("marca 'today' en la fecha de hoy, aunque haya sesión ese día", () => {
    const chips = calcularWeekChips([dia("2026-07-08", { shapeUp: true })], semanaInicio, "2026-07-08");
    expect(chips[2]).toEqual({ letter: "X", fecha: "2026-07-08", estado: "today" });
  });

  it("marca 'done' los días con sesión de ShapeUp, sin tocar los demás", () => {
    const chips = calcularWeekChips(
      [dia("2026-07-06", { shapeUp: true }), dia("2026-07-09", { shapeUp: true })],
      semanaInicio,
      "2026-07-10",
    );
    expect(chips.map((c) => c.estado)).toEqual([
      "done", "pending", "pending", "done", "today", "pending", "pending",
    ]);
  });

  it("genera las 7 fechas L→D a partir del lunes", () => {
    const chips = calcularWeekChips([], semanaInicio, "2026-01-01");
    expect(chips.map((c) => c.fecha)).toEqual([
      "2026-07-06", "2026-07-07", "2026-07-08", "2026-07-09",
      "2026-07-10", "2026-07-11", "2026-07-12",
    ]);
    expect(chips.map((c) => c.letter)).toEqual(["L", "M", "X", "J", "V", "S", "D"]);
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  El tercer estado: "me moví" sin haber entrenado en la app.
//
//  Los minutos salen del agrupador, así que estos tests entran por ahí y no
//  por un DiaActivo armado a mano: es el camino real, y prueba las dos piezas.
// ════════════════════════════════════════════════════════════════════════════

describe("calcularWeekChips · el estado movimiento", () => {
  const SEMANA = "2026-07-06";
  const HOY    = "2026-07-12";     // domingo: el resto de la semana ya pasó
  const MARTES = "2026-07-07";

  function caminata(fecha: string, minutos: number): ActividadDia {
    return { fecha, duracionMin: minutos, autodetectada: false, esVR: false, marcadaShapeUp: false };
  }

  function sesion(fecha: string, minutos: number): Historial {
    return {
      idHist: `H-${fecha}`, fechaRealizada: fecha, tipo: "rutina",
      duracionRealMin: minutos,
    } as Historial;
  }

  function estadoDelMartes(historial: Historial[], actividades: ActividadDia[]) {
    const chips = calcularWeekChips(agruparDiasActivos(historial, actividades), SEMANA, HOY);
    return chips.find((c) => c.fecha === MARTES)?.estado;
  }

  it("tres caminatas de 8 minutos suman 24 y dan movimiento", () => {
    const tres = [caminata(MARTES, 8), caminata(MARTES, 8), caminata(MARTES, 8)];
    expect(agruparDiasActivos([], tres)[0].minutos).toBe(24);
    expect(estadoDelMartes([], tres)).toBe("movimiento");
  });

  it("una sola de 15 minutos no alcanza: queda vacío", () => {
    expect(estadoDelMartes([], [caminata(MARTES, 15)])).toBe("pending");
  });

  it("con sesión de ShapeUp da entrenamiento aunque el cardio sume 0", () => {
    expect(estadoDelMartes([sesion(MARTES, 0)], [])).toBe("done");
  });

  it("con sesión de ShapeUp da entrenamiento aunque no haya nada de cardio", () => {
    expect(estadoDelMartes([sesion(MARTES, 45)], [])).toBe("done");
  });

  it("la sesión gana sobre el movimiento: un día con las dos cosas es 'done'", () => {
    expect(estadoDelMartes([sesion(MARTES, 45)], [caminata(MARTES, 30)])).toBe("done");
  });

  it("justo en el piso entra", () => {
    expect(estadoDelMartes([], [caminata(MARTES, MINUTOS_MOVIMIENTO_CHIP)])).toBe("movimiento");
    expect(estadoDelMartes([], [caminata(MARTES, MINUTOS_MOVIMIENTO_CHIP - 1)])).toBe("pending");
  });

  it("una autodetectada larga también cuenta como movimiento", () => {
    // El día activo no distingue quién apretó el botón: te moviste igual.
    const auto: ActividadDia = { ...caminata(MARTES, 40), autodetectada: true };
    expect(estadoDelMartes([], [auto])).toBe("movimiento");
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  Minutos: que no se cuenten dos veces
// ════════════════════════════════════════════════════════════════════════════

describe("agruparDiasActivos · minutos", () => {
  const FECHA = "2026-07-07";

  it("suma las sesiones de la app y las actividades de cardio", () => {
    const h = [{ idHist: "H-1", fechaRealizada: FECHA, tipo: "rutina", duracionRealMin: 50 } as Historial];
    const a: ActividadDia[] = [{ fecha: FECHA, duracionMin: 20, autodetectada: false }];
    expect(agruparDiasActivos(h, a)[0].minutos).toBe(70);
  });

  it("una actividad que ya enriqueció una sesión NO se cuenta dos veces", () => {
    // Es el mismo entrenamiento: el reloj lo midió y la app lo registró.
    const h = [{
      idHist: "H-1", fechaRealizada: FECHA, tipo: "rutina", duracionRealMin: 50,
      biometria: { fuente: "samsung-health-csv", datauuidSamsung: "u-1", matchPor: "custom-id", granularidad: "sesion" },
    } as Historial];
    const a: ActividadDia[] = [{ fecha: FECHA, idCardio: "CAR-u-1", duracionMin: 48, autodetectada: false }];
    expect(agruparDiasActivos(h, a)[0].minutos).toBe(50);
  });

  it("una actividad sin duración no rompe la suma", () => {
    const a: ActividadDia[] = [{ fecha: FECHA, autodetectada: false }];
    expect(agruparDiasActivos([], a)[0].minutos).toBe(0);
  });
});
