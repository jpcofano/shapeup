import { describe, it, expect } from "vitest";
import {
  detectarTipoCsv, parsearPeso, parsearEjercicio, parsearSueno, derivarZona,
  detectarTiposMetrica, parsearMetricas, epochToMs, parsearFcCruda,
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
  // Formato antiguo (con "body_weight")
  it("detecta weight (body_weight)",   () => expect(detectarTipoCsv("com.samsung.health.body_weight.20240315.csv")).toBe("weight"));
  it("detecta exercise",               () => expect(detectarTipoCsv("com.samsung.shealth.exercise.20240315.csv")).toBe("exercise"));
  it("detecta sleep",                  () => expect(detectarTipoCsv("com.samsung.shealth.sleep.20240315.csv")).toBe("sleep"));
  // Formato 2025+ (sin "body_" en weight)
  it("detecta weight (sin body_)",     () => expect(detectarTipoCsv("com.samsung.health.weight.20260607183598.csv")).toBe("weight"));
  it("detecta exercise 2025+",         () => expect(detectarTipoCsv("com.samsung.shealth.exercise.20260607183598.csv")).toBe("exercise"));
  it("detecta sleep 2025+",            () => expect(detectarTipoCsv("com.samsung.shealth.sleep.20260607183598.csv")).toBe("sleep"));
  // Sub-tipos NO deben ser detectados como el tipo principal
  it("sub-tipo exercise.recovery NO es exercise", () =>
    expect(detectarTipoCsv("com.samsung.shealth.exercise.recovery_heart_rate.20260607183598.csv")).toBe("unknown"));
  it("sleep_stage NO es sleep", () =>
    expect(detectarTipoCsv("com.samsung.health.sleep_stage.20260607183598.csv")).toBe("unknown"));
  it("sleep_combined NO es sleep", () =>
    expect(detectarTipoCsv("com.samsung.shealth.sleep_combined.20260607183598.csv")).toBe("unknown"));
  it("retorna unknown para otros",  () => expect(detectarTipoCsv("nutrition_goal.csv")).toBe("unknown"));
});

// CSV con campos opcionales vacíos (sin grasa, sin músculo)
const PESO_CSV_INCOMPLETO = `com.samsung.health.body_weight,6320001,12
com.samsung.health.body_weight.create_time,com.samsung.health.body_weight.update_time,datauuid,com.samsung.health.body_weight.start_time,com.samsung.health.body_weight.time_offset,com.samsung.health.body_weight.weight,com.samsung.health.body_weight.height,com.samsung.health.body_weight.body_fat,com.samsung.health.body_weight.muscle_mass
2024-03-15 08:30:00.000,2024-03-15 08:30:01.000,uuid-completa,1710488400000,UTC-0300,78.5,178,18.5,35.2
2024-03-22 08:15:00.000,2024-03-22 08:15:01.000,uuid-sin-grasa,1711093500000,UTC-0300,79.0,178,,`;

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

// ── parsearPeso — resiliencia (campos opcionales vacíos) ──────────────────────

describe("parsearPeso — campos opcionales vacíos", () => {
  const { items, errors } = parsearPeso(PESO_CSV_INCOMPLETO, "juanpablo");

  it("parsea ambas filas sin abortar", () => expect(items).toHaveLength(2));
  it("sin errores de parseo",          () => expect(errors).toHaveLength(0));

  it("fila completa mantiene grasaPct", () => {
    const completa = items.find((i) => i._uuid === "uuid-completa");
    expect(completa?.grasaPct).toBe(18.5);
  });

  it("fila sin grasa NO incluye clave grasaPct (stripUndef)", () => {
    const sinGrasa = items.find((i) => i._uuid === "uuid-sin-grasa");
    expect(sinGrasa).toBeDefined();
    expect("grasaPct" in sinGrasa!).toBe(false);
  });

  it("fila sin grasa NO incluye clave masaMuscularKg (stripUndef)", () => {
    const sinGrasa = items.find((i) => i._uuid === "uuid-sin-grasa");
    expect("masaMuscularKg" in sinGrasa!).toBe(false);
  });

  it("fila sin grasa sí tiene peso", () => {
    const sinGrasa = items.find((i) => i._uuid === "uuid-sin-grasa");
    expect(sinGrasa?.pesoKg).toBe(79.0);
  });
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
  it("resuelve code 1001 como Caminata cuando no hay título",  () => expect(items[1].actividad).toBe("Caminata"));

  it("convierte duración de ms a min (1800000ms → 30min)", () => expect(items[0].duracionMin).toBe(30));
  it("convierte distancia de m a km (3200m → 3.2km)",      () => expect(items[0].distanciaKm).toBe(3.2));

  it("deriva zonaPrincipal Z2 para FC 115 con zonas dadas", () => expect(items[0].zonaPrincipal).toBe("Z2"));
  it("deriva zonaPrincipal Z4 para FC 142",                  () => expect(items[1].zonaPrincipal).toBe("Z4"));
});

