/**
 * Lote 11 — 30 NUEVAS traducciones (intermediate + equipo hogareño, tanda 2).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const FILE = resolve("scripts/data/traducciones-fedb.es.json");
const t = JSON.parse(readFileSync(FILE, "utf8"));

const nuevos: Record<string, object> = {

  "Kettlebell_Arnold_Press": {
    nombre: "Press Arnold con pesa rusa",
    patron: "Empuje vertical",
    unilateral: true,
    sinonimos: ["arnold press kettlebell"],
    instrucciones: [
      "Hacé la cargada de la pesa rusa al hombro extendiendo piernas y cadera mientras la elevás hacia el hombro. La palma debe quedar mirando hacia adentro.",
      "Mirando al frente, presioná la pesa hacia afuera y por encima de la cabeza, rotando la muñeca para que la palma quede mirando hacia adelante en la parte superior del movimiento.",
      "Volvé la pesa a la posición inicial, con la palma mirando hacia adentro.",
    ],
    puntosClave: [
      "La rotación de muñeca durante el press activa el deltoide desde distintos ángulos.",
    ],
    erroresComunes: [
      "No rotar la muñeca, perdiendo el beneficio del press Arnold.",
    ],
  },

  "Kettlebell_Dead_Clean": {
    nombre: "Cargada muerta con pesa rusa",
    patron: "Dominante de cadera",
    unilateral: true,
    sinonimos: ["dead clean kettlebell", "cargada desde el piso"],
    instrucciones: [
      "Colocá la pesa rusa entre los pies. Para la posición inicial, llevá los glúteos hacia atrás y mirá al frente.",
      "Cargá la pesa al hombro extendiendo piernas y cadera mientras la elevás hacia el hombro. La muñeca debe rotar al hacerlo.",
      "Bajá la pesa, manteniendo tensión en los isquiotibiales con la espalda recta y los glúteos hacia atrás.",
    ],
    puntosClave: [
      "Cada repetición comienza desde el piso, sin el impulso de un balanceo previo.",
    ],
    erroresComunes: [
      "Redondear la espalda baja al bajar la pesa al piso.",
    ],
  },

  "Kettlebell_Hang_Clean": {
    nombre: "Cargada colgante con pesa rusa",
    patron: "Dominante de cadera",
    unilateral: true,
    sinonimos: ["hang clean kettlebell"],
    instrucciones: [
      "Colocá la pesa rusa entre los pies. Para la posición inicial, llevá los glúteos hacia atrás y mirá al frente.",
      "Cargá la pesa al hombro extendiendo piernas y cadera mientras la elevás hacia el hombro. La muñeca debe rotar al hacerlo.",
      "Bajá la pesa a una posición colgante entre las piernas, manteniendo tensión en los isquiotibiales. Mantenés la cabeza arriba en todo momento.",
    ],
    puntosClave: [
      "La pesa no toca el piso entre repeticiones; queda colgando entre las piernas.",
    ],
    erroresComunes: [
      "Bajar la mirada al piso durante la cargada.",
    ],
  },

  "Kettlebell_Pass_Between_The_Legs": {
    nombre: "Pasada de pesa rusa entre las piernas",
    patron: "Core anti-rotación",
    unilateral: false,
    sinonimos: ["figure 8 kettlebell", "pasada entre piernas"],
    instrucciones: [
      "Colocá una pesa rusa entre las piernas y adoptá una postura cómoda. Inclinate llevando los glúteos hacia atrás y manteniendo la espalda recta.",
      "Tomá la pesa rusa y pasala a la otra mano por entre las piernas, en forma de 'W'. Seguí alternando de mano por varias repeticiones.",
    ],
    puntosClave: [
      "La espalda permanece recta durante todo el movimiento; la potencia viene de la cadera, no de la espalda.",
    ],
    erroresComunes: [
      "Redondear la espalda al inclinarse.",
    ],
  },

  "Kettlebell_Seated_Press": {
    nombre: "Press sentado con pesa rusa",
    patron: "Empuje vertical",
    unilateral: true,
    sinonimos: ["seated kettlebell press"],
    instrucciones: [
      "Sentáte en el piso y separá las piernas cómodamente.",
      "Cargá una pesa rusa al hombro.",
      "Presioná la pesa hacia arriba y afuera hasta bloquearla por encima de la cabeza. Volvé a la posición inicial.",
    ],
    puntosClave: [
      "Estar sentado elimina la ayuda de las piernas, exigiendo más fuerza pura de hombro.",
    ],
    erroresComunes: [
      "Inclinar el torso hacia el costado para compensar.",
    ],
  },

  "Kettlebell_Seesaw_Press": {
    nombre: "Press alternado tipo sube y baja con pesas rusas",
    patron: "Empuje vertical",
    unilateral: true,
    sinonimos: ["seesaw press", "press sube y baja kettlebell"],
    instrucciones: [
      "Cargá dos pesas rusas a los hombros.",
      "Presioná una pesa.",
      "Bajá esa pesa e inmediatamente presioná la otra. Asegurate de hacer la misma cantidad de repeticiones en ambos lados.",
    ],
    puntosClave: [
      "El brazo que baja y el que sube se alternan sin pausa, como un sube y baja.",
    ],
    erroresComunes: [
      "Hacer más repeticiones de un lado que del otro.",
    ],
  },

  "Kettlebell_Turkish_Get-Up_Lunge_style": {
    nombre: "Levantada turca estilo zancada con pesa rusa",
    patron: "Core anti-rotación",
    unilateral: true,
    sinonimos: ["turkish get up zancada", "get up lunge style"],
    instrucciones: [
      "Acostáte boca arriba en el piso y presioná una pesa rusa hasta la posición superior extendiendo el codo. Flexioná la rodilla del mismo lado que la pesa.",
      "Manteniendo la pesa bloqueada en todo momento, girá hacia el lado opuesto y usá el brazo que no trabaja para ayudarte a impulsarte hacia adelante hasta la posición de zancada. Con la mano libre, empujate hasta quedar sentado y luego progresá hasta apoyar una rodilla.",
      "Mirando hacia la pesa, parate lentamente. Revertí el movimiento para volver a la posición inicial y repetí.",
    ],
    puntosClave: [
      "La mirada permanece fija en la pesa elevada durante toda la secuencia.",
    ],
    erroresComunes: [
      "Perder de vista la pesa, desestabilizando el hombro.",
    ],
  },

  "Leg-Over_Floor_Press": {
    nombre: "Press de piso con pierna cruzada",
    patron: "Empuje horizontal",
    unilateral: true,
    sinonimos: ["leg over floor press"],
    instrucciones: [
      "Acostáte en el piso con una pesa rusa apoyada en el pecho, sostenida del mango. Extendé la pierna del lado que trabaja por encima de la pierna del lado contrario. El brazo libre puede extenderse hacia el costado para mayor apoyo.",
      "Presioná la pesa rusa hasta bloquearla arriba.",
      "Bajá el peso hasta que el codo toque el piso, manteniendo la pesa por encima del codo. Repetí las veces indicadas.",
    ],
    puntosClave: [
      "Cruzar la pierna desestabiliza la cadera, exigiendo mayor control del core durante el press.",
    ],
    erroresComunes: [
      "Dejar que la cadera rote sin control.",
    ],
  },

  "Lunge_Pass_Through": {
    nombre: "Zancada con pasada de pesa rusa",
    patron: "Zancada / unilateral",
    unilateral: true,
    sinonimos: ["lunge pass through", "zancada con pasamano kettlebell"],
    instrucciones: [
      "Pararte con el torso erguido sosteniendo una pesa rusa en la mano derecha. Esta es la posición inicial.",
      "Dá un paso adelante con el pie izquierdo y bajá el cuerpo flexionando la cadera y la rodilla, manteniendo el torso erguido. Bajá la rodilla trasera hasta que casi toque el piso.",
      "Mientras estás en la zancada, pasá la pesa rusa por debajo de la pierna delantera hacia la mano contraria.",
      "Empujando con el talón del pie delantero, volvé a la posición inicial.",
      "Repetí el movimiento las veces indicadas, alternando piernas.",
    ],
    puntosClave: [
      "La pasada de la pesa exige estabilidad de core durante la transición de la zancada.",
    ],
    erroresComunes: [
      "Perder el equilibrio al pasar la pesa por debajo de la pierna.",
    ],
  },

  "Lying_Dumbbell_Tricep_Extension": {
    nombre: "Extensión de tríceps acostado con mancuernas",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["lying tricep extension", "skull crusher acostado"],
    instrucciones: [
      "Acostáte en un banco plano sosteniendo dos mancuernas directamente frente a vos. Los brazos deben estar completamente extendidos formando un ángulo de 90° con el torso y el piso. Las palmas miran hacia adentro y los codos están pegados al cuerpo. Esta es la posición inicial.",
      "Al inhalar, mientras mantenés los brazos superiores fijos con los codos adentro, bajá lentamente el peso hasta que las mancuernas queden cerca de las orejas.",
      "En ese punto, manteniendo los codos adentro y los brazos superiores fijos, usá el tríceps para devolver el peso a la posición inicial mientras exhalás.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "Los brazos superiores permanecen completamente fijos durante todo el recorrido.",
    ],
    erroresComunes: [
      "Abrir los codos hacia afuera al bajar.",
    ],
  },

  "Lying_One-Arm_Lateral_Raise": {
    nombre: "Elevación lateral unilateral acostado",
    patron: "Aislamiento",
    unilateral: true,
    sinonimos: ["lying lateral raise un brazo"],
    instrucciones: [
      "Sosteniendo una mancuerna en una mano, acostáte con el pecho hacia abajo sobre un banco plano. La otra mano puede sostenerse de la pata del banco para mayor estabilidad.",
      "Colocá la palma de la mano que sostiene la mancuerna en posición neutra (mirando hacia el torso) mientras mantenés el brazo extendido con una leve flexión de codo. Esta es la posición inicial.",
      "Elevá el brazo con la mancuerna hacia el costado hasta que el codo quede a la altura del hombro y el brazo casi paralelo al piso, mientras exhalás. Mantenés el brazo perpendicular al torso y siempre extendido. Sostené la contracción un segundo en la parte superior.",
      "Bajá lentamente la mancuerna a la posición inicial mientras inhalás.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "Acostado en banco plano (sin inclinación) reduce aún más el impulso del torso.",
    ],
    erroresComunes: [
      "Flexionar el codo excesivamente durante la elevación.",
    ],
  },

  "Lying_Rear_Delt_Raise": {
    nombre: "Elevación posterior acostado en banco plano",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["lying rear delt raise", "pajaro en banco plano"],
    instrucciones: [
      "Sosteniendo una mancuerna en cada mano, acostáte con el pecho hacia abajo sobre un banco plano.",
      "Colocá las palmas de las manos en posición neutra (mirando hacia el torso) mientras mantenés los brazos extendidos con una leve flexión de codo. Esta es la posición inicial.",
      "Elevá los brazos hacia los costados hasta que los codos queden a la altura del hombro y los brazos casi paralelos al piso, mientras exhalás. Mantenés los brazos perpendiculares al torso y siempre extendidos. Sostené la contracción un segundo en la parte superior.",
      "Bajá lentamente las mancuernas a la posición inicial mientras inhalás.",
      "Repetí las veces indicadas y luego cambiá al otro brazo.",
    ],
    puntosClave: [
      "El banco plano (sin inclinación) reduce el impulso del torso al máximo.",
    ],
    erroresComunes: [
      "Despegar el pecho del banco para ayudar a subir el peso.",
    ],
  },

  "Middle_Back_Shrug": {
    nombre: "Encogimiento de espalda media (retracción escapular)",
    patron: "Tracción horizontal",
    unilateral: false,
    sinonimos: ["middle back shrug", "retraccion escapular acostado"],
    instrucciones: [
      "Acostáte boca abajo en un banco inclinado sosteniendo una mancuerna en cada mano. Los brazos deben estar completamente extendidos colgando hacia el piso. Las palmas se miran entre sí. Esta es la posición inicial.",
      "Al exhalar, apretá los omóplatos entre sí y sostené la contracción un segundo completo. Este movimiento es como la acción inversa de un abrazo, o como hacer un rear lateral pero sin usar los brazos.",
      "Al inhalar, volvé a la posición inicial.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "El movimiento ocurre solo en los omóplatos; los brazos permanecen rectos y pasivos.",
    ],
    erroresComunes: [
      "Flexionar los codos para ayudar al movimiento.",
    ],
  },

  "Natural_Glute_Ham_Raise": {
    nombre: "Glute ham raise natural",
    patron: "Dominante de cadera",
    unilateral: false,
    sinonimos: ["nordic curl", "natural glute ham raise", "ghr natural"],
    instrucciones: [
      "Usando la almohadilla de piernas de una máquina de jalón al pecho o un banco predicador, posicionate de modo que los tobillos queden bajo las almohadillas, las rodillas sobre el asiento, mirando hacia el lado contrario de la máquina. Mantené una buena postura erguida.",
      "Esta es la posición inicial. Bajá el cuerpo de forma controlada hasta que las rodillas queden casi completamente extendidas.",
      "Manteniendo el control, subí de vuelta a la posición inicial.",
      "Si no podés completar una repetición, usá una banda, un compañero, o empujate desde una caja para asistir el movimiento.",
    ],
    puntosClave: [
      "Es un ejercicio muy exigente para isquiotibiales; está bien necesitar asistencia al principio.",
    ],
    erroresComunes: [
      "Bajar sin control, cayendo de golpe.",
    ],
  },

  "One-Arm_Kettlebell_Clean": {
    nombre: "Cargada unilateral con pesa rusa",
    patron: "Dominante de cadera",
    unilateral: true,
    sinonimos: ["one arm kettlebell clean", "cargada un brazo kettlebell"],
    instrucciones: [
      "Colocá una pesa rusa entre los pies. Al inclinarte para tomarla, llevá los glúteos hacia atrás y mantené la vista al frente.",
      "Cargá la pesa al hombro extendiendo piernas y cadera mientras la elevás hacia el hombro. La muñeca debe rotar al hacerlo.",
      "Volvé el peso a la posición inicial.",
    ],
    puntosClave: [
      "La potencia viene de la extensión de piernas y cadera, no de tirar con el brazo.",
    ],
    erroresComunes: [
      "Tirar la pesa con el brazo en lugar de impulsarla con las piernas.",
    ],
  },

  "One-Arm_Kettlebell_Clean_and_Jerk": {
    nombre: "Cargada y envión unilateral con pesa rusa",
    patron: "Empuje vertical",
    unilateral: true,
    sinonimos: ["clean and jerk un brazo", "cargada y envion kettlebell"],
    instrucciones: [
      "Sostené una pesa rusa del mango.",
      "Cargá la pesa al hombro extendiendo piernas y cadera mientras la tirás hacia el hombro. Rotá la muñeca al hacerlo, de modo que la palma quede mirando hacia adelante.",
      "Hacé una semi-flexión del cuerpo doblando las rodillas, manteniendo el torso erguido.",
      "Revertí inmediatamente la dirección, empujando con los talones, generando impulso como si saltaras. Al hacerlo, presioná la pesa por encima de la cabeza hasta bloquear el brazo, usando el impulso del cuerpo para mover el peso.",
      "Recibí el peso arriba volviendo a una posición de sentadilla por debajo del peso.",
      "Manteniendo el peso arriba, volvé a la posición de pie. Bajá el peso al piso para realizar la siguiente repetición.",
    ],
    puntosClave: [
      "Combina la cargada y el envión en una sola repetición fluida.",
    ],
    erroresComunes: [
      "No recibir el peso en sentadilla, forzando el hombro.",
    ],
  },

  "One-Arm_Kettlebell_Floor_Press": {
    nombre: "Press de piso unilateral con pesa rusa",
    patron: "Empuje horizontal",
    unilateral: true,
    sinonimos: ["one arm kettlebell floor press"],
    instrucciones: [
      "Acostáte en el piso sosteniendo una pesa rusa con una mano, con el brazo superior apoyado en el piso. La palma debe mirar hacia adentro.",
      "Presioná la pesa rusa directamente hacia el techo, rotando la muñeca.",
      "Bajá la pesa de vuelta a la posición inicial y repetí.",
    ],
    puntosClave: [
      "El piso limita el rango de movimiento, protegiendo el hombro en la parte baja.",
    ],
    erroresComunes: [
      "Perder el control de la pesa al extender el brazo.",
    ],
  },

  "One-Arm_Kettlebell_Jerk": {
    nombre: "Envión unilateral con pesa rusa",
    patron: "Empuje vertical",
    unilateral: true,
    sinonimos: ["one arm kettlebell jerk", "envion un brazo kettlebell"],
    instrucciones: [
      "Sostené una pesa rusa del mango. Cargála al hombro extendiendo piernas y cadera mientras la tirás hacia el hombro. Rotá la muñeca al hacerlo, de modo que la palma quede mirando hacia adelante. Esta es la posición inicial.",
      "Hacé una semi-flexión del cuerpo doblando las rodillas, manteniendo el torso erguido.",
      "Revertí inmediatamente la dirección, empujando con los talones, generando impulso como si saltaras. Al hacerlo, presioná la pesa por encima de la cabeza hasta bloquear el brazo, usando el impulso del cuerpo para mover el peso. Recibí el peso arriba volviendo a una posición de sentadilla por debajo del peso. Manteniendo el peso arriba, volvé a la posición de pie.",
      "Bajá el peso para realizar la siguiente repetición.",
    ],
    puntosClave: [
      "El impulso de piernas y cadera hace la mayor parte del trabajo, no solo el brazo.",
    ],
    erroresComunes: [
      "Presionar solo con el brazo sin usar el impulso de las piernas.",
    ],
  },

  "One-Arm_Kettlebell_Military_Press_To_The_Side": {
    nombre: "Press militar unilateral con pesa rusa hacia el costado",
    patron: "Empuje vertical",
    unilateral: true,
    sinonimos: ["military press kettlebell al costado"],
    instrucciones: [
      "Cargá la pesa rusa al hombro extendiendo piernas y cadera mientras la tirás hacia el hombro. Rotá la muñeca de modo que la palma quede mirando hacia adentro. Esta es la posición inicial.",
      "Mirá hacia la pesa y presionala hacia arriba y afuera hasta bloquearla por encima de la cabeza.",
      "Bajá la pesa de vuelta al hombro de forma controlada y repetí. Asegurate de contraer el dorsal, el glúteo y el abdomen con fuerza para mayor estabilidad y potencia.",
    ],
    puntosClave: [
      "Contraer dorsal, glúteo y abdomen estabiliza el press unilateral.",
    ],
    erroresComunes: [
      "Inclinar el torso hacia el lado contrario al presionar.",
    ],
  },

  "One-Arm_Kettlebell_Para_Press": {
    nombre: "Para press unilateral con pesa rusa",
    patron: "Empuje vertical",
    unilateral: true,
    sinonimos: ["para press kettlebell"],
    instrucciones: [
      "Cargá la pesa rusa al hombro extendiendo piernas y cadera mientras la tirás hacia el hombro. Rotá la muñeca de modo que la palma quede mirando hacia adelante. Esta es la posición inicial.",
      "Sosteniendo la pesa con el codo hacia el costado, presionala hacia arriba y afuera hasta bloquearla por encima de la cabeza.",
      "Bajá la pesa de vuelta al hombro de forma controlada y repetí. Asegurate de contraer el dorsal, el glúteo y el abdomen con fuerza para mayor estabilidad y potencia.",
    ],
    puntosClave: [
      "El codo hacia el costado distingue este press del military press tradicional.",
    ],
    erroresComunes: [
      "Perder la estabilidad del core durante el press.",
    ],
  },

  "One-Arm_Kettlebell_Row": {
    nombre: "Remo unilateral con pesa rusa",
    patron: "Tracción horizontal",
    unilateral: true,
    sinonimos: ["one arm kettlebell row"],
    instrucciones: [
      "Colocá una pesa rusa frente a los pies. Flexioná levemente las rodillas y llevá los glúteos hacia atrás lo más posible al inclinarte para llegar a la posición inicial. Tomá la pesa y llevala hacia el abdomen, retrayendo el omóplato y flexionando el codo. Mantené la espalda recta. Bajá y repetí.",
    ],
    puntosClave: [
      "La espalda permanece recta durante todo el remo; el movimiento es del omóplato y el codo.",
    ],
    erroresComunes: [
      "Redondear la espalda al inclinarse.",
    ],
  },

  "One-Arm_Kettlebell_Split_Jerk": {
    nombre: "Envión partido unilateral con pesa rusa",
    patron: "Empuje vertical",
    unilateral: true,
    sinonimos: ["split jerk un brazo kettlebell"],
    instrucciones: [
      "Sostené una pesa rusa del mango. Cargála al hombro extendiendo piernas y cadera mientras la tirás hacia el hombro. Rotá la muñeca de modo que la palma quede mirando hacia adelante. Esta es la posición inicial.",
      "Hacé una semi-flexión del cuerpo doblando las rodillas, manteniendo el torso erguido.",
      "Revertí inmediatamente la dirección, empujando con los talones, generando impulso como si saltaras. Al hacerlo, presioná la pesa por encima de la cabeza hasta bloquear el brazo, usando el impulso del cuerpo para mover el peso.",
      "Recibí el peso arriba volviendo a una posición de sentadilla por debajo del peso, colocando una pierna adelante y otra atrás.",
      "Manteniendo el peso arriba, volvé a la posición de pie juntando los pies. Bajá el peso para realizar la siguiente repetición.",
    ],
    puntosClave: [
      "La posición de zancada al recibir el peso permite mover cargas más pesadas que el envión con pies juntos.",
    ],
    erroresComunes: [
      "No coordinar el paso de los pies con el momento del envión.",
    ],
  },

  "One-Arm_Open_Palm_Kettlebell_Clean": {
    nombre: "Cargada a palma abierta unilateral con pesa rusa",
    patron: "Dominante de cadera",
    unilateral: true,
    sinonimos: ["open palm clean kettlebell"],
    instrucciones: [
      "Colocá una pesa rusa entre los pies.",
      "Tomá el mango con una mano y elevá la pesa rápidamente, dejando que gire de modo que la bola de la pesa caiga en la palma de la mano.",
      "Lanzá la pesa hacia adelante y atrapá el mango con una mano.",
      "Llevá la pesa al piso y repetí. Asegurate de trabajar ambos brazos.",
    ],
    puntosClave: [
      "Requiere buena coordinación mano-ojo para atrapar el mango con precisión.",
    ],
    erroresComunes: [
      "Atrapar la pesa con la muñeca en mala posición, generando golpes en el antebrazo.",
    ],
  },

  "Push-Ups_-_Close_Triceps_Position": {
    nombre: "Flexiones con agarre cerrado (énfasis en tríceps)",
    patron: "Empuje horizontal",
    unilateral: false,
    sinonimos: ["push up agarre cerrado", "flexion triceps cerrada"],
    instrucciones: [
      "Acostáte boca abajo en el piso y colocá las manos más cerca que el ancho de hombros, en posición cerrada. Asegurate de sostener el torso a extensión de brazos.",
      "Bajá el cuerpo hasta que el pecho casi toque el piso mientras inhalás.",
      "Usando el tríceps y parte del pectoral, empujá el torso hacia arriba a la posición inicial apretando el pecho. Exhalá durante este paso.",
      "Después de una pausa de un segundo en la posición contraída, repetí las veces indicadas.",
    ],
    puntosClave: [
      "El agarre cerrado desplaza más trabajo hacia el tríceps que el push-up estándar.",
    ],
    erroresComunes: [
      "Abrir los codos hacia afuera en lugar de mantenerlos cerca del cuerpo.",
    ],
  },

  "Reverse_Flyes_With_External_Rotation": {
    nombre: "Aperturas posteriores con rotación externa",
    patron: "Tracción horizontal",
    unilateral: false,
    sinonimos: ["reverse flye con rotacion externa"],
    instrucciones: [
      "Para comenzar, acostáte en un banco inclinado a 30° con el pecho y el abdomen presionando contra el respaldo.",
      "Sostené las mancuernas en cada mano con las palmas mirando hacia el piso. Los brazos deben estar al frente, perpendiculares al ángulo del banco, con una leve flexión de codo. Las piernas permanecen fijas, apoyando la presión sobre la punta de los pies (los talones no tocan el piso). Esta es la posición inicial.",
      "Manteniendo la leve flexión de codo, separá los pesos uno del otro en un movimiento de arco mientras exhalás.",
      "Al elevar el peso, la muñeca debe rotar externamente 90° pasando de un agarre pronado (palmas abajo) a uno neutro (palmas enfrentadas). Intentá apretar los omóplatos entre sí para mejores resultados.",
      "Los brazos deben elevarse hasta quedar a la altura de la cabeza.",
      "Sentí la contracción y bajá lentamente los pesos a la posición inicial mientras inhalás.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "La rotación de muñeca durante la elevación suma trabajo del manguito rotador al ejercicio.",
    ],
    erroresComunes: [
      "No rotar la muñeca, convirtiéndolo en un reverse flye simple.",
    ],
  },

  "Seated_Bent-Over_Rear_Delt_Raise": {
    nombre: "Elevación posterior sentado e inclinado",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["seated rear delt raise", "pajaro sentado inclinado"],
    instrucciones: [
      "Colocá un par de mancuernas mirando hacia adelante, frente a un banco plano.",
      "Sentáte al borde del banco con las piernas juntas y las mancuernas detrás de las pantorrillas.",
      "Doblate desde la cintura manteniendo la espalda recta para levantar las mancuernas. Las palmas deben mirarse entre sí al tomarlas. Esta es la posición inicial.",
      "Manteniendo el torso inclinado hacia adelante y fijo, y los brazos con una leve flexión de codo, elevá las mancuernas directamente hacia los costados hasta que ambos brazos queden paralelos al piso. Exhalá al subir los pesos. Evitá balancear el torso o llevar los brazos hacia atrás en lugar de hacia el costado.",
      "Después de una contracción de un segundo en la parte superior, bajá lentamente las mancuernas a la posición inicial.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "El torso permanece inclinado y fijo durante todo el ejercicio.",
    ],
    erroresComunes: [
      "Enderezar el torso al subir los pesos.",
    ],
  },

  "Seated_Bent-Over_Two-Arm_Dumbbell_Triceps_Extension": {
    nombre: "Extensión de tríceps bilateral sentado e inclinado",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["triceps extension sentado dos brazos"],
    instrucciones: [
      "Sentáte al borde de un banco plano con una mancuerna en cada mano, agarre neutro (palmas hacia vos).",
      "Flexioná levemente las rodillas y llevá el torso hacia adelante doblándote desde la cintura, manteniendo la espalda recta hasta casi paralela al piso. Mantené la cabeza arriba.",
      "Los brazos superiores con las mancuernas deben estar cerca del torso y alineados con él (elevados hasta quedar paralelos al piso, con los antebrazos apuntando hacia abajo mientras las manos sostienen los pesos). Debe haber un ángulo de 90° entre antebrazos y brazos superiores. Esta es la posición inicial.",
      "Manteniendo los brazos superiores fijos, usá el tríceps para levantar el peso mientras exhalás hasta que los antebrazos queden paralelos al piso y los brazos completamente extendidos. Solo se mueven los antebrazos.",
      "Después de un segundo de contracción en la parte superior, bajá lentamente las mancuernas a la posición inicial mientras inhalás.",
      "Repetí el movimiento las veces indicadas.",
    ],
    puntosClave: [
      "Trabajar ambos brazos a la vez exige más estabilidad de la espalda baja que la versión unilateral.",
    ],
    erroresComunes: [
      "Redondear la espalda al inclinarse hacia adelante.",
    ],
  },

  "Seated_One-Arm_Dumbbell_Palms-Down_Wrist_Curl": {
    nombre: "Curl de muñeca unilateral sentado agarre pronado",
    patron: "Aislamiento",
    unilateral: true,
    sinonimos: ["wrist curl sentado un brazo pronado"],
    instrucciones: [
      "Sentáte en un banco plano con una mancuerna en la mano derecha.",
      "Colocá los pies planos en el piso, separados un poco más que el ancho de hombros.",
      "Inclinate hacia adelante y apoyá el antebrazo derecho sobre el muslo derecho con la palma hacia abajo. El dorso de la muñeca debe quedar justo sobre la rodilla. Esta es la posición inicial.",
      "Bajá la mancuerna lo más posible manteniendo un agarre firme. Inhalá durante este movimiento.",
      "Ahora curvá la mancuerna lo más alto posible contrayendo el antebrazo mientras exhalás. Sostené la contracción un segundo antes de bajar de nuevo. Solo debe haber movimiento en la muñeca.",
      "Repetí las veces indicadas, cambiá de brazo y repetí.",
    ],
    puntosClave: [
      "Trabaja los extensores del antebrazo, complementario a la variante con palma hacia arriba.",
    ],
    erroresComunes: [
      "Levantar el antebrazo del muslo durante el curl.",
    ],
  },

  "See-Saw_Press_Alternating_Side_Press": {
    nombre: "Press alternado tipo sube y baja lateral con mancuernas",
    patron: "Empuje vertical",
    unilateral: true,
    sinonimos: ["see saw press", "press alternado lateral"],
    instrucciones: [
      "Tomá una mancuerna en cada mano y pararte erguido.",
      "Subí (cargá) las mancuernas a la altura del pecho/hombro y rotá las muñecas para que las palmas queden mirando hacia vos, como preparándote para un press Arnold. Esta es la posición inicial.",
      "Comenzá a extender el brazo izquierdo por encima de la cabeza rotando la muñeca para que la palma quede mirando hacia adelante al subir. Los codos también deben abrirse al levantar el peso. Simultáneamente, doblate desde la cadera hacia el lado contrario. Si lo hacés correctamente, debería parecer que estás alcanzando algo arriba del lado derecho del cuerpo, pero con el brazo izquierdo. Exhalá durante este movimiento.",
      "Al llegar a la posición superior, inhalá. Luego, con el peso completamente extendido arriba y el torso inclinado hacia la derecha, comenzá el movimiento hacia el lado izquierdo.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "Combina press unilateral con flexión lateral del torso, como un movimiento de 'sube y baja'.",
    ],
    erroresComunes: [
      "Perder el equilibrio al inclinarse lateralmente con el peso arriba.",
    ],
  },

  "Single-Arm_Push-Up": {
    nombre: "Flexión a un brazo",
    patron: "Empuje horizontal",
    unilateral: true,
    sinonimos: ["single arm push up", "flexion unilateral"],
    instrucciones: [
      "Comenzá en posición prona en el piso. Posicionate sosteniendo el peso del cuerpo sobre los dedos de los pies y un brazo. El brazo que trabaja debe colocarse directamente debajo del hombro, completamente extendido. Las piernas extendidas; para este movimiento podés necesitar una base más ancha, separando los pies más que en una flexión normal.",
      "Mantené una buena postura y colocá la mano libre detrás de la espalda. Esta es la posición inicial.",
      "Bajá el cuerpo dejando que el codo se flexione hasta tocar el piso.",
      "Descendé lentamente y revertí la dirección extendiendo el brazo para volver a la posición inicial.",
    ],
    puntosClave: [
      "Separar más los pies amplía la base de apoyo y facilita el equilibrio en este ejercicio avanzado.",
    ],
    erroresComunes: [
      "Dejar que la cadera rote hacia el lado del brazo libre.",
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
console.log(`✅ Lote 11 aplicado — ${nuevasAgregadas} entradas nuevas agregadas.`);
