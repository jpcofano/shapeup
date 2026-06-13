/**
 * Lote 5 — 30 NUEVAS traducciones (beginner + equipo hogareño).
 * Primera tanda de ejercicios sin traducción previa.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const FILE = resolve("scripts/data/traducciones-fedb.es.json");
const t = JSON.parse(readFileSync(FILE, "utf8"));

const nuevos: Record<string, object> = {

  "3_4_Sit-Up": {
    nombre: "Sit-up 3/4",
    patron: "Core flexión",
    unilateral: false,
    sinonimos: ["sit up", "abdominal 3/4"],
    instrucciones: [
      "Acostáte en el piso y asegurá los pies. Las piernas deben estar flexionadas con las rodillas dobladas.",
      "Colocá las manos detrás o a los costados de la cabeza. Comenzás con la espalda en el piso. Esta es la posición inicial.",
      "Flexioná la cadera y la columna para elevar el torso hacia las rodillas.",
      "En la parte superior de la contracción el torso debe quedar perpendicular al piso. Revertí el movimiento bajando solo 3/4 del camino hacia el piso.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "No bajar completamente entre reps mantiene tensión constante en el abdomen.",
    ],
    erroresComunes: [
      "Tirar del cuello con las manos.",
      "Usar impulso en lugar de contraer el abdomen.",
    ],
  },

  "Alternate_Hammer_Curl": {
    nombre: "Curl de martillo alternado",
    patron: "Aislamiento",
    unilateral: true,
    sinonimos: ["hammer curl alternado"],
    instrucciones: [
      "Pararte con el torso erguido y una mancuerna en cada mano con los brazos extendidos a los costados. Los codos deben estar cerca del torso.",
      "Las palmas de las manos miran hacia el cuerpo (agarre neutro). Esta es la posición inicial.",
      "Manteniendo el brazo superior quieto, flexioná el codo derecho llevando la mancuerna hacia el hombro mientras exhalás. Solo el antebrazo se mueve. Llegá hasta la contracción completa del bíceps y sostené un segundo apretando.",
      "Bajá la mancuerna lentamente a la posición inicial mientras inhalás.",
      "Repetí con la mano izquierda. Eso equivale a una repetición.",
      "Seguí alternando de esta manera por las repeticiones indicadas.",
    ],
    puntosClave: [
      "Solo el antebrazo se mueve; el codo permanece fijo.",
    ],
    erroresComunes: [
      "Mover el codo hacia adelante.",
      "Usar el torso para dar impulso.",
    ],
  },

  "Alternate_Incline_Dumbbell_Curl": {
    nombre: "Curl inclinado alternado con mancuernas",
    patron: "Aislamiento",
    unilateral: true,
    sinonimos: ["curl en banco inclinado alternado"],
    instrucciones: [
      "Sentáte en un banco inclinado con una mancuerna en cada mano a extensión de brazos. Mantenés los codos cerca del torso. Esta es la posición inicial.",
      "Manteniendo el brazo superior quieto, flexioná el codo derecho llevando la mancuerna hacia el hombro mientras exhalás. Al hacerlo, rotá la muñeca para que la palma quede mirando hacia arriba. Seguí hasta la contracción completa del bíceps y sostené un segundo apretando. Solo el antebrazo se mueve.",
      "Bajá la mancuerna lentamente a la posición inicial mientras inhalás.",
      "Repetí con la mano izquierda. Eso equivale a una repetición.",
      "Seguí alternando por las repeticiones indicadas.",
    ],
    puntosClave: [
      "La inclinación del banco aumenta el rango de movimiento del bíceps.",
    ],
    erroresComunes: [
      "Mover el hombro hacia adelante al subir.",
    ],
  },

  "Alternating_Deltoid_Raise": {
    nombre: "Elevación alterna de deltoide (frente y lateral)",
    patron: "Aislamiento",
    unilateral: true,
    sinonimos: ["elevacion deltoides alternada"],
    instrucciones: [
      "De pie, sostené un par de mancuernas a los costados.",
      "Manteniendo los codos ligeramente flexionados, elevá las mancuernas directamente al frente hasta la altura de los hombros sin balancear el torso.",
      "Volvé las mancuernas a los costados.",
      "En la siguiente repetición, elevá las mancuernas hacia los costados hasta la altura de los hombros.",
      "Volvé a la posición inicial y seguí alternando frente y lateral.",
    ],
    puntosClave: [
      "Trabaja deltoide anterior y medial en un solo ejercicio.",
    ],
    erroresComunes: [
      "Usar impulso del torso.",
      "Subir los hombros hacia las orejas.",
    ],
  },

  "Alternating_Floor_Press": {
    nombre: "Press de piso alternado con pesa rusa",
    patron: "Empuje horizontal",
    unilateral: true,
    sinonimos: ["floor press alternado"],
    instrucciones: [
      "Acostáte en el piso con dos pesas rusas a los costados de los hombros.",
      "Colocá una pesa sobre el pecho y luego la otra, tomando los mangos con las palmas mirando hacia adelante.",
      "Extendé ambos brazos de manera que las pesas queden sobre el pecho. Bajá una pesa llevándola al pecho y girá la muñeca en dirección a la pesa del lado contrario (que permanece extendida).",
      "Subí esa pesa y repetí del otro lado.",
    ],
    puntosClave: [
      "El piso limita el rango de movimiento protegiendo el hombro.",
    ],
    erroresComunes: [
      "No controlar el descenso.",
    ],
  },

  "Back_Flyes_-_With_Bands": {
    nombre: "Aperturas de espalda con banda",
    patron: "Tracción horizontal",
    unilateral: false,
    sinonimos: ["back flyes banda", "aperturas posteriores con banda"],
    instrucciones: [
      "Pasá una banda alrededor de un poste estable como el de un rack de sentadillas.",
      "Tomá los extremos de la banda y alejáte hasta que haya tensión.",
      "Extendé y levantá los brazos al frente paralelos al piso y perpendiculares al torso; los pies bien apoyados al ancho de hombros. Esta es la posición inicial.",
      "Exhalando, mové los brazos hacia los costados y hacia atrás manteniendo los brazos extendidos y paralelos al piso, hasta que queden a los lados del cuerpo.",
      "Pausá y volvé a la posición inicial mientras inhalás.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "Mantené los brazos paralelos al piso durante todo el arco.",
    ],
    erroresComunes: [
      "Bajar los brazos durante el movimiento.",
      "Arquear la espalda.",
    ],
  },

  "Band_Hip_Adductions": {
    nombre: "Aducción de cadera con banda",
    patron: "Aislamiento",
    unilateral: true,
    sinonimos: ["hip adduction banda"],
    instrucciones: [
      "Anclá la banda alrededor de un poste sólido u otro objeto.",
      "Pararte con el lado izquierdo hacia el poste y pasá el pie derecho por la banda, colocándola alrededor del tobillo.",
      "Pararte derecho y agarráte del poste si necesitás apoyo. Esta es la posición inicial.",
      "Manteniendo la rodilla recta, llevá la pierna derecha hacia afuera lo más posible.",
      "Volvé a la posición inicial y repetí las repeticiones indicadas.",
      "Cambiá de lado.",
    ],
    puntosClave: [
      "Trabaja aductores de cadera.",
    ],
    erroresComunes: [
      "Flexionar la rodilla durante el movimiento.",
      "Inclinarse hacia el costado.",
    ],
  },

  "Band_Skull_Crusher": {
    nombre: "Skull crusher con banda",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["skull crusher banda", "rompecabezas con banda"],
    instrucciones: [
      "Asegurá la banda en la base de un rack o del banco. Acostáte en el banco de modo que la banda quede alineada con la cabeza.",
      "Tomá la banda y levantá los codos de manera que la parte superior del brazo quede perpendicular al piso; con el codo flexionado, la banda debe quedar por encima de la cabeza. Esta es la posición inicial.",
      "Extendé el codo para estirar el brazo manteniendo la parte superior del brazo fija. Pausá en la parte superior y volvé a la posición inicial.",
    ],
    puntosClave: [
      "Los codos apuntan al techo en todo momento.",
    ],
    erroresComunes: [
      "Mover los codos hacia los costados.",
    ],
  },

  "Bench_Press_-_With_Bands": {
    nombre: "Press de banca con banda elástica",
    patron: "Empuje horizontal",
    unilateral: false,
    sinonimos: ["press de pecho con banda"],
    instrucciones: [
      "Usando un banco plano, asegurá la banda bajo la pata del banco más cercana a la cabeza.",
      "Una vez asegurada, tomá los extremos de la banda con ambas manos y acostáte en el banco.",
      "Extendé los brazos sosteniéndolos al ancho de los hombros.",
      "Rotá las muñecas hacia adelante de manera que las palmas queden mirando hacia afuera. Esta es la posición inicial.",
      "Bajá los extremos lentamente hasta que el codo forme un ángulo de 90°. Mantenés el control total en todo momento.",
      "Exhalando, empujá los extremos hacia arriba usando los pectorales. Extendé los codos, apretá el pecho, sostené un segundo y luego comenzá a bajar lentamente. El descenso debería llevar al menos el doble de tiempo que el ascenso.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "La banda añade resistencia variable: más difícil arriba que abajo.",
    ],
    erroresComunes: [
      "Perder el control de la banda.",
    ],
  },

  "Bent-Knee_Hip_Raise": {
    nombre: "Elevación de cadera con rodillas flexionadas",
    patron: "Core flexión",
    unilateral: false,
    sinonimos: ["hip raise rodillas dobladas", "reverse crunch"],
    instrucciones: [
      "Acostáte boca arriba con los brazos a los costados.",
      "Flexioná las rodillas unos 75° y elevá los pies del suelo unos 5 cm.",
      "Usando el abdomen inferior, llevá las rodillas hacia el pecho manteniendo el ángulo de 75° en las piernas. Continuá hasta levantar la cadera del piso haciendo rodar la pelvis hacia atrás. Exhalá durante esta parte. Al final del movimiento las rodillas quedarán sobre el pecho.",
      "Apretá el abdomen en la parte superior un segundo y volvé lentamente a la posición inicial mientras inhalás. Mantenés un movimiento controlado en todo momento.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "El movimiento proviene del abdomen inferior, no del impulso de las piernas.",
    ],
    erroresComunes: [
      "Usar el impulso de las piernas para subir.",
      "Dejar caer la espalda baja bruscamente.",
    ],
  },

  "Bent_Over_Dumbbell_Rear_Delt_Raise_With_Head_On_Bench": {
    nombre: "Elevación de deltoide posterior con cabeza en banco",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["rear delt raise con banco", "pajaro con banco"],
    instrucciones: [
      "Pararte con el torso erguido sosteniendo una mancuerna en cada mano, con un banco inclinado frente a vos.",
      "Manteniendo la espalda recta y la curvatura natural de la columna, inclinate hacia adelante hasta que la frente toque el banco. Los brazos cuelgan perpendicularmente al piso con las palmas enfrentadas; el torso queda paralelo al piso. Esta es la posición inicial.",
      "Manteniendo el torso quieto y los brazos rectos con una leve flexión de codo, elevá las mancuernas hacia los costados hasta que ambos brazos queden paralelos al piso. Exhalá al subir. No balancees el torso ni lleves los brazos hacia atrás en lugar de hacia los costados.",
      "Sostené la contracción un segundo y bajá lentamente las mancuernas a la posición inicial.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "El banco estabiliza el torso y aísla el deltoide posterior.",
    ],
    erroresComunes: [
      "Tirar los brazos hacia atrás en lugar de abrirlos al costado.",
    ],
  },

  "Bent_Over_Two-Dumbbell_Row_With_Palms_In": {
    nombre: "Remo con mancuernas agarre neutro",
    patron: "Tracción horizontal",
    unilateral: false,
    sinonimos: ["remo agarre neutro", "bent over row palmas adentro"],
    instrucciones: [
      "Con una mancuerna en cada mano y las palmas enfrentadas entre sí, flexioná levemente las rodillas y llevá el torso hacia adelante doblándote desde la cintura, manteniendo la espalda recta hasta que quede casi paralela al piso. Cabeza arriba; las mancuernas cuelgan perpendicularmente al piso. Esta es la posición inicial.",
      "Manteniendo el torso quieto, llevá las mancuernas hacia los costados mientras exhalás, apretando los omóplatos entre sí. En la posición contraída, apretá los músculos de la espalda y sostené un segundo.",
      "Bajá lentamente las mancuernas a la posición inicial mientras inhalás.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "El agarre neutro (palmas enfrentadas) enfatiza la tracción alta y el dorsal.",
    ],
    erroresComunes: [
      "Redondear la espalda.",
      "Levantarse con el torso al tirar.",
    ],
  },

  "Body_Tricep_Press": {
    nombre: "Press de tríceps con peso corporal",
    patron: "Empuje horizontal",
    unilateral: false,
    sinonimos: ["tricep press corporal"],
    instrucciones: [
      "Colocá una barra en un rack a la altura del pecho.",
      "De pie, tomá la barra al ancho de los hombros y alejáte uno o dos pasos con los pies juntos y los brazos extendidos de modo que el cuerpo se apoye en la barra inclinado. Esta es la posición inicial.",
      "Comenzá flexionando los codos, bajando el cuerpo hacia la barra.",
      "Pausá y luego revertí el movimiento extendiendo los codos.",
      "Para progresar, agregá cadenas sobre los hombros para incrementar el peso.",
    ],
    puntosClave: [
      "Cuanto más inclinado el cuerpo, más difícil.",
    ],
    erroresComunes: [
      "Abrir los codos hacia los costados.",
    ],
  },

  "Bottoms_Up": {
    nombre: "Elevación de glúteos con extensión de piernas",
    patron: "Core flexión",
    unilateral: false,
    sinonimos: ["bottoms up", "elevacion pelvis piernas arriba"],
    instrucciones: [
      "Comenzá acostado boca arriba en el piso con las piernas extendidas y los brazos a los costados. Esta es la posición inicial.",
      "Para ejecutar el movimiento, llevá las rodillas hacia el pecho flexionando caderas y rodillas. Luego extendé las piernas directamente hacia arriba para que queden perpendiculares al piso. Rotá y elevá la pelvis para levantar los glúteos del suelo.",
      "Después de una breve pausa, volvé a la posición inicial.",
    ],
    puntosClave: [
      "La elevación de pelvis activa el abdomen inferior.",
    ],
    erroresComunes: [
      "Usar impulso en lugar de abdomen.",
    ],
  },

  "Butt-Ups": {
    nombre: "Elevación de glúteos en plancha (butt-ups)",
    patron: "Core anti-rotación",
    unilateral: false,
    sinonimos: ["butt ups", "pike en plancha"],
    instrucciones: [
      "Comenzá en posición de plancha baja (antebrazos en el piso), con los brazos doblados a 90°.",
      "Arqueá levemente la espalda hacia afuera en lugar de mantenerla completamente recta.",
      "Elevá los glúteos hacia el techo apretando fuerte el abdomen para acercar las costillas a las caderas. El resultado final es una posición de puente alto. Exhalá al realizar esta parte.",
      "Bajá lentamente a la posición inicial mientras inhalás. No dejes que la espalda se hunda hacia abajo.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "Contrae el abdomen para cerrar la distancia costillas-caderas.",
    ],
    erroresComunes: [
      "Dejar caer la espalda entre repeticiones.",
    ],
  },

  "Close-Grip_Dumbbell_Press": {
    nombre: "Press con agarre cerrado con mancuernas",
    patron: "Empuje horizontal",
    unilateral: false,
    sinonimos: ["close grip dumbbell press"],
    instrucciones: [
      "Colocá una mancuerna parada y asegurada en un extremo de un banco plano.",
      "Asegurándote de que la mancuerna esté firmemente colocada en el banco, acostáte perpendicular a él con solo los hombros apoyados en la superficie. Las caderas quedan por debajo del banco y las piernas flexionadas con los pies en el piso.",
      "Tomá la mancuerna con ambas manos y sostenela directamente sobre el pecho con los brazos extendidos. Ambas palmas deben presionar contra la cara inferior de los extremos de la mancuerna. Esta es la posición inicial.",
      "Iniciá el movimiento bajando la mancuerna hacia el pecho.",
      "Volvé a la posición inicial extendiendo los codos.",
    ],
    puntosClave: [
      "El agarre cerrado enfatiza los tríceps sobre el pecho.",
    ],
    erroresComunes: [
      "Abrir los codos durante el press.",
    ],
  },

  "Cocoons": {
    nombre: "Cocoons (abdominal combinado)",
    patron: "Core flexión",
    unilateral: false,
    sinonimos: ["cocoons", "cocones"],
    instrucciones: [
      "Comenzá acostado boca arriba en el piso con las piernas extendidas y los brazos extendidos detrás de la cabeza. Esta es la posición inicial.",
      "Para ejecutar el movimiento, llevá las rodillas hacia el pecho rotando la pelvis para elevar los glúteos del piso. Al mismo tiempo, llevá los brazos por encima de la cabeza hacia adelante realizando un crunch simultáneo.",
      "Después de una breve pausa, volvé a la posición inicial.",
    ],
    puntosClave: [
      "Combina crunch de abdomen superior e inferior en una sola rep.",
    ],
    erroresComunes: [
      "No sincronizar brazos y rodillas.",
    ],
  },

  "Cross-Body_Crunch": {
    nombre: "Crunch cruzado",
    patron: "Core rotación",
    unilateral: false,
    sinonimos: ["cross body crunch", "crunch oblicuo"],
    instrucciones: [
      "Acostáte boca arriba y flexioná las rodillas unos 60°.",
      "Mantené los pies planos en el piso y colocá las manos suavemente detrás de la cabeza. Esta es la posición inicial.",
      "Enroscáte hacia arriba y llevá el codo y el hombro derechos a través del cuerpo mientras llevás la rodilla izquierda hacia el hombro izquierdo al mismo tiempo. Intentá tocar la rodilla con el codo. Exhalá al realizar este movimiento. Concentráte en llevar el hombro hacia la rodilla, no solo el codo; la clave es contraer el abdomen, no mover el codo.",
      "Volvé a la posición inicial mientras inhalás y repetí con el codo izquierdo y la rodilla derecha.",
      "Seguí alternando hasta completar las repeticiones indicadas.",
    ],
    puntosClave: [
      "Girá el hombro, no el codo.",
    ],
    erroresComunes: [
      "Tirar del cuello.",
      "No rotar el torso.",
    ],
  },

  "Cross_Body_Hammer_Curl": {
    nombre: "Curl de martillo cruzado",
    patron: "Aislamiento",
    unilateral: true,
    sinonimos: ["cross body curl", "curl cruzado martillo"],
    instrucciones: [
      "Pararte con el torso erguido y una mancuerna en cada mano. Las manos deben estar a los costados con las palmas mirando hacia adentro.",
      "Manteniendo las palmas hacia adentro y sin torcer el brazo, flexioná el codo derecho llevando la mancuerna hacia el hombro izquierdo mientras exhalás. Tocá la parte superior de la mancuerna con el hombro y sostené la contracción un segundo.",
      "Bajá la mancuerna lentamente por el mismo camino mientras inhalás y luego repetí con el brazo izquierdo.",
      "Seguí alternando hasta completar las repeticiones indicadas para cada brazo.",
    ],
    puntosClave: [
      "El movimiento cruzado enfatiza el braquial y braquiorradial.",
    ],
    erroresComunes: [
      "Rotar la palma al subir.",
    ],
  },

  "Cross_Over_-_With_Bands": {
    nombre: "Cruce de pecho con banda (crossover)",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["crossover con banda", "cable crossover con banda"],
    instrucciones: [
      "Asegurá una banda elástica alrededor de un poste estable.",
      "De espaldas al poste, tomá los extremos de la banda en cada mano y alejáte lo suficiente para crear tensión.",
      "Levantá los brazos a los costados paralelos al piso y perpendiculares al torso, con las palmas mirando hacia adelante y los codos ligeramente flexionados. El torso y los brazos deben asemejarse a la letra 'T'. Esta es la posición inicial.",
      "Manteniendo los brazos rectos, llevalos hacia adelante en arco hasta que queden al frente mientras exhalás y contraés el pecho. Sostené la contracción un segundo.",
      "Volvé lentamente a la posición inicial mientras inhalás.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "El arco de movimiento es solo de hombro; el ángulo del codo no cambia.",
    ],
    erroresComunes: [
      "Cerrar los brazos con los codos en lugar de con el hombro.",
    ],
  },

  "Crunch_-_Hands_Overhead": {
    nombre: "Crunch con brazos extendidos",
    patron: "Core flexión",
    unilateral: false,
    sinonimos: ["crunch brazos arriba", "crunch overhead"],
    instrucciones: [
      "Acostáte en el piso con la espalda plana y las rodillas flexionadas unos 60°.",
      "Mantené los pies planos en el piso y estirá los brazos sobre la cabeza con las palmas cruzadas. Esta es la posición inicial.",
      "Enroscá la parte superior del cuerpo hacia adelante y despegá los omóplatos del piso. En todo momento mantenés los brazos alineados con la cabeza, el cuello y el hombro, sin llevarlos más hacia adelante. Exhalá durante esta parte y sostené la contracción un segundo.",
      "Bajá lentamente a la posición inicial mientras inhalás.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "Los brazos extendidos aumentan el brazo de palanca y el trabajo abdominal.",
    ],
    erroresComunes: [
      "Llevar los brazos hacia adelante para ayudar al movimiento.",
    ],
  },

  "Crunch_-_Legs_On_Exercise_Ball": {
    nombre: "Crunch con piernas en pelota de ejercicio",
    patron: "Core flexión",
    unilateral: false,
    sinonimos: ["crunch en pelota", "crunch fitball"],
    instrucciones: [
      "Acostáte boca arriba con los pies apoyados en una pelota de ejercicio y las rodillas flexionadas a 90°.",
      "Separás los pies unos 8-10 cm y apuntás los dedos hacia adentro para que se toquen.",
      "Colocá las manos a los costados de la cabeza con los codos hacia adelante. No entrelacer los dedos detrás de la nuca.",
      "Presioná la zona lumbar contra el piso para aislar mejor los abdominales. Esta es la posición inicial.",
      "Comenzá a despegar los hombros del piso y seguí presionando la zona lumbar hacia abajo. Los hombros solo deben elevarse unos 10 cm; la zona lumbar permanece en el piso. Exhalá al hacerlo. Apretá fuerte el abdomen en la parte superior y sostené un segundo. Enfocáte en movimientos lentos y controlados sin usar impulso.",
      "Volvé lentamente a la posición inicial mientras inhalás.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "La pelota eleva los pies y activa más el abdomen inferior.",
    ],
    erroresComunes: [
      "Tirar del cuello.",
      "Subir demasiado usando el impulso.",
    ],
  },

  "Decline_Dumbbell_Bench_Press": {
    nombre: "Press en banco decline con mancuernas",
    patron: "Empuje horizontal",
    unilateral: false,
    sinonimos: ["press decline mancuernas"],
    instrucciones: [
      "Asegurá las piernas al extremo del banco decline y acostáte con una mancuerna en cada mano sobre los muslos. Las palmas se miran entre sí.",
      "Una vez acostado, mové las mancuernas al frente al ancho de los hombros.",
      "Rotá las muñecas de modo que las palmas queden mirando hacia afuera. Esta es la posición inicial.",
      "Bajá lentamente las mancuernas hacia los lados mientras inhalás. Mantenés el control total en todo momento. Durante el movimiento, los antebrazos siempre deben quedar perpendiculares al piso.",
      "Exhalando, empujá las mancuernas hacia arriba usando los pectorales. Extendé los codos, apretá el pecho, sostené un segundo y comenzá a bajar lentamente. El descenso debería llevar al menos el doble de tiempo que el ascenso.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "El banco decline enfatiza la zona inferior del pecho.",
    ],
    erroresComunes: [
      "Perder el control de las mancuernas al final del rango.",
    ],
  },

  "Decline_Dumbbell_Flyes": {
    nombre: "Aperturas en banco decline con mancuernas",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["decline flyes", "aperturas decline"],
    instrucciones: [
      "Asegurá las piernas al extremo del banco decline y acostáte con una mancuerna en cada mano sobre los muslos. Las palmas se miran entre sí.",
      "Una vez acostado, mové las mancuernas al frente al ancho de los hombros con las palmas mirándose y los brazos perpendiculares al piso completamente extendidos. Esta es la posición inicial.",
      "Con los codos levemente flexionados para proteger el tendón del bíceps, abrí los brazos hacia los lados en arco amplio bajando lentamente mientras inhalás hasta sentir el estiramiento en el pecho. Los brazos permanecen estáticos durante el movimiento; este ocurre solo en la articulación del hombro.",
      "Volvé los brazos a la posición inicial usando el mismo arco, apretando los pectorales mientras exhalás.",
      "Sostené un segundo en la posición contraída y repetí las veces indicadas.",
    ],
    puntosClave: [
      "El ángulo decline recluta más la zona inferior del pectoral.",
    ],
    erroresComunes: [
      "Bajar los brazos más allá del pecho perdiendo el control.",
    ],
  },

  "Decline_Dumbbell_Triceps_Extension": {
    nombre: "Extensión de tríceps en banco decline",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["skull crusher decline", "extensión triceps decline"],
    instrucciones: [
      "Asegurá las piernas al extremo del banco decline y acostáte con una mancuerna en cada mano sobre los muslos. Las palmas se miran entre sí.",
      "Una vez acostado, mové las mancuernas al frente al ancho de los hombros con las palmas enfrentadas y los brazos perpendiculares al piso completamente extendidos. Esta es la posición inicial.",
      "Manteniendo los brazos superiores fijos y los codos hacia adentro, bajá las mancuernas lentamente en arco hacia vos hasta que los pulgares queden a la altura de las orejas. Inhalá durante esta parte.",
      "Levantá las mancuernas a la posición inicial contrayendo los tríceps mientras exhalás.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "Solo se mueven los antebrazos; los codos apuntan al techo.",
    ],
    erroresComunes: [
      "Mover los codos hacia afuera al bajar.",
    ],
  },

  "Decline_Oblique_Crunch": {
    nombre: "Crunch oblicuo en banco decline",
    patron: "Core rotación",
    unilateral: true,
    sinonimos: ["crunch oblicuo decline"],
    instrucciones: [
      "Asegurá las piernas al extremo del banco decline y acostáte en él lentamente.",
      "Elevá el torso del banco hasta que quede a unos 35-45° del piso.",
      "Colocá una mano a un lado de la cabeza y la otra sobre el muslo. Esta es la posición inicial.",
      "Elevá lentamente el torso desde la posición inicial girando el torso hacia la izquierda. Seguí subiendo mientras exhalás hasta que el codo derecho toque la rodilla izquierda. Sostené esta posición contraída un segundo. Concentráte en mantener el abdomen apretado y el movimiento lento y controlado.",
      "Bajá el cuerpo lentamente a la posición inicial mientras inhalás.",
      "Después de completar un lado con las reps indicadas, cambiá al lado izquierdo. Enfocáte en rotar bien el torso y sentir la contracción en la parte superior.",
    ],
    puntosClave: [
      "La inclinación del banco aumenta la activación abdominal.",
    ],
    erroresComunes: [
      "Tirar del cuello en lugar de rotar el torso.",
    ],
  },

  "Decline_Reverse_Crunch": {
    nombre: "Crunch inverso en banco decline",
    patron: "Core flexión",
    unilateral: false,
    sinonimos: ["reverse crunch decline"],
    instrucciones: [
      "Acostáte boca arriba en un banco decline y agarráte del extremo superior con ambas manos. No dejés que el cuerpo se deslice.",
      "Mantenés las piernas paralelas al piso usando el abdomen, con las rodillas y los pies juntos. Las piernas deben estar completamente extendidas con una leve flexión en la rodilla. Esta es la posición inicial.",
      "Exhalando, llevá las piernas hacia el torso haciendo rodar la pelvis hacia atrás y elevando las caderas del banco. Al final del movimiento las rodillas tocarán el pecho.",
      "Sostené la contracción un segundo y volvé las piernas a la posición inicial mientras inhalás.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "Activa el abdomen inferior; el movimiento viene de la pelvis, no de las piernas.",
    ],
    erroresComunes: [
      "Usar el impulso de las piernas.",
    ],
  },

  "Dips_-_Triceps_Version": {
    nombre: "Fondos de tríceps (dips)",
    patron: "Empuje vertical",
    unilateral: false,
    sinonimos: ["dips", "fondos paralelas"],
    instrucciones: [
      "Adoptá la posición inicial sosteniéndote a extensión de brazos sobre las barras, con los brazos casi bloqueados.",
      "Inhalá y bajá lentamente. El torso debe mantenerse erguido y los codos cerca del cuerpo para enfocar el trabajo en los tríceps. Bajá hasta que se forme un ángulo de 90° entre brazo y antebrazo.",
      "Exhalá y empujá el cuerpo hacia arriba usando los tríceps hasta volver a la posición inicial.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "Torso erguido y codos pegados al cuerpo para énfasis en tríceps.",
    ],
    erroresComunes: [
      "Inclinarse hacia adelante (eso enfatiza el pecho en lugar de los tríceps).",
    ],
  },

  "Dumbbell_Alternate_Bicep_Curl": {
    nombre: "Curl de bíceps alternado con mancuernas",
    patron: "Aislamiento",
    unilateral: true,
    sinonimos: ["curl alternado biceps", "alternate bicep curl"],
    instrucciones: [
      "Pararte con el torso erguido y una mancuerna en cada mano a extensión de brazos. Los codos cerca del torso y las palmas mirando hacia los muslos.",
      "Manteniendo el brazo superior quieto, flexioná el codo derecho llevando la mancuerna mientras rotás la palma hacia arriba (agarre supino) al subir. Seguí hasta la contracción completa del bíceps y sostené un segundo apretando. Solo el antebrazo se mueve.",
      "Bajá lentamente la mancuerna a la posición inicial mientras inhalás. Al bajar, rotá la palma de vuelta hacia el muslo.",
      "Repetí con la mano izquierda. Eso equivale a una repetición.",
      "Seguí alternando por las repeticiones indicadas.",
    ],
    puntosClave: [
      "La supinación al subir maximiza la activación del bíceps.",
    ],
    erroresComunes: [
      "Mover el codo hacia adelante al subir.",
      "No rotar la muñeca de vuelta al bajar.",
    ],
  },

  "Dumbbell_Bench_Press_with_Neutral_Grip": {
    nombre: "Press de banca con agarre neutro",
    patron: "Empuje horizontal",
    unilateral: false,
    sinonimos: ["neutral grip bench press", "press pecho agarre neutro"],
    instrucciones: [
      "Tomá una mancuerna en cada mano y acostáte en un banco plano. Los pies apoyados en el piso y los omóplatos retraídos.",
      "Manteniendo el agarre neutro (palmas enfrentadas entre sí), comenzá con los brazos extendidos directamente sobre vos, perpendiculares al piso. Esta es la posición inicial.",
      "Comenzá el movimiento flexionando los codos, bajando los brazos superiores hacia los costados. Descendé hasta que las mancuernas queden al nivel del torso.",
      "Pausá y luego extendé los codos volviendo a la posición inicial.",
    ],
    puntosClave: [
      "El agarre neutro reduce la tensión en el hombro.",
    ],
    erroresComunes: [
      "Dejar que los codos se abran demasiado hacia los costados.",
    ],
  },
};

// Insertar solo entradas que no existan aún
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
console.log(`✅ Lote 5 aplicado — ${nuevasAgregadas} entradas nuevas agregadas.`);
