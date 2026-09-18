import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../firebase", () => ({ db: {} }));

let docData: Record<string, unknown> | null = null;
let getDocFalla = false;

vi.mock("firebase/firestore", () => ({
  doc: vi.fn((_db, col: string, id: string) => ({ path: `${col}/${id}` })),
  getDoc: vi.fn(() => {
    if (getDocFalla) return Promise.reject(new Error("unavailable"));
    return Promise.resolve({ exists: () => docData != null, data: () => docData });
  }),
}));

const { getConfigImport, invalidarCacheConfigImport, CONFIG_IMPORT_DEFAULT } =
  await import("./configImport");

beforeEach(() => {
  docData = null;
  getDocFalla = false;
  invalidarCacheConfigImport();
  vi.clearAllMocks();
});

describe("getConfigImport", () => {
  it("sin documento usa los defaults", async () => {
    const r = await getConfigImport();
    if (!r.ok) throw new Error(r.error);
    expect(r.value).toEqual(CONFIG_IMPORT_DEFAULT);
    expect(r.value.duracionMinimaMin).toBe(10);
  });

  it("con documento usa sus valores", async () => {
    docData = { duracionMinimaMin: 25, actividadesSiempreRelevantes: ["Pádel", "Natación"] };
    const r = await getConfigImport();
    if (!r.ok) throw new Error(r.error);
    expect(r.value).toEqual({
      duracionMinimaMin: 25,
      actividadesSiempreRelevantes: ["Pádel", "Natación"],
    });
  });

  it("un documento a medio completar cae al default campo por campo", async () => {
    docData = { duracionMinimaMin: 20 };
    const r = await getConfigImport();
    if (!r.ok) throw new Error(r.error);
    expect(r.value.duracionMinimaMin).toBe(20);
    expect(r.value.actividadesSiempreRelevantes)
      .toEqual(CONFIG_IMPORT_DEFAULT.actividadesSiempreRelevantes);
  });

  it("un campo con el tipo equivocado cae al default, no rompe", async () => {
    docData = { duracionMinimaMin: "veinte", actividadesSiempreRelevantes: [1, 2] };
    const r = await getConfigImport();
    if (!r.ok) throw new Error(r.error);
    expect(r.value).toEqual(CONFIG_IMPORT_DEFAULT);
  });

  it("una lista vacía declarada se respeta: es una decisión", async () => {
    docData = { actividadesSiempreRelevantes: [] };
    const r = await getConfigImport();
    if (!r.ok) throw new Error(r.error);
    expect(r.value.actividadesSiempreRelevantes).toEqual([]);
  });

  it("umbral 0 se respeta (todo entra por duración)", async () => {
    docData = { duracionMinimaMin: 0 };
    const r = await getConfigImport();
    if (!r.ok) throw new Error(r.error);
    expect(r.value.duracionMinimaMin).toBe(0);
  });

  it("cachea: la segunda lectura no vuelve a Firestore", async () => {
    docData = { duracionMinimaMin: 25 };
    await getConfigImport();
    docData = { duracionMinimaMin: 99 };
    const r = await getConfigImport();
    if (!r.ok) throw new Error(r.error);
    expect(r.value.duracionMinimaMin).toBe(25);
  });

  it("invalidarCacheConfigImport fuerza releer", async () => {
    docData = { duracionMinimaMin: 25 };
    await getConfigImport();
    docData = { duracionMinimaMin: 99 };
    invalidarCacheConfigImport();
    const r = await getConfigImport();
    if (!r.ok) throw new Error(r.error);
    expect(r.value.duracionMinimaMin).toBe(99);
  });

  it("un fallo de red sí devuelve error (distinto de documento ausente)", async () => {
    getDocFalla = true;
    const r = await getConfigImport();
    expect(r.ok).toBe(false);
  });
});
