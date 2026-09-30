// ════════════════════════════════════════════════════════════════════════════
//  lib/pedidoLocal.ts — el último pedido al puente, visto desde ESTE dispositivo
//  (P91).
//
//  El hilo de P91: **el reloj del cliente no es un dato**. Solo se puede restar
//  contra sí mismo. Por eso la marca vive en `localStorage` de este navegador:
//  el reloj que la escribió es el mismo que la compara.
//
//  Sirve para dos cosas:
//  - no pedir dos veces en el mismo minuto (la función descartaría el segundo
//    como `muy-seguido`, y la app se quedaría 45 s esperando un push que nunca
//    salió);
//  - saber si ESTE dispositivo ya dejó de esperar un pedido, para mostrar
//    "respondió · llegó después de la espera".
//
//  Límite conocido, documentado a propósito (P91 Parte 4): **desde otro
//  dispositivo** dentro del mismo minuto la guarda no aplica, y la función
//  descarta el pedido igual. Cuesta 45 s de espera, no un dato perdido.
//  Arreglarlo pediría leer `ultimoPushMs`, que es el reloj de la función: el
//  error que P91 vino a sacar.
//
//  Puro: el almacenamiento se inyecta.
// ════════════════════════════════════════════════════════════════════════════
import { MIN_ENTRE_PUSH_MS } from "../../functions/src/pedido";
import type { Almacen } from "./sincronizacionAutomatica";

/** El mismo valor que la función, importado de ahí para que no se desincronicen. */
export const MIN_ENTRE_PEDIDOS_MS = MIN_ENTRE_PUSH_MS;

export interface MarcaPedido {
  /** `pedidoMs` que escribió este dispositivo (su propio reloj). */
  ms: number;
  /** La `ultimaCorridaMs` que se vio antes de pedir. */
  corridaPreviaMs?: number;
  /** Este dispositivo esperó y el puente no contestó a tiempo. */
  esperaVencida?: boolean;
}

export const clavePedido = (uid: string) => `pedido-${uid}`;

/** Nunca tira: un almacén roto o bloqueado se lee como "sin marca". */
export function leerMarcaPedido(almacen: Almacen | null | undefined, uid: string): MarcaPedido | null {
  try {
    const crudo = almacen?.getItem(clavePedido(uid));
    if (!crudo) return null;
    const m = JSON.parse(crudo) as MarcaPedido;
    return m && typeof m.ms === "number" ? m : null;
  } catch {
    return null;
  }
}

export function guardarMarcaPedido(almacen: Almacen | null | undefined, uid: string, marca: MarcaPedido): void {
  try {
    almacen?.setItem(clavePedido(uid), JSON.stringify(marca));
  } catch {
    /* sin marca: a lo sumo se pide de más, y la función lo descarta */
  }
}

/**
 * ¿Este dispositivo ya pidió hace menos de un minuto? Devuelve hace cuánto, o
 * `null`. Una marca **en el futuro** se ignora: eso es un reloj movido, no un
 * pedido reciente, y se pide.
 */
export function pedidoReciente(marca: MarcaPedido | null, ahora: number): { haceMs: number } | null {
  if (!marca || marca.ms > ahora) return null;
  const haceMs = ahora - marca.ms;
  return haceMs < MIN_ENTRE_PEDIDOS_MS ? { haceMs } : null;
}

/** Anota que este dispositivo dejó de esperar ese pedido sin respuesta. */
export function marcarEsperaVencida(almacen: Almacen | null | undefined, uid: string, pedidoMs: number): void {
  const m = leerMarcaPedido(almacen, uid);
  if (m && m.ms === pedidoMs) guardarMarcaPedido(almacen, uid, { ...m, esperaVencida: true });
}
