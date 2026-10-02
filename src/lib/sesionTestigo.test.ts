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
import { pisosDe, zonaPorPiso, zonasDesdeFcMax } from "./zonas";
import {
  avisoDeRecorte, construirBiometriaDeTramos, UMBRAL_AVISO_RECORTE_MIN, VERSION_ENRIQUECIMIENTO,
  type SesionSamsung,
} from "./matchBiometrico";
import type { PerfilMiembro, ZonaFC } from "../types/models";
import {
  APP, CURVA, DATAUUID, HISTORIAL, SAMSUNG_APP, SESION_SAMSUNG, ZONAS_PERFIL,
} from "./__fixtures__/sesionTestigo20260927";

const ZONAS: ZonaFC[] = ["Z1", "Z2", "Z3", "Z4", "Z5"];

/**
 * Las zonas del perfil de juanpablo corregidas (P97): las de `zonasDesdeFcMax(169)`.
 * `ZONAS_PERFIL` del fixture son las que tenía ese día, con Z5 desde 152.
 */
const ZONAS_CORREGIDAS = zonasDesdeFcMax(169);

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
  // 1. Contra Samsung, con los rangos que Samsung usó para esa pantalla. Hasta
  //    P97 el perfil de juanpablo tenía los pisos 1 bpm más abajo (Z5 desde 152,
  //    no 153): con ellos Z5 daba +1,1 min. Era el redondeo del seed, no el método.
  it("1. los minutos por zona coinciden con los de Samsung, ±1 min por zona", () => {
    const bio = enriquecer(SAMSUNG_APP.rangos);
    for (const z of ZONAS) {
      const nuestro = bio.minutosPorZona?.[z] ?? 0;
      const deSamsung = SAMSUNG_APP.segundosPorZona[z] / 60;
      expect(Math.abs(nuestro - deSamsung), `${z}: ${nuestro} vs ${deSamsung.toFixed(2)}`).toBeLessThanOrEqual(1);
    }
  });

  // P97: el perfil corregido son exactamente los rangos de Samsung, y Z5 vuelve
  // a quedar dentro del minuto (con las zonas viejas daba 5,2 contra 4,08).
  it("P97. con las zonas del perfil corregido, las cinco a ±1 min de Samsung", () => {
    expect(ZONAS_CORREGIDAS).toEqual(SAMSUNG_APP.rangos);
    const bio = enriquecer(ZONAS_CORREGIDAS);
    for (const z of ZONAS) {
      const nuestro = bio.minutosPorZona?.[z] ?? 0;
      const deSamsung = SAMSUNG_APP.segundosPorZona[z] / 60;
      expect(Math.abs(nuestro - deSamsung), `${z}: ${nuestro} vs ${deSamsung.toFixed(2)}`).toBeLessThanOrEqual(1);
    }
    const viejas = enriquecer(ZONAS_PERFIL);
    expect(viejas.minutosPorZona!.Z5! - SAMSUNG_APP.segundosPorZona.Z5 / 60).toBeGreaterThan(1);
  });

  it("P97. la sesión guarda las zonas con que se calculó y el pico suavizado", () => {
    const bio = enriquecer(ZONAS_CORREGIDAS);
    expect(bio.versionEnriquecimiento).toBe(VERSION_ENRIQUECIMIENTO);
    expect(bio.zonasUsadas).toEqual(ZONAS_CORREGIDAS);
    expect(bio.fcMaxUsada).toBe(169);
    // El crudo llega a 170; la media móvil de 5 s, a 168,5.
    expect(bio.fcPicoSuavizado).toBe(169);
  });

  it("2. la suma cierra: zonas + bajo zonas + sin dato = la ventana usada", () => {
    const bio = enriquecer(ZONAS_CORREGIDAS);
    // Ventana adoptada: la unión de la app y el reloj (la app arrancó antes, el reloj terminó después).
    const inicio = Math.min(APP.inicioMs, SESION_SAMSUNG.startMs);
    const fin = Math.max(APP.finMs, SESION_SAMSUNG.endMs);
    const ventanaMin = Math.round(((fin - inicio) / 60_000) * 10) / 10;
    expect(totalMinutos({ porZona: bio.minutosPorZona!, minutosBajoZonas: bio.minutosBajoZonas!, minutosSinDato: bio.minutosSinDato! }))
      .toBe(ventanaMin);
  });

  it("3. el 170 cae en Z5 (la FC máxima supera el techo de Z5, 169)", () => {
    expect(Math.max(...CURVA.map((p) => p.fc))).toBe(170);
    expect(zonaPorPiso(170, pisosDe({ zonasFC: ZONAS_CORREGIDAS })!)).toBe("Z5");
    expect(zonaPorPiso(170, pisosDe({ zonasFC: SAMSUNG_APP.rangos })!)).toBe("Z5");
    const bio = enriquecer(ZONAS_CORREGIDAS);
    expect(bio.fcMax).toBe(SAMSUNG_APP.fcMax);
    expect(bio.minutosBajoZonas).toBe(0); // nada se pierde por arriba ni por abajo
  });

  it("4. la tolerancia adopta: ventana del reloj, 504 kcal enteras, sin recorte ni aviso", () => {
    const bio = enriquecer(ZONAS_CORREGIDAS);
    expect(bio.ventanaAdoptada).toBe("samsung");
    expect(bio.desfaseDuracionPct).toBeCloseTo(-2.2, 1);   // 47,79 contra 48,85 min
    expect(bio.kcal).toBe(SAMSUNG_APP.kcal);
    expect(bio.kcalEstimada).toBeUndefined();
    expect(bio.finMsEfectivo).toBeUndefined();
    expect(avisoDeRecorte(bio)).toBeNull();
  });

  it("la FC media queda a menos de 1 bpm de la de Samsung", () => {
    const bio = enriquecer(ZONAS_CORREGIDAS);
    expect(Math.abs(bio.fcMedia! - SAMSUNG_APP.fcMedia)).toBeLessThan(1);
    // Y contra la fila del SDK (sin redondear) es la misma cifra.
    expect(Math.abs(bio.fcMedia! - SESION_SAMSUNG.fcMedia!)).toBeLessThan(0.05);
  });
});

