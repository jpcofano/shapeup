// ════════════════════════════════════════════════════════════════════════════
//  lib/parsearCSV.ts — Parsea exports de Samsung Health a MedicionCorporal[]
//  y SesionCardio[]. Lógica pura (sin Firestore, sin React).
//
//  Samsung Health exporta en archivos separados:
//    com.samsung.health.body_weight.YYYYMMDD.csv  → peso + %grasa + kg músculo
//    com.samsung.health.exercise.YYYYMMDD.csv     → actividad, duración, kcal, FC
//
//  El formato tiene cabecera con metadatos (líneas con #) y luego la fila de
//  columnas. Soportamos "Start time, End time, ..." con fecha "YYYY-MM-DD HH:MM:SS".
// ════════════════════════════════════════════════════════════════════════════

import type { MedicionCorporal, SesionCardio, MiembroId } from "../types/models";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Parsea CSV a filas de objetos. Salta líneas vacías y comentarios (#). */
function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() && !l.startsWith("#"));
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim().replace(/"/g, ""));
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = values[i] ?? ""; });
    return obj;
  });
}

function fechaDe(datetime: string): string {
  // "2024-03-15 08:30:00.000" → "2024-03-15"
  return datetime.split(" ")[0].split("T")[0];
}

function numOpt(s: string | undefined): number | undefined {
  if (!s || s === "" || s === "-") return undefined;
  const n = parseFloat(s);
  return isNaN(n) ? undefined : n;
}

// ── Parsers por tipo ──────────────────────────────────────────────────────────

export interface ParseResult<T> {
  items:  T[];
  errors: string[];
}

/**
 * Parsea un CSV de peso/composición corporal de Samsung Health.
 * Columnas esperadas: "Start time", "Weight (kg)", "Body fat (%)",
 * "Skeletal muscle (kg)", "Total body water (%)"
 */
export function parsearPesoCSV(
  text: string,
  miembro: MiembroId,
): ParseResult<Omit<MedicionCorporal, "idMedicion" | "fechaCreacion">> {
  const filas  = parseCsv(text);
  const items: Omit<MedicionCorporal, "idMedicion" | "fechaCreacion">[] = [];
  const errors: string[] = [];

  for (const f of filas) {
    const fecha = fechaDe(f["Start time"] ?? f["start_time"] ?? "");
    if (!fecha || fecha.length !== 10) {
      errors.push(`Fila sin fecha: ${JSON.stringify(f)}`);
      continue;
    }
    items.push({
      miembro,
      fecha,
      pesoKg:         numOpt(f["Weight (kg)"]             ?? f["weight"]),
      grasaPct:       numOpt(f["Body fat (%)"]             ?? f["body_fat"]),
      masaMuscularKg: numOpt(f["Skeletal muscle (kg)"]     ?? f["skeletal_muscle"]),
      aguaPct:        numOpt(f["Total body water (%)"]     ?? f["total_body_water"]),
      fuente:         "samsung-health-csv",
    });
  }
  return { items, errors };
}

/**
 * Parsea un CSV de ejercicio de Samsung Health.
 * Columnas: "Start time", "Exercise type", "Duration", "Calorie (kcal)",
 * "Mean heart rate (bpm)", "Max heart rate (bpm)"
 */
export function parsearEjercicioCSV(
  text: string,
  miembro: MiembroId,
): ParseResult<Omit<SesionCardio, "idCardio" | "fechaCreacion">> {
  const filas  = parseCsv(text);
  const items: Omit<SesionCardio, "idCardio" | "fechaCreacion">[] = [];
  const errors: string[] = [];

  for (const f of filas) {
    const fecha = fechaDe(f["Start time"] ?? f["start_time"] ?? "");
    if (!fecha || fecha.length !== 10) {
      errors.push(`Fila sin fecha: ${JSON.stringify(f)}`);
      continue;
    }

    const actividad = f["Exercise type"] ?? f["exercise_type"] ?? "Actividad";
    const durSegStr = f["Duration"] ?? f["duration"] ?? "";
    // Duration puede ser "00:30:00" (HH:MM:SS) o segundos
    let durMin: number | undefined;
    if (durSegStr.includes(":")) {
      const parts = durSegStr.split(":").map(Number);
      durMin = Math.round((parts[0] * 3600 + parts[1] * 60 + (parts[2] ?? 0)) / 60);
    } else {
      durMin = durSegStr ? Math.round(Number(durSegStr) / 60) : undefined;
    }

    items.push({
      miembro,
      fecha,
      actividad,
      esVR:       actividad.toLowerCase().includes("vr") || actividad.toLowerCase().includes("beat saber"),
      duracionMin: durMin,
      kcal:        numOpt(f["Calorie (kcal)"]          ?? f["calorie"]),
      fcPromedio:  numOpt(f["Mean heart rate (bpm)"]   ?? f["mean_heart_rate"]),
      fcMaxima:    numOpt(f["Max heart rate (bpm)"]    ?? f["max_heart_rate"]),
      fuente:      "samsung-health-csv",
    });
  }
  return { items, errors };
}
