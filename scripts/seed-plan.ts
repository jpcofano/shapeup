// ════════════════════════════════════════════════════════════════════════════
//  scripts/seed-plan.ts — Siembra el PLAN real: ejercicios + rutinas + programas.
//
//  Crea, en este orden:
//   1) Ejercicios del plan con técnica curada (IDs reservados EJ-8001+),
//      separados del importador FEDB (EJ-0001+) y de los VR (EJ-9001+).
//   2) Rutinas: Fuerza A/B/C (RUT-0001..0003) + VR (RUT-0004..0008).
//   3) Programas: 5 variantes (PRG-0001..0005).
//
//  Requiere que los juegos de VR ya estén sembrados (seed-vr.ts → EJ-9001+),
//  porque las rutinas de VR los referencian.
//
//  Uso: npx tsx scripts/seed-plan.ts
//  Flags: --dry-run | --force
//
//  NOTA sobre cachés derivados: duracionEstimadaMin/totalSeries son ESTIMACIONES
//  del seed. La app los recalcula con calcularCacheRutina() (lib/metricas.ts) en
//  la primera edición de cada rutina; ahí quedan exactos.
//
//  NOTA sobre Fuerza C (circuito): el motor "Entrenar" actual recorre bloque por
//  bloque (completa las series de uno antes de pasar al siguiente), así que guía
//  el circuito de forma LINEAL, no round-robin. Se documenta como mejora futura
//  del reducer (entrenarState). Por eso C lleva descansos cortos y una nota.
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
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim();

// Construye un RangoNumerico desde un "raw" tipo "10-12", "12", "5-8", "máx".
function rango(raw: string): { value: number; min?: number; max?: number; raw: string } {
  const m = raw.match(/^(\d+)\s*[-–]\s*(\d+)$/);
  if (m) return { value: +m[1], min: +m[1], max: +m[2], raw };
  const n = raw.match(/^(\d+)$/);
  if (n) return { value: +n[1], raw };
  return { value: 0, raw }; // "máx", "AMRAP", etc.
}

// ════════════════════════════════════════════════════════════════════════════
//  1) EJERCICIOS DEL PLAN  (EJ-8001+)
// ════════════════════════════════════════════════════════════════════════════
type EjDef = {
  id: string; nombre: string;
  modalidad: "Fuerza" | "Cardio" | "Movilidad" | "Isométrico";
  patron: string; primario: string; secundarios: string[];
  equipo: string[]; nivel: "Principiante" | "Intermedio" | "Avanzado";
  unilateral?: boolean; descanso: number;
  instrucciones: string[]; puntosClave: string[]; erroresComunes: string[];
};

