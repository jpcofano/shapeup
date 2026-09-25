// data/configImport.ts — Lee /config/import (parámetros del import de salud, P75).
//
// El documento puede NO existir: la app nunca depende de que alguien lo siembre,
// y en ese caso se usan los defaults que viven en lib/importSelectivo.ts. Por eso
// esta función no devuelve error por documento ausente — solo por fallo de red.
//
// Se edita desde Perfil → Configuración (P86); antes, solo desde la consola.
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { ok, err, firebaseErrorMessage } from "../lib/result";
import type { Result } from "../lib/result";
import {
  ACTIVIDADES_SIEMPRE_RELEVANTES, DURACION_MIN_ACTIVIDAD_MIN,
  type ConfigClasificacion,
} from "../lib/importSelectivo";

export type ConfigImport = ConfigClasificacion;

/** Lo que se usa si `/config/import` no existe o viene incompleto. */
export const CONFIG_IMPORT_DEFAULT: ConfigImport = {
  duracionMinimaMin: DURACION_MIN_ACTIVIDAD_MIN,
  actividadesSiempreRelevantes: ACTIVIDADES_SIEMPRE_RELEVANTES,
};

let _cache: ConfigImport | null = null;

/** Tira la caché en memoria: la próxima lectura vuelve a Firestore. */
export function invalidarCacheConfigImport(): void {
  _cache = null;
}

/**
 * Normaliza campo por campo: un documento a medio completar no rompe nada, cada
 * campo ausente o con el tipo equivocado cae a su default por separado.
 */
function normalizar(data: Record<string, unknown> | undefined): ConfigImport {
  const dur = data?.duracionMinimaMin;
  const act = data?.actividadesSiempreRelevantes;
  return {
    duracionMinimaMin: typeof dur === "number" && Number.isFinite(dur) && dur >= 0
      ? dur
      : CONFIG_IMPORT_DEFAULT.duracionMinimaMin,
    actividadesSiempreRelevantes: Array.isArray(act) && act.every((a) => typeof a === "string")
      ? (act as string[])
      : CONFIG_IMPORT_DEFAULT.actividadesSiempreRelevantes,
  };
}

/** Parámetros del import. Cachea en memoria; sin documento, los defaults. */
export async function getConfigImport(): Promise<Result<ConfigImport>> {
  if (_cache) return ok(_cache);
  try {
    const snap = await getDoc(doc(db, "config", "import"));
    _cache = normalizar(snap.exists() ? (snap.data() as Record<string, unknown>) : undefined);
    return ok(_cache);
  } catch (e) {
    return err(firebaseErrorMessage(e));
  }
}

/**
 * Guarda los parámetros del import (P86: antes solo se cambiaban desde la
 * consola). Escribe el documento entero con los dos campos ya normalizados;
 * la caché queda con lo escrito.
 */
export async function setConfigImport(cfg: ConfigImport): Promise<Result<ConfigImport>> {
  const limpio = normalizar(cfg as unknown as Record<string, unknown>);
  try {
    await setDoc(doc(db, "config", "import"), limpio, { merge: true });
    _cache = limpio;
    return ok(limpio);
  } catch (e) {
    return err(firebaseErrorMessage(e));
  }
}
