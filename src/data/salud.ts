// ════════════════════════════════════════════════════════════════════════════
//  data/salud.ts — CRUD para /mediciones y /cardio.
//  Soporta carga manual y marcado de fuente (samsung-health-csv | manual).
// ════════════════════════════════════════════════════════════════════════════
import {
  collection, doc, getDocs, setDoc, deleteDoc,
  query, where, orderBy, serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import type {
  MedicionCorporal, SesionCardio, RegistroSueno,
  MetricaSalud, TipoMetrica,
  MiembroId, FuenteDato, FirestoreTimestamp,
} from "../types/models";
import { ok, err, firebaseErrorMessage } from "../lib/result";
import type { Result } from "../lib/result";

function idMedicion(): string { return `MED-${Date.now()}`; }
function idCardio():   string { return `CAR-${Date.now()}`; }

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

export async function getSesionesCardio(miembro: MiembroId): Promise<Result<SesionCardio[]>> {
  try {
    const snap = await getDocs(
      query(collection(db, "cardio"), where("miembro", "==", miembro), orderBy("fecha", "desc")),
    );
    return ok(snap.docs.map((d) => d.data() as SesionCardio));
  } catch (e) {
    return err(firebaseErrorMessage(e));
  }
}

export async function guardarCardio(data: CardioInput): Promise<Result<SesionCardio>> {
  try {
    const id  = idCardio();
    const ses: SesionCardio = {
      ...data,
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

/** Resultado de un import batch resiliente. */
export interface ImportResult { importados: number; omitidos: number; }

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

/** Guarda múltiples sesiones de cardio de una vez. */
export async function importarCardio(
  items: CardioInput[],
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
    const importados = results.filter((r) => r.status === "fulfilled").length;
    return ok({ importados, omitidos: items.length - importados });
  } catch (e) {
    return err(firebaseErrorMessage(e));
  }
}

export async function importarCardioIdempotente(
  items: (Omit<SesionCardio, "idCardio" | "fechaCreacion"> & {
    _uuid?: string; _startMs?: number; _endMs?: number; _customId?: string; _fcMin?: number;
  })[],
): Promise<Result<ImportResult>> {
  try {
    const results = await Promise.allSettled(
      items.map((item) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { _uuid, _startMs, _endMs, _customId, _fcMin, ...data } = item;
        const id = _uuid ? `CAR-${_uuid}` : `CAR-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const payload = { ...data, idCardio: id, fechaCreacion: serverTimestamp() } as Record<string, unknown>;
        if (_startMs != null) payload.inicioMs = _startMs;
        if (_endMs   != null) payload.finMs    = _endMs;
        return setDoc(doc(db, "cardio", id), payload, { merge: false });
      }),
    );
    const importados = results.filter((r) => r.status === "fulfilled").length;
    return ok({ importados, omitidos: items.length - importados });
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
