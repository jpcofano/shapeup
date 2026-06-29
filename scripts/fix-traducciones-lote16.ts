/**
 * Lote 16 — 30 NUEVAS traducciones (barbell intermediate, tanda 1).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const FILE = resolve("scripts/data/traducciones-fedb.es.json");
const t = JSON.parse(readFileSync(FILE, "utf8"));

const nuevos: Record<string, object> = {

  "Barbell_Ab_Rollout": {
    nombre: "Rodada abdominal con barra (ab rollout)",
    patron: "Core anti-extensión",
    unilateral: false,
    sinonimos: ["barbell rollout", "ab rollout con barra"],
    instrucciones: [
      "Para este ejercicio vas a adoptar una posición de flexión de brazos, pero en lugar de tener las manos en el piso, vas a sostener una barra olímpica (cargada con 2-4 kg de cada lado). Esta es la posición inicial.",
      "Manteniendo un leve arco en la espalda, elevá las caderas y rodá la barra hacia los pies mientras exhalás. Al ejecutar el movimiento, los glúteos deben subir, el abdomen debe estar firme y la postura de la espalda se mantiene en todo momento. También los brazos deben permanecer perpendiculares al piso durante todo el movimiento. Si no es así, vas a trabajar más los hombros y la espalda que el abdomen.",
      "Después de una contracción de un segundo en la parte superior, comenzá a rodar la barra hacia adelante de vuelta a la posición inicial lentamente mientras inhalás.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "Los brazos deben permanecer perpendiculares al piso en todo momento para mantener el énfasis en el abdomen.",
    ],
    erroresComunes: [
      "Dejar que los brazos se inclinen hacia adelante, trasladando el trabajo a hombros y espalda.",
    ],
  },

  "Barbell_Deadlift": {
    nombre: "Peso muerto con barra",
    patron: "Dominante de cadera",
    unilateral: false,
    sinonimos: ["deadlift convencional", "peso muerto clasico"],
    instrucciones: [
      "Pararte frente a una barra cargada.",
      "Manteniendo la espalda lo más recta posible, flexioná las rodillas, inclinate hacia adelante y tomá la barra con un agarre medio (al ancho de hombros), pronado. Esta es la posición inicial del ejercicio. Si te resulta difícil sostener la barra con este agarre, alterná el agarre o usá correas de muñeca.",
      "Sosteniendo la barra, iniciá el levantamiento empujando con las piernas mientras simultáneamente llevás el torso a la posición erguida al exhalar. En la posición erguida, sacá el pecho y contraé la espalda llevando los omóplatos hacia atrás. Pensá en cómo se ven los soldados parados en posición de firmes.",
      "Volvé a la posición inicial flexionando las rodillas mientras simultáneamente inclinás el torso hacia adelante desde la cintura, manteniendo la espalda recta. Cuando los discos de la barra toquen el piso, estás de vuelta en la posición inicial y listo para otra repetición.",
      "Realizá la cantidad de repeticiones indicadas en el programa.",
    ],
    puntosClave: [
      "El ejercicio base de fuerza de cadena posterior: espalda recta y empuje de piernas en todo momento.",
    ],
    erroresComunes: [
      "Redondear la espalda baja al levantar el peso.",
    ],
  },

  "Barbell_Full_Squat": {
    nombre: "Sentadilla profunda con barra",
    patron: "Dominante de rodilla",
    unilateral: false,
    sinonimos: ["full squat", "sentadilla completa con barra"],
    instrucciones: [
      "Este ejercicio se realiza mejor dentro de un rack de sentadillas por seguridad. Para comenzar, colocá la barra en el rack justo por encima de la altura del hombro. Una vez elegida la altura correcta y cargada la barra, metete debajo de ella y colocá la parte posterior de los hombros (levemente debajo del cuello) bajo la barra.",
      "Sosteniendo la barra con ambos brazos a los costados, levantala del rack empujando con las piernas mientras enderezás el torso al mismo tiempo.",
      "Alejate del rack y colocá las piernas en una postura media al ancho de hombros con las puntas de los pies levemente hacia afuera. Mantené la cabeza arriba en todo momento y la espalda recta. Esta es la posición inicial.",
      "Comenzá a bajar la barra lentamente flexionando las rodillas y llevando las caderas hacia atrás mientras mantenés la postura recta y la cabeza arriba. Continuá bajando hasta que los isquiotibiales descansen sobre las pantorrillas. Inhalá durante esta parte del movimiento.",
      "Comenzá a subir la barra mientras exhalás, empujando el piso con el talón o el medio del pie mientras extendés las piernas y las caderas para volver a la posición inicial.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "La sentadilla completa llega hasta el contacto isquiotibial-pantorrilla, mucho más profundo que la sentadilla paralela.",
    ],
    erroresComunes: [
      "Redondear la espalda baja en la parte más profunda.",
    ],
  },

  "Barbell_Glute_Bridge": {
    nombre: "Puente de glúteo con barra",
    patron: "Dominante de cadera",
    unilateral: false,
    sinonimos: ["glute bridge con barra", "puente de cadera con barra"],
    instrucciones: [
      "Comenzá sentado en el piso con una barra cargada sobre las piernas. Usar una barra acolchada o colocar una almohadilla puede reducir mucho la incomodidad de este ejercicio. Hacé rodar la barra hasta que quede directamente sobre las caderas y acostáte en el piso.",
      "Comenzá el movimiento empujando con los talones, extendiendo las caderas verticalmente a través de la barra. Tu peso debe estar apoyado en la espalda alta y los talones.",
      "Extendé lo más posible y luego revertí el movimiento para volver a la posición inicial.",
    ],
    puntosClave: [
      "Una almohadilla o barra acolchada en las caderas es esencial para la comodidad.",
    ],
    erroresComunes: [
      "Arquear la espalda baja en lugar de extender desde la cadera.",
    ],
  },

  "Barbell_Guillotine_Bench_Press": {
    nombre: "Press de banca guillotina",
    patron: "Empuje horizontal",
    unilateral: false,
    sinonimos: ["guillotine press", "press al cuello"],
    instrucciones: [
      "Usando un agarre de ancho medio (que crea un ángulo de 90° entre antebrazo y brazo superior a la mitad del movimiento), levantá la barra del rack y sostenela en línea recta sobre tu cuello con los brazos bloqueados. Esta es la posición inicial.",
      "Mientras inhalás, bajá la barra lentamente hasta que quede a unos 2 cm del cuello.",
      "Después de una pausa de un segundo, volvé la barra a la posición inicial mientras exhalás y empujás con los músculos del pecho. Bloqueá los brazos y apretá el pecho en la posición contraída, sostené un segundo y comenzá a bajar lentamente de nuevo. Debería llevar al menos el doble de tiempo bajar que subir.",
      "Repetí el movimiento las veces indicadas.",
      "Al terminar, colocá la barra de vuelta en el rack.",
    ],
    puntosClave: [
      "Variante avanzada que aumenta el rango de movimiento del pectoral; requiere mucho cuidado en el hombro.",
    ],
    erroresComunes: [
      "Bajar la barra demasiado rápido cerca del cuello, sin control.",
    ],
  },

  "Barbell_Hack_Squat": {
    nombre: "Sentadilla hack con barra (agarre trasero)",
    patron: "Dominante de rodilla",
    unilateral: false,
    sinonimos: ["hack squat con barra", "sentadilla hack clasica"],
    instrucciones: [
      "Pararte derecho sosteniendo una barra detrás de vos a extensión de brazos, con los pies al ancho de hombros. El agarre al ancho de hombros es lo mejor, con las palmas mirando hacia atrás. Podés usar muñequeras para mejor agarre. Esta es la posición inicial.",
      "Manteniendo la cabeza y la vista arriba y la espalda recta, hacé sentadilla hasta que los muslos superiores queden paralelos al piso. Inhalá mientras bajás lentamente.",
      "Empujando principalmente con el talón del pie y apretando los muslos, subí de nuevo mientras exhalás.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "La barra detrás del cuerpo permite una sentadilla con torso más vertical que la versión trasera tradicional.",
    ],
    erroresComunes: [
      "Redondear la espalda al bajar.",
    ],
  },

  "Barbell_Hip_Thrust": {
    nombre: "Hip thrust con barra",
    patron: "Dominante de cadera",
    unilateral: false,
    sinonimos: ["hip thrust con barra", "empuje de cadera con barra"],
    instrucciones: [
      "Comenzá sentado en el piso con un banco directamente detrás de vos. Tené una barra cargada sobre las piernas. Usar una barra acolchada o una almohadilla puede reducir mucho la incomodidad de este ejercicio.",
      "Hacé rodar la barra hasta que quede directamente sobre las caderas y reclinate contra el banco de modo que los omóplatos queden cerca de la parte superior de él.",
      "Comenzá el movimiento empujando con los pies, extendiendo las caderas verticalmente a través de la barra. Tu peso debe estar apoyado en los omóplatos y los pies. Extendé lo más posible y luego revertí el movimiento para volver a la posición inicial.",
    ],
    puntosClave: [
      "El apoyo de los omóplatos en el banco permite un rango de cadera mayor que el glute bridge en el piso.",
    ],
    erroresComunes: [
      "Hiperextender la espalda baja en lugar de extender desde la cadera.",
    ],
  },

  "Barbell_Lunge": {
    nombre: "Zancada con barra",
    patron: "Zancada / unilateral",
    unilateral: true,
    sinonimos: ["barbell lunge", "zancada estatica con barra"],
    instrucciones: [
      "Este ejercicio se realiza mejor dentro de un rack de sentadillas por seguridad. Para comenzar, colocá la barra en el rack justo debajo de la altura del hombro. Una vez elegida la altura correcta y cargada la barra, metete debajo de ella y colocá la parte posterior de los hombros (levemente debajo del cuello) bajo la barra.",
      "Sosteniendo la barra con ambos brazos a los costados, levantala del rack empujando con las piernas mientras enderezás el torso al mismo tiempo.",
      "Alejate del rack, dá un paso adelante con la pierna derecha y bajá flexionando la cadera, manteniendo el torso erguido y el equilibrio. Inhalá al bajar. No dejés que la rodilla avance más allá de la punta del pie al bajar, ya que eso genera estrés innecesario en la articulación.",
      "Usando principalmente el talón del pie, empujá hacia arriba y volvé a la posición inicial mientras exhalás.",
      "Repetí el movimiento las veces indicadas y luego hacelo con la pierna izquierda.",
    ],
    puntosClave: [
      "La barra en la espalda exige más estabilidad de torso que la versión con mancuernas.",
    ],
    erroresComunes: [
      "Dejar que la rodilla delantera sobrepase la punta del pie.",
    ],
  },

  "Barbell_Rollout_from_Bench": {
    nombre: "Rollout con barra desde banco",
    patron: "Core anti-extensión",
    unilateral: false,
    sinonimos: ["rollout desde banco", "barbell rollout arrodillado"],
    instrucciones: [
      "Colocá una barra cargada en el piso, cerca del extremo de un banco. Arrodillate con ambas piernas sobre el banco y tomá la barra con un agarre medio a cerrado. Esta es la posición inicial.",
      "Para comenzar, extendé desde la cadera para rodar la barra lentamente hacia adelante. Al rodar, flexioná el hombro para llevar la barra por encima de la cabeza. Asegurate de mantener los brazos extendidos durante todo el movimiento.",
      "Cuando la barra haya avanzado lo más posible, volvé a la posición inicial.",
    ],
    puntosClave: [
      "Arrodillarse sobre el banco reduce la palanca comparado con el rollout de pie, siendo más accesible.",
    ],
    erroresComunes: [
      "Arquear la espalda baja excesivamente al extender.",
    ],
  },

  "Barbell_Shoulder_Press": {
    nombre: "Press de hombro sentado con barra",
    patron: "Empuje vertical",
    unilateral: false,
    sinonimos: ["shoulder press con barra sentado"],
    instrucciones: [
      "Sentáte en un banco con respaldo dentro de un rack de sentadillas. Colocá la barra a una altura justo por encima de tu cabeza. Tomá la barra con agarre pronado (palmas hacia adelante).",
      "Una vez que tomes la barra con el ancho de agarre correcto, levantala por encima de la cabeza bloqueando los brazos. Sostenela a la altura del hombro y levemente al frente de la cabeza. Esta es la posición inicial.",
      "Bajá la barra lentamente hacia los hombros mientras inhalás.",
      "Subí la barra de vuelta a la posición inicial mientras exhalás.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "El respaldo del banco elimina la posibilidad de usar impulso de piernas o espalda baja.",
    ],
    erroresComunes: [
      "Arquear la espalda baja al empujar.",
    ],
  },

  "Barbell_Step_Ups": {
    nombre: "Subida al cajón con barra",
    patron: "Zancada / unilateral",
    unilateral: true,
    sinonimos: ["barbell step up", "step up con barra"],
    instrucciones: [
      "Pararte derecho sosteniendo una barra apoyada en la parte posterior de los hombros (levemente debajo del cuello), de pie frente a una plataforma elevada (como la que se usa para asistir detrás de un banco plano). Esta es la posición inicial.",
      "Colocá el pie derecho sobre la plataforma elevada. Subí a la plataforma extendiendo la cadera y la rodilla de la pierna derecha. Usá principalmente el talón para elevar el resto del cuerpo y colocá también el pie izquierdo sobre la plataforma. Exhalá mientras ejecutás la fuerza necesaria para subir.",
      "Bajá con la pierna izquierda flexionando la cadera y la rodilla de la pierna derecha mientras inhalás. Volvé a la posición de pie original colocando el pie derecho junto al izquierdo en la posición inicial.",
      "Repetí con la pierna derecha las veces indicadas y luego hacelo con la pierna izquierda.",
    ],
    puntosClave: [
      "El talón hace la mayor parte del trabajo al subir; evitá empujar con la punta del pie.",
    ],
    erroresComunes: [
      "Empujar con la pierna de abajo en lugar de la pierna que sube.",
    ],
  },

  "Bench_Press_-_Powerlifting": {
    nombre: "Press de banca estilo powerlifting",
    patron: "Empuje horizontal",
    unilateral: false,
    sinonimos: ["powerlifting bench press", "press de banca competitivo"],
    instrucciones: [
      "Comenzá acostado en el banco, llevando la cabeza más allá de la barra si es posible. Metete los pies debajo del cuerpo y arqueá la espalda. Usando la barra para ayudarte a sostener el peso, elevá los hombros del banco y retraelos, apretando los omóplatos entre sí. Usá los pies para clavar los trapecios en el banco. Mantené esta posición corporal apretada durante todo el movimiento.",
      "Cualquiera sea el ancho de tu agarre, debe cubrir el anillo de la barra. Sacá la barra del rack sin protraer los hombros. Concentráte en apretar la barra e intentar separarla, como si quisieras partirla.",
      "Bajá la barra hacia la parte inferior del pecho o la parte superior del abdomen. La barra, la muñeca y el codo deben permanecer alineados en todo momento.",
      "Pausá cuando la barra toque el torso y luego empujala hacia arriba con la mayor fuerza posible. Los codos deben permanecer pegados al cuerpo hasta el bloqueo final.",
    ],
    puntosClave: [
      "La técnica de powerlifting prioriza la estabilidad total del cuerpo (piernas, espalda, hombros) sobre la activación pectoral aislada.",
    ],
    erroresComunes: [
      "Protraer los hombros al sacar la barra del rack.",
    ],
  },

  "Bent-Arm_Barbell_Pullover": {
    nombre: "Pullover con barra (brazos flexionados)",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["barbell pullover brazos flexionados"],
    instrucciones: [
      "Acostáte en un banco plano sosteniendo una barra con agarre al ancho de hombros.",
      "Sostené la barra en línea recta sobre el pecho con una leve flexión en los brazos. Esta es la posición inicial.",
      "Manteniendo los brazos en la posición flexionada, bajá el peso lentamente en arco detrás de la cabeza mientras inhalás, hasta sentir el estiramiento en el pecho.",
      "En ese punto, volvé la barra a la posición inicial usando el mismo arco con el que bajó, exhalando durante el movimiento.",
      "Sostené el peso en la posición inicial un segundo y repetí el movimiento las veces indicadas.",
    ],
    puntosClave: [
      "El ángulo de flexión de los brazos permanece constante durante todo el movimiento.",
    ],
    erroresComunes: [
      "Extender los brazos durante el descenso, perdiendo la forma del pullover.",
    ],
  },

  "Bent_Over_Two-Arm_Long_Bar_Row": {
    nombre: "Remo bilateral con barra larga anclada",
    patron: "Tracción horizontal",
    unilateral: false,
    sinonimos: ["long bar row dos brazos", "t bar row improvisado bilateral"],
    instrucciones: [
      "Colocá peso en uno de los extremos de una barra olímpica. Asegurate de colocar el otro extremo en el rincón entre dos paredes, o poné un objeto pesado en el piso para que la barra no se deslice hacia atrás.",
      "Inclinate hacia adelante hasta que el torso quede lo más paralelo posible al piso, manteniendo las rodillas levemente flexionadas.",
      "Ahora tomá la barra con ambos brazos justo detrás de los discos del lado donde colocaste el peso, y apoyá una mano sobre la rodilla. Esta es la posición inicial.",
      "Tirá de la barra hacia arriba en línea recta con los codos pegados al cuerpo (para maximizar el estímulo de la espalda) hasta que los discos toquen la parte inferior del pecho. Apretá los músculos de la espalda al subir el peso y sostené un segundo arriba. Exhalá al levantar el peso. Podés usar una manija doble tipo estribo enganchada bajo el extremo de la barra.",
      "Bajá lentamente la barra a la posición inicial, sintiendo un buen estiramiento en el dorsal. No dejes que los discos toquen el piso. Para asegurar el mejor rango de movimiento, se recomiendan discos pequeños (de 11 kg) en lugar de discos grandes (de 16-20 kg).",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "Una manija tipo estribo facilita el agarre bilateral en este remo anclado.",
    ],
    erroresComunes: [
      "Balancear el torso para ayudar a tirar del peso.",
    ],
  },

  "Board_Press": {
    nombre: "Board press (press con tablas)",
    patron: "Empuje horizontal",
    unilateral: false,
    sinonimos: ["board press", "press con tablas powerlifting"],
    instrucciones: [
      "Comenzá acostado en el banco, llevando la cabeza más allá de la barra si es posible. Se pueden atornillar entre una y cinco tablas de madera (tipo 2x6) y sostenerlas con un compañero de entrenamiento, bandas, o simplemente metidas debajo de la remera.",
      "Metete los pies debajo del cuerpo y arqueá la espalda. Usando la barra para ayudarte a sostener el peso, elevá los hombros del banco y retraelos, apretando los omóplatos entre sí. Usá los pies para clavar los trapecios en el banco. Mantené esta posición corporal apretada durante todo el movimiento.",
      "Podés usar un agarre estándar de press de banca, o al ancho de hombros para enfocar el tríceps. Sacá la barra del rack sin protraer los hombros. La barra, la muñeca y el codo deben permanecer alineados en todo momento. Concentráte en apretar la barra e intentar separarla.",
      "Bajá la barra hasta las tablas y luego empujala hacia arriba con la mayor fuerza posible. Los codos deben permanecer pegados al cuerpo hasta el bloqueo final.",
    ],
    puntosClave: [
      "Las tablas limitan el rango de movimiento, permitiendo trabajar con sobrecarga en el rango superior del press.",
    ],
    erroresComunes: [
      "Dejar que la barra golpee las tablas con fuerza en lugar de pausar con control.",
    ],
  },

  "Box_Squat": {
    nombre: "Sentadilla al cajón",
    patron: "Dominante de rodilla",
    unilateral: false,
    sinonimos: ["box squat", "sentadilla con caja"],
    instrucciones: [
      "La sentadilla al cajón te permite bajar hasta la profundidad deseada y desarrollar fuerza explosiva en el movimiento de sentadilla. Comenzá en un rack de potencia con un cajón a la altura adecuada detrás de vos. Normalmente apuntás a una altura de cajón que te lleve a una sentadilla paralela, pero podés entrenar más alto o más bajo si lo deseás.",
      "Comenzá metiéndote debajo de la barra y colocándola en la parte posterior de los hombros. Apretá los omóplatos entre sí y rotá los codos hacia adelante, intentando doblar la barra sobre los hombros. Sacá la barra del rack creando un arco firme en la espalda baja, y retrocedé a la posición. Colocá los pies más separados para enfatizar espalda, glúteos, aductores e isquiotibiales, o más juntos para enfatizar el cuádriceps. Mantené la cabeza mirando al frente.",
      "Con la espalda, los hombros y el core firmes, empujá las rodillas y los glúteos hacia afuera y comenzá el descenso. Sentate hacia atrás con las caderas hasta quedar sentado en el cajón. Idealmente, las tibias deben quedar perpendiculares al piso. Pausá al llegar al cajón y relajá los flexores de cadera. Nunca rebotes sobre el cajón.",
      "Manteniendo el peso en los talones y empujando los pies y las rodillas hacia afuera, impulsate hacia arriba desde el cajón liderando el movimiento con la cabeza. Continuá subiendo, manteniendo la tensión de pies a cabeza.",
    ],
    puntosClave: [
      "Nunca rebotes sobre el cajón; pausá y relajá los flexores de cadera antes de subir.",
    ],
    erroresComunes: [
      "Rebotar sobre el cajón en lugar de pausar con control.",
    ],
  },

  "Clean": {
    nombre: "Cargada (clean)",
    patron: "Dominante de cadera",
    unilateral: false,
    sinonimos: ["clean", "cargada olimpica"],
    instrucciones: [
      "Con la barra en el piso cerca de las tibias, tomá un agarre pronado (o de gancho) justo afuera de las piernas. Bajá las caderas con el peso enfocado en los talones, espalda recta, cabeza al frente, pecho arriba, con los hombros justo por delante de la barra. Esta es la posición inicial.",
      "Comenzá el primer tirón empujando a través de los talones, extendiendo las rodillas. El ángulo de la espalda debe mantenerse igual, y los brazos deben permanecer rectos. Movés el peso con control mientras continuás hasta por encima de las rodillas.",
      "Luego viene el segundo tirón, la principal fuente de aceleración de la cargada. Cuando la barra se acerca a la mitad del muslo, comenzá a extender la cadera. En un movimiento de salto, acelerá extendiendo cadera, rodillas y tobillos, usando velocidad para mover la barra hacia arriba. No debería ser necesario tirar activamente con los brazos para acelerar el peso; al final del segundo tirón, el cuerpo debe estar completamente extendido, inclinado levemente hacia atrás, con los brazos todavía extendidos.",
      "Al alcanzar la extensión completa, pasá al tercer tirón encogiendo agresivamente los hombros y flexionando los brazos con los codos hacia arriba y afuera. En el pico de la extensión, tirate hacia abajo agresivamente, rotando los codos por debajo de la barra. Recibí la barra en posición de sentadilla frontal, cuya profundidad depende de la altura de la barra al final del tercer tirón. La barra debe quedar apoyada sobre los hombros protraídos, tocando levemente la garganta con las manos relajadas. Continuá descendiendo hasta la posición baja de sentadilla, lo cual ayuda en la recuperación.",
      "Recuperate inmediatamente empujando a través de los talones, manteniendo el torso erguido y los codos arriba. Continuá hasta haberte puesto de pie.",
    ],
    puntosClave: [
      "El segundo tirón es la fase de máxima aceleración; los brazos no deben tirar activamente hasta ese punto.",
    ],
    erroresComunes: [
      "Tirar con los brazos antes de completar la extensión de cadera.",
    ],
  },

  "Clean_Pull": {
    nombre: "Tirón de cargada (clean pull)",
    patron: "Dominante de cadera",
    unilateral: false,
    sinonimos: ["clean pull", "tiron de cargada olimpica"],
    instrucciones: [
      "Con la barra en el piso cerca de las tibias, tomá un agarre pronado o de gancho justo afuera de las piernas. Bajá las caderas con el peso enfocado en los talones, espalda recta, cabeza al frente, pecho arriba, con los hombros justo por delante de la barra. Esta es la posición inicial.",
      "Comenzá el primer tirón empujando a través de los talones, extendiendo las rodillas. El ángulo de la espalda debe mantenerse igual, y los brazos deben permanecer rectos con los codos hacia afuera. Movés el peso con control mientras continuás hasta por encima de las rodillas.",
      "Luego viene el segundo tirón, la principal fuente de aceleración de la cargada. Cuando la barra se acerca a la mitad del muslo, comenzá a extender la cadera. En un movimiento de salto, acelerá extendiendo cadera, rodillas y tobillos, usando velocidad para mover la barra hacia arriba. No debería ser necesario tirar activamente con los brazos para acelerar el peso; al final del segundo tirón, el cuerpo debe estar completamente extendido, inclinado levemente hacia atrás, con los brazos todavía extendidos. La extensión final debe ser violenta y abrupta; asegurate de no prolongarla más de lo necesario.",
    ],
    puntosClave: [
      "Es la cargada sin la fase de recepción; se usa para entrenar la potencia del tirón de forma aislada.",
    ],
    erroresComunes: [
      "Prolongar demasiado la extensión final en lugar de hacerla explosiva.",
    ],
  },

  "Clean_and_Press": {
    nombre: "Cargada y press (clean and press)",
    patron: "Empuje vertical",
    unilateral: false,
    sinonimos: ["clean and press", "cargada y press militar"],
    instrucciones: [
      "Adoptá una postura al ancho de hombros, con las rodillas dentro de los brazos. Manteniendo la espalda plana, flexioná rodillas y caderas para poder agarrar la barra con los brazos completamente extendidos y un agarre pronado levemente más ancho que el hombro. Apuntá los codos hacia los costados. La barra debe estar cerca de las tibias. Posicioná los hombros sobre la barra o levemente adelantados. Establecé una postura de espalda plana. Esta es la posición inicial.",
      "Comenzá a tirar de la barra extendiendo las rodillas. Llevá las caderas hacia adelante y elevá los hombros al mismo ritmo, manteniendo el ángulo de la espalda constante; seguí levantando la barra en línea recta manteniéndola cerca del cuerpo.",
      "Cuando la barra pase la rodilla, extendé tobillos, rodillas y caderas con fuerza, similar a un movimiento de salto. Al hacerlo, seguí guiando la barra con las manos, encogiendo los hombros y usando el impulso del movimiento para tirar la barra lo más alto posible. La barra debe viajar cerca del cuerpo, y los codos deben permanecer hacia afuera.",
      "En la elevación máxima, los pies deben despegar del piso y deberías comenzar a tirarte por debajo de la barra. La mecánica puede cambiar levemente según el peso usado. Deberías descender a una posición de sentadilla mientras te metés debajo de la barra.",
      "Cuando la barra alcance su altura final, rotá los codos alrededor y por debajo de ella. Apoyá la barra sobre la parte frontal de los hombros manteniendo el torso erguido y flexionando caderas y rodillas para absorber el peso de la barra.",
      "Parate hasta la altura completa, sosteniendo la barra en la posición de cargada.",
      "Sin mover los pies, presioná la barra por encima de la cabeza mientras exhalás. Bajá la barra de forma controlada.",
    ],
    puntosClave: [
      "Combina la técnica completa de cargada olímpica con un press militar de pie al final.",
    ],
    erroresComunes: [
      "Mover los pies durante la fase de press.",
    ],
  },

  "Clean_from_Blocks": {
    nombre: "Cargada desde bloques",
    patron: "Dominante de cadera",
    unilateral: false,
    sinonimos: ["clean from blocks", "cargada desde cajones"],
    instrucciones: [
      "Con la barra sobre cajones o soportes de la altura deseada, tomá un agarre pronado o de gancho justo afuera de las piernas. Bajá las caderas con el peso enfocado en los talones, espalda recta, cabeza al frente, pecho arriba, con los hombros justo por delante de la barra. Esta es la posición inicial.",
      "Comenzá el primer tirón empujando a través de los talones, extendiendo las rodillas. El ángulo de la espalda debe mantenerse igual, y los brazos deben permanecer rectos con los codos hacia afuera.",
      "Al alcanzar la extensión completa, pasá a la posición de recepción encogiendo agresivamente los hombros y flexionando los brazos con los codos hacia arriba y afuera. Tirate hacia abajo agresivamente, rotando los codos por debajo de la barra. Recibí la barra en posición de sentadilla frontal, cuya profundidad depende de la altura de la barra al final del tercer tirón. La barra debe quedar apoyada sobre los hombros protraídos, tocando levemente la garganta con las manos relajadas. Continuá descendiendo hasta la posición baja de sentadilla, lo cual ayuda en la recuperación.",
      "Recuperate inmediatamente empujando a través de los talones, manteniendo el torso erguido y los codos arriba. Continuá hasta haberte puesto de pie. Volvé el peso a los bloques para la siguiente repetición.",
    ],
    puntosClave: [
      "Comenzar desde bloques elimina el primer tirón desde el piso, enfocándose en la fase de potencia.",
    ],
    erroresComunes: [
      "No recibir la barra en una sentadilla frontal completa.",
    ],
  },

  "Decline_Close-Grip_Bench_To_Skull_Crusher": {
    nombre: "Press decline agarre cerrado combinado con skull crusher",
    patron: "Empuje horizontal",
    unilateral: false,
    sinonimos: ["close grip bench to skull crusher", "press hibrido decline"],
    instrucciones: [
      "Asegurá las piernas al extremo del banco decline y acostáte lentamente en él.",
      "Usando un agarre cerrado (levemente menor al ancho de hombros), levantá la barra del rack y sostenela en línea recta sobre vos con los brazos bloqueados y los codos adentro. Los brazos deben quedar perpendiculares al piso. Esta es la posición inicial. Para proteger el manguito rotador, lo mejor es que un ayudante te asista a levantar la barra del rack.",
      "Ahora bajá la barra hacia la parte inferior del pecho mientras inhalás. Mantenés los codos adentro durante este movimiento.",
      "Usando el tríceps para empujar la barra de vuelta hacia arriba, presionala de vuelta a la posición inicial mientras exhalás.",
      "Mientras inhalás y mantenés los brazos superiores fijos, bajá la barra lentamente moviendo los antebrazos en un arco semicircular hacia vos hasta sentir la barra tocar levemente la frente. Inhalá durante esta parte del movimiento.",
      "Subí la barra de vuelta a la posición inicial contrayendo el tríceps y exhalando.",
      "Repetí los pasos 3 a 6 hasta completar las repeticiones indicadas.",
    ],
    puntosClave: [
      "Combina dos ejercicios de tríceps en una sola repetición compuesta: press cerrado más skull crusher.",
    ],
    erroresComunes: [
      "Abrir los codos durante la fase de skull crusher.",
    ],
  },

  "Deficit_Deadlift": {
    nombre: "Peso muerto en déficit",
    patron: "Dominante de cadera",
    unilateral: false,
    sinonimos: ["deficit deadlift", "deadlift desde plataforma elevada"],
    instrucciones: [
      "Comenzá con una plataforma o discos de peso sobre los que podés pararte, normalmente de 2 a 7 cm de altura. Acercate a la barra de modo que quede centrada sobre tus pies. Los pies deben estar al ancho de cadera. Flexioná desde la cadera para agarrar la barra al ancho de hombros, dejando que los omóplatos se protraigan. Normalmente se usa un agarre pronado o mixto en series pesadas.",
      "Con los pies y el agarre listos, tomá una bocanada de aire grande y luego bajá las caderas y flexioná las rodillas hasta que las tibias toquen la barra. Mirá hacia adelante con la cabeza, mantené el pecho arriba y la espalda arqueada, y comenzá a empujar a través de los talones para mover el peso hacia arriba. Después de que la barra pase las rodillas, tirá agresivamente hacia atrás, juntando los omóplatos mientras llevás las caderas hacia adelante contra la barra.",
      "Bajá la barra flexionando desde la cadera y guiándola hacia el piso.",
    ],
    puntosClave: [
      "Parado sobre una plataforma elevada, el rango de movimiento es mayor que en un deadlift convencional.",
    ],
    erroresComunes: [
      "Redondear la espalda baja por el mayor rango de movimiento.",
    ],
  },

  "Drag_Curl": {
    nombre: "Curl arrastrado con barra (drag curl)",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["drag curl", "curl arrastrado"],
    instrucciones: [
      "Tomá una barra con agarre supino (palmas hacia adelante) y mantené los codos cerca de tu torso y hacia atrás. Esta es la posición inicial.",
      "Al exhalar, curvá la barra hacia arriba manteniendo los codos hacia atrás mientras 'arrastrás' la barra hacia arriba, manteniéndola en contacto con el torso. No vas a mantener los codos pegados a los costados, sino que vas a llevarlos hacia atrás. Tampoco levantes los hombros.",
      "Volvé lentamente a la posición inicial manteniendo la barra en contacto con el torso en todo momento.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "La barra se desliza pegada al cuerpo en lugar de alejarse al frente, como en un curl normal.",
    ],
    erroresComunes: [
      "Alejar la barra del cuerpo, convirtiéndolo en un curl tradicional.",
    ],
  },

  "Elevated_Back_Lunge": {
    nombre: "Zancada trasera elevada con barra",
    patron: "Zancada / unilateral",
    unilateral: true,
    sinonimos: ["elevated back lunge", "zancada trasera desde plataforma"],
    instrucciones: [
      "Colocá una barra en un rack a la altura del hombro con el peso adecuado. Colocá una plataforma baja y elevada detrás de vos.",
      "Apoyá la barra en la parte alta de la espalda, manteniendo la espalda arqueada y firme. Subite a la plataforma elevada con ambos pies. Esta es la posición inicial.",
      "Comenzá dando un paso hacia atrás con una pierna. Descendé flexionando cadera y rodilla hasta que la rodilla trasera toque el piso.",
      "Pausá y extendé desde cadera y rodillas para subir, volviendo completamente a la posición inicial antes de alternar.",
    ],
    puntosClave: [
      "La plataforma elevada aumenta el rango de movimiento de la zancada hacia atrás.",
    ],
    erroresComunes: [
      "No volver completamente a la posición inicial entre repeticiones.",
    ],
  },

  "Floor_Press": {
    nombre: "Press de piso con barra",
    patron: "Empuje horizontal",
    unilateral: false,
    sinonimos: ["floor press con barra", "press de piso en rack"],
    instrucciones: [
      "Ajustá los soportes del rack a la altura correcta para apoyar la barra. Comenzá acostado en el piso con la cabeza cerca del extremo de un rack de potencia. Manteniendo los omóplatos retraídos, sacá la barra de los soportes.",
      "Bajá la barra hacia la parte inferior del pecho o la parte superior del abdomen, apretando la barra e intentando separarla mientras lo hacés. Asegurate de mantener los codos pegados al cuerpo durante todo el movimiento. Bajá la barra hasta que el brazo superior toque el piso y pausá, evitando que el peso golpee o rebote.",
      "Empujá la barra hacia arriba lo más rápido posible, manteniendo la barra, las muñecas y los codos alineados mientras lo hacés.",
    ],
    puntosClave: [
      "El piso limita el rango de movimiento, protegiendo el hombro en la parte baja.",
    ],
    erroresComunes: [
      "Dejar que el peso golpee o rebote en el piso en lugar de pausar.",
    ],
  },

  "Floor_Press_with_Chains": {
    nombre: "Press de piso con cadenas",
    patron: "Empuje horizontal",
    unilateral: false,
    sinonimos: ["floor press con cadenas"],
    instrucciones: [
      "Ajustá los soportes del rack a la altura correcta para apoyar la barra. Para este ejercicio, colgá las cadenas directamente sobre el extremo de la barra, tratando de mantener los extremos lejos de los discos.",
      "Comenzá acostado en el piso con la cabeza cerca del extremo de un rack de potencia. Manteniendo los omóplatos retraídos, sacá la barra de los soportes.",
      "Bajá la barra hacia la parte inferior del pecho o la parte superior del abdomen, apretando la barra e intentando separarla mientras lo hacés. Asegurate de mantener los codos pegados al cuerpo durante todo el movimiento. Bajá la barra hasta que el brazo superior toque el piso y pausá, evitando que el peso golpee o rebote.",
      "Empujá la barra hacia arriba lo más rápido posible, manteniendo la barra, las muñecas y los codos alineados mientras lo hacés.",
    ],
    puntosClave: [
      "Las cadenas reducen el peso efectivo abajo y lo aumentan progresivamente al subir.",
    ],
    erroresComunes: [
      "Dejar que las cadenas se enreden con los discos durante el movimiento.",
    ],
  },

  "Frankenstein_Squat": {
    nombre: "Sentadilla Frankenstein",
    patron: "Dominante de rodilla",
    unilateral: false,
    sinonimos: ["frankenstein squat", "sentadilla de posicionamiento frontal"],
    instrucciones: [
      "Este ejercicio enseña el posicionamiento correcto de la barra y el cuerpo durante la cargada y la sentadilla frontal.",
      "Colocá la barra en la parte frontal de los hombros, soltando el agarre y extendiendo los brazos al frente. Los hombros deben empujarse hacia adelante para crear un estante, y la barra debe estar en contacto con la garganta. Asegurate de mover solo los omóplatos hacia adelante; no redondees la columna torácica.",
      "Hacé sentadilla flexionando rodillas y caderas, sentándote entre las piernas. Mantené el torso erguido, los brazos arriba y los hombros adelantados, y la barra debe permanecer en su lugar. Bajá hasta el fondo de la sentadilla, hasta que los isquiotibiales toquen las pantorrillas.",
      "Volvé a la posición erguida empujando con la parte delantera del talón y extendiendo rodillas y caderas.",
    ],
    puntosClave: [
      "Sin sostener la barra con las manos, este drill enseña la posición correcta del 'estante' frontal.",
    ],
    erroresComunes: [
      "Redondear la columna torácica en lugar de proyectar los hombros hacia adelante.",
    ],
  },

  "Front_Squat_Clean_Grip": {
    nombre: "Sentadilla frontal con agarre de cargada",
    patron: "Dominante de rodilla",
    unilateral: false,
    sinonimos: ["front squat clean grip", "sentadilla frontal estilo olimpico"],
    instrucciones: [
      "Para comenzar, colocá la barra en un rack levemente por debajo de la altura del hombro. Apoyá la barra sobre los deltoides, empujando contra las clavículas y tocando levemente la garganta. Las manos deben estar en agarre de cargada, tocando la barra solo con los dedos para ayudar a mantenerla en posición.",
      "Levantá la barra del rack empujando con las piernas mientras enderezás el torso al mismo tiempo. Alejate del rack y colocá las piernas en una postura media al ancho de hombros con las puntas de los pies levemente hacia afuera. Mantené la cabeza y los codos arriba en todo momento. Esta es la posición inicial.",
      "Flexioná las rodillas, sentándote entre las piernas. Continuá bajando hasta que los isquiotibiales descansen sobre las pantorrillas. Mantené las rodillas alineadas con los pies usando conscientemente los abductores para empujarlas hacia afuera mientras bajás.",
      "Comenzá a subir la barra mientras exhalás, empujando el piso principalmente con el talón o el medio del pie mientras extendés las piernas y volvés a la posición inicial.",
    ],
    puntosClave: [
      "El agarre de cargada (dedos apenas tocando la barra) exige mucha movilidad de muñeca y hombro.",
    ],
    erroresComunes: [
      "Dejar caer los codos durante el descenso.",
    ],
  },

  "Good_Morning": {
    nombre: "Good morning con barra",
    patron: "Dominante de cadera",
    unilateral: false,
    sinonimos: ["good morning clasico", "buenos dias con barra"],
    instrucciones: [
      "Comenzá con la barra en un rack a la altura del hombro. Apoyá la barra en la parte posterior de los hombros como en una sentadilla, no encima de los hombros. Mantené la espalda firme, los omóplatos apretados entre sí, y las rodillas levemente flexionadas. Alejate del rack.",
      "Comenzá flexionando desde la cadera, llevándola hacia atrás mientras te inclinás hasta casi quedar paralelo al piso. Mantené la espalda arqueada y la columna cervical en alineación correcta.",
      "Revertí el movimiento extendiendo la cadera con los glúteos y los isquiotibiales. Continuá hasta volver a la posición inicial.",
    ],
    puntosClave: [
      "La barra se apoya en la parte posterior de los hombros, igual que en la sentadilla trasera, no encima de ellos.",
    ],
    erroresComunes: [
      "Redondear la espalda baja al inclinarse hacia adelante.",
    ],
  },

  "Good_Morning_off_Pins": {
    nombre: "Good morning desde pines",
    patron: "Dominante de cadera",
    unilateral: false,
    sinonimos: ["good morning off pins", "buenos dias desde pines de seguridad"],
    instrucciones: [
      "Comenzá con la barra en un rack a una altura aproximadamente igual a la del abdomen. Inclinate por debajo de la barra y apoyala en la parte posterior de los hombros como en una sentadilla, no encima de los hombros. A la altura correcta, deberías quedar casi paralelo al piso al inclinarte. Mantené la espalda firme, los omóplatos apretados entre sí y las rodillas levemente flexionadas. Mantené la espalda arqueada y la columna cervical en alineación correcta.",
      "Comenzá el movimiento extendiendo la cadera con los glúteos y los isquiotibiales, hasta quedar de pie con el peso. Bajá lentamente el peso de vuelta a los pines, volviendo a la posición inicial.",
    ],
    puntosClave: [
      "Comenzar desde los pines elimina la fase de descenso, enfocándose solo en la extensión de cadera.",
    ],
    erroresComunes: [
      "Bajar el peso de golpe en lugar de controlarlo de vuelta a los pines.",
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
console.log(`✅ Lote 16 aplicado — ${nuevasAgregadas} entradas nuevas agregadas.`);
