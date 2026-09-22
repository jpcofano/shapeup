// ════════════════════════════════════════════════════════════════════════════
//  data/historial.ts — Escritura y lectura de /historial.
//
//  finalizarSesion (v3, P69): un writeBatch escribe SOLO documentos del miembro
//  (/historial y /sesiones). Los contadores de /ejercicios y /rutinas no se
//  tocan para que no-owners puedan cerrar sus sesiones (ejercicios es
//  owner-only por las reglas de Firestore). Ver ADR #014.
//  Es batch y no transacción porque las transacciones no se encolan sin
//  conexión: fallan. Un batch sí queda en la cola local de Firestore.
// ════════════════════════════════════════════════════════════════════════════
import {
  collection, doc, getDocs, getDoc, getDocFromServer,
  serverTimestamp, updateDoc, writeBatch,
  query, where, orderBy, limit,
} from "firebase/firestore";
import { db } from "../firebase";
import type {
  Historial, BloqueRegistro, BiometriaSesion, MiembroId, ZonaMolestia, SesionCardio,
} from "../types/models";
import { ok, err, firebaseErrorMessage } from "../lib/result";
import type { Result } from "../lib/result";
import { tonelajeKg, totalSeriesHechas, ventanaDeBloques } from "../lib/metricas";
import { ymdLocal, lunesDeSemana } from "../lib/semana";
import { leerSemanaCache, guardarSemanaCache } from "../lib/cacheDiasActivos";
import { agruparDiasActivos, type DiaActivo } from "../lib/racha";
import { getCardioRango, type CursorCardio } from "./salud";
import { conTimeout } from "../lib/conTimeout";
import {
  agregarPendiente, quitarPendiente, marcarErrorPendiente, listarPendientes,
  type PayloadHistorial, type PayloadSesion, type SesionPendiente,
} from "../lib/pendientes";

// ── Escritura (batch que se encola sin conexión) ──────────────────────────────

/** Si el servidor no confirma en este tiempo, la sesión queda "sin subir" (P69). */
export const TIMEOUT_GUARDADO_MS = 8000;

/** Una pendiente sin confirmar después de esto se reenvía al conciliar (P69). */
const ESPERA_REENVIO_MS = 2 * 60 * 1000;

export interface FinalizarSesionOpts {
  rutinaId?:    string;          // ausente en sesiones libres
  /** Nombre de la rutina, que la ruta ya tiene en memoria. Si falta, se usa `rutinaId`. */
  nombreRutina?: string;
  tipo?:        "rutina" | "libre" | "juego";
  nombreLibre?: string;          // título de la sesión libre
  /** Qué juego se jugó, cuando `tipo === "juego"` (P81). */
  nombreJuego?: string;
  /**
   * Ventana de la sesión, para lo que no tiene bloques de donde derivarla (P81).
   *
   * Una sesión de juego no registra series: sin esto quedaría sin `inicioMs` ni
   * `finMs`, y el match biométrico no tendría contra qué cruzar — que es lo
   * único que hace útil registrarla.
   */
  ventana?:     { inicioMs: number; finMs: number };
  miembro:      MiembroId;
  bloques:      BloqueRegistro[];
  rpe:          number | null;
  duracionMin:  number | null;
  notas?:       string;
  /** idSesion real (de crearSesion). Si se provee, la sesión pasa a "Registrada" en la misma tx. */
  idSesion?:    string;
  programaId?:  string;
  /** Solo se escribe si viene. Ausente se lee como "completa" (P68). */
  completitud?: "completa" | "parcial";
  /** Cierre de la sesión (P70). Se escriben solo si vienen; molestias, solo si no está vacío. */
  comoMeSenti?: string;
  queMejorar?:  string;
  molestias?:   ZonaMolestia[];
  /** Cómo le resultó la sesión de VR (P79). Dato de análisis: ninguna regla lo lee. */
  dificultadPercibida?: "suave" | "normal" | "intenso";
  /** Qué sugirió la app al empezar y qué hizo la persona (P79). */
  progresionVR?: {
    palanca: "subir-dificultad" | "recortar-descanso" | "sumar-ronda"
      | "sumar-tiempo" | "cambiar-juego" | "mantener" | "bajar";
    aceptada: boolean;
    fuente: "fc" | "descanso" | "manual";
  };
}

