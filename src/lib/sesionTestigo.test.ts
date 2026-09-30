// ════════════════════════════════════════════════════════════════════════════
//  P92c — la sesión testigo. Nuestro cálculo contra una medición externa.
//
//  La sesión de VR del 27/09 está en las capturas de Samsung Health, en el
//  crudo del SDK y en el historial (fixture de datos reales, ver
//  `__fixtures__/sesionTestigo20260927.ts`). Todo pasa por el mismo
//  `calcularEnriquecimiento` que corre la sincronización.
//
//  Si algo de acá deja de coincidir, no se ajusta el test: se entiende por qué.
// ════════════════════════════════════════════════════════════════════════════
import { describe, it, expect } from "vitest";
import { calcularEnriquecimiento } from "./enriquecerImport";
import { totalMinutos } from "./minutosPorZona";
import { pisosDe, zonaPorPiso } from "./zonas";
import {
  avisoDeRecorte, construirBiometriaDeTramos, UMBRAL_AVISO_RECORTE_MIN,
  type SesionSamsung,
} from "./matchBiometrico";
import type { PerfilMiembro, ZonaFC } from "../types/models";
import {
  APP, CURVA, DATAUUID, HISTORIAL, SAMSUNG_APP, SESION_SAMSUNG, ZONAS_PERFIL,
} from "./__fixtures__/sesionTestigo20260927";

const ZONAS: ZonaFC[] = ["Z1", "Z2", "Z3", "Z4", "Z5"];

function enriquecer(zonasFC: PerfilMiembro["zonasFC"]) {
  const perfil = { zonasFC, fcMaxTeorica: 169 } as PerfilMiembro;
  const r = calcularEnriquecimiento([HISTORIAL], {
    sesionesSamsung: [SESION_SAMSUNG],
    liveData: { [DATAUUID]: CURVA },
    shapeUpCustomId: "ShapeUp",
    muestrasFcCrudas: [],
  }, perfil);
  expect(r.updates).toHaveLength(1);
  return r.updates[0].biometria;
}

describe("la sesión testigo del 27/09 (P92c)", () => {
  // 1. Contra Samsung, con los rangos que Samsung usó para esa pantalla. El
  //    perfil de juanpablo tiene los pisos 1 bpm más abajo (Z5 desde 152, no
  //    153): con ellos Z5 da +1,1 min, y eso es de configuración, no de método.
  //    Esa diferencia está reportada, no escondida acá (ultimochat, P92c).
  it("1. los minutos por zona coinciden con los de Samsung, ±1 min por zona", () => {
    const bio = enriquecer(SAMSUNG_APP.rangos);
    for (const z of ZONAS) {
      const nuestro = bio.minutosPorZona?.[z] ?? 0;
      const deSamsung = SAMSUNG_APP.segundosPorZona[z] / 60;
      expect(Math.abs(nuestro - deSamsung), `${z}: ${nuestro} vs ${deSamsung.toFixed(2)}`).toBeLessThanOrEqual(1);
    }
  });

  it("2. la suma cierra: zonas + bajo zonas + sin dato = la ventana usada", () => {
    const bio = enriquecer(ZONAS_PERFIL);
    // Ventana adoptada: la unión de la app y el reloj (la app arrancó antes, el reloj terminó después).
    const inicio = Math.min(APP.inicioMs, SESION_SAMSUNG.startMs);
    const fin = Math.max(APP.finMs, SESION_SAMSUNG.endMs);
    const ventanaMin = Math.round(((fin - inicio) / 60_000) * 10) / 10;
    expect(totalMinutos({ porZona: bio.minutosPorZona!, minutosBajoZonas: bio.minutosBajoZonas!, minutosSinDato: bio.minutosSinDato! }))
      .toBe(ventanaMin);
  });

  it("3. el 170 cae en Z5 (la FC máxima supera el techo de Z5, 169)", () => {
    expect(Math.max(...CURVA.map((p) => p.fc))).toBe(170);
    expect(zonaPorPiso(170, pisosDe({ zonasFC: ZONAS_PERFIL })!)).toBe("Z5");
    expect(zonaPorPiso(170, pisosDe({ zonasFC: SAMSUNG_APP.rangos })!)).toBe("Z5");
    const bio = enriquecer(ZONAS_PERFIL);
    expect(bio.fcMax).toBe(SAMSUNG_APP.fcMax);
    expect(bio.minutosBajoZonas).toBe(0); // nada se pierde por arriba ni por abajo
  });

  it("4. la tolerancia adopta: ventana del reloj, 504 kcal enteras, sin recorte ni aviso", () => {
    const bio = enriquecer(ZONAS_PERFIL);
    expect(bio.ventanaAdoptada).toBe("samsung");
    expect(bio.desfaseDuracionPct).toBeCloseTo(-2.2, 1);   // 47,79 contra 48,85 min
    expect(bio.kcal).toBe(SAMSUNG_APP.kcal);
    expect(bio.kcalEstimada).toBeUndefined();
    expect(bio.finMsEfectivo).toBeUndefined();
    expect(avisoDeRecorte(bio)).toBeNull();
  });

  it("la FC media queda a menos de 1 bpm de la de Samsung", () => {
    const bio = enriquecer(ZONAS_PERFIL);
    expect(Math.abs(bio.fcMedia! - SAMSUNG_APP.fcMedia)).toBeLessThan(1);
    // Y contra la fila del SDK (sin redondear) es la misma cifra.
    expect(Math.abs(bio.fcMedia! - SESION_SAMSUNG.fcMedia!)).toBeLessThan(0.05);
  });
});

