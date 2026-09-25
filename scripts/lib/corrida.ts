// ════════════════════════════════════════════════════════════════════════════
//  scripts/lib/corrida.ts — un solo lugar para correr y contar (P87).
//
//  Todo script que escribe en Firestore lo usa. Existe porque un script sin UI
//  y sin nadie mirando tiene una sola forma de avisar qué hizo: lo que imprime.
//  Y cada script lo imprimía a su manera — algunos contaban antes de confirmar,
//  otros cortaban en la primera falla sin decir qué ya había entrado, y dos
//  decían "escritas" en simulación. Una simulación que miente da confianza
//  para aplicar.
//
//  Lo que garantiza, para todos por igual:
//
//  - **Simulación por defecto**, `--aplicar` escribe. En simulación no se llama
//    a ninguna escritura, y la palabra "escritas" no sale nunca de acá: se
//    dice "se escribirían".
//  - **Respaldo antes de tocar Firestore.** En modo aplicar, `escribir` exige
//    que antes se haya abierto el respaldo, o que el script declare con
//    `sinRespaldo(motivo)` por qué no hace falta (p. ej. un seed que no pisa
//    nada). Si el respaldo no se puede escribir, no se escribe nada.
//  - **Cada escritura se cuenta cuando el servidor la confirma**, y una falla
//    no corta las demás.
//  - **Una línea final, siempre** —también si el script explota a mitad—, y
//    código de salida 1 si algo falló.
//
//  Uso:
//    correr("nombre", async (c) => {
//      // ...leer y planificar...
//      if (!c.abrirRespaldo(loQueSePisa)) return;       // o c.sinRespaldo("motivo")
//      for (const x of plan) await c.escribir(x.id, () => ref.update(...));
//    });
// ════════════════════════════════════════════════════════════════════════════
import { mkdirSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
/** docs/auditorias/, que git ignora. */
export const DIR_RESPALDOS = resolve(__dir, "..", "..", "docs", "auditorias");

export type Modo = "simulacion" | "aplicar";

export interface OpcionesCorrida {
  /** Aparece en el nombre del respaldo: `respaldo-{nombre}-{fecha}.json`. */
  nombre: string;
  argv?: string[];
  /**
   * Flags que pasan a modo aplicar. Por defecto solo `--aplicar`; un script
   * con un flag histórico documentado (p. ej. `--confirmar`) lo suma acá.
   */
  flagsAplicar?: string[];
  /** Inyectables para los tests. */
  log?: (linea: string) => void;
  escribirArchivo?: (ruta: string, contenido: string) => void;
  dirRespaldos?: string;
  ahora?: () => Date;
}

export interface Corrida {
  readonly modo: Modo;
  readonly aplicar: boolean;
  /**
   * Escribe el respaldo con `datos` (lo que se va a pisar). En simulación no
   * escribe nada y devuelve `true`. Si falla, la corrida queda bloqueada: ninguna
   * escritura posterior toca Firestore, y el resumen sale con código 1.
   */
  abrirRespaldo(datos: unknown): boolean;
  /** Declara que esta corrida no necesita respaldo, y por qué. */
  sinRespaldo(motivo: string): void;
  /**
   * Una escritura (o una tanda: `cantidad` = documentos que confirma). En
   * simulación no llama a `fn`. Devuelve si quedó escrita (o se escribiría).
   */
  escribir(id: string, fn: () => Promise<unknown>, cantidad?: number): Promise<boolean>;
  /** Algo que se decidió no escribir. */
  omitir(id: string, motivo?: string, cantidad?: number): void;
  /** La línea final. Devuelve el código de salida. */
  resumen(): number;
}

export function crearCorrida(op: OpcionesCorrida): Corrida {
  const argv = op.argv ?? process.argv.slice(2);
  const flags = op.flagsAplicar ?? ["--aplicar"];
  const modo: Modo = flags.some((f) => argv.includes(f)) ? "aplicar" : "simulacion";
  const log = op.log ?? ((l: string) => console.log(l));
  const escribirArchivo = op.escribirArchivo ?? ((ruta: string, contenido: string) => {
    mkdirSync(dirname(ruta), { recursive: true });
    writeFileSync(ruta, contenido);
  });
  const ahora = op.ahora ?? (() => new Date());

  let escritas = 0;
  let fallidas = 0;
  let omitidas = 0;
  let rutaRespaldo: string | null = null;
  let motivoSinRespaldo: string | null = null;
  let bloqueada: string | null = null;

  log(`\n  ${op.nombre} — modo: ${modo === "aplicar" ? "ESCRITURA" : "SIMULACIÓN (usá --aplicar para escribir)"}\n`);

  return {
    modo,
    aplicar: modo === "aplicar",

    abrirRespaldo(datos) {
      if (modo === "simulacion") return true;
      const ruta = resolve(op.dirRespaldos ?? DIR_RESPALDOS,
        `respaldo-${op.nombre}-${ahora().toISOString().replace(/[:.]/g, "-")}.json`);
      try {
        escribirArchivo(ruta, JSON.stringify(datos, null, 2));
        rutaRespaldo = ruta;
        log(`  respaldo escrito: ${ruta}`);
        return true;
      } catch (e) {
        bloqueada = `no se pudo escribir el respaldo en ${ruta}: ${mensaje(e)}`;
        log(`  ✗ ${bloqueada}`);
        log("  No se toca Firestore.");
        return false;
      }
    },

    sinRespaldo(motivo) {
      motivoSinRespaldo = motivo;
    },

    async escribir(id, fn, cantidad = 1) {
      if (modo === "simulacion") {
        escritas += cantidad;
        log(`  [se escribiría] ${id}`);
        return true;
      }
      if (bloqueada) {
        fallidas += cantidad;
        log(`  ✗ ${id}: no se escribió (${bloqueada})`);
        return false;
      }
      if (!rutaRespaldo && !motivoSinRespaldo) {
        // Error del script, no de Firestore: se corta todo para que se vea.
        bloqueada = "el script intentó escribir sin abrir el respaldo ni declarar sinRespaldo()";
        fallidas += cantidad;
        log(`  ✗ ${id}: ${bloqueada}`);
        return false;
      }
      try {
        await fn();
        escritas += cantidad;
        log(`  ✓ ${id}`);
        return true;
      } catch (e) {
        fallidas += cantidad;
        log(`  ✗ ${id}: ${mensaje(e)}`);
        return false;
      }
    },

    omitir(id, motivo, cantidad = 1) {
      omitidas += cantidad;
      log(`  · omitida ${id}${motivo ? ` (${motivo})` : ""}`);
    },

    resumen() {
      if (modo === "simulacion") {
        log(`\n  se escribirían: ${escritas} · omitidas: ${omitidas} · sin respaldo (simulación, no se escribió nada)\n`);
        return bloqueada ? 1 : 0;
      }
      const respaldo = rutaRespaldo
        ? `respaldo en ${rutaRespaldo}`
        : motivoSinRespaldo ? `sin respaldo (${motivoSinRespaldo})` : "sin respaldo";
      log(`\n  escritas: ${escritas} · fallidas: ${fallidas} · omitidas: ${omitidas} · ${respaldo}\n`);
      return fallidas > 0 || bloqueada ? 1 : 0;
    },
  };
}

/**
 * Corre el script con su corrida y termina el proceso. Si `main` explota a
 * mitad, igual imprime el resumen —lo que ya se escribió, se ve— y sale con 1.
 */
export async function correr(
  nombre: string,
  main: (c: Corrida) => Promise<void>,
  op: Omit<OpcionesCorrida, "nombre"> = {},
): Promise<never> {
  const c = crearCorrida({ nombre, ...op });
  let codigo: number;
  try {
    await main(c);
    codigo = c.resumen();
  } catch (e) {
    console.error(e);
    (op.log ?? console.log)(`\n  ✗ la corrida se cortó: ${mensaje(e)}`);
    c.resumen();
    codigo = 1;
  }
  process.exit(codigo);
}

function mensaje(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
