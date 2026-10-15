// ════════════════════════════════════════════════════════════════════════════
//  lib/vrAMedida.ts — la rutina de VR «a medida» (P102).
//
//  La persona elige juego, bloques, minutos y descanso al empezar. Acá viven las
//  reglas puras: los valores iniciales, los límites de los controles y lo que se
//  sella al tocar «Empezar».
//
//  - **Valores iniciales:** la última configuración usada con ese juego en esta
//    rutina (la más reciente por `inicioMs`, y si falta, por `fechaRealizada`).
//    Sin historia: con Les Mills, el escalón actual de Combat largo por bloques;
//    con los demás juegos, 2 × 15 con 2:00.
//  - **La dificultad prevista no sale del historial:** con Les Mills es la del
//    escalón actual de Combat largo; con los demás, "base".
//  - Todo valor inicial se ajusta a los rangos de `aMedida`.
//  - **Modo:** `corrido` con 1 bloque (y descanso 0, que nunca se usa); si no,
//    `bloques`.
//
//  Puro (ADR #009).
// ════════════════════════════════════════════════════════════════════════════
import type {
  EscalonVR, Historial, ModoEscaleraVR, PerfilMiembro, RangoVR, Rutina,
} from "../types/models";
import { EJ_BODYCOMBAT } from "./catalogoVR";
import { escalonDeHoy } from "./escalonesVR";

/** El respaldo con los juegos que no son Les Mills y sin historia: 2 × 15 con 2:00. */
export const RESPALDO_GENERICO_AMEDIDA: EscalonVR = {
  bloques: 2, minutosBloque: 15, descansoSeg: 120, dificultad: "base",
};

export function esAMedida(rutina: Pick<Rutina, "vr">): boolean {
  return !!rutina.vr?.aMedida;
}

/** Los juegos que ofrece la rutina, el por defecto primero. `[]` si no es a medida. */
export function juegosAMedida(rutina: Pick<Rutina, "vr">): string[] {
  const vr = rutina.vr;
  if (!vr?.aMedida) return [];
  return [vr.idEjercicio, ...(vr.alternativas ?? [])];
}

// ── Rangos ─────────────────────────────────────────────────────────────────

/** Entre el mínimo y el máximo, y en el paso más cercano contado desde el mínimo. */
export function ajustarAlRango(v: number, r: RangoVR): number {
  const acotado = Math.min(r.max, Math.max(r.min, v));
  const pasos = Math.round((acotado - r.min) / r.paso);
  return Math.min(r.max, r.min + pasos * r.paso);
}

/** Un paso hacia `dir`, sin pasarse de los extremos. */
export function moverEnRango(v: number, r: RangoVR, dir: 1 | -1): number {
  return ajustarAlRango(ajustarAlRango(v, r) + dir * r.paso, r);
}

export function puedeMover(v: number, r: RangoVR, dir: 1 | -1): boolean {
  const actual = ajustarAlRango(v, r);
  return dir === 1 ? actual + r.paso <= r.max : actual - r.paso >= r.min;
}

// ── Valores iniciales ──────────────────────────────────────────────────────

export interface EntradaInicialAMedida {
  rutina: Pick<Rutina, "idRutina" | "vr">;
  idEjercicio: string;
  historial: Pick<Historial, "idRutina" | "vr" | "inicioMs" | "fechaRealizada">[];
  perfil?: Pick<PerfilMiembro, "subidasVR">;
  /** Combat largo (la rutina de `vr.sigueA`), si está cargada. */
  seguida?: Pick<Rutina, "idRutina" | "vr"> | null;
}

type SesionAMedida = EntradaInicialAMedida["historial"][number];

/** ¿Es `a` más reciente que `b`? Por `inicioMs`; si falta alguno, por fecha. */
function esMasReciente(a: SesionAMedida, b: SesionAMedida): boolean {
  if (a.inicioMs != null && b.inicioMs != null && a.inicioMs !== b.inicioMs) return a.inicioMs > b.inicioMs;
  return a.fechaRealizada > b.fechaRealizada;
}

export function valoresInicialesAMedida(e: EntradaInicialAMedida): EscalonVR {
  const lesMills = e.idEjercicio === EJ_BODYCOMBAT;

  // La dificultad prevista y el respaldo, sin tocar el historial.
  let respaldo: EscalonVR = RESPALDO_GENERICO_AMEDIDA;
  if (lesMills) {
    const hoy = (e.seguida ? escalonDeHoy(e.seguida, "bloques", e.perfil) : null)
      ?? escalonDeHoy(e.rutina, "bloques", e.perfil);
    if (hoy) respaldo = hoy.escalon;
  }

  let ultima: SesionAMedida | null = null;
  for (const h of e.historial) {
    if (h.idRutina !== e.rutina.idRutina || h.vr?.idEjercicio !== e.idEjercicio) continue;
    if (ultima === null || esMasReciente(h, ultima)) ultima = h;
  }
  const base = ultima?.vr?.prescripto ?? respaldo;

  const rangos = e.rutina.vr?.aMedida;
  const ajustar = (v: number, r?: RangoVR) => (r ? ajustarAlRango(v, r) : v);
  return {
    bloques: ajustar(base.bloques, rangos?.bloques),
    minutosBloque: ajustar(base.minutosBloque, rangos?.minutosBloque),
    descansoSeg: ajustar(base.descansoSeg, rangos?.descansoSeg),
    dificultad: respaldo.dificultad,
  };
}

// ── Lo que se sella ────────────────────────────────────────────────────────

/** Lo que se sella al tocar «Empezar». Con 1 bloque no hay descanso: se sella 0. */
export function prescriptoAMedida(c: EscalonVR): { prescripto: EscalonVR; modo: ModoEscaleraVR } {
  const unBloque = c.bloques === 1;
  return {
    prescripto: { ...c, descansoSeg: unBloque ? 0 : c.descansoSeg },
    modo: unBloque ? "corrido" : "bloques",
  };
}
