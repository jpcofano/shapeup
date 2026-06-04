import type { MiembroId, FamiliaConfig } from "../types/models";

/**
 * Lógica pura: busca el memberId del email en el mapa de miembros.
 * Sin imports de Firebase — testeable en cualquier entorno sin .env.
 */
export function findMemberByEmail(
  miembros: FamiliaConfig["miembros"],
  email: string,
): MiembroId | null {
  const normalized = email.toLowerCase();
  for (const [id, m] of Object.entries(miembros)) {
    if (m.mails.some((mail) => mail.toLowerCase() === normalized)) {
      return id as MiembroId;
    }
  }
  return null;
}
