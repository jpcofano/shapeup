// P103 Bloque 1 — la pantalla de la sesión (P99 Parte 4, §6 de ANALISIS-ASISTIDO); P109: el detalle nuevo.
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

import { DetalleSesion } from "./DetalleSesion";
import { sesionFuerzaQa } from "../../routes/QaSesion";
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

/** El detalle completo, como lo muestra HistorialDetalle (P109). */
const detalle = (h: Historial, historial: Historial[] | null = [h], extra: Partial<Record<string, unknown>> = {}) =>
  createElement(DetalleSesion, {
    h, historial, errorHistorial: null, nocheAnterior: null, comparativa: null, ultimaCorrida: null,
    nombrePrevista: null, onVolver: () => {}, onCambio: () => {}, ...extra,
  });

describe("La pantalla de la sesión: el orden (P99 §6; P109)", () => {
  it("con análisis: título, calidad, el bloque del análisis (veredicto, destacados, badges), la curva, los datos, las zonas, lo que hiciste y las filas", () => {
    const conProblema: Historial = { ...TESTIGO, biometria: { ...TESTIGO.biometria!, fcDudosa: true }, analisis: ANALISIS_3 };
    const div = montar(detalle(conProblema));
    expect(secciones(div)).toEqual([
      "titulo", "calidad", "analisis", "veredicto", "destacados", "badges", "curva",
      "stats", "cobertura", "tiempo-en-zonas", "lo-que-hiciste", "filas", "secundarias",
    ]);
    // Los badges van adentro del bloque del análisis.
    expect(div.querySelector("[data-seccion=analisis] [data-seccion=badges]")).not.toBeNull();
  });

  it("sin análisis: lo medido se ve igual; los badges van solos", () => {
    const sin = montar(detalle(TESTIGO));
    expect(secciones(sin)).toEqual(["titulo", "badges", "curva", "stats", "cobertura", "tiempo-en-zonas", "lo-que-hiciste", "filas", "secundarias"]);
    const badgesSin = sin.querySelector("[data-seccion=badges]")!.textContent;
    const secundariasSin = sin.querySelector("[data-seccion=secundarias]")!.textContent;
    act(() => root!.unmount()); root = null;
    const con = montar(detalle({ ...TESTIGO, analisis: ANALISIS_3 }, [TESTIGO]));
    expect(con.querySelector("[data-seccion=badges]")!.textContent).toBe(badgesSin);
    expect(con.querySelector("[data-seccion=secundarias]")!.textContent).toBe(secundariasSin);
  });

  it("los badges van en el orden del catálogo", () => {
    const div = montar(detalle(TESTIGO));
    const ids = [...div.querySelectorAll("[data-marca-id]")].map((e) => e.getAttribute("data-marca-id"));
    expect(ids).toEqual(["carga", "zonaAlta"]);
  });

  it("mientras el historial no cargó, no hay récord ni semana (saldrían mal)", () => {
    const conPlan: Historial = { ...TESTIGO, planSemana: { metaDias: 5, idPrograma: "PRG-0013" } };
    const cargando = montar(detalle(conPlan, null));
    expect(cargando.querySelector("[data-marca-id=semana]")).toBeNull();
    act(() => root!.unmount()); root = null;
    const cargado = montar(detalle(conPlan, [conPlan]));
    expect(cargado.querySelector("[data-marca-id=semana]")!.textContent).toBe("1 de 5 · sin fuerza");
  });

  it("sin curva guardada no se dibuja ni ocupa lugar, y las demás marcas se ven", () => {
    const { curva: _c, ...sinCurva } = TESTIGO.biometria!;
    const div = montar(detalle({ ...TESTIGO, biometria: sinCurva }, [TESTIGO]));
    expect(div.querySelector("[data-testid=curva-sesion]")).toBeNull();
    expect(secciones(div)).not.toContain("curva");
    expect(secciones(div)).toContain("tiempo-en-zonas");
    expect(div.textContent).toContain("Tramo sostenido");
  });

  it("el título: el tipo y el juego arriba, el nombre grande y la fecha", () => {
    const div = montar(detalle(TESTIGO));
    const t = div.querySelector("[data-seccion=titulo]")!;
    expect(t.querySelector(".detalle-sobretitulo")!.textContent).toBe("VR · PowerBeatsVR");
    expect(t.querySelector("h1")!.textContent).toBe("Quema full-body");
    expect(t.querySelector(".detalle-fecha")!.textContent).toMatch(/^Dom 27\/09 · \d\d:\d\d · 49 min$/);
  });

  it("los datos en grilla de 2; si queda una sola en su fila, ocupa las dos columnas", () => {
    const div = montar(detalle(TESTIGO));
    const tiles = [...div.querySelectorAll("[data-stat]")];
    expect(tiles.map((t) => t.getAttribute("data-stat"))).toEqual(["duracion", "kcal", "fcMedia", "fcMax"]);
    expect(tiles.some((t) => t.classList.contains("ancho"))).toBe(false);
    act(() => root!.unmount()); root = null;
    const { kcal: _k, ...sinKcal } = TESTIGO.biometria!;
    const tres = montar(detalle({ ...TESTIGO, biometria: sinKcal }));
    const ult = [...tres.querySelectorAll("[data-stat]")].at(-1)!;
    expect(ult.getAttribute("data-stat")).toBe("fcMax");
    expect(ult.classList.contains("ancho")).toBe(true);
  });

  it("la noche anterior va como fila, y «Más datos de la curva» va plegado con las secundarias", () => {
    const noche = { fecha: "2026-09-27", horasTotal: 6.5, horasNoche: 6.5, horaAcostarse: "23:41", horaLevantarse: "06:11", tramos: 1 };
    const div = montar(detalle(TESTIGO, [TESTIGO], { nocheAnterior: noche }));
    expect(div.querySelector("[data-fila=sueno]")!.textContent).toContain("Dormiste 6 h 30 la noche anterior");
    const mas = div.querySelector("details[data-fila=mas-datos]") as HTMLDetailsElement;
    expect(mas.open).toBe(false);
    expect(mas.textContent).toContain("Tramo sostenido");
  });
});

