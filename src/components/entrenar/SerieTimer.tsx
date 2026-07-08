import { useEffect, useRef, useState } from "react";
import type { EntrenarState } from "../../lib/entrenarState";
import { trabajoRestanteMs } from "../../lib/entrenarState";
import type { Rutina } from "../../types/models";
import { playAlarma, playTic } from "../../lib/audioAlert";

interface Props {
  state:     EntrenarState;
  rutina:    Rutina;
  onAjustar: (deltaSeg: number) => void;
}

function fmt(ms: number): string {
  const s   = Math.ceil(ms / 1000);
  const min = Math.floor(s / 60);
  const sec = s % 60;
  return `${min}:${String(sec).padStart(2, "0")}`;
}

/**
 * Cronómetro de trabajo de la serie en curso — espejo de `DescansoTimer`
 * (Web Audio + Notification + descartar timers vencidos al montar), pero
 * cuenta regresiva de `trabajoRestanteMs` en vez de descanso. El beep NO
 * completa la serie (en VR el visor está puesto; el registro es manual).
 * Se renderiza `null` si el bloque actual no tiene trabajo cronometrable.
 */
export function SerieTimer({ state, rutina, onAjustar }: Props) {
  const [remaining, setRemaining] = useState(() => trabajoRestanteMs(state, rutina) ?? 0);
  const [flashing,  setFlashing]  = useState(false);
  const beeped      = useRef(false);
  const lastTickSec = useRef<number | null>(null);
  const flashTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);

  const inicioMs = state.serieInicioMs[state.bloqueActual];

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (inicioMs == null) return;
    beeped.current      = false;
    lastTickSec.current = null;
    setRemaining(trabajoRestanteMs(state, rutina) ?? 0);

    const id = setInterval(() => {
      const rem = trabajoRestanteMs(state, rutina) ?? 0;
      setRemaining(rem);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inicioMs, state.bloqueActual]);

  const objetivo = trabajoRestanteMs(state, rutina);
  if (objetivo == null) return null;

  const urgent = remaining <= 5000;
  const serieNum = (state.seriesHechas[state.bloqueActual] ?? 0) + 1;

  return (
    <>
      {flashing && <div className="descanso-flash-overlay" aria-hidden />}
      <div className="serie-timer-card">
        <span className="serie-timer-label">Serie {serieNum}</span>
        <span className={`timer-big${urgent ? " urgent" : ""}`}>
          {fmt(remaining)}
        </span>
        <div className="descanso-actions">
          <button className="btn-secondary" style={{ flex: 1 }} onClick={() => onAjustar(30)}>
            +30 s
          </button>
        </div>
      </div>
    </>
  );
}

function notify() {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("¡Tiempo!", { body: "Marcá la serie cuando termines.", silent: true });
  }
}
