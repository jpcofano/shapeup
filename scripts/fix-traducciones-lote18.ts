/**
 * Lote 18 — 27 NUEVAS traducciones (barbell intermediate, tanda final).
 * Completa el pool de barbell + nivel intermediate.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const FILE = resolve("scripts/data/traducciones-fedb.es.json");
const t = JSON.parse(readFileSync(FILE, "utf8"));

const nuevos: Record<string, object> = {

  "Seated_Barbell_Military_Press": {
    nombre: "Press militar sentado con barra",
    patron: "Empuje vertical",
    unilateral: false,
    sinonimos: ["seated military press", "press militar sentado"],
    instrucciones: [
      "Sentáte en un banco de press militar con la barra detrás de la cabeza y pedile a un compañero que te la entregue (es mejor para el manguito rotador) o levantala con cuidado con agarre pronado (palmas hacia adelante). Tu agarre debe ser más ancho que el ancho de hombros y debe crear un ángulo de 90° entre antebrazo y brazo superior mientras la barra baja.",
      "Una vez que tomes la barra con el ancho de agarre correcto, levantala por encima de la cabeza bloqueando los brazos. Sostenela a la altura del hombro y levemente al frente de la cabeza. Esta es la posición inicial.",
      "Bajá la barra lentamente hacia la clavícula mientras inhalás.",
      "Subí la barra de vuelta a la posición inicial mientras exhalás.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "Que un compañero entregue la barra detrás de la cabeza reduce el estrés en el manguito rotador.",
    ],
    erroresComunes: [
      "Levantar la barra solo desde atrás sin ayuda, generando estrés innecesario en el hombro.",
    ],
  },

  "Seated_Close-Grip_Concentration_Barbell_Curl": {
    nombre: "Curl de concentración sentado con barra agarre cerrado",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["concentration curl con barra"],
    instrucciones: [
      "Sentáte en un banco plano con una barra o barra EZ frente a vos, entre las piernas. Las piernas deben estar separadas con las rodillas flexionadas y los pies en el piso.",
      "Usá los brazos para levantar la barra y colocá la parte posterior de los brazos superiores sobre la cara interna de los muslos (a unos 9 cm de la parte frontal de la rodilla). Se necesita un agarre supino más cerrado que el ancho de hombros para este ejercicio. El brazo debe estar extendido y la barra por encima del piso. Esta es la posición inicial.",
      "Manteniendo los brazos superiores fijos, curvá el peso hacia adelante contrayendo el bíceps mientras exhalás. Solo deben moverse los antebrazos. Continuá el movimiento hasta que el bíceps esté completamente contraído y la barra a la altura del hombro. Sostené la contracción un segundo apretando el bíceps.",
      "Comenzá a volver la barra a la posición inicial lentamente mientras inhalás. Evitá cualquier movimiento de balanceo.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "Apoyar los brazos en los muslos internos elimina por completo el impulso del torso.",
    ],
    erroresComunes: [
      "Balancear el cuerpo para ayudar a subir el peso.",
    ],
  },

  "Seated_Good_Mornings": {
    nombre: "Good morning sentado en cajón",
    patron: "Dominante de cadera",
    unilateral: false,
    sinonimos: ["seated good morning", "good morning desde caja"],
    instrucciones: [
      "Colocá un cajón dentro de un rack de potencia. Los pines deben ajustarse a la altura adecuada. Comenzá metiéndote debajo de la barra y colocándola en la parte posterior de los hombros, no sobre los trapecios. Apretá los omóplatos entre sí y rotá los codos hacia adelante, intentando doblar la barra sobre los hombros.",
      "Sacá la barra del rack creando un arco firme en la espalda baja. Mantené la cabeza mirando al frente. Con la espalda, los hombros y el core firmes, empujá las rodillas y los glúteos hacia afuera y comenzá el descenso. Sentate hacia atrás con las caderas hasta quedar sentado en el cajón. Esta es la posición inicial.",
      "Manteniendo la barra firme, inclinate hacia adelante desde la cadera lo más posible. Si ajustaste los pines a la altura paralela, tenés una red de seguridad en caso de fallar, y también sabés cuándo detenerte.",
      "Pausá justo por encima de los pines y revertí el movimiento hasta que el torso quede erguido.",
    ],
    puntosClave: [
      "Estar sentado en el cajón ofrece una red de seguridad si fallás el levantamiento.",
    ],
    erroresComunes: [
      "Redondear la espalda baja al inclinarse hacia adelante.",
    ],
  },

  "Single-Arm_Linear_Jammer": {
    nombre: "Landmine jammer lineal unilateral",
    patron: "Empuje vertical",
    unilateral: true,
    sinonimos: ["single arm jammer", "jammer lineal un brazo"],
    instrucciones: [
      "Colocá una barra en un soporte landmine o anclala firmemente en un rincón. Cargá la barra con el peso adecuado.",
      "Levantá la barra del piso, llevándola a la altura del hombro con una o ambas manos. Adoptá una postura amplia. Esta es la posición inicial.",
      "Ejecutá el movimiento extendiendo el codo, presionando el peso hacia arriba. Movete explosivamente, extendiendo completamente caderas y rodillas para producir la máxima fuerza posible.",
      "Volvé a la posición inicial.",
    ],
    puntosClave: [
      "La versión unilateral suma una exigencia de estabilidad de core asimétrica.",
    ],
    erroresComunes: [
      "No extender completamente caderas y rodillas, perdiendo potencia.",
    ],
  },

  "Snatch": {
    nombre: "Arrancada (snatch)",
    patron: "Empuje vertical",
    unilateral: false,
    sinonimos: ["snatch", "arrancada olimpica"],
    instrucciones: [
      "Colocá los pies al ancho de hombros con la barra apoyada justo encima de la unión entre los dedos del pie y el resto del pie.",
      "Con agarre pronado, flexioná las rodillas y, manteniendo la espalda plana, tomá la barra con un agarre más ancho que el ancho de hombros. Bajá las caderas y asegurate de que el cuerpo descienda como si te fueras a sentar en una silla. Esta es la posición inicial.",
      "Comenzá a empujar el piso con los pies como si fuera una plataforma móvil, y simultáneamente comenzá a levantar la barra manteniéndola cerca de las piernas.",
      "Cuando la barra llegue a la mitad de los muslos, empujá el piso con las piernas y elevá el cuerpo hasta la extensión completa en un movimiento explosivo.",
      "Elevá los hombros hacia atrás en un movimiento de encogimiento mientras subís la barra, llevando los codos hacia los costados y manteniéndolos por encima de la barra el mayor tiempo posible.",
      "Ahora, en un movimiento muy rápido pero poderoso, tenés que meter el cuerpo debajo de la barra cuando haya alcanzado una altura suficiente para controlarla, y caer mientras bloqueás los brazos sosteniendo la barra por encima de la cabeza al adoptar una posición de sentadilla.",
      "Finalizá el movimiento subiendo desde la posición de sentadilla para completar el levantamiento. Al final del levantamiento, ambos pies deben estar alineados y los brazos completamente extendidos sosteniendo la barra por encima de la cabeza.",
    ],
    puntosClave: [
      "El levantamiento olímpico más técnico: exige movilidad completa de tobillo, cadera y hombro.",
    ],
    erroresComunes: [
      "No meterse lo suficientemente rápido debajo de la barra.",
    ],
  },

  "Snatch_Balance": {
    nombre: "Balance de arrancada (snatch balance)",
    patron: "Empuje vertical",
    unilateral: false,
    sinonimos: ["snatch balance", "balance de la arrancada"],
    instrucciones: [
      "Comenzá con los pies en posición de tirón, la barra apoyada en la parte posterior de los hombros, y las manos en un agarre ancho de arrancada.",
      "Hacé un hundimiento abrupto con las rodillas y empujá la barra hacia arriba, metiéndote agresivamente debajo de ella mientras movés los pies a la posición de recepción.",
      "Recibí la barra bloqueada por encima de la cabeza cerca del fondo de la sentadilla. El torso debe permanecer vertical, bajando las caderas entre las piernas.",
      "Continuá descendiendo hasta la profundidad completa, y volvé a una posición de pie. Bajá el peso con cuidado.",
    ],
    puntosClave: [
      "Es un ejercicio técnico para la arrancada: enseña a recibir el peso arriba en sentadilla completa con torso vertical.",
    ],
    erroresComunes: [
      "Inclinar el torso hacia adelante al recibir el peso.",
    ],
  },

  "Snatch_Deadlift": {
    nombre: "Peso muerto de arrancada (snatch deadlift)",
    patron: "Dominante de cadera",
    unilateral: false,
    sinonimos: ["snatch deadlift", "deadlift estilo arrancada"],
    instrucciones: [
      "El peso muerto de arrancada fortalece el primer tirón de la arrancada. Comenzá con un agarre ancho de arrancada y la barra apoyada en el piso. Los pies deben estar directamente debajo de las caderas, con las puntas hacia afuera. Hacé sentadilla hacia la barra, manteniendo la espalda en extensión absoluta con la cabeza mirando al frente.",
      "Iniciá el movimiento empujando a través de los talones, elevando las caderas. El ángulo de la espalda debe mantenerse igual hasta que la barra pase las rodillas.",
      "En ese punto, empujá las caderas hacia la barra mientras te reclinás hacia atrás. Volvé la barra al piso revirtiendo el movimiento.",
    ],
    puntosClave: [
      "El agarre ancho distingue este ejercicio del deadlift convencional, preparando el primer tirón de la arrancada.",
    ],
    erroresComunes: [
      "Cambiar el ángulo de espalda a mitad del levantamiento.",
    ],
  },

  "Snatch_Pull": {
    nombre: "Tirón de arrancada (snatch pull)",
    patron: "Dominante de cadera",
    unilateral: false,
    sinonimos: ["snatch pull", "tiron de arrancada olimpica"],
    instrucciones: [
      "Con la barra en el piso cerca de las tibias, tomá un agarre ancho de arrancada. Bajá las caderas con el peso enfocado en los talones, espalda recta, cabeza al frente, pecho arriba, con los hombros justo por delante de la barra. Esta es la posición inicial.",
      "Comenzá el primer tirón empujando a través de los talones, extendiendo las rodillas. El ángulo de la espalda debe mantenerse igual, y los brazos deben permanecer rectos. Movés el peso con control mientras continuás hasta por encima de las rodillas.",
      "Luego viene el segundo tirón, la principal fuente de aceleración del tirón. Cuando la barra se acerca a la mitad del muslo, comenzá a extender la cadera. En un movimiento de salto, acelerá extendiendo cadera, rodillas y tobillos, usando velocidad para mover la barra hacia arriba.",
      "No debería ser necesario tirar activamente con los brazos para acelerar el peso; al final del segundo tirón, el cuerpo debe estar completamente extendido, inclinado levemente hacia atrás. La extensión final debe ser violenta y abrupta; asegurate de no prolongarla más de lo necesario.",
    ],
    puntosClave: [
      "El agarre ancho de arrancada distingue este tirón del clean pull.",
    ],
    erroresComunes: [
      "Prolongar demasiado la extensión final en lugar de hacerla explosiva.",
    ],
  },

  "Snatch_Shrug": {
    nombre: "Encogimiento de arrancada (snatch shrug)",
    patron: "Dominante de cadera",
    unilateral: false,
    sinonimos: ["snatch shrug", "shrug de arrancada olimpica"],
    instrucciones: [
      "Comenzá con un agarre ancho, con la barra colgando a la altura media del muslo. Podés usar agarre de gancho o pronado. La espalda recta e inclinada levemente hacia adelante.",
      "Encogé los hombros hacia las orejas. Aunque este ejercicio normalmente puede cargarse con más peso que una arrancada completa, evitá sobrecargar hasta el punto de que la ejecución se vuelva lenta.",
    ],
    puntosClave: [
      "El agarre ancho lo distingue del clean shrug, enfocado en la técnica de arrancada.",
    ],
    erroresComunes: [
      "Sobrecargar tanto que el movimiento se vuelve lento.",
    ],
  },

  "Speed_Box_Squat": {
    nombre: "Sentadilla al cajón de velocidad",
    patron: "Dominante de rodilla",
    unilateral: false,
    sinonimos: ["speed box squat", "box squat de velocidad"],
    instrucciones: [
      "Anclá bandas a la barra, asegurándolas firmemente cerca del piso. Puede ser necesario ajustar las bandas para generar tensión adecuada.",
      "Usá un cajón de altura adecuada para este ejercicio. Cargá la barra con un peso que aún requiera esfuerzo, pero que no sea tan pesado como para comprometer la velocidad. Normalmente eso es entre el 50% y el 70% de tu repetición máxima.",
      "Colocá la barra sobre la espalda alta, con los omóplatos retraídos, la espalda arqueada y todo el cuerpo firme de pies a cabeza. Esta es la posición inicial.",
      "Sacá la barra del rack y posicionate frente al cajón. Sentate hacia atrás con las caderas hasta quedar sentado en el cajón, asegurándote de descender con control y sin golpear la superficie.",
      "Pausá brevemente, y explotá desde el cajón, extendiendo caderas y rodillas.",
    ],
    puntosClave: [
      "El objetivo es la velocidad de ejecución, no la carga máxima; usá entre 50-70% de tu 1RM.",
    ],
    erroresComunes: [
      "Usar demasiado peso, comprometiendo la velocidad del movimiento.",
    ],
  },

  "Split_Clean": {
    nombre: "Cargada partida (split clean)",
    patron: "Dominante de cadera",
    unilateral: false,
    sinonimos: ["split clean", "cargada con recepcion partida"],
    instrucciones: [
      "Con la barra en el piso cerca de las tibias, tomá un agarre pronado justo afuera de las piernas. Bajá las caderas con el peso enfocado en los talones, espalda recta, cabeza al frente, pecho arriba, con los hombros justo por delante de la barra. Esta es la posición inicial.",
      "Comenzá el primer tirón empujando a través de los talones, extendiendo las rodillas. El ángulo de la espalda debe mantenerse igual, y los brazos deben permanecer rectos. Movés el peso con control mientras continuás hasta por encima de las rodillas.",
      "Luego viene el segundo tirón, la principal fuente de aceleración de la cargada. Cuando la barra se acerca a la mitad del muslo, comenzá a extender la cadera. En un movimiento de salto, acelerá extendiendo cadera, rodillas y tobillos, usando velocidad para mover la barra hacia arriba. Al final del segundo tirón, el cuerpo debe estar completamente extendido, inclinado levemente hacia atrás, con los brazos todavía extendidos.",
      "Al alcanzar la extensión completa, pasá al tercer tirón encogiendo agresivamente los hombros y flexionando los brazos con los codos hacia arriba y afuera. En el pico de la extensión, tirate hacia abajo agresivamente, rotando los codos por debajo de la barra.",
      "Recibí la barra con los pies en posición dividida, moviendo agresivamente un pie hacia adelante y otro hacia atrás. La barra debe quedar apoyada sobre los hombros protraídos, tocando levemente la garganta con las manos relajadas. Continuá descendiendo hasta la posición baja, lo cual ayuda en la recuperación.",
      "Recuperate inmediatamente empujando a través de los talones, manteniendo el torso erguido y los codos arriba. Juntá los pies mientras te ponés de pie.",
    ],
    puntosClave: [
      "La recepción con los pies en posición dividida (en lugar de paralelos) es la técnica clásica de cargada.",
    ],
    erroresComunes: [
      "No coordinar el movimiento de los pies con el momento exacto del tirón.",
    ],
  },

  "Split_Jerk": {
    nombre: "Envión partido (split jerk)",
    patron: "Empuje vertical",
    unilateral: false,
    sinonimos: ["split jerk", "envion con recepcion partida"],
    instrucciones: [
      "Parado con el peso apoyado en la parte frontal de los hombros, comenzá con el hundimiento. Con los pies directamente debajo de las caderas, flexioná las rodillas sin mover las caderas hacia atrás.",
      "Bajá solo levemente, y revertí la dirección con la mayor potencia posible. Empujá a través de los talones para generar la mayor velocidad y fuerza posible, y asegurate de mover la cabeza fuera del camino mientras la barra se aleja de los hombros. En el momento en que los pies dejan el piso, deben colocarse en la posición de recepción lo más rápido posible.",
      "En el breve momento en que los pies no están empujando activamente contra el piso, el esfuerzo del atleta por empujar la barra hacia arriba lo impulsará hacia abajo. Los pies deben moverse a una posición dividida, uno adelante y otro atrás, con las rodillas parcialmente flexionadas. Recibí la barra con los brazos bloqueados por encima de la cabeza.",
      "Volvé a una posición de pie, juntando los pies.",
    ],
    puntosClave: [
      "La posición dividida al recibir el peso permite manejar cargas más pesadas que el push press.",
    ],
    erroresComunes: [
      "No mover la cabeza a tiempo mientras la barra sube.",
    ],
  },

  "Squat_with_Bands": {
    nombre: "Sentadilla con bandas",
    patron: "Dominante de rodilla",
    unilateral: false,
    sinonimos: ["squat con bandas", "sentadilla con resistencia variable"],
    instrucciones: [
      "Configurá las bandas en las mangas de la barra, asegurándolas a clavijas, al rack, o a mancuernas, de modo que haya tensión adecuada.",
      "Comenzá metiéndote debajo de la barra y colocándola en la parte posterior de los hombros. Apretá los omóplatos entre sí y rotá los codos hacia adelante, intentando doblar la barra sobre los hombros. Sacá la barra del rack creando un arco firme en la espalda baja, y retrocedé a la posición. Colocá los pies separados para enfatizar espalda, glúteos, aductores e isquiotibiales. Mantené la cabeza mirando al frente.",
      "Con la espalda, los hombros y el core firmes, empujá las rodillas y los glúteos hacia afuera y comenzá el descenso. Sentate hacia atrás con las caderas lo más posible. Idealmente, las tibias deben quedar perpendiculares al piso. Una posición más baja de la barra requiere mayor inclinación del torso para mantenerla sobre los talones. Continuá hasta romper la paralela, definida como el pliegue de la cadera alineado con la parte superior de la rodilla.",
      "Manteniendo el peso en los talones y empujando los pies y las rodillas hacia afuera, impulsate hacia arriba liderando el movimiento con la cabeza. Continuá subiendo, manteniendo la tensión de pies a cabeza, hasta volver a la posición inicial.",
    ],
    puntosClave: [
      "Las bandas agregan resistencia variable: más carga cuanto más arriba estás en el recorrido.",
    ],
    erroresComunes: [
      "No ajustar bien la tensión inicial de las bandas.",
    ],
  },

  "Squat_with_Chains": {
    nombre: "Sentadilla con cadenas",
    patron: "Dominante de rodilla",
    unilateral: false,
    sinonimos: ["squat con cadenas", "sentadilla con resistencia progresiva"],
    instrucciones: [
      "Para configurar las cadenas, comenzá pasando la cadena guía por encima de las mangas de la barra. La cadena pesada debe sujetarse con un mosquetón. Ajustá la longitud de la cadena guía de modo que queden algunos eslabones en el piso en la parte superior del movimiento.",
      "Comenzá metiéndote debajo de la barra y colocándola en la parte posterior de los hombros. Apretá los omóplatos entre sí y rotá los codos hacia adelante, intentando doblar la barra sobre los hombros. Sacá la barra del rack creando un arco firme en la espalda baja, y retrocedé a la posición. Colocá los pies separados para enfatizar espalda, glúteos, aductores e isquiotibiales. Mantené la cabeza mirando al frente.",
      "Con la espalda, los hombros y el core firmes, empujá las rodillas y los glúteos hacia afuera y comenzá el descenso. Sentate hacia atrás con las caderas lo más posible. Idealmente, las tibias deben quedar perpendiculares al piso. Una posición más baja de la barra requiere mayor inclinación del torso para mantenerla sobre los talones. Continuá hasta romper la paralela, definida como el pliegue de la cadera alineado con la parte superior de la rodilla.",
      "Manteniendo el peso en los talones y empujando los pies y las rodillas hacia afuera, impulsate hacia arriba liderando el movimiento con la cabeza. Continuá subiendo, manteniendo la tensión de pies a cabeza, hasta volver a la posición inicial.",
    ],
    puntosClave: [
      "Las cadenas se levantan del piso progresivamente, sumando peso efectivo cuanto más alto subís.",
    ],
    erroresComunes: [
      "No ajustar bien la longitud de la cadena, perdiendo el efecto de resistencia progresiva.",
    ],
  },

  "Squat_with_Plate_Movers": {
    nombre: "Sentadilla con desplazamiento de disco",
    patron: "Dominante de rodilla",
    unilateral: false,
    sinonimos: ["squat plate movers", "sentadilla con disco deslizante"],
    instrucciones: [
      "Para comenzar, colocá la barra en un rack justo debajo de la altura del hombro. Colocá un disco de peso en el piso a un par de pasos detrás del rack. Una vez cargada la barra, metete debajo de ella y colocá la parte posterior de los hombros bajo ella.",
      "Sosteniendo la barra con ambas manos, levantala del rack empujando con las piernas mientras enderezás el torso al mismo tiempo.",
      "Alejate del rack y adoptá una postura amplia con las puntas levemente hacia afuera, con un pie sobre el disco de peso. Mantené la cabeza arriba en todo momento. Esta es la posición inicial.",
      "Comenzá a bajar la barra lentamente flexionando rodillas y caderas. Continuá bajando hasta que el ángulo entre el muslo y la pantorrilla sea levemente menor a 90°.",
      "Subí la barra mientras exhalás, empujando el piso con los talones mientras extendés caderas y rodillas.",
      "En la parte superior del movimiento, dá un paso lateral, juntando los pies del lado opuesto al disco.",
      "Usando el pie interno, empujá el disco de peso, deslizándolo por el piso hacia donde estabas parado antes.",
      "Colocá el pie interno sobre el disco de peso, adoptando una postura amplia para la siguiente repetición.",
    ],
    puntosClave: [
      "Combina la sentadilla con un desplazamiento lateral usando el disco como guía, sumando un componente de coordinación.",
    ],
    erroresComunes: [
      "Perder el equilibrio durante el paso lateral con el peso en los hombros.",
    ],
  },

  "Standing_Barbell_Press_Behind_Neck": {
    nombre: "Press de pie tras nuca con barra",
    patron: "Empuje vertical",
    unilateral: false,
    sinonimos: ["behind the neck press de pie", "press tras nuca con barra"],
    instrucciones: [
      "Este ejercicio se realiza mejor dentro de un rack de sentadillas para facilitar tomar la barra. Para comenzar, colocá la barra en un rack a la altura que mejor se adapte a tu altura. Una vez elegida la altura correcta y cargada la barra, metete debajo de ella y colocá la parte posterior de los hombros (levemente debajo del cuello) bajo la barra.",
      "Sosteniendo la barra con ambos brazos a los costados, levantala del rack empujando con las piernas mientras enderezás el torso al mismo tiempo.",
      "Alejate del rack y colocá las piernas en una postura media al ancho de hombros con las puntas levemente hacia afuera. Mantené la espalda recta durante todo el ejercicio. Esta es la posición inicial.",
      "Elevá la barra por encima de la cabeza extendiendo completamente los brazos mientras exhalás.",
      "Sostené la contracción un segundo y bajá la barra a la posición inicial mientras inhalás.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "El press tras nuca exige buena movilidad de hombro; se debe ejecutar con mucho control.",
    ],
    erroresComunes: [
      "Forzar el rango de movimiento sin la movilidad de hombro adecuada.",
    ],
  },

  "Standing_Front_Barbell_Raise_Over_Head": {
    nombre: "Elevación frontal con barra hasta por encima de la cabeza",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["front raise overhead con barra"],
    instrucciones: [
      "Para comenzar, pararte derecho con una barra en las manos. Tomá la barra con las palmas hacia abajo y un agarre más cerrado que el ancho de hombros.",
      "Los pies deben estar al ancho de hombros. Los codos deben tener una leve flexión. Esta es la posición inicial.",
      "Elevá la barra hasta que quede directamente por encima de la cabeza mientras exhalás. Asegurate de mantener los codos con una leve flexión durante cada repetición.",
      "Una vez que sientas la contracción, comenzá a bajar la barra de vuelta a la posición inicial mientras inhalás.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "El rango completo hasta por encima de la cabeza exige más movilidad de hombro que una elevación frontal estándar.",
    ],
    erroresComunes: [
      "Bloquear completamente los codos en lugar de mantener una leve flexión.",
    ],
  },

  "Stiff-Legged_Barbell_Deadlift": {
    nombre: "Peso muerto piernas rígidas con barra",
    patron: "Dominante de cadera",
    unilateral: false,
    sinonimos: ["stiff legged deadlift con barra", "peso muerto rumano con barra"],
    instrucciones: [
      "Tomá una barra con agarre pronado (palmas hacia abajo). Puede que necesites muñequeras si usás bastante peso.",
      "Pararte con el torso recto y las piernas separadas al ancho de hombros o más cerradas. Las rodillas deben estar levemente flexionadas. Esta es la posición inicial.",
      "Manteniendo las rodillas fijas, bajá la barra hasta la altura de los pies flexionando desde la cadera mientras mantenés la espalda recta. Seguí bajando como si fueras a levantar algo del piso hasta sentir el estiramiento en los isquiotibiales. Inhalá durante este movimiento.",
      "Comenzá a subir el torso de nuevo extendiendo las caderas hasta volver a la posición inicial. Exhalá durante este movimiento.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "Las rodillas permanecen con la misma leve flexión durante todo el movimiento; el rango viene de la cadera.",
    ],
    erroresComunes: [
      "Redondear la espalda baja al bajar.",
    ],
  },

  "Sumo_Deadlift": {
    nombre: "Peso muerto sumo",
    patron: "Dominante de cadera",
    unilateral: false,
    sinonimos: ["sumo deadlift", "peso muerto piernas separadas"],
    instrucciones: [
      "Comenzá con una barra cargada en el piso. Acercate a la barra de modo que quede en el medio de los pies. Los pies deben estar muy separados, cerca de los discos. Flexioná desde la cadera para agarrar la barra. Los brazos deben quedar directamente debajo de los hombros, por dentro de las piernas, y podés usar agarre pronado, mixto, o de gancho. Relajá los hombros, lo que en efecto alarga los brazos.",
      "Tomá una bocanada de aire, y luego bajá las caderas, mirando hacia adelante con la cabeza y el pecho arriba. Empujá a través del piso, separando los pies, con el peso en la mitad posterior de los pies. Extendé caderas y rodillas.",
      "Cuando la barra pase las rodillas, reclinate hacia atrás y empujá las caderas hacia la barra, juntando los omóplatos.",
      "Devolvé el peso al piso flexionando desde la cadera y controlando el peso en el descenso.",
    ],
    puntosClave: [
      "La postura ancha reduce el rango de movimiento y favorece a quienes tienen torsos más largos.",
    ],
    erroresComunes: [
      "Dejar que las rodillas colapsen hacia adentro por la postura ancha.",
    ],
  },

  "Sumo_Deadlift_with_Bands": {
    nombre: "Peso muerto sumo con bandas",
    patron: "Dominante de cadera",
    unilateral: false,
    sinonimos: ["sumo deadlift con bandas"],
    instrucciones: [
      "Para hacer deadlift con bandas cortas, simplemente pasalas por encima de la barra antes de empezar, y metete dentro de ellas para configurar. Asegurate de que queden bajo la mitad posterior del pie, justo donde estás empujando contra el piso.",
      "Comenzá con una barra cargada en el piso. Acercate a la barra de modo que quede en el medio de los pies. Los pies deben estar muy separados, cerca de los discos. Flexioná desde la cadera para agarrar la barra. Los brazos deben quedar directamente debajo de los hombros, por dentro de las piernas, y podés usar agarre pronado, mixto, o de gancho.",
      "Tomá una bocanada de aire, y luego bajá las caderas, mirando hacia adelante con la cabeza y el pecho arriba. Empujá a través del piso, separando los pies, con el peso en la mitad posterior de los pies. Extendé caderas y rodillas.",
      "Cuando la barra pase las rodillas, reclinate hacia atrás y empujá las caderas hacia la barra, juntando los omóplatos.",
      "Devolvé el peso al piso flexionando desde la cadera y controlando el peso en el descenso.",
    ],
    puntosClave: [
      "Las bandas agregan resistencia adicional en el bloqueo final, donde el sumo deadlift suele ser más fácil.",
    ],
    erroresComunes: [
      "No colocar las bandas exactamente bajo la mitad posterior del pie.",
    ],
  },

  "Sumo_Deadlift_with_Chains": {
    nombre: "Peso muerto sumo con cadenas",
    patron: "Dominante de cadera",
    unilateral: false,
    sinonimos: ["sumo deadlift con cadenas"],
    instrucciones: [
      "Podés sujetar las cadenas a las mangas de la barra, o simplemente colgar el medio sobre la barra para que haya un mayor incremento de peso al levantar. Intentá mantener los extremos de las cadenas lejos de los discos para no golpearlos al bajar el peso.",
      "Comenzá con una barra cargada en el piso. Acercate a la barra de modo que quede en el medio de los pies. Los pies deben estar muy separados, cerca de los discos. Flexioná desde la cadera para agarrar la barra. Los brazos deben quedar directamente debajo de los hombros, por dentro de las piernas, y podés usar agarre pronado, mixto, o de gancho. Relajá los hombros, lo que en efecto alarga los brazos.",
      "Tomá una bocanada de aire, y luego bajá las caderas, mirando hacia adelante con la cabeza y el pecho arriba. Empujá a través del piso, separando los pies, con el peso en la mitad posterior de los pies. Extendé caderas y rodillas.",
      "Cuando la barra pase las rodillas, reclinate hacia atrás y empujá las caderas hacia la barra, juntando los omóplatos.",
      "Devolvé el peso al piso flexionando desde la cadera y controlando el peso en el descenso.",
    ],
    puntosClave: [
      "Las cadenas suman peso progresivamente al subir, igual que en la sentadilla con cadenas.",
    ],
    erroresComunes: [
      "Dejar que las cadenas golpeen los discos durante el movimiento.",
    ],
  },

  "Weighted_Jump_Squat": {
    nombre: "Salto en sentadilla con peso",
    patron: "Dominante de rodilla",
    unilateral: false,
    sinonimos: ["jump squat con barra", "salto en sentadilla cargado"],
    instrucciones: [
      "Colocá una barra con poca carga en la parte posterior de los hombros. También podés usar un chaleco con peso, una bolsa de arena u otro tipo de resistencia para este ejercicio.",
      "El peso debe ser suficientemente liviano para que no te frene significativamente. Los pies deben estar levemente más separados que el ancho de hombros, con la cabeza y el pecho arriba. Esta es la posición inicial.",
      "Usando un contramovimiento, hacé una sentadilla parcial y revertí inmediatamente la dirección para explotar desde el piso, extendiendo caderas, rodillas y tobillos. Mantené una buena postura durante todo el salto.",
      "Al volver al piso, absorbé el impacto con las piernas.",
    ],
    puntosClave: [
      "El peso debe ser liviano; el objetivo es la potencia, no la carga máxima.",
    ],
    erroresComunes: [
      "Usar demasiado peso, comprometiendo la velocidad del salto.",
    ],
  },

  "Wide-Grip_Barbell_Bench_Press": {
    nombre: "Press de banca con agarre ancho",
    patron: "Empuje horizontal",
    unilateral: false,
    sinonimos: ["wide grip bench press", "press de pecho agarre ancho"],
    instrucciones: [
      "Acostáte en un banco plano con los pies firmes en el piso. Usando un agarre ancho y pronado (palmas hacia adelante) que esté unos 7 cm más ancho que el hombro de cada lado, levantá la barra del rack y sostenela en línea recta sobre vos con los brazos bloqueados. La barra debe quedar perpendicular al torso y al piso. Esta es la posición inicial.",
      "Mientras inhalás, bajá lentamente hasta sentir la barra en el centro del pecho.",
      "Después de una pausa de un segundo, volvé la barra a la posición inicial mientras exhalás y empujás con los músculos del pecho. Bloqueá los brazos y apretá el pecho en la posición contraída, sostené un segundo y comenzá a bajar lentamente de nuevo. Debería llevar al menos el doble de tiempo bajar que subir.",
      "Repetí el movimiento las veces indicadas.",
    ],
    puntosClave: [
      "El agarre ancho enfatiza la parte exterior del pectoral, reduciendo el rango de movimiento del hombro.",
    ],
    erroresComunes: [
      "Usar un agarre demasiado ancho que genere dolor en el hombro.",
    ],
  },

  "Wide-Grip_Decline_Barbell_Bench_Press": {
    nombre: "Press decline con agarre ancho",
    patron: "Empuje horizontal",
    unilateral: false,
    sinonimos: ["wide grip decline bench press"],
    instrucciones: [
      "Acostáte en un banco decline con los pies firmemente trabados en el extremo del banco. Usando un agarre ancho y pronado (palmas hacia adelante) que esté unos 7 cm más ancho que el hombro de cada lado, levantá la barra del rack y sostenela en línea recta sobre vos con los brazos bloqueados. La barra debe quedar perpendicular al torso y al piso. Esta es la posición inicial.",
      "Mientras inhalás, bajá lentamente hasta sentir la barra en la parte inferior del pecho.",
      "Después de una pausa de un segundo, volvé la barra a la posición inicial mientras exhalás y empujás con los músculos del pecho. Bloqueá los brazos y apretá el pecho en la posición contraída, sostené un segundo y comenzá a bajar lentamente de nuevo. Debería llevar al menos el doble de tiempo bajar que subir.",
      "Repetí el movimiento las veces indicadas.",
    ],
    puntosClave: [
      "Combina el ángulo decline con el agarre ancho para maximizar el énfasis en la parte inferior y exterior del pectoral.",
    ],
    erroresComunes: [
      "Levantar la barra del rack sin ayuda en este ángulo difícil.",
    ],
  },

  "Wide-Grip_Decline_Barbell_Pullover": {
    nombre: "Pullover decline con barra agarre ancho",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["decline pullover agarre ancho"],
    instrucciones: [
      "Acostáte en un banco decline con ambas piernas firmemente trabadas en posición. Alcanzá la barra detrás de la cabeza con agarre pronado (palmas hacia afuera). Asegurate de tomar la barra más ancha que el ancho de hombros para este ejercicio. Levantá lentamente la barra del piso usando los brazos.",
      "Cuando estés bien posicionado, los brazos deben quedar completamente extendidos y perpendiculares al piso. Esta es la posición inicial.",
      "Comenzá moviendo la barra hacia abajo en un movimiento semicircular como si la fueras a colocar en el piso, pero en lugar de eso, detenete cuando los brazos queden paralelos al piso. Mantenés los brazos completamente extendidos en todo momento. El movimiento debe ocurrir solo en la articulación del hombro. Inhalá durante esta parte del movimiento.",
      "Ahora subí la barra mientras exhalás hasta volver a la posición inicial. Recordá mantener el control total de la barra en todo momento.",
      "Repetí el movimiento las veces indicadas de tu programa de entrenamiento.",
      "Cuando termines la serie, bajá lentamente la barra hasta que quede al nivel de la cabeza y soltala.",
    ],
    puntosClave: [
      "El agarre ancho amplía el estiramiento del dorsal y el pectoral comparado con la versión estándar.",
    ],
    erroresComunes: [
      "Flexionar los codos durante el recorrido, perdiendo tensión en hombros y dorsal.",
    ],
  },

  "Wide_Stance_Barbell_Squat": {
    nombre: "Sentadilla con postura amplia",
    patron: "Dominante de rodilla",
    unilateral: false,
    sinonimos: ["wide stance squat", "sentadilla pies separados"],
    instrucciones: [
      "Este ejercicio se realiza mejor dentro de un rack de sentadillas por seguridad. Para comenzar, colocá la barra en un rack a la altura que mejor se adapte a tu altura. Una vez elegida la altura correcta y cargada la barra, metete debajo de ella y colocá la parte posterior de los hombros (levemente debajo del cuello) bajo la barra.",
      "Sosteniendo la barra con ambos brazos a los costados, levantala del rack empujando con las piernas mientras enderezás el torso al mismo tiempo.",
      "Alejate del rack y colocá las piernas en una postura más ancha que el ancho de hombros, con las puntas levemente hacia afuera. Mantené la cabeza arriba en todo momento (mirar hacia abajo te desequilibra) y la espalda recta. Esta es la posición inicial.",
      "Comenzá a bajar la barra lentamente flexionando las rodillas mientras mantenés la postura recta y la cabeza arriba. Continuá bajando hasta que el ángulo entre el muslo y la pantorrilla sea levemente menor a 90° (el punto en que los muslos quedan por debajo de paralelo al piso). Inhalá durante esta parte. Si la ejecución es correcta, el frente de las rodillas debe formar una línea recta imaginaria con los dedos de los pies, perpendicular al frente. Si las rodillas sobrepasan esa línea, estás generando estrés innecesario en la rodilla.",
      "Comenzá a subir la barra mientras exhalás, empujando el piso con el talón mientras extendés las piernas y volvés a la posición inicial.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "La postura amplia recluta más glúteos, aductores e isquiotibiales que la postura media.",
    ],
    erroresComunes: [
      "Dejar que las rodillas colapsen hacia adentro por la postura ancha.",
    ],
  },

  "Wide_Stance_Stiff_Legs": {
    nombre: "Piernas rígidas con postura amplia",
    patron: "Dominante de cadera",
    unilateral: false,
    sinonimos: ["wide stance stiff legs", "stiff leg postura amplia"],
    instrucciones: [
      "Comenzá con una barra cargada en el piso. Adoptá una postura amplia, y flexioná desde la cadera para agarrar la barra. Las caderas deben estar lo más atrás posible, y las piernas casi rectas. Mantené la espalda recta, y la cabeza y el pecho arriba. Esta es la posición inicial.",
      "Comenzá el movimiento activando la cadera, empujándola hacia adelante mientras dejás que los brazos cuelguen rectos. Continuá hasta quedar completamente de pie, y luego volvé lentamente el peso a la posición inicial. Para repeticiones sucesivas, el peso no necesita tocar el piso.",
    ],
    puntosClave: [
      "La postura amplia y las piernas casi rectas enfatizan fuertemente los isquiotibiales y los aductores.",
    ],
    erroresComunes: [
      "Flexionar las rodillas en lugar de mantenerlas casi rectas.",
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
console.log(`✅ Lote 18 aplicado — ${nuevasAgregadas} entradas nuevas agregadas.`);
