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
/**
 * Como mucho un push por minuto por uid. **Fuente única**: la app la importa
 * de acá (`src/lib/pedidoLocal.ts`) para no pedir dos veces en el mismo minuto
 * (P91), así los dos lados no se desincronizan.
 */
export const MIN_ENTRE_PUSH_MS = 60_000;
/** Pasado esto entre `pedidoMs` y la hora de escritura, se anota el desfase (P91). */
export const DESFASE_AVISO_MS = 60_000;

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
  | "pedido-viejo"     // escrito hace más de 5 minutos (reloj de Firestore, P91)
  | "sin-token"        // el puente todavía no registró su token (P90)
  | "muy-seguido";     // ya hubo un push hace menos de un minuto

export type Decision =
  | { accion: "mandar"; token: string }
  | { accion: "ignorar"; motivo: MotivoIgnorar };

/**
 * ¿Se manda el push? Pura. `dispositivo` es lo que hay en estado/dispositivo
 * (o `null` si no existe).
 *
 * P91: **el reloj del cliente no decide.** La edad del pedido se mide con
 * `escrituraMs` —cuándo Firestore escribió el documento— contra `ahora`, los
 * dos del lado del servidor. Antes se usaba `pedidoMs`, que lo escribe el
 * navegador: con un reloj atrasado seis minutos, ningún pedido salía nunca. Y
 * un `pedidoMs` inválido ya no mata un pedido bien escrito y a tiempo.
 */
export function decidir(
  pedido: Pedido | null, dispositivo: Dispositivo | null, ahora: number, escrituraMs: number,
): Decision {
  if (!pedido) return { accion: "ignorar", motivo: "borrado" };
  if (ahora - escrituraMs > MAX_EDAD_PEDIDO_MS) return { accion: "ignorar", motivo: "pedido-viejo" };
  const token = dispositivo?.fcmToken;
  if (typeof token !== "string" || token.length === 0) return { accion: "ignorar", motivo: "sin-token" };
  const ultimo = dispositivo?.ultimoPushMs;
  if (typeof ultimo === "number" && ahora - ultimo < MIN_ENTRE_PUSH_MS) {
    return { accion: "ignorar", motivo: "muy-seguido" };
  }
  return { accion: "mandar", token };
}

/**
 * El payload del push: solo datos, nada visible. Los valores de FCM son
 * strings. `pedidoMs` viaja para el eco del puente; si no es un número, "0".
 */
export function payloadPush(pedido: Pedido): Record<string, string> {
  return {
    tipo: "pedido-corrida",
    pedidoMs: esNumero(pedido.pedidoMs) ? String(pedido.pedidoMs) : "0",
    origen: typeof pedido.origen === "string" ? pedido.origen : "desconocido",
  };
}

const esNumero = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

/**
 * El desfase entre el reloj del cliente y el de Firestore, si pasa de un
 * minuto. Es el único lugar del sistema donde se puede ver (P91). `null` si
 * está bien o si `pedidoMs` no es un número.
 */
export function desfaseCliente(pedido: Pedido, escrituraMs: number): number | null {
  if (!esNumero(pedido.pedidoMs)) return null;
  const d = pedido.pedidoMs - escrituraMs;
  return Math.abs(d) > DESFASE_AVISO_MS ? d : null;
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
  reservarTurno: (uid: string, pedido: Pedido, ahora: number, escrituraMs: number) => Promise<Decision>;
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

/**
 * Procesa un pedido. Nunca tira: una función que tira se reintenta.
 *
 * `escrituraMs` es la hora de Firestore (`event.time`). Si no viniera, el
 * pedido se acaba de escribir y se trata como nuevo (`ahora`). **Nunca se usa
 * `pedidoMs` como respaldo**: es el reloj del cliente (P91).
 */
export async function procesarPedido(
  uid: string, pedido: Pedido | null, deps: DepsPedido, escrituraMs?: number,
): Promise<ResultadoPedido> {
  const ahora = deps.ahora();
  const escrito = escrituraMs != null && Number.isFinite(escrituraMs) ? escrituraMs : ahora;

  if (pedido) {
    const desfase = desfaseCliente(pedido, escrito);
    if (desfase != null) {
      deps.log("warn", "reloj del cliente corrido respecto de Firestore",
        { uid, pedidoMs: pedido.pedidoMs, escrituraMs: escrito, desfaseMs: desfase });
    }
  }

  // Sin documento no hay nada que reservar: ni se toca Firestore.
  const decision = pedido === null
    ? decidir(null, null, ahora, escrito)
    : await deps.reservarTurno(uid, pedido, ahora, escrito);

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
