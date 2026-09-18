// ════════════════════════════════════════════════════════════════════════════
//  data/historial.ts — Escritura y lectura de /historial.
//
//  finalizarSesion (v3, P69): un writeBatch escribe SOLO documentos del miembro
//  (/historial y /sesiones). Los contadores de /ejercicios y /rutinas no se
//  tocan para que no-owners puedan cerrar sus sesiones (ejercicios es
//  owner-only por las reglas de Firestore). Ver ADR #014.
//  Es batch y no transacción porque las transacciones no se encolan sin
//  conexión: fallan. Un batch sí queda en la cola local de Firestore.
// ════════════════════════════════════════════════════════════════════════════
import {
  collection, doc, getDocs, getDoc, getDocFromServer,
  serverTimestamp, updateDoc, writeBatch,
  query, where, orderBy,
} from "firebase/firestore";
import { db } from "../firebase";
import type { Historial, BloqueRegistro, BiometriaSesion, MiembroId, ZonaMolestia } from "../types/models";
import { ok, err, firebaseErrorMessage } from "../lib/result";
import type { Result } from "../lib/result";
import { tonelajeKg, totalSeriesHechas, ventanaDeBloques } from "../lib/metricas";
import { ymdLocal, lunesDeSemana } from "../lib/semana";
import { conTimeout } from "../lib/conTimeout";
import {
  agregarPendiente, quitarPendiente, marcarErrorPendiente, listarPendientes,
  type PayloadHistorial, type PayloadSesion, type SesionPendiente,
} from "../lib/pendientes";

// ── Escritura (batch que se encola sin conexión) ──────────────────────────────

/** Si el servidor no confirma en este tiempo, la sesión queda "sin subir" (P69). */
export const TIMEOUT_GUARDADO_MS = 8000;

/** Una pendiente sin confirmar después de esto se reenvía al conciliar (P69). */
const ESPERA_REENVIO_MS = 2 * 60 * 1000;

export interface FinalizarSesionOpts {
  rutinaId?:    string;          // ausente en sesiones libres
  /** Nombre de la rutina, que la ruta ya tiene en memoria. Si falta, se usa `rutinaId`. */
  nombreRutina?: string;
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
  /** Solo se escribe si viene. Ausente se lee como "completa" (P68). */
  completitud?: "completa" | "parcial";
  /** Cierre de la sesión (P70). Se escriben solo si vienen; molestias, solo si no está vacío. */
  comoMeSenti?: string;
  queMejorar?:  string;
  molestias?:   ZonaMolestia[];
}

/**
 * Cierra una sesión de entrenamiento. Un writeBatch escribe solo documentos del
 * propio miembro:
 *   1. Crea el documento Historial.
 *   2. Si se pasa `idSesion`, marca esa SesionProgramada como "Registrada" con
 *      `set(..., { merge: true })`: si el documento nunca llegó a crearse (sin
 *      señal), un `update` haría fallar el batch y se perdería el historial.
 *
 * El commit compite con un timeout de 8 s (P69):
 *   - confirma a tiempo → `{ pendiente: false }`;
 *   - vence → `{ pendiente: true }`: la escritura ya está en la cola local de
 *     Firestore; se registra en `lib/pendientes` y se quita (o se marca con
 *     error) cuando el commit termine;
 *   - falla antes → `err`.
 *
 * Los contadores de /ejercicios y /rutinas (vecesUsado, vecesEntrenada) NO se
 * actualizan aquí: /ejercicios es owner-only por las reglas de Firestore, y ambos
 * son derivables del Historial. Ver ADR #014.
 */
