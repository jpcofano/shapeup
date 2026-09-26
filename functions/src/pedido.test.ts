import { describe, it, expect, vi } from "vitest";
import {
  decidir, procesarPedido, payloadPush, esTokenMuerto,
  MAX_EDAD_PEDIDO_MS, MIN_ENTRE_PUSH_MS, type DepsPedido, type Dispositivo, type Pedido,
} from "./pedido";

const AHORA = 1_790_000_000_000;

describe("decidir", () => {
  const disp: Dispositivo = { fcmToken: "tok" };

  it("pedido nuevo con token → mandar", () => {
    expect(decidir({ pedidoMs: AHORA - 1000, origen: "boton" }, disp, AHORA)).toEqual({ accion: "mandar", token: "tok" });
  });
  it("pedido de 6 minutos → ignorar", () => {
    expect(decidir({ pedidoMs: AHORA - 6 * 60_000 }, disp, AHORA)).toEqual({ accion: "ignorar", motivo: "pedido-viejo" });
  });
  it("justo en 5 minutos todavía vale", () => {
    expect(decidir({ pedidoMs: AHORA - MAX_EDAD_PEDIDO_MS }, disp, AHORA).accion).toBe("mandar");
  });
  it("sin token → ignorar (no falla)", () => {
    expect(decidir({ pedidoMs: AHORA }, {}, AHORA)).toEqual({ accion: "ignorar", motivo: "sin-token" });
    expect(decidir({ pedidoMs: AHORA }, null, AHORA)).toEqual({ accion: "ignorar", motivo: "sin-token" });
  });
  it("push hace menos de un minuto → ignorar", () => {
    expect(decidir({ pedidoMs: AHORA }, { fcmToken: "tok", ultimoPushMs: AHORA - 30_000 }, AHORA))
      .toEqual({ accion: "ignorar", motivo: "muy-seguido" });
    expect(decidir({ pedidoMs: AHORA }, { fcmToken: "tok", ultimoPushMs: AHORA - MIN_ENTRE_PUSH_MS }, AHORA).accion)
      .toBe("mandar");
  });
  it("borrado o inválido → ignorar", () => {
    expect(decidir(null, disp, AHORA)).toEqual({ accion: "ignorar", motivo: "borrado" });
    expect(decidir({ pedidoMs: "ya" }, disp, AHORA)).toEqual({ accion: "ignorar", motivo: "pedido-invalido" });
  });
});

describe("payloadPush", () => {
  it("solo datos, todo string", () => {
    expect(payloadPush({ pedidoMs: AHORA, origen: "fin-sesion" }))
      .toEqual({ tipo: "pedido-corrida", pedidoMs: String(AHORA), origen: "fin-sesion" });
  });
});

describe("esTokenMuerto", () => {
  it("reconoce el token no registrado", () => {
    expect(esTokenMuerto({ code: "messaging/registration-token-not-registered" })).toBe(true);
    expect(esTokenMuerto({ code: "messaging/internal-error" })).toBe(false);
  });
});

/** Deps en memoria, con la reserva serializada como lo haría una transacción. */
function depsMemoria(dispositivo: Dispositivo | null, enviar = vi.fn(() => Promise.resolve())) {
  const estado = { dispositivo: dispositivo ? { ...dispositivo } : null };
  let cola = Promise.resolve();
  const deps: DepsPedido = {
    reservarTurno: (_uid, pedido: Pedido, ahora) => {
      const r = cola.then(() => {
        const d = decidir(pedido, estado.dispositivo, ahora);
        if (d.accion === "mandar") estado.dispositivo = { ...estado.dispositivo!, ultimoPushMs: ahora };
        return d;
      });
      cola = r.then(() => undefined);
      return r;
    },
    enviar,
    borrarToken: vi.fn(async () => { if (estado.dispositivo) delete estado.dispositivo.fcmToken; }),
    ahora: () => AHORA,
    log: vi.fn(),
  };
  return { deps, estado, enviar };
}

describe("procesarPedido", () => {
  it("pedido nuevo manda push", async () => {
    const { deps, enviar, estado } = depsMemoria({ fcmToken: "tok" });
    expect(await procesarPedido("u1", { pedidoMs: AHORA, origen: "boton" }, deps)).toEqual({ resultado: "enviado" });
    expect(enviar).toHaveBeenCalledWith("tok", expect.objectContaining({ tipo: "pedido-corrida" }));
    expect(estado.dispositivo?.ultimoPushMs).toBe(AHORA);
  });

  it("pedido de 6 minutos no manda", async () => {
    const { deps, enviar } = depsMemoria({ fcmToken: "tok" });
    await procesarPedido("u1", { pedidoMs: AHORA - 6 * 60_000 }, deps);
    expect(enviar).not.toHaveBeenCalled();
  });

  it("dos pedidos en el mismo minuto mandan uno", async () => {
    const { deps, enviar } = depsMemoria({ fcmToken: "tok" });
    await Promise.all([
      procesarPedido("u1", { pedidoMs: AHORA, origen: "boton" }, deps),
      procesarPedido("u1", { pedidoMs: AHORA, origen: "fin-sesion" }, deps),
    ]);
    expect(enviar).toHaveBeenCalledTimes(1);
  });

  it("sin token no falla", async () => {
    const { deps, enviar } = depsMemoria(null);
    await expect(procesarPedido("u1", { pedidoMs: AHORA }, deps))
      .resolves.toEqual({ resultado: "ignorado", motivo: "sin-token" });
    expect(enviar).not.toHaveBeenCalled();
  });

  it("token muerto: lo borra y no reintenta", async () => {
    const err = Object.assign(new Error("not registered"), { code: "messaging/registration-token-not-registered" });
    const { deps, estado } = depsMemoria({ fcmToken: "tok" }, vi.fn(() => Promise.reject(err)));
    expect(await procesarPedido("u1", { pedidoMs: AHORA }, deps)).toEqual({ resultado: "token-muerto" });
    expect(deps.borrarToken).toHaveBeenCalledWith("u1");
    expect(estado.dispositivo?.fcmToken).toBeUndefined();
  });

  it("un error de FCM cualquiera no tira (una función que tira se reintenta)", async () => {
    const { deps } = depsMemoria({ fcmToken: "tok" }, vi.fn(() => Promise.reject(new Error("unavailable"))));
    await expect(procesarPedido("u1", { pedidoMs: AHORA }, deps)).resolves.toEqual({ resultado: "error", mensaje: "unavailable" });
  });

  it("documento borrado: no toca Firestore", async () => {
    const { deps } = depsMemoria({ fcmToken: "tok" });
    const spy = vi.spyOn(deps, "reservarTurno");
    expect(await procesarPedido("u1", null, deps)).toEqual({ resultado: "ignorado", motivo: "borrado" });
    expect(spy).not.toHaveBeenCalled();
  });
});
