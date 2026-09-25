// ════════════════════════════════════════════════════════════════════════════
//  hooks/useSincronizacionAutomatica.ts — el puente entra solo (P85).
//
//  Se llama UNA vez, en el armazón (`AppShell`), no en cada pantalla. Corre una
//  vez por **apertura** de la app —al cargar, y cada vez que vuelve a primer
//  plano—, en segundo plano, y nunca rompe la pantalla: un fallo se anota en el
//  chip de Home y el botón de /salud sigue estando.
//
//  Por qué también al volver a primer plano: una PWA en el teléfono casi nunca
//  se recarga, solo se suspende. Con "una vez por carga", entrenar y volver a
//  abrirla a la noche no sincronizaba nada. La regla de 6 h y la pregunta
//  barata al puente siguen valiendo igual: volver a primer plano cada rato
//  cuesta cero lecturas.
//
//  Cuando entra algo, sube `generacionDatos`: Home la escucha y recarga.
//
//  La decisión de *si* corresponde es pura (`lib/sincronizacionAutomatica`);
//  acá solo se orquesta. El caso normal —el puente no corrió desde la última
//  vez— cuesta **una** lectura: `/estado/puente`. Y si sincronizamos hace menos
//  de 6 h, ni esa.
// ════════════════════════════════════════════════════════════════════════════
import { useEffect, useSyncExternalStore } from "react";
import type { MiembroId } from "../types/models";
import type { Result } from "../lib/result";
import { MSG_CUOTA_AGOTADA, esCuotaAgotada, firebaseErrorMessage } from "../lib/result";
import { conTimeout, type ResultadoTimeout } from "../lib/conTimeout";
import {
  debeSincronizar, puedeConsultarPuente, leerMarcas, guardarMarcas, contarNuevas,
  TIMEOUT_SYNC_AUTO_MS, type Almacen, type EstadoSincronizacion,
} from "../lib/sincronizacionAutomatica";
import { limpiarCacheDiasActivos } from "../lib/cacheDiasActivos";
import { leerEstadoPuente, type EstadoPuente } from "../data/ingestaSdk";
import { sincronizarDesdePuente, type ResumenSincronizacion } from "../data/sincronizarPuente";
import { getPerfiles } from "../data/perfiles";
import { getHistorialEnLaApp } from "../data/historial";
import { getConfigImport, CONFIG_IMPORT_DEFAULT } from "../data/configImport";

// ── Estado compartido (el hook corre en el armazón, el chip vive en Home) ────

let estado: EstadoSincronizacion = { fase: "inactiva" };
const oyentes = new Set<() => void>();

function publicar(e: EstadoSincronizacion) {
  estado = e;
  oyentes.forEach((f) => f());
}

/** Lo que muestra el chip de Home. */
export function useEstadoSincronizacion(): EstadoSincronizacion {
  return useSyncExternalStore(
    (f) => { oyentes.add(f); return () => { oyentes.delete(f); }; },
    () => estado,
  );
}

/** El chip se fue (a los pocos segundos, o al tocarlo): no vuelve en esta carga. */
export function descartarChipSincronizacion() {
  if (estado.fase !== "corriendo") publicar({ fase: "inactiva" });
}

/**
 * Sube cada vez que una sincronización automática escribió algo. Las pantallas
 * que muestran datos de salud o de la semana la ponen en las dependencias de
 * su carga, y así se refrescan solas.
 */
let generacionDatos = 0;
const oyentesDatos = new Set<() => void>();

export function useGeneracionDatosSalud(): number {
  return useSyncExternalStore(
    (f) => { oyentesDatos.add(f); return () => { oyentesDatos.delete(f); }; },
    () => generacionDatos,
  );
}

function avisarDatosNuevos() {
  generacionDatos++;
  oyentesDatos.forEach((f) => f());
}

// ── Orquestación ─────────────────────────────────────────────────────────────

/** Una vez por apertura (carga o vuelta a primer plano), como `barridoHuerfanasHecho` (P69). */
let intentadaEnEstaApertura = false;
/**
 * Falló (cuota, timeout o error): no se reintenta en toda esta carga, aunque
 * la app vuelva a primer plano. El botón de /salud sigue estando.
 */
