// ════════════════════════════════════════════════════════════════════════════
//  lib/paqueteAnalisis.ts — el paquete de una sesión para el análisis asistido
//  (P93). Diseño en docs/ANALISIS-ASISTIDO.md.
//
//  Tres niveles, en el orden en que se leen: la SESIÓN, cada EJERCICIO y el
//  CONTEXTO. Adelante va quién entrena, y al principio del texto el prompt
//  versionado, que el llamador pasa tal cual (el archivo es la fuente).
//
//  Reglas que el paquete cumple, porque un análisis que no las conoce saca
//  conclusiones sobre ruido:
//    - lo que dice qué tan confiable es el dato (fcDudosa, coberturas, motivo,
//      kcalEstimada) va SIEMPRE, en null si no aplica;
//    - si se adoptó la ventana del reloj, van las dos duraciones, nombradas;
//    - la curva va a 30 s, promedio de cada balde; un balde vacío se omite y
//      NO se interpola: un hueco se ve como hueco;
//    - tope de 60 KB: se recorta el contexto, después la curva a 60 s, después
//      la curva entera, y el paquete dice qué se recortó.
//
//  Puro (ADR #009): no lee Firebase ni toca React.
// ════════════════════════════════════════════════════════════════════════════
import type {
  ArmadoAnalisis, BloqueEjercicio, BloqueRegistro, Historial, PerfilMiembro, Prescripcion, Rutina,
} from "../types/models";
import type { LiveDataPoint } from "../import/samsungLiveData";
import { armadoDe, discrepanciaDuracion, origenVentana, PASO_CURVA_MS, PASO_CURVA_RECORTADA_MS, TOPE_PAQUETE_BYTES, VERSION_ESQUEMA_ANALISIS } from "./analisis";
import { soloShapeUp } from "./tipoHistorial";

// ── La curva ─────────────────────────────────────────────────────────────────

/** Un punto de la curva submuestreada: segundos desde el inicio de la ventana y FC. */
export type PuntoCurva = [seg: number, fc: number];

/**
 * Promedio de la FC en baldes de `pasoMs`, desde `origenMs`. Cada punto lleva
 * el segundo de inicio de su balde. **Un balde sin muestras se omite y no se
 * interpola**: el hueco tiene que verse. Solo entran las muestras de
 * `[origenMs, finMs]`.
 */
export function submuestrear(
  curva: LiveDataPoint[],
  pasoMs: number,
  origenMs: number,
  finMs: number = Number.POSITIVE_INFINITY,
): PuntoCurva[] {
  const baldes = new Map<number, { suma: number; n: number }>();
  for (const p of curva) {
    if (!Number.isFinite(p.fc) || p.ms < origenMs || p.ms > finMs) continue;
    const i = Math.floor((p.ms - origenMs) / pasoMs);
    const b = baldes.get(i) ?? { suma: 0, n: 0 };
    b.suma += p.fc;
    b.n += 1;
    baldes.set(i, b);
  }
  return [...baldes.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([i, b]) => [Math.round((i * pasoMs) / 1000), Math.round(b.suma / b.n)]);
}

// ── La entrada ───────────────────────────────────────────────────────────────

export interface ContextoPaquete {
  /** Historial del miembro, para las sesiones previas del mismo ejercicio y la semana. */
  historial: Historial[];
  /** La rutina de la sesión, para la prescripción de cada bloque. */
  rutina?: Pick<Rutina, "nombre" | "nivel" | "objetivo" | "bloques"> | null;
  perfil?: PerfilMiembro | null;
  /** La meta semanal vigente, o null si no hay plan ni override. */
  metaSemanalDias?: number | null;
  nocheAnterior?: { horasTotal: number; horaAcostarse?: string; horaLevantarse?: string } | null;
  fcReposoDia?: number | null;
}

export interface EntradaPaquete {
  sesion: Historial;
  contexto: ContextoPaquete;
  /** La curva fina de la sesión, si se pudo leer. Nunca se persiste (ADR #016). */
  curva?: LiveDataPoint[] | null;
  /** El texto de `docs/analisis/prompt-sesion-v{N}.md`, tal cual. */
  prompt: string;
  tope?: number;
}

