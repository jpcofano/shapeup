// ════════════════════════════════════════════════════════════════════════════
//  P99 — la geometría de la curva de la sesión y las marcas dibujables.
//  Curvas sintéticas para escalas y bordes; la sesión testigo del 27/09 por el
//  camino real del enriquecimiento.
// ════════════════════════════════════════════════════════════════════════════
import { describe, it, expect } from "vitest";
import { geometriaCurva, pasoDeTiempoMin, marcasDibujables } from "./curvaSesion";
import { calcularEnriquecimiento } from "./enriquecerImport";
import { textoMarca } from "./marcasSesion";
import { zonasDesdeFcMax } from "./zonas";
import { ventanaDelAnalisis } from "./analisis";
import type { CurvaGuardada, Historial, MarcaAnalisis, MarcaSesion, PerfilMiembro } from "../types/models";
import { CURVA, DATAUUID, HISTORIAL, SESION_SAMSUNG } from "./__fixtures__/sesionTestigo20260927";

const ORIGEN = 1_800_000_000_000;
const curvaSint = (seg: number[], fc: number[], origenMs = ORIGEN): CurvaGuardada => ({ origenMs, pasoSeg: 30, seg, fc });

describe("geometriaCurva — escalas y bordes", () => {
  const g = geometriaCurva({
    curva: curvaSint([0, 30, 60, 90], [100, 120, 140, 130]),
    ventanaInicioMs: ORIGEN, duracionS: 120,
  })!;

  it("eje Y con 5 bpm de aire, a múltiplos de 5; eje X de 0 a la duración", () => {
    expect(g.fcMin).toBe(95);
    expect(g.fcMax).toBe(145);
    expect(g.duracionS).toBe(120);
    expect(g.ancho).toBe(340);
    expect(g.alto).toBe(140);
    expect(g.x(0)).toBe(0);
    expect(g.x(120)).toBe(340);
    expect(g.y(145)).toBe(0);     // arriba = más alto
    expect(g.y(95)).toBe(140);
  });

  it("un solo segmento 'M … L …' con coordenadas de 1 decimal", () => {
    expect(g.segmentos).toHaveLength(1);
    expect(g.segmentos[0].startsWith("M 0 ")).toBe(true);
    expect(g.segmentos[0].match(/L/g)).toHaveLength(3);
    for (const n of g.segmentos[0].match(/-?\d+(\.\d+)?/g) ?? []) expect(n).toMatch(/^-?\d+(\.\d)?$/);
  });

  it("redondea el eje: abajo hacia abajo, arriba hacia arriba", () => {
    const h = geometriaCurva({ curva: curvaSint([0, 30], [103, 138]), ventanaInicioMs: ORIGEN })!;
    expect(h.fcMin).toBe(95);    // 98 → 95
    expect(h.fcMax).toBe(145);   // 143 → 145
  });

  it("sin duracionS, usa la de la curva: último seg + paso", () => {
    const h = geometriaCurva({ curva: curvaSint([0, 30, 60], [100, 110, 120]), ventanaInicioMs: ORIGEN })!;
    expect(h.duracionS).toBe(90);
  });

  it("los bordes de Z1 y Z5 ensanchan el eje", () => {
    const h = geometriaCurva({
      curva: curvaSint([0, 30], [120, 130]), ventanaInicioMs: ORIGEN, duracionS: 60,
      zonas: { Z1: { min: 90, max: 110 }, Z5: { min: 150, max: 169 } },
    })!;
    expect(h.fcMin).toBe(85);
    expect(h.fcMax).toBe(175);
  });

  it("curva vacía → null", () => {
    expect(geometriaCurva({ curva: curvaSint([], []), ventanaInicioMs: ORIGEN })).toBeNull();
  });
});

