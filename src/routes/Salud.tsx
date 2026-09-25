import { useState, useEffect, useRef } from "react";
import { TabBar } from "../components/TabBar";
import { Plus, Upload, FileText } from "lucide-react";
import type {
  MedicionCorporal, SesionCardio, RegistroSueno,
  MetricaSalud, MiembroId, Historial,
} from "../types/models";
import {
  getMediciones, guardarMedicion,
  getCardioRango, contarCardio, guardarCardio,
  getRegistrosSueno,
  importarMedicionesIdempotente,
  importarCardioIdempotente,
  importarSueno,
  importarMetricas,
  getMetricasSalud,
  type CursorCardio,
} from "../data/salud";
import {
  detectarTipoCsv, parsearPeso, parsearEjercicio, parsearSueno,
  detectarTiposMetrica, parsearMetricas,
  type SamsungCsvType,
} from "../import/samsungHealth";
import {
  extraerDesdeZip,
} from "../import/samsungZip";
import { getPerfiles } from "../data/perfiles";
import { getHistorialEnLaApp } from "../data/historial";
import { enriquecerTrasImport } from "../data/enriquecimiento";
import { clasificarImport, type ItemClasificado } from "../lib/importSelectivo";
import { getConfigImport, CONFIG_IMPORT_DEFAULT } from "../data/configImport";
import { firebaseErrorMessage } from "../lib/result";
import { limpiarCacheDiasActivos } from "../lib/cacheDiasActivos";
import { correrPaso, resumirPasos } from "../lib/pasoImport";
import { leerEstadoPuente, type EstadoPuente } from "../data/ingestaSdk";
import { sincronizarDesdePuente, type ResumenSincronizacion } from "../data/sincronizarPuente";
import { PuentePanel, PuentePreview } from "../components/salud/PuentePanel";
import {
  anotarSincronizacionManual, ultimaSincronizacionAutomatica, useEstadoSincronizacion,
} from "../hooks/useSincronizacionAutomatica";
import { useAuth } from "../auth/useAuth";
import { ResumenTab }    from "../components/salud/ResumenTab";
import { ComposicionTab } from "../components/salud/ComposicionTab";
import { CardioTab }     from "../components/salud/CardioTab";
import { SuenoTab }      from "../components/salud/SuenoTab";
import { ProgresoTab }   from "../components/salud/ProgresoTab";
import { ImportPreview, ManualForm } from "../components/salud/ImportPanel";
import type { PreviewState, CardioEx } from "../components/salud/ImportPanel";

type Tab = "resumen" | "composicion" | "cardio" | "sueno" | "progreso";

// ── Fechas del paginado (P76b) ──────────────────────────────────────────────
// Todo en hora local: la `fecha` de /cardio es local, no UTC (P76a).

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function hoyYmd(): string { return ymd(new Date()); }

/** Los últimos 12 meses: la ventana que se trae al abrir Salud. */
function haceUnAno(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  return ymd(d);
}

/** El día anterior a `fecha`, para pedir lo que quedó más atrás sin repetir. */
function diaAnterior(fecha: string): string {
  const [y, m, dd] = fecha.split("-").map(Number);
  const d = new Date(y, m - 1, dd - 1);
  return ymd(d);
}

// ── Componente principal ──────────────────────────────────────────────────────

