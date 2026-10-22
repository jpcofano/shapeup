// ════════════════════════════════════════════════════════════════════════════
//  scripts/auditoria-calidad-salud.ts — calidad de los datos de salud (P105).
//
//  Solo lecturas (get). Nunca hace set/update/delete. Complementa a
//  auditoria-salud.ts (cobertura): acá van los cuatro chequeos por métrica
//  —plausibilidad, día asignado, duplicados y origen—, con la presión primero
//  y lo que mostrarían Resumen y Progreso. Los chequeos son puros, en
//  scripts/lib/chequeosSalud.ts.
//
//  El reporte contiene datos de salud personales: se escribe en
//  docs/auditorias/, que está en .gitignore. Nunca commitear un reporte.
//
//  Uso:
//    npx tsx scripts/auditoria-calidad-salud.ts                       # juanpablo
//    npx tsx scripts/auditoria-calidad-salud.ts --miembro=maria
//    npx tsx scripts/auditoria-calidad-salud.ts --salida=auditoria-salud-2026-10-22.md
// ════════════════════════════════════════════════════════════════════════════

// corrida: exento — solo lectura: no escribe en Firestore.
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve, dirname, basename } from "path";
import { fileURLToPath } from "url";

import type { MedicionCorporal, MetricaSalud, RegistroSueno } from "../src/types/models";
import { calcularResumenSalud } from "../src/lib/resumenSalud";
import {
  chequearPresion, chequearMetricas, chequearSueno, chequearMediciones, fechaBuenosAires,
  type MetricaLeida,
} from "./lib/chequeosSalud";

const __dir = dirname(fileURLToPath(import.meta.url));
const MIEMBROS = ["juanpablo", "maria", "sofia", "federico"];

const args = process.argv.slice(2);
const argValor = (flag: string) => args.find((a) => a.startsWith(`--${flag}=`))?.split("=").slice(1).join("=");
const miembro = argValor("miembro") ?? "juanpablo";
if (!MIEMBROS.includes(miembro)) {
  console.error(`\n❌  Miembro inválido: "${miembro}". Válidos: ${MIEMBROS.join(", ")}\n`);
  process.exit(1);
}

let serviceAccount: unknown;
try {
  serviceAccount = JSON.parse(readFileSync(resolve(__dir, "service-account.json"), "utf8"));
} catch {
  console.error("\n❌  No se encontró scripts/service-account.json.\n");
  process.exit(1);
}
initializeApp({ credential: cert(serviceAccount as Parameters<typeof cert>[0]) });
const db = getFirestore();

const json = (o: unknown) => `\`${JSON.stringify(o)}\``;
const lista = <T>(xs: T[], f: (x: T) => string, max = 15) =>
  xs.length === 0 ? "ninguno" : xs.slice(0, max).map(f).join(", ") + (xs.length > max ? ` … (+${xs.length - max})` : "");

