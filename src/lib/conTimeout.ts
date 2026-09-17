// ════════════════════════════════════════════════════════════════════════════
//  lib/conTimeout.ts — carrera entre una promesa y un timeout (P69).
//  Sin Firebase (ADR #009).
// ════════════════════════════════════════════════════════════════════════════

export type ResultadoTimeout<T> = { tipo: "ok"; valor: T } | { tipo: "timeout" };

/**
 * Resuelve con `{ tipo: "ok" }` si la promesa resuelve antes de `ms`, con
 * `{ tipo: "timeout" }` si vence antes, y rechaza si la promesa falla antes.
 * La promesa original sigue corriendo: el llamador decide qué hacer con su
 * resultado tardío. Un rechazo posterior al timeout no queda sin manejar.
 */
export function conTimeout<T>(promesa: Promise<T>, ms: number): Promise<ResultadoTimeout<T>> {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => resolve({ tipo: "timeout" }), ms);
    promesa.then(
      (valor) => { clearTimeout(id); resolve({ tipo: "ok", valor }); },
      (e: unknown) => { clearTimeout(id); reject(e); },
    );
  });
}
