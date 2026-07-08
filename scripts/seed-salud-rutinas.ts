// ════════════════════════════════════════════════════════════════════════════
//  scripts/seed-salud-rutinas.ts — Rutinas del motor de recomendaciones (S3).
//
//  Crea (sin tocar nada anterior):
//   RUT-0023 · Cardio Z2 base      (~35 min, guiada por zonasFC del perfil)
//   RUT-0024 · HIIT corto          (~20 min, para días de buena recuperación)
//   RUT-0025 · Descarga activa     (~25 min, movilidad + caminata Z1)
//
//  Ejercicios referenciados (ya en Firestore):
//   EJ-0217  Talones a los glúteos (butt kicks) — cardio calentamiento
//   EJ-0613  Running, Treadmill    — cardio Z2/HIIT
//   EJ-0820  Trail Running/Walking — cardio Z2/Z1 libre
//   EJ-0845  Walking, Treadmill    — caminata Z1
//   EJ-8017  Bird dog              — movilidad (de seed-plan.ts)
//   EJ-8023  Gato–camello          — movilidad (de seed-planes-extra.ts)
//   EJ-8024  Estiramiento del mundo — movilidad (de seed-planes-extra.ts)
//   EJ-8025  Círculos de cadera    — movilidad (de seed-planes-extra.ts)
//   EJ-8026  Apertura torácica     — movilidad (de seed-planes-extra.ts)
//   EJ-8027  Estiramiento de isquios y flexores — movilidad (de seed-planes-extra.ts)
//
//  Uso: npx tsx scripts/seed-salud-rutinas.ts   ·   Flags: --dry-run | --force
// ════════════════════════════════════════════════════════════════════════════

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const dryRun = process.argv.includes("--dry-run");
const force  = process.argv.includes("--force");

const serviceAccount = JSON.parse(readFileSync(resolve(__dir, "service-account.json"), "utf8"));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const canon = (s: string): string =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim();

// ── Helpers de bloque ─────────────────────────────────────────────────────────

const MOV = (
  orden: number, id: string, nombre: string,
  rondas: number, reps: string, porLado: boolean, hold?: number,
) => ({
  orden, idEjercicio: id, nombreEjercicio: nombre, modalidad: "Movilidad",
  prescripcion: {
    modalidad: "Movilidad", rondas,
    ...(hold ? { duracionHoldSeg: hold } : { repsObjetivo: rango(reps) }),
    porLado, descansoSeg: 0,
  },
});

const CRD = (
  orden: number, id: string, nombre: string,
  formato: "Continuo" | "Intervalos",
  duracionMin?: number,
  zona?: string,
  intensidad?: string,
  rondas?: number,
  trabajoSeg?: number,
  descansoSeg?: number,
) => ({
  orden, idEjercicio: id, nombreEjercicio: nombre, modalidad: "Cardio",
  prescripcion: {
    modalidad: "Cardio", formato,
    ...(duracionMin ? { duracionMin } : {}),
    ...(zona        ? { zonaObjetivo: zona } : {}),
    ...(intensidad  ? { intensidad } : {}),
    ...(rondas      ? { rondas } : {}),
    ...(trabajoSeg  ? { trabajoSeg } : {}),
    ...(descansoSeg ? { descansoSeg } : {}),
  },
});

function rango(raw: string) {
  const m = raw.match(/^(\d+)\s*[-–]\s*(\d+)$/);
  if (m) return { value: +m[1], min: +m[1], max: +m[2], raw };
  const n = raw.match(/^(\d+)$/);
  if (n) return { value: +n[1], raw };
  return { value: 0, raw };
}

// ── Definiciones de rutinas ───────────────────────────────────────────────────

type RutDef = {
  id: string; nombre: string; foco: string; objetivo: string; nivel: string;
  nivelOrden: number; lugar: string; equipo: string[]; descripcion: string;
  calentamiento?: string; vueltaACalma?: string; notas?: string;
  durEstMin: number; bloques: Record<string, unknown>[];
};

