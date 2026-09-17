interface Props {
  onListo: () => void;
}

/** Guardado que no confirmó en 8 s (P69): quedó en el teléfono y se sube solo. */
export function GuardadoPendiente({ onListo }: Props) {
  return (
    <div className="modal-backdrop">
      <div
        className="modal-sheet"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="guardado-pendiente-titulo"
      >
        <div className="confirmar-body">
          <p id="guardado-pendiente-titulo" className="confirmar-titulo">
            Guardado en el teléfono. Se sube cuando haya señal.
          </p>
          <p className="confirmar-texto">
            Mientras tanto vas a ver un aviso en el inicio.
          </p>
          <button type="button" className="btn-primary" style={{ width: "100%" }} onClick={onListo}>
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}
