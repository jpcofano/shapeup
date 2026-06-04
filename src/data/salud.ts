// ════════════════════════════════════════════════════════════════════════════
//  data/salud.ts — CRUD para /mediciones y /cardio.
//  Soporta carga manual y marcado de fuente (samsung-health-csv | manual).
// ════════════════════════════════════════════════════════════════════════════
import {
  collection, doc, getDocs, setDoc, deleteDoc,
  query, where, orderBy, serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import type { MedicionCorporal, SesionCardio, MiembroId, FuenteDato, FirestoreTimestamp } from "../types/models";
import { ok, err, firebaseErrorMessage } from "../lib/result";
import type { Result } from "../lib/result";

function idMedicion(): string { return `MED-${Date.now()}`; }
function idCardio():   string { return `CAR-${Date.now()}`; }

// ── MedicionCorporal ──────────────────────────────────────────────────────────

export type MedicionInput = Omit<MedicionCorporal, "idMedicion" | "fechaCreacion">;

export async function getMediciones(miembro: MiembroId): Promise<Result<MedicionCorporal[]>> {
  try {
    const snap = await getDocs(
      query(collection(db, "mediciones"), where("miembro", "==", miembro), orderBy("fecha", "asc")),
    );
    return ok(snap.docs.map((d) => d.data() as MedicionCorporal));
  } catch (e) {
    return err(firebaseErrorMessage(e));
  }
}

export async function guardarMedicion(data: MedicionInput): Promise<Result<MedicionCorporal>> {
  try {
    const id  = idMedicion();
    const med: MedicionCorporal = {
      ...data,
      idMedicion:    id,
      fechaCreacion: serverTimestamp() as unknown as FirestoreTimestamp,
    };
    await setDoc(doc(db, "mediciones", id), med);
    return ok(med);
  } catch (e) {
    return err(firebaseErrorMessage(e));
  }
}

export async function eliminarMedicion(id: string): Promise<Result<void>> {
  try {
    await deleteDoc(doc(db, "mediciones", id));
    return ok(undefined);
  } catch (e) {
    return err(firebaseErrorMessage(e));
  }
}

// ── SesionCardio ──────────────────────────────────────────────────────────────

export type CardioInput = Omit<SesionCardio, "idCardio" | "fechaCreacion">;

export async function getSesionesCardio(miembro: MiembroId): Promise<Result<SesionCardio[]>> {
  try {
    const snap = await getDocs(
      query(collection(db, "cardio"), where("miembro", "==", miembro), orderBy("fecha", "asc")),
    );
    return ok(snap.docs.map((d) => d.data() as SesionCardio));
  } catch (e) {
    return err(firebaseErrorMessage(e));
  }
}

export async function guardarCardio(data: CardioInput): Promise<Result<SesionCardio>> {
  try {
    const id  = idCardio();
    const ses: SesionCardio = {
      ...data,
      idCardio:      id,
      fechaCreacion: serverTimestamp() as unknown as FirestoreTimestamp,
    };
    await setDoc(doc(db, "cardio", id), ses);
    return ok(ses);
  } catch (e) {
    return err(firebaseErrorMessage(e));
  }
}

// ── Batch import ──────────────────────────────────────────────────────────────

/** Guarda múltiples mediciones de una vez (para import CSV). */
export async function importarMediciones(
  items: MedicionInput[],
): Promise<Result<number>> {
  try {
    await Promise.all(items.map((item) => guardarMedicion(item)));
    return ok(items.length);
  } catch (e) {
    return err(firebaseErrorMessage(e));
  }
}

/** Guarda múltiples sesiones de cardio de una vez. */
export async function importarCardio(
  items: CardioInput[],
): Promise<Result<number>> {
  try {
    await Promise.all(items.map((item) => guardarCardio(item)));
    return ok(items.length);
  } catch (e) {
    return err(firebaseErrorMessage(e));
  }
}
