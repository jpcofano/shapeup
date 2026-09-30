// ════════════════════════════════════════════════════════════════════════════
//  scripts/inventario-sdk.ts — qué nos da el reloj, de verdad (P92b).
//
//  SOLO LEE. Recorre /ingesta-sdk/{uid}/registros, parsea cada `crudo` (el JSON
//  tal cual vino del Samsung Health Data SDK) y, por `dataType`, inventaría
//  todas las claves —anidadas con `a.b.c`, dentro de arrays con `x[].y`— con
//  en cuántos documentos aparecen, qué tipos toman y un valor de ejemplo real.
//
//  Después marca las que `lib/adaptadorSdk.ts` NO lee (lo que el reloj manda y
//  estamos tirando), busca todo lo que tenga pinta de zona, esfuerzo o
//  recuperación, y mide cuánto pesa cada `dataType`.
//
//  No decide nada. Corre sobre corrida.ts en simulación y no tiene --aplicar:
//  no escribe en Firestore. Deja el informe completo en docs/auditorias/.
//
//  Uso (desde la raíz):
//    npm run inventario:sdk
//    npm run inventario:sdk -- --sesion=2026-09-27T19:30   # + el crudo entero de esa sesión
// ════════════════════════════════════════════════════════════════════════════

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { correr } from "./lib/corrida";

const __dir = dirname(fileURLToPath(import.meta.url));
const SUFIJO_PARTE = /__p\d+$/;
const argSesion = process.argv.find((a) => a.startsWith("--sesion="))?.split("=")[1];

/**
 * Lo que `lib/adaptadorSdk.ts` lee DE VERDAD (relevado leyendo el código, no la
 * interfaz declarada). Si el adaptador cambia, esto se actualiza a mano.
 */
const LEE_EL_ADAPTADOR: Record<string, string[]> = {
  exercise: [
    "uid", "appId", "startTime.epochMs", "endTime.epochMs", "startLocalDateTime",
    "fields.sessions[].startTime.epochMs", "fields.sessions[].endTime.epochMs",
    "fields.sessions[].duration.ms", "fields.sessions[].customTitle",
    "fields.sessions[].meanHeartRate", "fields.sessions[].maxHeartRate", "fields.sessions[].minHeartRate",
    "fields.sessions[].calories", "fields.sessions[].distance", "fields.sessions[].exerciseType",
    "fields.sessions[].autoDetected", "fields.sessions[].logSize",
    "fields.sessions[].log[].heartRate", "fields.sessions[].log[].timestamp.epochMs",
  ],
  body_composition: [
    "uid", "appId", "startTime.epochMs", "startLocalDateTime",
    "fields.weight", "fields.body_fat", "fields.muscle_mass", "fields.body_fat_mass",
    "fields.total_body_water", "fields.bmi",
  ],
};

const PALABRAS = ["zone", "intensity", "effort", "load", "recovery", "vo2", "training",
  "cadence", "lap", "phase", "segment", "split", "mets", "rpe"];

interface InfoClave { docs: Set<string>; tipos: Set<string>; ejemplo?: string; ejemploVacio?: boolean; noVacio: number }

function tipoDe(v: unknown): string {
  if (v === null) return "null";
  if (Array.isArray(v)) return "array";
  return typeof v;
}

function ejemploDe(v: unknown): string {
  const s = typeof v === "string" ? JSON.stringify(v) : JSON.stringify(v);
  return (s ?? String(v)).length > 70 ? (s ?? "").slice(0, 67) + "…" : (s ?? String(v));
}

function vacio(v: unknown): boolean {
  return v === null || v === undefined || v === "" || (Array.isArray(v) && v.length === 0)
    || (typeof v === "object" && v !== null && !Array.isArray(v) && Object.keys(v).length === 0);
}

/** Recorre el JSON y anota cada ruta hoja o contenedor. */
function recorrer(v: unknown, ruta: string, docId: string, mapa: Map<string, InfoClave>): void {
  if (ruta) {
    const info = mapa.get(ruta) ?? { docs: new Set<string>(), tipos: new Set<string>(), noVacio: 0 };
    info.docs.add(docId);
    info.tipos.add(tipoDe(v));
    const esHoja = v === null || typeof v !== "object";
    if (!vacio(v)) {
      info.noVacio++;
      // Un ejemplo no vacío le gana a uno vacío: el dato manda.
      if ((info.ejemplo === undefined || info.ejemploVacio) && (esHoja || Array.isArray(v))) {
        info.ejemplo = Array.isArray(v) ? `[${v.length} elementos]` : ejemploDe(v);
        info.ejemploVacio = false;
      }
    } else if (info.ejemplo === undefined && esHoja) {
      info.ejemplo = ejemploDe(v);
      info.ejemploVacio = true;
    }
    mapa.set(ruta, info);
  }
  if (Array.isArray(v)) {
    for (const el of v) recorrer(el, `${ruta}[]`, docId, mapa);
  } else if (v && typeof v === "object") {
    for (const [k, hijo] of Object.entries(v)) recorrer(hijo, ruta ? `${ruta}.${k}` : k, docId, mapa);
  }
}