const EJ: EjDef[] = [
  { id: "EJ-8001", nombre: "Sentadilla goblet", modalidad: "Fuerza",
    patron: "Dominante de rodilla", primario: "Cuádriceps", secundarios: ["Glúteos", "Core"],
    equipo: ["Mancuernas", "Kettlebell"], nivel: "Principiante", descanso: 75,
    instrucciones: ["Sostené la pesa pegada al pecho con ambas manos, como una copa.",
      "Pies al ancho de hombros, puntas levemente hacia afuera.",
      "Bajá la cola hacia atrás y abajo (2–3 s) hasta muslos paralelos, espalda recta.",
      "Subí apretando glúteos."],
    puntosClave: ["Bajada controlada de 2–3 s.", "Apoyá todo el pie, talones en el piso."],
    erroresComunes: ["Rodillas que se van hacia adentro.", "Levantar los talones."] },

  { id: "EJ-8002", nombre: "Flexiones de brazos", modalidad: "Fuerza",
    patron: "Empuje horizontal", primario: "Pecho", secundarios: ["Hombros", "Tríceps", "Core"],
    equipo: ["Peso corporal"], nivel: "Principiante", descanso: 60,
    instrucciones: ["Manos un poco más anchas que los hombros.",
      "Cuerpo en línea recta de cabeza a talones (apretá glúteos y abdomen).",
      "Bajá el pecho en 2 s, codos a ~45° del cuerpo. Empujá."],
    puntosClave: ["Escalá: inclinadas → rodillas → completas → bajada lenta 4 s.",
      "Empezá donde hagas 8–12 con buena técnica."],
    erroresComunes: ["Cadera caída o en pico.", "Codos abiertos en T."] },

  { id: "EJ-8003", nombre: "Dominadas asistidas / negativas", modalidad: "Fuerza",
    patron: "Tracción vertical", primario: "Dorsales", secundarios: ["Bíceps", "Espalda media"],
    equipo: ["Barra de dominadas", "Banda elástica"], nivel: "Intermedio", descanso: 90,
    instrucciones: ["Asistida: con banda en la barra y el pie apoyado, ayudate a subir.",
      "Negativa: saltá arriba y bajá lo más lento posible (3–5 s).",
      "Llevá el pecho hacia la barra apretando las escápulas."],
    puntosClave: ["Las negativas lentas construyen la fuerza para la dominada completa."],
    erroresComunes: ["Subir con tirón y soltar de golpe en la bajada."] },

  { id: "EJ-8004", nombre: "Remo a una mano con mancuerna", modalidad: "Fuerza",
    patron: "Tracción horizontal", primario: "Espalda media", secundarios: ["Dorsales", "Bíceps"],
    equipo: ["Mancuernas", "Banco"], nivel: "Principiante", unilateral: true, descanso: 60,
    instrucciones: ["Apoyá una mano y rodilla en un banco/silla, espalda paralela al piso.",
      "Tirá la pesa hacia la cadera apretando la escápula, codo pegado al cuerpo.",
      "Bajá controlado hasta estirar."],
    puntosClave: ["El movimiento sale de la espalda, no del brazo."],
    erroresComunes: ["Rotar el tronco para levantar más peso."] },

  { id: "EJ-8005", nombre: "Press de pecho con banda", modalidad: "Fuerza",
    patron: "Empuje horizontal", primario: "Pecho", secundarios: ["Hombros", "Tríceps"],
    equipo: ["Banda elástica"], nivel: "Principiante", descanso: 60,
    instrucciones: ["Anclá la banda detrás tuyo a la altura del pecho (o pasala por la espalda).",
      "Empujá hacia adelante hasta estirar los brazos, juntando un poco las manos.",
      "Volvé controlado."],
    puntosClave: ["Si preferís, reemplazá por otra serie de flexiones."],
    erroresComunes: ["Soltar la banda de golpe en la vuelta."] },

  { id: "EJ-8006", nombre: "Curl de bíceps", modalidad: "Fuerza",
    patron: "Aislamiento", primario: "Bíceps", secundarios: ["Antebrazos"],
    equipo: ["Mancuernas", "Banda elástica"], nivel: "Principiante", descanso: 45,
    instrucciones: ["Codos pegados al cuerpo.", "Subí controlando, sin balancear.", "Bajá lento."],
    puntosClave: ["Controlá la bajada tanto como la subida."],
    erroresComunes: ["Balancear el cuerpo para subir.", "Despegar los codos."] },

  { id: "EJ-8007", nombre: "Extensión de tríceps (fondos en silla)", modalidad: "Fuerza",
    patron: "Empuje vertical", primario: "Tríceps", secundarios: ["Hombros"],
    equipo: ["Peso corporal", "Banco"], nivel: "Principiante", descanso: 45,
    instrucciones: ["Sentate al borde de una silla firme, manos a los lados.",
      "Deslizá la cola hacia afuera y bajá doblando los codos.", "Empujá hacia arriba."],
    puntosClave: ["Codos hacia atrás, no hacia los costados."],
    erroresComunes: ["Bajar demasiado y forzar el hombro."] },

  { id: "EJ-8008", nombre: "Zancada hacia atrás", modalidad: "Fuerza",
    patron: "Zancada / unilateral", primario: "Cuádriceps", secundarios: ["Glúteos", "Isquios"],
    equipo: ["Peso corporal", "Mancuernas"], nivel: "Principiante", unilateral: true, descanso: 75,
    instrucciones: ["Dá un paso largo hacia atrás y bajá la rodilla de atrás hacia el piso.",
      "El torso erguido; el peso en el talón de adelante.", "Volvé empujando con la pierna de adelante."],
    puntosClave: ["Hacé todas las reps de una pierna o alterná, como prefieras."],
    erroresComunes: ["Que la rodilla de adelante se vaya muy por delante del pie."] },

  { id: "EJ-8009", nombre: "Dominadas / chin-ups", modalidad: "Fuerza",
    patron: "Tracción vertical", primario: "Dorsales", secundarios: ["Bíceps"],
    equipo: ["Barra de dominadas"], nivel: "Intermedio", descanso: 90,
    instrucciones: ["Chin-up: agarre supino (palmas hacia vos), más fácil y con más bíceps.",
      "Subí hasta pasar el mentón la barra, bajá controlado."],
    puntosClave: ["Si no salen completas, usá la versión asistida (EJ-8003)."],
    erroresComunes: ["Balanceo (kipping) sin control."] },

  { id: "EJ-8010", nombre: "Peso muerto rumano (RDL)", modalidad: "Fuerza",
    patron: "Dominante de cadera", primario: "Isquios", secundarios: ["Glúteos", "Lumbares"],
    equipo: ["Mancuernas"], nivel: "Intermedio", descanso: 75,
    instrucciones: ["Pesas adelante de los muslos, rodillas apenas flexionadas.",
      "Llevá la cadera hacia atrás bajando las pesas pegadas a las piernas.",
      "Sentí el estiramiento atrás del muslo; subí apretando glúteos."],
    puntosClave: ["La espalda recta SIEMPRE; el movimiento es de cadera, no de espalda."],
    erroresComunes: ["Redondear la espalda baja.", "Convertirlo en sentadilla."] },

  { id: "EJ-8011", nombre: "Remo invertido / con banda", modalidad: "Fuerza",
    patron: "Tracción horizontal", primario: "Espalda media", secundarios: ["Dorsales", "Bíceps"],
    equipo: ["Banda elástica", "Barra de dominadas"], nivel: "Principiante", descanso: 60,
    instrucciones: ["Con banda: anclala al frente, tirá de las puntas hacia el abdomen apretando escápulas.",
      "Invertido: bajo una barra, cuerpo recto, tirá el pecho hacia la barra.",
      "Cuanto más horizontal el cuerpo, más difícil."],
    puntosClave: ["Codos pegados al cuerpo, apretá la espalda al final."],
    erroresComunes: ["Tirar solo con los brazos sin juntar las escápulas."] },

  { id: "EJ-8012", nombre: "Swings con pesa", modalidad: "Fuerza",
    patron: "Dominante de cadera", primario: "Glúteos", secundarios: ["Isquios", "Core", "Hombros"],
    equipo: ["Kettlebell", "Mancuernas"], nivel: "Intermedio", descanso: 30,
    instrucciones: ["Impulso explosivo de cadera: la pesa sube hasta la altura del pecho.",
      "Los brazos solo guían; la fuerza sale de la cadera.", "Espalda recta todo el tiempo."],
    puntosClave: ["El movimiento es un 'snap' de cadera, no un levantamiento de hombros."],
    erroresComunes: ["Querer subir la pesa con los brazos.", "Redondear la espalda."] },

  { id: "EJ-8013", nombre: "Mountain climbers", modalidad: "Cardio",
    patron: "Locomoción / cardio", primario: "Core", secundarios: ["Cardiovascular", "Hombros"],
    equipo: ["Peso corporal"], nivel: "Principiante", descanso: 20,
    instrucciones: ["En plancha alta, llevá una rodilla al pecho y alterná rápido.",
      "Mantené la cadera baja y el core firme."],
    puntosClave: ["Ritmo rápido pero sin levantar la cola."],
    erroresComunes: ["Subir la cadera y perder la plancha."] },

  { id: "EJ-8014", nombre: "Puente de glúteos", modalidad: "Fuerza",
    patron: "Dominante de cadera", primario: "Glúteos", secundarios: ["Isquios", "Core"],
    equipo: ["Peso corporal"], nivel: "Principiante", descanso: 45,
    instrucciones: ["Boca arriba, rodillas flexionadas, pies apoyados.",
      "Empujá con los talones y subí la cadera apretando glúteos.", "Pausá arriba 1 s y bajá."],
    puntosClave: ["Apretá glúteos arriba; no arquees la espalda baja."],
    erroresComunes: ["Empujar con la espalda en vez de los glúteos."] },

  { id: "EJ-8015", nombre: "Press de hombros", modalidad: "Fuerza",
    patron: "Empuje vertical", primario: "Hombros", secundarios: ["Tríceps"],
    equipo: ["Mancuernas"], nivel: "Principiante", descanso: 75,
    instrucciones: ["Pesas a la altura de los hombros.", "Empujá arriba hasta estirar sin trabar codos.",
      "Bajá controlado a los hombros."],
    puntosClave: ["No arquees la espalda baja; apretá el abdomen."],
    erroresComunes: ["Empujar hacia adelante en vez de arriba."] },

  { id: "EJ-8016", nombre: "Plancha lateral", modalidad: "Isométrico",
    patron: "Core anti-rotación", primario: "Core", secundarios: ["Hombros"],
    equipo: ["Peso corporal"], nivel: "Principiante", unilateral: true, descanso: 30,
    instrucciones: ["De costado, apoyá el antebrazo bajo el hombro.",
      "Subí la cadera hasta formar una línea recta y mantené."],
    puntosClave: ["Cadera bien arriba; cuerpo en línea."],
    erroresComunes: ["Dejar caer la cadera."] },

  { id: "EJ-8017", nombre: "Bird dog", modalidad: "Movilidad",
    patron: "Core anti-extensión", primario: "Core", secundarios: ["Glúteos", "Lumbares"],
    equipo: ["Peso corporal"], nivel: "Principiante", unilateral: true, descanso: 30,
    instrucciones: ["En cuatro patas, estirá brazo derecho + pierna izquierda.",
      "Mantené 1 s sin rotar la cadera y alterná."],
    puntosClave: ["El tronco quieto; no dejes que la cadera se vaya de lado."],
    erroresComunes: ["Rotar la cadera al estirar la pierna."] },

  { id: "EJ-8018", nombre: "Pallof press (banda)", modalidad: "Movilidad",
    patron: "Core anti-rotación", primario: "Core", secundarios: ["Hombros"],
    equipo: ["Banda elástica"], nivel: "Principiante", unilateral: true, descanso: 30,
    instrucciones: ["Banda anclada a un costado, a la altura del pecho.",
      "Llevá las manos al frente resistiendo la rotación; volvé controlado."],
    puntosClave: ["Anti-rotación: el core trabaja en NO girar."],
    erroresComunes: ["Dejar que el tronco gire hacia la banda."] },
];