/**
 * Cierra una sesión de entrenamiento. Un writeBatch escribe solo documentos del
 * propio miembro:
 *   1. Crea el documento Historial.
 *   2. Si se pasa `idSesion`, marca esa SesionProgramada como "Registrada" con
 *      `set(..., { merge: true })`: si el documento nunca llegó a crearse (sin
 *      señal), un `update` haría fallar el batch y se perdería el historial.
 *
 * El commit compite con un timeout de 8 s (P69):
 *   - confirma a tiempo → `{ pendiente: false }`;
 *   - vence → `{ pendiente: true }`: la escritura ya está en la cola local de
 *     Firestore; se registra en `lib/pendientes` y se quita (o se marca con
 *     error) cuando el commit termine;
 *   - falla antes → `err`.
 *
 * Los contadores de /ejercicios y /rutinas (vecesUsado, vecesEntrenada) NO se
 * actualizan aquí: /ejercicios es owner-only por las reglas de Firestore, y ambos
 * son derivables del Historial. Ver ADR #014.
 */
export async function finalizarSesion(
  opts: FinalizarSesionOpts,
): Promise<Result<{ idHist: string; pendiente: boolean }>> {
  const {
    rutinaId, tipo, nombreLibre, nombreJuego, ventana: ventanaExplicita,
    miembro, bloques, rpe, duracionMin, notas, idSesion, programaId,
    completitud, comoMeSenti, queMejorar, molestias,
    dificultadPercibida, progresionVR,
  } = opts;
  const fecha   = ymdLocal();
  const semana  = lunesDeSemana(fecha);
  const idHist  = `H-${fecha.replace(/-/g, "")}-${Date.now()}`;
  // Si no se pasa idSesion, generamos uno "huérfano" (legado, sin doc en /sesiones).
  const sesionId = idSesion ?? `SES-${fecha.replace(/-/g, "")}-${Date.now()}`;
  // Sesión de rutina: el nombre lo pasa la ruta. Sesión libre: nombreLibre.
  const nombreRutina = rutinaId
    ? (opts.nombreRutina ?? rutinaId)
    : (tipo === "juego" ? (nombreJuego ?? "Juego") : (nombreLibre ?? "Sesión libre"));

  // Sin bloques no hay series de donde sacar la ventana, así que la sesión de
  // juego la pasa explícita (P81).
  const ventana = ventanaExplicita ?? ventanaDeBloques(bloques);
  const historial: PayloadHistorial = {
    idHist,
    fechaRealizada:          fecha,
    idSesion:                sesionId,
    ...(rutinaId ? { idRutina: rutinaId } : {}),
    nombreRutina,
    ...(tipo === "libre" ? { tipo: "libre" as const } : {}),
    ...(tipo === "juego" ? { tipo: "juego" as const } : {}),
    ...(nombreJuego ? { nombreJuego } : {}),
    ...(completitud ? { completitud } : {}),
    idPrograma:              programaId,
    semanaInicio:            semana,
    miembro,
    duracionRealMin:         duracionMin,
    rpe,
    tonelajeKg:              tonelajeKg({ bloques }),
    totalSeriesHechas:       totalSeriesHechas({ bloques }),
    ...(ventana.inicioMs != null ? { inicioMs: ventana.inicioMs } : {}),
    ...(ventana.finMs    != null ? { finMs:    ventana.finMs    } : {}),
    bloques,
    notas:                   notas ?? "",
    ...(comoMeSenti ? { comoMeSenti } : {}),
    ...(queMejorar ? { queMejorar } : {}),
    ...(molestias && molestias.length > 0 ? { molestias } : {}),
    // VR (P79): la sensación es dato de análisis; la progresión, el lazo que
    // permite ver si la regla acierta.
    ...(dificultadPercibida ? { dificultadPercibida } : {}),
    ...(progresionVR ? { progresionVR } : {}),
  };
  const sesion: PayloadSesion | null = idSesion
    ? { miembro, estado: "Registrada", rpeSesion: rpe }
    : null;

  let commit: Promise<void>;
  try {
    commit = escribirHistorial(historial, sesionId, sesion);
  } catch (e) {
    return err(firebaseErrorMessage(e));
  }

  try {
    const r = await conTimeout(commit, TIMEOUT_GUARDADO_MS);
    if (r.tipo === "ok") return ok({ idHist, pendiente: false });
  } catch (e) {
    return err(firebaseErrorMessage(e));
  }

  // Venció el timeout: queda en la cola local de Firestore. Se registra para
  // poder avisar y reenviar si la caché se pierde antes de sincronizar.
  agregarPendiente({
    idHist, idSesion: sesionId, nombreRutina, fecha, creadoMs: Date.now(), historial, sesion,
  });
  commit.then(
    () => quitarPendiente(idHist),
    (e: unknown) => marcarErrorPendiente(idHist, firebaseErrorMessage(e)),
  );
  return ok({ idHist, pendiente: true });
}

