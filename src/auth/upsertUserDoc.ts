import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "../firebase";
import type { MiembroId } from "../types/models";
import { ok, err, firebaseErrorMessage } from "../lib/result";
import type { Result } from "../lib/result";

/**
 * Crea o actualiza /users/{uid} en cada login exitoso.
 * fechaCreacion / fechaPrimerLogin solo se escriben en el primer login.
 */
export async function upsertUserDoc(
  user: User,
  memberId: MiembroId,
): Promise<Result<void>> {
  try {
    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);
    const isNew = !snap.exists();

    const data: Record<string, unknown> = {
      uid:      user.uid,
      email:    user.email ?? "",
      memberId,
      nombre:   user.displayName ?? user.email ?? "",
      ultimoLogin: serverTimestamp(),
    };

    if (isNew) {
      data.fechaCreacion     = serverTimestamp();
      data.fechaPrimerLogin  = serverTimestamp();
    }

    await setDoc(ref, data, { merge: true });
    return ok(undefined);
  } catch (e) {
    return err(firebaseErrorMessage(e));
  }
}
