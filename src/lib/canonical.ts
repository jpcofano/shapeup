/**
 * Normaliza texto para búsqueda y detección de duplicados:
 * minúsculas, sin acentos, espacios colapsados.
 */
export function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