let bloqueadaEnEstaCarga = false;
/** No hay otra corriendo. */
let enCurso = false;

/** La app volvió a primer plano: habilita un intento más, si no quedó bloqueada. */
export function reabrirApp() {
  intentadaEnEstaApertura = false;
}

function fallar(e: Extract<EstadoSincronizacion, { fase: "fallo" }>) {
  bloqueadaEnEstaCarga = true;
  publicar(e);
}

export interface DepsSincronizacion {
  leerEstado: (uid: string) => Promise<Result<EstadoPuente | null>>;
  /** El pipeline del botón, sin vista previa. */
  sincronizar: (uid: string, miembro: MiembroId) => Promise<Result<ResumenSincronizacion>>;
  almacen: Almacen | null;
  ahora: () => number;
  online: () => boolean;
  /** Tras escribir actividades: la caché de días activos puede haber quedado vieja. */
  trasEscribir?: () => void;
}

const esCuota = (msg: string) => msg === MSG_CUOTA_AGOTADA || esCuotaAgotada(msg);

/**
 * Corre la sincronización automática si corresponde. Nunca tira. Devuelve si
 * llegó a sincronizar (para los tests; el hook lo ignora).
 */
export async function correrSincronizacionAutomatica(
  uid: string, miembro: MiembroId, deps: DepsSincronizacion,
): Promise<boolean> {
  if (intentadaEnEstaApertura || bloqueadaEnEstaCarga || enCurso) return false;
  intentadaEnEstaApertura = true;

  const marcas = leerMarcas(deps.almacen, uid);
  const online = deps.online();
  // Sin señal o con una sincronización reciente: cero lecturas.
  if (!puedeConsultarPuente({ ultimaAutoMs: marcas.ultimaAutoMs, ahora: deps.ahora(), online })) return false;

  enCurso = true;
  try {
    const est = await deps.leerEstado(uid);
    if (!est.ok) {
      // Leer el estado es invisible para Juan: si falla, no hay nada que decirle
      // salvo que sea la cuota, que igual va a trabar el botón de /salud.
      if (esCuota(est.error)) fallar({ fase: "fallo", motivo: "cuota" });
      console.warn("Sincronización automática: no se pudo leer el estado del puente:", est.error);
      return false;
    }
    const ultimaCorridaPuenteMs = est.value?.ultimaCorridaMs;
    if (!debeSincronizar({
      ultimaCorridaPuenteMs, ultimaImportadaMs: marcas.ultimaImportadaMs,
      ultimaAutoMs: marcas.ultimaAutoMs, ahora: deps.ahora(), online,
    })) return false;

    publicar({ fase: "corriendo" });
    let r: ResultadoTimeout<Result<ResumenSincronizacion>>;
    try {
      r = await conTimeout(deps.sincronizar(uid, miembro), TIMEOUT_SYNC_AUTO_MS);
    } catch (e) {
      const msg = firebaseErrorMessage(e);
      fallar({ fase: "fallo", motivo: esCuota(msg) ? "cuota" : "error", detalle: msg });
      console.warn("Sincronización automática:", msg);
      return false;
    }
    if (r.tipo === "timeout") {
      // La promesa sigue corriendo: lo que escriba, queda. No se reintenta en esta carga.
      fallar({ fase: "fallo", motivo: "timeout" });
      console.warn(`Sincronización automática: venció a los ${TIMEOUT_SYNC_AUTO_MS / 1000} s.`);
      return false;
    }
    if (!r.valor.ok) {
      fallar({ fase: "fallo", motivo: esCuota(r.valor.error) ? "cuota" : "error", detalle: r.valor.error });
      console.warn("Sincronización automática:", r.valor.error);
      return false;
    }

    const v = r.valor.value;
    const uuids = uuidsDe(v);
    const nuevas = contarNuevas(uuids, marcas.uuidsConocidos);
    guardarMarcas(deps.almacen, uid, {
      ultimaImportadaMs: ultimaCorridaPuenteMs!,
      ultimaAutoMs: deps.ahora(),
      uuidsConocidos: uuids,
    });
    if (v.escritos.cardio > 0) deps.trasEscribir?.();
    const conBiometria = v.enriquecimiento?.matcheadas ?? 0;
    publicar({ fase: "lista", nuevas, conBiometria });
    if (v.escritos.cardio > 0 || v.escritos.mediciones > 0 || conBiometria > 0) avisarDatosNuevos();
    return true;
  } finally {
    enCurso = false;
  }
}

