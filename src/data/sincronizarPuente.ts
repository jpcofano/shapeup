// ════════════════════════════════════════════════════════════════════════════
//  data/sincronizarPuente.ts — lo que sube el puente entra a ShapeUp (PU4).
//
//  Orquesta y nada más: lee (`data/ingestaSdk`), traduce (`lib/adaptadorSdk`) y
//  después usa **el mismo pipeline del ZIP** — `clasificarImport` de P75,
//  `construirEntradaExterna` y `guardarEntradasExternas` de P75/P75b,
//  `importarCardioIdempotente` e `importarMedicionesIdempotente`. No hay una
//  segunda ingesta con sus propias reglas.
//
//  No marca los registros como procesados: son pocos, todo es idempotente por
//  uuid y el puente reescribe la misma ventana. Marcarlos obligaría a escribir
//  en la colección del puente, que las reglas tienen cerrada a cinco campos.
// ════════════════════════════════════════════════════════════════════════════
import type { Historial, MiembroId, ZonaFC } from "../types/models";
import { ok, err } from "../lib/result";
import type { Result } from "../lib/result";
import {
  clasificarImport, type ConfigClasificacion, type ItemClasificado,
  type CardioClasificable,
} from "../lib/importSelectivo";
import { construirEntradaExterna, type ItemExterno } from "../lib/entradaExterna";
import { TITULO_SHAPEUP, adaptarRegistros } from "../lib/adaptadorSdk";
import { leerRegistrosSdk } from "./ingestaSdk";
import { importarCardioIdempotente, importarMedicionesIdempotente } from "./salud";
import { guardarEntradasExternas } from "./historial";

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
  externas: number;
  soloSalud: number;
  clasificadas: ItemClasificado<CardioClasificable>[];

  medicionesAEscribir: number;
  medicionesDescartadas: { uid: string; motivo: string }[];

  /** `false` en vista previa: nada se escribió. */
  escrito: boolean;
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
 * `getHistorialShapeUp`): es contra eso que el clasificador decide qué
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
  };

  if (opciones.soloVistaPrevia) return ok(resumen);

  // ── Escritura, con las funciones que ya existen ─────────────────────────
  // TODAS las actividades van a /cardio (P75b): el destino solo decide si
  // además entra al historial.
  const cardio = clasificadas.map((c) => c.item);
  if (cardio.length > 0) {
    const r = await importarCardioIdempotente(
      cardio as Parameters<typeof importarCardioIdempotente>[0],
    );
    if (!r.ok) return err(`Cardio: ${r.error}`);
  }

  const entradas = externas
    .filter((c) => !!(c.item as unknown as ItemExterno)._uuid)
    .map((c) => construirEntradaExterna(
      c.item as unknown as ItemExterno, miembro, c.motivoIngreso ?? "duracion",
    ));
  const rExt = await guardarEntradasExternas(entradas);
  if (!rExt.ok) return err(`Actividades externas: ${rExt.error}`);

  if (adaptado.mediciones.length > 0) {
    const limpias = adaptado.mediciones.map(({ _appId: _a, _inicioMs: _i, ...resto }) => resto);
    const r = await importarMedicionesIdempotente(
      limpias as Parameters<typeof importarMedicionesIdempotente>[0],
    );
    if (!r.ok) return err(`Mediciones: ${r.error}`);
  }

  return ok({ ...resumen, escrito: true });
}
