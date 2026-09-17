import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { conTimeout } from "./conTimeout";

describe("conTimeout", () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it("confirma antes del timeout", async () => {
    const promesa = new Promise<string>((res) => setTimeout(() => res("listo"), 3000));
    const carrera = conTimeout(promesa, 8000);
    await vi.advanceTimersByTimeAsync(3000);
    await expect(carrera).resolves.toEqual({ tipo: "ok", valor: "listo" });
  });

  it("vence el timeout si la promesa no resuelve", async () => {
    const promesa = new Promise<string>(() => { /* nunca */ });
    const carrera = conTimeout(promesa, 8000);
    await vi.advanceTimersByTimeAsync(8000);
    await expect(carrera).resolves.toEqual({ tipo: "timeout" });
  });

  it("falla si la promesa falla antes del timeout", async () => {
    const promesa = new Promise<string>((_res, rej) => setTimeout(() => rej(new Error("denegado")), 1000));
    const carrera = conTimeout(promesa, 8000);
    const verificacion = expect(carrera).rejects.toThrow("denegado");
    await vi.advanceTimersByTimeAsync(1000);
    await verificacion;
  });

  it("un fallo después del timeout no cambia el resultado", async () => {
    let rechazar: (e: Error) => void = () => {};
    const promesa = new Promise<string>((_res, rej) => { rechazar = rej; });
    promesa.catch(() => { /* el llamador maneja el resultado tardío */ });
    const carrera = conTimeout(promesa, 8000);
    await vi.advanceTimersByTimeAsync(8000);
    rechazar(new Error("tarde"));
    await expect(carrera).resolves.toEqual({ tipo: "timeout" });
  });
});
