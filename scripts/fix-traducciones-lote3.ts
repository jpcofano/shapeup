/**
 * Lote 3 de re-pases de traducciones (30 entradas, ratios 0.34–0.55).
 * Reglas: 1 paso EN = 1 paso ES, voseo, respiración en los pasos,
 * conserva nombre/sinonimos/patron/modalidad/unilateral/puntosClave/erroresComunes.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const FILE = resolve("scripts/data/traducciones-fedb.es.json");
const t = JSON.parse(readFileSync(FILE, "utf8"));

const parches: Record<string, { instrucciones: string[] }> = {

  "Double_Leg_Butt_Kick": {
    instrucciones: [
      "Comenzá de pie con las rodillas ligeramente flexionadas.",
      "Hacé una semi-sentadilla rápida flexionando caderas y rodillas y, de inmediato, explotá hacia arriba buscando la máxima altura.",
      "Al subir, llevá los talones hacia los glúteos flexionando las rodillas, intentando tocarlos.",
      "Terminá el movimiento aterrizando con las rodillas parcialmente flexionadas, usando las piernas para absorber el impacto.",
    ],
  },

  "Dumbbell_Seated_One-Leg_Calf_Raise": {
    instrucciones: [
      "Colocá un bloque o escalón en el piso a unos 30 cm de un banco plano.",
      "Sentate en el banco y apoyá una mancuerna sobre el muslo superior izquierdo, a unos 7-8 cm por encima de la rodilla.",
      "Apoyá las puntas del pie izquierdo en el bloque, con el talón libre en el aire. Esta es la posición inicial.",
      "Elevá el talón lo más alto posible exhalando y contrayendo el gemelo. Mantené la contracción un segundo.",
      "Volvé lentamente a la posición inicial bajando el talón y estirando el gemelo todo lo posible.",
      "Completá las repeticiones indicadas y luego repetí con la pierna derecha.",
    ],
  },

  "Arm_Circles": {
    instrucciones: [
      "Pararte y extendé los brazos rectos hacia los costados a la altura de los hombros, paralelos al piso y perpendiculares al torso. Esta es la posición inicial.",
      "Comenzá a hacer círculos de unos 30 cm de diámetro con cada brazo extendido. Respirá normalmente durante el movimiento.",
      "Continuá los círculos unos diez segundos y luego invertí la dirección, girando hacia el lado opuesto.",
    ],
  },

  "Hip_Circles_prone": {
    instrucciones: [
      "Posicionáte en cuatro apoyos en el piso. Manteniendo una buena postura, levantá una rodilla flexionada del suelo. Esta es la posición inicial.",
      "Manteniendo la rodilla flexionada, rotá el fémur en arco intentando hacer un círculo grande con la rodilla y abriendo la cadera al máximo.",
      "Realizá el movimiento lentamente por el número de repeticiones indicadas y luego repetí del otro lado.",
    ],
  },

  "Band_Pull_Apart": {
    instrucciones: [
      "Comenzá con los brazos extendidos al frente a la altura del pecho, tomando la banda con ambas manos.",
      "Iniciá el movimiento realizando un vuelo inverso: llevá las manos hacia los costados lateralmente.",
      "Mantené los codos extendidos durante el movimiento, llevando la banda hasta el pecho. Aseguráte de mantener los hombros hacia atrás durante todo el ejercicio.",
      "Pausá al completar el movimiento y volvé a la posición inicial de manera controlada.",
    ],
  },

  "Spinal_Stretch": {
    instrucciones: [
      "Sentate en una silla con la espalda recta y los pies apoyados en el piso.",
      "Entrelazá los dedos detrás de la cabeza, los codos hacia afuera y el mentón hacia abajo.",
      "Rotá la parte superior del cuerpo hacia un lado lo más que puedas, unas 3 veces. Luego inclinarte hacia adelante y rotá el torso hasta apuntar el codo al piso en el interior de la rodilla.",
      "Volvé a la posición erguida y repetí hacia el otro lado.",
    ],
  },

  "Kettlebell_Turkish_Get-Up_Squat_style": {
    instrucciones: [
      "Acostáte boca arriba en el piso y presioná la pesa rusa hasta la posición superior extendiendo el codo. Flexioná la rodilla del mismo lado que la pesa.",
      "Manteniendo la pesa bloqueada arriba en todo momento, pivotá hacia el lado opuesto y usá el brazo libre para ayudarte a impulsarte hasta la posición de zancada.",
      "Con la mano libre empujá el suelo hasta quedar sentado, luego progresá hasta ponerte de pie. Mirando hacia arriba donde está la pesa, levantáte lentamente. Luego revertí toda la secuencia hasta volver al piso y repetí.",
    ],
  },

  "Butt_Lift_Bridge": {
    instrucciones: [
      "Acostáte boca arriba con las manos a los costados y las rodillas flexionadas. Los pies deben estar al ancho de los hombros aproximadamente. Esta es la posición inicial.",
      "Empujando principalmente con los talones, levantá la cadera del piso manteniendo la espalda recta. Exhalá durante esta parte del movimiento y mantené arriba un segundo.",
      "Volvé lentamente a la posición inicial mientras inhalás.",
    ],
  },

  "Star_Jump": {
    instrucciones: [
      "Comenzá de pie relajado con los pies al ancho de los hombros y los brazos cerca del cuerpo.",
      "Para iniciar el movimiento, hacé una media sentadilla y explotá hacia arriba lo más alto posible. Extendé todo el cuerpo completamente, separando piernas y brazos del cuerpo en forma de estrella.",
      "Al aterrizar, volvé a unir las extremidades y absorbé el impacto a través de las piernas.",
    ],
  },

  "Kettlebell_Sumo_High_Pull": {
    instrucciones: [
      "Colocá una pesa rusa en el piso entre tus pies. Adoptá una postura ancha tipo sumo y tomá la pesa con ambas manos. Llevá la cadera bien hacia atrás con las rodillas flexionadas. Mantenés el pecho y la cabeza arriba. Esta es la posición inicial.",
      "Comenzá extendiendo caderas y rodillas simultáneamente, y al hacerlo tirá la pesa hacia los hombros elevando los codos. Luego invertí el movimiento para volver a la posición inicial.",
    ],
  },

  "One-Arm_Kettlebell_Snatch": {
    instrucciones: [
      "Colocá una pesa rusa entre tus pies. Flexioná las rodillas y llevá la cadera hacia atrás para adoptar la posición inicial correcta con la espalda neutra.",
      "Mirá al frente y hacé un swing de la pesa hacia atrás entre las piernas.",
      "Inmediatamente invertí la dirección impulsando con caderas y rodillas para acelerar la pesa hacia arriba. A medida que la pesa sube a la altura del hombro, rotá la mano y extendé el brazo hacia arriba para recibir el peso bloqueado sobre la cabeza usando el impulso.",
    ],
  },

  "Childs_Pose": {
    instrucciones: [
      "Posicionáte en cuatro apoyos y caminá las manos hacia adelante.",
      "Bajá los glúteos hasta sentarte sobre los talones. Dejá que los brazos se deslicen por el piso mientras te sentás hacia atrás para estirar toda la columna.",
      "Una vez asentado sobre los talones, llevá las manos junto a los pies y relajáte. Respirá profundo 'hacia la espalda'. Apoyá la frente en el piso. Evitá esta posición si tenés problemas de rodilla.",
    ],
  },

  "Frog_Hops": {
    instrucciones: [
      "Pararte con las manos detrás de la cabeza y bajá en sentadilla manteniendo el torso erguido y la cabeza arriba. Esta es la posición inicial.",
      "Saltá hacia adelante varios pasos evitando saltar innecesariamente alto. Al contactar el piso, absorbé el impacto a través de las piernas y saltá de nuevo. Repetí esta acción entre 5 y 10 veces.",
    ],
  },

  "Hip_Extension_with_Bands": {
    instrucciones: [
      "Asegurá un extremo de la banda en la parte baja de un poste y enganchá el otro extremo en un tobillo.",
      "Mirando el punto de anclaje de la banda, agarráte de la columna o soporte para estabilizarte.",
      "Manteniendo la cabeza y el pecho arriba, llevá la pierna con resistencia hacia atrás lo más posible manteniendo la rodilla recta.",
      "Volvé la pierna a la posición inicial.",
    ],
  },

  "One-Arm_Dumbbell_Row": {
    instrucciones: [
      "Colocá una mancuerna a cada lado de un banco plano.",
      "Apoyá la rodilla y la mano derechas en el banco, inclinando el torso desde la cintura hasta que quede paralelo al piso.",
      "Tomá la mancuerna del piso con la mano izquierda con la palma hacia el cuerpo y la espalda recta. Esta es la posición inicial.",
      "Tirá la mancuerna hacia arriba hasta el costado del pecho, pegando el codo al cuerpo y sin mover el torso. Exhalá al subir. Concentráte en apretar los músculos de la espalda al llegar arriba. El antebrazo es solo un gancho: toda la fuerza viene de la espalda, no del bíceps.",
      "Bajá la mancuerna a la posición inicial mientras inhalás.",
      "Completá las repeticiones indicadas.",
      "Cambiá de lado y repetí con el brazo opuesto.",
    ],
  },

  "Standing_Hip_Circles": {
    instrucciones: [
      "Comenzá de pie en una sola pierna, sosteniéndote de un apoyo vertical.",
      "Elevá la rodilla libre a 90°. Esta es la posición inicial.",
      "Abrí la cadera lo más posible intentando hacer un círculo grande con la rodilla.",
      "Realizá este movimiento lentamente por el número de repeticiones indicadas y luego repetí del otro lado.",
    ],
  },

  "Kettlebell_Pistol_Squat": {
    instrucciones: [
      "Tomá una pesa rusa con ambas manos sosteniéndola por los cuernos. Levantá una pierna del piso y bajá en sentadilla sobre la otra.",
      "Bajá flexionando la rodilla y llevando la cadera hacia atrás, sosteniendo la pesa al frente como contrapeso.",
      "Mantené la posición del fondo un segundo y luego revertí el movimiento empujando con el talón, manteniendo la cabeza y el pecho arriba.",
      "Bajá nuevamente y repetí.",
    ],
  },

  "Side_Leg_Raises": {
    instrucciones: [
      "Paráte junto a una silla o apoyo que puedas sostener para estabilizarte. Pararte en una sola pierna. Esta es la posición inicial.",
      "Manteniendo la pierna recta, elevala hacia el costado lo más posible y luego balanceala de vuelta hacia abajo permitiendo que cruce la pierna de apoyo.",
      "Repetí este movimiento de balanceo entre 5 y 10 veces, aumentando el rango de movimiento a medida que avanzás.",
    ],
  },

  "Split_Squat_with_Dumbbells": {
    instrucciones: [
      "Posicionáte en postura escalonada con el pie trasero elevado sobre un banco y el pie delantero hacia adelante.",
      "Tomá una mancuerna en cada mano y dejalas colgar a los costados. Esta es la posición inicial.",
      "Comenzá el descenso flexionando rodilla y cadera para bajar el cuerpo. Mantenés una buena postura durante todo el movimiento y la rodilla delantera alineada sobre el pie.",
      "En el punto más bajo, empujá con el talón para extender rodilla y cadera y volver a la posición inicial.",
    ],
  },

  "All_Fours_Quad_Stretch": {
    instrucciones: [
      "Comenzá en cuatro apoyos y luego levantá un pie del piso tomándolo con la mano del mismo lado.",
      "Usá la mano para sostener el pie o el tobillo, manteniendo la rodilla completamente flexionada para estirar cuádriceps y flexores de cadera.",
      "Concentráte en extender la cadera empujándola hacia el piso. Mantené entre 10 y 20 segundos y luego cambiá de lado.",
    ],
  },

  "Scapular_Pull-Up": {
    instrucciones: [
      "Tomá la barra de dominadas con agarre prono (palmas hacia afuera).",
      "Desde la posición de colgado, eleváte unos centímetros sin usar los brazos. Hacelo deprimiendo la cintura escapular en un movimiento inverso al encogimiento de hombros.",
      "Pausá al completar el movimiento y luego volvé lentamente a la posición de colgado antes de realizar más repeticiones.",
    ],
  },

  "Band_Assisted_Pull-Up": {
    instrucciones: [
      "Enganchá la banda alrededor del centro de la barra de dominadas. Podés usar bandas de diferente resistencia para distintos niveles de asistencia.",
      "Tirá del extremo de la banda hacia abajo y colocá una rodilla flexionada en el lazo, asegurándote de que no se escape. Tomá la barra con un agarre de ancho medio a ancho. Esta es la posición inicial.",
      "Tirá hacia arriba contrayendo los dorsales mientras flexionás los codos. Llevá los codos hacia los costados del cuerpo. Subí hacia adelante intentando superar la barra con el mentón. Evitá balancearte o hacer movimientos bruscos.",
      "Después de una breve pausa en la parte superior, volvé a la posición inicial.",
    ],
  },

  "90_90_Hamstring": {
    instrucciones: [
      "Acostáte boca arriba con una pierna extendida recta en el piso.",
      "Con la otra pierna, flexioná la cadera y la rodilla a 90° cada una. Podés sostener el muslo con las manos si lo necesitás. Esta es la posición inicial.",
      "Extendé la pierna hacia el techo pausando brevemente arriba. Volvé a la posición inicial.",
      "Repetí entre 10 y 20 repeticiones y luego cambiá a la otra pierna.",
    ],
  },

  "Band_Good_Morning": {
    instrucciones: [
      "Usá una banda de resistencia. Pararte sobre un extremo separando un poco los pies. Doblate en la cadera para pasar el otro extremo de la banda detrás del cuello. Esta es la posición inicial.",
      "Manteniendo las piernas rectas, extendé desde la cadera hasta quedar casi vertical.",
      "Al bajar de vuelta a la posición inicial, aseguráte de no redondear la espalda.",
    ],
  },

  "Seated_Calf_Stretch": {
    instrucciones: [
      "Sentate erguido sobre una colchoneta o el piso.",
      "Flexioná una rodilla y apoyá ese pie en el piso para estabilizar el torso.",
      "Extendé la otra pierna y flexioná el tobillo (punta del pie hacia vos).",
      "Usando una banda, una toalla o la mano si alcanzás, tirá los dedos del pie hacia vos. Mantené entre 10 y 20 segundos y luego cambiá de lado.",
    ],
  },

  "Dynamic_Chest_Stretch": {
    instrucciones: [
      "Pararte con las manos juntas y los brazos extendidos directamente al frente a la altura del pecho. Esta es la posición inicial.",
      "Manteniendo los brazos rectos, movalos rápidamente hacia atrás lo más posible y volvé, como un aplauso exagerado. Repetí entre 5 y 10 veces aumentando la velocidad a medida que avanzás.",
    ],
  },

  "Kettlebell_Figure_8": {
    instrucciones: [
      "Colocá una pesa rusa entre las piernas y adoptá una postura más ancha que el ancho de hombros. Inclinate empujando los glúteos hacia atrás y manteniendo la espalda plana.",
      "Tomá la pesa y pasala a la otra mano por entre las piernas. La mano receptora debe llegar desde atrás de la pierna. Continuá pasándola de un lado al otro dibujando un ocho durante varias repeticiones.",
    ],
  },

  "Standing_Hip_Flexors": {
    instrucciones: [
      "Pararte con la columna vertical, el pie izquierdo levemente adelantado respecto al derecho.",
      "Flexioná ambas rodillas y levantá el talón trasero del piso mientras empujás la cadera derecha hacia adelante. Este estiramiento es sutil porque es difícil relajar el flexor de cadera mientras estás parado sobre él. Mantené unos segundos y cambiá de lado.",
    ],
  },

  "Kettlebell_One-Legged_Deadlift": {
    instrucciones: [
      "Sostené una pesa rusa por el mango en una mano. Pararte en la pierna del mismo lado que la pesa.",
      "Manteniendo esa rodilla ligeramente flexionada, realizá un peso muerto con pierna rígida: doblate desde la cadera extendiendo la pierna libre hacia atrás para mantener el equilibrio.",
      "Seguí bajando la pesa hasta que el cuerpo quede paralelo al suelo y luego volvé a la posición erguida extendiendo la cadera.",
    ],
  },

  "Band_Good_Morning_Pull_Through": {
    instrucciones: [
      "Pasá la banda alrededor de un poste. Parándote a cierta distancia, pasá el extremo libre alrededor del cuello. Las manos pueden ayudar a mantener la banda en posición.",
      "Comenzá doblándote desde las caderas, llevando los glúteos hacia atrás lo más posible. Mantené la espalda plana y doblate hacia adelante hasta unos 90°. Las rodillas deben estar solo ligeramente flexionadas.",
      "Volvé a la posición inicial impulsando las caderas hacia adelante hasta quedar de pie.",
    ],
  },
};

for (const [id, patch] of Object.entries(parches)) {
  if (!t[id]) { console.warn(`  ⚠ ID no encontrado: ${id}`); continue; }
  t[id] = { ...t[id], ...patch };
}

writeFileSync(FILE, JSON.stringify(t, null, 2), "utf8");
console.log("✅ Lote 3 aplicado — 30 re-pases.");
