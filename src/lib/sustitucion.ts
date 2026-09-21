// ════════════════════════════════════════════════════════════════════════════
//  lib/sustitucion.ts — qué hacer en lugar de un ejercicio (P73, Bloque 3).
//
//  Si un ejercicio no se puede hacer —porque duele, porque la máquina está
//  ocupada o porque no tenés el equipo— la app ofrece **uno**, con la razón en
//  una línea. No una lista de veinte para elegir: uno, y el resto escondido.
//
//  **La sustitución se calcula, no se lee.** Los campos `alternativas`,
//  `progresiones` y `regresiones` del catálogo están vacíos en las 873 fichas
//  (verificado en el Paso 0), y llenarlos a mano para 873 ejercicios no es
//  trabajo que valga la pena antes de saber si el ranking acierta.
//
//  Todos los pesos y umbrales viven en constantes nombradas acá arriba, para
//  poder ajustarlos sin tocar la lógica.
//
//  ── Los grupos secundarios miden SIMILITUD, no coincidencias ─────────────
//  Contar los compartidos premiaba a las fichas con muchos secundarios
//  declarados: un ejercicio con seis secundarios comparte más por tener más,
//  no por parecerse más. Ahora se usa la proporción **compartidos / unión**
//  escalada a `TOPE_GRUPOS_SECUNDARIOS`, que es lo mismo para los dos lados y
//  no depende de cuántos haya.
//
//  Consecuencia buscada: un candidato **sin secundarios declarados suma 0**.
//  No es un castigo, es que no hay con qué medir el parecido. Y son muchas las
//  fichas del catálogo con la lista vacía.
//
//  Núcleo puro (ADR #009): sin Firebase, se testea solo.
// ════════════════════════════════════════════════════════════════════════════

import type {
  Ejercicio, Equipo, GrupoMuscular, Historial, PatronMovimiento, Nivel, ZonaMolestia,
} from "../types/models";
import { NIVELES } from "../types/models";

export type MotivoSustitucion = "dolor" | "equipo-ocupado" | "no-me-sale" | "otro";

// ── Pesos del puntaje ──────────────────────────────────────────────────────

/** Mismo músculo principal: es lo que más importa, entrenás lo mismo. */
export const PESO_MISMO_GRUPO = 40;
/**
 * Lo que aportan los grupos secundarios cuando coinciden del todo.
 *
 * Es un tope y una escala a la vez: el aporte real es la proporción de grupos
 * compartidos sobre la unión de los dos, multiplicada por esto.
 */
export const TOPE_GRUPOS_SECUNDARIOS = 15;
/** Ya lo hiciste: sabés cómo se hace y con cuánto. Pesa casi como el grupo. */
export const PESO_YA_LO_HICISTE = 30;
/** Misma mecánica (compuesto o aislado). */
export const PESO_MISMA_MECANICA = 10;
/** Mismo unilateral. */
export const PESO_MISMO_UNILATERAL = 5;
/** Mismo perfil de carga: libre o guiado. */
export const PESO_MISMO_PERFIL_CARGA = 5;
/** Lo hiciste hace muy poco: sirve, pero no es lo mejor para hoy. */
export const PENALIZACION_FRESCURA = -20;
/** Cuánto hace falta que pase para que deje de penalizar. */
export const VENTANA_FRESCURA_MS = 48 * 60 * 60 * 1000;

/** Equipos que hacen a un ejercicio "guiado" en vez de libre. */
export const EQUIPOS_GUIADOS: Equipo[] = ["Máquina", "Polea"];

/** Siempre disponible: no hace falta declararlo para poder hacerlo. */
export const EQUIPO_SIEMPRE_DISPONIBLE: Equipo = "Peso corporal";

/** Cuántas opciones se ofrecen además de la recomendada. */
export const MAX_ALTERNATIVAS = 4;

/**
 * Qué se descarta con cada zona de molestia.
 *
 * Un candidato se descarta si su `grupoMuscularPrimario` o alguno de sus
 * `gruposSecundarios` está en `grupos`, o si su `patron` está en `patrones`.
 *
 * **Con zona `otra` no se descarta nada**: no hay información para hacerlo, y
 * descartar a ciegas dejaría sin opciones a quien marcó "otra" justamente
 * porque no sabe qué le duele.
 */
export const DESCARTES_POR_ZONA: Record<
  ZonaMolestia,
  { grupos: GrupoMuscular[]; patrones: PatronMovimiento[] }
> = {
  hombro:  { grupos: ["Hombros", "Pecho", "Trapecios"], patrones: ["Empuje vertical", "Empuje horizontal"] },
  codo:    { grupos: ["Tríceps", "Bíceps", "Antebrazos"], patrones: [] },
  muñeca:  { grupos: ["Antebrazos"], patrones: [] },
  espalda: { grupos: ["Lumbares", "Espalda media", "Dorsales"], patrones: ["Dominante de cadera", "Tracción horizontal"] },
  cadera:  { grupos: ["Glúteos", "Aductores", "Abductores"], patrones: ["Dominante de cadera"] },
  rodilla: { grupos: ["Cuádriceps", "Isquios"], patrones: ["Dominante de rodilla", "Zancada / unilateral"] },
  tobillo: { grupos: ["Pantorrillas"], patrones: ["Locomoción / cardio", "Zancada / unilateral"] },
  otra:    { grupos: [], patrones: [] },
};

// ── Tipos públicos ─────────────────────────────────────────────────────────

export interface OpcionesSustitucion {
  catalogo:  Ejercicio[];
  original:  Ejercicio;
  /** El equipo del lugar donde estás, de `equipoDe()` (P72). */
  equipo:    Equipo[];
  /** El historial del miembro, para saber qué ya hiciste. */
  historial: Historial[];
  motivo?:   MotivoSustitucion;
  /** Solo si `motivo === "dolor"`. */
  zona?:     ZonaMolestia;
  now:       number;
}

export interface Candidato {
  ejercicio:   Ejercicio;
  puntaje:     number;
  /** Una línea para mostrar, nunca más de tres partes. */
  razon:       string;
  yaLoHiciste: boolean;
  ultimaCargaKg?: number;
  ultimaFecha?:   string;
}

// ── Historial ──────────────────────────────────────────────────────────────

/** La última vez que se hizo el ejercicio, con su carga, o `null`. */
export function ultimaVezQueLoHiciste(
  idEjercicio: string,
  historial: Historial[],
): { fecha: string; ms?: number; cargaKg?: number } | null {
  let mejor: { fecha: string; ms?: number; cargaKg?: number } | null = null;

  for (const h of historial) {
    for (const b of h.bloques ?? []) {
      if (b.idEjercicio !== idEjercicio) continue;
      const hechas = b.series.filter((s) => s.completada);
      if (hechas.length === 0) continue;
      if (mejor && h.fechaRealizada <= mejor.fecha) continue;

      const cargas = hechas.map((s) => s.cargaKg).filter((c): c is number => c != null);
      mejor = {
        fecha: h.fechaRealizada,
        ms: h.finMs ?? h.inicioMs,
        cargaKg: cargas.length > 0 ? Math.max(...cargas) : undefined,
      };
    }
  }
  return mejor;
}

/** Cuántas veces se hizo el ejercicio, contando sesiones con series completadas. */
export function vecesQueLoHiciste(idEjercicio: string, historial: Historial[]): number {
  let veces = 0;
  for (const h of historial) {
    const lo = (h.bloques ?? []).some(
      (b) => b.idEjercicio === idEjercicio && b.series.some((s) => s.completada),
    );
    if (lo) veces++;
  }
  return veces;
}

// ── Filtros duros ──────────────────────────────────────────────────────────

function tieneElEquipo(ej: Ejercicio, disponible: Equipo[]): boolean {
  return ej.equipo.every(
    (e) => e === EQUIPO_SIEMPRE_DISPONIBLE || disponible.includes(e),
  );
}

function nivelNum(n: Nivel): number {
  return NIVELES.indexOf(n);
}

function cargaLaZona(ej: Ejercicio, zona: ZonaMolestia): boolean {
  const { grupos, patrones } = DESCARTES_POR_ZONA[zona];
  if (patrones.includes(ej.patron)) return true;
  if (grupos.includes(ej.grupoMuscularPrimario)) return true;
  return ej.gruposSecundarios.some((g) => grupos.includes(g));
}

/** Los que pasan los filtros duros. `conNivel` en false relaja el de nivel. */
function filtrar(opts: OpcionesSustitucion, conNivel: boolean): Ejercicio[] {
  const { catalogo, original, equipo, motivo, zona } = opts;
  const topeNivel = nivelNum(original.nivel);

  return catalogo.filter((ej) => {
    if (ej.idEjercicio === original.idEjercicio) return false;
    if (!tieneElEquipo(ej, equipo)) return false;
    if (ej.patron !== original.patron) return false;
    if (conNivel && nivelNum(ej.nivel) > topeNivel) return false;
    if (motivo === "dolor" && zona && cargaLaZona(ej, zona)) return false;
    return true;
  });
}

// ── Puntaje y razón ────────────────────────────────────────────────────────

function esGuiado(ej: Ejercicio): boolean {
  return ej.equipo.some((e) => EQUIPOS_GUIADOS.includes(e));
}

function fechaCorta(ymd: string): string {
  const [, m, d] = ymd.split("-");
  return `${Number(d)}/${Number(m)}`;
}

function formatearKg(kg: number): string {
  return kg.toLocaleString("es-AR", { maximumFractionDigits: 1 });
}

/**
 * La razón, en castellano y como mucho tres partes.
 *
 * El patrón siempre coincide (es filtro duro), así que "mismo patrón" está
 * siempre: es lo que explica por qué esto reemplaza a aquello.
 */
function armarRazon(
  ej: Ejercicio,
  original: Ejercicio,
  ultima: { fecha: string; cargaKg?: number } | null,
): string {
  const partes: string[] = ["mismo patrón"];
  if (ej.grupoMuscularPrimario === original.grupoMuscularPrimario) partes.push("mismo grupo");

  const equipoDeclarado = ej.equipo.filter((e) => e !== EQUIPO_SIEMPRE_DISPONIBLE);
  if (equipoDeclarado.length > 0) {
    partes.push(`tenés ${equipoDeclarado[0].toLowerCase()}`);
  }

  if (ultima) {
    partes.push(
      ultima.cargaKg != null
        ? `lo hiciste el ${fechaCorta(ultima.fecha)} con ${formatearKg(ultima.cargaKg)} kg`
        : "ya lo hiciste",
    );
  }

  return partes.slice(0, 3).join(", ");
}

/**
 * Qué tanto se parecen los grupos secundarios: compartidos sobre la unión.
 *
 * De 0 a 1. Con cualquiera de las dos listas vacía da 0 — sin secundarios
 * declarados no hay parecido que medir.
 */
export function similitudSecundarios(a: Ejercicio, b: Ejercicio): number {
  const deA = new Set(a.gruposSecundarios);
  const deB = new Set(b.gruposSecundarios);
  if (deA.size === 0 || deB.size === 0) return 0;

  let compartidos = 0;
  for (const g of deA) if (deB.has(g)) compartidos++;
  const union = deA.size + deB.size - compartidos;
  return union > 0 ? compartidos / union : 0;
}

function puntuar(
  ej: Ejercicio,
  opts: OpcionesSustitucion,
  ultima: { fecha: string; ms?: number; cargaKg?: number } | null,
): number {
  const { original, now } = opts;
  let p = 0;

  if (ej.grupoMuscularPrimario === original.grupoMuscularPrimario) p += PESO_MISMO_GRUPO;

  p += similitudSecundarios(ej, original) * TOPE_GRUPOS_SECUNDARIOS;

  if (ultima) p += PESO_YA_LO_HICISTE;
  if (ej.mecanica != null && ej.mecanica === original.mecanica) p += PESO_MISMA_MECANICA;
  if (ej.unilateral === original.unilateral) p += PESO_MISMO_UNILATERAL;
  if (esGuiado(ej) === esGuiado(original)) p += PESO_MISMO_PERFIL_CARGA;

  // Frescura: si lo hiciste hace menos de 48 h, hoy conviene otra cosa. Baja
  // el puntaje, no lo elimina — sigue siendo una opción válida.
  if (ultima?.ms != null && now - ultima.ms < VENTANA_FRESCURA_MS) p += PENALIZACION_FRESCURA;

  return p;
}

// ── Función principal ──────────────────────────────────────────────────────

/**
 * Los sustitutos posibles, del mejor al peor.
 *
 * Si con el filtro de nivel no queda nada, se reintenta sin él y se avisa con
 * `relajado: true` — mejor ofrecer algo de más nivel que no ofrecer nada. Si
 * sigue sin haber, la lista va vacía y la UI cae en el buscador.
 *
 * El desempate es **estable y testeable**, en tres escalones: primero el menos
 * usado (para variar el estímulo), después el que tiene el **mismo nivel que
 * el original** —entre dos empatados, el que está a tu altura es mejor
 * reemplazo que uno más fácil— y recién ahí el alfabético, que no significa
 * nada y está solo para que el resultado no dependa del orden de entrada.
 */
export function sugerirSustitutos(
  opts: OpcionesSustitucion,
): { candidatos: Candidato[]; relajado: boolean } {
  const construir = (ejercicios: Ejercicio[]): Candidato[] =>
    ejercicios
      .map((ej) => {
        const ultima = ultimaVezQueLoHiciste(ej.idEjercicio, opts.historial);
        return {
          ejercicio: ej,
          puntaje: puntuar(ej, opts, ultima),
          razon: armarRazon(ej, opts.original, ultima),
          yaLoHiciste: ultima != null,
          ultimaCargaKg: ultima?.cargaKg,
          ultimaFecha: ultima?.fecha,
        };
      })
      .sort((a, b) => {
        const mismoNivel = (c: Candidato) => (c.ejercicio.nivel === opts.original.nivel ? 0 : 1);
        return b.puntaje - a.puntaje
          || vecesQueLoHiciste(a.ejercicio.idEjercicio, opts.historial)
             - vecesQueLoHiciste(b.ejercicio.idEjercicio, opts.historial)
          || mismoNivel(a) - mismoNivel(b)
          || a.ejercicio.nombre.localeCompare(b.ejercicio.nombre, "es");
      });

  const estrictos = filtrar(opts, true);
  if (estrictos.length > 0) return { candidatos: construir(estrictos), relajado: false };

  const relajados = filtrar(opts, false);
  if (relajados.length > 0) return { candidatos: construir(relajados), relajado: true };

  return { candidatos: [], relajado: false };
}