// ── Mapeo de exercise_type (S-fix, P55) — regresión del bug "HIIT" falso ──────

describe("resolverActividad — mapeo de exercise_type corregido", () => {
  const CSV_AUDITORIA = `com.samsung.shealth.exercise,6000007,15
datauuid,com.samsung.shealth.exercise.start_time,com.samsung.shealth.exercise.time_offset,com.samsung.shealth.exercise.exercise_type,title,com.samsung.shealth.exercise.duration,com.samsung.shealth.exercise.calorie,com.samsung.shealth.exercise.mean_heart_rate,com.samsung.shealth.exercise.max_heart_rate,com.samsung.shealth.exercise.distance
uuid-audit-001,1710488400000,UTC-0300,1001,,960000,180,110,120,1120
uuid-audit-002,1710574800000,UTC-0300,1002,,1800000,220,140,160,4000
uuid-audit-003,1710661200000,UTC-0300,11007,,3600000,300,125,145,25000
uuid-audit-004,1710747600000,UTC-0300,13001,,5400000,450,130,150,8000`;
  const { items } = parsearEjercicio(CSV_AUDITORIA, "juanpablo");

  it("código 1001 (16 min, 1.12 km, auto-detectado) resuelve Caminata, no HIIT", () => {
    expect(items[0].actividad).toBe("Caminata");
    expect(items[0].actividad).not.toBe("HIIT");
    expect(items[0].duracionMin).toBe(16);
    expect(items[0].distanciaKm).toBe(1.12);
  });
  it("código 1002 → Carrera",     () => expect(items[1].actividad).toBe("Carrera"));
  it("código 11007 → Ciclismo",   () => expect(items[2].actividad).toBe("Ciclismo"));
  it("código 13001 → Senderismo", () => expect(items[3].actividad).toBe("Senderismo"));
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
  it("tracker.heart_rate → fc-media-dia + fc-max-dia", () => {
    const r = detectarTiposMetrica("com.samsung.health.tracker.heart_rate.20240315.csv");
    expect(r?.tipos).toContain("fc-media-dia");
    expect(r?.tipos).toContain("fc-max-dia");
    expect(r?.tipos).not.toContain("fc-reposo");
  });
  // BUG real (S-fix-b, P56): estos dos archivos también contienen "heart_rate" en el
  // nombre pero NO son el tracker general — no deben mezclarse con fc-media-dia/fc-max-dia.
  it("alerted_heart_rate → null (no es el tracker general, no se mapea a ciegas)", () =>
    expect(detectarTiposMetrica("com.samsung.shealth.alerted_heart_rate.20260607183598.csv")).toBeNull());
  it("exercise.recovery_heart_rate → null (curva de recuperación, no agregado diario)", () =>
    expect(detectarTiposMetrica("com.samsung.shealth.exercise.recovery_heart_rate.20260607183598.csv")).toBeNull());
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
  it("genera fc-media-dia y fc-max-dia para el día (nunca fc-reposo)", () => {
    expect(items.some((i) => i.tipo === "fc-media-dia")).toBe(true);
    expect(items.some((i) => i.tipo === "fc-max-dia")).toBe(true);
    expect(items.some((i) => i.tipo === "fc-reposo")).toBe(false);
  });
  it("fc-media-dia = promedio del día (98.3)", () => {
    const r = items.find((i) => i.tipo === "fc-media-dia");
    expect(r?.valor).toBe(98.3); // (62 + 58 + 175) / 3
  });
  it("fc-max-dia = max del día (175)", () => {
    const r = items.find((i) => i.tipo === "fc-max-dia");
    expect(r?.valor).toBe(175);
  });
  it("idMetrica idempotente por día",   () =>
    expect(items[0].idMetrica).toBe(`juanpablo-${items[0].tipo}-${items[0].fecha}`));
});

// ── parsearFcCruda (nivel "rango", S-match, P57) ─────────────────────────────

