// ════════════════════════════════════════════════════════════════════════════
//  scripts/dry-run-import.ts — corre el clasificador de P75 contra un ZIP real
//  SIN ESCRIBIR NADA. Diagnóstico: sirve para ver si el umbral y las reglas
//  están bien antes de confirmar un import de verdad.
//
//  Lee /historial y /config/import con firebase-admin (solo lectura) y usa los
//  mismos módulos puros que la app.
//
//  Uso: npx tsx scripts/dry-run-import.ts <ruta-al-zip> [--miembro=juanpablo]
// ════════════════════════════════════════════════════════════════════════════

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { extraerDesdeZip } from "../src/import/samsungZip";
import {
  clasificarImport, ACTIVIDADES_SIEMPRE_RELEVANTES, DURACION_MIN_ACTIVIDAD_MIN,
  type ConfigClasificacion, type CardioClasificable, type DestinoImport,
} from "../src/lib/importSelectivo";
import { construirEntradaExterna, type ItemExterno } from "../src/lib/entradaExterna";
import type { Historial, MiembroId, PerfilMiembro } from "../src/types/models";

const __dir = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const zipPath = args.find((a) => !a.startsWith("--"));
const miembro = (args.find((a) => a.startsWith("--miembro="))?.split("=")[1] ?? "juanpablo") as MiembroId;

