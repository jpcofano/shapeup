import { describe, it, expect } from "vitest";
import {
  detectarTipoCsv, parsearPeso, parsearEjercicio, parsearSueno, derivarZona,
  detectarTiposMetrica, parsearMetricas,
  minArr, maxArr, avgArr, sumArr, lastArr, idMetrica,
} from "./samsungHealth";

// ── CSV de muestra (formato Samsung Health real) ──────────────────────────────

// Línea 1 = metadata (saltear), línea 2 = encabezado, línea 3+ = datos
const PESO_CSV = `com.samsung.health.body_weight,6320001,12
com.samsung.health.body_weight.create_time,com.samsung.health.body_weight.update_time,datauuid,com.samsung.health.body_weight.start_time,com.samsung.health.body_weight.time_offset,com.samsung.health.body_weight.weight,com.samsung.health.body_weight.height,com.samsung.health.body_weight.body_fat,com.samsung.health.body_weight.muscle_mass
2024-03-15 08:30:00.000,2024-03-15 08:30:01.000,uuid-peso-001,1710488400000,UTC-0300,78.5,178,18.5,35.2
2024-03-22 08:15:00.000,2024-03-22 08:15:01.000,uuid-peso-002,1711093500000,UTC-0300,78.0,178,18.2,35.5`;

const EXERCISE_CSV = `com.samsung.shealth.exercise,6000007,15
datauuid,com.samsung.shealth.exercise.start_time,com.samsung.shealth.exercise.time_offset,com.samsung.shealth.exercise.exercise_type,title,com.samsung.shealth.exercise.duration,com.samsung.shealth.exercise.calorie,com.samsung.shealth.exercise.mean_heart_rate,com.samsung.shealth.exercise.max_heart_rate,com.samsung.shealth.exercise.distance
uuid-ej-001,1710488400000,UTC-0300,11,Caminata matutina,1800000,180,115,145,3200
uuid-ej-002,1710574800000,UTC-0300,1001,,2700000,320,142,168,0`;

const SLEEP_CSV = `com.samsung.shealth.sleep,6000003,8
datauuid,com.samsung.shealth.sleep.start_time,com.samsung.shealth.sleep.time_offset,com.samsung.shealth.sleep.original_bed_time,com.samsung.shealth.sleep.sleep_duration
uuid-sleep-001,1710450000000,UTC-0300,1710447600000,452
uuid-sleep-002,1710536400000,UTC-0300,1710534000000,390`;

// ── detectarTipoCsv ───────────────────────────────────────────────────────────

describe("detectarTipoCsv", () => {
  it("detecta weight",   () => expect(detectarTipoCsv("com.samsung.health.body_weight.20240315.csv")).toBe("weight"));
  it("detecta exercise", () => expect(detectarTipoCsv("com.samsung.shealth.exercise.20240315.csv")).toBe("exercise"));
  it("detecta sleep",    () => expect(detectarTipoCsv("com.samsung.shealth.sleep.20240315.csv")).toBe("sleep"));
  it("retorna unknown",  () => expect(detectarTipoCsv("nutrition_goal.csv")).toBe("unknown"));
});

// ── parsearPeso ───────────────────────────────────────────────────────────────

describe("parsearPeso", () => {
  const { items, errors } = parsearPeso(PESO_CSV, "juanpablo");

  it("parsea 2 filas", () => expect(items).toHaveLength(2));
  it("sin errores",    () => expect(errors).toHaveLength(0));

  it("extrae peso", () => expect(items[0].pesoKg).toBe(78.5));
  it("extrae grasa", () => expect(items[0].grasaPct).toBe(18.5));
  it("extrae músculo", () => expect(items[0].masaMuscularKg).toBe(35.2));

  it("calcula imc (78.5 / 1.78²)", () => {
    const expected = parseFloat((78.5 / (1.78 ** 2)).toFixed(1));
    expect(items[0].imc).toBe(expected);
  });

  it("convierte epoch a fecha local", () => {
    // 1710488400000 + UTC-0300 → "2024-03-15"
    expect(items[0].fecha).toBe("2024-03-15");
  });

  it("asigna fuente samsung-health-csv", () => expect(items[0].fuente).toBe("samsung-health-csv"));
  it("preserva datauuid como _uuid",     () => expect(items[0]._uuid).toBe("uuid-peso-001"));
});

