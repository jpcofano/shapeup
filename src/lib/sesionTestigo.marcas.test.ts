// ════════════════════════════════════════════════════════════════════════════
//  P99 — las marcas de la sesión testigo del 27/09, por el camino real.
//
//  La curva y las marcas de la curva salen del enriquecimiento (la versión que
//  corre la sincronización); las demás, de `marcasDeSesion` al mostrar. Los
//  valores son la tabla de la Parte 1 de P99 (con `zonasDesdeFcMax(169)` y la
//  ventana del análisis: la unión de la app y el reloj), calculada aparte con
//  un script de solo lectura sobre el mismo fixture.
//
//  Si algo deja de coincidir, no se ajusta el test: se entiende por qué.
// ════════════════════════════════════════════════════════════════════════════
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { calcularEnriquecimiento } from "./enriquecerImport";
import { marcasDeSesion, textoMarca } from "./marcasSesion";
import { zonasDesdeFcMax } from "./zonas";
import { VERSION_ENRIQUECIMIENTO } from "./matchBiometrico";
import { armarPaqueteSesion } from "./paqueteAnalisis";
import { validarAnalisisSesion, contextoValidacion } from "./validarAnalisis";
import { analisisParaGuardar, TOPE_PAQUETE_BYTES, ventanaDelAnalisis } from "./analisis";
import type { Historial, MarcaSesion, PerfilMiembro } from "../types/models";
import { CURVA, DATAUUID, HISTORIAL, SESION_SAMSUNG } from "./__fixtures__/sesionTestigo20260927";

const PERFIL = { fcMaxTeorica: 169, zonasFC: zonasDesdeFcMax(169) } as PerfilMiembro;
const EXTRACCION = {
  sesionesSamsung: [SESION_SAMSUNG], liveData: { [DATAUUID]: CURVA }, shapeUpCustomId: "ShapeUp", muestrasFcCrudas: [],
};

function enriquecida(base: Historial = HISTORIAL): Historial {
  const u = calcularEnriquecimiento([base], EXTRACCION, PERFIL).updates[0];
  return { ...base, biometria: u.biometria, bloques: u.bloques ?? base.bloques };
}

const H = enriquecida();
const MARCAS = marcasDeSesion(H, { historial: [H] });
function marca<I extends MarcaSesion["id"]>(id: I): Extract<MarcaSesion, { id: I }> | undefined {
  return MARCAS.find((m) => m.id === id) as Extract<MarcaSesion, { id: I }> | undefined;
}

describe("P99 — la curva guardada de la testigo", () => {
  it("se guarda a 30 s desde el inicio de la ventana, con la versión 9", () => {
    const c = H.biometria!.curva!;
    expect(H.biometria!.versionEnriquecimiento).toBe(VERSION_ENRIQUECIMIENTO);
    expect(VERSION_ENRIQUECIMIENTO).toBe(9);
    expect(c.pasoSeg).toBe(30);
    expect(c.origenMs).toBe(HISTORIAL.inicioMs);
    expect(c.seg[0]).toBe(60);                 // el reloj arrancó a los 73,5 s
    expect(c.seg.length).toBe(c.fc.length);
    expect(c.seg.length).toBeGreaterThan(90);
    expect(c.seg.length).toBeLessThanOrEqual(99);
  });

  it("sin listas dentro de listas ni claves undefined: Firestore lo acepta", () => {
    const recorrer = (v: unknown, enLista: boolean): void => {
      if (Array.isArray(v)) {
        expect(enLista, "lista dentro de lista").toBe(false);
        v.forEach((x) => recorrer(x, true));
      } else if (v && typeof v === "object") {
        for (const [k, x] of Object.entries(v)) {
          expect(x, `clave ${k} undefined`).not.toBeUndefined();
          recorrer(x, false);
        }
      }
    };
    recorrer(H.biometria, false);
  });
});

