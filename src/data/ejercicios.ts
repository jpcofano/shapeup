// ════════════════════════════════════════════════════════════════════════════
//  data/ejercicios.ts — CRUD + caché para la colección /ejercicios
//  Patrón: caché en memoria, Result<T>, serverTimestamp, IDs EJ-XXXX,
//  nombreCanonico. Solo el owner puede escribir (reglas de Firestore).
// ════════════════════════════════════════════════════════════════════════════
import {
  collection, doc, getDocs, getDoc, setDoc, updateDoc,
  query, orderBy, serverTimestamp, deleteField,
} from "firebase/firestore";
import { db } from "../firebase";
import type { Ejercicio, FirestoreTimestamp } from "../types/models";
import { ok, err, firebaseErrorMessage } from "../lib/result";
import type { Result } from "../lib/result";
import { normalizeText } from "../lib/canonical";
import { proximoId } from "./_helpers";

// ── Caché en memoria ──────────────────────────────────────────────────────────
let _cache: Map<string, Ejercicio> | null = null;

function invalidar() { _cache = null; }

// ── Lecturas ──────────────────────────────────────────────────────────────────

/**
 * Devuelve todos los ejercicios, ordenados por ID.
 * Usa caché en memoria; se invalida tras cualquier escritura.
 */
export async function getEjercicios(): Promise<Result<Ejercicio[]>> {
  if (_cache) return ok([..._cache.values()]);
  try {
    const snap = await getDocs(
      query(collection(db, "ejercicios"), orderBy("idEjercicio")),
    );
    _cache = new Map();
    snap.forEach((d) => _cache!.set(d.id, d.data() as Ejercicio));
    return ok([..._cache.values()]);
  } catch (e) {
    return err(firebaseErrorMessage(e));
  }
}

/** Devuelve el catálogo como Map<idEjercicio, Ejercicio> (para calcularCacheRutina). */
export async function getEjerciciosMap(): Promise<Map<string, Ejercicio>> {
  const r = await getEjercicios();
  if (!r.ok) return new Map();
  return new Map(r.value.map((ej) => [ej.idEjercicio, ej]));
}

/** Devuelve un ejercicio por ID (con caché). */
export async function getEjercicio(id: string): Promise<Result<Ejercicio>> {
  if (_cache?.has(id)) return ok(_cache.get(id)!);
  try {
    const snap = await getDoc(doc(db, "ejercicios", id));
    if (!snap.exists()) return err(`Ejercicio ${id} no encontrado`);
    const ej = snap.data() as Ejercicio;
    _cache?.set(id, ej);
    return ok(ej);
  } catch (e) {
    return err(firebaseErrorMessage(e));
  }
}

/**
 * Trae varios ejercicios por id. Los que no existen van a `faltantes`; un error
 * de red o de permisos devuelve `err` (no se confunde con "no existe").
 */
export async function getEjerciciosPorId(
  ids: string[],
): Promise<Result<{ encontrados: Map<string, Ejercicio>; faltantes: string[] }>> {
  try {
    const encontrados = new Map<string, Ejercicio>();
    const faltantes: string[] = [];
    await Promise.all([...new Set(ids)].map(async (id) => {
      const enCache = _cache?.get(id);
      if (enCache) { encontrados.set(id, enCache); return; }
      const snap = await getDoc(doc(db, "ejercicios", id));
      if (!snap.exists()) { faltantes.push(id); return; }
      const ej = snap.data() as Ejercicio;
      _cache?.set(id, ej);
      encontrados.set(id, ej);
    }));
    return ok({ encontrados, faltantes });
  } catch (e) {
    return err(firebaseErrorMessage(e));
  }
}

// ── Escrituras (solo owner) ───────────────────────────────────────────────────

export type EjercicioInput = Omit<
  Ejercicio,
  "idEjercicio" | "nombreCanonico" | "vecesUsado" | "fechaCreacion" | "ultimaModificacion"
>;

/** Crea un ejercicio con el próximo ID secuencial (EJ-XXXX). */
export async function crearEjercicio(
  data: EjercicioInput,
): Promise<Result<Ejercicio>> {
  try {
    const id = await proximoId("ejercicios", "EJ");
    const ej: Ejercicio = {
      ...data,
      idEjercicio: id,
      nombreCanonico: normalizeText(data.nombre),
      vecesUsado: 0,
      fechaCreacion:      serverTimestamp() as unknown as FirestoreTimestamp,
      ultimaModificacion: serverTimestamp() as unknown as FirestoreTimestamp,
    };
    await setDoc(doc(db, "ejercicios", id), ej);
    invalidar();
    return ok(ej);
  } catch (e) {
    return err(firebaseErrorMessage(e));
  }
}

/**
 * Actualiza campos de un ejercicio existente y recalcula nombreCanonico si cambia el nombre.
 * `pasoCargaKg: null` borra el campo (vuelve al default del equipo): con
 * `ignoreUndefinedProperties`, un `undefined` no borraría nada.
 */
export async function actualizarEjercicio(
  id: string,
  data: Partial<Omit<EjercicioInput, "pasoCargaKg">> & { pasoCargaKg?: number | null },
): Promise<Result<void>> {
  try {
    const { pasoCargaKg, ...resto } = data;
    await updateDoc(doc(db, "ejercicios", id), {
      ...resto,
      ...(pasoCargaKg === null ? { pasoCargaKg: deleteField() }
        : pasoCargaKg !== undefined ? { pasoCargaKg } : {}),
      ...(data.nombre ? { nombreCanonico: normalizeText(data.nombre) } : {}),
      ultimaModificacion: serverTimestamp(),
    });
    invalidar();
    return ok(undefined);
  } catch (e) {
    return err(firebaseErrorMessage(e));
  }
}