function ejercicioDoc(e: EjDef): Record<string, unknown> {
  return {
    idEjercicio: e.id, nombre: e.nombre, nombreCanonico: canon(e.nombre),
    modalidad: e.modalidad, patron: e.patron,
    grupoMuscularPrimario: e.primario, gruposSecundarios: e.secundarios,
    equipo: e.equipo, unilateral: e.unilateral ?? false, nivel: e.nivel,
    instrucciones: e.instrucciones, puntosClave: e.puntosClave, erroresComunes: e.erroresComunes,
    descansoSugeridoSeg: e.descanso, sinonimos: [],
    fuente: "Plan ShapeUp", origen: "seed", vecesUsado: 0,
    fechaCreacion: FieldValue.serverTimestamp(), ultimaModificacion: FieldValue.serverTimestamp(),
  };
}

// ════════════════════════════════════════════════════════════════════════════
//  2) RUTINAS  (RUT-0001..0008)
// ════════════════════════════════════════════════════════════════════════════
const CALENT = "Calentamiento 6–8 min: círculos de hombros y cadera, 10 sentadillas al aire, " +
  "pull-aparts con banda ×15, rotaciones de tronco, 60 s de marcha/saltos suaves.";

// Bloque de fuerza
const F = (orden: number, id: string, nombre: string, series: number, reps: string, desc: number,
  extra: { grupoSet?: string; rir?: number; tempo?: string; notas?: string } = {}) => ({
  orden, idEjercicio: id, nombreEjercicio: nombre, modalidad: "Fuerza",
  prescripcion: {
    modalidad: "Fuerza", series, repsObjetivo: rango(reps), descansoSeg: desc,
    ...(extra.rir != null ? { rirObjetivo: extra.rir } : {}),
    ...(extra.tempo ? { tempo: extra.tempo } : {}),
  },
  ...(extra.grupoSet ? { grupoSet: extra.grupoSet } : {}),
  ...(extra.notas ? { notas: extra.notas } : {}),
});
// Bloque isométrico (plancha lateral)
const ISO = (orden: number, id: string, nombre: string, series: number, holdSeg: number, porLado: boolean, desc: number) => ({
  orden, idEjercicio: id, nombreEjercicio: nombre, modalidad: "Isométrico",
  prescripcion: { modalidad: "Isométrico", series, duracionHoldSeg: holdSeg, porLado, descansoSeg: desc },
});
// Bloque de movilidad/estabilidad (bird dog, pallof)
const MOV = (orden: number, id: string, nombre: string, rondas: number, reps: string, porLado: boolean, desc: number) => ({
  orden, idEjercicio: id, nombreEjercicio: nombre, modalidad: "Movilidad",
  prescripcion: { modalidad: "Movilidad", rondas, repsObjetivo: rango(reps), porLado, descansoSeg: desc },
});
// Bloque de cardio (mountain climbers en intervalos, o VR continuo)
const CINT = (orden: number, id: string, nombre: string, trabajoSeg: number, rondas: number, desc: number) => ({
  orden, idEjercicio: id, nombreEjercicio: nombre, modalidad: "Cardio",
  prescripcion: { modalidad: "Cardio", formato: "Intervalos", trabajoSeg, rondas, descansoSeg: desc, intensidad: "Vigorosa" },
});
const CVR = (orden: number, id: string, nombre: string, duracionMin: number, zona: string, juego: string) => ({
  orden, idEjercicio: id, nombreEjercicio: nombre, modalidad: "Cardio",
  prescripcion: { modalidad: "Cardio", formato: "Continuo", duracionMin, zonaObjetivo: zona, intensidad: "Moderada", juegoSugerido: juego },
});

