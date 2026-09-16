import { useEffect, useRef, useState } from "react";
import type { EntrenarState } from "../../lib/entrenarState";
import { descansoRestanteMs } from "../../lib/entrenarState";
import { playAlarma, playTic } from "../../lib/audioAlert";

interface Props {
  state:     EntrenarState;
  onSkip:    () => void;
  onAjustar: (delta: number) => void;
}

function fmt(ms: number): string {
  const s   = Math.ceil(ms / 1000);
  const min = Math.floor(s / 60);
  const sec = s % 60;
  return `${min}:${String(sec).padStart(2, "0")}`;
}

export function DescansoTimer({ state, onSkip, onAjustar }: Props) {
  const [remaining, setRemaining] = useState(() => descansoRestanteMs(state));
  const [flashing,  setFlashing]  = useState(false);
  const beeped      = useRef(false);
  const lastTickSec = useRef<number | null>(null);
  const flashTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Se re-ejecuta con cada cambio de `state.descanso` (nuevo descanso o ±30 s).
  // `beeped` vuelve a false, pero la alarma solo suena si la cuenta llega a 0:
  // −30 s se deshabilita con ≤ 30 s y +30 s en estado terminado arranca una
  // cuenta nueva (ajustarDescanso), así que suena una vez por fin de cuenta.
  useEffect(() => {
    if (!state.descanso) return;
    beeped.current      = false;
    lastTickSec.current = null;
    // Sin esto, el primer cuarto de segundo muestra el `remaining` del descanso anterior.
    setRemaining(descansoRestanteMs(state));

    const id = setInterval(() => {
      const rem = descansoRestanteMs(state);
      setRemaining(rem);

      // Tic de cuenta regresiva (últimos 3 s)
      if (rem > 0) {
        const sec = Math.ceil(rem / 1000);
        if (sec <= 3 && sec !== lastTickSec.current) {
          lastTickSec.current = sec;
          playTic();
        }
      }

      if (rem === 0 && !beeped.current) {
        beeped.current = true;
        playAlarma();
        navigator.vibrate?.([200, 100, 200, 100, 400]);
        notify();
        setFlashing(true);
        if (flashTimer.current) clearTimeout(flashTimer.current);
        flashTimer.current = setTimeout(() => setFlashing(false), 1200);
      }
    }, 250);

    return () => {
      clearInterval(id);
      if (flashTimer.current) clearTimeout(flashTimer.current);
    };
  }, [state.descanso]);

  if (!state.descanso) return null;

  const urgent    = remaining <= 5000;
  const terminado = remaining === 0;

  // Sin auto-advance: el descanso nunca avanza solo. "Seguir" y "Saltar" son la
  // misma acción (saltarDescanso), que sella el inicio de la serie al tocarlo.
  return (
    <>
      {flashing && <div className="descanso-flash-overlay" aria-hidden />}
      <div className="descanso-card">
        <span className="descanso-label">Descanso</span>
        <span className={`timer-big${urgent ? " urgent" : ""}`}>
          {fmt(remaining)}
        </span>
        <div className="descanso-actions">
          <button
            className="btn-secondary descanso-ajuste"
            disabled={remaining <= 30_000}
            onClick={() => onAjustar(-30)}
          >
            −30 s
          </button>
          <button className="btn-secondary descanso-ajuste" onClick={() => onAjustar(30)}>
            +30 s
          </button>
          <button
            className={`btn-primary descanso-principal${terminado ? " descanso-seguir" : ""}`}
            onClick={onSkip}
          >
            {terminado ? "Seguir" : "Saltar"}
          </button>
        </div>
      </div>
    </>
  );
}

function notify() {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("¡A entrenar!", { body: "Descanso terminado.", silent: true });
  }
}
