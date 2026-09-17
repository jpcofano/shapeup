import { describe, it, expect, vi, beforeEach } from "vitest";
import type { PerfilesConfig } from "../types/models";

vi.mock("../firebase", () => ({ db: {} }));

/** Sentinel de borrado, como el `deleteField()` real: una instancia de FieldValue. */
class FieldValueMock {}
const setDocCalls: Array<{ path: string; data: Record<string, unknown>; opts: unknown }> = [];
let docData: PerfilesConfig | null = null;

vi.mock("firebase/firestore", () => ({
  FieldValue: FieldValueMock,
  deleteField: vi.fn(() => new FieldValueMock()),
  doc: vi.fn((_db, col: string, id: string) => ({ path: `${col}/${id}` })),
  getDoc: vi.fn(() =>
    Promise.resolve({ exists: () => docData != null, data: () => docData }),
  ),
  setDoc: vi.fn((ref: { path: string }, data: Record<string, unknown>, opts: unknown) => {
    setDocCalls.push({ path: ref.path, data, opts });
    return Promise.resolve();
  }),
}));

const { deleteField } = await import("firebase/firestore");
const { getPerfiles, actualizarPerfil, invalidarCachePerfiles } = await import("./perfiles");

beforeEach(() => {
  setDocCalls.length = 0;
  docData = null;
  invalidarCachePerfiles();
  vi.clearAllMocks();
});

describe("actualizarPerfil", () => {
  it("escribe solo bajo la clave del miembro, con merge", async () => {
    const r = await actualizarPerfil("juanpablo", { lugarHabitual: "Gimnasio" });
    expect(r.ok).toBe(true);
    expect(setDocCalls).toHaveLength(1);
    expect(setDocCalls[0].path).toBe("config/perfiles");
    expect(setDocCalls[0].data).toEqual({ juanpablo: { lugarHabitual: "Gimnasio" } });
    expect(setDocCalls[0].opts).toEqual({ merge: true });
  });

  it("no toca el perfil de los demás miembros en la caché", async () => {
    docData = { juanpablo: { color: "#60a5fa" }, maria: { color: "#f472b6" } };
    await getPerfiles();
    await actualizarPerfil("juanpablo", { objetivos: ["Fuerza"] });
    const r = await getPerfiles();
    if (!r.ok) throw new Error(r.error);
    expect(r.value.maria).toEqual({ color: "#f472b6" });
    expect(r.value.juanpablo).toEqual({ color: "#60a5fa", objetivos: ["Fuerza"] });
  });

  it("rellena la caché con lo escrito: la próxima lectura no vuelve a Firestore", async () => {
    docData = { juanpablo: { color: "#60a5fa" } };
    await getPerfiles();
    await actualizarPerfil("juanpablo", { equipoPorLugar: { Casa: ["Mancuernas"] } });
    // Si volviera a Firestore, leería el docData viejo (sin equipoPorLugar).
    const r = await getPerfiles();
    if (!r.ok) throw new Error(r.error);
    expect(r.value.juanpablo?.equipoPorLugar).toEqual({ Casa: ["Mancuernas"] });
  });

  it("un deleteField() saca la clave de la caché, no la guarda como valor", async () => {
    docData = { juanpablo: { equipoDisponible: ["Mancuernas"], lugarHabitual: "Casa" } };
    await getPerfiles();
    await actualizarPerfil("juanpablo", {
      equipoPorLugar: { Casa: ["Mancuernas"] },
      equipoDisponible: deleteField(),
    });
    const r = await getPerfiles();
    if (!r.ok) throw new Error(r.error);
    expect(r.value.juanpablo).toEqual({
      lugarHabitual: "Casa",
      equipoPorLugar: { Casa: ["Mancuernas"] },
    });
    // Al escribir sí viaja el sentinel: es Firestore quien borra el campo.
    expect(setDocCalls[0].data.juanpablo).toHaveProperty("equipoDisponible");
  });

  it("si la escritura falla, devuelve err y no ensucia la caché", async () => {
    docData = { juanpablo: { color: "#60a5fa" } };
    await getPerfiles();
    const { setDoc } = await import("firebase/firestore");
    vi.mocked(setDoc).mockRejectedValueOnce(new Error("permission-denied"));
    const r = await actualizarPerfil("juanpablo", { objetivos: ["Fuerza"] });
    expect(r.ok).toBe(false);
    const leido = await getPerfiles();
    if (!leido.ok) throw new Error(leido.error);
    expect(leido.value.juanpablo).toEqual({ color: "#60a5fa" });
  });
});

describe("invalidarCachePerfiles", () => {
  it("fuerza que la próxima lectura vuelva a Firestore", async () => {
    docData = { juanpablo: { color: "#60a5fa" } };
    await getPerfiles();
    docData = { juanpablo: { color: "#111111" } };
    const cacheado = await getPerfiles();
    if (!cacheado.ok) throw new Error(cacheado.error);
    expect(cacheado.value.juanpablo?.color).toBe("#60a5fa");

    invalidarCachePerfiles();
    const fresco = await getPerfiles();
    if (!fresco.ok) throw new Error(fresco.error);
    expect(fresco.value.juanpablo?.color).toBe("#111111");
  });
});
