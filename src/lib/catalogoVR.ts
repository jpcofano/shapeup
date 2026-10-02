// ════════════════════════════════════════════════════════════════════════════
//  lib/catalogoVR.ts — el catálogo, las rutinas y el programa de VR de P98.
//
//  Son datos, y el plan de lo que el seed tiene que escribir. Lo usa
//  `scripts/seed-rutinas-vr.ts`; acá queda testeable sin Firestore.
//
//  - **Ejercicios**: los cuatro ya existen (seed-vr.ts). Solo se les agregan las
//    dificultades del juego: Bodycombat las suyas, los demás relativas.
//  - **Rutinas**: Combat largo, Creed, Ritmo suave y Combat corto, con sus dos
//    escaleras y en el escalón 1 (el escalón de cada miembro se deriva de sus
//    subidas; la rutina no lo guarda).
//  - **Archivo**: las cuatro rutinas de VR anteriores. No se borran: hay sesiones
//    y programas que las referencian.
//  - **Programa**: 5 días, la semana de referencia, activo para juanpablo. El
//    PRG-0004 pasa a «Pausado». El PRG-0012 de María no se toca.
//
//  Puro (ADR #009).
// ════════════════════════════════════════════════════════════════════════════
import type {
  BloqueEjercicio, DiaPrograma, EscalonVR, Programa, Rutina, RutinaVR,
} from "../types/models";
import { DIFICULTADES_BODYCOMBAT, DIFICULTADES_RELATIVAS, minutosPrescriptos } from "./escalonesVR";
import { normalizeText } from "./canonical";

export const EJ_BODYCOMBAT = "EJ-9003";
export const EJ_CREED = "EJ-9004";
export const EJ_POWERBEATS = "EJ-9009";
export const EJ_BEAT_THE_BEATS = "EJ-9010";

/** Las dificultades que se agregan a cada ejercicio. */
export const DIFICULTADES_POR_EJERCICIO: Record<string, { id: string; etiqueta: string }[]> = {
  [EJ_BODYCOMBAT]: DIFICULTADES_BODYCOMBAT,
  [EJ_CREED]: DIFICULTADES_RELATIVAS,
  [EJ_POWERBEATS]: DIFICULTADES_RELATIVAS,
  [EJ_BEAT_THE_BEATS]: DIFICULTADES_RELATIVAS,
};

export const RUT_COMBAT_LARGO = "RUT-0026";
export const RUT_CREED = "RUT-0027";
export const RUT_RITMO_SUAVE = "RUT-0028";
export const RUT_COMBAT_CORTO = "RUT-0029";
export const PRG_VR_5_DIAS = "PRG-0013";

/** Las rutinas de VR que se archivan (P98). La RUT-0014 no. */
export const RUTINAS_A_ARCHIVAR = ["RUT-0004", "RUT-0005", "RUT-0007", "RUT-0008"];
/** El programa que se pausa al activar el nuevo. */
export const PROGRAMA_A_PAUSAR = "PRG-0004";
export const MIEMBRO_DEL_PROGRAMA = "juanpablo";

const bl = (bloques: number, minutosBloque: number, descansoSeg: number, dificultad: string): EscalonVR =>
  ({ bloques, minutosBloque, descansoSeg, dificultad });
const corrido = (minutos: number, dificultad: string): EscalonVR => bl(1, minutos, 0, dificultad);

interface DefRutina {
  idRutina: string;
  nombre: string;
  descripcion: string;
  nivel: Rutina["nivel"];
  nombreEjercicio: string;
  juego: string;
  vr: RutinaVR;
}

