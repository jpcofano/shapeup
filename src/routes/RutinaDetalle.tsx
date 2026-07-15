import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Edit2, Zap, TrendingUp } from "lucide-react";
import type { Rutina, Ejercicio, Historial } from "../types/models";
import { getRutina } from "../data/rutinas";
import { getEjerciciosMap } from "../data/ejercicios";
import { getHistorialMiembro } from "../data/historial";
import { avisoBalanceEmpujeTraccion } from "../lib/metricas";
import { prescripcionLabel } from "../lib/prescripcionLabel";
import { serieCostoRutina, MIN_SESIONES_SECCION } from "../lib/costoCardiaco";
import { sugerirProgresion } from "../lib/progresion";
import { TrendChart } from "../components/TrendChart";
import { useAuth } from "../auth/useAuth";

export function RutinaDetalle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { memberId } = useAuth();
  const [rutina,   setRutina]   = useState<Rutina | null>(null);
  const [catalogo, setCatalogo] = useState<Map<string, Ejercicio>>(new Map());
  const [aviso,    setAviso]    = useState<string | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [historialMiembro, setHistorialMiembro] = useState<Historial[]>([]);
  const [motivoAbierto, setMotivoAbierto] = useState<number | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([getRutina(id), getEjerciciosMap()]).then(([rRes, cat]) => {
      if (!rRes.ok) { setError(rRes.error); setLoading(false); return; }
      setRutina(rRes.value);
      setCatalogo(cat);
      setAviso(avisoBalanceEmpujeTraccion(rRes.value, cat));
      setLoading(false);
    });
  }, [id]);

  // Historial del miembro actual: alimenta costo cardíaco (I2) y sugerencias de progresión (I3).
  useEffect(() => {
    if (!memberId) return;
    getHistorialMiembro(memberId).then((r) => { if (r.ok) setHistorialMiembro(r.value); });
  }, [memberId]);

  const costoCardiaco = id ? serieCostoRutina(id, historialMiembro) : [];

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (error)   return <p className="inline-error">{error}</p>;
  if (!rutina) return null;

  // Sugerencias de progresión (I3): solo se marcan los bloques con "subir-peso" —
  // subir-reps/repetir/bajar-peso no son "hoy toca progresar" y ensuciarían la lista.
  const sugerenciasPorBloque = new Map<number, string>();
  rutina.bloques.forEach((b, i) => {
    const s = sugerirProgresion(b.idEjercicio, historialMiembro, b.prescripcion);
    if (s?.tipo === "subir-peso") sugerenciasPorBloque.set(i, s.motivo);
  });

  return (
    <div className="page">
      {/* Cabecera */}
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Rutinas
        </button>
        <button className="btn-icon-sm" onClick={() => navigate(`/biblioteca/${id}/editar`)} title="Editar">
          <Edit2 size={16} />
        </button>
      </div>

      {/* Título + badges */}
      <div>
        <h1 style={{ margin: "0 0 8px", fontSize: 24, fontWeight: 700 }}>{rutina.nombre}</h1>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          <span className="badge badge-accent">{rutina.foco}</span>
          <span className="badge badge-muted">{rutina.nivel}</span>
          <span className="badge badge-muted">{rutina.lugar}</span>
          <span className="badge badge-muted">{rutina.objetivo}</span>
        </div>
      </div>

      {/* Stats */}
      {(rutina.duracionEstimadaMin != null || rutina.totalSeries != null) && (
        <div className="card">
          <div className="stats-row">
            {rutina.duracionEstimadaMin != null && (
              <div className="stat">
                <span className="stat-value">{rutina.duracionEstimadaMin}</span>
                <span className="stat-label">min estimados</span>
              </div>
            )}
            {rutina.totalSeries != null && (
              <div className="stat">
                <span className="stat-value">{rutina.totalSeries}</span>
                <span className="stat-label">series totales</span>
              </div>
            )}
            <div className="stat">
              <span className="stat-value">{rutina.bloques.length}</span>
              <span className="stat-label">ejercicios</span>
            </div>
          </div>
        </div>
      )}

      {/* Costo cardíaco (I2): silencio con < MIN_SESIONES_SECCION sesiones con biometría */}
      {costoCardiaco.length >= MIN_SESIONES_SECCION && (
        <div className="card">
          <p className="section-title" style={{ marginBottom: 10 }}>Costo cardíaco</p>
          <TrendChart
            puntos={costoCardiaco.map((p) => ({ fecha: p.fecha, valor: p.fcMedia }))}
            unidad="bpm"
            rango="todo"
            alto={120}
          />
          {(() => {
            const primera = costoCardiaco[0].fcMedia;
            const ultima = costoCardiaco[costoCardiaco.length - 1].fcMedia;
            const deltaPct = ((ultima - primera) / primera) * 100;
            return (
              <p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--muted)" }}>
                Primera: {Math.round(primera)} bpm · última: {Math.round(ultima)} ·{" "}
                {deltaPct > 0 ? "+" : ""}{deltaPct.toFixed(0)}% en {costoCardiaco.length} sesiones
              </p>
            );
          })()}
        </div>
      )}

      {/* Aviso de balance */}
      {aviso && (
        <div className="aviso aviso-warn">
          ⚠️ {aviso}
        </div>
      )}

      {/* Descripción */}
      {rutina.descripcion && (
        <div className="card">
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: "var(--muted)" }}>
            {rutina.descripcion}
          </p>
        </div>
      )}

      {/* Calentamiento */}
      {rutina.calentamiento && (
        <div className="card">
          <p className="section-title" style={{ marginBottom: 6 }}>Calentamiento</p>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: "var(--muted)" }}>
            {rutina.calentamiento}
          </p>
        </div>
      )}

      {/* Bloques */}
      <div className="card">
        <p className="section-title" style={{ marginBottom: 12 }}>Ejercicios</p>
        {rutina.bloques.length === 0 && (
          <p style={{ margin: 0, fontSize: 14, color: "var(--muted)" }}>Sin bloques.</p>
        )}
        {rutina.bloques.map((b, i) => (
          <div key={i} className="bloque-row">
            <span className="bloque-num">{i + 1}</span>
            <div className="bloque-info">
              {b.grupoSet && (
                <span className="badge badge-muted" style={{ marginBottom: 4, display: "inline-block" }}>
                  {b.grupoSet}
                </span>
              )}
              <p className="bloque-nombre">
                {b.nombreEjercicio}
                {sugerenciasPorBloque.has(i) && (
                  <button
                    onClick={() => setMotivoAbierto((cur) => (cur === i ? null : i))}
                    aria-label="Hoy toca subir peso"
                    title="Hoy toca subir peso"
                    style={{
                      background: "none", border: "none", color: "var(--accent)",
                      cursor: "pointer", padding: 0, marginLeft: 6, verticalAlign: "middle", lineHeight: 1,
                    }}
                  >
                    <TrendingUp size={14} />
                  </button>
                )}
              </p>
              <p className="bloque-prescripcion">
                {prescripcionLabel(b.prescripcion, catalogo.get(b.idEjercicio)?.equipo)}
              </p>
              {motivoAbierto === i && sugerenciasPorBloque.has(i) && (
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--accent)" }}>
                  💡 {sugerenciasPorBloque.get(i)}
                </p>
              )}
              {b.notas && (
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--muted)", fontStyle: "italic" }}>
                  {b.notas}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Vuelta a la calma */}
      {rutina.vueltaACalma && (
        <div className="card">
          <p className="section-title" style={{ marginBottom: 6 }}>Vuelta a la calma</p>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: "var(--muted)" }}>
            {rutina.vueltaACalma}
          </p>
        </div>
      )}

      {/* Empezar sesión */}
      <button
        className="btn-primary"
        onClick={() => navigate(`/entrenar/${rutina.idRutina}`)}
      >
        <Zap size={18} /> Empezar sesión
      </button>
    </div>
  );
}
