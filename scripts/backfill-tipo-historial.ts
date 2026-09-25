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
import { correr } from "./lib/corrida";

const __dir = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(resolve(__dir, "service-account.json"), "utf8"));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

/** Límite de Firestore: 500 operaciones por batch. Con margen. */
const MAX_OPS_POR_BATCH = 400;

// P87: corre con `scripts/lib/corrida.ts`. Antes escribía las tandas sin
// mostrar nada: si fallaba la segunda, no quedaba rastro de que la primera ya
// había entrado.
correr("backfill-tipo-historial", async (c) => {
  const snap = await db.collection("historial").get();
  const sinTipo = snap.docs.filter((d) => d.data().tipo == null);

  console.log(`  /historial: ${snap.size} documentos · ${sinTipo.length} sin 'tipo'`);
  if (sinTipo.length === 0) return;

  for (const d of sinTipo) {
    const data = d.data() as { miembro?: string; fechaRealizada?: string; nombreRutina?: string };
    console.log(`  ${d.id.padEnd(28)} ${data.fechaRealizada ?? "?"} · ${data.miembro ?? "?"} · ${data.nombreRutina ?? "?"} → tipo: "rutina"`);
  }

  // Lo que se pisa es la ausencia del campo: el respaldo es la lista de ids,
  // que es lo que haría falta para sacarlo de nuevo.
  if (!c.abrirRespaldo(sinTipo.map((d) => ({ id: d.id, tipoAntes: null })))) return;

  // update() y no set(): toca solo ese campo, no pisa el resto del documento.
  for (let i = 0; i < sinTipo.length; i += MAX_OPS_POR_BATCH) {
    const tanda = sinTipo.slice(i, i + MAX_OPS_POR_BATCH);
    await c.escribir(`tanda ${Math.floor(i / MAX_OPS_POR_BATCH) + 1}: ${tanda.length} docs (${tanda[0].id} … ${tanda[tanda.length - 1].id})`, () => {
      const batch = db.batch();
      for (const d of tanda) batch.update(d.ref, { tipo: "rutina" });
      return batch.commit();
    }, tanda.length);
  }
});
