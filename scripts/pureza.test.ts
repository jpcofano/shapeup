// ════════════════════════════════════════════════════════════════════════════
//  scripts/pureza.test.ts — guarda estática: los scripts de admin nunca deben
//  importar (ni transitivamente) src/data/ ni src/firebase.ts.
//
//  Motivo (hotfix P55): scripts/rematch-salud.ts importaba lib/enriquecerImport.ts,
//  que en ese momento traía adentro un orquestador que importaba data/historial.ts
//  y data/perfiles.ts → esos importan src/firebase.ts, que lee
//  `import.meta.env.VITE_FIREBASE_API_KEY`. Bajo tsx (Node puro, sin Vite)
//  `import.meta.env` es `undefined` → crash al cargar el módulo, antes de
//  ejecutar una sola línea del script.
//
//  Esto no se puede reproducir corriendo el mismo import bajo vitest (Vite sí
//  define `import.meta.env`, aunque las variables no estén seteadas) — por
//  eso el chequeo es estático: recorre el grafo de imports en disco, no lo
//  ejecuta. Los scripts deben hablar con Firestore vía firebase-admin
//  directo, nunca vía src/data/ (que usa el SDK cliente).
// ════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "fs";
import { resolve, dirname, join } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT  = resolve(__dir, "..");

const PROHIBIDOS = [
  { patron: /[\\/]src[\\/]firebase\.ts$/, etiqueta: "src/firebase.ts (SDK cliente)" },
  { patron: /[\\/]src[\\/]data[\\/]/,     etiqueta: "src/data/ (orquestación con SDK cliente)" },
];

// import/export ... from "especificador" — captura si es "type" (no ejecuta en runtime)
const IMPORT_RE = /(?:import|export)\s+(type\s+)?[^'"]*from\s+["']([^"']+)["']/g;

function extraerEspecificadores(contenido: string): { spec: string; soloTipo: boolean }[] {
  const out: { spec: string; soloTipo: boolean }[] = [];
  let m: RegExpExecArray | null;
  IMPORT_RE.lastIndex = 0;
  while ((m = IMPORT_RE.exec(contenido))) {
    out.push({ spec: m[2], soloTipo: !!m[1] });
  }
  return out;
}

/** Resuelve un especificador relativo a un archivo .ts/.tsx real, o null si es un paquete externo. */
function resolverModulo(desdeArchivo: string, spec: string): string | null {
  if (!spec.startsWith(".")) return null; // paquete externo (node_modules) — no nos interesa
  const base = resolve(dirname(desdeArchivo), spec);
  for (const candidato of [base, `${base}.ts`, `${base}.tsx`, join(base, "index.ts")]) {
    try {
      if (statSync(candidato).isFile()) return candidato;
    } catch { /* no existe, probar siguiente candidato */ }
  }
  return null;
}

/** BFS del grafo de imports en runtime (ignora import type) a partir de un archivo. */
function grafoDeImports(entrada: string): string[] {
  const visitados = new Set<string>();
  const pila = [entrada];
  while (pila.length > 0) {
    const actual = pila.pop()!;
    if (visitados.has(actual)) continue;
    visitados.add(actual);
    let contenido: string;
    try {
      contenido = readFileSync(actual, "utf8");
    } catch {
      continue;
    }
    for (const { spec, soloTipo } of extraerEspecificadores(contenido)) {
      if (soloTipo) continue; // "import type" se borra en runtime — no arrastra el módulo
      const resuelto = resolverModulo(actual, spec);
      if (resuelto && !visitados.has(resuelto)) pila.push(resuelto);
    }
  }
  return [...visitados];
}

const scriptsRaiz = readdirSync(resolve(ROOT, "scripts"))
  .filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts"))
  .map((f) => resolve(ROOT, "scripts", f));

describe("scripts/*.ts — pureza (nunca src/data ni src/firebase, ni transitivamente)", () => {
  it("hay scripts para chequear (guarda contra un glob roto)", () => {
    expect(scriptsRaiz.length).toBeGreaterThan(5);
  });

  for (const script of scriptsRaiz) {
    const nombre = script.split(/[\\/]/).pop();
    it(`${nombre} no arrastra módulos impuros`, () => {
      const alcanzados = grafoDeImports(script);
      for (const { patron, etiqueta } of PROHIBIDOS) {
        const ofensor = alcanzados.find((a) => patron.test(a));
        expect(
          ofensor,
          ofensor
            ? `${nombre} arrastra ${etiqueta} vía: ${ofensor.replace(ROOT, "")}`
            : undefined,
        ).toBeUndefined();
      }
    });
  }
});