describe("P99 — la tabla de valores de la testigo", () => {
  it("calidad, picoSobreVigente, tramoBajo y recuperacionFinal no aparecen", () => {
    expect(marca("calidad")).toBeUndefined();          // coberturaFina 0,976, fcDudosa falso
    expect(marca("picoSobreVigente")).toBeUndefined(); // suavizado 169 = fcMaxUsada 169
    expect(marca("tramoBajo")).toBeUndefined();        // el más largo dura 3 s
    expect(MARCAS.map((m) => m.id)).not.toContain("recuperacionFinal");
  });

  it("carga 172,8 y zona alta 32,0 min · 67 %", () => {
    expect(marca("carga")).toMatchObject({ nivel: 1, valor: 172.8 });
    expect(marca("zonaAlta")).toMatchObject({ nivel: 1, minutos: 32, pct: 67 });
    expect(marca("volumen")).toBeUndefined();
  });

  it("tramo sostenido de 30:06 a 48:02", () => {
    const t = marca("tramoSostenido")!;
    expect(t.tramo).toEqual({ inicioS: 1806, finS: 2882 });
    expect(Math.abs(t.duracionSeg - 1076)).toBeLessThanOrEqual(1);
  });

  it("mitades 140,0 → 145,5 (+5,5), con el corte en 28:54", () => {
    expect(marca("mitades")).toMatchObject({ primera: 140, segunda: 145.5, diferencia: 5.5 });
    expect(Math.abs(marca("mitades")!.corteS - 1734)).toBeLessThanOrEqual(1);
  });

  it("5 bajadas de 15 bpm o más; la mayor, −30 a los 60 s, es la única sobre la curva", () => {
    const r = marca("recuperacionSeries")!;
    expect(r.bajadas).toHaveLength(5);
    const esperados = [609, 1404, 1609, 2269, 2853];   // 10:09, 23:24, 26:49, 37:49, 47:33
    r.bajadas.forEach((b, i) => expect(Math.abs(b.picoS - esperados[i])).toBeLessThanOrEqual(2));
    expect(r.mayor).toMatchObject({ caida: 30, enSeg: 60 });
    expect(r.bajadas[4].caida120).toBeNull();
    expect(r.tramo).toEqual({ inicioS: r.mayor!.picoS, finS: r.mayor!.picoS + 60 });
    expect(textoMarca(r)).toBe("5 bajadas · mayor −30 en 60 s");
  });

  it("picos en Z5: 5, la más larga de 1:07 desde 37:08", () => {
    const z = marca("picosZ5")!;
    expect(z).toMatchObject({ entradas: 5, masLargaSeg: 67 });
    expect(Math.abs(z.tramo!.inicioS - 2228)).toBeLessThanOrEqual(2);
  });

  it("entrada en calor 8:51 y pico 169 (crudo 170)", () => {
    expect(marca("entradaEnCalor")).toMatchObject({ segundos: 531, tramo: { inicioS: 0, finS: 531 } });
    expect(marca("pico")).toMatchObject({ nivel: 2, suavizado: 169, crudo: 170 });
    // El mismo número que usa la estimación de la FC máxima (P97): la curva de la
    // testigo tiene 3 muestras con el mismo milisegundo, y deduplicando daba 168.
    expect(marca("pico")!.suavizado).toBe(H.biometria!.fcPicoSuavizado);
  });

  it("récord y semana dependen del historial: solos no aparecen; con la meta guardada, «1 de 5 · sin fuerza»", () => {
    expect(marca("record")).toBeUndefined();
    expect(marca("semana")).toBeUndefined();
    const conPlan: Historial = { ...H, planSemana: { metaDias: 5, idPrograma: "PRG-0004" } };
    const semana = marcasDeSesion(conPlan, { historial: [conPlan] }).find((m) => m.id === "semana")!;
    expect(textoMarca(semana)).toBe("1 de 5 · sin fuerza");
  });

  it("el orden es el del catálogo", () => {
    expect(MARCAS.map((m) => m.id)).toEqual([
      "carga", "zonaAlta", "tramoSostenido", "mitades", "recuperacionSeries", "picosZ5", "entradaEnCalor", "pico",
    ]);
  });
});

