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

/** Extrae el mensaje de un FirebaseError o Error genérico. */
export function firebaseErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  return String(e);
}
