// ════════════════════════════════════════════════════════════════════════════
//  scripts/seed-planes-extra.ts — Planes adicionales (aditivo a seed-plan.ts).
//
//  Agrega, sin tocar lo anterior:
//   1) Ejercicios nuevos para hipertrofia y movilidad (EJ-8019..EJ-8027).
//   2) Rutinas RUT-0009..RUT-0016 (4 hipertrofia + movilidad + recuperación + 2 express).
//   3) Programas PRG-0006..PRG-0009 (hipertrofia 4 días, movilidad/recuperación,
//      express 2 días, semana de descarga/deload).
//
//  Depende de seed-plan.ts (reusa rutinas RUT-0001/0002/0013 y ejercicios EJ-80xx)
//  y de seed-vr.ts (EJ-9003 para la recuperación con Body Combat). Corré esos antes.
//
//  Uso: npx tsx scripts/seed-planes-extra.ts   ·   Flags: --dry-run | --force
// ════════════════════════════════════════════════════════════════════════════

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { videoGenericoPorPatron, urlClip } from "./data/videos-genericos";
import { VIDEOS_CURADOS } from "./data/videos-curados";
import type { PatronMovimiento } from "../src/types/models";

const __dir = dirname(fileURLToPath(import.meta.url));
const dryRun = process.argv.includes("--dry-run");
const force  = process.argv.includes("--force");

const serviceAccount = JSON.parse(readFileSync(resolve(__dir, "service-account.json"), "utf8"));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const canon = (s: string): string =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim();

const IMG_BASE = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/";
const imgs = (id?: string): string[] =>
  id ? [`${IMG_BASE}${id}/0.jpg`, `${IMG_BASE}${id}/1.jpg`] : [];
function rango(raw: string) {
  const m = raw.match(/^(\d+)\s*[-–]\s*(\d+)$/);
  if (m) return { value: +m[1], min: +m[1], max: +m[2], raw };
  const n = raw.match(/^(\d+)$/);
  if (n) return { value: +n[1], raw };
  return { value: 0, raw };
}

// ── 1) Ejercicios nuevos ──────────────────────────────────────────────────────
type EjDef = {
  id: string; nombre: string; modalidad: "Fuerza" | "Cardio" | "Movilidad" | "Isométrico";
  patron: string; primario: string; secundarios: string[]; equipo: string[];
  nivel: "Principiante" | "Intermedio" | "Avanzado"; unilateral?: boolean; descanso: number;
  instrucciones: string[]; puntosClave: string[]; erroresComunes: string[];
  imagenes?: string[];
};