type RutDef = {
  id: string; nombre: string; foco: string; objetivo: string; nivel: string; nivelOrden: number;
  lugar: string; equipo: string[]; descripcion?: string; superseries?: string[]; notas?: string;
  durEstMin: number; bloques: Record<string, unknown>[];
};

const RUTINAS: RutDef[] = [
  { id: "RUT-0001", nombre: "Fuerza A — Cuerpo completo (empuje)", foco: "Cuerpo completo",
    objetivo: "Recomposición", nivel: "Intermedio", nivelOrden: 2, lugar: "Casa",
    equipo: ["Mancuernas", "Banda elástica", "Barra de dominadas", "Peso corporal"],
    descripcion: "Día de fuerza con énfasis en empuje. " + CALENT,
    superseries: ["1+2", "3+5", "4+6"], durEstMin: 45,
    bloques: [
      F(1, "EJ-8001", "Sentadilla goblet", 3, "10-12", 75, { grupoSet: "A", rir: 2, tempo: "3-0-1-0" }),
      F(2, "EJ-8002", "Flexiones de brazos", 3, "8-15", 60, { grupoSet: "A", rir: 2 }),
      F(3, "EJ-8003", "Dominadas asistidas / negativas", 3, "5-8", 90, { grupoSet: "B", rir: 2 }),
      F(4, "EJ-8004", "Remo a una mano con mancuerna", 3, "12", 60, { grupoSet: "C", rir: 2 }),
      F(5, "EJ-8005", "Press de pecho con banda", 3, "12-15", 60, { grupoSet: "B", rir: 2 }),
      F(6, "EJ-8006", "Curl de bíceps", 2, "12", 45, { grupoSet: "C" }),
      ISO(7, "EJ-8016", "Plancha lateral", 3, 25, true, 30),
      MOV(8, "EJ-8017", "Bird dog", 3, "10", true, 30),
    ] },

  { id: "RUT-0002", nombre: "Fuerza B — Cuerpo completo (tracción y piernas)", foco: "Cuerpo completo",
    objetivo: "Recomposición", nivel: "Intermedio", nivelOrden: 2, lugar: "Casa",
    equipo: ["Mancuernas", "Banda elástica", "Barra de dominadas", "Peso corporal"],
    descripcion: "Día de fuerza con énfasis en tracción y piernas. " + CALENT,
    superseries: ["1+4", "2+5", "3+6"], durEstMin: 45,
    bloques: [
      F(1, "EJ-8008", "Zancada hacia atrás", 3, "10", 75, { grupoSet: "A", rir: 2, notas: "10 por pierna" }),
      F(2, "EJ-8009", "Dominadas / chin-ups", 3, "5-8", 90, { grupoSet: "B", rir: 2 }),
      F(3, "EJ-8010", "Peso muerto rumano (RDL)", 3, "10-12", 75, { grupoSet: "C", rir: 2, tempo: "3-0-1-0" }),
      F(4, "EJ-8011", "Remo invertido / con banda", 3, "12", 60, { grupoSet: "A", rir: 2 }),
      F(5, "EJ-8005", "Press de pecho con banda", 3, "12-15", 60, { grupoSet: "B", rir: 2 }),
      F(6, "EJ-8007", "Extensión de tríceps (fondos en silla)", 2, "12", 45, { grupoSet: "C" }),
      ISO(7, "EJ-8016", "Plancha lateral", 3, 25, true, 30),
      MOV(8, "EJ-8018", "Pallof press (banda)", 3, "10", true, 30),
    ] },

  { id: "RUT-0003", nombre: "Fuerza C — Circuito metabólico", foco: "Cardio / HIIT",
    objetivo: "Pérdida de grasa", nivel: "Intermedio", nivelOrden: 2, lugar: "Casa",
    equipo: ["Kettlebell", "Mancuernas", "Banda elástica", "Peso corporal"],
    descripcion: "Circuito: hacé los 5 ejercicios seguidos = 1 ronda; 3–4 rondas, 90 s entre rondas. " + CALENT,
    notas: "Pensado como circuito (round-robin). El modo guiado actual lo recorre lineal: " +
      "podés usar el modo scroll y hacer una ronda de cada uno, repitiendo 3–4 veces.",
    durEstMin: 30,
    bloques: [
      F(1, "EJ-8012", "Swings con pesa", 3, "15", 20, { grupoSet: "A" }),
      F(2, "EJ-8001", "Sentadilla goblet", 3, "12", 20, { grupoSet: "A" }),
      F(3, "EJ-8002", "Flexiones de brazos", 3, "máx", 20, { grupoSet: "A", notas: "máximo cómodo" }),
      F(4, "EJ-8011", "Remo invertido / con banda", 3, "15", 20, { grupoSet: "A" }),
      CINT(5, "EJ-8013", "Mountain climbers", 30, 3, 90),
    ] },

  // ── Rutinas de VR (cardio) ──────────────────────────────────────────────────
  { id: "RUT-0004", nombre: "VR — Quema full-body (PowerBeatsVR)", foco: "VR",
    objetivo: "Pérdida de grasa", nivel: "Avanzado", nivelOrden: 3, lugar: "VR", equipo: ["VR"],
    descripcion: "Cardio de alta intensidad: boxeo + esquives + sentadillas al ritmo.", durEstMin: 30,
    bloques: [CVR(1, "EJ-9009", "PowerBeatsVR (VR)", 30, "Z4", "PowerBeatsVR")] },

  { id: "RUT-0005", nombre: "VR — Rítmico (Beat the Beats)", foco: "VR",
    objetivo: "Recomposición", nivel: "Intermedio", nivelOrden: 2, lugar: "VR", equipo: ["VR"],
    descripcion: "Boxeo rítmico: brazos, hombros y core, con esquives laterales.", durEstMin: 30,
    bloques: [CVR(1, "EJ-9010", "Beat the Beats (VR)", 30, "Z3", "Beat the Beats")] },

  { id: "RUT-0006", nombre: "VR — Piernas y cardio (Pistol Whip)", foco: "VR",
    objetivo: "Recomposición", nivel: "Intermedio", nivelOrden: 2, lugar: "VR", equipo: ["VR"],
    descripcion: "Esquivar agachándose = sentadillas naturales. El que más suma piernas.", durEstMin: 30,
    bloques: [CVR(1, "EJ-9001", "Pistol Whip (VR)", 30, "Z3", "Pistol Whip")] },

  { id: "RUT-0007", nombre: "VR — Boxeo intenso (Creed)", foco: "VR",
    objetivo: "Resistencia muscular", nivel: "Avanzado", nivelOrden: 3, lugar: "VR", equipo: ["VR"],
    descripcion: "Boxeo de cuerpo completo para los días de intensidad alta (Z4).", durEstMin: 25,
    bloques: [CVR(1, "EJ-9004", "Creed: Rise to Glory (VR)", 25, "Z4", "Creed: Rise to Glory")] },

  { id: "RUT-0008", nombre: "VR — Cardio estructurado (Body Combat)", foco: "VR",
    objetivo: "General / salud", nivel: "Intermedio", nivelOrden: 2, lugar: "VR", equipo: ["VR"],
    descripcion: "Sesión guiada por coach; ideal para sesión larga manteniendo Z3 con picos a Z4.", durEstMin: 40,
    bloques: [CVR(1, "EJ-9003", "Les Mills Bodycombat (VR)", 40, "Z3", "Les Mills Bodycombat")] },
];

