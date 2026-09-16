interface Props {
  series:      number;
  onConfirmar: () => void;
  onCancelar:  () => void;
}

/** Confirmación antes de reiniciar una sesión con series registradas (P67). */
export function ConfirmarReinicio({ series, onConfirmar, onCancelar }: Props) {
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
            Se borran {series} {series === 1 ? "serie registrada" : "series registradas"}.
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