const RUTINAS: RutDef[] = [

  // ── RUT-0023 · Cardio Z2 base ──────────────────────────────────────────────
  {
    id: "RUT-0023", nombre: "Cardio Z2 base", foco: "Cardio / HIIT",
    objetivo: "General / salud", nivel: "Principiante", nivelOrden: 1,
    lugar: "Aire libre", equipo: ["Otro"],
    descripcion: [
      "Sesión de cardio continuo a baja intensidad (Zona 2). La Z2 es la frecuencia cardíaca a la que",
      "podés hablar en frases completas sin entrecortar la respiración. Si tenés zonas FC configuradas",
      "en tu perfil, apuntá a mantenerte en ese rango; si no, buscá un esfuerzo de 5–6 sobre 10.",
      "Modalidad libre: caminata rápida, trote suave, bici, elíptico o lo que tengas disponible.",
      "Este rango de intensidad mejora la base aeróbica, acelera la recuperación y reduce el estrés",
      "cardíaco. Es la herramienta principal cuando tu sueño o HRV están bajos.",
    ].join(" "),
    calentamiento: "5 min caminando suave (Z1) para que la FC suba de a poco.",
    vueltaACalma:  "5 min caminando muy suave hasta que la FC baje por debajo de 100 bpm.",
    notas: "Si la FC sube de Z2 al hablar, bajá el ritmo. Es preferible ir más despacio que salir de la zona.",
    durEstMin: 35,
    bloques: [
      CRD(1, "EJ-0820", "Trail Running/Walking", "Continuo", 5, "Z1", "Suave"),
      CRD(2, "EJ-0820", "Trail Running/Walking", "Continuo", 25, "Z2", "Moderada"),
      CRD(3, "EJ-0845", "Walking, Treadmill", "Continuo", 5, "Z1", "Suave"),
    ],
  },

  // ── RUT-0024 · HIIT corto ──────────────────────────────────────────────────
  {
    id: "RUT-0024", nombre: "HIIT corto", foco: "Cardio / HIIT",
    objetivo: "General / salud", nivel: "Intermedio", nivelOrden: 2,
    lugar: "Aire libre", equipo: ["Otro"],
    descripcion: [
      "Intervalos de alta intensidad: 30 s de esfuerzo máximo o casi máximo, seguidos de 90 s suave",
      "para recuperar. 6–8 rondas en total. Pensada para días de BUENA recuperación: si tus señales",
      "de salud están todas en verde y venís entrenando con regularidad. Si el resumen de salud",
      "muestra sueño o HRV en atención o alerta, preferí RUT-0023 (Z2) o RUT-0025 (descarga activa).",
      "Modalidad libre: sprints, bici, cinta, elíptico o saltos. En los 30 s tenés que llegar a",
      "una intensidad donde hablar en frases es imposible (RPE 8–9/10).",
    ].join(" "),
    calentamiento: "4 min de cardio suave progresivo (talones a los glúteos, trote suave) para activar el sistema cardiovascular.",
    vueltaACalma:  "3–5 min de caminata muy suave hasta normalizar la respiración.",
    notas: "Si no podés mantener el esfuerzo alto en las últimas rondas, reducí a 6 rondas o alargá el descanso a 2 min.",
    durEstMin: 20,
    bloques: [
      CRD(1, "EJ-0217", "Talones a los glúteos (butt kicks)", "Continuo", 4, "Z2", "Moderada"),
      CRD(2, "EJ-0613", "Running, Treadmill", "Intervalos", undefined, "Z4", "Vigorosa", 7, 30, 90),
      CRD(3, "EJ-0845", "Walking, Treadmill", "Continuo", 3, "Z1", "Suave"),
    ],
  },

  // ── RUT-0025 · Descarga activa ────────────────────────────────────────────
  {
    id: "RUT-0025", nombre: "Descarga activa", foco: "Movilidad",
    objetivo: "Movilidad", nivel: "Principiante", nivelOrden: 1,
    lugar: "Casa", equipo: ["Peso corporal", "Otro"],
    descripcion: [
      "Sesión de recuperación activa: movilidad de cuerpo completo + caminata suave Z1 + estiramiento final.",
      "Cero cargas. El objetivo es mover el cuerpo sin generar estrés adicional, para acelerar la recuperación.",
      "Usala cuando el resumen de salud muestra sueño o HRV en alerta (importante) o atención (sugerencia).",
      "Hacela lenta y prestando atención a la respiración. No tiene que 'costar' — si algo duele, saltalo.",
    ].join(" "),
    calentamiento: "Empezá con los círculos de cadera y gato–camello; el cuerpo se va soltando solo.",
    vueltaACalma:  "Terminá con el estiramiento de isquios y flexores, manteniendo cada posición 30–40 s.",
    durEstMin: 25,
    bloques: [
      MOV(1, "EJ-8025", "Círculos de cadera", 2, "10", false),
      MOV(2, "EJ-8023", "Gato–camello", 2, "10", false),
      MOV(3, "EJ-8026", "Apertura torácica", 2, "8", true),
      MOV(4, "EJ-8024", "Estiramiento del mundo (world's greatest)", 2, "5", true),
      MOV(5, "EJ-8017", "Bird dog", 2, "10", true),
      CRD(6, "EJ-0820", "Trail Running/Walking", "Continuo", 10, "Z1", "Suave"),
      MOV(7, "EJ-8027", "Estiramiento de isquios y flexores", 2, "0", true, 35),
    ],
  },
];