export interface PaqueteArmado {
  /** Lo que se copia: el prompt y el JSON de los datos. */
  texto: string;
  bytes: number;
  /** Qué se recortó para entrar en el tope, en castellano. Vacío si nada. */
  recortes: string[];
  /** Si aun recortando no entró. Se copia igual y la pantalla lo dice. */
  excedeTope: boolean;
  datos: PaqueteSesion;
}

// ── La forma del paquete ─────────────────────────────────────────────────────

export interface PaqueteSesion {
  paquete: {
    tipo: "sesion";
    /** Lo que el chat tiene que copiar en su respuesta. */
    responderCon: { version: number; tipo: "sesion"; idHist: string; armado: ArmadoAnalisis };
    recortes: string[];
    avisos: string[];
  };
  quienEntrena: Record<string, unknown>;
  sesion: Record<string, unknown>;
  ejercicios: Record<string, unknown>[];
  curva: { pasoSeg: number; origen: string; columnas: ["seg", "fc"]; puntos: PuntoCurva[] } | null;
  contexto: Record<string, unknown> | null;
}

// ── El armado ────────────────────────────────────────────────────────────────

const r1 = (n: number | undefined | null) => (n == null ? null : Math.round(n * 10) / 10);
const r2 = (n: number | undefined | null) => (n == null ? null : Math.round(n * 100) / 100);
const hhmm = (ms: number | undefined) =>
  ms == null ? null
    : new Date(ms).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false });

/** Quita las claves `undefined` (las `null` se quedan: son "no hay", a propósito). */
function limpio<T extends Record<string, unknown>>(o: T): T {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as T;
}

function prescripcionCorta(p: Prescripcion): Record<string, unknown> {
  switch (p.modalidad) {
    case "Fuerza":
      return limpio({ series: p.series, reps: p.repsObjetivo.raw, cargaKg: p.cargaKg, rirObjetivo: p.rirObjetivo, descansoSeg: p.descansoSeg, tempo: p.tempo });
    case "Cardio":
      return limpio({ formato: p.formato, duracionMin: p.duracionMin, rondas: p.rondas, trabajoSeg: p.trabajoSeg, descansoSeg: p.descansoSeg, zonaObjetivo: p.zonaObjetivo, juego: p.juegoSugerido });
    case "Movilidad":
      return limpio({ rondas: p.rondas, holdSeg: p.duracionHoldSeg, reps: p.repsObjetivo?.raw, descansoSeg: p.descansoSeg });
    case "Isométrico":
      return limpio({ series: p.series, holdSeg: p.duracionHoldSeg, descansoSeg: p.descansoSeg });
  }
}

/** La prescripción del bloque en la rutina: por orden, y si no coincide, por ejercicio. */
function bloqueDeRutina(b: BloqueRegistro, rutina: ContextoPaquete["rutina"]): BloqueEjercicio | undefined {
  const bloques = rutina?.bloques ?? [];
  const id = b.idEjercicioOriginal ?? b.idEjercicio;
  return bloques.find((x) => x.orden === b.orden && x.idEjercicio === id)
    ?? bloques.find((x) => x.idEjercicio === id);
}

function ejercicio(b: BloqueRegistro, rutina: ContextoPaquete["rutina"], origenMs: number | null): Record<string, unknown> {
  const seg = (ms: number | undefined) => (ms == null || origenMs == null ? undefined : Math.round((ms - origenMs) / 1000));
  // La prescripción: la que se usó ese día si la sesión la guardó (hoy solo VR,
  // `prescripcionUsada`); si no, la rutina como está HOY, declarada como tal.
  const presc = b.prescripcionUsada ? undefined : bloqueDeRutina(b, rutina);
  const prescripcion = b.prescripcionUsada
    ? { prescripcion: { ...b.prescripcionUsada }, prescripcionOrigen: "sesion" as const }
    : presc
      ? {
          prescripcion: prescripcionCorta(presc.prescripcion),
          prescripcionOrigen: "rutina-actual" as const,
          prescripcionAclaracion: "Es la rutina como está hoy: puede diferir de la que regía el día de la sesión.",
        }
      : {};
  return limpio({
    orden: b.orden,
    nombre: b.nombreEjercicio,
    modalidad: b.modalidad,
    saltado: b.saltado || undefined,
    motivoSalto: b.motivoSalto,
    sustituyeA: b.idEjercicioOriginal ? (b.nombreEjercicioOriginal ?? b.idEjercicioOriginal) : undefined,
    motivoSustitucion: b.motivoSustitucion,
    ...prescripcion,
    minutosPorZona: b.minutosPorZona,
    minutosBajoZonas: b.minutosBajoZonas,
    series: b.series.map((s, i) => {
      const previa = b.series[i - 1];
      return limpio({
        n: s.serie,
        completada: s.completada,
        reps: s.reps,
        cargaKg: s.cargaKg,
        rir: s.rir,
        desdeSeg: seg(s.inicioMs),
        hastaSeg: seg(s.finMs),
        duracionSeg: s.inicioMs != null && s.finMs != null ? Math.round((s.finMs - s.inicioMs) / 1000) : s.duracionSeg,
        descansoAntesSeg: previa?.finMs != null && s.inicioMs != null ? Math.round((s.inicioMs - previa.finMs) / 1000) : undefined,
        fcMedia: r1(s.fcMedia) ?? undefined,
        fcPico: s.fcPico,
        fcFinSerie: s.fcFinSerie,
        recuperacionBpm: s.recuperacionBpm,
        fcDudosa: s.fcDudosa,
      });
    }),
  });
}

function medidoPorElReloj(h: Historial): Record<string, unknown> | null {
  const b = h.biometria;
  if (!b) return null;
  const s = b.samsung;
  return {
    fcMedia: r1(b.fcMedia),
    fcMax: b.fcMax ?? null,
    fcMin: b.fcMin ?? null,
    zonaPrincipal: b.zonaPrincipal ?? null,
    kcal: b.kcal ?? null,
    duracionMedidaMin: b.duracionMedidaMin ?? null,
    minutosPorZona: b.minutosPorZona ?? null,
    minutosBajoZonas: b.minutosBajoZonas ?? null,
    minutosSinDato: b.minutosSinDato ?? null,
    // Siempre, en null si no aplica: sin esto el análisis no sabe si el dato es flojo.
    calidad: {
      fcDudosa: b.fcDudosa ?? false,
      coberturaFina: r2(b.coberturaFina),
      coberturaTotal: r2(b.coberturaTotal),
      motivoCobertura: b.motivoCobertura ?? null,
      kcalEstimada: b.kcalEstimada ?? false,
    },
    comoSeCruzo: {
      matchPor: b.matchPor,
      granularidad: b.granularidad,
      versionEnriquecimiento: b.versionEnriquecimiento ?? 1,
      ventanaAdoptada: b.ventanaAdoptada ?? "app",
      // Las dos duraciones, nombradas para que no se confundan (P93).
      ...(b.ventanaAdoptada === "samsung" && s ? {
        desfaseDuracionPct: b.desfaseDuracionPct ?? null,
        duracionAppMin: h.duracionRealMin,
        duracionRelojMin: s.duracionVentanaMin,
      } : {}),
    },
    loQueDiceSamsung: s ? limpio({
      duracionVentanaMin: s.duracionVentanaMin,
      duracionDeclaradaMin: s.duracionDeclaradaMin,
      kcal: s.kcal, fcMedia: r1(s.fcMedia) ?? undefined, fcMax: s.fcMax, fcMin: s.fcMin,
    }) : null,
  };
}

