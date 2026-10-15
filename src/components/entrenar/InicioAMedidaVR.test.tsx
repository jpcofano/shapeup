// P102 — el arranque a medida espera el historial hasta 3 s, con «Empezar»
// habilitado. Si llega antes y no se tocó nada, los valores se actualizan; si
// ya se tocó algo, no se pisan. Pasado el plazo, queda el respaldo.
import { describe, it, expect, vi, afterEach } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { InicioAMedidaVR, ESPERA_HISTORIAL_MS } from "./InicioAMedidaVR";
import { RUTINAS_VR, RUT_A_MEDIDA, EJ_BODYCOMBAT } from "../../lib/catalogoVR";
import type { Historial, Rutina } from "../../types/models";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const A_MEDIDA = RUTINAS_VR.find((r) => r.idRutina === RUT_A_MEDIDA)! as Rutina;
/** La última vez con Les Mills: 3 × 25 con 1:00. */
const HISTORIAL = [{
  idRutina: RUT_A_MEDIDA, fechaRealizada: "2026-10-14", inicioMs: 1,
  vr: {
    modo: "bloques", escalon: 1, idEjercicio: EJ_BODYCOMBAT, completoDeclarado: true, dificultad: "avanzado",
    prescripto: { bloques: 3, minutosBloque: 25, descansoSeg: 60, dificultad: "intermedio" },
  },
}] as unknown as Historial[];

let root: Root | null = null;
afterEach(() => { act(() => root?.unmount()); root = null; vi.useRealTimers(); });

function montar() {
  const div = document.createElement("div");
  root = createRoot(div);
  const onEmpezar = vi.fn();
  const render = (historial: Historial[] | null) => act(() => root!.render(createElement(InicioAMedidaVR, {
    rutina: A_MEDIDA, perfil: undefined, seguida: null, catalogo: new Map(), historial, onEmpezar,
  })));
  const boton = (t: string) => [...div.querySelectorAll("button")].find((b) => b.textContent === t || b.getAttribute("aria-label") === t)!;
  return { div, render, boton, onEmpezar };
}

describe("InicioAMedidaVR · el historial que tarda (P102)", () => {
  it("si llega antes de «Empezar» y no se tocó nada, los valores se actualizan", () => {
    const { div, render, boton } = montar();
    render(null);
    expect(div.textContent).toContain("Cargando tu última configuración…");
    expect(div.textContent).toContain("2 × 20 min, 2:00 de descanso");   // el respaldo
    expect(boton("Empezar").disabled).toBe(false);

    render(HISTORIAL);
    expect(div.textContent).not.toContain("Cargando tu última configuración…");
    expect(div.textContent).toContain("3 × 25 min, 1:00 de descanso");
  });

  it("si ya se tocó un control, lo que llega no lo pisa", () => {
    const { div, render, boton, onEmpezar } = montar();
    render(null);
    act(() => boton("Más minutos por bloque").click());
    expect(div.textContent).toContain("2 × 25 min, 2:00 de descanso");

    render(HISTORIAL);
    expect(div.textContent).toContain("2 × 25 min, 2:00 de descanso");
    act(() => boton("Empezar").click());
    expect(onEmpezar.mock.calls[0][0].prescripto).toMatchObject({ bloques: 2, minutosBloque: 25, descansoSeg: 120 });
  });

  it("pasados los 3 segundos, se queda con el respaldo y no lo dice", () => {
    vi.useFakeTimers();
    const { div, render } = montar();
    render(null);
    act(() => { vi.advanceTimersByTime(ESPERA_HISTORIAL_MS); });
    expect(div.textContent).not.toContain("Cargando tu última configuración…");

    render(HISTORIAL);
    expect(div.textContent).toContain("2 × 20 min, 2:00 de descanso");
  });
});
