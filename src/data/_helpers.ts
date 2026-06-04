import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

/**
 * Calcula el próximo ID secuencial en una colección Firestore.
 * Ej: documentos "RUT-0001".."RUT-0042" → devuelve "RUT-0043".
 * Solo lee IDs (no documentos completos), así que es barato.
 */
export async function proximoId(
  colPath: string,
  prefix: string,
): Promise<string> {
  const snap = await getDocs(collection(db, colPath));
  const regex = new RegExp(`^${prefix}-(\\d{4})$`);
  let max = 0;
  snap.forEach((d) => {
    const m = d.id.match(regex);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  });
  return `${prefix}-${String(max + 1).padStart(4, "0")}`;
}
