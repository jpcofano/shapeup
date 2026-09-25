// ════════════════════════════════════════════════════════════════════════════
//  lib/idsSalud.ts — ids determinísticos de salud, sin Firebase (P84).
//
//  Vivía en `data/salud.ts`, que inicializa Firebase al cargar: cualquier test
//  que la importara necesitaba `.env.local` para arrancar, y sin él el archivo
//  entero no cargaba con un error que no decía qué faltaba.
// ════════════════════════════════════════════════════════════════════════════

/**
 * Id de una sesión de cardio (P75). Con `datauuid` de Samsung es
 * determinístico — reimportar el mismo ZIP pisa la fila en vez de duplicarla.
 * Sin uuid (carga manual) se genera uno único: el sufijo aleatorio evita que
 * dos items guardados en el mismo milisegundo se pisen entre sí.
 */
export function idCardioDe(datauuid?: string): string {
  return datauuid
    ? `CAR-${datauuid}`
    : `CAR-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