// ── parsearEjercicio ──────────────────────────────────────────────────────────

describe("parsearEjercicio", () => {
  const zonas = {
    Z1: { min: 84, max: 101 },
    Z2: { min: 101, max: 118 },
    Z3: { min: 118, max: 135 },
    Z4: { min: 135, max: 152 },
    Z5: { min: 152, max: 169 },
  };
  const { items, errors } = parsearEjercicio(EXERCISE_CSV, "juanpablo", zonas);

  it("parsea 2 filas", () => expect(items).toHaveLength(2));
  it("sin errores",    () => expect(errors).toHaveLength(0));

  it("usa el título libre si está presente", () => expect(items[0].actividad).toBe("Caminata matutina"));
  it("resuelve code 1001 como HIIT cuando no hay título",  () => expect(items[1].actividad).toBe("HIIT"));

  it("convierte duración de ms a min (1800000ms → 30min)", () => expect(items[0].duracionMin).toBe(30));
  it("convierte distancia de m a km (3200m → 3.2km)",      () => expect(items[0].distanciaKm).toBe(3.2));

  it("deriva zonaPrincipal Z2 para FC 115 con zonas dadas", () => expect(items[0].zonaPrincipal).toBe("Z2"));
  it("deriva zonaPrincipal Z4 para FC 142",                  () => expect(items[1].zonaPrincipal).toBe("Z4"));
});

// ── parsearSueno ──────────────────────────────────────────────────────────────

describe("parsearSueno", () => {
  const { items, errors } = parsearSueno(SLEEP_CSV, "juanpablo");

  it("parsea 2 filas", () => expect(items).toHaveLength(2));
  it("sin errores",    () => expect(errors).toHaveLength(0));

  it("convierte sleep_duration de min a horas (452min → ~7.53h)", () => {
    expect(items[0].horas).toBeCloseTo(7.53, 1);
  });
  it("extrae hora de acostarse", () => expect(items[0].horaAcostarse).toMatch(/^\d{2}:\d{2}$/));
});

// ── Helpers de agregación ─────────────────────────────────────────────────────

describe("helpers de agregación", () => {
  it("minArr",  () => expect(minArr([5, 2, 8])).toBe(2));
  it("maxArr",  () => expect(maxArr([5, 2, 8])).toBe(8));
  it("avgArr",  () => expect(avgArr([4, 6])).toBe(5));
  it("sumArr",  () => expect(sumArr([100, 200, 300])).toBe(600));
  it("lastArr", () => expect(lastArr([1, 2, 3])).toBe(3));
  it("minArr vacío", () => expect(minArr([])).toBeUndefined());
  it("idMetrica",   () => expect(idMetrica("maria", "hrv", "2024-03-15")).toBe("maria-hrv-2024-03-15"));
});

// ── detectarTiposMetrica ──────────────────────────────────────────────────────

describe("detectarTiposMetrica", () => {
  it("heart_rate → fc-reposo + fc-max-dia", () => {
    const r = detectarTiposMetrica("com.samsung.health.tracker.heart_rate.20240315.csv");
    expect(r?.tipos).toContain("fc-reposo");
    expect(r?.tipos).toContain("fc-max-dia");
  });
  it("hrv → hrv / noche",     () => expect(detectarTiposMetrica("health.hrv.20240315.csv")?.tipos[0]).toBe("hrv"));
  it("stress → estres / dia", () => expect(detectarTiposMetrica("stress.20240315.csv")?.tipos[0]).toBe("estres"));
  it("step_daily → pasos",    () => expect(detectarTiposMetrica("step_daily_trend.csv")?.tipos[0]).toBe("pasos"));
  it("blood_pressure → sistólica + diastólica", () => {
    const r = detectarTiposMetrica("blood_pressure.csv");
    expect(r?.tipos).toContain("presion-sistolica");
    expect(r?.tipos).toContain("presion-diastolica");
  });
  it("body_weight → null (no es métrica genérica)", () =>
    expect(detectarTiposMetrica("com.samsung.health.body_weight.csv")).toBeNull());
});

