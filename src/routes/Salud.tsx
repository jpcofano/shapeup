import { useState, useEffect, useRef } from "react";
import { TabBar } from "../components/TabBar";
import { Plus, Upload, X, FileText } from "lucide-react";
import { Sparkline } from "../components/Sparkline";
import type { MedicionCorporal, SesionCardio, RegistroSueno, MetricaSalud, MiembroId } from "../types/models";
import {
  getMediciones, guardarMedicion,
  getSesionesCardio, guardarCardio,
  getRegistrosSueno,
  importarMedicionesIdempotente,
  importarCardioIdempotente,
  importarSueno,
  importarMetricas,
} from "../data/salud";
import {
  detectarTipoCsv, parsearPeso, parsearEjercicio, parsearSueno,
  detectarTiposMetrica, parsearMetricas,
  type SamsungCsvType,
} from "../import/samsungHealth";
import {
  extraerDesdeZip,
  type ZipImportNivel, type ZipExtraccion,
} from "../import/samsungZip";
import { getPerfiles } from "../data/perfiles";
import { getHistorialMiembro } from "../data/historial";
import { enriquecerTrasImport } from "../lib/enriquecerImport";
import { useAuth } from "../auth/useAuth";

type Tab = "composicion" | "cardio" | "sueno" | "progreso";
type ImportMode = "basico" | "completo";

// ── Componente principal ──────────────────────────────────────────────────────

