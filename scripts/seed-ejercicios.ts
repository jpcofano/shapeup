// ════════════════════════════════════════════════════════════════════════════
//  scripts/seed-ejercicios.ts — Sube catalogo-ejercicios.json a Firestore.
//
//  Uso: npx tsx scripts/seed-ejercicios.ts
//  Flags: --dry-run  (muestra qué haría sin escribir)
//         --force    (sobreescribe documentos existentes)
// ════════════════════════════════════════════════════════════════════════════

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));

const dryRun = process.argv.includes("--dry-run");
const force  = process.argv.includes("--force");

// ── Init Firebase Admin ───────────────────────────────────────────────────────
const serviceAccount = JSON.parse(
  readFileSync(resolve(__dir, "service-account.json"), "utf8"),
);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// ── Cargar catálogo ───────────────────────────────────────────────────────────
const catalogo: Record<string, unknown>[] = JSON.parse(
  readFileSync(resolve(__dir, "..", "catalogo-ejercicios.json"), "utf8"),
);

// ── Upload en batches de 400 ──────────────────────────────────────────────────
const BATCH_SIZE = 400;

async function run() {
  console.log(`\nSeed ejercicios — ${catalogo.length} docs — modo: ${dryRun ? "DRY RUN" : force ? "FORCE" : "SAFE"}\n`);

  // En modo SAFE chequeamos cuántos ya existen (una lectura rápida de IDs)
  const existentes = new Set<string>();
  if (!force && !dryRun) {
    const snap = await db.collection("ejercicios").select().get();
    snap.forEach((d) => existentes.add(d.id));
    if (existentes.size > 0) {
      console.log(`  Ya existen ${existentes.size} docs. Se saltean (usá --force para sobreescribir).\n`);
    }
  }

  let escritos = 0;
  let saltados = 0;

  for (let i = 0; i < catalogo.length; i += BATCH_SIZE) {
    const chunk = catalogo.slice(i, i + BATCH_SIZE);

    if (dryRun) {
      escritos += chunk.length;
      continue;
    }

    const batch = db.batch();
    for (const ej of chunk) {
      const id = ej.idEjercicio as string;
      if (!force && existentes.has(id)) { saltados++; continue; }

      // Limpiar campo interno del script (no va a Firestore)
      const { traduccion: _t, ...data } = ej as Record<string, unknown> & { traduccion: unknown };
      void _t;

      batch.set(db.collection("ejercicios").doc(id), {
        ...data,
        vecesUsado: 0,
        origen: "import",
      });
      escritos++;
    }
    await batch.commit();
    process.stdout.write(`  Batch ${Math.floor(i / BATCH_SIZE) + 1}: +${Math.min(BATCH_SIZE, chunk.length - saltados)} docs\r`);
  }

  console.log(`\n  ✅  ${dryRun ? "[dry]" : ""} ${escritos} escritos, ${saltados} saltados.\n`);
  process.exit(0);
}

run().catch((e) => { console.error(e); process.exit(1); });
