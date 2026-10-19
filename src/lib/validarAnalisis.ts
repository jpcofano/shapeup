// ════════════════════════════════════════════════════════════════════════════
//  lib/validarAnalisis.ts — valida el JSON que vuelve del chat (P93).
//
//  El JSON es DATO EXTERNO. Acá se decide qué entra y qué no, antes de guardar
//  nada:
//    - el esquema completo, campo por campo, con tipos (sin `as`);
//    - `idHist` tiene que ser el de la sesión donde se está cargando: pegar el
//      análisis de otra sesión es el error más fácil y el más difícil de ver;
//    - topes de largo y de cantidad, para que no se vuelva un ensayo;
//    - todo hallazgo con su `evidencia`: si no, no se guarda;
//    - los campos que no están en el esquema se descartan (no "por si acaso");
//    - nada se ejecuta: los textos son textos, y React los escapa al mostrar.
//  Si el chat puso texto alrededor del JSON, se busca el objeto y se sigue.
//
//  Esquema 3 (P99): suma el veredicto, los dos destacados y las marcas del
//  análisis. Con el contexto de la sesión al cargar, rechaza además una
//  `refMarca` que no esté entre las marcas del paquete, un tramo fuera de la
//  ventana y un `armado` con otras versiones que las de la sesión.
//
//  Genérico por `tipo` (P94 va a sumar "global"): lo común valida hallazgos,
//  sugerencias, banderas y preguntas; lo propio de cada tipo es la identidad.
//
//  Puro (ADR #009). Devuelve Result, nunca tira.
// ════════════════════════════════════════════════════════════════════════════
import type {
  ArmadoAnalisis, BanderaAnalisis, ConfianzaAnalisis, ContenidoAnalisis,
  HallazgoAnalisis, Historial, IdMarca, MarcaAnalisis, SugerenciaAnalisis, TipoBanderaAnalisis,
} from "../types/models";
import { ok, err, type Result } from "./result";
import { armadoDe, ventanaDelAnalisis, VERSION_ESQUEMA_ANALISIS } from "./analisis";
import { marcasDeSesion } from "./marcasSesion";

/**
 * Topes: largo de cada texto y cantidad de cada lista. Los de cantidad son los
 * del prompt v3 (enmienda de P93): el análisis de prueba salió largo y solo
 * con reparos, y un tope que el esquema no hace cumplir es una sugerencia.
 */
export const TOPES_ANALISIS = {
  modelo: 80,
  generadoEn: 40,
  resumen: 500,
  /** El resumen es de 2 o 3 oraciones. */
  resumenOraciones: 3,
  tema: 60,
  detalle: 600,
  evidencia: 400,
  accion: 300,
  porque: 400,
  cuando: 40,
  bandera: 400,
  pregunta: 300,
  datoFaltante: 120,
  hallazgos: 4,
  sugerencias: 2,
  banderas: 5,
  preguntas: 2,
  datosFaltantes: 6,
  // Esquema 3 (P99)
  veredicto: 240,
  veredictoOraciones: 1,
  /** Exactamente dos. */
  destacados: 2,
  destacado: 300,
  destacadoOraciones: 2,
  marcasAnalisis: 5,
  textoMarcaAnalisis: 200,
} as const;

/**
 * Lo que hace falta saber de la sesión al cargar (P99). Lo arma la pantalla
 * con las marcas recalculadas de la misma sesión: los ids son fijos, así que
 * un análisis guardado sigue apuntando a algo que existe.
 */
export interface ContextoValidacion {
  /** Los ids de las marcas de la app de esta sesión, las que viajan en el paquete. */
  idsMarcas: readonly string[];
  /** La duración de la ventana del análisis, en segundos; null sin ventana (no se aceptan tramos). */
  duracionVentanaS: number | null;
  /** Con qué se armaría hoy el paquete de esta sesión (`armadoDe`). */
  armado: ArmadoAnalisis;
}

/**
 * Cuántas oraciones tiene un texto: cortes en . ! ? … seguidos de espacio o
 * del final. Un decimal (137.9) no corta, porque lo sigue un dígito.
 */
export function contarOraciones(texto: string): number {
  return texto.split(/[.!?…]+(?=\s|$)/).filter((t) => t.trim() !== "").length;
}

