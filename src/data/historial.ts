// ════════════════════════════════════════════════════════════════════════════
//  data/historial.ts — Escritura y lectura de /historial.
//
//  finalizarSesion (v2): la transacción escribe SOLO documentos del miembro
//  (/historial y /sesiones). Los contadores de /ejercicios y /rutinas se sacan
//  de la tx para que no-owners puedan cerrar sus sesiones (ejercicios es
//  owner-only por las reglas de Firestore).
//  Ver ADR #014 en MAPEO-IMPLEMENTACION.md.
// ════════════════════════════════════════════════════════════════════════════
import {
  collection, doc, getDocs, getDoc,
  runTransaction, serverTimestamp, updateDoc, writeBatch,
  query, where, orderBy,
} from "firebase/firestore";
import { db } from "../firebase";
import type { Historial, BloqueRegistro, BiometriaSesion, MiembroId, FirestoreTimestamp } from "../types/models";
import { ok, err, firebaseErrorMessage } from "../lib/result";
import type { Result } from "../lib/result";
import { tonelajeKg, totalSeriesHechas, ventanaDeBloques } from "../lib/metricas";
import { ymdLocal, lunesDeSemana } from "../lib/semana";

// ── Escritura con transacción ─────────────────────────────────────────────────

export interface FinalizarSesionOpts {
  rutinaId?:    string;          // ausente en sesiones libres
  tipo?:        "rutina" | "libre";
  nombreLibre?: string;          // título de la sesión libre
  miembro:      MiembroId;
  bloques:      BloqueRegistro[];
  rpe:          number | null;
  duracionMin:  number | null;
  notas?:       string;
  /** idSesion real (de crearSesion). Si se provee, la sesión pasa a "Registrada" en la misma tx. */
  idSesion?:    string;
  programaId?:  string;
}

/**
 * Cierra una sesión de entrenamiento.
 * La transacción escribe solo documentos del propio miembro:
 *   1. Crea el documento Historial.
 *   2. Si se pasa `idSesion`, marca esa SesionProgramada como "Registrada".
 *
 * Los contadores de /ejercicios y /rutinas (vecesUsado, vecesEntrenada) NO se
 * actualizan aquí: /ejercicios es owner-only por las reglas de Firestore, y ambos
 * son derivables del Historial. Ver ADR #014.
 */
export async function finalizarSesion(
  opts: FinalizarSesionOpts,
): Promise<Result<string>> {
  const { rutinaId, tipo, nombreLibre, miembro, bloques, rpe, duracionMin, notas, idSesion, programaId } = opts;
  const fecha   = ymdLocal();
  const semana  = lunesDeSemana(fecha);
  const idHist  = `H-${fecha.replace(/-/g, "")}-${Date.now()}`;
  // Si no se pasa idSesion, generamos uno "huérfano" (legado, sin doc en /sesiones).
  const sesionId = idSesion ?? `SES-${fecha.replace(/-/g, "")}-${Date.now()}`;

  try {
    await runTransaction(db, async (tx) => {
      // Para sesiones de rutina, leer el nombre desde Firestore.
      // Para sesiones libres, usar nombreLibre (no hay Rutina en /rutinas).
      let nombreRutina: string;
      if (rutinaId) {
        const rutinaSnap = await tx.get(doc(db, "rutinas", rutinaId));
        nombreRutina = rutinaSnap.exists()
          ? (rutinaSnap.data() as { nombre: string }).nombre
          : rutinaId;
      } else {
        nombreRutina = nombreLibre ?? "Sesión libre";
      }

      const tonelaje    = tonelajeKg({ bloques });
      const seriesHechas = totalSeriesHechas({ bloques });

      // Escribir Historial (colección del miembro: cualquier miembro puede escribir)
      const ventana = ventanaDeBloques(bloques);

      const histData: Omit<Historial, "fechaRealizadaTimestamp"> & { fechaRealizadaTimestamp: unknown } = {
        idHist,
        fechaRealizada:          fecha,
        fechaRealizadaTimestamp: serverTimestamp(),
        idSesion:                sesionId,
        ...(rutinaId ? { idRutina: rutinaId } : {}),
        nombreRutina,
        ...(tipo === "libre" ? { tipo: "libre" as const } : {}),
        idPrograma:              programaId,
        semanaInicio:            semana,
        miembro,
        duracionRealMin:         duracionMin,
        rpe,
        tonelajeKg:              tonelaje,
        totalSeriesHechas:       seriesHechas,
        ...(ventana.inicioMs != null ? { inicioMs: ventana.inicioMs } : {}),
        ...(ventana.finMs    != null ? { finMs:    ventana.finMs    } : {}),
        bloques,
        notas:                   notas ?? "",
      };
      tx.set(doc(db, "historial", idHist), histData);

      // Marcar la sesión como Registrada (si existe en /sesiones)
      if (idSesion) {
        tx.update(doc(db, "sesiones", idSesion), {
          estado:    "Registrada",
          rpeSesion: rpe,
        });
      }
    });

    return ok(idHist);
  } catch (e) {
    return err(firebaseErrorMessage(e));
  }
}

