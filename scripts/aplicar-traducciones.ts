// ════════════════════════════════════════════════════════════════════════════
//  scripts/aplicar-traducciones.ts — Aplica las traducciones del catálogo a
//  los documentos ya existentes de /ejercicios en Firestore.
//
//  Usa update(), NUNCA set(): set() borraría campos que escribe la app
//  (por ejemplo `pasoCargaKg` de P67, o `vecesUsado`).
//
//  Uso (desde la RAÍZ del repo):
//    npx tsx scripts/aplicar-traducciones.ts            # simulación, no escribe
//    npx tsx scripts/aplicar-traducciones.ts --aplicar  # escribe
//
//  Precondición: correr antes `npx tsx scripts/importar-fedb.ts`, que genera
//  catalogo-ejercicios.json a partir del diccionario.
// ════════════════════════════════════════════════════════════════════════════

// corrida: exento — pendiente (P87, se migra cuando se toque): informa cada escritura después de confirmarla, así que lo que hizo se reconstruye leyendo la salida.
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { normalizeText } from "../src/lib/canonical";

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dir, "..");

const aplicar = process.argv.includes("--aplicar");

// ── Campos que este script toca, y ningún otro ────────────────────────────────
const CAMPOS_SIEMPRE = [
  "nombre", "nombreCanonico", "sinonimos",
  "instrucciones", "puntosClave", "erroresComunes",
] as const;
// Estos tres solo se escriben si la traducción los trae explícitamente.
const CAMPOS_OPCIONALES = ["patron", "unilateral", "descansoSugeridoSeg"] as const;

type FEDB = { id: string; name: string };
type Traduccion = Record<string, unknown>;
type Catalogo = Record<string, unknown> & {
  idEjercicio: string;
  nombre: string;
  fuenteId: string;
  traduccion: "ok" | "pendiente";
};

const catalogo: Catalogo[] = JSON.parse(
  readFileSync(resolve(ROOT, "catalogo-ejercicios.json"), "utf8"),
);
const fedb: FEDB[] = JSON.parse(readFileSync(resolve(ROOT, "fedb/exercises.json"), "utf8"));
const trad: Record<string, Traduccion> = JSON.parse(
  readFileSync(resolve(ROOT, "scripts/data/traducciones-fedb.es.json"), "utf8"),
);

const nombreEN = new Map(fedb.map((f) => [f.id, f.name]));

const serviceAccount = JSON.parse(
  readFileSync(resolve(__dir, "service-account.json"), "utf8"),
);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const iguales = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

