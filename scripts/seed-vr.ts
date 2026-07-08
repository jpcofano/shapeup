// ════════════════════════════════════════════════════════════════════════════
//  scripts/seed-vr.ts — Siembra los juegos de VR (PSVR2) como ejercicios.
//
//  Los modelamos como Ejercicio de modalidad "Cardio" con equipo ["VR"], para que
//  entren en el catálogo y se puedan poner en rutinas/programas como cualquier otro.
//  IDs reservados EJ-9001+ (fuera del rango del importador FEDB, que arranca en 0001),
//  así nunca colisionan corra antes o después seed-ejercicios.ts.
//
//  Uso: npx tsx scripts/seed-vr.ts
//  Flags: --dry-run  (muestra qué haría sin escribir)
//         --force    (sobreescribe documentos existentes)
// ════════════════════════════════════════════════════════════════════════════

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));

const dryRun = process.argv.includes("--dry-run");
const force  = process.argv.includes("--force");

const serviceAccount = JSON.parse(
  readFileSync(resolve(__dir, "service-account.json"), "utf8"),
);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// ── Helper de normalización (espejo de lib/canonical.normalizeText) ───────────
const canon = (s: string): string =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim();

// ── Plantilla: todo VR comparte modalidad/equipo/patrón/fuente ────────────────
type EjVR = {
  idEjercicio: string;
  nombre: string;
  grupoMuscularPrimario: string;
  gruposSecundarios: string[];
  nivel: "Principiante" | "Intermedio" | "Avanzado";
  instrucciones: string[];
  puntosClave: string[];
  erroresComunes: string[];
  sinonimos: string[];
  poseido: boolean;        // marcamos lo que ya tiene el owner (informativo)
};

