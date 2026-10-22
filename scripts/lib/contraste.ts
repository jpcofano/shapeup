// ════════════════════════════════════════════════════════════════════════════
//  scripts/lib/contraste.ts — contraste WCAG 2.x entre dos colores (P105).
//  Puro: lo usa scripts/contraste-tokens.ts para el diagnóstico de diseño.
//  Entiende #rgb, #rrggbb y rgba(r,g,b,a); un color con transparencia se
//  compone sobre el fondo antes de medir, como lo vería el ojo.
// ════════════════════════════════════════════════════════════════════════════

export interface Rgba { r: number; g: number; b: number; a: number }

/** `#rgb`, `#rrggbb` o `rgb(a)(r, g, b[, a])` → componentes 0–255 y alfa 0–1. `null` si no lo entiende. */
export function parsearColor(c: string): Rgba | null {
  const s = c.trim().toLowerCase();
  const hex = s.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/);
  if (hex) {
    const h = hex[1].length === 3 ? hex[1].split("").map((x) => x + x).join("") : hex[1];
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16), a: 1 };
  }
  const rgb = s.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/);
  if (rgb) return { r: +rgb[1], g: +rgb[2], b: +rgb[3], a: rgb[4] != null ? +rgb[4] : 1 };
  return null;
}

/** Compone `arriba` (con su alfa) sobre `abajo` (opaco). */
export function componer(arriba: Rgba, abajo: Rgba): Rgba {
  const m = (x: number, y: number) => Math.round(x * arriba.a + y * (1 - arriba.a));
  return { r: m(arriba.r, abajo.r), g: m(arriba.g, abajo.g), b: m(arriba.b, abajo.b), a: 1 };
}

/** Luminancia relativa (WCAG 2.x). */
export function luminancia({ r, g, b }: Rgba): number {
  const canal = (v: number) => { const x = v / 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
}

/** Razón de contraste de `texto` sobre `fondo`, con dos decimales. El fondo se toma opaco. */
export function razonContraste(texto: string, fondo: string): number {
  const f = parsearColor(fondo), t = parsearColor(texto);
  if (!f || !t) throw new Error(`color que no se entiende: ${!f ? fondo : texto}`);
  const tt = t.a < 1 ? componer(t, f) : t;
  const [a, b] = [luminancia(tt), luminancia({ ...f, a: 1 })].sort((x, y) => y - x);
  return Math.round(((a + 0.05) / (b + 0.05)) * 100) / 100;
}

/** AA: 4,5 para texto normal; 3 para texto grande y componentes. */
export function pasaAA(razon: number, grande = false): boolean {
  return razon >= (grande ? 3 : 4.5);
}

/**
 * Las variables de un bloque CSS `selector { … }` (la primera vez que aparece
 * el selector exacto al principio de una línea).
 */
export function variablesDe(css: string, selector: string): Record<string, string> {
  const esc = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const m = css.match(new RegExp(`(?:^|\\n)${esc}\\s*\\{([^}]*)\\}`));
  if (!m) return {};
  const out: Record<string, string> = {};
  for (const [, k, v] of m[1].matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)) out[k] = v.trim();
  return out;
}