export async function finalizarSesion(
  opts: FinalizarSesionOpts,
): Promise<Result<{ idHist: string; pendiente: boolean }>> {
  const {
    rutinaId, tipo, nombreLibre, miembro, bloques, rpe, duracionMin, notas, idSesion, programaId,
    completitud, comoMeSenti, queMejorar, molestias,
  } = opts;
  const fecha   = ymdLocal();
  const semana  = lunesDeSemana(fecha);
  const idHist  = `H-${fecha.replace(/-/g, "")}-${Date.now()}`;
  // Si no se pasa idSesion, generamos uno "huérfano" (legado, sin doc en /sesiones).
  const sesionId = idSesion ?? `SES-${fecha.replace(/-/g, "")}-${Date.now()}`;
  // Sesión de rutina: el nombre lo pasa la ruta. Sesión libre: nombreLibre.
  const nombreRutina = rutinaId
    ? (opts.nombreRutina ?? rutinaId)
    : (nombreLibre ?? "Sesión libre");

  const ventana = ventanaDeBloques(bloques);
  const historial: PayloadHistorial = {
    idHist,
    fechaRealizada:          fecha,
    idSesion:                sesionId,
    ...(rutinaId ? { idRutina: rutinaId } : {}),
    nombreRutina,
    ...(tipo === "libre" ? { tipo: "libre" as const } : {}),
    ...(completitud ? { completitud } : {}),
    idPrograma:              programaId,
    semanaInicio:            semana,
    miembro,
    duracionRealMin:         duracionMin,
    rpe,
    tonelajeKg:              tonelajeKg({ bloques }),
    totalSeriesHechas:       totalSeriesHechas({ bloques }),
    ...(ventana.inicioMs != null ? { inicioMs: ventana.inicioMs } : {}),
    ...(ventana.finMs    != null ? { finMs:    ventana.finMs    } : {}),
    bloques,
    notas:                   notas ?? "",
    ...(comoMeSenti ? { comoMeSenti } : {}),
    ...(queMejorar ? { queMejorar } : {}),
    ...(molestias && molestias.length > 0 ? { molestias } : {}),
  };
  const sesion: PayloadSesion | null = idSesion
    ? { miembro, estado: "Registrada", rpeSesion: rpe }
    : null;

  let commit: Promise<void>;
  try {
    commit = escribirHistorial(historial, sesionId, sesion);
  } catch (e) {
    return err(firebaseErrorMessage(e));
  }

  try {
    const r = await conTimeout(commit, TIMEOUT_GUARDADO_MS);
    if (r.tipo === "ok") return ok({ idHist, pendiente: false });
  } catch (e) {
    return err(firebaseErrorMessage(e));
  }

  // Venció el timeout: queda en la cola local de Firestore. Se registra para
  // poder avisar y reenviar si la caché se pierde antes de sincronizar.
  agregarPendiente({
    idHist, idSesion: sesionId, nombreRutina, fecha, creadoMs: Date.now(), historial, sesion,
  });
  commit.then(
    () => quitarPendiente(idHist),
    (e: unknown) => marcarErrorPendiente(idHist, firebaseErrorMessage(e)),
  );
  return ok({ idHist, pendiente: true });
}

/** Escribe el historial (con el mismo `idHist`, así no se duplica) y el merge de la sesión. */
function escribirHistorial(
  historial: PayloadHistorial,
  idSesion: string,
  sesion: PayloadSesion | null,
): Promise<void> {
  const batch = writeBatch(db);
  batch.set(doc(db, "historial", historial.idHist), {
    ...historial,
    fechaRealizadaTimestamp: serverTimestamp(),
  });
  if (sesion) batch.set(doc(db, "sesiones", idSesion), sesion, { merge: true });
  return batch.commit();
}

/**
 * Concilia las sesiones sin subir (P69). Llamar solo con señal; no bloquea.
 * Para cada pendiente: si el historial ya está en el servidor, se quita; si no
 * está y pasaron más de 2 min, se reenvía con el mismo id (si confirma se
 * quita, si falla se marca el error). Si la consulta falla, no se toca nada.
 */
export async function conciliarPendientes(): Promise<void> {
  for (const p of listarPendientes()) {
    let existe: boolean;
    try {
      existe = (await getDocFromServer(doc(db, "historial", p.idHist))).exists();
    } catch {
      continue;
    }
    if (existe) {
      quitarPendiente(p.idHist);
      continue;
    }
    if (Date.now() - p.creadoMs <= ESPERA_REENVIO_MS) continue;
    const r = await reenviarPendiente(p);
    if (r.ok) quitarPendiente(p.idHist);
    else marcarErrorPendiente(p.idHist, r.error);
  }
}

/** Reenvía una pendiente con el mismo `idHist` y el mismo merge de la sesión. */
export async function reenviarPendiente(p: SesionPendiente): Promise<Result<void>> {
  try {
    await escribirHistorial(p.historial, p.idSesion, p.sesion);
    return ok(undefined);
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

/** Límite de Firestore: 500 operaciones por batch. Con margen. */
const MAX_OPS_POR_BATCH = 400;

/**
 * Escribe entradas externas (P75) en batches de a `MAX_OPS_POR_BATCH`.
 *
 * `setDoc` sin merge, con el id determinístico `EXT-{datauuid}`: reimportar el
 * mismo ZIP PISA la entrada en vez de duplicarla. `idsExistentes` son los
 * `idHist` que ya estaban en el historial cargado — sirve para informar cuántas
 * fueron actualizaciones y cuántas altas, sin leer de nuevo.
 */
export async function guardarEntradasExternas(
  entradas: Historial[],
  idsExistentes: ReadonlySet<string>,
): Promise<Result<{ creadas: number; actualizadas: number }>> {
  if (entradas.length === 0) return ok({ creadas: 0, actualizadas: 0 });
  try {
    let batch = writeBatch(db);
    let ops = 0;
    for (const entrada of entradas) {
      batch.set(doc(db, "historial", entrada.idHist), entrada);
      ops++;
      if (ops >= MAX_OPS_POR_BATCH) {
        await batch.commit();
        batch = writeBatch(db);
        ops = 0;
      }
    }
    if (ops > 0) await batch.commit();

    const actualizadas = entradas.filter((e) => idsExistentes.has(e.idHist)).length;
    return ok({ creadas: entradas.length - actualizadas, actualizadas });
  } catch (e) {
    return err(firebaseErrorMessage(e));
  }
}

// ── Borrado ───────────────────────────────────────────────────────────────────

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
