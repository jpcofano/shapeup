// data/perfiles.ts — Lee y escribe /config/perfiles (PerfilesConfig de models.ts).
//
// El documento es UNO SOLO y compartido por los cuatro miembros: cada escritura
// toca exclusivamente la clave del miembro que edita (setDoc + merge), nunca el
// documento entero. Pisar el documento borraría el perfil de los demás.
import { doc, getDoc, setDoc, FieldValue } from "firebase/firestore";
import { db } from "../firebase";
import type { MiembroId, PerfilesConfig, PerfilMiembro } from "../types/models";
import { ok, err, firebaseErrorMessage } from "../lib/result";
import type { Result } from "../lib/result";

let _cache: PerfilesConfig | null = null;

/** Devuelve PerfilesConfig (equipo, objetivos, color, zonasFC por miembro). Cachea en memoria. */
export async function getPerfiles(): Promise<Result<PerfilesConfig>> {
  if (_cache) return ok(_cache);
  try {
    const snap = await getDoc(doc(db, "config", "perfiles"));
    _cache = snap.exists() ? (snap.data() as PerfilesConfig) : {};
    return ok(_cache);
  } catch (e) {
    return err(firebaseErrorMessage(e));
  }
}

/** Tira la caché en memoria: la próxima lectura vuelve a Firestore. */
export function invalidarCachePerfiles(): void {
  _cache = null;
}

/**
 * Patch de perfil: cada campo lleva su valor, o un `deleteField()` para sacarlo
 * (p. ej. `equipoDisponible` una vez migrado a `equipoPorLugar`).
 */
export type PatchPerfil = { [K in keyof PerfilMiembro]?: PerfilMiembro[K] | FieldValue };

/** Un `deleteField()` en el patch: en la caché local significa "sacar la clave". */
function esBorrado(v: unknown): boolean {
  return typeof FieldValue === "function" && v instanceof FieldValue;
}

/** Aplica el patch sobre el perfil cacheado, resolviendo los borrados de campo. */
function aplicarPatchLocal(
  base: PerfilMiembro | undefined,
  patch: PatchPerfil,
): PerfilMiembro {
  const out: Record<string, unknown> = { ...(base ?? {}) };
  for (const [clave, valor] of Object.entries(patch)) {
    if (esBorrado(valor)) delete out[clave];
    else out[clave] = valor;
  }
  return out as PerfilMiembro;
}

/**
 * Escribe el perfil de UN miembro. `patch` es parcial: solo los campos que
 * manda se tocan. Para borrar un campo (p. ej. `equipoDisponible` después de
 * migrar a `equipoPorLugar`) se manda `deleteField()` como valor.
 */
export async function actualizarPerfil(
  miembro: MiembroId,
  patch: PatchPerfil,
): Promise<Result<void>> {
  try {
    await setDoc(doc(db, "config", "perfiles"), { [miembro]: patch }, { merge: true });
  } catch (e) {
    return err(firebaseErrorMessage(e));
  }
  // La caché se rehace con lo escrito: la UI no necesita releer para verse al día.
  const previo = _cache;
  _cache = { ...(previo ?? {}), [miembro]: aplicarPatchLocal(previo?.[miembro], patch) };
  return ok(undefined);
}
