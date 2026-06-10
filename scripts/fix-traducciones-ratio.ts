// scripts/fix-traducciones-ratio.ts
// Aplica re-traducciones fieles a las 15 entradas con ratio < 0.20.
// Reglas: 1 paso EN = 1 paso ES; Tips → puntosClave; Cautions → erroresComunes;
//         voseo; respiración explícita; mantiene nombre/patron/modalidad/sinonimos.
//
// Uso: npx tsx scripts/fix-traducciones-ratio.ts
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const TRAD_PATH = resolve("scripts/data/traducciones-fedb.es.json");
type Entrada = {
  nombre: string; instrucciones: string[];
  puntosClave?: string[]; erroresComunes?: string[];
  patron?: string; modalidad?: string;
  unilateral?: boolean; sinonimos?: string[];
  descansoSugeridoSeg?: number;
};

const patches: Record<string, Partial<Entrada>> = {
  Concentration_Curls: {
    instrucciones: [
      "Sentate en un banco plano con una mancuerna entre las piernas; pies en el piso con las rodillas flexionadas y separadas.",
      "Con la mano derecha, tomá la mancuerna y apoyá la parte posterior del brazo en la cara interna del muslo derecho. Rotá la palma hacia adelante con el brazo extendido y la mancuerna sobre el piso: esta es la posición inicial.",
      "Manteniendo el brazo estático, flexioná el codo llevando la mancuerna hacia el hombro mientras exhalás. Solo el antebrazo se mueve; continuá hasta contraer completamente el bíceps. Sostené un segundo en la cima apretando.",
      "Bajá la mancuerna lentamente a la posición inicial mientras inhalás.",
      "Completá las repeticiones indicadas y repetí con el brazo izquierdo.",
    ],
    puntosClave: [
      "En la cima, el meñique debe quedar más alto que el pulgar para maximizar la contracción.",
      "El brazo de apoyo permanece quieto todo el tiempo.",
    ],
    erroresComunes: [
      "Balancear el torso para ayudarse con el peso.",
      "Usar impulso en lugar de contraer el bíceps.",
    ],
  },
  Crunches: {
    instrucciones: [
      "Acostado boca arriba, pies apoyados en el piso o en un banco con las rodillas a 90°; si usás el banco, separá los pies unos 8–10 cm con los dedos apuntando hacia adentro.",
      "Colocá las manos a los lados de la cabeza con los codos hacia adelante. No entrelacer los dedos detrás de la nuca.",
      "Presioná la zona lumbar contra el piso para aislar los abdominales y empezá a despegar los hombros.",
      "Seguí presionando la zona lumbar mientras contraés el abdomen y exhalás. Los hombros solo suben unos 10 cm; la cintura queda en el piso. Sostené la contracción un segundo en la cima.",
      "Bajá lentamente a la posición inicial mientras inhalás.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "Movimiento lento y controlado, sin usar inercia.",
      "La zona lumbar permanece en contacto con el piso durante todo el ejercicio.",
    ],
    erroresComunes: [
      "Jalar del cuello con las manos.",
      "Subir demasiado el torso, convirtiéndolo en un sit-up.",
    ],
  },
  Toe_Touchers: {
    instrucciones: [
      "Recostado boca arriba con la espalda pegada al piso, brazos a los lados con las palmas hacia abajo y piernas juntas.",
      "Elevá las piernas lentamente hasta que queden casi perpendiculares al piso, con una leve flexión en las rodillas y los pies paralelos al suelo.",
      "Extendé los brazos en diagonal a unos 45° del piso: esta es la posición inicial.",
      "Manteniendo la zona lumbar pegada al piso, levantá el torso y estirá los brazos hacia los pies intentando tocar las puntas. Exhalá durante este movimiento.",
      "Bajá lentamente el torso y los brazos a la posición inicial mientras inhalás, con los brazos apuntando hacia los pies en todo momento.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "La zona lumbar debe permanecer en contacto con el piso durante toda la ejecución.",
      "Los brazos apuntan hacia los pies en todo momento.",
    ],
    erroresComunes: [
      "Levantar la zona lumbar al subir el torso.",
      "Bajar las piernas y perder la posición inicial.",
    ],
  },
  Front_Dumbbell_Raise: {
    instrucciones: [
      "De pie con el torso erguido, tomá las mancuernas con las palmas hacia los muslos y los brazos extendidos al frente del cuerpo: esta es la posición inicial.",
      "Manteniendo el torso quieto (sin balanceo), elevá la mancuerna izquierda hacia adelante con el codo ligeramente flexionado y las palmas hacia abajo, hasta que el brazo quede un poco por encima de la horizontal. Exhalá al subir y sostené un segundo en la cima, luego inhalá.",
      "Bajá la mancuerna izquierda lentamente mientras simultáneamente elevás la derecha.",
      "Continuá alternando hasta completar las repeticiones indicadas en cada brazo.",
    ],
    puntosClave: [
      "Mantener el torso estático durante todo el movimiento, sin balancearse.",
      "Las palmas miran hacia abajo durante el ascenso.",
      "La leve flexión del codo reduce el estrés articular.",
    ],
    erroresComunes: [
      "Usar impulso o balanceo del torso para subir el peso.",
      "Subir el brazo por encima de la horizontal, lo que reduce la activación del deltoides anterior.",
    ],
  },
  "Dumbbell_One-Arm_Upright_Row": {
    instrucciones: [
      "Tomá una mancuerna y quedate de pie con el brazo extendido y una leve flexión en el codo; la mancuerna descansa sobre el muslo con la palma hacia el cuerpo. Esta es la posición inicial.",
      "El otro brazo puede quedar extendido al costado, en la cintura o aferrado a una superficie fija como apoyo.",
      "Usá el hombro lateral para subir la mancuerna pegada al cuerpo mientras exhalás, hasta que quede a la altura del mentón. Los codos guían el movimiento y deben ir siempre por encima de los antebrazos; sostené un segundo arriba con el torso quieto.",
      "Bajá la mancuerna lentamente a la posición inicial mientras inhalás.",
      "Completá las repeticiones indicadas y cambiá de brazo.",
    ],
    puntosClave: [
      "Los codos guían el movimiento y deben estar siempre más altos que las muñecas.",
      "La mancuerna sube pegada al cuerpo, no hacia afuera.",
    ],
    erroresComunes: [
      "Inclinar el torso hacia un lado al subir.",
      "Subir la mancuerna alejándola del cuerpo.",
    ],
  },
  "Upright_Row_-_With_Bands": {
    instrucciones: [
      "Pisá la banda elástica con los pies y agarrá los extremos con un agarre prono (palmas hacia los muslos), un poco más angosto que el ancho de hombros. Los extremos descansan sobre los muslos con los brazos casi extendidos y la espalda recta: esta es la posición inicial.",
      "Usá los hombros laterales para subir los extremos pegados al cuerpo mientras exhalás, hasta que casi toquen el mentón. Los codos guían el movimiento y deben ir siempre más altos que los antebrazos; sostené un segundo arriba con el torso quieto.",
      "Bajá los extremos lentamente a la posición inicial mientras inhalás.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "Los codos deben estar siempre más altos que las muñecas durante el ascenso.",
      "Mantener el torso estático: no balancearse para subir más.",
    ],
    erroresComunes: [
      "Encorvar la espalda al subir.",
      "Bajar demasiado rápido perdiendo el control de la banda.",
    ],
  },
  "Chin-Up": {
    instrucciones: [
      "Colgá de la barra con las palmas hacia el cuerpo (agarre supino) y un agarre más estrecho que el ancho de hombros.",
      "Con ambos brazos extendidos, mantené el torso tan erguido como sea posible con una leve curvatura lumbar y el pecho hacia afuera. Esta es la posición inicial.",
      "Exhalando, tirá hacia arriba hasta que la cabeza quede a la altura de la barra, concentrándote en los bíceps. Los codos permanecen cerca del cuerpo; los antebrazos son el único punto de movimiento activo.",
      "Sostené un segundo en la cima apretando los bíceps, luego bajá lentamente a la posición inicial mientras inhalás hasta extender completamente los brazos.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "Mantener el torso lo más recto posible para maximizar la activación del bíceps.",
      "Los codos permanecen cerca del cuerpo durante todo el movimiento.",
      "Solo los brazos se mueven; el torso sube como una unidad.",
    ],
    erroresComunes: [
      "Balancear el cuerpo para ganar impulso.",
      "No llegar a extender completamente los brazos al bajar.",
    ],
  },
  Hanging_Pike: {
    instrucciones: [
      "Colgá de una barra con las piernas y los pies juntos, usando un agarre prono (palmas alejadas de vos) un poco más ancho que el ancho de hombros. Podés usar vendas en las muñecas para facilitar el agarre.",
      "Flexioná las rodillas a 90° y llevá los muslos hacia adelante de modo que las pantorrillas queden perpendiculares al piso y los muslos paralelos a él. Esta es la posición inicial.",
      "Elevá las piernas tirando con el abdomen hasta casi tocar la barra con las espinillas mientras exhalás; intentá extender las piernas lo más posible en la cima.",
      "Bajá las piernas lo más lentamente posible a la posición inicial mientras inhalás.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "Intentá extender las piernas al máximo en la posición elevada.",
      "Mantener el control en el descenso sin soltar de golpe.",
    ],
    erroresComunes: [
      "Balancearse o usar impulso para subir.",
      "Doblar demasiado las rodillas en vez de intentar extender las piernas.",
    ],
  },
  "Straight-Arm_Dumbbell_Pullover": {
    instrucciones: [
      "Colocá una mancuerna parada y asegurada en un extremo de un banco plano.",
      "Acostado perpendicular al banco (solo los hombros apoyados), con las caderas por debajo del nivel del banco, las rodillas flexionadas y los pies en el piso; la cabeza cuelga fuera del banco. Verificá siempre que la mancuerna esté bien sujeta antes de comenzar.",
      "Tomá la mancuerna con ambas manos apoyando las palmas en la cara inferior de uno de sus extremos y extendé los brazos sobre el pecho: esta es la posición inicial.",
      "Manteniendo los brazos rectos, bajá lentamente la mancuerna en arco por detrás de la cabeza mientras inhalás, hasta sentir el estiramiento en el pecho.",
      "Devolvé la mancuerna a la posición inicial siguiendo el mismo arco mientras exhalás.",
      "Sostené un segundo en la posición inicial y repetí las veces indicadas.",
    ],
    puntosClave: [
      "Los brazos permanecen rectos durante todo el movimiento.",
      "El arco debe ser suave y controlado, tanto al bajar como al subir.",
    ],
    erroresComunes: [
      "Usar una mancuerna con discos sueltos: puede partirse y caer en la cara.",
      "Flexionar los codos, lo que reduce el trabajo del pecho y el serrato.",
    ],
  },
  Zottman_Curl: {
    instrucciones: [
      "De pie con el torso erguido, tomá una mancuerna en cada mano a los costados con los codos cerca del torso.",
      "Las palmas se miran entre sí (agarre neutro). Esta es la posición inicial.",
      "Manteniendo el brazo estático, flexioná los codos llevando las mancuernas hacia arriba mientras exhalás, rotando las muñecas a agarre supino (palmas hacia arriba). Solo los antebrazos se mueven; continuá hasta contraer completamente los bíceps con las mancuernas a la altura de los hombros.",
      "Sostené la contracción un segundo apretando los bíceps.",
      "En esa posición, rotá las muñecas a agarre prono (palmas hacia abajo), con los pulgares más altos que los meñiques.",
      "Comenzá a bajar las mancuernas lentamente usando el agarre prono.",
      "Al acercarse las mancuernas a los muslos, rotá las muñecas de nuevo a agarre neutro (palmas hacia el cuerpo).",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "La rotación de muñeca al bajar (agarre prono) activa el braquiorradial y equilibra el desarrollo del bíceps.",
      "El torso permanece quieto; solo se mueven los antebrazos.",
    ],
    erroresComunes: [
      "Balancear el torso para subir el peso.",
      "Hacer la rotación de muñeca de forma brusca.",
    ],
  },
  Air_Bike: {
    instrucciones: [
      "Acostado boca arriba con la zona lumbar pegada al piso, colocá las manos a los lados de la cabeza sin jalar del cuello. Elevá los hombros a la posición de crunch.",
      "Llevá las rodillas hacia arriba hasta que queden perpendiculares al piso, con las pantorrillas paralelas al suelo. Esta es la posición inicial.",
      "Simultáneamente, extendé la pierna derecha mientras llevás la rodilla izquierda hacia el pecho, y acercá el codo derecho a esa rodilla girando el torso mientras exhalás.",
      "Volvé a la posición inicial mientras inhalás.",
      "Repetí hacia el otro lado: extendé la pierna izquierda, traé la rodilla derecha al pecho y acercá el codo izquierdo girando el torso mientras exhalás.",
      "Continuá alternando de forma fluida hasta completar las repeticiones indicadas por cada lado.",
    ],
    puntosClave: [
      "El movimiento de piernas simula pedalear: una se extiende mientras la otra se dobla.",
      "El torso gira para llevar el codo hacia la rodilla opuesta, no solo el codo.",
    ],
    erroresComunes: [
      "Jalar del cuello en lugar de rotar el torso.",
      "Hacer el movimiento demasiado rápido perdiendo el control.",
    ],
  },
  Alternate_Heel_Touchers: {
    instrucciones: [
      "Acostado boca arriba con las rodillas flexionadas y los pies en el piso a unos 45–60 cm de separación; brazos extendidos a los costados. Esta es la posición inicial.",
      "Hacé crunch con el torso hacia adelante y arriba unos 8–10 cm hacia la derecha y tocá el talón derecho con la mano derecha; mantené la contracción un segundo mientras exhalás.",
      "Volvé lentamente a la posición inicial mientras inhalás.",
      "Luego hacé crunch hacia la izquierda unos 8–10 cm y tocá el talón izquierdo con la mano izquierda, manteniendo la contracción un segundo mientras exhalás; volvé a la posición inicial inhalando. Eso completa 1 repetición.",
      "Continuá alternando hacia cada lado hasta completar las repeticiones indicadas.",
    ],
    puntosClave: [
      "El movimiento de crunch es pequeño (8–10 cm) y lateral, no un sit-up.",
      "Los hombros permanecen ligeramente despegados del piso durante toda la serie.",
    ],
    erroresComunes: [
      "Hacer un movimiento demasiado grande, perdiendo el aislamiento del oblicuo.",
      "Bajar completamente entre repeticiones.",
    ],
  },
  Dumbbell_Flyes: {
    instrucciones: [
      "Acostado en un banco plano, tomá las mancuernas apoyadas sobre los muslos con las palmas mirándose entre sí.",
      "Ayudándote con los muslos para levantarlas, sujetá las mancuernas al ancho de hombros sobre el pecho con las palmas mirándose; llevalas hasta casi bloquear los codos. Esta es la posición inicial.",
      "Con los codos levemente flexionados para proteger el tendón del bíceps, abrí los brazos en arco amplio hacia los lados bajando lentamente mientras inhalás, hasta sentir el estiramiento en el pecho. Solo el hombro se mueve; el ángulo del codo se mantiene fijo durante todo el arco.",
      "Volvé los brazos a la posición inicial usando el mismo arco, apretando el pecho mientras exhalás.",
      "Sostené un segundo en la posición contraída y repetí las veces indicadas.",
    ],
    puntosClave: [
      "El ángulo del codo debe permanecer constante durante todo el movimiento.",
      "Usar el mismo arco al subir que al bajar para no lastimar el hombro.",
    ],
    erroresComunes: [
      "Flexionar y extender activamente el codo, convirtiendo el ejercicio en un press.",
      "Bajar las mancuernas demasiado, hiper-extendiendo el hombro.",
    ],
  },
  Standing_Dumbbell_Upright_Row: {
    instrucciones: [
      "Tomá una mancuerna en cada mano con agarre prono (palmas hacia el cuerpo), un poco más angosto que el ancho de hombros. Las mancuernas descansan sobre los muslos con los brazos casi extendidos y la espalda recta. Esta es la posición inicial.",
      "Usá los hombros laterales para subir las mancuernas pegadas al cuerpo mientras exhalás; los codos guían el movimiento y deben ir siempre más altos que los antebrazos. Continuá hasta que las mancuernas casi toquen el mentón; sostené un segundo con el torso quieto.",
      "Bajá las mancuernas lentamente a la posición inicial mientras inhalás.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "Los codos deben estar siempre por encima de las muñecas al subir.",
      "Las mancuernas suben pegadas al cuerpo, no hacia afuera.",
    ],
    erroresComunes: [
      "Balancear el torso para subir más peso.",
      "Elevar las mancuernas alejándolas del cuerpo.",
    ],
  },
  "Handstand_Push-Ups": {
    instrucciones: [
      "Con la espalda hacia la pared, inclinado desde la cintura, apoyá ambas manos en el piso al ancho de los hombros.",
      "Impulsate con las piernas para quedar en parada de manos contra la pared con los brazos extendidos. El cuerpo debe estar invertido con brazos y piernas completamente extendidos; mantené todo el cuerpo lo más recto posible. Si es la primera vez, pedile ayuda a alguien, y mantené la cabeza mirando la pared, no hacia abajo.",
      "Bajá lentamente hasta que la cabeza casi toque el piso mientras inhalás. Es fundamental bajar despacio para evitar golpes en la cabeza.",
      "Empujá lentamente hacia arriba mientras exhalás hasta que los codos estén casi extendidos.",
      "Repetí las veces indicadas.",
    ],
    puntosClave: [
      "Bajar muy lentamente para evitar golpes en la cabeza.",
      "Mantener el cuerpo alineado con los glúteos apretados para no arquearse.",
    ],
    erroresComunes: [
      "Bajar de golpe sin control, con riesgo de golpear la cabeza.",
      "Arquear la espalda perdiendo la alineación corporal.",
    ],
  },
};

const data: Record<string, Entrada> = JSON.parse(
  readFileSync(TRAD_PATH, "utf8"),
);

let count = 0;
for (const [id, patch] of Object.entries(patches)) {
  if (!data[id]) { console.warn(`⚠ No encontré ${id} en el diccionario`); continue; }
  Object.assign(data[id], patch);
  count++;
}

writeFileSync(TRAD_PATH, JSON.stringify(data, null, 2) + "\n");
console.log(`✅ Aplicadas ${count} re-traducciones → ${TRAD_PATH}`);
