import { describe, it, expect, vi, beforeEach } from "vitest";
import { importarCardioIdempotente } from "./salud";

vi.mock("../firebase", () => ({ db: {} }));

const setDocCalls: Array<{ id: string; data: Record<string, unknown> }> = [];

vi.mock("firebase/firestore", () => ({
  collection: vi.fn((_db, ...path: string[]) => ({ type: "collection", path: path.join("/") })),
  doc: vi.fn((_db, col: string, id: string) => ({ type: "doc", path: `${col}/${id}`, id })),
  getDocs: vi.fn(),
  query: vi.fn((col) => col),
  where: vi.fn(),
  orderBy: vi.fn(),
  serverTimestamp: vi.fn(() => "SERVER_TS"),
  setDoc: vi.fn((ref: { id: string }, data: Record<string, unknown>) => {
    setDocCalls.push({ id: ref.id, data });
    return Promise.resolve();
  }),
}));

beforeEach(() => {
  setDocCalls.length = 0;
  vi.clearAllMocks();
});

describe("importarCardioIdempotente", () => {
  it("persiste inicioMs/finMs y strippea los campos _", async () => {
    const r = await importarCardioIdempotente([
      {
        _uuid: "abc", _startMs: 1000, _endMs: 4000, _customId: "cid", _fcMin: 90,
        miembro: "juanpablo", fecha: "2026-07-08", actividad: "Body Combat", esVR: false,
        fuente: "samsung-health-csv",
      },
    ]);

    expect(r.ok).toBe(true);
    expect(setDocCalls).toHaveLength(1);
    const { data } = setDocCalls[0];
    expect(data.inicioMs).toBe(1000);
    expect(data.finMs).toBe(4000);
    expect(data).not.toHaveProperty("_uuid");
    expect(data).not.toHaveProperty("_startMs");
    expect(data).not.toHaveProperty("_endMs");
    expect(data).not.toHaveProperty("_customId");
    expect(data).not.toHaveProperty("_fcMin");
  });

  it("fila sin _startMs/_endMs → doc sin inicioMs/finMs (no undefined escrito)", async () => {
    await importarCardioIdempotente([
      {
        _uuid: "sin-hora",
        miembro: "juanpablo", fecha: "2026-07-08", actividad: "Caminata", esVR: false,
        fuente: "samsung-health-csv",
      },
    ]);

    const { data } = setDocCalls[0];
    expect(data).not.toHaveProperty("inicioMs");
    expect(data).not.toHaveProperty("finMs");
  });

  it("re-import del mismo _uuid con inicioMs nuevo lo incorpora al mismo id", async () => {
    await importarCardioIdempotente([
      {
        _uuid: "dup", _startMs: 1000, _endMs: 2000,
        miembro: "juanpablo", fecha: "2026-07-08", actividad: "HIIT", esVR: false,
        fuente: "samsung-health-csv",
      },
    ]);
    await importarCardioIdempotente([
      {
        _uuid: "dup", _startMs: 5000, _endMs: 6000,
        miembro: "juanpablo", fecha: "2026-07-08", actividad: "HIIT", esVR: false,
        fuente: "samsung-health-csv",
      },
    ]);

    expect(setDocCalls).toHaveLength(2);
    expect(setDocCalls[0].id).toBe(setDocCalls[1].id);
    expect(setDocCalls[0].data.inicioMs).toBe(1000);
    expect(setDocCalls[1].data.inicioMs).toBe(5000);
  });
});
