import { describe, it, expect } from "vitest";
import type { Historial } from "../types/models";
import { agruparDiasActivos, type ActividadDia } from "./racha";
import { actividadRelevante } from "./actividadRelevante";

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
      minutos: 0,
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

// ════════════════════════════════════════════════════════════════════════════
//  P76b: las actividades llegan de /cardio, no de /historial. El agrupador
//  recibe las dos fuentes y el filtro decide cuál de las de cardio marca el día.
// ════════════════════════════════════════════════════════════════════════════

describe("agruparDiasActivos · las dos fuentes (P76b)", () => {
  /** Actividad de /cardio. */
  function actividad(fecha: string, dur: number, auto = false): ActividadDia {
    return { fecha, duracionMin: dur, autodetectada: auto, esVR: false, marcadaShapeUp: false };
  }

  it("un día con sesión de la app y caminata declarada trae las dos marcas", () => {
    const dias = agruparDiasActivos(
      [propia("2026-09-07")], [actividad("2026-09-07", 40)],
    );
    expect(dias).toEqual([
      { fecha: "2026-09-07", shapeUp: true, externaDeclarada: true, autodetectada: false, minutos: 40 },
    ]);
  });

  it("una autodetectada aparece marcada como tal", () => {
    const dias = agruparDiasActivos([], [actividad("2026-09-08", 90, true)]);
    expect(dias).toEqual([
      { fecha: "2026-09-08", shapeUp: false, externaDeclarada: false, autodetectada: true, minutos: 90 },
    ]);
  });

  it("dos actividades el mismo día cuentan un solo día", () => {
    const dias = agruparDiasActivos(
      [], [actividad("2026-09-09", 40), actividad("2026-09-09", 50)],
    );
    expect(dias).toHaveLength(1);
    expect(dias[0].externaDeclarada).toBe(true);
  });

  it("una declarada de 20 min SÍ marca el día, aunque no se vea en el historial", () => {
    // El filtro de `actividadRelevante` decide qué se MUESTRA; acá se decide si
    // te moviste, que es otra pregunta. Con el umbral en 30, esta no aparece en
    // el historial y el día igual es un día activo.
    expect(actividadRelevante(actividad("2026-09-10", 20), { duracionMinimaMin: 30 })).toBe(false);
    expect(agruparDiasActivos([], [actividad("2026-09-10", 20)])).toEqual([
      { fecha: "2026-09-10", shapeUp: false, externaDeclarada: true, autodetectada: false, minutos: 20 },
    ]);
  });

  it("una declarada de 5 min también: el umbral no vive acá", () => {
    expect(agruparDiasActivos([], [actividad("2026-09-11", 5)])).toEqual([
      { fecha: "2026-09-11", shapeUp: false, externaDeclarada: true, autodetectada: false, minutos: 5 },
    ]);
  });

  it("declarada y autodetectada del mismo largo marcan igual de día", () => {
    // La incoherencia que esto vino a sacar: la autodetectada marcaba siempre y
    // la declarada solo si pasaba el umbral.
    const dec  = agruparDiasActivos([], [actividad("2026-09-12", 20, false)]);
    const auto = agruparDiasActivos([], [actividad("2026-09-12", 20, true)]);
    expect(dec).toHaveLength(1);
    expect(auto).toHaveLength(1);
    expect(dec[0].externaDeclarada).toBe(true);
    expect(auto[0].autodetectada).toBe(true);
  });

  it("sin actividades se comporta igual que antes", () => {
    expect(agruparDiasActivos([propia("2026-09-07")]))
      .toEqual([{ fecha: "2026-09-07", shapeUp: true, externaDeclarada: false, autodetectada: false, minutos: 0 }]);
  });

  it("no muta las actividades que recibe", () => {
    const entrada = [actividad("2026-09-07", 40)];
    const copia = structuredClone(entrada);
    agruparDiasActivos([], entrada);
    expect(entrada).toEqual(copia);
  });
});
