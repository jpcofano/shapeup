import { useEffect, useState } from "react";

interface Props {
  startMs:     number;
  estimadoMin: number | null;
}

/** Reloj de sesión transcurrida (desde el primer `serieInicioMs`) + estimado de la rutina. */
export function TiempoTotal({ startMs, estimadoMin }: Props) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const elapsedSec = Math.max(0, Math.floor((now - startMs) / 1000));
  const h = Math.floor(elapsedSec / 3600);
  const m = Math.floor((elapsedSec % 3600) / 60);
  const s = elapsedSec % 60;
  const label = h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${m}:${String(s).padStart(2, "0")}`;

  return (
    <span className="workout-timer-total">
      {label}{estimadoMin != null ? ` · estimado: ${estimadoMin} min` : ""}
    </span>
  );
}
