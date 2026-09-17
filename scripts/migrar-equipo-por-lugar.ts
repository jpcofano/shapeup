// ════════════════════════════════════════════════════════════════════════════
//  scripts/migrar-equipo-por-lugar.ts — /config/perfiles: equipoDisponible
//  (lista plana) → equipoPorLugar (P72).
//
//  El equipo de cada miembro pasa a su `lugarHabitual`; si no tiene uno, va a
//  Casa y se avisa. La lógica vive en src/lib/perfil.ts (módulo puro, testeado):
//  acá solo están la lectura, el reporte y la escritura.
//
//  Escribe con update() POR CLAVE DE MIEMBRO — nunca set() del documento entero,
//  que borraría el perfil de los otros tres.
//
//  Uso: npx tsx scripts/migrar-equipo-por-lugar.ts            (simulación)
//       npx tsx scripts/migrar-equipo-por-lugar.ts --aplicar  (escribe)
// ════════════════════════════════════════════════════════════════════════════

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { migrarEquipoPorLugar, LUGAR_POR_DEFECTO } from "../src/lib/perfil";
import type { PerfilMiembro } from "../src/types/models";

const __dir = dirname(fileURLToPath(import.meta.url));
const aplicar = process.argv.includes("--aplicar");
const serviceAccount = JSON.parse(readFileSync(resolve(__dir, "service-account.json"), "utf8"));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

/** Claves del documento que no son perfiles de miembro. */
const NO_MIEMBRO = new Set(["ultimaActualizacion"]);

function lista(equipo: string[] | undefined): string {
  if (equipo === undefined) return "—";
  return equipo.length === 0 ? "(vacío)" : equipo.join(", ");
}

function porLugar(mapa: Partial<Record<string, string[]>> | undefined): string {
  if (!mapa) return "—";
  const entradas = Object.entries(mapa);
  if (entradas.length === 0) return "{} (sin equipo declarado)";
  return entradas.map(([l, e]) => `${l}: ${lista(e)}`).join(" · ");
}

async function run() {
  console.log(`\nMigración equipo por lugar — modo: ${aplicar ? "APLICAR" : "SIMULACIÓN"}\n`);
  const ref  = db.collection("config").doc("perfiles");
  const snap = await ref.get();
  if (!snap.exists) { console.log("  config/perfiles no existe. Nada que migrar.\n"); process.exit(0); }

  const data = snap.data() as Record<string, unknown>;
  const cambios: Record<string, unknown> = {};
  let sinCambios = 0;

  for (const [id, valor] of Object.entries(data)) {
    if (NO_MIEMBRO.has(id) || typeof valor !== "object" || valor === null) continue;
    const perfil  = valor as PerfilMiembro;
    const migrado = migrarEquipoPorLugar(perfil);

    if (migrado === perfil) {
      console.log(`  ${id}: ya migrado — ${porLugar(perfil.equipoPorLugar)}`);
      sinCambios++;
      continue;
    }

    if (!perfil.lugarHabitual) {
      console.log(`  ⚠ ${id}: sin lugarHabitual — su equipo va a ${LUGAR_POR_DEFECTO}.`);
    }
    console.log(`  ${id}:`);
    console.log(`      antes   equipoDisponible: ${lista(perfil.equipoDisponible)}`);
    console.log(`      después equipoPorLugar:   ${porLugar(migrado.equipoPorLugar)}`);

    // update() con rutas punteadas: toca solo estos dos campos de este miembro.
    cambios[`${id}.equipoPorLugar`]   = migrado.equipoPorLugar;
    cambios[`${id}.equipoDisponible`] = FieldValue.delete();
  }

  const aMigrar = Object.keys(cambios).length / 2;
  console.log(`\n  ${aMigrar} miembro(s) a migrar · ${sinCambios} ya migrado(s).`);

  if (aMigrar === 0) { console.log("\n✅ Nada que hacer.\n"); process.exit(0); }
  if (!aplicar) { console.log("\n[simulación] no se escribió nada. Usá --aplicar.\n"); process.exit(0); }

  await ref.update(cambios);
  console.log("\n✅ config/perfiles migrado.\n");
  process.exit(0);
}
run().catch((e) => { console.error(e); process.exit(1); });
