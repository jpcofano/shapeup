/** Resultado de una operación de datos. Nunca se lanzan excepciones entre capas. */
export type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

export function ok<T>(value: T): Result<T> {
  return { ok: true, value };
}

export function err<T = never>(error: string): Result<T> {
  return { ok: false, error };
}

/** Lo que ve el usuario cuando se agota la cuota diaria de Firestore (P76a). */
export const MSG_CUOTA_AGOTADA =
  "Se agotó la cuota diaria de Firestore. Probá de nuevo mañana.";

/**
 * `true` si el error es un `resource-exhausted` de Firestore.
 *
 * Se chequea por partida doble porque el código viaja distinto según de dónde
 * venga: el SDK cliente expone `code: "resource-exhausted"`, y algunos errores
 * de gRPC solo traen el texto `RESOURCE_EXHAUSTED` / `Quota exceeded` en el
 * mensaje.
 */
export function esCuotaAgotada(e: unknown): boolean {
  const code = (e as { code?: unknown } | null)?.code;
  if (typeof code === "string" && code.toLowerCase().includes("resource-exhausted")) return true;
  if (code === 8) return true;                       // gRPC RESOURCE_EXHAUSTED
  const msg = e instanceof Error ? e.message : String(e ?? "");
  return /RESOURCE_EXHAUSTED|Quota exceeded/i.test(msg);
}

/** Extrae el mensaje de un FirebaseError o Error genérico. */
export function firebaseErrorMessage(e: unknown): string {
  if (esCuotaAgotada(e)) return MSG_CUOTA_AGOTADA;
  if (e instanceof Error) return e.message;
  return String(e);
}
