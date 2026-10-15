import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Dumbbell, List, SlidersHorizontal } from "lucide-react";
import type { MiembroId, MotivoCambio, Programa, Rutina } from "../../types/models";
import { getRutinasDelMiembro } from "../../data/rutinas";
import { useAuth } from "../../auth/useAuth";
import {
  MOTIVOS_CAMBIO, opcionesCambio, paramsCambio, type EstadoNavegacionCambio, type OpcionCambio,
} from "../../lib/cambioDia";

interface Props {
  /** La rutina que tocaba. */
  prevista: { idRutina: string; nombre: string };
  /** El programa activo, para ofrecer sus otras rutinas. */
  programa: Pick<Programa, "dias"> | null;
  onCerrar: () => void;
}

const TITULO_GRUPO: Partial<Record<OpcionCambio["grupo"], string>> = {
  programa: "Del programa",
  vr: "Otras de VR",
};

/**
 * «Cambiar» lo que toca hoy (P102, ADR #030): la VR a medida, las otras rutinas
 * del programa, otras de VR, la sesión libre o «Ver todas». El motivo es
 * opcional. Elegir lleva a la sesión con la prevista; cerrar la hoja no cambia
 * nada. El plan avanza sin deuda: la prevista no queda trabada.
 *
 * Las rutinas se leen al abrir la hoja, no al cargar Home: sin tocar
 * «Cambiar», no hay lecturas de más.
 */
export function HojaCambiar({ prevista, programa, onCerrar }: Props) {
  const navigate = useNavigate();
  const { memberId } = useAuth();
  const [rutinas, setRutinas] = useState<Rutina[] | null>(null);
  const [motivo, setMotivo] = useState<MotivoCambio | null>(null);

  useEffect(() => {
    if (!memberId) { setRutinas([]); return; }
    getRutinasDelMiembro(memberId as MiembroId).then((r) => setRutinas(r.ok ? r.value : []));
  }, [memberId]);

  const opciones = opcionesCambio(prevista.idRutina, programa, rutinas ?? []);
  const navState: EstadoNavegacionCambio = { cambio: { rutinaPrevista: prevista.idRutina, motivo } };

  function elegir(o: OpcionCambio) {
    // «Ver todas»: hay pantallas en el medio, así que el cambio viaja por la URL.
    if (o.grupo === "todas") {
      navigate(`/biblioteca?${new URLSearchParams({ tab: "rutinas", ...paramsCambio(navState.cambio) })}`);
    }
    else if (o.grupo === "libre") navigate("/entrenar/libre", { state: navState });
    else if (o.idRutina) navigate(`/entrenar/${o.idRutina}`, { state: navState });
  }

  let grupoAnterior: OpcionCambio["grupo"] | null = null;

  return (
    <div className="modal-backdrop" onClick={(e) => { e.stopPropagation(); onCerrar(); }}>
      <div
        className="modal-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="hoja-cambiar-titulo"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <span id="hoja-cambiar-titulo">En lugar de {prevista.nombre}</span>
          <button type="button" className="modal-close" onClick={onCerrar} title="Cerrar">
            <X size={18} />
          </button>
        </div>
        <div style={{ overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
          <p className="t-label" style={{ margin: 0 }}>¿Por qué? (opcional)</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
            {MOTIVOS_CAMBIO.map(([id, etiqueta]) => (
              <button
                key={id}
                type="button"
                className={`filter-chip${motivo === id ? " active" : ""}`}
                aria-pressed={motivo === id}
                onClick={() => setMotivo(motivo === id ? null : id)}
              >
                {etiqueta}
              </button>
            ))}
          </div>

          {rutinas == null && <div className="spinner" style={{ alignSelf: "center" }} />}

          {opciones.map((o) => {
            const titulo = o.grupo !== grupoAnterior ? TITULO_GRUPO[o.grupo] : undefined;
            grupoAnterior = o.grupo;
            const icono = o.grupo === "a-medida" ? <SlidersHorizontal size={16} />
              : o.grupo === "libre" ? <Dumbbell size={16} />
              : o.grupo === "todas" ? <List size={16} /> : null;
            return (
              <div key={`${o.grupo}-${o.idRutina ?? o.nombre}`} style={{ display: "contents" }}>
                {titulo && <p className="t-label" style={{ margin: "8px 0 0" }}>{titulo}</p>}
                <button
                  type="button"
                  className={o.grupo === "a-medida" ? "btn-primary" : "btn-secondary"}
                  style={{ justifyContent: "flex-start", textAlign: "left", display: "flex", alignItems: "center", gap: 8 }}
                  onClick={() => elegir(o)}
                >
                  {icono}{o.nombre}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
