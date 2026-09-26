// ════════════════════════════════════════════════════════════════════════════
//  data/pedidoPuente.ts — pedirle una corrida al puente y esperarla (P89).
//
//  ShapeUp escribe /ingesta-sdk/{uid}/estado/pedido → la Cloud Function
//  (functions/) le manda un push silencioso al puente de ese uid → el puente
//  corre y actualiza estado/puente.ultimaCorridaMs. Acá se escribe el pedido y
//  se escucha esa respuesta.
//
//  Una página web no puede despertar una app Android: por eso el mensajero es
//  la función. Sin el puente de P90 instalado, el pedido se escribe igual y la
//  función anota "sin-token".
// ════════════════════════════════════════════════════════════════════════════
import { doc, getDoc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { ok, err, firebaseErrorMessage } from "../lib/result";
import type { Result } from "../lib/result";
import { conTimeout } from "../lib/conTimeout";
import type { EstadoPuente } from "./ingestaSdk";

export type OrigenPedido = "boton" | "fin-sesion" | "automatica";

/** Cuánto se espera a que el puente conteste antes de importar lo que haya. */
export const ESPERA_PUENTE_MS = 45_000;
/** Si la escritura del pedido no confirma en esto, se sigue sin esperar al puente. */
export const TIMEOUT_ESCRITURA_PEDIDO_MS = 8_000;

export interface PedidoPuente {
  pedidoMs: number;
  origen: OrigenPedido;
}

export interface DispositivoPuente {
  fcmToken?: string;
  actualizadoMs?: number;
  modelo?: string;
  versionPuente?: string;
  ultimoPushMs?: number;
}

const ref = (uid: string, id: "pedido" | "puente" | "dispositivo") =>
  doc(db, "ingesta-sdk", uid, "estado", id);

/**
 * Escribe el pedido. Devuelve el `pedidoMs` escrito. Si el servidor no confirma
 * en 8 s (sin señal) devuelve error: el pedido queda en la cola local y sale
 * cuando haya red, pero para entonces ya no vale la pena esperar al puente.
 */
export async function pedirSincronizacion(uid: string, origen: OrigenPedido, ahora = Date.now()): Promise<Result<number>> {
  const pedido: PedidoPuente = { pedidoMs: ahora, origen };
  try {
    const r = await conTimeout(setDoc(ref(uid, "pedido"), pedido), TIMEOUT_ESCRITURA_PEDIDO_MS);
    if (r.tipo === "timeout") return err("El pedido no llegó al servidor (¿sin señal?).");
    return ok(ahora);
  } catch (e) {
    return err(firebaseErrorMessage(e));
  }
}

export type RespuestaPuente =
  | { contesto: true; estado: EstadoPuente }
  | { contesto: false; motivo: "timeout" | "error" };

/**
 * Espera a que el puente corra DESPUÉS de `desdeMs` (su `ultimaCorridaMs`
 * avanza). Resuelve al contestar, al vencer o ante un error del listener, y
 * **en los tres casos corta el listener**: uno que queda vivo sigue leyendo y
 * no se nota hasta la factura.
 */
export function esperarCorridaDelPuente(uid: string, desdeMs: number, timeoutMs = ESPERA_PUENTE_MS): Promise<RespuestaPuente> {
  return new Promise((resolve) => {
    let terminado = false;
    let cortar: (() => void) | null = null;
    const terminar = (r: RespuestaPuente) => {
      if (terminado) return;
      terminado = true;
      clearTimeout(timer);
      cortar?.();
      resolve(r);
    };
    const timer = setTimeout(() => terminar({ contesto: false, motivo: "timeout" }), timeoutMs);
    cortar = onSnapshot(
      ref(uid, "puente"),
      (snap) => {
        const estado = snap.exists() ? (snap.data() as EstadoPuente) : null;
        if (estado?.ultimaCorridaMs != null && estado.ultimaCorridaMs > desdeMs) {
          terminar({ contesto: true, estado });
        }
      },
      () => terminar({ contesto: false, motivo: "error" }),
    );
    // Si el snapshot inicial ya resolvió (sincrónico en algunos mocks), cortar ya.
    if (terminado) cortar();
  });
}

/** El último pedido, para la tarjeta del puente. `null` si nunca se pidió. */
export async function leerPedido(uid: string): Promise<Result<PedidoPuente | null>> {
  try {
    const snap = await getDoc(ref(uid, "pedido"));
    return ok(snap.exists() ? (snap.data() as PedidoPuente) : null);
  } catch (e) {
    return err(firebaseErrorMessage(e));
  }
}

/** El registro del puente (su token FCM). `null` si el puente nunca se registró. */
export async function leerDispositivo(uid: string): Promise<Result<DispositivoPuente | null>> {
  try {
    const snap = await getDoc(ref(uid, "dispositivo"));
    return ok(snap.exists() ? (snap.data() as DispositivoPuente) : null);
  } catch (e) {
    return err(firebaseErrorMessage(e));
  }
}
