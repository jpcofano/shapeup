import { useState, useEffect, useRef } from "react";
import { TabBar } from "../components/TabBar";
import { Plus, Upload, FileText } from "lucide-react";
import type {
  MedicionCorporal, SesionCardio, RegistroSueno,
  MetricaSalud, MiembroId, Historial,
} from "../types/models";
import {
  getMediciones, guardarMedicion,
  getSesionesCardio, guardarCardio,
  getRegistrosSueno,
  importarMedicionesIdempotente,
  importarCardioIdempotente,
  importarSueno,
  importarMetricas,
  getMetricasSalud,
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
import { getHistorialMiembro } from "../data/historial";
import { enriquecerTrasImport } from "../lib/enriquecerImport";
import { filtrarCardioRelevante } from "../lib/importSelectivo";
import { useAuth } from "../auth/useAuth";
import { ResumenTab }    from "../components/salud/ResumenTab";
import { ComposicionTab } from "../components/salud/ComposicionTab";
import { CardioTab }     from "../components/salud/CardioTab";
import { SuenoTab }      from "../components/salud/SuenoTab";
import { ProgresoTab }   from "../components/salud/ProgresoTab";
import { ImportPreview, ManualForm } from "../components/salud/ImportPanel";
import type { PreviewState, CardioEx } from "../components/salud/ImportPanel";

type Tab = "resumen" | "composicion" | "cardio" | "sueno" | "progreso";

// ── Componente principal ──────────────────────────────────────────────────────

export function Salud() {
  const { memberId } = useAuth();
  const [tab,        setTab]       = useState<Tab>("resumen");
  const [mediciones, setMediciones]= useState<MedicionCorporal[]>([]);
  const [cardio,     setCardio]    = useState<SesionCardio[]>([]);
  const [sueno,      setSueno]     = useState<RegistroSueno[]>([]);
  const [metricas,   setMetricas]  = useState<MetricaSalud[]>([]);
  const [historial,  setHistorial] = useState<Historial[]>([]);
  const [loading,    setLoading]   = useState(true);
  const [error,      setError]     = useState<string | null>(null);

  // Import state
  const [showManual,        setShowManual]        = useState(false);
  const [importMsg,         setImportMsg]         = useState<string | null>(null);
  const [preview,           setPreview]           = useState<PreviewState | null>(null);
  const [zipProgress,       setZipProgress]       = useState<number | null>(null);
  const [zipMsg,            setZipMsg]            = useState<string>("");
  const [importarTodoCardio,setImportarTodoCardio]= useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const zipRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!memberId) return;
    Promise.all([
      getMediciones(memberId),
      getSesionesCardio(memberId),
      getRegistrosSueno(memberId),
      getMetricasSalud(memberId as MiembroId),
      getHistorialMiembro(memberId as MiembroId),
    ]).then(([m, c, s, met, h]) => {
      if (m.ok)   setMediciones(m.value);
      if (c.ok)   setCardio(c.value);
      if (s.ok)   setSueno(s.value);
      if (met.ok) setMetricas(met.value);
      if (h.ok)   setHistorial(h.value);
      if (!m.ok)  setError(m.error);
      setLoading(false);
    });
  }, [memberId]);

  // ── ZIP → extracción selectiva → preview ─────────────────────────────────
  async function handleZip(file: File) {
    if (!memberId) return;
    setImportarTodoCardio(false);
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

    const histRes = await getHistorialMiembro(memberId as MiembroId);
    const histLocalCache = histRes.ok ? histRes.value : [];
    const shapeUpCustomIds = result.shapeUpCustomId ? [result.shapeUpCustomId] : [];
    const filtroCardio = filtrarCardioRelevante(result.cardio as CardioEx[], histLocalCache, shapeUpCustomIds);

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
      filtroCardio,
    });
  }

  // ── CSV suelto → preview ─────────────────────────────────────────────────
  async function handleFile(file: File) {
    if (!memberId) return;
    setImportarTodoCardio(false);
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
      const [perfRes, histRes] = await Promise.all([
        getPerfiles(),
        getHistorialMiembro(memberId as MiembroId),
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
      const filtroCardio = filtrarCardioRelevante(r.items as CardioEx[], historial2, []);
      setPreview({ tipo, file, parsedItems, parsedErrors, previewRows, filtroCardio });
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

  // ── Confirmar import ─────────────────────────────────────────────────────
  async function confirmarImport() {
    if (!preview || !memberId) return;
    setPreview(null);

    const EMPTY_OK = { ok: true as const, value: { importados: 0, omitidos: 0 } };
    function fmtImportMsg(importados: number, omitidos: number, sufijo = ""): string {
      const base = `✅ ${importados} importados${omitidos > 0 ? ` · ${omitidos} omitidos` : ""}`;
      return sufijo ? `${base} ${sufijo}` : base;
    }

    if (preview.tipo === "zip" && preview.zipData) {
      const z = preview.zipData;
      try {
        let cardioParaImportar = z.cardio as Parameters<typeof importarCardioIdempotente>[0];
        let cardioFiltrados = 0;
        if (preview.filtroCardio && !importarTodoCardio) {
          const { relevantes, descartadas } = preview.filtroCardio;
          cardioParaImportar = relevantes.map(({ _motivo: _, ...rest }) => rest) as typeof cardioParaImportar;
          cardioFiltrados = descartadas.length;
        }

        const [r1, r2, r3, r4] = await Promise.all([
          z.mediciones.length       > 0 ? importarMedicionesIdempotente(z.mediciones as Parameters<typeof importarMedicionesIdempotente>[0]) : EMPTY_OK,
          cardioParaImportar.length > 0 ? importarCardioIdempotente(cardioParaImportar)                                                       : EMPTY_OK,
          z.sueno.length            > 0 ? importarSueno(z.sueno as Parameters<typeof importarSueno>[0])                                       : EMPTY_OK,
          z.metricas.length         > 0 ? importarMetricas(z.metricas)                                                                         : EMPTY_OK,
        ]);
        const importados = [r1, r2, r3, r4].reduce((s, r) => s + (r.ok ? r.value.importados : 0), 0);
        const omitidos   = [r1, r2, r3, r4].reduce((s, r) => s + (r.ok ? r.value.omitidos   : 0), 0);
        const firstErr   = [r1, r2, r3, r4].find((r) => !r.ok) as { ok: false; error: string } | undefined;

        const filtradosPart = cardioFiltrados > 0 ? ` · ${cardioFiltrados} filtrados (no relevantes)` : "";
        let msgBase = importados === 0 && firstErr
          ? `Error: ${firstErr.error}`
          : fmtImportMsg(importados, omitidos, `${filtradosPart} desde ZIP`);

        // El resultado del enriquecimiento SIEMPRE se suma al mensaje — nunca desaparece
        // en silencio, ni cuando no hay candidatas, ni cuando la llamada tira (S-fix, P55).
        try {
          if (z.sesionesSamsung.length > 0) {
            const enrRes = await enriquecerTrasImport(memberId as MiembroId, z);
            if (enrRes.ok) {
              const { matcheadas, porCustomId, porVentana, sinMatch, omitidas } = enrRes.value;
              const evaluadas = matcheadas + sinMatch + omitidas;
              const partes: string[] = [];
              if (matcheadas > 0) partes.push(`${matcheadas} matcheada${matcheadas !== 1 ? "s" : ""} (${porCustomId} por custom-id, ${porVentana} por ventana)`);
              if (sinMatch    > 0) partes.push(`${sinMatch} sin match`);
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
        const [fm, fc, fs, fmet] = await Promise.all([
          getMediciones(memberId),
          getSesionesCardio(memberId),
          getRegistrosSueno(memberId),
          getMetricasSalud(memberId as MiembroId),
        ]);
        if (fm.ok)   setMediciones(fm.value);
        if (fc.ok)   setCardio(fc.value);
        if (fs.ok)   setSueno(fs.value);
        if (fmet.ok) setMetricas(fmet.value);
      } catch (e) {
        setImportMsg(`❌ Error inesperado al importar: ${e instanceof Error ? e.message : String(e)}`);
      }
      return;
    }

    // Caso CSV suelto
    let importados = 0, omitidos = 0, errorMsg: string | undefined;

    if (preview.tipo === "weight") {
      const r = await importarMedicionesIdempotente(preview.parsedItems as Parameters<typeof importarMedicionesIdempotente>[0]);
      if (r.ok) { importados = r.value.importados; omitidos = r.value.omitidos; const fresh = await getMediciones(memberId); if (fresh.ok) setMediciones(fresh.value); }
      else errorMsg = r.error;
    } else if (preview.tipo === "exercise") {
      let cardioItems: Parameters<typeof importarCardioIdempotente>[0];
      if (preview.filtroCardio && !importarTodoCardio) {
        const { relevantes } = preview.filtroCardio;
        cardioItems = relevantes.map(({ _motivo: _, ...rest }) => rest) as typeof cardioItems;
      } else {
        cardioItems = preview.parsedItems as typeof cardioItems;
      }
      const r = await importarCardioIdempotente(cardioItems);
      if (r.ok) { importados = r.value.importados; omitidos = r.value.omitidos; const fresh = await getSesionesCardio(memberId); if (fresh.ok) setCardio(fresh.value); }
      else errorMsg = r.error;
    } else if (preview.tipo === ("metricas" as SamsungCsvType)) {
      const r = await importarMetricas(preview.parsedItems as MetricaSalud[]);
      if (r.ok) {
        importados = r.value.importados; omitidos = r.value.omitidos;
        const fmet = await getMetricasSalud(memberId as MiembroId);
        if (fmet.ok) setMetricas(fmet.value);
      } else errorMsg = r.error;
    } else {
      const r = await importarSueno(preview.parsedItems as Parameters<typeof importarSueno>[0]);
      if (r.ok) { importados = r.value.importados; omitidos = r.value.omitidos; const fresh = await getRegistrosSueno(memberId); if (fresh.ok) setSueno(fresh.value); }
      else errorMsg = r.error;
    }

    const filtradosMsgCSV = (preview.tipo === "exercise" && preview.filtroCardio && !importarTodoCardio && preview.filtroCardio.descartadas.length > 0)
      ? ` · ${preview.filtroCardio.descartadas.length} filtrados (no relevantes)` : "";
    setImportMsg(errorMsg && importados === 0 ? `Error: ${errorMsg}` : fmtImportMsg(importados, omitidos) + filtradosMsgCSV);
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

      {preview && (
        <ImportPreview
          preview={preview}
          importarTodoCardio={importarTodoCardio}
          onToggleCardio={setImportarTodoCardio}
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
        />
      )}

      {!loading && tab === "composicion" && (
        <ComposicionTab mediciones={mediciones} />
      )}

      {!loading && tab === "cardio" && (
        <CardioTab cardio={cardio} historial={historial} />
      )}

      {!loading && tab === "sueno" && (
        <SuenoTab sueno={sueno} />
      )}

      {!loading && tab === "progreso" && (
        <ProgresoTab mediciones={mediciones} historial={historial} />
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
              if (r.ok) { const f = await getSesionesCardio(memberId); if (f.ok) setCardio(f.value); }
            }
            setShowManual(false);
          }}
          onClose={() => setShowManual(false)}
        />
      )}
    </div>
  );
}
