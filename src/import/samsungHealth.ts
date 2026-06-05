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
  MetricaSalud, TipoMetrica, AgregacionMetrica,
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

// ════════════════════════════════════════════════════════════════════════════
//  MÉTRICAS GENÉRICAS — granularidad diaria para el motor de recomendaciones
// ════════════════════════════════════════════════════════════════════════════

/**
 * Detecta si un nombre de archivo corresponde a un CSV de métricas genéricas
 * y devuelve el/los TipoMetrica que produce.
 * Devuelve null si el archivo no es de métricas genéricas (peso/cardio/sueño
 * ya tienen su propio parser).
 */
export function detectarTiposMetrica(
  filename: string,
): { tipos: TipoMetrica[]; agregacion: AgregacionMetrica } | null {
  const f = filename.toLowerCase();
  if (f.includes("heart_rate"))         return { tipos: ["fc-reposo", "fc-max-dia"], agregacion: "dia" };
  if (f.includes("hrv"))                return { tipos: ["hrv"],                     agregacion: "noche" };
  if (f.includes("stress"))             return { tipos: ["estres"],                  agregacion: "dia" };
  if (f.includes("step_daily"))         return { tipos: ["pasos"],                   agregacion: "dia" };
  if (f.includes("oxygen_saturation"))  return { tipos: ["spo2"],                    agregacion: "dia" };
  if (f.includes("respiratory_rate"))   return { tipos: ["frecuencia-respiratoria"], agregacion: "noche" };
  if (f.includes("skin_temperature"))   return { tipos: ["temperatura-piel"],        agregacion: "noche" };
  if (f.includes("blood_pressure"))     return { tipos: ["presion-sistolica", "presion-diastolica"], agregacion: "ultimo-del-dia" };
  if (f.includes("vitality"))           return { tipos: ["vitality"],                agregacion: "dia" };
  return null;
}

// ── Helpers de agregación (puros, testeables) ─────────────────────────────────

/** Mínimo de un array de números. */
export function minArr(nums: number[]): number | undefined {
  if (!nums.length) return undefined;
  return Math.min(...nums);
}
/** Máximo de un array de números. */
export function maxArr(nums: number[]): number | undefined {
  if (!nums.length) return undefined;
  return Math.max(...nums);
}
/** Promedio de un array de números. */
export function avgArr(nums: number[]): number | undefined {
  if (!nums.length) return undefined;
  return parseFloat((nums.reduce((s, n) => s + n, 0) / nums.length).toFixed(1));
}
/** Suma de un array de números. */
export function sumArr(nums: number[]): number | undefined {
  if (!nums.length) return undefined;
  return nums.reduce((s, n) => s + n, 0);
}
/** Último elemento de un array de números. */
export function lastArr(nums: number[]): number | undefined {
  return nums.length ? nums[nums.length - 1] : undefined;
}

/** Construye idMetrica idempotente: `${miembro}-${tipo}-${fecha}` */
export function idMetrica(miembro: MiembroId, tipo: TipoMetrica, fecha: string): string {
  return `${miembro}-${tipo}-${fecha}`;
}

// ── Agrupador genérico por día ────────────────────────────────────────────────

type DayMap = Map<string, number[]>;  // fecha → [valores]

function groupByDay(
  filas: Record<string, string>[],
  colValor: string,
  colTime = "start_time",
  colOffset = "time_offset",
): DayMap {
  const map: DayMap = new Map();
  for (const f of filas) {
    const fecha = epochToDate(col(f, colTime), col(f, colOffset) || undefined);
    if (!fecha) continue;
    const v = numOpt(col(f, colValor));
    if (v == null) continue;
    const arr = map.get(fecha) ?? [];
    arr.push(v);
    map.set(fecha, arr);
  }
  return map;
}

function dayMapToMetricas(
  map: DayMap,
  miembro: MiembroId,
  tipo: TipoMetrica,
  agregacion: AgregacionMetrica,
  unidad: string,
  fn: (nums: number[]) => number | undefined,
): MetricaSalud[] {
  const result: MetricaSalud[] = [];
  for (const [fecha, nums] of map) {
    const valor = fn(nums);
    if (valor == null) continue;
    result.push({
      idMetrica:  idMetrica(miembro, tipo, fecha),
      miembro,
      tipo,
      fecha,
      valor,
      unidad,
      agregacion,
      fuente:     "samsung-health-csv",
    });
  }
  return result;
}

// ── Parser principal para métricas genéricas ─────────────────────────────────

export interface MetricaParseResult {
  items:  MetricaSalud[];
  errors: string[];
}

