/* ShapeUp UI Kit — datos mock realistas (basados en los seeds del repo). */

const MEMBERS = {
  juanpablo: { id: "juanpablo", nombre: "Juan Pablo", iniciales: "JP", color: "var(--member-juanpablo)", edad: 51, fcMax: 169, objetivos: ["Recomposición"] },
  maria:     { id: "maria",     nombre: "María",      iniciales: "M",  color: "var(--member-maria)",     edad: 50, fcMax: 170, objetivos: ["Recomposición", "Pérdida de grasa"] },
  sofia:     { id: "sofia",     nombre: "Sofía",      iniciales: "S",  color: "var(--member-sofia)",     edad: 17, fcMax: 203, objetivos: ["General / salud", "Movilidad"] },
  federico:  { id: "federico",  nombre: "Federico",   iniciales: "F",  color: "var(--member-federico)",  edad: 16, fcMax: 204, objetivos: ["General / salud"] },
};

const EJERCICIOS = {
  press_banca: {
    id: "press_banca", nombre: "Press de banca con mancuernas", grupo: "Pecho", modalidad: "Fuerza",
    equipo: ["Mancuernas", "Banco"], nivel: "Intermedio",
    instrucciones: ["Acostate en el banco con una mancuerna en cada mano a la altura del pecho.", "Empujá hacia arriba hasta extender los codos sin bloquearlos.", "Bajá controlado hasta sentir estiramiento en el pecho."],
    puntosClave: ["Escápulas retraídas y pecho alto.", "Muñecas firmes, alineadas con el antebrazo."],
    erroresComunes: ["Rebotar las mancuernas abajo.", "Abrir demasiado los codos (riesgo de hombro)."],
  },
  remo_mancuerna: {
    id: "remo_mancuerna", nombre: "Remo a una mano", grupo: "Espalda", modalidad: "Fuerza",
    equipo: ["Mancuernas", "Banco"], nivel: "Intermedio",
    instrucciones: ["Apoyá una rodilla y una mano en el banco.", "Tirá la mancuerna hacia la cadera llevando el codo atrás.", "Bajá controlado estirando bien la espalda."],
    puntosClave: ["Espalda neutra, no redondees.", "Tirá con el codo, no con el bíceps."],
    erroresComunes: ["Rotar el torso para subir más peso.", "Encoger el hombro."],
  },
  sentadilla_goblet: {
    id: "sentadilla_goblet", nombre: "Sentadilla goblet", grupo: "Pierna", modalidad: "Fuerza",
    equipo: ["Mancuernas", "Kettlebell"], nivel: "Principiante",
    instrucciones: ["Sostené una mancuerna contra el pecho.", "Bajá empujando las rodillas hacia afuera.", "Subí apretando glúteos arriba."],
    puntosClave: ["Talones apoyados todo el rango.", "Pecho arriba, core firme."],
    erroresComunes: ["Las rodillas se meten hacia adentro.", "Levantar los talones."],
  },
  plancha: {
    id: "plancha", nombre: "Plancha frontal", grupo: "Core", modalidad: "Isométrico",
    equipo: ["Peso corporal"], nivel: "Principiante",
    instrucciones: ["Apoyate sobre antebrazos y puntas de pie.", "Mantené el cuerpo en línea recta.", "Aguantá el tiempo objetivo respirando."],
    puntosClave: ["Glúteos y abdomen apretados.", "Cadera ni arriba ni hundida."],
    erroresComunes: ["Dejar caer la cadera.", "Aguantar la respiración."],
  },
};

const RUTINAS = {
  r_empuje: {
    id: "r_empuje", nombre: "Tren superior — Empuje", foco: "Empuje", nivel: "Intermedio", duracion: 45,
    bloques: [
      { idEjercicio: "press_banca",     nombre: "Press de banca con mancuernas", modalidad: "Fuerza",      series: 4, reps: 10, cargaKg: 22.5, descansoSeg: 90 },
      { idEjercicio: "remo_mancuerna",  nombre: "Remo a una mano",               modalidad: "Fuerza",      series: 4, reps: 12, cargaKg: 20,   descansoSeg: 90 },
      { idEjercicio: "plancha",         nombre: "Plancha frontal",               modalidad: "Isométrico",  series: 3, segundos: 45,           descansoSeg: 60 },
    ],
  },
  r_pierna: {
    id: "r_pierna", nombre: "Tren inferior — Fuerza", foco: "Pierna", nivel: "Intermedio", duracion: 50,
    bloques: [
      { idEjercicio: "sentadilla_goblet", nombre: "Sentadilla goblet", modalidad: "Fuerza", series: 4, reps: 12, cargaKg: 24, descansoSeg: 90 },
      { idEjercicio: "plancha",           nombre: "Plancha frontal",   modalidad: "Isométrico", series: 3, segundos: 45, descansoSeg: 60 },
    ],
  },
  r_movilidad: {
    id: "r_movilidad", nombre: "Movilidad y core", foco: "Core", nivel: "Principiante", duracion: 25,
    bloques: [
      { idEjercicio: "plancha", nombre: "Plancha frontal", modalidad: "Isométrico", series: 3, segundos: 40, descansoSeg: 45 },
    ],
  },
};

