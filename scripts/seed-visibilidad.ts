// ════════════════════════════════════════════════════════════════════════════
//  scripts/seed-visibilidad.ts — Escribe /config/visibilidad.
//
//  Define qué ve cada miembro (VisibilidadConfig de models.ts):
//   · El OWNER (juanpablo) ve TODO por las reglas de Firestore → no se lista acá.
//   · Cada otro miembro ve SOLO su programa y las rutinas que ese programa usa.
//
//  Reparto por defecto (editá a gusto):
//   · maria    → PRG-0012 (+ sus rutinas de fuerza y las de VR que referencia)
//   · federico → PRG-0010 (rugby juvenil)
//   · sofia    → PRG-0011 (fútbol juvenil)
//
//  Si querés que un chico pueda elegir entre varias plantillas (express, movilidad,
//  deload), agregá esos PRG/RUT a sus arrays.
//
//  Uso: npx tsx scripts/seed-visibilidad.ts   ·   Flags: --dry-run | --force
//  (Este config es autoritativo: con --force pisa lo que haya. Sin --force, si ya
//   existe el doc, no lo toca.)
// ════════════════════════════════════════════════════════════════════════════

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const dryRun = process.argv.includes("--dry-run");
const force  = process.argv.includes("--force");
const serviceAccount = JSON.parse(readFileSync(resolve(__dir, "service-account.json"), "utf8"));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// VisibilidadConfig = Partial<Record<MiembroId, { programas: string[]; rutinas: string[] }>>
const visibilidad: Record<string, { programas: string[]; rutinas: string[] }> = {
  maria: {
    programas: ["PRG-0012"],
    rutinas: ["RUT-0021", "RUT-0022", "RUT-0004", "RUT-0008"], // glúteos A/B + VR quema + VR estructurado
  },
  federico: {
    programas: ["PRG-0010"],
    rutinas: ["RUT-0017", "RUT-0018"],                          // prevención rugby A/B
  },
  sofia: {
    programas: ["PRG-0011"],
    rutinas: ["RUT-0019", "RUT-0020"],                          // prevención fútbol A/B
  },
  // juanpablo (owner): ve todo por reglas; no se lista.
};

async function run() {
  console.log(`\nSeed VISIBILIDAD — modo: ${dryRun ? "DRY RUN" : force ? "FORCE" : "SAFE"}\n`);
  const ref = db.collection("config").doc("visibilidad");

  if (!force && !dryRun) {
    const snap = await ref.get();
    if (snap.exists) {
      console.log("  SKIP  config/visibilidad ya existe (usá --force para pisarlo).\n");
      process.exit(0);
    }
  }

  for (const [miembro, v] of Object.entries(visibilidad)) {
    console.log(`  ${miembro}: programas=[${v.programas.join(", ")}] rutinas=[${v.rutinas.join(", ")}]`);
  }

  if (dryRun) { console.log("\n[dry] no se escribió nada.\n"); process.exit(0); }

  await ref.set({ ...visibilidad, ultimaActualizacion: FieldValue.serverTimestamp() }, { merge: false });
  console.log("\n✅ config/visibilidad escrito. (El owner ve todo por reglas.)\n");
  process.exit(0);
}
run().catch((e) => { console.error(e); process.exit(1); });
