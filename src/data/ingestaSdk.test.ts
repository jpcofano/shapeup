import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../firebase", () => ({ db: {} }));

interface DocFake { id: string; data: () => Record<string, unknown> }
let docs: DocFake[] = [];
let estadoDoc: Record<string, unknown> | null = null;
let falla = false;

vi.mock("firebase/firestore", () => ({
  collection: vi.fn((_db, ...path: string[]) => ({ path: path.join("/") })),
  doc: vi.fn((_db, ...path: string[]) => ({ path: path.join("/") })),
  getDocs: vi.fn(() => {
    if (falla) return Promise.reject(new Error("unavailable"));
    return Promise.resolve({ docs, size: docs.length });
  }),
  getDoc: vi.fn(() => Promise.resolve({
    exists: () => estadoDoc != null, data: () => estadoDoc,
  })),
}));

const { leerRegistrosSdk, leerEstadoPuente } = await import("./ingestaSdk");

/** Documento del puente, entero o partido. */
function reg(
  id: string, dataType: string, crudo: string, parte?: number, totalPartes?: number,
): DocFake {
  return {
    id,
    data: () => (parte != null ? { dataType, crudo, parte, totalPartes } : { dataType, crudo }),
  };
}

beforeEach(() => {
  docs = [];
  estadoDoc = null;
  falla = false;
  vi.clearAllMocks();
});

describe("leerRegistrosSdk — registros enteros", () => {
  it("parsea el crudo y devuelve el registro", async () => {
    docs = [reg("exercise_a", "exercise", JSON.stringify({ uid: "a", n: 1 }))];
    const r = await leerRegistrosSdk("uid1");
    if (!r.ok) throw new Error(r.error);
    expect(r.value.registros).toEqual([{ id: "exercise_a", dataType: "exercise", crudo: { uid: "a", n: 1 } }]);
    expect(r.value.documentos).toBe(1);
    expect(r.value.rearmados).toBe(0);
    expect(r.value.ilegibles).toEqual([]);
  });

  it("un crudo ilegible se cuenta y no rompe la corrida", async () => {
    docs = [
      reg("bueno", "exercise", JSON.stringify({ uid: "ok" })),
      reg("roto",  "exercise", "{ esto no es JSON"),
      reg("otro",  "exercise", JSON.stringify({ uid: "ok2" })),
    ];
    const r = await leerRegistrosSdk("uid1");
    if (!r.ok) throw new Error(r.error);
    expect(r.value.registros).toHaveLength(2);
    expect(r.value.ilegibles).toEqual([{ id: "roto", motivo: "crudo ilegible" }]);
  });

  it("un crudo vacío también es ilegible", async () => {
    docs = [reg("vacio", "exercise", "")];
    const r = await leerRegistrosSdk("uid1");
    if (!r.ok) throw new Error(r.error);
    expect(r.value.registros).toHaveLength(0);
    expect(r.value.ilegibles).toHaveLength(1);
  });
});

describe("leerRegistrosSdk — rearmado de partidos", () => {
  const original = { uid: "grande", fields: { sessions: [{ exerciseType: "OTHER", log: [1, 2, 3] }] } };
  const json = JSON.stringify(original);
  const corte1 = json.slice(0, 20);
  const corte2 = json.slice(20, 45);
  const corte3 = json.slice(45);

  it("tres partes en desorden se concatenan bien", async () => {
    docs = [
      reg("exercise_grande__p3", "exercise", corte3, 3, 3),
      reg("exercise_grande__p1", "exercise", corte1, 1, 3),
      reg("exercise_grande__p2", "exercise", corte2, 2, 3),
    ];
    const r = await leerRegistrosSdk("uid1");
    if (!r.ok) throw new Error(r.error);
    expect(r.value.registros).toHaveLength(1);
    expect(r.value.registros[0].crudo).toEqual(original);
    expect(r.value.registros[0].id).toBe("exercise_grande");
    expect(r.value.registros[0].dataType).toBe("exercise");
    expect(r.value.rearmados).toBe(1);
    expect(r.value.documentos).toBe(3);
  });

  it("si falta una parte se omite el registro y se informa", async () => {
    // Nunca se parsea un JSON incompleto: concatenar lo que hay daría basura.
    docs = [
      reg("exercise_grande__p1", "exercise", corte1, 1, 3),
      reg("exercise_grande__p3", "exercise", corte3, 3, 3),
    ];
    const r = await leerRegistrosSdk("uid1");
    if (!r.ok) throw new Error(r.error);
    expect(r.value.registros).toHaveLength(0);
    expect(r.value.rearmados).toBe(0);
    expect(r.value.ilegibles).toHaveLength(1);
    expect(r.value.ilegibles[0].id).toBe("exercise_grande");
    expect(r.value.ilegibles[0].motivo).toContain("2/3");
  });

  it("partes completas pero que no arman un JSON válido se informan", async () => {
    docs = [
      reg("exercise_x__p1", "exercise", "{ roto", 1, 2),
      reg("exercise_x__p2", "exercise", " mas roto", 2, 2),
    ];
    const r = await leerRegistrosSdk("uid1");
    if (!r.ok) throw new Error(r.error);
    expect(r.value.registros).toHaveLength(0);
    expect(r.value.ilegibles[0].motivo).toBe("crudo rearmado ilegible");
  });

  it("enteros y partidos conviven en la misma corrida", async () => {
    docs = [
      reg("exercise_chico", "exercise", JSON.stringify({ uid: "chico" })),
      reg("exercise_grande__p1", "exercise", corte1, 1, 3),
      reg("exercise_grande__p2", "exercise", corte2, 2, 3),
      reg("exercise_grande__p3", "exercise", corte3, 3, 3),
      reg("bc_1", "body_composition", JSON.stringify({ uid: "bc" })),
    ];
    const r = await leerRegistrosSdk("uid1");
    if (!r.ok) throw new Error(r.error);
    expect(r.value.documentos).toBe(5);
    expect(r.value.registros).toHaveLength(3);
    expect(r.value.rearmados).toBe(1);
  });
});

describe("leerRegistrosSdk — errores", () => {
  it("un fallo de red devuelve err", async () => {
    falla = true;
    expect((await leerRegistrosSdk("uid1")).ok).toBe(false);
  });

  it("una colección vacía devuelve la lectura vacía, no error", async () => {
    const r = await leerRegistrosSdk("uid1");
    if (!r.ok) throw new Error(r.error);
    expect(r.value.registros).toEqual([]);
    expect(r.value.documentos).toBe(0);
  });
});

describe("leerEstadoPuente", () => {
  it("devuelve el estado si existe", async () => {
    estadoDoc = { ultimaCorridaMs: 1789658732984, leidos: 26, subidos: 0, errores: 0 };
    const r = await leerEstadoPuente("uid1");
    if (!r.ok) throw new Error(r.error);
    expect(r.value?.ultimaCorridaMs).toBe(1789658732984);
    expect(r.value?.leidos).toBe(26);
  });

  it("devuelve null si el puente nunca corrió", async () => {
    const r = await leerEstadoPuente("uid1");
    if (!r.ok) throw new Error(r.error);
    expect(r.value).toBeNull();
  });
});
