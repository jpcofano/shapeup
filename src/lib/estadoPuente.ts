// ════════════════════════════════════════════════════════════════════════════
//  lib/estadoPuente.ts — que la app explique en qué está la biometría (P88).
//
//  Hay dos momentos distintos y la tarjeta del puente los mezclaba:
//    1. el reloj (vía puente) SUBE a /ingesta-sdk — `ultimaCorridaMs`;
//    2. la app IMPORTA eso a ShapeUp — a mano (el botón) o sola (P85).
//  Juan sincronizó a mano, entraron 91 actividades, miró la tarjeta, vio la
//  hora de la subida de dos horas antes y creyó que no había quedado nada.
//
//  Y un caso que es calculable y se callaba: si la última sesión terminó
//  DESPUÉS de la última subida del puente, su biometría no puede estar todavía.
//
//  Puro (ADR #009): sin React ni Firebase.
// ════════════════════════════════════════════════════════════════════════════
import type { Historial } from "../types/models";
import { seEnriquece } from "./tipoHistorial";

export interface UltimaImportacion {
  ms: number;
  tipo: "manual" | "automatica";
  /** Actividades guardadas en esa importación (lo escrito, no lo clasificado). */
  actividades: number;
}

/** Cuándo terminó una sesión: la ventana sellada, o inicio + duración. `null` si no se sabe. */
export function finDeSesion(h: Pick<Historial, "finMs" | "inicioMs" | "duracionRealMin">): number | null {
  if (typeof h.finMs === "number") return h.finMs;
  if (typeof h.inicioMs === "number" && typeof h.duracionRealMin === "number") {
    return h.inicioMs + h.duracionRealMin * 60_000;
  }
  return null;
}

/** "DD/MM" en hora local. */
function ddmm(fechaYmd: string): string {
  const [, m, d] = fechaYmd.split("-");
  return `${d}/${m}`;
}

export function textoSesionSinLlegar(fechaYmd: string, hoyYmd: string): string {
  const cual = fechaYmd === hoyYmd ? "de hoy" : `del ${ddmm(fechaYmd)}`;
  return `Tu sesión ${cual} todavía no llegó del reloj — el puente sube cada 6 horas.`;
}

/**
 * La sesión más reciente hecha en la app (rutina, libre o juego: las que se
 * enriquecen), si terminó después de la última subida del puente. Esa no puede
 * tener biometría todavía. `null` si no hay ninguna así, o si el puente nunca
 * corrió (ahí no hay "todavía": no hay puente).
 */
export function sesionSinLlegar(
  historial: Historial[],
  ultimaCorridaMs: number | null | undefined,
): Historial | null {
  if (ultimaCorridaMs == null) return null;
  let ultima: { h: Historial; fin: number } | null = null;
  for (const h of historial) {
    if (!seEnriquece(h)) continue;
    const fin = finDeSesion(h);
    if (fin == null) continue;
    if (!ultima || fin > ultima.fin) ultima = { h, fin };
  }
  if (!ultima || ultima.h.biometria) return null;
  return ultima.fin > ultimaCorridaMs ? ultima.h : null;
}

/**
 * Para el detalle de UNA sesión sin biometría: ¿es porque todavía no llegó?
 * Devuelve el texto a mostrar, o `null` si la explicación es otra (el puente
 * ya pasó y no la trajo, o no se sabe cuándo terminó).
 */
export function explicarSinBiometria(
  h: Pick<Historial, "finMs" | "inicioMs" | "duracionRealMin" | "fechaRealizada" | "biometria">,
  ultimaCorridaMs: number | null | undefined,
  hoyYmd: string,
): string | null {
  if (h.biometria || ultimaCorridaMs == null) return null;
  const fin = finDeSesion(h);
  if (fin == null || fin <= ultimaCorridaMs) return null;
  return textoSesionSinLlegar(h.fechaRealizada, hoyYmd);
}

/** "25/09 14:10 · a mano · 91 actividades guardadas" (sin la hora: la pone quien muestra). */
export function textoImportacion(u: UltimaImportacion): string {
  const como = u.tipo === "manual" ? "a mano" : "automática";
  const cuantas = u.actividades === 1 ? "1 actividad guardada" : `${u.actividades} actividades guardadas`;
  return `${como} · ${cuantas}`;
}

// ── El último pedido al puente (P89) ─────────────────────────────────────────

/** Pasado esto sin corrida, el pedido se da por no respondido. */
export const SIN_RESPUESTA_MS = 10 * 60_000;

export interface PedidoVisto {
  pedidoMs: number;
  origen: string;
}

export interface EstadoDelPedido {
  /** "desde el botón", "al terminar una sesión", "automático". */
  como: string;
  estado: "respondio" | "esperando" | "sin-respuesta";
}

const COMO: Record<string, string> = {
  boton: "desde el botón",
  "fin-sesion": "al terminar una sesión",
  automatica: "automático",
};

/**
 * ¿El reloj respondió al último pedido? Respondió si el puente corrió después
 * de que se pidió. Si pasaron más de 10 minutos sin corrida, "sin-respuesta":
 * ahí la tarjeta nombra la causa más común (app del puente detenida o con
 * ahorro de batería), que no hay forma de detectar desde acá.
 */
export function estadoDelPedido(
  pedido: PedidoVisto | null,
  ultimaCorridaMs: number | null | undefined,
  ahora: number,
): EstadoDelPedido | null {
  if (!pedido) return null;
  const como = COMO[pedido.origen] ?? pedido.origen;
  if (ultimaCorridaMs != null && ultimaCorridaMs >= pedido.pedidoMs) return { como, estado: "respondio" };
  return { como, estado: ahora - pedido.pedidoMs > SIN_RESPUESTA_MS ? "sin-respuesta" : "esperando" };
}
