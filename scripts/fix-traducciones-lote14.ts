/**
 * Lote 14 — 30 NUEVAS traducciones (barbell beginner, tanda 1).
 * Primera tanda del equipo "barbell" (170 ejercicios en FEDB).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const FILE = resolve("scripts/data/traducciones-fedb.es.json");
const t = JSON.parse(readFileSync(FILE, "utf8"));

const nuevos: Record<string, object> = {

  "Anti-Gravity_Press": {
    nombre: "Press antigravedad",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["anti gravity press", "reverse curl press"],
    instrucciones: [
      "Colocá una barra en el piso, detrás de la cabecera de un banco inclinado.",
      "Acostáte en el banco boca abajo. Con agarre pronado, levantá la barra del piso. Flexioná los codos haciendo un curl inverso para llevar la barra cerca del pecho. Esta es la posición inicial.",
      "Para comenzar, presioná la barra hacia adelante frente a tu cabeza extendiendo los codos. Mantenés los brazos paralelos al piso durante todo el movimiento.",
      "Volvé a la posición inicial y repetí para completar la serie.",
    ],
    puntosClave: [
      "Combina un curl inverso con un press, sumando trabajo de antebrazo y deltoide.",
    ],
    erroresComunes: [
      "Dejar caer los brazos por debajo de la horizontal durante el press.",
    ],
  },

  "Barbell_Bench_Press_-_Medium_Grip": {
    nombre: "Press de banca con barra agarre medio",
    patron: "Empuje horizontal",
    unilateral: false,
    sinonimos: ["bench press agarre medio", "press de banca clasico"],
    instrucciones: [
      "Acostáte en un banco plano. Usando un agarre de ancho medio (que crea un ángulo de 90° entre antebrazo y brazo superior a la mitad del movimiento), levantá la barra del rack y sostenela en línea recta sobre vos con los brazos bloqueados. Esta es la posición inicial.",
      "Desde la posición inicial, inhalá y comenzá a bajar lentamente hasta que la barra toque el centro del pecho.",
      "Después de una breve pausa, empujá la barra de vuelta a la posición inicial mientras exhalás. Concentráte en empujar la barra usando los músculos del pecho. Bloqueá los brazos y apretá el pecho en la posición contraída arriba, sostené un segundo y comenzá a bajar lentamente de nuevo. Idealmente, bajar el peso debería llevar el doble de tiempo que subirlo.",
      "Repetí el movimiento las veces indicadas.",
      "Al terminar, colocá la barra de vuelta en el rack.",
    ],
    puntosClave: [
      "El descenso controlado (el doble de tiempo que la subida) maximiza la tensión muscular.",
    ],
    erroresComunes: [
      "Rebotar la barra sobre el pecho en lugar de pausar.",
    ],
  },

  "Barbell_Curl": {
    nombre: "Curl de bíceps con barra",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["barbell curl", "curl de biceps clasico"],
    instrucciones: [
      "Pararte con el torso erguido sosteniendo una barra con agarre al ancho de hombros. Las palmas deben mirar hacia adelante y los codos cerca del torso. Esta es la posición inicial.",
      "Manteniendo los brazos superiores fijos, curvá el peso hacia adelante contrayendo el bíceps mientras exhalás. Solo deben moverse los antebrazos.",
      "Continuá el movimiento hasta que el bíceps esté completamente contraído y la barra a la altura del hombro. Sostené la contracción un segundo y apretá fuerte el bíceps.",
      "Comenzá a volver la barra a la posición inicial lentamente mientras inhalás.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "El ejercicio base de bíceps: solo el antebrazo se mueve, el brazo superior permanece fijo.",
    ],
    erroresComunes: [
      "Usar impulso del torso o las caderas para subir la barra.",
    ],
  },

  "Barbell_Curls_Lying_Against_An_Incline": {
    nombre: "Curl con barra acostado en banco inclinado",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["incline barbell curl acostado"],
    instrucciones: [
      "Acostáte contra un banco inclinado, sosteniendo una barra con los brazos colgando en línea horizontal. Esta es la posición inicial.",
      "Manteniendo los brazos superiores fijos, curvá el peso lo más alto posible mientras apretás el bíceps. Exhalá durante esta parte del movimiento. Solo deben moverse los antebrazos; no balancees los brazos.",
      "Después de una contracción de un segundo, volvé lentamente a la posición inicial mientras inhalás. Asegurate de bajar completamente.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "El respaldo del banco inclinado elimina por completo el impulso del torso.",
    ],
    erroresComunes: [
      "No bajar completamente la barra entre repeticiones.",
    ],
  },

  "Barbell_Incline_Bench_Press_-_Medium_Grip": {
    nombre: "Press inclinado con barra agarre medio",
    patron: "Empuje horizontal",
    unilateral: false,
    sinonimos: ["incline bench press agarre medio"],
    instrucciones: [
      "Acostáte en un banco inclinado. Usando un agarre de ancho medio (que crea un ángulo de 90° entre antebrazo y brazo superior a la mitad del movimiento), levantá la barra del rack y sostenela en línea recta sobre vos con los brazos bloqueados. Esta es la posición inicial.",
      "Mientras inhalás, bajá lentamente hasta sentir la barra en la parte superior del pecho.",
      "Después de una pausa de un segundo, volvé la barra a la posición inicial mientras exhalás y empujás con los músculos del pecho. Bloqueá los brazos en la posición contraída, apretá el pecho, sostené un segundo y comenzá a bajar lentamente de nuevo. Debería llevar al menos el doble de tiempo bajar que subir.",
      "Repetí el movimiento las veces indicadas.",
      "Al terminar, colocá la barra de vuelta en el rack.",
    ],
    puntosClave: [
      "El ángulo del banco inclinado enfatiza la parte superior del pectoral.",
    ],
    erroresComunes: [
      "Bajar la barra hacia el cuello en lugar del pecho superior.",
    ],
  },

  "Barbell_Incline_Shoulder_Raise": {
    nombre: "Elevación de hombros en banco inclinado con barra",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["incline shoulder raise con barra"],
    instrucciones: [
      "Acostáte en un banco inclinado. Usando un agarre de ancho medio (levemente más ancho que el hombro), levantá la barra del rack y sostenela en línea recta sobre vos con los brazos extendidos. Esta es la posición inicial.",
      "Manteniendo los brazos rectos, elevá la barra protrayendo los omóplatos, levantando los hombros del banco mientras exhalás.",
      "Volvé la barra a la posición inicial mientras inhalás.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "Los brazos permanecen bloqueados; el movimiento viene de elevar el omóplato, no del hombro.",
    ],
    erroresComunes: [
      "Flexionar los codos durante el movimiento.",
    ],
  },

  "Barbell_Rear_Delt_Row": {
    nombre: "Remo al pecho con barra para deltoide posterior",
    patron: "Tracción horizontal",
    unilateral: false,
    sinonimos: ["rear delt row con barra", "remo invertido"],
    instrucciones: [
      "Pararte derecho sosteniendo una barra con agarre ancho (más que el ancho de hombros) y pronado (palmas hacia el cuerpo).",
      "Flexioná levemente las rodillas e inclinate hacia adelante manteniendo la curvatura natural de la espalda. Dejá que los brazos cuelguen frente a vos sosteniendo la barra. Una vez que el torso quede paralelo al piso, abrí los codos hacia afuera del cuerpo. El torso y los brazos deben asemejarse a la letra 'T'. Ahora estás listo para comenzar el ejercicio.",
      "Manteniendo los brazos superiores perpendiculares al torso, tirá la barra hacia el pecho superior mientras apretás el deltoide posterior y exhalás. Cuando se ejecuta correctamente, este ejercicio se parece a un press de banca invertido. No uses el bíceps para hacer el trabajo; enfocáte en el deltoide posterior, los brazos solo deben actuar como ganchos.",
      "Volvé lentamente a la posición inicial mientras inhalás.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "Los brazos actúan solo como ganchos; todo el trabajo lo hace el deltoide posterior.",
    ],
    erroresComunes: [
      "Usar el bíceps en lugar del deltoide posterior para tirar.",
    ],
  },

  "Barbell_Seated_Calf_Raise": {
    nombre: "Elevación de talones sentado con barra",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["seated calf raise con barra"],
    instrucciones: [
      "Colocá un bloque a unos 30 cm frente a un banco plano.",
      "Sentáte en el banco y apoyá la parte delantera de los pies sobre el bloque.",
      "Pedile a alguien que coloque una barra sobre tus muslos superiores, a unos 7 cm por encima de las rodillas, y la sostenga ahí. Esta es la posición inicial.",
      "Elevá los talones lo más alto posible mientras apretás las pantorrillas y exhalás.",
      "Después de una contracción de un segundo, volvé lentamente a la posición inicial. Para máximo beneficio, estirá las pantorrillas lo más posible al bajar.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "Necesita un ayudante para colocar la barra sobre los muslos con seguridad.",
    ],
    erroresComunes: [
      "No estirar completamente la pantorrilla al bajar.",
    ],
  },

  "Barbell_Shrug": {
    nombre: "Encogimiento de hombros con barra",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["barbell shrug", "shrug con barra"],
    instrucciones: [
      "Pararte derecho con los pies al ancho de hombros sosteniendo una barra con ambas manos frente a vos, agarre pronado (palmas hacia los muslos). Las manos deben estar un poco más separadas que el ancho de hombros. Podés usar muñequeras para mejorar el agarre. Esta es la posición inicial.",
      "Elevá los hombros lo más alto posible mientras exhalás y sostené la contracción un segundo. No intentes levantar la barra usando el bíceps.",
      "Volvé lentamente a la posición inicial mientras inhalás.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "El movimiento es solo de elevación de hombros; los codos permanecen extendidos en todo momento.",
    ],
    erroresComunes: [
      "Flexionar los codos para ayudar a levantar la barra.",
    ],
  },

  "Barbell_Shrug_Behind_The_Back": {
    nombre: "Encogimiento de hombros con barra detrás de la espalda",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["shrug detras de la espalda"],
    instrucciones: [
      "Pararte derecho con los pies al ancho de hombros sosteniendo una barra con ambas manos detrás de la espalda, agarre pronado (palmas hacia atrás). Las manos deben estar un poco más separadas que el ancho de hombros. Podés usar muñequeras para mejor agarre. Esta es la posición inicial.",
      "Elevá los hombros lo más alto posible mientras exhalás y sostené la contracción un segundo. No intentes levantar la barra usando el bíceps. Los brazos deben permanecer extendidos en todo momento.",
      "Volvé lentamente a la posición inicial mientras inhalás.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "La posición detrás de la espalda enfatiza la porción media del trapecio.",
    ],
    erroresComunes: [
      "Rotar los hombros en lugar de solo elevarlos.",
    ],
  },

  "Barbell_Side_Bend": {
    nombre: "Flexión lateral de torso con barra",
    patron: "Core anti-rotación",
    unilateral: true,
    sinonimos: ["barbell side bend", "flexion lateral con barra"],
    instrucciones: [
      "Pararte derecho sosteniendo una barra apoyada sobre la parte posterior de los hombros (levemente debajo del cuello). Los pies al ancho de hombros. Esta es la posición inicial.",
      "Manteniendo la espalda recta y la cabeza arriba, doblate solo desde la cintura hacia la derecha tanto como sea posible. Inhalá al inclinarte hacia el costado. Sostené un segundo y volvé a la posición inicial mientras exhalás. Mantenés el resto del cuerpo fijo.",
      "Ahora repetí el movimiento pero inclinándote hacia la izquierda. Sostené un segundo y volvé a la posición inicial.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "El resto del cuerpo permanece fijo; el movimiento es exclusivamente de flexión lateral del torso.",
    ],
    erroresComunes: [
      "Rotar las caderas durante la flexión lateral.",
    ],
  },

  "Barbell_Side_Split_Squat": {
    nombre: "Sentadilla lateral dividida con barra",
    patron: "Zancada / unilateral",
    unilateral: true,
    sinonimos: ["side split squat con barra"],
    instrucciones: [
      "Pararte derecho sosteniendo una barra apoyada sobre la parte posterior de los hombros (levemente debajo del cuello). Los pies deben estar muy separados, con el pie de la pierna delantera angulado hacia el costado. Esta es la posición inicial.",
      "Bajá el cuerpo hacia el lado del pie angulado flexionando la rodilla y la cadera de esa pierna, manteniendo la pierna contraria solo levemente flexionada. Inhalá al bajar.",
      "Volvé a la posición inicial extendiendo la cadera y la rodilla de la pierna delantera. Exhalá durante este movimiento.",
      "Después de completar las repeticiones indicadas, repetí el movimiento con la pierna contraria.",
    ],
    puntosClave: [
      "La pierna contraria permanece casi recta, actuando como apoyo lateral.",
    ],
    erroresComunes: [
      "Dejar que la rodilla de la pierna que trabaja colapse hacia adentro.",
    ],
  },

  "Barbell_Squat": {
    nombre: "Sentadilla con barra",
    patron: "Dominante de rodilla",
    unilateral: false,
    sinonimos: ["back squat", "sentadilla trasera con barra"],
    instrucciones: [
      "Este ejercicio se realiza mejor dentro de un rack de sentadillas por seguridad. Para comenzar, colocá la barra en el rack justo debajo de la altura del hombro. Una vez elegida la altura correcta y cargada la barra, metete debajo de ella y colocá la parte posterior de los hombros (levemente debajo del cuello) bajo la barra.",
      "Sosteniendo la barra con ambos brazos a los costados, levantala del rack empujando con las piernas mientras enderezás el torso al mismo tiempo.",
      "Alejate del rack y colocá las piernas en una postura media al ancho de hombros con las puntas de los pies levemente hacia afuera. Mantené la cabeza arriba en todo momento y la espalda recta. Esta es la posición inicial.",
      "Comenzá a bajar la barra lentamente flexionando rodillas y caderas mientras mantenés la postura recta y la cabeza arriba. Continuá bajando hasta que el ángulo entre el muslo y la pantorrilla sea levemente menor a 90°. Inhalá durante esta parte. Si la ejecución es correcta, el frente de las rodillas debe formar una línea recta imaginaria con los dedos de los pies, perpendicular al frente. Si las rodillas sobrepasan esa línea (más allá de los dedos), estás generando estrés innecesario en la rodilla.",
      "Comenzá a subir la barra mientras exhalás, empujando el piso con el talón mientras extendés las piernas y volvés a la posición inicial.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "Las rodillas no deben sobrepasar la línea de los dedos de los pies.",
    ],
    erroresComunes: [
      "Redondear la espalda baja al bajar.",
      "Mirar hacia abajo perdiendo el equilibrio.",
    ],
  },

  "Barbell_Walking_Lunge": {
    nombre: "Zancada caminando con barra",
    patron: "Zancada / unilateral",
    unilateral: true,
    sinonimos: ["walking lunge con barra"],
    instrucciones: [
      "Comenzá de pie con los pies al ancho de hombros y una barra apoyada en la parte alta de la espalda.",
      "Dá un paso adelante con una pierna, flexionando las rodillas para bajar las caderas. Descendé hasta que la rodilla trasera casi toque el piso. Mantenés la postura erguida y la rodilla delantera siempre por encima del pie delantero.",
      "Empujando con el talón del pie delantero, extendé ambas rodillas para volver a subir.",
      "Dá un paso adelante con el pie trasero, repitiendo la zancada con la pierna contraria.",
    ],
    puntosClave: [
      "Cada paso avanza hacia adelante en lugar de volver a la posición inicial, como caminar en zancadas.",
    ],
    erroresComunes: [
      "Dejar que la rodilla delantera sobrepase la punta del pie.",
    ],
  },

  "Bent_Over_Barbell_Row": {
    nombre: "Remo con barra inclinado",
    patron: "Tracción horizontal",
    unilateral: false,
    sinonimos: ["bent over row", "remo con barra"],
    instrucciones: [
      "Sosteniendo una barra con agarre pronado (palmas hacia abajo), flexioná levemente las rodillas y llevá el torso hacia adelante doblándote desde la cintura, manteniendo la espalda recta hasta casi paralela al piso. Mantené la cabeza arriba. La barra debe colgar directamente frente a vos con los brazos perpendiculares al piso y al torso. Esta es la posición inicial.",
      "Ahora, manteniendo el torso fijo, exhalá y tirá la barra hacia vos. Mantené los codos cerca del cuerpo y usá solo los antebrazos para sostener el peso. En la posición contraída arriba, apretá los músculos de la espalda y sostené una breve pausa.",
      "Luego inhalá y bajá lentamente la barra a la posición inicial.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "El ejercicio base de remo con barra: la espalda permanece recta y el torso fijo durante todo el movimiento.",
    ],
    erroresComunes: [
      "Redondear la espalda baja.",
      "Levantarse con el torso para ayudar a tirar.",
    ],
  },

  "Bent_Over_One-Arm_Long_Bar_Row": {
    nombre: "Remo unilateral con barra larga anclada",
    patron: "Tracción horizontal",
    unilateral: true,
    sinonimos: ["t bar row improvisado", "long bar row un brazo"],
    instrucciones: [
      "Colocá peso en uno de los extremos de una barra olímpica. Asegurate de colocar el otro extremo de la barra en el rincón entre dos paredes, o poné un objeto pesado en el piso para que la barra no se deslice hacia atrás.",
      "Inclinate hacia adelante hasta que el torso quede lo más paralelo posible al piso, manteniendo las rodillas levemente flexionadas.",
      "Ahora tomá la barra con un brazo, justo detrás de los discos del lado donde colocaste el peso, y apoyá la otra mano en la rodilla. Esta es la posición inicial.",
      "Tirá de la barra hacia arriba en línea recta con el codo pegado al cuerpo (para maximizar el estímulo de la espalda) hasta que los discos toquen la parte inferior del pecho. Apretá los músculos de la espalda al subir el peso y sostené un segundo arriba. Exhalá al levantar el peso. No dejes que el torso se balancee; solo el brazo debe moverse.",
      "Bajá lentamente la barra a la posición inicial, sintiendo un buen estiramiento en el dorsal. No dejes que los discos toquen el piso. Para asegurar el mejor rango de movimiento, se recomiendan discos pequeños (de 11 kg) en lugar de discos grandes (de 16-20 kg).",
      "Repetí las veces indicadas y cambiá de brazo.",
    ],
    puntosClave: [
      "El anclaje en una esquina convierte una barra olímpica en un improvisado T-bar row.",
    ],
    erroresComunes: [
      "Balancear el torso para ayudar a tirar del peso.",
    ],
  },

  "Bradford_Rocky_Presses": {
    nombre: "Press Bradford (Rocky)",
    patron: "Empuje vertical",
    unilateral: false,
    sinonimos: ["bradford press", "rocky press"],
    instrucciones: [
      "Sentáte en un banco de press militar con la barra a la altura del hombro, agarre pronado (palmas hacia adelante). Tu agarre debe ser más ancho que el ancho de hombros y debe crear un ángulo de 90° entre antebrazo y brazo superior mientras la barra baja. Esta es la posición inicial.",
      "Una vez que tomes la barra con el agarre correcto, levantala por encima de la cabeza bloqueando los brazos.",
      "Ahora bajá la barra lentamente hacia la parte posterior de la cabeza mientras inhalás.",
      "Subí la barra de vuelta a la posición de bloqueo mientras exhalás.",
      "Bajá la barra a la posición inicial (al frente) lentamente mientras inhalás. Esta es una repetición.",
      "Alterná de esta manera hasta completar las repeticiones indicadas.",
    ],
    puntosClave: [
      "La barra alterna entre la parte frontal y posterior de la cabeza sin bloquear completamente arriba en cada vez.",
    ],
    erroresComunes: [
      "Tocar el cuello con la barra al bajarla atrás.",
    ],
  },

  "Car_Drivers": {
    nombre: "Car drivers (rotación de muñeca con disco)",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["car drivers", "rotacion de muñeca tipo volante"],
    instrucciones: [
      "De pie y erguido, sostené un disco de barra con ambas manos en las posiciones de las 3 y las 9 en punto. Las palmas deben mirarse entre sí y los brazos extendidos al frente. Esta es la posición inicial.",
      "Iniciá el movimiento rotando el disco lo más posible hacia un lado, como si giraras un volante.",
      "Revertí el movimiento, girando completamente hacia el lado opuesto.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "Trabaja la rotación de muñeca y el antebrazo de forma específica.",
    ],
    erroresComunes: [
      "Mover los brazos en lugar de rotar solo las muñecas.",
    ],
  },

  "Clean_Deadlift": {
    nombre: "Peso muerto de cargada (clean deadlift)",
    patron: "Dominante de cadera",
    unilateral: false,
    sinonimos: ["clean deadlift", "deadlift de halterofilia"],
    instrucciones: [
      "Comenzá de pie con la barra cerca de las tibias. Los pies deben quedar directamente debajo de las caderas, con las puntas levemente hacia afuera. Tomá la barra con agarre doble pronado o agarre de gancho, al ancho de hombros. Hacé una sentadilla hacia la barra. La columna debe estar en extensión completa, con un ángulo de espalda que ubique los hombros por delante de la barra y la espalda lo más vertical posible.",
      "Comenzá empujando el piso a través de la parte delantera de los talones. Mientras la barra sube, mantené un ángulo de espalda constante. Abrí las rodillas hacia los costados para mantenerlas fuera del camino de la barra.",
      "Después de que la barra pase las rodillas, completá el levantamiento empujando las caderas hacia la barra hasta que caderas y rodillas queden extendidas.",
    ],
    puntosClave: [
      "El ángulo de espalda permanece constante durante todo el levantamiento, a diferencia del deadlift convencional.",
    ],
    erroresComunes: [
      "Cambiar el ángulo de espalda a mitad del levantamiento.",
    ],
  },

  "Clean_Shrug": {
    nombre: "Encogimiento de cargada (clean shrug)",
    patron: "Dominante de cadera",
    unilateral: false,
    sinonimos: ["clean shrug", "shrug de halterofilia"],
    instrucciones: [
      "Comenzá con agarre doble pronado o de gancho al ancho de hombros, con la barra colgando a la altura media del muslo. La espalda recta e inclinada levemente hacia adelante.",
      "Encogé los hombros hacia las orejas. Aunque este ejercicio normalmente puede cargarse con más peso que una cargada completa, evitá sobrecargar hasta el punto de que la ejecución se vuelva lenta.",
    ],
    puntosClave: [
      "Es la fase final de la cargada de halterofilia, aislada para entrenar la explosividad del trapecio.",
    ],
    erroresComunes: [
      "Sobrecargar tanto que el movimiento se vuelve lento y pierde el propósito explosivo.",
    ],
  },

  "Close-Grip_Barbell_Bench_Press": {
    nombre: "Press de banca con agarre cerrado",
    patron: "Empuje horizontal",
    unilateral: false,
    sinonimos: ["close grip bench press", "press cerrado con barra"],
    instrucciones: [
      "Acostáte en un banco plano. Usando un agarre cerrado (alrededor del ancho de hombros), levantá la barra del rack y sostenela en línea recta sobre vos con los brazos bloqueados. Esta es la posición inicial.",
      "Mientras inhalás, bajá lentamente hasta sentir la barra en el centro del pecho. A diferencia del press de banca regular, mantené los codos cerca del torso en todo momento para maximizar la participación del tríceps.",
      "Después de una pausa de un segundo, volvé la barra a la posición inicial mientras exhalás y empujás con los músculos del tríceps. Bloqueá los brazos en la posición contraída, sostené un segundo y comenzá a bajar lentamente de nuevo. Debería llevar al menos el doble de tiempo bajar que subir.",
      "Repetí el movimiento las veces indicadas.",
      "Al terminar, colocá la barra de vuelta en el rack.",
    ],
    puntosClave: [
      "Los codos permanecen cerca del torso en todo momento, a diferencia del press de banca estándar.",
    ],
    erroresComunes: [
      "Abrir los codos hacia afuera como en el press regular.",
    ],
  },

  "Close-Grip_EZ_Bar_Curl": {
    nombre: "Curl con barra EZ agarre cerrado",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["ez bar curl cerrado", "curl barra z agarre interno"],
    instrucciones: [
      "Pararte con el torso erguido sosteniendo una barra EZ por las manijas internas más cercanas entre sí. Las palmas deben mirar hacia adelante y estar levemente inclinadas hacia adentro debido a la forma de la barra. Los codos cerca del torso. Esta es la posición inicial.",
      "Manteniendo los brazos superiores fijos, curvá el peso hacia adelante contrayendo el bíceps mientras exhalás. Solo deben moverse los antebrazos.",
      "Continuá el movimiento hasta que el bíceps esté completamente contraído y la barra a la altura del hombro. Sostené la contracción un segundo y apretá fuerte el bíceps.",
      "Comenzá a volver la barra a la posición inicial lentamente mientras inhalás.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "El agarre cerrado en las manijas internas de la barra EZ reduce el estrés en la muñeca.",
    ],
    erroresComunes: [
      "Balancear los brazos para ayudar a subir el peso.",
    ],
  },

  "Close-Grip_Standing_Barbell_Curl": {
    nombre: "Curl de pie con barra agarre cerrado",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["close grip standing curl"],
    instrucciones: [
      "Sostené una barra con ambas manos, palmas hacia arriba y separadas apenas unos centímetros.",
      "Pararte con el torso recto y la cabeza arriba. Los pies al ancho de hombros aproximadamente y los codos cerca del torso. Esta es la posición inicial. Mantenés los brazos superiores y los codos fijos durante todo el movimiento.",
      "Curvá la barra hacia arriba en un movimiento semicircular hasta que los antebrazos toquen el bíceps. Exhalá durante esta parte y contraé el bíceps fuerte un segundo en la parte superior. Evitá arquear la espalda o usar movimientos de balanceo al levantar el peso. Solo deben moverse los antebrazos.",
      "Volvé lentamente a la posición inicial mientras inhalás.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "El agarre cerrado enfatiza la cabeza larga del bíceps.",
    ],
    erroresComunes: [
      "Arquear la espalda para ayudar a levantar el peso.",
    ],
  },

  "Decline_Barbell_Bench_Press": {
    nombre: "Press de banca decline con barra",
    patron: "Empuje horizontal",
    unilateral: false,
    sinonimos: ["decline bench press con barra"],
    instrucciones: [
      "Asegurá las piernas al extremo del banco decline y acostáte lentamente en él.",
      "Usando un agarre de ancho medio (que crea un ángulo de 90° entre antebrazo y brazo superior a la mitad del movimiento), levantá la barra del rack y sostenela en línea recta sobre vos con los brazos bloqueados. Los brazos deben quedar perpendiculares al piso. Esta es la posición inicial. Para proteger el manguito rotador, lo mejor es que un ayudante te asista a levantar la barra del rack.",
      "Mientras inhalás, bajá lentamente hasta sentir la barra en la parte inferior del pecho.",
      "Después de una pausa de un segundo, volvé la barra a la posición inicial mientras exhalás y empujás con los músculos del pecho. Bloqueá los brazos y apretá el pecho en la posición contraída, sostené un segundo y comenzá a bajar lentamente de nuevo. Debería llevar al menos el doble de tiempo bajar que subir.",
      "Repetí el movimiento las veces indicadas.",
      "Al terminar, colocá la barra de vuelta en el rack.",
    ],
    puntosClave: [
      "El ángulo decline enfatiza la zona inferior del pectoral.",
    ],
    erroresComunes: [
      "Levantar la barra del rack sin ayuda en este ángulo difícil.",
    ],
  },

  "Decline_EZ_Bar_Triceps_Extension": {
    nombre: "Extensión de tríceps en banco decline con barra EZ",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["decline ez bar extension", "skull crusher decline con barra ez"],
    instrucciones: [
      "Asegurá las piernas al extremo del banco decline y acostáte lentamente en él.",
      "Usando un agarre cerrado (levemente menor al ancho de hombros), levantá la barra EZ del rack y sostenela en línea recta sobre vos con los brazos bloqueados y los codos adentro. Los brazos deben quedar perpendiculares al piso. Esta es la posición inicial. Para proteger el manguito rotador, lo mejor es que un ayudante te asista a levantar la barra del rack.",
      "Mientras inhalás y mantenés los brazos superiores fijos, bajá la barra lentamente moviendo los antebrazos en un arco semicircular hacia vos hasta sentir la barra tocar levemente la frente.",
      "Subí la barra de vuelta a la posición inicial contrayendo el tríceps mientras exhalás.",
      "Repetí hasta completar las repeticiones indicadas.",
    ],
    puntosClave: [
      "Los codos permanecen fijos apuntando al techo durante todo el movimiento.",
    ],
    erroresComunes: [
      "Abrir los codos hacia afuera al bajar la barra.",
    ],
  },

  "Finger_Curls": {
    nombre: "Curl de dedos con barra",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["finger curls", "curl de dedos"],
    instrucciones: [
      "Sostené una barra con ambas manos y las palmas hacia arriba, separadas al ancho de hombros.",
      "Colocá los pies planos en el piso, levemente más separados que el ancho de hombros. Esta es la posición inicial.",
      "Bajá la barra lo más posible extendiendo los dedos. Dejá que la barra ruede hacia las manos, atrapándola con la última falange de los dedos.",
      "Ahora curvá la barra hacia arriba lo más alto posible cerrando las manos mientras exhalás. Sostené la contracción arriba.",
    ],
    puntosClave: [
      "Trabaja específicamente la fuerza de agarre y los flexores de los dedos.",
    ],
    erroresComunes: [
      "Dejar caer la barra en lugar de controlarla mientras rueda.",
    ],
  },

  "Front_Raise_And_Pullover": {
    nombre: "Elevación frontal y pullover con barra",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["front raise and pullover", "elevacion y pullover combinado"],
    instrucciones: [
      "Acostáte en un banco plano sosteniendo una barra con agarre pronado, separado unos 38 cm.",
      "Colocá la barra sobre los muslos superiores, extendé los brazos y bloquealos manteniendo una leve flexión en los codos. Esta es la posición inicial.",
      "Ahora elevá el peso en un movimiento semicircular manteniendo los brazos rectos mientras inhalás. Continuá el mismo movimiento hasta que la barra quede del otro lado, por encima de la cabeza (la barra recorre aproximadamente 180°). En ese punto los brazos deben quedar paralelos al piso con las palmas mirando al techo.",
      "Ahora volvé la barra a la posición inicial revirtiendo el movimiento mientras exhalás.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "Combina elevación frontal con pullover en un solo arco continuo de 180°.",
    ],
    erroresComunes: [
      "Flexionar los codos durante el recorrido, perdiendo tensión en hombros y dorsal.",
    ],
  },

  "Incline_Bench_Pull": {
    nombre: "Remo en banco inclinado con mancuernas",
    patron: "Tracción horizontal",
    unilateral: false,
    sinonimos: ["incline bench pull", "remo inclinado boca abajo"],
    instrucciones: [
      "Tomá una mancuerna en cada mano y acostáte boca abajo en un banco inclinado a unos 30°.",
      "Dejá que los brazos cuelguen a los costados completamente extendidos, apuntando hacia el piso.",
      "Girá las muñecas hasta tener un agarre pronado (palmas hacia abajo).",
      "Ahora abrí los codos hacia afuera. Esta es la posición inicial.",
      "Al exhalar, comenzá a tirar de las mancuernas hacia arriba como si hicieras un press de banca invertido. Hacé esto flexionando los codos y llevando los brazos superiores hacia arriba mientras dejás colgar los antebrazos. Continuá el movimiento hasta que los brazos superiores queden al mismo nivel que la espalda. Los codos deben quedar hacia afuera y los brazos superiores junto con el torso deben formar la letra 'T' en la parte superior del movimiento. Sostené la contracción arriba un segundo.",
      "Bajá lentamente a la posición inicial mientras inhalás.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "El banco inclinado elimina por completo el impulso de la espalda baja.",
    ],
    erroresComunes: [
      "No abrir los codos lo suficiente, perdiendo la forma de 'T'.",
    ],
  },

  "JM_Press": {
    nombre: "JM Press",
    patron: "Empuje horizontal",
    unilateral: false,
    sinonimos: ["jm press", "hibrido press y extension triceps"],
    instrucciones: [
      "Comenzá el ejercicio igual que un press de banca con agarre cerrado. Acostáte en un banco plano sosteniendo una barra a extensión de brazos con los codos adentro. Sin embargo, en lugar de tener los brazos perpendiculares al torso, asegurate de que la barra quede en línea directa sobre el pecho superior. Esta es la posición inicial.",
      "Ahora, desde la posición completamente extendida, bajá la barra como si hicieras una extensión de tríceps acostado. Inhalá durante este movimiento. A mitad de camino, dejá que la barra ruede hacia atrás un par de centímetros llevando los brazos superiores hacia las piernas hasta que queden perpendiculares al torso. Mantenés el ángulo del codo constante mientras llevás los brazos superiores hacia adelante.",
      "Al exhalar, empujá la barra de vuelta hacia arriba usando el tríceps, como en un press de banca con agarre cerrado.",
      "Volvé a la posición inicial y comenzá de nuevo.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "Híbrido entre press cerrado y extensión de tríceps; exige mucha técnica.",
    ],
    erroresComunes: [
      "Cambiar el ángulo del codo en lugar de mantenerlo constante durante la transición.",
    ],
  },

  "Landmine_180s": {
    nombre: "Landmine 180 (rotación de torso anclada)",
    patron: "Core rotación",
    unilateral: false,
    sinonimos: ["landmine 180", "rotacion landmine"],
    instrucciones: [
      "Colocá una barra en un soporte landmine o anclala firmemente en un rincón. Cargá la barra con el peso adecuado.",
      "Levantá la barra del piso, llevándola a la altura del hombro con ambas manos y los brazos extendidos al frente. Adoptá una postura amplia. Esta es la posición inicial.",
      "Ejecutá el movimiento rotando el tronco y las caderas mientras balanceás el peso completamente hacia un lado. Mantenés los brazos extendidos durante todo el ejercicio.",
      "Revertí el movimiento para balancear el peso completamente hacia el lado opuesto.",
      "Seguí alternando el movimiento hasta completar la serie.",
    ],
    puntosClave: [
      "La rotación viene de cadera y tronco; los brazos solo transmiten el peso.",
    ],
    erroresComunes: [
      "Flexionar los brazos en lugar de mantenerlos extendidos.",
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
console.log(`✅ Lote 14 aplicado — ${nuevasAgregadas} entradas nuevas agregadas.`);