/**
 * Parsea cualquier CSV de métricas genéricas de Samsung Health y devuelve
 * MetricaSalud[] con un valor por día (o por noche). La agregación depende del
 * tipo: min para fc-reposo, max para fc-max-dia, avg para estres/spo2, etc.
 *
 * Para HRV, intenta parsear `binning_data` y lo guarda en `payload`.
 */
export function parsearMetricas(
  filename: string,
  text: string,
  miembro: MiembroId,
): MetricaParseResult {
  const meta = detectarTiposMetrica(filename);
  if (!meta) return { items: [], errors: [`Archivo no reconocido como métrica genérica: ${filename}`] };

  const filas = parseSamsungCsv(text);
  const errors: string[] = [];
  const all: MetricaSalud[] = [];
  const f = filename.toLowerCase();

  // ── FC (heart_rate) ───────────────────────────────────────────────────────
  if (f.includes("heart_rate") && !f.includes("recovery")) {
    const byDay = groupByDay(filas, "heart_rate");
    all.push(...dayMapToMetricas(byDay, miembro, "fc-reposo",   "dia", "bpm", minArr));
    all.push(...dayMapToMetricas(byDay, miembro, "fc-max-dia",  "dia", "bpm", maxArr));
    return { items: all, errors };
  }

  // ── HRV ───────────────────────────────────────────────────────────────────
  if (f.includes("hrv")) {
    for (const row of filas) {
      const fecha = epochToDate(col(row, "start_time"), col(row, "time_offset") || undefined);
      if (!fecha) continue;
      const hrv = numOpt(col(row, "hrv"));
      // binning_data puede ser JSON string o plain number
      let payload: Record<string, unknown> | undefined;
      const binRaw = col(row, "binning_data");
      if (binRaw) {
        try { payload = { bins: JSON.parse(binRaw) }; }
        catch { payload = { bins_raw: binRaw }; }
      }
      if (hrv == null) continue;
      all.push({
        idMetrica: idMetrica(miembro, "hrv", fecha),
        miembro, tipo: "hrv", fecha, valor: hrv, unidad: "ms",
        agregacion: "noche", payload, fuente: "samsung-health-csv",
      });
    }
    return { items: all, errors };
  }

  // ── Estrés ────────────────────────────────────────────────────────────────
  if (f.includes("stress")) {
    const byDay = groupByDay(filas, "stress_score");
    all.push(...dayMapToMetricas(byDay, miembro, "estres", "dia", "", avgArr));
    return { items: all, errors };
  }

  // ── Pasos ─────────────────────────────────────────────────────────────────
  if (f.includes("step_daily")) {
    const byDay = groupByDay(filas, "count");
    all.push(...dayMapToMetricas(byDay, miembro, "pasos", "dia", "pasos", sumArr));
    return { items: all, errors };
  }

  // ── SpO2 ──────────────────────────────────────────────────────────────────
  if (f.includes("oxygen_saturation")) {
    const byDay = groupByDay(filas, "spo2");
    all.push(...dayMapToMetricas(byDay, miembro, "spo2", "dia", "%", avgArr));
    return { items: all, errors };
  }

  // ── Frecuencia respiratoria ───────────────────────────────────────────────
  if (f.includes("respiratory_rate")) {
    const byDay = groupByDay(filas, "respiratory_rate");
    all.push(...dayMapToMetricas(byDay, miembro, "frecuencia-respiratoria", "noche", "rpm", avgArr));
    return { items: all, errors };
  }

  // ── Temperatura de piel ───────────────────────────────────────────────────
  if (f.includes("skin_temperature")) {
    const byDay = groupByDay(filas, "skin_temperature");
    all.push(...dayMapToMetricas(byDay, miembro, "temperatura-piel", "noche", "°C", avgArr));
    return { items: all, errors };
  }

  // ── Presión arterial ──────────────────────────────────────────────────────
  if (f.includes("blood_pressure")) {
    const bySisDay = groupByDay(filas, "systolic");
    const byDiaDay = groupByDay(filas, "diastolic");
    all.push(...dayMapToMetricas(bySisDay, miembro, "presion-sistolica",  "ultimo-del-dia", "mmHg", lastArr));
    all.push(...dayMapToMetricas(byDiaDay, miembro, "presion-diastolica", "ultimo-del-dia", "mmHg", lastArr));
    return { items: all, errors };
  }

  // ── Vitalidad ─────────────────────────────────────────────────────────────
  if (f.includes("vitality")) {
    const byDay = groupByDay(filas, "vitality_score");
    all.push(...dayMapToMetricas(byDay, miembro, "vitality", "dia", "", avgArr));
    return { items: all, errors };
  }

  return { items: [], errors: [`Sin handler para: ${filename}`] };
}