/**
 * El contexto de la sesión al cargar (P99): las marcas recalculadas de la
 * misma sesión, su ventana y con qué se armaría hoy el paquete. Los ids de las
 * marcas son fijos, así que un análisis guardado sigue apuntando a algo que
 * existe.
 */
export function contextoValidacion(h: Historial, historial: Historial[]): ContextoValidacion {
  const ventana = ventanaDelAnalisis(h);
  return {
    idsMarcas: marcasDeSesion(h, { historial }).map((m) => m.id),
    duracionVentanaS: ventana ? Math.round((ventana.finMs - ventana.inicioMs) / 1000) : null,
    armado: armadoDe(h),
  };
}

const CONFIANZAS: readonly ConfianzaAnalisis[] = ["alta", "media", "baja"];
const TONOS: readonly MarcaAnalisis["tono"][] = ["positivo", "atencion"];
const TIPOS_BANDERA: readonly TipoBanderaAnalisis[] = ["dato-dudoso", "inconsistencia", "consultar-profesional", "otro"];

export interface ValidacionAnalisis {
  contenido: ContenidoAnalisis;
  /** El bloque `armado` que el chat devolvió, si lo devolvió bien formado. */
  armadoEco: ArmadoAnalisis | null;
  /** Campos que venían y no están en el esquema: se descartaron. */
  descartados: string[];
  /** Si hubo que sacar texto de alrededor del JSON. */
  recuperadoDeTexto: boolean;
}

// ── Sacar el objeto del texto ────────────────────────────────────────────────

/**
 * El primer objeto JSON balanceado del texto. Respeta las comillas: una llave
 * adentro de un string no cuenta. `null` si no hay ninguno completo.
 */
export function extraerObjeto(texto: string): string | null {
  const inicio = texto.indexOf("{");
  if (inicio < 0) return null;
  let nivel = 0;
  let enString = false;
  let escape = false;
  for (let i = inicio; i < texto.length; i++) {
    const c = texto[i];
    if (enString) {
      if (escape) escape = false;
      else if (c === "\\") escape = true;
      else if (c === "\"") enString = false;
      continue;
    }
    if (c === "\"") enString = true;
    else if (c === "{") nivel++;
    else if (c === "}") {
      nivel--;
      if (nivel === 0) return texto.slice(inicio, i + 1);
    }
  }
  return null;
}

function parsear(texto: string): { valor: unknown; recuperado: boolean } | string {
  const t = texto.trim();
  if (t === "") return "No pegaste nada.";
  try {
    return { valor: JSON.parse(t) as unknown, recuperado: false };
  } catch {
    const obj = extraerObjeto(t);
    if (obj) {
      try {
        return { valor: JSON.parse(obj) as unknown, recuperado: true };
      } catch (e) {
        return `El JSON está roto: ${e instanceof Error ? e.message : String(e)}`;
      }
    }
    return "No encontré un JSON en lo que pegaste. El chat tiene que devolver solo el objeto.";
  }
}

// ── Lectores con tipo ────────────────────────────────────────────────────────

type Obj = Record<string, unknown>;
const esObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);

class ErrorCampo extends Error {}
const fallar = (campo: string, que: string): never => { throw new ErrorCampo(`${campo}: ${que}`); };

/** Un texto opcional: `undefined` si falta o está vacío. */
function textoOpc(o: Obj, clave: string, campo: string, tope: number): string | undefined {
  const v = o[clave];
  if (v == null || (typeof v === "string" && v.trim() === "")) return undefined;
  if (typeof v !== "string") return fallar(campo, "tiene que ser texto");
  const s = v.trim();
  if (s.length > tope) fallar(campo, `es demasiado largo (${s.length} caracteres; el máximo es ${tope})`);
  return s;
}

/** Un texto obligatorio: falla si falta. */
function texto(o: Obj, clave: string, campo: string, tope: number): string {
  return textoOpc(o, clave, campo, tope) ?? fallar(campo, "falta");
}

function lista(o: Obj, clave: string, campo: string, tope: number): unknown[] {
  const v = o[clave];
  if (v == null) return [];
  if (!Array.isArray(v)) return fallar(campo, "tiene que ser una lista");
  if (v.length > tope) fallar(campo, `tiene ${v.length} elementos; el máximo es ${tope}`);
  return v;
}