describe("geometriaCurva — huecos y desplazamiento", () => {
  it("un hueco de más de 2 × paso corta el segmento; uno de justo 2 × paso no", () => {
    const g = geometriaCurva({
      curva: curvaSint([0, 30, 60, 150, 180, 240], [100, 110, 120, 130, 140, 150]),
      ventanaInicioMs: ORIGEN, duracionS: 300,
    })!;
    // 60 → 150 son 90 s (> 60): corta. 180 → 240 son 60 s: no corta.
    expect(g.segmentos).toHaveLength(2);
    expect(g.segmentos[0].match(/L/g)).toHaveLength(2);
    expect(g.segmentos[1].match(/L/g)).toHaveLength(2);
  });

  it("un punto aislado deja un segmento válido", () => {
    const g = geometriaCurva({ curva: curvaSint([0, 300], [100, 120]), ventanaInicioMs: ORIGEN, duracionS: 330 })!;
    expect(g.segmentos).toHaveLength(2);
    expect(g.segmentos[0]).toMatch(/^M [\d.]+ [\d.]+ L [\d.]+ [\d.]+$/);
  });

  it("el desplazamiento entre origenMs y la ventana corre la curva", () => {
    // La curva arranca 60 s después que la ventana: su seg 0 es el 60 de la ventana.
    const g = geometriaCurva({
      curva: curvaSint([0, 30], [100, 120], ORIGEN + 60_000),
      ventanaInicioMs: ORIGEN, duracionS: 120,
    })!;
    expect(g.segmentos[0].startsWith(`M ${g.x(60)} `)).toBe(true);
    expect(g.segmentos[0]).toContain(`L ${g.x(90)} `);
    expect(g.x(60)).toBe(170);
  });

  it("sin duracionS, el desplazamiento cuenta en la duración", () => {
    const g = geometriaCurva({ curva: curvaSint([0, 30], [100, 120], ORIGEN + 60_000), ventanaInicioMs: ORIGEN })!;
    expect(g.duracionS).toBe(120);   // 30 + 30 + 60
  });
});

describe("geometriaCurva — bandas", () => {
  const zonas = {
    Z1: { min: 80, max: 100 }, Z2: { min: 100, max: 120 }, Z3: { min: 120, max: 140 },
    Z4: { min: 140, max: 160 }, Z5: { min: 160, max: 180 },
  };

  it("una por zona presente, de Z1 a Z5, dentro del eje", () => {
    const g = geometriaCurva({ curva: curvaSint([0, 30], [90, 170]), ventanaInicioMs: ORIGEN, duracionS: 60, zonas })!;
    expect(g.bandas.map((b) => b.zona)).toEqual(["Z1", "Z2", "Z3", "Z4", "Z5"]);
    for (const b of g.bandas) {
      expect(b.y).toBeGreaterThanOrEqual(0);
      expect(b.y + b.alto).toBeLessThanOrEqual(g.alto + 0.11);
    }
    // Z1 y Z5 definen el eje (75 → 185): ocupan el eje por completo entre ambas.
    expect(g.bandas[4].y).toBeCloseTo(g.y(180), 1);
  });

  it("se recortan al eje Y y las que quedan afuera no se pintan", () => {
    const g = geometriaCurva({
      curva: curvaSint([0, 30], [110, 130]), ventanaInicioMs: ORIGEN, duracionS: 60,
      zonas: { Z3: { min: 120, max: 200 }, Z5: { min: 300, max: 320 } },
    })!;
    // Z5 ensancha el eje hasta 325; Z3 queda entera. Probamos el recorte con solo Z3:
    expect(g.bandas.map((b) => b.zona)).toEqual(["Z3", "Z5"]);
    const solo = geometriaCurva({
      curva: curvaSint([0, 30], [110, 130]), ventanaInicioMs: ORIGEN, duracionS: 60,
      zonas: { Z2: { min: 50, max: 112 }, Z4: { min: 400, max: 450 + 0 } },
    })!;
    const z2 = solo.bandas.find((b) => b.zona === "Z2")!;
    expect(z2.y + z2.alto).toBeLessThanOrEqual(solo.alto + 0.11);
    const g2 = geometriaCurva({
      curva: curvaSint([0, 30], [110, 130]), ventanaInicioMs: ORIGEN, duracionS: 60,
      zonas: { Z1: { min: 60, max: 70 } },
    })!;
    expect(g2.bandas).toHaveLength(1);   // Z1 define el eje: entra
    const g3 = geometriaCurva({
      curva: curvaSint([0, 30], [110, 130]), ventanaInicioMs: ORIGEN, duracionS: 60,
      zonas: { Z2: { min: 10, max: 20 } },
    })!;
    expect(g3.bandas).toEqual([]);       // fuera del eje: no se pinta
  });
});