export function Salud() {
  const { memberId, user } = useAuth();
  const [tab,        setTab]       = useState<Tab>("resumen");
  const [mediciones, setMediciones]= useState<MedicionCorporal[]>([]);
  const [cardio,     setCardio]    = useState<SesionCardio[]>([]);
  const [sueno,      setSueno]     = useState<RegistroSueno[]>([]);
  const [metricas,   setMetricas]  = useState<MetricaSalud[]>([]);
  const [historial,  setHistorial] = useState<Historial[]>([]);
  const [loading,    setLoading]   = useState(true);
  const [error,      setError]     = useState<string | null>(null);
  const [metricasError, setMetricasError] = useState<string | null>(null);
  // ── Paginado de /cardio (P76b) ────────────────────────────────────────────
  // Antes se traía la colección entera al montar: 2563 lecturas por visita.
  const [cursorCardio,  setCursorCardio]  = useState<CursorCardio | null>(null);
  const [ventanaDesde,  setVentanaDesde]  = useState<string | null>(null);
  const [totalCardio,   setTotalCardio]   = useState<number | null>(null);
  const [cargandoMas,   setCargandoMas]   = useState(false);

  // Import state
  const [showManual,        setShowManual]        = useState(false);
  const [importMsg,         setImportMsg]         = useState<string | null>(null);
  const [preview,           setPreview]           = useState<PreviewState | null>(null);
  const [zipProgress,       setZipProgress]       = useState<number | null>(null);
  const [zipMsg,            setZipMsg]            = useState<string>("");
  // ── Puente Samsung (PU4) ──────────────────────────────────────────────────
  const [estadoPuente,   setEstadoPuente]   = useState<EstadoPuente | null>(null);
  const [sincronizando,  setSincronizando]  = useState(false);
  const [confirmandoSync,setConfirmandoSync]= useState(false);
  const [previaPuente,   setPreviaPuente]   = useState<ResumenSincronizacion | null>(null);
  const [errorPuente,    setErrorPuente]    = useState<string | null>(null);
  const [umbralPuente,   setUmbralPuente]   = useState(CONFIG_IMPORT_DEFAULT.duracionMinimaMin);

  const fileRef = useRef<HTMLInputElement>(null);
  const zipRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!memberId) return;
    const desde = haceUnAno();
    setVentanaDesde(desde);
    Promise.all([
      getMediciones(memberId),
      getCardioRango(memberId, { desde }),
      getRegistrosSueno(memberId),
      getMetricasSalud(memberId as MiembroId),
      getHistorialEnLaApp(memberId as MiembroId),
    ]).then(([m, c, s, met, h]) => {
      if (m.ok)   setMediciones(m.value);
      if (c.ok) { setCardio(c.value.sesiones); setCursorCardio(c.value.siguienteCursor); }
      if (s.ok)   setSueno(s.value);
      if (met.ok) setMetricas(met.value);
      if (h.ok)   setHistorial(h.value);
      // Ningún error se traga: mediciones/cardio/sueno/historial comparten un
      // aviso genérico arriba de la página; métricas tiene su propio aviso
      // con reintentar en Resumen/Progreso porque son las tabs que dependen de ella.
      const otros = [!m.ok && m.error, !c.ok && c.error, !s.ok && s.error, !h.ok && h.error].filter(Boolean) as string[];
      setError(otros[0] ?? null);
      setMetricasError(met.ok ? null : met.error);
      setLoading(false);
    });
    // El total es una sola lectura agregada: alcanza para decir cuántas hay sin
    // traerlas. Si falla, la pestaña muestra lo que tiene y no dice el total.
    contarCardio(memberId).then((r) => { if (r.ok) setTotalCardio(r.value); });
  }, [memberId]);

  /**
   * Trae la página siguiente de actividades, hacia atrás en el tiempo (P76b).
   *
   * Primero agota la ventana del último año con el cursor; cuando se terminó,
   * la ensancha pidiendo lo anterior a esa fecha. Así la primera visita lee
   * una página y no la colección entera.
   */
  async function cargarMasCardio() {
    if (!memberId || cargandoMas) return;
    setCargandoMas(true);
    const opciones = cursorCardio
      ? { desde: ventanaDesde ?? undefined, cursor: cursorCardio }
      : { hasta: diaAnterior(ventanaDesde ?? hoyYmd()) };
    const r = await getCardioRango(memberId, opciones);
    if (r.ok) {
      setCardio((prev) => [...prev, ...r.value.sesiones]);
      setCursorCardio(r.value.siguienteCursor);
      if (!cursorCardio) setVentanaDesde(null);   // ya no hay piso: seguimos por cursor
    } else {
      setError(r.error);
    }
    setCargandoMas(false);
  }

  /** ¿Queda historia más vieja sin traer? */
  const hayMasCardio = cursorCardio != null || ventanaDesde != null;

  /**
   * Vuelve a la primera página después de escribir. **No relee /cardio entero**
   * para verificar lo que se acaba de importar (P76b): el import ya dice
   * cuántos documentos escribió.
   *
   * También tira la caché de días activos (P77b): un import puede reescribir
   * semanas viejas —el ZIP trae dos años— y una caché que sobreviviera a eso
   * mostraría esas semanas como estaban antes.
   */
  async function refrescarCardio() {
    if (!memberId) return;
    limpiarCacheDiasActivos();
    const desde = haceUnAno();
    const r = await getCardioRango(memberId, { desde });
    if (r.ok) {
      setCardio(r.value.sesiones);
      setCursorCardio(r.value.siguienteCursor);
      setVentanaDesde(desde);
    }
    const t = await contarCardio(memberId);
    if (t.ok) setTotalCardio(t.value);
  }

  async function reintentarMetricas() {
    if (!memberId) return;
    const met = await getMetricasSalud(memberId as MiembroId);
    if (met.ok) { setMetricas(met.value); setMetricasError(null); }
    else        setMetricasError(met.error);
  }

  // El estado del puente se lee solo: es un documento y dice si está corriendo.
  useEffect(() => {
    if (!user?.uid) return;
    leerEstadoPuente(user.uid).then((r) => { if (r.ok) setEstadoPuente(r.value); });
  }, [user?.uid]);

  // Cuándo corrió sola (P85). Suscribirse al estado hace que se relea cuando la
  // automática termina; leer localStorage en cada render es gratis.
  useEstadoSincronizacion();
  const ultimaAutoMs = user?.uid ? ultimaSincronizacionAutomatica(user.uid) : null;

  /** Lee el puente y muestra la vista previa. No escribe nada todavía. */
  async function vistaPreviaPuente() {
    if (!user?.uid || !memberId) return;
    setSincronizando(true);
    setErrorPuente(null);
    const [perfRes, histRes, cfgRes] = await Promise.all([
      getPerfiles(),
      getHistorialEnLaApp(memberId as MiembroId),
      getConfigImport(),
    ]);
    const config = cfgRes.ok ? cfgRes.value : CONFIG_IMPORT_DEFAULT;
    setUmbralPuente(config.duracionMinimaMin);

    const r = await sincronizarDesdePuente(
      user.uid, memberId as MiembroId, histRes.ok ? histRes.value : [], config,
      {
        soloVistaPrevia: true,
        zonasFC: perfRes.ok ? perfRes.value[memberId as MiembroId]?.zonasFC : undefined,
      },
    );
    setSincronizando(false);
    if (!r.ok) { setErrorPuente(r.error); return; }
    setPreviaPuente(r.value);
  }

  /** Confirma: escribe cardio, externas y mediciones con el pipeline del ZIP. */
  async function confirmarPuente() {
    if (!user?.uid || !memberId || !previaPuente) return;
    setConfirmandoSync(true);
    setErrorPuente(null);
    let r: Awaited<ReturnType<typeof sincronizarDesdePuente>>;
    try {
      const [perfRes, histRes, cfgRes] = await Promise.all([
        getPerfiles(),
        getHistorialEnLaApp(memberId as MiembroId),
        getConfigImport(),
      ]);
      r = await sincronizarDesdePuente(
        user.uid, memberId as MiembroId, histRes.ok ? histRes.value : [],
        cfgRes.ok ? cfgRes.value : CONFIG_IMPORT_DEFAULT,
        { zonasFC: perfRes.ok ? perfRes.value[memberId as MiembroId]?.zonasFC : undefined },
      );
    } catch (e) {
      // Cualquier excepción inesperada: antes se comía el `setConfirmandoSync(false)`
      // y el botón quedaba en "Guardando…" hasta recargar la página (P76a).
      setErrorPuente(firebaseErrorMessage(e));
      return;
    } finally {
      // Pase lo que pase, el botón se destraba.
      setConfirmandoSync(false);
    }
    setPreviaPuente(null);
    if (!r.ok) { setErrorPuente(r.error); return; }

    const v = r.value;
    // Que la automática no repita esto ni lo cuente como nuevo (P85).
    anotarSincronizacionManual(user.uid, estadoPuente?.ultimaCorridaMs, v);
    // Los contadores son los de la escritura real, no los de la clasificación.
    setImportMsg(
      (v.enCola
        ? `⏳ Puente: quedó en cola, se sube cuando haya señal.`
        : `✅ Puente: ${v.registros} registros`)
      + ` · ${v.escritos.cardio} actividades guardadas`
      + `${v.escritos.mediciones > 0 ? ` · ${v.escritos.mediciones} mediciones` : ""}`
      + `${v.externas > 0 ? ` · ${v.externas} se ven en el historial` : ""}`
      // Lo enriquecido de verdad (P82), no lo que la clasificación predijo.
      + `${v.enriquecimiento && v.enriquecimiento.matcheadas > 0
          ? ` · ${v.enriquecimiento.matcheadas} sesión${v.enriquecimiento.matcheadas !== 1 ? "es" : ""} con biometría`
          : ""}`
      + `${v.errorEnriquecimiento ? ` · ⚠ la biometría falló: ${v.errorEnriquecimiento}` : ""}`,
    );

    // Refrescar lo que cambió — la primera página, no la colección entera.
    await refrescarCardio();
    const [fm, fh] = await Promise.all([
      getMediciones(memberId),
      getHistorialEnLaApp(memberId as MiembroId),
    ]);
    if (fm.ok) setMediciones(fm.value);
    if (fh.ok) setHistorial(fh.value);
  }

  // ── ZIP → extracción selectiva → preview ─────────────────────────────────
  async function handleZip(file: File) {
    if (!memberId) return;
    setZipProgress(0);
    setZipMsg("Abriendo ZIP…");

    const perfRes = await getPerfiles();
    const zonasFC = perfRes.ok ? perfRes.value[memberId as MiembroId]?.zonasFC : undefined;

    const result = await extraerDesdeZip(
      file, memberId as MiembroId, "biometrico", zonasFC,
      (pct, msg) => { setZipProgress(pct); setZipMsg(msg); },
    );
    setZipProgress(null);

    if (result.errors.length > 0 &&
        result.mediciones.length + result.cardio.length + result.sueno.length + result.metricas.length === 0) {
      setImportMsg(result.errors[0]);
      return;
    }

    const [histRes, cfgRes] = await Promise.all([
      getHistorialEnLaApp(memberId as MiembroId),
      getConfigImport(),
    ]);
    const histLocalCache = histRes.ok ? histRes.value : [];
    const shapeUpCustomIds = result.shapeUpCustomId ? [result.shapeUpCustomId] : [];
    // Nada se descarta en silencio (P75): cada actividad va a enriquecer una
    // sesión, a entrar como externa, o a mostrarse con el motivo por el que no entra.
    const clasificadas = clasificarImport(
      result.cardio as CardioEx[], histLocalCache, shapeUpCustomIds,
      cfgRes.ok ? cfgRes.value : CONFIG_IMPORT_DEFAULT, Date.now(),
    );

    const total = result.mediciones.length + result.cardio.length + result.sueno.length + result.metricas.length;
    const previewRows = [
      ...result.mediciones.slice(0, 2).map((m) => ({ Tipo: "Peso",   Fecha: m.fecha, Dato: `${m.pesoKg ?? "—"} kg` })),
      ...result.cardio.slice(0, 2).map(   (c) => ({ Tipo: "Cardio", Fecha: c.fecha, Dato: c.actividad })),
      ...result.sueno.slice(0,  2).map(   (s) => ({ Tipo: "Sueño",  Fecha: s.fecha, Dato: `${s.horas ?? "—"} h` })),
    ].slice(0, 5);

    setPreview({
      tipo: "zip" as SamsungCsvType,
      file,
      parsedItems: [...result.mediciones, ...result.cardio, ...result.sueno, ...result.metricas] as unknown[],
      parsedErrors: result.errors.slice(0, 5),
      previewRows,
      zipData: result,
      zipTotal: total,
      clasificadas,
      umbralMin: (cfgRes.ok ? cfgRes.value : CONFIG_IMPORT_DEFAULT).duracionMinimaMin,
    });
  }

  // ── CSV suelto → preview ─────────────────────────────────────────────────
  async function handleFile(file: File) {
    if (!memberId) return;
    const tipo = detectarTipoCsv(file.name);

    if (tipo === "unknown") {
      const metaMeta = detectarTiposMetrica(file.name);
      if (metaMeta) {
        const text = await file.text();
        const r = parsearMetricas(file.name, text, memberId);
        const previewRows = r.items.slice(0, 5).map((i) => ({
          Fecha: i.fecha, Tipo: i.tipo, Valor: `${i.valor} ${i.unidad ?? ""}`.trim(), Agregación: i.agregacion,
        }));
        setPreview({ tipo: "metricas" as SamsungCsvType, file, parsedItems: r.items, parsedErrors: r.errors, previewRows });
        return;
      }
      setImportMsg("No reconocí el archivo. Esperaba weight, exercise, sleep o un CSV de métricas genéricas.");
      return;
    }
    const text = await file.text();

    let parsedItems: unknown[] = [];
    let parsedErrors: string[] = [];
    let previewRows: Record<string, string>[] = [];

    if (tipo === "weight") {
      const r = parsearPeso(text, memberId);
      parsedItems  = r.items;
      parsedErrors = r.errors;
      previewRows  = r.items.slice(0, 5).map((i) => ({
        Fecha: i.fecha,
        "Peso (kg)": String(i.pesoKg ?? "-"),
        "Grasa (%)": String(i.grasaPct ?? "-"),
        "Músculo (kg)": String(i.masaMuscularKg ?? "-"),
        IMC: String(i.imc ?? "-"),
      }));
    } else if (tipo === "exercise") {
      const [perfRes, histRes, cfgRes] = await Promise.all([
        getPerfiles(),
        getHistorialEnLaApp(memberId as MiembroId),
        getConfigImport(),
      ]);
      const zonasFC   = (perfRes.ok ? perfRes.value[memberId as MiembroId]?.zonasFC : undefined);
      const r         = parsearEjercicio(text, memberId, zonasFC);
      parsedItems  = r.items;
      parsedErrors = r.errors;
      previewRows  = r.items.slice(0, 5).map((i) => ({
        Fecha: i.fecha, Actividad: i.actividad,
        "Dur (min)": String(i.duracionMin ?? "-"),
        "FC media": String(i.fcPromedio ?? "-"),
        Zona: i.zonaPrincipal ?? "-",
        kcal: String(i.kcal ?? "-"),
      }));
      const historial2 = histRes.ok ? histRes.value : [];
      const clasificadas = clasificarImport(
        r.items as CardioEx[], historial2, [],
        cfgRes.ok ? cfgRes.value : CONFIG_IMPORT_DEFAULT, Date.now(),
      );
      setPreview({
        tipo, file, parsedItems, parsedErrors, previewRows, clasificadas,
        umbralMin: (cfgRes.ok ? cfgRes.value : CONFIG_IMPORT_DEFAULT).duracionMinimaMin,
      });
      return;
    } else {
      const r = parsearSueno(text, memberId);
      parsedItems  = r.items;
      parsedErrors = r.errors;
      previewRows  = r.items.slice(0, 5).map((i) => ({
        Fecha: i.fecha, Horas: String(i.horas ?? "-"), Acostarse: i.horaAcostarse ?? "-",
      }));
    }

    setPreview({ tipo, file, parsedItems, parsedErrors, previewRows });
  }

  /**
   * Qué se escribe a partir de la clasificación.
   *
   * **Desde P76b hay un solo destino: /cardio.** Todas las filas van enteras
   * ahí, que ya es idempotente por datauuid. La clasificación no decide qué se
   * escribe — solo informa cuántas van a enriquecer una sesión y cuántas se van
   * a ver en el historial, que ahora es un filtro de lectura.
   */
  function planDeEscritura(cls: ItemClasificado<CardioEx>[]) {
    return {
      cardioItems: cls.map((c) => c.item),
      enriquecen:  cls.filter((c) => c.destino === "enriquece").length,
      externas:    cls.filter((c) => c.destino === "externa").length,
      descartadas: cls.filter((c) => c.destino === "descartada").length,
    };
  }

  /**
   * "2562 actividades guardadas. 166 se ven en el historial; el resto queda en
   * salud." — `guardadas` es lo que **se escribió de verdad**, no lo que se
   * clasificó (P76b, mismo criterio que P76a le aplicó al puente).
   */
  function resumenActividades(
    guardadas: number, enriquecen: number, externas: number, descartadas: number,
  ): string {
    const umbralMin = preview?.umbralMin ?? CONFIG_IMPORT_DEFAULT.duracionMinimaMin;
    if (guardadas === 0) return "";
    const detalle = [
      enriquecen > 0 ? `${enriquecen} enriquecen sesiones tuyas` : null,
      externas   > 0 ? `${externas} se ven en el historial` : null,
    ].filter(Boolean).join(", ");
    const soloSalud = descartadas > 0
      ? ` ${descartadas} quedan solo en salud (menos de ${umbralMin} min o detectadas por el reloj).`
      : "";
    return ` · ${guardadas} actividades guardadas${detalle ? `: ${detalle}` : ""}.${soloSalud}`;
  }

  // ── Confirmar import ─────────────────────────────────────────────────────
  async function confirmarImport() {
    if (!preview || !memberId) return;
    setPreview(null);

    function fmtImportMsg(importados: number, omitidos: number, sufijo = ""): string {
      const base = `✅ ${importados} importados${omitidos > 0 ? ` · ${omitidos} omitidos` : ""}`;
      return sufijo ? `${base} ${sufijo}` : base;
    }

    if (preview.tipo === "zip" && preview.zipData) {
      const z = preview.zipData;
      try {
        const plan = preview.clasificadas
          ? planDeEscritura(preview.clasificadas)
          : { cardioItems: z.cardio, enriquecen: 0, externas: 0, descartadas: 0 };
        const cardioParaImportar = plan.cardioItems as Parameters<typeof importarCardioIdempotente>[0];

        // Cada paso reporta lo que escribió, no lo que clasificó (P76b).
        const pasos = await Promise.all([
          correrPaso("mediciones", () => importarMedicionesIdempotente(z.mediciones as Parameters<typeof importarMedicionesIdempotente>[0]), z.mediciones.length),
          correrPaso("actividades", () => importarCardioIdempotente(cardioParaImportar), cardioParaImportar.length),
          correrPaso("sueño", () => importarSueno(z.sueno as Parameters<typeof importarSueno>[0]), z.sueno.length),
          correrPaso("métricas", () => importarMetricas(z.metricas), z.metricas.length),
        ]);

        const { escritos, fallados, sufijo } = resumirPasos(pasos);
        const guardados = pasos.find((p) => p.nombre === "actividades")?.escritos ?? 0;

        const resumen = resumenActividades(
          guardados, plan.enriquecen, plan.externas, plan.descartadas,
        );
        let msgBase = escritos === 0 && fallados.length > 0
          ? `❌ ${fallados.map((p) => `${p.nombre}: ${p.error}`).join(" · ")}`
          : fmtImportMsg(escritos, 0, `desde ZIP${resumen}`);
        msgBase += sufijo;

        // El resultado del enriquecimiento SIEMPRE se suma al mensaje — nunca desaparece
        // en silencio, ni cuando no hay candidatas, ni cuando la llamada tira (S-fix, P55).
        try {
          if (z.sesionesSamsung.length > 0 || z.muestrasFcCrudas.length > 0) {
            const enrRes = await enriquecerTrasImport(memberId as MiembroId, z);
            if (enrRes.ok) {
              const {
                matcheadas, porCustomId, porVentana, porDia, porRango,
                sinMatch, sinCandidatasEseDia, sinSolape, ambiguas, ambiguasDetalle,
                conTramos, tramosExtra, omitidas,
              } = enrRes.value;
              const evaluadas = matcheadas + sinMatch + ambiguas + omitidas;
              const partes: string[] = [];
              if (matcheadas > 0) {
                const detalle = [`${porCustomId} por custom-id`, `${porVentana} por ventana`];
                if (porDia   > 0) detalle.push(`${porDia} por día`);
                if (porRango > 0) detalle.push(`${porRango} por rango horario`);
                partes.push(`${matcheadas} matcheada${matcheadas !== 1 ? "s" : ""} (${detalle.join(", ")})`);
              }
              if (sinMatch > 0) {
                const desglose = [`${sinCandidatasEseDia} sin candidatas ese día`, `${sinSolape} sin solape`]
                  .filter((d) => !d.startsWith("0 "));
                partes.push(`${sinMatch} sin match${desglose.length > 0 ? ` (${desglose.join(", ")})` : ""}`);
              }
              // Las ambiguas se LISTAN con nombre y fecha (P78): un contador que
              // nadie mira no sirve para nada. Quedan para enlazar a mano.
              if (ambiguas > 0) {
                const cuales = ambiguasDetalle
                  .map((a) => `${a.nombreRutina} (${a.fecha})`)
                  .join(", ");
                partes.push(`${ambiguas} sin resolver, 2+ ShapeUp el mismo día: ${cuales}`);
              }
              if (conTramos > 0) {
                partes.push(`${conTramos} con ${tramosExtra} tramo${tramosExtra !== 1 ? "s" : ""} adicional${tramosExtra !== 1 ? "es" : ""}`);
              }
              if (omitidas    > 0) partes.push(`${omitidas} ya estaban enriquecidas`);
              msgBase += ` · ${evaluadas} sesión${evaluadas !== 1 ? "es" : ""} evaluada${evaluadas !== 1 ? "s" : ""}${partes.length > 0 ? `: ${partes.join(" · ")}` : ""}`;
            } else {
              msgBase += ` ⚠ Enriquecimiento: ${enrRes.error}`;
            }
          } else {
            msgBase += " · 0 sesiones con hora de inicio/fin para matchear";
          }
        } catch (e) {
          msgBase += ` ⚠ Enriquecimiento: error inesperado (${e instanceof Error ? e.message : String(e)})`;
        }

        setImportMsg(msgBase);
        // No se relee /cardio entero para verificar lo importado (P76b): eso
        // era otra pasada de 2563 lecturas. Se vuelve a la primera página.
        await refrescarCardio();
        const [fm, fs, fmet] = await Promise.all([
          getMediciones(memberId),
          getRegistrosSueno(memberId),
          getMetricasSalud(memberId as MiembroId),
        ]);
        if (fm.ok)   setMediciones(fm.value);
        if (fs.ok)   setSueno(fs.value);
        if (fmet.ok) setMetricas(fmet.value);
        setMetricasError(fmet.ok ? null : fmet.error);
      } catch (e) {
        setImportMsg(`❌ Error inesperado al importar: ${e instanceof Error ? e.message : String(e)}`);
      }
      return;
    }

    // Caso CSV suelto
    let importados = 0, omitidos = 0, errorMsg: string | undefined;
    let sufijoCSV = "";

    if (preview.tipo === "weight") {
      const r = await importarMedicionesIdempotente(preview.parsedItems as Parameters<typeof importarMedicionesIdempotente>[0]);
      if (r.ok) { importados = r.value.importados; omitidos = r.value.omitidos; const fresh = await getMediciones(memberId); if (fresh.ok) setMediciones(fresh.value); }
      else errorMsg = r.error;
    } else if (preview.tipo === "exercise") {
      const plan = preview.clasificadas
        ? planDeEscritura(preview.clasificadas)
        : { cardioItems: preview.parsedItems, enriquecen: 0, externas: 0, descartadas: 0 };
      const items = plan.cardioItems as Parameters<typeof importarCardioIdempotente>[0];
      const paso = await correrPaso("actividades", () => importarCardioIdempotente(items), items.length);
      importados = paso.escritos;
      if (paso.error)  errorMsg = paso.error;
      if (paso.escritos > 0 || paso.enCola) await refrescarCardio();
      sufijoCSV = resumenActividades(
        paso.escritos, plan.enriquecen, plan.externas, plan.descartadas,
      );
      if (paso.enCola) sufijoCSV += " ⏳ Quedó en cola, se sube cuando haya señal.";
    } else if (preview.tipo === ("metricas" as SamsungCsvType)) {
      const r = await importarMetricas(preview.parsedItems as MetricaSalud[]);
      if (r.ok) {
        importados = r.value.importados; omitidos = r.value.omitidos;
        const fmet = await getMetricasSalud(memberId as MiembroId);
        if (fmet.ok) setMetricas(fmet.value);
        setMetricasError(fmet.ok ? null : fmet.error);
      } else errorMsg = r.error;
    } else {
      const r = await importarSueno(preview.parsedItems as Parameters<typeof importarSueno>[0]);
      if (r.ok) { importados = r.value.importados; omitidos = r.value.omitidos; const fresh = await getRegistrosSueno(memberId); if (fresh.ok) setSueno(fresh.value); }
      else errorMsg = r.error;
    }

    setImportMsg(errorMsg && importados === 0 ? `Error: ${errorMsg}` : fmtImportMsg(importados, omitidos) + sufijoCSV);
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: "resumen",     label: "Resumen"     },
    { key: "composicion", label: "Composición" },
    { key: "cardio",      label: "Cardio"      },
    { key: "sueno",       label: "Sueño"       },
    { key: "progreso",    label: "Progreso"    },
  ];

  const hoy = new Date().toISOString().slice(0, 10);

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Salud</h1>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <button className="btn-icon-sm" title="Importar ZIP de Samsung Health" onClick={() => zipRef.current?.click()}>
            <Upload size={18} />
          </button>

          <button
            className="btn-icon-sm"
            title="CSV suelto (alternativa al ZIP)"
            onClick={() => fileRef.current?.click()}
            style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)" }}
          >
            <FileText size={15} />
          </button>

          <button className="btn-icon-sm" title="Carga manual" onClick={() => setShowManual(true)}>
            <Plus size={18} />
          </button>
        </div>

        <input
          ref={zipRef} type="file" accept=".zip" style={{ display: "none" }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleZip(f); e.target.value = ""; }}
        />
        <input
          ref={fileRef} type="file" accept=".csv" multiple style={{ display: "none" }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
      </div>

      <TabBar tabs={TABS} active={tab} onChange={setTab} size="sm" style={{ marginBottom: 12 }} />

      {zipProgress !== null && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ height: 6, borderRadius: 999, background: "var(--card-hover)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${zipProgress}%`, background: "var(--accent)", borderRadius: 999, transition: "width .25s ease" }} />
          </div>
          <p style={{ margin: 0, fontSize: 11, color: "var(--muted)" }}>{zipMsg}</p>
        </div>
      )}

      {importMsg && (
        <div style={{
          padding: "10px 14px", borderRadius: "var(--r-sm)", marginBottom: 8,
          background: importMsg.startsWith("✅") ? "rgba(74,222,128,0.12)" : "var(--danger-dim)",
          color: importMsg.startsWith("✅") ? "#4ade80" : "var(--danger)", fontSize: 13,
        }}>
          {importMsg}
        </div>
      )}
      {error   && <p className="inline-error">{error}</p>}
      {loading && <div className="empty-state"><div className="spinner" /></div>}

      {/* Puente Samsung (PU4): lo que sube solo, sin exportar el ZIP a mano. */}
      {user?.uid && (
        <PuentePanel
          estado={estadoPuente}
          ahora={Date.now()}
          sincronizando={sincronizando}
          onSincronizar={vistaPreviaPuente}
          error={errorPuente}
          ultimaAutoMs={ultimaAutoMs}
        />
      )}

      {previaPuente && (
        <PuentePreview
          resumen={previaPuente}
          umbralMin={umbralPuente}
          confirmando={confirmandoSync}
          onConfirmar={confirmarPuente}
          onCancelar={() => setPreviaPuente(null)}
        />
      )}

      {preview && (
        <ImportPreview
          preview={preview}
          onConfirm={confirmarImport}
          onCancel={() => setPreview(null)}
        />
      )}

      {!loading && tab === "resumen" && (
        <ResumenTab
          metricas={metricas}
          sueno={sueno}
          mediciones={mediciones}
          hoy={hoy}
          onTabChange={(t) => setTab(t as Tab)}
          metricasError={metricasError}
          onReintentarMetricas={reintentarMetricas}
        />
      )}

      {!loading && tab === "composicion" && (
        <ComposicionTab mediciones={mediciones} />
      )}

      {!loading && tab === "cardio" && (
        <CardioTab
          cardio={cardio} historial={historial}
          total={totalCardio} desde={ventanaDesde}
          hayMasEnServidor={hayMasCardio}
          cargandoMas={cargandoMas}
          onCargarMas={cargarMasCardio}
        />
      )}

      {!loading && tab === "sueno" && (
        <SuenoTab sueno={sueno} />
      )}

      {!loading && tab === "progreso" && (
        <ProgresoTab
          mediciones={mediciones} historial={historial}
          metricas={metricas} sueno={sueno} hoy={hoy}
          metricasError={metricasError}
          onReintentarMetricas={reintentarMetricas}
        />
      )}

      {showManual && memberId && (
        <ManualForm
          miembro={memberId as MiembroId}
          tab={tab === "sueno" ? "sueno" : tab === "cardio" ? "cardio" : "composicion"}
          onSave={async (data, tipo) => {
            if (tipo === "composicion") {
              const r = await guardarMedicion(data as Parameters<typeof guardarMedicion>[0]);
              if (r.ok) { const f = await getMediciones(memberId); if (f.ok) setMediciones(f.value); }
            } else if (tipo === "cardio") {
              const r = await guardarCardio(data as Parameters<typeof guardarCardio>[0]);
              if (r.ok) await refrescarCardio();
            }
            setShowManual(false);
          }}
          onClose={() => setShowManual(false)}
        />
      )}
    </div>
  );
}
