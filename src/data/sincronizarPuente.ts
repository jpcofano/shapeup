// ════════════════════════════════════════════════════════════════════════════
//  data/sincronizarPuente.ts — lo que sube el puente entra a ShapeUp (PU4).
//
//  Orquesta y nada más: lee (`data/ingestaSdk`), traduce (`lib/adaptadorSdk`) y
//  después usa **el mismo pipeline del ZIP** — `clasificarImport` de P75,
//  `importarCardioIdempotente` e `importarMedicionesIdempotente`. No hay una
//  segunda ingesta con sus propias reglas.
//
//  P76b: ya no escribe entradas externas en /historial. Todas las actividades
//  van enteras a /cardio y el historial las filtra al leer.
//
//  No marca los registros como procesados: son pocos, todo es idempotente por
//  uuid y el puente reescribe la misma ventana. Marcarlos obligaría a escribir
//  en la colección del puente, que las reglas tienen cerrada a cinco campos.
// ════════════════════════════════════════════════════════════════════════════
import type { Historial, MiembroId, ZonaFC } from "../types/models";
import { ok, err, firebaseErrorMessage } from "../lib/result";
import type { Result } from "../lib/result";
import { conTimeout } from "../lib/conTimeout";
import {
  clasificarImport, type ConfigClasificacion, type ItemClasificado,
  type CardioClasificable,
} from "../lib/importSelectivo";
import { TITULO_SHAPEUP, adaptarRegistros } from "../lib/adaptadorSdk";
import { leerRegistrosSdk } from "./ingestaSdk";
import { importarCardioIdempotente, importarMedicionesIdempotente } from "./salud";

export interface ResumenSincronizacion {
  /** Documentos leídos de /ingesta-sdk, partes incluidas. */
  documentos: number;
  /** Registros lógicos ya rearmados y parseados. */
  registros: number;
  rearmados: number;
  ilegibles: { id: string; motivo: string }[];
  ignorados: { id: string; motivo: string }[];

  /** Actividades por destino, con las mismas reglas que el ZIP. */
  enriquecen: number;
  /**
   * Las que no enriquecen ninguna sesión y se van a **ver** en el historial.
   * Desde P76b no se escribe un documento por cada una: todas están en
   * /cardio y el historial las filtra al leer.
   */
  externas: number;
  soloSalud: number;
  clasificadas: ItemClasificado<CardioClasificable>[];

  medicionesAEscribir: number;
  medicionesDescartadas: { uid: string; motivo: string }[];

  /** `false` en vista previa: nada se escribió. */
  escrito: boolean;

  /**
   * Lo que se escribió **de verdad**, paso por paso (P76a). Antes el resumen
   * mostraba `enriquecen + externas`, que salen de la clasificación y no de la
   * escritura: decía que había guardado aunque no hubiera guardado nada.
   */
  escritos: { cardio: number; mediciones: number };

  /**
   * Algún paso venció los 8 s y quedó en la cola local de Firestore. No es un
   * error: se sube cuando haya señal (mismo criterio que P69).
   */
  enCola: boolean;
}

export interface OpcionesSincronizacion {
  /** Calcula y devuelve el resumen sin escribir una sola cosa. */
  soloVistaPrevia?: boolean;
  zonasFC?: Partial<Record<ZonaFC, { min: number; max: number }>>;
  /** Para los textos de la clasificación ("de hoy" vs "del 14/9"). */
  ahora?: number;
}

/**
 * Trae lo del puente y, si no es vista previa, lo escribe.
 *
 * `historialShapeUp` son las sesiones entrenadas en la app (de
 * `getHistorialEnLaApp`): es contra eso que el clasificador decide qué
 * enriquece. Las externas de corridas anteriores no cuentan — si contaran, cada
 * actividad se enriquecería a sí misma en la corrida siguiente (P74).
 */
