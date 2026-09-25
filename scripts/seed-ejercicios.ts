// ════════════════════════════════════════════════════════════════════════════
//  scripts/seed-ejercicios.ts — Sube catalogo-ejercicios.json a Firestore.
//
//  Uso: npx tsx scripts/seed-ejercicios.ts [--aplicar] [--force]
//  Simula por defecto (P87); --aplicar escribe.
//         --force    (sobreescribe documentos existentes)
// ════════════════════════════════════════════════════════════════════════════

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { correr } from "./lib/corrida";

const __dir = dirname(fileURLToPath(import.meta.url));

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

// P87: corre con `scripts/lib/corrida.ts`. Antes contaba cada documento como
// escrito al meterlo en el batch, antes del commit, y el progreso por batch
// restaba los salteados acumulados en vez de los del batch.
correr("seed-ejercicios", async (c) => {
  console.log(`  ${catalogo.length} docs en el catálogo · ${force ? "FORCE (pisa los que existen)" : "SAFE (solo crea los que faltan)"}\n`);

  // Se leen siempre, también en simulación, para que la simulación diga la verdad.
  // Con --force hace falta el contenido para el respaldo; si no, alcanzan los ids.
  const snap = force
    ? await db.collection("ejercicios").get()
    : await db.collection("ejercicios").select().get();
  const existentes = new Map(snap.docs.map((d) => [d.id, force ? d.data() : null]));

  const idsCatalogo = catalogo.map((ej) => ej.idEjercicio as string);
  const aPisar = idsCatalogo.filter((id) => force && existentes.has(id));
  if (aPisar.length > 0) {
    if (!c.abrirRespaldo(aPisar.map((id) => ({ id, antes: existentes.get(id) })))) return;
  } else {
    c.sinRespaldo("solo crea ejercicios que no existen");
  }

  for (let i = 0; i < catalogo.length; i += BATCH_SIZE) {
    const chunk = catalogo.slice(i, i + BATCH_SIZE);
    const numero = Math.floor(i / BATCH_SIZE) + 1;
    const aEscribir = chunk.filter((ej) => force || !existentes.has(ej.idEjercicio as string));
    const salteados = chunk.length - aEscribir.length;
    if (salteados > 0) c.omitir(`batch ${numero}`, `${salteados} ya existen`, salteados);
    if (aEscribir.length === 0) continue;

    await c.escribir(`batch ${numero}: ${aEscribir.length} docs`, () => {
      const batch = db.batch();
      for (const ej of aEscribir) {
        // Limpiar campo interno del script (no va a Firestore)
        const { traduccion: _t, ...data } = ej as Record<string, unknown> & { traduccion: unknown };
        void _t;
        batch.set(db.collection("ejercicios").doc(ej.idEjercicio as string), {
          ...data,
          vecesUsado: 0,
          origen: "import",
        });
      }
      return batch.commit();
    }, aEscribir.length);
  }
});
