// ════════════════════════════════════════════════════════════════════════════
//  scripts/rematch-salud.ts — Re-corre el match biométrico SIN el ZIP.
//
//  Motivo (S-fix, P55): el enriquecimiento normal necesita el ZIP porque de ahí
//  saca `sesionesSamsung` (con inicioMs/finMs). Pero /cardio ya persiste
//  inicioMs/finMs (S-audit-b, P54) — así que el mismo match se puede correr
//  contra lo que ya está en Firestore, sin re-subir el export. Útil para
//  diagnosticar o reparar matches que fallaron en el import (ver auditoría).
//
//  Sin curvas de FC (live_data.json no se persiste): la biometría siempre sale
//  con granularidad "sesion". Suficiente para validar que el match funciona;
//  si hace falta la curva fina hay que re-importar el ZIP.
//
//  NO usa `calcularEnriquecimiento` a ciegas: para el diagnóstico dry-run
//  replica manualmente el mismo algoritmo (mismo orden, mismo pool sin
//  reutilizar datauuid) con `elegirSesionSamsung`/`ventanaDeHistorial`
//  directamente, porque necesita el detalle por Historial (Δinicio en min)
//  que el resultado agregado no expone. Para `--confirmar` sí usa
//  `calcularEnriquecimiento` tal cual (sin tocarlo) para persistir.
//
//  Uso:
//    npx tsx scripts/rematch-salud.ts --miembro=juanpablo            # dry-run
//    npx tsx scripts/rematch-salud.ts --miembro=juanpablo --confirmar
//    npx tsx scripts/rematch-salud.ts --help
//
//  Patrón de scripts/ (hotfix P55, ver scripts/pureza.test.ts): solo
//  firebase-admin + módulos puros de src/lib/ o src/import/. Nunca src/data/
//  ni src/firebase.ts (SDK cliente, usa import.meta.env — crashea bajo tsx).
//  Este script fue justamente el que rompió esto la primera vez.
// ════════════════════════════════════════════════════════════════════════════

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

import type { Historial, SesionCardio, PerfilesConfig } from "../src/types/models";
import { elegirSesionSamsung, type SesionSamsung } from "../src/lib/matchBiometrico";
import { ventanaDeHistorial, calcularEnriquecimiento } from "../src/lib/enriquecerImport";

const __dir = dirname(fileURLToPath(import.meta.url));

// ── Miembros válidos (espejo de MIEMBRO_IDS en models.ts) ────────────────────
const MIEMBROS_VALIDOS = ["juanpablo", "maria", "sofia", "federico"] as const;
type Miembro = typeof MIEMBROS_VALIDOS[number];

// ── Parse de argumentos ───────────────────────────────────────────────────────
const args = process.argv.slice(2);
function argValor(flag: string): string | undefined {
  const arg = args.find((a) => a.startsWith(`--${flag}=`));
  return arg?.split("=").slice(1).join("=");
}
const confirmar   = args.includes("--confirmar");
const miembroFlag = argValor("miembro");

// --help sale 0 sin tocar service-account.json ni Firebase Admin — sirve
// también como smoke test de que el import chain (solo lib/ puro) no
// arrastra el SDK cliente (ver nota de pureza en lib/enriquecerImport.ts).
if (args.includes("--help") || args.includes("-h")) {
  console.log(
    "\nUso:\n" +
    "  npx tsx scripts/rematch-salud.ts --miembro=<id>              (dry-run)\n" +
    "  npx tsx scripts/rematch-salud.ts --miembro=<id> --confirmar\n\n" +
    `Miembros válidos: ${MIEMBROS_VALIDOS.join(", ")}\n`,
  );
  process.exit(0);
}

if (!miembroFlag || !(MIEMBROS_VALIDOS as readonly string[]).includes(miembroFlag)) {
  console.error(
    "\n❌  Falta --miembro=<id> válido.\n" +
    `   Válidos: ${MIEMBROS_VALIDOS.join(", ")}\n` +
    "   Ejemplo: npx tsx scripts/rematch-salud.ts --miembro=juanpablo\n",
  );
  process.exit(1);
}
const miembro = miembroFlag as Miembro;

// ── Init Firebase Admin ───────────────────────────────────────────────────────
let serviceAccount: unknown;
try {
  serviceAccount = JSON.parse(readFileSync(resolve(__dir, "service-account.json"), "utf8"));
} catch {
  console.error(
    "\n❌  No se encontró scripts/service-account.json.\n" +
    "   Descargalo desde Firebase Console → Configuración del proyecto → Cuentas de servicio.\n",
  );
  process.exit(1);
}
initializeApp({ credential: cert(serviceAccount as Parameters<typeof cert>[0]) });
const db = getFirestore();

// ── Helpers ───────────────────────────────────────────────────────────────────

const CUSTOM_ID_SHAPEUP = "__shapeup__";

/**
 * Construye SesionSamsung[] desde los docs de /cardio que tienen inicioMs/finMs.
 * idCardio tiene la forma "CAR-{uuid}"; el uuid se recupera quitando el prefijo.
 * Las sesiones con actividad === "ShapeUp" reciben un customId sintético para
 * poder reusar `elegirSesionSamsung`/`calcularEnriquecimiento` sin tocarlos.
 */
