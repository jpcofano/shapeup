// ════════════════════════════════════════════════════════════════════════════
//  scripts/seed-rugby-juvenil.ts — Programa de complemento para un jugador de
//  rugby juvenil (16 años, 2 entrenos de rugby/semana). Aditivo a los otros seeds.
//
//  Foco: PREVENCIÓN DE LESIONES + MOVILIDAD. Complementa el rugby, no compite.
//  Cargas submáximas, técnica primero, RIR 2–3, sin fallo ni máximos (crecimiento).
//  Ideal con supervisión del entrenador para las cargas.
//
//  Agrega: EJ-8028 (curl nórdico asistido), EJ-8029 (plancha copenhague),
//          RUT-0017 / RUT-0018, PRG-0010.
//  Reusa ejercicios EJ-80xx de seed-plan.ts → corré ese antes.
//
//  Uso: npx tsx scripts/seed-rugby-juvenil.ts   ·   Flags: --dry-run | --force
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

const canon = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim();
function rango(raw: string) {
  const m = raw.match(/^(\d+)\s*[-–]\s*(\d+)$/); if (m) return { value: +m[1], min: +m[1], max: +m[2], raw };
  const n = raw.match(/^(\d+)$/); if (n) return { value: +n[1], raw };
  return { value: 0, raw };
}

// ── Ejercicios nuevos de prevención ───────────────────────────────────────────
const IMG_BASE = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/";
const imgs = (id?: string): string[] => id ? [`${IMG_BASE}${id}/0.jpg`, `${IMG_BASE}${id}/1.jpg`] : [];

type EjDef = { id: string; nombre: string; modalidad: string; patron: string; primario: string;
  secundarios: string[]; equipo: string[]; nivel: string; unilateral?: boolean; descanso: number;
  instrucciones: string[]; puntosClave: string[]; erroresComunes: string[]; consejosSeguridad?: string[];
  imagenes?: string[] };

const EJ: EjDef[] = [
  { id: "EJ-8028", nombre: "Curl nórdico (asistido)", modalidad: "Fuerza", patron: "Dominante de cadera",
    primario: "Isquios", secundarios: ["Glúteos", "Core"], equipo: ["Peso corporal"], nivel: "Intermedio", descanso: 90,
    instrucciones: ["Arrodillado, con los pies bien anclados (alguien los sostiene o bajo un mueble firme).",
      "Bajá el torso hacia adelante lo más LENTO posible (3–5 s), resistiendo con los isquios.",
      "Frená con las manos al llegar abajo y empujate para volver. Empezá con poco recorrido."],
    puntosClave: ["Lo que cuenta es la bajada lenta (excéntrico): el mejor preventivo de desgarros de isquios.",
      "Pocas reps y de calidad (3×5). Sumá recorrido de a poco."],
    erroresComunes: ["Caer de golpe sin control.", "Querer el rango completo desde el primer día."],
    consejosSeguridad: ["Si tira mucho atrás del muslo, reducí el recorrido. No lo hagas con dolor."] },

  { id: "EJ-8029", nombre: "Plancha copenhague", modalidad: "Isométrico", patron: "Core anti-rotación",
    primario: "Aductores", secundarios: ["Core"], equipo: ["Banco", "Peso corporal"], nivel: "Intermedio", unilateral: true, descanso: 30,
    instrucciones: ["De costado, antebrazo apoyado bajo el hombro; pierna de arriba apoyada en un banco/silla.",
      "Subí la cadera hasta formar una línea recta y mantené.",
      "Regresión: apoyá la rodilla (en vez del pie) en el banco y acortá el tiempo."],
    puntosClave: ["Prevención de lesiones de aductor/ingle, muy comunes en rugby.",
      "Arrancá con la versión de rodilla y tiempos cortos (10–15 s)."],
    erroresComunes: ["Dejar caer la cadera.", "Empezar con tiempos largos."],
    consejosSeguridad: ["Si molesta la ingle, pasá a la versión de rodilla o bajá el tiempo."] },
];

function ejercicioDoc(e: EjDef): Record<string, unknown> {
  return {
    idEjercicio: e.id, nombre: e.nombre, nombreCanonico: canon(e.nombre), modalidad: e.modalidad, patron: e.patron,
    grupoMuscularPrimario: e.primario, gruposSecundarios: e.secundarios, equipo: e.equipo,
    unilateral: e.unilateral ?? false, nivel: e.nivel, instrucciones: e.instrucciones, puntosClave: e.puntosClave,
    erroresComunes: e.erroresComunes, ...(e.consejosSeguridad ? { consejosSeguridad: e.consejosSeguridad } : {}),
    descansoSugeridoSeg: e.descanso, sinonimos: [], imagenes: e.imagenes ?? [],
    fuente: "Plan ShapeUp", origen: "seed", vecesUsado: 0,
    fechaCreacion: FieldValue.serverTimestamp(), ultimaModificacion: FieldValue.serverTimestamp(),
  };
}

