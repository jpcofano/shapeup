// ════════════════════════════════════════════════════════════════════════════
//  scripts/auditoria-salud.ts — Auditoría READ-ONLY de los datos de salud.
//
//  Solo lecturas (get). Nunca hace set/update/delete. Genera un reporte
//  Markdown con la cobertura y calidad real de /historial, /cardio,
//  /metricas-salud, /sueno y /mediciones para un miembro, y corre las
//  funciones puras de S2/S3 (calcularResumenSalud, calcularRecomendacion)
//  con los datos leídos.
//
//  El reporte contiene datos de salud personales — se escribe en
//  docs/auditorias/, que está en .gitignore. Nunca commitear un reporte.
//
//  Uso:
//    npx tsx scripts/auditoria-salud.ts                    # miembro=juanpablo
//    npx tsx scripts/auditoria-salud.ts --miembro=maria
//    npx tsx scripts/auditoria-salud.ts --zip=./export.zip # + sección G: inventario del ZIP
//
//  Patrón de scripts/ (hotfix P55, ver scripts/pureza.test.ts): solo
//  firebase-admin + módulos puros de src/lib/ o src/import/. Nunca src/data/
//  ni src/firebase.ts (SDK cliente, usa import.meta.env — crashea bajo tsx).
// ════════════════════════════════════════════════════════════════════════════

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

import { TIPOS_METRICA } from "../src/types/models";
import type {
  Historial, SesionCardio, MetricaSalud, RegistroSueno, MedicionCorporal, TipoMetrica,
} from "../src/types/models";
import { consolidarNoches, promedioNoches, nochesEnVentana } from "../src/lib/sueno";
import { calcularResumenSalud, senalPeor, MIN_DATOS_BASELINE } from "../src/lib/resumenSalud";
import { calcularRecomendacion } from "../src/lib/recomendaciones";
import { extraerDesdeZip } from "../src/import/samsungZip";

const __dir = dirname(fileURLToPath(import.meta.url));

// ── Miembros válidos (espejo de MIEMBRO_IDS en models.ts) ────────────────────
const MIEMBROS_VALIDOS = ["juanpablo", "maria", "sofia", "federico"] as const;
type Miembro = typeof MIEMBROS_VALIDOS[number];

// ── Parse de argumentos ───────────────────────────────────────────────────────
const args = process.argv.slice(2);
function argValor(flag: string): string | undefined {
  const arg = args.find((a) => a.startsWith(`--${flag}=`));
  return arg?.split("=").slice(1).join("=");
}
const miembroFlag = argValor("miembro") ?? "juanpablo";
if (!(MIEMBROS_VALIDOS as readonly string[]).includes(miembroFlag)) {
  console.error(
    `\n❌  Miembro inválido: "${miembroFlag}".\n` +
    `   Válidos: ${MIEMBROS_VALIDOS.join(", ")}\n`,
  );
  process.exit(1);
}
const miembro = miembroFlag as Miembro;
const zipFlag = argValor("zip");

// ── Init Firebase Admin ───────────────────────────────────────────────────────
let serviceAccount: unknown;
try {
  serviceAccount = JSON.parse(readFileSync(resolve(__dir, "service-account.json"), "utf8"));
} catch {
  console.error(
    "\n❌  No se encontró scripts/service-account.json.\n" +
    "   Descargalo desde Firebase Console → Configuración del proyecto → Cuentas de servicio.\n",
  );
  process.exit(1);
}
initializeApp({ credential: cert(serviceAccount as Parameters<typeof cert>[0]) });
const db = getFirestore();

// ── Helpers de fecha/hora ─────────────────────────────────────────────────────

const TZ = "America/Argentina/Buenos_Aires";

function hoyArgentina(): string {
  const partes = new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).formatToParts(new Date());
  const y = partes.find((p) => p.type === "year")!.value;
  const m = partes.find((p) => p.type === "month")!.value;
  const d = partes.find((p) => p.type === "day")!.value;
  return `${y}-${m}-${d}`;
}

