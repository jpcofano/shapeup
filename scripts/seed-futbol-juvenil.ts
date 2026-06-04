// ════════════════════════════════════════════════════════════════════════════
//  scripts/seed-futbol-juvenil.ts — Programa de complemento para una jugadora de
//  fútbol juvenil (17 años, 2 entrenos de fútbol/semana). Aditivo a los otros seeds.
//
//  Foco: PREVENCIÓN DE LESIONES (rodilla/ligamento cruzado, isquios, ingle) +
//  MOVILIDAD. Complementa el fútbol. Cargas submáximas, técnica primero, RIR 2–3,
//  sin fallo ni máximos (crecimiento). Ideal con supervisión del entrenador.
//  El trabajo de aterrizaje y control de rodilla está priorizado a propósito:
//  reduce el riesgo de lesión de ligamento cruzado, más alto en futbolistas mujeres.
//
//  Agrega: EJ-8030 (caminata lateral con banda), EJ-8031 (salto con aterrizaje
//  controlado), EJ-8032 (RDL a una pierna), RUT-0019/RUT-0020, PRG-0011.
//  Reusa ejercicios de seed-plan.ts y seed-rugby-juvenil.ts (EJ-8028/8029) → corré esos antes.
//
//  Uso: npx tsx scripts/seed-futbol-juvenil.ts   ·   Flags: --dry-run | --force
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

// ── Ejercicios nuevos ─────────────────────────────────────────────────────────
type EjDef = { id: string; nombre: string; modalidad: string; patron: string; primario: string;
  secundarios: string[]; equipo: string[]; nivel: string; unilateral?: boolean; descanso: number;
  instrucciones: string[]; puntosClave: string[]; erroresComunes: string[]; consejosSeguridad?: string[] };

const EJ: EjDef[] = [
  { id: "EJ-8030", nombre: "Caminata lateral con banda", modalidad: "Fuerza", patron: "Aislamiento",
    primario: "Glúteos", secundarios: ["Abductores"], equipo: ["Banda elástica"], nivel: "Principiante", descanso: 45,
    instrucciones: ["Banda en los tobillos (o arriba de las rodillas), media sentadilla.",
      "Caminá de costado manteniendo tensión, sin juntar del todo los pies.",
      "Hacé el mismo número de pasos para cada lado."],
    puntosClave: ["Trabaja el glúteo medio: clave para estabilizar la rodilla y prevenir lesiones.",
      "Las rodillas SIEMPRE apuntando hacia las puntas de los pies."],
    erroresComunes: ["Dejar que las rodillas se vayan hacia adentro.", "Pararte derecho y perder la tensión."] },

  { id: "EJ-8031", nombre: "Salto con aterrizaje controlado", modalidad: "Fuerza", patron: "Dominante de rodilla",
    primario: "Cuádriceps", secundarios: ["Glúteos", "Isquios"], equipo: ["Peso corporal"], nivel: "Intermedio", descanso: 60,
    instrucciones: ["Saltá hacia arriba y, sobre todo, ATERRIZÁ suave.",
      "Amortiguá flexionando cadera y rodillas, rodillas alineadas con las puntas de los pies.",
      "Pausá un instante en el aterrizaje y repetí. Pocas reps, calidad."],
    puntosClave: ["Lo importante es el aterrizaje, no la altura: enseña a la rodilla a frenar bien.",
      "Es de lo más efectivo para prevenir lesiones de ligamento en futbolistas."],
    erroresComunes: ["Aterrizar con las rodillas hacia adentro (valgo).", "Caer rígido y duro."],
    consejosSeguridad: ["Pocas reps y sin fatiga (3×5).", "Pará si duele la rodilla; no es un ejercicio de cansarse."] },

  { id: "EJ-8032", nombre: "Peso muerto rumano a una pierna", modalidad: "Fuerza", patron: "Dominante de cadera",
    primario: "Isquios", secundarios: ["Glúteos", "Core"], equipo: ["Mancuernas", "Peso corporal"], nivel: "Intermedio", unilateral: true, descanso: 60,
    instrucciones: ["Parada en una pierna, bajá el torso llevando la cadera atrás y la otra pierna hacia atrás.",
      "Espalda recta; sentí el estiramiento atrás del muslo.", "Volvé apretando el glúteo. Apoyate en algo al inicio para el equilibrio."],
    puntosClave: ["Isquios + glúteo + equilibrio en una sola pierna: justo lo que pide el fútbol."],
    erroresComunes: ["Redondear la espalda.", "Abrir/rotar la cadera de la pierna de atrás."] },
];

function ejercicioDoc(e: EjDef): Record<string, unknown> {
  return {
    idEjercicio: e.id, nombre: e.nombre, nombreCanonico: canon(e.nombre), modalidad: e.modalidad, patron: e.patron,
    grupoMuscularPrimario: e.primario, gruposSecundarios: e.secundarios, equipo: e.equipo,
    unilateral: e.unilateral ?? false, nivel: e.nivel, instrucciones: e.instrucciones, puntosClave: e.puntosClave,
    erroresComunes: e.erroresComunes, ...(e.consejosSeguridad ? { consejosSeguridad: e.consejosSeguridad } : {}),
    descansoSugeridoSeg: e.descanso, sinonimos: [], fuente: "Plan ShapeUp", origen: "seed", vecesUsado: 0,
    fechaCreacion: FieldValue.serverTimestamp(), ultimaModificacion: FieldValue.serverTimestamp(),
  };
}

