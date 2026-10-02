// ════════════════════════════════════════════════════════════════════════════
//  scripts/corregir-zonas-perfiles.ts — las zonas de los perfiles, como las
//  cuenta Samsung (P97, ADR #045).
//
//  Recalcula las zonas de los cuatro perfiles con `zonasDesdeFcMax`, a partir de
//  su FC máxima actual, y declara el origen de la FC máxima donde falta
//  (juanpablo: `samsung`; los demás: `edad-provisoria`). La lógica vive en
//  `src/lib/correccionZonas.ts` (con tests). Idempotente: una segunda corrida
//  no cambia nada.
//
//  Escribe con `update()` y rutas de campo (`juanpablo.zonasFC`), así que solo
//  toca esos tres campos de cada perfil; lo demás queda como está. Saltea
//  `ultimaActualizacion` y cualquier otra clave que no sea un miembro.
//
//  **Correrlo ANTES de deployar la versión 8 del enriquecimiento**: la próxima
//  sincronización rehace las sesiones con las zonas del perfil y las guarda en
//  cada una (`zonasUsadas`). Si se rehacen con las zonas viejas, quedan con
//  esas.
//
//  Uso (desde la RAÍZ del repo):
//    npm run corregir:zonas                 # simulación (default)
//    npm run corregir:zonas -- --aplicar    # escribe
// ════════════════════════════════════════════════════════════════════════════

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { planificarCorreccionZonas, zonasEnLinea } from "../src/lib/correccionZonas";
import { correr } from "./lib/corrida";

const __dir = dirname(fileURLToPath(import.meta.url));

const serviceAccount = JSON.parse(readFileSync(resolve(__dir, "service-account.json"), "utf8"));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

correr("corregir-zonas", async (c) => {
  const ref = db.collection("config").doc("perfiles");
  const snap = await ref.get();
  if (!snap.exists) {
    c.omitir("config/perfiles", "no existe");
    return;
  }
  const documento = snap.data() as Record<string, unknown>;
  const plan = planificarCorreccionZonas(documento, Date.now());

  for (const k of plan.correcciones) {
    console.log(`  ${k.miembro} · FC máx ${k.fcMax}`);
    console.log(`    antes:   ${zonasEnLinea(k.zonasAntes)}   origen: ${k.origenAntes ?? "(sin declarar)"}`);
    console.log(`    después: ${zonasEnLinea(k.zonasDespues)}   origen: ${k.origenDespues}`);
  }
  for (const o of plan.omitidos) console.log(`  · ${o.clave}: se saltea (${o.motivo})`);
  console.log("");

  const aEscribir = plan.correcciones.filter((k) => Object.keys(k.cambio).length > 0);
  for (const k of plan.correcciones) {
    if (Object.keys(k.cambio).length === 0) c.omitir(k.miembro, "ya está bien");
  }
  if (aEscribir.length === 0) return;

  // Respaldo de lo que se pisa, ANTES de tocar Firestore (lo garantiza corrida.ts).
  const respaldo = Object.fromEntries(aEscribir.map((k) => {
    const p = documento[k.miembro] as Record<string, unknown>;
    return [k.miembro, { zonasFC: p.zonasFC ?? null, fcMaxOrigen: p.fcMaxOrigen ?? null, fcMaxDesdeMs: p.fcMaxDesdeMs ?? null }];
  }));
  if (!c.abrirRespaldo(respaldo)) return;

  for (const k of aEscribir) {
    const campos = Object.fromEntries(
      Object.entries(k.cambio).map(([campo, valor]) => [`${k.miembro}.${campo}`, valor]),
    );
    await c.escribir(`${k.miembro}  ${Object.keys(k.cambio).join(", ")}`, () => ref.update(campos));
  }
});
