// ════════════════════════════════════════════════════════════════════════════
//  scripts/auditoria-features.ts — Auditoría READ-ONLY de FEATURES (no de datos).
//
//  Origen (P62): el owner re-importó el ZIP y "no ve cambios". La auditoría de
//  datos (P53, scripts/auditoria-salud.ts) ya existe — esta distingue, feature
//  por feature de las series S e I, entre: (a) no implementada, (b) implementada
//  pero no deployada, (c) deployada pero sin datos que la activen, (d) funcionando.
//
//  Cero writes a Firestore. Cero cambios de comportamiento en la app. Todas las
//  consultas a Firestore usan límites chicos (≤10) para no repetir el golpe de
//  cuota de auditorías anteriores ("la cuota ya mordió dos veces") — el total de
//  lecturas se cuenta y se imprime al final, debería ser < 100.
//
//  Uso:
//    npx tsx scripts/auditoria-features.ts                  # miembro=juanpablo (owner)
//    npx tsx scripts/auditoria-features.ts --miembro=maria
//
//  Patrón de scripts/ (hotfix P55, ver scripts/pureza.test.ts): solo
//  firebase-admin + módulos puros de src/lib/ o src/import/. Nunca src/data/
//  ni src/firebase.ts (SDK cliente, usa import.meta.env — crashea bajo tsx).
// ════════════════════════════════════════════════════════════════════════════

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

import { TIPOS_METRICA, MIEMBRO_IDS } from "../src/types/models";
import type {
  Historial, MetricaSalud, RegistroSueno, MedicionCorporal,
  PerfilesConfig, PerfilMiembro, Rutina, MiembroId,
} from "../src/types/models";
import { consolidarNoches } from "../src/lib/sueno";
import { calcularResumenSalud, senalPeor } from "../src/lib/resumenSalud";
import { calcularRecomendacion, RUTINAS_RECOMENDADAS } from "../src/lib/recomendaciones";
import { alcanzaMinimoChip, MIN_DATOS_CHIP, serieTendencia } from "../src/lib/tendencias";
import { compararConPrevias, serieCostoRutina, MIN_SESIONES_SECCION } from "../src/lib/costoCardiaco";
import { sugerirProgresion } from "../src/lib/progresion";
import { filtrarCardioRelevante, ACTIVIDADES_SIEMPRE_RELEVANTES } from "../src/lib/importSelectivo";
import { derivarZona, elegirSesionSamsung, construirBiometriaRango } from "../src/lib/matchBiometrico";

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT  = resolve(__dir, "..");
const HOSTING_URL = "https://shapeup-41e74.web.app";

// ── Miembros válidos ──────────────────────────────────────────────────────────
const MIEMBROS_VALIDOS = MIEMBRO_IDS;
const args = process.argv.slice(2);
function argValor(flag: string): string | undefined {
  const arg = args.find((a) => a.startsWith(`--${flag}=`));
  return arg?.split("=").slice(1).join("=");
}
const miembroFlag = argValor("miembro") ?? "juanpablo";
if (!(MIEMBROS_VALIDOS as readonly string[]).includes(miembroFlag)) {
  console.error(`\n❌  Miembro inválido: "${miembroFlag}".\n   Válidos: ${MIEMBROS_VALIDOS.join(", ")}\n`);
  process.exit(1);
}
const miembro = miembroFlag as MiembroId;

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

// ── Contador de lecturas (guarda de cuota) ────────────────────────────────────
let lecturas = 0;
async function leerColeccion<T>(query: FirebaseFirestore.Query): Promise<T[]> {
  const snap = await query.get();
  lecturas += snap.size;
  return snap.docs.map((d) => d.data() as T);
}
async function leerDoc<T>(ref: FirebaseFirestore.DocumentReference): Promise<T | null> {
  const snap = await ref.get();
  lecturas += 1;
  return snap.exists ? (snap.data() as T) : null;
}

// ── Helpers de fecha ──────────────────────────────────────────────────────────
const TZ = "America/Argentina/Buenos_Aires";
function hoyArgentina(): string {
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).formatToParts(new Date());
  return `${p.find((x) => x.type === "year")!.value}-${p.find((x) => x.type === "month")!.value}-${p.find((x) => x.type === "day")!.value}`;
}
function fmtFecha(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(d).replace(",", "");
}

