// ════════════════════════════════════════════════════════════════════════════
//  lib/pasoImport.ts — un paso de escritura del import que dice la verdad
//  (P76b; es el mismo criterio que P76a le aplicó al puente).
//
//  Cuatro salidas posibles, y ninguna se puede confundir con otra:
//    · escribió           → `escritos` es lo que confirmó el servidor
//    · quedó en cola      → venció el timeout; se sube cuando haya señal (P69)
//    · falló entero       → `error`
//    · falló por documento→ `error`, aunque el batch haya devuelto `ok`
//
//  El caso que esto vino a evitar: con caché persistente, la promesa de una
//  escritura no resuelve hasta que el servidor confirma. Sin timeout, el import
//  del ZIP se quedó esperando para siempre — ni mensaje, ni error, ni
//  documentos, y la pantalla anunciando que iba a escribir 2257 entradas.
//
//  Núcleo puro (ADR #009): recibe la escritura como función, no toca Firebase.
// ════════════════════════════════════════════════════════════════════════════

import { conTimeout } from "./conTimeout";
import { firebaseErrorMessage } from "./result";
import type { Result } from "./result";

/** Si el servidor no confirma en este tiempo, el paso queda "en cola" (P69). */
export const TIMEOUT_PASO_IMPORT_MS = 8000;

/** Lo que un import batch devuelve. Igual que `ImportResult` de `data/salud`. */
export interface ResultadoBatch {
  importados: number;
  omitidos: number;
  fallidos?: number;
  primerError?: string;
}

/** Lo que pasó con un paso de escritura del import. */
export interface PasoImport {
  nombre: string;
  /** Documentos efectivamente escritos. Si quedó en cola, lo que se encoló. */
  escritos: number;
  enCola: boolean;
  error?: string;
}

/**
 * Corre un paso de escritura contra el timeout y normaliza sus cuatro salidas.
 *
 * `op` es una función y no una promesa a propósito: con `total` en 0 no se
 * llama a nada —ni siquiera se arma la escritura vacía— y el paso queda en
 * cero, sin inventar un éxito.
 */
export async function correrPaso(
  nombre: string,
  op: () => Promise<Result<ResultadoBatch>>,
  total: number,
  ms: number = TIMEOUT_PASO_IMPORT_MS,
): Promise<PasoImport> {
  if (total === 0) return { nombre, escritos: 0, enCola: false };
  try {
    const r = await conTimeout(op(), ms);
    if (r.tipo === "timeout") return { nombre, escritos: total, enCola: true };
    if (!r.valor.ok) return { nombre, escritos: 0, enCola: false, error: r.valor.error };
    const { importados, fallidos, primerError } = r.valor.value;
    return {
      nombre, escritos: importados, enCola: false,
      // Un rechazo por documento ya no se cuenta como "omitido" y se calla.
      ...(fallidos ? { error: `${fallidos} de ${total} no se guardaron. ${primerError ?? ""}`.trim() } : {}),
    };
  } catch (e) {
    return { nombre, escritos: 0, enCola: false, error: firebaseErrorMessage(e) };
  }
}

/**
 * El mensaje de un import a partir de sus pasos: lo escrito, lo que falló y lo
 * que quedó en cola. Nada se deshace — todos los ids son determinísticos y
 * reintentar es seguro, así que alcanza con decir qué pasó.
 */
export function resumirPasos(pasos: PasoImport[]): {
  escritos: number; fallados: PasoImport[]; enCola: PasoImport[]; sufijo: string;
} {
  const escritos = pasos.reduce((acc, p) => acc + p.escritos, 0);
  const fallados = pasos.filter((p) => p.error);
  const enCola   = pasos.filter((p) => p.enCola);

  let sufijo = "";
  // Escritura parcial: se dice qué quedó guardado y qué no.
  if (escritos > 0 && fallados.length > 0) {
    sufijo += ` ⚠ Falló ${fallados.map((p) => `${p.nombre} (${p.error})`).join(", ")}.`;
  }
  if (enCola.length > 0) {
    sufijo += ` ⏳ ${enCola.map((p) => p.nombre).join(", ")}: quedó en cola, se sube cuando haya señal.`;
  }
  return { escritos, fallados, enCola, sufijo };
}
