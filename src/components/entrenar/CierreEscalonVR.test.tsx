// El cierre de una sesión de VR por escalones no deja guardar sin elegir la
// dificultad (decisión del 02/10): la regla separa las series por dificultad.
import { describe, it, expect, vi, afterEach } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { CierreEscalonVR } from "./CierreEscalonVR";
import { DIFICULTADES_BODYCOMBAT } from "../../lib/escalonesVR";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
afterEach(() => { act(() => root?.unmount()); root = null; });

function montar(onGuardar = vi.fn()) {
  const div = document.createElement("div");
  root = createRoot(div);
  act(() => root!.render(createElement(CierreEscalonVR, {
    prescripto: { bloques: 2, minutosBloque: 20, descansoSeg: 120, dificultad: "intermedio" },
    minutosJugados: 42, dificultades: DIFICULTADES_BODYCOMBAT, guardando: false, error: null, onGuardar,
  })));
  const boton = (texto: string) => [...div.querySelectorAll("button")].find((b) => b.textContent === texto)!;
  return { div, boton, onGuardar };
}

describe("CierreEscalonVR: la dificultad es obligatoria", () => {
  it("sin dificultad, «Guardar» está deshabilitado y lo dice", () => {
    const { div, boton, onGuardar } = montar();
    expect(boton("Guardar").disabled).toBe(true);
    expect(div.textContent).toContain("Elegí la dificultad para guardar.");
    act(() => boton("Sí").click());
    expect(boton("Guardar").disabled).toBe(true);
    act(() => boton("Guardar").click());
    expect(onGuardar).not.toHaveBeenCalled();
  });
  it("con la dificultad elegida guarda, aunque no se haya contestado si se completó", () => {
    const { div, boton, onGuardar } = montar();
    act(() => boton("Mixto").click());
    expect(boton("Guardar").disabled).toBe(false);
    expect(div.textContent).not.toContain("Elegí la dificultad para guardar.");
    act(() => boton("Guardar").click());
    expect(onGuardar).toHaveBeenCalledWith({ completoDeclarado: null, dificultad: "mixto" });
  });
});
