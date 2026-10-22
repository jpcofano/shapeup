// ════════════════════════════════════════════════════════════════════════════
//  scripts/contraste-tokens.ts — tabla de contraste WCAG de los tokens (P105).
//
//  Lee src/styles/tokens.css y src/styles/home-redux.css y escribe en la salida
//  estándar, en Markdown, la razón de contraste de los pares que importan: texto
//  y texto secundario sobre fondo y tarjeta, acento sobre tarjeta y texto sobre
//  el botón principal, para los 5 temas × claro y oscuro y para las dos
//  direcciones de Home. No toca Firestore ni escribe archivos.
//
//  Uso: npx tsx scripts/contraste-tokens.ts > salida.md
// ════════════════════════════════════════════════════════════════════════════
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { razonContraste, pasaAA, variablesDe, parsearColor } from "./lib/contraste";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const TOKENS = readFileSync(resolve(RAIZ, "src/styles/tokens.css"), "utf8");
const HOME = readFileSync(resolve(RAIZ, "src/styles/home-redux.css"), "utf8");
const TEMAS = ["ion", "volt", "blaze", "pulse", "indigo"] as const;

/** `color-mix(in srgb, A p%, B)` en sRGB, para la rampa de las direcciones. */
function mezclar(a: string, p: number, b: string): string {
  const x = parsearColor(a)!, y = parsearColor(b)!;
  const m = (u: number, v: number) => Math.round(u * p + v * (1 - p));
  return `#${[m(x.r, y.r), m(x.g, y.g), m(x.b, y.b)].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
}

/** Los valores efectivos de un tema y modo en la capa de la app, en el orden de la cascada. */
function efectivos(tema: string, modo: "dark" | "light"): Record<string, string> {
  return {
    ...variablesDe(TOKENS, ":root"),
    ...variablesDe(TOKENS, `[data-theme="${tema}"]`),
    ...variablesDe(TOKENS, `[data-mode="${modo}"]`),
    ...(modo === "light" ? variablesDe(TOKENS, `[data-theme="${tema}"][data-mode="light"]`) : {}),
  };
}

const PARES: [string, string, string, boolean][] = [
  // etiqueta, texto, fondo, ¿grande o componente?
  ["Texto / fondo", "fg", "bg", false],
  ["Texto / tarjeta", "fg", "card", false],
  ["Secundario / tarjeta", "muted", "card", false],
  ["Secundario / fondo", "muted", "bg", false],
  ["Acento / tarjeta (texto)", "accent", "card", false],
  ["Texto del botón / acento", "on-accent", "accent", false],
  ["Peligro / tarjeta", "danger", "card", false],
  ["Atención / tarjeta", "warning", "card", false],
  ["Info / tarjeta", "info", "card", false],
];

const celda = (r: number, grande: boolean) => `${r.toFixed(2).replace(".", ",")}${pasaAA(r, grande) ? "" : " ✗"}`;
const L: string[] = [];

L.push("### Capa de la app (`tokens.css`): 5 temas × claro y oscuro\n");
L.push("Razón de contraste; ✗ = no pasa AA para texto normal (4,5:1).\n");
const cols = TEMAS.flatMap((t) => [`${t} osc.`, `${t} claro`]);
L.push(`| Par | ${cols.join(" | ")} |`);
L.push(`|---|${cols.map(() => "---").join("|")}|`);
for (const [et, txt, fondo, grande] of PARES) {
  const fila = TEMAS.flatMap((t) => (["dark", "light"] as const).map((m) => {
    const v = efectivos(t, m);
    return celda(razonContraste(v[txt], v[fondo]), grande);
  }));
  L.push(`| ${et} | ${fila.join(" | ")} |`);
}

L.push("\n### Direcciones de Home (`home-redux.css`): Pulse (`.dir-a`) y Premium (`.dir-c`) × 5 acentos\n");
L.push("En la app solo alcanzan a Home y a la barra de navegación. «Acento atenuado» es `--accent-muted` (72 % del acento con el texto).\n");
const DIRS = [["Pulse", ".dir-a"], ["Premium", ".dir-c"]] as const;
const colsD = DIRS.flatMap(([n]) => (["osc.", "claro"] as const).map((m) => `${n} ${m}`));
L.push(`| Par | Acento | ${colsD.join(" | ")} |`);
L.push(`|---|---|${colsD.map(() => "---").join("|")}|`);
for (const t of TEMAS) {
  const acc = variablesDe(HOME, `[data-accent="${t}"]`);
  const filas: Record<string, string[]> = {};
  for (const [, sel] of DIRS) for (const m of ["dark", "light"] as const) {
    const v = variablesDe(HOME, `${sel}[data-mode="${m}"]`);
    const card = v.card?.startsWith("var(") ? v.surface : v.card;
    const accent = m === "dark" ? acc["acc-d"] : acc["acc-l"];
    const onAccent = m === "dark" ? "#0b0f14" : "#ffffff";
    const pares: [string, number][] = [
      ["Texto / fondo", razonContraste(v.fg, v.bg)],
      ["Secundario / tarjeta", razonContraste(v.muted, card)],
      ["Acento / tarjeta", razonContraste(accent, card)],
      ["Acento atenuado / tarjeta", razonContraste(mezclar(accent, 0.72, v.fg), card)],
      ["Texto del botón / acento", razonContraste(onAccent, accent)],
    ];
    for (const [et, r] of pares) (filas[et] ??= []).push(celda(r, false));
  }
  for (const [et, celdas] of Object.entries(filas)) L.push(`| ${et} | ${t} | ${celdas.join(" | ")} |`);
}

console.log(L.join("\n"));
