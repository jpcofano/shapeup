// ════════════════════════════════════════════════════════════════════════════
//  import/samsungLiveData.ts — parser del JSON de curva fina de FC
//
//  Origen: archivo live_data.json dentro del ZIP de Samsung Health,
//  ruta: jsons/com.samsung.shealth.exercise/<datauuid>.live_data.json
//  Formato verificado: array de { "heart_rate": 99.0, "start_time": 1780356821758 }
//  ~1 muestra por segundo, epoch ms, mismo reloj que la fila exercise.
// ════════════════════════════════════════════════════════════════════════════

export interface LiveDataPoint {
  /** Epoch ms (mismo reloj que start_time de la fila exercise). */
  ms: number;
  /** FC en bpm. */
  fc: number;
}

/**
 * Parsea el JSON de curva fina de FC de Samsung Health.
 * Filtra muestras sin heart_rate, ordena por tiempo ascendente.
 * Nunca lanza: devuelve [] si el input es inválido.
 */
export function parsearLiveData(json: unknown): LiveDataPoint[] {
  if (!Array.isArray(json)) return [];
  const result: LiveDataPoint[] = [];
  for (const item of json) {
    if (
      typeof item === "object" &&
      item !== null &&
      typeof (item as Record<string, unknown>).heart_rate === "number" &&
      typeof (item as Record<string, unknown>).start_time === "number"
    ) {
      const { heart_rate, start_time } = item as { heart_rate: number; start_time: number };
      if (heart_rate > 0) result.push({ ms: start_time, fc: heart_rate });
    }
  }
  return result.sort((a, b) => a.ms - b.ms);
}
