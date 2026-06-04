import { useEffect, useRef, useState } from "react";
import type { EntrenarState } from "../../lib/entrenarState";
import { descansoRestanteMs } from "../../lib/entrenarState";

interface Props {
  state:          EntrenarState;
  onSkip:         () => void;
  onAjustar:      (delta: number) => void;
}

/** Formatea milisegundos como M:SS. */
function fmt(ms: number): string {
  const s   = Math.ceil(ms / 1000);
  const min = Math.floor(s / 60);
  const sec = s % 60;
  return `${min}:${String(sec).padStart(2, "0")}`;
}

/**
 * Cronómetro de descanso. Usa Web Audio para el beep y la Notification API
 * para avisar cuando termina (mismo patrón que StepTimer.tsx de Comida Familiar).
 * Solo se renderiza cuando state.descanso !== null.
 */
export function DescansoTimer({ state, onSkip, onAjustar }: Props) {
  const [remaining, setRemaining] = useState(() => descansoRestanteMs(state));
  const beeped = useRef(false);

  // Solicitar permiso de notificaciones al montar
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Tick cada 250ms
  useEffect(() => {
    if (!state.descanso) return;
    beeped.current = false;

    const id = setInterval(() => {
      const rem = descansoRestanteMs(state);
      setRemaining(rem);

      if (rem === 0 && !beeped.current) {
        beeped.current = true;
        playBeep();
        notify();
      }
    }, 250);

    return () => clearInterval(id);
  }, [state.descanso]);

  if (!state.descanso) return null;

  const urgent = remaining <= 5000;

  return (
    <div className="descanso-card">
      <span className="descanso-label">Descanso</span>
      <span className={`timer-big${urgent ? " urgent" : ""}`}>
        {fmt(remaining)}
      </span>
      <div className="descanso-actions">
        <button className="btn-secondary" style={{ flex: 1 }} onClick={() => onAjustar(30)}>
          +30 s
        </button>
        <button className="btn-primary" style={{ flex: 1 }} onClick={onSkip}>
          Saltar
        </button>
      </div>
    </div>
  );
}

// ── Web Audio beep ─────────────────────────────────────────────────────────────
function playBeep() {
  try {
    const ctx  = new AudioContext();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type            = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch {
    /* AudioContext bloqueado en algunos contextos — ignorar */
  }
}

// ── Notification ───────────────────────────────────────────────────────────────
function notify() {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("¡A entrenar!", { body: "Descanso terminado.", silent: true });
  }
}
