// ════════════════════════════════════════════════════════════════════════════
//  src/import/samsungHealth.ts — Parsers puros de CSV de Samsung Health.
//
//  Formato Samsung Health (clave del spec en SAMSUNG-HEALTH-MAPEO.md):
//   · Línea 1 = metadata (saltear).
//   · Encabezado real = línea 2; datos desde línea 3.
//   · Columnas prefijadas: com.samsung.health.weight.*, etc. → matchear por sufijo.
//   · Timestamps: epoch en milisegundos + time_offset ("UTC-0300").
//   · duration en ms, distance en metros, sleep_duration en minutos.
//   · datauuid por fila → base para IDs idempotentes.
// ════════════════════════════════════════════════════════════════════════════

import type {
  MedicionCorporal, SesionCardio, RegistroSueno, MiembroId, ZonaFC,
} from "../types/models";

export type MedicionInput = Omit<MedicionCorporal, "idMedicion" | "fechaCreacion">;
export type CardioInput   = Omit<SesionCardio,   "idCardio"   | "fechaCreacion">;
export type SuenoInput    = Omit<RegistroSueno,  "idSueno">;

export interface ParseResult<T> {
  items:  T[];
  errors: string[];
}

// ── Detección de tipo por nombre de archivo ───────────────────────────────────

export type SamsungCsvType = "weight" | "exercise" | "sleep" | "unknown";

/** Detecta qué tipo de CSV de Samsung Health es según el nombre del archivo. */
export function detectarTipoCsv(filename: string): SamsungCsvType {
  const f = filename.toLowerCase();
  if (f.includes("body_weight") || f.includes("weight")) return "weight";
  if (f.includes("exercise"))                             return "exercise";
  if (f.includes("sleep"))                               return "sleep";
  return "unknown";
}

// ── Helpers de parseo de CSV ──────────────────────────────────────────────────

/**
 * Parsea el texto de un CSV de Samsung Health a filas de objetos.
 * Salta la línea 1 (metadata); usa la línea 2 como encabezado.
 */
function parseSamsungCsv(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/);
  // Línea 0 = metadata (p.ej. "com.samsung.health.weight,6320001,12") → saltear
  // Línea 1 = encabezado real
  // Líneas 2+ = datos
  if (lines.length < 3) return [];

  const rawHeaders = lines[1].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const dataLines  = lines.slice(2);

  return dataLines
    .filter((l) => l.trim())
    .map((line) => {
      const values = splitCsvLine(line);
      const obj: Record<string, string> = {};
      rawHeaders.forEach((h, i) => { obj[h] = (values[i] ?? "").trim().replace(/^"|"$/g, ""); });
      return obj;
    });
}

/** Split de línea CSV respetando comillas (naive, suficiente para Samsung Health). */
function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') { inQuote = !inQuote; }
    else if (line[i] === "," && !inQuote) { result.push(current); current = ""; }
    else { current += line[i]; }
  }
  result.push(current);
  return result;
}

/**
 * Busca el valor de una columna por sufijo, ignorando el prefijo
 * `com.samsung.health.*`.
 */
function col(row: Record<string, string>, suffix: string): string {
  // Coincidencia exacta primero
  if (row[suffix] !== undefined) return row[suffix];
  // Buscar cualquier clave que termine en ".{suffix}"
  for (const k of Object.keys(row)) {
    if (k === suffix || k.endsWith(`.${suffix}`)) return row[k];
  }
  return "";
}

// ── Helpers de tiempo ─────────────────────────────────────────────────────────

/**
 * Convierte epoch en ms + time_offset a "YYYY-MM-DD" local.
 * time_offset: "UTC-0300", "UTC+0530", "+0300", "-0300"
 */
function epochToDate(epochMs: string, offset?: string): string {
  const ms = parseInt(epochMs, 10);
  if (!epochMs || isNaN(ms)) return "";
  const d = offsetDate(ms, offset);
  return d ? d.toISOString().slice(0, 10) : new Date(ms).toISOString().slice(0, 10);
}

