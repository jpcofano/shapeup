// ════════════════════════════════════════════════════════════════════════════
//  data/rutinas.ts — CRUD + caché para la colección /rutinas
//  Al crear/actualizar, corre calcularCacheRutina (duracion, series, equipo).
//  Patrón: caché en memoria, Result<T>, serverTimestamp, IDs RUT-XXXX.
// ════════════════════════════════════════════════════════════════════════════
import {
  collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc,
  query, orderBy, serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import type { Rutina, FirestoreTimestamp, MiembroId } from "../types/models";
import { ok, err, firebaseErrorMessage } from "../lib/result";
import type { Result } from "../lib/result";
import { getVisibilidad, rutinaVisible } from "./visibilidad";
import { normalizeText } from "../lib/canonical";
import { calcularCacheRutina } from "../lib/metricas";
import { getEjerciciosMap } from "./ejercicios";
import { proximoId } from "./_helpers";

// ── Caché en memoria ──────────────────────────────────────────────────────────
let _cache: Map<string, Rutina> | null = null;

function invalidar() { _cache = null; }

// ── Lecturas ──────────────────────────────────────────────────────────────────

/** Devuelve todas las rutinas ordenadas por ID. */
export async function getRutinas(): Promise<Result<Rutina[]>> {
  if (_cache) return ok([..._cache.values()]);
  try {
    const snap = await getDocs(
      query(collection(db, "rutinas"), orderBy("idRutina")),
    );
    _cache = new Map();
    snap.forEach((d) => _cache!.set(d.id, d.data() as Rutina));
    return ok([..._cache.values()]);
  } catch (e) {
    return err(firebaseErrorMessage(e));
  }
}

/** Devuelve una rutina por ID (con caché). */
export async function getRutina(id: string): Promise<Result<Rutina>> {
  if (_cache?.has(id)) return ok(_cache.get(id)!);
  try {
    const snap = await getDoc(doc(db, "rutinas", id));
    if (!snap.exists()) return err(`Rutina ${id} no encontrada`);
    const rutina = snap.data() as Rutina;
    _cache?.set(id, rutina);
    return ok(rutina);
  } catch (e) {
    return err(firebaseErrorMessage(e));
  }
}

// ── Escrituras ────────────────────────────────────────────────────────────────

export type RutinaInput = Omit<
  Rutina,
  | "idRutina" | "nombreCanonico"
  | "duracionEstimadaMin" | "totalSeries" | "equipoNecesario"
  | "vecesEntrenada" | "fechaCreacion" | "ultimaModificacion"
>;

/** Crea una rutina con el próximo ID (RUT-XXXX) y calcula los derivados. */
export async function crearRutina(data: RutinaInput): Promise<Result<Rutina>> {
  try {
    const [id, catalogo] = await Promise.all([
      proximoId("rutinas", "RUT"),
      getEjerciciosMap(),
    ]);

    const base: Rutina = {
      ...data,
      idRutina: id,
      nombreCanonico:     normalizeText(data.nombre),
      duracionEstimadaMin: null,
      totalSeries:        null,
      equipoNecesario:    [],
      vecesEntrenada:     0,
      fechaCreacion:      serverTimestamp() as unknown as FirestoreTimestamp,
      ultimaModificacion: serverTimestamp() as unknown as FirestoreTimestamp,
    };

    const derivados = calcularCacheRutina(base, catalogo);
    const rutina: Rutina = { ...base, ...derivados };

    await setDoc(doc(db, "rutinas", id), rutina);
    invalidar();
    return ok(rutina);
  } catch (e) {
    return err(firebaseErrorMessage(e));
  }
}

/** Actualiza una rutina y recalcula los derivados. */
export async function actualizarRutina(
  id: string,
  data: Partial<RutinaInput>,
): Promise<Result<void>> {
  try {
    const [currentResult, catalogo] = await Promise.all([
      getRutina(id),
      getEjerciciosMap(),
    ]);
    if (!currentResult.ok) return err(currentResult.error);

    const merged: Rutina = { ...currentResult.value, ...data };
    if (data.nombre) merged.nombreCanonico = normalizeText(data.nombre);

    const derivados = calcularCacheRutina(merged, catalogo);

    await updateDoc(doc(db, "rutinas", id), {
      ...data,
      ...(data.nombre ? { nombreCanonico: normalizeText(data.nombre) } : {}),
      ...derivados,
      ultimaModificacion: serverTimestamp(),
    });
    invalidar();
    return ok(undefined);
  } catch (e) {
    return err(firebaseErrorMessage(e));
  }
}

/** Elimina una rutina. */
export async function eliminarRutina(id: string): Promise<Result<void>> {
  try {
    await deleteDoc(doc(db, "rutinas", id));
    invalidar();
    return ok(undefined);
  } catch (e) {
    return err(firebaseErrorMessage(e));
  }
}


/**
 * Devuelve las rutinas visibles para el miembro (owner ve todo;
 * no-owner solo las que figuran en config/visibilidad.rutinas).
 */
export async function getRutinasDelMiembro(
  miembro: MiembroId,
): Promise<Result<Rutina[]>> {
  const [rutinasR, visR] = await Promise.all([getRutinas(), getVisibilidad(miembro)]);
  if (!rutinasR.ok) return rutinasR;
  const vis = visR.ok ? visR.value : null; // fail-open: si falla visibilidad, owner no pierde acceso
  return ok(rutinasR.value.filter((r) => rutinaVisible(r.idRutina, vis)));
}