// ── Helpers de doc ────────────────────────────────────────────────────────────

function totalSeries(bloques: Record<string, unknown>[]): number {
  let n = 0;
  for (const b of bloques) {
    const p = b.prescripcion as Record<string, unknown>;
    if (p.modalidad === "Fuerza" || p.modalidad === "Isométrico") n += p.series as number;
    else if (p.modalidad === "Movilidad") n += p.rondas as number;
    else if (p.modalidad === "Cardio") n += p.formato === "Intervalos" ? ((p.rondas as number) ?? 1) : 1;
  }
  return n;
}

function rutinaDoc(r: RutDef): Record<string, unknown> {
  return {
    idRutina: r.id, nombre: r.nombre, nombreCanonico: canon(r.nombre),
    foco: r.foco, objetivo: r.objetivo, nivel: r.nivel, nivelOrden: r.nivelOrden,
    lugar: r.lugar, equipoNecesario: r.equipo,
    descripcion: r.descripcion,
    ...(r.calentamiento ? { calentamiento: r.calentamiento } : {}),
    ...(r.vueltaACalma  ? { vueltaACalma:  r.vueltaACalma  } : {}),
    ...(r.notas         ? { notas:         r.notas         } : {}),
    bloques: r.bloques,
    duracionEstimadaMin: r.durEstMin, totalSeries: totalSeries(r.bloques),
    vecesEntrenada: 0, fuente: "Plan ShapeUp",
    fechaCreacion: FieldValue.serverTimestamp(), ultimaModificacion: FieldValue.serverTimestamp(),
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function run() {
  console.log(`\nSeed salud-rutinas — ${RUTINAS.length} rutinas — modo: ${dryRun ? "DRY RUN" : force ? "FORCE" : "SAFE"}\n`);

  const existentes = new Set<string>();
  if (!force && !dryRun) {
    const snap = await db.collection("rutinas").select().get();
    snap.forEach((d) => existentes.add(d.id));
  }

  let escritas = 0;
  let saltadas = 0;

  for (const r of RUTINAS) {
    if (!force && existentes.has(r.id)) {
      console.log(`  SKIP  ${r.id}  ${r.nombre}`);
      saltadas++;
      continue;
    }
    const doc = rutinaDoc(r);
    if (dryRun) {
      console.log(`  [DRY] ${r.id}  ${r.nombre}  (${r.bloques.length} bloques, ~${r.durEstMin} min)`);
    } else {
      await db.collection("rutinas").doc(r.id).set(doc);
      console.log(`  OK    ${r.id}  ${r.nombre}`);
    }
    escritas++;
  }

  console.log(`\n  Escritas: ${escritas}  Saltadas: ${saltadas}\n`);
}

run().catch((e) => { console.error(e); process.exit(1); });