describe("P99 — un análisis guardado sigue apuntando a marcas que existen", () => {
  const analisis = {
    version: 3, tipo: "sesion", idHist: H.idHist, generadoEn: "2026-10-19", modelo: "prueba",
    veredicto: "Sesión sólida, casi toda en Z4.",
    destacados: ["Sostuviste casi 18 minutos arriba de Z4.", "Bajaste bien después de los picos."],
    marcasAnalisis: [
      { refMarca: "tramoSostenido", tono: "positivo", texto: "El tramo más largo de la sesión." },
      { refMarca: "recuperacionSeries", tono: "positivo", texto: "Recuperación rápida." },
      { inicioS: 480, finS: 1320, tono: "atencion", texto: "Acá la FC se quedó abajo." },
    ],
    resumen: "Hiciste casi 49 minutos de VR. La mayor parte en Z4.",
    hallazgos: [{ tema: "intensidad", detalle: "Mucho tiempo arriba.", evidencia: "zona alta 32 min" }],
    sugerencias: [], banderas: [], preguntas: [], datosFaltantes: [],
  };

  it("se valida contra las marcas recalculadas de la misma sesión, también después de re-enriquecerla", () => {
    const ctx = contextoValidacion(H, [H]);
    const con = { ...analisis, armado: ctx.armado };
    const v = validarAnalisisSesion(JSON.stringify(con), H.idHist, ctx);
    expect(v.ok).toBe(true);
    if (!v.ok) return;
    const guardado = analisisParaGuardar(v.value, H, 1);

    // Un algoritmo nuevo vuelve a enriquecer (se simula con una versión vieja):
    // las marcas se recalculan y los ids a los que apunta el análisis siguen ahí.
    const vieja: Historial = { ...H, biometria: { ...H.biometria!, versionEnriquecimiento: 8 } };
    const rehecha = enriquecida(vieja);
    const ids = marcasDeSesion(rehecha, { historial: [rehecha] }).map((m) => m.id);
    for (const m of guardado.marcasAnalisis ?? []) if (m.refMarca) expect(ids).toContain(m.refMarca);
    const otraVez = validarAnalisisSesion(JSON.stringify(con), rehecha.idHist, contextoValidacion(rehecha, [rehecha]));
    expect(otraVez.ok).toBe(true);
  });
});

describe("P99 — el paquete de la testigo con el prompt v4", () => {
  it("entra holgado en el tope y lleva las marcas", () => {
    const prompt = readFileSync("docs/analisis/prompt-sesion-v4.md", "utf8");
    const p = armarPaqueteSesion({ sesion: H, contexto: { historial: [H], perfil: PERFIL }, curva: null, prompt });
    expect(p.recortes).toEqual([]);
    expect(p.bytes).toBeLessThan(TOPE_PAQUETE_BYTES / 2);
    expect(p.datos.marcas.map((m) => m.id)).toEqual(MARCAS.map((m) => m.id));
    // Sueño y FC de reposo: el campo existe y, sin dato importado de ese día, va null.
    expect((p.datos.contexto as { dia: Record<string, unknown> }).dia).toMatchObject({ suenoNocheAnteriorH: null, fcReposo: null });
  });
});

describe("P99 — con el reloj cortado y reanudado (dos tramos), la misma ventana en todo", () => {
  it("la ventana del análisis es la unión de los dos tramos, como la de la biometría", () => {
    const medio = SESION_SAMSUNG.startMs + Math.round((SESION_SAMSUNG.endMs - SESION_SAMSUNG.startMs) / 2);
    const a = { ...SESION_SAMSUNG, datauuid: "tramo-a", endMs: medio, duracionDeclaradaMs: medio - SESION_SAMSUNG.startMs };
    const b = { ...SESION_SAMSUNG, datauuid: "tramo-b", startMs: medio + 1000, duracionDeclaradaMs: SESION_SAMSUNG.endMs - medio - 1000 };
    const u = calcularEnriquecimiento([HISTORIAL], {
      sesionesSamsung: [a, b],
      liveData: { "tramo-a": CURVA.filter((p) => p.ms <= medio), "tramo-b": CURVA.filter((p) => p.ms > medio) },
      shapeUpCustomId: "ShapeUp", muestrasFcCrudas: [],
    }, PERFIL).updates[0];
    const h: Historial = { ...HISTORIAL, biometria: u.biometria, bloques: u.bloques ?? HISTORIAL.bloques };
    expect(u.biometria.tramosSamsung).toHaveLength(2);
    expect(u.biometria.ventanaAdoptada).toBe("samsung");
    expect(u.biometria.samsung).toMatchObject({ unionInicioMs: SESION_SAMSUNG.startMs, unionFinMs: SESION_SAMSUNG.endMs });
    const ventana = ventanaDelAnalisis(h)!;
    expect(ventana.finMs).toBe(SESION_SAMSUNG.endMs);     // antes: el fin del primer tramo
    const pico = (h.biometria!.marcas ?? []).find((m) => m.id === "pico" || m.id === "picoSobreVigente") as { suavizado: number } | undefined;
    expect(pico?.suavizado).toBe(h.biometria!.fcPicoSuavizado);
    expect(h.biometria!.curva!.seg.at(-1)).toBeGreaterThan(2900);
  });
});
