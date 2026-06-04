// data/perfiles.ts — Lee /config/perfiles (PerfilesConfig de models.ts).
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import type { PerfilesConfig } from "../types/models";
import { ok, err, firebaseErrorMessage } from "../lib/result";
import type { Result } from "../lib/result";

let _cache: PerfilesConfig | null = null;

/** Devuelve PerfilesConfig (equipo, objetivos, color, zonasFC por miembro). Cachea en memoria. */
export async function getPerfiles(): Promise<Result<PerfilesConfig>> {
  if (_cache) return ok(_cache);
  try {
    const snap = await getDoc(doc(db, "config", "perfiles"));
    _cache = snap.exists() ? (snap.data() as PerfilesConfig) : {};
    return ok(_cache);
  } catch (e) {
    return err(firebaseErrorMessage(e));
  }
}
