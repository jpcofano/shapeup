/**
 * Lote 7 — 30 NUEVAS traducciones (beginner + equipo hogareño, tanda 3).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const FILE = resolve("scripts/data/traducciones-fedb.es.json");
const t = JSON.parse(readFileSync(FILE, "utf8"));

const nuevos: Record<string, object> = {

  "Dumbbell_Incline_Row": {
    nombre: "Remo inclinado con mancuernas",
    patron: "Tracción horizontal",
    unilateral: false,
    sinonimos: ["incline row", "remo en banco inclinado"],
    instrucciones: [
      "Con agarre neutro, apoyate sobre un banco inclinado boca abajo.",
      "Tomá una mancuerna en cada mano con agarre neutro, comenzando con los brazos extendidos. Esta es la posición inicial.",
      "Retraé los omóplatos y flexioná los codos para remar las mancuernas hacia los costados.",
      "Pausá en la parte superior del movimiento y volvé a la posición inicial.",
    ],
    puntosClave: [
      "El banco inclinado elimina la necesidad de estabilizar la espalda baja.",
    ],
    erroresComunes: [
      "Usar impulso del torso en lugar de los brazos y la espalda.",
    ],
  },

  "Dumbbell_Incline_Shoulder_Raise": {
    nombre: "Elevación de hombros en banco inclinado",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["incline shoulder raise"],
    instrucciones: [
      "Sentáte en un banco inclinado sosteniendo una mancuerna en cada mano sobre los muslos.",
      "Levantá las piernas para impulsar las mancuernas hacia los hombros y reclinarte hacia atrás. Colocá las mancuernas sobre los hombros con los brazos extendidos. Los brazos deben quedar perpendiculares al piso con las palmas hacia adelante y los nudillos apuntando al techo. Esta es la posición inicial.",
      "Manteniendo los brazos rectos y bloqueados, levantá las mancuernas elevando los hombros del banco mientras exhalás.",
      "Volvé las mancuernas a la posición inicial mientras inhalás.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "Los brazos permanecen bloqueados; el movimiento viene de elevar el omóplato.",
    ],
    erroresComunes: [
      "Flexionar los codos durante el movimiento.",
    ],
  },

  "Dumbbell_Lunges": {
    nombre: "Zancada con mancuernas",
    patron: "Zancada / unilateral",
    unilateral: true,
    sinonimos: ["lunges con mancuernas", "estocada con mancuernas"],
    instrucciones: [
      "Pararte con el torso erguido sosteniendo dos mancuernas a los costados. Esta es la posición inicial.",
      "Dá un paso adelante con la pierna derecha, unos 60 cm desde el pie que queda atrás, y bajá el cuerpo manteniendo el torso erguido y el equilibrio. Inhalá al bajar. No dejés que la rodilla avance más allá de la punta del pie, ya que eso genera estrés innecesario en la articulación. La tibia delantera debe quedar perpendicular al piso.",
      "Usando principalmente el talón del pie delantero, empujá hacia arriba y volvé a la posición inicial mientras exhalás.",
      "Repetí el movimiento las veces indicadas y luego hacelo con la pierna izquierda.",
    ],
    puntosClave: [
      "El paso al frente determina el ángulo de la rodilla; ajustalo según la movilidad.",
    ],
    erroresComunes: [
      "Dejar que la rodilla delantera sobrepase la punta del pie.",
    ],
  },

  "Dumbbell_Raise": {
    nombre: "Elevación frontal-lateral con mancuernas (raise combinado)",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["dumbbell raise", "elevación combinada mancuernas"],
    instrucciones: [
      "Tomá una mancuerna en cada mano y pararte derecho con los brazos extendidos a los costados, con una leve flexión de codo y la espalda recta. Esta es la posición inicial. La mancuerna debe quedar junto al muslo con la palma mirando hacia atrás.",
      "Usá los deltoides laterales para elevar las mancuernas mientras exhalás. Las mancuernas deben quedar al costado del cuerpo al subir. Seguí elevando hasta que las mancuernas queden casi a la altura del mentón. El codo guía el movimiento: siempre debe quedar más alto que el antebrazo. Mantenés el torso fijo y pausás un segundo en la parte superior.",
      "Bajá las mancuernas lentamente a la posición inicial mientras inhalás.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "El codo siempre va más alto que el antebrazo durante la subida.",
    ],
    erroresComunes: [
      "Usar el torso para dar impulso.",
    ],
  },

  "Dumbbell_Scaption": {
    nombre: "Scaption con mancuernas (elevación en plano escapular)",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["scaption", "elevacion plano escapular"],
    instrucciones: [
      "Este ejercicio correctivo fortalece los músculos que estabilizan el omóplato. Sostené un peso liviano en cada mano, colgando a los costados. Los pulgares deben apuntar hacia arriba.",
      "Comenzá el movimiento elevando los brazos al frente, unos 30° desde el centro del cuerpo. Los brazos deben estar completamente extendidos durante el movimiento.",
      "Continuá hasta que los brazos queden paralelos al piso y luego volvé a la posición inicial.",
    ],
    puntosClave: [
      "El plano de 30° (no completamente al frente) reduce el estrés en el manguito rotador.",
    ],
    erroresComunes: [
      "Subir por encima de la altura de los hombros.",
    ],
  },

  "Dumbbell_Squat": {
    nombre: "Sentadilla con mancuernas",
    patron: "Dominante de rodilla",
    unilateral: false,
    sinonimos: ["dumbbell squat", "sentadilla con peso"],
    instrucciones: [
      "Pararte derecho sosteniendo una mancuerna en cada mano (palmas hacia los costados de las piernas).",
      "Colocá las piernas con una postura media al ancho de hombros y las puntas de los pies levemente hacia afuera. Mantené la cabeza arriba en todo momento, ya que mirar hacia abajo te desequilibra; también mantené la espalda recta. Esta es la posición inicial.",
      "Comenzá a bajar el torso lentamente flexionando las rodillas mientras mantenés la postura recta y la cabeza arriba. Continuá bajando hasta que los muslos queden paralelos al piso. Si la ejecución es correcta, el frente de las rodillas debe formar una línea recta imaginaria con los dedos de los pies, perpendicular al frente. Si las rodillas sobrepasan esa línea (más allá de los dedos), estás generando estrés innecesario en la rodilla.",
      "Comenzá a subir el torso mientras exhalás, empujando el piso principalmente con el talón mientras extendés las piernas y volvés a la posición inicial.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "Las rodillas no deben sobrepasar la línea de los dedos de los pies.",
    ],
    erroresComunes: [
      "Mirar hacia abajo perdiendo el equilibrio.",
      "Redondear la espalda baja.",
    ],
  },

  "Dumbbell_Tricep_Extension_-Pronated_Grip": {
    nombre: "Extensión de tríceps con mancuernas agarre pronado",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["tricep extension pronado", "skull crusher pronado"],
    instrucciones: [
      "Acostáte en un banco plano sosteniendo dos mancuernas directamente sobre los hombros. Los brazos deben estar completamente extendidos formando un ángulo de 90° entre el torso y el piso.",
      "Las palmas de las manos miran hacia adelante y los codos están pegados al cuerpo. Esta es la posición inicial.",
      "Inhalá y bajá lentamente las mancuernas hasta que queden cerca de las orejas. Asegurate de mantener los brazos superiores fijos y los codos pegados al cuerpo.",
      "Exhalá y usá los tríceps para devolver el peso a la posición inicial.",
    ],
    puntosClave: [
      "Los brazos superiores permanecen completamente fijos durante todo el movimiento.",
    ],
    erroresComunes: [
      "Abrir los codos hacia afuera al bajar.",
    ],
  },

  "Elbow_to_Knee": {
    nombre: "Codo a rodilla",
    patron: "Core rotación",
    unilateral: true,
    sinonimos: ["elbow to knee", "crunch cruzado de piso"],
    instrucciones: [
      "Acostáte en el piso, cruzando la pierna derecha sobre la rodilla izquierda flexionada. Entrelazá las manos detrás de la cabeza, comenzando con los omóplatos en el piso. Esta es la posición inicial.",
      "Ejecutá el movimiento flexionando la columna y rotando el torso para llevar el codo izquierdo hacia la rodilla derecha.",
      "Volvé a la posición inicial y repetí las veces indicadas antes de cambiar de lado.",
    ],
    puntosClave: [
      "La rotación viene del torso, no de tirar del cuello.",
    ],
    erroresComunes: [
      "Tirar del cuello con las manos.",
    ],
  },

  "Extended_Range_One-Arm_Kettlebell_Floor_Press": {
    nombre: "Press de piso unilateral con pesa rusa (rango extendido)",
    patron: "Empuje horizontal",
    unilateral: true,
    sinonimos: ["floor press rango extendido", "kettlebell floor press un brazo"],
    instrucciones: [
      "Acostáte en el piso y posicioná una pesa rusa para presionarla con un brazo. La pesa debe sostenerse del mango. La pierna del mismo lado que presionás debe estar flexionada, con la rodilla cruzando la línea media del cuerpo.",
      "Presioná la pesa rusa extendiendo el codo y aduciendo el brazo, llevándola por encima del cuerpo. Volvé a la posición inicial.",
    ],
    puntosClave: [
      "Cruzar la rodilla hacia el centro amplía el rango de movimiento del hombro.",
    ],
    erroresComunes: [
      "Perder el control de la pesa al extender el brazo.",
    ],
  },

  "External_Rotation": {
    nombre: "Rotación externa de hombro con mancuerna",
    patron: "Aislamiento",
    unilateral: true,
    sinonimos: ["rotacion externa hombro", "manguito rotador mancuerna"],
    instrucciones: [
      "Acostáte de costado en un banco plano con un brazo sosteniendo una mancuerna y la otra mano apoyada en el banco, doblada para descansar la cabeza sobre ella.",
      "Flexioná el codo del brazo que sostiene la mancuerna hasta formar un ángulo de 90° entre el brazo superior y el antebrazo. Mantenés el brazo pegado al torso.",
      "Ahora flexioná el codo manteniendo el brazo superior fijo. De esta manera el antebrazo queda paralelo al piso y perpendicular al torso (directamente frente a vos). El brazo superior permanece quieto junto al torso y paralelo al piso. Esta es la posición inicial.",
      "Al exhalar, rotá externamente el antebrazo para que la mancuerna se eleve en un movimiento semicircular, manteniendo el ángulo de 90° entre brazo y antebrazo. Continuá la rotación hasta que el antebrazo quede perpendicular al piso, apuntando al techo. Sostené la contracción un segundo.",
      "Al inhalar, volvé lentamente a la posición inicial.",
      "Repetí las veces indicadas y luego cambiá de brazo.",
    ],
    puntosClave: [
      "El brazo superior permanece fijo y pegado al torso en todo momento.",
    ],
    erroresComunes: [
      "Separar el codo del torso durante la rotación.",
    ],
  },

  "External_Rotation_with_Band": {
    nombre: "Rotación externa de hombro con banda",
    patron: "Aislamiento",
    unilateral: true,
    sinonimos: ["rotacion externa banda", "manguito rotador banda externa"],
    instrucciones: [
      "Anclá la banda alrededor de un poste a la altura del codo. Pararte con el lado izquierdo hacia el poste a un par de pasos de distancia.",
      "Tomá el extremo de la banda con la mano derecha y mantenés el codo apretado contra el costado del cuerpo. Se recomienda sostener una almohadilla o rodillo con el codo para fijarlo en posición.",
      "Con el brazo superior en posición, el codo debe estar flexionado a 90° con la mano cruzando el frente del torso. Esta es la posición inicial.",
      "Ejecutá el movimiento rotando el brazo en un movimiento de revés, manteniendo el codo fijo.",
      "Continuá hasta donde puedas, pausá y volvé a la posición inicial.",
    ],
    puntosClave: [
      "El codo permanece pegado al costado durante toda la rotación.",
    ],
    erroresComunes: [
      "Separar el codo del cuerpo para ganar rango.",
    ],
  },

  "Fast_Skipping": {
    nombre: "Saltos de cuerda rápidos sin cuerda (skipping)",
    patron: "Locomoción / cardio",
    unilateral: false,
    sinonimos: ["fast skipping", "skipping rapido"],
    instrucciones: [
      "Comenzá en posición relajada con una pierna levemente adelantada. Esta es la posición inicial.",
      "Saltá ejecutando un patrón de paso-salto: derecha-derecha-paso a izquierda-izquierda-paso, alternando de un lado al otro.",
      "Realizá los saltos rápidos manteniendo contacto cercano con el piso y reduciendo el tiempo en el aire, moviéndote lo más rápido posible.",
    ],
    puntosClave: [
      "Minimizar el tiempo en el aire mejora la frecuencia y la economía del movimiento.",
    ],
    erroresComunes: [
      "Saltar demasiado alto perdiendo ritmo.",
    ],
  },

  "Flat_Bench_Leg_Pull-In": {
    nombre: "Jalón de piernas en banco plano",
    patron: "Core flexión",
    unilateral: false,
    sinonimos: ["leg pull in banco", "flat bench leg pull in"],
    instrucciones: [
      "Acostáte en una colchoneta o en un banco plano con las piernas fuera del extremo.",
      "Colocá las manos bajo los glúteos con las palmas hacia abajo, o a los costados sosteniéndote del banco (o con las palmas hacia abajo a los costados si usás colchoneta). Extendé las piernas completamente. Esta es la posición inicial.",
      "Doblá las rodillas y llevá los muslos hacia el abdomen mientras exhalás. Continuá el movimiento hasta que las rodillas queden cerca del pecho. Sostené la contracción un segundo.",
      "Al inhalar, volvé lentamente a la posición inicial.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "El banco eleva las caderas y amplía el rango de movimiento abdominal.",
    ],
    erroresComunes: [
      "Usar el impulso de las piernas en lugar del abdomen.",
    ],
  },

  "Flat_Bench_Lying_Leg_Raise": {
    nombre: "Elevación de piernas acostado en banco plano",
    patron: "Core flexión",
    unilateral: false,
    sinonimos: ["lying leg raise banco", "elevacion piernas banco plano"],
    instrucciones: [
      "Acostáte con la espalda plana sobre un banco y las piernas extendidas al frente, fuera del extremo.",
      "Colocá las manos bajo los glúteos con las palmas hacia abajo, o a los costados sosteniéndote del banco. Esta es la posición inicial.",
      "Manteniendo las piernas extendidas, lo más rectas posible con las rodillas levemente flexionadas pero bloqueadas, elevá las piernas hasta formar un ángulo de 90° con el piso. Exhalá durante esta parte y sostené la contracción un segundo en la parte superior.",
      "Al inhalar, bajá lentamente las piernas a la posición inicial.",
    ],
    puntosClave: [
      "Mantener las piernas casi rectas maximiza el trabajo del abdomen inferior.",
    ],
    erroresComunes: [
      "Doblar excesivamente las rodillas para facilitar el movimiento.",
    ],
  },

  "Flexor_Incline_Dumbbell_Curls": {
    nombre: "Curl inclinado con mancuernas (énfasis flexor de muñeca)",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["flexor incline curl", "curl predicador con muñeca atrás"],
    instrucciones: [
      "Sostené la mancuerna inclinada hacia el lado más alejado de tu cuerpo, de manera que haya más peso del lado más cercano a vos. Ahora hacé un curl inclinado normal, pero mantené las muñecas lo más hacia atrás posible para neutralizar el estrés sobre ellas.",
      "Sentáte en un banco inclinado a 45° sosteniendo una mancuerna en cada mano.",
      "Dejá que los brazos cuelguen a los costados, con los codos adentro, y girá las palmas hacia adelante con los pulgares apuntando hacia afuera del cuerpo. Mantenés esta posición de muñeca durante todo el movimiento, sin torcer las manos al subir. Esta es la posición inicial.",
      "Curvá ambas mancuernas al mismo tiempo hasta la contracción completa del bíceps mientras exhalás. No balancees los brazos ni uses impulso; mantenés el movimiento controlado en todo momento. Sostené la contracción un segundo en la parte superior.",
      "Al inhalar, volvé lentamente a la posición inicial.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "Mantener la muñeca hacia atrás durante todo el movimiento reduce el estrés articular.",
    ],
    erroresComunes: [
      "Torcer la muñeca al subir.",
    ],
  },

  "Front_Incline_Dumbbell_Raise": {
    nombre: "Elevación frontal en banco inclinado",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["front incline raise"],
    instrucciones: [
      "Sentáte en un banco inclinado entre 30° y 60° sosteniendo una mancuerna en cada mano. Podés variar el ángulo para trabajar el músculo desde distintos puntos cada vez.",
      "Extendé los brazos al frente con las palmas hacia abajo y las mancuernas unos 2-3 cm por encima de los muslos. Esta es la posición inicial.",
      "Elevá lentamente las mancuernas hacia arriba hasta que queden levemente por encima de los hombros, manteniendo los codos bloqueados. Apretá un segundo en la parte superior y asegurate de exhalar durante esta parte. Mantenés la cabeza apoyada en el banco y las piernas en el piso en todo momento.",
      "Bajá los brazos a la posición inicial mientras inhalás.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "El respaldo evita el balanceo del torso, aislando el deltoide anterior.",
    ],
    erroresComunes: [
      "Despegar la cabeza del banco para ayudar con impulso.",
    ],
  },

  "Front_Leg_Raises": {
    nombre: "Elevación de pierna al frente (movilidad de cadera)",
    patron: "Locomoción / cardio",
    unilateral: true,
    sinonimos: ["leg swings", "balanceo de pierna al frente"],
    instrucciones: [
      "Pararte junto a una silla u otro apoyo, sosteniéndote con una mano.",
      "Balanceá la pierna hacia adelante manteniéndola recta. Continuá con un balanceo hacia abajo, llevando la pierna hacia atrás tanto como tu flexibilidad lo permita. Repetí 5-10 veces y luego cambiá de pierna.",
    ],
    puntosClave: [
      "Ideal como movilidad dinámica de cadera antes de entrenar.",
    ],
    erroresComunes: [
      "Balancear con impulso descontrolado en lugar de un movimiento fluido.",
    ],
  },

  "Front_Two-Dumbbell_Raise": {
    nombre: "Elevación frontal con dos mancuernas",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["front raise mancuernas", "elevacion frontal dos mancuernas"],
    instrucciones: [
      "Tomá un par de mancuernas y pararte con el torso recto, las mancuernas al frente de los muslos a extensión de brazos, con las palmas mirando hacia los muslos. Esta es la posición inicial.",
      "Manteniendo el torso fijo (sin balancearte), elevá las mancuernas hacia adelante con una leve flexión de codo y las palmas siempre mirando hacia abajo. Seguí subiendo hasta que los brazos queden levemente por encima de la horizontal. Exhalá durante esta parte y pausá un segundo en la parte superior.",
      "Al inhalar, bajá las mancuernas lentamente a la posición inicial.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "El torso permanece completamente fijo; el movimiento es solo del hombro.",
    ],
    erroresComunes: [
      "Balancear el torso para ayudar a subir el peso.",
    ],
  },

  "Hammer_Grip_Incline_DB_Bench_Press": {
    nombre: "Press inclinado con mancuernas agarre martillo",
    patron: "Empuje horizontal",
    unilateral: false,
    sinonimos: ["incline hammer press", "press inclinado agarre neutro"],
    instrucciones: [
      "Acostáte en un banco inclinado con una mancuerna en cada mano sobre los muslos. Las palmas se miran entre sí.",
      "Con ayuda de los muslos para subir las mancuernas, levantalas de una a la vez hasta sostenerlas al ancho de hombros.",
      "Una vez al ancho de hombros, mantené las palmas en agarre neutro (enfrentadas). Los codos deben quedar abiertos hacia afuera con los brazos superiores alineados con los hombros (perpendiculares al torso) y flexionados a 90° entre brazo y antebrazo. Esta es la posición inicial.",
      "Bajá las mancuernas lentamente hacia los costados mientras inhalás. Mantenés el control total en todo momento.",
      "Al exhalar, empujá las mancuernas hacia arriba usando los pectorales. Bloqueá los brazos en la posición contraída, sostené un segundo y comenzá a bajar lentamente. El descenso debería llevar al menos el doble de tiempo que el ascenso.",
      "Repetí las veces indicadas.",
      "Al terminar, apoyá las mancuernas sobre los muslos y luego en el piso. Esta es la forma más segura de soltarlas.",
    ],
    puntosClave: [
      "El agarre neutro (martillo) reduce el estrés en el hombro comparado con el agarre pronado.",
    ],
    erroresComunes: [
      "Soltar las mancuernas desde arriba al terminar la serie.",
    ],
  },

  "Hip_Flexion_with_Band": {
    nombre: "Flexión de cadera con banda",
    patron: "Aislamiento",
    unilateral: true,
    sinonimos: ["hip flexion banda", "elevacion rodilla con banda"],
    instrucciones: [
      "Asegurá un extremo de la banda en la parte baja de un poste y el otro extremo en un tobillo.",
      "Pararte de espaldas al punto de anclaje de la banda.",
      "Manteniendo la cabeza y el pecho arriba, elevá la rodilla hasta 90° y pausá.",
      "Volvé la pierna a la posición inicial.",
    ],
    puntosClave: [
      "Trabaja el flexor de cadera contra resistencia progresiva de la banda.",
    ],
    erroresComunes: [
      "Inclinar el torso hacia adelante para compensar.",
    ],
  },

  "Hip_Lift_with_Band": {
    nombre: "Elevación de cadera con banda",
    patron: "Dominante de cadera",
    unilateral: false,
    sinonimos: ["hip lift banda", "puente de glúteo con banda"],
    instrucciones: [
      "Después de elegir una banda adecuada, acostáte en el medio del rack habiendo asegurado la banda a ambos lados. Si tu rack no tiene clavijas, la banda puede asegurarse con mancuernas pesadas u objetos similares, asegurándote de que no se muevan.",
      "Ajustá tu posición de modo que la banda quede directamente sobre las caderas. Flexioná las rodillas y apoyá los pies planos en el piso. Las manos pueden estar en el piso o sosteniendo la banda en posición.",
      "Manteniendo los hombros en el piso, empujá con los talones para elevar las caderas, presionando contra la banda lo más alto posible.",
      "Pausá en la parte superior del movimiento y volvé a la posición inicial.",
    ],
    puntosClave: [
      "La banda agrega resistencia adicional en el punto de máxima contracción del glúteo.",
    ],
    erroresComunes: [
      "Empujar con la espalda baja en lugar de los talones y glúteos.",
    ],
  },

  "Inchworm": {
    nombre: "Inchworm (gusano)",
    patron: "Core anti-extensión",
    unilateral: false,
    sinonimos: ["inchworm", "caminata de gusano"],
    instrucciones: [
      "Pararte con los pies juntos. Manteniendo las piernas rectas, estirate hacia abajo y apoyá las manos en el piso directamente frente a vos. Esta es la posición inicial.",
      "Comenzá caminando las manos hacia adelante lentamente, alternando izquierda y derecha. Al hacerlo, flexioná solo desde la cadera, manteniendo las piernas rectas.",
      "Continuá hasta que el cuerpo quede paralelo al piso en posición de flexión de brazos (plancha alta).",
      "Ahora, mantené las manos fijas y dá pasos cortos con los pies, avanzando solo unos centímetros a la vez.",
      "Seguí caminando hasta que los pies queden cerca de las manos, manteniendo las piernas rectas durante todo el movimiento.",
    ],
    puntosClave: [
      "Las piernas se mantienen rectas durante toda la secuencia para maximizar el estiramiento de isquiotibiales.",
    ],
    erroresComunes: [
      "Flexionar las rodillas para facilitar el avance.",
    ],
  },

  "Incline_Dumbbell_Bench_With_Palms_Facing_In": {
    nombre: "Press inclinado con mancuernas (palmas enfrentadas)",
    patron: "Empuje horizontal",
    unilateral: false,
    sinonimos: ["incline press palmas adentro", "incline neutral grip press"],
    instrucciones: [
      "Acostáte en un banco inclinado con una mancuerna en cada mano sobre los muslos. Las palmas se miran entre sí.",
      "Con ayuda de los muslos para subir las mancuernas, levantalas de una a la vez hasta sostenerlas al ancho de hombros.",
      "Una vez al ancho de hombros, mantené las palmas en agarre neutro (enfrentadas). Los codos deben quedar abiertos hacia afuera con los brazos superiores alineados con los hombros (perpendiculares al torso) y flexionados a 90° entre brazo y antebrazo. Esta es la posición inicial.",
      "Bajá las mancuernas lentamente hacia los costados mientras inhalás. Mantenés el control total en todo momento.",
      "Al exhalar, empujá las mancuernas hacia arriba usando los pectorales. Bloqueá los brazos en la posición contraída, sostené un segundo y comenzá a bajar lentamente. El descenso debería llevar al menos el doble de tiempo que el ascenso.",
      "Repetí las veces indicadas.",
      "Al terminar, apoyá las mancuernas sobre los muslos y luego en el piso. Esta es la forma más segura de soltarlas.",
    ],
    puntosClave: [
      "El agarre neutro reduce la tensión en el hombro comparado con el agarre pronado clásico.",
    ],
    erroresComunes: [
      "Dejar caer las mancuernas en lugar de apoyarlas con control al terminar.",
    ],
  },

  "Incline_Dumbbell_Curl": {
    nombre: "Curl de bíceps en banco inclinado",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["incline dumbbell curl"],
    instrucciones: [
      "Sentáte en un banco inclinado con una mancuerna en cada mano a extensión de brazos. Mantenés los codos cerca del torso y rotá las palmas hacia adelante. Esta es la posición inicial.",
      "Manteniendo el brazo superior fijo, curvá los pesos hacia adelante contrayendo el bíceps mientras exhalás. Solo se mueven los antebrazos. Continuá hasta la contracción completa del bíceps con las mancuernas a la altura del hombro. Sostené un segundo en la contracción.",
      "Volvé lentamente las mancuernas a la posición inicial mientras inhalás.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "La inclinación del banco aumenta el estiramiento del bíceps en la posición baja.",
    ],
    erroresComunes: [
      "Mover el hombro hacia adelante al subir.",
    ],
  },

  "Incline_Dumbbell_Flyes": {
    nombre: "Aperturas en banco inclinado con mancuernas",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["incline flyes", "aperturas inclinadas"],
    instrucciones: [
      "Sostené una mancuerna en cada mano y acostáte en un banco inclinado a no más de 30°.",
      "Extendé los brazos por encima de vos con una leve flexión en los codos.",
      "Rotá las muñecas de modo que las palmas queden mirándote. Los dedos meñiques deben quedar uno junto al otro. Esta es la posición inicial.",
      "Al inhalar, comenzá a bajar los brazos lentamente hacia los costados manteniéndolos extendidos, rotando las muñecas hasta que las palmas queden enfrentadas. Al final del movimiento los brazos quedan a los costados con las palmas hacia el techo.",
      "Al exhalar, comenzá a subir las mancuernas a la posición inicial revirtiendo el movimiento y rotando las manos para que los meñiques vuelvan a quedar juntos. El movimiento ocurre solo en la articulación del hombro y la muñeca; no hay movimiento en el codo.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "El movimiento ocurre solo en hombro y muñeca; el codo no se flexiona ni extiende.",
    ],
    erroresComunes: [
      "Flexionar los codos al bajar, convirtiéndolo en un press.",
    ],
  },

  "Incline_Dumbbell_Flyes_-_With_A_Twist": {
    nombre: "Aperturas en banco inclinado con giro de muñeca",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["incline flyes con giro", "flyes con torsion"],
    instrucciones: [
      "Sostené una mancuerna en cada mano y acostáte en un banco inclinado a no más de 30°.",
      "Extendé los brazos por encima de vos con una leve flexión en los codos.",
      "Rotá las muñecas de modo que las palmas queden mirándote. Los dedos meñiques deben quedar uno junto al otro. Esta es la posición inicial.",
      "Al inhalar, comenzá a bajar los brazos lentamente hacia los costados manteniéndolos extendidos, rotando las muñecas hasta que las palmas queden enfrentadas. Al final del movimiento los brazos quedan a los costados con las palmas hacia el techo.",
      "Al exhalar, comenzá a subir las mancuernas a la posición inicial revirtiendo el movimiento y rotando las manos para que los meñiques vuelvan a quedar juntos. El movimiento ocurre solo en la articulación del hombro y la muñeca; no hay movimiento en el codo.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "El giro de muñeca al final del recorrido aumenta la contracción del pectoral interno.",
    ],
    erroresComunes: [
      "Flexionar los codos al bajar, convirtiéndolo en un press.",
    ],
  },

  "Incline_Dumbbell_Press": {
    nombre: "Press inclinado con mancuernas",
    patron: "Empuje horizontal",
    unilateral: false,
    sinonimos: ["incline dumbbell press", "press de pecho inclinado"],
    instrucciones: [
      "Acostáte en un banco inclinado con una mancuerna en cada mano sobre los muslos. Las palmas se miran entre sí.",
      "Usando los muslos para ayudar a impulsar las mancuernas, levantalas de una a la vez hasta sostenerlas al ancho de hombros.",
      "Una vez que las mancuernas estén al ancho de hombros, rotá las muñecas hacia adelante para que las palmas queden mirando hacia afuera. Esta es la posición inicial.",
      "Asegurate de mantener el control total de las mancuernas en todo momento. Luego exhalá y empujá las mancuernas hacia arriba usando el pecho.",
      "Bloqueá los brazos en la parte superior, sostené un segundo y comenzá a bajar el peso lentamente. Idealmente, bajar el peso debería llevar el doble de tiempo que subirlo.",
      "Repetí el movimiento las veces indicadas.",
      "Al terminar, apoyá las mancuernas sobre los muslos y luego en el piso. Esta es la forma más segura de soltarlas.",
    ],
    puntosClave: [
      "El descenso controlado (el doble de tiempo que la subida) maximiza la tensión muscular.",
    ],
    erroresComunes: [
      "Dejar caer las mancuernas con fuerza al finalizar.",
    ],
  },

  "Incline_Hammer_Curls": {
    nombre: "Curl de martillo en banco inclinado",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["incline hammer curl"],
    instrucciones: [
      "Sentáte en un banco inclinado con una mancuerna en cada mano. Apoyate firmemente contra el respaldo con los pies juntos. Dejá que las mancuernas cuelguen rectas a los costados, sosteniéndolas con agarre neutro. Esta es la posición inicial.",
      "Iniciá el movimiento flexionando el codo, intentando mantener el brazo superior fijo.",
      "Continuá hasta la parte superior del movimiento, pausá y volvé lentamente a la posición inicial.",
    ],
    puntosClave: [
      "El respaldo inclinado elimina el balanceo, aislando bíceps y braquial.",
    ],
    erroresComunes: [
      "Despegar los hombros del respaldo para ganar impulso.",
    ],
  },

  "Incline_Inner_Biceps_Curl": {
    nombre: "Curl de bíceps interno en banco inclinado",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["inner biceps curl", "curl biceps doble pose"],
    instrucciones: [
      "Sostené una mancuerna en cada mano y acostáte en un banco inclinado.",
      "Las mancuernas deben quedar a extensión de brazos colgando a los costados con las palmas hacia afuera. Esta es la posición inicial.",
      "Al exhalar, curvá el peso hacia afuera y hacia arriba manteniendo los antebrazos alineados con los deltoides laterales. Continuá el curl hasta que las mancuernas queden a la altura del hombro y a los costados de los deltoides. El final del movimiento debe parecerse a una pose de doble bíceps.",
      "Después de un segundo de contracción en la parte superior, comenzá a inhalar y bajá lentamente los pesos a la posición inicial usando el mismo camino con el que subieron.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "El recorrido hacia afuera (no al frente) enfatiza el bíceps desde un ángulo distinto.",
    ],
    erroresComunes: [
      "Llevar las mancuernas al frente en lugar de hacia afuera.",
    ],
  },

  "Incline_Push-Up_Medium": {
    nombre: "Flexión inclinada con agarre medio",
    patron: "Empuje horizontal",
    unilateral: false,
    sinonimos: ["incline push up medio", "flexion inclinada estandar"],
    instrucciones: [
      "Pararte frente a una barra de Smith o una plataforma elevada estable a la altura adecuada.",
      "Colocá las manos en la barra, separadas al ancho de hombros.",
      "Alejá los pies de la barra con los brazos y el cuerpo rectos. Esta es la posición inicial.",
      "Manteniendo el cuerpo recto, bajá el pecho hacia la barra flexionando los codos.",
      "Volvé a la posición inicial extendiendo los codos y empujándote hacia arriba.",
    ],
    puntosClave: [
      "Cuanto más baja la plataforma, mayor la dificultad del ejercicio.",
    ],
    erroresComunes: [
      "Dejar caer las caderas durante el movimiento.",
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
console.log(`✅ Lote 7 aplicado — ${nuevasAgregadas} entradas nuevas agregadas.`);
