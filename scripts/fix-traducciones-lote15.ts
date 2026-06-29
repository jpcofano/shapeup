/**
 * Lote 15 — 23 NUEVAS traducciones (barbell beginner, tanda final).
 * Completa el pool de barbell + nivel beginner.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const FILE = resolve("scripts/data/traducciones-fedb.es.json");
const t = JSON.parse(readFileSync(FILE, "utf8"));

const nuevos: Record<string, object> = {

  "Lying_Cambered_Barbell_Row": {
    nombre: "Remo con barra curva acostado",
    patron: "Tracción horizontal",
    unilateral: false,
    sinonimos: ["cambered bar row", "remo con barra cambada"],
    instrucciones: [
      "Colocá una barra curva debajo de un banco de ejercicios.",
      "Acostáte boca abajo en el banco y tomá la barra con agarre pronado (palmas hacia abajo) más ancho que el ancho de hombros. Esta es la posición inicial.",
      "Al exhalar, remá la barra hacia arriba manteniendo los codos cerca del cuerpo, hacia el pecho si querés enfocar la espalda media-alta, o hacia el abdomen si el objetivo es el dorsal.",
      "Después de una pausa de un segundo en la parte superior, bajá lentamente a la posición inicial mientras inhalás.",
    ],
    puntosClave: [
      "La dirección del tirón (pecho o abdomen) cambia el énfasis muscular dentro del mismo ejercicio.",
    ],
    erroresComunes: [
      "Abrir los codos hacia afuera durante el remo.",
    ],
  },

  "One-Arm_Long_Bar_Row": {
    nombre: "Remo unilateral con barra larga anclada (landmine)",
    patron: "Tracción horizontal",
    unilateral: true,
    sinonimos: ["landmine row un brazo"],
    instrucciones: [
      "Colocá una barra en un soporte landmine o en un rincón para que no se mueva. Cargá el peso adecuado en tu extremo.",
      "Pararte junto a la barra y tomala con una mano cerca del collar. Usando las caderas y las piernas, ponete de pie.",
      "Adoptá una postura con rodillas levemente flexionadas, caderas hacia atrás y pecho arriba. El brazo debe estar extendido. Esta es la posición inicial.",
      "Tirá del peso hacia tu costado retrayendo el hombro y flexionando el codo. No tirones ni hagas trampa durante el movimiento.",
      "Después de una breve pausa, volvé a la posición inicial.",
    ],
    puntosClave: [
      "El anclaje landmine permite un ángulo de tirón distinto al remo con barra recta.",
    ],
    erroresComunes: [
      "Usar impulso del torso para tirar del peso.",
    ],
  },

  "Palms-Down_Wrist_Curl_Over_A_Bench": {
    nombre: "Curl de muñeca con barra agarre pronado sobre banco",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["wrist curl con barra pronado"],
    instrucciones: [
      "Comenzá colocando una barra a un lado de un banco plano.",
      "Arrodilláte con ambas rodillas en el piso, de modo que tu cuerpo quede frente al banco.",
      "Usá los brazos para tomar la barra con agarre pronado (palmas hacia abajo) y subila de modo que los antebrazos descansen sobre el banco, dejando las muñecas colgando del borde.",
      "Comenzá curvando las muñecas hacia arriba mientras exhalás.",
      "Bajá lentamente las muñecas a la posición inicial mientras inhalás.",
      "Los antebrazos deben permanecer fijos; solo la muñeca debe moverse para este ejercicio.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "Trabaja los extensores del antebrazo.",
    ],
    erroresComunes: [
      "Mover los antebrazos durante el curl.",
    ],
  },

  "Palms-Up_Barbell_Wrist_Curl_Over_A_Bench": {
    nombre: "Curl de muñeca con barra agarre supino sobre banco",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["wrist curl con barra supino"],
    instrucciones: [
      "Comenzá colocando una barra a un lado de un banco plano.",
      "Arrodilláte con ambas rodillas en el piso, de modo que tu cuerpo quede frente al banco.",
      "Usá los brazos para tomar la barra con agarre supino (palmas hacia arriba) y subila de modo que los antebrazos descansen sobre el banco, dejando las muñecas colgando del borde.",
      "Comenzá curvando las muñecas hacia arriba mientras exhalás.",
      "Bajá lentamente las muñecas a la posición inicial mientras inhalás.",
      "Los antebrazos deben permanecer fijos; solo la muñeca debe moverse para este ejercicio.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "Trabaja los flexores del antebrazo, complementario a la variante con palmas abajo.",
    ],
    erroresComunes: [
      "Mover los antebrazos durante el curl.",
    ],
  },

  "Preacher_Curl": {
    nombre: "Curl predicador con barra EZ",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["preacher curl barra ez", "curl predicador clasico"],
    instrucciones: [
      "Para realizar este movimiento vas a necesitar un banco predicador y una barra EZ. Tomá la barra EZ por las manijas internas más cercanas (lo ideal es que alguien te la entregue, o tomala del soporte frontal que tienen la mayoría de los bancos predicador). Las palmas deben mirar hacia adelante y estar levemente inclinadas hacia adentro por la forma de la barra.",
      "Con los brazos superiores apoyados contra la almohadilla del banco predicador y el pecho contra ella, sostené la barra EZ a la altura del hombro. Esta es la posición inicial.",
      "Al inhalar, bajá lentamente la barra hasta que el brazo superior quede extendido y el bíceps completamente estirado.",
      "Al exhalar, usá el bíceps para curvar el peso hacia arriba hasta la contracción completa con la barra a la altura del hombro. Apretá fuerte el bíceps y sostené esta posición un segundo.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "El banco predicador elimina por completo el impulso del hombro.",
    ],
    erroresComunes: [
      "Levantar el pecho del respaldo para ayudar a subir el peso.",
    ],
  },

  "Reverse_Barbell_Curl": {
    nombre: "Curl inverso con barra",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["reverse curl", "curl pronado con barra"],
    instrucciones: [
      "Pararte con el torso erguido sosteniendo una barra al ancho de hombros con los codos cerca del torso. Las palmas deben mirar hacia abajo (agarre pronado). Esta es la posición inicial.",
      "Manteniendo los brazos superiores fijos, curvá el peso mientras contraés el bíceps al exhalar. Solo deben moverse los antebrazos. Continuá el movimiento hasta la contracción completa del bíceps con la barra a la altura del hombro. Sostené la contracción un segundo apretando el músculo.",
      "Comenzá a volver la barra a la posición inicial lentamente mientras inhalás.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "El agarre pronado enfatiza el braquiorradial y el extensor del antebrazo.",
    ],
    erroresComunes: [
      "Usar menos peso del necesario y compensar con balanceo del torso.",
    ],
  },

  "Rocking_Standing_Calf_Raise": {
    nombre: "Elevación de talones de pie con barra (con flexión de tibial)",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["rocking calf raise", "calf raise con flexion de tibial"],
    instrucciones: [
      "Este ejercicio se realiza mejor dentro de un rack de sentadillas por seguridad. Para comenzar, colocá la barra en un rack a la altura que mejor se adapte a tu altura. Una vez elegida la altura correcta y cargada la barra, metete debajo de ella y colocala sobre la parte posterior de los hombros (levemente debajo del cuello).",
      "Sosteniendo la barra con ambos brazos a los costados, levantala del rack empujando con las piernas mientras enderezás el torso al mismo tiempo.",
      "Alejate del rack y colocá las piernas en una postura media al ancho de hombros con las puntas de los pies levemente hacia afuera. Mantené la cabeza arriba en todo momento, ya que mirar hacia abajo te desequilibra. Mantené también la espalda recta y las rodillas con una leve flexión, nunca bloqueadas. Esta es la posición inicial.",
      "Elevá los talones mientras exhalás, extendiendo los tobillos lo más alto posible y contrayendo la pantorrilla. Asegurate de que la rodilla permanezca fija en todo momento; no debe haber flexión adicional en ningún punto. Sostené la contracción un segundo antes de comenzar a bajar.",
      "Volvé lentamente a la posición inicial mientras inhalás, bajando los talones y flexionando los tobillos hasta estirar las pantorrillas.",
      "Ahora elevá las puntas de los pies contrayendo los músculos tibiales en la parte frontal de la pantorrilla mientras exhalás.",
      "Sostené un segundo y volvé a bajarlos mientras inhalás.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "Combina elevación de talón con flexión de tibial anterior para trabajar ambos lados de la pantorrilla.",
    ],
    erroresComunes: [
      "Flexionar la rodilla durante la elevación.",
    ],
  },

  "Seated_Barbell_Twist": {
    nombre: "Giro de torso sentado con barra",
    patron: "Core rotación",
    unilateral: false,
    sinonimos: ["seated barbell twist", "rotacion de torso sentado con barra"],
    instrucciones: [
      "Comenzá sentado al borde de un banco plano con una barra apoyada sobre los muslos. Los pies al ancho de hombros.",
      "Tomá la barra con las palmas hacia abajo, separadas más que el ancho de hombros. Comenzá a levantar la barra por encima de la cabeza hasta que los brazos queden completamente extendidos.",
      "Ahora bajá la barra detrás de la cabeza hasta que descanse sobre la base del cuello. Esta es la posición inicial.",
      "Manteniendo los pies y la cabeza fijos, movés la cintura de un lado al otro para sentir la contracción en los oblicuos. Movete solo hasta donde tu cintura lo permita; estirarte o moverte demasiado puede provocar una lesión. Usá un movimiento lento y controlado.",
      "Recordá exhalar al girar el cuerpo hacia el costado e inhalar al volver a la posición inicial.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "El rango de movimiento debe ser moderado; no es un ejercicio para forzar amplitud.",
    ],
    erroresComunes: [
      "Forzar un rango de movimiento excesivo.",
    ],
  },

  "Seated_Palm-Up_Barbell_Wrist_Curl": {
    nombre: "Curl de muñeca sentado con barra agarre supino",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["seated wrist curl supino"],
    instrucciones: [
      "Sostené una barra con ambas manos, palmas hacia arriba, separadas al ancho de hombros.",
      "Colocá los pies planos en el piso, separados un poco más que el ancho de hombros.",
      "Inclinate hacia adelante y apoyá los antebrazos sobre los muslos superiores con las palmas hacia arriba. El borde frontal de las muñecas debe quedar sobre las rodillas. Esta es la posición inicial.",
      "Bajá la barra lo más posible mientras inhalás y mantenés un agarre firme.",
      "Ahora curvá la barra hacia arriba lo más posible flexionando los antebrazos mientras exhalás. Sostené la contracción un segundo en la parte superior. Solo debe haber movimiento en la muñeca.",
    ],
    puntosClave: [
      "Trabaja los flexores del antebrazo con ambos brazos a la vez.",
    ],
    erroresComunes: [
      "Levantar los antebrazos de los muslos durante el curl.",
    ],
  },

  "Seated_Palms-Down_Barbell_Wrist_Curl": {
    nombre: "Curl de muñeca sentado con barra agarre pronado",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["seated wrist curl pronado"],
    instrucciones: [
      "Sostené una barra con ambas manos, palmas hacia abajo, separadas al ancho de hombros.",
      "Colocá los pies planos en el piso, separados un poco más que el ancho de hombros.",
      "Inclinate hacia adelante y apoyá los antebrazos sobre los muslos superiores con las palmas hacia abajo. El dorso de las muñecas debe quedar sobre las rodillas. Esta es la posición inicial.",
      "Bajá la barra lo más posible mientras inhalás y mantenés un agarre firme.",
      "Ahora curvá la barra hacia arriba lo más posible flexionando los antebrazos mientras exhalás. Sostené la contracción un segundo en la parte superior. Solo debe haber movimiento en la muñeca.",
    ],
    puntosClave: [
      "Trabaja los extensores del antebrazo con ambos brazos a la vez.",
    ],
    erroresComunes: [
      "Levantar los antebrazos de los muslos durante el curl.",
    ],
  },

  "Smith_Incline_Shoulder_Raise": {
    nombre: "Elevación de hombros en banco inclinado con máquina Smith",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["smith machine incline shoulder raise"],
    instrucciones: [
      "Colocá un banco inclinado debajo de la máquina Smith. Ajustá la barra a una altura que puedas alcanzar acostado con los brazos casi completamente extendidos. Una vez seleccionado el peso necesario, acostáte en el banco inclinado y asegurate de que los hombros queden alineados justo debajo de la barra.",
      "Usando un agarre pronado (palmas hacia adelante) al ancho de hombros, levantá la barra del rack y sostenela en línea recta sobre vos con una leve flexión en los codos. Esta es la posición inicial.",
      "Al exhalar, elevá la barra hasta que los brazos queden completamente extendidos. La contracción debe sentirse alrededor de los hombros.",
      "Después de una pausa de un segundo, volvé la barra a la posición inicial mientras inhalás.",
      "Repetí el movimiento las veces indicadas.",
      "Al terminar, colocá la barra de vuelta en el rack.",
    ],
    puntosClave: [
      "La guía fija de la máquina Smith permite enfocarse exclusivamente en el omóplato.",
    ],
    erroresComunes: [
      "Flexionar los codos durante el movimiento.",
    ],
  },

  "Standing_Barbell_Calf_Raise": {
    nombre: "Elevación de talones de pie con barra",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["standing calf raise con barra"],
    instrucciones: [
      "Este ejercicio se realiza mejor dentro de un rack de sentadillas por seguridad. Para comenzar, colocá la barra en un rack a la altura que mejor se adapte a tu altura. Una vez elegida la altura correcta y cargada la barra, metete debajo de ella y colocala sobre la parte posterior de los hombros (levemente debajo del cuello).",
      "Sosteniendo la barra con ambos brazos a los costados, levantala del rack empujando con las piernas mientras enderezás el torso al mismo tiempo.",
      "Alejate del rack y colocá las piernas en una postura media al ancho de hombros con las puntas de los pies levemente hacia afuera. Mantené la cabeza arriba en todo momento y la espalda recta. Las rodillas deben mantener una leve flexión, nunca bloqueadas. Esta es la posición inicial. Para mejor rango de movimiento, podés colocar la parte delantera de los pies sobre un bloque de madera, pero tené cuidado: esta opción requiere más equilibrio y un bloque firme.",
      "Elevá los talones mientras exhalás, extendiendo los tobillos lo más alto posible y contrayendo la pantorrilla. Asegurate de que la rodilla permanezca fija en todo momento; no debe haber flexión adicional. Sostené la contracción un segundo antes de comenzar a bajar.",
      "Volvé lentamente a la posición inicial mientras inhalás, bajando los talones y flexionando los tobillos hasta estirar las pantorrillas.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "Las rodillas permanecen con una leve flexión fija; no se bloquean ni se mueven adicionalmente.",
    ],
    erroresComunes: [
      "Bloquear completamente las rodillas durante el ejercicio.",
    ],
  },

  "Standing_Bradford_Press": {
    nombre: "Press Bradford de pie",
    patron: "Empuje vertical",
    unilateral: false,
    sinonimos: ["bradford press de pie"],
    instrucciones: [
      "Colocá una barra cargada a la altura del hombro en un rack. Con agarre pronado al ancho de hombros, comenzá con la barra apoyada en la parte frontal de los hombros. Esta es la posición inicial.",
      "Iniciá el levantamiento extendiendo los codos para presionar la barra por encima de la cabeza. Evitá bloquear completamente el codo mientras movés el peso hacia atrás de la cabeza.",
      "Bajá la barra hacia la parte posterior de la cabeza hasta que el codo forme un ángulo recto.",
      "Subí la barra de nuevo por encima de la cabeza extendiendo los codos.",
      "Bajá la barra a la posición inicial (al frente).",
      "Alterná de esta manera hasta completar las repeticiones indicadas.",
    ],
    puntosClave: [
      "El codo nunca se bloquea completamente, manteniendo tensión constante en el deltoide.",
    ],
    erroresComunes: [
      "Bloquear el codo arriba, perdiendo la tensión continua.",
    ],
  },

  "Standing_Military_Press": {
    nombre: "Press militar de pie con barra",
    patron: "Empuje vertical",
    unilateral: false,
    sinonimos: ["military press de pie", "press militar clasico"],
    instrucciones: [
      "Comenzá colocando una barra a la altura del pecho en un rack de sentadillas. Una vez elegido el peso, tomá la barra con agarre pronado (palmas hacia adelante), más ancho que el ancho de hombros.",
      "Flexioná levemente las rodillas y colocá la barra sobre la clavícula. Levantá la barra manteniéndola apoyada en el pecho. Dá un paso atrás y colocá los pies al ancho de hombros.",
      "Una vez que tomaste la barra con el agarre correcto, levantala por encima de la cabeza bloqueando los brazos. Sostenela a la altura del hombro y levemente al frente de la cabeza. Esta es la posición inicial.",
      "Bajá la barra lentamente hacia la clavícula mientras inhalás.",
      "Subí la barra de vuelta a la posición inicial mientras exhalás.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "El ejercicio base de fuerza de hombro: sin ayuda de piernas, técnica estricta.",
    ],
    erroresComunes: [
      "Arquear la espalda baja para ayudar a empujar.",
    ],
  },

  "Standing_Overhead_Barbell_Triceps_Extension": {
    nombre: "Extensión de tríceps de pie sobre cabeza con barra",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["overhead triceps extension con barra", "french press de pie"],
    instrucciones: [
      "Para comenzar, pararte sosteniendo una barra o barra EZ con agarre pronado (palmas hacia adelante), con las manos más cerca que el ancho de hombros. Los pies al ancho de hombros aproximadamente.",
      "Ahora elevá la barra por encima de la cabeza hasta que los brazos queden completamente extendidos. Mantené los codos adentro. Esta es la posición inicial.",
      "Manteniendo los brazos superiores cerca de la cabeza y los codos adentro, perpendiculares al piso, bajá la resistencia en un movimiento semicircular detrás de la cabeza hasta que los antebrazos toquen el bíceps. Los brazos superiores permanecen fijos; solo se mueven los antebrazos. Inhalá durante este paso.",
      "Volvé a la posición inicial usando el tríceps para subir la barra. Exhalá durante este paso.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "Los codos apuntan al techo y permanecen fijos en todo momento.",
    ],
    erroresComunes: [
      "Abrir los codos hacia afuera al bajar.",
    ],
  },

  "Standing_Palms-Up_Barbell_Behind_The_Back_Wrist_Curl": {
    nombre: "Curl de muñeca de pie detrás de la espalda agarre supino",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["wrist curl detras de la espalda"],
    instrucciones: [
      "Comenzá de pie sosteniendo una barra detrás de los glúteos a extensión de brazos, con agarre pronado (las palmas mirarán hacia atrás, alejadas de los glúteos) y las manos al ancho de hombros.",
      "Mirá hacia adelante con los pies al ancho de hombros. Esta es la posición inicial.",
      "Al exhalar, elevá lentamente la barra curvando la muñeca en un movimiento semicircular hacia el techo. Solo la muñeca debe moverse en este ejercicio.",
      "Sostené la contracción un segundo y bajá la barra a la posición inicial mientras inhalás.",
      "Repetí las veces indicadas.",
      "Al terminar, bajá la barra al rack o al piso flexionando las rodillas. Lo más fácil es tomarla de un rack o que un compañero te la entregue.",
    ],
    puntosClave: [
      "La posición detrás de la espalda aísla aún más la muñeca sin ayuda visual.",
    ],
    erroresComunes: [
      "Mover los brazos en lugar de aislar la muñeca.",
    ],
  },

  "Stiff_Leg_Barbell_Good_Morning": {
    nombre: "Good morning piernas rígidas con barra",
    patron: "Dominante de cadera",
    unilateral: false,
    sinonimos: ["good morning con barra", "stiff leg good morning"],
    instrucciones: [
      "Este ejercicio se realiza mejor dentro de un rack de sentadillas por seguridad. Para comenzar, colocá la barra en un rack a la altura que mejor se adapte a tu altura. Una vez elegida la altura correcta y cargada la barra, metete debajo de ella y colocá la parte posterior de los hombros (levemente debajo del cuello) bajo la barra.",
      "Sosteniendo la barra con ambos brazos a los costados, levantala del rack empujando con las piernas mientras enderezás el torso al mismo tiempo.",
      "Alejate del rack y colocá las piernas en una postura media al ancho de hombros. Mantené la cabeza arriba en todo momento, ya que mirar hacia abajo te desequilibra, y mantené la espalda recta. Esta es la posición inicial.",
      "Manteniendo las piernas fijas, llevá el torso hacia adelante flexionando desde la cadera mientras inhalás. Bajá el torso hasta que quede paralelo al piso.",
      "Comenzá a subir la barra mientras exhalás, elevando el torso de vuelta a la posición inicial.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "Las piernas permanecen prácticamente fijas; todo el movimiento viene de la cadera.",
    ],
    erroresComunes: [
      "Redondear la espalda baja al bajar el torso.",
    ],
  },

  "Straight_Bar_Bench_Mid_Rows": {
    nombre: "Remo medio en banco con barra recta",
    patron: "Tracción horizontal",
    unilateral: false,
    sinonimos: ["bench mid row", "remo en banco con barra"],
    instrucciones: [
      "Colocá una barra cargada en el extremo de un banco. Parado sobre el banco detrás de la barra, tomala con un agarre medio y pronado. Pararte con las caderas hacia atrás y el pecho arriba, manteniendo la columna neutra. Esta es la posición inicial.",
      "Remá la barra hacia el torso retrayendo los omóplatos y flexionando los codos. Usá un movimiento controlado, sin tirones.",
      "Después de una breve pausa, volvé lentamente la barra a la posición inicial, asegurándote de bajar completamente.",
    ],
    puntosClave: [
      "Pararse sobre el banco eleva la barra para un mejor ángulo de tirón.",
    ],
    erroresComunes: [
      "Tirar con impulso en lugar de un movimiento controlado.",
    ],
  },

  "Straight_Raises_on_Incline_Bench": {
    nombre: "Elevación de brazos rectos en banco inclinado",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["straight arm raise incline"],
    instrucciones: [
      "Colocá una barra en el piso, detrás de la cabecera de un banco inclinado.",
      "Acostáte en el banco boca abajo. Con agarre pronado, levantá la barra del piso manteniendo los brazos rectos. Dejá que la barra cuelgue derecho hacia abajo. Esta es la posición inicial.",
      "Para comenzar, elevá la barra al frente de tu cabeza manteniendo los brazos extendidos.",
      "Volvé a la posición inicial.",
    ],
    puntosClave: [
      "Los brazos permanecen completamente rectos durante todo el arco de movimiento.",
    ],
    erroresComunes: [
      "Flexionar los codos para facilitar la elevación.",
    ],
  },

  "T-Bar_Row_with_Handle": {
    nombre: "Remo T-bar con manija",
    patron: "Tracción horizontal",
    unilateral: false,
    sinonimos: ["t bar row con manija", "remo en v landmine"],
    instrucciones: [
      "Colocá una barra en un soporte landmine o en un rincón para que no se mueva. Cargá el peso adecuado en tu extremo.",
      "Pararte sobre la barra y colocá una manija tipo 'Double D' alrededor de la barra, junto al collar. Usando las caderas y las piernas, ponete de pie.",
      "Adoptá una postura amplia con las caderas hacia atrás y el pecho arriba. Los brazos deben estar extendidos. Esta es la posición inicial.",
      "Tirá del peso hacia el abdomen superior retrayendo los omóplatos y flexionando los codos. No tirones ni hagas trampa durante el movimiento.",
      "Después de una breve pausa, volvé a la posición inicial.",
    ],
    puntosClave: [
      "La manija en V permite un agarre neutro más cómodo que la barra recta.",
    ],
    erroresComunes: [
      "Redondear la espalda baja al inclinarse.",
    ],
  },

  "Upright_Barbell_Row": {
    nombre: "Remo al mentón con barra",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["upright row", "remo vertical con barra"],
    instrucciones: [
      "Tomá una barra con agarre pronado levemente más cerrado que el ancho de hombros. La barra debe descansar sobre la parte superior de los muslos con los brazos extendidos y una leve flexión en los codos. La espalda también debe estar recta. Esta es la posición inicial.",
      "Ahora exhalá y usá los laterales de los hombros para levantar la barra, elevando los codos hacia arriba y hacia los costados. Mantené la barra cerca del cuerpo al subirla. Continuá elevando la barra hasta que casi toque el mentón. El codo guía el movimiento y siempre debe quedar más alto que el antebrazo. Mantenés el torso fijo y pausás un segundo en la parte superior del movimiento.",
      "Bajá la barra lentamente a la posición inicial mientras inhalás.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "El codo siempre va más alto que el antebrazo durante la subida.",
    ],
    erroresComunes: [
      "Subir la barra demasiado alto generando pinzamiento en el hombro.",
    ],
  },

  "Wide-Grip_Standing_Barbell_Curl": {
    nombre: "Curl de pie con barra agarre ancho",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["wide grip barbell curl"],
    instrucciones: [
      "Pararte con el torso erguido sosteniendo una barra por las manijas externas anchas. Las palmas deben mirar hacia adelante. Los codos cerca del torso. Esta es la posición inicial.",
      "Manteniendo los brazos superiores fijos, curvá el peso hacia adelante contrayendo el bíceps mientras exhalás. Solo deben moverse los antebrazos.",
      "Continuá el movimiento hasta que el bíceps esté completamente contraído y la barra a la altura del hombro. Sostené la contracción un segundo y apretá fuerte el bíceps.",
      "Comenzá a volver la barra a la posición inicial lentamente mientras inhalás.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "El agarre ancho enfatiza la cabeza corta (interna) del bíceps.",
    ],
    erroresComunes: [
      "Balancear los brazos para ayudar a subir el peso.",
    ],
  },

  "Wrist_Rotations_with_Straight_Bar": {
    nombre: "Rotaciones de muñeca con barra recta",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["wrist rotations barra", "rotacion de muñeca tipo enrollado"],
    instrucciones: [
      "Sostené una barra con ambas manos, palmas hacia abajo, separadas al ancho de hombros. Esta es la posición inicial.",
      "Alternando entre cada mano, ejecutá el movimiento extendiendo la muñeca como si estuvieras enrollando un diario. Seguí alternando de un lado al otro hasta el fallo.",
      "Revertí el movimiento flexionando la muñeca, enrollando hacia el lado opuesto. Continuá el movimiento alternado hasta el fallo.",
    ],
    puntosClave: [
      "Simula el movimiento de enrollar algo con las manos, trabajando ambos lados del antebrazo.",
    ],
    erroresComunes: [
      "Mover el antebrazo entero en lugar de aislar la muñeca.",
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
console.log(`✅ Lote 15 aplicado — ${nuevasAgregadas} entradas nuevas agregadas.`);