export function Salud() {
  const { memberId } = useAuth();
  const [tab,        setTab]       = useState<Tab>("composicion");
  const [mediciones, setMediciones]= useState<MedicionCorporal[]>([]);
  const [cardio,     setCardio]    = useState<SesionCardio[]>([]);
  const [sueno,      setSueno]     = useState<RegistroSueno[]>([]);
  const [loading,    setLoading]   = useState(true);
  const [error,      setError]     = useState<string | null>(null);
  const [showManual,   setShowManual]   = useState(false);
  const [importMsg,    setImportMsg]    = useState<string | null>(null);
  const [preview,      setPreview]      = useState<PreviewState | null>(null);
  const [importMode,   setImportMode]   = useState<ImportMode>("basico");
  const [zipNivel,     setZipNivel]     = useState<ZipImportNivel>("basico");
  const [zipProgress,  setZipProgress]  = useState<number | null>(null);
  const [zipMsg,       setZipMsg]       = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);
  const zipRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!memberId) return;
    Promise.all([
      getMediciones(memberId),
      getSesionesCardio(memberId),
      getRegistrosSueno(memberId),
    ]).then(([m, c, s]) => {
      if (m.ok) setMediciones(m.value);
      if (c.ok) setCardio(c.value);
      if (s.ok) setSueno(s.value);
      if (!m.ok) setError(m.error);
      setLoading(false);
    });
  }, [memberId]);

  // ── ZIP → extracción selectiva → preview ───────────────────────────────────
  async function handleZip(file: File) {
    if (!memberId) return;
    setZipProgress(0);
    setZipMsg("Abriendo ZIP…");

    const perfRes = await getPerfiles();
    const zonasFC = perfRes.ok ? perfRes.value[memberId as MiembroId]?.zonasFC : undefined;

    const result = await extraerDesdeZip(
      file, memberId as MiembroId, zipNivel, zonasFC,
      (pct, msg) => { setZipProgress(pct); setZipMsg(msg); },
    );
    setZipProgress(null);

    if (result.errors.length > 0 &&
        result.mediciones.length + result.cardio.length + result.sueno.length + result.metricas.length === 0) {
      setImportMsg(result.errors[0]);
      return;
    }

    const total = result.mediciones.length + result.cardio.length + result.sueno.length + result.metricas.length;
    const previewRows = [
      ...result.mediciones.slice(0, 2).map((m) => ({ Tipo: "Peso",   Fecha: m.fecha, Dato: `${m.pesoKg ?? "—"} kg` })),
      ...result.cardio.slice(0, 2).map(   (c) => ({ Tipo: "Cardio", Fecha: c.fecha, Dato: c.actividad })),
      ...result.sueno.slice(0,  2).map(   (s) => ({ Tipo: "Sueño",  Fecha: s.fecha, Dato: `${s.horas ?? "—"} h` })),
    ].slice(0, 5);

    setPreview({
      tipo: "zip" as SamsungCsvType,
      file,
      parsedItems: [
        ...result.mediciones, ...result.cardio, ...result.sueno, ...result.metricas,
      ] as unknown[],
      parsedErrors: result.errors.slice(0, 5),
      previewRows,
      zipData: result,
      zipTotal: total,
    });
  }

  // ── CSV suelto → preview ────────────────────────────────────────────────────
  async function handleFile(file: File) {
    if (!memberId) return;
    const tipo = detectarTipoCsv(file.name);

    // Modo completo: intentar también métricas genéricas
    if (tipo === "unknown" || importMode === "completo") {
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
      if (tipo === "unknown") {
        setImportMsg("No reconocí el archivo. Esperaba weight, exercise, sleep o un CSV de métricas genéricas.");
        return;
      }
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
      const perfRes = await getPerfiles();
      const zonasFC = (perfRes.ok ? perfRes.value[memberId as MiembroId]?.zonasFC : undefined);
      const r = parsearEjercicio(text, memberId, zonasFC);
      parsedItems  = r.items;
      parsedErrors = r.errors;
      previewRows  = r.items.slice(0, 5).map((i) => ({
        Fecha: i.fecha,
        Actividad: i.actividad,
        "Dur (min)": String(i.duracionMin ?? "-"),
        "FC media": String(i.fcPromedio ?? "-"),
        Zona: i.zonaPrincipal ?? "-",
        "kcal": String(i.kcal ?? "-"),
      }));
    } else {
      const r = parsearSueno(text, memberId);
      parsedItems  = r.items;
      parsedErrors = r.errors;
      previewRows  = r.items.slice(0, 5).map((i) => ({
        Fecha: i.fecha,
        "Horas": String(i.horas ?? "-"),
        "Acostarse": i.horaAcostarse ?? "-",
      }));
    }

    setPreview({ tipo, file, parsedItems, parsedErrors, previewRows });
  }

  // ── Confirmar import ────────────────────────────────────────────────────────
  async function confirmarImport() {
    if (!preview || !memberId) return;
    setPreview(null);

    const EMPTY_OK = { ok: true as const, value: { importados: 0, omitidos: 0 } };

    function fmtImportMsg(importados: number, omitidos: number, sufijo = ""): string {
      const base = `✅ ${importados} importados${omitidos > 0 ? ` · ${omitidos} omitidos` : ""}`;
      return sufijo ? `${base} ${sufijo}` : base;
    }

    // Caso ZIP: importar todas las categorías de una
    if (preview.tipo === "zip" && preview.zipData) {
      const z = preview.zipData;
      const [r1, r2, r3, r4] = await Promise.all([
        z.mediciones.length > 0 ? importarMedicionesIdempotente(z.mediciones as Parameters<typeof importarMedicionesIdempotente>[0]) : EMPTY_OK,
        z.cardio.length     > 0 ? importarCardioIdempotente(z.cardio as Parameters<typeof importarCardioIdempotente>[0])             : EMPTY_OK,
        z.sueno.length      > 0 ? importarSueno(z.sueno as Parameters<typeof importarSueno>[0])                                     : EMPTY_OK,
        z.metricas.length   > 0 ? importarMetricas(z.metricas)                                                                       : EMPTY_OK,
      ]);
      const importados = [r1, r2, r3, r4].reduce((s, r) => s + (r.ok ? r.value.importados : 0), 0);
      const omitidos   = [r1, r2, r3, r4].reduce((s, r) => s + (r.ok ? r.value.omitidos   : 0), 0);
      const firstErr   = [r1, r2, r3, r4].find((r) => !r.ok) as { ok: false; error: string } | undefined;

      let msgBase = importados === 0 && firstErr ? `Error: ${firstErr.error}` : fmtImportMsg(importados, omitidos, "desde ZIP");

      // Enriquecimiento biométrico post-import (solo si el ZIP tiene sesiones con timestamps)
      if (z.sesionesSamsung.length > 0) {
        const enrRes = await enriquecerTrasImport(memberId as MiembroId, z);
        if (enrRes.ok) {
          const { matcheadas, porCustomId, porVentana, sinMatch, omitidas } = enrRes.value;
          if (matcheadas > 0 || sinMatch > 0 || omitidas > 0) {
            const partes: string[] = [];
            if (matcheadas > 0) partes.push(`${matcheadas} sesión${matcheadas !== 1 ? "es" : ""} matcheada${matcheadas !== 1 ? "s" : ""} (${porCustomId} por custom-id, ${porVentana} por ventana)`);
            if (sinMatch    > 0) partes.push(`${sinMatch} sin match`);
            if (omitidas    > 0) partes.push(`${omitidas} ya estaban enriquecidas`);
            msgBase += ` · ${partes.join(" · ")}`;
          }
        } else {
          msgBase += ` ⚠ Enriquecimiento: ${enrRes.error}`;
        }
      }

      setImportMsg(msgBase);
      const [fm, fc, fs] = await Promise.all([getMediciones(memberId), getSesionesCardio(memberId), getRegistrosSueno(memberId)]);
      if (fm.ok) setMediciones(fm.value);
      if (fc.ok) setCardio(fc.value);
      if (fs.ok) setSueno(fs.value);
      return;
    }

    // Caso CSV suelto
    let importados = 0, omitidos = 0, errorMsg: string | undefined;

    if (preview.tipo === "weight") {
      const r = await importarMedicionesIdempotente(preview.parsedItems as Parameters<typeof importarMedicionesIdempotente>[0]);
      if (r.ok) { importados = r.value.importados; omitidos = r.value.omitidos; const fresh = await getMediciones(memberId); if (fresh.ok) setMediciones(fresh.value); }
      else errorMsg = r.error;
    } else if (preview.tipo === "exercise") {
      const r = await importarCardioIdempotente(preview.parsedItems as Parameters<typeof importarCardioIdempotente>[0]);
      if (r.ok) { importados = r.value.importados; omitidos = r.value.omitidos; const fresh = await getSesionesCardio(memberId); if (fresh.ok) setCardio(fresh.value); }
      else errorMsg = r.error;
    } else if (preview.tipo === ("metricas" as SamsungCsvType)) {
      const r = await importarMetricas(preview.parsedItems as MetricaSalud[]);
      if (r.ok) { importados = r.value.importados; omitidos = r.value.omitidos; }
      else errorMsg = r.error;
    } else {
      const r = await importarSueno(preview.parsedItems as Parameters<typeof importarSueno>[0]);
      if (r.ok) { importados = r.value.importados; omitidos = r.value.omitidos; const fresh = await getRegistrosSueno(memberId); if (fresh.ok) setSueno(fresh.value); }
      else errorMsg = r.error;
    }

    setImportMsg(errorMsg && importados === 0 ? `Error: ${errorMsg}` : fmtImportMsg(importados, omitidos));
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: "composicion", label: "Composición" },
    { key: "cardio",      label: "Cardio" },
    { key: "sueno",       label: "Sueño" },
    { key: "progreso",    label: "Progreso" },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Salud</h1>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {/* Nivel de importación (aplica al ZIP) */}
          <select
            value={zipNivel}
            onChange={(e) => setZipNivel(e.target.value as ZipImportNivel)}
            style={{ fontSize: 11, background: "var(--card)", color: "var(--muted)", border: "1px solid var(--border)", borderRadius: "var(--r-sm)", padding: "2px 6px", cursor: "pointer" }}
            title="Nivel de importación"
          >
            <option value="basico">Básico</option>
            <option value="completo">Completo</option>
            <option value="biometrico">Con biometría</option>
          </select>

          {/* ZIP (camino principal) */}
          <button className="btn-icon-sm" title="Importar ZIP de Samsung Health (recomendado)" onClick={() => zipRef.current?.click()}>
            <Upload size={18} />
          </button>

          {/* CSV sueltos (fallback) */}
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

        {/* Input ZIP */}
        <input
          ref={zipRef}
          type="file"
          accept=".zip"
          style={{ display: "none" }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleZip(f); e.target.value = ""; }}
        />
        {/* Input CSV suelto */}
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          multiple
          style={{ display: "none" }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
      </div>

      <TabBar tabs={TABS} active={tab} onChange={setTab} size="sm" style={{ marginBottom: 12 }} />

      {/* Progreso de extracción ZIP */}
      {zipProgress !== null && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ height: 6, borderRadius: 999, background: "var(--card-hover)", overflow: "hidden" }}>
            <div style={{
              height: "100%", width: `${zipProgress}%`,
              background: "var(--accent)", borderRadius: 999,
              transition: "width .25s ease",
            }} />
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

      {/* Preview modal */}
      {preview && (
        <ImportPreview
          preview={preview}
          onConfirm={confirmarImport}
          onCancel={() => setPreview(null)}
        />
      )}

      {/* Composición */}
      {!loading && tab === "composicion" && (
        <ComposicionTab mediciones={mediciones} />
      )}

      {/* Cardio */}
      {!loading && tab === "cardio" && (
        <CardioTab cardio={cardio} />
      )}

      {/* Sueño */}
      {!loading && tab === "sueno" && (
        <SuenoTab sueno={sueno} />
      )}

      {/* Progreso */}
      {!loading && tab === "progreso" && memberId && (
        <ProgresoTab mediciones={mediciones} miembro={memberId} />
      )}

      {/* Modal carga manual */}
      {showManual && memberId && (
        <ManualForm
          miembro={memberId}
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

// ── Preview state ─────────────────────────────────────────────────────────────

interface PreviewState {
  tipo:        SamsungCsvType | "zip";
  file:        File;
  parsedItems: unknown[];
  parsedErrors: string[];
  previewRows: Record<string, string>[];
  /** Solo para tipo "zip" — datos ya parseados listos para importar. */
  zipData?:  ZipExtraccion;
  zipTotal?: number;
}

// ── ImportPreview ─────────────────────────────────────────────────────────────

function ImportPreview({ preview, onConfirm, onCancel }: {
  preview: PreviewState;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { tipo, file, parsedItems, parsedErrors, previewRows } = preview;
  const TIPO_LABELS: Record<string, string> = {
    weight: "Peso", exercise: "Ejercicio", sleep: "Sueño", metricas: "Métricas",
    zip: "ZIP Samsung Health",
  };
  const totalItems = (preview as PreviewState & { zipTotal?: number }).zipTotal ?? parsedItems.length;
  const cols = previewRows.length > 0 ? Object.keys(previewRows[0]) : [];

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-sheet" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span>Previsualización — {file.name}</span>
          <button className="modal-close" onClick={onCancel}><X size={16} /></button>
        </div>
        <div style={{ padding: "12px 16px", maxHeight: "65vh", overflowY: "auto" }}>
          <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 8px" }}>
            Tipo: <strong style={{ color: "var(--fg)" }}>{TIPO_LABELS[tipo] ?? tipo}</strong> · {totalItems} registros
            {parsedErrors.length > 0 && ` · ${parsedErrors.length} advertencias`}
          </p>

          {previewRows.length > 0 && (
            <div style={{ overflowX: "auto", marginBottom: 12 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr>
                    {cols.map((c) => (
                      <th key={c} style={{ padding: "4px 8px", textAlign: "left", color: "var(--muted)", fontWeight: 600, borderBottom: "1px solid var(--border)" }}>
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, i) => (
                    <tr key={i}>
                      {cols.map((c) => (
                        <td key={c} style={{ padding: "4px 8px", borderBottom: "1px solid var(--border-dim)" }}>
                          {row[c]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsedItems.length > 5 && (
                <p style={{ fontSize: 11, color: "var(--muted)", margin: "4px 0 0" }}>
                  … y {parsedItems.length - 5} más
                </p>
              )}
            </div>
          )}

          {/* Diagnóstico ZIP: qué archivos se encontraron */}
          {preview.zipData && Object.keys(preview.zipData.csvsPorTipo).length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <p style={{ fontSize: 11, color: "var(--muted)", margin: "0 0 4px", fontWeight: 600 }}>
                Archivos detectados en el ZIP:
              </p>
              {(["weight", "exercise", "sleep"] as const).map((tipo) => {
                const found = preview.zipData!.csvsPorTipo[tipo];
                return (
                  <p key={tipo} style={{ fontSize: 11, margin: "2px 0",
                    color: found ? "var(--fg)" : "var(--danger)" }}>
                    {found ? "✓" : "✗"} {tipo}: {found ?? "no encontrado"}
                  </p>
                );
              })}
              {preview.zipData.csvsLeidos.length > 0 && (
                <p style={{ fontSize: 11, color: "var(--muted)", margin: "4px 0 0" }}>
                  Leídos ({preview.zipData.csvsLeidos.length}): {preview.zipData.csvsLeidos.slice(0, 3).join(", ")}
                  {preview.zipData.csvsLeidos.length > 3 && ` … +${preview.zipData.csvsLeidos.length - 3} más`}
                </p>
              )}
              {preview.zipData.otrosCSVs.length > 0 && (
                <p style={{ fontSize: 11, color: "var(--muted)", margin: "4px 0 0" }}>
                  Otros CSVs en el ZIP: {preview.zipData.otrosCSVs.slice(0, 5).join(", ")}
                  {preview.zipData.otrosCSVs.length > 5 && ` … +${preview.zipData.otrosCSVs.length - 5}`}
                </p>
              )}
            </div>
          )}

          {parsedErrors.slice(0, 3).map((e, i) => (
            <p key={i} style={{ fontSize: 11, color: "var(--warning)", margin: 0 }}>⚠ {e}</p>
          ))}

          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button className="btn-primary" style={{ flex: 1 }} onClick={onConfirm}>
              Importar {totalItems} registros
            </button>
            <button className="btn-secondary" onClick={onCancel}>Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Tab Composición — hero peso + sparkline + Δ tiles ────────────────────────

function DeltaLine({ current, prev, label, invert = false }: {
  current: number; prev: number; label: string; invert?: boolean;
}) {
  const delta = current - prev;
  const mejora = invert ? delta > 0 : delta < 0;
  if (delta === 0) return null;
  return (
    <p style={{ margin: "1px 0 0", fontSize: 12,
      color: mejora ? "var(--accent)" : "var(--danger)" }}>
      {delta > 0 ? "+" : ""}{delta.toFixed(1)} {label} vs anterior
    </p>
  );
}

function ComposicionTab({ mediciones }: { mediciones: MedicionCorporal[] }) {
  if (mediciones.length === 0) {
    return (
      <div className="empty-state">
        <p>Sin datos de composición. Importá un ZIP de Samsung Health o cargá manualmente.</p>
      </div>
    );
  }
  const last = mediciones[0];
  const prev = mediciones[1] ?? null;

  const hace30Str = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);
  const med30 = [...mediciones].filter((m) => m.fecha >= hace30Str && m.pesoKg != null).reverse();
  const sparkData = med30.map((m) => m.pesoKg!);

  function hace(fecha: string): string {
    const diff = Math.floor((Date.now() - new Date(fecha + "T12:00:00").getTime()) / 86_400_000);
    if (diff <= 0) return "hoy";
    if (diff === 1) return "ayer";
    return `hace ${diff} días`;
  }

  return (
    <>
      {/* Hero peso + gráfico 30 días */}
      <div className="card">
        <p className="t-label" style={{ marginBottom: 4 }}>Peso — {hace(last.fecha)}</p>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginBottom: sparkData.length >= 2 ? 10 : 0 }}>
          <p style={{ margin: 0, fontWeight: 800, fontSize: 32, letterSpacing: "-.03em", lineHeight: 1 }}>
            {last.pesoKg ?? "—"} <span style={{ fontSize: 16, fontWeight: 600, color: "var(--muted)" }}>kg</span>
          </p>
          {prev?.pesoKg != null && last.pesoKg != null && (
            <DeltaLine current={last.pesoKg} prev={prev.pesoKg} label="kg" />
          )}
        </div>
        {sparkData.length >= 2 && (
          <>
            <Sparkline data={sparkData} color="var(--accent)" height={52} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
              <span style={{ fontSize: 9, color: "var(--muted)" }}>
                {med30[0].fecha.slice(5)} · {med30[0].pesoKg} kg
              </span>
              <span style={{ fontSize: 9, color: "var(--muted)" }}>
                {med30[med30.length - 1].fecha.slice(5)} · {med30[med30.length - 1].pesoKg} kg
              </span>
            </div>
          </>
        )}
      </div>

      {/* Tiles grasa / músculo / IMC con fecha relativa */}
      <div className="card">
        <p className="section-title" style={{ marginBottom: 10 }}>Composición corporal</p>
        <div className="stats-row" style={{ flexWrap: "wrap", gap: 20, alignItems: "flex-start" }}>
          {last.grasaPct != null && (
            <div>
              <p style={{ margin: 0, fontWeight: 800, fontSize: 20 }}>{last.grasaPct.toFixed(1)}%</p>
              {prev?.grasaPct != null && (
                <DeltaLine current={last.grasaPct} prev={prev.grasaPct} label="%" />
              )}
              <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".05em" }}>grasa</p>
              <p style={{ margin: "1px 0 0", fontSize: 10, color: "var(--muted)" }}>{hace(last.fecha)}</p>
            </div>
          )}
          {last.masaMuscularKg != null && (
            <div>
              <p style={{ margin: 0, fontWeight: 800, fontSize: 20 }}>{last.masaMuscularKg.toFixed(1)} kg</p>
              {prev?.masaMuscularKg != null && (
                <DeltaLine current={last.masaMuscularKg} prev={prev.masaMuscularKg} label="kg" invert />
              )}
              <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".05em" }}>músculo</p>
              <p style={{ margin: "1px 0 0", fontSize: 10, color: "var(--muted)" }}>{hace(last.fecha)}</p>
            </div>
          )}
          {last.imc != null && (
            <div>
              <p style={{ margin: 0, fontWeight: 800, fontSize: 20 }}>{last.imc.toFixed(1)}</p>
              <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".05em" }}>IMC</p>
              <p style={{ margin: "1px 0 0", fontSize: 10, color: "var(--muted)" }}>{hace(last.fecha)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Última medición completa */}
      <div className="card">
        <p className="section-title" style={{ marginBottom: 8 }}>Última medición</p>
        <p style={{ margin: "0 0 8px", fontSize: 12, color: "var(--muted)" }}>{last.fecha} · {hace(last.fecha)}</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px", fontSize: 13 }}>
          {last.pesoKg         != null && <span><span style={{ color: "var(--muted)" }}>Peso </span>{last.pesoKg} kg</span>}
          {last.grasaPct       != null && <span><span style={{ color: "var(--muted)" }}>Grasa </span>{last.grasaPct.toFixed(1)}%</span>}
          {last.masaMuscularKg != null && <span><span style={{ color: "var(--muted)" }}>Músculo </span>{last.masaMuscularKg.toFixed(1)} kg</span>}
          {last.aguaPct        != null && <span><span style={{ color: "var(--muted)" }}>Agua </span>{last.aguaPct.toFixed(1)}%</span>}
        </div>
      </div>

      {/* Historial */}
      <div className="card">
        <p className="section-title" style={{ marginBottom: 10 }}>Historial ({mediciones.length})</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {mediciones.slice(0, 20).map((m) => (
            <div key={m.idMedicion} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ color: "var(--muted)" }}>{m.fecha}</span>
              <span>
                {m.pesoKg         != null && `${m.pesoKg} kg`}
                {m.grasaPct       != null && ` · ${m.grasaPct.toFixed(1)}%`}
                {m.masaMuscularKg != null && ` · ${m.masaMuscularKg.toFixed(1)} kg M`}
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ── Tab Cardio ────────────────────────────────────────────────────────────────

const ZONA_META: { key: string; label: string }[] = [
  { key: "z1", label: "Z1 recuperación" },
  { key: "z2", label: "Z2 suave"        },
  { key: "z3", label: "Z3 aeróbico"     },
  { key: "z4", label: "Z4 umbral"       },
  { key: "z5", label: "Z5 máximo"       },
];

function ZonaChip({ zona }: { zona: string }) {
  const key = zona.toLowerCase();
  return (
    <span style={{
      padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 600,
      background: `var(--zona-${key}-dim)`,
      color:      `var(--zona-${key})`,
    }}>
      {zona}
    </span>
  );
}

function CardioTab({ cardio }: { cardio: SesionCardio[] }) {
  if (cardio.length === 0) {
    return (
      <div className="empty-state">
        <p>Sin sesiones de cardio. Importá un ZIP de Samsung Health.</p>
      </div>
    );
  }

  // Distribución de tiempo por zona FC
  const minPorZona: Record<string, number> = {};
  let totalMin = 0;
  for (const c of cardio) {
    if (!c.zonaPrincipal || !c.duracionMin) continue;
    const k = c.zonaPrincipal.toLowerCase();
    minPorZona[k] = (minPorZona[k] ?? 0) + c.duracionMin;
    totalMin += c.duracionMin;
  }

  return (
    <>
      {/* Distribución por zona */}
      {totalMin > 0 && (
        <div className="card" style={{ marginBottom: 0 }}>
          <p className="section-title" style={{ marginBottom: 8 }}>Distribución por zona</p>
          {/* Barra apilada */}
          <div style={{ display: "flex", height: 10, borderRadius: 999, overflow: "hidden", gap: 1, marginBottom: 10 }}>
            {ZONA_META.map(({ key }) => {
              const pct = totalMin > 0 ? ((minPorZona[key] ?? 0) / totalMin) * 100 : 0;
              if (pct < 1) return null;
              return (
                <div key={key} style={{
                  width: `${pct}%`, height: "100%",
                  background: `var(--zona-${key})`,
                  minWidth: 3,
                }} />
              );
            })}
          </div>
          {/* Leyenda con tiempo */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {ZONA_META.map(({ key, label }) => {
              const min = minPorZona[key] ?? 0;
              if (min === 0) return null;
              return (
                <span key={key} style={{
                  fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 999,
                  background: `var(--zona-${key}-dim)`, color: `var(--zona-${key})`,
                }}>
                  {label} · {Math.round(min / 60)}h
                </span>
              );
            })}
          </div>
        </div>
      )}

    <div className="card">
      {!totalMin && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
          {ZONA_META.map(({ key, label }) => (
            <span key={key} style={{
              fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 999,
              background: `var(--zona-${key}-dim)`, color: `var(--zona-${key})`,
            }}>{label}</span>
          ))}
        </div>
      )}

      <p className="section-title" style={{ marginBottom: 10 }}>Sesiones ({cardio.length})</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {cardio.slice(0, 30).map((c) => (
          <div key={c.idCardio} style={{ fontSize: 13 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <strong style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {c.actividad}
              </strong>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                {c.zonaPrincipal && <ZonaChip zona={c.zonaPrincipal} />}
                <span style={{ color: "var(--muted)", fontSize: 12 }}>{c.fecha}</span>
              </div>
            </div>
            <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 3 }}>
              {c.duracionMin != null && `${c.duracionMin} min`}
              {c.kcal        != null && ` · ${c.kcal} kcal`}
              {c.fcPromedio  != null && ` · FC ~${c.fcPromedio}`}
            </div>
          </div>
        ))}
      </div>
    </div>
    </>
  );
}

// ── Tab Sueño ─────────────────────────────────────────────────────────────────

function SuenoTab({ sueno }: { sueno: RegistroSueno[] }) {
  // Solo registros con duración real (filtra sub-registros de etapas sin horas que hayan quedado de imports anteriores)
  const conHoras = sueno.filter((r) => r.horas != null && r.horas > 0);

  if (conHoras.length === 0) {
    return (
      <div className="empty-state">
        <p>Sin datos de sueño. Importá un ZIP de Samsung Health.</p>
      </div>
    );
  }

  // Promedio últimas 7 noches (solo registros con horas)
  const ultimas7 = conHoras.slice(0, 7);
  const avg = ultimas7.reduce((s, r) => s + r.horas!, 0) / ultimas7.length;

  // Gráfico: máximo de horas por día (las últimas 14 fechas con datos)
  const byDay = new Map<string, number>();
  for (const r of conHoras) {
    byDay.set(r.fecha, Math.max(byDay.get(r.fecha) ?? 0, r.horas!));
  }
  const chartData = Array.from(byDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([fecha, horas]) => ({ label: fecha.slice(5), value: horas }));

  // Sparkline hero (últimas 14 noches en orden cronológico)
  const sparkData = Array.from(byDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([, h]) => h);

  return (
    <>
      <div className="card">
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
          <div>
            <p style={{ margin: 0, fontWeight: 800, fontSize: 32, letterSpacing: "-.03em", lineHeight: 1 }}>
              {conHoras[0].horas!.toFixed(1)} <span style={{ fontSize: 16, fontWeight: 600, color: "var(--muted)" }}>h</span>
            </p>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--muted)" }}>última noche</p>
          </div>
          {sparkData.length >= 2 && (
            <div style={{ flex: 1, maxWidth: 120 }}>
              <Sparkline data={sparkData} color="var(--info)" height={36} />
            </div>
          )}
        </div>
        <div className="stats-row">
          <Stat value={`${avg.toFixed(1)} h`} label="promedio 7 noches" />
          <Stat value={String(conHoras.length)} label="registros" />
        </div>
        {chartData.length > 2 && (
          <div style={{ marginTop: 12 }}>
            <MiniChart data={chartData} color="var(--info)" />
          </div>
        )}
      </div>
      <div className="card">
        <p className="section-title" style={{ marginBottom: 10 }}>Historial ({conHoras.length})</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {conHoras.slice(0, 20).map((s) => (
            <div key={s.idSueno} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ color: "var(--muted)" }}>{s.fecha}</span>
              <span>
                {s.horas != null && `${s.horas.toFixed(1)} h`}
                {s.horaAcostarse && ` · acostó ${s.horaAcostarse}`}
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ── Tab Progreso ──────────────────────────────────────────────────────────────

function ProgresoTab({ mediciones, miembro }: { mediciones: MedicionCorporal[]; miembro: string }) {
  const [tonelaje, setTonelaje] = useState<{ fecha: string; kg: number }[]>([]);

  useEffect(() => {
    getHistorialMiembro(miembro as MiembroId).then((r) => {
      if (!r.ok) return;
      const pts = r.value
        .filter((h) => h.tonelajeKg != null)
        .slice(0, 20)
        .map((h) => ({ fecha: h.fechaRealizada, kg: h.tonelajeKg! }));
      setTonelaje(pts);
    });
  }, [miembro]);

  // Tendencia peso: último vs penúltimo
  const pesoTrend = mediciones.length >= 2
    ? (mediciones[0].pesoKg ?? 0) - (mediciones[1].pesoKg ?? 0)
    : null;
  const grasaTrend = mediciones.length >= 2
    ? (mediciones[0].grasaPct ?? 0) - (mediciones[1].grasaPct ?? 0)
    : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Tendencia composición */}
      <div className="card">
        <p className="section-title" style={{ marginBottom: 10 }}>Tendencia de peso</p>
        {mediciones.length < 2 ? (
          <p style={{ color: "var(--muted)", fontSize: 13 }}>Necesitás al menos 2 registros para ver tendencia.</p>
        ) : (
          <div className="stats-row" style={{ gap: 20 }}>
            <div>
              <p style={{ margin: 0, fontWeight: 700 }}>{mediciones[0].pesoKg ?? "-"} kg</p>
              {pesoTrend !== null && (
                <p style={{ margin: 0, fontSize: 12, color: pesoTrend < 0 ? "var(--accent)" : pesoTrend > 0 ? "var(--danger)" : "var(--muted)" }}>
                  {pesoTrend > 0 ? "+" : ""}{pesoTrend.toFixed(1)} kg vs anterior
                </p>
              )}
              <p style={{ margin: 0, fontSize: 11, color: "var(--muted)" }}>peso</p>
            </div>
            {mediciones[0].grasaPct != null && (
              <div>
                <p style={{ margin: 0, fontWeight: 700 }}>{mediciones[0].grasaPct}%</p>
                {grasaTrend !== null && (
                  <p style={{ margin: 0, fontSize: 12, color: grasaTrend < 0 ? "var(--accent)" : grasaTrend > 0 ? "var(--danger)" : "var(--muted)" }}>
                    {grasaTrend > 0 ? "+" : ""}{grasaTrend.toFixed(1)}% vs anterior
                  </p>
                )}
                <p style={{ margin: 0, fontSize: 11, color: "var(--muted)" }}>grasa</p>
              </div>
            )}
          </div>
        )}
        {mediciones.length > 2 && (
          <div style={{ marginTop: 10 }}>
            <MiniChart
              data={mediciones.slice(0, 12).reverse().map((m) => ({ label: m.fecha.slice(5), value: m.pesoKg ?? 0 }))}
              color="var(--accent)"
            />
          </div>
        )}
      </div>

      {/* Tonelaje de entrenamiento */}
      <div className="card">
        <p className="section-title" style={{ marginBottom: 10 }}>Tonelaje de entrenamiento</p>
        {tonelaje.length === 0 ? (
          <p style={{ color: "var(--muted)", fontSize: 13 }}>Sin historial de sesiones aún.</p>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {tonelaje.slice(0, 8).map((t, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: "var(--muted)" }}>{t.fecha}</span>
                  <span>{t.kg.toLocaleString()} kg</span>
                </div>
              ))}
            </div>
            {tonelaje.length > 3 && (
              <div style={{ marginTop: 10 }}>
                <MiniChart
                  data={tonelaje.slice(0, 10).reverse().map((t) => ({ label: t.fecha.slice(5), value: t.kg }))}
                  color="var(--info)"
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── MiniChart — gráfico de barras SVG simple ─────────────────────────────────

function MiniChart({ data, color }: { data: { label: string; value: number }[]; color: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data.map((d) => d.value));
  if (max === 0) return null;
  const W = 280, H = 60, barW = Math.floor(W / data.length) - 2;

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H + 16}`} style={{ display: "block" }}>
      {data.map((d, i) => {
        const bh = Math.max(2, Math.round((d.value / max) * H));
        const x  = i * (barW + 2);
        return (
          <g key={i}>
            <rect x={x} y={H - bh} width={barW} height={bh} fill={color} opacity={0.7} rx={2} />
            <text x={x + barW / 2} y={H + 12} textAnchor="middle" fontSize={8} fill="var(--muted)">
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Stat chip ─────────────────────────────────────────────────────────────────

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="stat">
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

// ── Formulario de carga manual ────────────────────────────────────────────────

function ManualForm({
  miembro, tab, onSave, onClose,
}: {
  miembro: MiembroId;
  tab: "composicion" | "cardio" | "sueno";
  onSave: (data: unknown, tipo: "composicion" | "cardio" | "sueno") => Promise<void>;
  onClose: () => void;
}) {
  const [fecha,    setFecha]   = useState(new Date().toISOString().split("T")[0]);
  const [peso,     setPeso]    = useState("");
  const [grasa,    setGrasa]   = useState("");
  const [musculo,  setMusculo] = useState("");
  const [actividad,setActividad]=useState("Caminata");
  const [durMin,   setDurMin]  = useState("");
  const [kcal,     setKcal]    = useState("");

  async function handleSave() {
    if (tab === "composicion") {
      await onSave({
        miembro, fecha,
        pesoKg:         peso    ? parseFloat(peso)    : undefined,
        grasaPct:       grasa   ? parseFloat(grasa)   : undefined,
        masaMuscularKg: musculo ? parseFloat(musculo) : undefined,
        fuente: "manual" as const,
      }, "composicion");
    } else if (tab === "cardio") {
      await onSave({
        miembro, fecha, actividad, esVR: false,
        duracionMin: durMin ? parseInt(durMin) : undefined,
        kcal:        kcal   ? parseInt(kcal)   : undefined,
        fuente: "manual" as const,
      }, "cardio");
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span>{tab === "composicion" ? "Nueva medición" : tab === "cardio" ? "Nueva sesión cardio" : "Nuevo registro sueño"}</span>
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-content">
          <div className="form-section">
            <label className="form-label">Fecha</label>
            <input className="form-input" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />

            {tab === "composicion" && (
              <>
                <label className="form-label" style={{ marginTop: 10 }}>Peso (kg)</label>
                <input className="form-input" type="number" step="0.1" value={peso} onChange={(e) => setPeso(e.target.value)} />
                <label className="form-label" style={{ marginTop: 10 }}>Grasa (%)</label>
                <input className="form-input" type="number" step="0.1" value={grasa} onChange={(e) => setGrasa(e.target.value)} />
                <label className="form-label" style={{ marginTop: 10 }}>Músculo (kg)</label>
                <input className="form-input" type="number" step="0.1" value={musculo} onChange={(e) => setMusculo(e.target.value)} />
              </>
            )}
            {tab === "cardio" && (
              <>
                <label className="form-label" style={{ marginTop: 10 }}>Actividad</label>
                <input className="form-input" value={actividad} onChange={(e) => setActividad(e.target.value)} />
                <label className="form-label" style={{ marginTop: 10 }}>Duración (min)</label>
                <input className="form-input" type="number" value={durMin} onChange={(e) => setDurMin(e.target.value)} />
                <label className="form-label" style={{ marginTop: 10 }}>Calorías</label>
                <input className="form-input" type="number" value={kcal} onChange={(e) => setKcal(e.target.value)} />
              </>
            )}

            <button className="btn-primary" style={{ marginTop: 16 }} onClick={handleSave}>Guardar</button>
          </div>
        </div>
      </div>
    </div>
  );
}
