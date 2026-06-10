// scripts/fix-traducciones-lote1.ts — Lote 1 (~30 re-pases)
// Prioridad: peores ratios + ejercicios beginner/hogareños.
// Reglas: 1 paso EN = 1 paso ES; Tips→puntosClave; Cautions→erroresComunes;
//         voseo; respiración explícita. Preserva nombre/patron/sinonimos.
//         puntosClave/erroresComunes = existentes + nuevos del EN (no reemplaza).
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const TRAD_PATH = resolve("scripts/data/traducciones-fedb.es.json");
type E = {
  instrucciones: string[];
  puntosClave?: string[];
  erroresComunes?: string[];
  [k: string]: unknown;
};

// Merge: agrega solo los items que no estén ya (por texto similar)
function merge(base: string[] = [], add: string[]): string[] {
  const out = [...base];
  for (const item of add) {
    const norm = item.toLowerCase().slice(0, 20);
    if (!out.some((x) => x.toLowerCase().startsWith(norm))) out.push(item);
  }
  return out;
}

const patches: Record<string, Partial<E>> = {

  Oblique_Crunches: {
    instrucciones: [
      "Recostado boca arriba con la zona lumbar pegada al piso: una mano a un lado de la cabeza y la otra extendida sobre el piso al costado del cuerpo.",
      "Los pies deben estar elevados y apoyados sobre una superficie plana.",
      "Elevá el hombro del lado donde tenés la mano en la cabeza.",
      "Subí el hombro y el torso hasta que el codo toque la rodilla opuesta. Por ejemplo: con la mano derecha en la cabeza, el codo derecho toca la rodilla izquierda; la variación inversa usa el codo izquierdo hacia la rodilla derecha.",
      "Cuando el codo toca la rodilla, bajá el cuerpo a la posición inicial.",
      "Inhalá durante el descenso y exhalá al subir.",
      "Continuá alternando hasta completar las repeticiones indicadas por cada lado.",
    ],
    puntosClave: merge(
      ["Llevá el codo hacia la rodilla opuesta."],
      ["La zona lumbar permanece pegada al piso durante todo el movimiento."],
    ),
    erroresComunes: merge(
      ["Tironear del cuello."],
      ["Elevar demasiado el torso como en un sit-up en lugar de una rotación lateral."],
    ),
  },

  "One-Arm_Dumbbell_Row": {
    instrucciones: [
      "Colocá una mancuerna a cada lado de un banco plano.",
      "Apoyá la rodilla y la mano derechas en el banco, inclinando el torso desde la cintura hasta que quede paralelo al piso.",
      "Tomá la mancuerna del piso con la mano izquierda con la palma hacia el cuerpo y la espalda recta. Esta es la posición inicial.",
      "Traccioná la mancuerna hacia arriba hasta la altura del pecho, pegando el codo al cuerpo y sin mover el torso. Exhalá al subir.",
      "Bajá la mancuerna a la posición inicial mientras inhalás.",
      "Completá las repeticiones indicadas.",
      "Cambiá de lado y repetí con el brazo opuesto.",
    ],
    puntosClave: merge(
      ["Mantené la espalda neutra; no rotes el torso para levantar más peso."],
      [
        "Concentrarse en apretar los músculos de la espalda al llegar arriba, no en el brazo.",
        "El antebrazo es solo un gancho: la fuerza viene del dorsal, no del bíceps.",
      ],
    ),
    erroresComunes: merge(
      ["Encogerse de hombro en vez de remar.", "Girar la columna."],
      ["No llegar a la posición de torso paralelo al piso."],
    ),
  },

  Dumbbell_Bicep_Curl: {
    instrucciones: [
      "De pie con el torso erguido, mancuernas a los costados con los brazos extendidos. Codos pegados al torso, palmas hacia adelante. Esta es la posición inicial.",
      "Manteniendo los brazos estáticos, exhalá y flexioná los codos llevando las mancuernas hasta la altura de los hombros, contrayendo los bíceps. Sostené un segundo en la cima apretando.",
      "Inhalá y bajá lentamente las mancuernas a la posición inicial.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: merge(
      ["Codos quietos: solo se mueve el antebrazo."],
      ["En la cima apretá el bíceps un segundo para maximizar la contracción."],
    ),
    erroresComunes: merge(
      ["Balancear el cuerpo para subir."],
      ["Dejar caer las mancuernas sin controlar el descenso."],
    ),
  },

  Dumbbell_Bench_Press: {
    instrucciones: [
      "Acostado en el banco con una mancuerna en cada mano sobre los muslos, palmas enfrentadas.",
      "Ayudándote con los muslos, subí las mancuernas una a la vez a la altura de los hombros.",
      "Rotá las muñecas de modo que las palmas miren hacia afuera; las mancuernas quedan a los costados del pecho con el codo a 90°. Esta es la posición inicial.",
      "Exhalando, empujá con el pecho hasta extender los codos; apretá el pecho en la cima un segundo y bajá despacio. El descenso debería llevar el doble de tiempo que el ascenso.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: merge(
      ["Muñecas firmes y omóplatos retraídos."],
      ["El descenso debe tomar el doble de tiempo que el ascenso para maximizar el trabajo muscular."],
    ),
    erroresComunes: merge(
      ["Abrir los codos a 90° (estrés de hombro)."],
      ["Soltar las mancuernas al bajar perdiendo el control."],
    ),
  },

  Dumbbell_Shoulder_Press: {
    instrucciones: [
      "Sentado en un banco con respaldo, tomá las mancuernas en posición vertical sobre los muslos.",
      "Subí las mancuernas una a la vez a la altura de los hombros ayudándote con los muslos.",
      "Rotá las muñecas de modo que las palmas queden hacia adelante. Esta es la posición inicial.",
      "Exhalando, empujá las mancuernas hacia arriba hasta que casi se toquen en la cima.",
      "Sostené un segundo en la cima y bajá lentamente a la posición inicial mientras inhalás.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: merge(
      ["Costillas abajo: no arquees la espalda baja."],
      ["Las mancuernas casi se tocan en la cima sin chocarse."],
    ),
    erroresComunes: merge(
      ["Usar impulso de piernas.", "Arquear la lumbar."],
      ["Bajar demasiado rápido sin controlar el peso."],
    ),
  },

  Romanian_Deadlift: {
    instrucciones: [
      "Tomá una barra (o mancuernas) con agarre prono, un poco más ancho que el ancho de hombros.",
      "Flexioná las rodillas levemente, tibias verticales, cadera hacia atrás y espalda recta. Esta es la posición inicial.",
      "Manteniendo espalda y brazos completamente rectos, subí usando la cadera mientras exhalás. El movimiento debe ser controlado, no explosivo.",
      "Al estar completamente erguido, bajá la barra llevando la cadera hacia atrás, con las rodillas apenas flexionadas (menos que en la sentadilla). Inhalá al inicio, sostené el aire al bajar y exhalá al completar el movimiento.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: merge(
      ["El movimiento nace de la cadera (bisagra), no de la rodilla.", "Espalda siempre neutra."],
      ["Con pesos altos, considerar muñequeras para mejorar el agarre y el rango."],
    ),
    erroresComunes: merge(
      ["Convertirlo en sentadilla.", "Redondear la espalda."],
      ["Flexionar demasiado las rodillas, perdiendo la bisagra de cadera."],
    ),
  },

  Reverse_Crunch: {
    instrucciones: [
      "Recostado boca arriba con piernas extendidas y brazos a los costados del torso, palmas en el piso. Los brazos permanecen quietos durante todo el ejercicio.",
      "Levantá las piernas de modo que los muslos queden perpendiculares al piso y los pies paralelos a él. Esta es la posición inicial.",
      "Inhalando, llevá las piernas hacia el torso rodando la pelvis hacia atrás y elevando las caderas del piso hasta que las rodillas casi toquen el pecho.",
      "Sostené la contracción un segundo y bajá las piernas a la posición inicial mientras exhalás.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: merge(
      ["Sube la pelvis, no solo las piernas."],
      ["El movimiento es de pelvis: la fuerza viene del abdomen bajo, no de las piernas."],
    ),
    erroresComunes: merge(
      ["Tomar impulso con las piernas."],
      ["Dejar caer las piernas de golpe sin controlar el descenso."],
    ),
  },

  "Sit-Up": {
    instrucciones: [
      "Recostado boca arriba con las rodillas flexionadas y los pies asegurados debajo de algo fijo o sostenidos por un compañero.",
      "Colocá las manos detrás de la cabeza entrelazando los dedos. Esta es la posición inicial.",
      "Elevá el torso hasta que forme una V imaginaria con los muslos, exhalando durante el ascenso.",
      "Sostené un segundo la contracción y bajá el torso a la posición inicial mientras inhalás.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: merge(
      ["Enrollá la columna; no subas con la espalda recta de golpe."],
      ["El abdomen inicia el movimiento; la V con los muslos indica el punto de máxima contracción."],
    ),
    erroresComunes: merge(
      ["Tirar del cuello con las manos."],
      ["Bajar demasiado rápido sin controlar."],
    ),
  },

  Flutter_Kicks: {
    instrucciones: [
      "En un banco plano acostado boca abajo, con las caderas en el borde, las piernas rectas y bien elevadas del piso, y los brazos sobre el banco sujetando el borde frontal.",
      "Apretá glúteos e isquios y extendé las piernas hasta que queden al nivel de las caderas. Esta es la posición inicial.",
      "Empezá el movimiento subiendo la pierna izquierda más alta que la derecha.",
      "Bajá la izquierda mientras subís la derecha.",
      "Continuá alternando de forma controlada (como pateando agua) hasta completar las repeticiones indicadas por cada pierna. Respirá de forma normal durante todo el movimiento.",
    ],
    puntosClave: merge(
      ["La lumbar no se despega del piso."],
      ["Respirar normalmente durante todo el ejercicio.", "El movimiento es pequeño y controlado, no balanceos grandes."],
    ),
    erroresComunes: merge(
      ["Arquear la espalda baja."],
      ["Elevar demasiado las piernas arqueando la zona lumbar."],
    ),
  },

  Russian_Twist: {
    instrucciones: [
      "Recostado boca arriba con las rodillas flexionadas y los pies asegurados debajo de algo fijo o sostenidos por un compañero.",
      "Elevá el torso hasta que forme una V imaginaria con los muslos; los brazos completamente extendidos al frente, perpendiculares al torso, con las manos juntas. Esta es la posición inicial.",
      "Rotá el torso hacia la derecha hasta que los brazos queden paralelos al piso mientras exhalás.",
      "Sostené un segundo y volvé a la posición inicial; luego rotá hacia el lado izquierdo de la misma manera, exhalando.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: merge(
      ["El giro nace del torso, no de los brazos."],
      ["Mantener los brazos extendidos durante todo el movimiento para mayor palanca."],
    ),
    erroresComunes: merge(
      ["Redondear la espalda."],
      ["Rotar solo los brazos sin girar el torso.", "Perder la posición de V con los muslos."],
    ),
  },

  Arnold_Dumbbell_Press: {
    instrucciones: [
      "Sentado en un banco con respaldo, sostené las mancuernas frente al pecho con las palmas hacia el cuerpo y los codos flexionados junto al torso. La posición se asemeja a la cima de un curl.",
      "Empezá subiendo las mancuernas al tiempo que girás las palmas hacia adelante.",
      "Continuá hasta extender completamente los brazos por encima de la cabeza. Exhalá durante esta parte.",
      "Sostené un segundo arriba y comenzá a bajar a la posición original rotando las palmas de vuelta hacia el cuerpo mientras inhalás. El brazo izquierdo rota en sentido antihorario; el derecho en sentido horario.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: merge(
      ["El giro suma trabajo en todo el deltoides."],
      ["La posición inicial es palmas hacia el cuerpo, como en la cima de un curl.", "El brazo izquierdo rota antihorario y el derecho horario al bajar."],
    ),
    erroresComunes: merge(
      ["Arquear la espalda baja."],
      ["Empezar con las palmas ya hacia adelante, perdiendo el rango de rotación."],
    ),
  },

  Hammer_Curls: {
    instrucciones: [
      "De pie con el torso erguido y una mancuerna en cada mano con los brazos extendidos a los costados; codos cerca del torso.",
      "Las palmas miran hacia el cuerpo (agarre neutro). Esta es la posición inicial.",
      "Manteniendo el brazo estático, exhalá y flexioná el codo llevando la mancuerna hacia el hombro. El codo queda quieto; solo se mueve el antebrazo. Llegá hasta la contracción completa y sostené un segundo apretando.",
      "Inhalá y bajá lentamente las mancuernas a la posición inicial.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: merge(
      ["Trabaja braquial y antebrazo además del bíceps."],
      ["Mantener el codo completamente quieto durante todo el movimiento."],
    ),
    erroresComunes: merge(
      ["Rotar la muñeca.", "Balancear el cuerpo."],
      ["Mover el codo hacia adelante al subir."],
    ),
  },

  Dead_Bug: {
    instrucciones: [
      "Recostado boca arriba, extendé los brazos hacia el techo.",
      "Elevá pies, rodillas y caderas a 90°.",
      "Exhalá con fuerza bajando las costillas y pegando la espalda al piso, rotando la pelvis hacia arriba y apretando los glúteos. Mantené esta posición durante todo el ejercicio. Esta es la posición inicial.",
      "Iniciá extendiendo una pierna, estirando rodilla y cadera hasta llevarla justo sobre el piso.",
      "Mantené la posición de la zona lumbar y la pelvis mientras movés la pierna; la espalda va a querer arquearse, no lo permitas.",
      "Volvé la pierna a la posición inicial manteniendo la tensión.",
      "Repetí del lado contrario, alternando hasta completar la serie.",
    ],
    puntosClave: merge(
      ["La lumbar nunca se despega del piso."],
      ["Exhalar fuerte al inicio activa el core y fija la pelvis antes de mover la pierna."],
    ),
    erroresComunes: merge(
      ["Arquear la espalda al estirar la pierna."],
      ["Mover demasiado rápido, perdiendo el control y la alineación."],
    ),
  },

  Pallof_Press: {
    instrucciones: [
      "Conectá un agarrador a una torre de polea a la altura del hombro (o usá una polea baja; también funciona con una banda anclada a esa altura).",
      "De costado a la polea, tomá el agarrador con ambas manos y alejate hasta quedar aproximadamente a la distancia de un brazo, con la resistencia tensa.",
      "Con los pies al ancho de caderas y las rodillas levemente flexionadas, sujetá el agarrador frente al pecho. Esta es la posición inicial.",
      "Extendé ambos brazos alejando el agarrador del pecho; el core debe estar activo y contraído resistiendo la rotación.",
      "Mantené la extensión varios segundos y volvé al pecho de forma controlada.",
      "Al finalizar la serie, repetí mirando hacia el otro lado.",
    ],
    puntosClave: merge(
      ["El trabajo es resistir el giro, no girar."],
      ["Los pies permanecen quietos y el torso estabilizado durante toda la extensión."],
    ),
    erroresComunes: merge(
      ["Dejar que el torso rote hacia la banda."],
      ["Extender los brazos con el core suelto, perdiendo el propósito del ejercicio."],
    ),
  },

  Hanging_Leg_Raise: {
    instrucciones: [
      "Colgá de una barra con ambos brazos extendidos, usando agarre ancho o medio. Las piernas cuelgan rectas con la pelvis ligeramente rotada hacia atrás. Esta es la posición inicial.",
      "Elevá las piernas hasta que el torso forme un ángulo de 90° con ellas. Exhalá durante el movimiento y sostené la contracción un segundo.",
      "Bajá lentamente a la posición inicial mientras inhalás.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: merge(
      ["Lo que sube es la pelvis, no solo las piernas."],
      ["La pelvis rota hacia atrás al subir para maximizar la activación del abdomen bajo."],
    ),
    erroresComunes: merge(
      ["Usar balanceo para subir."],
      ["Doblar las rodillas cuando el objetivo es la elevación de piernas rectas."],
    ),
  },

  Superman: {
    instrucciones: [
      "Recostado boca abajo en el piso o en una colchoneta, con los brazos completamente extendidos al frente. Esta es la posición inicial.",
      "Elevá simultáneamente los brazos, piernas y pecho del piso y sostené la contracción 2 segundos, apretando la zona lumbar y exhalando. En la posición contraída el cuerpo debería parecerse a Superman volando.",
      "Bajá lentamente brazos, piernas y pecho a la posición inicial mientras inhalás.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: merge(
      ["Trabajá la espalda baja sin hiperextender el cuello."],
      ["Apretar la zona lumbar al elevar para maximizar la activación de los erectores espinales.", "Elevar brazos y piernas de forma simétrica."],
    ),
    erroresComunes: merge(
      ["Tirar la cabeza hacia atrás."],
      ["Elevar solo los brazos o solo las piernas, no ambos simultáneamente."],
    ),
  },

  Bench_Dips: {
    instrucciones: [
      "Con un banco detrás tuyo y de espaldas a él, apoyá las manos en el borde al ancho de hombros con los brazos extendidos. Las piernas se extienden al frente formando un ángulo perpendicular al torso. Esta es la posición inicial.",
      "Bajá lentamente inhalando, flexionando los codos hasta que el ángulo entre brazo y antebrazo sea un poco menor de 90°. Los codos deben permanecer lo más pegados posible al cuerpo; los antebrazos apuntan siempre hacia abajo.",
      "Usando los tríceps, empujá para subir el cuerpo de nuevo a la posición inicial.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: merge(
      ["Mantené la espalda cerca del banco."],
      ["Los codos apuntan hacia atrás durante todo el movimiento, no hacia los lados."],
    ),
    erroresComunes: merge(
      ["Bajar demasiado y forzar el hombro."],
      ["Abrir los codos hacia los lados, reduciendo la activación del tríceps."],
    ),
  },

  Incline_Push_Up: {
    instrucciones: [
      "Parado frente a un banco o plataforma elevada y firme, apoyá las manos en el borde, un poco más ancho que el ancho de hombros.",
      "Alejá los pies hacia atrás hasta que los brazos queden perpendiculares al cuerpo y el cuerpo en línea recta. Manteniendo esa línea, bajá el pecho hacia el borde flexionando los codos.",
      "Empujá hasta extender los brazos. Repetí.",
    ],
    puntosClave: merge(
      ["Cuanto más alta la superficie, más fácil: buena regresión de la flexión."],
      ["El cuerpo debe mantenerse en línea recta de cabeza a talones, sin hundir la cadera."],
    ),
    erroresComunes: merge(
      ["Hundir la cadera."],
      ["Doblar el cuello mirando hacia abajo en lugar de mantenerlo neutro."],
    ),
  },

  Decline_Push_Up: {
    instrucciones: [
      "En posición de flexión, apoyá las manos al ancho de hombros en el piso y subí los pies sobre un cajón o banco. Esta es la posición inicial.",
      "Bajá inhalando hasta que el pecho casi toque el piso.",
      "Exhalando, empujá hasta volver a la posición inicial apretando el pecho.",
      "Sostené un segundo en la cima y comenzá a bajar de nuevo para la siguiente repetición.",
    ],
    puntosClave: merge(
      ["Pone más carga en pecho superior y hombros."],
      ["Cuanto más elevados los pies, más activa el deltoides anterior y la parte alta del pecho.", "El cuerpo debe mantenerse en línea recta durante todo el movimiento."],
    ),
    erroresComunes: merge(
      ["Hundir la cadera."],
      ["No llegar a casi tocar el piso, acortando el rango de movimiento."],
    ),
  },

  Bodyweight_Squat: {
    instrucciones: [
      "De pie con los pies al ancho de hombros. Podés colocar las manos detrás de la cabeza. Esta es la posición inicial.",
      "Iniciá el movimiento flexionando rodillas y caderas, llevando la cadera hacia atrás.",
      "Bajá lo más profundo que puedas y revertí rápidamente el movimiento hasta la posición inicial. Mantené la cabeza y el pecho arriba y empujá las rodillas hacia afuera durante el descenso.",
    ],
    puntosClave: merge(
      ["Pecho arriba y peso repartido en todo el pie."],
      ["Empujar las rodillas hacia afuera en la dirección de los dedos de los pies."],
    ),
    erroresComunes: merge(
      ["Que las rodillas se metan hacia adentro.", "Levantar los talones."],
      ["Inclinar el torso demasiado hacia adelante."],
    ),
  },

  Bodyweight_Walking_Lunge: {
    instrucciones: [
      "De pie con los pies al ancho de hombros y las manos en las caderas.",
      "Dá un paso largo al frente con una pierna, flexionando ambas rodillas para bajar la cadera hasta que la rodilla trasera casi toque el piso. El torso se mantiene erguido y la rodilla delantera queda alineada sobre el pie.",
      "Empujá con el talón de la pierna delantera y extendé ambas rodillas para subir.",
      "Avanzá con la pierna trasera repitiendo la zancada del lado opuesto.",
    ],
    puntosClave: merge(
      ["Torso erguido; rodilla de adelante sobre el pie."],
      ["La rodilla delantera no debe superar la punta del pie al bajar."],
    ),
    erroresComunes: merge(
      ["Pasos cortos que cargan la rodilla."],
      ["Dejar que el torso se incline hacia adelante.", "Que la rodilla delantera colapse hacia adentro."],
    ),
  },

  Dumbbell_Rear_Lunge: {
    instrucciones: [
      "De pie con el torso erguido, mancuernas a los costados. Esta es la posición inicial.",
      "Dá un paso largo hacia atrás con la pierna derecha y bajá el torso manteniendo el equilibrio y la espalda recta. Inhalá al descender. La rodilla delantera no supera los dedos del pie; la tibia delantera queda perpendicular al piso. Una zancada larga enfatiza glúteos; una corta, cuádriceps.",
      "Empujá para volver a la posición inicial mientras exhalás. Para enfatizar cuádriceps, empujá con la punta del pie; para glúteos, con el talón.",
      "Repetí con la pierna izquierda.",
    ],
    puntosClave: merge(
      ["Torso erguido; la rodilla de adelante alineada con el pie."],
      ["La tibia delantera perpendicular al piso asegura la técnica correcta."],
    ),
    erroresComunes: merge(
      ["Dar un paso corto que carga de más la rodilla."],
      ["Inclinar el torso hacia adelante durante la zancada."],
    ),
  },

  Pushups: {
    instrucciones: [
      "Boca abajo, apoyá las manos en el piso con una separación de unos 90 cm, sosteniendo el torso con los brazos extendidos y el cuerpo en línea recta de cabeza a talones.",
      "Bajá inhalando hasta que el pecho casi toque el piso, flexionando los codos a unos 45° del torso.",
      "Exhalando, empujá el cuerpo hasta la posición inicial apretando el pecho.",
      "Sostené un segundo en la cima y comenzá a bajar de nuevo para las repeticiones necesarias.",
    ],
    puntosClave: merge(
      ["Glúteos y abdomen activos: el cuerpo es una tabla."],
      ["Los codos a ~45° del torso (no a 90°) protegen el hombro."],
    ),
    erroresComunes: merge(
      ["Dejar caer la cadera.", "Hacer un recorrido corto."],
      ["Levantar los glúteos hacia arriba en forma de pirámide."],
    ),
  },

  Mountain_Climbers: {
    instrucciones: [
      "En posición de plancha alta, con el peso en manos y puntas de pies. Flexioná cadera y rodilla de una pierna llevándola hasta que la rodilla quede aproximadamente bajo la cadera. Esta es la posición inicial.",
      "Invertí explosivamente la posición de las piernas: extendé la pierna doblada hasta que quede recta apoyada en la punta, y traé la otra pierna hacia adelante con cadera y rodilla flexionadas. Continuá alternando de forma rítmica durante 20–30 segundos.",
    ],
    puntosClave: merge(
      ["Cadera estable; no rebotes hacia arriba."],
      ["El ritmo puede ser moderado (técnico) o explosivo (cardiovascular)."],
    ),
    erroresComunes: merge(
      ["Subir la cola al acelerar."],
      ["Perder la alineación de la plancha encorvando la espalda."],
    ),
  },

  Single_Leg_Glute_Bridge: {
    instrucciones: [
      "Recostado boca arriba con los pies apoyados en el piso y las rodillas flexionadas.",
      "Elevá una pierna del piso llevando la rodilla hacia el pecho. Esta es la posición inicial.",
      "Ejecutá el movimiento empujando con el talón de la pierna apoyada, extendiendo la cadera hacia arriba y levantando los glúteos del piso.",
      "Extendé lo más posible, sostené un segundo apretando el glúteo y volvé a la posición inicial.",
    ],
    puntosClave: merge(
      ["Empujá con el talón; apretá glúteo arriba sin arquear la lumbar."],
      ["El torso y la cadera forman una línea recta en la posición elevada."],
    ),
    erroresComunes: merge(
      ["Hiperextender la zona lumbar en vez de usar el glúteo."],
      ["Dejar que la cadera gire o caiga hacia el lado de la pierna elevada."],
    ),
  },

  Glute_Kickback: {
    instrucciones: [
      "Arrodillado en el piso o una colchoneta, inclinado desde la cintura con los brazos extendidos perpendiculares al torso al ancho de hombros (posición de push-up de rodillas). La cabeza mira hacia adelante y las rodillas forman un ángulo de 90° entre isquios y pantorrillas. Esta es la posición inicial.",
      "Exhalando, elevá la pierna derecha hasta que los isquios queden en línea con la espalda, manteniendo la rodilla a 90° y contrayendo el glúteo. Sostené la contracción un segundo arriba. En la cima, el muslo queda paralelo al piso y la pantorrilla perpendicular.",
      "Volvé a la posición inicial inhalando y repetí con la pierna izquierda.",
      "Continuá alternando hasta completar las repeticiones indicadas.",
    ],
    puntosClave: merge(
      ["El movimiento es de cadera; apretá el glúteo arriba."],
      ["En la posición elevada, el muslo debe quedar paralelo al piso y la pantorrilla perpendicular."],
    ),
    erroresComunes: merge(
      ["Arquear la espalda baja para subir más."],
      ["Extender completamente la rodilla en lugar de mantenerla a 90°."],
    ),
  },

  Tricep_Dumbbell_Kickback: {
    instrucciones: [
      "Con una mancuerna en cada mano y las palmas hacia el cuerpo, inclinarte desde la cintura con la espalda recta y una leve flexión en las rodillas hasta que el torso quede casi paralelo al piso, cabeza arriba. Los brazos pegados al torso y paralelos al piso; los antebrazos apuntan hacia abajo formando un ángulo de 90° con el brazo. Esta es la posición inicial.",
      "Manteniendo los brazos completamente quietos, exhalá y usá los tríceps para extender el codo hasta que el brazo quede completamente recto. Solo el antebrazo se mueve.",
      "Después de una breve pausa en la extensión, inhalá y bajá lentamente las mancuernas a la posición inicial.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: merge(
      ["Solo se mueve el antebrazo; el codo queda fijo."],
      ["Los brazos permanecen pegados al torso y paralelos al piso durante todo el movimiento."],
    ),
    erroresComunes: merge(
      ["Mover el hombro en lugar del codo."],
      ["Mover el codo hacia adelante o hacia abajo para ganar impulso.", "No llegar a la extensión completa del codo."],
    ),
  },

  "Calf_Raises_-_With_Bands": {
    instrucciones: [
      "Parado sobre la banda elástica con las puntas de los pies, asegurate de que la longitud de la banda sea igual para ambos lados.",
      "Sujetá los extremos de la banda y subí los brazos a los costados de la cabeza como si fueras a hacer un press de hombros: palmas hacia adelante, codos flexionados y abiertos. Esta tensión de la banda crea la resistencia. Esta es la posición inicial.",
      "Manteniendo las manos junto a los hombros, subí lo más alto posible sobre las puntas mientras exhalás y contraés los gemelos fuerte en la cima.",
      "Sostené la contracción un segundo y bajá lentamente a la posición inicial.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: merge(
      ["Rango completo y pausa arriba."],
      ["Mantener las manos junto a los hombros para sostener la tensión de la banda durante todo el movimiento."],
    ),
    erroresComunes: merge(
      ["Rebotar sin control."],
      ["Bajar los brazos, lo que reduce la tensión y la resistencia de la banda."],
    ),
  },

  Dumbbell_Step_Ups: {
    instrucciones: [
      "De pie con el torso erguido, una mancuerna en cada mano con las palmas mirando hacia las piernas.",
      "Colocá el pie derecho sobre la plataforma elevada. Subí extendiendo cadera y rodilla derechas, empujando principalmente con el talón para levantar el cuerpo y apoyar también el pie izquierdo arriba. Exhalá al subir.",
      "Bajá con la pierna izquierda flexionando cadera y rodilla derechas mientras inhalás; volvé a la posición inicial apoyando el pie derecho junto al izquierdo.",
      "Completá las repeticiones indicadas con la pierna derecha y luego repetí con la izquierda.",
    ],
    puntosClave: merge(
      ["Empujá con el talón de la pierna de arriba; evitá impulsarte con la de abajo."],
      ["El torso permanece erguido durante todo el movimiento."],
    ),
    erroresComunes: merge(
      ["Tomar envión con la pierna de abajo."],
      ["Inclinarse demasiado hacia adelante al subir."],
    ),
  },

  Inverted_Row: {
    instrucciones: [
      "Posicioná una barra en un rack a la altura de la cintura aproximadamente. También podés usar una Smith machine o anillas.",
      "Tomá la barra con un agarre más ancho que el ancho de hombros y posicionarte colgado debajo de ella con el cuerpo recto, los talones en el piso y los brazos completamente extendidos. Esta es la posición inicial.",
      "Iniciá flexionando los codos y traccionando el pecho hacia la barra, retrayendo los omóplatos durante el movimiento.",
      "Sostené un segundo en la cima y volvé a la posición inicial.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: merge(
      ["Cuerpo en tabla; cuanto más horizontal, más difícil."],
      ["Retraer los omóplatos al llegar arriba para maximizar la activación del dorsal."],
    ),
    erroresComunes: merge(
      ["Dejar caer la cadera.", "Encoger los hombros."],
      ["Usar solo los brazos sin retraer los omóplatos."],
    ),
  },
};

// Fix typos in key names (Incline/Decline use underscore not hyphen for internal patch)
const keyFixes: Record<string, string> = {
  "Incline_Push_Up": "Incline_Push-Up",
  "Decline_Push_Up": "Decline_Push-Up",
};

const data: Record<string, E> = JSON.parse(readFileSync(TRAD_PATH, "utf8"));

let count = 0;
for (let [id, patch] of Object.entries(patches)) {
  const realId = keyFixes[id] ?? id;
  if (!data[realId]) { console.warn(`⚠ No encontré ${realId}`); continue; }
  Object.assign(data[realId], patch);
  count++;
}

writeFileSync(TRAD_PATH, JSON.stringify(data, null, 2) + "\n");
console.log(`✅ Aplicadas ${count} re-traducciones → ${TRAD_PATH}`);