function totalSeries(bloques: Record<string, unknown>[]): number {
  let n = 0;
  for (const b of bloques) {
    const p = b.prescripcion as Record<string, unknown>;
    if (p.modalidad === "Fuerza" || p.modalidad === "Isométrico") n += p.series as number;
    else if (p.modalidad === "Movilidad") n += p.rondas as number;
    else if (p.modalidad === "Cardio") n += p.formato === "Intervalos" ? (p.rondas as number ?? 1) : 1;
  }
  return n;
}

function rutinaDoc(r: RutDef): Record<string, unknown> {
  return {
    idRutina: r.id, nombre: r.nombre, nombreCanonico: canon(r.nombre),
    foco: r.foco, objetivo: r.objetivo, nivel: r.nivel, nivelOrden: r.nivelOrden,
    lugar: r.lugar, equipoNecesario: r.equipo,
    ...(r.descripcion ? { descripcion: r.descripcion } : {}),
    ...(r.superseries ? { superseries: r.superseries } : {}),
    ...(r.notas ? { notas: r.notas } : {}),
    bloques: r.bloques,
    duracionEstimadaMin: r.durEstMin,   // estimación seed; la app la recalcula al editar
    totalSeries: totalSeries(r.bloques),
    vecesEntrenada: 0, fuente: "Plan ShapeUp",
    fechaCreacion: FieldValue.serverTimestamp(), ultimaModificacion: FieldValue.serverTimestamp(),
  };
}

