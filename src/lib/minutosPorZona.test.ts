import { describe, it, expect } from "vitest";
import { minutosPorZona, totalMinutos, MAX_HUECO_ZONA_MS, distribucionPorZona } from "./minutosPorZona";
import type { PerfilMiembro } from "../types/models";
import type { LiveDataPoint } from "../import/samsungLiveData";

const PERFIL: PerfilMiembro = {
  fcMaxTeorica: 169,
  zonasFC: {
    Z1: { min: 85, max: 101 }, Z2: { min: 101, max: 118 }, Z3: { min: 118, max: 135 },
    Z4: { min: 135, max: 152 }, Z5: { min: 152, max: 169 },
  },
};
const T0 = 1_790_000_000_000;
const MIN = 60_000;

/** Curva de `desdeMin` a `hastaMin`, una muestra cada `pasoS` segundos, FC fija. */
function tramo(desdeMin: number, hastaMin: number, fc: number, pasoS = 1): LiveDataPoint[] {
  const out: LiveDataPoint[] = [];
  for (let ms = desdeMin * MIN; ms <= hastaMin * MIN; ms += pasoS * 1000) out.push({ ms: T0 + ms, fc });
  return out;
}

describe("minutosPorZona", () => {
  it("una curva entera en una sola zona da esa zona y nada más", () => {
    const r = minutosPorZona(tramo(0, 30, 125), { inicioMs: T0, finMs: T0 + 30 * MIN }, PERFIL)!;
    expect(r).toEqual({ porZona: { Z3: 30 }, minutosBajoZonas: 0, minutosSinDato: 0 });
  });

  it("invariante con muestreo irregular: zonas + bajo zonas + sin dato = ventana", () => {
    // Pasos de 1 s, 7 s y 23 s mezclados, tres zonas y un rato bajo Z1.
    const curva = [...tramo(0, 5, 80, 7), ...tramo(5, 20, 125, 1), ...tramo(20, 33, 145, 23), ...tramo(33, 41, 110, 3)];
    const ventana = { inicioMs: T0 - 2 * MIN, finMs: T0 + 43.5 * MIN };   // bordes sin muestras
    const r = minutosPorZona(curva, ventana, PERFIL)!;
    expect(totalMinutos(r)).toBe(45.5);
    expect(r.minutosBajoZonas).toBeGreaterThan(4);
    expect(r.minutosSinDato).toBeCloseTo(4.5, 1);                          // 2 antes + 2,5 después
    expect(r.porZona.Z3).toBeGreaterThan(14);
  });

  it("un hueco de 5 minutos no se atribuye a ninguna zona: va a sin dato", () => {
    const curva = [...tramo(0, 10, 125), ...tramo(15, 25, 125)];
    const r = minutosPorZona(curva, { inicioMs: T0, finMs: T0 + 25 * MIN }, PERFIL)!;
    expect(r.porZona).toEqual({ Z3: 20 });
    expect(r.minutosSinDato).toBe(5);
    expect(totalMinutos(r)).toBe(25);
  });

  it("un hueco de justo el máximo todavía se atribuye", () => {
    const curva = [{ ms: T0, fc: 125 }, { ms: T0 + MAX_HUECO_ZONA_MS, fc: 125 }];
    expect(minutosPorZona(curva, { inicioMs: T0, finMs: T0 + MIN }, PERFIL)!.porZona).toEqual({ Z3: 1 });
  });

  it("bajo zonas no es sin dato: el descanso tranquilo tiene su propio campo", () => {
    const r = minutosPorZona(tramo(0, 10, 70), { inicioMs: T0, finMs: T0 + 10 * MIN }, PERFIL)!;
    expect(r).toEqual({ porZona: {}, minutosBajoZonas: 10, minutosSinDato: 0 });
  });

  it("cada intervalo va a la zona del PROMEDIO de sus dos puntas", () => {
    // 116 y 120: el promedio (118) alcanza el piso de Z3.
    const curva = [{ ms: T0, fc: 116 }, { ms: T0 + 30_000, fc: 120 }];
    expect(minutosPorZona(curva, { inicioMs: T0, finMs: T0 + 30_000 }, PERFIL)!.porZona).toEqual({ Z3: 0.5 });
  });

  it("sin zonas ni FC máxima en el perfil no devuelve nada", () => {
    expect(minutosPorZona(tramo(0, 10, 125), { inicioMs: T0, finMs: T0 + 10 * MIN }, {})).toBeNull();
    expect(minutosPorZona(tramo(0, 10, 125), { inicioMs: T0, finMs: T0 + 10 * MIN }, undefined)).toBeNull();
  });

  it("sin curva en la ventana: toda la ventana sin dato", () => {
    expect(minutosPorZona([], { inicioMs: T0, finMs: T0 + 10 * MIN }, PERFIL))
      .toEqual({ porZona: {}, minutosBajoZonas: 0, minutosSinDato: 10 });
  });

  it("el redondeo reparte para que la suma cierre", () => {
    // Tres tercios de 1 minuto en tres zonas: 0,33 + 0,33 + 0,33 no cierra; tiene que dar 1,0.
    const curva = [
      { ms: T0, fc: 125 }, { ms: T0 + 20_000, fc: 125 },
      { ms: T0 + 20_001, fc: 145 }, { ms: T0 + 40_000, fc: 145 },
      { ms: T0 + 40_001, fc: 110 }, { ms: T0 + 60_000, fc: 110 },
    ];
    expect(totalMinutos(minutosPorZona(curva, { inicioMs: T0, finMs: T0 + MIN }, PERFIL)!)).toBe(1);
  });
});


describe("distribucionPorZona (CardioTab)", () => {
  it("usa lo medido de la sesión vinculada, una vez aunque tenga dos tramos, y estima el resto aparte", () => {
    const d = distribucionPorZona(
      [
        { idCardio: "CAR-A", zonaPrincipal: "Z3", duracionMin: 50 },   // tramo 1 de la sesión
        { idCardio: "CAR-B", zonaPrincipal: "Z3", duracionMin: 10 },   // tramo 2 de la misma
        { idCardio: "CAR-C", zonaPrincipal: "Z2", duracionMin: 40 },   // caminata suelta
      ],
      [{ biometria: { datauuidSamsung: "A", tramosSamsung: ["A", "B"], minutosPorZona: { Z2: 20, Z4: 30 } } }],
    );
    expect(d.medido).toEqual({ Z2: 20, Z4: 30 });
    expect(d.estimado).toEqual({ Z2: 40 });
    expect(d.totalMedido).toBe(50);
    expect(d.totalEstimado).toBe(40);
  });
});
