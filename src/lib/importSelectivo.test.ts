import { describe, it, expect } from "vitest";
import {
  filtrarCardioRelevante,
  ACTIVIDADES_SIEMPRE_RELEVANTES,
  type MotivoRelevancia,
} from "./importSelectivo";
import { TOLERANCIA_MS } from "./matchBiometrico";
import type { Historial } from "../types/models";
import type { CardioInput } from "../import/samsungHealth";

// ── Fixtures ──────────────────────────────────────────────────────────────────

type CardioEx = CardioInput & { _startMs?: number; _endMs?: number; _customId?: string };

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

// Historial mínimo: usa inicioMs/finMs sellados (nivel 1 de ventanaDeHistorial).
function historial(overrides: Partial<Historial> = {}): Historial {
  return {
    idHist: "H001",
    fechaRealizada: "2024-01-15",
    fechaRealizadaTimestamp: {} as Historial["fechaRealizadaTimestamp"],
    idSesion: "S001",
    nombreRutina: "Test",
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

// ── Regla 1: ShapeUp custom ID ────────────────────────────────────────────────

describe("Regla 1 — ShapeUp custom ID", () => {
  it("marca como 'shapeup' si _customId está en la lista", () => {
    const items = [cardio({ _customId: "SHP-001", _startMs: 0, _endMs: 1000 })];
    const { relevantes, descartadas } = filtrarCardioRelevante(items, [], ["SHP-001"]);
    expect(relevantes).toHaveLength(1);
    expect(relevantes[0]._motivo).toBe("shapeup");
    expect(descartadas).toHaveLength(0);
  });

  it("es relevante aunque no haya historial que solape", () => {
    const items = [cardio({ _customId: "SHP-001", _startMs: 999_000_000, _endMs: 999_100_000 })];
    const { relevantes } = filtrarCardioRelevante(items, [], ["SHP-001"]);
    expect(relevantes[0]._motivo).toBe("shapeup");
  });

  it("no aplica si la lista de shapeUpCustomIds está vacía", () => {
    const items = [cardio({ _customId: "SHP-001" })];
    const { descartadas } = filtrarCardioRelevante(items, [], []);
    expect(descartadas).toHaveLength(1);
  });

  it("no aplica si _customId está vacío aunque la lista no lo esté", () => {
    const items = [cardio({ _customId: "" })];
    const { descartadas } = filtrarCardioRelevante(items, [], ["SHP-001"]);
    expect(descartadas).toHaveLength(1);
  });

  it("no aplica si _customId es undefined", () => {
    const items = [cardio()]; // sin _customId
    const { descartadas } = filtrarCardioRelevante(items, [], ["SHP-001"]);
    expect(descartadas).toHaveLength(1);
  });
});

// ── Regla 2: Solape con historial ─────────────────────────────────────────────

describe("Regla 2 — Solape con historial (con timestamps)", () => {
  it("es relevante si la ventana cardio solapa con la ventana del historial", () => {
    // Cardio empieza justo al inicio del historial
    const items = [cardio({ _startMs: H_INICIO, _endMs: H_INICIO + 1000 })];
    const { relevantes } = filtrarCardioRelevante(items, [histConVentana], []);
    expect(relevantes[0]._motivo).toBe("historial");
  });

  it("es relevante dentro de la tolerancia (antes del inicio)", () => {
    // Cardio termina TOLERANCIA_MS antes del inicio del historial (justo en el borde)
    const items = [cardio({ _startMs: H_INICIO - TOLERANCIA_MS - 100, _endMs: H_INICIO - TOLERANCIA_MS })];
    const { descartadas } = filtrarCardioRelevante(items, [histConVentana], []);
    // Exactamente en el borde: _endMs === inicioMs - TOLERANCIA_MS → c._endMs >= ventana.inicioMs - TOLERANCIA_MS ✓
    expect(descartadas).toHaveLength(0);
  });

  it("no es relevante fuera de la tolerancia", () => {
    // Cardio termina 1 ms antes del borde de tolerancia
    const items = [cardio({ _startMs: 0, _endMs: H_INICIO - TOLERANCIA_MS - 1 })];
    const { descartadas } = filtrarCardioRelevante(items, [histConVentana], []);
    expect(descartadas).toHaveLength(1);
  });
});

describe("Regla 2 — Fallback por fecha (sin timestamps)", () => {
  it("es relevante si la fecha cardio coincide con fechaRealizada del historial", () => {
    const items = [cardio({ fecha: "2024-01-15" })]; // sin _startMs/_endMs
    const h = historial({ fechaRealizada: "2024-01-15" });
    const { relevantes } = filtrarCardioRelevante(items, [h], []);
    expect(relevantes[0]._motivo).toBe("historial");
  });

  it("descarta si la fecha no coincide con ningún historial", () => {
    const items = [cardio({ fecha: "2024-01-16" })];
    const h = historial({ fechaRealizada: "2024-01-15" });
    const { descartadas } = filtrarCardioRelevante(items, [h], []);
    expect(descartadas).toHaveLength(1);
  });
});

// ── Regla 3: VR ───────────────────────────────────────────────────────────────

describe("Regla 3 — VR", () => {
  it("es relevante si esVR es true", () => {
    const items = [cardio({ esVR: true, _startMs: 999_000_000, _endMs: 999_100_000 })];
    const { relevantes } = filtrarCardioRelevante(items, [], []);
    expect(relevantes[0]._motivo).toBe("vr");
  });

  it("no aplica si esVR es false", () => {
    const items = [cardio({ esVR: false })];
    const { descartadas } = filtrarCardioRelevante(items, [], []);
    expect(descartadas).toHaveLength(1);
  });
});

// ── Regla 4: Allowlist de actividades ─────────────────────────────────────────

describe("Regla 4 — Allowlist de actividades", () => {
  it("es relevante si la actividad figura en ACTIVIDADES_SIEMPRE_RELEVANTES y dura ≥10 min", () => {
    for (const act of ACTIVIDADES_SIEMPRE_RELEVANTES) {
      const items = [cardio({ actividad: act, duracionMin: 15, _startMs: 999_000_000, _endMs: 999_100_000 })];
      const { relevantes } = filtrarCardioRelevante(items, [], []);
      expect(relevantes[0]._motivo, `${act} debería ser relevante`).toBe("actividad");
    }
  });

  it("no es relevante para una actividad no incluida", () => {
    const items = [cardio({ actividad: "Yoga", duracionMin: 15, _startMs: 999_000_000, _endMs: 999_100_000 })];
    const { descartadas } = filtrarCardioRelevante(items, [], []);
    expect(descartadas).toHaveLength(1);
  });

  it("el match es case-sensitive (nombre exacto de resolverActividad)", () => {
    // "HIIT" ✓ pero "hiit" ✗
    const items = [cardio({ actividad: "hiit", duracionMin: 15, _startMs: 999_000_000, _endMs: 999_100_000 })];
    const { descartadas } = filtrarCardioRelevante(items, [], []);
    expect(descartadas).toHaveLength(1);
  });

  // S-fix (P55): guarda de duración — regresión del bug "1969 caminatas de 1 min etiquetadas HIIT"
  it("NO es relevante si dura menos de 10 min, aunque la actividad esté en la allowlist", () => {
    const items = [cardio({ actividad: "HIIT", duracionMin: 1, _startMs: 999_000_000, _endMs: 999_100_000 })];
    const { descartadas, relevantes } = filtrarCardioRelevante(items, [], []);
    expect(relevantes).toHaveLength(0);
    expect(descartadas).toHaveLength(1);
  });

  it("NO es relevante si duracionMin es undefined, aunque la actividad esté en la allowlist", () => {
    const items = [cardio({ actividad: "HIIT", _startMs: 999_000_000, _endMs: 999_100_000 })];
    const { descartadas } = filtrarCardioRelevante(items, [], []);
    expect(descartadas).toHaveLength(1);
  });

  it("SÍ es relevante justo en el piso de 10 min", () => {
    const items = [cardio({ actividad: "HIIT", duracionMin: 10, _startMs: 999_000_000, _endMs: 999_100_000 })];
    const { relevantes } = filtrarCardioRelevante(items, [], []);
    expect(relevantes).toHaveLength(1);
  });
});

// ── Prioridad de motivos ───────────────────────────────────────────────────────

describe("Prioridad de motivos", () => {
  it("ShapeUp tiene prioridad sobre historial: _customId en lista + solape → 'shapeup'", () => {
    const items = [cardio({
      _customId: "SHP-001",
      _startMs: H_INICIO,
      _endMs: H_INICIO + 1000,
    })];
    const { relevantes } = filtrarCardioRelevante(items, [histConVentana], ["SHP-001"]);
    expect(relevantes[0]._motivo).toBe("shapeup");
  });

  it("Historial tiene prioridad sobre VR: VR + solape → 'historial'", () => {
    const items = [cardio({
      esVR: true,
      _startMs: H_INICIO,
      _endMs: H_INICIO + 1000,
    })];
    const { relevantes } = filtrarCardioRelevante(items, [histConVentana], []);
    expect(relevantes[0]._motivo).toBe("historial");
  });

  it("VR tiene prioridad sobre actividad: VR + actividad allowlist → 'vr'", () => {
    const items = [cardio({
      esVR: true,
      actividad: "HIIT",
      duracionMin: 15,
      _startMs: 999_000_000,
      _endMs: 999_100_000,
    })];
    const { relevantes } = filtrarCardioRelevante(items, [], []);
    expect(relevantes[0]._motivo).toBe("vr");
  });
});

// ── No mutación + completitud ─────────────────────────────────────────────────

describe("No mutación y completitud", () => {
  it("no muta la entrada", () => {
    const entrada = [
      cardio({ actividad: "HIIT" }),
      cardio({ actividad: "Caminata" }),
    ];
    const copia = entrada.map((c) => ({ ...c }));
    filtrarCardioRelevante(entrada, [], []);
    expect(entrada).toEqual(copia);
  });

  it("relevantes + descartadas = entrada completa", () => {
    const entrada = [
      cardio({ actividad: "HIIT" }),
      cardio({ actividad: "Caminata" }),
      cardio({ esVR: true }),
      cardio({ actividad: "Yoga" }),
    ];
    const { relevantes, descartadas } = filtrarCardioRelevante(entrada, [], []);
    expect(relevantes.length + descartadas.length).toBe(entrada.length);
  });

  it("lista vacía devuelve relevantes=[] y descartadas=[]", () => {
    const { relevantes, descartadas } = filtrarCardioRelevante([], [], []);
    expect(relevantes).toHaveLength(0);
    expect(descartadas).toHaveLength(0);
  });
});

// ── Strippeo de _motivo antes de persistir ────────────────────────────────────

describe("Strippeo de _motivo (patrón del consumidor)", () => {
  it("destructuring elimina _motivo del item antes de persistir", () => {
    const items = [cardio({ actividad: "HIIT", duracionMin: 15 })];
    const { relevantes } = filtrarCardioRelevante(items, [], []);
    const [{ _motivo, ...sinMotivo }] = relevantes;
    expect(_motivo as MotivoRelevancia).toBe("actividad");
    expect(Object.keys(sinMotivo)).not.toContain("_motivo");
  });
});