// ── Rutinas ───────────────────────────────────────────────────────────────────
const CALENT = "Calentamiento 8 min: círculos de cadera, gato–camello, estiramiento del mundo, " +
  "10 sentadillas al aire, caminata lateral suave. Cerrá con 5 min de movilidad.";

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
  { id: "RUT-0019", nombre: "Fútbol juvenil — Prevención A (rodilla, isquios, ingle)", foco: "Tren inferior",
    objetivo: "General / salud", nivel: "Principiante", nivelOrden: 1, lugar: "Casa", equipo: ["Mancuernas", "Banda elástica", "Peso corporal"],
    descripcion: "Fuerza de piernas con técnica de aterrizaje y control de rodilla para prevenir lesiones. " + CALENT,
    notas: "Técnica primero. El salto es por la CALIDAD del aterrizaje, no por la altura. RIR 2–3, sin fallo.",
    durEstMin: 45,
    bloques: [
      F(1, "EJ-8001", "Sentadilla goblet", 3, "10-12", 75, { rir: 2 }),
      F(2, "EJ-8032", "Peso muerto rumano a una pierna", 3, "8", 60, { rir: 2, notas: "por pierna" }),
      F(3, "EJ-8028", "Curl nórdico (asistido)", 3, "5", 90, { notas: "bajada lenta 3–5 s" }),
      F(4, "EJ-8030", "Caminata lateral con banda", 3, "12", 45, { notas: "12 pasos por lado" }),
      F(5, "EJ-8031", "Salto con aterrizaje controlado", 3, "5", 60, { notas: "calidad del aterrizaje" }),
      ISO(6, "EJ-8029", "Plancha copenhague", 3, 15, true, 30),
    ] },

  { id: "RUT-0020", nombre: "Fútbol juvenil — Prevención B (core, glúteos, estabilidad)", foco: "Cuerpo completo",
    objetivo: "General / salud", nivel: "Principiante", nivelOrden: 1, lugar: "Casa", equipo: ["Mancuernas", "Banda elástica", "Peso corporal"],
    descripcion: "Glúteos, core anti-rotación y tren superior para estabilidad y equilibrio. " + CALENT,
    notas: "Cargas livianas (RIR 2–3). Enfocá en hacer cada repetición prolija.",
    durEstMin: 40,
    bloques: [
      F(1, "EJ-8014", "Puente de glúteos", 3, "12-15", 45),
      F(2, "EJ-8002", "Flexiones de brazos", 3, "máx", 60, { rir: 2 }),
      F(3, "EJ-8004", "Remo a una mano con mancuerna", 3, "12", 60, { rir: 2 }),
      MOV(4, "EJ-8018", "Pallof press (banda)", 3, "10", true),
      ISO(5, "EJ-8016", "Plancha lateral", 3, 25, true, 30),
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
  idPrograma: "PRG-0011", nombre: "Fútbol juvenil — 2 días (prevención y movilidad)",
  nombreCanonico: canon("Fútbol juvenil — 2 días (prevención y movilidad)"),
  estado: "Plantilla", objetivo: "General / salud", nivel: "Principiante", diasPorSemana: 2,
  descripcion: "Complemento al fútbol (2 entrenos/semana) para una jugadora de 17. Foco en " +
    "prevención de lesiones —rodilla, isquios e ingle— y movilidad. No es trabajo de carga pesada.",
  comoUsar: "Poné las 2 sesiones en días SIN fútbol (o después, nunca justo antes). Cargas livianas, " +
    "2–3 reps en reserva, sin ir al fallo ni buscar máximos: está en crecimiento. " +
    "El ejercicio estrella es el aterrizaje controlado: prioridad técnica de rodilla. " +
    "Si se puede, que su entrenador le valide las cargas. Calentá y cerrá con movilidad. " +
    "Opcional: un tercer día suave de VR (Beat the Beats o Body Combat) para juego de pies y cardio.",
  metodologia: [
    "Técnica antes que carga.",
    "Control de la rodilla en el aterrizaje (prevención de ligamento cruzado).",
    "Excéntricos de isquios (curl nórdico, RDL a una pierna).",
    "Estabilidad de cadera (glúteo medio) y core anti-rotación.",
  ],
  reglasProgresion: [
    "Subí primero calidad/reps y rango; la carga, después.",
    "Semana con partido o mucho fútbol: bajá un cambio.",
  ],
  dias: [
    { orden: 1, etiqueta: "Día 1 — Prevención A (rodilla, isquios, ingle)", tipo: "rutina", idRutina: "RUT-0019", opcional: false },
    { orden: 2, etiqueta: "Día 2 — Prevención B (core, glúteos, estabilidad)", tipo: "rutina", idRutina: "RUT-0020", opcional: false },
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
  console.log(`\nSeed FÚTBOL JUVENIL — modo: ${dryRun ? "DRY RUN" : force ? "FORCE" : "SAFE"}\n`);
  console.log(`Ejercicios (${EJ.length}):`);
  for (const e of EJ) await writeDoc("ejercicios", e.id, ejercicioDoc(e), e.nombre);
  console.log(`\nRutinas (${RUTINAS.length}):`);
  for (const r of RUTINAS) await writeDoc("rutinas", r.id, rutinaDoc(r), r.nombre);
  console.log(`\nPrograma:`);
  await writeDoc("programas", programa.idPrograma, programa, programa.nombre);
  console.log("\nListo. Recordá habilitarle la visibilidad a Sofía en config/visibilidad.\n");
  process.exit(0);
}
run().catch((e) => { console.error(e); process.exit(1); });
