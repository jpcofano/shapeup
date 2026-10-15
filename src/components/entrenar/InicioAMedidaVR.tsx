import { useEffect, useState } from "react";
import { Minus, Plus } from "lucide-react";
import type { Ejercicio, EscalonVR, Historial, PerfilMiembro, RangoVR, Rutina } from "../../types/models";
import { etiquetaDificultad, minutosPrescriptos } from "../../lib/escalonesVR";
import {
  juegosAMedida, moverEnRango, prescriptoAMedida, puedeMover, valoresInicialesAMedida,
} from "../../lib/vrAMedida";
import { FinSiEmpezas, textoEscalon, type EscalonElegido } from "./InicioEscalonVR";

interface Props {
  rutina: Rutina;
  perfil: PerfilMiembro | undefined;
  /** Combat largo (`vr.sigueA`): el respaldo con Les Mills. */
  seguida: Rutina | null;
  catalogo: Map<string, Ejercicio>;
  /** El historial del miembro: la última configuración con cada juego. `null` mientras carga. */
  historial: Historial[] | null;
  onEmpezar: (e: EscalonElegido) => void;
}

/** Cuánto se espera el historial antes de quedarse con el respaldo (P102). */
export const ESPERA_HISTORIAL_MS = 3000;

const mmss = (seg: number) => `${Math.floor(seg / 60)}:${String(seg % 60).padStart(2, "0")}`;

function Control({ etiqueta, valor, texto, rango, onCambiar, deshabilitado }: {
  etiqueta: string; valor: number; texto: string; rango: RangoVR;
  onCambiar: (v: number) => void; deshabilitado?: boolean;
}) {
  const boton = (dir: 1 | -1) => (
    <button
      type="button"
      className="btn-secondary"
      aria-label={`${dir === 1 ? "Más" : "Menos"} ${etiqueta.toLowerCase()}`}
      disabled={deshabilitado || !puedeMover(valor, rango, dir)}
      onClick={() => onCambiar(moverEnRango(valor, rango, dir))}
      style={{ width: 52, height: 52, padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      {dir === 1 ? <Plus size={22} /> : <Minus size={22} />}
    </button>
  );
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <span style={{ flex: 1, fontSize: 14 }}>{etiqueta}</span>
      {boton(-1)}
      <span style={{
        minWidth: 64, textAlign: "center", fontSize: 20, fontWeight: 700, fontVariantNumeric: "tabular-nums",
        color: deshabilitado ? "var(--muted)" : "var(--fg)",
      }}>
        {texto}
      </span>
      {boton(1)}
    </div>
  );
}

/**
 * El arranque de la rutina de VR a medida (P102, enmienda del ADR #046): el
 * juego (Les Mills primero), los bloques, los minutos y el descanso, con
 * controles grandes. Arranca con lo último que se usó con ese juego en esta
 * rutina; sin historia, con el escalón actual de Combat largo (Les Mills) o con
 * 2 × 15 y 2:00. Un bloque va de corrido: el descanso no se usa.
 *
 * Sin escalera (`regla: "ninguna"`): no hay nada que proponer, solo se guarda
 * con qué se jugó.
 */
export function InicioAMedidaVR({ rutina, perfil, seguida, catalogo, historial, onEmpezar }: Props) {
  const vr = rutina.vr!;
  const rangos = vr.aMedida!;
  const juegos = juegosAMedida(rutina);
  const [juego, setJuego] = useState(vr.idEjercicio);
  /** Lo tocado a mano, por juego. Lo no tocado sigue el valor inicial (que puede llegar después del historial). */
  const [tocado, setTocado] = useState<Record<string, EscalonVR>>({});

  // La última configuración sale del historial, que puede tardar. Se espera
  // hasta ESPERA_HISTORIAL_MS con «Empezar» habilitado: si llega antes, los
  // valores no tocados se actualizan; si no (o sin señal), queda el respaldo y
  // no se dice nada. Lo que llegue después ya no pisa lo que se ve.
  const [vencido, setVencido] = useState(() => typeof navigator !== "undefined" && !navigator.onLine);
  const [fijado, setFijado] = useState<Historial[] | null>(null);
  useEffect(() => {
    if (vencido) return;
    const t = setTimeout(() => setVencido(true), ESPERA_HISTORIAL_MS);
    return () => clearTimeout(t);
  }, [vencido]);
  useEffect(() => {
    if (historial && !fijado && !vencido) setFijado(historial);
  }, [historial, fijado, vencido]);
  const cargando = fijado == null && !vencido;

  const inicial = valoresInicialesAMedida({ rutina, idEjercicio: juego, historial: fijado ?? [], perfil, seguida });
  const c = tocado[juego] ?? inicial;
  const cambiar = (campo: "bloques" | "minutosBloque" | "descansoSeg") => (v: number) =>
    setTocado((t) => ({ ...t, [juego]: { ...c, [campo]: v } }));

  const { prescripto, modo } = prescriptoAMedida(c);
  const ej = catalogo.get(juego);
  const nombre = (id: string) => catalogo.get(id)?.nombre ?? (id === vr.idEjercicio ? rutina.bloques[0]?.nombreEjercicio : id) ?? id;
  const unBloque = c.bloques === 1;

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, color: "var(--muted)" }}>Juego</span>
        {juegos.map((id) => (
          <button key={id} className={juego === id ? "btn-primary" : "btn-secondary"} style={{ fontSize: 13 }}
            onClick={() => setJuego(id)}>
            {nombre(id)}
          </button>
        ))}
      </div>

      {cargando && (
        <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>Cargando tu última configuración…</p>
      )}

      <Control etiqueta="Bloques" valor={c.bloques} texto={String(c.bloques)} rango={rangos.bloques}
        onCambiar={cambiar("bloques")} />
      <Control etiqueta="Minutos por bloque" valor={c.minutosBloque} texto={String(c.minutosBloque)}
        rango={rangos.minutosBloque} onCambiar={cambiar("minutosBloque")} />
      <Control etiqueta="Descanso" valor={c.descansoSeg}
        texto={unBloque ? "—" : c.descansoSeg === 0 ? "sin" : mmss(c.descansoSeg)}
        rango={rangos.descansoSeg} onCambiar={cambiar("descansoSeg")} deshabilitado={unBloque} />

      <div>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>
          Sin escalera · {modo === "corrido" ? "De corrido" : "Por bloques"}
        </p>
        <p style={{ margin: "4px 0 0", fontSize: 14 }}>
          {textoEscalon(prescripto)} · {etiquetaDificultad(prescripto.dificultad, ej?.dificultadesVR)}
        </p>
        <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--muted)" }}>
          {Math.round(minutosPrescriptos(prescripto))} min en total · objetivo {vr.zonasObjetivo.join("-")}.
          Encadená los entrenamientos del juego que hagan falta; no hay que marcar nada.
        </p>
      </div>
      <FinSiEmpezas prescripto={prescripto} />
      <button
        className="btn-primary"
        onClick={() => onEmpezar({ modo, escalon: 1, idEjercicio: juego, nombreEjercicio: nombre(juego), prescripto })}
      >
        Empezar
      </button>
    </div>
  );
}
