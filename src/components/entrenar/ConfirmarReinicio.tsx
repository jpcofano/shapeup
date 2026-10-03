import { textoMinutosDescartados } from "../../lib/entrenarState";

interface Props {
  series:      number;
  onConfirmar: () => void;
  onCancelar:  () => void;
  /** Minutos jugados en VR por escalones (P99): con más de 0, se cuentan minutos, no series. */
  minutosJugados?: number;
}

/** Confirmación antes de reiniciar una sesión con series registradas (P67) o minutos de VR jugados (P99). */
export function ConfirmarReinicio({ series, onConfirmar, onCancelar, minutosJugados = 0 }: Props) {
  return (
    <div className="modal-backdrop" onClick={onCancelar}>
      <div
        className="modal-sheet"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirmar-reinicio-titulo"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="confirmar-body">
          <p id="confirmar-reinicio-titulo" className="confirmar-titulo">¿Reiniciar la sesión?</p>
          <p className="confirmar-texto">
            {minutosJugados > 0
              ? textoMinutosDescartados(minutosJugados)
              : `Se borran ${series} ${series === 1 ? "serie registrada" : "series registradas"}.`}
          </p>
          <div className="confirmar-acciones">
            <button type="button" className="btn-secondary" onClick={onCancelar}>
              Cancelar
            </button>
            <button type="button" className="btn-danger" onClick={onConfirmar}>
              Reiniciar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
