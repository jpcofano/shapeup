import { describe, it, expect } from "vitest";
import {
  finDeSesion, sesionSinLlegar, explicarSinBiometria, textoSesionSinLlegar, textoImportacion,
  estadoDelPedido,
} from "./estadoPuente";
import type { BiometriaSesion, Historial } from "../types/models";

const H = 3_600_000;
const CORRIDA = Date.UTC(2026, 8, 25, 15, 40); // 12:40 local

function h(p: Partial<Historial> & { idHist: string }): Historial {
  return {
    fechaRealizada: "2026-09-25", tipo: "rutina", miembro: "juanpablo",
    nombreRutina: "Fuerza A", duracionRealMin: 40, bloques: [],
    ...p,
  } as Historial;
}
const bio = { fuente: "samsung-health-csv", granularidad: "serie" } as unknown as BiometriaSesion;

describe("finDeSesion", () => {
  it("usa finMs, o inicio + duración, o no sabe", () => {
    expect(finDeSesion({ finMs: 10, inicioMs: 1, duracionRealMin: 1 })).toBe(10);
    expect(finDeSesion({ inicioMs: 0, duracionRealMin: 2 })).toBe(120_000);
    expect(finDeSesion({ duracionRealMin: 2 })).toBeNull();
  });
});

describe("sesionSinLlegar", () => {
  it("la última sesión terminó después de la última subida → todavía no llegó", () => {
    const hoy = h({ idHist: "H-HOY", finMs: CORRIDA + 2 * H });
    const vieja = h({ idHist: "H-VIEJA", fechaRealizada: "2026-09-20", finMs: CORRIDA - 100 * H, biometria: bio });
    expect(sesionSinLlegar([vieja, hoy], CORRIDA)?.idHist).toBe("H-HOY");
  });

  it("si terminó antes de la subida, no es que no llegó", () => {
    expect(sesionSinLlegar([h({ idHist: "H-1", finMs: CORRIDA - H })], CORRIDA)).toBeNull();
  });

  it("si ya tiene biometría, no hay nada que avisar", () => {
    expect(sesionSinLlegar([h({ idHist: "H-1", finMs: CORRIDA + H, biometria: bio })], CORRIDA)).toBeNull();
  });

  it("sin puente (nunca corrió) no hay 'todavía'", () => {
    expect(sesionSinLlegar([h({ idHist: "H-1", finMs: CORRIDA + H })], null)).toBeNull();
  });

  it("las externas no cuentan: no vienen de la app", () => {
    expect(sesionSinLlegar([h({ idHist: "H-1", tipo: "externa", finMs: CORRIDA + H })], CORRIDA)).toBeNull();
  });

  it("los juegos sí: se enriquecen", () => {
    expect(sesionSinLlegar([h({ idHist: "H-1", tipo: "juego", finMs: CORRIDA + H })], CORRIDA)?.idHist).toBe("H-1");
  });
});

describe("explicarSinBiometria", () => {
  it("explica la sesión que terminó después de la subida", () => {
    expect(explicarSinBiometria(h({ idHist: "H-1", finMs: CORRIDA + H }), CORRIDA, "2026-09-25"))
      .toBe("Tu sesión de hoy todavía no llegó del reloj — el puente sube cada 6 horas.");
  });
  it("si el puente ya pasó, la explicación es otra (null)", () => {
    expect(explicarSinBiometria(h({ idHist: "H-1", finMs: CORRIDA - H }), CORRIDA, "2026-09-25")).toBeNull();
  });
  it("sin dato del puente, null", () => {
    expect(explicarSinBiometria(h({ idHist: "H-1", finMs: CORRIDA + H }), null, "2026-09-25")).toBeNull();
  });
});

describe("textos", () => {
  it("'de hoy' o la fecha", () => {
    expect(textoSesionSinLlegar("2026-09-25", "2026-09-25")).toContain("Tu sesión de hoy");
    expect(textoSesionSinLlegar("2026-09-24", "2026-09-25")).toContain("Tu sesión del 24/09");
  });
  it("la importación dice si fue a mano o automática, y cuántas", () => {
    expect(textoImportacion({ ms: 0, tipo: "manual", actividades: 91 })).toBe("a mano · 91 actividades guardadas");
    expect(textoImportacion({ ms: 0, tipo: "automatica", actividades: 1 })).toBe("automática · 1 actividad guardada");
  });
});

describe("estadoDelPedido (P89)", () => {
  const P = { pedidoMs: CORRIDA, origen: "boton" };
  it("respondió si el puente corrió después del pedido", () => {
    expect(estadoDelPedido(P, CORRIDA + 30_000, CORRIDA + 60_000)).toEqual({ como: "desde el botón", estado: "respondio" });
  });
  it("esperando los primeros minutos", () => {
    expect(estadoDelPedido(P, CORRIDA - H, CORRIDA + 60_000)?.estado).toBe("esperando");
  });
  it("sin respuesta pasados 10 minutos", () => {
    expect(estadoDelPedido({ pedidoMs: CORRIDA, origen: "fin-sesion" }, CORRIDA - H, CORRIDA + 11 * 60_000))
      .toEqual({ como: "al terminar una sesión", estado: "sin-respuesta" });
  });
  it("sin pedido, nada", () => {
    expect(estadoDelPedido(null, CORRIDA, CORRIDA)).toBeNull();
  });
});