// ── Helpers de lectura de código fuente (chequeo estático "el símbolo existe en HEAD") ──
function leerFuente(rutaRelativaSrc: string): string {
  try { return readFileSync(resolve(ROOT, rutaRelativaSrc), "utf8"); } catch { return ""; }
}
function contieneEnFuente(rutaRelativaSrc: string, patron: RegExp): boolean {
  return patron.test(leerFuente(rutaRelativaSrc));
}

// ── Fila de la matriz de features ─────────────────────────────────────────────
interface FilaMatriz {
  feature: string;
  implementada: boolean;
  prerequisito: boolean | null; // null = informativo, no es un booleano estricto
  resumenPrereq: string;
  donde: string;
  detalle: string[];
  accion?: string; // sugerencia concreta si algo falta (para la sección C)
}
const filas: FilaMatriz[] = [];

// ── Sección A: Estado del deploy ───────────────────────────────────────────────

interface EstadoDeploy { desactualizado: boolean; detalle: string; accion?: string }

async function seccionA(): Promise<{ lineas: string[]; estado: EstadoDeploy }> {
  const L: string[] = [];
  L.push("## A. Estado del deploy (la causa más probable del \"no veo cambios\")\n");

  // ── Bundle local ──
  let nombreLocal: string | undefined;
  let mtimeLocal: Date | undefined;
  try {
    const assets = readdirSync(resolve(ROOT, "dist", "assets"));
    nombreLocal = assets.find((f) => /^index-.*\.js$/.test(f));
    if (nombreLocal) mtimeLocal = statSync(resolve(ROOT, "dist", "assets", nombreLocal)).mtime;
  } catch { /* no hay dist/ — no se buildeó nunca localmente */ }

  if (nombreLocal && mtimeLocal) {
    L.push(`- Bundle local: \`${nombreLocal}\` (dist/assets, build del ${fmtFecha(mtimeLocal)})`);
  } else {
    L.push("- Bundle local: **no existe \`dist/\`** — nunca se corrió \`npm run build\` en este checkout.");
  }

  // ── Bundle servido ──
  let nombreServido: string | undefined;
  let fetchOk = true;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(HOSTING_URL, { signal: ctrl.signal });
    clearTimeout(timer);
    const html = await res.text();
    nombreServido = html.match(/index-[A-Za-z0-9_-]+\.js/)?.[0];
    L.push(`- Bundle servido (\`${HOSTING_URL}\`): \`${nombreServido ?? "no se encontró un asset index-*.js en el HTML"}\``);
  } catch (e) {
    fetchOk = false;
    L.push(`- Bundle servido: **no se pudo obtener** (${e instanceof Error ? e.message : String(e)}) — sin red, se omite el resto de esta sección.`);
  }

  if (!fetchOk) {
    L.push("");
    return { lineas: L, estado: { desactualizado: false, detalle: "no se pudo verificar (sin red)" } };
  }

  const coincide = !!nombreLocal && !!nombreServido && nombreLocal === nombreServido;
  let estado: EstadoDeploy;
  if (coincide) {
    L.push(`\n**Veredicto:** Servido: \`${nombreServido}\` (coincide con dist local del ${fmtFecha(mtimeLocal!)}) — el deploy está al día.\n`);
    estado = { desactualizado: false, detalle: `al día (${nombreServido})` };
  } else {
    L.push(`\n**Veredicto:** Servido (\`${nombreServido ?? "—"}\`) ≠ local (\`${nombreLocal ?? "—"}\`) → **FALTA DEPLOYAR**.\n`);
    estado = { desactualizado: true, detalle: `servido=${nombreServido ?? "—"}, local=${nombreLocal ?? "—"}`, accion: "npm run build && firebase deploy" };
  }

  // ── Últimos 5 commits ──
  const git = spawnSync("git", ["log", "-5", "--date=format:%Y-%m-%d %H:%M", "--pretty=format:%h\x1f%ad\x1f%s"], { cwd: ROOT, encoding: "utf8" });
  const commits = (git.stdout ?? "").split("\n").filter(Boolean).map((l) => {
    const [hash, fecha, msg] = l.split("\x1f");
    return { hash, fecha, msg };
  });

  L.push("**Últimos 5 commits:**\n");
  if (mtimeLocal) {
    L.push(coincide
      ? "_Se usa la fecha del build local (coincide con lo servido) como proxy de \"qué tiene el teléfono\":_\n"
      : "_El bundle servido NO coincide con el local — no sabemos su fecha real de build; se marca igual contra el build local a modo orientativo, con menos confianza:_\n");
  }
  for (const c of commits) {
    const esPosterior = mtimeLocal ? new Date(c.fecha.replace(" ", "T") + ":00") > mtimeLocal : false;
    L.push(`- ${c.hash} · ${c.fecha} · ${c.msg}${esPosterior ? "  ⚠ **posterior al build — el teléfono probablemente NO lo tiene**" : ""}`);
  }
  L.push("");

  return { lineas: L, estado };
}

