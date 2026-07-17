import { useMemo, useState } from "react";
import { MiniChart } from "../MiniChart";
import { Sparkline } from "../Sparkline";
import { TrendChart } from "../TrendChart";
import type {
  MedicionCorporal, Historial, MetricaSalud, RegistroSueno,
} from "../../types/models";
import { consolidarNoches } from "../../lib/sueno";
import { serieTendencia, alcanzaMinimoChip, type RangoTendencia } from "../../lib/tendencias";

// ── Tendencias de salud (I1) ──────────────────────────────────────────────────

type ClaveTendencia = "fc-reposo" | "fc-media-dia" | "fc-max-dia" | "spo2" | "presion" | "peso" | "sueno";

const METRICAS_TENDENCIA: { clave: ClaveTendencia; nombre: string; unidad: string }[] = [
  { clave: "fc-reposo",    nombre: "FC reposo",    unidad: "bpm" },
  { clave: "fc-media-dia", nombre: "FC media día", unidad: "bpm" },
  { clave: "fc-max-dia",   nombre: "FC máx día",   unidad: "bpm" },
  { clave: "spo2",         nombre: "SpO2",         unidad: "%" },
  { clave: "presion",      nombre: "Presión",      unidad: "mmHg" },
  { clave: "peso",         nombre: "Peso",         unidad: "kg" },
  { clave: "sueno",        nombre: "Sueño",        unidad: "h" },
];

const RANGOS: { clave: RangoTendencia; label: string }[] = [
  { clave: "3m", label: "3M" },
  { clave: "1a", label: "1A" },
  { clave: "5a", label: "5A" },
  { clave: "todo", label: "Todo" },
];

function chipBtnStyle(activo: boolean): React.CSSProperties {
  return {
    padding: "6px 14px", borderRadius: "var(--r-full)", fontSize: 13, fontWeight: 600,
    border: activo ? "1px solid var(--accent)" : "1px solid var(--border)",
    background: activo ? "var(--accent-dim)" : "transparent",
    color: activo ? "var(--accent)" : "var(--muted)",
    cursor: "pointer", whiteSpace: "nowrap",
  };
}

