// ════════════════════════════════════════════════════════════════════════════
//  scripts/dry-run-puente.ts — corre el adaptador de PU4 contra /ingesta-sdk
//  SIN ESCRIBIR NADA. Es la misma vista previa que muestra la app.
//
//  Usa los mismos módulos puros que la UI; solo la lectura va por
//  firebase-admin en vez del SDK cliente (los scripts no pueden importar
//  src/data — ver scripts/pureza.test.ts).
//
//  Uso: npx tsx scripts/dry-run-puente.ts [--miembro=juanpablo]
// ════════════════════════════════════════════════════════════════════════════

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import {
  adaptarRegistros, TITULO_SHAPEUP, type RegistroSdk,
} from "../src/lib/adaptadorSdk";
import {
  clasificarImport, ACTIVIDADES_SIEMPRE_RELEVANTES, DURACION_MIN_ACTIVIDAD_MIN,
  type ConfigClasificacion, type CardioClasificable, type DestinoImport,
} from "../src/lib/importSelectivo";
import { marcasDe, actividadRelevante } from "../src/lib/actividadRelevante";
import type { Historial, MiembroId, PerfilMiembro, OrigenExterna, MotivoIngreso } from "../src/types/models";

const __dir = dirname(fileURLToPath(import.meta.url));
const miembro = (process.argv.find((a) => a.startsWith("--miembro="))?.split("=")[1] ?? "juanpablo") as MiembroId;
const serviceAccount = JSON.parse(readFileSync(resolve(__dir, "service-account.json"), "utf8"));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const SUFIJO_PARTE = /__p\d+$/;