function addDays(fecha: string, n: number): string {
  const d = new Date(fecha + "T12:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Epoch ms → "YYYY-MM-DD HH:MM" en hora local de Argentina. */
function horaLocal(ms: number): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
  const partes = fmt.formatToParts(new Date(ms));
  const get = (t: string) => partes.find((p) => p.type === t)!.value;
  return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}`;
}

function pct(n: number, total: number): string {
  if (total === 0) return "0%";
  return `${Math.round((n / total) * 100)}%`;
}

function shuffle<T>(arr: T[]): T[] {
  const copia = [...arr];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

// ── Sección A: Historial y match ──────────────────────────────────────────────

function seccionA(historial: Historial[], cardio: SesionCardio[]): string[] {
  const L: string[] = [];
  L.push("## A. Historial y match\n");
  if (historial.length === 0) { L.push("_Sin registros en /historial._\n"); return L; }

  const ordenado = [...historial].sort((a, b) => a.fechaRealizada.localeCompare(b.fechaRealizada));

  for (const h of ordenado) {
    L.push(`### ${h.idHist} — ${h.fechaRealizada} — ${h.nombreRutina}`);
    L.push(`- duracionRealMin: ${h.duracionRealMin ?? "—"}`);

    if (h.inicioMs != null && h.finMs != null) {
      L.push(`- ventana sesión: ${horaLocal(h.inicioMs)} → ${horaLocal(h.finMs)}`);
    } else {
      L.push(`- ventana sesión: **sin inicioMs/finMs a nivel sesión**`);
    }

    const totalSeries = h.bloques.reduce((s, b) => s + b.series.length, 0);
    const seriesConVentana = h.bloques.reduce(
      (s, b) => s + b.series.filter((se) => se.inicioMs != null && se.finMs != null).length, 0,
    );
    L.push(`- series con inicioMs/finMs: ${seriesConVentana}/${totalSeries}`);

    if (h.biometria) {
      const b = h.biometria;
      L.push(
        `- biometria: matchPor=${b.matchPor}, granularidad=${b.granularidad}, ` +
        `fcMedia=${b.fcMedia ?? "—"}, fcMax=${b.fcMax ?? "—"}, kcal=${b.kcal ?? "—"}, ` +
        `zonaPrincipal=${b.zonaPrincipal ?? "—"}, datauuidSamsung=${b.datauuidSamsung ?? "—"}` +
        (b.finMsEfectivo != null ? `, finMsEfectivo=${b.finMsEfectivo}` : ""),
      );
      if (b.granularidad === "serie") {
        const conFcPico = h.bloques.reduce(
          (s, bl) => s + bl.series.filter((se) => se.fcPico != null).length, 0,
        );
        const conRecuperacion = h.bloques.reduce(
          (s, bl) => s + bl.series.filter((se) => se.recuperacionBpm != null).length, 0,
        );
        L.push(`- series enriquecidas: ${conFcPico}/${totalSeries} con fcPico, ${conRecuperacion}/${totalSeries} con recuperacionBpm`);
      }
    } else {
      L.push("- biometria: **ninguna**");
      const candidatas = cardio.filter((c) => c.fecha === h.fechaRealizada);
      if (candidatas.length === 0) {
        L.push("  - no hay sesiones en /cardio ese día → no había candidata para matchear");
      } else {
        L.push(`  - ${candidatas.length} sesión(es) en /cardio ese día:`);
        for (const c of candidatas) {
          const hora = c.inicioMs != null ? horaLocal(c.inicioMs).slice(11) : "sin hora";
          L.push(`    - ${c.idCardio}: ${c.actividad}, ${hora}, ${c.duracionMin ?? "?"} min, fc=${c.fcPromedio ?? "—"}, kcal=${c.kcal ?? "—"}`);
        }
      }
    }
    L.push("");
  }
  return L;
}

// ── Sección B: Cardio ──────────────────────────────────────────────────────────

