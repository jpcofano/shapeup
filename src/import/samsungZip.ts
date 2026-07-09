// ════════════════════════════════════════════════════════════════════════════
//  import/samsungZip.ts — Importador zip-first de Samsung Health
//
//  El ZIP del export de Samsung contiene ~2300 archivos en:
//    samsunghealth_<user>_<ts>/
//      com.samsung.health.weight.csv, com.samsung.shealth.exercise.csv, …
//      com.samsung.shealth.exercise.custom_exercise.csv   ← custom_id de ShapeUp
//      jsons/com.samsung.shealth.exercise/<letra>/<uuid>.…live_data.json
//
//  ADR: extracción selectiva — NO se descomprime todo el zip en memoria.
//  Se listan las entradas (índice) y se leen solo los archivos necesarios
//  según el nivel de importación.
//
//  ADR: no se usa File System Access API (showDirectoryPicker) — no existe
//  en Chrome/Firefox móvil. El zip es la única opción para import one-shot en PWA.
// ════════════════════════════════════════════════════════════════════════════

import JSZip from "jszip";
import type { MiembroId, MetricaSalud } from "../types/models";
import type { PerfilMiembro } from "../types/models";
import {
  detectarTipoCsv, detectarTiposMetrica,
  parsearPeso, parsearEjercicio, parsearSueno, parsearMetricas,
  type MedicionInput, type CardioInput, type SuenoInput, type SamsungCsvType,
} from "./samsungHealth";
import { parsearLiveData, type LiveDataPoint } from "./samsungLiveData";
import type { SesionSamsung } from "../lib/matchBiometrico";

// ── Tipos públicos ────────────────────────────────────────────────────────────

/** Nivel de extracción del zip. */
export type ZipImportNivel = "basico" | "completo" | "biometrico";

/** Resultado de la extracción: items parseados listos para preview + import. */
export interface ZipExtraccion {
  mediciones: MedicionInput[];
  cardio:     CardioInput[];
  sueno:      SuenoInput[];
  metricas:   MetricaSalud[];
  /** Curvas de FC por datauuid (solo nivel "biometrico"). */
  liveData:        Record<string, LiveDataPoint[]>;
  /** custom_id de la sesión ShapeUp (solo nivel "biometrico"). */
  shapeUpCustomId: string | undefined;
  /** Sesiones de ejercicio con timestamps, para el match biométrico (nivel "biometrico"; [] en otros niveles). */
  sesionesSamsung: SesionSamsung[];
  errors:     string[];
  csvsLeidos: string[];
  /** Diagnóstico: qué archivos CSV se encontraron en el ZIP por tipo conocido. */
  csvsPorTipo: Record<string, string>;
  /** CSVs en el ZIP que no se reconocieron (para detectar nuevos formatos). */
  otrosCSVs: string[];
  /**
   * Inventario completo: cada archivo relevante del export → qué parser lo tomó,
   * o "sin parser" si no se reconoció. Diagnóstico para las métricas en cero
   * (S-fix, P55): con esto se ve qué archivos trae realmente el export del owner.
   */
  inventario: { archivo: string; parser: string }[];
}

// ── Constantes ────────────────────────────────────────────────────────────────

const CUSTOM_EXERCISE_KEY  = "custom_exercise";
const LIVE_DATA_DIR        = "jsons/com.samsung.shealth.exercise/";
const LIVE_DATA_SUFFIX     = "live_data.json";

/**
 * Nombres que indican un export válido de Samsung Health.
 * Los formatos más nuevos (2025+) solo tienen el CSV de peso como CSV tradicional;
 * ejercicio y sueño se exportan en otros formatos. Por eso el ZIP del nombre del
 * archivo (samsunghealth_*) es suficiente como marker alternativo.
 */
const SAMSUNG_MARKERS = [
  "com.samsung.health.weight",
  "com.samsung.shealth.exercise",
  "com.samsung.shealth.sleep",
];

// ── Helpers internos ──────────────────────────────────────────────────────────

