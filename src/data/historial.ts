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
  runTransaction, serverTimestamp,
  query, where, orderBy,
} from "firebase/firestore";
import { db } from "../firebase";
import type { Historial, BloqueRegistro, MiembroId, FirestoreTimestamp } from "../types/models";
import { ok, err, firebaseErrorMessage } from "../lib/result";
import type { Result } from "../lib/result";
import { tonelajeKg, totalSeriesHechas } from "../lib/metricas";

// ── Helpers de fecha ──────────────────────────────────────────────────────────

function hoy(): string {
  return new Date().toISOString().split("T")[0];
}

function lunesDe(fecha: string): string {
  const d = new Date(fecha);
  const dow = d.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split("T")[0];
}

// ── Escritura con transacción ─────────────────────────────────────────────────

export interface FinalizarSesionOpts {
  rutinaId:    string;
  miembro:     MiembroId;
  bloques:     BloqueRegistro[];
  rpe:         number | null;
  duracionMin: number | null;
  notas?:      string;
  /** idSesion real (de crearSesion). Si se provee, la sesión pasa a "Registrada" en la misma tx. */
  idSesion?:   string;
  programaId?: string;
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
  const { rutinaId, miembro, bloques, rpe, duracionMin, notas, idSesion, programaId } = opts;
  const fecha   = hoy();
  const semana  = lunesDe(fecha);
  const idHist  = `H-${fecha.replace(/-/g, "")}-${Date.now()}`;
  // Si no se pasa idSesion, generamos uno "huérfano" (legado, sin doc en /sesiones).
  const sesionId = idSesion ?? `SES-${fecha.replace(/-/g, "")}-${Date.now()}`;

  try {
    await runTransaction(db, async (tx) => {
      // Leer rutina para obtener el nombre (solo lectura; la tx puede leer colecciones compartidas)
      const rutinaSnap = await tx.get(doc(db, "rutinas", rutinaId));
      const nombreRutina = rutinaSnap.exists()
        ? (rutinaSnap.data() as { nombre: string }).nombre
        : rutinaId;

      const tonelaje    = tonelajeKg({ bloques });
      const seriesHechas = totalSeriesHechas({ bloques });

      // Escribir Historial (colección del miembro: cualquier miembro puede escribir)
      const histData: Omit<Historial, "fechaRealizadaTimestamp"> & { fechaRealizadaTimestamp: unknown } = {
        idHist,
        fechaRealizada:          fecha,
        fechaRealizadaTimestamp: serverTimestamp(),
        idSesion:                sesionId,
        idRutina:                rutinaId,
        nombreRutina,
        idPrograma:              programaId,
        semanaInicio:            semana,
        miembro,
        duracionRealMin:         duracionMin,
        rpe,
        tonelajeKg:              tonelaje,
        totalSeriesHechas:       seriesHechas,
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
