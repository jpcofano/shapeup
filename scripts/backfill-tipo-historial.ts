// ════════════════════════════════════════════════════════════════════════════
//  scripts/backfill-tipo-historial.ts — pone `tipo: "rutina"` en los documentos
//  de /historial que no lo tengan (P75b).
//
//  Por qué hace falta: las consultas nuevas filtran por `tipo`
//  (`where("tipo", "in", ["rutina", "libre"])`), y en Firestore un documento
//  SIN el campo no entra en ningún filtro sobre ese campo. Sin este backfill,
//  las sesiones viejas quedarían invisibles en Home, Entrenar y la progresión.
//
//  "rutina" es el default que ya asume `tipoDe()` para los documentos previos
//  a P74 — esto solo lo hace explícito en Firestore.
//
//  Uso: npx tsx scripts/backfill-tipo-historial.ts            (simulación)
//       npx tsx scripts/backfill-tipo-historial.ts --aplicar  (escribe)
// ════════════════════════════════════════════════════════════════════════════

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const aplicar = process.argv.includes("--aplicar");
const serviceAccount = JSON.parse(readFileSync(resolve(__dir, "service-account.json"), "utf8"));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

/** Límite de Firestore: 500 operaciones por batch. Con margen. */
const MAX_OPS_POR_BATCH = 400;

async function run() {
  console.log(`\nBackfill de tipo en /historial — modo: ${aplicar ? "APLICAR" : "SIMULACIÓN"}\n`);

  const snap = await db.collection("historial").get();
  const sinTipo = snap.docs.filter((d) => d.data().tipo == null);

  console.log(`  /historial: ${snap.size} documentos · ${sinTipo.length} sin 'tipo'`);

  if (sinTipo.length === 0) {
    console.log("\n✅ Nada que hacer: todos tienen 'tipo'.\n");
    process.exit(0);
  }

  for (const d of sinTipo) {
    const data = d.data() as { miembro?: string; fechaRealizada?: string; nombreRutina?: string };
    console.log(`  ${d.id.padEnd(28)} ${data.fechaRealizada ?? "?"} · ${data.miembro ?? "?"} · ${data.nombreRutina ?? "?"} → tipo: "rutina"`);
  }

  if (!aplicar) {
    console.log(`\n[simulación] ${sinTipo.length} documento(s) quedarían con tipo "rutina". Usá --aplicar.\n`);
    process.exit(0);
  }

  // update() y no set(): toca solo ese campo, no pisa el resto del documento.
  let batch = db.batch();
  let ops = 0;
  for (const d of sinTipo) {
    batch.update(d.ref, { tipo: "rutina" });
    ops++;
    if (ops >= MAX_OPS_POR_BATCH) { await batch.commit(); batch = db.batch(); ops = 0; }
  }
  if (ops > 0) await batch.commit();

  console.log(`\n✅ ${sinTipo.length} documento(s) actualizados.\n`);
  process.exit(0);
}
run().catch((e) => { console.error(e); process.exit(1); });
