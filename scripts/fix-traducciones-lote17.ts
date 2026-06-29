/**
 * Lote 17 — 30 NUEVAS traducciones (barbell intermediate, tanda 2).
 * Olympic weightlifting avanzado: hang clean, power clean, snatch, jerk, rack pulls.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const FILE = resolve("scripts/data/traducciones-fedb.es.json");
const t = JSON.parse(readFileSync(FILE, "utf8"));

const nuevos: Record<string, object> = {

  "Hang_Clean": {
    nombre: "Cargada colgante con barra (hang clean)",
    patron: "Dominante de cadera",
    unilateral: false,
    sinonimos: ["hang clean", "cargada colgante"],
    instrucciones: [
      "Comenzá con agarre doble pronado o de gancho al ancho de hombros, con la barra colgando a la altura media del muslo. La espalda recta e inclinada levemente hacia adelante.",
      "Comenzá extendiendo agresivamente caderas, rodillas y tobillos, impulsando el peso hacia arriba. Al hacerlo, encogé los hombros hacia las orejas.",
      "Recuperate inmediatamente empujando a través de los talones, manteniendo el torso erguido y los codos arriba. Continuá hasta haberte puesto de pie.",
    ],
    puntosClave: [
      "Comenzar desde una posición colgante (no desde el piso) enfoca el entrenamiento en la fase de potencia de la cargada.",
    ],
    erroresComunes: [
      "Tirar con los brazos en lugar de extender con caderas y rodillas.",
    ],
  },

  "Hang_Clean_-_Below_the_Knees": {
    nombre: "Cargada colgante debajo de las rodillas",
    patron: "Dominante de cadera",
    unilateral: false,
    sinonimos: ["hang clean below knees", "cargada colgante baja"],
    instrucciones: [
      "Comenzá con agarre doble pronado o de gancho al ancho de hombros, con la barra colgando justo debajo de las rodillas. La espalda recta e inclinada levemente hacia adelante.",
      "Comenzá extendiendo agresivamente caderas, rodillas y tobillos, impulsando el peso hacia arriba. Al hacerlo, encogé los hombros hacia las orejas. Al lograr la extensión completa, pasá al tercer tirón encogiendo agresivamente los hombros y flexionando los brazos con los codos hacia arriba y afuera.",
      "En el pico de la extensión, tirate hacia abajo agresivamente, rotando los codos por debajo de la barra. Recibí la barra en posición de sentadilla frontal, cuya profundidad depende de la altura de la barra al final del tercer tirón. La barra debe quedar apoyada sobre los hombros protraídos, tocando levemente la garganta con las manos relajadas. Continuá descendiendo hasta la posición baja de sentadilla, lo cual ayuda en la recuperación.",
      "Recuperate inmediatamente empujando a través de los talones, manteniendo el torso erguido y los codos arriba. Continuá hasta haberte puesto de pie.",
    ],
    puntosClave: [
      "Comenzar desde más abajo (debajo de la rodilla) exige más control del primer tirón que el hang clean estándar.",
    ],
    erroresComunes: [
      "Perder la posición de espalda al iniciar desde más abajo.",
    ],
  },

  "Hanging_Bar_Good_Morning": {
    nombre: "Good morning con barra colgante",
    patron: "Dominante de cadera",
    unilateral: false,
    sinonimos: ["hanging good morning", "good morning con cadenas"],
    instrucciones: [
      "Comenzá con una barra en un rack a una altura aproximadamente igual a la del abdomen. Suspendé la barra usando cadenas o correas de suspensión.",
      "Inclinate por debajo de la barra y apoyala en la parte posterior de los hombros como en una sentadilla, no encima de los trapecios. A la altura correcta, deberías quedar casi paralelo al piso al inclinarte. Mantené la espalda firme, los omóplatos apretados entre sí y las rodillas levemente flexionadas. Mantené la espalda arqueada y la columna cervical en alineación correcta.",
      "Comenzá el movimiento extendiendo la cadera con los glúteos y los isquiotibiales, hasta quedar de pie con el peso.",
      "Bajá lentamente el peso de vuelta a la posición inicial, donde queda sostenido por las cadenas.",
    ],
    puntosClave: [
      "La suspensión por cadenas agrega un componente de inestabilidad que exige más control.",
    ],
    erroresComunes: [
      "Dejar caer el peso de golpe en lugar de bajarlo controlado.",
    ],
  },

  "Heaving_Snatch_Balance": {
    nombre: "Snatch balance con impulso",
    patron: "Empuje vertical",
    unilateral: false,
    sinonimos: ["heaving snatch balance", "balance de arrancada"],
    instrucciones: [
      "Este ejercicio te ayuda a aprender la arrancada (snatch). Comenzá sosteniendo un peso liviano apoyado en la parte posterior de los hombros. Los pies deben estar levemente más separados que el ancho de cadera, con las puntas hacia afuera, la misma posición que usarías para una sentadilla.",
      "Comenzá con una semi-flexión leve de rodillas, y rebotá hacia arriba para descargar brevemente la barra. Impulsate por debajo de la barra, elevándola por encima de la cabeza mientras descendés a una sentadilla completa.",
      "Volvé a la posición de pie.",
    ],
    puntosClave: [
      "Es un ejercicio técnico para la arrancada: enseña a recibir el peso arriba en sentadilla completa.",
    ],
    erroresComunes: [
      "No descender lo suficiente para recibir el peso de forma segura.",
    ],
  },

  "Incline_Barbell_Triceps_Extension": {
    nombre: "Extensión de tríceps en banco inclinado con barra",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["incline triceps extension con barra", "french press inclinado"],
    instrucciones: [
      "Sostené una barra con agarre pronado (palmas hacia abajo), levemente más cerrado que el ancho de hombros.",
      "Acostáte en un banco inclinado a un ángulo de entre 45° y 75°.",
      "Llevá la barra por encima de la cabeza con los brazos extendidos y los codos adentro. Los brazos deben estar alineados con el torso por encima de la cabeza. Esta es la posición inicial.",
      "Ahora bajá la barra en un movimiento semicircular detrás de la cabeza hasta que los antebrazos toquen el bíceps. Inhalá durante este movimiento. Mantenés los brazos superiores fijos y cerca de la cabeza en todo momento. Solo deben moverse los antebrazos.",
      "Volvé a la posición inicial mientras exhalás y contraés el tríceps. Sostené la contracción un segundo.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "El ángulo del banco entre 45° y 75° permite variar el énfasis sobre las distintas cabezas del tríceps.",
    ],
    erroresComunes: [
      "Mover los brazos superiores en lugar de mantenerlos fijos.",
    ],
  },

  "Jefferson_Squats": {
    nombre: "Sentadilla Jefferson",
    patron: "Dominante de rodilla",
    unilateral: false,
    sinonimos: ["jefferson squat", "sentadilla a horcajadas"],
    instrucciones: [
      "Colocá una barra en el piso.",
      "Pararte en el medio de la barra, a lo largo.",
      "Agachate flexionando las rodillas y manteniendo la espalda recta, y tomá la parte frontal de la barra con la mano derecha. La palma debe estar en agarre neutro (mirando hacia el lado izquierdo).",
      "Tomá la parte posterior de la barra con la mano izquierda. La palma debe estar en agarre neutro (mirando hacia el lado derecho). Asegurate de que el agarre sea parejo en la barra. El torso debe quedar justo en el medio de la barra, y la distancia entre el torso y la mano derecha (adelante) debe ser igual a la distancia entre el torso y la mano izquierda (atrás).",
      "Ahora parate completamente erguido con el peso. Los pies deben estar al ancho de hombros y las puntas levemente hacia afuera.",
      "Hacé sentadilla flexionando las rodillas y manteniendo la espalda recta hasta que los muslos superiores queden paralelos al piso. Mantené la espalda lo más vertical posible respecto al piso y la cabeza arriba. No dejés que las rodillas sobrepasen las puntas de los pies. Inhalá durante esta parte del movimiento.",
      "Ahora impulsate de vuelta hacia arriba empujando con los pies. Mantené la barra colgando a extensión de brazos con los codos bloqueados con leve flexión. Los brazos solo actúan como ganchos; evitá levantar con ellos. El levantamiento lo hacen los muslos, no los brazos.",
    ],
    puntosClave: [
      "La posición a horcajadas de la barra entre las piernas distingue a este ejercicio de la sentadilla tradicional.",
    ],
    erroresComunes: [
      "Tirar de la barra con los brazos en lugar de usarlos solo como ganchos.",
    ],
  },

  "Jerk_Balance": {
    nombre: "Balance de envión (jerk balance)",
    patron: "Empuje vertical",
    unilateral: true,
    sinonimos: ["jerk balance", "balance del envion"],
    instrucciones: [
      "Este ejercicio te ayuda a aprender a bajar lo suficiente durante el envión y corrige a quienes se mueven hacia atrás durante el movimiento. Comenzá con la barra apoyada en la posición de envión, con los hombros adelantados, el torso erguido y los pies levemente separados en posición dividida.",
      "Iniciá el movimiento como en un envión normal, flexionando las rodillas mientras mantenés el torso vertical, y empujando hacia arriba con fuerza, usando el impulso y no los brazos para elevar el peso.",
      "Mantené el pie de atrás en su lugar, usándolo para impulsar el cuerpo hacia adelante hasta una división completa mientras hacés el envión del peso. Recuperate parándote con el peso por encima de la cabeza.",
    ],
    puntosClave: [
      "Es un ejercicio técnico que corrige la tendencia a moverse hacia atrás durante el envión.",
    ],
    erroresComunes: [
      "Mover el pie de atrás en lugar de mantenerlo fijo como ancla.",
    ],
  },

  "Jerk_Dip_Squat": {
    nombre: "Sentadilla de hundimiento para envión",
    patron: "Dominante de rodilla",
    unilateral: false,
    sinonimos: ["jerk dip squat", "dip squat de envion"],
    instrucciones: [
      "Este movimiento fortalece la fase de hundimiento del envión. Comenzá con la barra apoyada en la posición de envión, con los hombros adelantados para crear un estante y la barra tocando levemente la garganta. Los pies deben estar directamente bajo las caderas, con las puntas hacia afuera según resulte cómodo.",
      "Manteniendo el torso vertical, hundite flexionando las rodillas, permitiendo que viajen hacia adelante sin mover las caderas hacia atrás. El hundimiento no debe ser excesivo. Volvé el peso a la posición inicial empujando con fuerza a través de los pies.",
    ],
    puntosClave: [
      "El hundimiento debe ser corto y controlado, no una sentadilla profunda.",
    ],
    erroresComunes: [
      "Hundirse demasiado profundo, perdiendo la posición vertical del torso.",
    ],
  },

  "Kneeling_Squat": {
    nombre: "Sentadilla desde rodillas",
    patron: "Dominante de rodilla",
    unilateral: false,
    sinonimos: ["kneeling squat", "sentadilla arrodillada"],
    instrucciones: [
      "Ajustá la barra a la altura correcta en un rack de potencia. Arrodillate detrás de la barra; puede ser útil colocar una colchoneta para proteger las rodillas. Deslizate debajo de la barra, apoyándola en la parte posterior de los hombros. Los omóplatos deben estar retraídos y la barra firme contra la espalda. Sacá el peso del rack.",
      "Con la cabeza mirando al frente, sentate hacia atrás con los glúteos hasta tocar las pantorrillas.",
      "Revertí el movimiento, volviendo el torso a la posición erguida.",
    ],
    puntosClave: [
      "Comenzar desde rodillas elimina el componente de las piernas, enfocándose en la cadera y el torso.",
    ],
    erroresComunes: [
      "Sentarse hacia atrás demasiado rápido sin control.",
    ],
  },

  "Landmine_Linear_Jammer": {
    nombre: "Landmine jammer lineal",
    patron: "Empuje vertical",
    unilateral: false,
    sinonimos: ["landmine jammer", "jammer lineal"],
    instrucciones: [
      "Colocá una barra en un soporte landmine, o si no tenés uno, anclala firmemente en un rincón. Cargá la barra con el peso adecuado y colocá la manija en el extremo de la barra.",
      "Levantá la barra del piso, llevando las manijas a la altura de los hombros. Esta es la posición inicial.",
      "En una postura atlética, hacé sentadilla flexionando las caderas y llevándolas hacia atrás, manteniendo los brazos flexionados.",
      "Revertí el movimiento extendiendo con fuerza caderas, rodillas y tobillos, mientras también extendés los codos para enderezar los brazos. Este movimiento debe hacerse explosivamente, saliendo de la sentadilla hacia la extensión completa con la mayor potencia posible.",
      "Volvé a la posición inicial.",
    ],
    puntosClave: [
      "Combina la extensión de piernas con un empuje de brazos en un movimiento explosivo único.",
    ],
    erroresComunes: [
      "Empujar solo con los brazos sin la extensión explosiva de piernas.",
    ],
  },

  "Lying_Close-Grip_Barbell_Triceps_Extension_Behind_The_Head": {
    nombre: "Extensión de tríceps acostado agarre cerrado detrás de la cabeza",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["skull crusher detras de la cabeza agarre cerrado"],
    instrucciones: [
      "Sosteniendo una barra o barra EZ con agarre pronado (palmas hacia adelante), acostáte boca arriba en un banco plano con la cabeza cerca del extremo del banco. Si usás una barra recta, tomala al ancho de hombros; si usás una barra EZ, tomala de las manijas internas.",
      "Extendé los brazos frente a vos y llevá lentamente la barra hacia atrás en un movimiento semicircular (manteniendo los brazos extendidos) hasta una posición por encima de la cabeza. Al final de este paso los brazos deben quedar arriba, paralelos al piso. Esta es la posición inicial. Mantenés los codos adentro en todo momento.",
      "Al inhalar, bajá la barra flexionando los codos mientras mantenés el brazo superior fijo. Seguí bajando hasta que los antebrazos queden perpendiculares al piso.",
      "Al exhalar, subí la barra de vuelta a la posición inicial empujándola en un movimiento semicircular hasta que los antebrazos también queden paralelos al piso. Contraé fuerte el tríceps un segundo en la parte superior. Nuevamente, solo deben moverse los antebrazos; los brazos superiores permanecen fijos en todo momento.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "El recorrido detrás de la cabeza ofrece un ángulo de estiramiento distinto al skull crusher tradicional.",
    ],
    erroresComunes: [
      "Mover el brazo superior en lugar de mantenerlo fijo.",
    ],
  },

  "Lying_High_Bench_Barbell_Curl": {
    nombre: "Curl con barra acostado en banco alto",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["high bench curl con barra"],
    instrucciones: [
      "Acostáte boca abajo en un banco plano alto sosteniendo una barra con agarre supino (palmas hacia arriba). Si usás una barra recta, tomala al ancho de hombros; si usás una barra EZ, tomala de las manijas internas. El torso superior debe estar posicionado de modo que el pecho superior quede sobre el extremo del banco y la barra cuelgue frente a vos con los brazos extendidos y perpendiculares al piso. Esta es la posición inicial.",
      "Manteniendo los codos adentro y los brazos superiores fijos, curvá el peso en un movimiento semicircular mientras contraés el bíceps y exhalás. Sostené un segundo en la parte superior del movimiento.",
      "Al inhalar, volvé lentamente a la posición inicial. Mantenés el control total del peso en todo momento, evitando cualquier balanceo. Solo deben moverse los antebrazos durante todo el movimiento.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "El banco alto elimina por completo el impulso del torso y el hombro.",
    ],
    erroresComunes: [
      "Balancear el cuerpo para ayudar a subir el peso.",
    ],
  },

  "Muscle_Snatch": {
    nombre: "Arrancada muscular (muscle snatch)",
    patron: "Empuje vertical",
    unilateral: false,
    sinonimos: ["muscle snatch", "snatch muscular"],
    instrucciones: [
      "Comenzá con una barra cargada sostenida a la altura media del muslo con agarre ancho. Los pies deben estar directamente debajo de las caderas, con las puntas hacia afuera según sea necesario. Bajá las caderas, con el pecho arriba y la cabeza mirando al frente. Los hombros deben estar justo por delante de la barra. Esta es la posición inicial.",
      "Comenzá el tirón empujando a través de la parte delantera de los talones, elevando la barra. Pasá al segundo tirón extendiendo caderas, rodillas y tobillos, impulsando la barra hacia arriba lo más rápido posible. La barra debe permanecer cerca del cuerpo.",
      "Continuá elevando la barra hasta la posición por encima de la cabeza, sin volver a flexionar las rodillas.",
    ],
    puntosClave: [
      "A diferencia de la arrancada de potencia, no hay recepción en sentadilla; los brazos terminan la elevación.",
    ],
    erroresComunes: [
      "Volver a flexionar las rodillas para ayudar a terminar el movimiento.",
    ],
  },

  "Narrow_Stance_Squats": {
    nombre: "Sentadilla con postura estrecha",
    patron: "Dominante de rodilla",
    unilateral: false,
    sinonimos: ["narrow stance squat", "sentadilla pies juntos"],
    instrucciones: [
      "Este ejercicio se realiza mejor dentro de un rack de sentadillas por seguridad. Para comenzar, colocá la barra en un rack a la altura que mejor se adapte a tu altura. Una vez elegida la altura correcta y cargada la barra, metete debajo de ella y colocá la parte posterior de los hombros (levemente debajo del cuello) bajo la barra.",
      "Sosteniendo la barra con ambos brazos a los costados, levantala del rack empujando con las piernas mientras enderezás el torso al mismo tiempo.",
      "Alejate del rack y colocá las piernas en una postura estrecha, menos que el ancho de hombros, con las puntas levemente hacia afuera. Los pies deben quedar separados unos 8-15 cm. Mantené la cabeza arriba en todo momento (mirar hacia abajo te desequilibra) y la espalda recta. Esta es la posición inicial.",
      "Comenzá a bajar la barra lentamente flexionando las rodillas mientras mantenés la postura recta y la cabeza arriba. Continuá bajando hasta que el ángulo entre el muslo y la pantorrilla sea levemente menor a 90° (el punto en que los muslos quedan por debajo de paralelo al piso). Inhalá durante esta parte. Si la ejecución es correcta, el frente de las rodillas debe formar una línea recta imaginaria con los dedos de los pies, perpendicular al frente. Si las rodillas sobrepasan esa línea, estás generando estrés innecesario en la rodilla.",
      "Comenzá a subir la barra mientras exhalás, empujando el piso con el talón mientras extendés las piernas y volvés a la posición inicial.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "La postura estrecha enfatiza más el cuádriceps que la sentadilla con postura media.",
    ],
    erroresComunes: [
      "Dejar que las rodillas colapsen hacia adentro por la postura cerrada.",
    ],
  },

  "Neck_Press": {
    nombre: "Press al cuello (neck press)",
    patron: "Empuje horizontal",
    unilateral: false,
    sinonimos: ["neck press", "press de banca al cuello"],
    instrucciones: [
      "Acostáte en un banco plano. Usando un agarre de ancho medio (que crea un ángulo de 90° entre antebrazo y brazo superior a la mitad del movimiento), levantá la barra del rack y sostenela en línea recta sobre tu cuello con los brazos bloqueados. Esta es la posición inicial.",
      "Mientras inhalás, bajá lentamente hasta sentir la barra en el cuello.",
      "Después de una pausa de un segundo, volvé la barra a la posición inicial mientras exhalás y empujás con los músculos del pecho. Bloqueá los brazos y apretá el pecho en la posición contraída, sostené un segundo y comenzá a bajar lentamente de nuevo. Debería llevar al menos el doble de tiempo bajar que subir.",
      "Repetí el movimiento las veces indicadas.",
      "Al terminar, colocá la barra de vuelta en el rack.",
    ],
    puntosClave: [
      "Variante avanzada similar al press guillotina; requiere mucho control y cuidado del hombro.",
    ],
    erroresComunes: [
      "Bajar la barra sin control cerca del cuello.",
    ],
  },

  "Olympic_Squat": {
    nombre: "Sentadilla olímpica",
    patron: "Dominante de rodilla",
    unilateral: false,
    sinonimos: ["olympic squat", "sentadilla estilo halterofilia"],
    instrucciones: [
      "Comenzá con una barra apoyada sobre los trapecios. El pecho debe estar arriba y la cabeza mirando al frente. Adoptá una postura al ancho de cadera con las puntas hacia afuera según sea necesario.",
      "Descendé flexionando las rodillas, evitando llevar las caderas hacia atrás tanto como sea posible. Esto requiere que las rodillas viajen hacia adelante; asegurate de que permanezcan alineadas con los pies. El objetivo es mantener el torso lo más erguido posible. Continuá bajando completamente, manteniendo el peso en la parte delantera del talón.",
      "En el momento en que los muslos superiores tocan las pantorrillas, revertí el movimiento, impulsando el peso hacia arriba.",
    ],
    puntosClave: [
      "El torso permanece más vertical que en una sentadilla de powerlifting, característica del estilo olímpico.",
    ],
    erroresComunes: [
      "Llevar las caderas hacia atrás en lugar de que las rodillas viajen hacia adelante.",
    ],
  },

  "One_Arm_Floor_Press": {
    nombre: "Press de piso unilateral con barra",
    patron: "Empuje horizontal",
    unilateral: true,
    sinonimos: ["one arm floor press con barra"],
    instrucciones: [
      "Acostáte en una superficie plana con la espalda apoyada en el piso o una colchoneta. Asegurate de que las rodillas estén flexionadas.",
      "Pedile a un compañero que te entregue la barra con una mano. Al empezar, el brazo debe estar casi completamente extendido, similar a la posición inicial de un press de banca. Sin embargo, esta vez el agarre será neutro (palmas hacia el torso).",
      "Asegurate de que la mano que no levanta el peso quede apoyada a tu costado.",
      "Comenzá el ejercicio bajando la barra hasta que el codo toque el piso. Asegurate de inhalar durante esta fase excéntrica (de bajada).",
      "Luego comenzá a levantar la barra de vuelta a la posición inicial. Recordá exhalar durante la fase concéntrica (de subida).",
      "Repetí hasta completar las repeticiones indicadas.",
      "Cambiá de brazo y repetí el movimiento.",
    ],
    puntosClave: [
      "Necesita un compañero para entregar la barra de forma segura con un solo brazo.",
    ],
    erroresComunes: [
      "Perder el control de la barra por la carga asimétrica.",
    ],
  },

  "Pin_Presses": {
    nombre: "Press desde pines",
    patron: "Empuje horizontal",
    unilateral: false,
    sinonimos: ["pin press", "press de pines en rack"],
    instrucciones: [
      "Los press desde pines eliminan la fase excéntrica del press de banca, desarrollando fuerza de arranque. También permiten entrenar un rango de movimiento específico.",
      "El banco debe estar dentro de un rack de potencia. Ajustá los pines al punto deseado de tu rango de movimiento, ya sea apenas el bloqueo final o a unos 2 cm del pecho. La barra debe colocarse sobre los pines y prepararse para el levantamiento.",
      "Comenzá acostado en el banco, con la barra directamente sobre el punto de contacto de tu press regular. Metete los pies debajo del cuerpo y arqueá la espalda. Usando la barra para ayudarte a sostener el peso, elevá los hombros del banco y retraelos, apretando los omóplatos entre sí. Usá los pies para clavar los trapecios en el banco. Mantené esta posición corporal apretada durante todo el movimiento.",
      "Podés usar un agarre estándar de press de banca, o al ancho de hombros para enfocar el tríceps. La barra, la muñeca y el codo deben permanecer alineados en todo momento. Concentráte en apretar la barra e intentar separarla.",
      "Empujá la barra hacia arriba con la mayor fuerza posible. Los codos deben permanecer pegados al cuerpo hasta el bloqueo final.",
      "Volvé la barra a los pines, pausando antes de comenzar la siguiente repetición.",
    ],
    puntosClave: [
      "Eliminar la fase excéntrica permite entrenar específicamente la fuerza de arranque desde un punto fijo.",
    ],
    erroresComunes: [
      "Dejar caer la barra sobre los pines en lugar de pausar con control.",
    ],
  },

  "Power_Clean": {
    nombre: "Cargada de potencia (power clean)",
    patron: "Dominante de cadera",
    unilateral: false,
    sinonimos: ["power clean", "cargada de potencia olimpica"],
    instrucciones: [
      "Pararte con los pies levemente más separados que el ancho de hombros y las puntas levemente hacia afuera.",
      "",
      "Hacé sentadilla y tomá la barra con agarre cerrado y pronado. Las manos deben estar levemente más separadas que el ancho de hombros, por afuera de las rodillas, con los codos completamente extendidos.",
      "Colocá la barra a unos 2 cm en frente de las tibias y sobre la parte delantera de los pies.",
      "La espalda debe estar plana o levemente arqueada, el pecho arriba y afuera, y los omóplatos retraídos.",
      "Mantené la cabeza en posición neutra (alineada con la columna, sin inclinarse ni rotar) con la vista al frente. Inhalá durante esta fase.",
      "Levantá la barra del piso extendiendo enérgicamente caderas y rodillas mientras exhalás. El torso superior debe mantener el mismo ángulo. No te dobles aún por la cintura ni dejés que las caderas suban antes que los hombros (eso empujaría los glúteos hacia el aire y estiraría los isquiotibiales).",
      "Mantené los codos completamente extendidos con la cabeza neutra y los hombros sobre la barra.",
      "Mientras la barra sube, mantenela lo más cerca posible de las tibias.",
      "Cuando la barra pase las rodillas, empujá las caderas hacia adelante y flexioná levemente las rodillas para evitar bloquearlas. En este punto los muslos deberían estar contra la barra.",
      "Mantené la espalda plana o levemente arqueada, los codos completamente extendidos y la cabeza neutra. Vas a sostener la respiración hasta la siguiente fase.",
      "Inhalá y luego extendé con fuerza y rapidez caderas y rodillas, parándote en las puntas de los pies.",
      "Mantené la barra lo más cerca posible del cuerpo. La espalda debe estar plana con los codos apuntando hacia los costados y la cabeza en posición neutra. Mantené también los hombros sobre la barra y los brazos rectos el mayor tiempo posible.",
      "Cuando las articulaciones de la parte inferior del cuerpo estén completamente extendidas, encogé los hombros rápidamente hacia arriba sin flexionar todavía los codos. Exhalá durante esta parte del movimiento.",
      "Cuando los hombros alcancen su elevación máxima, flexioná los codos para empezar a tirar tu cuerpo por debajo de la barra.",
      "Continuá tirando de los brazos lo más alto y lo más tiempo posible. Por la naturaleza explosiva de esta fase, el torso estará erguido o con la espalda arqueada, la cabeza levemente inclinada hacia atrás, y los pies podrían perder contacto con el piso.",
      "Después de que la parte inferior del cuerpo se haya extendido completamente y la barra alcance su altura casi máxima, tirá tu cuerpo por debajo de la barra y rotá los brazos alrededor y por debajo de ella.",
      "Simultáneamente, flexioná caderas y rodillas hasta una posición de un cuarto de sentadilla.",
      "Una vez que los brazos estén debajo de la barra, inhalá y luego elevá los codos para posicionar los brazos superiores paralelos al piso. Apoyá la barra sobre la parte frontal de las clavículas y los músculos delanteros del hombro.",
      "Recibí la barra con el torso erguido y firme, la cabeza en posición neutra y los pies planos. Exhalá durante este movimiento.",
      "Parate extendiendo caderas y rodillas hasta una posición completamente erguida.",
      "Bajá la barra reduciendo gradualmente la tensión muscular de los brazos para permitir un descenso controlado hasta los muslos. Inhalá durante este movimiento.",
      "Simultáneamente, flexioná caderas y rodillas para amortiguar el impacto de la barra sobre los muslos.",
      "Hacé sentadilla con los codos completamente extendidos hasta que la barra toque el piso.",
      "Comenzá de nuevo en la fase 1 y repetí las veces indicadas.",
    ],
    puntosClave: [
      "Es la técnica olímpica completa: cada fase (tirones, recepción, recuperación) tiene su propia mecánica específica.",
    ],
    erroresComunes: [
      "Dejar que las caderas suban antes que los hombros al iniciar el primer tirón.",
    ],
  },

  "Power_Clean_from_Blocks": {
    nombre: "Cargada de potencia desde bloques",
    patron: "Dominante de cadera",
    unilateral: false,
    sinonimos: ["power clean from blocks"],
    instrucciones: [
      "Con la barra sobre cajones de la altura deseada, tomá un agarre justo afuera de las piernas. Bajá las caderas con el peso enfocado en los talones, espalda recta, cabeza al frente, pecho arriba, con los hombros justo por delante de la barra. Esta es la posición inicial.",
      "Comenzá el primer tirón empujando a través de los talones, extendiendo las rodillas. El ángulo de la espalda debe mantenerse igual, y los brazos deben permanecer rectos. Cuando la barra se acerca a la mitad del muslo, comenzá a extender la cadera.",
      "En un movimiento de salto, acelerá extendiendo cadera, rodillas y tobillos, usando velocidad para mover la barra hacia arriba. No debería ser necesario tirar activamente con los brazos para acelerar el peso. Al final del segundo tirón, el cuerpo debe estar completamente extendido, inclinado levemente hacia atrás, con los brazos todavía extendidos.",
      "Al alcanzar la extensión completa, pasá al tercer tirón encogiendo agresivamente los hombros y flexionando los brazos con los codos hacia arriba y afuera. En el pico de la extensión, tirate por debajo de la barra lo suficiente para poder apoyarla en los hombros, rotando los codos por debajo de ella. La barra debe quedar apoyada sobre los hombros protraídos, tocando levemente la garganta con las manos relajadas.",
      "Recuperate inmediatamente empujando a través de los talones, manteniendo el torso erguido y los codos arriba. Continuá hasta haberte puesto de pie, y completá la repetición devolviendo el peso a los cajones.",
    ],
    puntosClave: [
      "Comenzar desde bloques elimina el primer tirón desde el piso, enfocándose en la fase de potencia.",
    ],
    erroresComunes: [
      "No recibir la barra en una sentadilla frontal completa.",
    ],
  },

  "Power_Snatch_from_Blocks": {
    nombre: "Arrancada de potencia desde bloques",
    patron: "Empuje vertical",
    unilateral: false,
    sinonimos: ["power snatch from blocks", "arrancada de potencia desde cajones"],
    instrucciones: [
      "Comenzá con una barra cargada sobre cajones o soportes de la altura deseada. Tomá un agarre ancho en la barra. Los pies deben estar directamente debajo de las caderas, con las puntas hacia afuera según sea necesario. Bajá las caderas, con el pecho arriba y la cabeza mirando al frente. Los hombros deben estar justo por delante de la barra, con los codos apuntando hacia afuera. Esta es la posición inicial.",
      "Comenzá el primer tirón empujando a través de la parte delantera de los talones, elevando la barra desde los cajones.",
      "Pasá al segundo tirón extendiendo caderas, rodillas y tobillos, impulsando la barra hacia arriba lo más rápido posible. La barra debe permanecer cerca del cuerpo. En el pico de la extensión, encogé los hombros y dejá que los codos se flexionen hacia los costados.",
      "Mientras movés los pies a la posición de recepción, tirate con fuerza por debajo de la barra mientras la elevás por encima de la cabeza. Los pies deben moverse a una posición levemente más ancha que las caderas, con las puntas hacia afuera según sea necesario. Recibí la barra por encima de una sentadilla completa, con los brazos completamente extendidos por encima de la cabeza.",
      "Manteniendo la barra alineada sobre la parte delantera de los talones, con la cabeza y el pecho arriba, empujá a través de los talones para volver a una posición de pie. Devolvé cuidadosamente el peso a los cajones.",
    ],
    puntosClave: [
      "La recepción en sentadilla completa por encima de la cabeza exige mucha movilidad de hombro y tobillo.",
    ],
    erroresComunes: [
      "No recibir la barra completamente bloqueada arriba.",
    ],
  },

  "Push_Press_-_Behind_the_Neck": {
    nombre: "Push press tras nuca",
    patron: "Empuje vertical",
    unilateral: false,
    sinonimos: ["behind the neck push press"],
    instrucciones: [
      "Parado con el peso apoyado en la parte posterior de los hombros, comenzá con el hundimiento. Con los pies directamente debajo de las caderas, flexioná las rodillas sin mover las caderas hacia atrás. Bajá solo levemente y revertí la dirección con la mayor potencia posible. Empujá a través de los talones para generar la mayor velocidad y fuerza posible, moviendo la barra en una trayectoria vertical.",
      "Usando el impulso generado, terminá de presionar el peso por encima de la cabeza extendiendo los brazos.",
      "Volvé a la posición inicial, usando las piernas para absorber el impacto.",
    ],
    puntosClave: [
      "El impulso de piernas reduce la carga directa sobre el hombro comparado con un press estricto.",
    ],
    erroresComunes: [
      "Hacer una sentadilla demasiado profunda en lugar de un hundimiento corto y rápido.",
    ],
  },

  "Rack_Delivery": {
    nombre: "Entrega al estante (rack delivery)",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["rack delivery", "tecnica de recepcion de cargada"],
    instrucciones: [
      "Este ejercicio enseña la entrega de la barra a la posición de estante sobre los hombros. Comenzá sosteniendo una barra en posición de espantapájaros, con los brazos superiores paralelos al piso y los antebrazos colgando hacia abajo. Usá agarre de gancho, con los dedos envueltos sobre el pulgar.",
      "Comenzá rotando los codos alrededor de la barra, entregándola a los hombros. Mientras los codos avanzan hacia adelante, relajá el agarre. Los hombros deben protraerse, ofreciendo un estante para la barra, que debe tocar levemente la garganta.",
      "Es importante que la barra permanezca cerca del cuerpo en todo momento, ya que con una carga más pesada cualquier distancia generará un golpe no deseado. A medida que el movimiento se vuelve más fluido, se puede aumentar la velocidad y la carga antes de seguir progresando.",
    ],
    puntosClave: [
      "Es un ejercicio puramente técnico: enseña la transición de los brazos a la posición de estante sin carga pesada.",
    ],
    erroresComunes: [
      "Dejar que la barra se aleje del cuerpo durante la transición.",
    ],
  },

  "Rack_Pull_with_Bands": {
    nombre: "Rack pull con bandas",
    patron: "Dominante de cadera",
    unilateral: false,
    sinonimos: ["rack pull con bandas", "peso muerto parcial con bandas"],
    instrucciones: [
      "Armá un rack de potencia con la barra sobre los pines. Los pines deben ajustarse al punto deseado: justo debajo de la rodilla, justo arriba, o a la altura media del muslo. Anclá bandas a la base del rack, o asegúralas con mancuernas. Conectá el otro extremo a la barra. Puede ser necesario ajustar las bandas para generar tensión.",
      "Posicionate frente a la barra en la postura correcta de deadlift. Los pies deben estar debajo de las caderas, el agarre al ancho de hombros, la espalda arqueada y las caderas hacia atrás para activar los isquiotibiales. Como el peso suele ser pesado, podés usar agarre mixto, de gancho, o correas para sostener el peso.",
      "Con la cabeza mirando al frente, extendé caderas y rodillas, tirando del peso hacia arriba y atrás hasta el bloqueo final. Asegurate de tirar los hombros hacia atrás al completar el movimiento. Volvé el peso a los pines y repetí.",
    ],
    puntosClave: [
      "Las bandas agregan resistencia adicional cerca del bloqueo final, donde el deadlift suele ser más fácil.",
    ],
    erroresComunes: [
      "No ajustar bien la tensión de las bandas antes de empezar.",
    ],
  },

  "Rack_Pulls": {
    nombre: "Rack pulls (peso muerto parcial desde pines)",
    patron: "Dominante de cadera",
    unilateral: false,
    sinonimos: ["rack pull", "deadlift parcial"],
    instrucciones: [
      "Armá un rack de potencia con la barra sobre los pines. Los pines deben ajustarse al punto deseado: justo debajo de la rodilla, justo arriba, o a la altura media del muslo. Posicionate frente a la barra en la postura correcta de deadlift. Los pies deben estar debajo de las caderas, el agarre al ancho de hombros, la espalda arqueada y las caderas hacia atrás para activar los isquiotibiales. Como el peso suele ser pesado, podés usar agarre mixto, de gancho, o correas para sostener el peso.",
      "Con la cabeza mirando al frente, extendé caderas y rodillas, tirando del peso hacia arriba y atrás hasta el bloqueo final. Asegurate de tirar los hombros hacia atrás al completar el movimiento.",
      "Volvé el peso a los pines y repetí.",
    ],
    puntosClave: [
      "El rango de movimiento parcial permite sobrecargar la porción superior del deadlift.",
    ],
    erroresComunes: [
      "Usar el rango completo de movimiento en lugar de solo la porción definida por los pines.",
    ],
  },

  "Reverse_Band_Bench_Press": {
    nombre: "Press de banca con banda inversa",
    patron: "Empuje horizontal",
    unilateral: false,
    sinonimos: ["reverse band bench press"],
    instrucciones: [
      "Posicioná un banco dentro de un rack de potencia, con la barra a la altura correcta. Comenzá anclando bandas a clavijas o a la parte superior del rack. Asegurate de posicionarte correctamente debajo de las bandas. Conectá el otro extremo a la barra.",
      "Acostáte en el banco, metete los pies debajo del cuerpo y arqueá la espalda. Usando la barra para ayudarte a sostener el peso, elevá los hombros del banco y retraelos, apretando los omóplatos entre sí. Usá los pies para clavar los trapecios en el banco. Mantené esta posición corporal apretada durante todo el movimiento. Cualquiera sea el ancho de tu agarre, debe cubrir el anillo de la barra.",
      "Sacá la barra del rack sin protraer los hombros. Concentráte en apretar la barra e intentar separarla. Bajá la barra hacia la parte inferior del pecho o la parte superior del abdomen. La barra, la muñeca y el codo deben permanecer alineados en todo momento.",
      "Pausá cuando la barra toque el torso, y luego empujala hacia arriba con la mayor fuerza posible. Los codos deben permanecer pegados al cuerpo hasta el bloqueo final.",
    ],
    puntosClave: [
      "Las bandas inversas reducen el peso efectivo abajo y lo aumentan progresivamente al subir, lo opuesto a las cadenas.",
    ],
    erroresComunes: [
      "Protraer los hombros al sacar la barra del rack.",
    ],
  },

  "Reverse_Band_Box_Squat": {
    nombre: "Sentadilla al cajón con banda inversa",
    patron: "Dominante de rodilla",
    unilateral: false,
    sinonimos: ["reverse band box squat"],
    instrucciones: [
      "Comenzá en un rack de potencia con un cajón a la altura adecuada detrás de vos. Configurá las bandas en clavijas o conectadas a la parte superior del rack, asegurándote de que queden directamente sobre la barra durante la sentadilla. Conectá el otro extremo a la barra.",
      "Comenzá metiéndote debajo de la barra y colocándola en la parte posterior de los hombros. Apretá los omóplatos entre sí y rotá los codos hacia adelante, intentando doblar la barra sobre los hombros. Sacá la barra del rack creando un arco firme en la espalda baja, y retrocedé a la posición. Colocá los pies más separados para enfatizar espalda, glúteos, aductores e isquiotibiales, o más juntos para enfatizar el cuádriceps. Mantené la cabeza mirando al frente.",
      "Con la espalda, los hombros y el core firmes, empujá las rodillas y los glúteos hacia afuera y comenzá el descenso. Sentate hacia atrás con las caderas hasta quedar sentado en el cajón. Idealmente, las tibias deben quedar perpendiculares al piso. Pausá al llegar al cajón y relajá los flexores de cadera. Nunca rebotes sobre el cajón.",
      "Manteniendo el peso en los talones y empujando los pies y las rodillas hacia afuera, impulsate hacia arriba desde el cajón liderando el movimiento con la cabeza. Continuá subiendo, manteniendo la tensión de pies a cabeza. Tené cuidado al devolver la barra al rack.",
    ],
    puntosClave: [
      "Las bandas inversas reducen la carga en la parte baja, permitiendo entrenar la técnica de profundidad con menos peso ahí.",
    ],
    erroresComunes: [
      "Rebotar sobre el cajón en lugar de pausar con control.",
    ],
  },

  "Reverse_Grip_Bent-Over_Rows": {
    nombre: "Remo inclinado con agarre supino",
    patron: "Tracción horizontal",
    unilateral: false,
    sinonimos: ["reverse grip row", "remo inclinado palmas arriba"],
    instrucciones: [
      "Pararte erguido sosteniendo una barra con agarre supino (palmas hacia arriba).",
      "Flexioná levemente las rodillas y llevá el torso hacia adelante doblándote desde la cintura, manteniendo la espalda recta hasta casi paralela al piso. Mantené la cabeza arriba. La barra debe colgar directamente frente a vos con los brazos perpendiculares al piso y al torso. Esta es la posición inicial.",
      "Manteniendo el torso fijo, levantá la barra mientras exhalás, manteniendo los codos cerca del cuerpo y sin hacer fuerza con el antebrazo más que para sostener el peso. En la posición contraída arriba, apretá los músculos de la espalda y sostené un segundo.",
      "Bajá lentamente el peso de nuevo a la posición inicial mientras inhalás.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "El agarre supino enfatiza más el bíceps y la espalda media-baja que el agarre pronado.",
    ],
    erroresComunes: [
      "Redondear la espalda baja.",
    ],
  },

  "Reverse_Triceps_Bench_Press": {
    nombre: "Press de banca inverso para tríceps",
    patron: "Empuje horizontal",
    unilateral: false,
    sinonimos: ["reverse grip bench press", "press de banca agarre supino"],
    instrucciones: [
      "Acostáte en un banco plano. Usando un agarre cerrado y supino (alrededor del ancho de hombros), levantá la barra del rack y sostenela en línea recta frente a vos, con los brazos bloqueados y perpendiculares al piso. Esta es la posición inicial.",
      "Mientras inhalás, bajá lentamente hasta sentir la barra en el centro del pecho. A diferencia del press de banca regular, mantené los codos cerca del torso en todo momento para maximizar la participación del tríceps.",
      "Después de una pausa de un segundo, volvé la barra a la posición inicial mientras exhalás y empujás con los músculos del tríceps. Bloqueá los brazos en la posición contraída, sostené un segundo y comenzá a bajar lentamente de nuevo. Debería llevar al menos el doble de tiempo bajar que subir.",
      "Repetí el movimiento las veces indicadas.",
      "Al terminar, colocá la barra de vuelta en el rack.",
    ],
    puntosClave: [
      "El agarre supino (en lugar de pronado) cambia el ángulo de tracción sobre el tríceps.",
    ],
    erroresComunes: [
      "Abrir los codos hacia afuera como en el press regular.",
    ],
  },

  "Romanian_Deadlift_from_Deficit": {
    nombre: "Peso muerto rumano desde déficit",
    patron: "Dominante de cadera",
    unilateral: false,
    sinonimos: ["romanian deadlift deficit", "rdl desde plataforma elevada"],
    instrucciones: [
      "Comenzá de pie sosteniendo una barra a extensión de brazos frente a vos. Podés pararte sobre una plataforma elevada para aumentar el rango de movimiento.",
      "Comenzá flexionando levemente las rodillas, y luego flexioná desde la cadera, llevando los glúteos hacia atrás lo más posible, bajando el torso tanto como la flexibilidad lo permita. La espalda debe permanecer en extensión absoluta en todo momento, y la barra debe mantenerse en contacto con las piernas. Si se hace correctamente, deberías sentir una tensión fuerte en los isquiotibiales.",
      "Revertí el movimiento para volver a la posición inicial.",
    ],
    puntosClave: [
      "Pararse sobre una plataforma elevada amplía el rango de estiramiento del isquiotibial respecto al RDL estándar.",
    ],
    erroresComunes: [
      "Redondear la espalda baja por el mayor rango de movimiento.",
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
console.log(`✅ Lote 17 aplicado — ${nuevasAgregadas} entradas nuevas agregadas.`);