async function run() {
  console.log(`\nVista previa del puente — miembro ${miembro} · NO SE ESCRIBE NADA\n`);

  const uids = await db.collection("ingesta-sdk").listDocuments();
  if (uids.length === 0) { console.log("No hay nada en /ingesta-sdk."); process.exit(0); }
  const uid = uids[0].id;

  // ── Leer y rearmar (espejo de data/ingestaSdk.ts) ────────────────────────
  const snap = await db.collection(`ingesta-sdk/${uid}/registros`).get();
  const enteros: { id: string; d: Record<string, unknown> }[] = [];
  const partes = new Map<string, { id: string; d: Record<string, unknown> }[]>();
  for (const doc of snap.docs) {
    const d = doc.data();
    if (d.parte != null) {
      const base = doc.id.replace(SUFIJO_PARTE, "");
      partes.set(base, [...(partes.get(base) ?? []), { id: doc.id, d }]);
    } else {
      enteros.push({ id: doc.id, d });
    }
  }

  const registros: RegistroSdk[] = [];
  const ilegibles: { id: string; motivo: string }[] = [];
  let rearmados = 0;

  for (const { id, d } of enteros) {
    try {
      registros.push({ id, dataType: String(d.dataType), crudo: JSON.parse(String(d.crudo)) });
    } catch { ilegibles.push({ id, motivo: "crudo ilegible" }); }
  }
  for (const [base, trozos] of partes) {
    const orden = [...trozos].sort((a, b) => Number(a.d.parte) - Number(b.d.parte));
    const total = Number(orden[0].d.totalPartes);
    if (orden.length !== total || !orden.every((t, i) => Number(t.d.parte) === i + 1)) {
      ilegibles.push({ id: base, motivo: `partido incompleto: ${orden.length}/${total}` });
      continue;
    }
    try {
      registros.push({
        id: base, dataType: String(orden[0].d.dataType),
        crudo: JSON.parse(orden.map((t) => String(t.d.crudo)).join("")),
      });
      rearmados++;
    } catch { ilegibles.push({ id: base, motivo: "crudo rearmado ilegible" }); }
  }

  console.log(`  documentos leídos : ${snap.size}`);
  console.log(`  registros lógicos : ${registros.length} (${rearmados} rearmados de partes)`);
  console.log(`  ilegibles         : ${ilegibles.length}`);
  for (const i of ilegibles) console.log(`      ⚠ ${i.id}: ${i.motivo}`);

  // ── Adaptar ─────────────────────────────────────────────────────────────
  const perfSnap = await db.collection("config").doc("perfiles").get();
  const zonasFC = (perfSnap.data()?.[miembro] as PerfilMiembro | undefined)?.zonasFC;
  const adaptado = adaptarRegistros(registros, miembro, zonasFC);

  console.log(`\n  ejercicios adaptados : ${adaptado.ejercicios.length}`);
  console.log(`  mediciones adaptadas : ${adaptado.mediciones.length}`);
  console.log(`  ignorados            : ${adaptado.ignorados.length}`);
  for (const i of adaptado.ignorados.slice(0, 5)) console.log(`      · ${i.motivo}`);

  // ── Clasificar con el pipeline del ZIP ──────────────────────────────────
  const histSnap = await db.collection("historial")
    .where("miembro", "==", miembro).where("tipo", "in", ["rutina", "libre"]).get();
  const historial = histSnap.docs.map((d) => d.data() as Historial);
  console.log(`  historial ShapeUp    : ${historial.length} sesiones`);

  const cfgSnap = await db.collection("config").doc("import").get();
  const cfgData = cfgSnap.exists ? cfgSnap.data() : undefined;
  const config: ConfigClasificacion = {
    duracionMinimaMin: typeof cfgData?.duracionMinimaMin === "number"
      ? cfgData.duracionMinimaMin : DURACION_MIN_ACTIVIDAD_MIN,
    actividadesSiempreRelevantes: Array.isArray(cfgData?.actividadesSiempreRelevantes)
      ? cfgData.actividadesSiempreRelevantes as string[] : ACTIVIDADES_SIEMPRE_RELEVANTES,
  };

  const clasificadas = clasificarImport(
    adaptado.ejercicios as CardioClasificable[], historial,
    [TITULO_SHAPEUP], config, Date.now(),
  );

  const por = (d: DestinoImport) => clasificadas.filter((c) => c.destino === d);
  console.log("\n  -- Destinos ------------------------------------------");
  console.log(`  enriquecen sesiones : ${String(por("enriquece").length).padStart(4)}`);
  console.log(`  entran como externa : ${String(por("externa").length).padStart(4)}`);
  console.log(`  solo en salud       : ${String(por("descartada").length).padStart(4)}`);
  console.log(`                        ────`);
  console.log(`  total               : ${String(clasificadas.length).padStart(4)}`);

  console.log("\n  -- Las que enriquecen --------------------------------");
  for (const c of por("enriquece")) console.log(`  ${(c.idHist ?? "—").padEnd(30)} ${c.explicacion}`);

  console.log("\n  -- Primeras 10 explicaciones -------------------------");
  for (const c of clasificadas.slice(0, 10)) console.log(`  [${c.destino.padEnd(11)}] ${c.explicacion}`);

  const soloSalud = por("descartada");
  if (soloSalud.length > 0) {
    console.log("\n  -- Quedan solo en salud ------------------------------");
    for (const c of soloSalud.slice(0, 10)) console.log(`  ${c.explicacion}`);
  }

  // ── Qué se escribiría ───────────────────────────────────────────────────
  // P76b: un solo destino, /cardio. Lo que antes eran "entradas externas a
  // escribir" ahora son actividades que se van a VER en el historial, según el
  // mismo filtro que usa la pantalla al leer.
  const conMarcas = clasificadas.map((c) => ({ ...c.item, ...marcasDe(c.item) }));

  console.log("\n  -- Marcas que se persisten en /cardio ----------------");
  console.log(`  esVR            : ${conMarcas.filter((a) => a.esVR).length}`);
  console.log(`  marcadaShapeUp  : ${conMarcas.filter((a) => a.marcadaShapeUp).length}`);
  console.log(`  autodetectada   : ${conMarcas.filter((a) => a.autodetectada).length}`);

  console.log("\n  -- Se escribiria -------------------------------------");
  console.log(`  a /cardio    : ${clasificadas.length} (TODAS)`);
  console.log(`  a /historial : 0 (el historial filtra, no copia)`);

  console.log("\n  -- Sensibilidad del umbral (filtro de lectura) -------");
  for (const u of [10, 20, 30, 45]) {
    const n = conMarcas.filter((a) => actividadRelevante(a, { duracionMinimaMin: u })).length;
    console.log(`  ${String(u).padStart(2)} min -> ${String(n).padStart(4)} se verian en el historial`);
  }

  console.log("\n  -- Mediciones ----------------------------------------");
  console.log(`  a escribir : ${adaptado.mediciones.length}`);
  for (const m of adaptado.mediciones) {
    console.log(`      ${m.fecha}  ${m.pesoKg} kg  MED-${m._uuid}  (${m._appId})`);
  }
  console.log(`  descartadas: ${adaptado.medicionesDescartadas.length}`);
  for (const d of adaptado.medicionesDescartadas) console.log(`      ${d.uid.slice(0, 8)}… ${d.motivo}`);

  // ── Cuántas ya están guardadas (idempotencia) ───────────────────────────
  const medSnap = await db.collection("mediciones").where("miembro", "==", miembro).get();
  const idsMed = new Set(medSnap.docs.map((d) => d.id));
  const nuevasMed = adaptado.mediciones.filter((m) => !idsMed.has(`MED-${m._uuid}`)).length;
  const cardSnap = await db.collection("cardio").where("miembro", "==", miembro).get();
  const idsCard = new Set(cardSnap.docs.map((d) => d.id));
  const nuevasCard = clasificadas.filter((c) => {
    const u = (c.item as { _uuid?: string })._uuid;
    return u && !idsCard.has(`CAR-${u}`);
  }).length;

  console.log("\n  -- Contra lo que ya está guardado --------------------");
  console.log(`  mediciones nuevas : ${nuevasMed} de ${adaptado.mediciones.length}`);
  console.log(`  cardio nuevo      : ${nuevasCard} de ${clasificadas.length}`);
  console.log("");
  process.exit(0);
}
run().catch((e) => { console.error(e); process.exit(1); });
