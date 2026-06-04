import type {
  Prescripcion, PrescripcionFuerza, PrescripcionCardio,
  PrescripcionMovilidad, PrescripcionIsometrico,
} from "../../types/models";
import { parseRango, formatRango } from "../../lib/parseRango";

interface Props {
  prescripcion: Prescripcion;
  onChange: (p: Prescripcion) => void;
}

/** Formulario inline de prescripción; adapta sus campos según la modalidad. */
export function PrescripcionForm({ prescripcion, onChange }: Props) {
  switch (prescripcion.modalidad) {
    case "Fuerza":     return <FuerzaFields    p={prescripcion} onChange={onChange} />;
    case "Cardio":     return <CardioFields    p={prescripcion} onChange={onChange} />;
    case "Movilidad":  return <MovilidadFields p={prescripcion} onChange={onChange} />;
    case "Isométrico": return <IsometricoFields p={prescripcion} onChange={onChange} />;
  }
}

// ── Fuerza ────────────────────────────────────────────────────────────────────
function FuerzaFields({ p, onChange }: { p: PrescripcionFuerza; onChange: (x: Prescripcion) => void }) {
  const up = (patch: Partial<PrescripcionFuerza>) => onChange({ ...p, ...patch });
  return (
    <div className="form-section">
      <div className="form-row-3">
        <Field label="Series">
          <input className="form-input" type="number" min={1} value={p.series}
            onChange={(e) => up({ series: Math.max(1, +e.target.value) })} />
        </Field>
        <Field label="Reps">
          <input className="form-input" type="text" value={formatRango(p.repsObjetivo)} placeholder="8-12"
            onChange={(e) => up({ repsObjetivo: parseRango(e.target.value) })} />
        </Field>
        <Field label="Descanso (s)">
          <input className="form-input" type="number" min={0} step={15} value={p.descansoSeg}
            onChange={(e) => up({ descansoSeg: Math.max(0, +e.target.value) })} />
        </Field>
      </div>
      <div className="form-row">
        <Field label="Carga (kg)">
          <input className="form-input" type="number" min={0} step={0.5}
            value={p.cargaKg ?? ""} placeholder="—"
            onChange={(e) => up({ cargaKg: e.target.value ? +e.target.value : undefined })} />
        </Field>
        <Field label="RIR objetivo">
          <input className="form-input" type="number" min={0} max={5}
            value={p.rirObjetivo ?? ""} placeholder="—"
            onChange={(e) => up({ rirObjetivo: e.target.value ? +e.target.value : undefined })} />
        </Field>
      </div>
    </div>
  );
}

// ── Cardio ────────────────────────────────────────────────────────────────────
function CardioFields({ p, onChange }: { p: PrescripcionCardio; onChange: (x: Prescripcion) => void }) {
  const up = (patch: Partial<PrescripcionCardio>) => onChange({ ...p, ...patch });
  return (
    <div className="form-section">
      <Field label="Formato">
        <select className="form-select" value={p.formato}
          onChange={(e) => up({ formato: e.target.value as "Continuo" | "Intervalos" })}>
          <option value="Continuo">Continuo</option>
          <option value="Intervalos">Intervalos</option>
        </select>
      </Field>
      {p.formato === "Continuo" ? (
        <div className="form-row">
          <Field label="Duración (min)">
            <input className="form-input" type="number" min={1} value={p.duracionMin ?? ""}
              onChange={(e) => up({ duracionMin: e.target.value ? +e.target.value : undefined })} />
          </Field>
          <Field label="Distancia (km)">
            <input className="form-input" type="number" min={0} step={0.1} value={p.distanciaKm ?? ""}
              onChange={(e) => up({ distanciaKm: e.target.value ? +e.target.value : undefined })} />
          </Field>
        </div>
      ) : (
        <div className="form-row-3">
          <Field label="Rondas">
            <input className="form-input" type="number" min={1} value={p.rondas ?? 8}
              onChange={(e) => up({ rondas: +e.target.value })} />
          </Field>
          <Field label="Trabajo (s)">
            <input className="form-input" type="number" min={1} value={p.trabajoSeg ?? 20}
              onChange={(e) => up({ trabajoSeg: +e.target.value })} />
          </Field>
          <Field label="Descanso (s)">
            <input className="form-input" type="number" min={0} value={p.descansoSeg ?? 40}
              onChange={(e) => up({ descansoSeg: +e.target.value })} />
          </Field>
        </div>
      )}
    </div>
  );
}

// ── Movilidad ─────────────────────────────────────────────────────────────────
function MovilidadFields({ p, onChange }: { p: PrescripcionMovilidad; onChange: (x: Prescripcion) => void }) {
  const up = (patch: Partial<PrescripcionMovilidad>) => onChange({ ...p, ...patch });
  return (
    <div className="form-section">
      <div className="form-row-3">
        <Field label="Rondas">
          <input className="form-input" type="number" min={1} value={p.rondas}
            onChange={(e) => up({ rondas: Math.max(1, +e.target.value) })} />
        </Field>
        <Field label="Hold (s)">
          <input className="form-input" type="number" min={1} value={p.duracionHoldSeg ?? 30}
            onChange={(e) => up({ duracionHoldSeg: +e.target.value })} />
        </Field>
        <Field label="Descanso (s)">
          <input className="form-input" type="number" min={0} value={p.descansoSeg}
            onChange={(e) => up({ descansoSeg: +e.target.value })} />
        </Field>
      </div>
      <Checkbox label="Por lado" checked={p.porLado} onChange={(v) => up({ porLado: v })} />
    </div>
  );
}

// ── Isométrico ────────────────────────────────────────────────────────────────
function IsometricoFields({ p, onChange }: { p: PrescripcionIsometrico; onChange: (x: Prescripcion) => void }) {
  const up = (patch: Partial<PrescripcionIsometrico>) => onChange({ ...p, ...patch });
  return (
    <div className="form-section">
      <div className="form-row-3">
        <Field label="Series">
          <input className="form-input" type="number" min={1} value={p.series}
            onChange={(e) => up({ series: Math.max(1, +e.target.value) })} />
        </Field>
        <Field label="Hold (s)">
          <input className="form-input" type="number" min={1} value={p.duracionHoldSeg}
            onChange={(e) => up({ duracionHoldSeg: +e.target.value })} />
        </Field>
        <Field label="Descanso (s)">
          <input className="form-input" type="number" min={0} value={p.descansoSeg}
            onChange={(e) => up({ descansoSeg: +e.target.value })} />
        </Field>
      </div>
      <Checkbox label="Por lado" checked={p.porLado} onChange={(v) => up({ porLado: v })} />
    </div>
  );
}

// ── Helpers de UI ─────────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="form-field">
      <label className="form-label">{label}</label>
      {children}
    </div>
  );
}

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer" }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}