describe("avisoDeRecorte (P92c)", () => {
  const base = { finMsEfectivo: 1 };

  it("nombra el principio cuando lo recortado es el principio", () => {
    expect(avisoDeRecorte({ ...base, recorteAntesMin: 3.5 }))
      .toBe("El reloj arrancó 3,5 min antes que la sesión — esa parte no se cuenta.");
  });
  it("nombra el final cuando el reloj siguió grabando", () => {
    expect(avisoDeRecorte({ ...base, recorteDespuesMin: 20 }))
      .toBe("El reloj siguió grabando 20 min después de que terminaste — esa parte no se cuenta.");
  });
  it("los dos extremos, si los dos pasan el umbral", () => {
    expect(avisoDeRecorte({ ...base, recorteAntesMin: 2, recorteDespuesMin: 6.7 }))
      .toBe("El reloj arrancó 2 min antes y siguió 6,7 min después de la sesión — esa parte no se cuenta.");
  });
  it("por segundos no avisa", () => {
    expect(avisoDeRecorte({ ...base, recorteAntesMin: 0.2, recorteDespuesMin: UMBRAL_AVISO_RECORTE_MIN - 0.1 })).toBeNull();
  });
  it("sin recorte, o sin saber qué extremo (sesión anterior a P92c), no avisa", () => {
    expect(avisoDeRecorte({})).toBeNull();
    expect(avisoDeRecorte({ finMsEfectivo: 1 })).toBeNull();
  });

  it("construirBiometriaDeTramos mide cada extremo por separado", () => {
    // Como el 18/09: el reloj arrancó 42 s antes y siguió 6,7 min (desfase > 12 %, no adopta).
    const app = { inicioMs: 1_000_000, finMs: 1_000_000 + 53 * 60_000, fecha: "2026-09-18" };
    const sesion: SesionSamsung = {
      datauuid: "u", startMs: app.inicioMs - 42_000, endMs: app.finMs + 402_000,
      customId: "ShapeUp", kcal: 600, fcMedia: 140, fcMax: 170, fcMin: 90, fecha: "2026-09-18",
    } as SesionSamsung;
    const curva = Array.from({ length: 61 * 60 }, (_, i) => ({ ms: sesion.startMs + i * 1000, fc: 140 }));
    const bio = construirBiometriaDeTramos([{ sesion, curva }], "custom-id", app);
    expect(bio.ventanaAdoptada).toBe("app");
    expect(bio.recorteAntesMin).toBe(0.7);
    expect(bio.recorteDespuesMin).toBe(6.7);
    expect(avisoDeRecorte(bio)).toBe("El reloj siguió grabando 6,7 min después de que terminaste — esa parte no se cuenta.");
  });
});
