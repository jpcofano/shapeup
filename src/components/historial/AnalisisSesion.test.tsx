// P93 — el análisis cargado se muestra como interpretación, y un <script> que
// venga en el JSON se muestra como texto: nunca se ejecuta ni se inserta.
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

import { AnalisisSesion } from "./AnalisisSesion";
import type { Historial } from "../../types/models";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
afterEach(() => { act(() => root?.unmount()); root = null; });

const XSS = "<script>window.__hackeado = true</script><img src=x onerror=\"window.__hackeado=true\">";

const h = {
  idHist: "H-1", miembro: "juanpablo", fechaRealizada: "2026-09-27", bloques: [],
  analisis: {
    version: 1, tipo: "sesion", idHist: "H-1", generadoEn: "2026-09-30", modelo: "modelo X",
    resumen: XSS,
    hallazgos: [{ tema: "intensidad", detalle: "Mucho Z4.", evidencia: "Z4 27,7 min", confianza: "alta" }],
    sugerencias: [], banderas: [], preguntas: [],
    armado: { versionPrompt: 1, versionEsquema: 1, ventana: null, versionEnriquecimiento: 7 },
    armadoOrigen: "eco", cargadoMs: Date.UTC(2026, 8, 30, 12),
  },
} as unknown as Historial;

describe("AnalisisSesion", () => {
  it("muestra el análisis como interpretación, con la evidencia al lado", () => {
    const div = document.createElement("div");
    root = createRoot(div);
    act(() => root!.render(createElement(AnalisisSesion, { h, historial: [], nocheAnterior: null, fcReposoDia: null, onCambio: () => {} })));
    expect(div.textContent).toContain("Interpretación · no es un dato medido");
    expect(div.textContent).toContain("modelo X");
    expect(div.textContent).toContain("Evidencia: Z4 27,7 min");
    expect(div.textContent).toContain("confianza alta, según el análisis");
  });

  it("un <script> del JSON se muestra como texto y no se inserta", () => {
    const div = document.createElement("div");
    root = createRoot(div);
    act(() => root!.render(createElement(AnalisisSesion, { h, historial: [], nocheAnterior: null, fcReposoDia: null, onCambio: () => {} })));
    expect(div.querySelector("script")).toBeNull();
    expect(div.querySelector("img")).toBeNull();
    expect(div.textContent).toContain("<script>window.__hackeado = true</script>");
    expect((window as unknown as { __hackeado?: boolean }).__hackeado).toBeUndefined();
  });
});