/** ¿La ruta es un contenedor de una ruta que el adaptador lee? (p. ej. "fields.sessions[]") */
function esContenedorLeido(ruta: string, leidas: string[]): boolean {
  return leidas.some((l) => l.startsWith(ruta + ".") || l.startsWith(ruta + "["));
}

const serviceAccount = JSON.parse(readFileSync(resolve(__dir, "service-account.json"), "utf8"));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

correr("inventario-sdk", async () => {
  const uids = await db.collection("ingesta-sdk").listDocuments();
  if (uids.length === 0) { console.log("  No hay nada en /ingesta-sdk."); return; }
  const uid = uids[0].id;
  const snap = await db.collection(`ingesta-sdk/${uid}/registros`).get();

  // ── Rearmar partes (espejo de data/ingestaSdk.ts) y medir el peso ─────────
  const peso = new Map<string, { docs: number; bytes: number; registros: number }>();
  const enteros: { id: string; d: Record<string, unknown> }[] = [];
  const partes = new Map<string, { id: string; d: Record<string, unknown> }[]>();
  for (const doc of snap.docs) {
    const d = doc.data();
    const tipo = String(d.dataType ?? "?");
    const p = peso.get(tipo) ?? { docs: 0, bytes: 0, registros: 0 };
    p.docs++;
    p.bytes += Buffer.byteLength(String(d.crudo ?? ""), "utf8");
    peso.set(tipo, p);
    if (d.parte != null) {
      const base = doc.id.replace(SUFIJO_PARTE, "");
      partes.set(base, [...(partes.get(base) ?? []), { id: doc.id, d }]);
    } else enteros.push({ id: doc.id, d });
  }

  const registros: { id: string; dataType: string; crudo: unknown }[] = [];
  let ilegibles = 0;
  for (const { id, d } of enteros) {
    try { registros.push({ id, dataType: String(d.dataType), crudo: JSON.parse(String(d.crudo)) }); }
    catch { ilegibles++; }
  }
  for (const [base, trozos] of partes) {
    const o = [...trozos].sort((a, b) => Number(a.d.parte) - Number(b.d.parte));
    try {
      registros.push({ id: base, dataType: String(o[0].d.dataType), crudo: JSON.parse(o.map((t) => String(t.d.crudo)).join("")) });
    } catch { ilegibles++; }
  }
  for (const r of registros) peso.get(r.dataType)!.registros++;

  // ── Inventario por dataType ────────────────────────────────────────────────
  const porTipo = new Map<string, Map<string, InfoClave>>();
  for (const r of registros) {
    const mapa = porTipo.get(r.dataType) ?? new Map<string, InfoClave>();
    recorrer(r.crudo, "", r.id, mapa);
    porTipo.set(r.dataType, mapa);
  }

  const md: string[] = [];
  md.push(`# Inventario del SDK (P92b) — ${new Date().toISOString().slice(0, 16)}`, "");
  md.push(`Documentos en /ingesta-sdk/${uid.slice(0, 8)}…/registros: **${snap.size}** · registros lógicos: **${registros.length}** · crudos que no parsean: **${ilegibles}**`, "");

  md.push("## Peso por dataType", "", "| dataType | documentos | registros | peso del crudo |", "|---|---|---|---|");
  let totalBytes = 0;
  for (const [t, p] of [...peso].sort()) {
    totalBytes += p.bytes;
    md.push(`| ${t} | ${p.docs} | ${p.registros} | ${(p.bytes / 1024).toFixed(1)} KB |`);
  }
  md.push(`| **total** | **${snap.size}** | **${registros.length}** | **${(totalBytes / 1024).toFixed(1)} KB** |`, "");

  const noMapeadas: { tipo: string; ruta: string; info: InfoClave; total: number }[] = [];
  const conPalabra: { tipo: string; ruta: string; info: InfoClave; total: number; palabra: string }[] = [];

  for (const [tipo, mapa] of [...porTipo].sort()) {
    const total = peso.get(tipo)!.registros;
    const leidas = LEE_EL_ADAPTADOR[tipo] ?? [];
    md.push(`## ${tipo} — todas las claves (${mapa.size})`, "",
      "| clave | en docs | tipo(s) | no vacía | ¿la lee el adaptador? | ejemplo |", "|---|---|---|---|---|---|");
    for (const [ruta, info] of [...mapa].sort((a, b) => a[0].localeCompare(b[0]))) {
      const lee = leidas.includes(ruta) ? "sí" : esContenedorLeido(ruta, leidas) ? "(contenedor)" : "**no**";
      md.push(`| \`${ruta}\` | ${info.docs.size}/${total} | ${[...info.tipos].join(", ")} | ${info.noVacio} | ${lee} | \`${(info.ejemplo ?? "—").replace(/\|/g, "\\|")}\` |`);
      if (lee === "**no**") noMapeadas.push({ tipo, ruta, info, total });
      const hoja = ruta.toLowerCase();
      const palabra = PALABRAS.find((w) => hoja.includes(w));
      if (palabra) conPalabra.push({ tipo, ruta, info, total, palabra });
    }
    md.push("");
  }

  md.push(`## Lo que el adaptador NO lee (${noMapeadas.length})`, "",
    "| dataType | clave | en docs | tipo(s) | no vacía | ejemplo |", "|---|---|---|---|---|---|");
  for (const n of noMapeadas) {
    md.push(`| ${n.tipo} | \`${n.ruta}\` | ${n.info.docs.size}/${n.total} | ${[...n.info.tipos].join(", ")} | ${n.info.noVacio} | \`${(n.info.ejemplo ?? "—").replace(/\|/g, "\\|")}\` |`);
  }
  md.push("");

  md.push(`## Con pinta de zona, esfuerzo o recuperación (${conPalabra.length})`, "",
    `Búsqueda por subcadena, sin mayúsculas, de: ${PALABRAS.join(", ")}.`, "",
    "| dataType | clave | palabra | en docs | no vacía | ejemplo |", "|---|---|---|---|---|---|");
  for (const c of conPalabra) {
    md.push(`| ${c.tipo} | \`${c.ruta}\` | ${c.palabra} | ${c.info.docs.size}/${c.total} | ${c.info.noVacio} | \`${(c.info.ejemplo ?? "—").replace(/\|/g, "\\|")}\` |`);
  }
  if (conPalabra.length === 0) md.push("| — | ninguna | — | — | — | — |");
  md.push("");

  // ── Una sesión entera, si se pidió ─────────────────────────────────────────
  if (argSesion) {
    const objetivo = Date.parse(argSesion.length <= 16 ? `${argSesion}:00-03:00` : argSesion);
    const ejercicios = registros.filter((r) => r.dataType === "exercise");
    const conInicio = ejercicios.map((r) => {
      const c = r.crudo as { startTime?: { epochMs?: number } };
      return { r, ms: c?.startTime?.epochMs ?? NaN };
    }).filter((x) => Number.isFinite(x.ms)).sort((a, b) => Math.abs(a.ms - objetivo) - Math.abs(b.ms - objetivo));
    const elegida = conInicio[0];
    md.push(`## La sesión pedida (${argSesion})`, "");
    if (!elegida) md.push("No hay sesiones de ejercicio.");
    else {
      md.push(`La más cercana arranca a ${((elegida.ms - objetivo) / 60_000).toFixed(1)} min de lo pedido. Registro \`${elegida.r.id}\`. ` +
        "Todo va entero salvo la curva (`log`), de la que quedan los 3 primeros puntos y el total.", "", "```json");
      const copia = JSON.parse(JSON.stringify(elegida.r.crudo)) as { fields?: { sessions?: { log?: unknown[] }[] } };
      for (const s of copia.fields?.sessions ?? []) {
        if (Array.isArray(s.log) && s.log.length > 3) (s as Record<string, unknown>).log = [...s.log.slice(0, 3), `… ${s.log.length - 3} puntos más`];
      }
      md.push(JSON.stringify(copia, null, 2), "```");
    }
  }

  const dir = resolve(__dir, "..", "docs", "auditorias");
  mkdirSync(dir, { recursive: true });
  const ruta = resolve(dir, `inventario-sdk-${new Date().toISOString().slice(0, 10)}.md`);
  writeFileSync(ruta, md.join("\n"));
  console.log(`  ${registros.length} registros · ${noMapeadas.length} claves que el adaptador no lee · ${conPalabra.length} con pinta de zona/esfuerzo`);
  console.log(`  informe completo (archivo local, no Firestore): ${ruta}`);
});
