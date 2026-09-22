// data/diccionarios.ts — Lee y escribe /config/diccionarios (P81).
//
// Por ahora solo el campo `juegosSinEjercicio`: los juegos de VR que se
// registran pero no cuentan como ejercicio. El resto del documento lo siembra
// `scripts/seed-config.ts` y nadie lo edita desde la app.
//
// El documento puede NO existir: la app nunca depende de que alguien lo siembre,
// y ahí valen los defaults de `lib/juegos.ts`. Solo se devuelve error por fallo
// de red.
//
// La escritura es owner-only **por las reglas de Firestore**, que ya estaban
// así y no se tocaron. La UI esconde la edición para el resto, pero la garantía
// está del lado del servidor, no del botón.
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { ok, err, firebaseErrorMessage } from "../lib/result";
import type { Result } from "../lib/result";
import { normalizarJuegos } from "../lib/juegos";

let _cache: string[] | null = null;

/** Tira la caché en memoria: la próxima lectura vuelve a Firestore. */
export function invalidarCacheJuegos(): void {
  _cache = null;
}

/** Los juegos que no cuentan como ejercicio. Sin documento, los defaults. */
export async function getJuegosSinEjercicio(): Promise<Result<string[]>> {
  if (_cache) return ok(_cache);
  try {
    const snap = await getDoc(doc(db, "config", "diccionarios"));
    const data = snap.exists() ? (snap.data() as Record<string, unknown>) : undefined;
    _cache = normalizarJuegos(data?.juegosSinEjercicio);
    return ok(_cache);
  } catch (e) {
    return err(firebaseErrorMessage(e));
  }
}

/**
 * Guarda la lista completa, con `merge` para no pisar el resto del diccionario.
 *
 * Falla con permiso denegado si quien escribe no es el owner: es lo esperado, y
 * el mensaje de Firestore ya lo dice.
 */
export async function setJuegosSinEjercicio(lista: string[]): Promise<Result<string[]>> {
  const limpia = normalizarJuegos(lista);
  try {
    await setDoc(
      doc(db, "config", "diccionarios"),
      { juegosSinEjercicio: limpia },
      { merge: true },
    );
    _cache = limpia;
    return ok(limpia);
  } catch (e) {
    return err(firebaseErrorMessage(e));
  }
}
