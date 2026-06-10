// ════════════════════════════════════════════════════════════════════════════
//  data/programas.ts — CRUD + caché para /programas (PRG-XXXX).
// ════════════════════════════════════════════════════════════════════════════
import {
  collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc,
  query, orderBy, serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import type { Programa, FirestoreTimestamp, MiembroId } from "../types/models";
import { ok, err, firebaseErrorMessage } from "../lib/result";
import type { Result } from "../lib/result";
import { normalizeText } from "../lib/canonical";
import { proximoId } from "./_helpers";

let _cache: Map<string, Programa> | null = null;
function invalidar() { _cache = null; }

export async function getProgramas(): Promise<Result<Programa[]>> {
  if (_cache) return ok([..._cache.values()]);
  try {
    const snap = await getDocs(query(collection(db, "programas"), orderBy("idPrograma")));
    _cache = new Map();
    snap.forEach((d) => _cache!.set(d.id, d.data() as Programa));
    return ok([..._cache.values()]);
  } catch (e) {
    return err(firebaseErrorMessage(e));
  }
}

export async function getPrograma(id: string): Promise<Result<Programa>> {
  if (_cache?.has(id)) return ok(_cache.get(id)!);
  try {
    const snap = await getDoc(doc(db, "programas", id));
    if (!snap.exists()) return err(`Programa ${id} no encontrado`);
    return ok(snap.data() as Programa);
  } catch (e) {
    return err(firebaseErrorMessage(e));
  }
}

/**
 * Devuelve el programa activo del miembro.
 * Lee `config/programaActivo` (mapa miembro→programaId); si no hay entrada
 * para el miembro, cae al primer programa con `estado: "Activo"` (retrocompat).
 */
export async function getProgramaActivo(
  miembroId?: MiembroId,
): Promise<Result<Programa | null>> {
  try {
    if (miembroId) {
      const snap = await getDoc(doc(db, "config", "programaActivo"));
      if (snap.exists()) {
        const mapa = snap.data() as Record<string, string>;
        const programaId = mapa[miembroId];
        if (programaId) {
          const r = await getPrograma(programaId);
          if (r.ok) return r;
          // Si el programa no existe, cae al fallback
        }
      }
    }
    // Fallback: primer programa con estado "Activo"
    const r = await getProgramas();
    if (!r.ok) return err(r.error);
    return ok(r.value.find((p) => p.estado === "Activo") ?? null);
  } catch (e) {
    return err(firebaseErrorMessage(e));
  }
}

/** Guarda el programa activo de un miembro en `config/programaActivo`. */
export async function setProgramaActivo(
  miembroId: MiembroId,
  programaId: string,
): Promise<Result<void>> {
  try {
    await setDoc(
      doc(db, "config", "programaActivo"),
      { [miembroId]: programaId },
      { merge: true },
    );
    return ok(undefined);
  } catch (e) {
    return err(firebaseErrorMessage(e));
  }
}

export type ProgramaInput = Omit<
  Programa,
  "idPrograma" | "nombreCanonico" | "vecesUsado" | "fechaCreacion" | "ultimaModificacion"
>;

export async function crearPrograma(data: ProgramaInput): Promise<Result<Programa>> {
  try {
    const id = await proximoId("programas", "PRG");
    const prog: Programa = {
      ...data,
      idPrograma:         id,
      nombreCanonico:     normalizeText(data.nombre),
      vecesUsado:         0,
      fechaCreacion:      serverTimestamp() as unknown as FirestoreTimestamp,
      ultimaModificacion: serverTimestamp() as unknown as FirestoreTimestamp,
    };
    await setDoc(doc(db, "programas", id), prog);
    invalidar();
    return ok(prog);
  } catch (e) {
    return err(firebaseErrorMessage(e));
  }
}

export async function actualizarPrograma(
  id: string,
  data: Partial<ProgramaInput>,
): Promise<Result<void>> {
  try {
    await updateDoc(doc(db, "programas", id), {
      ...data,
      ...(data.nombre ? { nombreCanonico: normalizeText(data.nombre) } : {}),
      ultimaModificacion: serverTimestamp(),
    });
    invalidar();
    return ok(undefined);
  } catch (e) {
    return err(firebaseErrorMessage(e));
  }
}

export async function eliminarPrograma(id: string): Promise<Result<void>> {
  try {
    await deleteDoc(doc(db, "programas", id));
    invalidar();
    return ok(undefined);
  } catch (e) {
    return err(firebaseErrorMessage(e));
  }
}
