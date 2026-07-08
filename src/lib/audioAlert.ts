// Singleton AudioContext para el aviso del timer de descanso.
// Crear un AudioContext sin gesto del usuario suele quedar suspendido en mobile;
// llamar unlockAudio() en el primer pointerdown del usuario lo activa.
let ctx: AudioContext | null = null;

export function unlockAudio(): void {
  try {
    if (!ctx) ctx = new AudioContext();
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
  } catch { /* ignorar si no está disponible */ }
}

function beepOnce(
  audioCtx: AudioContext,
  delaySec: number,
  freq: number,
  durationSec: number,
  volume: number,
): void {
  const osc  = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.type            = "sine";
  osc.frequency.value = freq;
  const t0 = audioCtx.currentTime + delaySec;
  gain.gain.setValueAtTime(volume, t0);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + durationSec);
  osc.start(t0);
  osc.stop(t0 + durationSec);
}

/** Tres beeps fuertes (alarma de fin de descanso). */
export function playAlarma(): void {
  try {
    if (!ctx) ctx = new AudioContext();
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    beepOnce(ctx, 0,    880, 0.35, 0.9);
    beepOnce(ctx, 0.45, 880, 0.35, 0.9);
    beepOnce(ctx, 0.9,  880, 0.35, 0.9);
  } catch { /* AudioContext no disponible */ }
}

/** Tic suave para la cuenta regresiva de los últimos 3 s. */
export function playTic(): void {
  try {
    if (!ctx || ctx.state !== "running") return;
    beepOnce(ctx, 0, 660, 0.08, 0.25);
  } catch { /* ignorar */ }
}