// ── Lecturas ──────────────────────────────────────────────────────────────────

export async function getHistorialMiembro(
  miembro: MiembroId,
): Promise<Result<Historial[]>> {
  try {
    const snap = await getDocs(
      query(
        collection(db, "historial"),
        where("miembro", "==", miembro),
        orderBy("fechaRealizadaTimestamp", "desc"),
      ),
    );
    return ok(snap.docs.map((d) => d.data() as Historial));
  } catch (e) {
    return err(firebaseErrorMessage(e));
  }
}

export async function getHistorialEntry(id: string): Promise<Result<Historial>> {
  try {
    const snap = await getDoc(doc(db, "historial", id));
    if (!snap.exists()) return err(`Historial ${id} no encontrado`);
    return ok(snap.data() as Historial);
  } catch (e) {
    return err(firebaseErrorMessage(e));
  }
}

// ── Enriquecimiento biométrico (ADR #021) ─────────────────────────────────────

/**
 * Actualiza un Historial existente con biometría post-import.
 * Si vienen `bloques` enriquecidos (granularidad "serie"), los escribe también.
 * Escribe solo documentos del propio miembro (ADR #014).
 */
export async function enriquecerHistorial(
  idHist: string,
  biometria: BiometriaSesion,
  bloques?: BloqueRegistro[],
): Promise<Result<void>> {
  try {
    const patch: Record<string, unknown> = { biometria };
    if (bloques) patch.bloques = bloques;
    await updateDoc(doc(db, "historial", idHist), patch);
    return ok(undefined);
  } catch (e) {
    return err(firebaseErrorMessage(e));
  }
}

// ── Borrado ───────────────────────────────────────────────────────────────────

const MAX_OPS_POR_BATCH = 400;

/** writeBatch que se auto-flushea cada `MAX_OPS_POR_BATCH` operaciones (límite Firestore: 500). */
function batchAutoFlush() {
  let batch = writeBatch(db);
  let ops = 0;
  return {
    delete(ref: ReturnType<typeof doc>) {
      batch.delete(ref);
      ops++;
    },
    async flushSiHaceFalta() {
      if (ops >= MAX_OPS_POR_BATCH) {
        await batch.commit();
        batch = writeBatch(db);
        ops = 0;
      }
    },
    async commitFinal() {
      if (ops > 0) await batch.commit();
    },
  };
}

/** Borra un registro de historial: su subcolección `media` y, si tiene `idSesion`, la sesión asociada. */
export async function borrarSesionHistorial(idHist: string): Promise<Result<void>> {
  try {
    const histRef  = doc(db, "historial", idHist);
    const histSnap = await getDoc(histRef);
    if (!histSnap.exists()) return err(`Historial ${idHist} no encontrado`);
    const idSesion = (histSnap.data() as Historial).idSesion;

    const b = batchAutoFlush();
    const mediaSnap = await getDocs(collection(db, "historial", idHist, "media"));
    for (const mediaDoc of mediaSnap.docs) {
      b.delete(mediaDoc.ref);
      await b.flushSiHaceFalta();
    }
    b.delete(histRef);
    if (idSesion) b.delete(doc(db, "sesiones", idSesion));
    await b.commitFinal();

    return ok(undefined);
  } catch (e) {
    return err(firebaseErrorMessage(e));
  }
}

/** Borra todo el historial (y sesiones) de un miembro. No toca /ejercicios ni /rutinas. */
export async function borrarHistorialMiembro(
  miembro: MiembroId,
): Promise<Result<{ historial: number; sesiones: number }>> {
  try {
    const histSnap = await getDocs(
      query(collection(db, "historial"), where("miembro", "==", miembro)),
    );
    const sesSnap = await getDocs(
      query(collection(db, "sesiones"), where("miembro", "==", miembro)),
    );

    const b = batchAutoFlush();
    for (const histDoc of histSnap.docs) {
      const mediaSnap = await getDocs(collection(db, "historial", histDoc.id, "media"));
      for (const mediaDoc of mediaSnap.docs) {
        b.delete(mediaDoc.ref);
        await b.flushSiHaceFalta();
      }
      b.delete(histDoc.ref);
      await b.flushSiHaceFalta();
    }
    for (const sesDoc of sesSnap.docs) {
      b.delete(sesDoc.ref);
      await b.flushSiHaceFalta();
    }
    await b.commitFinal();

    return ok({ historial: histSnap.size, sesiones: sesSnap.size });
  } catch (e) {
    return err(firebaseErrorMessage(e));
  }
}
