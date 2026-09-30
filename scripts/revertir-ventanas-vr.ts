// ════════════════════════════════════════════════════════════════════════════
//  scripts/revertir-ventanas-vr.ts — el otro extremo de la ventana (P84b).
//
//  P84 alargó el fin de las ventanas cortas de VR dejando `inicioMs` quieto.
//  En la VR anterior a P80 ese `inicioMs` salía de la primera ronda marcada y
//  llegaba tarde: P84 corrió la ventana entera 10 a 24 min hacia adelante. Acá
//  se revierte contra el extremo confiable, el fin viejo:
//      finMs    = el del respaldo de P84 (tal cual)
//      inicioMs = finMs − duracionRealMin
//  `duracionRealMin` no se toca (ADR #042). La lógica y las guardas están en
//  `src/lib/ventanasViejas.ts` (planificarReversion), con tests.
//
//  A quién: SOLO las sesiones del respaldo de P84. Guardas por sesión: el
//  estado de hoy es el que dejó P84; el reloj confirma el inicio (±5 min);
//  sin tramo no se escribe; no pisa la sesión anterior. `update()`, respaldo
//  propio antes de escribir (el de P84 no se toca), y la biometría de cada una
//  queda con `versionEnriquecimiento: 0` para que la próxima sincronización la
//  rehaga.
//
//  Además imprime el censo de la Parte 2 (solo lectura): otras sesiones que
//  arrancan lejos del reloj, VR y fuera de VR.
//
//  P84c — lista extra: las sesiones guardadas DESPUÉS de P84 cuya ventana mide
//  menos que `duracionRealMin` (nacieron cortas: la ventana salía de las
//  series). Misma regla (se ancla en el fin, se resta la duración) y mismas
//  guardas, salvo la 1, que para éstas es "la ventana mide menos que
//  `duracionRealMin`" (`planificarReanclaje`). La del reloj se queda.
//
//  Uso (desde la raíz):
//    npx tsx scripts/revertir-ventanas-vr.ts                 # simulación
//    npx tsx scripts/revertir-ventanas-vr.ts --aplicar       # escribe (lo corre Juan)
//    [--respaldo=docs/auditorias/respaldo-ventanas-XXXX.json]
// ════════════════════════════════════════════════════════════════════════════

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import {
  planificarReversion, planificarReanclaje, camposDeReversion, censoArranques, msDelIdHist,
  TOLERANCIA_RELOJ_MS, type LineaRespaldoP84, type SesionConVentana, type Reversion, type NoRevertida,
} from "../src/lib/ventanasViejas";
import { TOLERANCIA_VENTANA_MS, ventanaCumpleInvariante } from "../src/lib/metricas";
import { seEnriquece } from "../src/lib/tipoHistorial";
import { esRutinaVR } from "../src/lib/progresionVR";
import type { Rutina } from "../src/types/models";
import { correr } from "./lib/corrida";

const __dir = dirname(fileURLToPath(import.meta.url));
const RESPALDO_P84 = "docs/auditorias/respaldo-ventanas-2026-09-25T19-42-57-877Z.json";
/** Cuándo corrió P84 (el sello del respaldo): la lista extra de P84c es lo guardado después. */
const P84_MS = Date.parse("2026-09-25T19:42:57.877Z");
const argRespaldo = process.argv.find((a) => a.startsWith("--respaldo="))?.split("=")[1];

const serviceAccount = JSON.parse(readFileSync(resolve(__dir, "service-account.json"), "utf8"));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

/** Hora local de Buenos Aires, para leer la tabla. */
const hm = (ms: number) => new Date(ms).toLocaleTimeString("es-AR",
  { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "America/Argentina/Buenos_Aires" });