const EJ: EjDef[] = [
  { id: "EJ-8019", nombre: "Elevaciones laterales", modalidad: "Fuerza", imagenes: imgs("One-Arm_Side_Laterals"), patron: "Aislamiento",
    primario: "Hombros", secundarios: [], equipo: ["Mancuernas", "Banda elástica"], nivel: "Principiante", descanso: 45,
    instrucciones: ["Brazos a los costados, codos apenas flexionados.", "Subí hasta la altura de los hombros y bajá lento."],
    puntosClave: ["Liderá con los codos, no con las manos."], erroresComunes: ["Usar impulso y subir por encima del hombro."] },
  { id: "EJ-8020", nombre: "Sentadilla búlgara", modalidad: "Fuerza", patron: "Zancada / unilateral",
    primario: "Cuádriceps", secundarios: ["Glúteos", "Isquios"], equipo: ["Mancuernas", "Peso corporal", "Banco"],
    nivel: "Intermedio", unilateral: true, descanso: 75,
    instrucciones: ["Pie de atrás apoyado en un banco/silla.", "Bajá la rodilla de atrás hacia el piso, torso erguido.", "Subí empujando con la pierna de adelante."],
    puntosClave: ["El peso en el talón de adelante."], erroresComunes: ["Inclinarte demasiado al frente."] },
  { id: "EJ-8021", nombre: "Face pull con banda", modalidad: "Fuerza", imagenes: imgs("Face_Pull"), patron: "Tracción horizontal",
    primario: "Espalda media", secundarios: ["Hombros", "Trapecios"], equipo: ["Banda elástica"], nivel: "Principiante", descanso: 45,
    instrucciones: ["Banda anclada al frente a la altura de la cara.", "Tirá hacia la frente separando las manos, codos altos.", "Apretá la espalda alta."],
    puntosClave: ["Salud de hombros: ideal para contrarrestar tanto empuje."], erroresComunes: ["Bajar los codos y convertirlo en remo."] },
  { id: "EJ-8022", nombre: "Aperturas de pecho con banda", modalidad: "Fuerza", patron: "Aislamiento",
    primario: "Pecho", secundarios: ["Hombros"], equipo: ["Banda elástica"], nivel: "Principiante", descanso: 45,
    instrucciones: ["Banda anclada detrás, brazos abiertos.", "Juntá las manos al frente con los codos apenas flexionados.", "Volvé controlado."],
    puntosClave: ["Apretá el pecho al juntar las manos."], erroresComunes: ["Doblar mucho los codos (se vuelve press)."] },
  { id: "EJ-8023", nombre: "Gato–camello", modalidad: "Movilidad", imagenes: imgs("Cat_Stretch"), patron: "Core flexión",
    primario: "Lumbares", secundarios: ["Core"], equipo: ["Peso corporal"], nivel: "Principiante", descanso: 0,
    instrucciones: ["En cuatro patas, redondeá la espalda (gato) y luego arqueala (camello).", "Movimiento lento, siguiendo la respiración."],
    puntosClave: ["Movilidad de columna; sin forzar."], erroresComunes: ["Hacerlo rápido y a los tirones."] },
  { id: "EJ-8024", nombre: "Estiramiento del mundo (world's greatest)", modalidad: "Movilidad", imagenes: imgs("Worlds_Greatest_Stretch"), patron: "Zancada / unilateral",
    primario: "Isquios", secundarios: ["Glúteos", "Core"], equipo: ["Peso corporal"], nivel: "Principiante", unilateral: true, descanso: 0,
    instrucciones: ["Desde una zancada, apoyá la mano del mismo lado y rotá el otro brazo hacia arriba.", "Sentí cadera, isquios y torácica.", "Alterná lados."],
    puntosClave: ["El gran estiramiento de calentamiento: abre todo."], erroresComunes: ["Apurar la rotación."] },
  { id: "EJ-8025", nombre: "Círculos de cadera", modalidad: "Movilidad", imagenes: imgs("Standing_Hip_Circles"), patron: "Dominante de cadera",
    primario: "Core", secundarios: ["Glúteos"], equipo: ["Peso corporal"], nivel: "Principiante", descanso: 0,
    instrucciones: ["De pie, manos en la cadera, hacé círculos amplios con la pelvis.", "Cambiá de dirección."],
    puntosClave: ["Soltar la cadera antes de entrenar."], erroresComunes: [] },
  { id: "EJ-8026", nombre: "Apertura torácica", modalidad: "Movilidad", patron: "Tracción horizontal",
    primario: "Espalda media", secundarios: ["Pecho", "Hombros"], equipo: ["Peso corporal"], nivel: "Principiante", descanso: 0,
    instrucciones: ["De costado en el piso, brazos estirados juntos; abrí el brazo de arriba siguiendo con la mirada.", "Mantené unos segundos y volvé."],
    puntosClave: ["Abre el pecho y la columna torácica (clave si pasás horas sentado)."], erroresComunes: ["Despegar las rodillas del piso."] },
  { id: "EJ-8027", nombre: "Estiramiento de isquios y flexores", modalidad: "Movilidad", imagenes: imgs("Hamstring_Stretch"), patron: "Dominante de cadera",
    primario: "Isquios", secundarios: ["Cuádriceps"], equipo: ["Peso corporal"], nivel: "Principiante", unilateral: true, descanso: 0,
    instrucciones: ["Una pierna adelante estirada para isquios; cambiá a zancada para estirar el flexor de la de atrás.", "Mantené sin rebotar."],
    puntosClave: ["Estiramiento suave, sin dolor."], erroresComunes: ["Rebotar para llegar más lejos."] },
];

