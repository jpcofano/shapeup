// ════════════════════════════════════════════════════════════════════════════
//  scripts/seed-juegos.ts — Siembra `juegosSinEjercicio` en /config/diccionarios (P81).
//
//  Los juegos de VR que se registran pero NO cuentan como ejercicio. La app
//  funciona sin esto —cae a los defaults de `lib/juegos.ts`—, pero mientras el
//  campo no exista no se puede editar la lista desde la pantalla.
//
//  **Escribe UN SOLO campo, con merge.** `seed-config.ts` también lo tiene, pero
//  correrlo reescribe `/config/familia` y `/config/metodologia` enteros, que no
//  es lo que se quiere para agregar una lista.
//
//  Uso: npm run seed:juegos   ·   Flags: --dry-run | --force
//  (Sin --force no pisa una lista que ya exista: podría estar editada a mano.)
// ════════════════════════════════════════════════════════════════════════════

// corrida: exento — pendiente (P87, se migra cuando se toque): informa cada escritura después de confirmarla, así que lo que hizo se reconstruye leyendo la salida.
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const dryRun = process.argv.includes("--dry-run");
const force  = process.argv.includes("--force");
const serviceAccount = JSON.parse(readFileSync(resolve(__dir, "service-account.json"), "utf8"));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

/** Los mismos tres que `JUEGOS_SIN_EJERCICIO_DEFAULT` de `src/lib/juegos.ts`. */
const JUEGOS = ["Behemoth", "Drums Rock", "Rock"];

async function run() {
  const ref = db.doc("config/diccionarios");
  const snap = await ref.get();

  if (!snap.exists) {
    console.error("✖ /config/diccionarios no existe. Corré antes: npm run seed:config");
    process.exit(1);
  }

  const actual = snap.get("juegosSinEjercicio") as unknown;
  if (Array.isArray(actual) && actual.length > 0 && !force) {
    console.log(`• Ya existe, no se toca: ${JSON.stringify(actual)}`);
    console.log("  (usá --force para pisarla)");
    return;
  }

  console.log(`${dryRun ? "[dry-run] " : ""}juegosSinEjercicio → ${JSON.stringify(JUEGOS)}`);
  if (dryRun) return;

  await ref.set({ juegosSinEjercicio: JUEGOS }, { merge: true });
  console.log("✔ Escrito. El resto del diccionario quedó intacto.");
}

run().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });
