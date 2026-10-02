import { useState } from "react";
import type { Ejercicio, EscalonVR, ModoEscaleraVR, PerfilMiembro, Rutina } from "../../types/models";
import { escalonDeHoy, etiquetaDificultad, minutosPrescriptos, modosDe } from "../../lib/escalonesVR";

export interface EscalonElegido {
  modo: ModoEscaleraVR;
  escalon: number;
  idEjercicio: string;
  nombreEjercicio: string;
  prescripto: EscalonVR;
}

interface Props {
  rutina: Rutina;
  perfil: PerfilMiembro | undefined;
  /** La rutina que sigue (Combat corto → Combat largo), para la dificultad. */
  seguida: Rutina | null;
  catalogo: Map<string, Ejercicio>;
  onEmpezar: (e: EscalonElegido) => void;
}

const NOMBRE_MODO: Record<ModoEscaleraVR, string> = { bloques: "Por bloques", corrido: "De corrido" };

/** «2 × 20 min, 2:00 de descanso» o «40 min de corrido». */
export function textoEscalon(e: EscalonVR): string {
  if (e.bloques === 1 && e.descansoSeg === 0) return `${e.minutosBloque} min de corrido`;
  const d = `${Math.floor(e.descansoSeg / 60)}:${String(e.descansoSeg % 60).padStart(2, "0")}`;
  return e.bloques === 1 ? `1 × ${e.minutosBloque} min` : `${e.bloques} × ${e.minutosBloque} min, ${d} de descanso`;
}

/**
 * El arranque de una rutina de VR por escalones (P98): se elige el modo (y el
 * juego, si hay alternativa) y se ve el escalón que toca con sus tiempos. Nada
 * se marca durante la sesión: al tocar «Empezar» arranca el reloj.
 */
export function InicioEscalonVR({ rutina, perfil, seguida, catalogo, onEmpezar }: Props) {
  const vr = rutina.vr!;
  const modos = modosDe(rutina);
  const [modo, setModo] = useState<ModoEscaleraVR>(modos.includes(vr.modoPorDefecto) ? vr.modoPorDefecto : modos[0]);
  const juegos = [vr.idEjercicio, ...(vr.alternativas ?? [])];
  const [juego, setJuego] = useState(vr.idEjercicio);
  const hoy = escalonDeHoy(rutina, modo, perfil, seguida);
  if (!hoy) return null;
  const ej = catalogo.get(juego);
  const nombre = (id: string) => catalogo.get(id)?.nombre ?? (id === vr.idEjercicio ? rutina.bloques[0]?.nombreEjercicio : id) ?? id;

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {modos.length > 1 && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: "var(--muted)" }}>¿Cómo la jugás?</span>
          {modos.map((m) => (
            <button key={m} className={modo === m ? "btn-primary" : "btn-secondary"} style={{ fontSize: 13 }}
              onClick={() => setModo(m)}>
              {NOMBRE_MODO[m]}
            </button>
          ))}
        </div>
      )}
      {juegos.length > 1 && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: "var(--muted)" }}>Juego</span>
          {juegos.map((id) => (
            <button key={id} className={juego === id ? "btn-primary" : "btn-secondary"} style={{ fontSize: 13 }}
              onClick={() => setJuego(id)}>
              {nombre(id)}
            </button>
          ))}
        </div>
      )}
      <div>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>
          {hoy.tope > 1 ? `Escalón ${hoy.numero} de ${hoy.tope}` : "Sin escalera"} · {NOMBRE_MODO[modo]}
        </p>
        <p style={{ margin: "4px 0 0", fontSize: 14 }}>
          {textoEscalon(hoy.escalon)} · {etiquetaDificultad(hoy.escalon.dificultad, ej?.dificultadesVR)}
        </p>
        <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--muted)" }}>
          {Math.round(minutosPrescriptos(hoy.escalon))} min en total · objetivo {vr.zonasObjetivo.join("-")}.
          Encadená los entrenamientos del juego que hagan falta; no hay que marcar nada.
        </p>
      </div>
      <button
        className="btn-primary"
        onClick={() => onEmpezar({
          modo, escalon: hoy.numero, idEjercicio: juego, nombreEjercicio: nombre(juego),
          prescripto: hoy.escalon,
        })}
      >
        Empezar
      </button>
    </div>
  );
}
