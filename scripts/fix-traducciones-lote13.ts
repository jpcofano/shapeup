/**
 * Lote 13 — 13 NUEVAS traducciones (expert + equipo hogareño, tanda final).
 * Completa TODO el pool de body only/dumbbell/bands/kettlebells en los 3 niveles.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const FILE = resolve("scripts/data/traducciones-fedb.es.json");
const t = JSON.parse(readFileSync(FILE, "utf8"));

const nuevos: Record<string, object> = {

  "Bent_Press": {
    nombre: "Bent press con pesa rusa",
    patron: "Core anti-rotación",
    unilateral: true,
    sinonimos: ["bent press", "press inclinado lateral kettlebell"],
    instrucciones: [
      "Cargá una pesa rusa al hombro extendiendo piernas y cadera mientras la elevás hacia el hombro. La muñeca debe rotar al hacerlo. Esta es la posición inicial.",
      "Comenzá inclinándote hacia el lado opuesto a la pesa, continuando hasta poder tocar el piso con la mano libre, manteniendo la vista en la pesa. Mientras hacés esto, presioná el peso verticalmente extendiendo el codo, manteniendo el brazo perpendicular al piso.",
      "Volvé a la posición erguida con la pesa por encima de la cabeza. Devolvé la pesa al hombro y repetí las veces indicadas.",
    ],
    puntosClave: [
      "El cuerpo se inclina hacia el lado contrario mientras el brazo presiona; es un ejercicio de fuerza y técnica avanzada.",
    ],
    erroresComunes: [
      "Perder de vista la pesa, desestabilizando el hombro.",
    ],
  },

  "Double_Kettlebell_Snatch": {
    nombre: "Arrancada con dos pesas rusas",
    patron: "Empuje vertical",
    unilateral: false,
    sinonimos: ["double kettlebell snatch", "snatch doble kettlebell"],
    instrucciones: [
      "Colocá dos pesas rusas detrás de los pies. Flexioná las rodillas y llevá los glúteos hacia atrás para tomar las pesas.",
      "Balanceá las pesas con fuerza entre las piernas y revertí la dirección.",
      "Empujá con la cadera y bloqueá las pesas por encima de la cabeza en un movimiento continuo e ininterrumpido.",
    ],
    puntosClave: [
      "El movimiento debe ser continuo, sin pausa entre el balanceo y el bloqueo arriba.",
    ],
    erroresComunes: [
      "Detenerse a mitad de camino, perdiendo el impulso de la cadera.",
    ],
  },

  "Lying_Crossover": {
    nombre: "Estiramiento cruzado acostado (asistido)",
    patron: "Aislamiento",
    unilateral: true,
    sinonimos: ["lying crossover stretch", "estiramiento fnp cruzado"],
    instrucciones: [
      "Acostáte boca arriba con las piernas extendidas.",
      "Cruzá una pierna sobre el cuerpo con la rodilla flexionada, intentando tocar el piso con la rodilla. Tu compañero debe arrodillarse a tu lado, sosteniendo tu hombro hacia abajo con una mano y controlando la pierna cruzada con la otra. Esta es la posición inicial.",
      "Intentá elevar la rodilla flexionada del piso mientras tu compañero evita cualquier movimiento real.",
      "Después de 10-20 segundos, relajá la pierna mientras tu compañero presiona suavemente la rodilla hacia el piso. Repetí del otro lado.",
    ],
    puntosClave: [
      "Es un estiramiento FNP (facilitación neuromuscular propioceptiva): requiere un compañero que aplique resistencia y luego asista el estiramiento.",
    ],
    erroresComunes: [
      "Que el compañero fuerce el estiramiento sin avisar, generando dolor o lesión.",
    ],
  },

  "Lying_Glute": {
    nombre: "Estiramiento de glúteo acostado (asistido)",
    patron: "Aislamiento",
    unilateral: true,
    sinonimos: ["lying glute stretch", "estiramiento fnp gluteo"],
    instrucciones: [
      "Acostáte boca arriba con tu compañero arrodillado a tu lado.",
      "Flexioná la cadera de una pierna, elevándola del piso. Rotá la pierna de modo que el pie quede sobre la cadera contraria, con la parte inferior de la pierna perpendicular al cuerpo. Tu compañero debe sostener la rodilla y el tobillo en posición. Esta es la posición inicial.",
      "Intentá empujar la pierna hacia tu compañero, quien debe evitar cualquier movimiento real de la pierna.",
      "Después de 10-20 segundos, relajáte completamente mientras tu compañero empuja suavemente el tobillo y la rodilla hacia tu pecho. Asegurate de avisarle a tu ayudante cuando el estiramiento sea suficiente para evitar lesiones o sobreestiramiento.",
    ],
    puntosClave: [
      "Es un estiramiento FNP: comunicación constante con el compañero es clave para evitar lesiones.",
    ],
    erroresComunes: [
      "No avisar a tiempo cuando el estiramiento llega al límite.",
    ],
  },

  "Lying_Prone_Quadriceps": {
    nombre: "Estiramiento de cuádriceps boca abajo (asistido)",
    patron: "Aislamiento",
    unilateral: true,
    sinonimos: ["lying prone quad stretch", "estiramiento fnp cuadriceps"],
    instrucciones: [
      "Acostáte boca abajo en el piso con tu compañero arrodillado a tu lado. Flexioná una rodilla y elevá esa pierna del piso, intentando tocar el glúteo con el pie. Tu compañero debe sostener la rodilla y el tobillo. Esta es la posición inicial.",
      "Intentá extender la rodilla mientras tu compañero evita cualquier movimiento real.",
      "Después de 10-20 segundos, relajá los músculos mientras tu compañero empuja suavemente el pie hacia tu glúteo, profundizando el estiramiento del cuádriceps y los flexores de cadera.",
      "Después de 10-20 segundos, cambiá de lado.",
    ],
    puntosClave: [
      "Es un estiramiento FNP: la fase de contracción isométrica previa mejora el rango final del estiramiento.",
    ],
    erroresComunes: [
      "Forzar el estiramiento sin pasar por la fase de contracción isométrica.",
    ],
  },

  "One-Arm_Kettlebell_Split_Snatch": {
    nombre: "Arrancada partida unilateral con pesa rusa",
    patron: "Empuje vertical",
    unilateral: true,
    sinonimos: ["split snatch un brazo kettlebell"],
    instrucciones: [
      "Sostené una pesa rusa del mango con una mano.",
      "Hacé una sentadilla hacia el piso y luego revertí el movimiento, extendiendo caderas, rodillas y finalmente tobillos, para elevar la pesa por encima de la cabeza.",
      "Después de extender completamente el cuerpo, descendé a una posición de zancada para recibir el peso arriba, con una pierna adelante y otra atrás. Asegurate de empujar con la cadera y bloquear la pesa arriba en un movimiento continuo e ininterrumpido.",
      "Volvé a la posición de pie sosteniendo el peso arriba y juntá los pies. Bajá el peso para volver a la posición inicial.",
    ],
    puntosClave: [
      "La posición de zancada al recibir el peso permite manejar cargas más pesadas que con los pies juntos.",
    ],
    erroresComunes: [
      "No coordinar el paso de los pies con el momento de la arrancada.",
    ],
  },

  "One-Arm_Overhead_Kettlebell_Squats": {
    nombre: "Sentadilla overhead unilateral con pesa rusa",
    patron: "Dominante de rodilla",
    unilateral: true,
    sinonimos: ["overhead squat un brazo kettlebell"],
    instrucciones: [
      "Hacé la cargada y el press de una pesa rusa con un brazo. Cargá la pesa al hombro extendiendo piernas y cadera mientras la tirás hacia el hombro, rotando la muñeca al hacerlo. Presioná el peso por encima de la cabeza extendiendo el codo. Esta es la posición inicial.",
      "Mirando al frente y manteniendo la pesa bloqueada por encima de vos, flexioná rodillas y caderas y bajá el torso entre las piernas, manteniendo la cabeza y el pecho arriba.",
      "Pausá en la posición baja un segundo antes de subir de nuevo, empujando con los talones.",
    ],
    puntosClave: [
      "Exige gran movilidad de hombro y tobillo, además de estabilidad de core con la carga asimétrica.",
    ],
    erroresComunes: [
      "Perder la verticalidad del brazo durante la sentadilla.",
    ],
  },

  "Open_Palm_Kettlebell_Clean": {
    nombre: "Cargada a palma abierta con pesa rusa",
    patron: "Dominante de cadera",
    unilateral: false,
    sinonimos: ["open palm kettlebell clean", "cargada bimanual palma abierta"],
    instrucciones: [
      "Colocá una pesa rusa entre los pies. Cargála extendiendo piernas y cadera mientras la elevás hacia los hombros.",
      "Soltá la pesa mientras sube y dejá que gire de modo que la bola de la pesa caiga en las palmas de las manos.",
      "Lanzá la pesa hacia adelante y atrapá el mango con ambas manos. Bajá la pesa a la posición inicial y repetí.",
    ],
    puntosClave: [
      "Requiere muy buena coordinación para atrapar el mango con ambas manos sin golpear el antebrazo.",
    ],
    erroresComunes: [
      "Atrapar la pesa con mala posición de muñeca.",
    ],
  },

  "Overhead_Triceps": {
    nombre: "Estiramiento de tríceps sobre cabeza (asistido)",
    patron: "Aislamiento",
    unilateral: true,
    sinonimos: ["overhead tricep stretch", "estiramiento fnp triceps"],
    instrucciones: [
      "Sentáte erguido en el piso con tu compañero detrás de vos. Elevá un brazo directamente hacia arriba y flexioná el codo, intentando tocar la espalda con la mano. Tu compañero debe sostener tu codo y tu muñeca. Esta es la posición inicial.",
      "Intentá extender el brazo completamente hacia arriba mientras tu compañero evita que realmente lo hagas.",
      "Después de 10-20 segundos, relajá el brazo y dejá que tu compañero profundice el estiramiento del tríceps aplicando presión suave en la muñeca. Sostené 10-20 segundos y cambiá de lado.",
    ],
    puntosClave: [
      "Es un estiramiento FNP: la contracción isométrica previa permite un estiramiento más profundo y seguro.",
    ],
    erroresComunes: [
      "Aplicar presión brusca sin la fase de contracción isométrica previa.",
    ],
  },

  "Plyo_Kettlebell_Pushups": {
    nombre: "Flexiones pliométricas sobre pesa rusa",
    patron: "Empuje horizontal",
    unilateral: false,
    sinonimos: ["plyo kettlebell push ups", "flexiones explosivas con pesa rusa"],
    instrucciones: [
      "Colocá una pesa rusa en el piso. Adoptá posición de flexión de brazos, sobre los dedos de los pies con una mano en el piso y la otra sosteniendo la pesa rusa, con los codos extendidos. Esta es la posición inicial.",
      "Comenzá bajando lo más posible, manteniendo la espalda recta.",
      "Revertí la dirección rápida y fuertemente, empujándote hacia arriba para pasar al otro lado de la pesa rusa, cambiando de mano al hacerlo. Continuá el movimiento bajando y repitiendo de un lado al otro.",
    ],
    puntosClave: [
      "El cambio de mano en el aire exige potencia explosiva y buena coordinación de hombros.",
    ],
    erroresComunes: [
      "No extender completamente los codos antes del salto, perdiendo potencia.",
    ],
  },

  "Seated_Biceps": {
    nombre: "Estiramiento de bíceps sentado (asistido)",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["seated bicep stretch", "estiramiento fnp biceps"],
    instrucciones: [
      "Sentáte en el piso con las rodillas flexionadas y tu compañero parado detrás de vos. Extendé los brazos rectos detrás de vos con las palmas enfrentadas. Tu compañero sostendrá tus muñecas. Esta es la posición inicial.",
      "Intentá flexionar los codos mientras tu compañero evita cualquier movimiento real.",
      "Después de 10-20 segundos, relajá los brazos mientras tu compañero tira suavemente de tus muñecas hacia arriba para estirar el bíceps. Asegurate de avisarle a tu compañero cuando el estiramiento sea adecuado para evitar lesiones o sobreestiramiento.",
    ],
    puntosClave: [
      "Es un estiramiento FNP: comunicación clara con el compañero evita lesiones.",
    ],
    erroresComunes: [
      "No comunicar a tiempo el límite del estiramiento.",
    ],
  },

  "Seated_Front_Deltoid": {
    nombre: "Estiramiento de deltoide anterior sentado (asistido)",
    patron: "Aislamiento",
    unilateral: false,
    sinonimos: ["seated front deltoid stretch", "estiramiento fnp hombro anterior"],
    instrucciones: [
      "Sentáte erguido en el piso con las piernas flexionadas y tu compañero parado detrás de vos. Extendé los brazos rectos hacia los costados, con las palmas mirando hacia el piso. Intentá llevarlos lo más atrás posible mientras tu compañero sostiene tus muñecas. Esta es la posición inicial.",
      "Manteniendo los codos rectos, intentá llevar los brazos hacia adelante, mientras tu compañero te restringe suavemente para evitar cualquier movimiento real durante 10-20 segundos.",
      "Ahora relajá los músculos y dejá que tu compañero incremente suavemente el estiramiento de hombros y pecho. Sostené 10 a 20 segundos.",
    ],
    puntosClave: [
      "Es un estiramiento FNP: ideal para mejorar la movilidad de hombro tras entrenamientos de empuje.",
    ],
    erroresComunes: [
      "Forzar el estiramiento sin la fase de contracción previa.",
    ],
  },

  "Seated_Glute": {
    nombre: "Estiramiento de glúteo sentado (asistido)",
    patron: "Aislamiento",
    unilateral: true,
    sinonimos: ["seated glute stretch", "estiramiento fnp gluteo sentado"],
    instrucciones: [
      "En posición sentada con las rodillas flexionadas, cruzá un tobillo sobre la rodilla contraria. Tu compañero se parará detrás de vos. Ahora, inclinate hacia adelante mientras tu compañero sostiene tus hombros con las manos. Esta es la posición inicial.",
      "Intentá empujar el torso hacia atrás durante 10-20 segundos, mientras tu compañero evita cualquier movimiento real del torso.",
      "Ahora relajá los músculos mientras tu compañero aumenta el estiramiento empujando suavemente tu torso hacia adelante durante 10-20 segundos.",
    ],
    puntosClave: [
      "Es un estiramiento FNP: la posición de tobillo cruzado sobre rodilla enfoca el piriforme y el glúteo profundo.",
    ],
    erroresComunes: [
      "Empujar demasiado fuerte sin escuchar el feedback de la persona estirándose.",
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
console.log(`✅ Lote 13 aplicado — ${nuevasAgregadas} entradas nuevas agregadas.`);
