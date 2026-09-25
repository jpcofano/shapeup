// ════════════════════════════════════════════════════════════════════════════
//  scripts/limpiar-salud.ts — Depura el módulo de salud en Firestore.
//
//  ⚠ NO CORRER TODAVÍA, NI SIQUIERA EN SIMULACIÓN, HASTA QUE JUAN LO DIGA (P87).
//  Es el único script que borra, P87 le cambió el comportamiento (planifica todo,
//  respalda y recién después borra) y su salida real nunca se vio.
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
//    --confirmar            Sin este flag es simulación: solo cuenta, no borra.
//                           (--aplicar hace lo mismo, P87.) Antes de borrar
//                           escribe un respaldo con todo lo que se va.
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
import { correr } from "./lib/corrida";

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

/** Los bloques sin los campos de enriquecimiento por serie. No toca nada más. */
function bloquesSinEnriquecimiento(bloques: BloqueRaw[] | undefined): BloqueRaw[] | undefined {
  return bloques
    ? bloques.map((b) => ({
        ...b,
        series: (b.series ?? []).map(({ fcPico: _fp, fcFinSerie: _fs, recuperacionBpm: _rb, ...restSerie }) => restSerie),
      }))
    : undefined;
}

// ── Lógica principal ──────────────────────────────────────────────────────────

type Resumen = {
  col: string;
  cantidad: number;
  /** Guarda anti-mentira (hotfix P56-b): si cantidad=0, por qué — para no confundir
   *  "0 real" con "el filtro está roto". Nunca decir "(sin datos)" sin haberlo chequeado. */
  advertencia?: string;
};

/**
 * Diagnostica un `cantidad === 0` antes de reportarlo como "(sin datos)": compara
 * contra el conteo SIN filtro de miembro/fuente. Si la colección tiene documentos
 * en general (de cualquier miembro/fuente) pero el filtro dio 0, es sospechoso de
 * un filtro roto (nombre de campo distinto, esquema cambiado) — nunca "(sin datos)"
 * a ciegas (hotfix P56-b, ver auditoría 2026-07-08/09).
 */
async function diagnosticarCero(
  col: string, miembro: string, docsMiembroSinFiltroFuente: number,
): Promise<string | undefined> {
  if (docsMiembroSinFiltroFuente > 0) {
    return `0 con filtro fuente=[${fuentes.join(", ")}] — hay ${docsMiembroSinFiltroFuente} docs del miembro con otra fuente`;
  }
  const totalSnap = await db.collection(col).count().get();
  const total = totalSnap.data().count;
  if (total > 0) {
    return `0 con filtro miembro=="${miembro}" — la colección tiene ${total} docs en total (¿campo "miembro" correcto?)`;
  }
  return undefined; // la colección está genuinamente vacía
}

/** Lo que se va a hacer con un miembro, antes de hacer nada. */
interface PlanMiembro {
  miembro: Miembro;
  resumen: Resumen[];
  borrar: { col: ColeccionSalud; docs: FirebaseFirestore.QueryDocumentSnapshot[] }[];
  /** /historial con biometría a limpiar (solo con --limpiar-biometria). */
  conBio: FirebaseFirestore.QueryDocumentSnapshot[];
}

async function planificarMiembro(miembro: Miembro): Promise<PlanMiembro> {
  const plan: PlanMiembro = { miembro, resumen: [], borrar: [], conBio: [] };

  for (const col of colecciones) {
    const snap = await db.collection(col).where("miembro", "==", miembro).get();
    const docs = snap.docs.filter((d) => fuentes.includes(d.get("fuente")));
    const res: Resumen = { col: `/${col}`, cantidad: docs.length };
    if (docs.length === 0) res.advertencia = await diagnosticarCero(col, miembro, snap.docs.length);
    else plan.borrar.push({ col, docs });
    plan.resumen.push(res);
  }

  if (limpiarBio) {
    const histSnap = await db.collection("historial").where("miembro", "==", miembro).get();
    plan.conBio = histSnap.docs.filter((d) => d.get("biometria") != null);
    plan.resumen.push({ col: "/historial", cantidad: plan.conBio.length });
  }
  return plan;
}

function imprimirPlan(plan: PlanMiembro): void {
  console.log(`\n${"─".repeat(68)}`);
  console.log(`── limpiar-salud · miembro: ${plan.miembro} · fuente: ${fuentes.join(", ")} ──\n`);
  const maxCol = Math.max(...plan.resumen.map((r) => r.col.length), 16);
  for (const r of plan.resumen) {
    const espacio = " ".repeat(maxCol - r.col.length + 2);
    if (r.cantidad === 0) {
      console.log(`${r.col}${espacio}  ${r.advertencia ? `⚠ ${r.advertencia}` : "(sin datos)"}`);
    } else {
      console.log(`${r.col}${espacio}  ${r.cantidad} a ${r.col === "/historial" ? "limpiar" : "borrar"}`);
    }
  }
  if (!limpiarBio) {
    console.log(`/historial${" ".repeat(maxCol - "/historial".length + 2)}  —  (sin --limpiar-biometria)`);
  }
}

// ── Runner ────────────────────────────────────────────────────────────────────
// P87: corre con `scripts/lib/corrida.ts`. Antes salía siempre con código 0,
// aunque fallaran batches, y borraba sin respaldo. Ahora planifica todos los
// miembros primero, escribe el respaldo con el contenido de TODO lo que va a
// borrar o limpiar, y recién entonces toca Firestore. `--confirmar` sigue
// valiendo (está documentado en CLAUDE.md), igual que `--aplicar`.

await correr("limpiar-salud", async (c) => {
  const planes: PlanMiembro[] = [];
  for (const miembro of miembros) {
    const plan = await planificarMiembro(miembro);
    imprimirPlan(plan);
    planes.push(plan);
  }
  console.log();

  const respaldo = planes.flatMap((p) => [
    ...p.borrar.flatMap(({ col, docs }) => docs.map((d) => ({ col, id: d.id, antes: d.data() }))),
    ...p.conBio.map((d) => ({
      col: "historial", id: d.id, biometriaAntes: d.get("biometria"), bloquesAntes: d.get("bloques") ?? null,
    })),
  ]);
  if (respaldo.length === 0) return;
  if (!c.abrirRespaldo(respaldo)) return;

  for (const p of planes) {
    for (const { col, docs } of p.borrar) {
      for (let i = 0; i < docs.length; i += BATCH_SIZE) {
        const chunk = docs.slice(i, i + BATCH_SIZE);
        await c.escribir(`${p.miembro} /${col} batch ${Math.floor(i / BATCH_SIZE) + 1}: borrar ${chunk.length}`, () => {
          const batch = db.batch();
          for (const d of chunk) batch.delete(d.ref);
          return batch.commit();
        }, chunk.length);
      }
    }
    for (let i = 0; i < p.conBio.length; i += BATCH_SIZE) {
      const chunk = p.conBio.slice(i, i + BATCH_SIZE);
      await c.escribir(`${p.miembro} /historial batch ${Math.floor(i / BATCH_SIZE) + 1}: limpiar biometría de ${chunk.length}`, () => {
        const batch = db.batch();
        for (const snap of chunk) {
          const update: Record<string, unknown> = { biometria: FieldValue.delete() };
          const bloquesLimpios = bloquesSinEnriquecimiento(snap.get("bloques") as BloqueRaw[] | undefined);
          if (bloquesLimpios) update.bloques = bloquesLimpios;
          batch.update(snap.ref, update);
        }
        return batch.commit();
      }, chunk.length);
    }
  }
}, { flagsAplicar: ["--aplicar", "--confirmar"] });
