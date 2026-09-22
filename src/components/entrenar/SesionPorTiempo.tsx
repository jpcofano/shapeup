import { useEffect, useState } from "react";

interface Props {
  /** `EntrenarState.inicioMs`: sellado al empezar y persistido (ADR #019). */
  inicioMs: number | null;
  /** Minutos a los que apunta la sesión. Se muestra, no se impone. */
  objetivoMin: number;
  /** El juego que toca, para saber qué se está por jugar. */
  juego: string | null;
  onTerminar: () => void;
  guardando?: boolean;
}

function reloj(seg: number): string {
  const m = Math.floor(seg / 60);
  const s = seg % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * La sesión de VR jugada de corrido (P80, Parte 4).
 *
 * Un reloj grande, el objetivo y **un solo botón**. Sin toques en el medio:
 * con el casco puesto no se ve el teléfono, y pedir que se marque cada ronda
 * era justamente lo que hacía que las cuatro rutinas parecieran incompletas.
 *
 * El reloj **no avisa ni corta** al llegar al objetivo: seguir jugando es
 * tiempo de más, no un error. Pasado el objetivo simplemente lo dice.
 */
export function SesionPorTiempo({ inicioMs, objetivoMin, juego, onTerminar, guardando }: Props) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const seg = inicioMs != null ? Math.max(0, Math.floor((now - inicioMs) / 1000)) : 0;
  const llegó = objetivoMin > 0 && seg >= objetivoMin * 60;

  return (
    <div
      className="card"
      style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        gap: 12, padding: "32px 16px", textAlign: "center",
      }}
    >
      {juego && (
        <p style={{ margin: 0, fontSize: 14, color: "var(--muted)" }}>{juego}</p>
      )}

      <p
        style={{
          margin: 0, fontSize: 72, fontWeight: 700, lineHeight: 1,
          fontVariantNumeric: "tabular-nums",
          color: llegó ? "var(--accent)" : "var(--fg)",
        }}
      >
        {reloj(seg)}
      </p>

      <p style={{ margin: 0, fontSize: 14, color: "var(--muted)" }}>
        {objetivoMin > 0 ? `objetivo ${objetivoMin} min` : "sin objetivo de tiempo"}
        {llegó ? " · cumplido" : ""}
      </p>

      <button
        className="btn-primary"
        style={{ marginTop: 12, minWidth: 180, fontSize: 16, padding: "14px 24px" }}
        onClick={onTerminar}
        disabled={guardando}
      >
        {guardando ? "Guardando…" : "Terminar"}
      </button>
    </div>
  );
}
