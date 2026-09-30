// ════════════════════════════════════════════════════════════════════════════
//  lib/pedirYTraer.ts — el botón del puente, en dos pasos (P89, P91).
//
//  Había dos sincronizaciones con el mismo nombre: reloj → nube (el puente,
//  cada 6 h) y nube → ShapeUp (el botón). Se terminaba de entrenar, se apretaba
//  el botón, y la sesión no se enriquecía porque el dato seguía en el teléfono.
//
//  Ahora el botón: 1) le pide al puente y espera, 2) importa lo que haya —
//  **siempre**, haya contestado o no—. Nunca se queda esperando ni se pierde el
//  paso de importar.
//
//  P91: si este dispositivo ya pidió hace menos de un minuto, no se vuelve a
//  pedir ni se espera (la función descartaría el pedido y el push no saldría):
//  se va derecho a importar.
//
//  Puro: las lecturas y escrituras se inyectan.
// ════════════════════════════════════════════════════════════════════════════
import type { Result } from "./result";

export type ComoContesto =
  | "contesto"          // el contador del puente se movió
  | "no-contesto"       // venció la espera
  | "sin-puente"        // el puente de este teléfono no registró su token
  | "ya-pedido"         // este dispositivo ya pidió hace menos de un minuto (P91)
  | "no-se-pudo-pedir"; // la escritura del pedido falló o no llegó al servidor

export type FasePedido = "pidiendo" | "importando";

/** Lo mismo que `PedidoHecho` de data/pedidoPuente, sin depender de data/. */
export type PedidoHechoLike =
  | { yaPedido: false; pedidoMs: number; corridaPreviaMs?: number }
  | { yaPedido: true; haceMs: number };

export interface DepsPedirYTraer<T> {
  /**
   * ¿Hay un puente que pueda recibir el pedido? Sin token registrado no tiene
   * sentido esperar 45 s a alguien que no va a contestar.
   */
  hayPuenteEscuchando: () => Promise<boolean>;
  /** Escribe el pedido (o dice que ya se pidió hace poco). */
  pedir: () => Promise<Result<PedidoHechoLike>>;
  /** Espera a que el contador del puente se mueva respecto de `corridaPreviaMs`. */
  esperar: (corridaPreviaMs: number | undefined) => Promise<{ contesto: boolean }>;
  /** La sincronización de siempre. */
  traer: () => Promise<Result<T>>;
  alCambiarFase?: (fase: FasePedido) => void;
}

export interface ResultadoPedirYTraer<T> {
  contesto: ComoContesto;
  resultado: Result<T>;
  /** El pedido que se escribió, para seguir escuchando tarde (P91). */
  pedido?: { pedidoMs: number; corridaPreviaMs?: number };
  /** Con `ya-pedido`: hace cuánto se pidió. */
  haceMs?: number;
}

export async function pedirYTraer<T>(deps: DepsPedirYTraer<T>): Promise<ResultadoPedirYTraer<T>> {
  deps.alCambiarFase?.("pidiendo");
  let contesto: ComoContesto;
  let pedido: ResultadoPedirYTraer<T>["pedido"];
  let haceMs: number | undefined;
  try {
    if (!(await deps.hayPuenteEscuchando())) {
      // El pedido se escribe igual (queda anotado y no cuesta nada), pero no se espera.
      void deps.pedir().catch(() => undefined);
      contesto = "sin-puente";
    } else {
      const p = await deps.pedir();
      if (!p.ok) contesto = "no-se-pudo-pedir";
      else if (p.value.yaPedido) { contesto = "ya-pedido"; haceMs = p.value.haceMs; }
      else {
        pedido = { pedidoMs: p.value.pedidoMs, corridaPreviaMs: p.value.corridaPreviaMs };
        contesto = (await deps.esperar(p.value.corridaPreviaMs)).contesto ? "contesto" : "no-contesto";
      }
    }
  } catch {
    contesto = "no-se-pudo-pedir";
  }

  deps.alCambiarFase?.("importando");
  const resultado = await deps.traer();
  return { contesto, resultado, ...(pedido ? { pedido } : {}), ...(haceMs != null ? { haceMs } : {}) };
}

/**
 * La línea que acompaña al resultado cuando el reloj no mandó nada nuevo.
 * `momento`: en la vista previa todavía no se importó nada.
 */
export function avisoRespuesta(
  c: ComoContesto, momento: "vista-previa" | "importado", haceMs?: number,
): string | null {
  const loQueHabia = momento === "vista-previa" ? "esto es lo que ya estaba" : "se importó lo que ya estaba";
  switch (c) {
    case "contesto": return null;
    case "no-contesto": return `El reloj no contestó a tiempo; ${loQueHabia}. Lo que falte entra en la próxima.`;
    case "sin-puente": return `El puente de este teléfono todavía no puede recibir pedidos; ${loQueHabia}.`;
    case "no-se-pudo-pedir": return `No se pudo pedirle los datos al reloj; ${loQueHabia}.`;
    case "ya-pedido": {
      const seg = Math.max(1, Math.round((haceMs ?? 0) / 1000));
      return `Ya le pedimos al reloj hace ${seg} segundos; se importa lo que haya llegado.`;
    }
  }
}
