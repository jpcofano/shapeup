// ════════════════════════════════════════════════════════════════════════════
//  scripts/migrar-horas.ts — recalcula `inicioMs`, `finMs` y `fecha` de lo que
//  ya se escribió con el parser viejo (P76a).
//
//  El parser trataba el `start_time` del CSV como hora local y le restaba el
//  `time_offset`. El string ya venía en UTC, así que todo quedó corrido por el
//  offset entero de cada fila (+3 h en UTC-0300, −2 h en UTC+0200, etc.).
//
//  Uso (desde la RAÍZ del repo):
//    npx tsx scripts/migrar-horas.ts <carpeta-con-los-CSV>            # simulación
//    npx tsx scripts/migrar-horas.ts <carpeta-con-los-CSV> --aplicar  # escribe
//
//  La carpeta es la del ZIP de Samsung Health ya descomprimido: de ahí sale la
//  verdad. No se recalcula nada "a ojo" sumando tres horas — se vuelve a parsear
//  la fila original, que es lo único que sabe qué offset tenía cada actividad.
//
//  ⚠ /metricas-salud NO se migra acá. Su id es `${miembro}-${tipo}-${fecha}`, o
//  sea que depende de la fecha: corregirla no es un update sino borrar y crear,
//  y además dos días pueden colapsar en uno y habría que decidir cómo se
//  recombinan los agregados. Eso se decide aparte.
// ════════════════════════════════════════════════════════════════════════════

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync, readdirSync } from "fs";
import { resolve, dirname, join } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const csvDir = args.find((a) => !a.startsWith("--"));
const aplicar = args.includes("--aplicar");

if (!csvDir) {
  console.error("Falta la carpeta con los CSV del export.\n  npx tsx scripts/migrar-horas.ts <carpeta> [--aplicar]");
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(resolve(__dir, "service-account.json"), "utf8"));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// ── Parseo de CSV, igual que el de la app ──────────────────────────────────
function splitCsvLine(line: string): string[] {
  const out: string[] = []; let cur = ""; let q = false;
  for (const ch of line) {
    if (ch === '"') q = !q;
    else if (ch === "," && !q) { out.push(cur); cur = ""; }
    else cur += ch;
  }
  out.push(cur); return out;
}
function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/);
  if (lines.length < 3) return [];
  const heads = lines[1].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  return lines.slice(2).filter((l) => l.trim()).map((line) => {
    const vals = splitCsvLine(line); const o: Record<string, string> = {};
    heads.forEach((h, i) => { o[h] = (vals[i] ?? "").trim().replace(/^"|"$/g, ""); });
    return o;
  });
}
function col(row: Record<string, string>, suf: string): string {
  if (row[suf] !== undefined) return row[suf];
  for (const k of Object.keys(row)) if (k === suf || k.endsWith(`.${suf}`)) return row[k];
  return "";
}

/** El datetime del CSV ya está en UTC (ver `epochToMs` en import/samsungHealth.ts). */
function msUtc(v: string): number | undefined {
  if (!v) return undefined;
  if (/^\d{4}-\d{2}-\d{2} /.test(v)) {
    const ms = v.slice(20, 23) || "000";
    const n = Date.parse(`${v.slice(0, 10)}T${v.slice(11, 19)}.${ms.padEnd(3, "0")}Z`);
    return isNaN(n) ? undefined : n;
  }
  const n = parseInt(v, 10);
  return isNaN(n) ? undefined : n;
}
function offMsDe(off: string): number {
  const m = off.match(/([+-])(\d{2}):?(\d{2})/);
  return m ? (m[1] === "+" ? 1 : -1) * (parseInt(m[2]) * 60 + parseInt(m[3])) * 60_000 : 0;
}
function fechaLocal(v: string, off: string): string {
  const ms = msUtc(v);
  if (ms == null) return "";
  return new Date(ms + offMsDe(off)).toISOString().slice(0, 10);
}

