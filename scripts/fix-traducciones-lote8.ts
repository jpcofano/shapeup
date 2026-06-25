/**
 * Lote 8 — 30 NUEVAS traducciones (beginner + equipo hogareño, tanda 4).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const FILE = resolve("scripts/data/traducciones-fedb.es.json");
const t = JSON.parse(readFileSync(FILE, "utf8"));

const nuevos: Record<string, object> = {

  "Pullups": {
    nombre: "Dominadas",
    patron: "Tracción vertical",
    unilateral: false,
    sinonimos: ["pull ups", "chin ups", "dominadas en barra"],
    instrucciones: [
      "Tomá la barra de dominadas con las palmas hacia adelante usando el agarre indicado. Sobre agarres: para agarre ancho, las manos van más separadas que el ancho de hombros; para agarre medio, al ancho de hombros; para agarre cerrado, a una distancia menor.",
      "Con ambos brazos extendidos frente a vos sosteniendo la barra en el agarre elegido, llevá el torso hacia atrás unos 30° creando una leve curvatura en la espalda baja y sacando el pecho. Esta es la posición inicial.",
      "Tirá del torso hacia arriba hasta que la barra toque la parte superior del pecho, llevando los hombros y los brazos superiores hacia abajo y atrás. Exhalá durante esta parte. Concentráte en apretar los músculos de la espalda al llegar a la contracción completa. El torso superior debe permanecer fijo en el espacio; solo se mueven los brazos. Los antebrazos no deben hacer otro trabajo más que sostener la barra.",
      "Después de un segundo en la posición contraída, comenzá a inhalar y bajá lentamente el torso a la posición inicial hasta que los brazos queden completamente extendidos y el dorsal totalmente estirado.",
      "Repetí este movimiento las veces indicadas.",
    ],
    puntosClave: [
      "El torso superior se mantiene rígido; solo los brazos y la espalda generan el movimiento.",
    ],
    erroresComunes: [
      "Hacer kipping (balancearse) para subir.",
      "No bajar a extensión completa del brazo.",
    ],
  },

  "Push-Ups_With_Feet_Elevated": {
    nombre: "Flexiones con pies elevados",
    patron: "Empuje horizontal",
    unilateral: false,
    sinonimos: ["push ups pies elevados", "flexion declinada"],
    instrucciones: [
      "Acostáte boca abajo en el piso y colocá las manos separadas unos 90 cm entre sí, sosteniendo el torso a extensión de brazos.",
      "Colocá los pies sobre un banco plano. Esto eleva el cuerpo. Cuanto más alto sea el banco, mayor la resistencia del ejercicio.",
      "Bajá el cuerpo hasta que el pecho casi toque el piso mientras inhalás.",
      "Usando los pectorales, empujá el torso hacia arriba a la posición inicial apretando el pecho. Exhalá durante este paso.",
      "Después de una pausa de un segundo en la posición contraída, repetí las veces indicadas.",
    ],
    puntosClave: [
      "Mayor elevación de los pies = mayor dificultad y mayor énfasis en la parte superior del pecho.",
    ],
    erroresComunes: [
      "Dejar caer las caderas durante el descenso.",
    ],
  },

  "Rear_Leg_Raises": {
    nombre: "Elevación de pierna hacia atrás en cuadrupedia",
    patron: "Dominante de cadera",
    unilateral: true,
    sinonimos: ["rear leg raise", "patada de glúteo en cuadrupedia"],
    instrucciones: [
      "Colocáte sobre manos y rodillas en una colchoneta. La cabeza debe mirar hacia adelante y las rodillas deben formar un ángulo de 90° entre el isquiotibial y la pantorrilla. Esta es la posición inicial.",
      "Extendé una pierna hacia arriba y atrás, extendiendo tanto la rodilla como la cadera. Repetí 5-10 veces y luego cambiá de lado.",
    ],
    puntosClave: [
      "Activa el glúteo manteniendo la cadera estable, sin rotar el torso.",
    ],
    erroresComunes: [
      "Rotar la cadera hacia afuera para ganar altura.",
    ],
  },

  "Rocket_Jump": {
    nombre: "Salto vertical explosivo (rocket jump)",
    patron: "Locomoción / cardio",
    unilateral: false,
    sinonimos: ["rocket jump", "salto vertical maximo"],
    instrucciones: [
      "Comenzá en posición relajada con los pies al ancho de hombros y los brazos cerca del cuerpo.",
      "Para iniciar el movimiento, hacé una media sentadilla y explotá hacia arriba lo más alto posible.",
      "Extendé todo el cuerpo, alcanzando hacia arriba lo más lejos posible. Al aterrizar, absorbé el impacto con las piernas.",
    ],
    puntosClave: [
      "Absorbé el aterrizaje flexionando rodillas y caderas para proteger las articulaciones.",
    ],
    erroresComunes: [
      "Aterrizar con las piernas rígidas.",
    ],
  },

  "Seated_Bent-Over_One-Arm_Dumbbell_Triceps_Extension": {
    nombre: "Extensión de tríceps unilateral sentado e inclinado",
    patron: "Aislamiento",
    unilateral: true,
    sinonimos: ["triceps extension sentado un brazo"],
    instrucciones: [
      "Sentáte al borde de un banco plano con una mancuerna en una mano, agarre neutro (palma hacia vos).",
      "Flexioná levemente las rodillas y llevá el torso hacia adelante doblándote desde la cintura, manteniendo la espalda recta hasta casi paralela al piso. Mantené la cabeza arriba.",
      "El brazo superior con la mancuerna debe estar cerca del torso y alineado con él (elevado hasta quedar paralelo al piso, con el antebrazo apuntando hacia abajo mientras la mano sostiene el peso). Debe haber un ángulo de 90° entre antebrazo y brazo superior. Esta es la posición inicial.",
      "Manteniendo el brazo superior fijo, usá el tríceps para levantar el peso mientras exhalás hasta que el antebrazo quede paralelo al piso y el brazo completamente extendido. Solo se mueve el antebrazo.",
      "Después de un segundo de contracción en la parte superior, bajá lentamente la mancuerna a la posición inicial mientras inhalás.",
      "Repetí el movimiento las veces indicadas.",
      "Cambiá de brazo y repetí.",
    ],
    puntosClave: [
      "El brazo superior permanece paralelo al piso y completamente fijo.",
    ],
    erroresComunes: [
      "Mover el codo hacia afuera o abajo durante la extensión.",
    ],
  },

  "Seated_Dumbbell_Curl": {
    nombre: "Curl de bíceps sentado con mancuernas",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["seated dumbbell curl", "curl sentado"],
    instrucciones: [
      "Sentáte en un banco plano con una mancuerna en cada mano a extensión de brazos. Los codos cerca del torso.",
      "Rotá las palmas de las manos para que queden mirando hacia el torso. Esta es la posición inicial.",
      "Manteniendo el brazo superior fijo, curvá los pesos y comenzá a girar las muñecas una vez que las mancuernas pasen los muslos, de modo que las palmas queden mirando hacia adelante al final del movimiento. Contraé el bíceps al exhalar y asegurate de que solo se muevan los antebrazos. Continuá hasta la contracción completa con las mancuernas a la altura del hombro. Sostené un segundo apretando el bíceps.",
      "Volvé lentamente las mancuernas a la posición inicial mientras inhalás y rotás las muñecas de vuelta al agarre neutro.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "La rotación de muñeca durante la subida (de neutro a supino) maximiza la contracción del bíceps.",
    ],
    erroresComunes: [
      "Mover el codo hacia adelante al subir.",
    ],
  },

  "Seated_Dumbbell_Inner_Biceps_Curl": {
    nombre: "Curl de bíceps interno sentado con mancuernas",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["seated inner biceps curl", "curl interno sentado"],
    instrucciones: [
      "Sentáte al borde de un banco plano con una mancuerna en cada mano a extensión de brazos. Los codos cerca del torso.",
      "Rotá las palmas de las manos para que queden mirando hacia adentro, en posición neutra. Esta es la posición inicial.",
      "Manteniendo los brazos superiores fijos, curvá las mancuernas hacia afuera y arriba, girando las palmas hacia afuera mientras subís y manteniendo los antebrazos alineados con los deltoides laterales.",
      "Solo se mueven los antebrazos. Continuá el movimiento hasta la contracción completa del bíceps con las mancuernas a la altura del hombro. Sostené un segundo apretando el bíceps.",
      "Volvé lentamente las mancuernas a la posición inicial mientras inhalás. Recordá rotar los brazos al bajar para volver al agarre neutro.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "El recorrido hacia afuera enfatiza el bíceps desde un ángulo distinto al curl tradicional.",
    ],
    erroresComunes: [
      "Llevar las mancuernas al frente en lugar de hacia afuera.",
    ],
  },

  "Seated_Dumbbell_Palms-Down_Wrist_Curl": {
    nombre: "Curl de muñeca sentado agarre pronado",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["wrist curl sentado pronado"],
    instrucciones: [
      "Colocá dos mancuernas en el piso frente a un banco plano.",
      "Sentáte al borde del banco con las piernas separadas al ancho de hombros. Mantené los pies en el piso.",
      "Tomá ambas mancuernas y subilas de modo que los antebrazos descansen sobre los muslos con las palmas hacia abajo. Las muñecas quedan colgando del borde de los muslos.",
      "Comenzá curvando las muñecas hacia arriba mientras exhalás.",
      "Bajá lentamente las muñecas a la posición inicial mientras inhalás. Los antebrazos permanecen fijos; solo la muñeca se mueve.",
      "Repetí las veces indicadas.",
      "Al terminar, simplemente bajá las mancuernas al piso.",
    ],
    puntosClave: [
      "Trabaja los extensores del antebrazo.",
    ],
    erroresComunes: [
      "Mover los antebrazos durante el curl.",
    ],
  },

  "Seated_Dumbbell_Press": {
    nombre: "Press militar sentado con mancuernas",
    patron: "Empuje vertical",
    unilateral: false,
    sinonimos: ["seated dumbbell press", "press de hombro sentado"],
    instrucciones: [
      "Tomá dos mancuernas y sentáte en un banco de press militar o un banco utilitario con respaldo, colocando las mancuernas paradas sobre los muslos.",
      "Subí las mancuernas de una a la vez usando los muslos para llevarlas a la altura del hombro en cada lado.",
      "Rotá las muñecas para que las palmas queden mirando hacia adelante. Esta es la posición inicial.",
      "Al exhalar, empujá las mancuernas hacia arriba hasta que se toquen en la parte superior.",
      "Después de una pausa de un segundo, bajá lentamente a la posición inicial mientras inhalás.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "El respaldo del banco previene la compensación con la espalda baja.",
    ],
    erroresComunes: [
      "Arquear excesivamente la espalda baja al empujar.",
    ],
  },

  "Seated_Flat_Bench_Leg_Pull-In": {
    nombre: "Jalón de piernas sentado en banco",
    patron: "Core flexión",
    unilateral: false,
    sinonimos: ["seated leg pull in", "abdominal sentado banco"],
    instrucciones: [
      "Sentáte en un banco con las piernas extendidas al frente levemente por debajo de la horizontal y las manos sosteniéndote de los costados del banco. El torso debe estar reclinado hacia atrás unos 45°. Esta es la posición inicial.",
      "Llevá las rodillas hacia vos mientras acercás el torso a ellas simultáneamente. Exhalá durante este movimiento.",
      "Después de una pausa de un segundo, volvé a la posición inicial mientras inhalás.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "El torso y las piernas se acercan al mismo tiempo, como un crunch en V.",
    ],
    erroresComunes: [
      "Mover solo las piernas sin acercar el torso.",
    ],
  },

  "Seated_Leg_Tucks": {
    nombre: "Encogimiento de piernas sentado",
    patron: "Core flexión",
    unilateral: false,
    sinonimos: ["seated leg tucks", "tuck sentado"],
    instrucciones: [
      "Sentáte en un banco con las piernas extendidas al frente levemente por debajo de la horizontal y las manos sosteniéndote de los costados del banco. El torso debe estar reclinado hacia atrás unos 45°. Esta es la posición inicial.",
      "Llevá las rodillas hacia vos mientras acercás el torso a ellas simultáneamente. Exhalá durante este movimiento.",
      "Después de una pausa de un segundo, volvé a la posición inicial mientras inhalás.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "Variante muy similar al jalón de piernas; la clave es la coordinación torso-rodillas.",
    ],
    erroresComunes: [
      "Usar el impulso de las piernas sin contraer el abdomen.",
    ],
  },

  "Seated_One-Arm_Dumbbell_Palms-Up_Wrist_Curl": {
    nombre: "Curl de muñeca unilateral sentado agarre supino",
    patron: "Aislamiento",
    unilateral: true,
    sinonimos: ["wrist curl sentado un brazo supino"],
    instrucciones: [
      "Sentáte en un banco plano con una mancuerna en la mano derecha.",
      "Colocá los pies planos en el piso, separados un poco más que el ancho de hombros.",
      "Inclinate hacia adelante y apoyá el antebrazo derecho sobre el muslo derecho con la palma hacia arriba. El borde frontal de la muñeca debe quedar justo sobre la rodilla. Esta es la posición inicial.",
      "Bajá la mancuerna lo más posible manteniendo un agarre firme. Inhalá durante este movimiento.",
      "Ahora curvá la mancuerna lo más alto posible contrayendo el antebrazo mientras exhalás. Sostené la contracción un segundo antes de bajar de nuevo. Solo debe haber movimiento en la muñeca.",
      "Repetí las veces indicadas, cambiá de brazo y repetí.",
    ],
    puntosClave: [
      "Solo la muñeca se mueve; el antebrazo permanece apoyado en el muslo.",
    ],
    erroresComunes: [
      "Levantar el antebrazo del muslo durante el curl.",
    ],
  },

  "Seated_Side_Lateral_Raise": {
    nombre: "Elevación lateral sentado",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["seated lateral raise", "elevacion lateral sentado"],
    instrucciones: [
      "Tomá un par de mancuernas y sentáte al borde de un banco plano con los pies firmes en el piso. Sostené las mancuernas con las palmas hacia adentro y los brazos extendidos a los costados. Esta es la posición inicial.",
      "Manteniendo el torso fijo (sin balancearte), elevá las mancuernas hacia los costados con una leve flexión de codo y las manos levemente inclinadas hacia adelante como si vertierás agua. Seguí subiendo hasta que los brazos queden paralelos al piso. Exhalá durante este movimiento y pausá un segundo en la parte superior.",
      "Bajá las mancuernas lentamente a la posición inicial mientras inhalás.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "Estar sentado elimina el impulso de las piernas, aislando mejor el deltoide.",
    ],
    erroresComunes: [
      "Balancear el torso para ayudar a subir el peso.",
    ],
  },

  "Seated_Triceps_Press": {
    nombre: "Press de tríceps sentado (extensión francesa)",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["french press sentado", "extension triceps sobre cabeza sentado"],
    instrucciones: [
      "Sentáte en un banco con respaldo y sostené una mancuerna con ambas manos por encima de la cabeza a extensión de brazos. Es mejor que alguien te la entregue, especialmente si es pesada. El peso debe descansar en las palmas con los pulgares rodeándolo. Las palmas miran hacia adentro. Esta es la posición inicial.",
      "Manteniendo los brazos superiores cerca de la cabeza (codos adentro) y perpendiculares al piso, bajá el peso en un movimiento semicircular detrás de la cabeza hasta que los antebrazos toquen los bíceps. Los brazos superiores permanecen fijos; solo se mueven los antebrazos. Inhalá durante este paso.",
      "Volvé a la posición inicial usando el tríceps para subir el peso. Exhalá durante este paso.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "Los codos apuntan al techo y permanecen fijos en todo momento.",
    ],
    erroresComunes: [
      "Abrir los codos hacia afuera al bajar.",
    ],
  },

  "Shoulder_Press_-_With_Bands": {
    nombre: "Press de hombro con banda",
    patron: "Empuje vertical",
    unilateral: false,
    sinonimos: ["shoulder press banda", "press militar con banda"],
    instrucciones: [
      "Para comenzar, pisá la banda elástica de modo que la tensión empiece con los brazos extendidos. Tomá las manijas y levantalas hasta que las manos queden a la altura de los hombros en cada lado.",
      "Rotá las muñecas para que las palmas queden mirando hacia adelante. Los codos deben estar flexionados, con los brazos superiores y los antebrazos alineados con el torso. Esta es la posición inicial.",
      "Al exhalar, levantá las manijas hasta que los brazos queden completamente extendidos por encima de la cabeza.",
    ],
    puntosClave: [
      "La banda agrega más resistencia cuanto más arriba llega el brazo.",
    ],
    erroresComunes: [
      "Arquear la espalda baja al empujar.",
    ],
  },

  "Side_Laterals_to_Front_Raise": {
    nombre: "Elevación lateral a frontal combinada",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["lateral to front raise", "elevacion combinada lateral-frontal"],
    instrucciones: [
      "De pie, sostené un par de mancuernas a los costados. Esta es la posición inicial.",
      "Manteniendo los codos levemente flexionados, elevá los pesos directamente al frente hasta la altura de los hombros, evitando balanceos o trampa.",
      "En la parte superior del movimiento, llevá los pesos hacia afuera al frente, manteniendo los brazos extendidos.",
      "Bajá los pesos con un movimiento controlado.",
      "En la siguiente repetición, elevá los pesos al frente hasta la altura de los hombros antes de moverlos lateralmente hacia los costados.",
      "Bajá los pesos a la posición inicial.",
    ],
    puntosClave: [
      "Combina los planos frontal y lateral del deltoide en una sola serie.",
    ],
    erroresComunes: [
      "Usar impulso del torso en lugar de los hombros.",
    ],
  },

  "Single_Dumbbell_Raise": {
    nombre: "Elevación con una sola mancuerna (a dos manos)",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["single dumbbell raise"],
    instrucciones: [
      "Con una postura amplia, sostené una mancuerna con ambas manos, agarrando la cabeza de la mancuerna en lugar del mango. Los brazos extendidos y colgando a la altura de la cintura. Esta es la posición inicial.",
      "Elevá el peso hasta que quede por encima de la altura de los hombros, manteniendo los brazos extendidos. El torso y las caderas permanecen fijos durante todo el movimiento.",
      "Volvé a la posición inicial y repetí las veces indicadas.",
    ],
    puntosClave: [
      "El torso y las caderas permanecen completamente fijos; el movimiento es solo de hombros.",
    ],
    erroresComunes: [
      "Usar las caderas para impulsar el peso hacia arriba.",
    ],
  },

  "Single_Leg_Butt_Kick": {
    nombre: "Patada de glúteo a una pierna (salto)",
    patron: "Locomoción / cardio",
    unilateral: true,
    sinonimos: ["single leg butt kick", "salto patada gluteo"],
    instrucciones: [
      "Comenzá parado sobre una pierna, con la rodilla contraria flexionada y elevada. Esta es la posición inicial.",
      "Usando un contramovimiento de salto, despegá hacia arriba extendiendo cadera, rodilla y tobillo de la pierna de apoyo.",
      "Inmediatamente flexioná la rodilla e intentá tocar el glúteo con el talón de la pierna que saltó.",
      "Volvé la pierna a una posición parcialmente flexionada bajo las caderas y aterrizá. La pierna opuesta debe mantenerse relativamente en la misma posición durante todo el ejercicio.",
    ],
    puntosClave: [
      "La pierna de apoyo se mantiene estable mientras la otra ejecuta la patada.",
    ],
    erroresComunes: [
      "Aterrizar con la rodilla rígida.",
    ],
  },

  "Speed_Band_Overhead_Triceps": {
    nombre: "Extensión de tríceps sobre cabeza con banda (velocidad)",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["speed band triceps", "extension triceps banda velocidad"],
    instrucciones: [
      "Para este ejercicio, anclá una banda al piso. Podés usar un banco inclinado y anclar la banda en la base, parándote sobre el banco. También se puede hacer parado sobre la banda.",
      "Para comenzar, tirá la banda por detrás de la cabeza, sosteniéndola con agarre pronado y los codos arriba. Esta es la posición inicial.",
      "Para ejecutar el movimiento, extendé el codo para enderezar los brazos, asegurándote de mantener el brazo superior fijo.",
      "Pausá y volvé a la posición inicial.",
    ],
    puntosClave: [
      "El énfasis está en la velocidad de extensión, no solo en la carga.",
    ],
    erroresComunes: [
      "Mover el brazo superior en lugar de mantenerlo fijo.",
    ],
  },

  "Spell_Caster": {
    nombre: "Spell caster (rotación de torso con mancuernas)",
    patron: "Core rotación",
    unilateral: false,
    sinonimos: ["spell caster", "rotacion de torso con mancuernas"],
    instrucciones: [
      "Sostené una mancuerna en cada mano con agarre pronado. Los pies separados ampliamente con caderas y rodillas extendidas. Esta es la posición inicial.",
      "Comenzá el movimiento llevando ambas mancuernas hacia un costado, junto a la cadera, rotando el torso.",
      "Manteniendo los brazos rectos y las mancuernas paralelas al piso, rotá el torso para llevar los pesos hacia el lado opuesto.",
      "Seguí alternando, rotando de un lado al otro hasta completar la serie.",
    ],
    puntosClave: [
      "Los brazos permanecen rectos; toda la potencia viene de la rotación del torso.",
    ],
    erroresComunes: [
      "Flexionar los codos para ayudar al movimiento.",
    ],
  },

  "Spider_Crawl": {
    nombre: "Spider crawl (gateo lateral en plancha)",
    patron: "Core anti-rotación",
    unilateral: true,
    sinonimos: ["spider crawl", "gateo araña"],
    instrucciones: [
      "Comenzá en posición prona en el piso. Sostené el peso del cuerpo sobre las manos y los dedos de los pies, con los pies juntos y el cuerpo recto. Los brazos deben estar flexionados a 90°. Esta es la posición inicial.",
      "Iniciá el movimiento elevando un pie del piso. Rotá la pierna hacia afuera y llevá la rodilla hacia el codo, lo más adelante posible.",
      "Volvé esa pierna a la posición inicial y repetí del lado opuesto.",
    ],
    puntosClave: [
      "Las caderas permanecen estables mientras una pierna se mueve hacia el codo.",
    ],
    erroresComunes: [
      "Dejar caer las caderas durante el movimiento.",
    ],
  },

  "Split_Jump": {
    nombre: "Salto en tijera (split jump)",
    patron: "Locomoción / cardio",
    unilateral: false,
    sinonimos: ["split jump", "lunge jump"],
    instrucciones: [
      "Adoptá una posición de zancada con un pie adelante y la rodilla flexionada, y la rodilla de atrás casi tocando el piso.",
      "Asegurate de que la rodilla delantera quede sobre la línea media del pie.",
      "Extendiendo ambas piernas, saltá lo más alto posible, balanceando los brazos para ganar impulso.",
      "Mientras saltás, juntá los pies y movelos de vuelta a las posiciones iniciales al aterrizar.",
      "Absorbé el impacto volviendo a la posición inicial.",
    ],
    puntosClave: [
      "Las piernas cambian de posición en el aire (tijera) antes de aterrizar.",
    ],
    erroresComunes: [
      "Dejar que la rodilla delantera caiga hacia adentro al aterrizar.",
    ],
  },

  "Squats_-_With_Bands": {
    nombre: "Sentadilla con banda",
    patron: "Dominante de rodilla",
    unilateral: false,
    sinonimos: ["squats con banda", "sentadilla resistencia banda"],
    instrucciones: [
      "Para comenzar, asegurate de que la banda elástica esté dividida de manera pareja entre el lado izquierdo y derecho del cuerpo. Para esto, tomá ambos lados de la banda con las manos y colocá ambos pies en el medio de la banda. Los pies deben estar al ancho de hombros.",
      "Al sostener las bandas, deben quedar a la misma altura en cada lado. Usá un agarre pronado (palmas hacia adelante) con las manijas de la banda junto a la cara. Esta es la posición inicial.",
      "Comenzá a flexionar las rodillas lentamente y bajá las piernas hasta que los muslos queden paralelos al piso mientras exhalás.",
      "Usá el talón de los pies para empujar el cuerpo de vuelta a la posición inicial mientras exhalás.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "La banda agrega resistencia adicional en la posición erguida.",
    ],
    erroresComunes: [
      "Dejar que las rodillas colapsen hacia adentro.",
    ],
  },

  "Standing_Alternating_Dumbbell_Press": {
    nombre: "Press de hombro alternado de pie",
    patron: "Empuje vertical",
    unilateral: true,
    sinonimos: ["alternating shoulder press", "press alternado de pie"],
    instrucciones: [
      "Pararte con una mancuerna en cada mano. Subí las mancuernas a la altura de los hombros con las palmas hacia adelante y los codos hacia afuera. Esta es la posición inicial.",
      "Extendé un brazo para empujar la mancuerna directamente hacia arriba, manteniendo la otra mano fija en su lugar. No te inclines ni hagas trampa con el peso durante el movimiento.",
      "Después de una breve pausa, volvé el peso a la posición inicial.",
      "Repetí del lado contrario, alternando entre los brazos.",
    ],
    puntosClave: [
      "El brazo que no trabaja permanece fijo a la altura del hombro entre repeticiones.",
    ],
    erroresComunes: [
      "Inclinar el torso hacia el lado que empuja.",
    ],
  },

  "Standing_Bent-Over_One-Arm_Dumbbell_Triceps_Extension": {
    nombre: "Extensión de tríceps unilateral de pie e inclinado",
    patron: "Aislamiento",
    unilateral: true,
    sinonimos: ["triceps extension de pie un brazo"],
    instrucciones: [
      "Con una mancuerna en una mano y la palma hacia el torso, flexioná levemente las rodillas y llevá el torso hacia adelante doblándote desde la cintura, manteniendo la espalda recta hasta casi paralela al piso. Mantené la cabeza arriba.",
      "El brazo superior debe estar cerca del torso y paralelo al piso, con el antebrazo apuntando hacia abajo mientras la mano sostiene el peso. Debe haber un ángulo de 90° entre antebrazo y brazo superior. Esta es la posición inicial.",
      "Manteniendo los brazos superiores fijos, usá el tríceps para levantar el peso mientras exhalás hasta que los antebrazos queden paralelos al piso y el brazo completamente extendido. Solo se mueve el antebrazo.",
      "Después de un segundo de contracción en la parte superior, bajá lentamente la mancuerna a la posición inicial mientras inhalás.",
      "Repetí el movimiento las veces indicadas.",
      "Cambiá de brazo y repetí.",
    ],
    puntosClave: [
      "El brazo superior permanece paralelo al piso y completamente fijo.",
    ],
    erroresComunes: [
      "Redondear la espalda al inclinarse hacia adelante.",
    ],
  },

  "Standing_Bent-Over_Two-Arm_Dumbbell_Triceps_Extension": {
    nombre: "Extensión de tríceps bilateral de pie e inclinado",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["triceps extension de pie dos brazos"],
    instrucciones: [
      "Con una mancuerna en cada mano y las palmas hacia el torso, flexioná levemente las rodillas y llevá el torso hacia adelante doblándote desde la cintura, manteniendo la espalda recta hasta casi paralela al piso. Mantené la cabeza arriba. Los brazos superiores deben estar cerca del torso y paralelos al piso, con los antebrazos apuntando hacia abajo mientras las manos sostienen los pesos. Debe haber un ángulo de 90° entre antebrazos y brazos superiores. Esta es la posición inicial.",
      "Manteniendo los brazos superiores fijos, usá el tríceps para levantar los pesos mientras exhalás hasta que los antebrazos queden paralelos al piso y los brazos completamente extendidos. Solo se mueven los antebrazos.",
      "Después de un segundo de contracción en la parte superior, bajá lentamente las mancuernas a la posición inicial mientras inhalás.",
      "Repetí el movimiento las veces indicadas.",
    ],
    puntosClave: [
      "Trabajar ambos brazos a la vez exige más estabilidad de la espalda baja.",
    ],
    erroresComunes: [
      "Redondear la espalda al inclinarse hacia adelante.",
    ],
  },

  "Standing_Concentration_Curl": {
    nombre: "Curl de concentración de pie",
    patron: "Aislamiento",
    unilateral: true,
    sinonimos: ["concentration curl de pie", "curl concentrado parado"],
    instrucciones: [
      "Tomando una mancuerna con la mano que trabaja, inclinate hacia adelante. Dejá que el brazo cuelgue perpendicular al piso con el codo apuntando hacia afuera. Esta es la posición inicial.",
      "Flexioná el codo para curvar el peso, manteniendo el brazo superior fijo. En la parte superior de la repetición, contraé el bíceps y pausá.",
      "Bajá la mancuerna a la posición inicial.",
      "Repetí el movimiento las veces indicadas.",
    ],
    puntosClave: [
      "El brazo superior cuelga completamente fijo durante todo el movimiento.",
    ],
    erroresComunes: [
      "Balancear el torso para ayudar a subir el peso.",
    ],
  },

  "Standing_Dumbbell_Press": {
    nombre: "Press de hombro de pie con mancuernas",
    patron: "Empuje vertical",
    unilateral: false,
    sinonimos: ["standing dumbbell press", "press militar de pie"],
    instrucciones: [
      "De pie con los pies al ancho de hombros, tomá una mancuerna en cada mano. Subí las mancuernas a la altura de la cabeza, con los codos hacia afuera y a unos 90°. Esta es la posición inicial.",
      "Manteniendo una técnica estricta sin impulso de piernas ni inclinación hacia atrás, extendé los codos para subir los pesos juntos directamente sobre la cabeza.",
      "Pausá y volvé lentamente el peso a la posición inicial.",
    ],
    puntosClave: [
      "Sin impulso de piernas; el trabajo es estrictamente de hombros y tríceps.",
    ],
    erroresComunes: [
      "Arquear la espalda baja para ayudar a empujar.",
    ],
  },

  "Standing_Long_Jump": {
    nombre: "Salto de longitud sin carrera",
    patron: "Locomoción / cardio",
    unilateral: false,
    sinonimos: ["standing long jump", "salto largo de pie"],
    instrucciones: [
      "Este ejercicio se realiza mejor en arena u otra superficie blanda de aterrizaje. Asegurate de poder medir la distancia. Pararte en media sentadilla con los pies al ancho de hombros.",
      "Usando un balanceo amplio de brazos y un contramovimiento de piernas, saltá hacia adelante lo más lejos posible.",
      "Intentá aterrizar con los pies por delante del cuerpo, alcanzando lo más lejos posible con las piernas.",
      "Medí la distancia desde el punto de aterrizaje hasta el punto de partida y registrá los resultados.",
    ],
    puntosClave: [
      "El balanceo de brazos contribuye significativamente a la distancia del salto.",
    ],
    erroresComunes: [
      "No absorber el aterrizaje, cayendo con las piernas rígidas.",
    ],
  },

  "Standing_One-Arm_Dumbbell_Curl_Over_Incline_Bench": {
    nombre: "Curl unilateral de pie sobre banco inclinado",
    patron: "Aislamiento",
    unilateral: true,
    sinonimos: ["curl de pie sobre banco inclinado"],
    instrucciones: [
      "Pararte detrás de un banco inclinado como si fueras a asistir a alguien. Sostené una mancuerna en una mano y apoyala sobre el banco inclinado con agarre supinado (palma hacia arriba).",
      "Colocá la mano que no trabaja en la esquina o el costado del banco inclinado. El pecho debe presionar contra la parte superior del respaldo y los pies deben estar firmes en el piso con una postura amplia. Esta es la posición inicial.",
      "Manteniendo el brazo superior fijo, curvá la mancuerna hacia arriba contrayendo el bíceps mientras exhalás. Solo se mueven los antebrazos. Continuá hasta la contracción completa del bíceps con la mancuernas a la altura del hombro. Sostené un segundo en la contracción.",
      "Volvé lentamente las mancuernas a la posición inicial mientras inhalás.",
      "Repetí las veces indicadas.",
      "Cambiá de brazo mientras realizás el ejercicio.",
    ],
    puntosClave: [
      "El apoyo del pecho contra el banco elimina el balanceo del torso.",
    ],
    erroresComunes: [
      "Despegar el pecho del banco para ganar impulso.",
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
console.log(`✅ Lote 8 aplicado — ${nuevasAgregadas} entradas nuevas agregadas.`);
