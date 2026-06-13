/**
 * Lote 6 — 30 NUEVAS traducciones (beginner + equipo hogareño, tanda 2).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const FILE = resolve("scripts/data/traducciones-fedb.es.json");
const t = JSON.parse(readFileSync(FILE, "utf8"));

const nuevos: Record<string, object> = {

  "Incline_Push-Up_Reverse_Grip": {
    nombre: "Flexión inclinada con agarre invertido",
    patron: "Empuje horizontal",
    unilateral: false,
    sinonimos: ["push up invertido", "flexion inclinada agarre supino"],
    instrucciones: [
      "Pararte frente a una barra de Smith o una plataforma elevada estable a la altura adecuada.",
      "Colocá las manos en la barra con las palmas hacia arriba, separadas al ancho de hombros.",
      "Alejá los pies de la barra con los brazos y el cuerpo rectos. Esta es la posición inicial.",
      "Manteniendo el cuerpo recto, bajá el pecho hacia la barra flexionando los codos.",
      "Volvé a la posición inicial extendiendo los codos y empujándote hacia arriba.",
    ],
    puntosClave: [
      "El agarre invertido activa más el bíceps y la parte superior del pecho.",
    ],
    erroresComunes: [
      "Dejar caer las caderas.",
    ],
  },

  "Incline_Push-Up_Wide": {
    nombre: "Flexión inclinada con manos anchas",
    patron: "Empuje horizontal",
    unilateral: false,
    sinonimos: ["push up inclinado ancho"],
    instrucciones: [
      "Pararte frente a una barra de Smith o una plataforma elevada estable a la altura adecuada.",
      "Colocá las manos en la barra más anchas que el ancho de hombros.",
      "Alejá los pies de la barra con los brazos y el cuerpo rectos. Los brazos deben quedar perpendiculares al torso. Esta es la posición inicial.",
      "Manteniendo el cuerpo recto, bajá el pecho hacia la barra flexionando los codos.",
      "Volvé a la posición inicial extendiendo los codos y empujándote hacia arriba.",
    ],
    puntosClave: [
      "El agarre ancho enfatiza la parte exterior del pecho.",
    ],
    erroresComunes: [
      "Dejar que las caderas suban o bajen.",
    ],
  },

  "Internal_Rotation_with_Band": {
    nombre: "Rotación interna de hombro con banda",
    patron: "Aislamiento",
    unilateral: true,
    sinonimos: ["rotacion interna banda", "manguito rotador banda"],
    instrucciones: [
      "Anclá la banda alrededor de un poste a la altura del codo. Pararte con el lado derecho hacia el poste a un par de pasos de distancia.",
      "Tomá el extremo de la banda con la mano derecha y mantenés el codo apretado contra el costado del cuerpo. Se recomienda sostener una almohadilla o rodillo con el codo para fijarlo en posición.",
      "Con el brazo superior fijo, el codo debe estar flexionado a 90° con la mano apuntando hacia afuera del torso. Esta es la posición inicial.",
      "Ejecutá el movimiento rotando el antebrazo hacia adentro (como un golpe de derecha), manteniendo el codo fijo.",
      "Continuá hasta donde puedas, pausá y volvé a la posición inicial.",
    ],
    puntosClave: [
      "Solo el antebrazo rota; el codo permanece pegado al costado.",
    ],
    erroresComunes: [
      "Separar el codo del cuerpo durante la rotación.",
    ],
  },

  "Isometric_Chest_Squeezes": {
    nombre: "Contracción isométrica de pecho",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["isometrico pecho", "chest squeeze"],
    instrucciones: [
      "De pie o sentado, doblá los brazos a 90° y juntá las palmas frente al pecho. Las manos deben estar abiertas con las palmas juntas y los dedos apuntando hacia adelante (perpendiculares al torso).",
      "Presioná ambas manos una contra la otra mientras contraés el pecho. Comenzá con tensión suave e incrementá lentamente. Seguí respirando con normalidad durante la contracción.",
      "Sostené durante los segundos indicados.",
      "Liberá la tensión lentamente.",
      "Descansá el tiempo indicado y repetí.",
    ],
    puntosClave: [
      "No contengas la respiración durante la contracción isométrica.",
    ],
    erroresComunes: [
      "Subir los hombros al presionar.",
    ],
  },

  "Isometric_Neck_Exercise_-_Front_And_Back": {
    nombre: "Ejercicio isométrico de cuello (frente y nuca)",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["isometrico cuello", "neck isometric"],
    instrucciones: [
      "Con la cabeza y el cuello en posición neutra (erguida, mirando al frente), colocá ambas manos en la parte frontal de la cabeza.",
      "Empujá suavemente hacia adelante contrayendo los músculos del cuello sin dejar que la cabeza se mueva. Comenzá con tensión suave e incrementá lentamente. Seguí respirando con normalidad.",
      "Sostené durante los segundos indicados.",
      "Liberá la tensión lentamente.",
      "Descansá el tiempo indicado y repetí con las manos en la parte posterior de la cabeza.",
    ],
    puntosClave: [
      "El objetivo es no mover la cabeza; la resistencia es isométrica.",
    ],
    erroresComunes: [
      "Contenerse la respiración.",
      "Aplicar demasiada fuerza de golpe.",
    ],
  },

  "Isometric_Wipers": {
    nombre: "Limpiaparabrisas isométrico (push-up lateral)",
    patron: "Core anti-extensión",
    unilateral: false,
    sinonimos: ["wipers isometrico", "push up lateral"],
    instrucciones: [
      "Adoptá posición de plancha alta con el peso sobre manos y pies, cuerpo recto. Las manos deben estar ligeramente más anchas que el ancho de hombros. Esta es la posición inicial.",
      "Comenzá desplazando el peso del cuerpo lo más posible hacia un lado, dejando que el codo de ese lado se flexione mientras bajás el cuerpo.",
      "Revertí el movimiento extendiendo ese brazo, empujándote hacia arriba y luego cayendo hacia el otro lado.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "El cuerpo permanece recto; el movimiento lateral viene de los hombros.",
    ],
    erroresComunes: [
      "Dejar que las caderas roten.",
    ],
  },

  "Jackknife_Sit-Up": {
    nombre: "Sit-up navaja",
    patron: "Core flexión",
    unilateral: false,
    sinonimos: ["jackknife sit up", "abdominal navaja"],
    instrucciones: [
      "Acostáte boca arriba en el piso o colchoneta con los brazos extendidos detrás de la cabeza y las piernas también extendidas. Esta es la posición inicial.",
      "Al exhalar, doblate por la cintura elevando simultáneamente las piernas y los brazos hasta encontrarse en posición de navaja. Las piernas deben estar extendidas y elevadas unos 35–45° del piso, y los brazos extendidos paralelos a las piernas. El torso superior queda despegado del piso.",
      "Al inhalar, bajá los brazos y las piernas a la posición inicial.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "Las piernas y los brazos se elevan al mismo tiempo formando una 'V'.",
    ],
    erroresComunes: [
      "Doblar las rodillas al subir.",
    ],
  },

  "Janda_Sit-Up": {
    nombre: "Sit-up Janda",
    patron: "Core flexión",
    unilateral: false,
    sinonimos: ["janda sit up"],
    instrucciones: [
      "Posicionáte en el piso en la posición básica de sit-up: rodillas a 90° con los pies planos en el suelo y brazos cruzados sobre el pecho o a los costados. Esta es la posición inicial.",
      "Apretá fuerte los glúteos y los isquiotibiales mientras inhalás. En una subida lenta (3–6 segundos) exhalá lentamente. Es importante apretar los glúteos e isquiotibiales porque eso desactiva los flexores de cadera por inhibición recíproca, haciendo que los músculos abdominales trabajen más.",
      "Al inhalar, volvé lentamente a la posición inicial de manera controlada.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "Apretar glúteos e isquios al subir desconecta los flexores de cadera y maximiza el trabajo abdominal.",
    ],
    erroresComunes: [
      "Subir con impulso.",
      "No apretar los glúteos.",
    ],
  },

  "Kettlebell_Pirate_Ships": {
    nombre: "Barcos piratas con pesa rusa",
    patron: "Core rotación",
    unilateral: false,
    sinonimos: ["pirate ships kettlebell", "rotacion lateral pesa rusa"],
    instrucciones: [
      "Con una postura amplia, tomá una pesa rusa con ambas manos. Dejála colgar a la altura de la cadera con los brazos extendidos. Esta es la posición inicial.",
      "Iniciá el movimiento girando hacia un lado y balanceando la pesa rusa hasta la altura de la cabeza. Pausá brevemente en la parte superior.",
      "Dejá caer la pesa mientras rotás hacia el lado opuesto, elevándola nuevamente hasta la altura de la cabeza.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "El movimiento combina rotación de torso con swing de pesa rusa.",
    ],
    erroresComunes: [
      "Usar los brazos en lugar del torso para impulsar.",
    ],
  },

  "Knee_Circles": {
    nombre: "Círculos de rodilla",
    patron: "Locomoción / cardio",
    unilateral: false,
    sinonimos: ["knee circles", "movilidad rodilla"],
    instrucciones: [
      "Pararte con las piernas juntas y las manos a la cintura.",
      "Mové las rodillas en un movimiento circular mientras respirás con normalidad.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "Ideal como calentamiento articular.",
    ],
    erroresComunes: [
      "Hacer círculos muy amplios perdiendo el equilibrio.",
    ],
  },

  "Lateral_Bound": {
    nombre: "Salto lateral (bound)",
    patron: "Locomoción / cardio",
    unilateral: false,
    sinonimos: ["lateral bound", "salto lateral pliometrico"],
    instrucciones: [
      "Adoptá una posición de media sentadilla mirando 90° respecto a la dirección de desplazamiento. Esta es la posición inicial.",
      "Dejá que la pierna delantera haga un pequeño contramovimiento hacia adentro mientras desplazás el peso a la pierna exterior.",
      "Empujá inmediatamente y extendé la pierna de apoyo, intentando saltar lo más posible hacia el lateral.",
      "Al aterrizar, empujá inmediatamente en dirección contraria para volver al punto de partida.",
      "Continuá alternando de lado a lado por las repeticiones indicadas.",
    ],
    puntosClave: [
      "Aterrizá suavemente sobre la parte media del pie amortiguando con la rodilla.",
    ],
    erroresComunes: [
      "Aterrizar con la rodilla en valgo.",
    ],
  },

  "Lateral_Raise_-_With_Bands": {
    nombre: "Elevación lateral con banda",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["lateral raise banda", "elevacion hombro banda"],
    instrucciones: [
      "Pararte sobre la banda elástica de modo que la tensión comience con los brazos extendidos. Tomá las manijas con agarre pronado (palmas hacia los muslos) ligeramente por dentro del ancho de hombros. Las manijas descansan a los costados de los muslos. Los brazos extendidos con una leve flexión de codo y la espalda recta. Esta es la posición inicial.",
      "Usá los deltoides laterales para elevar las manijas hacia los costados mientras exhalás. Seguí subiendo hasta que queden levemente por encima de la horizontal. Al subir, incliná levemente la mano como si vertierás agua; mantenés los brazos extendidos. Mantenés el torso fijo y pausá un segundo en la parte superior.",
      "Bajá las manijas lentamente a la posición inicial mientras inhalás.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "La inclinación de la muñeca ('verter agua') activa mejor el deltoide medial.",
    ],
    erroresComunes: [
      "Usar el impulso del torso.",
      "Subir los hombros hacia las orejas.",
    ],
  },

  "Leg_Lift": {
    nombre: "Curl de pierna de pie",
    patron: "Aislamiento",
    unilateral: true,
    sinonimos: ["leg lift de pie", "curl femoral de pie"],
    instrucciones: [
      "De pie con ambos pies juntos al ancho de hombros aproximadamente, tomá una superficie firme como los laterales de un rack o el respaldo de una silla para equilibrarte.",
      "Con o sin tobillera de peso, levantá una pierna hacia atrás como si hicieras un curl femoral pero de pie, manteniendo la otra pierna recta. Exhalá al realizar este movimiento.",
      "Bajá lentamente la pierna al piso mientras inhalás.",
      "Repetí las veces indicadas.",
      "Repetí el movimiento con la pierna contraria.",
    ],
    puntosClave: [
      "Mantenés el torso erguido durante todo el movimiento.",
    ],
    erroresComunes: [
      "Inclinar el torso hacia adelante al subir la pierna.",
    ],
  },

  "Leg_Pull-In": {
    nombre: "Jalón de piernas (leg pull-in)",
    patron: "Core flexión",
    unilateral: false,
    sinonimos: ["leg pull in", "encogimiento de piernas"],
    instrucciones: [
      "Acostáte en una colchoneta con las piernas extendidas y las manos con las palmas hacia abajo a los costados o bajo los glúteos. Esta es la posición inicial.",
      "Doblá las rodillas y llevá los muslos hacia el abdomen mientras exhalás. Continuá hasta que las rodillas queden a nivel del pecho. Contraé el abdomen durante el movimiento y sostené un segundo en la parte superior. Las piernas (pantorrillas) deben permanecer siempre paralelas al piso.",
      "Volvé a la posición inicial mientras inhalás.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "Las pantorrillas paralelas al piso activan más el abdomen inferior.",
    ],
    erroresComunes: [
      "Usar el impulso de las piernas.",
    ],
  },

  "Lower_Back_Curl": {
    nombre: "Extensión de espalda baja (superman)",
    patron: "Dominante de cadera",
    unilateral: false,
    sinonimos: ["superman", "extension lumbar"],
    instrucciones: [
      "Acostáte boca abajo con los brazos a los costados. Esta es la posición inicial.",
      "Usando los músculos de la espalda baja, extendé la columna levantando el pecho del piso. No uses los brazos para empujarte. Mantená la cabeza levantada durante el movimiento. Repetí de 10 a 20 veces.",
    ],
    puntosClave: [
      "No uses los brazos; el movimiento proviene solo de la musculatura lumbar.",
    ],
    erroresComunes: [
      "Empujar con las manos.",
      "Subir demasiado generando compresión lumbar.",
    ],
  },

  "Lying_Supine_Dumbbell_Curl": {
    nombre: "Curl de bíceps supino con mancuernas",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["curl supino acostado", "lying dumbbell curl"],
    instrucciones: [
      "Acostáte boca arriba en un banco plano con una mancuerna en cada mano sobre los muslos.",
      "Llevá las mancuernas a los costados con los brazos extendidos y las palmas hacia los muslos (agarre neutro).",
      "Manteniendo los brazos cerca del torso y los codos adentro, bajá los brazos lentamente (con una leve flexión de codo) lo más que puedas hacia el piso. Una vez que no puedas bajar más, fijá los brazos superiores en esa posición. Esta es la posición inicial.",
      "Al exhalar, comenzá a curvar lentamente las mancuernas hacia arriba mientras simultáneamente rotás las muñecas con las palmas hacia arriba. Continuá hasta la contracción completa del bíceps y apretá fuerte un segundo en la parte superior. Solo se mueven los antebrazos; los brazos superiores permanecen quietos y los codos fijos.",
      "Volvé muy lentamente a la posición inicial.",
    ],
    puntosClave: [
      "El rango de movimiento ampliado por el banco estira más el bíceps.",
    ],
    erroresComunes: [
      "Mover los codos al subir.",
    ],
  },

  "Monster_Walk": {
    nombre: "Monster walk con banda",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["monster walk", "caminata monster"],
    instrucciones: [
      "Colocá una banda alrededor de ambos tobillos y otra alrededor de ambas rodillas. Debe haber suficiente tensión para que ambas bandas estén firmes con los pies al ancho de hombros.",
      "Comenzá dando pasos cortos hacia adelante alternando pie izquierdo y pie derecho.",
      "Después de varios pasos, hacé lo mismo pero caminando hacia atrás hasta el punto de partida.",
    ],
    puntosClave: [
      "Mantenés la postura semiflexionada durante toda la caminata.",
    ],
    erroresComunes: [
      "Dejar que los pies se junten eliminando la tensión de la banda.",
    ],
  },

  "Oblique_Crunches_-_On_The_Floor": {
    nombre: "Crunch oblicuo en el piso",
    patron: "Core rotación",
    unilateral: true,
    sinonimos: ["crunch oblicuo lateral", "side crunch"],
    instrucciones: [
      "Comenzá acostado sobre el lado derecho con las piernas superpuestas. Las rodillas deben estar ligeramente flexionadas.",
      "Colocá la mano izquierda detrás de la cabeza.",
      "En esta posición, comenzá a elevar el codo izquierdo hacia arriba como si hicieras un crunch normal, pero con énfasis en los oblicuos.",
      "Subí todo lo que puedas, sostené la contracción un segundo y luego bajá lentamente a la posición inicial.",
      "Recordá inhalar durante la fase excéntrica (bajada) y exhalar durante la fase concéntrica (subida).",
    ],
    puntosClave: [
      "Mantené las caderas fijas en el piso para aislar el oblicuo.",
    ],
    erroresComunes: [
      "Rodar el torso en lugar de flexionarlo lateralmente.",
    ],
  },

  "One-Arm_Flat_Bench_Dumbbell_Flye": {
    nombre: "Apertura unilateral en banco plano",
    patron: "Aislamiento",
    unilateral: true,
    sinonimos: ["apertura unilateral banco", "dumbbell flye un brazo"],
    instrucciones: [
      "Acostáte en un banco plano con una mancuerna en una mano descansando sobre el muslo. La palma debe estar en agarre neutro.",
      "Con ayuda del muslo, subí la mancuerna frente a vos con el brazo completamente extendido. Mantenés el agarre neutro. La mano que no trabaja debe sostenerse del banco para mayor estabilidad. Esta es la posición inicial.",
      "El brazo con la mancuerna debe tener una leve flexión en el codo para proteger el tendón del bíceps. Bajá el brazo en un arco amplio hacia el costado hasta sentir el estiramiento en el pecho. Inhalá durante esta fase. Solo se mueve el hombro; el ángulo del codo permanece constante.",
      "Volvé el brazo a la posición inicial usando el mismo arco mientras contraés los pectorales y exhalás.",
      "Sostené un segundo en la posición contraída y repetí las veces indicadas.",
      "Cambiá de brazo y repetí.",
    ],
    puntosClave: [
      "El arco es el mismo tanto al bajar como al subir.",
    ],
    erroresComunes: [
      "Extender el codo al volver (convertirlo en press).",
    ],
  },

  "One-Arm_Incline_Lateral_Raise": {
    nombre: "Elevación lateral unilateral en banco inclinado",
    patron: "Aislamiento",
    unilateral: true,
    sinonimos: ["elevacion lateral inclinado unilateral"],
    instrucciones: [
      "Acostáte de lado en un banco inclinado con una mancuerna en la mano superior. El hombro debe presionar contra el banco y el brazo inferior descansa cruzado sobre el cuerpo con la palma cerca del ombligo.",
      "Sostené la mancuerna con el brazo superior extendido al frente paralelo al piso. Esta es la posición inicial.",
      "Manteniendo la mancuerna siempre paralela al piso, realizá una elevación lateral: el brazo viaja directamente hacia arriba hasta apuntar al techo. Exhalá durante este movimiento. Sostené un segundo apretando el deltoide.",
      "Al inhalar, bajá el peso cruzando el cuerpo de vuelta a la posición inicial.",
      "Repetí las veces indicadas.",
      "Cambiá de brazo y repetí.",
    ],
    puntosClave: [
      "La posición inclinada estira más el deltoide en el inicio.",
    ],
    erroresComunes: [
      "No mantener la mancuerna paralela al piso durante el movimiento.",
    ],
  },

  "One-Arm_Side_Laterals": {
    nombre: "Elevación lateral unilateral con mancuerna",
    patron: "Aislamiento",
    unilateral: true,
    sinonimos: ["elevacion lateral un brazo", "lateral raise unilateral"],
    instrucciones: [
      "Tomá una mancuerna en una mano. Con la mano libre, agarráte de algo firme como un banco inclinado. Inclinarte levemente hacia el lado del brazo que trabaja para mantener el equilibrio.",
      "Pararte con el torso recto y la mancuerna al costado a extensión de brazo, con la palma mirando hacia vos. Esta es la posición inicial.",
      "Manteniendo el torso quieto, elevá la mancuerna hacia el costado con una leve flexión de codo y la mano levemente inclinada hacia adelante como si vertierás agua. Seguí hasta que el brazo quede paralelo al piso. Exhalá y pausá un segundo en la parte superior.",
      "Bajá la mancuerna lentamente a la posición inicial mientras inhalás.",
      "Repetí las veces indicadas.",
      "Cambiá de brazo y repetí.",
    ],
    puntosClave: [
      "El apoyo con la mano libre permite concentrarse mejor en el deltoide.",
    ],
    erroresComunes: [
      "Inclinarse demasiado usando el impulso del torso.",
    ],
  },

  "One_Arm_Dumbbell_Bench_Press": {
    nombre: "Press de banca unilateral con mancuerna",
    patron: "Empuje horizontal",
    unilateral: true,
    sinonimos: ["press banca un brazo", "one arm bench press"],
    instrucciones: [
      "Acostáte en un banco plano con una mancuerna en una mano sobre el muslo.",
      "Con ayuda del muslo, subí la mancuerna al frente al ancho de hombros. Usá la mano libre para ayudar a posicionarla correctamente.",
      "Una vez en posición, rotá la muñeca para que la palma quede mirando hacia afuera. Esta es la posición inicial.",
      "Bajá la mancuerna lentamente hacia el costado mientras inhalás. Mantenés el control total en todo momento. Podés usar la mano libre para asistir el equilibrio si es necesario; de lo contrario, dejala descansando al costado.",
      "Al exhalar, empujá la mancuerna hacia arriba usando los pectorales. Extendé el codo, apretá el pecho, sostené un segundo y comenzá a bajar. El descenso debería llevar al menos el doble de tiempo que el ascenso.",
      "Repetí las veces indicadas.",
      "Cambiá de brazo y repetí.",
    ],
    puntosClave: [
      "El press unilateral desafía el núcleo por la asimetría de carga.",
    ],
    erroresComunes: [
      "Dejar que el torso rote hacia la mancuerna.",
    ],
  },

  "One_Arm_Dumbbell_Preacher_Curl": {
    nombre: "Curl predicador unilateral con mancuerna",
    patron: "Aislamiento",
    unilateral: true,
    sinonimos: ["preacher curl un brazo", "curl predicador unilateral"],
    instrucciones: [
      "Tomá una mancuerna con la mano derecha y colocá el brazo superior sobre el banco predicador o banco inclinado. La mancuerna debe estar a la altura del hombro. Esta es la posición inicial.",
      "Al inhalar, bajá lentamente la mancuerna hasta que el brazo esté completamente extendido y el bíceps en estiramiento total.",
      "Al exhalar, usá el bíceps para curvar el peso hacia arriba hasta la contracción completa y la mancuerna a la altura del hombro. Para asegurar la contracción completa, el dedo meñique debe quedar más alto que el pulgar.",
      "Apretá fuerte el bíceps un segundo en la posición contraída y repetí las veces indicadas.",
      "Cambiá de brazo y repetí.",
    ],
    puntosClave: [
      "El banco predicador elimina el impulso del hombro.",
    ],
    erroresComunes: [
      "Subir el codo del banco para ayudar.",
    ],
  },

  "One_Arm_Pronated_Dumbbell_Triceps_Extension": {
    nombre: "Extensión de tríceps unilateral con agarre pronado",
    patron: "Aislamiento",
    unilateral: true,
    sinonimos: ["extensión triceps pronado unilateral"],
    instrucciones: [
      "Acostáte en un banco con una mancuerna a extensión de brazo. El brazo debe quedar perpendicular al cuerpo. La palma mira hacia los pies (agarre pronado).",
      "Colocá la mano que no trabaja sobre el bíceps para mayor soporte.",
      "Bajá lentamente la mancuerna mientras inhalás.",
      "Levantá la mancuerna hacia arriba contrayendo el tríceps. Exhalá durante la fase concéntrica.",
      "Repetí las veces indicadas.",
      "Cambiá de brazo y repetí.",
    ],
    puntosClave: [
      "El agarre pronado crea una posición única de tensión para el tríceps.",
    ],
    erroresComunes: [
      "Mover el hombro al bajar.",
    ],
  },

  "One_Arm_Supinated_Dumbbell_Triceps_Extension": {
    nombre: "Extensión de tríceps unilateral con agarre supino",
    patron: "Aislamiento",
    unilateral: true,
    sinonimos: ["extensión triceps supinado unilateral"],
    instrucciones: [
      "Acostáte en un banco con una mancuerna a extensión de brazo. El brazo debe quedar perpendicular al cuerpo. La palma mira hacia la cara (agarre supino).",
      "Colocá la mano que no trabaja sobre el bíceps para mayor soporte.",
      "Bajá lentamente la mancuerna mientras inhalás.",
      "Levantá la mancuerna hacia arriba contrayendo el tríceps. Exhalá durante la fase concéntrica.",
      "Repetí las veces indicadas.",
      "Cambiá de brazo y repetí.",
      "Cambiá de brazo nuevamente y repetí.",
    ],
    puntosClave: [
      "El agarre supino recluta el tríceps desde un ángulo diferente al pronado.",
    ],
    erroresComunes: [
      "Mover el codo hacia afuera al subir.",
    ],
  },

  "Palms-Down_Dumbbell_Wrist_Curl_Over_A_Bench": {
    nombre: "Curl de muñeca pronado sobre banco",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["wrist curl pronado", "curl muñeca palmas abajo"],
    instrucciones: [
      "Colocá dos mancuernas a un lado de un banco plano.",
      "Arrodilláte frente al banco con ambas rodillas en el piso.",
      "Tomá ambas mancuernas con agarre pronado (palmas hacia abajo) y apoyá los antebrazos sobre el banco, dejando las muñecas colgando del borde.",
      "Comenzá curvando las muñecas hacia arriba mientras exhalás.",
      "Bajá lentamente las muñecas a la posición inicial mientras inhalás.",
      "Solo las muñecas se mueven; los antebrazos permanecen sobre el banco.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "Trabaja los extensores del antebrazo.",
    ],
    erroresComunes: [
      "Levantar los antebrazos del banco.",
    ],
  },

  "Palms-Up_Dumbbell_Wrist_Curl_Over_A_Bench": {
    nombre: "Curl de muñeca supino sobre banco",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["wrist curl supino", "curl muñeca palmas arriba"],
    instrucciones: [
      "Colocá dos mancuernas a un lado de un banco plano.",
      "Arrodilláte frente al banco con ambas rodillas en el piso.",
      "Tomá ambas mancuernas con agarre supino (palmas hacia arriba) y apoyá los antebrazos sobre el banco, dejando las muñecas colgando del borde.",
      "Comenzá curvando las muñecas hacia arriba mientras exhalás.",
      "Bajá lentamente las muñecas a la posición inicial mientras inhalás. Aseguráte de inhalar durante esta parte.",
      "Solo las muñecas se mueven; los antebrazos permanecen sobre el banco.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "Trabaja los flexores del antebrazo.",
    ],
    erroresComunes: [
      "Levantar los antebrazos del banco.",
    ],
  },

  "Plyo_Push-up": {
    nombre: "Flexión pliométrica (plyo push-up)",
    patron: "Empuje horizontal",
    unilateral: false,
    sinonimos: ["clap push up", "flexion con palmada", "push up explosivo"],
    instrucciones: [
      "Adoptá posición de plancha alta apoyado sobre manos y pies.",
      "Los brazos deben estar completamente extendidos con las manos al ancho de hombros. Mantenés el cuerpo recto durante todo el movimiento. Esta es la posición inicial.",
      "Descendé flexionando los codos llevando el pecho hacia el piso.",
      "En la parte baja, revertí el movimiento empujándote hacia arriba extendiendo los codos lo más explosivamente posible. Intentá despegar las manos del piso.",
      "Volvé a la posición inicial y repetí.",
      "Para mayor dificultad, agregá palmadas mientras estás en el aire.",
    ],
    puntosClave: [
      "El objetivo es maximizar la explosividad en la fase de empuje.",
    ],
    erroresComunes: [
      "No absorber bien el aterrizaje — doblar los codos al caer.",
    ],
  },

  "Power_Partials": {
    nombre: "Elevaciones parciales de hombro",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["power partials", "elevacion parcial deltoide"],
    instrucciones: [
      "De pie con el torso erguido y una mancuerna en cada mano a extensión de brazos, codos cerca del torso.",
      "Las palmas miran hacia el cuerpo. Los pies al ancho de hombros. Esta es la posición inicial.",
      "Manteniendo los brazos rectos y el torso fijo, elevá las mancuernas hacia los costados hasta la altura de los hombros mientras exhalás.",
      "Sentí la contracción un segundo y comenzá a bajar lentamente a la posición inicial mientras inhalás. Al subir y bajar, mantenés las palmas mirando hacia abajo con el meñique levemente más alto para enfocar la tensión en el deltoide.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "El meñique levemente más alto en la elevación activa mejor el deltoide medial.",
    ],
    erroresComunes: [
      "Usar el torso para dar impulso.",
    ],
  },

  "Preacher_Hammer_Dumbbell_Curl": {
    nombre: "Curl de martillo en banco predicador",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["preacher hammer curl", "curl martillo predicador"],
    instrucciones: [
      "Colocá la parte superior de ambos brazos sobre el banco predicador y tomá una mancuerna en cada mano con las palmas enfrentadas (agarre neutro).",
      "Al inhalar, bajá lentamente las mancuernas hasta que el brazo esté completamente extendido y el bíceps en estiramiento total.",
      "Al exhalar, usá el bíceps para curvar el peso hacia arriba hasta la contracción completa y las mancuernas a la altura de los hombros.",
      "Apretá fuerte el bíceps un segundo en la posición contraída y repetí las veces indicadas.",
    ],
    puntosClave: [
      "El agarre neutro enfatiza el braquial y el braquiorradial.",
    ],
    erroresComunes: [
      "Subir los codos del banco.",
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
console.log(`✅ Lote 6 aplicado — ${nuevasAgregadas} entradas nuevas agregadas.`);