// ── parsearMetricas ───────────────────────────────────────────────────────────

const HR_CSV = `com.samsung.health.tracker.heart_rate,6000001,5
datauuid,com.samsung.health.tracker.heart_rate.start_time,com.samsung.health.tracker.heart_rate.time_offset,com.samsung.health.tracker.heart_rate.heart_rate
uuid-hr-001,1710488400000,UTC-0300,62
uuid-hr-002,1710492000000,UTC-0300,58
uuid-hr-003,1710495600000,UTC-0300,175`;

const STRESS_CSV = `com.samsung.shealth.stress,6000002,4
datauuid,com.samsung.shealth.stress.start_time,com.samsung.shealth.stress.time_offset,stress_score
uuid-st-001,1710488400000,UTC-0300,35
uuid-st-002,1710492000000,UTC-0300,45`;

const STEPS_CSV = `com.samsung.shealth.step_daily_trend,6000003,3
datauuid,com.samsung.shealth.step_daily_trend.start_time,com.samsung.shealth.step_daily_trend.time_offset,count
uuid-st-001,1710488400000,UTC-0300,8500`;

describe("parsearMetricas — heart_rate", () => {
  const { items, errors } = parsearMetricas("tracker.heart_rate.20240315.csv", HR_CSV, "juanpablo");

  it("sin errores", () => expect(errors).toHaveLength(0));
  it("genera fc-reposo y fc-max-dia para el día", () => {
    expect(items.some((i) => i.tipo === "fc-reposo")).toBe(true);
    expect(items.some((i) => i.tipo === "fc-max-dia")).toBe(true);
  });
  it("fc-reposo = min del día (58)", () => {
    const r = items.find((i) => i.tipo === "fc-reposo");
    expect(r?.valor).toBe(58);
  });
  it("fc-max-dia = max del día (175)", () => {
    const r = items.find((i) => i.tipo === "fc-max-dia");
    expect(r?.valor).toBe(175);
  });
  it("idMetrica idempotente por día",   () =>
    expect(items[0].idMetrica).toBe(`juanpablo-${items[0].tipo}-${items[0].fecha}`));
});

describe("parsearMetricas — stress", () => {
  const { items } = parsearMetricas("stress.20240315.csv", STRESS_CSV, "maria");
  it("genera estres promediado (40)",   () => expect(items[0].valor).toBe(40));
  it("agregacion = dia",                () => expect(items[0].agregacion).toBe("dia"));
});

describe("parsearMetricas — pasos", () => {
  const { items } = parsearMetricas("step_daily_trend.csv", STEPS_CSV, "sofia");
  it("genera pasos sumados (8500)",     () => expect(items[0].valor).toBe(8500));
  it("unidad = pasos",                  () => expect(items[0].unidad).toBe("pasos"));
});

// ── derivarZona ───────────────────────────────────────────────────────────────

describe("derivarZona", () => {
  const zonas = {
    Z1: { min: 84,  max: 101 },
    Z2: { min: 101, max: 118 },
    Z3: { min: 118, max: 135 },
    Z4: { min: 135, max: 152 },
    Z5: { min: 152, max: 169 },
  };
  it("Z1 para FC 90",  () => expect(derivarZona(90,  zonas)).toBe("Z1"));
  it("Z2 para FC 110", () => expect(derivarZona(110, zonas)).toBe("Z2"));
  it("Z3 para FC 125", () => expect(derivarZona(125, zonas)).toBe("Z3"));
  it("Z4 para FC 140", () => expect(derivarZona(140, zonas)).toBe("Z4"));
  it("Z5 para FC 160", () => expect(derivarZona(160, zonas)).toBe("Z5"));
  it("undefined sin zonas", () => expect(derivarZona(130, undefined)).toBeUndefined());
});
