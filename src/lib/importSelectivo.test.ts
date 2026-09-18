import { describe, it, expect } from "vitest";
import {
  clasificarImport,
  ACTIVIDADES_SIEMPRE_RELEVANTES,
  DURACION_MIN_ACTIVIDAD_MIN,
  type ConfigClasificacion,
  type DestinoImport,
  type MotivoClasificacion,
} from "./importSelectivo";
import { TOLERANCIA_MS } from "./matchBiometrico";
import type { Historial } from "../types/models";
import type { CardioInput } from "../import/samsungHealth";

// ── Fixtures ──────────────────────────────────────────────────────────────────

type CardioEx = CardioInput & { _startMs?: number; _endMs?: number; _customId?: string };

const CONFIG: ConfigClasificacion = {
  duracionMinimaMin: DURACION_MIN_ACTIVIDAD_MIN,
  actividadesSiempreRelevantes: ACTIVIDADES_SIEMPRE_RELEVANTES,
};

/** Epoch ms de un día muy posterior a las fixtures: solo afecta la redacción. */
const NOW = Date.UTC(2024, 5, 1, 12, 0);

function cardio(overrides: Partial<CardioEx> = {}): CardioEx {
  return {
    miembro: "juanpablo",
    fecha: "2024-01-15",
    actividad: "Caminata",
    esVR: false,
    fuente: "samsung-health-csv",
    ...overrides,
  };
}

function historial(overrides: Partial<Historial> = {}): Historial {
  return {
    idHist: "H001",
    fechaRealizada: "2024-01-15",
    fechaRealizadaTimestamp: {} as Historial["fechaRealizadaTimestamp"],
    idSesion: "S001",
    nombreRutina: "Fuerza A",
    semanaInicio: "2024-01-15",
    miembro: "juanpablo",
    duracionRealMin: 60,
    rpe: null,
    tonelajeKg: null,
    totalSeriesHechas: null,
    bloques: [],
    ...overrides,
  };
}

// Ventana de referencia para los tests de solapamiento.
const H_INICIO = 3_600_000;
const H_FIN    = 7_200_000;
const histConVentana = historial({ inicioMs: H_INICIO, finMs: H_FIN });

/** Clasifica un solo item y devuelve destino + motivo, que es lo que se afirma. */
function clasificarUno(
  item: CardioEx,
  hist: Historial[] = [],
  customIds: string[] = [],
  config: ConfigClasificacion = CONFIG,
): { destino: DestinoImport; motivo: MotivoClasificacion; idHist?: string; explicacion: string } {
  const [r] = clasificarImport([item], hist, customIds, config, NOW);
  return { destino: r.destino, motivo: r.motivo, idHist: r.idHist, explicacion: r.explicacion };
}

// ── Regla 1 — ShapeUp custom ID ───────────────────────────────────────────────

describe("Regla 1 — ShapeUp custom ID", () => {
  it("enriquece si _customId está en la lista", () => {
    const r = clasificarUno(
      cardio({ _customId: "SHP-001", _startMs: H_INICIO, _endMs: H_FIN }),
      [histConVentana], ["SHP-001"],
    );
    expect(r.destino).toBe("enriquece");
    expect(r.motivo).toBe("shapeup");
    expect(r.idHist).toBe("H001");
  });

  it("enriquece aunque no haya historial que solape, y ahí no hay idHist", () => {
    const r = clasificarUno(
      cardio({ _customId: "SHP-001", _startMs: 999_000_000, _endMs: 999_100_000 }),
      [], ["SHP-001"],
    );
    expect(r.destino).toBe("enriquece");
    expect(r.motivo).toBe("shapeup");
    expect(r.idHist).toBeUndefined();
  });

  it("no aplica si la lista de shapeUpCustomIds está vacía", () => {
    expect(clasificarUno(cardio({ _customId: "SHP-001" })).motivo).toBe("sin-match");
  });
});

// ── Regla 2 — solape con el historial ─────────────────────────────────────────