function ejercicioDoc(e: EjDef): Record<string, unknown> {
  const clip = videoGenericoPorPatron(e.patron as PatronMovimiento);
  const youtubeId = VIDEOS_CURADOS[e.id]?.youtubeId;
  return {
    idEjercicio: e.id, nombre: e.nombre, nombreCanonico: canon(e.nombre),
    modalidad: e.modalidad, patron: e.patron, grupoMuscularPrimario: e.primario,
    gruposSecundarios: e.secundarios, equipo: e.equipo, unilateral: e.unilateral ?? false, nivel: e.nivel,
    instrucciones: e.instrucciones, puntosClave: e.puntosClave, erroresComunes: e.erroresComunes,
    descansoSugeridoSeg: e.descanso, sinonimos: [], imagenes: e.imagenes ?? [],
    ...(youtubeId ? { videoYoutubeId: youtubeId } : {}),
    ...(clip ? { videoUrl: urlClip(clip), videoEsGenerico: true } : {}),
    fuente: "Plan ShapeUp", origen: "seed", vecesUsado: 0,
    fechaCreacion: FieldValue.serverTimestamp(), ultimaModificacion: FieldValue.serverTimestamp(),
  };
}

// ── 2) Rutinas ────────────────────────────────────────────────────────────────
const CALENT = "Calentamiento 6–8 min: círculos de hombros y cadera, 10 sentadillas al aire, pull-aparts con banda ×15, rotaciones de tronco.";

const F = (orden: number, id: string, nombre: string, series: number, reps: string, desc: number,
  extra: { grupoSet?: string; rir?: number; tempo?: string; notas?: string } = {}) => ({
  orden, idEjercicio: id, nombreEjercicio: nombre, modalidad: "Fuerza",
  prescripcion: { modalidad: "Fuerza", series, repsObjetivo: rango(reps), descansoSeg: desc,
    ...(extra.rir != null ? { rirObjetivo: extra.rir } : {}), ...(extra.tempo ? { tempo: extra.tempo } : {}) },
  ...(extra.grupoSet ? { grupoSet: extra.grupoSet } : {}), ...(extra.notas ? { notas: extra.notas } : {}),
});
const ISO = (orden: number, id: string, nombre: string, series: number, holdSeg: number, porLado: boolean, desc: number) => ({
  orden, idEjercicio: id, nombreEjercicio: nombre, modalidad: "Isométrico",
  prescripcion: { modalidad: "Isométrico", series, duracionHoldSeg: holdSeg, porLado, descansoSeg: desc },
});
const MOV = (orden: number, id: string, nombre: string, rondas: number, reps: string, porLado: boolean, hold?: number) => ({
  orden, idEjercicio: id, nombreEjercicio: nombre, modalidad: "Movilidad",
  prescripcion: { modalidad: "Movilidad", rondas, ...(hold ? { duracionHoldSeg: hold } : { repsObjetivo: rango(reps) }), porLado, descansoSeg: 0 },
});
const CVR = (orden: number, id: string, nombre: string, duracionMin: number, zona: string, juego: string, intensidad = "Moderada") => ({
  orden, idEjercicio: id, nombreEjercicio: nombre, modalidad: "Cardio",
  prescripcion: { modalidad: "Cardio", formato: "Continuo", duracionMin, zonaObjetivo: zona, intensidad, juegoSugerido: juego },
});

type RutDef = {
  id: string; nombre: string; foco: string; objetivo: string; nivel: string; nivelOrden: number;
  lugar: string; equipo: string[]; descripcion?: string; superseries?: string[]; notas?: string;
  durEstMin: number; bloques: Record<string, unknown>[];
};

