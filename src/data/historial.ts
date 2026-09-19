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
  query, where, orderBy, limit, startAfter,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "../firebase";
import type { Historial, BloqueRegistro, BiometriaSesion, MiembroId, ZonaMolestia } from "../types/models";
import { ok, err, firebaseErrorMessage } from "../lib/result";
import type { Result } from "../lib/result";
import { tonelajeKg, totalSeriesHechas, ventanaDeBloques } from "../lib/metricas";
import { ymdLocal, lunesDeSemana } from "../lib/semana";
import { agruparDiasActivos, type DiaActivo } from "../lib/racha";
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
//
// P75b: ya no existe una consulta que traiga TODO el historial. Con las
// entradas externas, "todo" pasó de ~decenas a miles de documentos, y lo
// pedían seis pantallas en cada visita. Ahora hay tres consultas, cada una
// acotada a lo que su consumidor necesita de verdad.

/**
 * Tope de sesiones de ShapeUp que se traen de una. Son más de tres años
 * entrenando cuatro veces por semana: alcanza de sobra para racha, progresión,
 * PR y costo cardíaco. Si algún día hace falta más, se pagina.
 */
export const LIMITE_HISTORIAL_SHAPEUP = 200;

/** Los `tipo` que cuentan como entrenado en la app (ver `lib/tipoHistorial`). */
const TIPOS_SHAPEUP = ["rutina", "libre"] as const;

/**
 * Sesiones entrenadas en la app, de la más reciente a la más vieja.
 *
 * Requiere el índice (miembro, tipo, fechaRealizadaTimestamp desc) y que todos
 * los documentos tengan `tipo` — de eso se ocupó
 * `scripts/backfill-tipo-historial.ts`, porque un documento sin el campo no
 * entra en un `where("tipo", "in", …)` y quedaría invisible.
 */
export async function getHistorialShapeUp(
  miembro: MiembroId,
  limite: number = LIMITE_HISTORIAL_SHAPEUP,
): Promise<Result<Historial[]>> {
  try {
    const snap = await getDocs(
      query(
        collection(db, "historial"),
        where("miembro", "==", miembro),
        where("tipo", "in", TIPOS_SHAPEUP),
        orderBy("fechaRealizadaTimestamp", "desc"),
        limit(limite),
      ),
    );
    return ok(snap.docs.map((d) => d.data() as Historial));
  } catch (e) {
    return err(firebaseErrorMessage(e));
  }
}

/** Opciones de `getHistorialExternas`. `cursor` sale de `siguienteCursor`. */
export interface OpcionesExternas {
  desde?: string;                 // "YYYY-MM-DD" inclusive
  hasta?: string;                 // "YYYY-MM-DD" inclusive
  limite?: number;
  cursor?: QueryDocumentSnapshot;
}

export interface PaginaExternas {
  entradas: Historial[];
  /** Pasalo como `cursor` para traer la página siguiente. `null` = no hay más. */
  siguienteCursor: QueryDocumentSnapshot | null;
}

/** Cuántas externas por página si el llamador no dice otra cosa. */
export const LIMITE_EXTERNAS_POR_PAGINA = 100;

/**
 * Actividades externas, paginadas y de la más reciente a la más vieja. Son
 * miles: nunca se traen todas de una.
 */
export async function getHistorialExternas(
  miembro: MiembroId,
  opciones: OpcionesExternas = {},
): Promise<Result<PaginaExternas>> {
  const limite = opciones.limite ?? LIMITE_EXTERNAS_POR_PAGINA;
  try {
    const snap = await getDocs(
      query(
        collection(db, "historial"),
        where("miembro", "==", miembro),
        where("tipo", "==", "externa"),
        ...(opciones.desde ? [where("fechaRealizada", ">=", opciones.desde)] : []),
        ...(opciones.hasta ? [where("fechaRealizada", "<=", opciones.hasta)] : []),
        orderBy("fechaRealizadaTimestamp", "desc"),
        ...(opciones.cursor ? [startAfter(opciones.cursor)] : []),
        limit(limite),
      ),
    );
    return ok({
      entradas: snap.docs.map((d) => d.data() as Historial),
      // Solo hay más si la página vino llena; si no, ya estamos en el final.
      siguienteCursor: snap.docs.length === limite ? snap.docs[snap.docs.length - 1] : null,
    });
  } catch (e) {
    return err(firebaseErrorMessage(e));
  }
}

/**
 * Los días con actividad entre `desde` y `hasta`, cada uno con su origen.
 *
 * Trae las dos mitades (ShapeUp y externas) y las agrupa con el núcleo puro
 * `agruparDiasActivos`. **No decide qué cuenta**: devuelve las tres marcas por
 * día y el consumidor elige (la racha del plan mira `shapeUp`; "me moví" puede
 * incluir o no lo autodetectado).
 */
export async function getDiasActivos(
  miembro: MiembroId,
  desde: string,
  hasta: string,
): Promise<Result<DiaActivo[]>> {
  try {
    const snap = await getDocs(
      query(
        collection(db, "historial"),
        where("miembro", "==", miembro),
        where("fechaRealizada", ">=", desde),
        where("fechaRealizada", "<=", hasta),
      ),
    );
    return ok(agruparDiasActivos(snap.docs.map((d) => d.data() as Historial)));
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
 * mismo ZIP PISA la entrada en vez de duplicarla.
 *
 * No distingue altas de actualizaciones a propósito (P75b): saberlo exigiría
 * leer las miles de externas que ya están guardadas, que es justo lo que este
 * prompt vino a evitar. El resultado es el mismo se escriba sobre algo o no.
 */
export async function guardarEntradasExternas(
  entradas: Historial[],
): Promise<Result<{ escritas: number }>> {
  if (entradas.length === 0) return ok({ escritas: 0 });
  // P76a: se lleva la cuenta de lo ya commiteado para poder decir qué quedó
  // escrito si falla un batch del medio. Reintentar es seguro: los ids son
  // determinísticos y el `set` es idempotente.
  let escritas = 0;
  try {
    let batch = writeBatch(db);
    let ops = 0;
    for (const entrada of entradas) {
      batch.set(doc(db, "historial", entrada.idHist), entrada);
      ops++;
      if (ops >= MAX_OPS_POR_BATCH) {
        await batch.commit();
        escritas += ops;
        batch = writeBatch(db);
        ops = 0;
      }
    }
    if (ops > 0) { await batch.commit(); escritas += ops; }

    return ok({ escritas });
  } catch (e) {
    const detalle = escritas > 0 ? ` (${escritas} de ${entradas.length} ya se habían guardado)` : "";
    return err(`${firebaseErrorMessage(e)}${detalle}`);
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