const DEFS: DefRutina[] = [
  {
    idRutina: RUT_COMBAT_LARGO,
    nombre: "VR — Combat largo (Les Mills)",
    descripcion: "Dos veces por semana, en Z3-Z4. Bloques largos: encadená los entrenamientos del juego que hagan falta para cubrir cada bloque.",
    nivel: "Intermedio", nombreEjercicio: "Les Mills Bodycombat (VR)", juego: "Les Mills Bodycombat",
    vr: {
      idEjercicio: EJ_BODYCOMBAT, zonasObjetivo: ["Z3", "Z4"], vecesPorSemana: 2,
      modoPorDefecto: "bloques", regla: "subir",
      escaleras: {
        bloques: [
          bl(2, 20, 120, "intermedio"), bl(2, 20, 120, "avanzado"), bl(2, 20, 90, "avanzado"),
          bl(2, 20, 60, "avanzado"), bl(3, 20, 60, "avanzado"),
        ],
        corrido: [corrido(40, "intermedio"), corrido(40, "avanzado"), corrido(50, "avanzado"), corrido(60, "avanzado")],
      },
    },
  },
  {
    idRutina: RUT_CREED,
    nombre: "VR — Creed",
    descripcion: "Una vez por semana, en Z4-Z5. Bloques de 12 minutos, nunca menos.",
    nivel: "Avanzado", nombreEjercicio: "Creed: Rise to Glory (VR)", juego: "Creed: Rise to Glory",
    vr: {
      idEjercicio: EJ_CREED, zonasObjetivo: ["Z4", "Z5"], vecesPorSemana: 1,
      modoPorDefecto: "bloques", regla: "subir",
      escaleras: {
        bloques: [
          bl(3, 12, 120, "base"), bl(3, 12, 120, "+1"), bl(3, 12, 90, "+1"),
          bl(3, 12, 60, "+1"), bl(4, 12, 60, "+1"),
        ],
        corrido: [corrido(30, "base"), corrido(30, "+1"), corrido(40, "+1")],
      },
    },
  },
  {
    idRutina: RUT_RITMO_SUAVE,
    nombre: "VR — Ritmo suave",
    descripcion: "Dos veces por semana, en Z2-Z3. Beat the Beats o PowerBeats. No tiene escalera, a propósito: su trabajo es quedarse suave.",
    nivel: "Intermedio", nombreEjercicio: "Beat the Beats (VR)", juego: "Beat the Beats",
    vr: {
      idEjercicio: EJ_BEAT_THE_BEATS, alternativas: [EJ_POWERBEATS], zonasObjetivo: ["Z2", "Z3"], vecesPorSemana: 2,
      modoPorDefecto: "corrido", regla: "bajar-si-pasa-techo",
      escaleras: { bloques: [bl(2, 15, 120, "base")], corrido: [corrido(30, "base")] },
    },
  },
  {
    idRutina: RUT_COMBAT_CORTO,
    nombre: "VR — Combat corto (Les Mills)",
    descripcion: "Comodín para días con poco tiempo: un bloque de 20 minutos, en el nivel del escalón actual de Combat largo por bloques. No cuenta para la regla de Combat largo.",
    nivel: "Intermedio", nombreEjercicio: "Les Mills Bodycombat (VR)", juego: "Les Mills Bodycombat",
    vr: {
      idEjercicio: EJ_BODYCOMBAT, zonasObjetivo: ["Z3", "Z4"],
      modoPorDefecto: "bloques", regla: "ninguna",
      escaleras: { bloques: [bl(1, 20, 0, "intermedio")] },
      sigueA: { idRutina: RUT_COMBAT_LARGO, modo: "bloques" },
    },
  },
];