/** Escribe el historial (con el mismo `idHist`, así no se duplica) y el merge de la sesión. */
function escribirHistorial(
  historial: PayloadHistorial,
  idSesion: string,
  sesion: PayloadSesion | null,
): Promise<void> {
  const batch = writeBatch(db);
  batch.set(doc(db, "historial", historial.idHist), {
    ...historial,
    fechaRealizadaTimestamp: serverTimestamp(),
  });
  if (sesion) batch.set(doc(db, "sesiones", idSesion), sesion, { merge: true });
  return batch.commit();
}

/**
 * Concilia las sesiones sin subir (P69). Llamar solo con señal; no bloquea.
 * Para cada pendiente: si el historial ya está en el servidor, se quita; si no
 * está y pasaron más de 2 min, se reenvía con el mismo id (si confirma se
 * quita, si falla se marca el error). Si la consulta falla, no se toca nada.
 */
export async function conciliarPendientes(): Promise<void> {
  for (const p of listarPendientes()) {
    let existe: boolean;
    try {
      existe = (await getDocFromServer(doc(db, "historial", p.idHist))).exists();
    } catch {
      continue;
    }
    if (existe) {
      quitarPendiente(p.idHist);
      continue;
    }
    if (Date.now() - p.creadoMs <= ESPERA_REENVIO_MS) continue;
    const r = await reenviarPendiente(p);
    if (r.ok) quitarPendiente(p.idHist);
    else marcarErrorPendiente(p.idHist, r.error);
  }
}

/** Reenvía una pendiente con el mismo `idHist` y el mismo merge de la sesión. */
export async function reenviarPendiente(p: SesionPendiente): Promise<Result<void>> {
  try {
    await escribirHistorial(p.historial, p.idSesion, p.sesion);
    return ok(undefined);
  } catch (e) {
    return err(firebaseErrorMessage(e));
  }
}

// ── Lecturas ──────────────────────────────────────────────────────────────────
//
// P75b: ya no existe una consulta que traiga TODO el historial. Con las
// entradas externas, "todo" pasó de ~decenas a miles de documentos, y lo
// pedían seis pantallas en cada visita. Ahora hay tres consultas, cada una
// acotada a lo que su consumidor necesita de verdad.

/**
 * Tope de sesiones de ShapeUp que se traen de una. Son más de tres años
 * entrenando cuatro veces por semana: alcanza de sobra para racha, progresión,
 * PR y costo cardíaco. Si algún día hace falta más, se pagina.
 */
export const LIMITE_HISTORIAL_EN_LA_APP = 200;

/**
 * Los `tipo` de lo que se hizo EN LA APP (ver `lib/tipoHistorial`).
 *
 * **No es lo mismo que "cuenta como entrenamiento"** (P81): los juegos de VR
 * entran acá porque hay que traerlos para mostrarlos, analizarlos y sobre todo
 * enriquecerlos con FC, pero `esShapeUp` los deja afuera de toda métrica de
 * plan o progresión. Quien consuma esta lista y necesite solo entrenamiento,
 * filtra con `soloShapeUp`.
 */
const TIPOS_EN_LA_APP = ["rutina", "libre", "juego"] as const;