function contextoDe(h: Historial, c: ContextoPaquete): Record<string, unknown> {
  const previas = soloShapeUp(c.historial)
    .filter((x) => x.idHist !== h.idHist && x.fechaRealizada <= h.fechaRealizada)
    .sort((a, b) => b.fechaRealizada.localeCompare(a.fechaRealizada));

  const mismoEjercicio = [...new Set(h.bloques.map((b) => b.idEjercicio))].map((id) => {
    const nombre = h.bloques.find((b) => b.idEjercicio === id)?.nombreEjercicio;
    const sesiones = previas
      .map((x) => ({ x, b: x.bloques.find((bb) => bb.idEjercicio === id) }))
      .filter((p): p is { x: Historial; b: BloqueRegistro } => !!p.b && p.b.series.some((s) => s.completada))
      .slice(0, 5)
      .map(({ x, b }) => limpio({
        fecha: x.fechaRealizada,
        // Qué sesión era: el mismo ejercicio puede estar en una libre o en otra rutina.
        enSesion: x.tipo === "libre" ? "Sesión libre" : x.nombreRutina,
        series: b.series.filter((s) => s.completada).map((s) => limpio({
          reps: s.reps, cargaKg: s.cargaKg, rir: s.rir,
          duracionSeg: s.inicioMs != null && s.finMs != null ? Math.round((s.finMs - s.inicioMs) / 1000) : s.duracionSeg,
          fcMedia: r1(s.fcMedia) ?? undefined,
        })),
        prescripcionDeEsaSesion: b.prescripcionUsada,
        fcMediaSesion: r1(x.biometria?.fcMedia) ?? undefined,
      }));
    return { ejercicio: nombre, ultimasSesiones: sesiones };
  });

  const deLaSemana = soloShapeUp(c.historial)
    .filter((x) => x.semanaInicio === h.semanaInicio && x.fechaRealizada <= h.fechaRealizada);
  const dias = new Set(deLaSemana.map((x) => x.fechaRealizada));
  if (h.tipo === "rutina" || h.tipo === "libre" || h.tipo == null) dias.add(h.fechaRealizada);

  return {
    mismoEjercicio,
    semana: {
      lunes: h.semanaInicio,
      metaDias: c.metaSemanalDias ?? null,
      diasEntrenadosHastaEsteDia: dias.size,
    },
    dia: {
      suenoNocheAnteriorH: r1(c.nocheAnterior?.horasTotal),
      acostarse: c.nocheAnterior?.horaAcostarse ?? null,
      levantarse: c.nocheAnterior?.horaLevantarse ?? null,
      fcReposo: c.fcReposoDia != null ? Math.round(c.fcReposoDia) : null,
    },
  };
}

function avisosDe(h: Historial, curva: PaqueteSesion["curva"]): string[] {
  const avisos: string[] = [];
  if (!h.biometria) {
    avisos.push("Sin datos del reloj: se pueden mirar series, cargas, RIR y descansos, pero no se puede concluir nada fisiológico.");
  } else if (!curva) {
    avisos.push("Hay cifras del reloj para la sesión, pero no la curva: no se puede ver la forma (deriva, recuperación).");
  }
  if (h.biometria?.fcDudosa) avisos.push("La curva de esta sesión tiene pinta de artefactos (fcDudosa): tomar la FC con cuidado.");
  if (h.biometria?.coberturaFina != null && h.biometria.coberturaFina < 0.8) {
    avisos.push(`El reloj midió solo el ${Math.round(h.biometria.coberturaFina * 100)} % de la sesión.`);
  }
  if (h.biometria?.kcalEstimada) avisos.push("Las kcal son un prorrateo por tiempo (kcalEstimada), no la cifra entera del reloj.");
  if (h.completitud === "parcial") avisos.push("La sesión se guardó como parcial: no se completó lo planificado.");
  return avisos;
}

const fmtMin = (n: number) => n.toLocaleString("es-AR", { maximumFractionDigits: 1 });

/** La nota de la enmienda de P93: los dos números, y que los datos no cierran. */
function notaDiscrepancia(d: { duracionRegistradaMin: number; tramoSeriesMin: number }): string {
  return `Los datos no cierran: la duración registrada es ${fmtMin(d.duracionRegistradaMin)} min, pero las series abarcan ${fmtMin(d.tramoSeriesMin)} min. La ventana salió de las series porque la sesión no tiene inicio y cierre propios: no se pueden sacar conclusiones de duración ni de densidad.`;
}

/** Serializa legible, con los puntos de la curva en una sola línea cada uno. */
function serializar(prompt: string, datos: PaqueteSesion): string {
  const json = JSON.stringify(datos, null, 1)
    .replace(/\[\s*(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)\s*\]/g, "[$1,$2]");
  return `${prompt.trimEnd()}\n\n## Los datos\n\n\`\`\`json\n${json}\n\`\`\`\n`;
}

const bytesDe = (texto: string) => new TextEncoder().encode(texto).length;