// ════════════════════════════════════════════════════════════════════════════
//  3) PROGRAMAS  (PRG-0001..0005)
// ════════════════════════════════════════════════════════════════════════════
type Dia = { orden: number; dia?: string; etiqueta: string; tipo: "rutina" | "vr" | "descanso";
  idRutina?: string; vrSugerido?: string; opcional?: boolean; durMin?: number };
type PrgDef = {
  id: string; nombre: string; estado: string; objetivo: string; nivel: string;
  diasPorSemana: number; descripcion: string; comoUsar?: string; dias: Dia[];
};

const DESC = (orden: number, dia: string): Dia => ({ orden, dia, etiqueta: `${dia} — Descanso`, tipo: "descanso", opcional: true });

const PROGRAMAS: PrgDef[] = [
  { id: "PRG-0001", nombre: "Recomposición — 5 días (principal)", estado: "Activo",
    objetivo: "Recomposición", nivel: "Intermedio", diasPorSemana: 5,
    descripcion: "El plan completo: 3 días de fuerza + cardio VR + una sesión larga el sábado.",
    comoUsar: "Entrá cada día y hacé lo que toca. Si te falta tiempo, priorizá los días de fuerza.",
    dias: [
      { orden: 1, dia: "lunes", etiqueta: "Lunes — Fuerza A", tipo: "rutina", idRutina: "RUT-0001" },
      { orden: 2, dia: "martes", etiqueta: "Martes — Cardio VR (quema)", tipo: "rutina", idRutina: "RUT-0004" },
      { orden: 3, dia: "miércoles", etiqueta: "Miércoles — Fuerza B", tipo: "rutina", idRutina: "RUT-0002" },
      { orden: 4, dia: "jueves", etiqueta: "Jueves — Cardio VR (rítmico)", tipo: "rutina", idRutina: "RUT-0005" },
      { orden: 5, dia: "viernes", etiqueta: "Viernes — Fuerza C (circuito)", tipo: "rutina", idRutina: "RUT-0003" },
      { orden: 6, dia: "sábado", etiqueta: "Sábado — VR largo (Body Combat)", tipo: "rutina", idRutina: "RUT-0008", opcional: true },
      DESC(7, "domingo"),
    ] },

  { id: "PRG-0002", nombre: "Mínimo viable — 3 días", estado: "Plantilla",
    objetivo: "Recomposición", nivel: "Principiante", diasPorSemana: 3,
    descripcion: "Para semanas complicadas: Fuerza A → VR → Fuerza B. Lo esencial para no perder el hábito.",
    comoUsar: "3 días alternados. Si solo podés 2, hacé Fuerza A y Fuerza B.",
    dias: [
      { orden: 1, dia: "lunes", etiqueta: "Lunes — Fuerza A", tipo: "rutina", idRutina: "RUT-0001" },
      { orden: 2, dia: "miércoles", etiqueta: "Miércoles — Cardio VR", tipo: "rutina", idRutina: "RUT-0004" },
      { orden: 3, dia: "viernes", etiqueta: "Viernes — Fuerza B", tipo: "rutina", idRutina: "RUT-0002" },
    ] },

  { id: "PRG-0003", nombre: "Fuerza + VR — 4 días", estado: "Plantilla",
    objetivo: "Recomposición", nivel: "Intermedio", diasPorSemana: 4,
    descripcion: "Equilibrio simple: 2 de fuerza + 2 de cardio VR, sin sesión larga.",
    dias: [
      { orden: 1, dia: "lunes", etiqueta: "Lunes — Fuerza A", tipo: "rutina", idRutina: "RUT-0001" },
      { orden: 2, dia: "martes", etiqueta: "Martes — VR piernas (Pistol Whip)", tipo: "rutina", idRutina: "RUT-0006" },
      { orden: 3, dia: "jueves", etiqueta: "Jueves — Fuerza B", tipo: "rutina", idRutina: "RUT-0002" },
      { orden: 4, dia: "viernes", etiqueta: "Viernes — VR rítmico", tipo: "rutina", idRutina: "RUT-0005" },
    ] },

  { id: "PRG-0004", nombre: "Quema de grasa — VR dominante (6 días)", estado: "Plantilla",
    objetivo: "Pérdida de grasa", nivel: "Intermedio", diasPorSemana: 6,
    descripcion: "Más cardio que fuerza: 4 días de VR variado + 2 de fuerza. Máxima quema sosteniendo el músculo.",
    comoUsar: "Apuntá a Z3–Z4 en los días de VR. Mantené la fuerza para no perder músculo mientras bajás grasa.",
    dias: [
      { orden: 1, dia: "lunes", etiqueta: "Lunes — VR quema (PowerBeats)", tipo: "rutina", idRutina: "RUT-0004" },
      { orden: 2, dia: "martes", etiqueta: "Martes — Fuerza A", tipo: "rutina", idRutina: "RUT-0001" },
      { orden: 3, dia: "miércoles", etiqueta: "Miércoles — VR rítmico", tipo: "rutina", idRutina: "RUT-0005" },
      { orden: 4, dia: "jueves", etiqueta: "Jueves — VR piernas (Pistol Whip)", tipo: "rutina", idRutina: "RUT-0006" },
      { orden: 5, dia: "viernes", etiqueta: "Viernes — Fuerza B", tipo: "rutina", idRutina: "RUT-0002" },
      { orden: 6, dia: "sábado", etiqueta: "Sábado — VR boxeo (Creed)", tipo: "rutina", idRutina: "RUT-0007" },
      DESC(7, "domingo"),
    ] },

  { id: "PRG-0005", nombre: "Solo VR — sin equipo / viaje (5 días)", estado: "Plantilla",
    objetivo: "General / salud", nivel: "Intermedio", diasPorSemana: 5,
    descripcion: "Cuando no tenés pesas o estás de viaje: rotación de juegos de VR para sostener el cardio.",
    comoUsar: "Rotá los juegos para no aburrirte ni acostumbrar al cuerpo. Bajá un cambio si venís cansado.",
    dias: [
      { orden: 1, dia: "lunes", etiqueta: "Lunes — Pistol Whip", tipo: "rutina", idRutina: "RUT-0006" },
      { orden: 2, dia: "martes", etiqueta: "Martes — PowerBeats", tipo: "rutina", idRutina: "RUT-0004" },
      { orden: 3, dia: "miércoles", etiqueta: "Miércoles — Beat the Beats", tipo: "rutina", idRutina: "RUT-0005" },
      { orden: 4, dia: "jueves", etiqueta: "Jueves — Body Combat", tipo: "rutina", idRutina: "RUT-0008" },
      { orden: 5, dia: "viernes", etiqueta: "Viernes — Creed", tipo: "rutina", idRutina: "RUT-0007" },
    ] },
];