if (!zipPath) {
  console.error("Falta la ruta al ZIP.\n  npx tsx scripts/dry-run-import.ts <zip> [--miembro=juanpablo]");
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(resolve(__dir, "service-account.json"), "utf8"));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function run() {
  console.log(`\nDry-run del import — ${zipPath}\n  miembro: ${miembro}  ·  NO SE ESCRIBE NADA\n`);

  // ── Historial y configuración (solo lectura) ─────────────────────────────
  const histSnap = await db.collection("historial").where("miembro", "==", miembro).get();
  const historial = histSnap.docs.map((d) => d.data() as Historial);

  const cfgSnap = await db.collection("config").doc("import").get();
  const cfgData = cfgSnap.exists ? (cfgSnap.data() as Record<string, unknown>) : undefined;
  const config: ConfigClasificacion = {
    duracionMinimaMin: typeof cfgData?.duracionMinimaMin === "number"
      ? cfgData.duracionMinimaMin : DURACION_MIN_ACTIVIDAD_MIN,
    actividadesSiempreRelevantes: Array.isArray(cfgData?.actividadesSiempreRelevantes)
      ? (cfgData.actividadesSiempreRelevantes as string[]) : ACTIVIDADES_SIEMPRE_RELEVANTES,
  };
  console.log(`  /historial: ${historial.length} entradas`);
  console.log(`  /config/import: ${cfgSnap.exists ? "existe" : "no existe (defaults)"} · umbral ${config.duracionMinimaMin} min\n`);

  // ── Perfil (para las zonas de FC del parser) ─────────────────────────────
  const perfSnap = await db.collection("config").doc("perfiles").get();
  const zonasFC = (perfSnap.data()?.[miembro] as PerfilMiembro | undefined)?.zonasFC;

  // ── ZIP → items ──────────────────────────────────────────────────────────
  // JSZip acepta un Buffer directo en Node; la firma pide `File` porque en la
  // app el archivo viene del input.
  const buf = readFileSync(resolve(process.cwd(), zipPath!));
  const z = await extraerDesdeZip(buf as unknown as File, miembro, "biometrico", zonasFC, (pct, msg) => {
    if (!msg.startsWith("Curvas FC")) console.log(`  [${String(pct).padStart(3)}%] ${msg}`);
  });
  console.log(`\n  ${z.cardio.length} actividades en el export · custom-id ShapeUp: ${z.shapeUpCustomId ?? "—"}`);
  console.log(`  CSVs leídos: ${z.csvsLeidos.join(", ") || "(ninguno)"}`);
  console.log(`  CSVs por tipo: ${JSON.stringify(z.csvsPorTipo)}`);
  if (z.errors.length > 0) {
    console.log(`  errores de extracción (${z.errors.length}):`);
    for (const e of z.errors.slice(0, 5)) console.log(`    ⚠ ${e}`);
  }
  console.log("");

  // ── Clasificación ────────────────────────────────────────────────────────
  const clasificadas = clasificarImport(
    z.cardio as CardioClasificable[], historial,
    z.shapeUpCustomId ? [z.shapeUpCustomId] : [], config, Date.now(),
  );

  const por = (d: DestinoImport) => clasificadas.filter((c) => c.destino === d);
  const enriquecen = por("enriquece");
  const externas   = por("externa");
  const descartadas = por("descartada");

  console.log("  ── Destinos ───────────────────────────────────────────────");
  console.log(`  enriquecen sesiones : ${String(enriquecen.length).padStart(4)}`);
  console.log(`  entran como externa : ${String(externas.length).padStart(4)}`);
  console.log(`  descartadas         : ${String(descartadas.length).padStart(4)}`);
  console.log(`  ${"".padEnd(24)}  ────`);
  console.log(`  total               : ${String(clasificadas.length).padStart(4)}\n`);

  const porMotivo = new Map<string, number>();
  for (const c of clasificadas) porMotivo.set(c.motivo, (porMotivo.get(c.motivo) ?? 0) + 1);
  console.log("  ── Por motivo ─────────────────────────────────────────────");
  for (const [motivo, n] of [...porMotivo].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${motivo.padEnd(12)}: ${n}`);
  }

  console.log("\n  ── Primeras 10 explicaciones ──────────────────────────────");
  for (const c of clasificadas.slice(0, 10)) {
    console.log(`  [${c.destino.padEnd(11)}] ${c.explicacion}`);
  }

  if (enriquecen.length > 0) {
    console.log("\n  ── Las que enriquecen ─────────────────────────────────────");
    for (const c of enriquecen.slice(0, 10)) {
      console.log(`  ${(c.idHist ?? "—").padEnd(24)} ${c.explicacion}`);
    }
  }

  if (descartadas.length > 0) {
    console.log("\n  ── Primeras 10 descartadas ────────────────────────────────");
    for (const c of descartadas.slice(0, 10)) console.log(`  ${c.explicacion}`);
  }

  // ── Desglose de las externas (para decidir si el umbral alcanza) ─────────
  const porActividad = new Map<string, number>();
  for (const c of externas) {
    porActividad.set(c.item.actividad, (porActividad.get(c.item.actividad) ?? 0) + 1);
  }
  console.log("\n  ── Externas por actividad (top 10) ────────────────────────");
  for (const [act, n] of [...porActividad].sort((a, b) => b[1] - a[1]).slice(0, 10)) {
    console.log(`  ${act.padEnd(24)}: ${n}`);
  }

  // ── Qué se escribiría (sin escribir) ─────────────────────────────────────
  const entradas = externas
    .filter((c) => !!(c.item as unknown as ItemExterno)._uuid)
    .map((c) => construirEntradaExterna(
      c.item as unknown as ItemExterno, miembro, c.motivoIngreso ?? "duracion",
    ));

  const porOrigen  = new Map<OrigenExterna, number>();
  const porIngreso = new Map<MotivoIngreso, number>();
  for (const e of entradas) {
    const o = e.externa!.origen;
    const m = e.externa!.motivoIngreso;
    porOrigen.set(o, (porOrigen.get(o) ?? 0) + 1);
    porIngreso.set(m, (porIngreso.get(m) ?? 0) + 1);
  }

  console.log("\n  -- Externas por origen -------------------------------");
  for (const [o, n] of [...porOrigen].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${o.padEnd(16)}: ${n}`);
  }
  console.log("\n  -- Externas por motivo de ingreso --------------------");
  for (const [m, n] of [...porIngreso].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${m.padEnd(20)}: ${n}`);
  }

  console.log("\n  -- Se escribirian (si confirmaras) -------------------");
  console.log(`  a /cardio          : ${clasificadas.length} (TODAS, P75b)`);
  console.log(`  entradas externas  : ${entradas.length}`);
  console.log(`  sin datauuid       : ${externas.length - entradas.length}\n`);

  // ── Duplicados que YA están en /cardio ───────────────────────────────────
  const cardioSnap = await db.collection("cardio").where("miembro", "==", miembro).get();
  const porInicio = new Map<string, number>();
  for (const d of cardioSnap.docs) {
    const data = d.data() as { inicioMs?: number; fecha?: string; actividad?: string };
    const clave = data.inicioMs != null
      ? `ms:${data.inicioMs}`
      : `fa:${data.fecha}|${data.actividad}`;   // sin inicioMs, fecha+actividad
    porInicio.set(clave, (porInicio.get(clave) ?? 0) + 1);
  }
  const gruposDup = [...porInicio.values()].filter((n) => n > 1);
  const docsSobrantes = gruposDup.reduce((s, n) => s + (n - 1), 0);
  console.log("  ── Duplicados que ya hay en /cardio ───────────────────────");
  console.log(`  documentos       : ${cardioSnap.size}`);
  console.log(`  claves repetidas : ${gruposDup.length}`);
  console.log(`  docs sobrantes   : ${docsSobrantes}`);
  console.log(`  sin inicioMs     : ${cardioSnap.docs.filter((d) => d.data().inicioMs == null).length}\n`);

  process.exit(0);
}
run().catch((e) => { console.error(e); process.exit(1); });
