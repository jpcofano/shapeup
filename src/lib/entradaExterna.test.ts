import { describe, it, expect } from "vitest";
import {
  construirEntradaExterna, idEntradaExterna, esIdEntradaExterna, type ItemExterno,
} from "./entradaExterna";
import { esExterna, esShapeUp } from "./tipoHistorial";
import { tonelajeKg, totalSeriesHechas } from "./metricas";

const UUID = "abc-123-def";

function item(overrides: Partial<ItemExterno> = {}): ItemExterno {
  return {
    fecha: "2026-09-14",          // un lunes
    actividad: "Caminata",
    esVR: false,
    fuente: "samsung-health-csv",
    duracionMin: 40,
    _uuid: UUID,
    _startMs: Date.UTC(2026, 8, 14, 12, 0),
    _endMs:   Date.UTC(2026, 8, 14, 12, 40),
    ...overrides,
  };
}

describe("idEntradaExterna", () => {
  it("es determinístico: mismo uuid, mismo id", () => {
    expect(idEntradaExterna(UUID)).toBe(idEntradaExterna(UUID));
    expect(idEntradaExterna(UUID)).toBe(`EXT-${UUID}`);
  });

  it("esIdEntradaExterna reconoce el prefijo", () => {
    expect(esIdEntradaExterna(idEntradaExterna(UUID))).toBe(true);
    expect(esIdEntradaExterna("H-20260914")).toBe(false);
  });
});

describe("construirEntradaExterna — los campos de la tabla", () => {
  const h = construirEntradaExterna(item(), "juanpablo");

  it("idHist determinístico a partir del datauuid", () => {
    expect(h.idHist).toBe(`EXT-${UUID}`);
  });

  it("dos llamadas con el mismo datauuid dan el mismo idHist", () => {
    const a = construirEntradaExterna(item(), "juanpablo");
    const b = construirEntradaExterna(item({ duracionMin: 41 }), "juanpablo");
    expect(a.idHist).toBe(b.idHist);
  });

  it("tipo externa", () => { expect(h.tipo).toBe("externa"); });

  it("nombreRutina es la actividad, para que se vea bien en las listas", () => {
    expect(h.nombreRutina).toBe("Caminata");
  });

  it("idSesion vacío: no hay sesión programada", () => { expect(h.idSesion).toBe(""); });

  it("idRutina AUSENTE, no vacío", () => {
    expect(h.idRutina).toBeUndefined();
    expect("idRutina" in h).toBe(false);
  });

  it("bloques vacío; tonelaje, series y rpe en null", () => {
    expect(h.bloques).toEqual([]);
    expect(h.tonelajeKg).toBeNull();
    expect(h.totalSeriesHechas).toBeNull();
    expect(h.rpe).toBeNull();
  });

  it("duración, inicio y fin vienen de Samsung", () => {
    expect(h.duracionRealMin).toBe(40);
    expect(h.inicioMs).toBe(Date.UTC(2026, 8, 14, 12, 0));
    expect(h.finMs).toBe(Date.UTC(2026, 8, 14, 12, 40));
  });

  it("semanaInicio es el lunes de esa fecha", () => {
    expect(h.semanaInicio).toBe("2026-09-14");    // el 14/9/2026 es lunes
    const domingo = construirEntradaExterna(item({ fecha: "2026-09-20" }), "juanpablo");
    expect(domingo.semanaInicio).toBe("2026-09-14");
  });

  it("guarda el origen en `externa`", () => {
    expect(h.externa).toEqual({
      actividad: "Caminata", datauuid: UUID, fuente: "samsung-health-csv",
    });
  });

  it("la distancia va en `externa` solo si existe", () => {
    const conDist = construirEntradaExterna(item({ distanciaKm: 4.2 }), "juanpablo");
    expect(conDist.externa?.distanciaKm).toBe(4.2);
    expect(h.externa?.distanciaKm).toBeUndefined();
  });

  it("el miembro es el que se le pasa", () => { expect(h.miembro).toBe("juanpablo"); });
});

describe("construirEntradaExterna — biometría", () => {
  it("lleva FC, zona y calorías con matchPor 'directo'", () => {
    const h = construirEntradaExterna(
      item({ fcPromedio: 108, fcMaxima: 132, _fcMin: 74, kcal: 180, zonaPrincipal: "Z2" }),
      "juanpablo",
    );
    expect(h.biometria).toEqual({
      fuente: "samsung-health-csv", datauuidSamsung: UUID,
      fcMedia: 108, fcMax: 132, fcMin: 74, zonaPrincipal: "Z2", kcal: 180,
      matchPor: "directo", granularidad: "sesion",
    });
  });

  it("sin ningún dato biométrico, no inventa un objeto vacío", () => {
    expect(construirEntradaExterna(item(), "juanpablo").biometria).toBeUndefined();
  });

  it("con un solo dato alcanza", () => {
    const h = construirEntradaExterna(item({ kcal: 90 }), "juanpablo");
    expect(h.biometria?.kcal).toBe(90);
    expect(h.biometria?.fcMedia).toBeUndefined();
  });
});

describe("construirEntradaExterna — robustez", () => {
  it("no muta la entrada", () => {
    const i = item({ kcal: 90 });
    const copia = structuredClone(i);
    construirEntradaExterna(i, "juanpablo");
    expect(i).toEqual(copia);
  });

  it("sin timestamps deriva el timestamp del mediodía de la fecha", () => {
    const h = construirEntradaExterna(
      item({ _startMs: undefined, _endMs: undefined }), "juanpablo",
    );
    expect(h.inicioMs).toBeUndefined();
    expect(h.finMs).toBeUndefined();
    expect(h.fechaRealizadaTimestamp.seconds)
      .toBe(Math.floor(new Date("2026-09-14T12:00:00").getTime() / 1000));
  });

  it("sin duración, duracionRealMin queda en null", () => {
    expect(construirEntradaExterna(item({ duracionMin: undefined }), "juanpablo").duracionRealMin)
      .toBeNull();
  });

  it("ningún campo queda en undefined: Firestore los rechaza", () => {
    const h = construirEntradaExterna(item({ fcPromedio: 100 }), "juanpablo") as unknown as Record<string, unknown>;
    for (const [clave, valor] of Object.entries(h)) {
      expect(valor, `${clave} quedó undefined`).not.toBeUndefined();
    }
  });
});

describe("una entrada externa no cuenta como entrenamiento del plan", () => {
  const h = construirEntradaExterna(item({ fcPromedio: 108, kcal: 180 }), "juanpablo");

  it("los predicados de P74 la reconocen", () => {
    expect(esExterna(h)).toBe(true);
    expect(esShapeUp(h)).toBe(false);
  });

  it("suma 0 al tonelaje y a las series, sin romperse", () => {
    expect(tonelajeKg(h)).toBe(0);
    expect(totalSeriesHechas(h)).toBe(0);
  });
});
