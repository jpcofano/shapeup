// ════════════════════════════════════════════════════════════════════════════
//  scripts/importar-fedb.ts — Transformador Free Exercise DB (873) → Ejercicio[]
//
//  - Las categorías (modalidad, mecánica, fuerza, nivel, equipo, músculos) quedan
//    en CASTELLANO automáticamente vía los mapeos de models.ts.
//  - El texto libre (nombre, instrucciones, puntos clave, errores) se toma del
//    diccionario `scripts/data/traducciones-fedb.es.json`, que se completa por lotes.
//    Lo que aún no está traducido queda con `traduccion:"pendiente"`.
//
//  Alineado con los seeds de la app de comidas: chequea los archivos y avisa con
//  mensajes claros en vez de crashear. Además, SI FALTA el dataset, lo descarga solo.
//
//  Uso (desde la RAÍZ del repo):
//    npx tsx scripts/importar-fedb.ts                 # baja el dataset si no está y genera el catálogo
//    npx tsx scripts/importar-fedb.ts --solo-traducidos   # exporta solo los ya traducidos
// ════════════════════════════════════════════════════════════════════════════
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import {
  FEDB_MUSCULO, FEDB_EQUIPO, FEDB_NIVEL, FEDB_FUERZA,
  type Ejercicio, type Modalidad, type PatronMovimiento, type Equipo,
  type GrupoMuscular, type Mecanica,
} from "../src/types/models";

type FEDB = {
  id: string; name: string; force: string | null; level: string;
  mechanic: string | null; equipment: string | null;
  primaryMuscles: string[]; secondaryMuscles: string[];
  instructions: string[]; category: string; images: string[];
};
type Traduccion = {
  nombre: string; instrucciones: string[];
  puntosClave?: string[]; erroresComunes?: string[];
  patron?: PatronMovimiento; modalidad?: Modalidad;
  unilateral?: boolean; sinonimos?: string[];
};

const DATA_URL  = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json";
const DATA_PATH = resolve("fedb/exercises.json");
const TRAD_PATH = resolve("scripts/data/traducciones-fedb.es.json");
const OUT_PATH  = resolve("catalogo-ejercicios.json");
const IMG_BASE  = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/";

const MODALIDAD_POR_CATEGORIA: Record<string, Modalidad> = {
  strength: "Fuerza", powerlifting: "Fuerza", "olympic weightlifting": "Fuerza",
  strongman: "Fuerza", plyometrics: "Fuerza", stretching: "Movilidad", cardio: "Cardio",
};
const MECANICA: Record<string, Mecanica> = { compound: "Compuesto", isolation: "Aislamiento" };

function patronAprox(f: FEDB): PatronMovimiento {
  if (f.category === "cardio" || f.category === "plyometrics") return "Locomoción / cardio";
  if (f.force === "push") return "Empuje horizontal";
  if (f.force === "pull") return "Tracción horizontal";
  return "Aislamiento";
}
function equipos(f: FEDB): Equipo[] {
  const e = f.equipment ? FEDB_EQUIPO[f.equipment] : undefined;
  return [e ?? "Otro"];
}
function grupos(muscles: string[]): GrupoMuscular[] {
  const out: GrupoMuscular[] = [];
  for (const m of muscles) { const g = FEDB_MUSCULO[m]; if (g && !out.includes(g)) out.push(g); }
  return out;
}

// Baja el dataset si no está (en vez de crashear). Requiere Node 18+ (fetch global).
async function asegurarDataset(): Promise<void> {
  if (existsSync(DATA_PATH)) return;
  console.log("No encontré fedb/exercises.json — lo descargo de Free Exercise DB…");
  try {
    const res = await fetch(DATA_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const txt = await res.text();
    mkdirSync(dirname(DATA_PATH), { recursive: true });
    writeFileSync(DATA_PATH, txt);
    console.log(`Descargado: ${txt.length} bytes → ${DATA_PATH}`);
  } catch (e) {
    console.error(`
ERROR: no pude descargar el dataset (${(e as Error).message}).
Descargalo a mano y guardalo en: ${DATA_PATH}
  URL: ${DATA_URL}
(En Windows:  mkdir fedb  &&  curl.exe -L -o fedb/exercises.json ${DATA_URL})
`);
    process.exit(1);
  }
}

async function main() {
  const soloTrad = process.argv.includes("--solo-traducidos");

  await asegurarDataset();

  if (!existsSync(TRAD_PATH)) {
    console.error(`ERROR: no encontré el diccionario de traducciones en ${TRAD_PATH}`);
    process.exit(1);
  }

  const fedb: FEDB[] = JSON.parse(readFileSync(DATA_PATH, "utf8"));
  const trad: Record<string, Traduccion> = JSON.parse(readFileSync(TRAD_PATH, "utf8"));

  let n = 0;
  const catalogo: (Partial<Ejercicio> & { traduccion: "ok" | "pendiente" })[] = [];

  for (const f of fedb) {
    const t = trad[f.id];
    if (soloTrad && !t) continue;
    n += 1;
    const primario = grupos(f.primaryMuscles)[0] ?? "Cuerpo completo";
    catalogo.push({
      idEjercicio: `EJ-${String(n).padStart(4, "0")}`,
      nombre: t?.nombre ?? f.name,
      modalidad: t?.modalidad ?? MODALIDAD_POR_CATEGORIA[f.category] ?? "Fuerza",
      patron: t?.patron ?? patronAprox(f),
      mecanica: f.mechanic ? MECANICA[f.mechanic] : undefined,
      fuerzaFEDB: f.force ? FEDB_FUERZA[f.force] : undefined,
      grupoMuscularPrimario: primario,
      gruposSecundarios: grupos(f.secondaryMuscles),
      equipo: equipos(f),
      unilateral: t?.unilateral ?? false,
      nivel: FEDB_NIVEL[f.level] ?? "Principiante",
      instrucciones: t?.instrucciones ?? f.instructions,
      puntosClave: t?.puntosClave ?? [],
      erroresComunes: t?.erroresComunes ?? [],
      descansoSugeridoSeg: 75,
      imagenes: (f.images ?? []).map((p) => IMG_BASE + p),
      sinonimos: t?.sinonimos ?? [],
      fuente: "Free Exercise DB",
      fuenteId: f.id,
      fuenteUrl: "https://github.com/yuhonas/free-exercise-db",
      origen: "import",
      traduccion: t ? "ok" : "pendiente",
    });
  }

  const traducidos = catalogo.filter((c) => c.traduccion === "ok").length;
  writeFileSync(OUT_PATH, JSON.stringify(catalogo, null, 2));
  console.log(`Catálogo → ${OUT_PATH}`);
  console.log(`  ${catalogo.length} ejercicios | traducidos: ${traducidos} | pendientes: ${catalogo.length - traducidos}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
