// ════════════════════════════════════════════════════════════════════════════
//  scripts/seed-perfiles.ts — Escribe /config/perfiles (PerfilesConfig de models.ts).
//
//  Por cada miembro: color, equipo disponible, objetivos, lugar habitual, FC máxima
//  teórica y zonas de FC. Las zonas se calculan con FCmáx ≈ 220 − edad (estimación
//  poblacional; para precisión, reemplazar por un test de campo o el dato del reloj).
//
//  Zonas (% de FCmáx): Z1 50–60 · Z2 60–70 · Z3 70–80 · Z4 80–90 · Z5 90–100.
//
//  Uso: npx tsx scripts/seed-perfiles.ts   ·   Flags: --dry-run | --force
//  (Sin --force no pisa si /config/perfiles ya existe.)
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

// Calcula FCmáx y las 5 zonas a partir de la edad.
function zonasDeEdad(edad: number) {
  const fcMax = 220 - edad;
  const p = (pct: number) => Math.round(fcMax * pct);
  return {
    fcMaxTeorica: fcMax,
    zonasFC: {
      Z1: { min: p(0.50), max: p(0.60) },
      Z2: { min: p(0.60), max: p(0.70) },
      Z3: { min: p(0.70), max: p(0.80) },
      Z4: { min: p(0.80), max: p(0.90) },
      Z5: { min: p(0.90), max: p(1.0) },
    },
  };
}

type MiembroPerfil = {
  edad: number; color: string; lugar: string; objetivos: string[]; equipo: string[];
};

// Colores: placeholders distintos por miembro (Claude Design los puede afinar).
const MIEMBROS: Record<string, MiembroPerfil> = {
  juanpablo: {
    edad: 51, color: "#60a5fa", lugar: "Casa", objetivos: ["Recomposición"],
    equipo: ["Mancuernas", "Banda elástica", "Barra de dominadas", "Kettlebell", "Banco", "Peso corporal", "VR"],
  },
  maria: {
    edad: 50, color: "#f472b6", lugar: "Casa", objetivos: ["Recomposición", "Pérdida de grasa"],
    equipo: ["Mancuernas", "Banda elástica", "Banco", "Peso corporal", "VR"],
  },
  sofia: {
    edad: 17, color: "#a78bfa", lugar: "Casa", objetivos: ["General / salud", "Movilidad"],
    equipo: ["Mancuernas", "Banda elástica", "Peso corporal", "VR"],
  },
  federico: {
    edad: 16, color: "#34d399", lugar: "Casa", objetivos: ["General / salud"],
    equipo: ["Mancuernas", "Banda elástica", "Barra de dominadas", "Banco", "Peso corporal", "VR"],
  },
};

function perfilDoc(m: MiembroPerfil) {
  const { fcMaxTeorica, zonasFC } = zonasDeEdad(m.edad);
  return {
    color: m.color,
    equipoDisponible: m.equipo,
    objetivos: m.objetivos,
    lugarHabitual: m.lugar,
    fcMaxTeorica,
    zonasFC,
  };
}

async function run() {
  console.log(`\nSeed PERFILES — modo: ${dryRun ? "DRY RUN" : force ? "FORCE" : "SAFE"}\n`);
  const ref = db.collection("config").doc("perfiles");

  if (!force && !dryRun) {
    const snap = await ref.get();
    if (snap.exists) { console.log("  SKIP  config/perfiles ya existe (usá --force para pisarlo).\n"); process.exit(0); }
  }

  const perfiles: Record<string, unknown> = {};
  for (const [id, m] of Object.entries(MIEMBROS)) {
    const doc = perfilDoc(m);
    perfiles[id] = doc;
    const z = doc.zonasFC;
    console.log(`  ${id} (edad ${m.edad}): FCmáx ${doc.fcMaxTeorica} · Z2 ${z.Z2.min}-${z.Z2.max} · Z3 ${z.Z3.min}-${z.Z3.max} · Z4 ${z.Z4.min}-${z.Z4.max}`);
  }

  if (dryRun) { console.log("\n[dry] no se escribió nada.\n"); process.exit(0); }

  await ref.set({ ...perfiles, ultimaActualizacion: FieldValue.serverTimestamp() }, { merge: false });
  console.log("\n✅ config/perfiles escrito.\n");
  process.exit(0);
}
run().catch((e) => { console.error(e); process.exit(1); });
