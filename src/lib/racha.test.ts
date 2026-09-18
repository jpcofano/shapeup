import { describe, it, expect } from "vitest";
import type { Historial } from "../types/models";
import { agruparDiasActivos } from "./racha";

/** Sesión de la app. */
function propia(fecha: string, tipo: "rutina" | "libre" = "rutina"): Historial {
  return { idHist: `H-${fecha}`, fechaRealizada: fecha, tipo } as Historial;
}

/** Actividad externa, declarada o autodetectada. */
function externa(
  fecha: string,
  origen: "declarada" | "autodetectada",
  uuid = `${fecha}-${origen}`,
): Historial {
  return {
    idHist: `EXT-${uuid}`, fechaRealizada: fecha, tipo: "externa",
    externa: {
      actividad: "Caminata", datauuid: uuid, fuente: "samsung-health-csv",
      origen, motivoIngreso: "duracion",
    },
  } as Historial;
}

describe("agruparDiasActivos", () => {
  it("dos actividades el mismo día dan UN día con las dos marcas", () => {
    const dias = agruparDiasActivos([
      externa("2026-09-07", "declarada"),
      externa("2026-09-07", "autodetectada"),
    ]);
    expect(dias).toHaveLength(1);
    expect(dias[0]).toEqual({
      fecha: "2026-09-07", shapeUp: false, externaDeclarada: true, autodetectada: true,
    });
  });

  it("un día con sesión de la app y caminata trae shapeUp y externaDeclarada", () => {
    const dias = agruparDiasActivos([
      propia("2026-09-07"),
      externa("2026-09-07", "declarada"),
    ]);
    expect(dias).toHaveLength(1);
    expect(dias[0].shapeUp).toBe(true);
    expect(dias[0].externaDeclarada).toBe(true);
    expect(dias[0].autodetectada).toBe(false);
  });

  it("una sesión libre cuenta como shapeUp", () => {
    expect(agruparDiasActivos([propia("2026-09-10", "libre")])[0].shapeUp).toBe(true);
  });

  it("una sesión sin `tipo` cuenta como shapeUp (retrocompat)", () => {
    const vieja = { idHist: "H-vieja", fechaRealizada: "2026-08-31" } as Historial;
    expect(agruparDiasActivos([vieja])[0].shapeUp).toBe(true);
  });

  it("una externa sin marca de origen se asume declarada", () => {
    // Entradas anteriores a P75b: lo conservador es no esconderlas detrás del
    // filtro de autodetectadas.
    const sinMarca = {
      idHist: "EXT-vieja", fechaRealizada: "2026-09-05", tipo: "externa",
    } as Historial;
    const dia = agruparDiasActivos([sinMarca])[0];
    expect(dia.externaDeclarada).toBe(true);
    expect(dia.autodetectada).toBe(false);
  });

  it("devuelve un día por fecha, ordenado ascendente", () => {
    const dias = agruparDiasActivos([
      propia("2026-09-10"), externa("2026-09-07", "declarada"), propia("2026-09-08"),
    ]);
    expect(dias.map((d) => d.fecha)).toEqual(["2026-09-07", "2026-09-08", "2026-09-10"]);
  });

  it("no decide por el consumidor: las tres marcas viajan separadas", () => {
    const dias = agruparDiasActivos([
      propia("2026-09-07"),
      externa("2026-09-08", "autodetectada"),
      externa("2026-09-09", "declarada"),
    ]);
    // La racha del plan mira solo `shapeUp`…
    expect(dias.filter((d) => d.shapeUp)).toHaveLength(1);
    // …y "me moví" puede incluir o no lo autodetectado, según quien pregunte.
    expect(dias.filter((d) => d.shapeUp || d.externaDeclarada)).toHaveLength(2);
    expect(dias).toHaveLength(3);
  });

  it("lista vacía no rompe", () => {
    expect(agruparDiasActivos([])).toEqual([]);
  });

  it("no muta la entrada", () => {
    const entrada = [propia("2026-09-07"), externa("2026-09-07", "declarada")];
    const copia = structuredClone(entrada);
    agruparDiasActivos(entrada);
    expect(entrada).toEqual(copia);
  });
});