correr("revertir-ventanas-vr", async (c) => {
  const rutaRespaldo = resolve(__dir, "..", argRespaldo ?? RESPALDO_P84);
  const respaldo = JSON.parse(readFileSync(rutaRespaldo, "utf8")) as LineaRespaldoP84[];
  console.log(`  respaldo de P84: ${rutaRespaldo} (${respaldo.length} sesiones)`);
  console.log(`  tolerancia contra el reloj: ±${TOLERANCIA_RELOJ_MS / 60_000} min\n`);

  const [histSnap, rutSnap] = await Promise.all([db.collection("historial").get(), db.collection("rutinas").get()]);
  const todas = histSnap.docs.map((d) => ({ ...(d.data() as SesionConVentana), idHist: d.id }));
  const idsVR = new Set(rutSnap.docs.filter((d) => esRutinaVR(d.data() as Rutina)).map((d) => d.id));

  // El testigo: el arranque de los tramos de Samsung de cada sesión, de /cardio.
  const relojInicio = new Map<string, number[]>();
  for (const s of todas) {
    const uuids = s.biometria?.tramosSamsung ?? (s.biometria?.datauuidSamsung ? [s.biometria.datauuidSamsung] : []);
    const inicios: number[] = [];
    for (const u of uuids) {
      const snap = await db.doc(`cardio/CAR-${u}`).get();
      const ini = snap.data()?.inicioMs;
      if (typeof ini === "number") inicios.push(ini);
    }
    if (inicios.length > 0) relojInicio.set(s.idHist, inicios);
  }

  // ── Parte 2: el censo, antes de escribir ──────────────────────────────────
  const censo = censoArranques(todas, relojInicio, idsVR, new Set(respaldo.map((r) => r.idHist)));
  const vrOtras = censo.filter((x) => x.categoria !== "otra");
  const fuera = censo.filter((x) => x.categoria === "otra");
  console.log(`  Censo 1 — VR que P84 no tocó y arranca a más de 5 min del reloj: ${vrOtras.length}`);
  vrOtras.forEach((x) => console.log(`    ${x.fecha}  ${x.nombreRutina}  app ${hm(x.inicioMs)} · reloj ${hm(x.relojInicioMs)} · ${x.difMin} min  [${x.idHist}]`));
  console.log(`  Censo 2 — fuera de VR que arranca a más de 5 min del reloj: ${fuera.length}`);
  fuera.forEach((x) => console.log(`    ⚠ ${x.fecha}  ${x.nombreRutina}  app ${hm(x.inicioMs)} · reloj ${hm(x.relojInicioMs)} · ${x.difMin} min  [${x.idHist}]`));
  const sinReloj = todas.filter((s) => typeof s.inicioMs === "number" && !relojInicio.has(s.idHist)).length;
  console.log(`  (sesiones con ventana pero sin tramo de reloj, fuera del censo: ${sinReloj})\n`);

  const tabla = (titulo: string, rs: Reversion[], nos: NoRevertida[]) => {
    console.log(`  ${titulo}`);
    console.log("  fecha       rutina                                  ventana hoy    → nueva          reloj   inicio−reloj");
    for (const r of rs) {
      console.log(`  ${r.fecha}  ${r.nombreRutina.slice(0, 38).padEnd(38)}  ${hm(r.ventanaHoy.inicioMs)}→${hm(r.ventanaHoy.finMs)}  → ${hm(r.nueva.inicioMs)}→${hm(r.nueva.finMs)}  ${hm(r.relojInicioMs)}   ${r.difRelojMin} min`);
    }
    for (const n of nos) console.log(`  ✗ ${n.idHist}: ${n.motivo} — ${n.detalle}`);
    console.log();
  };

  // ── Parte 2.3 (P84b): la tabla de las cinco ──────────────────────────────
  const p84b = planificarReversion(respaldo, todas, relojInicio);
  tabla("P84b — las del respaldo de P84", p84b.reversiones, p84b.noRevertidas);

  // ── P84c: las que nacieron cortas después de P84 ─────────────────────────
  const excluir = new Set(respaldo.map((r) => r.idHist));
  const p84c = planificarReanclaje(todas, relojInicio, P84_MS, excluir, TOLERANCIA_VENTANA_MS);
  tabla(`P84c — guardadas después de P84 con la ventana más corta que duracionRealMin (±${TOLERANCIA_VENTANA_MS / 60_000} min)`,
    p84c.reversiones, p84c.noRevertidas);

  // Informativo: cuántas más violan la invariante y quedan fuera de las dos listas.
  const cubiertas = new Set([...excluir, ...p84c.reversiones.map((r) => r.idHist), ...p84c.noRevertidas.map((n) => n.idHist)]);
  const sinCubrir = todas.filter((s) => seEnriquece(s) && !cubiertas.has(s.idHist) && !ventanaCumpleInvariante(s));
  const medibles = todas.filter((s) => seEnriquece(s) && s.inicioMs != null && s.finMs != null && s.duracionRealMin != null).length;
  const antesDeP84 = sinCubrir.filter((s) => (msDelIdHist(s.idHist) ?? 0) <= P84_MS).length;
  console.log(`  (de ${medibles} sesiones de la app con inicio, fin y duración, fuera de las dos listas y violando la invariante: ${sinCubrir.length} — ${antesDeP84} guardadas antes de P84, ${sinCubrir.length - antesDeP84} después con la ventana más LARGA que el cronómetro)
`);

  const reversiones = [...p84b.reversiones, ...p84c.reversiones];
  if (reversiones.length === 0) return;

  // Respaldo propio: lo que hay HOY (lo que dejó P84). El de P84 no se toca.
  const porId = new Map(todas.map((s) => [s.idHist, s]));
  if (!c.abrirRespaldo(reversiones.map((r) => {
    const s = porId.get(r.idHist)!;
    return { idHist: r.idHist, inicioMsAntes: s.inicioMs, finMsAntes: s.finMs,
      versionEnriquecimientoAntes: s.biometria?.versionEnriquecimiento ?? null, ...r.nueva };
  }))) return;

  for (const r of reversiones) {
    await c.escribir(`${r.idHist}  ${r.fecha}  ${r.nombreRutina}`,
      () => db.collection("historial").doc(r.idHist).update(camposDeReversion(r)));
  }
});
