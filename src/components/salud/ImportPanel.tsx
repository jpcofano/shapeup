import { useState } from "react";
import { X } from "lucide-react";
import type { MiembroId } from "../../types/models";
import type { SamsungCsvType } from "../../import/samsungHealth";
import type { ZipExtraccion } from "../../import/samsungZip";
import type { FiltroCardio } from "../../lib/importSelectivo";
import type { CardioInput } from "../../data/salud";

// ── Tipos compartidos ─────────────────────────────────────────────────────────

export type CardioEx = CardioInput & { _startMs?: number; _endMs?: number; _customId?: string };

export interface PreviewState {
  tipo:         SamsungCsvType | "zip";
  file:         File;
  parsedItems:  unknown[];
  parsedErrors: string[];
  previewRows:  Record<string, string>[];
  zipData?:     ZipExtraccion;
  zipTotal?:    number;
  filtroCardio?: FiltroCardio<CardioEx>;
}

// ── ImportPreview ─────────────────────────────────────────────────────────────

export function ImportPreview({
  preview, importarTodoCardio, onToggleCardio, onConfirm, onCancel,
}: {
  preview: PreviewState;
  importarTodoCardio: boolean;
  onToggleCardio: (v: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { tipo, file, parsedItems, parsedErrors, previewRows } = preview;
  const TIPO_LABELS: Record<string, string> = {
    weight: "Peso", exercise: "Ejercicio", sleep: "Sueño", metricas: "Métricas",
    zip: "ZIP Samsung Health",
  };
  const totalItems = preview.zipTotal ?? parsedItems.length;
  const cols = previewRows.length > 0 ? Object.keys(previewRows[0]) : [];
  const f = preview.filtroCardio;
  const cardioTotal     = f ? f.relevantes.length + f.descartadas.length : 0;
  const cardioRelevantes = f?.relevantes.length ?? 0;

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

          {preview.zipData && Object.keys(preview.zipData.csvsPorTipo).length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <p style={{ fontSize: 11, color: "var(--muted)", margin: "0 0 4px", fontWeight: 600 }}>
                Archivos detectados en el ZIP:
              </p>
              {(["weight", "exercise", "sleep"] as const).map((t) => {
                const found = preview.zipData!.csvsPorTipo[t];
                return (
                  <p key={t} style={{ fontSize: 11, margin: "2px 0", color: found ? "var(--fg)" : "var(--danger)" }}>
                    {found ? "✓" : "✗"} {t}: {found ?? "no encontrado"}
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
                  Otros CSVs: {preview.zipData.otrosCSVs.slice(0, 5).join(", ")}
                  {preview.zipData.otrosCSVs.length > 5 && ` … +${preview.zipData.otrosCSVs.length - 5}`}
                </p>
              )}
            </div>
          )}

          {parsedErrors.slice(0, 3).map((e, i) => (
            <p key={i} style={{ fontSize: 11, color: "var(--warning)", margin: 0 }}>⚠ {e}</p>
          ))}

          {f && cardioTotal > 0 && (
            <div style={{ marginTop: 10, padding: "8px 10px", borderRadius: "var(--r-sm)", background: "var(--card)", border: "1px solid var(--border)" }}>
              <p style={{ margin: "0 0 4px", fontSize: 12, color: "var(--fg)" }}>
                <strong>Cardio:</strong>{" "}
                {importarTodoCardio
                  ? <>{cardioTotal} <span style={{ color: "var(--muted)" }}>(todos del export)</span></>
                  : <>{cardioRelevantes > 0 ? <strong>{cardioRelevantes} relevantes</strong> : "0 relevantes"}{" de "}{cardioTotal} en el export
                    {f.relevantes.length > 0 && (
                      <span style={{ color: "var(--muted)", fontSize: 11 }}>
                        {" "}({[
                          f.relevantes.filter((r) => r._motivo === "shapeup").length   > 0 && `${f.relevantes.filter((r) => r._motivo === "shapeup").length} ShapeUp`,
                          f.relevantes.filter((r) => r._motivo === "historial").length > 0 && `${f.relevantes.filter((r) => r._motivo === "historial").length} matchean tu historial`,
                          f.relevantes.filter((r) => r._motivo === "vr").length        > 0 && `${f.relevantes.filter((r) => r._motivo === "vr").length} VR`,
                          f.relevantes.filter((r) => r._motivo === "actividad").length > 0 && `${f.relevantes.filter((r) => r._motivo === "actividad").length} por actividad`,
                        ].filter(Boolean).join(", ")})
                      </span>
                    )}
                    {f.descartadas.length > 0 && <span style={{ color: "var(--muted)" }}> · {f.descartadas.length} se omiten</span>}
                  </>
                }
              </p>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, cursor: "pointer", color: "var(--muted)" }}>
                <input
                  type="checkbox"
                  checked={importarTodoCardio}
                  onChange={(e) => onToggleCardio(e.target.checked)}
                  style={{ cursor: "pointer" }}
                />
                Importar todo el cardio ({cardioTotal})
              </label>
            </div>
          )}

          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button className="btn-primary" style={{ flex: 1 }} onClick={onConfirm}>
              Importar {importarTodoCardio || !f ? totalItems : (totalItems - f.descartadas.length)} registros
            </button>
            <button className="btn-secondary" onClick={onCancel}>Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── ManualForm ────────────────────────────────────────────────────────────────

export function ManualForm({
  miembro, tab, onSave, onClose,
}: {
  miembro: MiembroId;
  tab: "composicion" | "cardio" | "sueno";
  onSave: (data: unknown, tipo: "composicion" | "cardio" | "sueno") => Promise<void>;
  onClose: () => void;
}) {
  const [fecha,    setFecha]    = useState(new Date().toISOString().split("T")[0]);
  const [peso,     setPeso]     = useState("");
  const [grasa,    setGrasa]    = useState("");
  const [musculo,  setMusculo]  = useState("");
  const [actividad,setActividad]= useState("Caminata");
  const [durMin,   setDurMin]   = useState("");
  const [kcal,     setKcal]     = useState("");

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
