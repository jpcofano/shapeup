import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import type { Historial, MetricaSalud, MiembroId, BiometriaSesion } from "../types/models";
import { getHistorialEntry, getHistorialEnLaApp } from "../data/historial";
import { getRegistrosSueno, getMetricasSalud } from "../data/salud";
import { COBERTURA_MINIMA } from "../lib/matchBiometrico";
import { consolidarNoches } from "../lib/sueno";
import type { NocheSueno } from "../lib/sueno";
import { compararConPrevias } from "../lib/costoCardiaco";
import { motivoSaltoLabel, MOTIVOS_SUSTITUCION } from "../lib/entrenarState";
import { ZONAS_MOLESTIA } from "../lib/resumenSesion";
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
  "directo":   "dato propio",       // entrada externa: el dato es de ella misma (P75)
};


/**
 * Cuántos minutos de la sesión tienen FC medida, y —si falta bastante— qué
 * pasó (P78).
 *
 * Nada de íconos de alerta ni de rojo: es información, no un error del usuario.
 * Y en minutos, no en porcentaje: "41 de 62 min" se entiende y "66 %" no.
 */
function LineaCobertura({ biometria, duracionMin }: {
  biometria: BiometriaSesion;
  duracionMin: number | null;
}) {
  const cobertura = biometria.coberturaFina;
  if (cobertura == null || duracionMin == null || duracionMin <= 0) return null;

  const medidos = Math.round(cobertura * duracionMin);
  const faltan = Math.max(0, duracionMin - medidos);

  const motivo = biometria.motivoCobertura;
  const frase =
    motivo === "cortado-antes"      ? `el reloj se cortó a los ${medidos} min`
    : motivo === "arranco-tarde"    ? `el reloj arrancó ${faltan} min después que la sesión`
    : motivo === "hueco-entre-tramos" ? `hay ${faltan} min sin registrar en el medio`
    : motivo === "sin-cortar"       ? "el reloj siguió grabando después de terminar"
    : null;

  return (
    <div style={{ marginTop: 8 }}>
      <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>
        FC medida en {medidos} de {duracionMin} min
      </p>
      {cobertura < COBERTURA_MINIMA && frase && (
        <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--muted)" }}>
          Datos parciales — {frase}
        </p>
      )}
    </div>
  );
}

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
        getHistorialEnLaApp(entry.miembro as MiembroId),
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
          {h.completitud === "parcial" && (
            <span className="badge badge-warn">Parcial</span>
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

      {/* Series registradas por bloque. Una sesión de juego no tiene: la
          tarjeta se esconde en vez de quedar vacía (P81). */}
      {(h.bloques?.length ?? 0) > 0 && (
      <div className="card">
        <p className="section-title" style={{ marginBottom: 12 }}>Series registradas</p>
        {h.bloques.map((b, i) => {
          const completadas = b.series.filter((s) => s.completada);
          const detalle = completadas
            .filter((s) => s.cargaKg != null || s.rir != null)
            .map((s) => [
              s.cargaKg != null ? `${s.reps ?? "?"}×${s.cargaKg}kg` : `${s.reps ?? "?"} reps`,
              s.rir != null ? `RIR ${s.rir}` : null,
            ].filter(Boolean).join(" "))
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
                {/* Sustitución en vivo (P73): qué se cambió y por qué. */}
                {b.idEjercicioOriginal && (
                  <p className="bloque-prescripcion">
                    Sustituye a {b.nombreEjercicioOriginal ?? b.idEjercicioOriginal}
                    {b.motivoSustitucion
                      ? ` · ${MOTIVOS_SUSTITUCION.find(([v]) => v === b.motivoSustitucion)?.[1] ?? b.motivoSustitucion}`
                      : ""}
                  </p>
                )}
                {b.saltado && (
                  <p className="bloque-prescripcion" style={{ color: "var(--warning)" }}>
                    {(() => {
                      const motivo = motivoSaltoLabel(b.motivoSalto);
                      return motivo ? `Salteado · ${motivo}` : "Salteado";
                    })()}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Cómo te sentiste (P70) — solo si hay algo cargado */}
      {(h.comoMeSenti || (h.molestias && h.molestias.length > 0) || h.queMejorar || h.notas) && (
        <div className="card">
          <p className="section-title" style={{ marginBottom: 8 }}>Cómo te sentiste</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 14 }}>
            {h.comoMeSenti && (
              <p style={{ margin: 0 }}>
                <span style={{ color: "var(--muted)" }}>Sensación: </span>{h.comoMeSenti}
              </p>
            )}
            {h.molestias && h.molestias.length > 0 && (
              <p style={{ margin: 0 }}>
                <span style={{ color: "var(--muted)" }}>Molestias: </span>
                {h.molestias
                  .map((z) => ZONAS_MOLESTIA.find(([v]) => v === z)?.[1] ?? z)
                  .join(", ")}
              </p>
            )}
            {h.queMejorar && (
              <p style={{ margin: 0 }}>
                <span style={{ color: "var(--muted)" }}>Qué mejorar: </span>{h.queMejorar}
              </p>
            )}
            {h.notas && (
              <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.5 }}>{h.notas}</p>
            )}
          </div>
        </div>
      )}

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
                {/* `~` cuando las kcal salieron de un prorrateo por tiempo (P78). */}
                <span className="stat-value">
                  {h.biometria.kcalEstimada ? "~" : ""}{h.biometria.kcal}
                </span>
                <span className="stat-label">kcal</span>
              </div>
            )}
          </div>

          {/* Cobertura (P78): en minutos, que son accionables, no en porcentaje. */}
          <LineaCobertura biometria={h.biometria} duracionMin={h.duracionRealMin} />
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
      {!h.biometria && (
        <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>
          Sin datos del reloj para esta sesión.
        </p>
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

    </div>
  );
}
