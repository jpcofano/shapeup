// P106 — Tendencias de salud: la presión muestra la fecha de su último dato.
// Casos inventados.
import { describe, it, expect, afterEach } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { ProgresoTab } from "./ProgresoTab";
import type { MetricaSalud } from "../../types/models";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
class RO { observe() {} unobserve() {} disconnect() {} }
(globalThis as unknown as { ResizeObserver: typeof RO }).ResizeObserver ??= RO;

let root: Root | null = null;
afterEach(() => { act(() => root?.unmount()); root = null; });

const HOY = "2026-06-30";
const dia = (n: number) => new Date(Date.UTC(2026, 5, 30 - n)).toISOString().slice(0, 10);
const met = (tipo: string, fecha: string, valor: number) =>
  ({ idMetrica: `${tipo}-${fecha}`, miembro: "juanpablo", tipo, fecha, valor, agregacion: "dia", fuente: "samsung-health-csv" }) as MetricaSalud;

/** La presión desde hace `desde` días hacia atrás, una por día. */
const presion = (desde: number, n = 10) => Array.from({ length: n }, (_, i) => [
  met("presion-sistolica", dia(desde + i), 118 + (i % 3)),
  met("presion-diastolica", dia(desde + i), 76),
]).flat();

function montar(metricas: MetricaSalud[]) {
  const div = document.createElement("div");
  root = createRoot(div);
  act(() => root!.render(createElement(ProgresoTab, { mediciones: [], historial: [], metricas, sueno: [], hoy: HOY })));
  return div;
}
const tocar = (div: HTMLElement, texto: string) => {
  const b = [...div.querySelectorAll("button")].find((x) => x.textContent?.trim() === texto);
  if (!b) throw new Error(`no está «${texto}»`);
  act(() => b.click());
};

describe("Tendencias: la presión con la fecha de su último dato (P106)", () => {
  it("vieja: «hace N días · se actualiza con el ZIP»", () => {
    const div = montar(presion(20));
    tocar(div, "Presión");
    expect(div.querySelector("[data-testid=presion-antiguedad]")?.textContent).toBe("Último dato: hace 20 días · se actualiza con el ZIP");
  });

  it("reciente: «ayer», sin la aclaración", () => {
    const div = montar(presion(1));
    tocar(div, "Presión");
    expect(div.querySelector("[data-testid=presion-antiguedad]")?.textContent).toBe("Último dato: ayer");
  });

  it("en otra métrica no aparece", () => {
    const div = montar([...presion(1), ...Array.from({ length: 10 }, (_, i) => met("spo2", dia(i), 96))]);
    tocar(div, "SpO2");
    expect(div.querySelector("[data-testid=presion-antiguedad]")).toBeNull();
  });
});
