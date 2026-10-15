import { useEffect, useRef, useState } from "react";
import type { EscalonVR } from "../../types/models";
import { guiaBloquesVR, lineasGuiaVR, pitidoDeTransicion, type GuiaBloquesVR } from "../../lib/guiaBloquesVR";
import { audioSuspendido, playPitidoVR, unlockAudio } from "../../lib/audioAlert";

interface Props {
  /** `EntrenarState.inicioMs`: sellado al empezar y persistido (ADR #019). */
  inicioMs: number | null;
  /** Minutos a los que apunta la sesión. Se muestra, no se impone. */
  objetivoMin: number;
  /** El juego que toca, para saber qué se está por jugar. */
  juego: string | null;
  onTerminar: () => void;
  guardando?: boolean;
  /**
   * La prescripción sellada de una rutina de VR por escalones (P102): con ella,
   * el reloj guía los bloques y los descansos, con sus horas y sus pitidos.
   */
  prescripto?: EscalonVR;
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
 *
 * **La guía de bloques (P102).** En las rutinas por escalones, debajo del reloj
 * total, en qué bloque estás o cuánto queda de descanso, con la hora en que
 * termina, y la hora de fin prevista. Sale solo del tiempo transcurrido y de la
 * prescripción sellada: no se marca nada (ADR #040 y #046). Cada cambio suena,
 * pero solo los que pasan con la pantalla montada: al reabrir no se disparan
 * los que ya pasaron.
 */
export function SesionPorTiempo({ inicioMs, objetivoMin, juego, onTerminar, guardando, prescripto }: Props) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Sonido trabado al reabrir (P102): se avisa hasta el primer toque. Si se
  // destraba solo (el toque de «Empezar» lo reanuda un instante después), el
  // aviso se va en el siguiente segundo.
  const [avisoAudio, setAvisoAudio] = useState(() => !!prescripto && audioSuspendido());
  useEffect(() => {
    if (!avisoAudio) return;
    const alTocar = () => { unlockAudio(); setAvisoAudio(false); };
    window.addEventListener("pointerdown", alTocar, { once: true });
    return () => window.removeEventListener("pointerdown", alTocar);
  }, [avisoAudio]);
  useEffect(() => {
    if (avisoAudio && !audioSuspendido()) setAvisoAudio(false);
  }, [now, avisoAudio]);

  const seg = inicioMs != null ? Math.max(0, Math.floor((now - inicioMs) / 1000)) : 0;
  const llegó = objetivoMin > 0 && seg >= objetivoMin * 60;

  const guia = prescripto && inicioMs != null ? guiaBloquesVR(prescripto, inicioMs, now) : null;
  const lineas = guia ? lineasGuiaVR(guia) : null;

  // Pitidos: la primera observación no suena (pitidoDeTransicion con null).
  const anterior = useRef<GuiaBloquesVR | null>(null);
  useEffect(() => {
    if (!guia) return;
    const p = pitidoDeTransicion(anterior.current, guia);
    anterior.current = guia;
    if (p) playPitidoVR(p);
  }, [guia?.fase, guia?.bloque]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      className="card"
      style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        gap: 12, padding: "32px 16px", textAlign: "center",
      }}
    >
      {avisoAudio && (
        <p role="status" style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--accent)" }}>
          Tocá la pantalla para activar el sonido
        </p>
      )}

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

      {lineas ? (
        <>
          {lineas.principal && (
            <p
              data-testid="guia-fase"
              style={{
                margin: 0, fontSize: 17, fontWeight: 600, fontVariantNumeric: "tabular-nums",
                color: guia?.fase === "descanso" ? "var(--accent)" : "var(--fg)",
              }}
            >
              {lineas.principal}
            </p>
          )}
          <p
            data-testid="guia-fin"
            style={{
              margin: 0, fontSize: 14, fontVariantNumeric: "tabular-nums",
              color: guia?.fase === "terminado" ? "var(--accent)" : "var(--muted)",
            }}
          >
            {lineas.fin}
          </p>
        </>
      ) : (
        <p style={{ margin: 0, fontSize: 14, color: "var(--muted)" }}>
          {objetivoMin > 0 ? `objetivo ${objetivoMin} min` : "sin objetivo de tiempo"}
          {llegó ? " · cumplido" : ""}
        </p>
      )}

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
