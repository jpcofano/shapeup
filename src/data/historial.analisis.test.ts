// P93 — guardar el análisis: update y nunca set; un segundo análisis pisa al primero.
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../firebase", () => ({ db: {}, auth: { currentUser: { uid: "u1" } } }));

const updateDoc = vi.fn((_ref: unknown, _data: unknown) => Promise.resolve());
const setDoc = vi.fn(() => Promise.resolve());
vi.mock("firebase/firestore", () => ({
  collection: vi.fn(), doc: vi.fn((_db, ...p: string[]) => ({ path: p.join("/") })),
  getDocs: vi.fn(), getDoc: vi.fn(), getDocFromServer: vi.fn(),
  serverTimestamp: vi.fn(() => "TS"), updateDoc: (r: unknown, d: unknown) => updateDoc(r, d), setDoc: () => setDoc(),
  deleteField: vi.fn(() => "DELETE"),
  query: vi.fn(), where: vi.fn(), orderBy: vi.fn(), limit: vi.fn(),
  writeBatch: vi.fn(() => ({ set: vi.fn(), commit: () => Promise.resolve() })),
}));
vi.mock("./pedidoPuente", () => ({ pedirSincronizacion: () => Promise.resolve({ ok: true, value: 1 }) }));

import { guardarAnalisis, borrarAnalisis } from "./historial";
import type { AnalisisGuardado } from "../types/models";

const ID = "H-20260927-1790539057188";
const analisis = (resumen: string, hallazgos = 1): AnalisisGuardado => ({
  version: 1, tipo: "sesion", idHist: ID, generadoEn: "2026-09-30", modelo: "m", resumen,
  hallazgos: Array.from({ length: hallazgos }, (_, i) => ({ tema: `t${i}`, detalle: "d", evidencia: "e" })),
  sugerencias: [], banderas: [], preguntas: [],
  armado: { versionPrompt: 1, versionEsquema: 1, ventana: null, versionEnriquecimiento: null },
  armadoOrigen: "carga", cargadoMs: 1,
});

beforeEach(() => { updateDoc.mockClear(); setDoc.mockClear(); });

describe("guardarAnalisis (P93)", () => {
  it("usa update y nunca set, y solo toca el campo analisis", async () => {
    const r = await guardarAnalisis(ID, analisis("primero"));
    expect(r.ok).toBe(true);
    expect(setDoc).not.toHaveBeenCalled();
    expect(updateDoc).toHaveBeenCalledTimes(1);
    const [ref, data] = updateDoc.mock.calls[0];
    expect(ref).toEqual({ path: `historial/${ID}` });
    expect(Object.keys(data as object)).toEqual(["analisis"]);
  });

  it("cargar un segundo análisis pisa al primero entero, sin mezclar", async () => {
    await guardarAnalisis(ID, analisis("primero", 3));
    await guardarAnalisis(ID, analisis("segundo", 1));
    const ultimo = updateDoc.mock.calls.at(-1)![1] as { analisis: AnalisisGuardado };
    expect(ultimo.analisis.resumen).toBe("segundo");
    expect(ultimo.analisis.hallazgos).toHaveLength(1);
  });

  it("borrar saca el campo con deleteField, también por update", async () => {
    await borrarAnalisis(ID);
    expect(setDoc).not.toHaveBeenCalled();
    expect(updateDoc.mock.calls[0][1]).toEqual({ analisis: "DELETE" });
  });

  it("si Firestore falla, devuelve el error y no tira", async () => {
    updateDoc.mockImplementationOnce(() => Promise.reject(new Error("permission-denied")));
    const r = await guardarAnalisis(ID, analisis("x"));
    expect(r.ok).toBe(false);
  });
});