function cargar(patron: RegExp): Record<string, string>[] {
  const f = readdirSync(csvDir!).find((x) => patron.test(x));
  return f ? parseCsv(readFileSync(join(csvDir!, f), "utf8")) : [];
}

interface Cambio {
  coleccion: string;
  id: string;
  patch: Record<string, unknown>;
  antes: Record<string, unknown>;
}

async function main() {
  console.log(`\nMigración de horas (P76a) — modo: ${aplicar ? "ESCRITURA" : "SIMULACIÓN"}`);
  console.log(`  CSV: ${csvDir}\n`);

  const cambios: Cambio[] = [];
  const sinFila: Record<string, number> = {};

  // ── /cardio y /historial (externas): del CSV de ejercicio ────────────────
  const ejer = cargar(/exercise\.\d+\.csv$/);
  const porUuid = new Map(ejer.map((f) => [col(f, "datauuid"), f]));
  console.log(`  CSV de ejercicio: ${ejer.length} filas`);

  for (const [coleccion, prefijo, campoFecha] of [
    ["cardio",    "CAR-", "fecha"],
    ["historial", "EXT-", "fechaRealizada"],
  ] as const) {
    const snap = await db.collection(coleccion).get();
    for (const d of snap.docs) {
      if (!d.id.startsWith(prefijo)) continue;
      const fila = porUuid.get(d.id.slice(prefijo.length));
      if (!fila) { sinFila[coleccion] = (sinFila[coleccion] ?? 0) + 1; continue; }

      const off   = col(fila, "time_offset");
      const ini   = msUtc(col(fila, "start_time"));
      const fin   = msUtc(col(fila, "end_time"));
      const fecha = fechaLocal(col(fila, "start_time"), off);
      const x = d.data() as Record<string, unknown>;

      const patch: Record<string, unknown> = {};
      const antes: Record<string, unknown> = {};
      if (ini   != null && x.inicioMs !== ini)      { patch.inicioMs = ini;   antes.inicioMs = x.inicioMs; }
      if (fin   != null && x.finMs    !== fin)      { patch.finMs    = fin;   antes.finMs    = x.finMs; }
      if (fecha && x[campoFecha] !== fecha)         { patch[campoFecha] = fecha; antes[campoFecha] = x[campoFecha]; }
      if (Object.keys(patch).length > 0) cambios.push({ coleccion, id: d.id, patch, antes });
    }
  }

  // ── /sueno: del CSV de sueño ─────────────────────────────────────────────
  const sue = cargar(/shealth\.sleep\.\d+\.csv$/);
  console.log(`  CSV de sueño: ${sue.length} filas`);
  if (sue.length > 0) {
    const porUuidSue = new Map(sue.map((f) => [col(f, "datauuid"), f]));
    const snap = await db.collection("sueno").get();
    for (const d of snap.docs) {
      const fila = porUuidSue.get(d.id.replace(/^[A-Z]+-/, ""));
      if (!fila) { sinFila.sueno = (sinFila.sueno ?? 0) + 1; continue; }
      const off = col(fila, "time_offset");
      const bed = col(fila, "original_bed_time") || col(fila, "start_time");
      const ini = msUtc(bed);
      const fin = msUtc(col(fila, "end_time"));
      const fecha = fechaLocal(col(fila, "start_time"), off);
      const hora = (v: string) => {
        const ms = msUtc(v); if (ms == null) return undefined;
        return new Date(ms + offMsDe(off)).toISOString().slice(11, 16);
      };
      const x = d.data() as Record<string, unknown>;
      const patch: Record<string, unknown> = {};
      const antes: Record<string, unknown> = {};
      if (ini != null && x.inicioMs !== ini) { patch.inicioMs = ini; antes.inicioMs = x.inicioMs; }
      if (fin != null && x.finMs    !== fin) { patch.finMs    = fin; antes.finMs    = x.finMs; }
      if (fecha && x.fecha !== fecha)        { patch.fecha    = fecha; antes.fecha   = x.fecha; }
      const ha = hora(bed), hl = hora(col(fila, "end_time"));
      if (ha && x.horaAcostarse  !== ha) { patch.horaAcostarse  = ha; antes.horaAcostarse  = x.horaAcostarse; }
      if (hl && x.horaLevantarse !== hl) { patch.horaLevantarse = hl; antes.horaLevantarse = x.horaLevantarse; }
      if (Object.keys(patch).length > 0) cambios.push({ coleccion: "sueno", id: d.id, patch, antes });
    }
  }

  // ── /mediciones: del CSV de peso ─────────────────────────────────────────
  const peso = cargar(/health\.weight\.\d+\.csv$/);
  console.log(`  CSV de peso: ${peso.length} filas`);
  if (peso.length > 0) {
    const porUuidPeso = new Map(peso.map((f) => [col(f, "datauuid"), f]));
    const snap = await db.collection("mediciones").get();
    for (const d of snap.docs) {
      const fila = porUuidPeso.get(d.id.replace(/^MED-/, ""));
      if (!fila) { sinFila.mediciones = (sinFila.mediciones ?? 0) + 1; continue; }
      const fecha = fechaLocal(col(fila, "start_time"), col(fila, "time_offset"));
      const x = d.data() as Record<string, unknown>;
      if (fecha && x.fecha !== fecha) {
        cambios.push({ coleccion: "mediciones", id: d.id, patch: { fecha }, antes: { fecha: x.fecha } });
      }
    }
  }

  // ── Informe ──────────────────────────────────────────────────────────────
  const porColeccion: Record<string, number> = {};
  cambios.forEach((c) => { porColeccion[c.coleccion] = (porColeccion[c.coleccion] ?? 0) + 1; });

  console.log(`\n  documentos a corregir: ${cambios.length}`);
  Object.entries(porColeccion).forEach(([k, v]) => console.log(`    /${k}: ${v}`));
  if (Object.keys(sinFila).length > 0) {
    console.log(`  sin fila en el CSV (no se tocan): ${JSON.stringify(sinFila)}`);
  }

  const cambiaFecha = cambios.filter((c) => c.patch.fecha !== undefined || c.patch.fechaRealizada !== undefined);
  console.log(`  de esos, con la FECHA corrida un día: ${cambiaFecha.length}`);

  console.log(`\n  primeros diez cambios:`);
  cambios.slice(0, 10).forEach((c) => {
    const campos = Object.keys(c.patch).map((k) => `${k}: ${JSON.stringify(c.antes[k])} → ${JSON.stringify(c.patch[k])}`);
    console.log(`    /${c.coleccion}/${c.id}`);
    campos.forEach((f) => console.log(`        ${f}`));
  });

  const met = await db.collection("metricas-salud").get();
  console.log(`\n  ⚠ /metricas-salud: ${met.size} documentos NO se tocan.`);
  console.log(`     Su id es \`\${miembro}-\${tipo}-\${fecha}\`: corregir la fecha es borrar y crear,`);
  console.log(`     y dos días pueden colapsar en uno. Se decide aparte.`);

  if (!aplicar) {
    console.log(`\n  [simulación] No se escribió nada. Corré con --aplicar para escribir.\n`);
    process.exit(0);
  }

  // ── Escritura en batches de 400 ──────────────────────────────────────────
  const BATCH = 400;
  let escritos = 0;
  for (let i = 0; i < cambios.length; i += BATCH) {
    const chunk = cambios.slice(i, i + BATCH);
    const batch = db.batch();
    for (const c of chunk) batch.update(db.collection(c.coleccion).doc(c.id), c.patch);
    await batch.commit();
    escritos += chunk.length;
    console.log(`  Batch ${Math.floor(i / BATCH) + 1}: ${chunk.length} docs`);
  }
  console.log(`\n  ✅ ${escritos} documentos migrados con update().\n`);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
