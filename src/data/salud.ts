// ════════════════════════════════════════════════════════════════════════════
//  data/salud.ts — CRUD para /mediciones y /cardio.
//  Soporta carga manual y marcado de fuente (samsung-health-csv | manual).
// ════════════════════════════════════════════════════════════════════════════
import {
  collection, doc, getDocs, setDoc, deleteDoc,
  query, where, orderBy, serverTimestamp, limit, startAfter, getCountFromServer,
} from "firebase/firestore";
import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import type {
  MedicionCorporal, SesionCardio, RegistroSueno,
  MetricaSalud, TipoMetrica,
  MiembroId, FuenteDato, FirestoreTimestamp,
} from "../types/models";
import { ok, err, firebaseErrorMessage } from "../lib/result";
import type { Result } from "../lib/result";
import { marcasDe } from "../lib/actividadRelevante";
import { idCardioDe } from "../lib/idsSalud";

function idMedicion(): string { return `MED-${Date.now()}`; }

// ── MedicionCorporal ──────────────────────────────────────────────────────────

export type MedicionInput = Omit<MedicionCorporal, "idMedicion" | "fechaCreacion">;

export async function getMediciones(miembro: MiembroId): Promise<Result<MedicionCorporal[]>> {
  try {
    const snap = await getDocs(
      query(collection(db, "mediciones"), where("miembro", "==", miembro), orderBy("fecha", "desc")),
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

/** Cursor de paginado de `/cardio`: el último documento de la página anterior. */
export type CursorCardio = QueryDocumentSnapshot<DocumentData>;

export interface OpcionesCardioRango {
  /** "YYYY-MM-DD" inclusive. Sin esto, desde el principio de los tiempos. */
  desde?: string;
  /** "YYYY-MM-DD" inclusive. */
  hasta?: string;
  /** Tope de documentos de esta página. */
  limite?: number;
  /** `siguienteCursor` de la página anterior. */
  cursor?: CursorCardio;
}

/** Cuántas actividades trae una página si nadie dice otra cosa. */
export const LIMITE_CARDIO_POR_PAGINA = 200;

/**
 * Actividades de `/cardio` por rango de fecha, paginadas (P76b).
 *
 * Reemplaza a `getSesionesCardio`, que traía la colección entera sin límite:
 * con 2563 documentos eran 2563 lecturas cada vez que alguien abría Salud, y
 * es la causa directa de que la cuota diaria se agotara.
 *
 * Usa el índice `(miembro, fecha desc)` que ya existe en `firestore.indexes.json`.
 */
export async function getCardioRango(
  miembro: MiembroId,
  opciones: OpcionesCardioRango = {},
): Promise<Result<{ sesiones: SesionCardio[]; siguienteCursor: CursorCardio | null }>> {
  const limite = opciones.limite ?? LIMITE_CARDIO_POR_PAGINA;
  try {
    const snap = await getDocs(
      query(
        collection(db, "cardio"),
        where("miembro", "==", miembro),
        ...(opciones.desde ? [where("fecha", ">=", opciones.desde)] : []),
        ...(opciones.hasta ? [where("fecha", "<=", opciones.hasta)] : []),
        orderBy("fecha", "desc"),
        ...(opciones.cursor ? [startAfter(opciones.cursor)] : []),
        limit(limite),
      ),
    );
    return ok({
      sesiones: snap.docs.map((d) => d.data() as SesionCardio),
      // Solo hay más si la página vino llena; si no, ya estamos en el final.
      siguienteCursor: snap.docs.length === limite ? snap.docs[snap.docs.length - 1] : null,
    });
  } catch (e) {
    return err(firebaseErrorMessage(e));
  }
}

/**
 * Cuántas actividades tiene el miembro en total (P76b).
 *
 * Es una lectura agregada: cuenta en el servidor y factura una sola, así la
 * pestaña Cardio puede decir "mostrando 180 de 2563" sin traer las 2563.
 */
export async function contarCardio(miembro: MiembroId): Promise<Result<number>> {
  try {
    const snap = await getCountFromServer(
      query(collection(db, "cardio"), where("miembro", "==", miembro)),
    );
    return ok(snap.data().count);
  } catch (e) {
    return err(firebaseErrorMessage(e));
  }
}

/**
 * Guarda una sesión de cardio. Si el item trae `_uuid` (viene de Samsung), el id
 * es determinístico y volver a guardarlo pisa la misma fila (P75); la carga
 * manual, que no tiene uuid, sigue generando uno nuevo.
 */
export async function guardarCardio(
  data: CardioInput & { _uuid?: string },
): Promise<Result<SesionCardio>> {
  try {
    const { _uuid, ...limpio } = data;
    const id  = idCardioDe(_uuid);
    const ses: SesionCardio = {
      ...limpio,
      // Carga manual: la declaraste vos, así que nunca es autodetectada aunque
      // no tenga FC (P76b). El reloj no la marcó como ShapeUp.
      esVR: limpio.esVR === true,
      marcadaShapeUp: false,
      autodetectada: false,
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

/**
 * Resultado de un import batch resiliente.
 *
 * `fallidos` y `primerError` son de P76a: antes, un rechazo del servidor
 * (cuota, permisos, red) se contaba como "omitido" y la función devolvía `ok`,
 * así que el llamador informaba éxito sobre documentos que nunca se escribieron.
 */
export interface ImportResult {
  importados: number;
  omitidos: number;
  fallidos?: number;
  primerError?: string;
}

/** Cuenta los rechazos de un `allSettled` y arma el ImportResult. */
function resultadoDe(results: PromiseSettledResult<unknown>[], total: number): ImportResult {
  const rechazos = results.filter((r): r is PromiseRejectedResult => r.status === "rejected");
  const importados = results.length - rechazos.length;
  return {
    importados,
    omitidos: total - importados,
    fallidos: rechazos.length,
    ...(rechazos.length > 0 ? { primerError: firebaseErrorMessage(rechazos[0].reason) } : {}),
  };
}

/** Guarda múltiples mediciones de una vez (para import CSV). */
export async function importarMediciones(
  items: MedicionInput[],
): Promise<Result<ImportResult>> {
  try {
    const results = await Promise.allSettled(items.map((item) => guardarMedicion(item)));
    const importados = results.filter((r) => r.status === "fulfilled").length;
    return ok({ importados, omitidos: items.length - importados });
  } catch (e) {
    return err(firebaseErrorMessage(e));
  }
}

/** Guarda múltiples sesiones de cardio de una vez. Idempotente si traen `_uuid` (P75). */
export async function importarCardio(
  items: (CardioInput & { _uuid?: string })[],
): Promise<Result<ImportResult>> {
  try {
    const results = await Promise.allSettled(items.map((item) => guardarCardio(item)));
    const importados = results.filter((r) => r.status === "fulfilled").length;
    return ok({ importados, omitidos: items.length - importados });
  } catch (e) {
    return err(firebaseErrorMessage(e));
  }
}

// ── RegistroSueno ─────────────────────────────────────────────────────────────

export type SuenoInput = Omit<RegistroSueno, "idSueno">;

export async function getRegistrosSueno(miembro: MiembroId): Promise<Result<RegistroSueno[]>> {
  try {
    const snap = await getDocs(
      query(collection(db, "sueno"), where("miembro", "==", miembro), orderBy("fecha", "desc")),
    );
    return ok(snap.docs.map((d) => d.data() as RegistroSueno));
  } catch (e) {
    return err(firebaseErrorMessage(e));
  }
}

export async function guardarSueno(data: SuenoInput): Promise<Result<RegistroSueno>> {
  try {
    const id = `SUE-${Date.now()}`;
    const reg: RegistroSueno = { ...data, idSueno: id };
    await setDoc(doc(db, "sueno", id), reg);
    return ok(reg);
  } catch (e) {
    return err(firebaseErrorMessage(e));
  }
}

/** Guarda múltiples registros de sueño (import CSV). Usa uuid como id si está disponible. */
export async function importarSueno(
  items: (SuenoInput & { _uuid?: string })[],
): Promise<Result<ImportResult>> {
  try {
    const results = await Promise.allSettled(
      items.map((item) => {
        const { _uuid, ...data } = item;
        const id = _uuid ? `SUE-${_uuid}` : `SUE-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        return setDoc(doc(db, "sueno", id), { ...data, idSueno: id }, { merge: false });
      }),
    );
    const importados = results.filter((r) => r.status === "fulfilled").length;
    return ok({ importados, omitidos: items.length - importados });
  } catch (e) {
    return err(firebaseErrorMessage(e));
  }
}

/** Import batch idempotente por uuid (setDoc con merge:false, ID = prefijo+uuid). */
export async function importarMedicionesIdempotente(
  items: (Omit<MedicionCorporal, "idMedicion" | "fechaCreacion"> & { _uuid?: string })[],
): Promise<Result<ImportResult>> {
  try {
    const results = await Promise.allSettled(
      items.map((item) => {
        const { _uuid, ...data } = item;
        const id = _uuid ? `MED-${_uuid}` : `MED-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        return setDoc(
          doc(db, "mediciones", id),
          { ...data, idMedicion: id, fechaCreacion: serverTimestamp() },
          { merge: false },
        );
      }),
    );
    return ok(resultadoDe(results, items.length));
  } catch (e) {
    return err(firebaseErrorMessage(e));
  }
}

/** Campos técnicos que el parser y el adaptador agregan y no se guardan tal cual. */
export type CardioImportable = Omit<SesionCardio, "idCardio" | "fechaCreacion"> & {
  _uuid?: string; _startMs?: number; _endMs?: number; _customId?: string;
  _fcMin?: number; _muestrasCurva?: number; _autoDetected?: boolean;
  _marcadaShapeUp?: boolean;
};

// Las marcas se derivan con el núcleo puro (ADR #009), que es el mismo que las
// vuelve a leer al filtrar.
export { marcasDe } from "../lib/actividadRelevante";

export async function importarCardioIdempotente(
  items: CardioImportable[],
): Promise<Result<ImportResult>> {
  try {
    const results = await Promise.allSettled(
      items.map((item) => {
        const {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          _uuid, _startMs, _endMs, _customId, _fcMin, _muestrasCurva,
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          _autoDetected, _marcadaShapeUp, ...data
        } = item;
        const id = idCardioDe(_uuid);
        const payload = {
          ...data, ...marcasDe(item),
          idCardio: id, fechaCreacion: serverTimestamp(),
        } as Record<string, unknown>;
        if (_startMs != null) payload.inicioMs = _startMs;
        if (_endMs   != null) payload.finMs    = _endMs;
        // P76a: la FC mínima venía del parser y del adaptador y se tiraba acá.
        if (_fcMin   != null) payload.fcMinima = _fcMin;
        return setDoc(doc(db, "cardio", id), payload, { merge: false });
      }),
    );
    return ok(resultadoDe(results, items.length));
  } catch (e) {
    return err(firebaseErrorMessage(e));
  }
}

// ── MetricaSalud ──────────────────────────────────────────────────────────────

/** Lee métricas de un miembro, opcionalmente filtradas por tipo. */
export async function getMetricasSalud(
  miembro: MiembroId,
  tipo?: TipoMetrica,
): Promise<Result<MetricaSalud[]>> {
  try {
    let q = query(
      collection(db, "metricas-salud"),
      where("miembro", "==", miembro),
      ...(tipo ? [where("tipo", "==", tipo)] : []),
      orderBy("fecha", "desc"),
    );
    const snap = await getDocs(q);
    return ok(snap.docs.map((d) => d.data() as MetricaSalud));
  } catch (e) {
    return err(firebaseErrorMessage(e));
  }
}

/**
 * Importa métricas genéricas de forma idempotente.
 * El idMetrica (`${miembro}-${tipo}-${fecha}`) actúa como ID del documento:
 * si ya existe, setDoc con merge:false lo reemplaza con los datos frescos.
 */
export async function importarMetricas(
  items: MetricaSalud[],
): Promise<Result<ImportResult>> {
  try {
    const results = await Promise.allSettled(
      items.map((item) =>
        setDoc(
          doc(db, "metricas-salud", item.idMetrica),
          { ...item, fechaCreacion: serverTimestamp() },
          { merge: false },
        ),
      ),
    );
    const importados = results.filter((r) => r.status === "fulfilled").length;
    return ok({ importados, omitidos: items.length - importados });
  } catch (e) {
    return err(firebaseErrorMessage(e));
  }
}
