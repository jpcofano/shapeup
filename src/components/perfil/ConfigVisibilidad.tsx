import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { getProgramas } from "../../data/programas";
import { getRutinas } from "../../data/rutinas";
import { getVisibilidadConfig, setVisibilidadMiembro, OWNER } from "../../data/visibilidad";
import { alternarPrograma, alternarRutina, visibilidadCambio } from "../../lib/configuracion";
import {
  MIEMBRO_IDS, type MiembroId, type Programa, type Rutina, type VisibilidadConfig, type VisibilidadMiembro,
} from "../../types/models";

const NOMBRES: Record<MiembroId, string> = {
  juanpablo: "Juan Pablo", maria: "María", sofia: "Sofía", federico: "Federico",
};

const VACIA: VisibilidadMiembro = { programas: [], rutinas: [] };

/**
 * Qué programas y rutinas ve cada miembro (/config/visibilidad). P86: antes
 * solo se cambiaba desde la consola. El owner ve todo y no aparece.
 * Se guarda por miembro con el botón: nada se escribe al tocar un chip.
 */
export function ConfigVisibilidad() {
  const [programas, setProgramas] = useState<Programa[]>([]);
  const [rutinas, setRutinas] = useState<Rutina[]>([]);
  const [original, setOriginal] = useState<VisibilidadConfig | null>(null);
  const [borrador, setBorrador] = useState<VisibilidadConfig>({});
  const [abierto, setAbierto] = useState<MiembroId | null>(null);
  const [guardando, setGuardando] = useState<MiembroId | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([getProgramas(), getRutinas(), getVisibilidadConfig()]).then(([p, r, v]) => {
      if (p.ok) setProgramas(p.value);
      if (r.ok) setRutinas(r.value);
      if (v.ok) { setOriginal(v.value); setBorrador(v.value); }
      const falla = [p, r, v].find((x) => !x.ok);
      if (falla && !falla.ok) setError(falla.error);
    });
  }, []);

  const miembros = useMemo(() => MIEMBRO_IDS.filter((m) => m !== OWNER), []);

  async function guardar(m: MiembroId) {
    setGuardando(m); setError(null);
    const vis = borrador[m] ?? VACIA;
    const r = await setVisibilidadMiembro(m, vis);
    setGuardando(null);
    if (!r.ok) { setError(r.error); return; }
    setOriginal((o) => ({ ...(o ?? {}), [m]: vis }));
  }

  if (!original) {
    return error ? <p style={{ margin: 0, fontSize: 12, color: "var(--danger)" }}>{error}</p> : null;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>Qué ve cada miembro</p>
        <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--muted)" }}>
          Al prender un programa se suman sus rutinas. Al apagarlo, las rutinas quedan.
        </p>
      </div>
      {miembros.map((m) => {
        const vis = borrador[m] ?? VACIA;
        const cambio = visibilidadCambio(vis, original[m] ?? VACIA);
        const esAbierto = abierto === m;
        return (
          <div key={m} style={{ border: "1px solid var(--border)", borderRadius: "var(--r-sm)" }}>
            <button
              type="button" aria-expanded={esAbierto}
              onClick={() => setAbierto(esAbierto ? null : m)}
              style={{
                display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 12px",
                background: "none", border: "none", cursor: "pointer", color: "var(--fg)", textAlign: "left",
              }}
            >
              {esAbierto ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{NOMBRES[m]}</span>
              <span style={{ fontSize: 11, color: cambio ? "var(--warning)" : "var(--muted)" }}>
                {cambio ? "sin guardar" : `${vis.programas.length} programas · ${vis.rutinas.length} rutinas`}
              </span>
            </button>
            {esAbierto && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "10px 12px 12px", borderTop: "1px solid var(--border)" }}>
                <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>Programas</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {programas.map((p) => {
                    const on = vis.programas.includes(p.idPrograma);
                    return (
                      <button key={p.idPrograma} className={`filter-chip${on ? " active" : ""}`} aria-pressed={on}
                        onClick={() => setBorrador((b) => ({ ...b, [m]: alternarPrograma(b[m] ?? VACIA, p) }))}>
                        {p.nombre}
                      </button>
                    );
                  })}
                </div>
                <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>Rutinas</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {rutinas.map((r) => {
                    const on = vis.rutinas.includes(r.idRutina);
                    return (
                      <button key={r.idRutina} className={`filter-chip${on ? " active" : ""}`} aria-pressed={on}
                        onClick={() => setBorrador((b) => ({ ...b, [m]: alternarRutina(b[m] ?? VACIA, r.idRutina) }))}>
                        {r.nombre}
                      </button>
                    );
                  })}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn-primary" style={{ flex: 1 }} disabled={!cambio || guardando != null}
                    onClick={() => void guardar(m)}>
                    {guardando === m ? "Guardando…" : `Guardar lo de ${NOMBRES[m]}`}
                  </button>
                  {cambio && (
                    <button className="btn-secondary" style={{ width: "auto", padding: "8px 12px" }}
                      onClick={() => setBorrador((b) => ({ ...b, [m]: original[m] ?? VACIA }))}>
                      Deshacer
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
      {error && <p style={{ margin: 0, fontSize: 12, color: "var(--danger)" }}>{error}</p>}
    </div>
  );
}
