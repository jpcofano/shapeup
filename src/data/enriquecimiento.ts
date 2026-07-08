// ════════════════════════════════════════════════════════════════════════════
//  data/enriquecimiento.ts — orquestador del match biométrico post-import.
//
//  ADR #009: acá vive la parte que toca Firestore (client SDK). El cálculo
//  puro está en lib/enriquecerImport.ts — separados a propósito (hotfix P55:
//  antes convivían en el mismo archivo de lib/ y un script bajo tsx que solo
//  quería el cálculo puro terminaba arrastrando el SDK cliente igual).
// ════════════════════════════════════════════════════════════════════════════

import type { MiembroId } from "../types/models";
import type { ZipExtraccion } from "../import/samsungZip";
import { calcularEnriquecimiento, type ResultadoEnriquecimiento } from "../lib/enriquecerImport";
import { getHistorialMiembro, enriquecerHistorial } from "./historial";
import { getPerfiles } from "./perfiles";
import { ok, err } from "../lib/result";
import type { Result } from "../lib/result";

/**
 * Lee el historial del miembro, calcula el enriquecimiento y aplica los updates.
 * Los errores parciales (una escritura fallida) no cancelan el resto.
 */
export async function enriquecerTrasImport(
  miembro: MiembroId,
  extraccion: ZipExtraccion,
): Promise<Result<ResultadoEnriquecimiento>> {
  const [histRes, perfRes] = await Promise.all([
    getHistorialMiembro(miembro),
    getPerfiles(),
  ]);

  if (!histRes.ok) return err(histRes.error);

  const perfil = perfRes.ok ? perfRes.value[miembro] : undefined;
  const resultado = calcularEnriquecimiento(histRes.value, extraccion, perfil);

  if (resultado.updates.length === 0) return ok(resultado);

  const escrituras = await Promise.allSettled(
    resultado.updates.map(({ idHist, biometria, bloques }) =>
      enriquecerHistorial(idHist, biometria, bloques),
    ),
  );

  // Contar errores: restar de matcheadas
  const errores = escrituras.filter((r) => r.status === "rejected").length;
  resultado.matcheadas -= errores;

  return ok(resultado);
}
