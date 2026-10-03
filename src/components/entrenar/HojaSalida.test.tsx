// La hoja de salida (P68) con los dos datos de P99: sin ellos, se comporta
// igual que siempre; con `puedeGuardar: false` no ofrece guardar.
import { describe, it, expect, vi, afterEach } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { HojaSalida } from "./HojaSalida";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
afterEach(() => { act(() => root?.unmount()); root = null; });

function montar(props: { series: number; minutosJugados?: number; puedeGuardar?: boolean }) {
  const onDescartar = vi.fn();
  const div = document.createElement("div");
  root = createRoot(div);
  act(() => root!.render(createElement(HojaSalida, {
    ...props, guardando: false, error: null,
    onGuardar: vi.fn(), onDescartar, onSeguir: vi.fn(), onReiniciar: vi.fn(),
  })));
  const boton = (texto: string) => [...div.querySelectorAll("button")].find((b) => b.textContent === texto);
  return { div, boton, onDescartar };
}

describe("HojaSalida", () => {
  it("sin series ni minutos: «Guardar y salir» deshabilitado y salir sin guardar no pregunta", () => {
    const { boton, onDescartar } = montar({ series: 0 });
    expect(boton("Guardar y salir")!.disabled).toBe(true);
    act(() => boton("Salir sin guardar")!.click());
    expect(onDescartar).toHaveBeenCalledOnce();
  });
  it("con series, confirma contando series", () => {
    const { div, boton, onDescartar } = montar({ series: 3 });
    expect(boton("Guardar y salir")!.disabled).toBe(false);
    act(() => boton("Salir sin guardar")!.click());
    expect(div.textContent).toContain("Se descartan 3 series.");
    expect(onDescartar).not.toHaveBeenCalled();
  });
  it("con minutos jugados confirma en minutos; sin `puedeGuardar` no ofrece guardar", () => {
    const { div, boton, onDescartar } = montar({ series: 0, minutosJugados: 0.4, puedeGuardar: false });
    expect(boton("Guardar y salir")).toBeUndefined();
    act(() => boton("Salir sin guardar")!.click());
    expect(div.textContent).toContain("Se descarta 1 min jugado.");
    act(() => boton("Descartar")!.click());
    expect(onDescartar).toHaveBeenCalledOnce();
  });
});
