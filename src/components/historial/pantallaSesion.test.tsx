// P103 Bloque 1 — la pantalla de la sesión (P99 Parte 4, §6 de ANALISIS-ASISTIDO).
// Con la sesión testigo del 27/09, enriquecida por el camino real.
import { describe, it, expect, vi, afterEach } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";

vi.mock("../../firebase", () => ({ db: {}, auth: {} }));
vi.mock("../../auth/useAuth", () => ({ useAuth: () => ({ user: { uid: "u1" }, memberId: "juanpablo" }) }));
vi.mock("../../data/historial", () => ({ guardarAnalisis: vi.fn(), borrarAnalisis: vi.fn() }));
vi.mock("../../data/perfiles", () => ({ getPerfiles: vi.fn() }));
vi.mock("../../data/rutinas", () => ({ getRutina: vi.fn() }));
vi.mock("../../data/programas", () => ({ getProgramaActivo: vi.fn() }));
vi.mock("../../data/ingestaSdk", () => ({ leerCurvaDeSesion: vi.fn() }));

import { CabeceraMarcas } from "./CabeceraMarcas";
import { AnalisisSesion } from "./AnalisisSesion";
import { calcularEnriquecimiento } from "../../lib/enriquecerImport";
import { zonasDesdeFcMax } from "../../lib/zonas";
import type { AnalisisGuardado, Historial, PerfilMiembro } from "../../types/models";
import { CURVA, DATAUUID, HISTORIAL, SESION_SAMSUNG } from "../../lib/__fixtures__/sesionTestigo20260927";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
afterEach(() => { act(() => root?.unmount()); root = null; });

const TESTIGO: Historial = (() => {
  const perfil = { fcMaxTeorica: 169, zonasFC: zonasDesdeFcMax(169) } as PerfilMiembro;
  const u = calcularEnriquecimiento([HISTORIAL], {
    sesionesSamsung: [SESION_SAMSUNG], liveData: { [DATAUUID]: CURVA }, shapeUpCustomId: "ShapeUp", muestrasFcCrudas: [],
  }, perfil).updates[0];
  return { ...HISTORIAL, biometria: u.biometria, bloques: u.bloques ?? HISTORIAL.bloques };
})();

const ANALISIS_3 = {
  version: 3, tipo: "sesion", idHist: TESTIGO.idHist, generadoEn: "2026-10-21", modelo: "prueba",
  veredicto: "Sesión sólida, casi toda en Z4.",
  destacados: ["Sostuviste casi 18 minutos arriba de Z4.", "Bajaste bien después de los picos."],
  marcasAnalisis: [
    { refMarca: "tramoSostenido", tono: "positivo", texto: "El tramo más largo." },
    { tramo: { inicioS: 480, finS: 1320 }, tono: "atencion", texto: "Acá la FC se quedó abajo." },
  ],
  resumen: "Hiciste 49 minutos de VR. La mayor parte en Z4.",
  hallazgos: [{ tema: "intensidad", detalle: "Mucho Z4.", evidencia: "zona alta 32 min" }],
  sugerencias: [], banderas: [], preguntas: [], datosFaltantes: [],
  armado: { versionPrompt: 4, versionEsquema: 3, ventana: null, versionEnriquecimiento: 9 },
  armadoOrigen: "eco", cargadoMs: Date.UTC(2026, 9, 21, 12),
} as unknown as AnalisisGuardado;

const ANALISIS_2 = {
  version: 2, tipo: "sesion", idHist: TESTIGO.idHist, generadoEn: "2026-10-02", modelo: "viejo",
  resumen: "Resumen del esquema 2.", hallazgos: [], sugerencias: [], banderas: [], preguntas: [], datosFaltantes: [],
  armado: { versionPrompt: 3, versionEsquema: 2, ventana: null, versionEnriquecimiento: 8 },
  armadoOrigen: "eco", cargadoMs: Date.UTC(2026, 9, 2, 12),
} as unknown as AnalisisGuardado;

function montar(el: ReturnType<typeof createElement>) {
  const div = document.createElement("div");
  root = createRoot(div);
  act(() => root!.render(el));
  return div;
}
const secciones = (div: HTMLElement) => [...div.querySelectorAll("[data-seccion]")].map((e) => e.getAttribute("data-seccion"));

