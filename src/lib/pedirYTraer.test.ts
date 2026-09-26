import { describe, it, expect, vi } from "vitest";
import { pedirYTraer, avisoRespuesta, type DepsPedirYTraer } from "./pedirYTraer";
import { ok, err } from "./result";

function deps(over: Partial<DepsPedirYTraer<string>> = {}): DepsPedirYTraer<string> {
  return {
    hayPuenteEscuchando: vi.fn(() => Promise.resolve(true)),
    pedir: vi.fn(() => Promise.resolve(ok(1000))),
    esperar: vi.fn(() => Promise.resolve({ contesto: true })),
    traer: vi.fn(() => Promise.resolve(ok("resumen"))),
    alCambiarFase: vi.fn(),
    ...over,
  };
}

describe("pedirYTraer", () => {
  it("pide, espera desde el pedidoMs, e importa", async () => {
    const d = deps();
    expect(await pedirYTraer(d)).toEqual({ contesto: "contesto", resultado: ok("resumen") });
    expect(d.esperar).toHaveBeenCalledWith(1000);
    expect(d.alCambiarFase).toHaveBeenNthCalledWith(1, "pidiendo");
    expect(d.alCambiarFase).toHaveBeenNthCalledWith(2, "importando");
  });

  it("importa igual cuando el puente no contesta", async () => {
    const d = deps({ esperar: vi.fn(() => Promise.resolve({ contesto: false })) });
    const r = await pedirYTraer(d);
    expect(r.contesto).toBe("no-contesto");
    expect(d.traer).toHaveBeenCalledTimes(1);
    expect(r.resultado).toEqual(ok("resumen"));
  });

  it("importa igual cuando el pedido no se pudo escribir, sin esperar", async () => {
    const d = deps({ pedir: vi.fn(() => Promise.resolve(err<number>("sin señal"))) });
    const r = await pedirYTraer(d);
    expect(r.contesto).toBe("no-se-pudo-pedir");
    expect(d.esperar).not.toHaveBeenCalled();
    expect(d.traer).toHaveBeenCalledTimes(1);
  });

  it("sin puente registrado no espera, pero pide igual e importa", async () => {
    const d = deps({ hayPuenteEscuchando: vi.fn(() => Promise.resolve(false)) });
    const r = await pedirYTraer(d);
    expect(r.contesto).toBe("sin-puente");
    expect(d.pedir).toHaveBeenCalled();
    expect(d.esperar).not.toHaveBeenCalled();
    expect(d.traer).toHaveBeenCalledTimes(1);
  });

  it("si algo tira en el paso de pedir, importa igual", async () => {
    const d = deps({ esperar: vi.fn(() => Promise.reject(new Error("boom"))) });
    const r = await pedirYTraer(d);
    expect(r.contesto).toBe("no-se-pudo-pedir");
    expect(d.traer).toHaveBeenCalledTimes(1);
  });
});

describe("avisoRespuesta", () => {
  it("el texto del prompt cuando no contestó", () => {
    expect(avisoRespuesta("no-contesto", "importado"))
      .toBe("El reloj no contestó a tiempo; se importó lo que ya estaba. Lo que falte entra en la próxima.");
    expect(avisoRespuesta("contesto", "importado")).toBeNull();
  });
});