const PROGRAMA = {
  nombre: "Recomposición 4 días", diasPorSemana: 4, objetivo: "Recomposición",
  hoy: { tipo: "rutina", idRutina: "r_empuje" },
  diasMarcados: [0, 2, 4, 5], // L M(x) J V mié... lunes=0
};

const SEMANA = { sesionesHechas: 2, sesionesObjetivo: 4, rachaSemanas: 3, volumenKg: 8240 };

const HISTORIAL = [
  { id: "h1", nombreRutina: "Tren superior — Empuje", fecha: "2026-06-03", duracionMin: 47, series: 11, tonelajeKg: 3960, rpe: 8 },
  { id: "h2", nombreRutina: "Tren inferior — Fuerza", fecha: "2026-06-01", duracionMin: 52, series: 11, tonelajeKg: 4320, rpe: 9 },
  { id: "h3", nombreRutina: "Movilidad y core",       fecha: "2026-05-30", duracionMin: 24, series: 3,  tonelajeKg: 0,    rpe: 5 },
  { id: "h4", nombreRutina: "Tren superior — Empuje", fecha: "2026-05-28", duracionMin: 45, series: 11, tonelajeKg: 3850, rpe: 7 },
  { id: "h5", nombreRutina: "Tren inferior — Fuerza", fecha: "2026-05-26", duracionMin: 50, series: 11, tonelajeKg: 4180, rpe: 8 },
];

const SALUD = {
  mediciones: [
    { fecha: "2026-06-04", pesoKg: 84.2, grasaPct: 21.4, masaMuscularKg: 36.1, imc: 25.9 },
    { fecha: "2026-05-28", pesoKg: 84.8, grasaPct: 21.9, masaMuscularKg: 35.9, imc: 26.1 },
    { fecha: "2026-05-21", pesoKg: 85.3, grasaPct: 22.3, masaMuscularKg: 35.7, imc: 26.2 },
    { fecha: "2026-05-14", pesoKg: 85.9, grasaPct: 22.6, masaMuscularKg: 35.6, imc: 26.4 },
    { fecha: "2026-05-07", pesoKg: 86.4, grasaPct: 23.1, masaMuscularKg: 35.4, imc: 26.6 },
  ],
  cardio: [
    { actividad: "Bici fija", fecha: "2026-06-02", duracionMin: 35, kcal: 410, fcPromedio: 132, zona: "Z3" },
    { actividad: "Caminata rápida", fecha: "2026-05-31", duracionMin: 50, kcal: 280, fcPromedio: 108, zona: "Z2" },
    { actividad: "HIIT", fecha: "2026-05-29", duracionMin: 22, kcal: 320, fcPromedio: 154, zona: "Z4" },
  ],
  sueno: [
    { fecha: "2026-06-04", horas: 7.2, acostarse: "23:40" },
    { fecha: "2026-06-03", horas: 6.8, acostarse: "00:10" },
    { fecha: "2026-06-02", horas: 7.6, acostarse: "23:20" },
    { fecha: "2026-06-01", horas: 6.5, acostarse: "00:30" },
  ],
};

const ZONA_COLOR = { Z1: "var(--zona-z1)", Z2: "var(--zona-z2)", Z3: "var(--zona-z3)", Z4: "var(--zona-z4)", Z5: "var(--zona-z5)" };
const ZONA_DIM   = { Z1: "var(--zona-z1-dim)", Z2: "var(--zona-z2-dim)", Z3: "var(--zona-z3-dim)", Z4: "var(--zona-z4-dim)", Z5: "var(--zona-z5-dim)" };

Object.assign(window, { MEMBERS, EJERCICIOS, RUTINAS, PROGRAMA, SEMANA, HISTORIAL, SALUD, ZONA_COLOR, ZONA_DIM });
