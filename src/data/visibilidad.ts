// ════════════════════════════════════════════════════════════════════════════
//  data/visibilidad.ts — Lee /config/visibilidad.
//  El owner ve todo; los demás miembros solo ven lo asignado.
// ════════════════════════════════════════════════════════════════════════════
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import type { MiembroId, VisibilidadConfig, VisibilidadMiembro } from "../types/models";
import { ok, err, firebaseErrorMessage } from "../lib/result";
import type { Result } from "../lib/result";

const OWNER: MiembroId = "juanpablo";

/**
 * Devuelve la visibilidad de un miembro.
 * - Owner → null (ve todo).
 * - Otros → { programas: [], rutinas: [] } con los IDs asignados.
 */
export async function getVisibilidad(
  miembro: MiembroId,
): Promise<Result<VisibilidadMiembro | null>> {
  if (miembro === OWNER) return ok(null);
  try {
    const snap = await getDoc(doc(db, "config", "visibilidad"));
    if (!snap.exists()) return ok({ programas: [], rutinas: [] });
    const config = snap.data() as VisibilidadConfig;
    return ok(config[miembro] ?? { programas: [], rutinas: [] });
  } catch (e) {
    return err(firebaseErrorMessage(e));
  }
}

/** true si el miembro puede ver esta rutina. */
export function rutinaVisible(
  rutinaId: string,
  visibilidad: VisibilidadMiembro | null,
): boolean {
  if (visibilidad === null) return true; // owner
  return visibilidad.rutinas.includes(rutinaId);
}

/** true si el miembro puede ver este programa. */
export function programaVisible(
  programaId: string,
  visibilidad: VisibilidadMiembro | null,
): boolean {
  if (visibilidad === null) return true;
  return visibilidad.programas.includes(programaId);
}