// Rol de cada juego sacado del análisis previo del plan (PSVR2).
const JUEGOS: EjVR[] = [
  {
    idEjercicio: "EJ-9001",
    nombre: "Pistol Whip (VR)",
    grupoMuscularPrimario: "Cuerpo completo",
    gruposSecundarios: ["Cuádriceps", "Glúteos", "Core", "Hombros"],
    nivel: "Intermedio",
    instrucciones: [
      "Elegí una canción y dificultad acorde a tu energía del día.",
      "Esquivá agachándote de verdad (flexionando rodillas y cadera), no solo bajando la cabeza.",
      "Mantené el tronco firme al disparar; girá desde la cadera, no solo el brazo.",
      "Buscá esquivar al ritmo: cada esquivada es una sentadilla parcial.",
    ],
    puntosClave: [
      "El valor de este juego son las piernas: agachate completo en cada esquive.",
      "Apuntá a 20–30 min sostenidos para que cuente como bloque de cardio.",
    ],
    erroresComunes: [
      "Esquivar solo con el cuello en vez de bajar con las piernas (pierde el efecto sentadilla).",
      "Quedarte estático disparando sin moverte.",
    ],
    sinonimos: ["Pistol Whip", "pistolwhip"],
    poseido: true,
  },
  {
    idEjercicio: "EJ-9002",
    nombre: "Beat Saber (VR)",
    grupoMuscularPrimario: "Cardiovascular",
    gruposSecundarios: ["Hombros", "Core", "Antebrazos"],
    nivel: "Avanzado",
    instrucciones: [
      "Subí a niveles Expert / Expert+ para que sea cardio real, no un paseo.",
      "Cortá con todo el brazo desde el hombro, acompañando con rotación de tronco.",
      "Mantené una base activa: pies en movimiento, rodillas blandas.",
    ],
    puntosClave: [
      "Es el rey de la quema: en Expert+ se van 400–600 kcal/h.",
      "Cardio de brazos y tronco; sumalo cuando el objetivo del día sea quemar.",
    ],
    erroresComunes: [
      "Jugar en fácil y creer que entrenaste.",
      "Cortar solo con la muñeca (menos gasto y más riesgo de molestias).",
    ],
    sinonimos: ["Beat Saber", "beatsaber"],
    poseido: false,   // el owner NO lo tiene; queda en el catálogo como referencia
  },
  {
    idEjercicio: "EJ-9003",
    nombre: "Les Mills Bodycombat (VR)",
    grupoMuscularPrimario: "Cardiovascular",
    gruposSecundarios: ["Hombros", "Core", "Cuádriceps"],
    nivel: "Intermedio",
    instrucciones: [
      "Elegí un entrenamiento guiado según el tiempo que tengas (hay de varias duraciones).",
      "Seguí al entrenador: golpes de puño, rodillazos y desplazamientos.",
      "Acompañá cada golpe con el giro de cadera y mantené la guardia arriba.",
    ],
    puntosClave: [
      "Es la app de fitness más completa de tu visor: cardio estructurado con coach.",
      "Ideal como base de los días de cardio (Z3–Z4).",
    ],
    erroresComunes: [
      "Tirar golpes flojos sin comprometer el cuerpo.",
      "Saltarte el calentamiento que propone la propia app.",
    ],
    sinonimos: ["Body Combat", "Bodycombat", "Les Mills"],
    poseido: true,
  },
  {
    idEjercicio: "EJ-9004",
    nombre: "Creed: Rise to Glory (VR)",
    grupoMuscularPrimario: "Cuerpo completo",
    gruposSecundarios: ["Hombros", "Espalda", "Core"],
    nivel: "Avanzado",
    instrucciones: [
      "Usalo en los días de intensidad alta: peleas cortas pero exigentes.",
      "Tirá, bloqueá y esquivá con todo el cuerpo; movés piernas para entrar y salir.",
      "Descansá entre rounds como descanso entre series.",
    ],
    puntosClave: [
      "Boxeo de cuerpo completo; el 'juego con ejercicio' que ayuda a la constancia.",
      "Reservalo para tus picos de intensidad de la semana.",
    ],
    erroresComunes: [
      "Pelear solo con los brazos sin usar las piernas para entrar/salir.",
      "Encadenar rounds sin pausa y reventar la técnica.",
    ],
    sinonimos: ["Creed", "Rise to Glory"],
    poseido: true,
  },
  {
    idEjercicio: "EJ-9005",
    nombre: "Synth Riders (VR)",
    grupoMuscularPrimario: "Cardiovascular",
    gruposSecundarios: ["Hombros", "Antebrazos", "Tríceps"],
    nivel: "Intermedio",
    instrucciones: [
      "Modo 'Force' o dificultad alta para que exija.",
      "Seguí los rieles estirando bien los brazos: alcanzá lejos, no recortes el rango.",
      "Movete con la música; dejá que el tronco acompañe.",
    ],
    puntosClave: [
      "La alternativa bailable a Beat Saber: alterná para no acostumbrar al cuerpo.",
      "Trabaja hombros y antebrazos; los rieles estiran y suman a tríceps.",
    ],
    erroresComunes: [
      "Quedarte rígido en el centro sin estirar a los costados.",
    ],
    sinonimos: ["Synth Riders", "synthriders"],
    poseido: false,
  },
  {
    idEjercicio: "EJ-9006",
    nombre: "OhShape Ultimate (VR)",
    grupoMuscularPrimario: "Cuerpo completo",
    gruposSecundarios: ["Cuádriceps", "Core", "Hombros"],
    nivel: "Intermedio",
    instrucciones: [
      "Elegí sesiones de cardio full-body (hay dedicadas a piernas y hombros).",
      "Adoptá las poses para pasar por los huecos: agachate, inclinate, estirá.",
      "No frenes entre paredes: el flujo continuo es lo que hace el cardio.",
    ],
    puntosClave: [
      "Full body divertido; segundo mejor aporte de piernas después de Pistol Whip.",
      "Bueno para quien no se siente 'bailarín'.",
    ],
    erroresComunes: [
      "Hacer las poses a medias y chocar las paredes.",
    ],
    sinonimos: ["OhShape", "Oh Shape"],
    poseido: false,
  },
  {
    idEjercicio: "EJ-9007",
    nombre: "Racket Fury: Table Tennis (VR)",
    grupoMuscularPrimario: "Cardiovascular",
    gruposSecundarios: ["Antebrazos", "Hombros"],
    nivel: "Principiante",
    instrucciones: [
      "Usalo en días de baja intensidad o como entrada en calor activa.",
      "Movete con las piernas para llegar a la pelota, no solo el brazo.",
    ],
    puntosClave: [
      "Cardio ligero y reflejos; para un día que querés moverte sin matarte.",
    ],
    erroresComunes: [
      "Jugar clavado en el lugar (anula el componente físico).",
    ],
    sinonimos: ["Racket Fury", "Table Tennis VR", "ping pong vr"],
    poseido: false,
  },
  {
    idEjercicio: "EJ-9008",
    nombre: "Kayak VR: Mirage (VR)",
    grupoMuscularPrimario: "Cardiovascular",
    gruposSecundarios: ["Espalda", "Core", "Antebrazos"],
    nivel: "Principiante",
    instrucciones: [
      "Modo simulación para remar tranquilo, o contrarreloj si querés exigir un poco.",
      "Remá con rotación de tronco, no solo brazos; mantené el core activo.",
    ],
    puntosClave: [
      "Recuperación activa: brazos y core suaves. Perfecto para el domingo.",
    ],
    erroresComunes: [
      "Remar solo con los brazos sin rotar el tronco.",
    ],
    sinonimos: ["Kayak VR", "Mirage"],
    poseido: false,
  },
  {
    idEjercicio: "EJ-9009",
    nombre: "PowerBeatsVR (VR)",
    grupoMuscularPrimario: "Cuerpo completo",
    gruposSecundarios: ["Cuádriceps", "Glúteos", "Hombros", "Core"],
    nivel: "Avanzado",
    instrucciones: [
      "Elegí un entrenamiento profesional, o cargá tu propia música con el auto-generador.",
      "Pegá, esquivá y AGACHATE al ritmo: las sentadillas son parte del juego, hacelas completas.",
      "Movete lateralmente para esquivar; mantené el core firme entre golpes.",
    ],
    puntosClave: [
      "App de fitness pura full-body: suma piernas (sentadillas) además de boxeo.",
      "Alta intensidad y sin suscripción; ideal para un día de quema fuerte.",
    ],
    erroresComunes: [
      "Hacer las sentadillas a medias (perdés justo el trabajo de piernas).",
      "Quedarte fijo en el lugar sin esquivar lateralmente.",
    ],
    sinonimos: ["PowerBeats", "PowerBeatsVR", "power beats"],
    poseido: true,
  },
  {
    idEjercicio: "EJ-9010",
    nombre: "Beat the Beats (VR)",
    grupoMuscularPrimario: "Cardiovascular",
    gruposSecundarios: ["Hombros", "Core", "Antebrazos", "Cuádriceps"],
    nivel: "Intermedio",
    instrucciones: [
      "Tirá golpes de boxeo reales al ritmo: jabs, crosses, ganchos y uppercuts.",
      "Usá los esquives laterales (lunges) que pide el juego: ahí entran las piernas.",
      "Acompañá cada golpe con rotación de tronco, no solo el brazo.",
    ],
    puntosClave: [
      "Boxeo rítmico, tipo Beat Saber pero con puños; cardio de brazos, hombros y core.",
      "Los esquives laterales suman algo de pierna; aprovechalos.",
    ],
    erroresComunes: [
      "Golpes flojos sin comprometer el cuerpo.",
      "No esquivar y quedarte parado tirando trompadas.",
    ],
    sinonimos: ["Beat the Beats", "beatthebeats"],
    poseido: true,
  },
];

