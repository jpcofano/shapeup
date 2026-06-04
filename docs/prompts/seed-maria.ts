// ════════════════════════════════════════════════════════════════════════════
//  scripts/seed-maria.ts — Programa para María (50 años). Aditivo a los otros seeds.
//
//  Objetivos: construir/"levantar" glúteos (fuerza dirigida) + perder grasa
//  (combo de fuerza para mantener músculo + cardio de VR para gasto y adherencia).
//  NOTA honesta que va en el programa: la grasa abdominal NO se reduce localizado;
//  baja con pérdida de grasa global (actividad + alimentación). La parte de comida
//  es de un nutricionista; este plan es el entrenamiento.
//
//  A los 50, la fuerza progresiva cuida hueso y músculo. Técnica primero, RIR 2–3.
//
//  Agrega: EJ-8033 (empuje de cadera / hip thrust), EJ-8034 (patada de glúteo),
//          RUT-0021/RUT-0022, PRG-0012. Reusa EJ-80xx (corré seed-plan.ts antes) y
//          rutinas de VR RUT-0004/RUT-0008 (corré seed-vr.ts + seed-plan.ts antes).
//
//  Uso: npx tsx scripts/seed-maria.ts   ·   Flags: --dry-run | --force
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

// ── Ejercicios nuevos (glúteo) ────────────────────────────────────────────────
type EjDef = { id: string; nombre: string; modalidad: string; patron: string; primario: string;
  secundarios: string[]; equipo: string[]; nivel: string; unilateral?: boolean; descanso: number;
  instrucciones: string[]; puntosClave: string[]; erroresComunes: string[] };

const EJ: EjDef[] = [
  { id: "EJ-8033", nombre: "Empuje de cadera (hip thrust)", modalidad: "Fuerza", patron: "Dominante de cadera",
    primario: "Glúteos", secundarios: ["Isquios", "Core"], equipo: ["Banco", "Mancuernas", "Peso corporal"], nivel: "Principiante", descanso: 75,
    instrucciones: ["Apoyá la espalda alta en el borde de un banco/sofá firme, pies bien plantados.",
      "Subí la cadera hasta alinear tronco y muslos, apretando fuerte los glúteos arriba.",
      "Pausá 1–2 s arriba y bajá controlado. Para más carga, apoyá una mancuerna sobre la cadera."],
    puntosClave: ["El mejor ejercicio para construir y 'levantar' el glúteo.", "Buscá la pausa y el apretón arriba, no la altura."],
    erroresComunes: ["Arquear la espalda baja en vez de empujar con glúteos.", "No llegar a la extensión completa de cadera."] },

  { id: "EJ-8034", nombre: "Patada de glúteo (cuadrupedia)", modalidad: "Fuerza", patron: "Dominante de cadera",
    primario: "Glúteos", secundarios: ["Isquios"], equipo: ["Banda elástica", "Peso corporal"], nivel: "Principiante", unilateral: true, descanso: 45,
    instrucciones: ["En cuatro patas (sumá una banda para más tensión).",
      "Llevá un talón hacia el techo manteniendo la rodilla a 90°, apretando el glúteo arriba.",
      "Bajá sin tocar el piso y repetí. Cambiá de lado."],
    puntosClave: ["Aislamiento de glúteo: sentí el glúteo trabajando, no la espalda baja."],
    erroresComunes: ["Arquear la lumbar para subir más la pierna.", "Usar impulso en vez de control."] },
];

function ejercicioDoc(e: EjDef): Record<string, unknown> {
  return {
    idEjercicio: e.id, nombre: e.nombre, nombreCanonico: canon(e.nombre), modalidad: e.modalidad, patron: e.patron,
    grupoMuscularPrimario: e.primario, gruposSecundarios: e.secundarios, equipo: e.equipo,
    unilateral: e.unilateral ?? false, nivel: e.nivel, instrucciones: e.instrucciones, puntosClave: e.puntosClave,
    erroresComunes: e.erroresComunes, descansoSugeridoSeg: e.descanso, sinonimos: [], fuente: "Plan ShapeUp", origen: "seed", vecesUsado: 0,
    fechaCreacion: FieldValue.serverTimestamp(), ultimaModificacion: FieldValue.serverTimestamp(),
  };
}