const RUTINAS: RutDef[] = [
  { id: "RUT-0009", nombre: "Hipertrofia — Tren superior A", foco: "Tren superior", objetivo: "Hipertrofia",
    nivel: "Intermedio", nivelOrden: 2, lugar: "Casa", equipo: ["Mancuernas", "Banda elástica", "Barra de dominadas"],
    descripcion: "Empuje + tracción de tren superior, volumen para hipertrofia. " + CALENT, durEstMin: 50,
    bloques: [
      F(1, "EJ-8005", "Press de pecho con banda", 4, "10-12", 75, { rir: 1 }),
      F(2, "EJ-8004", "Remo a una mano con mancuerna", 4, "10-12", 75, { rir: 1 }),
      F(3, "EJ-8015", "Press de hombros", 3, "10-12", 60, { rir: 1 }),
      F(4, "EJ-8003", "Dominadas asistidas / negativas", 3, "6-10", 90, { rir: 2 }),
      F(5, "EJ-8006", "Curl de bíceps", 3, "10-12", 45),
      F(6, "EJ-8007", "Extensión de tríceps (fondos en silla)", 3, "10-12", 45),
    ] },
  { id: "RUT-0010", nombre: "Hipertrofia — Tren inferior A", foco: "Tren inferior", objetivo: "Hipertrofia",
    nivel: "Intermedio", nivelOrden: 2, lugar: "Casa", equipo: ["Mancuernas", "Peso corporal"],
    descripcion: "Cuádriceps, glúteos e isquios con volumen. " + CALENT, durEstMin: 50,
    bloques: [
      F(1, "EJ-8001", "Sentadilla goblet", 4, "10-12", 90, { rir: 1, tempo: "3-0-1-0" }),
      F(2, "EJ-8010", "Peso muerto rumano (RDL)", 4, "10-12", 90, { rir: 1 }),
      F(3, "EJ-8008", "Zancada hacia atrás", 3, "10-12", 60, { rir: 2, notas: "por pierna" }),
      F(4, "EJ-8014", "Puente de glúteos", 3, "12-15", 45),
      ISO(5, "EJ-8016", "Plancha lateral", 3, 30, true, 30),
    ] },
  { id: "RUT-0011", nombre: "Hipertrofia — Tren superior B", foco: "Tren superior", objetivo: "Hipertrofia",
    nivel: "Intermedio", nivelOrden: 2, lugar: "Casa", equipo: ["Mancuernas", "Banda elástica", "Barra de dominadas", "Peso corporal"],
    descripcion: "Variantes para el segundo día de tren superior. " + CALENT, durEstMin: 50,
    bloques: [
      F(1, "EJ-8002", "Flexiones de brazos", 4, "10-15", 75, { rir: 1 }),
      F(2, "EJ-8011", "Remo invertido / con banda", 4, "10-12", 75, { rir: 1 }),
      F(3, "EJ-8019", "Elevaciones laterales", 3, "12-15", 45),
      F(4, "EJ-8021", "Face pull con banda", 3, "12-15", 45),
      F(5, "EJ-8022", "Aperturas de pecho con banda", 3, "12-15", 45),
      F(6, "EJ-8006", "Curl de bíceps", 3, "10-12", 45),
    ] },
  { id: "RUT-0012", nombre: "Hipertrofia — Tren inferior B", foco: "Tren inferior", objetivo: "Hipertrofia",
    nivel: "Intermedio", nivelOrden: 2, lugar: "Casa", equipo: ["Mancuernas", "Kettlebell", "Peso corporal", "Banco"],
    descripcion: "Énfasis unilateral y cadena posterior. " + CALENT, durEstMin: 50,
    bloques: [
      F(1, "EJ-8020", "Sentadilla búlgara", 4, "8-12", 90, { rir: 1, notas: "por pierna" }),
      F(2, "EJ-8010", "Peso muerto rumano (RDL)", 3, "10-12", 75, { rir: 1 }),
      F(3, "EJ-8012", "Swings con pesa", 3, "15", 60),
      F(4, "EJ-8014", "Puente de glúteos", 3, "12-15", 45),
      ISO(5, "EJ-8016", "Plancha lateral", 3, 30, true, 30),
    ] },

  { id: "RUT-0013", nombre: "Movilidad — Cuerpo completo", foco: "Movilidad", objetivo: "Movilidad",
    nivel: "Principiante", nivelOrden: 1, lugar: "Casa", equipo: ["Peso corporal"],
    descripcion: "Flujo de movilidad de cuerpo completo. Sin descanso entre ejercicios; hacelo lento y respirando.", durEstMin: 20,
    bloques: [
      MOV(1, "EJ-8025", "Círculos de cadera", 2, "10", false),
      MOV(2, "EJ-8023", "Gato–camello", 2, "10", false),
      MOV(3, "EJ-8026", "Apertura torácica", 2, "8", true),
      MOV(4, "EJ-8024", "Estiramiento del mundo (world's greatest)", 2, "5", true),
      MOV(5, "EJ-8027", "Estiramiento de isquios y flexores", 2, "0", true, 30),
      MOV(6, "EJ-8017", "Bird dog", 2, "10", true),
    ] },
  { id: "RUT-0014", nombre: "Recuperación — VR suave (Body Combat Z2)", foco: "VR", objetivo: "General / salud",
    nivel: "Principiante", nivelOrden: 1, lugar: "VR", equipo: ["VR"],
    descripcion: "Cardio muy suave en Z2: recuperación activa, sin picos. Bajá la dificultad del juego.", durEstMin: 30,
    bloques: [CVR(1, "EJ-9003", "Les Mills Bodycombat (VR)", 30, "Z2", "Les Mills Bodycombat", "Suave")] },

  { id: "RUT-0015", nombre: "Full-body express A", foco: "Cuerpo completo", objetivo: "Recomposición",
    nivel: "Principiante", nivelOrden: 1, lugar: "Casa", equipo: ["Mancuernas", "Banco", "Peso corporal"],
    descripcion: "Sesión corta de cuerpo completo (~30 min). Poco descanso, ejercicios compuestos.", durEstMin: 30,
    bloques: [
      F(1, "EJ-8001", "Sentadilla goblet", 2, "12", 45, { rir: 2 }),
      F(2, "EJ-8002", "Flexiones de brazos", 2, "máx", 45),
      F(3, "EJ-8004", "Remo a una mano con mancuerna", 2, "12", 45),
      ISO(4, "EJ-8016", "Plancha lateral", 2, 25, true, 20),
    ] },
  { id: "RUT-0016", nombre: "Full-body express B", foco: "Cuerpo completo", objetivo: "Recomposición",
    nivel: "Principiante", nivelOrden: 1, lugar: "Casa", equipo: ["Mancuernas", "Banda elástica", "Barra de dominadas", "Peso corporal"],
    descripcion: "Segunda sesión corta de cuerpo completo (~30 min).", durEstMin: 30,
    bloques: [
      F(1, "EJ-8008", "Zancada hacia atrás", 2, "10", 45, { rir: 2, notas: "por pierna" }),
      F(2, "EJ-8005", "Press de pecho con banda", 2, "12-15", 45),
      F(3, "EJ-8011", "Remo invertido / con banda", 2, "12", 45),
      F(4, "EJ-8014", "Puente de glúteos", 2, "15", 30),
    ] },
];

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
    idRutina: r.id, nombre: r.nombre, nombreCanonico: canon(r.nombre), foco: r.foco, objetivo: r.objetivo,
    nivel: r.nivel, nivelOrden: r.nivelOrden, lugar: r.lugar, equipoNecesario: r.equipo,
    ...(r.descripcion ? { descripcion: r.descripcion } : {}), ...(r.superseries ? { superseries: r.superseries } : {}),
    ...(r.notas ? { notas: r.notas } : {}), bloques: r.bloques,
    duracionEstimadaMin: r.durEstMin, totalSeries: totalSeries(r.bloques),
    vecesEntrenada: 0, fuente: "Plan ShapeUp",
    fechaCreacion: FieldValue.serverTimestamp(), ultimaModificacion: FieldValue.serverTimestamp(),
  };
}

