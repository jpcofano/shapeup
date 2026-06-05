import { describe, it, expect } from "vitest";
import {
  detectarTipoCsv, parsearPeso, parsearEjercicio, parsearSueno, derivarZona,
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
