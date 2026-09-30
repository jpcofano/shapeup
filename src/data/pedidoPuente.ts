// ════════════════════════════════════════════════════════════════════════════
//  data/pedidoPuente.ts — pedirle una corrida al puente y esperarla (P89, P91).
//
//  ShapeUp escribe /ingesta-sdk/{uid}/estado/pedido → la Cloud Function
//  (functions/) le manda un push silencioso al puente de ese uid → el puente
//  corre y actualiza estado/puente.ultimaCorridaMs. Acá se escribe el pedido y
//  se escucha esa respuesta.
//
//  P91 — **el reloj del cliente no decide.** "Respondió" es que el contador del
//  puente se movió respecto de `corridaPreviaMs` (el valor que se vio justo
//  antes de pedir): los dos los escribe el reloj del teléfono. Antes se
//  comparaba `ultimaCorridaMs > pedidoMs`, teléfono contra PC.
// ════════════════════════════════════════════════════════════════════════════
import { doc, getDoc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { ok, err, firebaseErrorMessage } from "../lib/result";
import type { Result } from "../lib/result";
import { conTimeout } from "../lib/conTimeout";
import type { Almacen } from "../lib/sincronizacionAutomatica";
import { leerMarcaPedido, guardarMarcaPedido, pedidoReciente } from "../lib/pedidoLocal";
import type { EstadoPuente } from "./ingestaSdk";

export type OrigenPedido = "boton" | "fin-sesion" | "automatica";

/** Cuánto se espera a que el puente conteste antes de importar lo que haya. */
export const ESPERA_PUENTE_MS = 45_000;
/** Después de un "no contestó", se sigue escuchando hasta esto (P91). */
export const ESPERA_TARDIA_MS = 3 * 60_000;
/** Si la escritura del pedido no confirma en esto, se sigue sin esperar al puente. */
export const TIMEOUT_ESCRITURA_PEDIDO_MS = 8_000;

export interface PedidoPuente {
  pedidoMs: number;
  origen: OrigenPedido;
  /** La `ultimaCorridaMs` que se vio antes de pedir; `0` si el puente nunca corrió (P91). */
  corridaPreviaMs?: number;
}

export interface DispositivoPuente {
  fcmToken?: string;
  actualizadoMs?: number;
  modelo?: string;
  versionPuente?: string;
  ultimoPushMs?: number;
}

/** Lo que devuelve un pedido: o se escribió, o este dispositivo ya había pedido hace poco. */
export type PedidoHecho =
  | { yaPedido: false; pedidoMs: number; corridaPreviaMs?: number }
  | { yaPedido: true; haceMs: number };

const ref = (uid: string, id: "pedido" | "puente" | "dispositivo") =>
  doc(db, "ingesta-sdk", uid, "estado", id);

function almacenLocal(): Almacen | null {
  try { return window.localStorage; } catch { return null; }
}

export interface OpcionesPedido {
  /** Si el llamador ya leyó estado/puente, se ahorra una lectura. */
  corridaPreviaMs?: number;
  ahora?: number;
  almacen?: Almacen | null;
}

/**
 * Escribe el pedido, salvo que **este dispositivo** haya pedido hace menos de
 * un minuto (P91): ahí no escribe y devuelve `yaPedido`, porque la función lo
 * descartaría como `muy-seguido` y la app se quedaría 45 s esperando un push
 * que no salió. La cuenta la lleva esta función, no cada llamador: así quedan
 * cubiertos el botón, el `fin-sesion` y la automática.
 *
 * Si el servidor no confirma en 8 s (sin señal) devuelve error: el pedido queda
 * en la cola local, pero para entonces ya no vale la pena esperar al puente.
 */
export async function pedirSincronizacion(
  uid: string, origen: OrigenPedido, opciones: OpcionesPedido = {},
): Promise<Result<PedidoHecho>> {
  const ahora = opciones.ahora ?? Date.now();
  const almacen = opciones.almacen !== undefined ? opciones.almacen : almacenLocal();

  const reciente = pedidoReciente(leerMarcaPedido(almacen, uid), ahora);
  if (reciente) return ok({ yaPedido: true, haceMs: reciente.haceMs });

  try {
    let corridaPreviaMs = opciones.corridaPreviaMs;
    if (corridaPreviaMs === undefined) {
      // Sin dato del llamador, se lee. Si la lectura falla, el pedido sale igual
      // sin el campo: la tarjeta dirá "no se sabe", que es la verdad.
      try {
        const snap = await getDoc(ref(uid, "puente"));
        corridaPreviaMs = (snap.exists() ? (snap.data() as EstadoPuente).ultimaCorridaMs : undefined) ?? 0;
      } catch { corridaPreviaMs = undefined; }
    }

    const pedido: PedidoPuente = {
      pedidoMs: ahora, origen,
      ...(corridaPreviaMs !== undefined ? { corridaPreviaMs } : {}),
    };
    const r = await conTimeout(setDoc(ref(uid, "pedido"), pedido), TIMEOUT_ESCRITURA_PEDIDO_MS);
    if (r.tipo === "timeout") return err("El pedido no llegó al servidor (¿sin señal?).");
    guardarMarcaPedido(almacen, uid, { ms: ahora, ...(corridaPreviaMs !== undefined ? { corridaPreviaMs } : {}) });
    return ok({ yaPedido: false, pedidoMs: ahora, ...(corridaPreviaMs !== undefined ? { corridaPreviaMs } : {}) });
  } catch (e) {
    return err(firebaseErrorMessage(e));
  }
}

export type RespuestaPuente =
  | { contesto: true; estado: EstadoPuente }
  | { contesto: false; motivo: "timeout" | "error" | "cancelado" };

/**
 * Espera a que el contador del puente se mueva respecto de `corridaPreviaMs`
 * (P91). Si no se sabe (`undefined`), la base es el primer valor que llega del
 * listener. Resuelve al contestar, al vencer, ante un error o al cancelarse
 * con `signal`, y **en todos los casos corta el listener**: uno que queda vivo
 * sigue leyendo y no se nota hasta la factura.
 */
export function esperarCorridaDelPuente(
  uid: string,
  corridaPreviaMs: number | undefined,
  timeoutMs = ESPERA_PUENTE_MS,
  signal?: AbortSignal,
): Promise<RespuestaPuente> {
  return new Promise((resolve) => {
    let terminado = false;
    let cortar: (() => void) | null = null;
    let base = corridaPreviaMs;
    const terminar = (r: RespuestaPuente) => {
      if (terminado) return;
      terminado = true;
      clearTimeout(timer);
      signal?.removeEventListener("abort", alCancelar);
      cortar?.();
      resolve(r);
    };
    const alCancelar = () => terminar({ contesto: false, motivo: "cancelado" });
    if (signal?.aborted) { resolve({ contesto: false, motivo: "cancelado" }); return; }
    signal?.addEventListener("abort", alCancelar);

    const timer = setTimeout(() => terminar({ contesto: false, motivo: "timeout" }), timeoutMs);
    cortar = onSnapshot(
      ref(uid, "puente"),
      (snap) => {
        const estado = snap.exists() ? (snap.data() as EstadoPuente) : null;
        const actual = estado?.ultimaCorridaMs ?? 0;
        if (base === undefined) { base = actual; return; }
        if (actual > base) terminar({ contesto: true, estado: estado! });
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