describe("La pantalla de la sesión: el orden (P99 §6)", () => {
  it("con análisis: calidad, veredicto, badges, destacados, curva y secundarias", () => {
    const conProblema: Historial = { ...TESTIGO, biometria: { ...TESTIGO.biometria!, fcDudosa: true }, analisis: ANALISIS_3 };
    const div = montar(createElement(CabeceraMarcas, { h: conProblema, historial: [conProblema] }));
    expect(secciones(div)).toEqual(["calidad", "veredicto", "badges", "destacados", "curva", "secundarias"]);
  });

  it("sin análisis: lo medido se ve igual; solo faltan el veredicto y los destacados", () => {
    const sin = montar(createElement(CabeceraMarcas, { h: TESTIGO, historial: [TESTIGO] }));
    expect(secciones(sin)).toEqual(["badges", "curva", "secundarias"]);
    const badgesSin = sin.querySelector("[data-seccion=badges]")!.textContent;
    const secundariasSin = sin.querySelector("[data-seccion=secundarias]")!.textContent;
    act(() => root!.unmount()); root = null;
    const con = montar(createElement(CabeceraMarcas, { h: { ...TESTIGO, analisis: ANALISIS_3 }, historial: [TESTIGO] }));
    expect(con.querySelector("[data-seccion=badges]")!.textContent).toBe(badgesSin);
    expect(con.querySelector("[data-seccion=secundarias]")!.textContent).toBe(secundariasSin);
  });

  it("los badges van en el orden del catálogo", () => {
    const div = montar(createElement(CabeceraMarcas, { h: TESTIGO, historial: [TESTIGO] }));
    const ids = [...div.querySelectorAll("[data-marca-id]")].map((e) => e.getAttribute("data-marca-id"));
    expect(ids).toEqual(["carga", "zonaAlta"]);
  });

  it("mientras el historial no cargó, no hay récord ni semana (saldrían mal)", () => {
    const conPlan: Historial = { ...TESTIGO, planSemana: { metaDias: 5, idPrograma: "PRG-0013" } };
    const cargando = montar(createElement(CabeceraMarcas, { h: conPlan, historial: null }));
    expect(cargando.querySelector("[data-marca-id=semana]")).toBeNull();
    act(() => root!.unmount()); root = null;
    const cargado = montar(createElement(CabeceraMarcas, { h: conPlan, historial: [conPlan] }));
    expect(cargado.querySelector("[data-marca-id=semana]")!.textContent).toBe("1 de 5 · sin fuerza");
  });

  it("sin curva guardada no se dibuja ni ocupa lugar, y las demás marcas se ven", () => {
    const { curva: _c, ...sinCurva } = TESTIGO.biometria!;
    const div = montar(createElement(CabeceraMarcas, { h: { ...TESTIGO, biometria: sinCurva }, historial: [TESTIGO] }));
    expect(div.querySelector("[data-testid=curva-sesion]")).toBeNull();
    expect(secciones(div)).toEqual(["badges", "secundarias"]);
    expect(div.textContent).toContain("Tramo sostenido");
  });
});

describe("La curva y las marcas (P99 §6)", () => {
  it("una refMarca del análisis se dibuja sobre la marca de la app correcta, con borde punteado", () => {
    const div = montar(createElement(CabeceraMarcas, { h: { ...TESTIGO, analisis: ANALISIS_3 }, historial: [TESTIGO] }));
    const app = div.querySelector("rect[data-marca=app][data-ref=tramoSostenido]")!;
    const delAnalisis = div.querySelector("rect[data-marca=analisis][data-ref=tramoSostenido]")!;
    expect(app).not.toBeNull();
    expect(delAnalisis).not.toBeNull();
    expect(delAnalisis.getAttribute("data-inicio")).toBe(app.getAttribute("data-inicio"));
    expect(delAnalisis.getAttribute("data-fin")).toBe(app.getAttribute("data-fin"));
    expect(delAnalisis.getAttribute("x")).toBe(app.getAttribute("x"));
    expect(delAnalisis.getAttribute("stroke-dasharray")).toBe("4 3");
    expect(app.getAttribute("stroke-dasharray")).toBeNull();
  });

  it("tocar una marca muestra su texto; las del análisis con la etiqueta «análisis»", () => {
    const div = montar(createElement(CabeceraMarcas, { h: { ...TESTIGO, analisis: ANALISIS_3 }, historial: [TESTIGO] }));
    act(() => (div.querySelector("rect[data-marca=app][data-ref=tramoSostenido]") as SVGElement).dispatchEvent(new MouseEvent("click", { bubbles: true })));
    expect(div.querySelector("[data-testid=curva-texto]")!.textContent).toMatch(/^Tramo sostenido 17:5[56]/);
    // Lo que dijo el análisis sobre esa marca va abajo, con la etiqueta.
    expect(div.querySelector("[data-testid=curva-comentario]")!.textContent).toBe("análisisEl tramo más largo.");
    // La del análisis que apunta a ella no toma el toque (si no, taparía la de la app).
    expect((div.querySelector("rect[data-marca=analisis][data-ref=tramoSostenido]") as SVGElement).style.pointerEvents).toBe("none");
    // Una del análisis con tramo propio sí se toca, y se muestra con la etiqueta «análisis».
    act(() => (div.querySelector("rect[data-marca=analisis][data-ref='']") as SVGElement).dispatchEvent(new MouseEvent("click", { bubbles: true })));
    expect(div.querySelector("[data-testid=curva-texto]")!.textContent).toMatch(/^análisisAcá la FC se quedó abajo\./);
  });
});

describe("El detalle del análisis (P99 §6)", () => {
  const props = (h: Historial) => ({ h, historial: [h], nocheAnterior: null, fcReposoDia: null, onCambio: () => {} });

  it("con esquema 3, el detalle va plegado", () => {
    const div = montar(createElement(AnalisisSesion, props({ ...TESTIGO, analisis: ANALISIS_3 })));
    const det = div.querySelector("details[data-testid=detalle-plegado]") as HTMLDetailsElement;
    expect(det).not.toBeNull();
    expect(det.open).toBe(false);
    expect(det.textContent).toContain("Marcas del análisis");
  });

  it("con esquema 2 se ve como hoy: sin plegar y sin veredicto arriba", () => {
    const h = { ...TESTIGO, analisis: ANALISIS_2 };
    const div = montar(createElement(AnalisisSesion, props(h)));
    expect(div.querySelector("details[data-testid=detalle-plegado]")).toBeNull();
    expect(div.textContent).toContain("Resumen del esquema 2.");
    act(() => root!.unmount()); root = null;
    const cab = montar(createElement(CabeceraMarcas, { h, historial: [h] }));
    expect(secciones(cab)).toEqual(["badges", "curva", "secundarias"]);
  });
});