async function main(): Promise<void> {
  console.log(`\n── auditoria-calidad-salud · ${miembro} (solo lectura) ──\n`);
  const [metSnap, suenoSnap, medSnap] = await Promise.all([
    db.collection("metricas-salud").where("miembro", "==", miembro).get(),
    db.collection("sueno").where("miembro", "==", miembro).get(),
    db.collection("mediciones").where("miembro", "==", miembro).get(),
  ]);
  const metricas: MetricaLeida[] = metSnap.docs.map((d) => ({ ...(d.data() as MetricaSalud), idDoc: d.id }));
  const sueno = suenoSnap.docs.map((d) => d.data() as RegistroSueno);
  const mediciones = medSnap.docs.map((d) => d.data() as MedicionCorporal);
  const hoy = fechaBuenosAires(Date.now());

  const L: string[] = [];
  L.push(`# Calidad de los datos de salud — ${miembro} — ${hoy}\n`);
  L.push("> Generado por `scripts/auditoria-calidad-salud.ts` (P105). Solo lectura. " +
    "Contiene datos de salud personales: no commitear.\n");
  L.push(`Leído: ${metricas.length} métricas, ${sueno.length} tramos de sueño, ${mediciones.length} mediciones.\n`);

  // ── Presión ────────────────────────────────────────────────────────────────
  const p = chequearPresion(metricas, hoy);
  L.push("## 1. Presión arterial\n");
  L.push(`- días con sistólica: ${p.diasSistolica}; con diastólica: ${p.diasDiastolica}; con el par: ${p.diasConPar}`);
  L.push(`- solo sistólica: ${lista(p.soloSistolica, (x) => x)}`);
  L.push(`- solo diastólica: ${lista(p.soloDiastolica, (x) => x)}`);
  L.push(`- P4 invertidas (sistólica ≤ diastólica): ${lista(p.invertidas, (x) => `${x.fecha} ${x.sistolica}/${x.diastolica}`)}`);
  L.push(`- P4 fuera de 60–260 / 30–160: ${lista(p.fueraDeRango, (x) => `${x.fecha} ${x.sistolica ?? "—"}/${x.diastolica ?? "—"}`)}`);
  L.push(`- unidades: ${json(p.unidades)}; fuentes: ${json(p.fuentes)}; agregación: ${json(p.agregaciones)}`);
  L.push(`- P6 último dato: ${p.ultimaFecha ?? "—"} (hace ${p.diasDesdeUltima ?? "—"} días, al ${hoy})`);
  L.push(`- P5 Resumen (último día con los dos valores): ${p.ultimoParResumen ? `${p.ultimoParResumen.fecha} ${p.ultimoParResumen.sistolica}/${p.ultimoParResumen.diastolica}` : "—"}`);
  L.push(`- P5 Progreso (sistólica más nueva): ${p.ultimaSistolicaProgreso ? `${p.ultimaSistolicaProgreso.fecha} ${p.ultimaSistolicaProgreso.valor}` : "—"}`);
  const senales = calcularResumenSalud(metricas, sueno, mediciones, hoy);
  const sp = senales.find((s) => s.clave === "presion");
  L.push(`- P5 la tarjeta de Resumen hoy: ${sp ? `${sp.valorTexto ?? sp.valorActual} ${sp.unidad}, «medida el ${sp.fechaUltima ?? "—"}», estado ${sp.estado}` : "no aparece (sin par en los últimos 60 días)"}`);
  L.push("");

  // ── Métricas genéricas ─────────────────────────────────────────────────────
  L.push("## 2. Métricas genéricas (`/metricas-salud`)\n");
  L.push("| tipo | docs | primera | última | fuera de rango | unidades | unidad inesperada | fuentes | agregación | días duplicados | ids fuera del esquema |");
  L.push("|---|---|---|---|---|---|---|---|---|---|---|");
  const porTipo = chequearMetricas(metricas);
  for (const c of porTipo) {
    L.push(`| ${c.tipo} | ${c.total} | ${c.primera ?? "—"} | ${c.ultima ?? "—"} | ${c.fueraDeRango.length} | ${json(c.unidades)} | ${c.unidadInesperada} | ${json(c.fuentes)} | ${json(c.agregaciones)} | ${c.diasDuplicados.length} | ${c.idsFueraDeEsquema.length} |`);
  }
  L.push("");
  for (const c of porTipo.filter((c) => c.fueraDeRango.length > 0)) {
    L.push(`- **${c.tipo}** fuera de rango: ${lista(c.fueraDeRango, (x) => `${x.fecha} ${x.valor}`)}`);
  }
  const fcRep = senales.find((s) => s.clave === "fc-reposo");
  L.push(`- La señal «FC reposo» de Resumen hoy: ${fcRep ? `${fcRep.valorActual ?? "sin valor"} ${fcRep.unidad}, estado ${fcRep.estado}` : "no aparece"}`);
  L.push("");

  // ── Sueño ──────────────────────────────────────────────────────────────────
  const s = chequearSueno(sueno);
  L.push("## 3. Sueño (`/sueno`)\n");
  L.push(`- tramos: ${s.total}; sin inicio o fin en epoch: ${s.sinEpoch}; fuentes: ${json(s.fuentes)}`);
  L.push(`- horas fuera de (0, 16]: ${lista(s.horasFueraDeRango, (x) => `${x.fecha} ${x.horas.toFixed(1)} h`)}`);
  L.push(`- candidatos (no confirmados) con fecha distinta del día local de la hora de acostarse: ${s.fechaNoEsElInicio.length} — ${lista(s.fechaNoEsElInicio, (x) => `guardada ${x.fecha}, inicio ${x.inicio}`)}`);
  L.push(`- tramos con el mismo inicio: ${lista(s.iniciosRepetidos, (x) => x)}; idénticos (inicio y fin): ${lista(s.tramosIdenticos, (x) => x)}`);
  L.push("");

  // ── Mediciones ─────────────────────────────────────────────────────────────
  const m = chequearMediciones(mediciones);
  L.push("## 4. Peso y mediciones (`/mediciones`)\n");
  L.push(`- mediciones: ${m.total}; fuentes: ${json(m.fuentes)}`);
  L.push(`- fuera de rango: ${lista(m.fueraDeRango, (x) => `${x.fecha} ${x.campo}=${x.valor}`)}`);
  L.push(`- días con más de una medición de la misma fuente: ${m.diasRepetidos.length} — ${lista(m.diasRepetidos, (x) => x)}`);
  L.push(`- días con dos mediciones idénticas (peso y grasa): ${m.diasDuplicadoExacto.length} — ${lista(m.diasDuplicadoExacto, (x) => x)}`);
  L.push(`- días con varias fuentes: ${m.diasConVariasFuentes.length} — ${lista(m.diasConVariasFuentes, (x) => x)}`);
  L.push("");

  const nombre = basename(argValor("salida") ?? `calidad-salud-${miembro}-${hoy}.md`);
  const dir = resolve(__dir, "..", "docs", "auditorias");
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, nombre), L.join("\n"), "utf8");
  console.log(L.join("\n"));
  console.log(`\n✅  Reporte escrito en docs/auditorias/${nombre} (nada se escribió en Firestore)\n`);
}

await main();
