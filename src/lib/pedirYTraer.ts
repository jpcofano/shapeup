// ════════════════════════════════════════════════════════════════════════════
//  lib/pedirYTraer.ts — el botón del puente, en dos pasos (P89).
//
//  Había dos sincronizaciones con el mismo nombre: reloj → nube (el puente,
//  cada 6 h) y nube → ShapeUp (el botón). Se terminaba de entrenar, se apretaba
//  el botón, y la sesión no se enriquecía porque el dato seguía en el teléfono.
//
//  Ahora el botón: 1) le pide al puente y espera, 2) importa lo que haya —
//  **siempre**, haya contestado o no—. Nunca se queda esperando ni se pierde el
//  paso de importar.
//
//  Puro: las lecturas y escrituras se inyectan.
// ════════════════════════════════════════════════════════════════════════════
import type { Result } from "./result";

export type ComoContesto =
  | "contesto"          // el puente corrió después del pedido
  | "no-contesto"       // venció la espera
  | "sin-puente"        // el puente de este teléfono no registró su token (falta P90)
  | "no-se-pudo-pedir"; // la escritura del pedido falló o no llegó al servidor

export type FasePedido = "pidiendo" | "importando";

export interface DepsPedirYTraer<T> {
  /**
   * ¿Hay un puente que pueda recibir el pedido? Sin token registrado no tiene
   * sentido esperar 45 s a alguien que no va a contestar.
   */
  hayPuenteEscuchando: () => Promise<boolean>;
  /** Escribe el pedido; devuelve el `pedidoMs`. */
  pedir: () => Promise<Result<number>>;
  /** Espera a que la corrida del puente pase `desdeMs`. */
  esperar: (desdeMs: number) => Promise<{ contesto: boolean }>;
  /** La sincronización de siempre. */
  traer: () => Promise<Result<T>>;
  alCambiarFase?: (fase: FasePedido) => void;
}

export async function pedirYTraer<T>(deps: DepsPedirYTraer<T>): Promise<{ contesto: ComoContesto; resultado: Result<T> }> {
  deps.alCambiarFase?.("pidiendo");
  let contesto: ComoContesto;
  try {
    if (!(await deps.hayPuenteEscuchando())) {
      // El pedido se escribe igual (queda anotado y no cuesta nada), pero no se espera.
      void deps.pedir().catch(() => undefined);
      contesto = "sin-puente";
    } else {
      const p = await deps.pedir();
      if (!p.ok) contesto = "no-se-pudo-pedir";
      else contesto = (await deps.esperar(p.value)).contesto ? "contesto" : "no-contesto";
    }
  } catch {
    contesto = "no-se-pudo-pedir";
  }

  deps.alCambiarFase?.("importando");
  const resultado = await deps.traer();
  return { contesto, resultado };
}

/**
 * La línea que acompaña al resultado cuando el reloj no mandó nada nuevo.
 * `momento`: en la vista previa todavía no se importó nada.
 */
export function avisoRespuesta(c: ComoContesto, momento: "vista-previa" | "importado"): string | null {
  const loQueHabia = momento === "vista-previa" ? "esto es lo que ya estaba" : "se importó lo que ya estaba";
  switch (c) {
    case "contesto": return null;
    case "no-contesto": return `El reloj no contestó a tiempo; ${loQueHabia}. Lo que falte entra en la próxima.`;
    case "sin-puente": return `El puente de este teléfono todavía no puede recibir pedidos; ${loQueHabia}.`;
    case "no-se-pudo-pedir": return `No se pudo pedirle los datos al reloj; ${loQueHabia}.`;
  }
}