describe("parsearFcCruda", () => {
  it("parsea filas válidas a { ms, fc }[] ordenadas por tiempo", () => {
    const puntos = parsearFcCruda(HR_CSV);
    expect(puntos).toHaveLength(3);
    expect(puntos.map((p) => p.fc)).toEqual([62, 58, 175]); // ya vienen en orden ascendente de start_time
    expect(puntos[0].ms).toBe(epochToMs("1710488400000"));
  });

  it("ordena por ms aunque el CSV venga desordenado", () => {
    const desordenado = `com.samsung.health.tracker.heart_rate,6000001,3
datauuid,com.samsung.health.tracker.heart_rate.start_time,com.samsung.health.tracker.heart_rate.time_offset,com.samsung.health.tracker.heart_rate.heart_rate
uuid-b,1710495600000,UTC-0300,80
uuid-a,1710488400000,UTC-0300,60`;
    const puntos = parsearFcCruda(desordenado);
    expect(puntos.map((p) => p.fc)).toEqual([60, 80]);
  });

  it("descarta filas sin heart_rate o con valor 0/negativo", () => {
    const conVacios = `com.samsung.health.tracker.heart_rate,6000001,3
datauuid,com.samsung.health.tracker.heart_rate.start_time,com.samsung.health.tracker.heart_rate.time_offset,com.samsung.health.tracker.heart_rate.heart_rate
uuid-a,1710488400000,UTC-0300,
uuid-b,1710488500000,UTC-0300,0`;
    expect(parsearFcCruda(conVacios)).toHaveLength(0);
  });
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

// ── Formato nuevo (2024+): start_time como datetime string ───────────────────
// Samsung Health actualizó el export: start_time ahora es "YYYY-MM-DD HH:MM:SS.mmm"
// (hora local) en lugar de epoch ms. El parser antiguo hacía parseInt("2024-...") = 2024
// (el año como número) → new Date(2024) ≈ "1970-01-01", fecha completamente errónea.

const PESO_CSV_DATETIME = `com.samsung.health.body_weight,6320001,12
com.samsung.health.body_weight.create_time,com.samsung.health.body_weight.update_time,datauuid,com.samsung.health.body_weight.start_time,com.samsung.health.body_weight.time_offset,com.samsung.health.body_weight.weight,com.samsung.health.body_weight.height,com.samsung.health.body_weight.body_fat,com.samsung.health.body_weight.muscle_mass
2024-03-15 08:30:00.000,2024-03-15 08:30:01.000,uuid-dt-001,2024-03-15 08:30:00.000,UTC-0300,78.5,178,18.5,35.2
2024-03-22 08:15:00.000,2024-03-22 08:15:01.000,uuid-dt-002,2024-03-22 08:15:00.000,UTC-0300,79.0,178,,`;

const EXERCISE_CSV_DATETIME = `com.samsung.shealth.exercise,6000007,15
datauuid,com.samsung.shealth.exercise.start_time,com.samsung.shealth.exercise.time_offset,com.samsung.shealth.exercise.exercise_type,title,com.samsung.shealth.exercise.duration,com.samsung.shealth.exercise.calorie,com.samsung.shealth.exercise.mean_heart_rate,com.samsung.shealth.exercise.max_heart_rate,com.samsung.shealth.exercise.distance
uuid-ej-dt-001,2024-03-15 07:30:00.000,UTC-0300,11,Caminata matutina,1800000,180,115,145,3200
uuid-ej-dt-002,2024-03-16 08:00:00.000,UTC-0300,1001,,2700000,320,142,168,0`;

const SLEEP_CSV_DATETIME = `com.samsung.shealth.sleep,6000003,8
datauuid,com.samsung.shealth.sleep.start_time,com.samsung.shealth.sleep.time_offset,com.samsung.shealth.sleep.original_bed_time,com.samsung.shealth.sleep.sleep_duration
uuid-sleep-dt-001,2024-03-15 06:30:00.000,UTC-0300,2024-03-15 23:00:00.000,452
uuid-sleep-dt-002,2024-03-16 06:45:00.000,UTC-0300,2024-03-16 22:30:00.000,390`;

describe("parsearPeso — formato datetime string (Samsung Health 2024+)", () => {
  const { items, errors } = parsearPeso(PESO_CSV_DATETIME, "juanpablo");

  it("parsea 2 filas sin errores", () => {
    expect(items).toHaveLength(2);
    expect(errors).toHaveLength(0);
  });
  it("fecha correcta desde datetime string (no '1970-01-01')", () => {
    expect(items[0].fecha).toBe("2024-03-15");
    expect(items[1].fecha).toBe("2024-03-22");
  });
  it("peso correcto", () => expect(items[0].pesoKg).toBe(78.5));
  it("fila sin grasa no tiene clave grasaPct", () => {
    expect("grasaPct" in items[1]).toBe(false);
  });
});

describe("parsearEjercicio — formato datetime string (Samsung Health 2024+)", () => {
  const zonas = {
    Z1: { min: 84, max: 101 }, Z2: { min: 101, max: 118 },
    Z3: { min: 118, max: 135 }, Z4: { min: 135, max: 152 }, Z5: { min: 152, max: 169 },
  };
  const { items, errors } = parsearEjercicio(EXERCISE_CSV_DATETIME, "juanpablo", zonas);

  it("parsea 2 filas sin errores", () => {
    expect(items).toHaveLength(2);
    expect(errors).toHaveLength(0);
  });
  it("fecha correcta desde datetime string", () => {
    expect(items[0].fecha).toBe("2024-03-15");
    expect(items[1].fecha).toBe("2024-03-16");
  });
  it("actividad resuelta correctamente", () => {
    expect(items[0].actividad).toBe("Caminata matutina");
    expect(items[1].actividad).toBe("Caminata");
  });
});

describe("parsearSueno — formato datetime string (Samsung Health 2024+)", () => {
  const { items, errors } = parsearSueno(SLEEP_CSV_DATETIME, "juanpablo");

  it("parsea 2 filas sin errores", () => {
    expect(items).toHaveLength(2);
    expect(errors).toHaveLength(0);
  });
  it("fecha correcta desde datetime string", () => {
    expect(items[0].fecha).toBe("2024-03-15");
    expect(items[1].fecha).toBe("2024-03-16");
  });
  it("horas de sueño correctas (452 min → ~7.53 h)", () => {
    expect(items[0].horas).toBeCloseTo(7.53, 1);
  });
  it("horaAcostarse extraída del datetime string", () => {
    expect(items[0].horaAcostarse).toMatch(/^\d{2}:\d{2}$/);
  });
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

// ── epochToMs ─────────────────────────────────────────────────────────────────

describe("epochToMs", () => {
  it("parsea epoch ms como string", () => {
    expect(epochToMs("1710488400000")).toBe(1710488400000);
  });

  it("parsea datetime local sin offset (trata como UTC)", () => {
    // "2024-03-15 11:00:00.000" → 1710500400000 UTC
    const ms = epochToMs("2024-03-15 11:00:00.000");
    expect(typeof ms).toBe("number");
    expect(ms).not.toBeNaN();
  });

  it("parsea datetime local con offset UTC-0300 y ajusta correctamente", () => {
    // "2024-03-15 08:00:00.000" hora local con offset -3h → real UTC = 08:00 + 3h = 11:00 UTC
    const ms = epochToMs("2024-03-15 08:00:00.000", "UTC-0300");
    const esperado = epochToMs("2024-03-15 11:00:00.000"); // sin offset = UTC directo
    expect(ms).toBe(esperado);
  });

  it("parsea datetime local con offset UTC+0530", () => {
    // "2024-03-15 16:30:00.000" hora local con +05:30 → UTC = 16:30 - 5:30 = 11:00 UTC
    const ms = epochToMs("2024-03-15 16:30:00.000", "UTC+0530");
    const esperado = epochToMs("2024-03-15 11:00:00.000");
    expect(ms).toBe(esperado);
  });

  it("devuelve undefined para string vacío", () => {
    expect(epochToMs("")).toBeUndefined();
  });

  it("devuelve undefined para string inválido", () => {
    expect(epochToMs("no-es-fecha")).toBeUndefined();
  });
});

// ── parsearEjercicio — campos privados ────────────────────────────────────────

const EXERCISE_CSV_CON_TIMESTAMPS = `com.samsung.shealth.exercise,6000007,15
datauuid,com.samsung.shealth.exercise.start_time,com.samsung.shealth.exercise.time_offset,com.samsung.shealth.exercise.exercise_type,title,com.samsung.shealth.exercise.duration,com.samsung.shealth.exercise.calorie,com.samsung.shealth.exercise.mean_heart_rate,com.samsung.shealth.exercise.max_heart_rate,com.samsung.shealth.exercise.min_heart_rate,com.samsung.shealth.exercise.custom_id
uuid-ts-001,1710488400000,UTC-0300,1001,ShapeUp,3600000,400,145,175,85,mq1mz4gd_gq
uuid-ts-002,1710574800000,UTC-0300,11,Caminata,1800000,180,115,140,,`;

describe("parsearEjercicio — campos privados", () => {
  const { items } = parsearEjercicio(EXERCISE_CSV_CON_TIMESTAMPS, "juanpablo");

  it("conserva _startMs derivado del epoch", () => {
    expect(items[0]._startMs).toBe(1710488400000);
  });

  it("deriva _endMs = _startMs + duration", () => {
    expect(items[0]._endMs).toBe(1710488400000 + 3600000);
  });

  it("conserva _customId cuando viene", () => {
    expect(items[0]._customId).toBe("mq1mz4gd_gq");
  });

  it("conserva _fcMin cuando viene", () => {
    expect(items[0]._fcMin).toBe(85);
  });

  it("_customId es undefined cuando no viene", () => {
    expect(items[1]._customId).toBeUndefined();
  });

  it("_fcMin es undefined cuando no viene", () => {
    expect(items[1]._fcMin).toBeUndefined();
  });
});

// ── resolverActividad — type 0 / custom / unknown ─────────────────────────────

const EXERCISE_CSV_TYPE0 = `com.samsung.shealth.exercise,6000007,15
datauuid,com.samsung.shealth.exercise.start_time,com.samsung.shealth.exercise.time_offset,com.samsung.shealth.exercise.exercise_type,title,com.samsung.shealth.exercise.duration,com.samsung.shealth.exercise.calorie,com.samsung.shealth.exercise.custom_id
uuid-t0-shapeup,1710488400000,UTC-0300,0,,3600000,400,custom-id-shapeup
uuid-t0-otro,1710492000000,UTC-0300,0,,1800000,200,custom-id-otro
uuid-t0-nada,1710495600000,UTC-0300,0,,1800000,180,
uuid-tX-desconocido,1710499200000,UTC-0300,999,,2700000,300,`;

describe("resolverActividad — type 0 y tipos desconocidos", () => {
  const shapeUpIds  = new Set(["custom-id-shapeup"]);
  const nameMap     = new Map([["custom-id-otro", "Pilates"]]);
  const { items }   = parsearEjercicio(EXERCISE_CSV_TYPE0, "juanpablo", undefined, shapeUpIds, nameMap);

  it("type 0 + customId ShapeUp → 'ShapeUp'", () => {
    const item = items.find((i) => i._uuid === "uuid-t0-shapeup");
    expect(item?.actividad).toBe("ShapeUp");
  });

  it("type 0 + customId con nombre en índice → ese nombre", () => {
    const item = items.find((i) => i._uuid === "uuid-t0-otro");
    expect(item?.actividad).toBe("Pilates");
  });

  it("type 0 sin customId → 'Personalizado'", () => {
    const item = items.find((i) => i._uuid === "uuid-t0-nada");
    expect(item?.actividad).toBe("Personalizado");
  });

  it("tipo desconocido (999) → 'Otro (999)' (nunca 'Tipo N')", () => {
    const item = items.find((i) => i._uuid === "uuid-tX-desconocido");
    expect(item?.actividad).toBe("Otro (999)");
    expect(item?.actividad).not.toContain("Tipo");
  });
});

// ── resolverActividad — redondeo de FC/kcal (verificado por parsearEjercicio) ──

describe("parsearEjercicio — FC y kcal sin decimales en actividad", () => {
  const EXERCISE_FC_CSV = `com.samsung.shealth.exercise,6000007,15
datauuid,com.samsung.shealth.exercise.start_time,com.samsung.shealth.exercise.time_offset,com.samsung.shealth.exercise.exercise_type,title,com.samsung.shealth.exercise.duration,com.samsung.shealth.exercise.calorie,com.samsung.shealth.exercise.mean_heart_rate
uuid-fc-001,1710488400000,UTC-0300,1001,,3600000,47.08,133.65286`;

  it("fcPromedio se almacena con el valor original (redondeo es responsabilidad de la UI)", () => {
    const { items } = parsearEjercicio(EXERCISE_FC_CSV, "juanpablo");
    expect(items[0].fcPromedio).toBeCloseTo(133.65, 1);
    expect(items[0].kcal).toBeCloseTo(47.08, 1);
  });
});
