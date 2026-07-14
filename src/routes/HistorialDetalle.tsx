import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import type { Historial, MetricaSalud, MiembroId, BiometriaSesion } from "../types/models";
import { getHistorialEntry, getHistorialMiembro } from "../data/historial";
import { getRegistrosSueno, getMetricasSalud } from "../data/salud";
import { consolidarNoches } from "../lib/sueno";
import type { NocheSueno } from "../lib/sueno";
import { compararConPrevias } from "../lib/costoCardiaco";
import type { ComparativaCardiaca } from "../lib/costoCardiaco";

function formatFecha(s: string): string {
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
}

const MATCH_POR_LABEL: Record<BiometriaSesion["matchPor"], string> = {
  "custom-id": "por ID",
  "ventana":   "por ventana",
  "dia":       "por día (único ShapeUp)",
  "rango":     "por rango horario",
};


export function HistorialDetalle() {
  const { id }     = useParams<{ id: string }>();
  const navigate   = useNavigate();
  const [h, setH]  = useState<Historial | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [nocheAnterior, setNocheAnterior] = useState<NocheSueno | null>(null);
  const [fcDia,          setFcDia]        = useState<MetricaSalud | null>(null);
  const [comparativa,    setComparativa]  = useState<ComparativaCardiaca | null>(null);

  useEffect(() => {
    if (!id) return;
    getHistorialEntry(id).then(async (r) => {
      if (!r.ok) { setError(r.error); setLoading(false); return; }
      setH(r.value);
      setLoading(false);

      // Carga contexto del día: sueño noche anterior consolidada + FC en reposo del día,
      // y el resto del historial del miembro para el insight de costo cardíaco (I2).
      const entry = r.value;
      const [sRes, fRes, histRes] = await Promise.all([
        getRegistrosSueno(entry.miembro as MiembroId),
        getMetricasSalud(entry.miembro as MiembroId, "fc-reposo"),
        getHistorialMiembro(entry.miembro as MiembroId),
      ]);
      if (sRes.ok) {
        // NocheSueno.fecha = mañana del día en que te levantaste = fecha de la sesión
        const noches = consolidarNoches(sRes.value);
        const noche = noches.find((n) => n.fecha === entry.fechaRealizada);
        if (noche) setNocheAnterior(noche);
      }
      if (fRes.ok) {
        const met = fRes.value.find((m) => m.fecha === entry.fechaRealizada);
        if (met) setFcDia(met);
      }
      if (histRes.ok) {
        setComparativa(compararConPrevias(entry, histRes.value));
      }
    });
  }, [id]);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (error)   return <p className="inline-error" style={{ margin: 16 }}>{error}</p>;
  if (!h)      return null;

  return (
    <div className="page">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Historial
        </button>
      </div>

      {/* Título + fecha */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: "-.01em" }}>
            {h.nombreRutina}
          </h1>
          {h.tipo === "libre" && (
            <span className="badge badge-muted">Libre</span>
          )}
        </div>
        <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
          {formatFecha(h.fechaRealizada)}
        </p>
      </div>

      {/* Stats */}
      <div className="card">
        <div className="stats-row" style={{ flexWrap: "wrap", gap: 20 }}>
          {h.duracionRealMin != null && (
            <div className="stat">
              <span className="stat-value">{h.duracionRealMin}</span>
              <span className="stat-label">minutos</span>
            </div>
          )}
          {h.totalSeriesHechas != null && (
            <div className="stat">
              <span className="stat-value">{h.totalSeriesHechas}</span>
              <span className="stat-label">series</span>
            </div>
          )}
          {h.tonelajeKg != null && h.tonelajeKg > 0 && (
            <div className="stat">
              <span className="stat-value">{h.tonelajeKg.toLocaleString("es")}</span>
              <span className="stat-label">kg tonelaje</span>
            </div>
          )}
          {h.rpe != null && (
            <div className="stat">
              <span className="stat-value">{h.rpe}</span>
              <span className="stat-label">RPE</span>
            </div>
          )}
        </div>
      </div>

      {/* Series registradas por bloque */}
      <div className="card">
        <p className="section-title" style={{ marginBottom: 12 }}>Series registradas</p>
        {h.bloques.map((b, i) => {
          const completadas = b.series.filter((s) => s.completada);
          const detalle = completadas
            .filter((s) => s.cargaKg != null)
            .map((s) => `${s.reps ?? "?"}×${s.cargaKg}kg`)
            .join(", ");

          return (
            <div key={i} className="bloque-row">
              <span className="bloque-num">{i + 1}</span>
              <div className="bloque-info">
                <p className="bloque-nombre">{b.nombreEjercicio}</p>
                <p className="bloque-prescripcion">
                  {completadas.length}/{b.series.length} series
                  {detalle ? ` · ${detalle}` : ""}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Biometría de Samsung Health */}
      {h.biometria && (
        <div className="card">
          <p className="section-title" style={{ marginBottom: 10 }}>FC Samsung Health</p>
          <div className="stats-row" style={{ flexWrap: "wrap", gap: 16 }}>
            {h.biometria.fcMedia != null && (
              <div className="stat">
                <span className="stat-value">{Math.round(h.biometria.fcMedia)}</span>
                <span className="stat-label">FC media</span>
              </div>
            )}
            {h.biometria.fcMax != null && (
              <div className="stat">
                <span className="stat-value">{h.biometria.fcMax}</span>
                <span className="stat-label">FC máx</span>
              </div>
            )}
            {h.biometria.kcal != null && (
              <div className="stat">
                <span className="stat-value">{h.biometria.kcal}</span>
                <span className="stat-label">kcal</span>
              </div>
            )}
          </div>
          {comparativa && (
            <p style={{ margin: "8px 0 0", fontSize: 13 }}>
              FC media {Math.round(comparativa.fcMediaActual)} ·{" "}
              <span style={{
                fontWeight: 700,
                color: comparativa.deltaBpm < 0 ? "var(--accent)" : "var(--muted)",
              }}>
                {comparativa.deltaBpm > 0 ? "+" : ""}{Math.round(comparativa.deltaBpm)} bpm
              </span>
              {" "}vs tus últimas {comparativa.sesionesPrevias} sesiones de esta rutina
            </p>
          )}
          <div style={{ marginTop: 10 }}>
            {h.biometria.zonaPrincipal && (
              <span style={{
                padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600,
                background: `var(--zona-${h.biometria.zonaPrincipal.toLowerCase()}-dim)`,
                color:      `var(--zona-${h.biometria.zonaPrincipal.toLowerCase()})`,
              }}>
                {h.biometria.zonaPrincipal}
              </span>
            )}
            <span style={{ fontSize: 11, color: "var(--muted)", marginLeft: h.biometria.zonaPrincipal ? 8 : 0 }}>
              Match {MATCH_POR_LABEL[h.biometria.matchPor]} · {h.biometria.granularidad}
            </span>
          </div>
          {h.biometria.finMsEfectivo != null && (
            <p style={{ margin: "8px 0 0", fontSize: 11, color: "var(--muted)" }}>
              Samsung siguió grabando de más — datos recortados a tu sesión.
            </p>
          )}
        </div>
      )}

      {/* Contexto del día: sueño noche anterior consolidada + FC en reposo */}
      {(nocheAnterior || fcDia) && (
        <div className="card">
          <p className="section-title" style={{ marginBottom: 8 }}>Contexto del día</p>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            {nocheAnterior && (
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 18 }}>
                  {nocheAnterior.horasTotal.toFixed(1)} <span style={{ fontSize: 13, fontWeight: 500, color: "var(--muted)" }}>h</span>
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".05em" }}>
                  sueño noche anterior
                </p>
                {nocheAnterior.horaAcostarse && nocheAnterior.horaLevantarse && (
                  <p style={{ margin: "1px 0 0", fontSize: 11, color: "var(--muted)" }}>
                    {nocheAnterior.horaAcostarse} → {nocheAnterior.horaLevantarse}
                  </p>
                )}
              </div>
            )}
            {fcDia && (
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 18 }}>
                  {Math.round(fcDia.valor)} <span style={{ fontSize: 13, fontWeight: 500, color: "var(--muted)" }}>bpm</span>
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".05em" }}>
                  FC en reposo
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {h.notas && (
        <div className="card">
          <p className="section-title" style={{ marginBottom: 6 }}>Notas</p>
          <p style={{ margin: 0, fontSize: 14, color: "var(--muted)", lineHeight: 1.5 }}>{h.notas}</p>
        </div>
      )}
    </div>
  );
}