// ── Rutinas ───────────────────────────────────────────────────────────────────
const CALENT = "Calentamiento 8 min: círculos de cadera, gato–camello, 10 sentadillas al aire, " +
  "caminata lateral con banda suave, puente de glúteos lento. Cerrá con 5 min de movilidad.";

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
  { id: "RUT-0021", nombre: "Glúteos y piernas A", foco: "Tren inferior", objetivo: "Recomposición",
    nivel: "Principiante", nivelOrden: 1, lugar: "Casa", equipo: ["Mancuernas", "Banda elástica", "Banco", "Peso corporal"],
    descripcion: "Día de glúteos y piernas con foco en construir el glúteo. " + CALENT,
    notas: "Técnica primero, RIR 2–3. Apretá bien el glúteo arriba en cada repetición.",
    durEstMin: 45,
    bloques: [
      F(1, "EJ-8033", "Empuje de cadera (hip thrust)", 3, "12-15", 75, { rir: 2 }),
      F(2, "EJ-8001", "Sentadilla goblet", 3, "12", 75, { rir: 2 }),
      F(3, "EJ-8010", "Peso muerto rumano (RDL)", 3, "12", 75, { rir: 2 }),
      F(4, "EJ-8030", "Caminata lateral con banda", 3, "15", 45, { notas: "15 pasos por lado" }),
      F(5, "EJ-8034", "Patada de glúteo (cuadrupedia)", 3, "15", 45, { notas: "por lado" }),
      ISO(6, "EJ-8016", "Plancha lateral", 3, 25, true, 30),
    ] },

  { id: "RUT-0022", nombre: "Glúteos y cuerpo completo B", foco: "Cuerpo completo", objetivo: "Recomposición",
    nivel: "Principiante", nivelOrden: 1, lugar: "Casa", equipo: ["Mancuernas", "Banda elástica", "Peso corporal"],
    descripcion: "Glúteos otra vez + tren superior para trabajar todo el cuerpo. " + CALENT,
    notas: "Técnica primero, RIR 2–3.",
    durEstMin: 45,
    bloques: [
      F(1, "EJ-8014", "Puente de glúteos", 3, "15", 60, { rir: 2 }),
      F(2, "EJ-8008", "Zancada hacia atrás", 3, "10", 60, { rir: 2, notas: "por pierna" }),
      F(3, "EJ-8004", "Remo a una mano con mancuerna", 3, "12", 60, { rir: 2 }),
      F(4, "EJ-8005", "Press de pecho con banda", 3, "12-15", 60, { rir: 2 }),
      F(5, "EJ-8034", "Patada de glúteo (cuadrupedia)", 3, "15", 45, { notas: "por lado" }),
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
  idPrograma: "PRG-0012", nombre: "María — Glúteos y recomposición (4 días)",
  nombreCanonico: canon("María — Glúteos y recomposición (4 días)"),
  estado: "Plantilla", objetivo: "Recomposición", nivel: "Principiante", diasPorSemana: 4,
  descripcion: "Construir glúteos con fuerza dirigida + bajar grasa con cardio VR y fuerza. " +
    "2 días de glúteos/fuerza + 2 de cardio en VR.",
  comoUsar: "El glúteo SE construye con la fuerza (hip thrust, puente, RDL): esa parte 'levanta el trasero' de verdad. " +
    "La grasa abdominal NO se baja con abdominales ni localizado: baja al reducir grasa de todo el cuerpo, que viene del " +
    "combo de actividad (estos 4 días) + alimentación. Para la comida, lo ideal es un plan personalizado con un " +
    "nutricionista; este programa es el entrenamiento. A los 50, la fuerza además cuida hueso y músculo: es la mejor " +
    "inversión. Técnica primero, cargas que dejen 2–3 reps en reserva, y progresá de a poco.",
  metodologia: [
    "El glúteo se construye con fuerza progresiva (subí carga/reps de a poco).",
    "La grasa abdominal se reduce con pérdida de grasa GLOBAL, no localizado.",
    "El cardio de VR suma gasto y, sobre todo, constancia (es divertido).",
    "La fuerza mantiene el músculo mientras baja la grasa.",
  ],
  dias: [
    { orden: 1, dia: "lunes", etiqueta: "Lunes — Glúteos y piernas A", tipo: "rutina", idRutina: "RUT-0021", opcional: false },
    { orden: 2, dia: "martes", etiqueta: "Martes — Cardio VR (quema)", tipo: "rutina", idRutina: "RUT-0004", opcional: false },
    { orden: 3, dia: "jueves", etiqueta: "Jueves — Glúteos y cuerpo completo B", tipo: "rutina", idRutina: "RUT-0022", opcional: false },
    { orden: 4, dia: "viernes", etiqueta: "Viernes — Cardio VR (estructurado)", tipo: "rutina", idRutina: "RUT-0008", opcional: false },
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
  console.log(`\nSeed MARÍA — modo: ${dryRun ? "DRY RUN" : force ? "FORCE" : "SAFE"}\n`);
  console.log(`Ejercicios (${EJ.length}):`);
  for (const e of EJ) await writeDoc("ejercicios", e.id, ejercicioDoc(e), e.nombre);
  console.log(`\nRutinas (${RUTINAS.length}):`);
  for (const r of RUTINAS) await writeDoc("rutinas", r.id, rutinaDoc(r), r.nombre);
  console.log(`\nPrograma:`);
  await writeDoc("programas", programa.idPrograma, programa, programa.nombre);
  console.log("\nListo. Recordá habilitarle la visibilidad a María en config/visibilidad.\n");
  process.exit(0);
}
run().catch((e) => { console.error(e); process.exit(1); });
