// ════════════════════════════════════════════════════════════════════════════
//  data/visibilidad.ts — Lee y escribe /config/visibilidad.
//  El owner ve todo; los demás miembros solo ven lo asignado.
// ════════════════════════════════════════════════════════════════════════════
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import type { MiembroId, VisibilidadConfig, VisibilidadMiembro } from "../types/models";
import { ok, err, firebaseErrorMessage } from "../lib/result";
import type { Result } from "../lib/result";

export const OWNER: MiembroId = "juanpablo";

/** ¿Este miembro es el owner de la familia? La misma fuente que las reglas. */
export function esOwner(miembro: MiembroId | null): boolean {
  return miembro === OWNER;
}

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

/** La visibilidad de todos (P86, para la pantalla del owner). Sin documento, vacía. */
export async function getVisibilidadConfig(): Promise<Result<VisibilidadConfig>> {
  try {
    const snap = await getDoc(doc(db, "config", "visibilidad"));
    return ok(snap.exists() ? (snap.data() as VisibilidadConfig) : {});
  } catch (e) {
    return err(firebaseErrorMessage(e));
  }
}

/**
 * Guarda la visibilidad de UN miembro, con `merge` para no tocar la de los
 * demás. Solo el owner puede: lo garantizan las reglas, no el botón.
 */
export async function setVisibilidadMiembro(
  miembro: MiembroId, vis: VisibilidadMiembro,
): Promise<Result<void>> {
  try {
    await setDoc(doc(db, "config", "visibilidad"),
      { [miembro]: { programas: [...vis.programas].sort(), rutinas: [...vis.rutinas].sort() } },
      { merge: true });
    return ok(undefined);
  } catch (e) {
    return err(firebaseErrorMessage(e));
  }
}