function programaDoc(p: PrgDef): Record<string, unknown> {
  return {
    idPrograma: p.id, nombre: p.nombre, nombreCanonico: canon(p.nombre),
    estado: p.estado, objetivo: p.objetivo, nivel: p.nivel, diasPorSemana: p.diasPorSemana,
    descripcion: p.descripcion, ...(p.comoUsar ? { comoUsar: p.comoUsar } : {}),
    dias: p.dias.map((d) => ({
      orden: d.orden, ...(d.dia ? { diaSemana: d.dia } : {}), etiqueta: d.etiqueta, tipo: d.tipo,
      ...(d.idRutina ? { idRutina: d.idRutina } : {}), ...(d.vrSugerido ? { vrSugerido: d.vrSugerido } : {}),
      ...(d.durMin ? { duracionObjetivoMin: d.durMin } : {}), opcional: d.opcional ?? false,
    })),
    vecesUsado: 0,
    fechaCreacion: FieldValue.serverTimestamp(), ultimaModificacion: FieldValue.serverTimestamp(),
  };
}

// ════════════════════════════════════════════════════════════════════════════
//  Runner idempotente
// ════════════════════════════════════════════════════════════════════════════
async function writeDoc(col: string, id: string, data: Record<string, unknown>, label: string) {
  const ref = db.collection(col).doc(id);
  if (!force && !dryRun) {
    const snap = await ref.get();
    if (snap.exists) { console.log(`  SKIP  ${col}/${id}  ${label}`); return "skip"; }
  }
  if (dryRun) { console.log(`  [dry] WRITE ${col}/${id}  ${label}`); return "dry"; }
  await ref.set(data, { merge: false });
  console.log(`  ✅   WRITE ${col}/${id}  ${label}`);
  return "write";
}

async function run() {
  console.log(`\nSeed PLAN — modo: ${dryRun ? "DRY RUN" : force ? "FORCE" : "SAFE"}\n`);

  console.log(`Ejercicios del plan (${EJ.length}):`);
  for (const e of EJ) await writeDoc("ejercicios", e.id, ejercicioDoc(e), e.nombre);

  console.log(`\nRutinas (${RUTINAS.length}):`);
  for (const r of RUTINAS) await writeDoc("rutinas", r.id, rutinaDoc(r), r.nombre);

  console.log(`\nProgramas (${PROGRAMAS.length}):`);
  for (const p of PROGRAMAS) await writeDoc("programas", p.id, programaDoc(p), p.nombre);

  console.log("\nListo. Recordá: las rutinas de VR referencian EJ-9001+ (corré seed-vr.ts antes).\n");
  process.exit(0);
}

run().catch((e) => { console.error(e); process.exit(1); });