// ── Rutinas ───────────────────────────────────────────────────────────────────
const CALENT = "Calentamiento 8 min: círculos de cadera, gato–camello, estiramiento del mundo, " +
  "10 sentadillas al aire, pull-aparts con banda. Terminá con 5 min de movilidad suave.";

const F = (orden: number, id: string, nombre: string, series: number, reps: string, desc: number,
  extra: { rir?: number; notas?: string } = {}) => ({
  orden, idEjercicio: id, nombreEjercicio: nombre, modalidad: "Fuerza",
  prescripcion: { modalidad: "Fuerza", series, repsObjetivo: rango(reps), descansoSeg: desc,
    ...(extra.rir != null ? { rirObjetivo: extra.rir } : {}) },
  ...(extra.notas ? { notas: extra.notas } : {}),
});
const ISO = (orden: number, id: string, nombre: string, series: number, hold: number, porLado: boolean, desc: number) => ({
  orden, idEjercicio: id, nombreEjercicio: nombre, modalidad: "Isométrico",
  prescripcion: { modalidad: "Isométrico", series, duracionHoldSeg: hold, porLado, descansoSeg: desc },
});
const MOV = (orden: number, id: string, nombre: string, rondas: number, reps: string, porLado: boolean) => ({
  orden, idEjercicio: id, nombreEjercicio: nombre, modalidad: "Movilidad",
  prescripcion: { modalidad: "Movilidad", rondas, repsObjetivo: rango(reps), porLado, descansoSeg: 30 },
});

type RutDef = { id: string; nombre: string; foco: string; objetivo: string; nivel: string; nivelOrden: number;
  lugar: string; equipo: string[]; descripcion: string; notas?: string; durEstMin: number; bloques: Record<string, unknown>[] };

const RUTINAS: RutDef[] = [
  { id: "RUT-0017", nombre: "Rugby juvenil — Prevención A (cadena posterior)", foco: "Tren inferior",
    objetivo: "General / salud", nivel: "Principiante", nivelOrden: 1, lugar: "Casa",
    equipo: ["Mancuernas", "Peso corporal"],
    descripcion: "Cadena posterior, glúteos y core para velocidad y prevención de lesiones. " + CALENT,
    notas: "Técnica primero. Cargas livianas: terminá cada serie con 2–3 reps en reserva, nunca al fallo.",
    durEstMin: 45,
    bloques: [
      F(1, "EJ-8010", "Peso muerto rumano (RDL)", 3, "10-12", 75, { rir: 2 }),
      F(2, "EJ-8008", "Zancada hacia atrás", 3, "10", 60, { rir: 2, notas: "por pierna" }),
      F(3, "EJ-8028", "Curl nórdico (asistido)", 3, "5", 90, { notas: "bajada lenta 3–5 s; poco recorrido al inicio" }),
      F(4, "EJ-8014", "Puente de glúteos", 3, "12-15", 45),
      MOV(5, "EJ-8018", "Pallof press (banda)", 3, "10", true),
      ISO(6, "EJ-8016", "Plancha lateral", 3, 25, true, 30),
    ] },

  { id: "RUT-0018", nombre: "Rugby juvenil — Prevención B (tren superior + estabilidad)", foco: "Tren superior",
    objetivo: "General / salud", nivel: "Principiante", nivelOrden: 1, lugar: "Casa",
    equipo: ["Mancuernas", "Banda elástica", "Banco", "Peso corporal"],
    descripcion: "Empuje/tracción equilibrados, salud de hombros y estabilidad de tronco para el contacto. " + CALENT,
    notas: "Técnica primero. Cargas livianas (RIR 2–3). El face pull cuida el hombro de tanto empuje.",
    durEstMin: 45,
    bloques: [
      F(1, "EJ-8002", "Flexiones de brazos", 3, "máx", 60, { rir: 2 }),
      F(2, "EJ-8004", "Remo a una mano con mancuerna", 3, "12", 60, { rir: 2 }),
      F(3, "EJ-8015", "Press de hombros", 3, "10-12", 60, { rir: 2 }),
      F(4, "EJ-8021", "Face pull con banda", 3, "15", 45),
      ISO(5, "EJ-8029", "Plancha copenhague", 3, 15, true, 30),
      MOV(6, "EJ-8017", "Bird dog", 3, "10", true),
    ] },
];