/** true si el zip tiene algún marker de Samsung Health (CSV o nombre del zip). */
function esSamsungExport(paths: string[], zipFilename?: string): boolean {
  if (zipFilename && zipFilename.toLowerCase().includes("samsunghealth")) return true;
  return SAMSUNG_MARKERS.some((m) => paths.some((p) => p.toLowerCase().includes(m)));
}

/**
 * Extrae el datauuid del path de un live_data.json.
 * Formato: jsons/…/<letra>/<datauuid>.com.samsung.health.exercise.live_data.json
 */
function datauuidDeRuta(path: string): string {
  const filename = path.split("/").pop() ?? "";
  return filename.split(".com.samsung")[0];
}

/**
 * Parsea el CSV de custom_exercise y devuelve un mapa custom_id → custom_name
 * y el custom_id específico de ShapeUp (si existe).
 */
function extraerCustomExercises(text: string): {
  shapeUpCustomId: string | undefined;
  customNameMap: Map<string, string>;
} {
  const customNameMap = new Map<string, string>();
  let shapeUpCustomId: string | undefined;
  const lines = text.split(/\r?\n/);
  if (lines.length < 3) return { shapeUpCustomId, customNameMap };
  const headers = lines[1].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const idxId   = headers.findIndex((h) => h.endsWith("custom_id"));
  const idxName = headers.findIndex((h) => h.endsWith("custom_name"));
  if (idxId < 0 || idxName < 0) return { shapeUpCustomId, customNameMap };
  for (const line of lines.slice(2)) {
    if (!line.trim()) continue;
    const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    const id   = cols[idxId];
    const name = cols[idxName];
    if (id && name) customNameMap.set(id, name);
    if (name?.toLowerCase() === "shapeup") shapeUpCustomId = id;
  }
  return { shapeUpCustomId, customNameMap };
}

// ── Función principal ─────────────────────────────────────────────────────────

/**
 * Extrae e importa los datos relevantes de un ZIP de Samsung Health.
 *
 * @param file   El archivo .zip elegido por el usuario.
 * @param miembro ID del miembro de la familia.
 * @param nivel  "basico" (peso/cardio/sueño) | "completo" (+ métricas) |
 *               "biometrico" (+ curvas FC live_data.json).
 * @param zonasFC Zonas FC del perfil del miembro (para derivar zonaPrincipal).
 * @param onProgress Callback (0–100) para la barra de progreso de la UI.
 */
