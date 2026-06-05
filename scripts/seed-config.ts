// ════════════════════════════════════════════════════════════════════════════
//  scripts/seed-config.ts — Siembra los documentos de /config en Firestore.
//  Crea: familia, diccionarios, metodologia (perfiles y visibilidad en blanco).
//
//  Uso: npx tsx scripts/seed-config.ts
//  Flags: --dry-run  (muestra qué haría sin escribir)
//         --force    (sobreescribe documentos existentes)
// ════════════════════════════════════════════════════════════════════════════

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));

// ── Args ──────────────────────────────────────────────────────────────────────
const dryRun = process.argv.includes("--dry-run");
const force  = process.argv.includes("--force");

// ── Init ──────────────────────────────────────────────────────────────────────
const serviceAccount = JSON.parse(
  readFileSync(resolve(__dir, "service-account.json"), "utf8"),
);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// ── Leer emails desde archivo local (gitignoreado) ────────────────────────────
const familiaLocalPath = resolve(__dir, "data/familia.local.json");
let miembrosLocal: unknown;
try {
  miembrosLocal = JSON.parse(readFileSync(familiaLocalPath, "utf8"));
} catch {
  console.error(
    "\n❌  Error: no se encontró scripts/data/familia.local.json.\n" +
    "   Copiá scripts/data/familia.example.json a scripts/data/familia.local.json\n" +
    "   y reemplazá los emails placeholder con los reales.\n",
  );
  process.exit(1);
}

// ════════════════════════════════════════════════════════════════════════════
//  Documentos a sembrar
// ════════════════════════════════════════════════════════════════════════════

const familia = {
  owner: "juanpablo",
  timezone: "America/Argentina/Buenos_Aires",
  semanaArrancaEn: "lunes",
  miembros: miembrosLocal,
};

const metodologia = {
  version: 1,
  ultimaActualizacion: FieldValue.serverTimestamp(),
  principios: [
    {
      titulo: "Esfuerzo (RIR)",
      detalle: "Cada serie se termina dejando 1–3 reps en el tanque (RIR 1–3). Nunca al fallo en los primeros ciclos.",
    },
    {
      titulo: "Doble progresión",
      detalle: "Primero sumás reps dentro del rango objetivo. Cuando llegás al tope en todas las series, subís la carga y volvés al piso.",
    },
    {
      titulo: "Tempo de bajada",
      detalle: "Fase excéntrica de 2–3 segundos. No rebotar, no tirar con impulso.",
    },
  ],
  estructuraSesionFuerza: [
    "Calentamiento general 5–7 min",
    "Bloque principal 30–40 min (bloques A y B)",
    "Vuelta a la calma / movilidad 5 min",
  ],
  ordenProgresion: [
    "+ reps (dentro del rango)",
    "+ serie (de 3 a 4)",
    "Mejorar tempo (bajar más lento)",
    "+ carga (subir 2.5 kg y volver al piso de reps)",
  ],
};

const diccionarios = {
  version: 1,
  ultimaActualizacion: FieldValue.serverTimestamp(),
  modalidades:        ["Fuerza", "Cardio", "Movilidad", "Isométrico"],
  mecanicas:          ["Compuesto", "Aislamiento"],
  gruposMusculares:   [
    "Pecho","Espalda","Dorsales","Espalda media","Lumbares","Trapecios",
    "Hombros","Bíceps","Tríceps","Antebrazos","Cuello",
    "Core","Glúteos","Cuádriceps","Isquios","Pantorrillas",
    "Abductores","Aductores","Cuerpo completo","Cardiovascular",
  ],
  patrones:           [
    "Empuje horizontal","Empuje vertical",
    "Tracción horizontal","Tracción vertical",
    "Dominante de rodilla","Dominante de cadera","Zancada / unilateral",
    "Core anti-extensión","Core anti-rotación","Core flexión",
    "Locomoción / cardio","Aislamiento",
  ],
  equipos:            [
    "Peso corporal","Mancuernas","Barra de dominadas","Barra","Discos",
    "Kettlebell","Banda elástica","TRX / anillas","Banco","Máquina","Polea",
    "Máquina de cardio","Cuerda","Rueda abdominal","VR","Otro",
  ],
  niveles:            ["Principiante","Intermedio","Avanzado"],
  focosRutina:        ["Cuerpo completo","Tren superior","Tren inferior","Empuje (Push)","Tracción (Pull)","Pierna","Core","Cardio / HIIT","Movilidad","VR"],
  objetivos:          ["Fuerza","Hipertrofia","Resistencia muscular","Pérdida de grasa","Recomposición","Movilidad","General / salud"],
  lugares:            ["Casa","Gimnasio","Aire libre","VR"],
  intensidadesCardio: ["Suave","Moderada","Vigorosa","Máxima"],
  zonasFC:            ["Z1","Z2","Z3","Z4","Z5"],
  tiposSesion:        ["Rutina","Programa","VR"],
  estadosSesion:      { activos: ["Programada","En curso","Completada"], finales: ["Registrada"] },
  miembros:           [
    { id: "juanpablo", nombre: "Juan Pablo", rol: "padre" },
    { id: "maria",     nombre: "María",      rol: "madre" },
    { id: "sofia",     nombre: "Sofía",      rol: "hija"  },
    { id: "federico",  nombre: "Federico",   rol: "hijo"  },
  ],
};

// ── Runner ────────────────────────────────────────────────────────────────────

const docs: Array<{ path: string; data: Record<string, unknown> }> = [
  { path: "config/familia",      data: familia      },
  { path: "config/metodologia",  data: metodologia  },
  { path: "config/diccionarios", data: diccionarios },
];

async function run() {
  console.log(`\nSeed config — modo: ${dryRun ? "DRY RUN" : force ? "FORCE" : "SAFE"}\n`);

  for (const { path, data } of docs) {
    const ref = db.doc(path);
    const snap = await ref.get();

    if (snap.exists && !force) {
      console.log(`  SKIP  ${path}  (ya existe; usá --force para sobreescribir)`);
      continue;
    }

    if (dryRun) {
      console.log(`  [dry] WRITE ${path}`);
    } else {
      await ref.set(data, { merge: false });
      console.log(`  ✅   WRITE ${path}`);
    }
  }

  // Crear perfiles y visibilidad vacíos si no existen
  for (const docName of ["perfiles", "visibilidad"]) {
    const ref = db.doc(`config/${docName}`);
    const snap = await ref.get();
    if (!snap.exists) {
      if (dryRun) {
        console.log(`  [dry] WRITE config/${docName} (vacío)`);
      } else {
        await ref.set({});
        console.log(`  ✅   WRITE config/${docName} (vacío)`);
      }
    } else {
      console.log(`  SKIP  config/${docName}`);
    }
  }

  console.log("\nListo.\n");
  process.exit(0);
}

run().catch((e) => { console.error(e); process.exit(1); });
