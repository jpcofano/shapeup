import { useState, useEffect, useRef } from "react";
import { Plus, Upload } from "lucide-react";
import type { MedicionCorporal, SesionCardio, MiembroId } from "../types/models";
import {
  getMediciones, guardarMedicion, eliminarMedicion,
  getSesionesCardio, guardarCardio, importarMediciones, importarCardio,
} from "../data/salud";
import { parsearPesoCSV, parsearEjercicioCSV } from "../lib/parsearCSV";
import { useAuth } from "../auth/useAuth";

type Tab = "peso" | "cardio";

export function Salud() {
  const { memberId } = useAuth();
  const [tab,         setTab]        = useState<Tab>("peso");
  const [mediciones,  setMediciones] = useState<MedicionCorporal[]>([]);
  const [cardio,      setCardio]     = useState<SesionCardio[]>([]);
  const [loading,     setLoading]    = useState(true);
  const [error,       setError]      = useState<string | null>(null);
  const [showManual,  setShowManual] = useState(false);
  const [importMsg,   setImportMsg]  = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!memberId) return;
    Promise.all([
      getMediciones(memberId),
      getSesionesCardio(memberId),
    ]).then(([m, c]) => {
      if (m.ok) setMediciones(m.value);
      if (c.ok) setCardio(c.value);
      if (!m.ok || !c.ok) setError((!m.ok ? m.error : "") + (!c.ok ? c.error : ""));
      setLoading(false);
    });
  }, [memberId]);

  // ── Import CSV ──────────────────────────────────────────────────────────────
  async function handleCSV(file: File) {
    if (!memberId) return;
    const text = await file.text();
    const name = file.name.toLowerCase();

    if (name.includes("body_weight") || name.includes("peso")) {
      const { items, errors } = parsearPesoCSV(text, memberId);
      if (errors.length) setError(`Advertencias: ${errors.slice(0, 3).join("; ")}`);
      const r = await importarMediciones(items);
      setImportMsg(r.ok ? `✅ ${r.value} mediciones importadas` : `Error: ${r.error}`);
      if (r.ok) {
        const fresh = await getMediciones(memberId);
        if (fresh.ok) setMediciones(fresh.value);
      }
    } else if (name.includes("exercise") || name.includes("cardio")) {
      const { items, errors } = parsearEjercicioCSV(text, memberId);
      if (errors.length) setError(`Advertencias: ${errors.slice(0, 3).join("; ")}`);
      const r = await importarCardio(items);
      setImportMsg(r.ok ? `✅ ${r.value} sesiones importadas` : `Error: ${r.error}`);
      if (r.ok) {
        const fresh = await getSesionesCardio(memberId);
        if (fresh.ok) setCardio(fresh.value);
      }
    } else {
      setImportMsg("No reconocí el tipo de archivo. Esperaba 'body_weight' o 'exercise' en el nombre.");
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Salud</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-icon-sm" title="Importar CSV" onClick={() => fileRef.current?.click()}>
            <Upload size={18} />
          </button>
          <button className="btn-icon-sm" title="Carga manual" onClick={() => setShowManual(true)}>
            <Plus size={18} />
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          style={{ display: "none" }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCSV(f); }}
        />
      </div>

      {/* Tabs */}
      <div className="filter-scroll">
        <button className={`filter-chip${tab === "peso"   ? " active" : ""}`} onClick={() => setTab("peso")}>
          Composición
        </button>
        <button className={`filter-chip${tab === "cardio" ? " active" : ""}`} onClick={() => setTab("cardio")}>
          Cardio
        </button>
      </div>

      {importMsg && (
        <div className={`banner ${importMsg.startsWith("✅") ? "banner-green" : "banner-amber"}`}>
          {importMsg}
        </div>
      )}
      {error && <p className="inline-error">{error}</p>}
      {loading && <div className="empty-state"><div className="spinner" /></div>}

      {/* ── Pestaña Composición ─────────────────────────────────────────── */}
      {!loading && tab === "peso" && (
        <>
          {mediciones.length === 0 && (
            <div className="empty-state">
              <p>Sin datos de composición. Importá un CSV de Samsung Health o cargá manualmente.</p>
            </div>
          )}
          {mediciones.length > 0 && (
            <>
              {/* Últimos valores */}
              {(() => {
                const last = mediciones[mediciones.length - 1];
                return (
                  <div className="card">
                    <p className="section-title" style={{ marginBottom: 10 }}>Último registro — {last.fecha}</p>
                    <div className="stats-row" style={{ flexWrap: "wrap", gap: 16 }}>
                      {last.pesoKg != null && (
                        <div className="stat"><span className="stat-value">{last.pesoKg}</span><span className="stat-label">kg peso</span></div>
                      )}
                      {last.grasaPct != null && (
                        <div className="stat"><span className="stat-value">{last.grasaPct}%</span><span className="stat-label">grasa</span></div>
                      )}
                      {last.masaMuscularKg != null && (
                        <div className="stat"><span className="stat-value">{last.masaMuscularKg}</span><span className="stat-label">kg músculo</span></div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Tabla simple */}
              <div className="card">
                <p className="section-title" style={{ marginBottom: 10 }}>Historial ({mediciones.length})</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[...mediciones].reverse().slice(0, 20).map((m) => (
                    <div key={m.idMedicion} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                      <span style={{ color: "var(--muted)" }}>{m.fecha}</span>
                      <span>
                        {m.pesoKg != null && `${m.pesoKg} kg`}
                        {m.grasaPct != null && ` · ${m.grasaPct}% grasa`}
                        {m.masaMuscularKg != null && ` · ${m.masaMuscularKg} kg músculo`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* ── Pestaña Cardio ──────────────────────────────────────────────── */}
      {!loading && tab === "cardio" && (
        <>
          {cardio.length === 0 && (
            <div className="empty-state">
              <p>Sin sesiones de cardio. Importá un CSV de ejercicio de Samsung Health.</p>
            </div>
          )}
          {cardio.length > 0 && (
            <div className="card">
              <p className="section-title" style={{ marginBottom: 10 }}>Sesiones ({cardio.length})</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[...cardio].reverse().slice(0, 30).map((c) => (
                  <div key={c.idCardio} className="bloque-row">
                    <div className="bloque-info">
                      <p className="bloque-nombre">{c.actividad}</p>
                      <p className="bloque-prescripcion">
                        {c.fecha}
                        {c.duracionMin != null && ` · ${c.duracionMin} min`}
                        {c.kcal        != null && ` · ${c.kcal} kcal`}
                        {c.fcPromedio  != null && ` · FC ~${c.fcPromedio}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Modal carga manual ──────────────────────────────────────────── */}
      {showManual && memberId && (
        <ManualForm
          miembro={memberId}
          tab={tab}
          onSave={async (data) => {
            if (tab === "peso") {
              const r = await guardarMedicion(data as Parameters<typeof guardarMedicion>[0]);
              if (r.ok) {
                const fresh = await getMediciones(memberId);
                if (fresh.ok) setMediciones(fresh.value);
              }
            } else {
              const r = await guardarCardio(data as Parameters<typeof guardarCardio>[0]);
              if (r.ok) {
                const fresh = await getSesionesCardio(memberId);
                if (fresh.ok) setCardio(fresh.value);
              }
            }
            setShowManual(false);
          }}
          onClose={() => setShowManual(false)}
        />
      )}
    </div>
  );
}

// ── Formulario de carga manual ────────────────────────────────────────────────
function ManualForm({
  miembro, tab, onSave, onClose,
}: {
  miembro: MiembroId;
  tab: Tab;
  onSave: (data: unknown) => Promise<void>;
  onClose: () => void;
}) {
  const [fecha,  setFecha]  = useState(new Date().toISOString().split("T")[0]);
  const [peso,   setPeso]   = useState("");
  const [grasa,  setGrasa]  = useState("");
  const [musculo,setMusculo]= useState("");
  const [actividad, setActividad] = useState("Caminata");
  const [durMin, setDurMin] = useState("");
  const [kcal,   setKcal]   = useState("");

  async function handleSave() {
    if (tab === "peso") {
      await onSave({
        miembro, fecha,
        pesoKg:         peso   ? parseFloat(peso)   : undefined,
        grasaPct:       grasa  ? parseFloat(grasa)  : undefined,
        masaMuscularKg: musculo? parseFloat(musculo): undefined,
        fuente: "manual" as const,
      });
    } else {
      await onSave({
        miembro, fecha, actividad, esVR: false,
        duracionMin: durMin ? parseInt(durMin) : undefined,
        kcal:        kcal   ? parseInt(kcal)   : undefined,
        fuente: "manual" as const,
      });
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span>{tab === "peso" ? "Nueva medición" : "Nueva sesión cardio"}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-content">
          <div className="form-section">
            <div className="form-field">
              <label className="form-label">Fecha</label>
              <input className="form-input" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </div>

            {tab === "peso" ? (
              <>
                <div className="form-row">
                  <div className="form-field">
                    <label className="form-label">Peso (kg)</label>
                    <input className="form-input" type="number" step="0.1" value={peso} onChange={(e) => setPeso(e.target.value)} />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Grasa (%)</label>
                    <input className="form-input" type="number" step="0.1" value={grasa} onChange={(e) => setGrasa(e.target.value)} />
                  </div>
                </div>
                <div className="form-field">
                  <label className="form-label">Músculo (kg)</label>
                  <input className="form-input" type="number" step="0.1" value={musculo} onChange={(e) => setMusculo(e.target.value)} />
                </div>
              </>
            ) : (
              <>
                <div className="form-field">
                  <label className="form-label">Actividad</label>
                  <input className="form-input" type="text" value={actividad} onChange={(e) => setActividad(e.target.value)} />
                </div>
                <div className="form-row">
                  <div className="form-field">
                    <label className="form-label">Duración (min)</label>
                    <input className="form-input" type="number" value={durMin} onChange={(e) => setDurMin(e.target.value)} />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Calorías</label>
                    <input className="form-input" type="number" value={kcal} onChange={(e) => setKcal(e.target.value)} />
                  </div>
                </div>
              </>
            )}

            <button className="btn-primary" onClick={handleSave}>Guardar</button>
          </div>
        </div>
      </div>
    </div>
  );
}
