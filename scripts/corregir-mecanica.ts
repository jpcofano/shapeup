// ════════════════════════════════════════════════════════════════════════════
//  scripts/corregir-mecanica.ts — cuatro fichas de /ejercicios mal marcadas
//  como `mecanica: "Aislamiento"` cuando son compuestas (P73, segunda vuelta).
//
//  Por qué importa: el ranking de sustitución (`lib/sustitucion.ts`) da +10 al
//  candidato que comparte `mecanica` con el original. Con "Remo alternado con
//  pesas rusas" marcado como aislamiento, ese bono se lo llevaba el
//  "Encogimiento de espalda media" —que sí es aislamiento— y ningún remo real.
//  El dato equivocado empujaba un accesorio arriba de los sustitutos buenos.
//
//  El mismo cambio ya está aplicado en `catalogo-ejercicios.json`, que es la
//  fuente para sembrar. Esto es para los documentos que YA están en Firestore.
//
//  Uso (desde la RAÍZ del repo):
//    npx tsx scripts/corregir-mecanica.ts              # simulación (default)
//    npx tsx scripts/corregir-mecanica.ts --aplicar    # escribe
//
//  Escribe con `update()` y solo el campo `mecanica`: no toca nada más de la
//  ficha, y es idempotente —correrlo dos veces deja lo mismo—. Si un documento
//  ya está en "Compuesto", se informa y se saltea.
// ════════════════════════════════════════════════════════════════════════════

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const aplicar = process.argv.includes("--aplicar");

/**
 * Las cuatro, con el motivo al lado. El id es lo que manda; el nombre está
 * para que el informe se lea y para verificar que no se apunte a otra ficha.
 */
const CORRECCIONES: { id: string; nombre: string; motivo: string }[] = [
  {
    id: "EJ-0019",
    nombre: "Remo alternado con pesas rusas",
    motivo: "remo: cadera, hombro y codo — multiarticular",
  },
  {
    id: "EJ-0437",
    nombre: "Remo con barra curva acostado",
    motivo: "remo: hombro y codo — multiarticular",
  },
  {
    id: "EJ-0337",
    nombre: "Remo en banco inclinado con mancuernas",
    motivo: "remo: hombro y codo — multiarticular",
  },
  {
    id: "EJ-0328",
    nombre: "Sentadilla profunda abrazando la pelota",
    motivo: "sentadilla: cadera, rodilla y tobillo — multiarticular",
  },
];

const NUEVA_MECANICA = "Compuesto";

const serviceAccount = JSON.parse(
  readFileSync(resolve(__dir, "service-account.json"), "utf8"),
);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function run() {
  console.log(`\nCorrección de mecánica — modo: ${aplicar ? "ESCRITURA" : "SIMULACIÓN"}\n`);

  const aEscribir: { id: string; nombre: string; desde: string }[] = [];
  const yaEstaban: string[] = [];
  const noEncontrados: string[] = [];
  const nombreDistinto: { id: string; esperado: string; encontrado: string }[] = [];

  for (const c of CORRECCIONES) {
    const snap = await db.collection("ejercicios").doc(c.id).get();
    if (!snap.exists) {
      noEncontrados.push(c.id);
      continue;
    }
    const data = snap.data() as { nombre?: string; mecanica?: string };

    // Guardia: si el nombre no coincide, el id apunta a otra ficha y no se toca.
    if (data.nombre !== c.nombre) {
      nombreDistinto.push({ id: c.id, esperado: c.nombre, encontrado: data.nombre ?? "(sin nombre)" });
      continue;
    }

    if (data.mecanica === NUEVA_MECANICA) {
      yaEstaban.push(c.id);
      continue;
    }

    aEscribir.push({ id: c.id, nombre: c.nombre, desde: data.mecanica ?? "(sin mecánica)" });
    console.log(`  ${c.id}  ${c.nombre}`);
    console.log(`      ${data.mecanica ?? "(sin mecánica)"} → ${NUEVA_MECANICA}   (${c.motivo})`);
  }

  console.log(`\n  a corregir : ${aEscribir.length}`);
  if (yaEstaban.length > 0)      console.log(`  ya estaban : ${yaEstaban.join(", ")}`);
  if (noEncontrados.length > 0)  console.log(`  ⚠ no existen en /ejercicios: ${noEncontrados.join(", ")}`);
  for (const n of nombreDistinto) {
    console.log(`  ⚠ ${n.id} NO se toca: esperaba "${n.esperado}" y encontré "${n.encontrado}"`);
  }

  if (!aplicar) {
    console.log("\n  [simulación] No se escribió nada. Corré con --aplicar para escribir.\n");
    return;
  }

  let escritos = 0;
  for (const e of aEscribir) {
    await db.collection("ejercicios").doc(e.id).update({ mecanica: NUEVA_MECANICA });
    escritos++;
  }
  console.log(`\n  ✅ ${escritos} fichas corregidas con update().\n`);
}

run().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
