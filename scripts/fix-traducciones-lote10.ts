/**
 * Lote 10 — 30 NUEVAS traducciones (intermediate + equipo hogareño, tanda 1).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const FILE = resolve("scripts/data/traducciones-fedb.es.json");
const t = JSON.parse(readFileSync(FILE, "utf8"));

const nuevos: Record<string, object> = {

  "Advanced_Kettlebell_Windmill": {
    nombre: "Molino avanzado con pesa rusa",
    patron: "Core anti-rotación",
    unilateral: true,
    sinonimos: ["windmill avanzado", "molino kettlebell"],
    instrucciones: [
      "Hacé la cargada y el press de una pesa rusa por encima de la cabeza con un brazo.",
      "Manteniendo la pesa rusa bloqueada en todo momento, llevá los glúteos hacia atrás en dirección al brazo con la pesa. Mantenés el brazo libre detrás de la espalda y rotás los pies a 45° respecto al brazo que sostiene la pesa.",
      "Bajá lo más posible.",
      "Pausá un segundo y revertí el movimiento volviendo a la posición inicial.",
    ],
    puntosClave: [
      "El brazo con la pesa permanece completamente bloqueado durante todo el recorrido.",
    ],
    erroresComunes: [
      "Flexionar el codo del brazo que sostiene la pesa.",
    ],
  },

  "Alternating_Hang_Clean": {
    nombre: "Cargada colgante alternada con pesas rusas",
    patron: "Dominante de cadera",
    unilateral: true,
    sinonimos: ["hang clean alternado", "cargada alternada kettlebell"],
    instrucciones: [
      "Colocá dos pesas rusas entre los pies. Para la posición inicial, llevá los glúteos hacia atrás y mirá al frente.",
      "Hacé la cargada de una pesa hasta el hombro y sostené la otra en posición colgante. Cargá la pesa al hombro extendiendo piernas y cadera mientras la tirás hacia el hombro. Rotá la muñeca al hacerlo.",
      "Bajá la pesa cargada a la posición colgante y cargá la pesa alternativa. Repetí.",
    ],
    puntosClave: [
      "La potencia viene de la extensión de piernas y cadera, no del brazo.",
    ],
    erroresComunes: [
      "Tirar la pesa con el brazo en lugar de impulsarla con las piernas.",
    ],
  },

  "Alternating_Kettlebell_Press": {
    nombre: "Press alternado con pesas rusas",
    patron: "Empuje vertical",
    unilateral: true,
    sinonimos: ["kettlebell press alternado"],
    instrucciones: [
      "Hacé la cargada de dos pesas rusas a los hombros, extendiendo piernas y cadera mientras las tirás hacia los hombros. Rotá las muñecas al hacerlo.",
      "Presioná una pesa directamente por encima de la cabeza extendiendo el codo y girando la palma hacia adelante, mientras sostenés la otra pesa fija.",
      "Bajá la pesa presionada a la posición inicial e inmediatamente presioná con el otro brazo.",
    ],
    puntosClave: [
      "El brazo que no presiona se mantiene completamente estable como ancla.",
    ],
    erroresComunes: [
      "Inclinar el torso hacia el lado que presiona.",
    ],
  },

  "Alternating_Kettlebell_Row": {
    nombre: "Remo alternado con pesas rusas",
    patron: "Tracción horizontal",
    unilateral: true,
    sinonimos: ["kettlebell row alternado"],
    instrucciones: [
      "Colocá dos pesas rusas frente a los pies. Flexioná levemente las rodillas y llevá los glúteos hacia atrás lo más posible. Al inclinarte para llegar a la posición inicial, tomá ambas pesas de los mangos.",
      "Levantá una pesa rusa del piso mientras sostenés la otra. Retraé el omóplato del lado que trabaja mientras flexionás el codo, llevando la pesa hacia el abdomen o las costillas.",
      "Bajá la pesa del brazo que trabaja y repetí con el otro brazo.",
    ],
    puntosClave: [
      "La pesa que no trabaja permanece sostenida cerca del piso para mantener la estabilidad.",
    ],
    erroresComunes: [
      "Rotar el torso al remar en lugar de mantenerlo fijo.",
    ],
  },

  "Bench_Jump": {
    nombre: "Salto sobre banco",
    patron: "Locomoción / cardio",
    unilateral: false,
    sinonimos: ["bench jump", "salto lateral sobre banco"],
    instrucciones: [
      "Comenzá con un cajón o banco a 30-60 cm frente a vos. Pararte con los pies al ancho de hombros. Esta es la posición inicial.",
      "Hacé una sentadilla corta en preparación para el salto, balanceando los brazos hacia atrás.",
      "Rebotá desde esta posición, extendiendo caderas, rodillas y tobillos para saltar lo más alto posible. Balanceá los brazos hacia adelante y arriba.",
      "Saltá sobre el banco, aterrizando con las rodillas flexionadas, absorbiendo el impacto con las piernas.",
      "Girá para quedar mirando en dirección opuesta y saltá de vuelta sobre el banco.",
    ],
    puntosClave: [
      "Absorbé cada aterrizaje flexionando rodillas y caderas antes del próximo salto.",
    ],
    erroresComunes: [
      "Aterrizar con las piernas rígidas.",
    ],
  },

  "Bent-Arm_Dumbbell_Pullover": {
    nombre: "Pullover con mancuerna (brazos flexionados)",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["dumbbell pullover brazos flexionados"],
    instrucciones: [
      "Colocá una mancuerna parada sobre un banco plano.",
      "Asegurándote de que la mancuerna quede firme en el extremo del banco, acostáte perpendicular a él (el torso cruzado, formando una cruz) con solo los hombros apoyados en la superficie. Las caderas quedan por debajo del banco y las piernas flexionadas con los pies firmes en el piso. La cabeza también queda fuera del banco.",
      "Tomá la mancuerna con ambas manos y sostenela en línea recta sobre el pecho con una leve flexión de codo. Ambas palmas deben presionar contra la cara inferior de un extremo de la mancuerna. Esta es la posición inicial.",
      "Manteniendo los brazos bloqueados en la posición flexionada, bajá el peso lentamente en arco detrás de la cabeza mientras inhalás, hasta sentir el estiramiento en el pecho.",
      "En ese punto, volvé la mancuerna a la posición inicial usando el mismo arco con el que bajó, exhalando durante el movimiento.",
      "Sostené el peso en la posición inicial un segundo y repetí el movimiento las veces indicadas.",
    ],
    puntosClave: [
      "Siempre asegurate de que la mancuerna esté firme; una con discos sueltos puede desarmarse y caer sobre la cara.",
    ],
    erroresComunes: [
      "Usar una mancuerna con discos sueltos o mal asegurados.",
    ],
  },

  "Body-Up": {
    nombre: "Body-up (plancha con extensión de brazos)",
    patron: "Empuje horizontal",
    unilateral: false,
    sinonimos: ["body up", "plancha a flexion de brazos"],
    instrucciones: [
      "Adoptá una posición de plancha en el piso. Sostenés el peso del cuerpo sobre los dedos de los pies y los antebrazos, manteniendo el torso recto. Los antebrazos deben estar al ancho de hombros. Esta es la posición inicial.",
      "Presionando las palmas firmemente contra el piso, extendé los codos para elevar el cuerpo del piso. Mantenés el torso rígido durante todo el movimiento.",
      "Bajá lentamente los antebrazos al piso flexionando los codos.",
      "Repetí.",
    ],
    puntosClave: [
      "El torso se mantiene rígido como una tabla en todo momento, sin elevar ni hundir las caderas.",
    ],
    erroresComunes: [
      "Dejar caer las caderas durante la transición de plancha baja a alta.",
    ],
  },

  "Bottoms-Up_Clean_From_The_Hang_Position": {
    nombre: "Cargada bottoms-up desde posición colgante",
    patron: "Dominante de cadera",
    unilateral: true,
    sinonimos: ["bottoms up clean", "cargada bottoms up"],
    instrucciones: [
      "Iniciá el ejercicio parado derecho con una pesa rusa en una mano.",
      "Balanceá la pesa hacia atrás con fuerza y luego revertí el movimiento con fuerza. Apretá el mango de la pesa lo más fuerte posible y elevala hasta el hombro.",
    ],
    puntosClave: [
      "Apretar fuerte el mango estabiliza la pesa en la posición 'bottoms-up' (boca abajo).",
    ],
    erroresComunes: [
      "Aflojar el agarre al recibir la pesa en el hombro.",
    ],
  },

  "Calf_Raise_On_A_Dumbbell": {
    nombre: "Elevación de talones sobre mancuerna",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["calf raise mancuerna", "elevacion de pantorrilla en mancuerna"],
    instrucciones: [
      "Sostenéte de un objeto firme para el equilibrio y parate sobre el mango de una mancuerna, preferentemente una con discos redondos para que ruede; de esta manera tenés que trabajar más para estabilizarte, lo que aumenta la efectividad del ejercicio.",
      "Ahora rodá el pie levemente hacia adelante para conseguir un buen estiramiento de la pantorrilla. Esta es la posición inicial.",
      "Elevá la pantorrilla mientras hacés rodar el pie sobre la parte superior del mango hasta lograr la extensión completa. Exhalá durante este movimiento. Contraé fuerte la pantorrilla en la parte superior y sostené un segundo. Al subir, rodá la mancuerna levemente hacia atrás.",
      "Ahora inhalá mientras rodás la mancuerna levemente hacia adelante al bajar para conseguir mejor estiramiento.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "La superficie inestable de la mancuerna exige mayor control y equilibrio que un step fijo.",
    ],
    erroresComunes: [
      "Perder el equilibrio por no sostenerse de un punto de apoyo firme.",
    ],
  },

  "Cuban_Press": {
    nombre: "Press cubano",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["cuban press", "rotacion externa mas press"],
    instrucciones: [
      "Tomá una mancuerna en cada mano con agarre pronado, de pie. Elevá los brazos superiores hasta que queden paralelos al piso, dejando que los antebrazos cuelguen hacia abajo en posición de 'espantapájaros'. Esta es la posición inicial.",
      "Para iniciar el movimiento, rotá externamente los hombros para mover el brazo superior 180°. Mantenés los brazos superiores fijos, rotando hasta que las muñecas queden directamente sobre los codos, con los antebrazos perpendiculares al piso.",
      "Ahora presioná las mancuernas extendiendo los codos, estirando los brazos por encima de la cabeza.",
      "Volvé a la posición inicial mientras inhalás, revirtiendo los pasos.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "Combina rotación externa de hombro con press: excelente para la salud del manguito rotador.",
    ],
    erroresComunes: [
      "Mover los brazos superiores en lugar de mantenerlos fijos durante la rotación.",
    ],
  },

  "Decline_Crunch": {
    nombre: "Crunch en banco decline",
    patron: "Core flexión",
    unilateral: false,
    sinonimos: ["decline crunch", "crunch declinado"],
    instrucciones: [
      "Asegurá las piernas al extremo del banco decline y acostáte.",
      "Colocá las manos suavemente a los costados de la cabeza con los codos adentro. No entrelaces los dedos detrás de la nuca.",
      "Mientras presionás la zona lumbar contra el banco para aislar mejor el abdomen, comenzá a despegar los hombros de él.",
      "Seguí presionando lo más fuerte posible con la zona lumbar mientras contraés el abdomen y exhalás. Los hombros solo deben elevarse unos 10 cm, y la zona lumbar debe permanecer en el banco. En la parte superior del movimiento, contraé fuerte el abdomen y sostené un segundo. Concentráte en un movimiento lento y controlado, sin usar impulso.",
      "Después de la contracción de un segundo, comenzá a bajar lentamente de nuevo a la posición inicial mientras inhalás.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "La zona lumbar permanece pegada al banco; solo se elevan los hombros unos centímetros.",
    ],
    erroresComunes: [
      "Usar impulso en lugar de contracción controlada.",
    ],
  },

  "Double_Kettlebell_Alternating_Hang_Clean": {
    nombre: "Cargada colgante alternada con dos pesas rusas",
    patron: "Dominante de cadera",
    unilateral: true,
    sinonimos: ["double kettlebell hang clean alternado"],
    instrucciones: [
      "Colocá dos pesas rusas entre los pies. Para la posición inicial, llevá los glúteos hacia atrás y mirá al frente.",
      "Hacé la cargada de una pesa al hombro y sostené la otra en posición colgante.",
      "Con un movimiento fluido, bajá la pesa de arriba mientras impulsás hacia arriba la pesa de abajo.",
    ],
    puntosClave: [
      "El movimiento debe ser fluido y continuo entre ambas pesas, sin pausas bruscas.",
    ],
    erroresComunes: [
      "Detener completamente el movimiento entre cada cargada.",
    ],
  },

  "Double_Kettlebell_Jerk": {
    nombre: "Envión con dos pesas rusas",
    patron: "Empuje vertical",
    unilateral: false,
    sinonimos: ["double kettlebell jerk", "jerk con pesas rusas"],
    instrucciones: [
      "Sostené una pesa rusa por el mango en cada mano.",
      "Cargá las pesas a los hombros extendiendo piernas y cadera mientras las tirás hacia los hombros. Rotá las muñecas al hacerlo, de modo que las palmas queden mirando hacia adelante. Esta es la posición inicial.",
      "Hacé una semi-flexión del cuerpo doblando las rodillas, manteniendo el torso erguido.",
      "Revertí inmediatamente la dirección, empujando con los talones, generando impulso como si saltaras.",
      "Al hacerlo, presioná las pesas por encima de la cabeza hasta bloquear los brazos, usando el impulso del cuerpo para mover los pesos.",
      "Volvé los pies al piso en posición de zancada, con un pie adelante y otro atrás.",
      "Manteniendo los pesos arriba, volvé a la posición de pie juntando los pies. Bajá los pesos para realizar la siguiente repetición.",
    ],
    puntosClave: [
      "El impulso de piernas y cadera hace la mayor parte del trabajo, no solo los brazos.",
    ],
    erroresComunes: [
      "Presionar solo con los brazos sin usar el impulso de las piernas.",
    ],
  },

  "Double_Kettlebell_Push_Press": {
    nombre: "Push press con dos pesas rusas",
    patron: "Empuje vertical",
    unilateral: false,
    sinonimos: ["double kettlebell push press"],
    instrucciones: [
      "Cargá dos pesas rusas a los hombros.",
      "Hacé una sentadilla corta de unos centímetros y revertí el movimiento rápidamente. Usá el impulso de las piernas para llevar las pesas por encima de la cabeza.",
      "Una vez que las pesas estén bloqueadas arriba, bajalas a los hombros y repetí.",
    ],
    puntosClave: [
      "El impulso de piernas reduce la carga directa sobre el hombro comparado con un press estricto.",
    ],
    erroresComunes: [
      "Hacer una sentadilla demasiado profunda en lugar de un impulso corto y rápido.",
    ],
  },

  "Double_Kettlebell_Windmill": {
    nombre: "Molino con dos pesas rusas",
    patron: "Core anti-rotación",
    unilateral: true,
    sinonimos: ["double kettlebell windmill"],
    instrucciones: [
      "Colocá una pesa rusa frente al pie delantero y hacé la cargada y el press de la otra pesa por encima de la cabeza con el brazo opuesto. Cargá la pesa al hombro extendiendo piernas y cadera mientras la tirás hacia el hombro, rotando la muñeca para que la palma quede mirando hacia adelante.",
      "Manteniendo la pesa bloqueada en todo momento, llevá los glúteos hacia atrás en dirección al brazo con la pesa bloqueada. Rotá los pies a 45° respecto al brazo con la pesa bloqueada.",
      "Flexionando la cadera hacia un lado y llevando los glúteos hacia atrás, inclinate lentamente hasta poder recoger la pesa del piso. Mantenés la vista fija en la pesa que sostenés sobre la cabeza en todo momento.",
      "Pausá un segundo después de recoger la pesa del piso y revertí el movimiento volviendo a la posición inicial.",
    ],
    puntosClave: [
      "La mirada se mantiene fija en la pesa elevada durante todo el movimiento para mantener el control.",
    ],
    erroresComunes: [
      "Perder de vista la pesa elevada y desestabilizar el hombro.",
    ],
  },

  "Dumbbell_Floor_Press": {
    nombre: "Press de piso con mancuernas",
    patron: "Empuje horizontal",
    unilateral: false,
    sinonimos: ["dumbbell floor press", "press de pecho en el piso"],
    instrucciones: [
      "Acostáte en el piso sosteniendo mancuernas en las manos. Las rodillas pueden estar flexionadas. Comenzá con los pesos completamente extendidos por encima de vos.",
      "Bajá los pesos hasta que el brazo superior toque el piso. Podés mantener los codos pegados al cuerpo para enfatizar el tríceps, o abrir los brazos hacia los costados para enfocar el pecho.",
      "Pausá en la parte baja y volvé a juntar los pesos arriba extendiendo los codos.",
    ],
    puntosClave: [
      "El piso limita el rango de movimiento, protegiendo el hombro en la parte baja.",
    ],
    erroresComunes: [
      "No pausar en el piso, rebotando los brazos para subir.",
    ],
  },

  "Dumbbell_Lying_One-Arm_Rear_Lateral_Raise": {
    nombre: "Elevación posterior unilateral acostado con mancuerna",
    patron: "Aislamiento",
    unilateral: true,
    sinonimos: ["rear lateral raise un brazo acostado"],
    instrucciones: [
      "Sosteniendo una mancuerna en una mano, acostáte con el pecho hacia abajo sobre un banco ajustable con una leve inclinación (unos 15° desde el piso). La otra mano puede sostenerse de la pata del banco para mayor estabilidad.",
      "Colocá la palma de la mano que sostiene la mancuerna en posición neutra (mirando hacia el torso) mientras mantenés el brazo extendido con una leve flexión de codo. Esta es la posición inicial.",
      "Elevá el brazo con la mancuerna hacia el costado hasta que el codo quede a la altura del hombro y el brazo casi paralelo al piso, mientras exhalás. Mantenés el brazo perpendicular al torso durante todo el movimiento, siempre extendido. Sostené la contracción un segundo en la parte superior.",
      "Bajá lentamente la mancuerna a la posición inicial mientras inhalás.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "La inclinación del banco aísla el deltoide posterior eliminando el impulso del torso.",
    ],
    erroresComunes: [
      "Flexionar el codo excesivamente durante la elevación.",
    ],
  },

  "Dumbbell_Lying_Pronation": {
    nombre: "Pronación acostado con mancuerna",
    patron: "Aislamiento",
    unilateral: true,
    sinonimos: ["pronation lying", "pronacion de antebrazo acostado"],
    instrucciones: [
      "Acostáte boca abajo en un banco plano, con un brazo sosteniendo una mancuerna y la otra mano apoyada sobre el banco, doblada para descansar la cabeza sobre ella.",
      "Flexioná el codo del brazo que sostiene la mancuerna hasta formar un ángulo de 90° entre el brazo superior y el antebrazo.",
      "Ahora elevá el brazo superior de modo que el antebrazo quede perpendicular al piso y el brazo superior perpendicular al torso. El brazo superior debe quedar paralelo al piso, formando un ángulo de 90° con el torso. Esta es la posición inicial.",
      "Al exhalar, rotá internamente el antebrazo para que la mancuerna se eleve hacia adelante, manteniendo el ángulo de 90° entre brazo superior y antebrazo. Continuá esta rotación interna hasta que el antebrazo quede paralelo al piso. En ese punto, sostené la contracción un segundo.",
      "Al inhalar, volvé lentamente a la posición inicial.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "Fortalece el pronador redondo, importante para la salud del codo y muñeca.",
    ],
    erroresComunes: [
      "Mover el brazo superior en lugar de mantenerlo fijo.",
    ],
  },

  "Dumbbell_Lying_Rear_Lateral_Raise": {
    nombre: "Elevación posterior acostado con mancuernas",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["rear lateral raise acostado", "pajaro acostado"],
    instrucciones: [
      "Sosteniendo una mancuerna en cada mano, acostáte con el pecho hacia abajo sobre un banco ajustable con una leve inclinación (unos 15° desde el piso).",
      "Colocá las palmas de las manos en posición neutra (mirando hacia el torso) mientras mantenés los brazos extendidos con una leve flexión de codo. Esta es la posición inicial.",
      "Elevá los brazos hacia los costados hasta que los codos queden a la altura del hombro y los brazos casi paralelos al piso, mientras exhalás. Mantenés los brazos perpendiculares al torso durante todo el movimiento, siempre extendidos. Sostené la contracción un segundo en la parte superior.",
      "Bajá lentamente las mancuernas a la posición inicial mientras inhalás.",
      "Repetí las veces indicadas y luego cambiá al otro brazo.",
    ],
    puntosClave: [
      "La inclinación del banco aísla el deltoide posterior eliminando el impulso del torso.",
    ],
    erroresComunes: [
      "Despegar el pecho del banco para ayudar a subir el peso.",
    ],
  },

  "Dumbbell_Lying_Supination": {
    nombre: "Supinación acostado con mancuerna",
    patron: "Aislamiento",
    unilateral: true,
    sinonimos: ["supination lying", "supinacion de antebrazo acostado"],
    instrucciones: [
      "Acostáte de costado en un banco plano con un brazo sosteniendo una mancuerna y la otra mano apoyada sobre el banco, doblada para descansar la cabeza sobre ella.",
      "Flexioná el codo del brazo que sostiene la mancuerna hasta formar un ángulo de 90° entre el brazo superior y el antebrazo.",
      "Ahora elevá el brazo superior de modo que el antebrazo quede paralelo al piso y perpendicular al torso (directamente frente a vos). El brazo superior permanece fijo junto al torso, paralelo al piso (alineado con el torso en todo momento). Esta es la posición inicial.",
      "Al exhalar, rotá externamente el antebrazo para que la mancuerna se eleve en un movimiento semicircular, manteniendo el ángulo de 90° entre brazo superior y antebrazo. Continuá esta rotación externa hasta que el antebrazo quede perpendicular al piso, apuntando al techo. En ese punto, sostené la contracción un segundo.",
      "Al inhalar, volvé lentamente a la posición inicial.",
      "Repetí las veces indicadas y luego cambiá de brazo.",
    ],
    puntosClave: [
      "Fortalece el supinador, complementario al ejercicio de pronación.",
    ],
    erroresComunes: [
      "Mover el brazo superior en lugar de mantenerlo fijo.",
    ],
  },

  "Dumbbell_One-Arm_Shoulder_Press": {
    nombre: "Press de hombro unilateral con mancuerna",
    patron: "Empuje vertical",
    unilateral: true,
    sinonimos: ["one arm shoulder press", "press militar un brazo"],
    instrucciones: [
      "Tomá una mancuerna y sentáte en un banco de press militar o un banco utilitario con respaldo, colocando la mancuerna sobre el muslo, o quedáte de pie.",
      "Subí la mancuerna hasta la altura del hombro. La otra mano puede mantenerse extendida hacia el costado, en la cintura, o sosteniéndose de una superficie fija.",
      "Rotá la muñeca para que la palma quede mirando hacia adelante. Esta es la posición inicial.",
      "Al exhalar, empujá la mancuerna hacia arriba hasta que el brazo quede completamente extendido.",
      "Después de una pausa de un segundo, bajá lentamente a la posición inicial mientras inhalás.",
      "Repetí las veces indicadas y luego cambiá de brazo.",
    ],
    puntosClave: [
      "El press unilateral exige mayor estabilidad del núcleo por la carga asimétrica.",
    ],
    erroresComunes: [
      "Inclinar el torso hacia el lado contrario para compensar.",
    ],
  },

  "Dumbbell_One-Arm_Triceps_Extension": {
    nombre: "Extensión de tríceps unilateral sobre cabeza con mancuerna",
    patron: "Aislamiento",
    unilateral: true,
    sinonimos: ["one arm triceps extension de pie o sentado"],
    instrucciones: [
      "Tomá una mancuerna y sentáte en un banco de press militar o un banco utilitario con respaldo, o quedáte de pie.",
      "Subí la mancuerna hasta la altura del hombro y luego extendé el brazo por encima de la cabeza de modo que todo el brazo quede perpendicular al piso y junto a la cabeza. La mancuerna debe quedar arriba de vos. La otra mano puede mantenerse extendida al costado, en la cintura, sosteniendo el brazo que trabaja, o agarrada de una superficie fija.",
      "Rotá la muñeca para que la palma quede mirando hacia adelante y el meñique apunte al techo. Esta es la posición inicial.",
      "Bajá lentamente la mancuerna detrás de la cabeza manteniendo el brazo superior fijo. Inhalá durante este movimiento y pausá cuando el tríceps esté completamente estirado.",
      "Volvé a la posición inicial flexionando el tríceps mientras exhalás. Es fundamental que solo se mueva el antebrazo; el brazo superior debe permanecer fijo junto a la cabeza en todo momento.",
      "Repetí las veces indicadas y cambiá de brazo.",
    ],
    puntosClave: [
      "El brazo superior permanece pegado a la cabeza durante todo el recorrido.",
    ],
    erroresComunes: [
      "Mover el codo hacia afuera al bajar la mancuerna.",
    ],
  },

  "Dumbbell_Prone_Incline_Curl": {
    nombre: "Curl prono en banco inclinado",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["prone incline curl", "curl boca abajo en banco inclinado"],
    instrucciones: [
      "Tomá una mancuerna en cada mano y acostáte boca abajo en un banco inclinado con los hombros cerca de la parte superior del respaldo. Las rodillas pueden descansar en el asiento o las piernas pueden quedar a horcajadas a los costados (mi preferencia).",
      "Dejá que los brazos se extiendan y cuelguen naturalmente frente a vos, de modo que queden perpendiculares al piso.",
      "Ahora mantené los codos pegados al cuerpo y las palmas mirando hacia adelante. Esta es la posición inicial.",
      "Elevá las mancuernas contrayendo el bíceps hasta que los brazos queden completamente flexionados. Exhalá durante esta parte y asegurate de que solo se muevan los antebrazos. Los brazos superiores deben permanecer fijos en todo momento.",
      "Bajá las mancuernas hasta que los brazos queden completamente extendidos.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "La posición prona elimina por completo el impulso del hombro y el torso.",
    ],
    erroresComunes: [
      "Despegar los hombros del banco para ayudar a subir el peso.",
    ],
  },

  "Dumbbell_Seated_Box_Jump": {
    nombre: "Salto al cajón sentado con mancuerna",
    patron: "Locomoción / cardio",
    unilateral: false,
    sinonimos: ["seated box jump con mancuerna"],
    instrucciones: [
      "Colocá un cajón a un par de pasos al costado de un banco. Sostené una mancuerna contra el pecho con ambas manos y sentáte en el banco mirando hacia el cajón. Esta es la posición inicial.",
      "Plantá los pies firmemente en el piso mientras te inclinás hacia adelante, extendiendo caderas y rodillas para saltar hacia arriba y adelante.",
      "Aterrizá sobre el cajón con ambos pies, absorbiendo el impacto flexionando caderas y rodillas.",
      "Bajá del cajón y volvé a la posición inicial.",
    ],
    puntosClave: [
      "Comenzar sentado elimina el contramovimiento de piernas, exigiendo más potencia explosiva.",
    ],
    erroresComunes: [
      "Aterrizar con las piernas rígidas sin absorber el impacto.",
    ],
  },

  "Dumbbell_Squat_To_A_Bench": {
    nombre: "Sentadilla a banco con mancuernas",
    patron: "Dominante de rodilla",
    unilateral: false,
    sinonimos: ["squat to bench con mancuernas", "sentadilla con referencia"],
    instrucciones: [
      "Pararte derecho con un banco plano detrás de vos sosteniendo una mancuerna en cada mano (palmas hacia los costados de las piernas).",
      "Colocá las piernas con una postura media al ancho de hombros y las puntas de los pies levemente hacia afuera. Mantené la cabeza arriba en todo momento y la espalda recta. Esta es la posición inicial.",
      "Comenzá a bajar el torso lentamente flexionando las rodillas mientras mantenés la postura recta y la cabeza arriba. Continuá bajando hasta tocar levemente el banco detrás de vos. Inhalá durante esta parte. Si la ejecución es correcta, el frente de las rodillas debe formar una línea recta imaginaria con los dedos de los pies. Si las rodillas sobrepasan esa línea, estás generando estrés innecesario en la rodilla.",
      "Comenzá a subir mientras exhalás, empujando el piso principalmente con el talón mientras extendés las piernas y volvés a la posición inicial.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "El banco funciona como referencia de profundidad, sin sentarse realmente sobre él.",
    ],
    erroresComunes: [
      "Sentarse completamente en el banco perdiendo la tensión muscular.",
    ],
  },

  "Frog_Sit-Ups": {
    nombre: "Sit-up rana",
    patron: "Core flexión",
    unilateral: false,
    sinonimos: ["frog sit up", "abdominal rana"],
    instrucciones: [
      "Acostáte con la espalda plana en el piso (o colchoneta) y las piernas extendidas al frente.",
      "Ahora flexioná las rodillas y apoyá la parte externa de los muslos en el piso (o colchoneta) mientras unís las plantas de los pies.",
      "Intentá empujar ambas plantas y acercarlas lo más posible hacia vos, manteniendo los muslos externos en el piso (o casi tocándolo). En esta posición, las piernas deben formar una figura de diamante.",
      "Ahora cruzá los brazos al frente tocando los hombros opuestos. Esta es la posición inicial.",
      "Al exhalar, aplaná la espalda baja contra el piso mientras enroscás el torso hacia arriba. Esto se asemeja al primer cuarto de movimiento de un sit-up. Sostené la posición superior un segundo.",
      "Al inhalar, bajá lentamente de vuelta a la posición inicial.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "La posición de diamante de las piernas activa más el abdomen inferior y los aductores.",
    ],
    erroresComunes: [
      "Subir las rodillas en lugar de mantener los muslos externos en el piso.",
    ],
  },

  "Front_Squats_With_Two_Kettlebells": {
    nombre: "Sentadilla frontal con dos pesas rusas",
    patron: "Dominante de rodilla",
    unilateral: false,
    sinonimos: ["front squat kettlebell doble"],
    instrucciones: [
      "Cargá dos pesas rusas a los hombros, extendiendo piernas y cadera mientras las tirás hacia los hombros. Rotá las muñecas al hacerlo.",
      "Mirando siempre al frente, hacé una sentadilla lo más profunda posible y pausá en la parte baja. Al bajar, empujá las rodillas hacia afuera. Debés sentarte entre las piernas, manteniendo el torso erguido, con la cabeza y el pecho arriba.",
      "Subí de nuevo empujando con los talones y repetí.",
    ],
    puntosClave: [
      "Las pesas en los hombros obligan a mantener el torso más erguido que en una sentadilla con barra trasera.",
    ],
    erroresComunes: [
      "Redondear la espalda alta al bajar.",
    ],
  },

  "Gorilla_Chin_Crunch": {
    nombre: "Dominada gorila con crunch",
    patron: "Tracción vertical",
    unilateral: false,
    sinonimos: ["gorilla chin crunch", "dominada con crunch"],
    instrucciones: [
      "Colgáte de una barra de dominadas usando agarre supino (palmas hacia vos) levemente más ancho que el hombro.",
      "Ahora flexioná las rodillas a 90° de modo que las pantorrillas queden paralelas al piso mientras los muslos permanecen perpendiculares a él. Esta es la posición inicial.",
      "Al exhalar, tirá de tu cuerpo hacia arriba mientras simultáneamente encogés las rodillas hasta que queden a la altura del pecho. Dejás de subir cuando la nariz llega a la altura de la barra. En ese punto también deberías estar terminando el crunch simultáneamente.",
      "Comenzá a inhalar lentamente mientras volvés a la posición inicial.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "Combina la dominada tradicional con un crunch simultáneo de rodillas al pecho.",
    ],
    erroresComunes: [
      "Hacer la dominada y el crunch en momentos separados en lugar de simultáneos.",
    ],
  },

  "Groiners": {
    nombre: "Groiners (salto a plancha alternado)",
    patron: "Locomoción / cardio",
    unilateral: false,
    sinonimos: ["groiners", "salto a plancha"],
    instrucciones: [
      "Comenzá en posición de flexión de brazos en el piso. Esta es la posición inicial.",
      "Usando ambas piernas, saltá hacia adelante aterrizando con los pies junto a las manos. Mantené la cabeza arriba al hacerlo.",
      "Volvé a la posición inicial e inmediatamente repetí el movimiento, continuando por 10-20 repeticiones.",
    ],
    puntosClave: [
      "El salto debe ser explosivo pero controlado al aterrizar junto a las manos.",
    ],
    erroresComunes: [
      "Bajar la cabeza durante el salto, perdiendo la postura.",
    ],
  },

  "Hyperextensions_With_No_Hyperextension_Bench": {
    nombre: "Hiperextensiones sin banco específico",
    patron: "Dominante de cadera",
    unilateral: false,
    sinonimos: ["hiperextensiones improvisadas", "back extension sin banco"],
    instrucciones: [
      "Con alguien sosteniendo tus piernas, deslizate hasta el borde de un banco plano hasta que las caderas queden colgando fuera del extremo. Todo el torso superior debe quedar colgando hacia el piso. Vas a estar en la misma posición que en un banco de hiperextensiones, pero con menor rango de movimiento por la altura del banco plano.",
      "Con el cuerpo recto, cruzá los brazos al frente (mi preferencia) o detrás de la cabeza. Esta es la posición inicial. También podés sostener un disco para resistencia adicional, debajo de los brazos cruzados.",
      "Comenzá a flexionarte lentamente desde la cintura, lo más posible, manteniendo la espalda plana. Inhalá durante este movimiento. Seguí bajando hasta casi tocar el piso o sentir un buen estiramiento en los isquiotibiales, lo que ocurra primero. Nunca redondees la espalda durante este ejercicio.",
      "Subí lentamente el torso de vuelta a la posición inicial mientras exhalás. Evitá la tentación de arquear la espalda más allá de una línea recta. Tampoco balancees el torso, para proteger la espalda de lesiones.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "Necesita un compañero que sostenga las piernas con firmeza durante todo el ejercicio.",
    ],
    erroresComunes: [
      "Redondear la espalda baja al bajar.",
      "Arquear en exceso al subir.",
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
console.log(`✅ Lote 10 aplicado — ${nuevasAgregadas} entradas nuevas agregadas.`);
