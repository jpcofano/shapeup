/** Y-M-D en hora LOCAL (sin corrimiento UTC de toISOString). */
export function ymdLocal(d: Date = new Date()): string {
  const y   = d.getFullYear();
  const m   = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Lunes de la semana de `ref`, como Y-M-D local.
 * Acepta Date o "YYYY-MM-DD" (se parsea como medianoche local, no UTC).
 */
export function lunesDeSemana(ref: Date | string = new Date()): string {
  const d = typeof ref === "string" ? new Date(ref + "T00:00:00") : new Date(ref);
  const dow  = d.getDay();                  // local
  const diff = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + diff);
  return ymdLocal(d);
}
