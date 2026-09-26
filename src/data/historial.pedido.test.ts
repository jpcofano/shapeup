// P89: al guardar una sesión sale el pedido al puente, sin bloquear el guardado
// y sin que una falla del pedido rompa nada.
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../firebase", () => ({ db: {}, auth: { currentUser: { uid: "u1" } } }));

const commitMock = vi.fn(() => Promise.resolve());
vi.mock("firebase/firestore", () => ({
  collection: vi.fn(), doc: vi.fn((_db, ...p: string[]) => ({ path: p.join("/") })),
  getDocs: vi.fn(), getDoc: vi.fn(), getDocFromServer: vi.fn(),
  serverTimestamp: vi.fn(() => "TS"), updateDoc: vi.fn(),
  query: vi.fn(), where: vi.fn(), orderBy: vi.fn(), limit: vi.fn(),
  writeBatch: vi.fn(() => ({ set: vi.fn(), commit: () => commitMock() })),
}));

const pedirMock = vi.fn((_uid: string, _origen: string) => Promise.resolve({ ok: true, value: 1 }));
vi.mock("./pedidoPuente", () => ({
  pedirSincronizacion: (uid: string, origen: string) => pedirMock(uid, origen),
}));

import { finalizarSesion } from "./historial";
import { leerMarcas } from "../lib/sincronizacionAutomatica";

const opts = {
  rutinaId: "RUT-1", nombreRutina: "Fuerza", miembro: "juanpablo" as const,
  bloques: [], rpe: null, duracionMin: 30,
  ventana: { inicioMs: 1_790_000_000_000, finMs: 1_790_001_800_000 },
};

beforeEach(() => { pedirMock.mockClear(); commitMock.mockClear(); localStorage.clear(); });

describe("finalizarSesion → pedido al puente (P89)", () => {
  it("al guardar una sesión se escribe el pedido con origen fin-sesion", async () => {
    const r = await finalizarSesion(opts);
    expect(r.ok).toBe(true);
    expect(pedirMock).toHaveBeenCalledWith("u1", "fin-sesion");
    // Y queda anotado el fin, para que la automática sepa si el puente quedó atrás.
    expect(leerMarcas(localStorage, "u1").ultimaSesionFinMs).toBe(1_790_001_800_000);
  });

  it("si el pedido falla, la sesión queda guardada igual", async () => {
    pedirMock.mockImplementationOnce(() => Promise.reject(new Error("permission-denied")));
    const r = await finalizarSesion(opts);
    expect(r).toMatchObject({ ok: true, value: { pendiente: false } });
    expect(commitMock).toHaveBeenCalledTimes(1);
  });

  it("si pedir tira sincrónicamente, tampoco rompe el guardado", async () => {
    pedirMock.mockImplementationOnce(() => { throw new Error("boom"); });
    const r = await finalizarSesion(opts);
    expect(r.ok).toBe(true);
  });

  it("si el guardado falla, no se pide nada", async () => {
    commitMock.mockImplementationOnce(() => Promise.reject(new Error("permission-denied")));
    const r = await finalizarSesion(opts);
    expect(r.ok).toBe(false);
    expect(pedirMock).not.toHaveBeenCalled();
  });
});
