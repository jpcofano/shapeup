import { describe, it, expect, vi } from "vitest";
import {
  decidir, procesarPedido, payloadPush, esTokenMuerto, desfaseCliente,
  MAX_EDAD_PEDIDO_MS, MIN_ENTRE_PUSH_MS, type DepsPedido, type Dispositivo, type Pedido,
} from "./pedido";

const AHORA = 1_790_000_000_000;

describe("decidir", () => {
  const disp: Dispositivo = { fcmToken: "tok" };

  it("pedido nuevo con token → mandar", () => {
    expect(decidir({ pedidoMs: AHORA - 1000, origen: "boton" }, disp, AHORA, AHORA)).toEqual({ accion: "mandar", token: "tok" });
  });
  it("escrito hace 6 minutos → pedido-viejo", () => {
    expect(decidir({ pedidoMs: AHORA }, disp, AHORA, AHORA - 6 * 60_000)).toEqual({ accion: "ignorar", motivo: "pedido-viejo" });
  });
  it("escrito justo hace 5 minutos todavía vale", () => {
    expect(decidir({ pedidoMs: AHORA }, disp, AHORA, AHORA - MAX_EDAD_PEDIDO_MS).accion).toBe("mandar");
  });
  it("sin token → ignorar (no falla)", () => {
    expect(decidir({ pedidoMs: AHORA }, {}, AHORA, AHORA)).toEqual({ accion: "ignorar", motivo: "sin-token" });
    expect(decidir({ pedidoMs: AHORA }, null, AHORA, AHORA)).toEqual({ accion: "ignorar", motivo: "sin-token" });
  });
  it("push hace menos de un minuto → ignorar", () => {
    expect(decidir({ pedidoMs: AHORA }, { fcmToken: "tok", ultimoPushMs: AHORA - 30_000 }, AHORA, AHORA))
      .toEqual({ accion: "ignorar", motivo: "muy-seguido" });
    expect(decidir({ pedidoMs: AHORA }, { fcmToken: "tok", ultimoPushMs: AHORA - MIN_ENTRE_PUSH_MS }, AHORA, AHORA).accion)
      .toBe("mandar");
  });
  it("borrado → ignorar", () => {
    expect(decidir(null, disp, AHORA, AHORA)).toEqual({ accion: "ignorar", motivo: "borrado" });
  });

  // ── P91: el reloj del cliente no decide ────────────────────────────────────
  it("reloj corrido: pedidoMs SEIS MINUTOS ATRASADO, escrito ahora → manda (antes lo descartaba)", () => {
    expect(decidir({ pedidoMs: AHORA - 6 * 60_000 }, disp, AHORA, AHORA)).toEqual({ accion: "mandar", token: "tok" });
  });
  it("reloj corrido: pedidoMs DIEZ MINUTOS ADELANTADO, escrito ahora → manda", () => {
    expect(decidir({ pedidoMs: AHORA + 10 * 60_000 }, disp, AHORA, AHORA).accion).toBe("mandar");
  });
  it("escrito hace 6 minutos → pedido-viejo, sea cual sea pedidoMs", () => {
    for (const pedidoMs of [AHORA, AHORA + 10 * 60_000, AHORA - 60 * 60_000]) {
      expect(decidir({ pedidoMs }, disp, AHORA, AHORA - 6 * 60_000))
        .toEqual({ accion: "ignorar", motivo: "pedido-viejo" });
    }
  });
  it("pedidoMs ausente o inválido ya no descarta el pedido", () => {
    expect(decidir({ origen: "boton" }, disp, AHORA, AHORA).accion).toBe("mandar");
    expect(decidir({ pedidoMs: "ya" }, disp, AHORA, AHORA).accion).toBe("mandar");
  });
});

describe("payloadPush", () => {
  it("solo datos, todo string", () => {
    expect(payloadPush({ pedidoMs: AHORA, origen: "fin-sesion" }))
      .toEqual({ tipo: "pedido-corrida", pedidoMs: String(AHORA), origen: "fin-sesion" });
  });
  it("pedidoMs ausente → '0' (P91)", () => {
    expect(payloadPush({ origen: "boton" }).pedidoMs).toBe("0");
    expect(payloadPush({ pedidoMs: "ya", origen: "boton" }).pedidoMs).toBe("0");
  });
});

describe("desfaseCliente (P91)", () => {
  it("anota el desfase si pasa de un minuto, con signo", () => {
    expect(desfaseCliente({ pedidoMs: AHORA - 6 * 60_000 }, AHORA)).toBe(-6 * 60_000);
    expect(desfaseCliente({ pedidoMs: AHORA + 90_000 }, AHORA)).toBe(90_000);
  });
  it("hasta un minuto no se anota, ni si pedidoMs no es un número", () => {
    expect(desfaseCliente({ pedidoMs: AHORA - 30_000 }, AHORA)).toBeNull();
    expect(desfaseCliente({}, AHORA)).toBeNull();
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
    reservarTurno: (_uid, pedido: Pedido, ahora, escrituraMs) => {
      const r = cola.then(() => {
        const d = decidir(pedido, estado.dispositivo, ahora, escrituraMs);
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
    await procesarPedido("u1", { pedidoMs: AHORA }, deps, AHORA - 6 * 60_000);
    expect(enviar).not.toHaveBeenCalled();
  });

  it("reloj del cliente seis minutos atrasado: manda igual y anota el desfase (P91)", async () => {
    const { deps, enviar } = depsMemoria({ fcmToken: "tok" });
    expect(await procesarPedido("u1", { pedidoMs: AHORA - 6 * 60_000 }, deps, AHORA)).toEqual({ resultado: "enviado" });
    expect(enviar).toHaveBeenCalledTimes(1);
    expect(deps.log).toHaveBeenCalledWith("warn", expect.stringContaining("reloj del cliente"),
      expect.objectContaining({ desfaseMs: -6 * 60_000 }));
  });

  it("sin escrituraMs se trata como recién escrito, nunca con pedidoMs de respaldo", async () => {
    const { deps, enviar } = depsMemoria({ fcmToken: "tok" });
    // pedidoMs de hace una hora: si se usara como respaldo, sería "pedido-viejo".
    expect(await procesarPedido("u1", { pedidoMs: AHORA - 60 * 60_000 }, deps)).toEqual({ resultado: "enviado" });
    expect(enviar).toHaveBeenCalledTimes(1);
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