async function run() {
  console.log(`\nAplicar traducciones — modo: ${aplicar ? "ESCRITURA" : "SIMULACIÓN"}\n`);

  const snap = await db.collection("ejercicios").get();
  const docs = new Map(snap.docs.map((d) => [d.id, d.data() as Record<string, unknown>]));
  console.log(`  /ejercicios en Firestore: ${docs.size} documentos`);

  const traducidos = catalogo.filter((c) => c.traduccion === "ok");
  console.log(`  fichas traducidas en el catálogo: ${traducidos.length}\n`);

  // ── Verificación del mapeo, ANTES de escribir nada ──────────────────────────
  const problemas: string[] = [];
  for (const c of traducidos) {
    const doc = docs.get(c.idEjercicio);
    if (!doc) {
      problemas.push(`${c.idEjercicio}: no existe el documento (esperaba "${c.nombre}")`);
      continue;
    }
    // El fuenteId es el chequeo más fuerte: viene del seed y no lo toca la app.
    if (doc.fuenteId !== undefined && doc.fuenteId !== c.fuenteId) {
      problemas.push(
        `${c.idEjercicio}: fuenteId no coincide (Firestore "${String(doc.fuenteId)}" vs catálogo "${c.fuenteId}")`,
      );
      continue;
    }
    // Y el nombre: tiene que ser el inglés original o el castellano ya aplicado.
    const actual = normalizeText(String(doc.nombreCanonico ?? doc.nombre ?? ""));
    const esperadoEN = normalizeText(nombreEN.get(c.fuenteId) ?? "");
    const esperadoES = normalizeText(c.nombre);
    if (actual !== esperadoEN && actual !== esperadoES) {
      problemas.push(
        `${c.idEjercicio}: nombre no coincide (Firestore "${String(doc.nombreCanonico ?? doc.nombre)}" vs EN "${nombreEN.get(c.fuenteId)}" / ES "${c.nombre}")`,
      );
    }
  }

  if (problemas.length > 0) {
    console.error(`\n❌ ABORTA: ${problemas.length} documentos no verifican el mapeo. No se escribió nada.\n`);
    problemas.slice(0, 40).forEach((p) => console.error("  " + p));
    if (problemas.length > 40) console.error(`  … y ${problemas.length - 40} más.`);
    process.exit(1);
  }
  console.log(`  ✅ Mapeo verificado: los ${traducidos.length} documentos existen y coinciden.\n`);

  // ── Calcular el diff por documento ──────────────────────────────────────────
  const cambios: { id: string; data: Record<string, unknown> }[] = [];
  const diffsDeNombre: string[] = [];
  let sinCambios = 0;

  for (const c of traducidos) {
    const doc = docs.get(c.idEjercicio)!;
    const t = trad[c.fuenteId] ?? {};

    const propuesto: Record<string, unknown> = {
      nombre: c.nombre,
      nombreCanonico: normalizeText(c.nombre),
      sinonimos: c.sinonimos ?? [],
      instrucciones: c.instrucciones ?? [],
      puntosClave: c.puntosClave ?? [],
      erroresComunes: c.erroresComunes ?? [],
    };
    for (const campo of CAMPOS_OPCIONALES) {
      if (t[campo] !== undefined) propuesto[campo] = c[campo];
    }
    propuesto.traduccion = "ok";

    // Guarda: nunca escribir un campo fuera de la lista declarada arriba.
    const permitidos = new Set<string>([...CAMPOS_SIEMPRE, ...CAMPOS_OPCIONALES, "traduccion"]);
    const data: Record<string, unknown> = {};
    for (const [campo, valor] of Object.entries(propuesto)) {
      if (!permitidos.has(campo)) throw new Error(`campo no permitido: ${campo}`);
      if (!iguales(doc[campo], valor)) data[campo] = valor;
    }

    if (Object.keys(data).length === 0) { sinCambios += 1; continue; }

    if (data.nombre !== undefined) {
      diffsDeNombre.push(`${c.idEjercicio}: "${String(doc.nombre)}" → "${c.nombre}"`);
    }
    cambios.push({ id: c.idEjercicio, data });
  }

  console.log(`  documentos que cambian: ${cambios.length}`);
  console.log(`  documentos que quedan igual: ${sinCambios}`);
  if (diffsDeNombre.length > 0) {
    console.log(`\n  primeras diferencias de nombre (${diffsDeNombre.length} en total):`);
    diffsDeNombre.slice(0, 10).forEach((d) => console.log("    " + d));
  }

  if (!aplicar) {
    console.log(`\n  [simulación] No se escribió nada. Corré con --aplicar para escribir.\n`);
    process.exit(0);
  }

  // ── Escritura en batches de 400, siempre con update() ───────────────────────
  const BATCH_SIZE = 400;
  let escritos = 0;
  for (let i = 0; i < cambios.length; i += BATCH_SIZE) {
    const chunk = cambios.slice(i, i + BATCH_SIZE);
    const batch = db.batch();
    for (const { id, data } of chunk) {
      batch.update(db.collection("ejercicios").doc(id), data);
    }
    await batch.commit();
    escritos += chunk.length;
    console.log(`  Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${chunk.length} docs actualizados`);
  }

  console.log(`\n  ✅ ${escritos} documentos actualizados con update() (ningún campo ajeno tocado).\n`);
  process.exit(0);
}

run().catch((e) => { console.error(e); process.exit(1); });
