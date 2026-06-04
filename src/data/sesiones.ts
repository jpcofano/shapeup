// ════════════════════════════════════════════════════════════════════════════
//  data/sesiones.ts — Máquina de estados de SesionProgramada.
//  Estados: Programada → En curso → Completada → Registrada
// ════════════════════════════════════════════════════════════════════════════
import {
  collection, doc, getDocs, getDoc, setDoc, updateDoc,
  query, where, orderBy, serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import type {
  SesionProgramada, EstadoSesion, MiembroId, ProgresoSesion, FirestoreTimestamp,
} from "../types/models";
import { ok, err, firebaseErrorMessage } from "../lib/result";
import type { Result } from "../lib/result";

function idSesion(): string {
  return `SES-${new Date().toISOString().replace(/[-:T.]/g, "").slice(0, 14)}`;
}

// ── Lecturas ──────────────────────────────────────────────────────────────────

export async function getSesionesMiembro(
  miembro: MiembroId,
  estados?: EstadoSesion[],
): Promise<Result<SesionProgramada[]>> {
  try {
    let q = query(
      collection(db, "sesiones"),
      where("miembro", "==", miembro),
      orderBy("semanaInicio", "desc"),
    );
    const snap = await getDocs(q);
    let sesiones = snap.docs.map((d) => d.data() as SesionProgramada);
    if (estados) sesiones = sesiones.filter((s) => estados.includes(s.estado));
    return ok(sesiones);
  } catch (e) {
    return err(firebaseErrorMessage(e));
  }
}

export async function getSesion(id: string): Promise<Result<SesionProgramada>> {
  try {
    const snap = await getDoc(doc(db, "sesiones", id));
    if (!snap.exists()) return err(`Sesión ${id} no encontrada`);
    return ok(snap.data() as SesionProgramada);
  } catch (e) {
    return err(firebaseErrorMessage(e));
  }
}

// ── Escrituras ────────────────────────────────────────────────────────────────

export interface SesionInput {
  miembro:         MiembroId;
  rutinaId:        string;
  nombreRutina:    string;
  tipoSeleccion:   "rutina" | "programa";
  programaId?:     string;
  diaProgramaOrden?: number;
  fecha?:          string;
  semanaInicio:    string;
  semanaFin:       string;
}

/** Crea una sesión en estado "Programada". */
export async function crearSesion(input: SesionInput): Promise<Result<SesionProgramada>> {
  try {
    const id = idSesion();
    const sesion: SesionProgramada = {
      idSesion:          id,
      miembro:           input.miembro,
      semanaInicio:      input.semanaInicio,
      semanaFin:         input.semanaFin,
      fecha:             input.fecha,
      tipoSeleccion:     input.tipoSeleccion,
      tipoSesion:        "Rutina",
      idSeleccion:       input.programaId ?? input.rutinaId,
      idRutina:          input.rutinaId,
      nombreRutina:      input.nombreRutina,
      diaProgramaOrden:  input.diaProgramaOrden,
      estado:            "Programada",
      origen:            input.programaId ? `programa:${input.programaId}` : null,
      fechaProgramacion: serverTimestamp() as unknown as FirestoreTimestamp,
      progreso:          null,
      rpeSesion:         null,
      notas:             "",
    };
    await setDoc(doc(db, "sesiones", id), sesion);
    return ok(sesion);
  } catch (e) {
    return err(firebaseErrorMessage(e));
  }
}

/** Marca la sesión como "En curso" y guarda progreso opcional. */
export async function iniciarSesion(
  id: string,
  progreso?: ProgresoSesion,
): Promise<Result<void>> {
  try {
    await updateDoc(doc(db, "sesiones", id), {
      estado:   "En curso" as EstadoSesion,
      progreso: progreso ?? null,
    });
    return ok(undefined);
  } catch (e) {
    return err(firebaseErrorMessage(e));
  }
}

/** Marca la sesión como "Registrada" (estado final, post-historial). */
export async function registrarSesion(
  id: string,
  rpe: number | null,
): Promise<Result<void>> {
  try {
    await updateDoc(doc(db, "sesiones", id), {
      estado:    "Registrada" as EstadoSesion,
      rpeSesion: rpe,
    });
    return ok(undefined);
  } catch (e) {
    return err(firebaseErrorMessage(e));
  }
}