function uno<T extends string>(v: unknown, valores: readonly T[]): T | undefined {
  return valores.find((x) => x === v);
}

/** Anota las claves de `o` que no están en `permitidas`. */
function sobrantes(o: Obj, permitidas: readonly string[], prefijo: string, descartados: string[]) {
  for (const k of Object.keys(o)) if (!permitidas.includes(k)) descartados.push(`${prefijo}${k}`);
}

function leerArmado(v: unknown): ArmadoAnalisis | null {
  if (!esObj(v)) return null;
  const { versionPrompt, versionEsquema, ventana, versionEnriquecimiento } = v;
  if (typeof versionPrompt !== "number" || typeof versionEsquema !== "number") return null;
  if (!(versionEnriquecimiento === null || typeof versionEnriquecimiento === "number")) return null;
  let vent: ArmadoAnalisis["ventana"] = null;
  if (ventana !== null) {
    if (!esObj(ventana) || typeof ventana.inicioMs !== "number" || typeof ventana.finMs !== "number") return null;
    vent = { inicioMs: ventana.inicioMs, finMs: ventana.finMs };
  }
  return { versionPrompt, versionEsquema, ventana: vent, versionEnriquecimiento };
}

// ── El validador ─────────────────────────────────────────────────────────────

const CLAVES_RAIZ = [
  "version", "tipo", "idHist", "generadoEn", "modelo", "resumen",
  "hallazgos", "sugerencias", "banderas", "preguntas", "datosFaltantes", "armado",
  "veredicto", "destacados", "marcasAnalisis",
] as const;

/** Un texto obligatorio con un tope de oraciones (y un mínimo de una). */
function textoConOraciones(o: Obj, clave: string, campo: string, topeLargo: number, maxOraciones: number): string {
  const s = texto(o, clave, campo, topeLargo);
  const n = contarOraciones(s);
  if (n > maxOraciones) {
    fallar(campo, `tiene ${n} oraciones; ${maxOraciones === 1 ? "tiene que ser una sola" : `el máximo es ${maxOraciones}`}`);
  }
  return s;
}

/** Un segundo de la curva: entero, dentro de la ventana. */
function segundo(v: unknown, campo: string, duracionS: number | null): number {
  if (typeof v !== "number" || !Number.isInteger(v)) return fallar(campo, "tiene que ser un número entero de segundos");
  if (duracionS == null) return fallar(campo, "la sesión no tiene ventana: no se puede marcar un tramo");
  if (v < 0 || v > duracionS) fallar(campo, `está fuera de la ventana de la sesión (0 a ${duracionS} s)`);
  return v;
}

/** Las marcas del análisis (esquema 3): a una marca de la app o a un tramo, nunca a los dos. */
function marcasDelAnalisis(raiz: Obj, ctx: ContextoValidacion, descartados: string[]): MarcaAnalisis[] {
  return lista(raiz, "marcasAnalisis", "marcasAnalisis", TOPES_ANALISIS.marcasAnalisis).map((v, i) => {
    const c = `marcasAnalisis[${i}]`;
    if (!esObj(v)) return fallar(c, "tiene que ser un objeto");
    sobrantes(v, ["refMarca", "inicioS", "finS", "tono", "texto"], `${c}.`, descartados);
    const tono = uno(v.tono, TONOS) ?? fallar(`${c}.tono`, "tiene que ser positivo o atencion");
    const textoMarca = texto(v, "texto", `${c}.texto`, TOPES_ANALISIS.textoMarcaAnalisis);
    const conRef = v.refMarca != null;
    const conTramo = v.inicioS != null || v.finS != null;
    if (conRef === conTramo) fallar(c, "tiene que apuntar a una marca de la app (refMarca) o a un tramo (inicioS y finS), no a los dos ni a ninguno");
    if (conRef) {
      if (typeof v.refMarca !== "string" || !ctx.idsMarcas.includes(v.refMarca)) {
        fallar(`${c}.refMarca`, `«${String(v.refMarca)}» no es una marca de esta sesión (hay: ${ctx.idsMarcas.join(", ") || "ninguna"})`);
      }
      return { refMarca: v.refMarca as IdMarca, tono, texto: textoMarca };
    }
    const inicioS = segundo(v.inicioS, `${c}.inicioS`, ctx.duracionVentanaS);
    const finS = segundo(v.finS, `${c}.finS`, ctx.duracionVentanaS);
    if (finS < inicioS) fallar(`${c}.finS`, "es anterior a inicioS");
    return { tramo: { inicioS, finS }, tono, texto: textoMarca };
  });
}