/**
 * Sesiones hechas en la app —rutinas, libres y juegos—, de la más reciente a
 * la más vieja. Los juegos vienen incluidos a propósito: ver `TIPOS_EN_LA_APP`.
 *
 * Requiere el índice (miembro, tipo, fechaRealizadaTimestamp desc) y que todos
 * los documentos tengan `tipo` — de eso se ocupó
 * `scripts/backfill-tipo-historial.ts`, porque un documento sin el campo no
 * entra en un `where("tipo", "in", …)` y quedaría invisible.
 */
export async function getHistorialEnLaApp(
  miembro: MiembroId,
  limite: number = LIMITE_HISTORIAL_EN_LA_APP,
): Promise<Result<Historial[]>> {
  try {
    const snap = await getDocs(
      query(
        collection(db, "historial"),
        where("miembro", "==", miembro),
        where("tipo", "in", TIPOS_EN_LA_APP),
        orderBy("fechaRealizadaTimestamp", "desc"),
        limit(limite),
      ),
    );
    return ok(snap.docs.map((d) => d.data() as Historial));
  } catch (e) {
    return err(firebaseErrorMessage(e));
  }
}

/**
 * Los días con actividad entre `desde` y `hasta`, cada uno con su origen.
 *
 * Lee las **dos fuentes** (P76b): las sesiones de `/historial` y las
 * actividades de `/cardio`, que desde P76b ya no se copian al historial. Las
 * agrupa el núcleo puro `agruparDiasActivos`.
 *
 * **Sin filtrar por `actividadRelevante`**: ese filtro es para mostrar en el
 * historial, no para decidir si te moviste. Acá entran TODAS las actividades
 * del rango, cada una marcando su día según el origen.
 *
 * **No decide qué cuenta**: devuelve las tres marcas por día y el consumidor
 * elige (la racha del plan mira `shapeUp`; "me moví" puede incluir o no lo
 * autodetectado).
 *
 * El rango lo fija el llamador. **Home pide la semana en curso** (P77b: doce
 * semanas de `/cardio` eran ~300 lecturas por visita a la pantalla de
 * aterrizaje); Progreso pide las doce, una sola vez, y las cachea.
 *
 * `truncado` avisa que se alcanzó el tope de páginas y el rango quedó
 * incompleto. **No se trunca en silencio** (P77b): dibujar semanas vacías que
 * no lo están es el bug que venimos persiguiendo.
 */
export interface DiasActivosResult {
  dias: DiaActivo[];
  /** Se alcanzó el tope de páginas: faltan actividades del rango. */
  truncado: boolean;
}

export async function getDiasActivos(
  miembro: MiembroId,
  desde: string,
  hasta: string,
): Promise<Result<DiasActivosResult>> {
  try {
    const [snapHist, cardio] = await Promise.all([
      getDocs(
        query(
          collection(db, "historial"),
          where("miembro", "==", miembro),
          where("fechaRealizada", ">=", desde),
          where("fechaRealizada", "<=", hasta),
        ),
      ),
      todoElCardioDelRango(miembro, desde, hasta),
    ]);
    if (!cardio.ok) return err(cardio.error);

    return ok({
      dias: agruparDiasActivos(
        snapHist.docs.map((d) => d.data() as Historial),
        cardio.value.sesiones,
      ),
      truncado: cardio.value.truncado,
    });
  } catch (e) {
    return err(firebaseErrorMessage(e));
  }
}

/**
 * Todas las actividades del rango, agotando el paginado de `getCardioRango`.
 *
 * Sin esto se perdían días en silencio: `getCardioRango` devuelve **una página**
 * (200 por defecto), y con la ventana de 12 semanas de P77a el export real la
 * pasa largo. Un día de movimiento que no se trae no es un día menos en la
 * pantalla: es un día que la serie declara vacío.
 *
 * El tope de páginas es una red de seguridad, no un límite esperado: 12 semanas
 * de actividades no llegan a 2000 ni de lejos. Si igual se alcanza, se dice
 * (`truncado`) en vez de devolver un rango incompleto como si fuera completo.
 */
const MAX_PAGINAS_CARDIO = 10;