// ── Arma el doc Ejercicio completo a partir de la plantilla VR ────────────────
function aEjercicio(j: EjVR): Record<string, unknown> {
  return {
    idEjercicio: j.idEjercicio,
    nombre: j.nombre,
    nombreCanonico: canon(j.nombre),
    modalidad: "Cardio",
    patron: "Locomoción / cardio",
    grupoMuscularPrimario: j.grupoMuscularPrimario,
    gruposSecundarios: j.gruposSecundarios,
    equipo: ["VR"],
    unilateral: false,
    nivel: j.nivel,
    instrucciones: j.instrucciones,
    puntosClave: j.puntosClave,
    erroresComunes: j.erroresComunes,
    descansoSugeridoSeg: 0,           // cardio continuo: el descanso lo define la prescripción
    // Ilustración SVG original (P51) — el owner puede pisar esto con URLs de
    // sus propios screenshots editando `imagenes` a mano; no hay arte oficial
    // de los juegos acá por copyright.
    imagenes: [`/vr/${j.idEjercicio.toLowerCase()}.svg`],
    sinonimos: j.sinonimos,
    fuente: "Plan ShapeUp",
    fuenteId: canon(j.nombre).replace(/ /g, "-"),
    origen: "seed",
    vecesUsado: 0,
    // Campo informativo propio del plan (no del modelo): qué ya tiene el owner.
    poseidoPorOwner: j.poseido,
    fechaCreacion: FieldValue.serverTimestamp(),
    ultimaModificacion: FieldValue.serverTimestamp(),
  };
}

// ── Runner (mismo patrón idempotente que seed-config / seed-ejercicios) ───────
async function run() {
  console.log(`\nSeed VR — ${JUEGOS.length} juegos — modo: ${dryRun ? "DRY RUN" : force ? "FORCE" : "SAFE"}\n`);

  let escritos = 0, saltados = 0;
  for (const j of JUEGOS) {
    const ref = db.collection("ejercicios").doc(j.idEjercicio);
    if (!force && !dryRun) {
      const snap = await ref.get();
      if (snap.exists) { console.log(`  SKIP  ${j.idEjercicio}  ${j.nombre}`); saltados++; continue; }
    }
    if (dryRun) { console.log(`  [dry] WRITE ${j.idEjercicio}  ${j.nombre}`); escritos++; continue; }
    await ref.set(aEjercicio(j), { merge: false });
    console.log(`  ✅   WRITE ${j.idEjercicio}  ${j.nombre}`);
    escritos++;
  }

  console.log(`\nListo. Escritos: ${escritos} · Salteados: ${saltados}\n`);
  process.exit(0);
}

run().catch((e) => { console.error(e); process.exit(1); });