function totalSeries(bloques: Record<string, unknown>[]): number {
  let n = 0;
  for (const b of bloques) {
    const p = b.prescripcion as Record<string, unknown>;
    if (p.modalidad === "Fuerza" || p.modalidad === "Isométrico") n += p.series as number;
    else if (p.modalidad === "Movilidad") n += p.rondas as number;
    else if (p.modalidad === "Cardio") n += 1;
  }
  return n;
}
function rutinaDoc(r: RutDef): Record<string, unknown> {
  return {
    idRutina: r.id, nombre: r.nombre, nombreCanonico: canon(r.nombre), foco: r.foco, objetivo: r.objetivo,
    nivel: r.nivel, nivelOrden: r.nivelOrden, lugar: r.lugar, equipoNecesario: r.equipo,
    descripcion: r.descripcion, ...(r.notas ? { notas: r.notas } : {}), bloques: r.bloques,
    duracionEstimadaMin: r.durEstMin, totalSeries: totalSeries(r.bloques),
    vecesEntrenada: 0, fuente: "Plan ShapeUp",
    fechaCreacion: FieldValue.serverTimestamp(), ultimaModificacion: FieldValue.serverTimestamp(),
  };
}

// ── Programa ──────────────────────────────────────────────────────────────────
const programa = {
  idPrograma: "PRG-0010", nombre: "Rugby juvenil — 2 días (prevención y movilidad)",
  nombreCanonico: canon("Rugby juvenil — 2 días (prevención y movilidad)"),
  estado: "Plantilla", objetivo: "General / salud", nivel: "Principiante", diasPorSemana: 2,
  descripcion: "Complemento al rugby (2 entrenos/semana) para un jugador de 16. Foco en prevención de " +
    "lesiones y movilidad, no en levantar mucho. Dos sesiones de fuerza con técnica.",
  comoUsar: "Poné las 2 sesiones en días SIN rugby (o después del rugby, nunca justo antes). " +
    "Cargas livianas, 2–3 reps en reserva, sin ir al fallo ni buscar máximos: está en crecimiento. " +
    "Si se puede, que su entrenador le valide las cargas. Calentá y cerrá siempre con movilidad. " +
    "Opcional: un tercer día suave de VR (Beat the Beats o Body Combat) para juego de pies y cardio.",
  metodologia: [
    "Técnica antes que carga.",
    "Excéntricos lentos (curl nórdico, RDL) para proteger isquios.",
    "Core anti-rotación y estabilidad para el contacto.",
  ],
  reglasProgresion: [
    "Subí primero reps/calidad y rango (en el nórdico), después carga.",
    "Si una semana hubo mucho rugby o partido, bajá un cambio.",
  ],
  dias: [
    { orden: 1, etiqueta: "Día 1 — Prevención A (cadena posterior)", tipo: "rutina", idRutina: "RUT-0017", opcional: false },
    { orden: 2, etiqueta: "Día 2 — Prevención B (tren superior + estabilidad)", tipo: "rutina", idRutina: "RUT-0018", opcional: false },
  ],
  vecesUsado: 0, fechaCreacion: FieldValue.serverTimestamp(), ultimaModificacion: FieldValue.serverTimestamp(),
};

// ── Runner ────────────────────────────────────────────────────────────────────
async function writeDoc(col: string, id: string, data: Record<string, unknown>, label: string) {
  const ref = db.collection(col).doc(id);
  if (!force && !dryRun) { const s = await ref.get(); if (s.exists) { console.log(`  SKIP  ${col}/${id}  ${label}`); return; } }
  if (dryRun) { console.log(`  [dry] WRITE ${col}/${id}  ${label}`); return; }
  await ref.set(data, { merge: false });
  console.log(`  ✅   WRITE ${col}/${id}  ${label}`);
}
async function run() {
  console.log(`\nSeed RUGBY JUVENIL — modo: ${dryRun ? "DRY RUN" : force ? "FORCE" : "SAFE"}\n`);
  console.log(`Ejercicios (${EJ.length}):`);
  for (const e of EJ) await writeDoc("ejercicios", e.id, ejercicioDoc(e), e.nombre);
  console.log(`\nRutinas (${RUTINAS.length}):`);
  for (const r of RUTINAS) await writeDoc("rutinas", r.id, rutinaDoc(r), r.nombre);
  console.log(`\nPrograma:`);
  await writeDoc("programas", programa.idPrograma, programa, programa.nombre);
  console.log("\nListo. Recordá habilitarle la visibilidad a Federico en config/visibilidad.\n");
  process.exit(0);
}
run().catch((e) => { console.error(e); process.exit(1); });