async function todoElCardioDelRango(
  miembro: MiembroId,
  desde: string,
  hasta: string,
): Promise<Result<{ sesiones: SesionCardio[]; truncado: boolean }>> {
  const todas: SesionCardio[] = [];
  let cursor: CursorCardio | undefined;
  for (let i = 0; i < MAX_PAGINAS_CARDIO; i++) {
    const r = await getCardioRango(miembro, { desde, hasta, cursor });
    if (!r.ok) return err(r.error);
    todas.push(...r.value.sesiones);
    if (!r.value.siguienteCursor) return ok({ sesiones: todas, truncado: false });
    cursor = r.value.siguienteCursor;
  }
  return ok({ sesiones: todas, truncado: true });
}


/**
 * Los días activos de un rango de semanas, **leyendo de Firestore solo lo que
 * la caché no tiene** (P77b).
 *
 * Una semana cerrada no cambia nunca salvo import, así que se guarda en
 * `localStorage` y no se vuelve a pedir. Lo que sí se pide siempre es la
 * semana en curso, que todavía puede recibir días.
 *
 * La consulta que se arma es **una sola y contigua**: desde la semana más
 * vieja que falte hasta hoy. Firestore no sabe pedir semanas sueltas, y en el
 * caso normal —todo cacheado menos la semana en curso— eso es exactamente una
 * semana.
 *
 * Steady state: la primera visita después de un import lee las 12 semanas; las
 * siguientes, solo la semana en curso.
 */
export async function cargarDiasActivosConCache(
  miembro: MiembroId,
  desdeSemana: string,
  hoy: string,
): Promise<Result<DiasActivosResult>> {
  const semanaHoy = lunesDeSemana(hoy);

  // Las semanas del rango, de la más vieja a la más nueva.
  const semanas: string[] = [];
  for (let s = lunesDeSemana(desdeSemana); s <= semanaHoy; s = lunesDeSemana(sumarSemana(s))) {
    semanas.push(s);
  }

  // Lo que ya está guardado, y desde dónde hay que leer.
  const cacheadas = new Map<string, DiaActivo[]>();
  let primeraFaltante: string | null = null;
  for (const semana of semanas) {
    const enCurso = semana === semanaHoy;
    const guardadas = enCurso ? null : leerSemanaCache(miembro, semana);
    if (guardadas) cacheadas.set(semana, guardadas);
    else if (primeraFaltante == null) primeraFaltante = semana;
  }

  if (primeraFaltante == null) {
    return ok({ dias: semanas.flatMap((s) => cacheadas.get(s) ?? []), truncado: false });
  }

  const r = await getDiasActivos(miembro, primeraFaltante, domingoDeSemana(semanaHoy));
  if (!r.ok) return r;

  // Repartir lo leído por semana y guardar las cerradas.
  const leidas = new Map<string, DiaActivo[]>();
  for (const d of r.value.dias) {
    const semana = lunesDeSemana(d.fecha);
    leidas.set(semana, [...(leidas.get(semana) ?? []), d]);
  }
  for (const semana of semanas) {
    if (semana < primeraFaltante) continue;
    // Una semana sin actividad se cachea igual, como lista vacía: "no hubo
    // nada" es un dato, y si no se guardara se volvería a leer para siempre.
    guardarSemanaCache(miembro, semana, leidas.get(semana) ?? [], semana === semanaHoy);
  }

  const dias = semanas.flatMap((s) =>
    s < primeraFaltante! ? (cacheadas.get(s) ?? []) : (leidas.get(s) ?? []),
  );
  return ok({ dias, truncado: r.value.truncado });
}

/** El lunes siguiente. */
function sumarSemana(lunes: string): Date {
  const d = new Date(lunes + "T00:00:00");
  d.setDate(d.getDate() + 7);
  return d;
}

/** El domingo de la semana que arranca en `lunes`. */
function domingoDeSemana(lunes: string): string {
  const d = new Date(lunes + "T00:00:00");
  d.setDate(d.getDate() + 6);
  return ymdLocal(d);
}

export async function getHistorialEntry(id: string): Promise<Result<Historial>> {
  try {
    const snap = await getDoc(doc(db, "historial", id));
    if (!snap.exists()) return err(`Historial ${id} no encontrado`);
    return ok(snap.data() as Historial);
  } catch (e) {
    return err(firebaseErrorMessage(e));
  }
}

