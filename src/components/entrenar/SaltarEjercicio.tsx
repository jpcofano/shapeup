import { useState } from "react";
import type { MotivoSalto } from "../../types/models";
import { MOTIVOS_SALTO } from "../../lib/entrenarState";

interface Props {
  nombre:     string;
  onSaltar:   (motivo: MotivoSalto | null) => void;
  onCancelar: () => void;
}

/** Hoja para saltear el ejercicio actual, con motivo opcional de selección única (P68b). */
export function SaltarEjercicio({ nombre, onSaltar, onCancelar }: Props) {
  const [motivo, setMotivo] = useState<MotivoSalto | null>(null);

  return (
    <div className="modal-backdrop" onClick={onCancelar}>
      <div
        className="modal-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="saltar-ejercicio-titulo"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="confirmar-body">
          <p id="saltar-ejercicio-titulo" className="confirmar-titulo">Saltar {nombre}</p>
          <p className="confirmar-texto">¿Por qué? Es opcional.</p>
          <div className="paso-carga-chips" style={{ marginBottom: 8 }}>
            {MOTIVOS_SALTO.map(([valor, label]) => (
              <button
                key={valor}
                type="button"
                className={`filter-chip motivo-chip${motivo === valor ? " active" : ""}`}
                aria-pressed={motivo === valor}
                onClick={() => setMotivo(motivo === valor ? null : valor)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="confirmar-acciones">
            <button type="button" className="btn-secondary" onClick={onCancelar}>
              Cancelar
            </button>
            <button type="button" className="btn-primary" onClick={() => onSaltar(motivo)}>
              Saltar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