function TendenciasSalud({
  metricas, sueno, mediciones, hoy,
}: {
  metricas: MetricaSalud[];
  sueno: RegistroSueno[];
  mediciones: MedicionCorporal[];
  hoy: string;
}) {
  const noches = useMemo(() => consolidarNoches(sueno), [sueno]);

  const valoresPorClave = useMemo(() => {
    const porTipo = (tipo: string) =>
      metricas.filter((m) => m.tipo === tipo).map((m) => ({ fecha: m.fecha, valor: m.valor }));
    const registro: Record<ClaveTendencia, { fecha: string; valor: number }[]> = {
      "fc-reposo":    porTipo("fc-reposo"),
      "fc-media-dia": porTipo("fc-media-dia"),
      "fc-max-dia":   porTipo("fc-max-dia"),
      spo2:           porTipo("spo2"),
      presion:        porTipo("presion-sistolica"), // el chart suma la diastólica aparte
      peso:           mediciones.filter((m) => m.pesoKg != null).map((m) => ({ fecha: m.fecha, valor: m.pesoKg! })),
      sueno:          noches.map((n) => ({ fecha: n.fecha, valor: n.horasTotal })),
    };
    return registro;
  }, [metricas, mediciones, noches]);

  const chips = METRICAS_TENDENCIA.filter((m) => alcanzaMinimoChip(valoresPorClave[m.clave].length));

  const [claveElegida, setClaveElegida] = useState<ClaveTendencia | null>(null);
  const [rango, setRango] = useState<RangoTendencia>("1a");

  if (chips.length === 0) return null; // ninguna métrica alcanza el mínimo de datos todavía

  const clave = claveElegida && chips.some((m) => m.clave === claveElegida) ? claveElegida : chips[0].clave;
  const metrica = METRICAS_TENDENCIA.find((m) => m.clave === clave)!;

  const serie = serieTendencia(valoresPorClave[clave], rango, hoy);
  const serieDiastolica = clave === "presion"
    ? serieTendencia(
        metricas.filter((m) => m.tipo === "presion-diastolica").map((m) => ({ fecha: m.fecha, valor: m.valor })),
        rango, hoy,
      )
    : null;

  const resumen = [
    serie.actual     != null ? `Ahora: ${serie.actual.toFixed(1)} ${metrica.unidad}` : null,
    serie.haceUnAnio  != null ? `hace un año: ${serie.haceUnAnio.toFixed(1)}` : null,
    serie.deltaAnualPct != null
      ? `${serie.deltaAnualPct > 0 ? "+" : ""}${(serie.deltaAnualPct * 100).toFixed(0)}%`
      : null,
  ].filter(Boolean).join(" · ");

  return (
    <div className="card">
      <p className="section-title" style={{ marginBottom: 10 }}>Tendencias de salud</p>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        {chips.map((m) => (
          <button
            key={m.clave}
            style={chipBtnStyle(m.clave === clave)}
            onClick={() => setClaveElegida(m.clave)}
          >
            {m.nombre}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {RANGOS.map((r) => (
          <button
            key={r.clave}
            style={chipBtnStyle(r.clave === rango)}
            onClick={() => setRango(r.clave)}
          >
            {r.label}
          </button>
        ))}
      </div>

      <TrendChart
        puntos={serie.puntos}
        unidad={metrica.unidad}
        rango={rango}
        lineaRef={clave === "presion" ? [120, 80] : undefined}
        puntosSecundarios={serieDiastolica?.puntos}
      />

      {resumen && (
        <p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--muted)" }}>{resumen}</p>
      )}
    </div>
  );
}

// ── Progreso de entrenamiento (existente) ─────────────────────────────────────

export function ProgresoTab({
  mediciones,
  historial,
  metricas,
  sueno,
  hoy,
  metricasError,
  onReintentarMetricas,
}: {
  mediciones: MedicionCorporal[];
  historial: Historial[];
  metricas: MetricaSalud[];
  sueno: RegistroSueno[];
  hoy: string;
  metricasError?: string | null;
  onReintentarMetricas?: () => void;
}) {
  const tonelaje = historial
    .filter((h) => h.tonelajeKg != null)
    .slice(0, 20)
    .map((h) => ({ fecha: h.fechaRealizada, kg: h.tonelajeKg! }));

  const pesoTrend = mediciones.length >= 2
    ? (mediciones[0].pesoKg ?? 0) - (mediciones[1].pesoKg ?? 0)
    : null;
  const grasaTrend = mediciones.length >= 2
    ? (mediciones[0].grasaPct ?? 0) - (mediciones[1].grasaPct ?? 0)
    : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {metricasError && (
        <p className="inline-error">
          No se pudieron cargar las métricas
          {onReintentarMetricas && (
            <> · <button
              onClick={onReintentarMetricas}
              style={{ background: "none", border: "none", padding: 0, color: "inherit", textDecoration: "underline", cursor: "pointer", font: "inherit" }}
            >
              reintentar
            </button></>
          )}
        </p>
      )}
      <TendenciasSalud metricas={metricas} sueno={sueno} mediciones={mediciones} hoy={hoy} />

      <div className="card">
        <p className="section-title" style={{ marginBottom: 10 }}>Tendencia de peso</p>
        {mediciones.length < 2 ? (
          <p style={{ color: "var(--muted)", fontSize: 13 }}>Necesitás al menos 2 registros para ver tendencia.</p>
        ) : (
          <div className="stats-row" style={{ gap: 20 }}>
            <div>
              <p style={{ margin: 0, fontWeight: 700 }}>{mediciones[0].pesoKg?.toFixed(1) ?? "-"} kg</p>
              {pesoTrend !== null && (
                <p style={{ margin: 0, fontSize: 12, color: pesoTrend < 0 ? "var(--accent)" : pesoTrend > 0 ? "var(--danger)" : "var(--muted)" }}>
                  {pesoTrend > 0 ? "+" : ""}{pesoTrend.toFixed(1)} kg vs anterior
                </p>
              )}
              <p style={{ margin: 0, fontSize: 11, color: "var(--muted)" }}>peso</p>
            </div>
            {mediciones[0].grasaPct != null && (
              <div>
                <p style={{ margin: 0, fontWeight: 700 }}>{mediciones[0].grasaPct.toFixed(1)}%</p>
                {grasaTrend !== null && (
                  <p style={{ margin: 0, fontSize: 12, color: grasaTrend < 0 ? "var(--accent)" : grasaTrend > 0 ? "var(--danger)" : "var(--muted)" }}>
                    {grasaTrend > 0 ? "+" : ""}{grasaTrend.toFixed(1)}% vs anterior
                  </p>
                )}
                <p style={{ margin: 0, fontSize: 11, color: "var(--muted)" }}>grasa</p>
              </div>
            )}
          </div>
        )}
        {mediciones.length > 2 && (
          <div style={{ marginTop: 10 }}>
            <MiniChart
              data={mediciones.slice(0, 12).reverse().map((m) => ({ label: m.fecha.slice(5), value: m.pesoKg ?? 0 }))}
              color="var(--accent)"
            />
          </div>
        )}
      </div>

      <div className="card">
        <p className="section-title" style={{ marginBottom: 10 }}>Tonelaje de entrenamiento</p>
        {tonelaje.length === 0 ? (
          <p style={{ color: "var(--muted)", fontSize: 13 }}>Sin historial de sesiones aún.</p>
        ) : (
          <>
            {tonelaje.length >= 2 && (
              <div style={{ marginBottom: 10 }}>
                <Sparkline
                  data={[...tonelaje].reverse().map((t) => t.kg)}
                  color="var(--info)"
                  height={48}
                />
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {tonelaje.slice(0, 8).map((t, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: "var(--muted)" }}>{t.fecha}</span>
                  <span>{t.kg.toLocaleString()} kg</span>
                </div>
              ))}
            </div>
            {tonelaje.length > 3 && (
              <div style={{ marginTop: 10 }}>
                <MiniChart
                  data={tonelaje.slice(0, 10).reverse().map((t) => ({ label: t.fecha.slice(5), value: t.kg }))}
                  color="var(--info)"
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