// ── 3) Programas ──────────────────────────────────────────────────────────────
type Dia = { orden: number; dia?: string; etiqueta: string; tipo: "rutina" | "vr" | "descanso"; idRutina?: string; opcional?: boolean };
type PrgDef = { id: string; nombre: string; estado: string; objetivo: string; nivel: string; diasPorSemana: number;
  duracionSemanas?: number; descripcion: string; comoUsar?: string; reglasProgresion?: string[]; dias: Dia[] };
const DESC = (orden: number, dia: string): Dia => ({ orden, dia, etiqueta: `${dia} — Descanso`, tipo: "descanso", opcional: true });

const PROGRAMAS: PrgDef[] = [
  { id: "PRG-0006", nombre: "Hipertrofia — 4 días", estado: "Plantilla", objetivo: "Hipertrofia",
    nivel: "Intermedio", diasPorSemana: 4,
    descripcion: "Construir músculo: 2 días de tren superior + 2 de inferior, más volumen y menos VR.",
    comoUsar: "Pensado para cuando tengas el set de mancuernas. Progresá por carga (doble progresión).",
    reglasProgresion: ["Llegá a RIR 1–2 en las series pesadas.", "Cuando completes el tope de reps en todas, subí carga."],
    dias: [
      { orden: 1, dia: "lunes", etiqueta: "Lunes — Tren superior A", tipo: "rutina", idRutina: "RUT-0009" },
      { orden: 2, dia: "martes", etiqueta: "Martes — Tren inferior A", tipo: "rutina", idRutina: "RUT-0010" },
      { orden: 3, dia: "jueves", etiqueta: "Jueves — Tren superior B", tipo: "rutina", idRutina: "RUT-0011" },
      { orden: 4, dia: "viernes", etiqueta: "Viernes — Tren inferior B", tipo: "rutina", idRutina: "RUT-0012" },
    ] },

  { id: "PRG-0007", nombre: "Movilidad y recuperación", estado: "Plantilla", objetivo: "Movilidad",
    nivel: "Principiante", diasPorSemana: 3,
    descripcion: "Baja intensidad: movilidad + cardio suave. Para días flojos, semanas de descarga o arrancar tranquilo.",
    comoUsar: "Usalo como complemento o cuando venís cansado. Nada debería doler.",
    dias: [
      { orden: 1, dia: "lunes", etiqueta: "Lunes — Movilidad cuerpo completo", tipo: "rutina", idRutina: "RUT-0013" },
      { orden: 2, dia: "miércoles", etiqueta: "Miércoles — VR suave (Z2)", tipo: "rutina", idRutina: "RUT-0014" },
      { orden: 3, dia: "viernes", etiqueta: "Viernes — Movilidad cuerpo completo", tipo: "rutina", idRutina: "RUT-0013" },
    ] },

  { id: "PRG-0008", nombre: "Express — 2 días / 30 min", estado: "Plantilla", objetivo: "Recomposición",
    nivel: "Principiante", diasPorSemana: 2,
    descripcion: "Lo mínimo para no perder el hábito en semanas imposibles: 2 sesiones de cuerpo completo de 30 min.",
    comoUsar: "Si solo tenés 2 ratos en la semana, hacé A y B. Mejor esto que nada.",
    dias: [
      { orden: 1, dia: "lunes", etiqueta: "Lunes — Full-body express A", tipo: "rutina", idRutina: "RUT-0015" },
      { orden: 2, dia: "jueves", etiqueta: "Jueves — Full-body express B", tipo: "rutina", idRutina: "RUT-0016" },
    ] },

  { id: "PRG-0009", nombre: "Semana de descarga (deload)", estado: "Plantilla", objetivo: "Recomposición",
    nivel: "Intermedio", diasPorSemana: 3, duracionSemanas: 1,
    descripcion: "Una semana para recuperar cada 4–6 semanas: misma estructura, mucho menos volumen y carga.",
    comoUsar: "Esta semana: bajá a 2 series por ejercicio, RIR 3–4 (lejos del fallo) y cargas ~60% de lo habitual. " +
      "El VR en Z2 sin picos. El objetivo es recuperar, no progresar.",
    reglasProgresion: ["No busques records esta semana.", "Si dudás, hacé menos."],
    dias: [
      { orden: 1, dia: "lunes", etiqueta: "Lunes — Fuerza A (liviana)", tipo: "rutina", idRutina: "RUT-0001" },
      { orden: 2, dia: "miércoles", etiqueta: "Miércoles — Movilidad", tipo: "rutina", idRutina: "RUT-0013" },
      { orden: 3, dia: "viernes", etiqueta: "Viernes — Fuerza B (liviana)", tipo: "rutina", idRutina: "RUT-0002" },
      { orden: 4, dia: "sábado", etiqueta: "Sábado — VR suave (Z2)", tipo: "rutina", idRutina: "RUT-0014", opcional: true },
    ] },
];

