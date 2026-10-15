// Singleton AudioContext para el aviso del timer de descanso.
// Crear un AudioContext sin gesto del usuario suele quedar suspendido en mobile;
// llamar unlockAudio() en el primer pointerdown del usuario lo activa.
import type { PitidoVR } from "./guiaBloquesVR";

let ctx: AudioContext | null = null;

/**
 * ¿El sonido está trabado hasta el próximo toque? (P102) Al reabrir una sesión
 * sin tocar la pantalla, el contexto se crea sin gesto y el celular lo deja
 * suspendido: los pitidos no sonarían. Sin `AudioContext`, `false`: no hay nada
 * que destrabar.
 */
export function audioSuspendido(): boolean {
  try {
    if (!ctx) ctx = new AudioContext();
    return ctx.state === "suspended";
  } catch {
    return false;
  }
}

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

/** Fin de bloque de VR: dos tonos descendentes. */
export function playFinBloque(): void {
  try {
    if (!ctx) ctx = new AudioContext();
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    beepOnce(ctx, 0,    784, 0.4, 0.8);
    beepOnce(ctx, 0.45, 523, 0.6, 0.8);
  } catch { /* AudioContext no disponible */ }
}

/** Fin de descanso de VR («a jugar»): tres cortos ascendentes. */
export function playFinDescanso(): void {
  try {
    if (!ctx) ctx = new AudioContext();
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    beepOnce(ctx, 0,    523, 0.15, 0.8);
    beepOnce(ctx, 0.2,  659, 0.15, 0.8);
    beepOnce(ctx, 0.4,  988, 0.3,  0.8);
  } catch { /* AudioContext no disponible */ }
}

/** Fin de la sesión de VR: arpegio largo. */
export function playFinSesion(): void {
  try {
    if (!ctx) ctx = new AudioContext();
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    beepOnce(ctx, 0,   523,  0.5, 0.8);
    beepOnce(ctx, 0.3, 659,  0.5, 0.8);
    beepOnce(ctx, 0.6, 784,  0.5, 0.8);
    beepOnce(ctx, 0.9, 1047, 1.2, 0.8);
  } catch { /* AudioContext no disponible */ }
}

/** Despacha el sonido de un cambio de fase de la guía de VR. */
export function playPitidoVR(p: PitidoVR): void {
  if (p === "fin-bloque") playFinBloque();
  else if (p === "fin-descanso") playFinDescanso();
  else playFinSesion();
}

/** Tic suave para la cuenta regresiva de los últimos 3 s. */
export function playTic(): void {
  try {
    if (!ctx || ctx.state !== "running") return;
    beepOnce(ctx, 0, 660, 0.08, 0.25);
  } catch { /* ignorar */ }
}