function construirSesionesSamsung(cardio: SesionCardio[]): SesionSamsung[] {
  return cardio
    .filter((c) => c.inicioMs != null && c.finMs != null)
    .map((c) => ({
      datauuid: c.idCardio.replace(/^CAR-/, ""),
      startMs:  c.inicioMs!,
      endMs:    c.finMs!,
      customId: c.actividad === "ShapeUp" ? CUSTOM_ID_SHAPEUP : undefined,
      fcMedia:  c.fcPromedio,
      fcMax:    c.fcMaxima,
      kcal:     c.kcal,
    }));
}

function minutos(ms: number): string {
  const signo = ms < 0 ? "-" : "+";
  return `${signo}${Math.round(Math.abs(ms) / 60_000)} min`;
}

// ── Runner ────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log(`\n── rematch-salud · miembro: ${miembro} ${confirmar ? "" : "(DRY-RUN)"} ──\n`);

  const [historialSnap, cardioSnap, perfilesSnap] = await Promise.all([
    db.collection("historial").where("miembro", "==", miembro).get(),
    db.collection("cardio").where("miembro", "==", miembro).get(),
    db.collection("config").doc("perfiles").get(),
  ]);

  const historial = historialSnap.docs.map((d) => d.data() as Historial);
  const cardio    = cardioSnap.docs.map((d) => d.data() as SesionCardio);
  const perfiles  = (perfilesSnap.exists ? perfilesSnap.data() : {}) as PerfilesConfig;
  const perfil    = perfiles[miembro];

  const sesionesSamsung = construirSesionesSamsung(cardio);
  console.log(`/historial: ${historial.length} · /cardio: ${cardio.length} (${sesionesSamsung.length} con inicioMs/finMs para matchear)\n`);

  if (sesionesSamsung.length === 0) {
    console.log("Sin candidatas: ningún doc de /cardio tiene inicioMs/finMs (importalos primero con S-audit-b/P54, o re-importá el ZIP).");
    process.exit(0);
  }

  // ── Diagnóstico por Historial (mismo algoritmo que calcularEnriquecimiento,
  //    replicado acá porque necesita detalle — Δinicio — que el resultado
  //    agregado no expone). No persiste nada.
  const ordenado = [...historial].sort((a, b) => a.fechaRealizada.localeCompare(b.fechaRealizada));
  const usados = new Set<string>();
  let matcheadas = 0, sinMatch = 0, omitidas = 0, sinVentana = 0;

  for (const h of ordenado) {
    if (h.biometria?.granularidad === "serie") {
      omitidas++;
      console.log(`${h.idHist}  ${h.fechaRealizada}  — omitida (ya tiene curva fina)`);
      continue;
    }
    const ventana = ventanaDeHistorial(h);
    if (!ventana) {
      sinVentana++;
      console.log(`${h.idHist}  ${h.fechaRealizada}  — sin ventana (no se pudo evaluar)`);
      continue;
    }
    const candidatas = sesionesSamsung.filter((s) => !usados.has(s.datauuid));
    const match = elegirSesionSamsung(ventana, candidatas, CUSTOM_ID_SHAPEUP);
    if (!match) {
      sinMatch++;
      console.log(`${h.idHist}  ${h.fechaRealizada}  — sin match`);
      continue;
    }
    usados.add(match.sesion.datauuid);
    matcheadas++;
    const delta = minutos(match.sesion.startMs - ventana.inicioMs);
    console.log(`${h.idHist}  ${h.fechaRealizada}  — matcheó por ${match.matchPor} · Δinicio ${delta}`);
  }

  console.log(
    `\nResumen: ${matcheadas} matcheadas · ${sinMatch} sin match · ` +
    `${omitidas} omitidas (ya enriquecidas) · ${sinVentana} sin ventana\n`,
  );

  if (!confirmar) {
    console.log("DRY-RUN: no se escribió nada. Repetí con --confirmar para persistir.");
    process.exit(0);
  }

  // ── Persistir: usa calcularEnriquecimiento (sin tocar) para el cálculo real ──
  const resultado = calcularEnriquecimiento(
    historial,
    { sesionesSamsung, liveData: {}, shapeUpCustomId: CUSTOM_ID_SHAPEUP },
    perfil,
  );

  if (resultado.updates.length === 0) {
    console.log("Nada para persistir.");
    process.exit(0);
  }

  let escritos = 0, errores = 0;
  for (const { idHist, biometria, bloques } of resultado.updates) {
    const patch: Record<string, unknown> = { biometria };
    if (bloques) patch.bloques = bloques;
    try {
      await db.collection("historial").doc(idHist).update(patch);
      escritos++;
    } catch (e) {
      errores++;
      console.error(`  ❌ Error escribiendo ${idHist}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  console.log(`\n✅  ${escritos} historiales actualizados con biometría (granularidad "sesion").`);
  if (errores > 0) console.log(`⚠ ${errores} errores — revisá la salida arriba.`);
}

await main();
process.exit(0);
