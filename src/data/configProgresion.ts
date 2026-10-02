// data/configProgresion.ts — Lee y escribe /config/progresion (P98, ADR #046).
//
// Los números de la regla de progresión de las rutinas de VR: el umbral de FC
// (⚠ provisorio), las sesiones y semanas mínimas y la fracción del tiempo. El
// documento puede NO existir: entonces valen los defaults de lib/escalonesVR.
// Se edita desde Perfil → Configuración, en la tarjeta del owner (P86).
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { ok, err, firebaseErrorMessage } from "../lib/result";
import type { Result } from "../lib/result";
import type { ConfigProgresion } from "../types/models";
import { normalizarConfigProgresion } from "../lib/escalonesVR";

let _cache: ConfigProgresion | null = null;

/** Los números de la regla. Cachea en memoria; sin documento, los defaults. */
export async function getConfigProgresion(): Promise<Result<ConfigProgresion>> {
  if (_cache) return ok(_cache);
  try {
    const snap = await getDoc(doc(db, "config", "progresion"));
    _cache = normalizarConfigProgresion(snap.exists() ? (snap.data() as Record<string, unknown>) : undefined);
    return ok(_cache);
  } catch (e) {
    return err(firebaseErrorMessage(e));
  }
}

/** Guarda los números, ya normalizados; la caché queda con lo escrito. */
export async function setConfigProgresion(cfg: ConfigProgresion): Promise<Result<ConfigProgresion>> {
  const limpio = normalizarConfigProgresion(cfg as unknown as Record<string, unknown>);
  try {
    await setDoc(doc(db, "config", "progresion"), limpio, { merge: true });
    _cache = limpio;
    return ok(limpio);
  } catch (e) {
    return err(firebaseErrorMessage(e));
  }
}
