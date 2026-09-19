import { describe, it, expect } from "vitest";
import {
  clasificarImport, esAutodetectada, origenDe,
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

type CardioEx = CardioInput & {
  _startMs?: number; _endMs?: number; _customId?: string; _uuid?: string;
};

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
) {
  const [r] = clasificarImport([item], hist, customIds, config, NOW);
  return {
    destino: r.destino as DestinoImport,
    motivo: r.motivo as MotivoClasificacion,
    idHist: r.idHist,
    motivoIngreso: r.motivoIngreso,
    explicacion: r.explicacion,
  };
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

  it("sin sesión que enriquecer entra como externa marcada (P75b)", () => {
    // Antes se clasificaba como "enriquece" sin idHist y no escribía nada:
    // entrenamientos tuyos reales, anteriores a la app, que se perdían en
    // silencio. Ahora entran para que P76 los pueda convertir.
    const r = clasificarUno(
      cardio({ _customId: "SHP-001", _startMs: 999_000_000, _endMs: 999_100_000, duracionMin: 45 }),
      [], ["SHP-001"],
    );
    expect(r.destino).toBe("externa");
    expect(r.motivo).toBe("shapeup");
    expect(r.motivoIngreso).toBe("shapeup-sin-sesion");
    expect(r.idHist).toBeUndefined();
  });

  it("con sesión que enriquecer sigue enriqueciendo", () => {
    const r = clasificarUno(
      cardio({ _customId: "SHP-001", _startMs: H_INICIO, _endMs: H_FIN }),
      [histConVentana], ["SHP-001"],
    );
    expect(r.destino).toBe("enriquece");
    expect(r.idHist).toBe("H001");
    expect(r.motivoIngreso).toBeUndefined();
  });

  it("una sesión ShapeUp corta sin historial entra igual: no la frena el umbral", () => {
    const r = clasificarUno(
      cardio({ _customId: "SHP-001", duracionMin: 3 }), [], ["SHP-001"],
    );
    expect(r.destino).toBe("externa");
    expect(r.motivoIngreso).toBe("shapeup-sin-sesion");
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
    expect(r.motivoIngreso).toBe("vr");
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
    expect(r.motivoIngreso).toBe("actividad");
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
    expect(r.motivoIngreso).toBe("duracion");
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
    // Las dos reglas aplican; manda shapeup. Sin sesión que enriquecer entra
    // como externa, pero marcada por SU regla, no por la duración (P75b).
    const r = clasificarUno(
      cardio({ _customId: "SHP-001", duracionMin: 45, _startMs: 0, _endMs: 1000 }),
      [], ["SHP-001"],
    );
    expect(r.motivo).toBe("shapeup");
    expect(r.motivoIngreso).toBe("shapeup-sin-sesion");
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

// ── esAutodetectada (ADR #035, P75b) ──────────────────────────────────────────

describe("esAutodetectada", () => {
  it("sin FC y sin curva es verdadera", () => {
    expect(esAutodetectada({})).toBe(true);
    expect(esAutodetectada({ _muestrasCurva: 0 })).toBe(true);
  });

  it("con FC media es falsa", () => {
    expect(esAutodetectada({ fcPromedio: 112 })).toBe(false);
  });

  it("con curva pero sin media es falsa", () => {
    expect(esAutodetectada({ _muestrasCurva: 640 })).toBe(false);
  });

  it("con FC máxima sola también es falsa: el reloj midió algo", () => {
    expect(esAutodetectada({ fcMaxima: 140 })).toBe(false);
  });

  it("los milisegundos en .000 por sí solos no alcanzan", () => {
    // La señal existe en el ZIP (800 de 2554 filas del export del 14/09), pero
    // no decide: 772 la comparten con las otras dos, y sola se queda corta.
    // El item ni siquiera la expone — la condición es la ausencia de FC.
    expect(esAutodetectada({ fcPromedio: 105 })).toBe(false);
  });

  it("origenDe traduce el predicado a la marca del modelo", () => {
    expect(origenDe({})).toBe("autodetectada");
    expect(origenDe({ fcPromedio: 112 })).toBe("declarada");
  });
});

// ── Regla 1b — match exacto por datauuidSamsung (P75c) ───────────────────────

describe("Regla 1b — el uuid ya está en una sesión enriquecida", () => {
  const UUID = "078f3af5-f086-4b09-9bfd-aeac9305f6a3";

  /** Sesión ya enriquecida SIN `inicioMs`: la regla 2 no la puede encontrar. */
  function yaEnriquecida(overrides: Partial<Historial> = {}): Historial {
    return historial({
      idHist: "H-20260707", fechaRealizada: "2026-07-07", nombreRutina: "Sesión libre",
      tipo: "libre", inicioMs: undefined, finMs: 1783430907278,
      biometria: {
        fuente: "samsung-health-csv", datauuidSamsung: UUID,
        matchPor: "dia", granularidad: "sesion", fcMedia: 130,
      },
      ...overrides,
    });
  }

  it("enriquece esa sesión aunque no haya inicioMs", () => {
    const r = clasificarUno(
      cardio({ _uuid: UUID, fecha: "2026-07-07", duracionMin: 54 }),
      [yaEnriquecida()],
    );
    expect(r.destino).toBe("enriquece");
    expect(r.motivo).toBe("datauuid");
    expect(r.idHist).toBe("H-20260707");
  });

  it("la explicación dice de qué sesión se trata", () => {
    const r = clasificarUno(cardio({ _uuid: UUID }), [yaEnriquecida()]);
    expect(r.explicacion).toBe("Ya estaba en tu sesión de Sesión libre del 7/7");
  });

  it("sin la regla, ese mismo item entraría como externa duplicando el entrenamiento", () => {
    // El caso que destapó PU4: mismo item, pero contra un historial que no
    // guarda el datauuid. Ahí sí entra como externa.
    const sinBiometria = yaEnriquecida({ biometria: undefined });
    const r = clasificarUno(
      cardio({ _uuid: UUID, fecha: "2026-01-01", duracionMin: 54 }), [sinBiometria],
    );
    expect(r.destino).toBe("externa");
  });

  it("precedencia: si además cumple shapeup por custom-id, gana shapeup", () => {
    const r = clasificarUno(
      cardio({ _uuid: UUID, _customId: "SHP-001", duracionMin: 54 }),
      [yaEnriquecida()], ["SHP-001"],
    );
    expect(r.motivo).toBe("shapeup");
    // …y aun así encuentra la sesión por uuid, que es el punto de P75c:
    // antes caía en "shapeup-sin-sesion" y duplicaba.
    expect(r.destino).toBe("enriquece");
    expect(r.idHist).toBe("H-20260707");
  });

  it("el match por uuid le gana al match por ventana si apuntan a sesiones distintas", () => {
    const porVentana = historial({
      idHist: "H-OTRA", fechaRealizada: "2026-07-07",
      inicioMs: H_INICIO, finMs: H_FIN,
    });
    const r = clasificarUno(
      cardio({ _uuid: UUID, _startMs: H_INICIO, _endMs: H_FIN }),
      [porVentana, yaEnriquecida()],
    );
    expect(r.motivo).toBe("datauuid");
    expect(r.idHist).toBe("H-20260707");
  });

  it("sin coincidencia de uuid, todo sigue como antes", () => {
    const r = clasificarUno(
      cardio({ _uuid: "otro-uuid", _startMs: H_INICIO, _endMs: H_FIN }),
      [histConVentana, yaEnriquecida()],
    );
    expect(r.motivo).toBe("historial");
    expect(r.idHist).toBe("H001");
  });

  it("un item sin _uuid no matchea por esta regla", () => {
    const r = clasificarUno(cardio({ duracionMin: 40 }), [yaEnriquecida()]);
    expect(r.destino).toBe("externa");
    expect(r.motivo).toBe("duracion");
  });

  it("no matchea contra una externa que guarde el mismo uuid", () => {
    // Las externas traen su propio datauuid en la biometría; si contaran, cada
    // actividad se enriquecería a sí misma en el import siguiente (P74).
    const externaConUuid = historial({
      idHist: "EXT-vieja", tipo: "externa", fechaRealizada: "2026-07-07",
      biometria: {
        fuente: "samsung-health-csv", datauuidSamsung: UUID,
        matchPor: "directo", granularidad: "sesion",
      },
    });
    const r = clasificarUno(
      cardio({ _uuid: UUID, duracionMin: 40 }), [externaConUuid],
    );
    expect(r.destino).toBe("externa");
    expect(r.motivo).toBe("duracion");
  });
});
