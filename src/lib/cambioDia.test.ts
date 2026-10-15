import { describe, it, expect } from "vitest";
import {
  opcionesCambio, lineaCambio, cambioDeNavegacion, motivoCambioLabel,
  busquedaCambio, cambioDeBusqueda, cambioDeUbicacion, paramsCambio,
} from "./cambioDia";
import { PROGRAMA_VR, RUTINAS_VR } from "./catalogoVR";
import type { Rutina } from "../types/models";

const rutinas = [
  ...RUTINAS_VR,
  { idRutina: "RUT-0001", nombre: "Fuerza A", foco: "Cuerpo completo" },
  { idRutina: "RUT-0004", nombre: "VR vieja", foco: "VR", archivada: true },
  { idRutina: "RUT-0014", nombre: "VR — Intervalos", foco: "VR" },
] as Rutina[];

describe("opcionesCambio (P102)", () => {
  const ops = opcionesCambio("RUT-0027" /* Creed */, PROGRAMA_VR, rutinas);

  it("en orden: a medida, el programa, otras de VR, libre y ver todas", () => {
    expect(ops.map((o) => o.grupo)).toEqual(["a-medida", "programa", "programa", "vr", "vr", "libre", "todas"]);
    expect(ops[0]).toEqual({ grupo: "a-medida", idRutina: "RUT-0030", nombre: "VR — A medida" });
    expect(ops.filter((o) => o.grupo === "programa").map((o) => o.idRutina)).toEqual(["RUT-0026", "RUT-0028"]);
    expect(ops.filter((o) => o.grupo === "vr").map((o) => o.idRutina)).toEqual(["RUT-0029", "RUT-0014"]);
  });

  it("nunca la prevista, ni repetidas, ni archivadas", () => {
    const ids = ops.map((o) => o.idRutina).filter(Boolean);
    expect(ids).not.toContain("RUT-0027");
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).not.toContain("RUT-0004");
    expect(ids).not.toContain("RUT-0001");   // no es de VR ni del programa
  });

  it("sin la rutina cargada, el nombre sale de la etiqueta del día", () => {
    const o = opcionesCambio("RUT-0027", PROGRAMA_VR, []);
    expect(o.filter((x) => x.grupo === "programa").map((x) => x.nombre)).toEqual(["Combat largo", "Ritmo suave"]);
  });

  it("sin programa, igual ofrece a medida, VR, libre y ver todas", () => {
    expect(opcionesCambio("RUT-0026", null, rutinas).map((o) => o.grupo))
      .toEqual(["a-medida", "vr", "vr", "vr", "vr", "libre", "todas"]);
  });
});

describe("la línea del historial (P102)", () => {
  it("«En lugar de Creed · Poco tiempo»", () => {
    expect(lineaCambio({ rutinaPrevista: "RUT-0027", motivoCambio: "poco-tiempo" }, "Creed")).toBe("En lugar de Creed · Poco tiempo");
  });
  it("sin motivo, solo la prevista; sin cambio, nada", () => {
    expect(lineaCambio({ rutinaPrevista: "RUT-0027" }, "Creed")).toBe("En lugar de Creed");
    expect(lineaCambio({}, null)).toBeNull();
  });
  it("las etiquetas de los motivos", () => {
    expect(motivoCambioLabel("dolor")).toBe("Me duele algo");
    expect(motivoCambioLabel(null)).toBeNull();
  });
});

describe("cambioDeNavegacion (P102)", () => {
  it("lee lo que manda la hoja", () => {
    expect(cambioDeNavegacion({ cambio: { rutinaPrevista: "RUT-0027", motivo: "cansado" } }))
      .toEqual({ rutinaPrevista: "RUT-0027", motivo: "cansado" });
  });
  it("sin state, o con algo raro, no hay cambio; un motivo desconocido se descarta", () => {
    expect(cambioDeNavegacion(null)).toBeNull();
    expect(cambioDeNavegacion({ cambio: { rutinaPrevista: "" } })).toBeNull();
    expect(cambioDeNavegacion({ cambio: { rutinaPrevista: "RUT-0027", motivo: "x" } }))
      .toEqual({ rutinaPrevista: "RUT-0027", motivo: null });
  });
});

describe("el cambio por la URL: «Ver todas» (P102)", () => {
  it("ida y vuelta", () => {
    const c = { rutinaPrevista: "RUT-0027", motivo: "poco-tiempo" as const };
    expect(busquedaCambio(c)).toBe("?enLugarDe=RUT-0027&motivo=poco-tiempo");
    expect(cambioDeBusqueda(busquedaCambio(c))).toEqual(c);
    expect(cambioDeBusqueda("?tab=rutinas&enLugarDe=RUT-0027")).toEqual({ rutinaPrevista: "RUT-0027", motivo: null });
  });
  it("sin cambio no agrega nada", () => {
    expect(busquedaCambio(null)).toBe("");
    expect(paramsCambio(null)).toEqual({});
    expect(cambioDeBusqueda("?tab=rutinas")).toBeNull();
    expect(cambioDeBusqueda("?enLugarDe=RUT-0027&motivo=x")).toEqual({ rutinaPrevista: "RUT-0027", motivo: null });
  });
  it("el state de la hoja gana; si no hay, la URL", () => {
    expect(cambioDeUbicacion({ state: { cambio: { rutinaPrevista: "A", motivo: null } }, search: "?enLugarDe=B" }))
      .toEqual({ rutinaPrevista: "A", motivo: null });
    expect(cambioDeUbicacion({ state: null, search: "?enLugarDe=B" })).toEqual({ rutinaPrevista: "B", motivo: null });
    expect(cambioDeUbicacion({})).toBeNull();
  });
});
