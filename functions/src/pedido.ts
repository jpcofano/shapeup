// ════════════════════════════════════════════════════════════════════════════
//  functions/src/pedido.ts — la lógica de "pedirle una corrida al puente" (P89).
//
//  Pura: no importa nada de Firebase. `index.ts` la cablea con Firestore y FCM;
//  así se prueba sin emulador de funciones (FCM no se emula) y sin instalar las
//  dependencias de functions/.
//
//  Flujo: ShapeUp escribe /ingesta-sdk/{uid}/estado/pedido → la función lee
//  estado/dispositivo del MISMO uid → manda un push de datos silencioso al
//  token del puente → el puente (P90) hace una corrida en el momento.
// ════════════════════════════════════════════════════════════════════════════

/** Un pedido con más de esto ya no importa: un reintento no despierta al teléfono por nada. */
export const MAX_EDAD_PEDIDO_MS = 5 * 60_000;
/** Como mucho un push por minuto por uid. */
export const MIN_ENTRE_PUSH_MS = 60_000;

export interface Pedido {
  pedidoMs?: unknown;
  origen?: unknown;
}

export interface Dispositivo {
  fcmToken?: unknown;
  ultimoPushMs?: unknown;
}

export type MotivoIgnorar =
  | "borrado"          // el documento del pedido se borró
  | "pedido-invalido"  // sin pedidoMs numérico
  | "pedido-viejo"     // más de 5 minutos
  | "sin-token"        // el puente todavía no registró su token (P90)
  | "muy-seguido";     // ya hubo un push hace menos de un minuto

export type Decision =
  | { accion: "mandar"; token: string }
  | { accion: "ignorar"; motivo: MotivoIgnorar };

/**
 * ¿Se manda el push? Pura. `dispositivo` es lo que hay en estado/dispositivo
 * (o `null` si no existe).
 */
export function decidir(pedido: Pedido | null, dispositivo: Dispositivo | null, ahora: number): Decision {
  if (!pedido) return { accion: "ignorar", motivo: "borrado" };
  if (typeof pedido.pedidoMs !== "number" || !Number.isFinite(pedido.pedidoMs)) {
    return { accion: "ignorar", motivo: "pedido-invalido" };
  }
  if (ahora - pedido.pedidoMs > MAX_EDAD_PEDIDO_MS) return { accion: "ignorar", motivo: "pedido-viejo" };
  const token = dispositivo?.fcmToken;
  if (typeof token !== "string" || token.length === 0) return { accion: "ignorar", motivo: "sin-token" };
  const ultimo = dispositivo?.ultimoPushMs;
  if (typeof ultimo === "number" && ahora - ultimo < MIN_ENTRE_PUSH_MS) {
    return { accion: "ignorar", motivo: "muy-seguido" };
  }
  return { accion: "mandar", token };
}

/** El payload del push: solo datos, nada visible. Los valores de FCM son strings. */
export function payloadPush(pedido: Pedido): Record<string, string> {
  return {
    tipo: "pedido-corrida",
    pedidoMs: String(pedido.pedidoMs),
    origen: typeof pedido.origen === "string" ? pedido.origen : "desconocido",
  };
}

/** Errores de FCM que quieren decir "este token está muerto, no lo reintentes". */
export function esTokenMuerto(error: unknown): boolean {
  const code = (error as { code?: unknown } | null)?.code;
  return code === "messaging/registration-token-not-registered"
    || code === "messaging/invalid-registration-token";
}

export interface DepsPedido {
  /**
   * Lee estado/dispositivo, decide con `decidir` y, si hay que mandar, escribe
   * `ultimoPushMs = ahora` — todo en UNA transacción. Reservar el turno antes
   * de enviar es lo que hace que dos pedidos simultáneos manden un solo push.
   */
  reservarTurno: (uid: string, pedido: Pedido, ahora: number) => Promise<Decision>;
  enviar: (token: string, datos: Record<string, string>) => Promise<void>;
  /** Borra `fcmToken` de estado/dispositivo. */
  borrarToken: (uid: string) => Promise<void>;
  ahora: () => number;
  log: (nivel: "info" | "warn" | "error", mensaje: string, datos?: Record<string, unknown>) => void;
}

export type ResultadoPedido =
  | { resultado: "enviado" }
  | { resultado: "ignorado"; motivo: MotivoIgnorar }
  | { resultado: "token-muerto" }
  | { resultado: "error"; mensaje: string };

/** Procesa un pedido. Nunca tira: una función que tira se reintenta. */
export async function procesarPedido(uid: string, pedido: Pedido | null, deps: DepsPedido): Promise<ResultadoPedido> {
  const ahora = deps.ahora();
  // Sin documento no hay nada que reservar: ni se toca Firestore.
  const decision = pedido === null
    ? decidir(null, null, ahora)
    : await deps.reservarTurno(uid, pedido, ahora);

  if (decision.accion === "ignorar") {
    deps.log(decision.motivo === "sin-token" ? "warn" : "info",
      `pedido ignorado: ${decision.motivo}`, { uid, motivo: decision.motivo });
    return { resultado: "ignorado", motivo: decision.motivo };
  }

  try {
    await deps.enviar(decision.token, payloadPush(pedido!));
    deps.log("info", "push enviado", { uid, origen: pedido!.origen });
    return { resultado: "enviado" };
  } catch (e) {
    if (esTokenMuerto(e)) {
      await deps.borrarToken(uid);
      deps.log("warn", "token muerto: se borró fcmToken; el puente lo reescribe al abrir", { uid });
      return { resultado: "token-muerto" };
    }
    const mensaje = e instanceof Error ? e.message : String(e);
    deps.log("error", "no se pudo enviar el push", { uid, mensaje });
    return { resultado: "error", mensaje };
  }
}
