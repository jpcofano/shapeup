import { useState, useEffect, useRef } from "react";

interface Props {
  total:    number;
  hechas:   number;
  activa:   number; // serie que se está por hacer (0-indexed, = hechas)
  onGoTo?:  (serieIdx: number) => void;
}

/** Dots de progreso de series para el modo guiado. */
export function ProgressDots({ total, hechas, activa, onGoTo }: Props) {
  const prevHechasRef = useRef(hechas);
  const [justDone, setJustDone] = useState<number | null>(null);

  useEffect(() => {
    if (hechas > prevHechasRef.current) {
      const idx = prevHechasRef.current;
      setJustDone(idx);
      const id = window.setTimeout(() => setJustDone(null), 400);
      prevHechasRef.current = hechas;
      return () => window.clearTimeout(id);
    }
    prevHechasRef.current = hechas;
  }, [hechas]);

  return (
    <div className="progress-dots">
      {Array.from({ length: total }, (_, i) => {
        const done   = i < hechas;
        const active = i === activa && !done;
        return (
          <span
            key={i}
            className={`dot${done ? " done" : ""}${active ? " active" : ""}${i === justDone ? " just-done" : ""}`}
            onClick={() => onGoTo?.(i)}
            title={`Serie ${i + 1}`}
          />
        );
      })}
    </div>
  );
}
