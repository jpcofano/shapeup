// ════════════════════════════════════════════════════════════════════════════
//  data/programas.ts — CRUD + caché para /programas (PRG-XXXX).
// ════════════════════════════════════════════════════════════════════════════
import {
  collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc,
  query, orderBy, serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import type { Programa, FirestoreTimestamp } from "../types/models";
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

/** Devuelve el primer programa Activo, o null si no hay ninguno. */
export async function getProgramaActivo(): Promise<Result<Programa | null>> {
  const r = await getProgramas();
  if (!r.ok) return err(r.error);
  return ok(r.value.find((p) => p.estado === "Activo") ?? null);
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