// ── Enriquecimiento biométrico (ADR #021) ─────────────────────────────────────

/**
 * Actualiza un Historial existente con biometría post-import.
 * Si vienen `bloques` enriquecidos (granularidad "serie"), los escribe también.
 * Escribe solo documentos del propio miembro (ADR #014).
 */
export async function enriquecerHistorial(
  idHist: string,
  biometria: BiometriaSesion,
  bloques?: BloqueRegistro[],
): Promise<Result<void>> {
  try {
    const patch: Record<string, unknown> = { biometria };
    if (bloques) patch.bloques = bloques;
    await updateDoc(doc(db, "historial", idHist), patch);
    return ok(undefined);
  } catch (e) {
    return err(firebaseErrorMessage(e));
  }
}

/** Límite de Firestore: 500 operaciones por batch. Con margen. */
const MAX_OPS_POR_BATCH = 400;

// P76b: acá vivía `guardarEntradasExternas`, que copiaba cada actividad de
// salud a /historial como `tipo: "externa"`. Con el import real eran 2257
// documentos duplicando filas que ya estaban enteras en /cardio, y dos copias
// que podían divergir. Ahora el historial FILTRA /cardio al leer
// (`lib/actividadRelevante.ts`): no se escribe nada y mover el umbral no obliga
// a migrar.

// ── Borrado ───────────────────────────────────────────────────────────────────

/** writeBatch que se auto-flushea cada `MAX_OPS_POR_BATCH` operaciones (límite Firestore: 500). */
function batchAutoFlush() {
  let batch = writeBatch(db);
  let ops = 0;
  return {
    delete(ref: ReturnType<typeof doc>) {
      batch.delete(ref);
      ops++;
    },
    async flushSiHaceFalta() {
      if (ops >= MAX_OPS_POR_BATCH) {
        await batch.commit();
        batch = writeBatch(db);
        ops = 0;
      }
    },
    async commitFinal() {
      if (ops > 0) await batch.commit();
    },
  };
}

/** Borra un registro de historial: su subcolección `media` y, si tiene `idSesion`, la sesión asociada. */
export async function borrarSesionHistorial(idHist: string): Promise<Result<void>> {
  try {
    const histRef  = doc(db, "historial", idHist);
    const histSnap = await getDoc(histRef);
    if (!histSnap.exists()) return err(`Historial ${idHist} no encontrado`);
    const idSesion = (histSnap.data() as Historial).idSesion;

    const b = batchAutoFlush();
    const mediaSnap = await getDocs(collection(db, "historial", idHist, "media"));
    for (const mediaDoc of mediaSnap.docs) {
      b.delete(mediaDoc.ref);
      await b.flushSiHaceFalta();
    }
    b.delete(histRef);
    if (idSesion) b.delete(doc(db, "sesiones", idSesion));
    await b.commitFinal();

    return ok(undefined);
  } catch (e) {
    return err(firebaseErrorMessage(e));
  }
}

/** Borra todo el historial (y sesiones) de un miembro. No toca /ejercicios ni /rutinas. */
export async function borrarHistorialMiembro(
  miembro: MiembroId,
): Promise<Result<{ historial: number; sesiones: number }>> {
  try {
    const histSnap = await getDocs(
      query(collection(db, "historial"), where("miembro", "==", miembro)),
    );
    const sesSnap = await getDocs(
      query(collection(db, "sesiones"), where("miembro", "==", miembro)),
    );

    const b = batchAutoFlush();
    for (const histDoc of histSnap.docs) {
      const mediaSnap = await getDocs(collection(db, "historial", histDoc.id, "media"));
      for (const mediaDoc of mediaSnap.docs) {
        b.delete(mediaDoc.ref);
        await b.flushSiHaceFalta();
      }
      b.delete(histDoc.ref);
      await b.flushSiHaceFalta();
    }
    for (const sesDoc of sesSnap.docs) {
      b.delete(sesDoc.ref);
      await b.flushSiHaceFalta();
    }
    await b.commitFinal();

    return ok({ historial: histSnap.size, sesiones: sesSnap.size });
  } catch (e) {
    return err(firebaseErrorMessage(e));
  }
}
