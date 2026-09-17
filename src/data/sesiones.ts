// ════════════════════════════════════════════════════════════════════════════
//  data/sesiones.ts — Máquina de estados de SesionProgramada.
//  Estados: Programada → En curso → Completada → Registrada
// ════════════════════════════════════════════════════════════════════════════
import {
  collection, doc, getDocs, getDocsFromServer, getDoc, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, serverTimestamp, writeBatch,
} from "firebase/firestore";
import { db } from "../firebase";
import type {
  SesionProgramada, EstadoSesion, MiembroId, ProgresoSesion, FirestoreTimestamp,
} from "../types/models";
import { ok, err, firebaseErrorMessage } from "../lib/result";
import type { Result } from "../lib/result";
import { esSesionHuerfana, generarIdSesion, idsSesionLocales } from "../lib/sesionesHuerfanas";

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

/**
 * Crea una sesión en estado "Programada".
 *
 * Cambio de firma (P69): ya no es async ni devuelve `Result`. Genera el id en
 * el cliente, devuelve la sesión enseguida y hace el `setDoc` sin esperarlo
 * (sin señal queda en la cola local de Firestore). Un error se loguea en
 * consola; si el documento nunca se crea, `finalizarSesion` lo crea con merge.
 */
export function crearSesion(input: SesionInput): SesionProgramada {
  const id = generarIdSesion();
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
  setDoc(doc(db, "sesiones", id), sesion).catch((e: unknown) => {
    console.error(`crearSesion ${id}:`, firebaseErrorMessage(e));
  });
  return sesion;
}

/**
 * Marca la sesión como "En curso" y guarda progreso opcional.
 * Cambio de firma (P69): no se espera; un error se loguea en consola.
 */
export function iniciarSesion(id: string, progreso?: ProgresoSesion): void {
  updateDoc(doc(db, "sesiones", id), {
    estado:   "En curso" as EstadoSesion,
    progreso: progreso ?? null,
  }).catch((e: unknown) => {
    console.error(`iniciarSesion ${id}:`, firebaseErrorMessage(e));
  });
}

/**
 * Borra las SesionProgramada huérfanas del miembro (P69): en "Programada" o
 * "En curso", programadas hace más de 24 h y no abiertas en este teléfono
 * (ningún estado `entrenar:*` de localStorage las referencia). Llamar solo con
 * señal. Lee del servidor, no de la caché, para no borrar una sesión que ya
 * está Registrada. Si una seguía abierta en otro dispositivo, al guardarla el
 * merge de `finalizarSesion` la vuelve a crear. Devuelve cuántas borró.
 */
export async function barrerSesionesHuerfanas(miembro: MiembroId): Promise<Result<number>> {
  try {
    const snap = await getDocsFromServer(query(
      collection(db, "sesiones"),
      where("miembro", "==", miembro),
      where("estado", "in", ["Programada", "En curso"] satisfies EstadoSesion[]),
    ));
    const locales = idsSesionLocales(localStorage);
    const ahora = Date.now();
    const batch = writeBatch(db);
    let borradas = 0;
    snap.forEach((d) => {
      const fecha = (d.data() as Partial<SesionProgramada>).fechaProgramacion;
      const fechaMs = fecha && typeof fecha.seconds === "number" ? fecha.seconds * 1000 : null;
      if (esSesionHuerfana({ idSesion: d.id, fechaProgramacionMs: fechaMs }, locales, ahora)) {
        batch.delete(d.ref);
        borradas++;
      }
    });
    if (borradas > 0) await batch.commit();
    return ok(borradas);
  } catch (e) {
    return err(firebaseErrorMessage(e));
  }
}

/** Borra una sesión que se abandonó sin guardar (hoja de salida, P68). */
export async function descartarSesion(id: string): Promise<Result<void>> {
  try {
    await deleteDoc(doc(db, "sesiones", id));
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
