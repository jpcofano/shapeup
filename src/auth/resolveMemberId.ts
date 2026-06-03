import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import type { MiembroId, FamiliaConfig } from "../types/models";
import { ok, err, firebaseErrorMessage } from "../lib/result";
import type { Result } from "../lib/result";

/**
 * Lógica pura: busca el memberId del email en el mapa de miembros.
 * Se exporta para testear sin Firestore.
 */
export function findMemberByEmail(
  miembros: FamiliaConfig["miembros"],
  email: string,
): MiembroId | null {
  const normalized = email.toLowerCase();
  for (const [id, m] of Object.entries(miembros)) {
    if (m.mails.some((mail) => mail.toLowerCase() === normalized)) {
      return id as MiembroId;
    }
  }
  return null;
}

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