/**
 * El eco de `armado` tiene que ser de las mismas versiones que la sesión al
 * cargar (P99): si cambió el prompt, el esquema o el enriquecimiento, el
 * análisis habla de otro paquete.
 */
function chequearArmado(eco: ArmadoAnalisis | null, actual: ArmadoAnalisis): string | null {
  if (!eco) return null;
  const v = (a: ArmadoAnalisis) => `prompt v${a.versionPrompt}, esquema ${a.versionEsquema}, enriquecimiento ${a.versionEnriquecimiento ?? "—"}`;
  const igual = eco.versionPrompt === actual.versionPrompt
    && eco.versionEsquema === actual.versionEsquema
    && eco.versionEnriquecimiento === actual.versionEnriquecimiento;
  return igual ? null
    : `El análisis se armó con ${v(eco)}, y la sesión hoy está en ${v(actual)}. Volvé a preparar el paquete y pedí el análisis de nuevo.`;
}

/** Una lista de textos cortos (preguntas, datos faltantes). */
function textos(o: Obj, clave: string, tope: number, topeLargo: number): string[] {
  return lista(o, clave, clave, tope).map((v, i) => {
    const c = `${clave}[${i}]`;
    if (typeof v !== "string" || v.trim() === "") return fallar(c, "tiene que ser texto");
    const s = v.trim();
    if (s.length > topeLargo) fallar(c, `es demasiado largo (${s.length} caracteres; el máximo es ${topeLargo})`);
    return s;
  });
}

/**
 * Valida el texto pegado como el análisis de la sesión `idHist`. Si no valida,
 * el error dice qué campo está mal, y no se guarda nada.
 */