function seccionB(cardio: SesionCardio[], historial: Historial[]): string[] {
  const L: string[] = [];
  L.push("## B. Cardio\n");
  if (cardio.length === 0) { L.push("_Sin registros en /cardio._\n"); return L; }

  const fechas = cardio.map((c) => c.fecha).sort();
  L.push(`- total: ${cardio.length} docs, rango ${fechas[0]} → ${fechas[fechas.length - 1]}`);

  const shapeUp = cardio.filter((c) => c.actividad === "ShapeUp").length;
  L.push(`- actividad "ShapeUp": ${shapeUp} (\`_motivo\` no se persiste — se strippea antes de guardar, ver lib/importSelectivo.ts)`);

  const conFc   = cardio.filter((c) => c.fcPromedio != null).length;
  const conKcal = cardio.filter((c) => c.kcal != null).length;
  const conInicioMs = cardio.filter((c) => c.inicioMs != null).length;
  L.push(`- con FC media: ${conFc}/${cardio.length} (${pct(conFc, cardio.length)})`);
  L.push(`- con kcal: ${conKcal}/${cardio.length} (${pct(conKcal, cardio.length)})`);
  L.push(`- con inicioMs: ${conInicioMs}/${cardio.length} (${pct(conInicioMs, cardio.length)})`);

  const vinculadasIds = new Set<string>(
    historial.filter((h) => h.biometria?.datauuidSamsung).map((h) => `CAR-${h.biometria!.datauuidSamsung}`),
  );
  const vinculadas = cardio.filter((c) => vinculadasIds.has(c.idCardio));
  L.push(`- vinculadas (idCardio == CAR-{datauuidSamsung} de algún /historial): ${vinculadas.length}/${cardio.length}`);
  L.push("");

  // Top 10 actividades
  const conteo = new Map<string, number>();
  for (const c of cardio) conteo.set(c.actividad, (conteo.get(c.actividad) ?? 0) + 1);
  const top10 = [...conteo.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  L.push("**Top 10 actividades:**\n");
  L.push("| actividad | cantidad |");
  L.push("|---|---|");
  for (const [act, n] of top10) L.push(`| ${act} | ${n} |`);
  L.push("");

  // Distribución por mes (últimos 6 meses)
  const hoy = hoyArgentina();
  const meses: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(hoy + "T12:00:00");
    d.setMonth(d.getMonth() - i);
    meses.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  L.push("**Distribución por mes (últimos 6 meses):**\n");
  L.push("| mes | cantidad |");
  L.push("|---|---|");
  for (const mes of meses) {
    const n = cardio.filter((c) => c.fecha.startsWith(mes)).length;
    L.push(`| ${mes} | ${n} |`);
  }
  L.push("");

  // 5 filas de muestra
  L.push("**Muestras completas (forma real del dato):**\n");
  const usados = new Set<string>();
  const muestras: { etiqueta: string; doc: SesionCardio | undefined }[] = [];

  const unaShapeUp = cardio.find((c) => c.actividad === "ShapeUp" && !usados.has(c.idCardio));
  if (unaShapeUp) usados.add(unaShapeUp.idCardio);
  muestras.push({ etiqueta: "ShapeUp", doc: unaShapeUp });

  const unaHiit = cardio.find((c) => c.actividad === "HIIT" && !usados.has(c.idCardio));
  if (unaHiit) usados.add(unaHiit.idCardio);
  muestras.push({ etiqueta: "HIIT", doc: unaHiit });

  const unaVinculada = cardio.find((c) => vinculadasIds.has(c.idCardio) && !usados.has(c.idCardio));
  if (unaVinculada) usados.add(unaVinculada.idCardio);
  muestras.push({ etiqueta: "vinculada", doc: unaVinculada });

  const resto = shuffle(cardio.filter((c) => !usados.has(c.idCardio)));
  for (let i = 0; i < 2; i++) {
    const doc = resto[i];
    if (doc) usados.add(doc.idCardio);
    muestras.push({ etiqueta: "al azar", doc });
  }

  for (const m of muestras) {
    L.push(`- **${m.etiqueta}**:`);
    if (!m.doc) { L.push("  _(no hay ninguna en esta categoría)_"); continue; }
    L.push("  ```json");
    L.push("  " + JSON.stringify(m.doc, null, 2).split("\n").join("\n  "));
    L.push("  ```");
  }
  L.push("");

  return L;
}

// ── Sección C: Métricas genéricas ─────────────────────────────────────────────

function seccionC(metricas: MetricaSalud[], hoy: string, advertenciaVacio?: string): string[] {
  const L: string[] = [];
  L.push("## C. Métricas genéricas (/metricas-salud)\n");
  // Guarda anti-mentira (hotfix P56-b): si el miembro no tiene ninguna métrica,
  // decir explícitamente si la colección está realmente vacía o si hay docs de
  // otros miembros (posible filtro roto) — nunca dejar que la tabla en cero
  // se lea como "todo bien, simplemente sin datos".
  if (advertenciaVacio) L.push(`> ⚠ ${advertenciaVacio}\n`);
  L.push("| tipo | días con dato | primera fecha | última fecha | valor más reciente | ¿alcanza baseline 28d? |");
  L.push("|---|---|---|---|---|---|");

  const desde = addDays(hoy, -35);
  const hasta = addDays(hoy, -8);

  for (const tipo of TIPOS_METRICA as readonly TipoMetrica[]) {
    const items = metricas.filter((m) => m.tipo === tipo).sort((a, b) => a.fecha.localeCompare(b.fecha));
    if (items.length === 0) {
      L.push(`| ${tipo} | 0 | — | — | — | no |`);
      continue;
    }
    const primera = items[0].fecha;
    const ultima  = items[items.length - 1].fecha;
    const reciente = items[items.length - 1].valor;
    const enVentana = items.filter((i) => i.fecha >= desde && i.fecha <= hasta).length;
    const alcanza = enVentana >= MIN_DATOS_BASELINE ? "sí" : "no";
    L.push(`| ${tipo} | ${items.length} | ${primera} | ${ultima} | ${reciente} | ${alcanza} |`);
  }
  L.push("");
  return L;
}

// ── Sección D: Sueño ────────────────────────────────────────────────────────────

function seccionD(sueno: RegistroSueno[], hoy: string): string[] {
  const L: string[] = [];
  L.push("## D. Sueño\n");
  const noches = consolidarNoches(sueno); // desc por fecha

  L.push(`- registros crudos: ${sueno.length}`);
  L.push(`- noches consolidadas: ${noches.length}`);

  L.push(`- noches con dato en últimos 30 días: ${nochesEnVentana(noches, hoy, 30)}/30`);

  const p7  = promedioNoches(noches, 7);
  const p28 = promedioNoches(noches, 28);
  L.push(`- promedio 7 noches: ${p7 != null ? p7 + " h" : "sin datos (< 3 noches)"}`);
  L.push(`- promedio 28 noches: ${p28 != null ? p28 + " h" : "sin datos (< 3 noches)"}`);

  const conSiesta = noches.filter((n) => n.horasSiesta != null).length;
  const maxTramos = noches.length > 0 ? Math.max(...noches.map((n) => n.tramos)) : 0;
  L.push(`- fechas con siesta: ${conSiesta}/${noches.length}`);
  L.push(`- máximo de tramos en una fecha: ${maxTramos}`);
  L.push("");
  return L;
}

// ── Sección E: Mediciones corporales ──────────────────────────────────────────

function seccionE(mediciones: MedicionCorporal[]): string[] {
  const L: string[] = [];
  L.push("## E. Mediciones corporales\n");
  if (mediciones.length === 0) { L.push("_Sin registros en /mediciones._\n"); return L; }

  const fechas = mediciones.map((m) => m.fecha).sort();
  L.push(`- total: ${mediciones.length}, rango ${fechas[0]} → ${fechas[fechas.length - 1]}`);
  L.push("");

  const campos: (keyof MedicionCorporal)[] = ["pesoKg", "grasaPct", "masaMuscularKg", "masaGrasaKg", "aguaPct", "imc"];
  L.push("| campo | poblado | % |");
  L.push("|---|---|---|");
  for (const campo of campos) {
    const n = mediciones.filter((m) => m[campo] != null).length;
    L.push(`| ${campo} | ${n}/${mediciones.length} | ${pct(n, mediciones.length)} |`);
  }
  L.push("");
  return L;
}

// ── Sección F: Señales y recomendación de HOY ─────────────────────────────────

function seccionF(
  metricas: MetricaSalud[], sueno: RegistroSueno[], mediciones: MedicionCorporal[],
  historial: Historial[], hoy: string,
): string[] {
  const L: string[] = [];
  L.push("## F. Señales y recomendación de HOY\n");
  L.push(`_Calculado con \`hoy = ${hoy}\` (fecha de corrida del script, hora Argentina)._\n`);

  const senales = calcularResumenSalud(metricas, sueno, mediciones, hoy);
  if (senales.length === 0) {
    L.push("_calcularResumenSalud no devolvió ninguna señal (sin datos suficientes)._\n");
  } else {
    L.push("| señal | estado | valor actual | baseline | Δ% | motivo |");
    L.push("|---|---|---|---|---|---|");
    for (const s of senales) {
      const delta = s.deltaPct != null ? `${(s.deltaPct * 100).toFixed(0)}%` : "—";
      L.push(`| ${s.clave} | ${s.estado} | ${s.valorActual ?? "—"} ${s.unidad} | ${s.baseline ?? "—"} | ${delta} | ${s.motivo ?? "—"} |`);
    }
    L.push("");
    L.push(`**Peor señal (senalPeor):** ${senalPeor(senales)}\n`);
  }

  const recomendacion = calcularRecomendacion(senales, historial, hoy, miembro);
  if (recomendacion) {
    L.push("**Recomendación que saldría hoy:**\n");
    L.push("```json");
    L.push(JSON.stringify(recomendacion, null, 2));
    L.push("```");
  } else {
    L.push("**Recomendación que saldría hoy:** ninguna (no aplica ninguna regla o faltan datos).");
  }
  L.push("");
  return L;
}

// ── Sección G: Inventario del ZIP (opcional, --zip=<ruta>) ────────────────────

/**
 * Lee el ZIP del filesystem y corre extraerDesdeZip para diagnosticar qué
 * archivos trae el export y qué parser (si alguno) los toma. No bloqueante:
 * si algo falla, la sección lo dice y el resto de la auditoría sigue normal.
 */
async function seccionG(rutaZip: string): Promise<string[]> {
  const L: string[] = [];
  L.push("## G. Inventario del ZIP\n");
  try {
    const buffer = readFileSync(rutaZip);
    const nombre = rutaZip.split(/[/\\]/).pop() ?? rutaZip;
    const file   = new File([buffer], nombre);
    const extraccion = await extraerDesdeZip(file, miembro, "biometrico");

    if (extraccion.errors.length > 0) {
      L.push(`_Errores durante la extracción:_ ${extraccion.errors.slice(0, 5).join("; ")}\n`);
    }
    if (extraccion.inventario.length === 0) {
      L.push("_No se encontraron archivos reconocibles._\n");
      return L;
    }
    L.push(`- total de archivos inventariados: ${extraccion.inventario.length}`);
    const sinParser = extraccion.inventario.filter((i) => i.parser === "sin parser");
    L.push(`- sin parser: ${sinParser.length}`);
    L.push("");
    L.push("| archivo | parser |");
    L.push("|---|---|");
    for (const i of extraccion.inventario) L.push(`| ${i.archivo} | ${i.parser} |`);
    L.push("");
  } catch (e) {
    L.push(`_No se pudo procesar el ZIP: ${e instanceof Error ? e.message : String(e)}_\n`);
  }
  return L;
}

// ── Runner ────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log(`\n── auditoria-salud · miembro: ${miembro} (read-only) ──\n`);

  const [historialSnap, cardioSnap, metricasSnap, suenoSnap, medicionesSnap] = await Promise.all([
    db.collection("historial").where("miembro", "==", miembro).get(),
    db.collection("cardio").where("miembro", "==", miembro).get(),
    db.collection("metricas-salud").where("miembro", "==", miembro).get(),
    db.collection("sueno").where("miembro", "==", miembro).get(),
    db.collection("mediciones").where("miembro", "==", miembro).get(),
  ]);

  const historial   = historialSnap.docs.map((d) => d.data() as Historial);
  const cardio      = cardioSnap.docs.map((d) => d.data() as SesionCardio);
  const metricas    = metricasSnap.docs.map((d) => d.data() as MetricaSalud);
  const sueno       = suenoSnap.docs.map((d) => d.data() as RegistroSueno);
  const mediciones  = medicionesSnap.docs.map((d) => d.data() as MedicionCorporal);

  // Guarda anti-mentira (hotfix P56-b): si el filtro por miembro dio 0 en
  // /metricas-salud, chequeá si la colección tiene docs en total antes de
  // reportarlo como "sin datos" — eso distingue "genuinamente vacía" de
  // "filtro roto" (nombre de campo, esquema).
  let advertenciaMetricas: string | undefined;
  if (metricas.length === 0) {
    const totalSnap = await db.collection("metricas-salud").count().get();
    const total = totalSnap.data().count;
    advertenciaMetricas = total > 0
      ? `0 métricas con miembro=="${miembro}" — la colección tiene ${total} docs en total (¿campo "miembro" correcto? ¿se corrió limpiar:salud y falta re-importar?)`
      : undefined; // realmente no hay ningún doc en la colección
  }

  const hoy = hoyArgentina();
  const fechaReporte = hoy.replace(/-/g, "");

  const L: string[] = [];
  L.push(`# Auditoría de salud — ${miembro} — ${hoy}\n`);
  L.push("> Reporte read-only generado por `scripts/auditoria-salud.ts` (S-audit, P53). " +
    "No modifica Firestore. Contiene datos de salud personales — no commitear.\n");
  L.push(...seccionA(historial, cardio));
  L.push(...seccionB(cardio, historial));
  L.push(...seccionC(metricas, hoy, advertenciaMetricas));
  L.push(...seccionD(sueno, hoy));
  L.push(...seccionE(mediciones));
  L.push(...seccionF(metricas, sueno, mediciones, historial, hoy));
  if (zipFlag) L.push(...await seccionG(zipFlag));

  const contenido = L.join("\n");
  console.log(contenido);

  const dirSalida = resolve(__dir, "..", "docs", "auditorias");
  mkdirSync(dirSalida, { recursive: true });
  const rutaSalida = resolve(dirSalida, `salud-${miembro}-${fechaReporte}.md`);
  writeFileSync(rutaSalida, contenido, "utf8");
  console.log(`\n✅  Reporte escrito en ${rutaSalida}\n`);
}

await main();
process.exit(0);
