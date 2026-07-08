// ════════════════════════════════════════════════════════════════════════════
//  scripts/limpiar-salud.ts — Depura el módulo de salud en Firestore.
//
//  SOLO toca /mediciones, /cardio, /sueno, /metricas-salud (y /historial con
//  --limpiar-biometria). NUNCA toca /rutinas, /sesiones, /programas, /ejercicios
//  ni /config.
//
//  Uso:
//    npx tsx scripts/limpiar-salud.ts --miembro=juanpablo            # dry-run
//    npx tsx scripts/limpiar-salud.ts --miembro=juanpablo --confirmar
//    npx tsx scripts/limpiar-salud.ts --todos --confirmar
//
//  Flags:
//    --miembro=<id>         Obligatorio (o --todos para los 4 miembros).
//    --confirmar            Sin este flag es dry-run: solo cuenta, no borra.
//    --incluir-manual       También borra fuente=="manual". Default: solo "samsung-health-csv".
//    --colecciones=a,b      Subconjunto: mediciones,cardio,sueno,metricas-salud.
//    --limpiar-biometria    En /historial: elimina campo biometria y campos de
//                           enriquecimiento (fcPico, fcFinSerie, recuperacionBpm)
//                           de series. No toca inicioMs/finMs ni otros campos.
//
//  Patrón de scripts/ (hotfix P55, ver scripts/pureza.test.ts): solo
//  firebase-admin + módulos puros de src/lib/ o src/import/. Nunca src/data/
//  ni src/firebase.ts (SDK cliente, usa import.meta.env — crashea bajo tsx).
// ════════════════════════════════════════════════════════════════════════════

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));

// ── Miembros válidos (espejo de MIEMBRO_IDS en models.ts) ────────────────────
const MIEMBROS_VALIDOS = ["juanpablo", "maria", "sofia", "federico"] as const;
type Miembro = typeof MIEMBROS_VALIDOS[number];

// ── Colecciones de salud ──────────────────────────────────────────────────────
const COLECCIONES_SALUD = ["mediciones", "cardio", "sueno", "metricas-salud"] as const;
type ColeccionSalud = typeof COLECCIONES_SALUD[number];

// ── Parse de argumentos ───────────────────────────────────────────────────────
const args = process.argv.slice(2);

function argValor(flag: string): string | undefined {
  const arg = args.find((a) => a.startsWith(`--${flag}=`));
  return arg?.split("=").slice(1).join("=");
}

const confirmar      = args.includes("--confirmar");
const incluirManual  = args.includes("--incluir-manual");
const todos          = args.includes("--todos");
const limpiarBio     = args.includes("--limpiar-biometria");
const miembroFlag    = argValor("miembro");
const coleccionesFlag = argValor("colecciones");

// Validar miembros
let miembros: Miembro[];
if (todos) {
  miembros = [...MIEMBROS_VALIDOS];
} else if (miembroFlag) {
  if (!(MIEMBROS_VALIDOS as readonly string[]).includes(miembroFlag)) {
    console.error(
      `\n❌  Miembro inválido: "${miembroFlag}".\n` +
      `   Válidos: ${MIEMBROS_VALIDOS.join(", ")}\n`,
    );
    process.exit(1);
  }
  miembros = [miembroFlag as Miembro];
} else {
  console.error(
    "\n❌  Falta --miembro=<id> (o --todos para los 4 miembros).\n" +
    "   Ejemplo: npx tsx scripts/limpiar-salud.ts --miembro=juanpablo\n",
  );
  process.exit(1);
}

// Validar colecciones
let colecciones: ColeccionSalud[];
if (coleccionesFlag) {
  const pedidas = coleccionesFlag.split(",").map((s) => s.trim());
  const invalidas = pedidas.filter((c) => !(COLECCIONES_SALUD as readonly string[]).includes(c));
  if (invalidas.length > 0) {
    console.error(
      `\n❌  Colecciones inválidas: ${invalidas.join(", ")}.\n` +
      `   Válidas: ${COLECCIONES_SALUD.join(", ")}\n`,
    );
    process.exit(1);
  }
  colecciones = pedidas as ColeccionSalud[];
} else {
  colecciones = [...COLECCIONES_SALUD];
}

// Fuentes a borrar
const fuentes = ["samsung-health-csv", ...(incluirManual ? ["manual"] : [])];

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

const BATCH_SIZE = 500;