function epochToTime(epochMs: string, offset?: string): string {
  const ms = parseInt(epochMs, 10);
  if (!epochMs || isNaN(ms)) return "";
  const d = offsetDate(ms, offset);
  if (!d) return "";
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function offsetDate(ms: number, offset?: string): Date | null {
  if (!offset) return null;
  const m = offset.match(/([+-])(\d{2}):?(\d{2})/);
  if (!m) return null;
  const sign = m[1] === "+" ? 1 : -1;
  const offMs = sign * (parseInt(m[2]) * 60 + parseInt(m[3])) * 60_000;
  return new Date(ms + offMs);
}

function numOpt(s: string): number | undefined {
  if (!s || s === "" || s === "-") return undefined;
  const n = parseFloat(s);
  return isNaN(n) ? undefined : n;
}

// ── Derivar zona de FC ────────────────────────────────────────────────────────

/** Zona de FC principal para una FC media dada. */
export function derivarZona(
  fc: number,
  zonas?: Partial<Record<ZonaFC, { min: number; max: number }>>,
): ZonaFC | undefined {
  if (!zonas || !fc) return undefined;
  for (const zona of (["Z5", "Z4", "Z3", "Z2", "Z1"] as ZonaFC[])) {
    const z = zonas[zona];
    if (z && fc >= z.min && fc <= z.max) return zona;
  }
  return undefined;
}

// ── Tipos de ejercicio Samsung Health ─────────────────────────────────────────
// Subconjunto de los más comunes. El resto cae en "Actividad".
const EXERCISE_TYPE: Record<string, string> = {
  "11": "Caminata",  "12": "Carrera",        "13": "Ciclismo",
  "14": "Natación",  "15": "Ciclismo indoor", "28": "Aeróbico",
  "29": "Fitness",   "30": "Baile",           "39": "Fútbol",
  "44": "Básquet",   "45": "Tenis",           "53": "Yoga",
  "56": "Escalada",  "58": "Esquí",           "68": "Kayak",
  "1001": "HIIT",    "1002": "Entrenamiento", "1003": "Pesas",
  "10005": "Bailando",
};

function resolverActividad(typeCode: string, title: string): string {
  if (title && title.trim() && title !== "-") return title.trim();
  return EXERCISE_TYPE[typeCode.trim()] ?? (typeCode ? `Tipo ${typeCode}` : "Actividad");
}

// ── Parsers públicos ──────────────────────────────────────────────────────────

/**
 * Parsea un CSV `com.samsung.health.body_weight` → `MedicionInput[]`.
 * Idempotente por `datauuid`.
 */
export function parsearPeso(
  text: string,
  miembro: MiembroId,
): ParseResult<MedicionInput & { _uuid: string }> {
  const filas  = parseSamsungCsv(text);
  const items: (MedicionInput & { _uuid: string })[] = [];
  const errors: string[] = [];

  for (const f of filas) {
    const uuid     = col(f, "datauuid");
    const startMs  = col(f, "start_time");
    const offset   = col(f, "time_offset");
    const fecha    = epochToDate(startMs, offset);

    if (!fecha) { errors.push(`Fila sin fecha (uuid=${uuid || "?"})`); continue; }

    const peso   = numOpt(col(f, "weight"));
    const grasa  = numOpt(col(f, "body_fat"));
    const altura = numOpt(col(f, "height")); // en cm
    const imc    = (peso && altura && altura > 0)
      ? parseFloat((peso / ((altura / 100) ** 2)).toFixed(1))
      : undefined;

    items.push({
      _uuid:          uuid,
      miembro,
      fecha,
      pesoKg:         peso,
      grasaPct:       grasa,
      masaMuscularKg: numOpt(col(f, "muscle_mass")),
      masaGrasaKg:    numOpt(col(f, "body_fat_mass")),
      aguaPct:        numOpt(col(f, "total_body_water")),
      imc,
      fuente:         "samsung-health-csv",
    });
  }
  return { items, errors };
}

/**
 * Parsea un CSV `com.samsung.shealth.exercise` → `CardioInput[]`.
 * Derive `zonaPrincipal` comparando FC media vs zonas del perfil del miembro.
 * Idempotente por `datauuid`.
 */
export function parsearEjercicio(
  text: string,
  miembro: MiembroId,
  zonasFC?: Partial<Record<ZonaFC, { min: number; max: number }>>,
): ParseResult<CardioInput & { _uuid: string }> {
  const filas  = parseSamsungCsv(text);
  const items: (CardioInput & { _uuid: string })[] = [];
  const errors: string[] = [];

  for (const f of filas) {
    const uuid     = col(f, "datauuid");
    const startMs  = col(f, "start_time");
    const offset   = col(f, "time_offset");
    const fecha    = epochToDate(startMs, offset);

    if (!fecha) { errors.push(`Fila sin fecha (uuid=${uuid || "?"})`); continue; }

    const durMs     = numOpt(col(f, "duration"));  // ms
    const durMin    = durMs != null ? Math.round(durMs / 60_000) : undefined;
    const distM     = numOpt(col(f, "distance"));  // metros
    const distKm    = distM != null ? parseFloat((distM / 1000).toFixed(2)) : undefined;
    const fcMedia   = numOpt(col(f, "mean_heart_rate"));
    const actividad = resolverActividad(col(f, "exercise_type"), col(f, "title"));

    items.push({
      _uuid:        uuid,
      miembro,
      fecha,
      actividad,
      esVR:         actividad.toLowerCase().includes("vr") ||
                    actividad.toLowerCase().includes("beat saber") ||
                    actividad.toLowerCase().includes("creed"),
      duracionMin:  durMin,
      distanciaKm:  distKm,
      kcal:         numOpt(col(f, "calorie")) ?? numOpt(col(f, "total_calorie")),
      fcPromedio:   fcMedia,
      fcMaxima:     numOpt(col(f, "max_heart_rate")),
      zonaPrincipal: fcMedia != null ? derivarZona(fcMedia, zonasFC) : undefined,
      fuente:       "samsung-health-csv",
    });
  }
  return { items, errors };
}

/**
 * Parsea un CSV `com.samsung.shealth.sleep` → `SuenoInput[]`.
 * sleep_duration viene en minutos → convertir a horas.
 * Idempotente por `datauuid`.
 */
export function parsearSueno(
  text: string,
  miembro: MiembroId,
): ParseResult<SuenoInput & { _uuid: string }> {
  const filas  = parseSamsungCsv(text);
  const items: (SuenoInput & { _uuid: string })[] = [];
  const errors: string[] = [];

  for (const f of filas) {
    const uuid       = col(f, "datauuid");
    const startMs    = col(f, "start_time");
    const bedMs      = col(f, "original_bed_time") || startMs;
    const offset     = col(f, "time_offset");
    const fecha      = epochToDate(startMs, offset);

    if (!fecha) { errors.push(`Fila sin fecha (uuid=${uuid || "?"})`); continue; }

    const sleepMin   = numOpt(col(f, "sleep_duration")); // en minutos
    const horas      = sleepMin != null ? parseFloat((sleepMin / 60).toFixed(2)) : undefined;
    const acostarse  = epochToTime(bedMs, offset) || undefined;

    items.push({
      _uuid:          uuid,
      miembro,
      fecha,
      horas,
      horaAcostarse:  acostarse,
      fuente:         "samsung-health-csv",
    });
  }
  return { items, errors };
}