describe("Regla 2 — solape con una sesión de la app", () => {
  it("enriquece y dice qué sesión", () => {
    const r = clasificarUno(
      cardio({ _startMs: H_INICIO + 60_000, _endMs: H_FIN - 60_000 }),
      [histConVentana],
    );
    expect(r.destino).toBe("enriquece");
    expect(r.motivo).toBe("historial");
    expect(r.idHist).toBe("H001");
    expect(r.explicacion).toContain("Fuerza A");
  });

  it("solapa dentro de la tolerancia", () => {
    const r = clasificarUno(
      cardio({ _startMs: H_FIN + TOLERANCIA_MS - 1000, _endMs: H_FIN + 600_000 }),
      [histConVentana],
    );
    expect(r.motivo).toBe("historial");
  });

  it("fuera de la tolerancia ya no solapa", () => {
    const r = clasificarUno(
      cardio({ _startMs: H_FIN + TOLERANCIA_MS + 60_000, _endMs: H_FIN + 900_000, duracionMin: 5 }),
      [histConVentana],
    );
    expect(r.destino).toBe("descartada");
  });

  it("sin timestamps, cae al mismo día", () => {
    const r = clasificarUno(cardio({ fecha: "2024-01-15" }), [historial()]);
    expect(r.motivo).toBe("historial");
  });

  it("una externa vieja NO atrae el match de una actividad nueva", () => {
    // El caso que el filtro de P74 evita: si la externa contara como historial,
    // cada actividad se enriquecería a sí misma en el import siguiente.
    const externaVieja = historial({
      idHist: "EXT-uuid-viejo", tipo: "externa",
      inicioMs: H_INICIO, finMs: H_FIN, nombreRutina: "Caminata",
    });
    const r = clasificarUno(
      cardio({ _startMs: H_INICIO, _endMs: H_FIN, duracionMin: 40 }),
      [externaVieja],
    );
    expect(r.destino).toBe("externa");
    expect(r.motivo).toBe("duracion");
  });
});

// ── Regla 3 — VR ──────────────────────────────────────────────────────────────

describe("Regla 3 — VR", () => {
  it("una partida corta de VR entra igual: no tiene mínimo de duración", () => {
    const r = clasificarUno(cardio({ esVR: true, actividad: "Beat Saber", duracionMin: 4 }));
    expect(r.destino).toBe("externa");
    expect(r.motivo).toBe("vr");
  });

  it("VR sin duración también entra", () => {
    expect(clasificarUno(cardio({ esVR: true })).motivo).toBe("vr");
  });
});

// ── Regla 4 — actividad configurada ───────────────────────────────────────────

describe("Regla 4 — actividad siempre relevante", () => {
  it("entra si está en la lista y llega al umbral", () => {
    const r = clasificarUno(cardio({ actividad: "Body Combat", duracionMin: 45 }));
    expect(r.destino).toBe("externa");
    expect(r.motivo).toBe("actividad");
  });

  it("por debajo del umbral no entra por esta regla ni por duración", () => {
    const r = clasificarUno(cardio({ actividad: "Body Combat", duracionMin: 3 }));
    expect(r.destino).toBe("descartada");
    expect(r.motivo).toBe("sin-match");
  });

  it("justo en el umbral entra", () => {
    const r = clasificarUno(cardio({ actividad: "Body Combat", duracionMin: DURACION_MIN_ACTIVIDAD_MIN }));
    expect(r.motivo).toBe("actividad");
  });

  it("respeta la lista de la configuración, no la constante", () => {
    const config: ConfigClasificacion = {
      duracionMinimaMin: 10, actividadesSiempreRelevantes: ["Pádel"],
    };
    expect(clasificarUno(cardio({ actividad: "Pádel", duracionMin: 30 }), [], [], config).motivo)
      .toBe("actividad");
    // "Body Combat" ya no está en la lista: entra igual, pero por duración.
    expect(clasificarUno(cardio({ actividad: "Body Combat", duracionMin: 30 }), [], [], config).motivo)
      .toBe("duracion");
  });
});

// ── Regla 5 — duración (la regla nueva de P75) ────────────────────────────────

describe("Regla 5 — duración", () => {
  it("una caminata de 40 min ya no se pierde", () => {
    const r = clasificarUno(cardio({ actividad: "Caminata", duracionMin: 40 }));
    expect(r.destino).toBe("externa");
    expect(r.motivo).toBe("duracion");
    expect(r.explicacion).toBe("Caminata de 40 min — entra por duración");
  });

  it("justo en el umbral entra", () => {
    expect(clasificarUno(cardio({ duracionMin: DURACION_MIN_ACTIVIDAD_MIN })).motivo).toBe("duracion");
  });

  it("un minuto por debajo del umbral no", () => {
    expect(clasificarUno(cardio({ duracionMin: DURACION_MIN_ACTIVIDAD_MIN - 1 })).destino)
      .toBe("descartada");
  });

  it("el umbral sale de la configuración", () => {
    const config: ConfigClasificacion = {
      duracionMinimaMin: 30, actividadesSiempreRelevantes: [],
    };
    expect(clasificarUno(cardio({ duracionMin: 20 }), [], [], config).destino).toBe("descartada");
    expect(clasificarUno(cardio({ duracionMin: 35 }), [], [], config).destino).toBe("externa");
  });
});

