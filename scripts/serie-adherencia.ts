// ════════════════════════════════════════════════════════════════════════════
//  scripts/serie-adherencia.ts — la serie de adherencia real, SOLO LECTURA.
//
//  Responde las verificaciones 5 y 6 de la corrida del 21/09, que quedaron
//  pendientes porque la cuota diaria de Firestore estaba agotada:
//
//    5. Cuántas semanas tiene la serie, la racha actual, el récord y la tasa
//       de 8 semanas. Con pocas sesiones es esperable que la tasa dé `null`:
//       `tasaCumplimiento` pide al menos 4 semanas cerradas.
//    6. Si la meta del plan y los días que realmente se entrenan difieren
//       mucho — puede ser que la meta esté mal puesta.
//
//  **No escribe nada.** Usa los mismos módulos puros que la app
//  (`lib/racha`, `lib/adherencia`), así que lo que imprime es exactamente lo
//  que se ve en Home y en Progreso, no una segunda implementación.
//
//  Uso (desde la RAÍZ del repo):
//    npx tsx scripts/serie-adherencia.ts [--miembro=juanpablo] [--semanas=12]
//
//  Costo: una consulta a /historial del miembro, una a /cardio del rango, y
//  dos documentos de config. No pagina /cardio: el rango es de 12 semanas.
// ════════════════════════════════════════════════════════════════════════════

// corrida: exento — solo lectura: no escribe en Firestore.
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { agruparDiasActivos, type ActividadDia } from "../src/lib/racha";
import {
  metaSemanal, seriesDeAdherencia, rachaActual, rachaRecord, tasaCumplimiento,
} from "../src/lib/adherencia";
import type {
  Historial, MiembroId, PerfilMiembro, Programa, SesionCardio,
} from "../src/types/models";

const __dir = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const miembro = (args.find((a) => a.startsWith("--miembro="))?.split("=")[1] ?? "juanpablo") as MiembroId;
const semanas = Number(args.find((a) => a.startsWith("--semanas="))?.split("=")[1] ?? 12);

const serviceAccount = JSON.parse(readFileSync(resolve(__dir, "service-account.json"), "utf8"));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

/** "YYYY-MM-DD" local, igual que `ymdLocal` de la app. */
function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** El lunes de la semana de `ref`, igual que `lunesDeSemana` de la app. */
function lunes(ref: Date): string {
  const d = new Date(ref);
  const dow = d.getDay();
  d.setDate(d.getDate() + (dow === 0 ? -6 : 1 - dow));
  return ymd(d);
}

