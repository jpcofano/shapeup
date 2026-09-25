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

// ════════════════════════════════════════════════════════════════════════════
//  P87 — todo script que importe firebase-admin corre con scripts/lib/corrida.ts.
//
//  Motivo: un import faltante en corregir-ventanas-vr.ts llegó hasta el momento
//  de escribir en producción, y la revisión mostró scripts que contaban antes de
//  confirmar, salían con 0 tras fallar y decían "escritas" en simulación.
//  corrida.ts garantiza lo mismo para todos: respaldo antes de escribir, una
//  línea final con lo escrito de verdad, código 1 si algo falló.
//
//  Quien tenga un motivo para no usarlo lo declara, con el motivo escrito:
//    // corrida: exento — <por qué, en al menos 10 caracteres>
//  Un test que se puede saltear sin decirlo no sirve.
// ════════════════════════════════════════════════════════════════════════════

/** Un import real de firebase-admin (no un comentario que lo nombra). */
const IMPORTA_ADMIN_RE = /^\s*import\b[^;]*from\s+["']firebase-admin(?:\/[^"']*)?["']/m;
const IMPORTA_CORRIDA_RE = /^\s*import\b[^;]*from\s+["']\.\/lib\/corrida["']/m;
const LLAMA_CORRIDA_RE = /\b(?:correr|crearCorrida)\s*\(/;
export const EXENTO_RE = /^\s*\/\/\s*corrida:\s*exento\s*[—–-]\s*(\S.{9,})$/m;

describe("scripts con firebase-admin usan corrida.ts, o dicen por qué no (P87)", () => {
  const conAdmin = scriptsRaiz.filter((s) => IMPORTA_ADMIN_RE.test(readFileSync(s, "utf8")));

  it("hay scripts con firebase-admin para chequear (guarda contra una regex rota)", () => {
    expect(conAdmin.length).toBeGreaterThan(5);
  });

  for (const script of conAdmin) {
    const nombre = script.split(/[\\/]/).pop();
    it(`${nombre} usa corrida.ts o declara la excepción`, () => {
      const contenido = readFileSync(script, "utf8");
      const usa = IMPORTA_CORRIDA_RE.test(contenido) && LLAMA_CORRIDA_RE.test(contenido);
      const exento = EXENTO_RE.test(contenido);
      expect(
        usa || exento,
        `${nombre} importa firebase-admin pero no corre con scripts/lib/corrida.ts ` +
        `ni declara "// corrida: exento — <motivo>"`,
      ).toBe(true);
    });
  }

  it("la excepción exige un motivo escrito", () => {
    expect(EXENTO_RE.test("// corrida: exento — solo lectura, no escribe")).toBe(true);
    expect(EXENTO_RE.test("// corrida: exento")).toBe(false);
    expect(EXENTO_RE.test("// corrida: exento — ok")).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  P87 — los scripts migrados no dicen "escrit…" por su cuenta.
//
//  corrida.ts garantiza que en simulación nunca aparece "escritas": lo que se
//  escribió de verdad lo cuenta y lo dice el helper, en su línea final. Un
//  `console.log("… escritas")` propio del script saltearía esa garantía — y es
//  exactamente como mentían seed-vr y seed-salud-rutinas. También cuentan las
//  etiquetas de `escribir`/`omitir`, porque el helper las imprime tal cual.
// ════════════════════════════════════════════════════════════════════════════

/** Llamadas que imprimen: su contenido, hasta el `);` que las cierra. */
const IMPRIME_RE = /(?:console\.(?:log|error|warn|info)|process\.stdout\.write|\.(?:escribir|omitir))\s*\(([\s\S]*?)\);/g;

export function imprimeEscrit(contenido: string): string | null {
  IMPRIME_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = IMPRIME_RE.exec(contenido))) {
    // Solo lo que va entre comillas o backticks: el texto que se imprime.
    const textos = m[1].match(/(["'`])(?:\\.|(?!\1)[\s\S])*\1/g) ?? [];
    const culpable = textos.find((t) => /escrit/i.test(t));
    if (culpable) return culpable;
  }
  return null;
}

describe("los scripts migrados no imprimen 'escrit…' por su cuenta (P87)", () => {
  const migrados = scriptsRaiz.filter((s) => {
    const c = readFileSync(s, "utf8");
    return IMPORTA_CORRIDA_RE.test(c) && LLAMA_CORRIDA_RE.test(c);
  });

  it("hay scripts migrados para chequear", () => {
    expect(migrados.length).toBeGreaterThanOrEqual(8);
  });

  for (const script of migrados) {
    const nombre = script.split(/[\\/]/).pop();
    it(`${nombre} deja que "escritas" lo diga corrida.ts`, () => {
      const culpable = imprimeEscrit(readFileSync(script, "utf8"));
      expect(culpable, `${nombre} imprime ${culpable} por su cuenta`).toBeNull();
    });
  }

  it("el chequeo agarra los casos que mentían", () => {
    expect(imprimeEscrit('console.log(`\n  Escritas: ${n}  Saltadas: ${s}\n`);')).not.toBeNull();
    expect(imprimeEscrit('console.log(\n  "✅ " + n + " escritos",\n);')).not.toBeNull();
    expect(imprimeEscrit('await c.escribir("escrita H-1", () => x());')).not.toBeNull();
    expect(imprimeEscrit('console.log("Nada para persistir.");')).toBeNull();
    // El nombre de una función no es texto impreso.
    expect(imprimeEscrit("await c.escribir(id, () => ref.update(x));")).toBeNull();
  });
});