export async function extraerDesdeZip(
  file: File,
  miembro: MiembroId,
  nivel: ZipImportNivel,
  zonasFC?: PerfilMiembro["zonasFC"],
  onProgress?: (pct: number, msg: string) => void,
): Promise<ZipExtraccion> {
  const result: ZipExtraccion = {
    mediciones: [], cardio: [], sueno: [], metricas: [],
    liveData: {}, shapeUpCustomId: undefined, sesionesSamsung: [],
    errors: [], csvsLeidos: [], csvsPorTipo: {}, otrosCSVs: [], inventario: [],
  };

  const progress = (pct: number, msg: string) => onProgress?.(pct, msg);

  // ── 1. Cargar índice del zip ───────────────────────────────────────────────
  progress(5, "Abriendo ZIP…");
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(file);
  } catch {
    result.errors.push("No se pudo abrir el archivo. ¿Es un ZIP válido?");
    return result;
  }

  const allPaths = Object.keys(zip.files).filter((p) => !zip.files[p].dir);
  progress(10, "Verificando formato…");

  if (!esSamsungExport(allPaths, file.name)) {
    result.errors.push(
      "No reconocí el ZIP como un export de Samsung Health. " +
      "Esperaba CSVs de peso, ejercicio o sueño."
    );
    return result;
  }

  // ── 2. Construir índices: CSV por tipo y live_data por datauuid ───────────
  const csvPorTipo: Record<string, string> = {};   // tipo → path (último ganador)
  const customExercisePath: string[] = [];
  const liveDataIndex: Record<string, string> = {}; // datauuid → path en zip
  const TIPO_LABEL: Record<Exclude<SamsungCsvType, "unknown">, string> = {
    weight: "peso", exercise: "cardio", sleep: "sueño",
  };
  let liveDataJsonCount = 0;

  for (const path of allPaths) {
    const filename = path.split("/").pop() ?? "";
    const lower    = filename.toLowerCase();

    // CSV de custom_exercise (para encontrar custom_id de ShapeUp)
    if (lower.includes(CUSTOM_EXERCISE_KEY) && lower.endsWith(".csv")) {
      customExercisePath.push(path);
      result.inventario.push({ archivo: filename, parser: "índice de ejercicios custom (ShapeUp)" });
      continue;
    }

    // Solo archivos .csv para los parsers de Samsung (los .json son blobs internos)
    if (lower.endsWith(".csv")) {
      const tipo = detectarTipoCsv(filename);
      if (tipo !== "unknown") {
        csvPorTipo[tipo] = path;
        result.inventario.push({ archivo: filename, parser: TIPO_LABEL[tipo] });
        continue;
      }
      // Métricas genéricas (también CSV)
      const tipoMeta = detectarTiposMetrica(filename);
      if (tipoMeta) {
        csvPorTipo[`meta:${filename}`] = path;
        result.inventario.push({ archivo: filename, parser: `métricas: ${tipoMeta.tipos.join(", ")}` });
        continue;
      }
      // CSV no reconocido — guardarlo para diagnóstico
      result.otrosCSVs.push(filename);
      result.inventario.push({ archivo: filename, parser: "sin parser" });
    }

    // live_data.json (nivel biometrico)
    if (nivel === "biometrico" && path.includes(LIVE_DATA_DIR) && lower.endsWith(LIVE_DATA_SUFFIX)) {
      const uuid = datauuidDeRuta(path);
      if (uuid) liveDataIndex[uuid] = path;
      liveDataJsonCount++;
    }
  }

  if (liveDataJsonCount > 0) {
    result.inventario.push({
      archivo: `${LIVE_DATA_DIR}**/*${LIVE_DATA_SUFFIX} (${liveDataJsonCount} archivos)`,
      parser: "curvas FC (biométrico)",
    });
  }

  // Guardar diagnóstico: qué archivos encontramos para cada tipo conocido
  result.csvsPorTipo = Object.fromEntries(
    Object.entries(csvPorTipo).map(([k, v]) => [k, v.split("/").pop() ?? v]),
  );

  progress(15, "Leyendo CSVs…");

  // ── 3. Parsear CSVs principales ───────────────────────────────────────────

  // 3a. Extraer índice de ejercicios custom (para resolver "ShapeUp" vs "Tipo 0")
  let shapeUpCustomIdFromIndex: string | undefined;
  let customNameMap = new Map<string, string>();
  for (const path of customExercisePath) {
    try {
      const text = await zip.files[path].async("text");
      const extracted = extraerCustomExercises(text);
      if (extracted.shapeUpCustomId) shapeUpCustomIdFromIndex = extracted.shapeUpCustomId;
      for (const [id, name] of extracted.customNameMap) customNameMap.set(id, name);
    } catch {
      // silencioso
    }
  }
  const shapeUpCustomIds = shapeUpCustomIdFromIndex
    ? new Set([shapeUpCustomIdFromIndex])
    : new Set<string>();

  const readAndParse = async (
    tipo: "weight" | "exercise" | "sleep",
    parser: (text: string, m: MiembroId, z?: PerfilMiembro["zonasFC"]) => { items: unknown[]; errors: string[] },
    targetArray: unknown[],
  ) => {
    const path = csvPorTipo[tipo];
    if (!path) return;
    try {
      const text = await zip.files[path].async("text");
      const { items, errors } = parser(text, miembro, zonasFC);
      targetArray.push(...items);
      result.errors.push(...errors);
      result.csvsLeidos.push(path.split("/").pop() ?? path);
    } catch (e) {
      result.errors.push(`Error leyendo ${tipo}: ${String(e)}`);
    }
  };

  await readAndParse("weight", (t, m) => parsearPeso(t, m), result.mediciones as unknown[]);
  progress(30, "Peso procesado…");

  // Ejercicio: pasa el índice de custom exercises para resolver "Tipo 0"
  const exercisePath = csvPorTipo["exercise"];
  if (exercisePath) {
    try {
      const text = await zip.files[exercisePath].async("text");
      const { items, errors } = parsearEjercicio(text, miembro, zonasFC, shapeUpCustomIds, customNameMap);
      (result.cardio as unknown[]).push(...items);
      result.errors.push(...errors);
      result.csvsLeidos.push(exercisePath.split("/").pop() ?? exercisePath);
    } catch (e) {
      result.errors.push(`Error leyendo exercise: ${String(e)}`);
    }
  }
  progress(45, "Cardio procesado…");

  await readAndParse("sleep", (t, m) => parsearSueno(t, m), result.sueno as unknown[]);
  progress(55, "Sueño procesado…");

  // ── 4. Métricas genéricas (nivel completo o biometrico) ───────────────────
  if (nivel !== "basico") {
    const metaPaths = Object.keys(csvPorTipo).filter((k) => k.startsWith("meta:"));
    let metaIdx = 0;
    for (const key of metaPaths) {
      const path     = csvPorTipo[key];
      const filename = path.split("/").pop() ?? "";
      try {
        const text = await zip.files[path].async("text");
        const { items, errors } = parsearMetricas(filename, text, miembro);
        result.metricas.push(...(items as MetricaSalud[]));
        result.errors.push(...errors);
        result.csvsLeidos.push(filename);
      } catch (e) {
        result.errors.push(`Error leyendo métrica ${filename}: ${String(e)}`);
      }
      metaIdx++;
      progress(55 + Math.round((metaIdx / metaPaths.length) * 15), "Métricas…");
    }
  }

  progress(70, "Terminado CSVs…");

  // ── 5. Biometría: sesionesSamsung + live_data.json ───────────────────────
  if (nivel === "biometrico") {
    // El shapeUpCustomId ya fue extraído en paso 3a junto con customNameMap
    result.shapeUpCustomId = shapeUpCustomIdFromIndex;
    progress(75, "Identificando sesiones ShapeUp…");

    // 5b. Construir SesionSamsung[] desde los items de ejercicio parseados
    type EjItem = CardioInput & { _uuid: string; _startMs?: number; _endMs?: number; _customId?: string; _fcMin?: number };
    result.sesionesSamsung = (result.cardio as EjItem[])
      .filter((c) => c._startMs != null && c._endMs != null)
      .map((c) => ({
        datauuid: c._uuid,
        startMs:  c._startMs!,
        endMs:    c._endMs!,
        customId: c._customId,
        fcMedia:  c.fcPromedio,
        fcMax:    c.fcMaxima,
        fcMin:    c._fcMin,
        kcal:     c.kcal,
        fecha:    c.fecha,
      }));

    // 5c. Leer curvas de FC (live_data.json) para sesiones con datauuid en el índice
    const datauuidsConCurva = result.sesionesSamsung
      .map((s) => s.datauuid)
      .filter((d) => !!liveDataIndex[d]);

    const total = datauuidsConCurva.length;
    let done = 0;
    for (const uuid of datauuidsConCurva) {
      const path = liveDataIndex[uuid];
      try {
        const text = await zip.files[path].async("text");
        const json = JSON.parse(text) as unknown;
        const pts  = parsearLiveData(json);
        if (pts.length > 0) result.liveData[uuid] = pts;
      } catch {
        // silencioso por diseño — degradación elegante
      }
      done++;
      progress(75 + Math.round((done / Math.max(total, 1)) * 20), `Curvas FC: ${done}/${total}`);
    }
  }

  progress(100, "Listo.");
  return result;
}