describe("La curva y las marcas como chips (P99 §6; P109)", () => {
  it("la curva se pinta por zona, sin bandas, con guías y el punto del pico", () => {
    const div = montar(detalle(TESTIGO));
    const curva = div.querySelector("[data-testid=curva-sesion]")!;
    const zonas = new Set([...curva.querySelectorAll("polyline")].map((p) => p.getAttribute("data-zona")));
    expect(zonas.has("Z4")).toBe(true);
    expect(curva.querySelector("rect[fill*='-dim']")).toBeNull();
    expect(curva.querySelectorAll("line[stroke-dasharray], g[stroke-dasharray] line").length).toBeGreaterThan(0);
    expect(curva.querySelector("[data-testid=curva-pico]")).not.toBeNull();
  });

  it("una refMarca del análisis no es un chip aparte: el chip de la app avisa que tiene comentario", () => {
    const div = montar(detalle({ ...TESTIGO, analisis: ANALISIS_3 }, [TESTIGO]));
    const app = div.querySelector("button.chip-marca[data-marca=app][data-ref=tramoSostenido]")!;
    expect(app).not.toBeNull();
    expect(app.querySelector("[data-con-analisis]")).not.toBeNull();
    expect(app.classList.contains("analisis")).toBe(false);
    expect(div.querySelector("button.chip-marca[data-marca=analisis][data-ref=tramoSostenido]")).toBeNull();
    // La del análisis con tramo propio sí es un chip, punteado y con «análisis».
    const propia = div.querySelector("button.chip-marca[data-marca=analisis][data-ref='']")!;
    expect(propia.classList.contains("analisis")).toBe(true);
    expect(propia.textContent).toContain("análisis");
  });

  it("sin zonas guardadas (antes de P97), la curva va en el acento y no en gris", () => {
    const { zonasUsadas: _z, ...sinZonas } = TESTIGO.biometria!;
    const div = montar(detalle({ ...TESTIGO, biometria: sinZonas }));
    const lineas = [...div.querySelectorAll("[data-testid=curva-sesion] polyline")];
    expect(lineas.length).toBeGreaterThan(0);
    expect(lineas.every((l) => l.getAttribute("stroke") === "var(--accent)")).toBe(true);
  });

  it("una sesión sin ejercicios (juego) muestra su zona principal y su RPE", () => {
    const juego = { ...TESTIGO, tipo: "juego", nombreJuego: "Beat Saber", bloques: [], rpe: 6, totalSeriesHechas: null, tonelajeKg: null } as unknown as Historial;
    const div = montar(detalle(juego));
    expect(div.querySelector("[data-seccion=zona-principal] [data-zona-dominante]")).not.toBeNull();
    expect(div.querySelector("[data-seccion=resumen-sin-ejercicios]")!.textContent).toBe("RPE 6");
  });

  it("tocar un chip resalta su tramo y muestra su texto; los del análisis con la etiqueta «análisis»", () => {
    const div = montar(detalle({ ...TESTIGO, analisis: ANALISIS_3 }, [TESTIGO]));
    const app = div.querySelector("button.chip-marca[data-marca=app][data-ref=tramoSostenido]") as HTMLButtonElement;
    act(() => app.click());
    expect(div.querySelector("[data-testid=curva-texto]")!.textContent).toMatch(/^Tramo sostenido 17:5[56]/);
    const franja = div.querySelector("[data-testid=curva-franja]")!;
    expect(franja.getAttribute("data-inicio")).toBe(app.getAttribute("data-inicio"));
    // Lo que dijo el análisis sobre esa marca va abajo, con la etiqueta.
    expect(div.querySelector("[data-testid=curva-comentario]")!.textContent).toBe("análisisEl tramo más largo.");
    // Una del análisis con tramo propio también se toca, y se muestra con la etiqueta «análisis».
    act(() => (div.querySelector("button.chip-marca[data-marca=analisis][data-ref='']") as HTMLButtonElement).click());
    expect(div.querySelector("[data-testid=curva-texto]")!.textContent).toMatch(/^análisisAcá la FC se quedó abajo\./);
  });
});

