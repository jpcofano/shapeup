// ════════════════════════════════════════════════════════════════════════════
//  lib/guiaBloquesVR.ts — la guía de bloques y descansos de VR por escalones (P98).
//
//  El reloj arranca en `inicioMs` y la sesión dura
//  `bloques*minutosBloque*60 + (bloques-1)*descansoSeg` segundos: no hay descanso
//  después del último bloque. La guía **no corta ni pide toques**: si la persona se
//  pasa, es tiempo de más (`deMasSeg`).
//
//  Todo en epoch ms UTC; la hora local se arma recién al mostrar (`horaLocal`).
//
//  Puro (ADR #009).
// ════════════════════════════════════════════════════════════════════════════
import type { EscalonVR } from "../types/models";

type Presc = Pick<EscalonVR, "bloques" | "minutosBloque" | "descansoSeg">;

export type FaseGuiaVR = "bloque" | "descanso" | "terminado";

export interface GuiaBloquesVR {
  fase: FaseGuiaVR;
  /** En bloque: el actual (1-based). En descanso: el que viene. En terminado: el total. */
  bloque: number;
  totalBloques: number;
  /** Segundos que quedan de la fase (redondeo hacia arriba). 0 en terminado. */
  quedaSeg: number;
  /** Cuándo termina la fase (epoch ms). null en terminado. */
  finFaseMs: number | null;
  /** Cuándo termina toda la sesión prevista (epoch ms). */
  finPrevistoMs: number;
  /** Segundos de más pasado el fin previsto (floor). 0 si no terminó. */
  deMasSeg: number;
}

function duraciones(p: Presc) {
  const B = p.minutosBloque * 60000;
  const D = p.descansoSeg * 1000;
  const n = p.bloques;
  return { B, D, n, ciclo: B + D, total: n * B + (n - 1) * D };
}

export function finPrevistoMs(p: Presc, inicioMs: number): number {
  return inicioMs + duraciones(p).total;
}

export function guiaBloquesVR(p: Presc, inicioMs: number, now: number): GuiaBloquesVR {
  const { B, n, ciclo, total } = duraciones(p);
  const fin = inicioMs + total;
  const e = Math.max(0, now - inicioMs);

  if (e >= total) {
    return {
      fase: "terminado", bloque: n, totalBloques: n, quedaSeg: 0,
      finFaseMs: null, finPrevistoMs: fin, deMasSeg: Math.floor((e - total) / 1000),
    };
  }

  const i = Math.floor(e / ciclo);
  const dentro = e - i * ciclo;
  const enBloque = dentro < B;
  const finFaseMs = enBloque ? inicioMs + i * ciclo + B : inicioMs + (i + 1) * ciclo;
  return {
    fase: enBloque ? "bloque" : "descanso",
    bloque: enBloque ? i + 1 : i + 2,
    totalBloques: n,
    quedaSeg: Math.ceil((finFaseMs - inicioMs - e) / 1000),
    finFaseMs,
    finPrevistoMs: fin,
    deMasSeg: 0,
  };
}

const dos = (n: number) => String(n).padStart(2, "0");

/** "HH:MM", hora local, 24 h. */
export function horaLocal(ms: number): string {
  const d = new Date(ms);
  return `${dos(d.getHours())}:${dos(d.getMinutes())}`;
}

/** "m:ss" (minutos pueden pasar de 59: "65:10"). */
export function relojMinSeg(seg: number): string {
  const s = Math.max(0, Math.floor(seg));
  return `${Math.floor(s / 60)}:${dos(s % 60)}`;
}

export type PitidoVR = "fin-bloque" | "fin-descanso" | "fin-sesion";

/**
 * El pitido de un cambio de fase. `anterior` null = primera observación (al montar
 * o al reabrir): nunca suena, así no se disparan los cambios que ya pasaron.
 * Misma fase y mismo bloque: null.
 */
export function pitidoDeTransicion(
  anterior: GuiaBloquesVR | null,
  actual: GuiaBloquesVR,
): PitidoVR | null {
  if (!anterior) return null;
  if (anterior.fase === actual.fase && anterior.bloque === actual.bloque) return null;
  if (actual.fase === "terminado") return "fin-sesion";
  if (actual.fase === "descanso") return "fin-bloque";
  // fase bloque
  return anterior.fase === "descanso" ? "fin-descanso" : "fin-bloque";
}

/** Los textos de la guía. `principal` null en modo corrido (1 bloque) y en terminado. */
export function lineasGuiaVR(g: GuiaBloquesVR): { principal: string | null; fin: string } {
  const fin = horaLocal(g.finPrevistoMs);
  if (g.fase === "terminado") {
    return { principal: null, fin: `Cumplido a las ${fin} · +${relojMinSeg(g.deMasSeg)}` };
  }
  const finFin = `Fin previsto ${fin}`;
  if (g.totalBloques <= 1 || g.finFaseMs === null) return { principal: null, fin: finFin };
  const hora = horaLocal(g.finFaseMs);
  const principal = g.fase === "bloque"
    ? `Bloque ${g.bloque} de ${g.totalBloques} · quedan ${relojMinSeg(g.quedaSeg)} (hasta las ${hora})`
    : `Descanso · quedan ${relojMinSeg(g.quedaSeg)} (bloque ${g.bloque} a las ${hora})`;
  return { principal, fin: finFin };
}