export function validarAnalisisSesion(
  textoPegado: string,
  idHistEsperado: string,
  ctx: ContextoValidacion,
): Result<ValidacionAnalisis> {
  const p = parsear(textoPegado);
  if (typeof p === "string") return err(p);
  const raiz = p.valor;
  if (!esObj(raiz)) return err("Lo que pegaste no es un objeto JSON.");

  const descartados: string[] = [];
  try {
    sobrantes(raiz, CLAVES_RAIZ, "", descartados);

    if (raiz.version !== VERSION_ESQUEMA_ANALISIS) {
      fallar("version", `tiene que ser ${VERSION_ESQUEMA_ANALISIS} (vino ${JSON.stringify(raiz.version) ?? "nada"})`);
    }
    if (raiz.tipo !== "sesion") fallar("tipo", "tiene que ser \"sesion\"");
    const idHist = texto(raiz, "idHist", "idHist", 80);
    if (idHist !== idHistEsperado) {
      return err(`Este análisis es de otra sesión (${idHist}). Estás en ${idHistEsperado}.`);
    }

    const hallazgos: HallazgoAnalisis[] = lista(raiz, "hallazgos", "hallazgos", TOPES_ANALISIS.hallazgos).map((v, i) => {
      const c = `hallazgos[${i}]`;
      if (!esObj(v)) return fallar(c, "tiene que ser un objeto");
      sobrantes(v, ["tema", "detalle", "evidencia", "confianza"], `${c}.`, descartados);
      const evidencia = textoOpc(v, "evidencia", `${c}.evidencia`, TOPES_ANALISIS.evidencia);
      const evidenciaOk = evidencia ?? fallar(`${c}.evidencia`, "falta. Todo hallazgo tiene que citar un número del paquete; sin evidencia no se guarda");
      const confianza = v.confianza == null ? undefined : uno(v.confianza, CONFIANZAS);
      if (v.confianza != null && !confianza) fallar(`${c}.confianza`, "tiene que ser alta, media o baja");
      return {
        tema: texto(v, "tema", `${c}.tema`, TOPES_ANALISIS.tema),
        detalle: texto(v, "detalle", `${c}.detalle`, TOPES_ANALISIS.detalle),
        evidencia: evidenciaOk,
        ...(confianza ? { confianza } : {}),
      };
    });

    const sugerencias: SugerenciaAnalisis[] = lista(raiz, "sugerencias", "sugerencias", TOPES_ANALISIS.sugerencias).map((v, i) => {
      const c = `sugerencias[${i}]`;
      if (!esObj(v)) return fallar(c, "tiene que ser un objeto");
      sobrantes(v, ["accion", "porque", "cuando"], `${c}.`, descartados);
      const cuando = textoOpc(v, "cuando", `${c}.cuando`, TOPES_ANALISIS.cuando);
      return {
        accion: texto(v, "accion", `${c}.accion`, TOPES_ANALISIS.accion),
        porque: texto(v, "porque", `${c}.porque`, TOPES_ANALISIS.porque),
        ...(cuando ? { cuando } : {}),
      };
    });

    const banderas: BanderaAnalisis[] = lista(raiz, "banderas", "banderas", TOPES_ANALISIS.banderas).map((v, i) => {
      const c = `banderas[${i}]`;
      if (!esObj(v)) return fallar(c, "tiene que ser un objeto");
      sobrantes(v, ["tipo", "detalle"], `${c}.`, descartados);
      const tipo = uno(v.tipo, TIPOS_BANDERA);
      const tipoOk = tipo ?? fallar(`${c}.tipo`, `tiene que ser uno de: ${TIPOS_BANDERA.join(", ")}`);
      return { tipo: tipoOk, detalle: texto(v, "detalle", `${c}.detalle`, TOPES_ANALISIS.bandera) };
    });

    const preguntas = textos(raiz, "preguntas", TOPES_ANALISIS.preguntas, TOPES_ANALISIS.pregunta);
    const datosFaltantes = textos(raiz, "datosFaltantes", TOPES_ANALISIS.datosFaltantes, TOPES_ANALISIS.datoFaltante);

    const resumen = texto(raiz, "resumen", "resumen", TOPES_ANALISIS.resumen);
    const oraciones = contarOraciones(resumen);
    if (oraciones > TOPES_ANALISIS.resumenOraciones) {
      fallar("resumen", `tiene ${oraciones} oraciones; tiene que ser de 2 o 3`);
    }

    // Esquema 3 (P99): el veredicto, los dos destacados y las marcas del análisis.
    const veredicto = textoConOraciones(raiz, "veredicto", "veredicto", TOPES_ANALISIS.veredicto, TOPES_ANALISIS.veredictoOraciones);
    const listaDestacados = lista(raiz, "destacados", "destacados", TOPES_ANALISIS.destacados);
    if (listaDestacados.length !== TOPES_ANALISIS.destacados) {
      fallar("destacados", `tiene ${listaDestacados.length}; tienen que ser exactamente ${TOPES_ANALISIS.destacados}`);
    }
    const destacados = listaDestacados.map((_, i) =>
      textoConOraciones({ d: listaDestacados[i] }, "d", `destacados[${i}]`, TOPES_ANALISIS.destacado, TOPES_ANALISIS.destacadoOraciones));
    const marcasAnalisis = marcasDelAnalisis(raiz, ctx, descartados);

    const armadoEco = leerArmado(raiz.armado);
    const errorArmado = chequearArmado(armadoEco, ctx.armado);
    if (errorArmado) return err(errorArmado);

    const contenido: ContenidoAnalisis = {
      version: VERSION_ESQUEMA_ANALISIS,
      tipo: "sesion",
      idHist,
      generadoEn: texto(raiz, "generadoEn", "generadoEn", TOPES_ANALISIS.generadoEn),
      modelo: textoOpc(raiz, "modelo", "modelo", TOPES_ANALISIS.modelo) ?? "sin identificar",
      resumen,
      hallazgos, sugerencias, banderas, preguntas, datosFaltantes,
      veredicto, destacados, marcasAnalisis,
    };
    return ok({ contenido, armadoEco, descartados, recuperadoDeTexto: p.recuperado });
  } catch (e) {
    if (e instanceof ErrorCampo) return err(e.message);
    return err(`No se pudo validar: ${e instanceof Error ? e.message : String(e)}`);
  }
}
