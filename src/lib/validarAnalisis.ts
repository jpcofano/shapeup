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
//  Genérico por `tipo` (P94 va a sumar "global"): lo común valida hallazgos,
//  sugerencias, banderas y preguntas; lo propio de cada tipo es la identidad.
//
//  Puro (ADR #009). Devuelve Result, nunca tira.
// ════════════════════════════════════════════════════════════════════════════
import type {
  ArmadoAnalisis, BanderaAnalisis, ConfianzaAnalisis, ContenidoAnalisis,
  HallazgoAnalisis, SugerenciaAnalisis, TipoBanderaAnalisis,
} from "../types/models";
import { ok, err, type Result } from "./result";
import { VERSION_ESQUEMA_ANALISIS } from "./analisis";

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
} as const;

/**
 * Cuántas oraciones tiene un texto: cortes en . ! ? … seguidos de espacio o
 * del final. Un decimal (137.9) no corta, porque lo sigue un dígito.
 */
export function contarOraciones(texto: string): number {
  return texto.split(/[.!?…]+(?=\s|$)/).filter((t) => t.trim() !== "").length;
}

const CONFIANZAS: readonly ConfianzaAnalisis[] = ["alta", "media", "baja"];
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
] as const;

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
export function validarAnalisisSesion(textoPegado: string, idHistEsperado: string): Result<ValidacionAnalisis> {
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

    const contenido: ContenidoAnalisis = {
      version: VERSION_ESQUEMA_ANALISIS,
      tipo: "sesion",
      idHist,
      generadoEn: texto(raiz, "generadoEn", "generadoEn", TOPES_ANALISIS.generadoEn),
      modelo: textoOpc(raiz, "modelo", "modelo", TOPES_ANALISIS.modelo) ?? "sin identificar",
      resumen,
      hallazgos, sugerencias, banderas, preguntas, datosFaltantes,
    };
    return ok({ contenido, armadoEco: leerArmado(raiz.armado), descartados, recuperadoDeTexto: p.recuperado });
  } catch (e) {
    if (e instanceof ErrorCampo) return err(e.message);
    return err(`No se pudo validar: ${e instanceof Error ? e.message : String(e)}`);
  }
}