/** La rutina como documento de `/rutinas`, en el escalón 1 del modo por defecto. */
function rutinaDoc(d: DefRutina): Omit<Rutina, "fechaCreacion" | "ultimaModificacion"> {
  const e1 = d.vr.escaleras[d.vr.modoPorDefecto]![0];
  const minutos = Math.round(minutosPrescriptos(e1));
  // `Continuo` a propósito: con `Intervalos` y juego sugerido, la rutina entraría
  // en la progresión de P79 (`bloqueVRDeRutina`), que convive solo con las viejas.
  const bloque: BloqueEjercicio = {
    orden: 1, idEjercicio: d.vr.idEjercicio, nombreEjercicio: d.nombreEjercicio, modalidad: "Cardio",
    prescripcion: {
      modalidad: "Cardio", formato: "Continuo", duracionMin: minutos,
      zonaObjetivo: d.vr.zonasObjetivo[0], juegoSugerido: d.juego,
    },
  };
  return {
    idRutina: d.idRutina, nombre: d.nombre, nombreCanonico: normalizeText(d.nombre),
    foco: "VR", objetivo: "Recomposición", nivel: d.nivel, nivelOrden: d.nivel === "Avanzado" ? 3 : 2,
    lugar: "Casa", equipoNecesario: ["VR"],
    descripcion: d.descripcion,
    bloques: [bloque],
    vr: d.vr,
    duracionEstimadaMin: minutos, totalSeries: 1,
    vecesEntrenada: 0,
    fuente: "P98",
  };
}

export const RUTINAS_VR = DEFS.map(rutinaDoc);

const dia = (orden: number, diaSemana: DiaPrograma["diaSemana"], etiqueta: string, idRutina: string): DiaPrograma =>
  ({ orden, diaSemana, etiqueta, tipo: "rutina", idRutina, opcional: false });

/** La semana de referencia (P98): nunca dos días duros seguidos. Es una guía, no algo que la app imponga. */
export const PROGRAMA_VR: Omit<Programa, "fechaCreacion" | "ultimaModificacion"> = {
  idPrograma: PRG_VR_5_DIAS,
  nombre: "VR — 5 días",
  nombreCanonico: normalizeText("VR — 5 días"),
  // «Plantilla», no «Activo»: un programa «Activo» es el respaldo de quien no
  // tiene programa en /config/programaActivo, y se lo daría a los demás miembros.
  estado: "Plantilla",
  objetivo: "Recomposición",
  nivel: "Intermedio",
  diasPorSemana: 5,
  descripcion: "Cinco días, todos de VR, sin dos días duros seguidos. Combat corto queda como comodín para los días con poco tiempo.",
  comoUsar: "Cada rutina tiene dos modos, por bloques o de corrido: lo elegís al empezar. La app propone subir de escalón cuando lo medido lo sostiene; vos aceptás.",
  dias: [
    dia(1, "lunes", "Lunes — Combat largo", RUT_COMBAT_LARGO),
    dia(2, "martes", "Martes — Ritmo suave", RUT_RITMO_SUAVE),
    dia(3, "miércoles", "Miércoles — Creed", RUT_CREED),
    dia(4, "jueves", "Jueves — Ritmo suave", RUT_RITMO_SUAVE),
    dia(5, "viernes", "Viernes — Combat largo", RUT_COMBAT_LARGO),
  ],
  vecesUsado: 0,
};

// ── El plan del seed ───────────────────────────────────────────────────────

/** Lo que hay hoy en Firestore, lo justo para planificar. */
export interface EstadoActualVR {
  ejercicios: Record<string, { dificultadesVR?: { id: string; etiqueta: string }[] } | undefined>;
  rutinas: Record<string, { archivada?: boolean } | undefined>;
  programas: Record<string, { estado?: string } | undefined>;
  programaActivo: Record<string, string | undefined>;
}

export type PasoSeedVR =
  | { tipo: "dificultades"; idEjercicio: string; dificultadesVR: { id: string; etiqueta: string }[] }
  | { tipo: "crear-rutina"; idRutina: string }
  | { tipo: "archivar-rutina"; idRutina: string }
  | { tipo: "crear-programa"; idPrograma: string }
  | { tipo: "pausar-programa"; idPrograma: string; estadoAntes: string | null }
  | { tipo: "activar-programa"; miembro: string; idPrograma: string; antes: string | null };

export interface PlanSeedVR {
  pasos: PasoSeedVR[];
  /** Lo que ya está y no se toca, dicho para que se vea. */
  yaEstan: string[];
  /** Lo que no se puede hacer, y por qué. */
  problemas: string[];
}

