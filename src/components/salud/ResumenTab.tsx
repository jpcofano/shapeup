import { useMemo } from "react";
import { Sparkline } from "../Sparkline";
import { calcularResumenSalud, senalPeor } from "../../lib/resumenSalud";
import type { SenalSalud, EstadoSenal } from "../../lib/resumenSalud";
import type { MetricaSalud, RegistroSueno, MedicionCorporal } from "../../types/models";

type TabDestino = "composicion" | "cardio" | "sueno" | "progreso";

const TAB_DESTINO: Record<SenalSalud["clave"], TabDestino> = {
  "fc-reposo": "progreso",
  "hrv":       "progreso",
  "pasos":     "progreso",
  "sueno":     "sueno",
  "peso":      "composicion",
  "presion":   "progreso",
  "spo2":      "progreso",
};

const NOMBRE_CLAVE: Record<SenalSalud["clave"], string> = {
  "fc-reposo": "FC en reposo",
  "hrv":       "HRV",
  "pasos":     "Pasos",
  "sueno":     "Sueño",
  "peso":      "Peso",
  "presion":   "Presión arterial",
  "spo2":      "SpO2",
};

// Señales informativas estilo "peso": sin semáforo, sin juicio de color — la
// app muestra el dato y su tendencia, nunca diagnostica (S-fix-b).
const CLAVES_SIN_SEMAFORO = new Set<SenalSalud["clave"]>(["peso", "presion", "spo2"]);

function colorEstado(estado: EstadoSenal): string {
  if (estado === "alerta")    return "var(--danger)";
  if (estado === "atencion")  return "var(--warning)";
  if (estado === "ok")        return "var(--accent)";
  return "var(--muted)";
}

function flechaTendencia(deltaPct: number | undefined): string {
  if (deltaPct == null || Math.abs(deltaPct) < 0.02) return "—";
  return deltaPct > 0 ? "↑" : "↓";
}

function colorFlecha(clave: SenalSalud["clave"], deltaPct: number | undefined): string {
  if (deltaPct == null || Math.abs(deltaPct) < 0.02) return "var(--muted)";
  // Señales informativas (peso/presión/spo2): neutro, sin juicio de color
  if (CLAVES_SIN_SEMAFORO.has(clave)) return "var(--muted)";
  // Para fc-reposo, hrv, sueno: subir es malo; para pasos: bajar es malo
  const subir_es_malo = clave === "fc-reposo";
  const bajar_es_malo = clave === "sueno" || clave === "hrv" || clave === "pasos";
  if (subir_es_malo) return deltaPct > 0 ? "var(--warning)" : "var(--accent)";
  if (bajar_es_malo)  return deltaPct < 0 ? "var(--warning)" : "var(--accent)";
  return "var(--muted)";
}

function SenalCard({
  senal,
  onClick,
}: {
  senal: SenalSalud;
  onClick: () => void;
}) {
  const color   = colorEstado(senal.estado);
  const flecha  = flechaTendencia(senal.deltaPct);
  const colFl   = colorFlecha(senal.clave, senal.deltaPct);
  const sparkData = senal.serie14d.map((p) => p.valor);
  const sinJuicio = CLAVES_SIN_SEMAFORO.has(senal.clave);

  return (
    <div
      className="card"
      style={{ cursor: "pointer", userSelect: "none" }}
      onClick={onClick}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 }}>
        <p className="t-label" style={{ margin: 0 }}>{NOMBRE_CLAVE[senal.clave]}</p>
        {!sinJuicio && (
          <span style={{
            width: 8, height: 8, borderRadius: "50%",
            background: color, flexShrink: 0, marginTop: 2,
          }} />
        )}
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
        <span style={{ fontWeight: 800, fontSize: 26, letterSpacing: "-.02em", lineHeight: 1 }}>
          {senal.valorTexto ?? (senal.valorActual != null ? senal.valorActual : "—")}
        </span>
        <span style={{ fontSize: 13, color: "var(--muted)", fontWeight: 500 }}>{senal.unidad}</span>
        {senal.deltaPct != null && (
          <span style={{ fontSize: 16, fontWeight: 700, color: colFl, marginLeft: "auto" }}>
            {flecha}
            {Math.abs(senal.deltaPct * 100) >= 1 &&
              ` ${Math.abs(senal.deltaPct * 100).toFixed(0)}%`
            }
          </span>
        )}
      </div>

      {sparkData.length >= 2 && (
        <div style={{ marginBottom: 6 }}>
          <Sparkline data={sparkData} color={sinJuicio ? "var(--muted)" : color} height={36} />
        </div>
      )}

      {senal.motivo && (senal.estado !== "ok" || sinJuicio) && (
        <p style={{ margin: 0, fontSize: 11, color: sinJuicio ? "var(--muted)" : color, lineHeight: 1.4 }}>
          {senal.motivo}
        </p>
      )}
    </div>
  );
}

export function ResumenTab({
  metricas, sueno, mediciones, hoy, onTabChange, metricasError, onReintentarMetricas,
}: {
  metricas:   MetricaSalud[];
  sueno:      RegistroSueno[];
  mediciones: MedicionCorporal[];
  hoy:        string;
  onTabChange: (tab: TabDestino) => void;
  metricasError?: string | null;
  onReintentarMetricas?: () => void;
}) {
  const senales = useMemo(
    () => calcularResumenSalud(metricas, sueno, mediciones, hoy),
    [metricas, sueno, mediciones, hoy],
  );

  // Accionables primero, informativas (peso/presión/spo2, sin semáforo) al final.
  const conValor = senales
    .filter((s) => s.valorActual != null)
    .sort((a, b) => Number(CLAVES_SIN_SEMAFORO.has(a.clave)) - Number(CLAVES_SIN_SEMAFORO.has(b.clave)));

  const avisoMetricas = metricasError && (
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
  );

  if (conValor.length === 0) {
    return (
      <div className="empty-state">
        {avisoMetricas}
        <p>Sin datos de salud todavía. Importá un ZIP desde Samsung Health para ver tu resumen.</p>
      </div>
    );
  }

  const peor = senalPeor(senales.filter((s) => !CLAVES_SIN_SEMAFORO.has(s.clave)));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {avisoMetricas}
      {peor !== "ok" && peor !== "sin-datos" && (
        <div style={{
          padding: "8px 12px", borderRadius: "var(--r-sm)", fontSize: 12,
          background: peor === "alerta" ? "var(--danger-dim)" : "var(--warning-dim)",
          color: peor === "alerta" ? "var(--danger)" : "var(--warning)",
          fontWeight: 600,
        }}>
          {peor === "alerta" ? "⚠ Hay señales que merecen atención" : "Revisá algunas tendencias"}
        </div>
      )}
      {conValor.map((senal) => (
        <SenalCard
          key={senal.clave}
          senal={senal}
          onClick={() => onTabChange(TAB_DESTINO[senal.clave])}
        />
      ))}
    </div>
  );
}