describe("marcasDibujables", () => {
  const texto = (m: MarcaSesion): string => `texto ${m.id}`;
  const sostenido = { id: "tramoSostenido", nivel: 2, duracionSeg: 1076, tramo: { inicioS: 1806, finS: 2882 } } as MarcaSesion;
  const pico = { id: "pico", nivel: 2, suavizado: 169, crudo: 170, tramo: { inicioS: 2000, finS: 2000 } } as MarcaSesion;
  const carga = { id: "carga", nivel: 1, valor: 172.8 } as MarcaSesion;
  const APP = [carga, sostenido, pico];

  it("las de la app sin tramo no se dibujan; tramo vs momento", () => {
    const r = marcasDibujables(APP, undefined, texto, 3000);
    expect(r.map((m) => m.idMarca)).toEqual(["tramoSostenido", "pico"]);
    expect(r[0]).toMatchObject({ origen: "app", tipo: "tramo", inicioS: 1806, finS: 2882, texto: "texto tramoSostenido" });
    expect(r[1]).toMatchObject({ origen: "app", tipo: "momento", inicioS: 2000, finS: 2000 });
    expect("tono" in r[0]).toBe(false);
    expect("indiceAnalisis" in r[0]).toBe(false);
  });

  it("una refMarca del análisis se dibuja sobre la marca de la app correcta", () => {
    const an: MarcaAnalisis[] = [{ refMarca: "tramoSostenido", tono: "positivo", texto: "El tramo más largo." }];
    const r = marcasDibujables(APP, an, texto, 3000);
    const app = r.find((m) => m.origen === "app" && m.idMarca === "tramoSostenido")!;
    const ana = r.find((m) => m.origen === "analisis")!;
    expect(ana.inicioS).toBe(app.inicioS);
    expect(ana.finS).toBe(app.finS);
    expect(ana).toMatchObject({ idMarca: "tramoSostenido", indiceAnalisis: 0, tono: "positivo", texto: "El tramo más largo.", tipo: "tramo" });
  });

  it("refMarca a una marca sin tramo o inexistente no se dibuja", () => {
    const an: MarcaAnalisis[] = [
      { refMarca: "carga", tono: "positivo", texto: "sin tramo" },
      { refMarca: "mitades", tono: "atencion", texto: "inexistente" },
    ];
    expect(marcasDibujables(APP, an, texto, 3000).filter((m) => m.origen === "analisis")).toEqual([]);
  });

  it("tramo propio del análisis, con su índice", () => {
    const an: MarcaAnalisis[] = [
      { refMarca: "carga", tono: "positivo", texto: "x" },
      { tramo: { inicioS: 480, finS: 1320 }, tono: "atencion", texto: "Se quedó abajo." },
    ];
    const ana = marcasDibujables(APP, an, texto, 3000).filter((m) => m.origen === "analisis");
    expect(ana).toHaveLength(1);
    expect(ana[0]).toMatchObject({ indiceAnalisis: 1, inicioS: 480, finS: 1320, tono: "atencion", tipo: "tramo" });
    expect("idMarca" in ana[0]).toBe(false);
  });

  it("recorta a la ventana y descarta lo que queda vacío", () => {
    const an: MarcaAnalisis[] = [
      { tramo: { inicioS: -50, finS: 100 }, tono: "positivo", texto: "borde izquierdo" },
      { tramo: { inicioS: 900, finS: 5000 }, tono: "positivo", texto: "borde derecho" },
      { tramo: { inicioS: 1200, finS: 1500 }, tono: "positivo", texto: "afuera" },
      { tramo: { inicioS: -20, finS: 0 }, tono: "positivo", texto: "vacío al recortar" },
    ];
    const r = marcasDibujables([], an, texto, 1000);
    expect(r.map((m) => [m.inicioS, m.finS])).toEqual([[0, 100], [900, 1000]]);
    const m = marcasDibujables([pico, sostenido], undefined, texto, 1900);
    expect(m.map((x) => x.idMarca)).toEqual(["tramoSostenido"]);   // el pico (2000) queda afuera
    expect(m[0].finS).toBe(1900);
  });
});

