// ════════════════════════════════════════════════════════════════════════════
//  data/historial.ts — Escritura y lectura de /historial.
//  finalizarSesion: runTransaction que escribe el Historial y sube los
//  contadores de Rutina (vecesEntrenada, ultimaVez) y Ejercicio (vecesUsado).
// ════════════════════════════════════════════════════════════════════════════
import {
  collection, doc, getDocs, getDoc,
  runTransaction, serverTimestamp,
  query, where, orderBy, increment,
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

/** Lunes de la semana que contiene la fecha dada. */
function lunesDe(fecha: string): string {
  const d = new Date(fecha);
  const dow = d.getDay(); // 0=Dom … 6=Sáb
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
}

/**
 * Cierra una sesión de entrenamiento:
 *   1. Escribe el documento Historial.
 *   2. Incrementa Rutina.vecesEntrenada + actualiza ultimaVez.
 *   3. Incrementa Ejercicio.vecesUsado + actualiza ultimaVez.
 * Todo en una sola transacción.
 */
export async function finalizarSesion(
  opts: FinalizarSesionOpts,
): Promise<Result<string>> {
  const { rutinaId, miembro, bloques, rpe, duracionMin, notas } = opts;
  const fecha   = hoy();
  const semana  = lunesDe(fecha);
  const idHist  = `H-${fecha.replace(/-/g, "")}-${Date.now()}`;
  const idSesion = `SES-${fecha.replace(/-/g, "")}-${Date.now()}`;

  try {
    await runTransaction(db, async (tx) => {
      // ── Leer rutina ───────────────────────────────────────────────────────
      const rutinaRef  = doc(db, "rutinas", rutinaId);
      const rutinaSnap = await tx.get(rutinaRef);
      if (!rutinaSnap.exists()) throw new Error(`Rutina ${rutinaId} no encontrada`);
      const nombreRutina = (rutinaSnap.data() as { nombre: string }).nombre;

      const tonelaje   = tonelajeKg({ bloques });
      const seriesHechas = totalSeriesHechas({ bloques });

      // ── Escribir Historial ────────────────────────────────────────────────
      const histData: Omit<Historial, "fechaRealizadaTimestamp"> & { fechaRealizadaTimestamp: unknown } = {
        idHist,
        fechaRealizada:          fecha,
        fechaRealizadaTimestamp: serverTimestamp(),
        idSesion,
        idRutina:                rutinaId,
        nombreRutina,
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

      // ── Actualizar Rutina ─────────────────────────────────────────────────
      tx.update(rutinaRef, {
        vecesEntrenada:    increment(1),
        ultimaVez:         fecha,
        ultimoRpe:         rpe,
        ultimaModificacion: serverTimestamp(),
      });

      // ── Actualizar Ejercicios (únicos en la sesión) ───────────────────────
      const ejIds = [...new Set(bloques.map((b) => b.idEjercicio))];
      for (const ejId of ejIds) {
        tx.update(doc(db, "ejercicios", ejId), {
          vecesUsado: increment(1),
          ultimaVez:  fecha,
        });
      }
    });

    return ok(idHist);
  } catch (e) {
    return err(firebaseErrorMessage(e));
  }
}

// ── Lecturas ──────────────────────────────────────────────────────────────────

/** Devuelve el historial de un miembro, ordenado por fecha descendente. */
export async function getHistorialMiembro(
  miembro: MiembroId,
): Promise<Result<Historial[]>> {
  try {
    const snap = await getDocs(
      query(
        collection(db, "historial"),
        where("miembro", "==", miembro),
        orderBy("fechaRealizada", "desc"),
      ),
    );
    return ok(snap.docs.map((d) => d.data() as Historial));
  } catch (e) {
    return err(firebaseErrorMessage(e));
  }
}

/** Devuelve una entrada de historial por ID. */
export async function getHistorialEntry(id: string): Promise<Result<Historial>> {
  try {
    const snap = await getDoc(doc(db, "historial", id));
    if (!snap.exists()) return err(`Historial ${id} no encontrado`);
    return ok(snap.data() as Historial);
  } catch (e) {
    return err(firebaseErrorMessage(e));
  }
}
