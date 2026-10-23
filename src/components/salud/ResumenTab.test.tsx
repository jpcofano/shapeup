// P109 — Salud → Resumen nuevo, con los escenarios inventados de /qa/salud-resumen.
import { describe, it, expect, afterEach } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { ResumenTab } from "./ResumenTab";
import { PildoraTabs, TABS_SALUD } from "./SaludEncabezado";
import { ESCENARIOS_QA, HOY_QA, PantallaResumenQa } from "../../routes/QaSaludResumen";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
afterEach(() => { act(() => root?.unmount()); root = null; });

function montar(el: React.ReactElement) {
  const div = document.createElement("div");
  root = createRoot(div);
  act(() => root!.render(createElement(MemoryRouter, null, el)));
  return div;
}
const escenario = (id: string) => ESCENARIOS_QA.find((e) => e.id === id)!;
const resumen = (id: string, onTabChange = () => {}) => {
  const e = escenario(id);
  return createElement(ResumenTab, { metricas: e.metricas, sueno: e.sueno, mediciones: e.mediciones, hoy: HOY_QA, onTabChange });
};

describe("ResumenTab (P109)", () => {
  it("con todo: el sueño de anoche destacado y las cuatro tarjetas de «Tu cuerpo»", () => {
    const div = montar(resumen("con-todo"));
    const sueno = div.querySelector("[data-seccion=sueno]")!;
    expect(sueno.textContent).toContain("Sueño de anoche");
    expect(sueno.textContent).toContain("6 h 54");
    expect(sueno.textContent).toContain("23:41 → 6:35");
    expect(sueno.textContent).toContain("Tu promedio");
    expect(sueno.querySelectorAll("[data-noche]")).toHaveLength(7);
    expect(sueno.querySelector(".resumen-sueno-barra.ultima")).not.toBeNull();
    expect(sueno.querySelector("[data-testid=sueno-promedio]")).not.toBeNull();
    const tarjetas = [...div.querySelectorAll("[data-tarjeta]")].map((t) => t.getAttribute("data-tarjeta"));
    expect(tarjetas).toEqual(["peso", "grasa", "presion", "spo2"]);
    expect(div.querySelector("[data-tarjeta].ancho")).toBeNull();
    expect(div.textContent).toContain("Oxígeno en sangre");
    expect(div.textContent).not.toContain("SpO2");
    expect(div.textContent).not.toMatch(/FC de reposo|FC reposo/);
  });

  it("sin sueño: no hay tarjeta de sueño", () => {
    const div = montar(resumen("sin-sueno"));
    expect(div.querySelector("[data-seccion=sueno]")).toBeNull();
    expect(div.querySelectorAll("[data-tarjeta]").length).toBe(4);
  });

  it("sin grasa: tres tarjetas, y la que queda sola ocupa las dos columnas", () => {
    const div = montar(resumen("sin-grasa"));
    const tarjetas = [...div.querySelectorAll("[data-tarjeta]")];
    expect(tarjetas.map((t) => t.getAttribute("data-tarjeta"))).toEqual(["peso", "presion", "spo2"]);
    expect(tarjetas[2].classList.contains("ancho")).toBe(true);
    expect(tarjetas[0].classList.contains("ancho")).toBe(false);
  });

  it("la presión y el oxígeno no llevan semáforo ni flechas de color, y la presión no dice «lecturas»", () => {
    const div = montar(resumen("con-todo"));
    for (const clave of ["presion", "spo2"]) {
      const t = div.querySelector(`[data-tarjeta=${clave}]`)!;
      expect(t.innerHTML).not.toMatch(/--(danger|warning|success)/);
      expect(t.textContent).not.toMatch(/[↑↓]/);
    }
    expect(div.querySelector("[data-tarjeta=presion]")!.textContent).not.toMatch(/lecturas/);
  });

  it("«Ver todas las tendencias» lleva a Tendencias", () => {
    let destino = "";
    const div = montar(resumen("con-todo", ((t: string) => { destino = t; }) as never));
    const link = [...div.querySelectorAll("button")].find((b) => b.textContent?.includes("Ver todas las tendencias"))!;
    act(() => link.click());
    expect(destino).toBe("progreso");
  });

  it("sin datos: el estado vacío", () => {
    const div = montar(resumen("sin-datos"));
    expect(div.textContent).toContain("Sin datos de salud todavía");
  });
});

describe("Salud: el puente y las pestañas (P109)", () => {
  it("al día: una línea con «Datos al día» y el botón redondo de sincronizar; sin la tarjeta", () => {
    const div = montar(createElement(PantallaResumenQa, { e: escenario("con-todo") }));
    const linea = div.querySelector("[data-testid=linea-puente]")!;
    expect(linea.textContent).toContain("Datos al día");
    expect(linea.textContent).toContain("el reloj sincronizó hace 2 h");
    expect(linea.querySelector("button[aria-label='Sincronizar ahora']")).not.toBeNull();
    expect(div.textContent).not.toContain("Puente Samsung");
  });

  it("con error: la tarjeta completa con el error, sin la línea", () => {
    const div = montar(createElement(PantallaResumenQa, { e: escenario("sin-sueno") }));
    expect(div.querySelector("[data-testid=linea-puente]")).toBeNull();
    expect(div.textContent).toContain("Puente Samsung");
    expect(div.textContent).toContain("No se pudo leer lo que subió el puente.");
  });

  it("las pestañas se llaman Resumen, Cuerpo, Cardio, Sueño y Tendencias; las claves no cambian", () => {
    const div = montar(createElement(PildoraTabs, { tab: "resumen", onChange: () => {} }));
    const tabs = [...div.querySelectorAll("[role=tab]")];
    expect(tabs.map((t) => t.textContent)).toEqual(["Resumen", "Cuerpo", "Cardio", "Sueño", "Tendencias"]);
    expect(TABS_SALUD.map((t) => t.key)).toEqual(["resumen", "composicion", "cardio", "sueno", "progreso"]);
    expect(tabs[0].getAttribute("aria-selected")).toBe("true");
  });

  it("el encabezado lleva la fecha de hoy arriba del título", () => {
    const div = montar(createElement(PantallaResumenQa, { e: escenario("con-todo") }));
    expect(div.querySelector(".salud-fecha")!.textContent).toBe("Jueves 22 de octubre");
    expect(div.querySelectorAll(".salud-acciones .btn-redondo")).toHaveLength(3);
  });
});
