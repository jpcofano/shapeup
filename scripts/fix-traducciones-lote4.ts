/**
 * Lote 4 de re-pases de traducciones (21 entradas, ratios 0.55–0.70).
 * Reglas: 1 paso EN = 1 paso ES, voseo, respiración en los pasos,
 * conserva nombre/sinonimos/patron/modalidad/unilateral/puntosClave/erroresComunes.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const FILE = resolve("scripts/data/traducciones-fedb.es.json");
const t = JSON.parse(readFileSync(FILE, "utf8"));

const parches: Record<string, { instrucciones: string[] }> = {

  "Standing_Gastrocnemius_Calf_Stretch": {
    instrucciones: [
      "Colocá el talón derecho sobre un escalón con la rodilla extendida e inclinate hacia adelante para tomar el dedo gordo del pie derecho con la mano derecha. La rodilla izquierda debe estar levemente flexionada y la espalda recta.",
      "Sostenés tu peso sobre la pierna izquierda y apoyás la mano izquierda sobre el muslo izquierdo.",
      "Tirá los dedos del pie derecho hacia la rodilla hasta sentir el estiramiento en el gemelo.",
    ],
  },

  "Calf_Stretch_Hands_Against_Wall": {
    instrucciones: [
      "Pararte mirando una pared a varios pasos de distancia. Adoptá una postura escalonada colocando un pie adelante.",
      "Inclinate hacia adelante y apoyá las manos en la pared, manteniendo el talón, la cadera y la cabeza en línea recta.",
      "Intentá mantener el talón trasero en el piso durante todo el estiramiento. Sostené entre 10 y 20 segundos y luego cambiá de lado.",
    ],
  },

  "Dumbbell_Bench_Press": {
    instrucciones: [
      "Acostáte en un banco plano con una mancuerna en cada mano apoyada sobre los muslos. Las palmas de las manos se miran entre sí.",
      "Ayudándote con los muslos para impulsarlas, levantá las mancuernas de a una a la vez hasta sostenerlas frente a vos al ancho de los hombros.",
      "Una vez a esa altura, rotá las muñecas de manera que las palmas queden mirando hacia adelante. Las mancuernas deben estar a los costados del pecho con el brazo superior y el antebrazo formando un ángulo de 90°. Aseguráte de mantener el control total de las mancuernas en todo momento. Esta es la posición inicial.",
      "Exhalando, usá el pecho para empujar las mancuernas hacia arriba. Extendé los codos al llegar arriba, apretá el pecho, sostené un segundo y luego comenzá a bajar lentamente. Idealmente, el descenso debe llevar el doble de tiempo que el ascenso.",
      "Repetí el movimiento las veces indicadas.",
    ],
  },

  "Plank": {
    instrucciones: [
      "Posicionáte boca abajo en el piso sosteniéndote sobre las puntas de los pies y los antebrazos. Los brazos deben estar flexionados y directamente debajo de los hombros.",
      "Mantenés el cuerpo en línea recta en todo momento y sostenés esta posición el mayor tiempo posible. Para aumentar la dificultad, podés levantar un brazo o una pierna.",
    ],
  },

  "Chin-Up": {
    instrucciones: [
      "Colgáte de la barra con las palmas mirando hacia vos (agarre supino) y un agarre más angosto que el ancho de los hombros.",
      "Con ambos brazos extendidos sosteniendo la barra al agarre elegido, mantenés el torso lo más recto posible generando una leve curvatura lumbar y sacando el pecho hacia adelante. Esta es la posición inicial. Mantener el torso recto maximiza la estimulación de los bíceps y minimiza la intervención de la espalda.",
      "Exhalando, tirá el torso hacia arriba hasta que la cabeza quede a la altura de la barra. Concentráte en usar los bíceps para ejecutar el movimiento, manteniendo los codos cerca del cuerpo. El torso sube en el espacio como unidad, y solo los brazos se mueven; los antebrazos cumplen únicamente la función de sostener la barra.",
      "Después de un segundo apretando los bíceps en la posición contraída, bajá lentamente el torso a la posición inicial hasta extender completamente los brazos, inhalando durante este descenso.",
      "Repetí el movimiento las veces indicadas.",
    ],
  },

  "Crunches": {
    instrucciones: [
      "Acostáte boca arriba con los pies apoyados en el piso o sobre un banco con las rodillas a 90°. Si usás el banco, separás los pies unos 8-10 cm con los dedos apuntando hacia adentro para que se toquen.",
      "Colocá las manos a los costados de la cabeza con los codos hacia adelante. No entrelacer los dedos detrás de la nuca.",
      "Presionando la zona lumbar contra el piso para aislar mejor los abdominales, comenzá a despegar los hombros del piso.",
      "Seguí presionando la zona lumbar hacia abajo mientras contraés el abdomen y exhalás. Los hombros solo deben elevarse unos 10 cm; la zona lumbar permanece en el piso. Al llegar arriba, contraé fuerte el abdomen y sostené la contracción un segundo. Enfocáte en un movimiento lento y controlado, sin usar impulso.",
      "Bajá lentamente a la posición inicial mientras inhalás.",
      "Repetí las veces indicadas.",
    ],
  },

  "Dumbbell_Rear_Lunge": {
    instrucciones: [
      "Pararte con el torso erguido y una mancuerna en cada mano a los costados. Esta es la posición inicial.",
      "Dá un paso largo hacia atrás con la pierna derecha, a unos 60 cm del pie izquierdo, y bajá el torso manteniendo el equilibrio y la espalda recta. Inhalá al descender. La rodilla delantera no debe superar los dedos del pie, y la tibia delantera queda perpendicular al piso. Mantené el torso erguido durante toda la zancada; los flexores de cadera deben estar flexibles. Una zancada larga enfatiza el glúteo; una corta enfatiza el cuádriceps.",
      "Empujá para volver a la posición inicial mientras exhalás. Para enfatizar el cuádriceps, empujá con la punta del pie; para el glúteo, empujá con el talón.",
      "Repetí con la pierna izquierda.",
    ],
  },

  "Concentration_Curls": {
    instrucciones: [
      "Sentáte en un banco plano con una mancuerna entre las piernas. Las piernas deben estar separadas con las rodillas flexionadas y los pies en el piso.",
      "Con la mano derecha, tomá la mancuerna y apoyá la cara posterior del brazo derecho sobre la cara interna del muslo derecho. Rotá la palma hacia adelante, alejándola del muslo. El brazo debe estar extendido y la mancuerna sobre el piso. Esta es la posición inicial.",
      "Manteniendo el brazo superior quieto, flexioná el codo llevando la mancuerna hacia arriba mientras exhalás. Solo se mueve el antebrazo. Seguí hasta que el bíceps esté completamente contraído y la mancuerna a la altura del hombro. En la parte superior del movimiento, aseguráte de que el meñique quede más alto que el pulgar para garantizar una buena contracción. Sostené la posición contraída un segundo apretando el bíceps.",
      "Bajá lentamente la mancuerna a la posición inicial mientras inhalás. No hagas balanceos en ningún momento del ejercicio.",
      "Completá las repeticiones indicadas y luego repetí el movimiento con el brazo izquierdo.",
    ],
  },

  "Romanian_Deadlift": {
    instrucciones: [
      "Colocá una barra frente a vos en el piso y tomala con un agarre prono (palmas hacia abajo), un poco más ancho que el ancho de hombros. Dependiendo del peso, puede que necesités muñequeras y una plataforma elevada para mayor rango de movimiento.",
      "Flexioná levemente las rodillas, tibias verticales, cadera hacia atrás y espalda recta. Esta es la posición inicial.",
      "Manteniendo la espalda y los brazos completamente rectos en todo momento, usá las caderas para levantar la barra mientras exhalás. El movimiento debe ser controlado y parejo, nunca brusco.",
      "Al estar completamente erguido, bajá la barra llevando las caderas hacia atrás, flexionando las rodillas solo levemente (mucho menos que en una sentadilla). Tomá una respiración profunda al inicio del movimiento, mantené el pecho arriba y sostené el aire al bajar; exhalá al completar el movimiento.",
      "Repetí las veces indicadas.",
    ],
  },

  "Arnold_Dumbbell_Press": {
    instrucciones: [
      "Sentáte en un banco con respaldo y sostenés dos mancuernas frente a vos a la altura del pecho superior con las palmas mirando hacia el cuerpo y los codos flexionados. Los brazos deben estar junto al torso. La posición inicial se asemeja a la parte contraída de un curl de bíceps.",
      "Para ejecutar el movimiento, empezá a subir las mancuernas mientras rotás las palmas hacia adelante.",
      "Seguí levantando las mancuernas hasta que los brazos estén completamente extendidos por encima de la cabeza. Exhalá durante esta parte del movimiento.",
      "Después de una pausa de un segundo arriba, comenzá a bajar las mancuernas a la posición original rotando las palmas de vuelta hacia el cuerpo. El brazo izquierdo rota en sentido antihorario y el derecho en sentido horario. Inhalá durante esta parte del movimiento.",
      "Repetí las veces indicadas.",
    ],
  },

  "Upright_Row_-_With_Bands": {
    instrucciones: [
      "Para comenzar, pisá la banda elástica de modo que la tensión empiece a nivel de los brazos extendidos. Tomá los extremos con un agarre prono (palmas mirando hacia los muslos), un poco más angosto que el ancho de los hombros. Los extremos descansan sobre los muslos con los brazos casi extendidos, una leve flexión en los codos y la espalda recta. Esta es la posición inicial.",
      "Usá los hombros laterales para subir los extremos mientras exhalás. Mantenelos cerca del cuerpo a medida que suben; los codos deben guiar el movimiento y permanecer siempre más altos que los antebrazos. Seguí hasta que los extremos casi toquen el mentón. Mantenés el torso quieto y pausás un segundo en la parte superior.",
      "Bajá los extremos lentamente a la posición inicial mientras inhalás.",
      "Repetí las veces indicadas.",
    ],
  },

  "Dumbbell_One-Arm_Upright_Row": {
    instrucciones: [
      "Tomá una mancuerna y paráte con el brazo extendido al frente, con una leve flexión en el codo y la espalda recta. La mancuerna descansa sobre el muslo con la palma mirando hacia el muslo. Esta es la posición inicial.",
      "El otro brazo puede quedar completamente extendido al costado, en la cintura o aferrado a una superficie fija para apoyo.",
      "Usá el hombro lateral para subir la mancuerna pegada al cuerpo mientras exhalás. Continuá hasta que la mancuerna quede casi a la altura del mentón. Los codos deben guiar el movimiento y permanecer siempre por encima de los antebrazos. Mantenés el torso quieto y pausás un segundo en la parte superior.",
      "Bajá la mancuerna lentamente a la posición inicial mientras inhalás.",
      "Completá las repeticiones indicadas y cambiá de brazo.",
    ],
  },

  "Kneeling_Hip_Flexor": {
    instrucciones: [
      "Arrodilláte sobre una colchoneta y llevá la rodilla derecha hacia adelante de manera que la planta del pie quede en el piso; extendé la pierna izquierda hacia atrás de modo que el empeine quede en el piso.",
      "Desplazá el peso hacia adelante hasta sentir el estiramiento en la cadera. Sostené 15 segundos y luego repetí del otro lado.",
    ],
  },

  "Hammer_Curls": {
    instrucciones: [
      "Pararte con el torso erguido y una mancuerna en cada mano con los brazos extendidos a los costados; codos cerca del torso.",
      "Las palmas de las manos miran hacia el cuerpo (agarre neutro). Esta es la posición inicial.",
      "Manteniendo el brazo superior quieto, exhalá y flexioná el codo llevando la mancuerna hacia el hombro. Seguí hasta que el bíceps esté completamente contraído y la mancuerna a la altura del hombro. Sostené la posición contraída un breve momento apretando el bíceps. Enfocáte en mantener el codo estático y mover solo el antebrazo.",
      "Después de la pausa breve, inhalá y comenzá a bajar las mancuernas lentamente a la posición inicial.",
      "Repetí las veces indicadas.",
    ],
  },

  "Standing_Dumbbell_Upright_Row": {
    instrucciones: [
      "Tomá una mancuerna en cada mano con un agarre prono (palmas hacia el cuerpo), un poco más angosto que el ancho de los hombros. Las mancuernas descansan sobre los muslos con los brazos casi extendidos y la espalda recta. Esta es la posición inicial.",
      "Usá los hombros laterales para subir las mancuernas pegadas al cuerpo mientras exhalás. Los codos deben guiar el movimiento y permanecer siempre más altos que los antebrazos. Seguí hasta que las mancuernas casi toquen el mentón. Mantenés el torso quieto y pausás un segundo en la parte superior.",
      "Bajá las mancuernas lentamente a la posición inicial mientras inhalás.",
      "Repetí las veces indicadas.",
    ],
  },

  "Bench_Dips": {
    instrucciones: [
      "Colocá un banco detrás tuyo. Con el banco perpendicular al cuerpo y de espaldas a él, apoyá las manos en el borde al ancho de los hombros con los brazos completamente extendidos. Las piernas se extienden hacia adelante, flexionadas en la cintura y perpendiculares al torso. Esta es la posición inicial.",
      "Bajá lentamente el cuerpo mientras inhalás, flexionando los codos hasta alcanzar un ángulo levemente menor de 90° entre el brazo y el antebrazo. Mantenés los codos lo más pegados posible al cuerpo durante todo el movimiento; los antebrazos deben apuntar siempre hacia abajo.",
      "Usando los tríceps, empujá el cuerpo hacia arriba de vuelta a la posición inicial.",
      "Repetí las veces indicadas.",
    ],
  },

  "Decline_Push-Up": {
    instrucciones: [
      "Acostáte boca abajo en el piso y colocá las manos separadas unos 90 cm. Subí los pies sobre un cajón o banco y sostenés el torso a extensión de brazos. Esta es la posición inicial.",
      "Bajá hasta que el pecho casi toque el piso mientras inhalás.",
      "Exhalá y empujá el cuerpo de vuelta a la posición inicial apretando el pecho.",
      "Después de una breve pausa en la posición contraída, comenzá a bajar de nuevo para las repeticiones indicadas.",
    ],
  },

  "Dumbbell_Bicep_Curl": {
    instrucciones: [
      "Pararte con el torso erguido y una mancuerna en cada mano a extensión de brazos. Mantenés los codos cerca del torso y rotás las palmas de las manos hasta que queden mirando hacia adelante. Esta es la posición inicial.",
      "Manteniendo los brazos superiores quietos, exhalá y flexioná los codos llevando las mancuernas mientras contraés los bíceps. Seguí hasta que los bíceps estén completamente contraídos y las mancuernas a la altura de los hombros. Sostené la posición contraída una breve pausa apretando los bíceps.",
      "Inhalá y comenzá a bajar lentamente las mancuernas a la posición inicial.",
      "Repetí las veces indicadas.",
    ],
  },

  "Dumbbell_Flyes": {
    instrucciones: [
      "Acostáte en un banco plano con una mancuerna en cada mano apoyada sobre los muslos. Las palmas de las manos se miran entre sí.",
      "Ayudándote con los muslos para levantarlas, sujetá las mancuernas al ancho de los hombros sobre el pecho con las palmas mirándose; subí las mancuernas como si las presionaras, pero detenéte y sostenélas justo antes de bloquear los codos. Esta es la posición inicial.",
      "Con los codos levemente flexionados para evitar el estrés en el tendón del bíceps, abrí los brazos hacia los lados en un arco amplio bajando lentamente mientras inhalás, hasta sentir el estiramiento en el pecho. A lo largo del movimiento los brazos permanecen estáticos; el movimiento ocurre solo en la articulación del hombro.",
      "Volvé los brazos a la posición inicial usando el mismo arco, apretando los músculos del pecho mientras exhalás. Usá el mismo arco de movimiento con el que bajaste el peso.",
      "Sostené un segundo en la posición contraída y repetí el movimiento las veces indicadas.",
    ],
  },

  "Standing_Toe_Touches": {
    instrucciones: [
      "Pararte con espacio tanto adelante como atrás.",
      "Doblarte desde la cintura manteniendo las piernas rectas hasta poder relajarte y dejar que la parte superior del cuerpo cuelgue hacia adelante. Dejá que los brazos y las manos cuelguen de manera natural. Sostené entre 10 y 20 segundos.",
    ],
  },

  "Straight-Arm_Dumbbell_Pullover": {
    instrucciones: [
      "Colocá una mancuerna parada y asegurada en un extremo de un banco plano.",
      "Asegurándote de que la mancuerna permanezca bien ubicada en la parte superior del banco, acostáte perpendicular al banco (torso a través de él formando una cruz) con solo los hombros apoyados en la superficie. Las caderas deben quedar por debajo del banco y las piernas flexionadas con los pies firmemente en el piso. La cabeza también colgará fuera del banco.",
      "Tomá la mancuerna con ambas manos y sostenéla directamente sobre el pecho con los brazos extendidos. Ambas palmas deben estar presionando contra la cara inferior de uno de los extremos de la mancuerna. Esta es la posición inicial. Precaución: Verificá siempre que la mancuerna esté bien asegurada antes de comenzar; una mancuerna con discos flojos puede desarmarse y caer.",
      "Manteniendo los brazos rectos, bajá lentamente el peso en arco detrás de la cabeza mientras inhalás, hasta sentir el estiramiento en el pecho.",
      "Devolvé la mancuerna a la posición inicial siguiendo el mismo arco mientras exhalás.",
      "Sostené el peso en la posición inicial un segundo y repetí el movimiento las veces indicadas.",
    ],
  },
};

for (const [id, patch] of Object.entries(parches)) {
  if (!t[id]) { console.warn(`  ⚠ ID no encontrado: ${id}`); continue; }
  t[id] = { ...t[id], ...patch };
}

writeFileSync(FILE, JSON.stringify(t, null, 2), "utf8");
console.log("✅ Lote 4 aplicado — 21 re-pases.");