/** Los uuid de las actividades del lote, para contar las nuevas la próxima vez. */
export function uuidsDe(v: ResumenSincronizacion): string[] {
  return v.clasificadas.map((c) => c.item._uuid).filter((u): u is string => !!u);
}

/**
 * Después de una sincronización a mano (el botón de /salud) se actualizan las
 * marcas igual: si no, la automática repetiría lo mismo y contaría como nuevas
 * actividades que Juan ya vio en la vista previa. `ultimaAutoMs` no se toca.
 */
export function anotarSincronizacionManual(
  uid: string, ultimaCorridaPuenteMs: number | undefined, v: ResumenSincronizacion,
  almacen: Almacen | null = almacenLocal(),
) {
  guardarMarcas(almacen, uid, {
    ...(ultimaCorridaPuenteMs != null ? { ultimaImportadaMs: ultimaCorridaPuenteMs } : {}),
    uuidsConocidos: uuidsDe(v),
  });
}

/** Cuándo fue la última sincronización automática en esta máquina. */
export function ultimaSincronizacionAutomatica(uid: string, almacen: Almacen | null = almacenLocal()): number | null {
  return leerMarcas(almacen, uid).ultimaAutoMs ?? null;
}

export function almacenLocal(): Almacen | null {
  try { return window.localStorage; } catch { return null; }
}

/** Solo para tests. */
export function _reiniciarSincronizacionAutomatica() {
  intentadaEnEstaApertura = false;
  bloqueadaEnEstaCarga = false;
  enCurso = false;
  estado = { fase: "inactiva" };
  generacionDatos = 0;
}

// ── El hook ──────────────────────────────────────────────────────────────────

function depsReales(): DepsSincronizacion {
  return {
    leerEstado: leerEstadoPuente,
    sincronizar: async (uid, miembro) => {
      const [perfRes, histRes, cfgRes] = await Promise.all([
        getPerfiles(), getHistorialEnLaApp(miembro), getConfigImport(),
      ]);
      return sincronizarDesdePuente(
        uid, miembro, histRes.ok ? histRes.value : [],
        cfgRes.ok ? cfgRes.value : CONFIG_IMPORT_DEFAULT,
        { zonasFC: perfRes.ok ? perfRes.value[miembro]?.zonasFC : undefined },
      );
    },
    almacen: almacenLocal(),
    ahora: () => Date.now(),
    online: () => navigator.onLine,
    trasEscribir: limpiarCacheDiasActivos,
  };
}

/**
 * Dispara la sincronización automática. Una vez por apertura: remontar el armazón
 * no la repite; volver a primer plano sí habilita un intento. `deps` solo en tests.
 */
export function useSincronizacionAutomatica(
  uid: string | null | undefined,
  miembro: MiembroId | null | undefined,
  deps?: DepsSincronizacion,
) {
  useEffect(() => {
    if (!uid || !miembro) return;
    // Nunca bloquea ni rompe: corre suelta y cualquier sorpresa queda en consola.
    const correr = () => {
      void (async () => {
        try {
          await correrSincronizacionAutomatica(uid, miembro, deps ?? depsReales());
        } catch (e) {
          console.warn("Sincronización automática:", e);
        }
      })();
    };
    correr();

    // Volver a primer plano es "abrir la app" para una PWA suspendida.
    const alVolver = () => {
      if (document.visibilityState !== "visible") return;
      reabrirApp();
      correr();
    };
    document.addEventListener("visibilitychange", alVolver);
    return () => document.removeEventListener("visibilitychange", alVolver);
  }, [uid, miembro, deps]);
}
