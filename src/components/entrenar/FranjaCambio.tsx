import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { getRutina } from "../../data/rutinas";
import type { CambioDelDia } from "../../lib/entrenarState";
import { motivoCambioLabel } from "../../lib/cambioDia";

interface Props {
  cambio: CambioDelDia;
  /** La ✕: cancela el cambio. Lo que se empiece después no lleva la prevista. */
  onCancelar: () => void;
}

/**
 * «Cambiando Creed» (P102): mientras el cambio viaja por «Ver todas»
 * (Biblioteca → la rutina → la sesión), se dice, y se puede cancelar.
 */
export function FranjaCambio({ cambio, onCancelar }: Props) {
  const [nombre, setNombre] = useState<string | null>(null);
  useEffect(() => {
    let vivo = true;
    void getRutina(cambio.rutinaPrevista).then((r) => { if (vivo && r.ok) setNombre(r.value.nombre); });
    return () => { vivo = false; };
  }, [cambio.rutinaPrevista]);
  const motivo = motivoCambioLabel(cambio.motivo);

  return (
    <div
      role="status"
      data-testid="franja-cambio"
      className="card"
      style={{
        display: "flex", alignItems: "center", gap: 8, padding: "10px 12px",
        borderColor: "var(--accent)", background: "var(--accent-dim)",
      }}
    >
      <p style={{ margin: 0, flex: 1, fontSize: 13 }}>
        <strong>Cambiando {nombre ?? cambio.rutinaPrevista}</strong>
        {motivo && <span style={{ color: "var(--muted)" }}> · {motivo}</span>}
        <br />
        <span style={{ color: "var(--muted)" }}>Elegí la rutina que vas a hacer en su lugar.</span>
      </p>
      <button type="button" className="btn-icon-sm" onClick={onCancelar} title="Cancelar el cambio">
        <X size={16} />
      </button>
    </div>
  );
}