/**
 * Qué tiene que escribir el seed para llegar al estado de P98. Idempotente: con
 * el estado ya alcanzado, no hay pasos.
 */
export function planificarSeedVR(actual: EstadoActualVR): PlanSeedVR {
  const plan: PlanSeedVR = { pasos: [], yaEstan: [], problemas: [] };

  for (const [id, dif] of Object.entries(DIFICULTADES_POR_EJERCICIO)) {
    const ej = actual.ejercicios[id];
    if (!ej) { plan.problemas.push(`${id} no existe en /ejercicios (lo crea seed:vr)`); continue; }
    if (JSON.stringify(ej.dificultadesVR ?? null) === JSON.stringify(dif)) plan.yaEstan.push(`${id} dificultades`);
    else plan.pasos.push({ tipo: "dificultades", idEjercicio: id, dificultadesVR: dif });
  }

  for (const r of RUTINAS_VR) {
    if (actual.rutinas[r.idRutina]) plan.yaEstan.push(`${r.idRutina} existe (no se pisa)`);
    else plan.pasos.push({ tipo: "crear-rutina", idRutina: r.idRutina });
  }

  for (const id of RUTINAS_A_ARCHIVAR) {
    const r = actual.rutinas[id];
    if (!r) { plan.problemas.push(`${id} no existe: no hay nada que archivar`); continue; }
    if (r.archivada) plan.yaEstan.push(`${id} archivada`);
    else plan.pasos.push({ tipo: "archivar-rutina", idRutina: id });
  }

  if (actual.programas[PRG_VR_5_DIAS]) plan.yaEstan.push(`${PRG_VR_5_DIAS} existe (no se pisa)`);
  else plan.pasos.push({ tipo: "crear-programa", idPrograma: PRG_VR_5_DIAS });

  const aPausar = actual.programas[PROGRAMA_A_PAUSAR];
  if (!aPausar) plan.problemas.push(`${PROGRAMA_A_PAUSAR} no existe`);
  else if (aPausar.estado === "Pausado") plan.yaEstan.push(`${PROGRAMA_A_PAUSAR} pausado`);
  else plan.pasos.push({ tipo: "pausar-programa", idPrograma: PROGRAMA_A_PAUSAR, estadoAntes: aPausar.estado ?? null });

  const activo = actual.programaActivo[MIEMBRO_DEL_PROGRAMA] ?? null;
  if (activo === PRG_VR_5_DIAS) plan.yaEstan.push(`${PRG_VR_5_DIAS} activo para ${MIEMBRO_DEL_PROGRAMA}`);
  else plan.pasos.push({ tipo: "activar-programa", miembro: MIEMBRO_DEL_PROGRAMA, idPrograma: PRG_VR_5_DIAS, antes: activo });

  return plan;
}

/** Aplica el plan sobre el estado, como lo dejaría Firestore. Para los tests de idempotencia. */
export function aplicarPlanSeedVR(actual: EstadoActualVR, plan: PlanSeedVR): EstadoActualVR {
  const out: EstadoActualVR = JSON.parse(JSON.stringify(actual));
  for (const p of plan.pasos) {
    if (p.tipo === "dificultades") out.ejercicios[p.idEjercicio] = { ...(out.ejercicios[p.idEjercicio] ?? {}), dificultadesVR: p.dificultadesVR };
    if (p.tipo === "crear-rutina") out.rutinas[p.idRutina] = {};
    if (p.tipo === "archivar-rutina") out.rutinas[p.idRutina] = { ...(out.rutinas[p.idRutina] ?? {}), archivada: true };
    if (p.tipo === "crear-programa") out.programas[p.idPrograma] = { estado: PROGRAMA_VR.estado };
    if (p.tipo === "pausar-programa") out.programas[p.idPrograma] = { ...(out.programas[p.idPrograma] ?? {}), estado: "Pausado" };
    if (p.tipo === "activar-programa") out.programaActivo[p.miembro] = p.idPrograma;
  }
  return out;
}