export async function sincronizarDesdePuente(
  uid: string,
  miembro: MiembroId,
  historialShapeUp: Historial[],
  config: ConfigClasificacion,
  opciones: OpcionesSincronizacion = {},
): Promise<Result<ResumenSincronizacion>> {
  const lectura = await leerRegistrosSdk(uid);
  if (!lectura.ok) return err(lectura.error);

  const { registros, documentos, rearmados, ilegibles } = lectura.value;
  const adaptado = adaptarRegistros(registros, miembro, opciones.zonasFC);

  // El SDK no transporta `custom_id`: el `customTitle` cumple ese papel, y en
  // las sesiones de la app es literalmente "ShapeUp" (verificado en el Paso 0).
  const clasificadas = clasificarImport(
    adaptado.ejercicios as CardioClasificable[],
    historialShapeUp,
    [TITULO_SHAPEUP],
    config,
    opciones.ahora ?? Date.now(),
  );

  const externas = clasificadas.filter((c) => c.destino === "externa");
  const resumen: ResumenSincronizacion = {
    documentos,
    registros: registros.length,
    rearmados,
    ilegibles,
    ignorados: adaptado.ignorados,
    enriquecen: clasificadas.filter((c) => c.destino === "enriquece").length,
    externas: externas.length,
    soloSalud: clasificadas.filter((c) => c.destino === "descartada").length,
    clasificadas,
    medicionesAEscribir: adaptado.mediciones.length,
    medicionesDescartadas: adaptado.medicionesDescartadas,
    escrito: false,
    escritos: { cardio: 0, mediciones: 0 },
    enCola: false,
  };

  if (opciones.soloVistaPrevia) return ok(resumen);

  // ── Escritura, con las funciones que ya existen ─────────────────────────
  // Cada paso corre contra un timeout y reporta lo que escribió. Si uno falla
  // después de que otro escribió, el error dice qué quedó guardado: nada se
  // deshace, porque todos los ids son determinísticos y reintentar es seguro.
  const escritos = { cardio: 0, mediciones: 0 };
  let enCola = false;
  const yaGuardado = () => {
    const partes = [
      escritos.cardio     > 0 ? `${escritos.cardio} actividades` : null,
      escritos.mediciones > 0 ? `${escritos.mediciones} mediciones` : null,
    ].filter(Boolean);
    return partes.length > 0 ? ` Ya se habían guardado: ${partes.join(", ")}.` : "";
  };

  // TODAS las actividades van a /cardio (P75b): el destino solo decide si
  // además entra al historial.
  const cardio = clasificadas.map((c) => c.item);
  if (cardio.length > 0) {
    const paso = await escribir(
      importarCardioIdempotente(cardio as Parameters<typeof importarCardioIdempotente>[0]),
    );
    if (paso.tipo === "error") return err(`Cardio: ${paso.error}${yaGuardado()}`);
    if (paso.tipo === "timeout") { enCola = true; escritos.cardio = cardio.length; }
    else {
      escritos.cardio = paso.valor.importados;
      if (paso.valor.fallidos) {
        return err(`Cardio: ${paso.valor.fallidos} de ${cardio.length} no se guardaron. ${paso.valor.primerError ?? ""}`.trim());
      }
    }
  }

  if (adaptado.mediciones.length > 0) {
    const limpias = adaptado.mediciones.map(({ _appId: _a, _inicioMs: _i, ...resto }) => resto);
    const paso = await escribir(
      importarMedicionesIdempotente(limpias as Parameters<typeof importarMedicionesIdempotente>[0]),
    );
    if (paso.tipo === "error") return err(`Mediciones: ${paso.error}${yaGuardado()}`);
    if (paso.tipo === "timeout") { enCola = true; escritos.mediciones = limpias.length; }
    else {
      escritos.mediciones = paso.valor.importados;
      if (paso.valor.fallidos) {
        return err(`Mediciones: ${paso.valor.fallidos} de ${limpias.length} no se guardaron. ${paso.valor.primerError ?? ""}`.trim());
      }
    }
  }

  return ok({ ...resumen, escrito: true, escritos, enCola });
}

/** Si el servidor no confirma en este tiempo, el paso queda "en cola" (P69). */
export const TIMEOUT_PASO_MS = 8000;

type PasoEscritura<T> =
  | { tipo: "ok"; valor: T }
  | { tipo: "timeout" }
  | { tipo: "error"; error: string };

/**
 * Corre un paso de escritura contra el timeout de P69 y normaliza las tres
 * salidas posibles. Sin esto, con caché persistente la promesa no resuelve
 * hasta que el servidor confirma y la pantalla queda colgada para siempre.
 */
async function escribir<T>(op: Promise<Result<T>>, ms = TIMEOUT_PASO_MS): Promise<PasoEscritura<T>> {
  try {
    const r = await conTimeout(op, ms);
    if (r.tipo === "timeout") return { tipo: "timeout" };
    return r.valor.ok ? { tipo: "ok", valor: r.valor.value } : { tipo: "error", error: r.valor.error };
  } catch (e) {
    return { tipo: "error", error: firebaseErrorMessage(e) };
  }
}