// ── Runner ────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log(`\n── auditoria-features · miembro: ${miembro} (read-only) ──\n`);
  const hoy = hoyArgentina();

  const { lineas: seccionALineas, estado: deployEstado } = await seccionA();

  // ── Lecturas Firestore (todas con límite chico) ──────────────────────────────
  const TIPOS_RESUMEN = ["fc-reposo", "hrv", "pasos", "presion-sistolica", "presion-diastolica", "spo2"] as const;

  const [metricasPorTipo, sueno, mediciones, historial, perfilesConfig] = await Promise.all([
    Promise.all(TIPOS_RESUMEN.map((t) =>
      leerColeccion<MetricaSalud>(
        db.collection("metricas-salud").where("miembro", "==", miembro).where("tipo", "==", t)
          .orderBy("fecha", "desc").limit(10),
      ),
    )),
    leerColeccion<RegistroSueno>(db.collection("sueno").where("miembro", "==", miembro).orderBy("fecha", "desc").limit(10)),
    leerColeccion<MedicionCorporal>(db.collection("mediciones").where("miembro", "==", miembro).orderBy("fecha", "desc").limit(5)),
    leerColeccion<Historial>(db.collection("historial").where("miembro", "==", miembro).orderBy("fechaRealizadaTimestamp", "desc").limit(10)),
    leerDoc<PerfilesConfig>(db.collection("config").doc("perfiles")),
  ]);
  const metricas = metricasPorTipo.flat();

  // Rutinas referenciadas por el historial leído (para progresión, cap 3 lecturas extra).
  const idsRutinaReferenciadas = [...new Set(historial.map((h) => h.idRutina).filter((x): x is string => !!x))].slice(0, 3);
  const rutinasReferenciadas = await Promise.all(
    idsRutinaReferenciadas.map((id) => leerDoc<Rutina>(db.collection("rutinas").doc(id))),
  );

  // Rutinas/programa recomendados de S3 (¿se corrió seed:salud-rutinas?).
  const [rutZ2, rutHiit, rutDescarga, prgDeload] = await Promise.all([
    leerDoc<Rutina>(db.collection("rutinas").doc(RUTINAS_RECOMENDADAS.z2)),
    leerDoc<Rutina>(db.collection("rutinas").doc(RUTINAS_RECOMENDADAS.hiit)),
    leerDoc<Rutina>(db.collection("rutinas").doc(RUTINAS_RECOMENDADAS.descarga)),
    leerDoc<{ idPrograma: string }>(db.collection("programas").doc(RUTINAS_RECOMENDADAS.deload)),
  ]);

  // ═══ Fila 1 — Resumen 5 señales (S2/P56) ═══
  {
    const senales = calcularResumenSalud(metricas, sueno, mediciones, hoy);
    const presion = senales.find((s) => s.clave === "presion");
    const spo2 = senales.find((s) => s.clave === "spo2");
    const prereq = !!presion && !!spo2;
    filas.push({
      feature: "Resumen 5 señales (S2/P56)",
      implementada: typeof calcularResumenSalud === "function",
      prerequisito: prereq,
      resumenPrereq: prereq
        ? `presión ${presion!.valorTexto ?? "—"}, spo2 ${spo2!.valorActual ?? "—"}%`
        : `faltan métricas presión/spo2 con recencia ≤60d (presión: ${presion ? "sí" : "no"}, spo2: ${spo2 ? "sí" : "no"})`,
      donde: "/salud → tab Resumen (default)",
      detalle: [
        `Señales calculadas hoy (${senales.length} de 7 posibles): ${senales.map((s) => `${s.clave}=${s.estado}`).join(", ") || "ninguna"}.`,
        `Peor señal: ${senalPeor(senales)}.`,
        prereq
          ? "Presión y SpO2 tienen dato reciente (≤60 días) y aparecen en el resumen."
          : "Sin dato reciente de presión y/o SpO2 → esas dos cards no aparecen (comportamiento esperado, no es un bug).",
      ],
    });
  }

  // ═══ Fila 2 — Señal fc-reposo real (P56) ═══
  {
    const tieneFcMediaDia = (TIPOS_METRICA as readonly string[]).includes("fc-media-dia");
    const tieneFcReposo = (TIPOS_METRICA as readonly string[]).includes("fc-reposo");
    const docsFcReposo = metricas.filter((m) => m.tipo === "fc-reposo").sort((a, b) => b.fecha.localeCompare(a.fecha));
    filas.push({
      feature: "Señal fc-reposo real (P56)",
      implementada: tieneFcMediaDia && tieneFcReposo,
      prerequisito: docsFcReposo.length > 0,
      resumenPrereq: docsFcReposo.length > 0
        ? `${docsFcReposo.length} doc(s) tipo "fc-reposo" (tope de lectura 10), última fecha ${docsFcReposo[0].fecha}=${docsFcReposo[0].valor}`
        : `0 docs tipo "fc-reposo" para ${miembro}`,
      donde: "/salud → tab Resumen, card \"FC en reposo\"",
      detalle: [
        `TIPOS_METRICA incluye "fc-media-dia": ${tieneFcMediaDia ? "sí" : "no"} · "fc-reposo": ${tieneFcReposo ? "sí" : "no"}.`,
        docsFcReposo.length === 0
          ? "Sin docs \"fc-reposo\" post-reimport todavía — la card sale \"sin-datos\"."
          : `Muestra (más reciente primero): ${docsFcReposo.slice(0, 3).map((m) => `${m.fecha}=${m.valor}`).join(", ")}.`,
      ],
      accion: docsFcReposo.length === 0 ? `re-importar el ZIP para ${miembro} (verificar en la UI que el resumen de matcheo mencione fc-reposo)` : undefined,
    });
  }

  // ═══ Fila 3 — Sueño por noche (P52) ═══
  {
    const noches = consolidarNoches(sueno);
    filas.push({
      feature: "Sueño por noche (P52)",
      implementada: typeof consolidarNoches === "function",
      prerequisito: noches.length > 0,
      resumenPrereq: noches.length > 0
        ? `${noches.length} noche(s) consolidada(s) (tope de lectura 10), última ${noches[0].fecha}`
        : `0 registros en /sueno para ${miembro}`,
      donde: "/salud → tab Sueño",
      detalle: [
        `Registros crudos leídos: ${sueno.length} (tope 10) → ${noches.length} noche(s) consolidada(s).`,
      ],
    });
  }

  // ═══ Fila 4 — Import selectivo (P47/P55) ═══
  {
    const mapeo1001Ok = contieneEnFuente("src/import/samsungHealth.ts", /"1001":\s*"Caminata"/);
    filas.push({
      feature: "Import selectivo (P47/P55)",
      implementada: typeof filtrarCardioRelevante === "function" && ACTIVIDADES_SIEMPRE_RELEVANTES.length > 0 && mapeo1001Ok,
      prerequisito: null,
      resumenPrereq: "—",
      donde: "Salud → Importar ZIP/CSV, preview con toggle \"importar todo\"",
      detalle: [
        `ACTIVIDADES_SIEMPRE_RELEVANTES (${ACTIVIDADES_SIEMPRE_RELEVANTES.length}): ${ACTIVIDADES_SIEMPRE_RELEVANTES.join(", ")}.`,
        `Mapeo "1001" → "Caminata" en src/import/samsungHealth.ts: ${mapeo1001Ok ? "confirmado" : "NO encontrado (revisar si se revirtió)"}.`,
      ],
    });
  }

  // ═══ Fila 5 — Match + biometría (P57) ═══
  {
    const conBiometria = historial.filter((h) => h.biometria);
    const matchPorDiaORango = conBiometria.filter((h) => h.biometria!.matchPor === "dia" || h.biometria!.matchPor === "rango");
    filas.push({
      feature: "Match + biometría (P57)",
      implementada: typeof elegirSesionSamsung === "function" && typeof construirBiometriaRango === "function",
      prerequisito: conBiometria.length > 0,
      resumenPrereq: conBiometria.length > 0
        ? `${conBiometria.length}/${historial.length} sesiones (últimas ${historial.length} leídas) con biometría`
        : `0/${historial.length} sesiones leídas tienen biometría`,
      donde: "HistorialDetalle → card de biometría",
      detalle: [
        conBiometria.length > 0
          ? `Muestra: ${conBiometria.slice(0, 5).map((h) => `${h.idHist} (${h.fechaRealizada}, matchPor=${h.biometria!.matchPor}, granularidad=${h.biometria!.granularidad})`).join("; ")}.`
          : "Ninguna de las últimas sesiones leídas tiene biometría — o no hay match, o no se re-importó desde P57.",
        `Con matchPor "dia" o "rango" (los niveles agregados en P57): ${matchPorDiaORango.length}.`,
      ],
    });
  }

  // ═══ Fila 6 — Zona en biometría ═══
  {
    const perfilesPorMiembro = MIEMBROS_VALIDOS.map((m) => {
      const p: PerfilMiembro | undefined = perfilesConfig?.[m];
      return { miembro: m, tieneZonasFC: !!p?.zonasFC, tieneFcMaxTeorica: p?.fcMaxTeorica != null };
    });
    const conZona = historial.filter((h) => h.biometria?.zonaPrincipal);
    const completos = perfilesPorMiembro.filter((p) => p.tieneZonasFC || p.tieneFcMaxTeorica);
    filas.push({
      feature: "Zona en biometría",
      implementada: typeof derivarZona === "function",
      prerequisito: completos.length === perfilesPorMiembro.length,
      resumenPrereq: perfilesConfig
        ? perfilesPorMiembro.map((p) => `${p.miembro}: zonasFC=${p.tieneZonasFC ? "sí" : "no"}, fcMaxTeorica=${p.tieneFcMaxTeorica ? "sí" : "no"}`).join(" · ")
        : "config/perfiles no existe",
      donde: "HistorialDetalle → chip de zona en la card de biometría",
      detalle: [
        `zonaPrincipal poblado en ${conZona.length}/${historial.length} sesiones leídas con biometría.`,
        ...perfilesPorMiembro.filter((p) => !p.tieneZonasFC && !p.tieneFcMaxTeorica).map((p) => `⚠ ${p.miembro} no tiene ni zonasFC ni fcMaxTeorica → zonaPrincipal saldrá "—" para sus sesiones.`),
      ],
      accion: completos.length < perfilesPorMiembro.length
        ? `completar perfiles sin zonasFC/fcMaxTeorica (${perfilesPorMiembro.filter((p) => !p.tieneZonasFC && !p.tieneFcMaxTeorica).map((p) => p.miembro).join(", ") || "ninguno"}) → npm run seed:perfiles -- --force (ajustar edades reales primero)`
        : undefined,
    });
  }

  // ═══ Fila 7 — Contexto del día (S2) ═══
  {
    const bloqueExiste = contieneEnFuente("src/routes/HistorialDetalle.tsx", /Contexto del día/);
    const nochesPorFecha = new Map(consolidarNoches(sueno).map((n) => [n.fecha, n]));
    const fcReposoPorFecha = new Map(metricas.filter((m) => m.tipo === "fc-reposo").map((m) => [m.fecha, m.valor]));
    const conAmbos = historial.filter((h) => nochesPorFecha.has(h.fechaRealizada) || fcReposoPorFecha.has(h.fechaRealizada));
    filas.push({
      feature: "Contexto del día (S2)",
      implementada: bloqueExiste,
      prerequisito: conAmbos.length > 0,
      resumenPrereq: `${conAmbos.length}/${historial.length} sesiones leídas con noche previa y/o fc-reposo del día disponible`,
      donde: "HistorialDetalle → bloque \"Contexto del día\"",
      detalle: [
        `El bloque busca NocheSueno.fecha === fechaRealizada (mañana del entrenamiento) y fc-reposo del mismo día.`,
      ],
    });
  }

  // ═══ Fila 8 — Recomendaciones (P50) ═══
  {
    const senales = calcularResumenSalud(metricas, sueno, mediciones, hoy);
    const conBaseline = senales.filter((s) => s.baseline != null);
    const recomendacion = calcularRecomendacion(senales, historial, hoy, miembro);
    const seedsOk = !!rutZ2 && !!rutHiit && !!rutDescarga && !!prgDeload;
    filas.push({
      feature: "Recomendaciones (P50)",
      implementada: typeof calcularRecomendacion === "function",
      prerequisito: conBaseline.length > 0 && seedsOk,
      resumenPrereq: `${conBaseline.length}/${senales.length} señales con baseline · rutinas RUT-0023/24/25 + PRG-0009 ${seedsOk ? "seedeadas" : "FALTAN"}`,
      donde: "Home → tarjeta de recomendación",
      detalle: [
        recomendacion
          ? `Recomendación que saldría hoy para ${miembro}: **${recomendacion.tipo}** — ${recomendacion.mensaje ?? JSON.stringify(recomendacion)}`
          : "Ninguna recomendación aplicaría hoy con los datos leídos (silencio esperado si no hay baseline o ninguna regla dispara).",
      ],
      accion: !seedsOk ? "npm run seed:salud-rutinas (faltan una o más de RUT-0023/RUT-0024/RUT-0025/PRG-0009)" : undefined,
    });
  }

  // ═══ Fila 9 — Tendencias I1 ═══
  {
    const conteos = TIPOS_RESUMEN.map((t, i) => ({ tipo: t, n: metricasPorTipo[i].length }));
    const chips = conteos.filter((c) => alcanzaMinimoChip(c.n));
    filas.push({
      feature: "Tendencias I1",
      implementada: typeof serieTendencia === "function" && contieneEnFuente("src/components/salud/ProgresoTab.tsx", /TrendChart/),
      prerequisito: chips.length > 0,
      resumenPrereq: chips.length > 0
        ? `chips que deberían verse: ${chips.map((c) => c.tipo).join(", ")}`
        : `ningún tipo llega a ${MIN_DATOS_CHIP} datos (tope de lectura: 10 por tipo)`,
      donde: "/salud → tab Progreso → sección \"Tendencias de salud\"",
      detalle: [
        `Conteos leídos por tipo (tope 10 c/u): ${conteos.map((c) => `${c.tipo}=${c.n}`).join(", ")}.`,
        "Si algún conteo dio exactamente 10, el real puede ser mayor (tope de la consulta) — el chip igual se mostraría.",
      ],
    });
  }

  // ═══ Fila 10 — Costo cardíaco I2 ═══
  {
    const conBiometria = historial.filter((h) => h.biometria && h.idRutina);
    const porRutina = new Map<string, number>();
    for (const h of conBiometria) porRutina.set(h.idRutina!, (porRutina.get(h.idRutina!) ?? 0) + 1);
    const entradas = [...porRutina.entries()].sort((a, b) => b[1] - a[1]);
    const mejorRutina = entradas[0];
    const comparativa = historial[0] ? compararConPrevias(historial[0], historial) : null;
    filas.push({
      feature: "Costo cardíaco I2",
      implementada: typeof compararConPrevias === "function" && typeof serieCostoRutina === "function",
      prerequisito: !!mejorRutina && mejorRutina[1] >= MIN_SESIONES_SECCION,
      resumenPrereq: mejorRutina
        ? `rutina con más sesiones con biometría: ${mejorRutina[0]} (${mejorRutina[1]} sesión(es), umbral sección=${MIN_SESIONES_SECCION}, umbral comparación=2)`
        : "ninguna sesión leída (con rutina) tiene biometría todavía",
      donde: "RutinaDetalle → sección \"Costo cardíaco\" · HistorialDetalle → frase de comparación",
      detalle: [
        `Sesiones con biometría por rutina (últimas ${historial.length} leídas): ${entradas.map(([r, n]) => `${r}=${n}`).join(", ") || "ninguna"}.`,
        comparativa
          ? `compararConPrevias sobre la sesión más reciente: Δ${comparativa.deltaBpm.toFixed(1)} bpm vs ${comparativa.sesionesPrevias} previa(s).`
          : "compararConPrevias devuelve null para la sesión más reciente (sesión libre o < 2 previas de la misma rutina).",
      ],
    });
  }

  // ═══ Fila 11 — Progresión I3 ═══
  {
    const rutinasValidas = rutinasReferenciadas.filter((r): r is Rutina => !!r);
    const sugerencias: string[] = [];
    const idsEjercicioVistos = new Set<string>();
    for (const r of rutinasValidas) {
      for (const b of r.bloques) {
        if (b.modalidad !== "Fuerza" || idsEjercicioVistos.has(b.idEjercicio)) continue;
        idsEjercicioVistos.add(b.idEjercicio);
        const s = sugerirProgresion(b.idEjercicio, historial, b.prescripcion);
        if (s) sugerencias.push(`${b.nombreEjercicio} (${r.idRutina}): ${s.tipo} — ${s.motivo}`);
      }
    }
    filas.push({
      feature: "Progresión I3",
      implementada: typeof sugerirProgresion === "function",
      prerequisito: sugerencias.length > 0,
      resumenPrereq: sugerencias.length > 0
        ? `${sugerencias.length} ejercicio(s) con sugerencia hoy`
        : `sin sugerencias (rutinas referenciadas por el historial leído: ${idsRutinaReferenciadas.join(", ") || "ninguna"})`,
      donde: "EntrenarSesion → SugerenciaChip · RutinaDetalle → ícono en bloques \"subir-peso\"",
      detalle: sugerencias.length > 0
        ? sugerencias.map((s) => `- ${s}`)
        : ["Nota: se simula con la prescripción ACTUAL de la rutina en /rutinas (no la de una sesión específica programada para hoy) — si la rutina de esas sesiones no está entre las últimas referenciadas, no aparece nada acá aunque exista en la app."],
    });
  }

  // ── Sección C: checklist para el owner ────────────────────────────────────────
  const seccionC: string[] = [];
  seccionC.push("## C. Para el owner\n");
  const accionables = filas.filter((f) => !f.implementada || f.prerequisito === false || f.accion);
  if (deployEstado.desactualizado || accionables.length > 0) {
    let n = 1;
    if (deployEstado.desactualizado) {
      seccionC.push(`${n++}. **Falta deployar** (${deployEstado.detalle}) → \`npm run build && firebase deploy\``);
    }
    for (const f of filas) {
      if (!f.implementada) {
        seccionC.push(`${n++}. **${f.feature}: no está implementada** en HEAD todavía.`);
      } else if (f.accion) {
        seccionC.push(`${n++}. **${f.feature}**: ${f.accion}`);
      } else if (f.prerequisito === false) {
        seccionC.push(`${n++}. **${f.feature}**: falta el prerequisito de datos (${f.resumenPrereq}) — se activa solo cuando se cumpla, no hace falta ninguna acción manual.`);
      }
    }
  } else {
    seccionC.push("Todo lo auditado está implementado, deployado y con datos suficientes:\n");
    for (const f of filas) seccionC.push(`- **${f.feature}** → ${f.donde}`);
  }
  seccionC.push("");

  // ── Ensamblado del reporte ────────────────────────────────────────────────────
  const L: string[] = [];
  L.push(`# Auditoría de features — salud + recomendaciones (series S e I) — ${miembro} — ${hoy}\n`);
  L.push(
    "> Reporte read-only generado por `scripts/auditoria-features.ts` (P62). No modifica " +
    "Firestore ni el comportamiento de la app. Contiene datos de salud personales — no commitear.\n",
  );
  L.push(...seccionALineas);
  L.push("## B. Matriz de features\n");
  L.push("| Feature | Implementada | Prerequisito de datos |");
  L.push("|---|---|---|");
  for (const f of filas) {
    const impl = f.implementada ? "✅" : "❌";
    const prereq = f.prerequisito === null
      ? f.resumenPrereq
      : `${f.prerequisito ? "✅" : "❌"} ${f.resumenPrereq}`;
    L.push(`| ${f.feature} | ${impl} | ${prereq} |`);
  }
  L.push("");
  for (const f of filas) {
    L.push(`### ${f.feature}\n`);
    L.push(`- **Dónde verla:** ${f.donde}`);
    L.push(...f.detalle.map((d) => (d.startsWith("-") ? d : `- ${d}`)));
    L.push("");
  }
  L.push(...seccionC);
  L.push(`_Lecturas de Firestore usadas por esta corrida: ${lecturas}._\n`);

  const contenido = L.join("\n");
  console.log(contenido);

  const dirSalida = resolve(ROOT, "docs", "auditorias");
  mkdirSync(dirSalida, { recursive: true });
  const rutaSalida = resolve(dirSalida, `features-${hoy.replace(/-/g, "")}.md`);
  writeFileSync(rutaSalida, contenido, "utf8");
  console.log(`\n✅  Reporte escrito en ${rutaSalida} (${lecturas} lecturas)\n`);
}

await main();
process.exit(0);
