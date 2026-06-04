import { ChevronDown, ChevronUp, ArrowUp, ArrowDown, Trash2 } from "lucide-react";
import { useState } from "react";
import type { BloqueEjercicio, Prescripcion } from "../../types/models";
import { PrescripcionForm } from "./PrescripcionForm";
import { prescripcionLabel } from "../../lib/prescripcionLabel";

interface Props {
  bloque:    BloqueEjercicio;
  index:     number;
  total:     number;
  onUpdate:  (b: BloqueEjercicio) => void;
  onMoveUp:  () => void;
  onMoveDown:() => void;
  onDelete:  () => void;
}

/** Fila de bloque en el formulario de rutina (expandible para editar prescripción). */
export function BloqueFormItem({ bloque, index, total, onUpdate, onMoveUp, onMoveDown, onDelete }: Props) {
  const [expanded, setExpanded] = useState(false);

  function handlePrescripcion(p: Prescripcion) {
    onUpdate({ ...bloque, prescripcion: p });
  }

  return (
    <div className="bloque-form-item">
      <div className="bloque-form-header">
        <span className="bloque-num">{index + 1}</span>

        <div className="bloque-form-name" title={bloque.nombreEjercicio}>
          {bloque.nombreEjercicio}
        </div>

        <div className="bloque-form-actions">
          <button className="btn-icon-sm" onClick={onMoveUp}   disabled={index === 0}   title="Subir"><ArrowUp   size={14} /></button>
          <button className="btn-icon-sm" onClick={onMoveDown} disabled={index === total - 1} title="Bajar"><ArrowDown size={14} /></button>
          <button className="btn-icon-sm danger" onClick={onDelete} title="Eliminar"><Trash2 size={14} /></button>
          <button className="btn-icon-sm" onClick={() => setExpanded((v) => !v)} title="Prescripción">
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {!expanded && (
        <div style={{ padding: "0 12px 10px", fontSize: 12, color: "var(--muted)" }}>
          {prescripcionLabel(bloque.prescripcion)}
        </div>
      )}

      {expanded && (
        <div className="bloque-form-presc">
          <PrescripcionForm prescripcion={bloque.prescripcion} onChange={handlePrescripcion} />
        </div>
      )}
    </div>
  );
}
