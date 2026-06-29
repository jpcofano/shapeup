/**
 * Lote 12 — 10 NUEVAS traducciones (intermediate + equipo hogareño, tanda final).
 * Completa el pool de candidatos intermediate + body only/dumbbell/bands/kettlebells.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const FILE = resolve("scripts/data/traducciones-fedb.es.json");
const t = JSON.parse(readFileSync(FILE, "utf8"));

const nuevos: Record<string, object> = {

  "Standing_Dumbbell_Straight-Arm_Front_Delt_Raise_Above_Head": {
    nombre: "Elevación frontal de brazos rectos por encima de la cabeza",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["straight arm front raise overhead"],
    instrucciones: [
      "Sostené las mancuernas frente a los muslos, con las palmas mirando hacia los muslos.",
      "Mantené los brazos rectos con una leve flexión en los codos, pero bloqueados. Esta es la posición inicial.",
      "Elevá las mancuernas en un movimiento semicircular hasta que los brazos queden completamente extendidos por encima de la cabeza, mientras exhalás.",
      "Volvé lentamente a la posición inicial usando el mismo camino mientras inhalás.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "Los brazos permanecen completamente rectos durante todo el arco de movimiento.",
    ],
    erroresComunes: [
      "Flexionar los codos para facilitar la subida.",
    ],
  },

  "Standing_Inner-Biceps_Curl": {
    nombre: "Curl de bíceps interno de pie",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["inner biceps curl de pie"],
    instrucciones: [
      "Pararte con una mancuerna en cada mano a extensión de brazos. Los codos cerca del torso. Las piernas separadas al ancho de hombros aproximadamente.",
      "Rotá las palmas de las manos para que queden mirando hacia adentro, en posición neutra. Esta es la posición inicial.",
      "Manteniendo los brazos superiores fijos, curvá los pesos hacia afuera mientras contraés el bíceps al exhalar. La muñeca debe girar de modo que, cuando los pesos estén completamente elevados, tengas un agarre supino (palmas hacia arriba).",
      "Solo se mueven los antebrazos. Continuá el movimiento hasta la contracción completa del bíceps con las mancuernas a la altura del hombro. Mantenés los antebrazos alineados con los deltoides laterales.",
      "Sostené la contracción un segundo apretando el bíceps.",
      "Comenzá a volver lentamente las mancuernas a la posición inicial mientras inhalás. Recordá rotar las muñecas al bajar el peso para volver al agarre neutro.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "La rotación de muñeca de neutro a supino durante la subida maximiza la contracción del bíceps.",
    ],
    erroresComunes: [
      "Llevar las mancuernas al frente en lugar de hacia afuera.",
    ],
  },

  "Standing_Palms-In_Dumbbell_Press": {
    nombre: "Press de pie agarre neutro con mancuernas",
    patron: "Empuje vertical",
    unilateral: false,
    sinonimos: ["palms in press de pie"],
    instrucciones: [
      "Comenzá con una mancuerna en cada mano con el brazo completamente extendido hacia el costado, usando agarre neutro. Los pies separados al ancho de hombros. Subí lentamente las mancuernas hasta crear un ángulo de 90° con los brazos. Los antebrazos deben quedar perpendiculares al piso. Esta es la posición inicial.",
      "Mantené el agarre neutro durante todo el ejercicio. Subí lentamente las mancuernas hasta que los brazos queden completamente extendidos.",
      "Mientras inhalás, bajá los pesos hasta que el brazo vuelva a formar un ángulo de 90°.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "El agarre neutro reduce el estrés en el hombro comparado con el press tradicional.",
    ],
    erroresComunes: [
      "Dejar que los codos se abran demasiado hacia afuera.",
    ],
  },

  "Tate_Press": {
    nombre: "Press Tate",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["tate press", "press triceps tate"],
    instrucciones: [
      "Acostáte en un banco plano con una mancuerna en cada mano sobre los muslos. Las palmas se miran entre sí.",
      "Con ayuda de los muslos para subir las mancuernas, levantalas de una a la vez hasta sostenerlas frente a vos al ancho de hombros. Al sostener las mancuernas frente a vos, asegurate de que los brazos queden más separados que el ancho de hombros, con agarre pronado (palmas hacia adelante). Dejá que los codos apunten hacia afuera. Esta es la posición inicial.",
      "Manteniendo los brazos superiores fijos, movés lentamente las mancuernas hacia adentro y abajo en un movimiento semicircular hasta que toquen la parte superior del pecho, mientras inhalás. Mantenés el control total de las mancuernas en todo momento y no dejás que descansen sobre el pecho ni mueven los brazos superiores.",
      "Al exhalar, subí las mancuernas usando el tríceps con el mismo movimiento semicircular pero en reversa. Intentá mantener las mancuernas juntas mientras suben. Bloqueá los brazos en la posición contraída, sostené un segundo y comenzá a bajar lentamente de nuevo. El descenso debería llevar al menos el doble de tiempo que el ascenso.",
      "Repetí el movimiento las veces indicadas.",
    ],
    puntosClave: [
      "Las cabezas de las mancuernas se tocan en la parte superior del pecho, no los mangos.",
    ],
    erroresComunes: [
      "Apoyar las mancuernas sobre el pecho entre repeticiones.",
    ],
  },

  "Two-Arm_Kettlebell_Clean": {
    nombre: "Cargada bilateral con pesas rusas",
    patron: "Dominante de cadera",
    unilateral: false,
    sinonimos: ["double kettlebell clean", "cargada con dos pesas rusas"],
    instrucciones: [
      "Colocá dos pesas rusas entre los pies. Para la posición inicial, llevá los glúteos hacia atrás y mirá al frente.",
      "Cargá las pesas a los hombros extendiendo piernas y cadera mientras las elevás hacia los hombros. Rotá las muñecas al hacerlo.",
      "Bajá las pesas de vuelta a la posición inicial y repetí.",
    ],
    puntosClave: [
      "Ambas pesas se cargan al mismo tiempo, exigiendo más coordinación y potencia simétrica.",
    ],
    erroresComunes: [
      "Cargar una pesa antes que la otra, perdiendo sincronía.",
    ],
  },

  "Two-Arm_Kettlebell_Jerk": {
    nombre: "Envión bilateral con pesas rusas",
    patron: "Empuje vertical",
    unilateral: false,
    sinonimos: ["double kettlebell jerk bilateral"],
    instrucciones: [
      "Cargá dos pesas rusas a los hombros extendiendo piernas y cadera mientras las balanceás hacia los hombros. Rotá las muñecas al hacerlo, de modo que las palmas queden mirando hacia adelante. Hacé una semi-flexión de unos centímetros y revertí el movimiento rápidamente, impulsando ambas pesas por encima de la cabeza. Inmediatamente después del impulso inicial, volvé a flexionar las piernas y metete debajo de las pesas. Una vez que las pesas estén bloqueadas, parate erguido para completar el ejercicio.",
    ],
    puntosClave: [
      "El impulso de piernas mueve el peso; los brazos solo guían y bloquean arriba.",
    ],
    erroresComunes: [
      "No meterse debajo de las pesas al recibirlas, forzando el hombro.",
    ],
  },

  "Two-Arm_Kettlebell_Military_Press": {
    nombre: "Press militar bilateral con pesas rusas",
    patron: "Empuje vertical",
    unilateral: false,
    sinonimos: ["double kettlebell military press"],
    instrucciones: [
      "Cargá dos pesas rusas a los hombros extendiendo piernas y cadera mientras las balanceás hacia los hombros. Rotá las muñecas al hacerlo, de modo que las palmas queden mirando hacia adelante.",
      "Presioná las pesas hacia arriba y afuera. Cuando las pesas pasen la altura de la cabeza, inclinate hacia los pesos para que queden 'guardadas' detrás de la cabeza. Asegurate de contraer el dorsal, el glúteo y el abdomen para mayor estabilidad.",
    ],
    puntosClave: [
      "Inclinarse hacia los pesos al pasar la cabeza permite un bloqueo más eficiente del codo.",
    ],
    erroresComunes: [
      "Arquear excesivamente la espalda baja al presionar.",
    ],
  },

  "Two-Arm_Kettlebell_Row": {
    nombre: "Remo bilateral con pesas rusas",
    patron: "Tracción horizontal",
    unilateral: false,
    sinonimos: ["double kettlebell row"],
    instrucciones: [
      "Colocá dos pesas rusas frente a los pies. Flexioná levemente las rodillas y llevá los glúteos hacia atrás lo más posible al inclinarte para llegar a la posición inicial.",
      "Tomá ambas pesas y llevalas hacia el abdomen, retrayendo los omóplatos y flexionando los codos. Mantené la espalda recta. Bajá y repetí.",
    ],
    puntosClave: [
      "Ambos brazos reman al mismo tiempo, exigiendo mayor estabilidad de la espalda baja.",
    ],
    erroresComunes: [
      "Redondear la espalda al inclinarse.",
    ],
  },

  "Wide-Grip_Rear_Pull-Up": {
    nombre: "Dominada por detrás agarre ancho",
    patron: "Tracción vertical",
    unilateral: false,
    sinonimos: ["rear pull up agarre ancho", "dominada tras nuca"],
    instrucciones: [
      "Tomá la barra de dominadas con las palmas hacia adelante usando agarre ancho.",
      "Con ambos brazos extendidos frente a vos sosteniendo la barra, llevá el torso y la cabeza hacia adelante de modo que se forme una línea imaginaria desde la barra hasta la nuca. Esta es la posición inicial.",
      "Tirá del torso hacia arriba hasta que la barra quede cerca de la nuca. Para esto, llevá los hombros y los brazos superiores hacia abajo y atrás mientras inclinás levemente la cabeza hacia adelante. Exhalá durante esta parte. Concentráte en apretar los músculos de la espalda al llegar a la contracción completa. El torso superior debe permanecer fijo en el espacio; solo se mueven los brazos. Los antebrazos no deben hacer otro trabajo más que sostener la barra.",
      "Después de un segundo en la posición contraída, comenzá a inhalar y bajá lentamente el torso a la posición inicial hasta que los brazos queden completamente extendidos y el dorsal totalmente estirado.",
      "Repetí este movimiento las veces indicadas.",
    ],
    puntosClave: [
      "Exige más movilidad de hombro que la dominada al frente; progresá con cuidado.",
    ],
    erroresComunes: [
      "Forzar el cuello hacia adelante para que la barra llegue a la nuca.",
    ],
  },

  "Zottman_Preacher_Curl": {
    nombre: "Curl Zottman en banco predicador",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["zottman curl predicador"],
    instrucciones: [
      "Tomá una mancuerna en cada mano y colocá los brazos superiores sobre el banco predicador o el banco inclinado. Las mancuernas deben estar a la altura del hombro y los codos flexionados. Sostené las mancuernas con las palmas hacia abajo. Esta es la posición inicial.",
      "Al inhalar, bajá lentamente las mancuernas manteniendo las palmas hacia abajo hasta que el brazo superior esté extendido y el bíceps completamente estirado.",
      "Ahora rotá las muñecas una vez que llegues a la parte baja del movimiento, de modo que las palmas queden mirando hacia arriba.",
      "Al exhalar, usá el bíceps para curvar los pesos hacia arriba hasta la contracción completa con las mancuernas a la altura del hombro. Recordá que para asegurar la contracción completa necesitás llevar el dedo meñique más alto que el pulgar.",
      "Apretá fuerte el bíceps un segundo en la posición contraída y rotá las muñecas para que las palmas vuelvan a mirar hacia abajo.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "La rotación de muñeca en cada extremo del movimiento trabaja bíceps y antebrazo en una sola repetición.",
    ],
    erroresComunes: [
      "Olvidar rotar la muñeca, convirtiéndolo en un curl predicador simple.",
    ],
  },
};

let nuevasAgregadas = 0;
for (const [id, entry] of Object.entries(nuevos)) {
  if (t[id]) {
    console.warn(`  ⚠ Ya existe: ${id} — se omite.`);
  } else {
    t[id] = entry;
    nuevasAgregadas++;
  }
}

writeFileSync(FILE, JSON.stringify(t, null, 2), "utf8");
console.log(`✅ Lote 12 aplicado — ${nuevasAgregadas} entradas nuevas agregadas.`);