describe("la historia no se reescribe (P97, decisión 5)", () => {
  const extraccion = {
    sesionesSamsung: [SESION_SAMSUNG],
    liveData: { [DATAUUID]: CURVA },
    shapeUpCustomId: "ShapeUp",
    muestrasFcCrudas: [],
  };
  const conFcMax = (fc: number) => ({ fcMaxTeorica: fc, zonasFC: zonasDesdeFcMax(fc) }) as PerfilMiembro;

  it("cambiar la FC máxima cambia las zonas solo de las sesiones que vienen", () => {
    // La sesión se enriqueció con 169.
    const antes = calcularEnriquecimiento([HISTORIAL], extraccion, conFcMax(169)).updates[0].biometria;
    // Después la FC máxima pasó a 180, y un algoritmo nuevo vuelve a enriquecer
    // todo (se simula con una versión vieja): la sesión conserva sus zonas.
    const pasada = {
      ...HISTORIAL,
      biometria: { ...antes, versionEnriquecimiento: VERSION_ENRIQUECIMIENTO - 1 },
    } as typeof HISTORIAL;
    const rehecha = calcularEnriquecimiento([pasada], extraccion, conFcMax(180)).updates[0].biometria;
    expect(rehecha.zonasUsadas).toEqual(zonasDesdeFcMax(169));
    expect(rehecha.fcMaxUsada).toBe(169);
    expect(rehecha.minutosPorZona).toEqual(antes.minutosPorZona);
    expect(rehecha.zonaPrincipal).toBe(antes.zonaPrincipal);

    // Una sesión nueva, sin biometría, sí toma las zonas de 180.
    const nueva = calcularEnriquecimiento([HISTORIAL], extraccion, conFcMax(180)).updates[0].biometria;
    expect(nueva.zonasUsadas).toEqual(zonasDesdeFcMax(180));
    expect(nueva.minutosPorZona).not.toEqual(antes.minutosPorZona);
  });

  it("una sesión anterior a P97 (sin zonasUsadas) se rehace con las zonas del perfil: la corrección del 152", () => {
    const vieja = enriquecer(ZONAS_PERFIL);
    const { zonasUsadas: _z, fcMaxUsada: _f, ...sinMarca } = vieja;
    const pasada = { ...HISTORIAL, biometria: { ...sinMarca, versionEnriquecimiento: 7 } } as typeof HISTORIAL;
    const rehecha = calcularEnriquecimiento([pasada], extraccion, conFcMax(169)).updates[0].biometria;
    expect(rehecha.zonasUsadas).toEqual(ZONAS_CORREGIDAS);
    expect(rehecha.versionEnriquecimiento).toBe(8);
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