describe("la sesión testigo del 27/09", () => {
  const PERFIL = { fcMaxTeorica: 169, zonasFC: zonasDesdeFcMax(169) } as PerfilMiembro;
  const u = calcularEnriquecimiento([HISTORIAL], {
    sesionesSamsung: [SESION_SAMSUNG], liveData: { [DATAUUID]: CURVA }, shapeUpCustomId: "ShapeUp", muestrasFcCrudas: [],
  }, PERFIL).updates[0];
  const H: Historial = { ...HISTORIAL, biometria: u.biometria, bloques: u.bloques ?? HISTORIAL.bloques };
  const ventana = ventanaDelAnalisis(H)!;

  it("la geometría de su curva existe y cabe en el viewBox", () => {
    const g = geometriaCurva({
      curva: H.biometria!.curva!, ventanaInicioMs: ventana.inicioMs,
      duracionS: Math.round((ventana.finMs - ventana.inicioMs) / 1000), zonas: PERFIL.zonasFC as never,
    });
    expect(g).not.toBeNull();
    expect(g!.segmentos.length).toBeGreaterThan(0);
    expect(g!.fcMax).toBeGreaterThanOrEqual(170);
    expect(g!.bandas.length).toBeGreaterThan(0);
  });

  it("sus marcas incluyen el tramo sostenido (tramo) y el pico (momento)", () => {
    const marcas = H.biometria!.marcas ?? [];
    const dur = Math.round((ventana.finMs - ventana.inicioMs) / 1000);
    const r = marcasDibujables(marcas, undefined, textoMarca, dur);
    expect(r.find((m) => m.idMarca === "tramoSostenido")).toMatchObject({ tipo: "tramo", inicioS: 1806, finS: 2882 });
    expect(r.find((m) => m.idMarca === "pico")?.tipo).toBe("momento");
  });
});

// ── P109: la curva por zona, las guías, el eje de tiempo y el punto ───────────
describe("geometriaCurva — por zona (P109)", () => {
  const ZONAS = { Z1: { min: 84, max: 101 }, Z2: { min: 102, max: 118 }, Z3: { min: 119, max: 135 }, Z4: { min: 136, max: 152 }, Z5: { min: 153, max: 169 } };
  const curva = (fc: number[], seg = fc.map((_, i) => i * 30)) =>
    ({ origenMs: 1_000_000, pasoSeg: 30, seg, fc }) as never;
  const g = (fc: number[], seg?: number[], duracionS?: number) =>
    geometriaCurva({ curva: curva(fc, seg), ventanaInicioMs: 1_000_000, zonas: ZONAS, duracionS })!;

  it("corta donde cambia la zona y el punto del cambio queda en los dos tramos", () => {
    const r = g([110, 112, 125, 140, 141]);
    expect(r.tramos.map((t) => t.zona)).toEqual(["Z2", "Z3", "Z4"]);
    const ultimo = (t: { puntos: string }) => t.puntos.split(" ").at(-1);
    const primero = (t: { puntos: string }) => t.puntos.split(" ")[0];
    expect(ultimo(r.tramos[0])).toBe(primero(r.tramos[1]));
  });

  it("debajo de Z1 la zona es null", () => {
    expect(g([70, 72, 90]).tramos.map((t) => t.zona)).toEqual([null, "Z1"]);
  });

  it("un hueco corta también la curva por zona", () => {
    const r = g([110, 111, 112, 113], [0, 30, 300, 330]);
    expect(r.tramos).toHaveLength(2);
    expect(r.tramos.every((t) => t.zona === "Z2")).toBe(true);
  });

  it("las guías son los pisos y el techo de Z5 dentro del eje, de arriba hacia abajo", () => {
    const r = g([90, 160]);
    expect(r.guias.map((x) => x.fc)).toEqual([169, 153, 136, 119, 102, 84]);
  });

  it("el eje de tiempo: cada 12 min en una sesión de 48, y la duración al final", () => {
    const fc = Array.from({ length: 98 }, () => 120);
    const r = g(fc, undefined, 48 * 60 + 58);
    expect(r.marcasTiempo.map((m) => m.texto)).toEqual(["0:00", "12:00", "24:00", "36:00", "48:58"]);
    expect(pasoDeTiempoMin(20 * 60)).toBe(5);
  });

  it("el punto de un segundo cae sobre la curva; lejos de todo dato, null", () => {
    const r = g([110, 150, 120]);
    expect(r.punto(30)).toEqual({ x: r.x(30), y: r.y(150) });
    expect(r.punto(10_000)).toBeNull();
  });
});
