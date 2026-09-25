// ════════════════════════════════════════════════════════════════════════════
//  data/ingestaSdk.ts — lee lo que sube el puente Android a
//  /ingesta-sdk/{uid}/registros (PU4).
//
//  El puente vuelca crudo y no interpreta nada. Acá solo se lee, se rearman los
//  registros partidos y se parsea el JSON; traducir es trabajo de
//  `lib/adaptadorSdk.ts`, que es puro.
//
//  El puente lee una ventana de 14 días, pero **lo que sube no se borra**: la
//  subcolección crece con cada actividad, para siempre.
//
//  ⚠ Paginación pendiente (P85). `leerRegistrosSdk` trae la subcolección
//  ENTERA. Al 25/09/2026 eran **130 documentos** en
//  /ingesta-sdk/{uid}/registros (el de juanpablo). Con la sincronización
//  automática esto corre solo cuando `/estado/puente.ultimaCorridaMs` avanzó
//  y pasaron 6 h (`lib/sincronizacionAutomatica`), así que sigue siendo barato.
//  Si el número crece un orden de magnitud, **ahí** se pagina — o se filtra por
//  fecha, si el puente empieza a escribir una.
// ════════════════════════════════════════════════════════════════════════════
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { ok, err, firebaseErrorMessage } from "../lib/result";
import type { Result } from "../lib/result";
import type { RegistroSdk } from "../lib/adaptadorSdk";

/** Sufijo que el puente le pone a las partes: `{id}__p1`, `{id}__p2`… */
const SUFIJO_PARTE = /__p\d+$/;

export interface LecturaSdk {
  registros: RegistroSdk[];
  /** Documentos leídos, partes incluidas. */
  documentos: number;
  /** Registros lógicos que venían partidos y se rearmaron bien. */
  rearmados: number;
  /** Registros que no se pudieron leer, con el motivo. */
  ilegibles: { id: string; motivo: string }[];
}

/** Lo que el puente deja en /ingesta-sdk/{uid}/estado/puente tras cada corrida. */
export interface EstadoPuente {
  ultimaCorridaMs?: number;
  versionPuente?: string;
  origen?: string;
  leidos?: number;
  subidos?: number;
  sinCambios?: number;
  omitidos?: number;
  errores?: number;
  duracionMs?: number;
  mensaje?: string;
}

interface DocRegistro {
  dataType?: string;
  crudo?: string;
  parte?: number;
  totalPartes?: number;
}

/**
 * Todos los registros del puente, con los partidos ya rearmados y el `crudo`
 * parseado.
 *
 * **Un JSON incompleto nunca se parsea**: si falta una parte, ese registro se
 * omite entero y se informa. Concatenar lo que hay daría un `JSON.parse` que
 * falla, o peor, que no falla y deja una sesión truncada.
 *
 * Un `crudo` ilegible no corta la corrida: se cuenta y se sigue con los demás.
 */
export async function leerRegistrosSdk(uid: string): Promise<Result<LecturaSdk>> {
  try {
    const snap = await getDocs(collection(db, "ingesta-sdk", uid, "registros"));

    const enteros: { id: string; doc: DocRegistro }[] = [];
    const partes = new Map<string, { id: string; doc: DocRegistro }[]>();

    for (const d of snap.docs) {
      const data = d.data() as DocRegistro;
      if (data.parte != null && data.totalPartes != null) {
        const base = d.id.replace(SUFIJO_PARTE, "");
        partes.set(base, [...(partes.get(base) ?? []), { id: d.id, doc: data }]);
      } else {
        enteros.push({ id: d.id, doc: data });
      }
    }

    const registros: RegistroSdk[] = [];
    const ilegibles: { id: string; motivo: string }[] = [];
    let rearmados = 0;

    for (const { id, doc: data } of enteros) {
      const crudo = parsear(data.crudo);
      if (crudo === undefined) { ilegibles.push({ id, motivo: "crudo ilegible" }); continue; }
      registros.push({ id, dataType: data.dataType ?? "?", crudo });
    }

    for (const [base, trozos] of partes) {
      const orden = [...trozos].sort((a, b) => (a.doc.parte ?? 0) - (b.doc.parte ?? 0));
      const total = orden[0].doc.totalPartes ?? 0;
      const completo = orden.length === total
        && orden.every((t, i) => t.doc.parte === i + 1);

      if (!completo) {
        const presentes = orden.map((t) => t.doc.parte).join(",");
        ilegibles.push({ id: base, motivo: `partido incompleto: ${orden.length}/${total} (partes ${presentes})` });
        continue;
      }

      const crudo = parsear(orden.map((t) => t.doc.crudo ?? "").join(""));
      if (crudo === undefined) { ilegibles.push({ id: base, motivo: "crudo rearmado ilegible" }); continue; }
      registros.push({ id: base, dataType: orden[0].doc.dataType ?? "?", crudo });
      rearmados++;
    }

    return ok({ registros, documentos: snap.size, rearmados, ilegibles });
  } catch (e) {
    return err(firebaseErrorMessage(e));
  }
}

/** Estado de la última corrida del puente. `null` si nunca corrió. */
export async function leerEstadoPuente(uid: string): Promise<Result<EstadoPuente | null>> {
  try {
    const snap = await getDoc(doc(db, "ingesta-sdk", uid, "estado", "puente"));
    return ok(snap.exists() ? (snap.data() as EstadoPuente) : null);
  } catch (e) {
    return err(firebaseErrorMessage(e));
  }
}

/** `undefined` si no se pudo parsear — nunca tira. */
function parsear(texto: string | undefined): unknown | undefined {
  if (!texto) return undefined;
  try {
    return JSON.parse(texto) as unknown;
  } catch {
    return undefined;
  }
}