describe("Tiempo en zonas y lo que hiciste (P109)", () => {
  it("con curva: las cinco zonas de Z5 a Z1, con su nombre, rango, tiempo y %", () => {
    const div = montar(detalle(TESTIGO));
    const filas = [...div.querySelectorAll("[data-testid=tiempo-en-zonas] [data-zona]")];
    expect(filas.map((f) => f.getAttribute("data-zona"))).toEqual(["Z5", "Z4", "Z3", "Z2", "Z1"]);
    expect(filas[1].textContent).toContain("Anaeróbico");
    expect(filas[1].textContent).toContain("ppm");
  });

  it("sin curva pero con minutos por zona (de las muestras de Samsung) también va; sin minutos, no", () => {
    const { curva: _c, ...sinCurva } = TESTIGO.biometria!;
    const div = montar(detalle({ ...TESTIGO, biometria: sinCurva }));
    expect(div.querySelector("[data-testid=tiempo-en-zonas]")).not.toBeNull();
    act(() => root!.unmount()); root = null;
    const { curva: _c2, minutosPorZona: _m, ...nada } = TESTIGO.biometria!;
    const sin = montar(detalle({ ...TESTIGO, biometria: nada }));
    expect(sin.querySelector("[data-testid=tiempo-en-zonas]")).toBeNull();
  });

  it("el chip de la zona dominante dice el nombre de Samsung", () => {
    const div = montar(detalle(TESTIGO));
    const chip = div.querySelector("[data-zona-dominante]")!;
    expect(chip.getAttribute("data-zona-dominante")).toBe("Z4");
    expect(chip.textContent).toBe("Anaeróbico");
  });

  it("una sesión de fuerza con 3 ejercicios: «N de M series», su zona y una barra fina por ejercicio", () => {
    const div = montar(detalle(sesionFuerzaQa()));
    const ejercicios = div.querySelectorAll("[data-seccion=lo-que-hiciste] [data-ejercicio]");
    expect(ejercicios).toHaveLength(3);
    expect(ejercicios[0].textContent).toContain("3 de 3 series");
    expect([...div.querySelectorAll("[data-zona-dominante]")].map((c) => c.getAttribute("data-zona-dominante"))).toEqual(["Z3", "Z2", "Z3"]);
    expect(div.querySelectorAll("[data-barra-ejercicio]")).toHaveLength(3);
    // Sin las dos barras apiladas con rótulos de antes.
    expect(div.textContent).not.toContain("Series registradas");
    expect(div.textContent).not.toContain("FC Samsung Health");
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
    const cab = montar(detalle(h));
    expect(secciones(cab)).not.toContain("analisis");
    expect(secciones(cab)).not.toContain("veredicto");
  });
});
