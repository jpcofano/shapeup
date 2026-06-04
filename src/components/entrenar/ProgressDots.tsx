interface Props {
  total:    number;
  hechas:   number;
  activa:   number; // serie que se está por hacer (0-indexed, = hechas)
  onGoTo?:  (serieIdx: number) => void;
}

/** Dots de progreso de series para el modo guiado. */
export function ProgressDots({ total, hechas, activa, onGoTo }: Props) {
  return (
    <div className="progress-dots">
      {Array.from({ length: total }, (_, i) => {
        const done   = i < hechas;
        const active = i === activa && !done;
        return (
          <span
            key={i}
            className={`dot${done ? " done" : ""}${active ? " active" : ""}`}
            onClick={() => onGoTo?.(i)}
            title={`Serie ${i + 1}`}
          />
        );
      })}
    </div>
  );
}
