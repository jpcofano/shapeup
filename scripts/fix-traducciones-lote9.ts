/**
 * Lote 9 — 11 NUEVAS traducciones (beginner + equipo hogareño, tanda final).
 * Completa el pool de candidatos beginner + body only/dumbbell/bands/kettlebells.
 * (Side_Jackknife se excluye: 0 pasos en FEDB.)
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const FILE = resolve("scripts/data/traducciones-fedb.es.json");
const t = JSON.parse(readFileSync(FILE, "utf8"));

const nuevos: Record<string, object> = {

  "Standing_One-Arm_Dumbbell_Triceps_Extension": {
    nombre: "Extensión de tríceps unilateral de pie",
    patron: "Aislamiento",
    unilateral: true,
    sinonimos: ["triceps extension de pie un brazo sobre cabeza"],
    instrucciones: [
      "Para comenzar, pararte con una mancuerna en una mano. Los pies separados al ancho de hombros. Extendé completamente el brazo con la mancuerna por encima de la cabeza. El dedo meñique debe apuntar al techo y la palma hacia adelante. La mancuerna queda por encima de la cabeza.",
      "Esta es la posición inicial.",
      "Manteniendo el brazo superior cerca de la cabeza (codo adentro) y perpendicular al piso, bajá el peso en un movimiento semicircular detrás de la cabeza hasta que el antebrazo toque el bíceps. El brazo superior permanece fijo; solo se mueve el antebrazo. Inhalá durante este paso.",
      "Volvé a la posición inicial usando el tríceps para subir la mancuerna. Exhalá durante este paso.",
      "Repetí las veces indicadas.",
      "Cambiá de brazo y repetí.",
    ],
    puntosClave: [
      "El codo apunta al techo y permanece fijo en todo momento.",
    ],
    erroresComunes: [
      "Abrir el codo hacia afuera al bajar.",
    ],
  },

  "Standing_Palm-In_One-Arm_Dumbbell_Press": {
    nombre: "Press unilateral de pie agarre neutro",
    patron: "Empuje vertical",
    unilateral: true,
    sinonimos: ["press de hombro un brazo agarre neutro"],
    instrucciones: [
      "Comenzá con una mancuerna en una mano y el brazo completamente extendido hacia el costado con agarre neutro. Usá el otro brazo para sostenerte de un banco inclinado y mantener el equilibrio.",
      "Los pies separados al ancho de hombros. Subí lentamente la mancuerna hasta crear un ángulo de 90° con el brazo. El antebrazo debe quedar perpendicular al piso. Mantenés el agarre neutro durante todo el ejercicio.",
      "Subí lentamente la mancuerna hasta que el brazo quede completamente extendido. Esta es la posición inicial.",
      "Mientras inhalás, bajá el peso hasta que el brazo vuelva a formar un ángulo de 90°.",
      "Sentí la contracción un segundo y subí el peso de vuelta a la posición inicial mientras exhalás. Recordá sostenerte del banco inclinado y mantener los pies firmes para conservar el equilibrio.",
      "Repetí las veces indicadas.",
      "Cambiá de brazo y repetí.",
    ],
    puntosClave: [
      "El agarre neutro reduce el estrés en el hombro comparado con el press tradicional.",
    ],
    erroresComunes: [
      "Perder el equilibrio por no apoyarse bien en el banco.",
    ],
  },

  "Standing_Towel_Triceps_Extension": {
    nombre: "Extensión de tríceps de pie con toalla (asistida)",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["towel triceps extension", "extension triceps con toalla y compañero"],
    instrucciones: [
      "Para comenzar, pararte con ambos brazos completamente extendidos por encima de la cabeza sosteniendo un extremo de una toalla con ambas manos. Los codos adentro y los brazos perpendiculares al piso con las palmas enfrentadas; los pies al ancho de hombros. Esta es la posición inicial.",
      "Coordináte con tu compañero para que sostenga el otro extremo de la toalla y aplique resistencia. Manteniendo los brazos superiores cerca de la cabeza (codos adentro) y perpendiculares al piso, bajá la resistencia en un movimiento semicircular detrás de la cabeza hasta que los antebrazos toquen los bíceps. Los brazos superiores permanecen fijos; solo se mueven los antebrazos. Inhalá durante este paso.",
      "Volvé a la posición inicial usando el tríceps para subir la toalla. Exhalá durante este paso.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "Requiere un compañero que regule la resistencia desde el otro extremo de la toalla.",
    ],
    erroresComunes: [
      "Separar los codos durante el descenso.",
    ],
  },

  "Stiff-Legged_Dumbbell_Deadlift": {
    nombre: "Peso muerto piernas rígidas con mancuernas",
    patron: "Dominante de cadera",
    unilateral: false,
    sinonimos: ["stiff legged deadlift", "peso muerto rumano con mancuernas"],
    instrucciones: [
      "Tomá un par de mancuernas y sostenelas a los costados a extensión de brazos.",
      "Pararte con el torso recto y las piernas separadas al ancho de hombros o más cerradas. Las rodillas deben estar levemente flexionadas. Esta es la posición inicial.",
      "Manteniendo las rodillas fijas, bajá las mancuernas hasta la altura de los pies doblándote desde la cintura mientras mantenés la espalda recta. Seguí bajando como si fueras a levantar algo del piso hasta sentir el estiramiento en los isquiotibiales. Exhalá durante este movimiento.",
      "Comenzá a subir el torso de nuevo extendiendo las caderas y la cintura hasta volver a la posición inicial. Inhalá durante este movimiento.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "Las rodillas permanecen con la misma leve flexión durante todo el movimiento; el rango viene de la cadera.",
    ],
    erroresComunes: [
      "Redondear la espalda baja al bajar.",
    ],
  },

  "Stomach_Vacuum": {
    nombre: "Vacío abdominal (stomach vacuum)",
    patron: "Core anti-extensión",
    unilateral: false,
    sinonimos: ["stomach vacuum", "vacuum abdominal"],
    instrucciones: [
      "Para comenzar, pararte derecho con los pies al ancho de hombros. Colocá las manos en la cadera. Esta es la posición inicial.",
      "Ahora inhalá lentamente todo el aire que puedas y luego comenzá a exhalar todo lo posible mientras metés el abdomen lo más que puedas, sosteniendo esa posición. Intentá visualizar el ombligo tocando la columna.",
      "Una contracción isométrica dura unos 20 segundos. Durante esos 20 segundos, intentá respirar con normalidad. Luego inhalá y volvé el abdomen a la posición inicial.",
      "Una vez que practiques este ejercicio, intentá sostenerlo por más de 20 segundos. Podés progresar hasta 40-60 segundos.",
      "Repetí las series indicadas.",
    ],
    puntosClave: [
      "El objetivo es activar el transverso abdominal, no el recto abdominal.",
    ],
    erroresComunes: [
      "Contener completamente la respiración durante toda la contracción.",
    ],
  },

  "Tuck_Crunch": {
    nombre: "Crunch con piernas encogidas (tuck crunch)",
    patron: "Core flexión",
    unilateral: false,
    sinonimos: ["tuck crunch", "crunch piernas cruzadas"],
    instrucciones: [
      "Para comenzar, acostáte en el piso o una colchoneta con la espalda apoyada. Los brazos a los costados con las palmas hacia abajo.",
      "Cruzá las piernas enganchando un tobillo sobre el otro. Elevá lentamente las piernas en el aire hasta que los muslos queden perpendiculares al piso con una leve flexión de rodilla. Las rodillas y los dedos de los pies deben quedar paralelos al piso, a diferencia de los muslos.",
      "Llevá los brazos del piso y cruzalos sobre el pecho. Esta es la posición inicial.",
      "Manteniendo la espalda baja presionada contra el piso, elevá lentamente el torso. Recordá exhalar durante esta parte del ejercicio.",
      "Bajá lentamente el torso de vuelta a la posición inicial mientras inhalás.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "La espalda baja permanece pegada al piso durante todo el movimiento.",
    ],
    erroresComunes: [
      "Despegar la espalda baja del piso al subir el torso.",
    ],
  },

  "Two-Arm_Dumbbell_Preacher_Curl": {
    nombre: "Curl predicador bilateral con mancuernas",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["preacher curl dos brazos", "curl predicador con mancuernas"],
    instrucciones: [
      "Tomá una mancuerna en cada mano y colocá los brazos superiores sobre el banco predicador o el banco inclinado. Las mancuernas deben estar a la altura del hombro. Esta es la posición inicial.",
      "Al inhalar, bajá lentamente las mancuernas hasta que los brazos estén completamente extendidos y el bíceps en estiramiento total.",
      "Al exhalar, usá el bíceps para curvar los pesos hacia arriba hasta la contracción completa con las mancuernas a la altura del hombro.",
      "Apretá fuerte el bíceps un segundo en la posición contraída y repetí las veces indicadas.",
    ],
    puntosClave: [
      "El banco predicador elimina por completo el impulso del hombro.",
    ],
    erroresComunes: [
      "Levantar los codos del banco para ayudar a subir el peso.",
    ],
  },

  "V-Bar_Pullup": {
    nombre: "Dominada con barra en V",
    patron: "Tracción vertical",
    unilateral: false,
    sinonimos: ["v bar pullup", "dominada agarre v"],
    instrucciones: [
      "Comenzá colocando el centro de la barra en V en el medio de la barra de dominadas (asumiendo que la estación que usás no tiene agarres neutros incorporados). Las manijas de la barra en V quedan hacia abajo para que puedas colgarte de la barra usando las manijas.",
      "Una vez asegurada la barra en V, tomá ambos lados y colgáte de ella. Sacá el pecho y reclinate levemente hacia atrás para activar mejor el dorsal. Esta es la posición inicial.",
      "Usando el dorsal, tirá el torso hacia arriba inclinando levemente la cabeza hacia atrás para no golpearte con la barra. Continuá hasta que el pecho casi toque la barra en V. Exhalá durante este movimiento.",
      "Después de un segundo en la posición contraída, bajá lentamente el cuerpo a la posición inicial mientras inhalás.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "El agarre neutro de la barra en V reduce el estrés en hombro y muñeca comparado con el agarre pronado.",
    ],
    erroresComunes: [
      "Hacer kipping (balancearse) para subir.",
    ],
  },

  "Vertical_Swing": {
    nombre: "Swing vertical con mancuerna",
    patron: "Dominante de cadera",
    unilateral: false,
    sinonimos: ["vertical swing", "swing con mancuerna"],
    instrucciones: [
      "Dejá que la mancuerna cuelgue a extensión de brazos entre las piernas, sosteniéndola con ambas manos. Mantené la espalda recta y la cabeza arriba.",
      "Balanceá la mancuerna entre las piernas, flexionando las caderas y doblando levemente las rodillas.",
      "Revertí el movimiento con potencia extendiendo caderas, rodillas y tobillos para propulsarte hacia arriba, balanceando la mancuerna por encima de la cabeza.",
      "Al aterrizar, absorbé el impacto con las piernas y llevá la mancuerna de vuelta al torso antes de la siguiente repetición.",
    ],
    puntosClave: [
      "La potencia viene de la extensión explosiva de cadera, no de los brazos.",
    ],
    erroresComunes: [
      "Levantar la mancuerna con los brazos en lugar de con la cadera.",
    ],
  },

  "Wind_Sprints": {
    nombre: "Elevación de rodillas alternada colgado de barra",
    patron: "Core flexión",
    unilateral: true,
    sinonimos: ["wind sprints colgado", "knee raise colgado alternado"],
    instrucciones: [
      "Colgáte de una barra de dominadas con agarre pronado. Los brazos y las piernas extendidos. Esta es la posición inicial.",
      "Comenzá elevando rápidamente una rodilla lo más alto posible. No balancees el cuerpo ni las piernas.",
      "Revertí inmediatamente el movimiento, volviendo esa pierna a la posición inicial. Simultáneamente, elevá la rodilla contraria lo más alto posible.",
      "Seguí alternando entre piernas hasta completar la serie.",
    ],
    puntosClave: [
      "El cuerpo permanece quieto; solo las piernas se mueven, sin balanceo.",
    ],
    erroresComunes: [
      "Balancear el cuerpo para ganar altura en la rodilla.",
    ],
  },

  "Wrist_Circles": {
    nombre: "Círculos de muñeca",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["wrist circles", "movilidad de muñeca"],
    instrucciones: [
      "Comenzá parado derecho con los pies al ancho de hombros. Elevá los brazos a los costados hasta que queden completamente extendidos y paralelos al piso, a la altura de los hombros. El torso y los brazos deben formar la letra 'T'. Las palmas miran hacia abajo. Esta es la posición inicial.",
      "Manteniendo todo el cuerpo fijo excepto las muñecas, comenzá a rotar ambas muñecas hacia adelante en un movimiento circular. Imaginá que estás dibujando círculos con las manos como pincel. Respirá con normalidad durante el ejercicio.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "Ideal como movilidad articular antes de ejercicios de empuje o tracción.",
    ],
    erroresComunes: [
      "Mover el brazo entero en lugar de aislar la muñeca.",
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
console.log(`✅ Lote 9 aplicado — ${nuevasAgregadas} entradas nuevas agregadas.`);