/** Borra documentos en batches de ≤500. Devuelve cantidad borrada y errores. */
async function borrarEnBatches(
  refs: FirebaseFirestore.DocumentReference[],
  label: string,
): Promise<{ borrados: number; errores: number }> {
  let borrados = 0;
  let errores = 0;
  for (let i = 0; i < refs.length; i += BATCH_SIZE) {
    const chunk = refs.slice(i, i + BATCH_SIZE);
    const batch = db.batch();
    for (const ref of chunk) batch.delete(ref);
    try {
      await batch.commit();
      borrados += chunk.length;
      if (refs.length > BATCH_SIZE) {
        console.log(`  ${label}: batch ${Math.floor(i / BATCH_SIZE) + 1} — ${borrados}/${refs.length} borrados…`);
      }
    } catch (e) {
      errores += chunk.length;
      console.error(`  ❌ Error en batch (${label}): ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  return { borrados, errores };
}

/** Limpia biometría de un historial en batches de ≤500 updates. */
async function limpiarBiometriaEnBatches(
  docs: FirebaseFirestore.QueryDocumentSnapshot[],
): Promise<{ actualizados: number; errores: number }> {
  const refs = docs.filter((d) => d.get("biometria") != null);
  let actualizados = 0;
  let errores = 0;
  for (let i = 0; i < refs.length; i += BATCH_SIZE) {
    const chunk = refs.slice(i, i + BATCH_SIZE);
    const batch = db.batch();
    for (const snap of chunk) {
      const bloques = snap.get("bloques") as BloqueRaw[] | undefined;
      const bloquesLimpios = bloques
        ? bloques.map((b) => ({
            ...b,
            series: (b.series ?? []).map(({ fcPico: _fp, fcFinSerie: _fs, recuperacionBpm: _rb, ...restSerie }) => restSerie),
          }))
        : undefined;
      const update: Record<string, unknown> = { biometria: FieldValue.delete() };
      if (bloquesLimpios) update.bloques = bloquesLimpios;
      batch.update(snap.ref, update);
    }
    try {
      await batch.commit();
      actualizados += chunk.length;
    } catch (e) {
      errores += chunk.length;
      console.error(`  ❌ Error en batch historial: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  return { actualizados, errores };
}

interface SerieRaw {
  fcPico?: unknown;
  fcFinSerie?: unknown;
  recuperacionBpm?: unknown;
  [key: string]: unknown;
}
interface BloqueRaw {
  series?: SerieRaw[];
  [key: string]: unknown;
}

// ── Lógica principal ──────────────────────────────────────────────────────────

type Resumen = {
  col: string;
  cantidad: number;
  borrados?: number;
  errores?: number;
};

async function procesarMiembro(miembro: Miembro): Promise<void> {
  console.log(`\n${"─".repeat(68)}`);
  console.log(
    `── limpiar-salud · miembro: ${miembro} · fuente: ${fuentes.join(", ")} ──`,
  );
  if (!confirmar) console.log("   (DRY-RUN)");
  console.log();

  const resumen: Resumen[] = [];
  let totalErrores = 0;

  // ── Colecciones de salud ─────────────────────────────────────────────────
  for (const col of colecciones) {
    const snap = await db.collection(col).where("miembro", "==", miembro).get();
    const docs = snap.docs.filter((d) => fuentes.includes(d.get("fuente")));
    const res: Resumen = { col: `/${col}`, cantidad: docs.length };

    if (confirmar && docs.length > 0) {
      const { borrados, errores } = await borrarEnBatches(docs.map((d) => d.ref), col);
      res.borrados = borrados;
      res.errores  = errores;
      totalErrores += errores;
    }

    resumen.push(res);
  }

  // ── Biometría de historial ───────────────────────────────────────────────
  if (limpiarBio) {
    const histSnap = await db.collection("historial").where("miembro", "==", miembro).get();
    const conBio = histSnap.docs.filter((d) => d.get("biometria") != null);
    const res: Resumen = { col: "/historial", cantidad: conBio.length };

    if (confirmar && conBio.length > 0) {
      const { actualizados, errores } = await limpiarBiometriaEnBatches(histSnap.docs);
      res.borrados = actualizados;
      res.errores  = errores;
      totalErrores += errores;
    }

    resumen.push(res);
  }

  // ── Imprimir resumen ─────────────────────────────────────────────────────
  const maxCol = Math.max(...resumen.map((r) => r.col.length), 16);
  for (const r of resumen) {
    const pad = maxCol - r.col.length;
    const espacio = " ".repeat(pad + 2);
    if (r.cantidad === 0) {
      console.log(`${r.col}${espacio}  (sin datos)`);
    } else if (confirmar && r.borrados !== undefined) {
      const sufijo = r.errores ? `  ⚠ ${r.errores} errores` : "";
      console.log(`${r.col}${espacio}  ${r.borrados} ${limpiarBio && r.col === "/historial" ? "actualizados" : "borrados"}${sufijo}`);
    } else {
      console.log(`${r.col}${espacio}  ${r.cantidad} a ${limpiarBio && r.col === "/historial" ? "limpiar" : "borrar"}`);
    }
  }

  if (!limpiarBio) {
    const bioLabel = " ".repeat(maxCol - "/historial".length + 2);
    console.log(`/historial${bioLabel}  —  (sin --limpiar-biometria)`);
  }

  if (!confirmar) {
    console.log("\nDRY-RUN: no se borró nada. Repetí con --confirmar para ejecutar.");
  } else {
    const totalBorrados = resumen.reduce((s, r) => s + (r.borrados ?? 0), 0);
    console.log(`\nTotal: ${totalBorrados} operaciones completadas.`);
    if (totalErrores > 0) console.log(`⚠ ${totalErrores} errores — revisá la salida arriba.`);
  }
}

// ── Runner ────────────────────────────────────────────────────────────────────

for (const miembro of miembros) {
  await procesarMiembro(miembro);
}

process.exit(0);
