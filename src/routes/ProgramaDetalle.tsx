import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Moon, Zap } from "lucide-react";
import type { Programa, MiembroId } from "../types/models";
import { getPrograma, getProgramaActivo, setProgramaActivo } from "../data/programas";
import { useAuth } from "../auth/useAuth";
import { VistaSemanal } from "../components/VistaSemanal";
import { jsDayToNum } from "../lib/sesionDeHoy";

const PRIMER_NOMBRE: Record<MiembroId, string> = {
  juanpablo: "Juan Pablo", maria: "María", sofia: "Sofía", federico: "Federico",
};

const DIAS_FULL = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];

export function ProgramaDetalle() {
  const { id }        = useParams<{ id: string }>();
  const navigate      = useNavigate();
  const { memberId }  = useAuth();

  const [programa,    setPrograma]    = useState<Programa | null>(null);
  const [activoId,    setActivoId]    = useState<string | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [activando,   setActivando]   = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  const hoyNum = jsDayToNum(new Date().getDay());

  useEffect(() => {
    if (!id || !memberId) return;
    Promise.all([
      getPrograma(id),
      getProgramaActivo(memberId as MiembroId),
    ]).then(([progR, activoR]) => {
      if (progR.ok) setPrograma(progR.value);
      else          setError(progR.error);
      if (activoR.ok && activoR.value) setActivoId(activoR.value.idPrograma);
      setLoading(false);
    });
  }, [id, memberId]);

  async function handleActivar() {
    if (!memberId || !id || activando) return;
    setActivando(true);
    const r = await setProgramaActivo(memberId as MiembroId, id);
    if (r.ok) {
      navigate("/");
    } else {
      setError(r.error);
      setActivando(false);
    }
  }

  if (loading) return (
    <div className="page">
      <div className="empty-state"><div className="spinner" /></div>
    </div>
  );

  if (!programa) return (
    <div className="page">
      <button className="btn-icon-sm" onClick={() => navigate(-1)} style={{ marginBottom: 12 }}>
        <ChevronLeft size={20} />
      </button>
      <p className="inline-error">{error ?? "Programa no encontrado."}</p>
    </div>
  );

  const activos   = programa.dias.filter((d) => d.tipo !== "descanso");
  const descansos = programa.dias.filter((d) => d.tipo === "descanso");
  const esActivo  = activoId === programa.idPrograma;
  const nombreMiembro = memberId ? PRIMER_NOMBRE[memberId as MiembroId] : "";

  return (
    <div className="page">
      {/* Back */}
      <button
        className="btn-icon-sm"
        onClick={() => navigate(-1)}
        style={{ marginBottom: 8, alignSelf: "flex-start" }}
      >
        <ChevronLeft size={20} />
      </button>

      {/* Cabecera */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: "-.02em" }}>
            {programa.nombre}
          </h1>
          {esActivo && (
            <span className="badge badge-accent" style={{ fontSize: 11 }}>Activo</span>
          )}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          <span className="badge badge-muted">{programa.objetivo}</span>
          <span className="badge badge-muted">{programa.nivel}</span>
          <span className="badge badge-muted">{activos.length} días/sem</span>
          {descansos.length > 0 && (
            <span className="badge badge-muted">{descansos.length} descanso{descansos.length !== 1 ? "s" : ""}</span>
          )}
        </div>
      </div>

      {/* Vista semanal */}
      <div className="card" style={{ marginBottom: 12 }}>
        <p className="section-title" style={{ marginBottom: 12 }}>Tu semana</p>
        <VistaSemanal dias={programa.dias} hoy={hoyNum} />
      </div>

      {/* Días expandibles */}
      <div className="card" style={{ marginBottom: 12 }}>
        <p className="section-title" style={{ marginBottom: 10 }}>Día a día</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {programa.dias
            .sort((a, b) => a.orden - b.orden)
            .map((dia, i) => {
              const diaIdx = dia.diaSemana ? DIAS_FULL.indexOf(dia.diaSemana) : -1;
              const esHoyDia = diaIdx === hoyNum;
              return (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "6px 0",
                  borderBottom: i < programa.dias.length - 1 ? "1px solid var(--border-dim)" : "none",
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                    background: dia.tipo === "descanso" ? "var(--card)" : "var(--accent-dim)",
                    border: esHoyDia ? "1.5px solid var(--accent)" : "1.5px solid var(--border)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {dia.tipo === "descanso"
                      ? <Moon size={14} color="var(--muted)" strokeWidth={1.5} />
                      : <Zap  size={14} color="var(--accent)" fill="var(--accent)" strokeWidth={0} />
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>
                      {dia.etiqueta}
                      {esHoyDia && <span style={{ color: "var(--accent)", marginLeft: 6, fontSize: 11 }}>hoy</span>}
                    </p>
                    {dia.diaSemana && (
                      <p style={{ margin: 0, fontSize: 11, color: "var(--muted)", textTransform: "capitalize" }}>
                        {dia.diaSemana}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Cómo usar / reglas */}
      {programa.comoUsar && (
        <div className="card" style={{ marginBottom: 12 }}>
          <p className="section-title" style={{ marginBottom: 6 }}>Cómo usar</p>
          <p style={{ margin: 0, fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>
            {programa.comoUsar}
          </p>
        </div>
      )}
      {programa.reglasProgresion && programa.reglasProgresion.length > 0 && (
        <div className="card" style={{ marginBottom: 12 }}>
          <p className="section-title" style={{ marginBottom: 6 }}>Progresión</p>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {programa.reglasProgresion.map((r, i) => (
              <li key={i} style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.5, marginBottom: 4 }}>{r}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Botón activar */}
      <div style={{ marginTop: 8, marginBottom: 16 }}>
        {esActivo ? (
          <button className="btn-primary" disabled style={{ width: "100%", opacity: 0.6 }}>
            Activo para {nombreMiembro}
          </button>
        ) : (
          <button
            className="btn-primary"
            style={{ width: "100%" }}
            onClick={handleActivar}
            disabled={activando}
          >
            {activando ? "Activando…" : "Activar para mí"}
          </button>
        )}
      </div>

      {error && <p className="inline-error">{error}</p>}
    </div>
  );
}
