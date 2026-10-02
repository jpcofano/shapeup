// ════════════════════════════════════════════════════════════════════════════
//  lib/curvaSuavizada.ts — el pico de la curva suavizada (P97).
//
//  La estimación de la FC máxima no mira el máximo crudo: un artefacto del
//  sensor de una o dos muestras lo movería. Mira el pico de una **media móvil
//  hacia atrás de 5 s**: para cada muestra, el promedio de las que cayeron en
//  los 5 s anteriores (ella incluida), y solo si hay al menos 4. Con la curva
//  de 1 muestra por segundo del reloj, un pico real de esfuerzo dura más que
//  eso, un salto suelto del sensor no.
//
//  Por qué 5 s y no más (medido con la sesión testigo del 27/09, máximo crudo
//  170, Samsung 169): 5 s → 168,5 · 10 s → 167,9 · 15 s → 167,4 · 30 s → 165,0.
//  Una ventana larga aplana el pico real y la estimación quedaría siempre por
//  debajo. Contra los artefactos más largos ya están las otras dos defensas: se
//  excluyen las sesiones con `fcDudosa`, y se usa el segundo pico, no el primero.
//
//  Se calcula al enriquecer, con la curva en memoria, y se guarda en
//  `biometria.fcPicoSuavizado`: la curva no se persiste (ADR #016).
//
//  Puro (ADR #009).
// ════════════════════════════════════════════════════════════════════════════
import type { LiveDataPoint } from "../import/samsungLiveData";

/** Largo de la media móvil (P97). */
export const VENTANA_SUAVIZADO_MS = 5_000;
/** Muestras mínimas dentro de la ventana para que el promedio cuente. */
export const MIN_MUESTRAS_SUAVIZADO = 4;

/**
 * El pico de la media móvil de `VENTANA_SUAVIZADO_MS`, redondeado a entero, o
 * `null` si ninguna ventana junta `MIN_MUESTRAS_SUAVIZADO` muestras.
 */
export function picoSuavizado(curva: LiveDataPoint[]): number | null {
  const pts = [...curva].sort((a, b) => a.ms - b.ms);
  let mejor: number | null = null;
  let desde = 0;
  let suma = 0;
  for (let i = 0; i < pts.length; i++) {
    suma += pts[i].fc;
    while (pts[i].ms - pts[desde].ms >= VENTANA_SUAVIZADO_MS) {
      suma -= pts[desde].fc;
      desde++;
    }
    const n = i - desde + 1;
    if (n >= MIN_MUESTRAS_SUAVIZADO) {
      const media = suma / n;
      if (mejor == null || media > mejor) mejor = media;
    }
  }
  return mejor == null ? null : Math.round(mejor);
}