async function run() {
  const hoy = ymd(new Date());
  const desde = lunes(new Date(Date.now() - (semanas - 1) * 7 * 86_400_000));

  console.log(`\n  miembro: ${miembro}   ·   hoy: ${hoy}   ·   ventana de movimiento: desde ${desde}`);
  console.log("  SOLO LECTURA: este script no escribe nada.\n");

  // ── Historial completo del miembro ──────────────────────────────────────
  const histSnap = await db.collection("historial").where("miembro", "==", miembro).get();
  const todas = histSnap.docs.map((d) => d.data() as Historial);
  // Solo ShapeUp: las externas de P75 que hayan quedado no cuentan para el plan.
  const propias = todas.filter((h) => (h.tipo ?? "rutina") !== "externa");
  console.log(`  /historial: ${histSnap.size} documentos  (ShapeUp: ${propias.length}, externas viejas: ${todas.length - propias.length})`);

  // ── Programa activo y perfil, para la meta ──────────────────────────────
  const activoSnap = await db.collection("config").doc("programaActivo").get();
  const idPrograma = (activoSnap.data() as Record<string, string> | undefined)?.[miembro];
  let programa: Programa | null = null;
  if (idPrograma) {
    const p = await db.collection("programas").doc(idPrograma).get();
    if (p.exists) programa = p.data() as Programa;
  }
  const perfSnap = await db.collection("config").doc("perfiles").get();
  const perfil = (perfSnap.data() as Record<string, PerfilMiembro> | undefined)?.[miembro];

  const meta = metaSemanal(programa, perfil);
  console.log(`  programa activo: ${programa ? `${programa.idPrograma} — ${programa.nombre}` : "(ninguno)"}`);
  if (programa) {
    const activos = programa.dias.filter((d) => d.tipo !== "descanso");
    const opcionales = activos.filter((d) => d.opcional);
    console.log(
      `     días no-descanso: ${activos.length}`
      + `   ·   opcionales: ${opcionales.length}`
      + `   ·   sin idRutina: ${activos.filter((d) => !d.idRutina).length}`,
    );
    // Los opcionales no cuentan para la meta (ver `metaSemanal`): PRG-0001 se
    // llama "5 días" y tiene seis activos porque el sábado es opcional.
    if (opcionales.length > 0) {
      console.log(`     opcionales (no cuentan para la meta): ${opcionales.map((d) => d.etiqueta).join(", ")}`);
    }
  }
  console.log(`  override del perfil (metaSemanalDias): ${perfil?.metaSemanalDias ?? "(ninguno)"}`);
  console.log(`  META = ${meta ?? "null"}`);

  if (meta == null) {
    console.log("\n  Sin meta no hay serie que medir. Fin.\n");
    return;
  }

  // ── Actividades del rango, para los días de movimiento ──────────────────
  // `orderBy("fecha", "desc")` a propósito: sin él Firestore ordena ascendente
  // y pide un índice (miembro, fecha asc) que no existe. La app consulta
  // descendente y ese índice sí está en `firestore.indexes.json`.
  const cardioSnap = await db.collection("cardio")
    .where("miembro", "==", miembro)
    .where("fecha", ">=", desde)
    .orderBy("fecha", "desc")
    .get();
  const cardio = cardioSnap.docs.map((d) => d.data() as SesionCardio) as unknown as ActividadDia[];
  console.log(`  /cardio desde ${desde}: ${cardioSnap.size} actividades\n`);

  // ── La serie ────────────────────────────────────────────────────────────
  const domingo = ymd(new Date(new Date(lunes(new Date()) + "T00:00:00").getTime() + 6 * 86_400_000));
  const dias = agruparDiasActivos(propias, cardio);
  const serie = seriesDeAdherencia(dias, meta, hoy, { desde, hasta: domingo });

  console.log(`  ── Serie: ${serie.length} semanas ──────────────────────────────`);
  for (const s of serie) {
    const mov = s.diasMovimiento == null ? "  mov ?" : `  mov ${s.diasMovimiento}`;
    console.log(
      `    ${s.semanaInicio}   plan ${s.diasPlan}/${s.meta}${mov}`
      + `   ${s.cumplida ? "CUMPLIDA" : "—"}${s.enCurso ? "   (en curso)" : ""}`,
    );
  }

  const racha = rachaActual(serie);
  const record = rachaRecord(serie);
  const tasa = tasaCumplimiento(serie);
  console.log(`\n  racha actual : ${racha}`);
  console.log(`  récord       : ${record}`);
  console.log(`  tasa 8 sem   : ${tasa ? `${tasa.cumplidas} de ${tasa.total}` : "null (menos de 4 semanas cerradas)"}`);

  // ── Verificación 6: meta declarada contra días reales ───────────────────
  const cerradas = serie.filter((s) => !s.enCurso);
  if (cerradas.length === 0) {
    console.log("\n  Sin semanas cerradas no se puede comparar la meta con lo real.\n");
    return;
  }
  const promedio = cerradas.reduce((a, s) => a + s.diasPlan, 0) / cerradas.length;
  const cumplidas = cerradas.filter((s) => s.cumplida).length;
  console.log(`\n  ── Meta contra realidad (${cerradas.length} semanas cerradas) ──`);
  console.log(`    promedio real : ${promedio.toFixed(2)} días/semana`);
  console.log(`    meta          : ${meta}`);
  console.log(`    diferencia    : ${(promedio - meta).toFixed(2)}`);
  console.log(`    cumplidas     : ${cumplidas} de ${cerradas.length} (${Math.round((cumplidas / cerradas.length) * 100)} %)`);
  if (promedio < meta - 1) {
    console.log(`\n    ⚠ El promedio real está más de un día por debajo de la meta.`);
    console.log(`      Puede ser que la meta esté mal puesta, no que se esté incumpliendo.`);
  }
  console.log("");
}

run().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
