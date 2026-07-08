import { describe, it, expect, vi, beforeEach } from "vitest";
import { borrarSesionHistorial, borrarHistorialMiembro } from "./historial";

vi.mock("../firebase", () => ({ db: {} }));

const batchCommits: Array<{ deletes: unknown[] }> = [];

vi.mock("firebase/firestore", () => ({
  collection: vi.fn((_db, ...path: string[]) => ({ type: "collection", path: path.join("/") })),
  doc: vi.fn((_db, ...path: string[]) => ({ type: "doc", path: path.join("/") })),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn((col) => col),
  where: vi.fn(),
  orderBy: vi.fn(),
  serverTimestamp: vi.fn(),
  runTransaction: vi.fn(),
  writeBatch: vi.fn(() => {
    const deletes: unknown[] = [];
    batchCommits.push({ deletes });
    return {
      delete: vi.fn((ref: unknown) => deletes.push(ref)),
      commit: vi.fn().mockResolvedValue(undefined),
    };
  }),
}));

import { getDoc, getDocs } from "firebase/firestore";

function mediaDocs(n: number) {
  return Array.from({ length: n }, (_, i) => ({ ref: { id: `media-${i}` } }));
}

beforeEach(() => {
  batchCommits.length = 0;
  vi.clearAllMocks();
});

describe("borrarSesionHistorial", () => {
  it("borra media + historial + sesión asociada", async () => {
    vi.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      data: () => ({ idSesion: "SES-1" }),
    } as never);
    vi.mocked(getDocs).mockResolvedValue({ docs: mediaDocs(2) } as never);

    const r = await borrarSesionHistorial("H-1");

    expect(r.ok).toBe(true);
    const allDeletes = batchCommits.flatMap((b) => b.deletes);
    expect(allDeletes).toHaveLength(4); // 2 media + 1 historial + 1 sesión
  });

  it("no borra sesión si el historial no tiene idSesion", async () => {
    vi.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      data: () => ({}),
    } as never);
    vi.mocked(getDocs).mockResolvedValue({ docs: [] } as never);

    const r = await borrarSesionHistorial("H-2");

    expect(r.ok).toBe(true);
    const allDeletes = batchCommits.flatMap((b) => b.deletes);
    expect(allDeletes).toHaveLength(1); // solo el historial
  });

  it("devuelve error si el historial no existe", async () => {
    vi.mocked(getDoc).mockResolvedValue({ exists: () => false } as never);

    const r = await borrarSesionHistorial("H-inexistente");

    expect(r.ok).toBe(false);
  });

  it("hace flush del batch al superar el límite de operaciones", async () => {
    vi.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      data: () => ({}),
    } as never);
    vi.mocked(getDocs).mockResolvedValue({ docs: mediaDocs(401) } as never);

    const r = await borrarSesionHistorial("H-muchos-media");

    expect(r.ok).toBe(true);
    expect(batchCommits.length).toBeGreaterThan(1);
    const allDeletes = batchCommits.flatMap((b) => b.deletes);
    expect(allDeletes).toHaveLength(402); // 401 media + 1 historial
  });
});

describe("borrarHistorialMiembro", () => {
  it("borra todo el historial y sesiones de un miembro con su media", async () => {
    const historialDocs = [{ id: "H-1", ref: { id: "H-1" } }, { id: "H-2", ref: { id: "H-2" } }];
    const sesionDocs    = [{ id: "SES-1", ref: { id: "SES-1" } }];
    vi.mocked(getDocs)
      .mockResolvedValueOnce({ docs: historialDocs, size: historialDocs.length } as never) // historial query
      .mockResolvedValueOnce({ docs: sesionDocs, size: sesionDocs.length } as never) // sesiones query
      .mockResolvedValueOnce({ docs: mediaDocs(1), size: 1 } as never) // media de H-1
      .mockResolvedValueOnce({ docs: [], size: 0 } as never); // media de H-2

    const r = await borrarHistorialMiembro("maria");

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toEqual({ historial: 2, sesiones: 1 });
    const allDeletes = batchCommits.flatMap((b) => b.deletes);
    expect(allDeletes).toHaveLength(4); // 1 media + 2 historial + 1 sesión
  });

  it("no borra nada si el miembro no tiene historial", async () => {
    vi.mocked(getDocs)
      .mockResolvedValueOnce({ docs: [], size: 0 } as never)
      .mockResolvedValueOnce({ docs: [], size: 0 } as never);

    const r = await borrarHistorialMiembro("federico");

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toEqual({ historial: 0, sesiones: 0 });
  });
});