// ── Regla 6 — descartada, pero con el motivo a la vista ───────────────────────

describe("Regla 6 — descartada", () => {
  it("una caminata corta se descarta y explica por qué", () => {
    const r = clasificarUno(cardio({ actividad: "Caminata", duracionMin: 6 }));
    expect(r.destino).toBe("descartada");
    expect(r.explicacion).toBe("Caminata de 6 min, sin sesión que la respalde");
  });

  it("sin duración registrada también se explica", () => {
    const r = clasificarUno(cardio({ actividad: "Caminata" }));
    expect(r.destino).toBe("descartada");
    expect(r.explicacion).toContain("sin duración registrada");
  });
});

// ── Precedencia entre reglas ──────────────────────────────────────────────────

describe("precedencia: gana la primera regla que aplica", () => {
  it("shapeup gana sobre duracion", () => {
    const r = clasificarUno(
      cardio({ _customId: "SHP-001", duracionMin: 45, _startMs: 0, _endMs: 1000 }),
      [], ["SHP-001"],
    );
    expect(r.motivo).toBe("shapeup");
    expect(r.destino).toBe("enriquece");
  });

  it("shapeup gana sobre historial", () => {
    const r = clasificarUno(
      cardio({ _customId: "SHP-001", _startMs: H_INICIO, _endMs: H_FIN }),
      [histConVentana], ["SHP-001"],
    );
    expect(r.motivo).toBe("shapeup");
  });

  it("historial gana sobre vr: si ya la entrenaste, enriquece en vez de duplicar", () => {
    const r = clasificarUno(
      cardio({ esVR: true, _startMs: H_INICIO, _endMs: H_FIN }),
      [histConVentana],
    );
    expect(r.motivo).toBe("historial");
    expect(r.destino).toBe("enriquece");
  });

  it("vr gana sobre actividad y duracion", () => {
    const r = clasificarUno(cardio({ esVR: true, actividad: "Body Combat", duracionMin: 45 }));
    expect(r.motivo).toBe("vr");
  });

  it("actividad gana sobre duracion", () => {
    expect(clasificarUno(cardio({ actividad: "HIIT", duracionMin: 45 })).motivo).toBe("actividad");
  });
});

// ── Forma del resultado ───────────────────────────────────────────────────────

describe("clasificarImport", () => {
  it("devuelve un resultado por item, en el mismo orden", () => {
    const items = [
      cardio({ actividad: "Caminata", duracionMin: 40 }),
      cardio({ actividad: "Caminata", duracionMin: 2 }),
      cardio({ esVR: true, actividad: "Beat Saber", duracionMin: 5 }),
    ];
    const r = clasificarImport(items, [], [], CONFIG, NOW);
    expect(r).toHaveLength(3);
    expect(r.map((x) => x.destino)).toEqual(["externa", "descartada", "externa"]);
    expect(r.map((x) => x.item.actividad)).toEqual(["Caminata", "Caminata", "Beat Saber"]);
  });

  it("no muta la entrada", () => {
    const items = [cardio({ duracionMin: 40 })];
    const copia = structuredClone(items);
    clasificarImport(items, [], [], CONFIG, NOW);
    expect(items).toEqual(copia);
  });

  it("lista vacía no rompe", () => {
    expect(clasificarImport([], [], [], CONFIG, NOW)).toEqual([]);
  });

  it("toda actividad recibe una explicación no vacía", () => {
    const items = [
      cardio({ duracionMin: 40 }), cardio({ duracionMin: 2 }),
      cardio({ esVR: true }), cardio({ actividad: "HIIT", duracionMin: 20 }),
    ];
    for (const r of clasificarImport(items, [], [], CONFIG, NOW)) {
      expect(r.explicacion.length).toBeGreaterThan(0);
    }
  });

  it('la explicación dice "de hoy" cuando la sesión es del día de `now`', () => {
    const d = new Date(NOW);
    const hoy = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const r = clasificarUno(
      cardio({ fecha: hoy }),
      [historial({ fechaRealizada: hoy, nombreRutina: "Fuerza A" })],
    );
    expect(r.explicacion).toBe("Ya estaba en tu sesión de Fuerza A de hoy");
  });
});