/** Arma el paquete de una sesión, dentro del tope si se puede. */
export function armarPaqueteSesion(e: EntradaPaquete): PaqueteArmado {
  const h = e.sesion;
  const tope = e.tope ?? TOPE_PAQUETE_BYTES;
  const armado = armadoDe(h);
  const ventana = armado.ventana;
  const discrepancia = discrepanciaDuracion(h);
  const p = e.contexto.perfil;

  // Sin ninguna ventana (sesiones viejas sin series selladas), la curva se
  // alinea desde su primera muestra: es la del tramo que se cruzó, no hay otra.
  const curvaOrdenada = e.curva && e.curva.length > 0 ? [...e.curva].sort((a, b) => a.ms - b.ms) : null;
  const marco = ventana
    ?? (curvaOrdenada ? { inicioMs: curvaOrdenada[0].ms, finMs: curvaOrdenada[curvaOrdenada.length - 1].ms } : null);
  const origen = ventana
    ? "segundos desde el inicio de la ventana"
    : "segundos desde la primera muestra del reloj (la sesión no tiene ventana propia: las series no se pueden alinear)";
  const curvaA = (pasoMs: number): PaqueteSesion["curva"] => {
    if (!curvaOrdenada || !marco) return null;
    const puntos = submuestrear(curvaOrdenada, pasoMs, marco.inicioMs, marco.finMs);
    return puntos.length > 0 ? { pasoSeg: pasoMs / 1000, origen, columnas: ["seg", "fc"], puntos } : null;
  };

  const datos: PaqueteSesion = {
    paquete: {
      tipo: "sesion",
      responderCon: { version: VERSION_ESQUEMA_ANALISIS, tipo: "sesion", idHist: h.idHist, armado },
      recortes: [],
      avisos: [],
    },
    quienEntrena: {
      miembro: h.miembro,
      edad: null,
      objetivos: p?.objetivos ?? [],
      nivelDeLaRutina: e.contexto.rutina?.nivel ?? null,
      objetivoDeLaRutina: e.contexto.rutina?.objetivo ?? null,
      // P97: las zonas con que se calcularon los minutos por zona de ESTA
      // sesión, no las del perfil de hoy. Sin marca (anterior a P97), las del perfil.
      fcMaxTeorica: h.biometria?.fcMaxUsada ?? p?.fcMaxTeorica ?? null,
      zonasFC: h.biometria?.zonasUsadas ?? p?.zonasFC ?? null,
    },
    sesion: {
      idHist: h.idHist,
      fecha: h.fechaRealizada,
      tipo: h.tipo ?? "rutina",
      nombre: h.tipo === "juego" ? (h.nombreJuego ?? h.nombreRutina) : h.nombreRutina,
      completitud: h.completitud ?? "completa",
      horaInicio: hhmm(h.inicioMs),
      horaFin: hhmm(h.finMs),
      duracionAppMin: h.duracionRealMin,
      ventana: ventana ? { duracionMin: r1((ventana.finMs - ventana.inicioMs) / 60_000) } : null,
      ventanaOrigen: origenVentana(h),
      ...(discrepancia ? { discrepanciaDuracion: { ...discrepancia, nota: notaDiscrepancia(discrepancia) } } : {}),
      rpe: h.rpe,
      tonelajeKg: h.tonelajeKg,
      seriesHechas: h.totalSeriesHechas,
      ...limpio({
        comoMeSenti: h.comoMeSenti || undefined,
        queMejorar: h.queMejorar || undefined,
        molestias: h.molestias?.length ? h.molestias : undefined,
        notas: h.notas || undefined,
        dificultadPercibida: h.dificultadPercibida,
        progresionVR: h.progresionVR,
      }),
      medidoPorElReloj: medidoPorElReloj(h),
    },
    ejercicios: h.bloques.map((b) => ejercicio(b, e.contexto.rutina, ventana?.inicioMs ?? null)),
    curva: curvaA(PASO_CURVA_MS),
    contexto: contextoDe(h, e.contexto),
  };
  datos.paquete.avisos = [
    ...(discrepancia ? [notaDiscrepancia(discrepancia)] : []),
    ...avisosDe(h, datos.curva),
  ];

  // Tope: primero el contexto, después la curva a 60 s, después la curva.
  const recortes: string[] = [];
  const medir = () => bytesDe(serializar(e.prompt, { ...datos, paquete: { ...datos.paquete, recortes } }));
  if (medir() > tope && datos.contexto) {
    datos.contexto = null;
    recortes.push("contexto (sesiones previas, semana y día)");
  }
  if (medir() > tope && datos.curva) {
    datos.curva = curvaA(PASO_CURVA_RECORTADA_MS);
    recortes.push("curva bajada a un punto cada 60 s");
  }
  if (medir() > tope && datos.curva) {
    datos.curva = null;
    recortes.push("curva entera");
  }
  datos.paquete.recortes = recortes;
  const texto = serializar(e.prompt, datos);
  const bytes = bytesDe(texto);
  return { texto, bytes, recortes, excedeTope: bytes > tope, datos };
}
