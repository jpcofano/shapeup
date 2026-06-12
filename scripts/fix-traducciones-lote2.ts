/**
 * Lote 2 de re-pases de traducciones (30 entradas, peores ratios 0.20–0.33).
 * Reglas: 1 paso EN = 1 paso ES, voseo, respiración en los pasos,
 * conserva nombre/sinonimos/patron/modalidad/unilateral/puntosClave/erroresComunes.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const FILE = resolve("scripts/data/traducciones-fedb.es.json");
const t = JSON.parse(readFileSync(FILE, "utf8"));

const parches: Record<string, Partial<typeof t[string]>> = {

  Bent_Over_Two_Dumbbell_Row: { instrucciones: [] }, // key has hyphen — handled below

  "Bent_Over_Two-Dumbbell_Row": {
    instrucciones: [
      "Con una mancuerna en cada mano (palmas hacia el cuerpo), flexioná ligeramente las rodillas y llevá el torso hacia adelante doblando desde la cintura; mantenés la espalda recta hasta que quede casi paralela al piso. Cabeza arriba, las mancuernas colgando perpendiculares al piso. Esta es la posición inicial.",
      "Manteniendo el torso quieto, llevá las mancuernas hacia los costados mientras exhalás, con los codos cerca del cuerpo. En la posición contraída, apretá los músculos de la espalda y mantené un segundo.",
      "Bajá las mancuernas lentamente a la posición inicial mientras inhalás.",
      "Repetí las repeticiones indicadas.",
    ],
  },

  "Seated_Dumbbell_Palms-Up_Wrist_Curl": {
    instrucciones: [
      "Colocá dos mancuernas en el piso frente a un banco plano.",
      "Sentate en el borde del banco con las piernas separadas a la altura de los hombros y los pies apoyados en el piso.",
      "Tomá las mancuernas y apoyá los antebrazos sobre los muslos con las palmas mirando hacia arriba. Las muñecas deben colgar más allá del borde de los muslos.",
      "Flexioná las muñecas hacia arriba exhalando.",
      "Bajá lentamente las muñecas a la posición inicial inhalando. Los antebrazos permanecen quietos; solo se mueve la muñeca.",
      "Repetí las repeticiones indicadas.",
      "Al terminar, bajá las mancuernas al piso con cuidado.",
    ],
  },

  "Standing_Dumbbell_Triceps_Extension": {
    instrucciones: [
      "Pararte con una mancuerna tomada con ambas manos. Los pies a la altura de los hombros. Con ambas manos, levantá la mancuerna sobre la cabeza hasta que los brazos estén completamente extendidos.",
      "La mancuerna queda en las palmas con los pulgares alrededor y las palmas mirando hacia el techo. Esta es la posición inicial.",
      "Manteniendo los codos cerca de la cabeza, apuntando al frente y perpendiculares al piso, bajá la mancuerna en arco detrás de la cabeza hasta que los antebrazos toquen los bíceps. Solo se mueven los antebrazos. Inhalá durante esta fase.",
      "Volvé a la posición inicial extendiendo los codos. Exhalá al hacerlo.",
      "Repetí las repeticiones indicadas.",
    ],
  },

  "Clock_Push-Up": {
    instrucciones: [
      "Posicionáte en plancha alta apoyado en las puntas de los pies y las manos, aproximadamente a la altura de los hombros, con los brazos extendidos y el cuerpo recto. Esta es la posición inicial.",
      "Bajá el pecho hacia el piso flexionando los codos.",
      "En la parte baja, revertí el movimiento empujando con fuerza para despegar del piso. Intentá 'saltar' unos 30-45 cm hacia un lado.",
      "Al acelerar hacia arriba, mové el pie externo en la dirección de desplazamiento para acompañar el giro.",
      "Al despegar, desplazá el cuerpo unos 30° para posicionarte para la próxima repetición.",
      "Volvé a la posición inicial y repetí avanzando en círculo hasta completar el reloj.",
    ],
  },

  "Reverse_Flyes": {
    instrucciones: [
      "Acostáte en un banco inclinado con el pecho y el abdomen apoyados contra la inclinación. Tomá una mancuerna en cada mano con las palmas enfrentadas (agarre neutro).",
      "Extendé los brazos hacia adelante, perpendiculares al ángulo del banco. Las piernas se mantienen estables apoyando con las puntas de los pies. Esta es la posición inicial.",
      "Manteniendo los codos ligeramente flexionados, abrí los brazos hacia los costados en arco mientras exhalás. Intentá juntar los omóplatos para maximizar el trabajo del deltoide posterior.",
      "Elevá hasta que los brazos queden paralelos al piso.",
      "Sentí la contracción y bajá lentamente a la posición inicial inhalando.",
      "Repetí las repeticiones indicadas.",
    ],
  },

  "Side_Lateral_Raise": {
    instrucciones: [
      "Tomá una mancuerna en cada mano y pararte con el torso recto, mancuernas a los costados con los brazos extendidos y las palmas mirando al cuerpo. Esta es la posición inicial.",
      "Manteniendo el torso quieto (sin balanceo), elevá las mancuernas hacia los costados con los codos ligeramente flexionados y las manos un poco inclinadas hacia adelante como si derramaras agua. Seguí hasta que los brazos queden paralelos al piso. Exhalá durante el movimiento y pausá un segundo arriba.",
      "Bajá las mancuernas lentamente a la posición inicial mientras inhalás.",
      "Repetí las repeticiones indicadas.",
    ],
  },

  "Worlds_Greatest_Stretch": {
    instrucciones: [
      "Comenzá en una zancada larga con el pie delantero plano en el piso y las puntas del pie trasero apoyadas. Con las rodillas flexionadas, bajá hasta que la rodilla trasera casi toque el piso. Mantenés el torso erguido y sostenés esta posición entre 10 y 20 segundos.",
      "Apoyá el brazo del mismo lado que la pierna delantera en el piso, con el codo al lado del pie delantero. La otra mano se apoya en el piso de manera paralela a la pierna delantera para dar soporte. Sostené entre 10 y 20 segundos.",
      "Apoyá ambas manos a los costados del pie delantero. Elevá los dedos del pie delantero del piso y extendé esa pierna. Puede que necesités reposicionar la pierna trasera. Mantené entre 10 y 20 segundos y luego repetí toda la secuencia del otro lado.",
    ],
  },

  "Kettlebell_Thruster": {
    instrucciones: [
      "Limpiá dos pesas rusas a los hombros: extendé piernas y cadera jalando las pesas hacia los hombros y rotando las muñecas para que las palmas queden mirando al frente. Esta es la posición inicial.",
      "Comenzá la sentadilla flexionando cadera y rodillas, bajando las caderas entre las piernas. Mantenés la espalda recta y el torso erguido mientras bajás lo más posible.",
      "En la parte baja, extendé rodillas y cadera empujando desde los talones. Al hacerlo, presioná las pesas por encima de la cabeza extendiendo los brazos completamente, usando el impulso de la sentadilla para ayudar a mover el peso.",
      "Al comenzar la próxima repetición, volvé las pesas a la posición de rack en los hombros.",
    ],
  },

  "Kettlebell_Windmill": {
    instrucciones: [
      "Colocá una pesa rusa frente al pie delantero, hacé una cargada y presionala sobre la cabeza con el brazo opuesto completamente extendido. Girá los pies a 45° respecto al brazo levantado; pies algo más anchos que los hombros.",
      "Manteniendo la pesa bloqueada arriba en todo momento, empujá el glúteo hacia el lado del brazo levantado. Inclinarte lateralmente deslizando la mano libre por la pierna y mirando la pesa en todo momento, hasta tocar el piso con la mano libre.",
      "Pausá un segundo al llegar al piso y revertí el movimiento volviendo a la posición vertical.",
    ],
  },

  "Push-Up_Wide": {
    instrucciones: [
      "Colocá las manos bastante más anchas que los hombros y apoyáte en las puntas de los pies en posición de plancha, con los codos extendidos y el cuerpo recto. No dejes que las caderas caigan. Esta es la posición inicial.",
      "Flexioná los codos bajando el pecho hacia el piso mientras inhalás.",
      "Usando los músculos del pecho, empujá el cuerpo de vuelta a la posición inicial extendiendo los codos. Exhalá al hacerlo.",
      "Después de pausar en la posición contraída, repetí el movimiento las veces indicadas.",
    ],
  },

  "Scissor_Kick": {
    instrucciones: [
      "Acostáte boca arriba con la espalda apoyada en el piso y los brazos extendidos a los costados, palmas hacia abajo. Los brazos permanecen estáticos durante todo el ejercicio.",
      "Con las rodillas ligeramente flexionadas, elevá las piernas hasta que los talones queden a unos 15 cm del piso. Esta es la posición inicial.",
      "Subí la pierna izquierda hasta unos 45° mientras bajás la derecha hasta que el talón quede a unos 5-7 cm del piso.",
      "Cambiá el movimiento subiendo la pierna derecha y bajando la izquierda. Respirá de manera continua durante todo el ejercicio.",
      "Repetí las repeticiones indicadas.",
    ],
  },

  "Around_The_Worlds": {
    instrucciones: [
      "Acostáte en un banco plano con una mancuerna en cada mano, palmas hacia el techo. Los brazos paralelos al piso y al costado de los muslos; codos ligeramente flexionados para proteger la articulación. Esta es la posición inicial.",
      "Llevá las mancuernas en semicírculo por los costados hacia arriba y sobre la cabeza, manteniendo los brazos paralelos al piso en todo momento. Inhalá durante esta fase.",
      "Revertí el movimiento volviendo a la posición inicial mientras exhalás.",
    ],
  },

  "Knee_Tuck_Jump": {
    instrucciones: [
      "Comenzá de pie con las rodillas ligeramente flexionadas. Mantenés las manos frente a vos, palmas hacia abajo y los dedos juntos a la altura del pecho. Esta es la posición inicial.",
      "Bajá rápidamente a un cuarto de sentadilla y explotá hacia arriba de inmediato. Llevá las rodillas hacia el pecho intentando tocarlas con las palmas de las manos.",
      "Saltá lo más alto posible con las rodillas elevadas; luego extendé las piernas para aterrizar suave, absorbiendo el impacto permitiendo que las rodillas se flexionen al recibir el peso.",
    ],
  },

  "Pushups_Close_and_Wide_Hand_Positions": {
    instrucciones: [
      "Acostáte boca abajo con el cuerpo recto, apoyándote en las puntas de los pies y las manos: anchas (más allá de los hombros) para énfasis en pecho, o juntas (más cerca que los hombros) para énfasis en tríceps. Sostené el torso a extensión de brazos.",
      "Bajá hasta que el pecho casi toque el piso mientras inhalás.",
      "Usando los músculos del pecho, empujá el cuerpo hacia arriba apretando el pecho. Exhalá al hacerlo.",
      "Después de una pausa en la posición contraída, repetí el movimiento las veces indicadas.",
    ],
  },

  "Rope_Jumping": {
    instrucciones: [
      "Tomá un extremo de la cuerda en cada mano. Posicionáte con la cuerda detrás de vos en el piso. Levantá los brazos y hacé girar la cuerda por encima de la cabeza hacia adelante; cuando llegue al piso, saltá. Encontrá un ritmo de giro que puedas mantener usando principalmente las muñecas. Podés variar la velocidad y la técnica para mayor variedad.",
      "Saltar la cuerda es cardiovascularmente exigente y divertido: una persona de 70 kg quema aproximadamente 350 calorías en 30 minutos, más que corriendo el mismo tiempo.",
    ],
  },

  "Standing_Dumbbell_Calf_Raise": {
    instrucciones: [
      "Pararte con el torso erguido y una mancuerna en cada mano a los costados. Apoyá las puntas de los pies en una tabla firme de unos 5-7 cm de altura para que los talones queden a nivel del piso. Esta es la posición inicial.",
      "Con los pies apuntando al frente (para trabajo equilibrado), hacia adentro (énfasis en la cabeza externa del gemelo) o hacia afuera (énfasis en la cabeza interna), elevá los talones lo más alto posible exhalando y contrayendo los gemelos. Mantené la contracción un segundo arriba.",
      "Inhalando, volvé a la posición inicial bajando los talones lentamente.",
      "Repetí las veces indicadas.",
    ],
  },

  "Standing_Dumbbell_Reverse_Curl": {
    instrucciones: [
      "Pararte con una mancuerna en cada mano, agarre prono (palmas hacia abajo), brazos completamente extendidos y pies a la altura de los hombros. Esta es la posición inicial.",
      "Manteniendo la parte superior del brazo quieta, flexioná los antebrazos hacia arriba contrayendo los bíceps mientras exhalás. Solo se mueven los antebrazos. Seguí hasta que los bíceps estén completamente contraídos y las mancuernas a la altura de los hombros. Mantené la contracción un segundo.",
      "Bajá las mancuernas lentamente a la posición inicial mientras inhalás.",
      "Repetí las repeticiones indicadas.",
    ],
  },

  "Dumbbell_Clean": {
    instrucciones: [
      "Pararte con una mancuerna en cada mano a los costados, pies a la altura de los hombros.",
      "Bajá las mancuernas al piso flexionando cadera y rodillas, empujando las caderas hacia atrás hasta que las mancuernas toquen el piso. Esta es la posición inicial.",
      "Para iniciar el movimiento, explotá hacia arriba extendiendo cadera, rodillas y tobillos para acelerar las mancuernas. Mantené un agarre neutro y los brazos extendidos hasta alcanzar la extensión completa.",
      "Tras la extensión completa, volvé a flexionar cadera y rodillas para recibir el peso en cuclillas. Dejá que los brazos se flexionen llevando las mancuernas a los hombros.",
      "Al recibir el peso en cuclillas, extendé cadera y rodillas hasta quedar de pie con las mancuernas sobre los hombros.",
    ],
  },

  "Dumbbell_Shrug": {
    instrucciones: [
      "Pararte con el torso erguido, una mancuerna en cada mano con las palmas mirando al cuerpo y los brazos extendidos a los costados.",
      "Encogé los hombros lo más alto posible, como apuntando a las orejas, mientras exhalás. Mantené la contracción un segundo. Los brazos permanecen extendidos en todo momento; no uses los bíceps para levantar.",
      "Bajá las mancuernas a la posición original.",
      "Repetí las repeticiones indicadas.",
    ],
  },

  "Dumbbell_Side_Bend": {
    instrucciones: [
      "Pararte con el torso erguido, una mancuerna en la mano izquierda (palma mirando al cuerpo) y la mano derecha apoyada en la cintura. Pies a la altura de los hombros. Esta es la posición inicial.",
      "Manteniendo la espalda recta y la cabeza arriba, inclinarte solo desde la cintura hacia la derecha tan lejos como puedas mientras inhalás. Mantené un segundo y volvé a la posición inicial exhalando. El resto del cuerpo permanece estático.",
      "Ahora repetí el movimiento inclinándote hacia la izquierda. Mantené un segundo y volvé.",
      "Repetí las repeticiones indicadas y luego cambiá de mano.",
    ],
  },

  "Scissors_Jump": {
    instrucciones: [
      "Asumí una posición de zancada con una pierna adelante y la rodilla flexionada, y la rodilla trasera casi tocando el piso.",
      "Aseguráte de que la rodilla delantera esté alineada sobre el pie. Extendiendo ambas piernas, saltá lo más alto posible balanceando los brazos para ganar impulso.",
      "En el aire, cambiá la posición de las piernas: la delantera va hacia atrás y la trasera hacia adelante.",
      "Al aterrizar, amortiguá el impacto adoptando la posición de zancada y repetí.",
    ],
  },

  "Freehand_Jump_Squat": {
    instrucciones: [
      "Cruzá los brazos sobre el pecho.",
      "Con la cabeza arriba y la espalda recta, colocá los pies a la altura de los hombros.",
      "Manteniendo la espalda recta y el pecho erguido, bajá en sentadilla inhalando hasta que los muslos queden paralelos al piso o más abajo.",
      "Empujando principalmente con las puntas de los pies, saltá lo más alto posible usando los muslos como resortes. Exhalá durante esta fase.",
      "Al tocar el piso, bajá inmediatamente a la sentadilla y volvé a saltar.",
      "Repetí las repeticiones indicadas.",
    ],
  },

  "Isometric_Neck_Exercise_-_Sides": {
    instrucciones: [
      "Con la cabeza y el cuello en posición neutra (erguida, mirando al frente), apoyá la mano izquierda en el lado izquierdo de la cabeza.",
      "Empujá suavemente hacia la izquierda contrayendo los músculos del cuello izquierdo, pero resistiendo cualquier movimiento de la cabeza. Comenzá con tensión suave y aumentala gradualmente. Seguí respirando normalmente durante la contracción.",
      "Mantené el tiempo indicado.",
      "Soltá la tensión lentamente.",
      "Descansá el tiempo indicado y repetí con la mano derecha en el lado derecho de la cabeza.",
    ],
  },

  "One-Arm_Kettlebell_Push_Press": {
    instrucciones: [
      "Tomá una pesa rusa por el mango. Hacé una cargada llevándola al hombro: extendé piernas y cadera jalando la pesa hacia el hombro y rotando la muñeca para que la palma quede mirando al frente. Esta es la posición inicial.",
      "Flexioná ligeramente las rodillas manteniendo el torso erguido.",
      "Revertí de inmediato la dirección empujando desde los talones como si fueras a saltar, para crear impulso. Con ese impulso, presioná la pesa sobre la cabeza hasta extender el brazo completamente. Bajá el peso al hombro para realizar la próxima repetición.",
    ],
  },

  "Plie_Dumbbell_Squat": {
    instrucciones: [
      "Sostené una mancuerna con ambas manos por el extremo y pararte derecho. Colocá los pies bastante más anchos que los hombros con las rodillas ligeramente flexionadas.",
      "Las puntas de los pies apuntando hacia afuera. Los brazos permanecen estáticos durante el ejercicio. Esta es la posición inicial.",
      "Bajá lentamente flexionando las rodillas hasta que los muslos queden paralelos al piso. Inhalá durante esta fase.",
      "Empujando principalmente con los talones, volvé a la posición inicial exhalando.",
      "Repetí las repeticiones indicadas.",
    ],
  },

  "Close-Grip_Push-Up_off_of_a_Dumbbell": {
    instrucciones: [
      "Acostáte en el piso y apoyá las manos sobre una mancuerna en posición vertical. Sostené tu peso sobre las puntas de los pies y las manos, con el torso rígido, los codos pegados al cuerpo y los brazos extendidos. Esta es la posición inicial.",
      "Bajá el cuerpo permitiendo que los codos se flexionen mientras inhalás. Mantenés el cuerpo recto, sin que las caderas suban o caigan.",
      "Empujáte hasta la posición inicial extendiendo los codos. Exhalá al hacerlo.",
      "Después de una pausa en la posición contraída, repetí el movimiento las veces indicadas.",
    ],
  },

  "Incline_Push-Up_Close-Grip": {
    instrucciones: [
      "Colocáte frente a una barra de Smith o una superficie elevada estable a la altura apropiada, mirando hacia ella.",
      "Apoyá las manos juntas sobre la barra.",
      "Colocá los pies hacia atrás con los brazos y el cuerpo extendidos y rectos. Esta es la posición inicial.",
      "Manteniendo el cuerpo recto, bajá el pecho hacia la barra flexionando los brazos.",
      "Volvé a la posición inicial extendiendo los codos y empujándote hacia arriba.",
    ],
  },

  "Push_Up_to_Side_Plank": {
    instrucciones: [
      "Colocáte en posición de flexión en las puntas de los pies con las manos un poco más anchas que el ancho de hombros.",
      "Realizá una flexión permitiendo que los codos se flexionen; bajá manteniendo el cuerpo recto.",
      "Hacé la flexión y, al subir, desplazá el peso hacia el lado izquierdo del cuerpo, rotá al costado y llevá el brazo derecho hacia el techo en plancha lateral.",
      "Bajá el brazo al piso para otra flexión y luego rotá al otro lado.",
      "Repetí la serie alternando cada lado por 10 o más repeticiones.",
    ],
  },

  "Alternating_Renegade_Row": {
    instrucciones: [
      "Colocá dos pesas rusas en el piso a la distancia de los hombros. Posicionáte en las puntas de los pies y las manos como si fueras a hacer una flexión, con el cuerpo recto y extendido. Usá los mangos de las pesas rusas para apoyar la parte superior del cuerpo. Puede que necesités abrir bastante los pies para mayor estabilidad.",
      "Empujá una pesa rusa contra el piso y remá la otra contrayendo el omóplato del lado que trabaja mientras flexionás el codo, jalándola hacia el costado del cuerpo.",
      "Bajá la pesa al piso y comenzá con la del lado opuesto. Repetí alternando por las repeticiones indicadas.",
    ],
  },

  "Step-up_with_Knee_Raise": {
    instrucciones: [
      "Pararte frente a un cajón o banco de altura apropiada con los pies juntos. Esta es la posición inicial.",
      "Comenzá el movimiento subiendo un pie al cajón y apoyándolo completo. Extendé cadera y rodilla de esa pierna para pararte sobre el cajón. Al quedar en el cajón con esa pierna, flexioná la rodilla y cadera de la pierna libre, elevando esa rodilla lo más alto posible.",
      "Revertí el movimiento para bajar del cajón y repetí la secuencia con la otra pierna, alternando.",
    ],
  },
};

// Aplicar parches preservando todos los campos existentes
for (const [id, patch] of Object.entries(parches)) {
  if (!t[id]) {
    console.warn(`  ⚠ ID no encontrado: ${id}`);
    continue;
  }
  t[id] = { ...t[id], ...patch };
}

writeFileSync(FILE, JSON.stringify(t, null, 2), "utf8");
console.log("✅ Lote 2 aplicado — 30 re-pases.");