function programaDoc(p: PrgDef): Record<string, unknown> {
  return {
    idPrograma: p.id, nombre: p.nombre, nombreCanonico: canon(p.nombre), estado: p.estado, objetivo: p.objetivo,
    nivel: p.nivel, diasPorSemana: p.diasPorSemana, ...(p.duracionSemanas ? { duracionSemanas: p.duracionSemanas } : {}),
    descripcion: p.descripcion, ...(p.comoUsar ? { comoUsar: p.comoUsar } : {}),
    ...(p.reglasProgresion ? { reglasProgresion: p.reglasProgresion } : {}),
    dias: p.dias.map((d) => ({ orden: d.orden, ...(d.dia ? { diaSemana: d.dia } : {}), etiqueta: d.etiqueta, tipo: d.tipo,
      ...(d.idRutina ? { idRutina: d.idRutina } : {}), opcional: d.opcional ?? false })),
    vecesUsado: 0, fechaCreacion: FieldValue.serverTimestamp(), ultimaModificacion: FieldValue.serverTimestamp(),
  };
}

// ── Runner ────────────────────────────────────────────────────────────────────
async function writeDoc(col: string, id: string, data: Record<string, unknown>, label: string) {
  const ref = db.collection(col).doc(id);
  if (!force && !dryRun) { const s = await ref.get(); if (s.exists) { console.log(`  SKIP  ${col}/${id}  ${label}`); return; } }
  if (dryRun) { console.log(`  [dry] WRITE ${col}/${id}  ${label}`); return; }
  await ref.set(data, { merge: false });
  console.log(`  ✅   WRITE ${col}/${id}  ${label}`);
}
async function run() {
  console.log(`\nSeed PLANES EXTRA — modo: ${dryRun ? "DRY RUN" : force ? "FORCE" : "SAFE"}\n`);
  console.log(`Ejercicios nuevos (${EJ.length}):`);
  for (const e of EJ) await writeDoc("ejercicios", e.id, ejercicioDoc(e), e.nombre);
  console.log(`\nRutinas (${RUTINAS.length}):`);
  for (const r of RUTINAS) await writeDoc("rutinas", r.id, rutinaDoc(r), r.nombre);
  console.log(`\nProgramas (${PROGRAMAS.length}):`);
  for (const p of PROGRAMAS) await writeDoc("programas", p.id, programaDoc(p), p.nombre);
  console.log("\nListo. (Corré antes seed-plan.ts y seed-vr.ts: este reusa RUT-0001/0002 y EJ-9003.)\n");
  process.exit(0);
}
run().catch((e) => { console.error(e); process.exit(1); });
