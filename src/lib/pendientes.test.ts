import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  agregarPendiente, quitarPendiente, marcarErrorPendiente, listarPendientes,
  CLAVE_PENDIENTES, EVENTO_PENDIENTES,
  type SesionPendiente,
} from "./pendientes";

function pendiente(idHist: string): SesionPendiente {
  return {
    idHist,
    idSesion: `SES-${idHist}`,
    nombreRutina: "Torso A",
    fecha: "2026-09-16",
    creadoMs: 1000,
    historial: {
      idHist,
      fechaRealizada: "2026-09-16",
      idSesion: `SES-${idHist}`,
      nombreRutina: "Torso A",
      semanaInicio: "2026-09-14",
      miembro: "juanpablo",
      duracionRealMin: 40,
      rpe: null,
      tonelajeKg: 1200,
      totalSeriesHechas: 12,
      bloques: [],
    },
    sesion: { miembro: "juanpablo", estado: "Registrada", rpeSesion: null },
  };
}

describe("pendientes", () => {
  beforeEach(() => localStorage.removeItem(CLAVE_PENDIENTES));

  it("lista vacía sin nada guardado", () => {
    expect(listarPendientes()).toEqual([]);
  });

  it("agregar y listar (ida y vuelta)", () => {
    agregarPendiente(pendiente("H-1"));
    agregarPendiente(pendiente("H-2"));
    expect(listarPendientes().map((p) => p.idHist)).toEqual(["H-1", "H-2"]);
    expect(listarPendientes()[0]).toEqual(pendiente("H-1"));
  });

  it("agregar el mismo idHist lo reemplaza", () => {
    agregarPendiente(pendiente("H-1"));
    agregarPendiente({ ...pendiente("H-1"), nombreRutina: "Otra" });
    const lista = listarPendientes();
    expect(lista).toHaveLength(1);
    expect(lista[0].nombreRutina).toBe("Otra");
  });

  it("quitar", () => {
    agregarPendiente(pendiente("H-1"));
    agregarPendiente(pendiente("H-2"));
    quitarPendiente("H-1");
    expect(listarPendientes().map((p) => p.idHist)).toEqual(["H-2"]);
    quitarPendiente("H-2");
    expect(listarPendientes()).toEqual([]);
    expect(localStorage.getItem(CLAVE_PENDIENTES)).toBeNull();
  });

  it("marcar error solo en la que corresponde", () => {
    agregarPendiente(pendiente("H-1"));
    agregarPendiente(pendiente("H-2"));
    marcarErrorPendiente("H-2", "permiso denegado");
    const [a, b] = listarPendientes();
    expect(a.error).toBeUndefined();
    expect(b.error).toBe("permiso denegado");
  });

  it("marcar error de una que no existe no crea nada", () => {
    marcarErrorPendiente("H-9", "x");
    expect(listarPendientes()).toEqual([]);
  });

  it("JSON corrupto cuenta como lista vacía", () => {
    localStorage.setItem(CLAVE_PENDIENTES, "{roto");
    expect(listarPendientes()).toEqual([]);
    localStorage.setItem(CLAVE_PENDIENTES, JSON.stringify({ no: "es lista" }));
    expect(listarPendientes()).toEqual([]);
  });

  it("descarta entradas con forma inválida", () => {
    localStorage.setItem(CLAVE_PENDIENTES, JSON.stringify([pendiente("H-1"), { idHist: 3 }, null]));
    expect(listarPendientes().map((p) => p.idHist)).toEqual(["H-1"]);
  });

  it("avisa cada cambio con un evento", () => {
    const escucha = vi.fn();
    window.addEventListener(EVENTO_PENDIENTES, escucha);
    agregarPendiente(pendiente("H-1"));
    marcarErrorPendiente("H-1", "x");
    quitarPendiente("H-1");
    window.removeEventListener(EVENTO_PENDIENTES, escucha);
    expect(escucha).toHaveBeenCalledTimes(3);
  });
});
