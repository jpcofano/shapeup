import { describe, it, expect } from "vitest";
import { compararConPrevias, serieCostoRutina, MIN_SESIONES_SECCION } from "./costoCardiaco";
import type { Historial } from "./../types/models";

let contador = 0;

function mkHistorial(overrides: Partial<Historial> & { fecha: string }): Historial {
  contador++;
  const { fecha, ...rest } = overrides;
  return {
    idHist: `H-${fecha.replace(/-/g, "")}-${contador}`,
    fechaRealizada: fecha,
    fechaRealizadaTimestamp: { seconds: 0, nanoseconds: 0 },
    idSesion: `SES-${contador}`,
    idRutina: "RUT-0001",
    nombreRutina: "Fuerza A",
    semanaInicio: fecha,
    miembro: "juanpablo",
    duracionRealMin: 60,
    rpe: null,
    tonelajeKg: null,
    totalSeriesHechas: null,
    bloques: [],
    ...rest,
  };
}

function mkBiometria(fcMedia: number, kcal?: number) {
  return {
    fuente: "samsung-health-csv" as const,
    fcMedia,
    kcal,
    matchPor: "dia" as const,
    granularidad: "sesion" as const,
  };
}

describe("compararConPrevias", () => {
  it("mediana con 2 previas", () => {
    const previas = [
      mkHistorial({ fecha: "2026-06-01", biometria: mkBiometria(130) }),
      mkHistorial({ fecha: "2026-06-08", biometria: mkBiometria(126) }),
    ];
    const actual = mkHistorial({ fecha: "2026-07-01", biometria: mkBiometria(120) });
    const c = compararConPrevias(actual, [...previas, actual]);
    expect(c).not.toBeNull();
    expect(c!.fcMediaPrevias).toBe(128); // mediana(130,126)
    expect(c!.sesionesPrevias).toBe(2);
  });

  it("mediana con 3 previas", () => {
    const previas = [
      mkHistorial({ fecha: "2026-06-01", biometria: mkBiometria(130) }),
      mkHistorial({ fecha: "2026-06-08", biometria: mkBiometria(126) }),
      mkHistorial({ fecha: "2026-06-15", biometria: mkBiometria(140) }),
    ];
    const actual = mkHistorial({ fecha: "2026-07-01", biometria: mkBiometria(120) });
    const c = compararConPrevias(actual, [...previas, actual]);
    expect(c!.fcMediaPrevias).toBe(130); // mediana(126,130,140)
    expect(c!.sesionesPrevias).toBe(3);
  });

  it("mediana con 5 previas", () => {
    const previas = [110, 120, 130, 140, 150].map((fc, i) =>
      mkHistorial({ fecha: `2026-06-0${i + 1}`, biometria: mkBiometria(fc) }),
    );
    const actual = mkHistorial({ fecha: "2026-07-01", biometria: mkBiometria(100) });
    const c = compararConPrevias(actual, [...previas, actual]);
    expect(c!.fcMediaPrevias).toBe(130); // mediana(110,120,130,140,150)
    expect(c!.sesionesPrevias).toBe(5);
  });

  it("con menos de 2 previas devuelve null (una sola previa es anécdota)", () => {
    const previas = [mkHistorial({ fecha: "2026-06-01", biometria: mkBiometria(130) })];
    const actual = mkHistorial({ fecha: "2026-07-01", biometria: mkBiometria(120) });
    expect(compararConPrevias(actual, [...previas, actual])).toBeNull();
  });

  it("sin previas devuelve null", () => {
    const actual = mkHistorial({ fecha: "2026-07-01", biometria: mkBiometria(120) });
    expect(compararConPrevias(actual, [actual])).toBeNull();
  });

  it("sesión libre (sin idRutina) devuelve null aunque haya previas con FC", () => {
    const previas = [
      mkHistorial({ fecha: "2026-06-01", biometria: mkBiometria(130) }),
      mkHistorial({ fecha: "2026-06-08", biometria: mkBiometria(126) }),
    ];
    const libre = mkHistorial({ fecha: "2026-07-01", idRutina: undefined, tipo: "libre", biometria: mkBiometria(120) });
    expect(compararConPrevias(libre, [...previas, libre])).toBeNull();
  });

  it("sesión sin FC propia devuelve null", () => {
    const previas = [
      mkHistorial({ fecha: "2026-06-01", biometria: mkBiometria(130) }),
      mkHistorial({ fecha: "2026-06-08", biometria: mkBiometria(126) }),
    ];
    const actual = mkHistorial({ fecha: "2026-07-01" }); // sin biometria
    expect(compararConPrevias(actual, [...previas, actual])).toBeNull();
  });

  it("delta con signo correcto: mejora (bajó) es negativo", () => {
    const previas = [
      mkHistorial({ fecha: "2026-06-01", biometria: mkBiometria(130) }),
      mkHistorial({ fecha: "2026-06-08", biometria: mkBiometria(130) }),
    ];
    const actual = mkHistorial({ fecha: "2026-07-01", biometria: mkBiometria(122) });
    const c = compararConPrevias(actual, [...previas, actual]);
    expect(c!.deltaBpm).toBe(-8);
  });

  it("delta con signo correcto: esfuerzo mayor (subió) es positivo", () => {
    const previas = [
      mkHistorial({ fecha: "2026-06-01", biometria: mkBiometria(120) }),
      mkHistorial({ fecha: "2026-06-08", biometria: mkBiometria(120) }),
    ];
    const actual = mkHistorial({ fecha: "2026-07-01", biometria: mkBiometria(128) });
    const c = compararConPrevias(actual, [...previas, actual]);
    expect(c!.deltaBpm).toBe(8);
  });

  it("kcal omitida en la sesión actual → sin kcalMin (no se inventa)", () => {
    const previas = [
      mkHistorial({ fecha: "2026-06-01", biometria: mkBiometria(130, 400), duracionRealMin: 50 }),
      mkHistorial({ fecha: "2026-06-08", biometria: mkBiometria(126, 380), duracionRealMin: 50 }),
    ];
    const actual = mkHistorial({ fecha: "2026-07-01", biometria: mkBiometria(120) }); // sin kcal
    const c = compararConPrevias(actual, [...previas, actual]);
    expect(c!.kcalMinActual).toBeUndefined();
    expect(c!.kcalMinPrevias).toBeUndefined();
  });

  it("kcal omitida en todas las previas → sin kcalMin", () => {
    const previas = [
      mkHistorial({ fecha: "2026-06-01", biometria: mkBiometria(130) }), // sin kcal
      mkHistorial({ fecha: "2026-06-08", biometria: mkBiometria(126) }), // sin kcal
    ];
    const actual = mkHistorial({ fecha: "2026-07-01", biometria: mkBiometria(120, 400), duracionRealMin: 50 });
    const c = compararConPrevias(actual, [...previas, actual]);
    expect(c!.kcalMinActual).toBeUndefined();
    expect(c!.kcalMinPrevias).toBeUndefined();
  });

  it("con kcal y duración en ambas partes, computa kcalMin", () => {
    const previas = [
      mkHistorial({ fecha: "2026-06-01", biometria: mkBiometria(130, 400), duracionRealMin: 50 }),
      mkHistorial({ fecha: "2026-06-08", biometria: mkBiometria(126, 500), duracionRealMin: 50 }),
    ];
    const actual = mkHistorial({ fecha: "2026-07-01", biometria: mkBiometria(120, 300), duracionRealMin: 50 });
    const c = compararConPrevias(actual, [...previas, actual]);
    expect(c!.kcalMinActual).toBe(6); // 300/50
    expect(c!.kcalMinPrevias).toBe(9); // mediana(8, 10)
  });

  it("solo compara contra previas de la MISMA rutina", () => {
    const otraRutina = mkHistorial({ fecha: "2026-06-01", idRutina: "RUT-0002", biometria: mkBiometria(100) });
    const previas = [
      mkHistorial({ fecha: "2026-06-05", biometria: mkBiometria(130) }),
      mkHistorial({ fecha: "2026-06-08", biometria: mkBiometria(126) }),
    ];
    const actual = mkHistorial({ fecha: "2026-07-01", biometria: mkBiometria(120) });
    const c = compararConPrevias(actual, [otraRutina, ...previas, actual]);
    expect(c!.sesionesPrevias).toBe(2); // no cuenta otraRutina
  });
});

describe("serieCostoRutina", () => {
  it("ordena cronológicamente y excluye sesiones sin biometría", () => {
    const historial = [
      mkHistorial({ fecha: "2026-07-01", biometria: mkBiometria(120) }),
      mkHistorial({ fecha: "2026-06-01", biometria: mkBiometria(130) }),
      mkHistorial({ fecha: "2026-06-15" }), // sin biometría, no aparece
    ];
    const serie = serieCostoRutina("RUT-0001", historial);
    expect(serie.map((p) => p.fecha)).toEqual(["2026-06-01", "2026-07-01"]);
    expect(serie.map((p) => p.fcMedia)).toEqual([130, 120]);
  });

  it("excluye sesiones de otras rutinas", () => {
    const historial = [
      mkHistorial({ fecha: "2026-07-01", idRutina: "RUT-0002", biometria: mkBiometria(120) }),
      mkHistorial({ fecha: "2026-06-01", biometria: mkBiometria(130) }),
    ];
    const serie = serieCostoRutina("RUT-0001", historial);
    expect(serie).toHaveLength(1);
  });

  it("MIN_SESIONES_SECCION es 3", () => {
    expect(MIN_SESIONES_SECCION).toBe(3);
  });
});
