import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import type { MiembroId, FamiliaConfig } from "../types/models";
import { ok, err, firebaseErrorMessage } from "../lib/result";
import type { Result } from "../lib/result";
import { findMemberByEmail } from "./findMemberByEmail";

export { findMemberByEmail };

/**
 * Cruza el email del usuario autenticado contra /config/familia.
 * Devuelve null si el email no está en la whitelist.
 */
export async function resolveMemberId(
  email: string,
): Promise<Result<MiembroId | null>> {
  try {
    const snap = await getDoc(doc(db, "config", "familia"));
    if (!snap.exists()) return ok(null);
    const config = snap.data() as FamiliaConfig;
    return ok(findMemberByEmail(config.miembros, email));
  } catch (e) {
    return err(firebaseErrorMessage(e));
  }
}
