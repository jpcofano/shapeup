// La función contra el emulador de Firestore (P89): transacción real, FCM falso.
// Corre con `npm run test:functions` (levanta el emulador); la suite normal lo
// excluye porque necesita el emulador y las dependencias de functions/.
import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { crearDeps } from "./deps.js";
import { procesarPedido } from "./pedido.js";

const AHORA = 1_790_000_000_000;
let db: Firestore;

beforeAll(() => {
  if (!process.env.FIRESTORE_EMULATOR_HOST) throw new Error("Falta el emulador: corré npm run test:functions");
  if (getApps().length === 0) initializeApp({ projectId: "shapeup-41e74" });
  db = getFirestore();
});

const disp = (uid: string) => db.doc(`ingesta-sdk/${uid}/estado/dispositivo`);

beforeEach(async () => {
  await db.recursiveDelete(db.collection("ingesta-sdk"));
});

function armar() {
  const enviar = vi.fn(() => Promise.resolve());
  return { enviar, deps: crearDeps(db, enviar, vi.fn(), () => AHORA) };
}

describe("pedirCorridaAlPuente contra el emulador", () => {
  it("pedido nuevo manda push y anota ultimoPushMs", async () => {
    await disp("u1").set({ fcmToken: "tok", actualizadoMs: 1 });
    const { deps, enviar } = armar();
    expect(await procesarPedido("u1", { pedidoMs: AHORA, origen: "boton" }, deps)).toEqual({ resultado: "enviado" });
    expect(enviar).toHaveBeenCalledTimes(1);
    expect((await disp("u1").get()).data()?.ultimoPushMs).toBe(AHORA);
  });

  it("pedido de 6 minutos no manda", async () => {
    await disp("u1").set({ fcmToken: "tok" });
    const { deps, enviar } = armar();
    await procesarPedido("u1", { pedidoMs: AHORA - 6 * 60_000 }, deps);
    expect(enviar).not.toHaveBeenCalled();
  });

  it("dos pedidos simultáneos en el mismo minuto mandan uno (transacción real)", async () => {
    await disp("u1").set({ fcmToken: "tok" });
    const { deps, enviar } = armar();
    await Promise.all([
      procesarPedido("u1", { pedidoMs: AHORA, origen: "boton" }, deps),
      procesarPedido("u1", { pedidoMs: AHORA, origen: "fin-sesion" }, deps),
    ]);
    expect(enviar).toHaveBeenCalledTimes(1);
  });

  it("sin documento de dispositivo no falla", async () => {
    const { deps, enviar } = armar();
    await expect(procesarPedido("u1", { pedidoMs: AHORA }, deps))
      .resolves.toEqual({ resultado: "ignorado", motivo: "sin-token" });
    expect(enviar).not.toHaveBeenCalled();
  });

  it("token muerto: se borra fcmToken y queda el resto", async () => {
    await disp("u1").set({ fcmToken: "tok", modelo: "SM-S911B" });
    const err = Object.assign(new Error("x"), { code: "messaging/registration-token-not-registered" });
    const deps = crearDeps(db, vi.fn(() => Promise.reject(err)), vi.fn(), () => AHORA);
    expect(await procesarPedido("u1", { pedidoMs: AHORA }, deps)).toEqual({ resultado: "token-muerto" });
    const d = (await disp("u1").get()).data();
    expect(d?.fcmToken).toBeUndefined();
    expect(d?.modelo).toBe("SM-S911B");
  });

  it("solo toca el dispositivo del uid del pedido", async () => {
    await disp("u1").set({ fcmToken: "tok-u1" });
    await disp("u2").set({ fcmToken: "tok-u2" });
    const { deps, enviar } = armar();
    await procesarPedido("u1", { pedidoMs: AHORA }, deps);
    expect(enviar).toHaveBeenCalledWith("tok-u1", expect.anything());
    expect((await disp("u2").get()).data()?.ultimoPushMs).toBeUndefined();
  });
});
