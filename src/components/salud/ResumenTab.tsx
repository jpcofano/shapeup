import { useMemo } from "react";
import { Sparkline } from "../Sparkline";
import { calcularResumenSalud, senalPeor, CLAVES_SIN_SEMAFORO } from "../../lib/resumenSalud";
import type { SenalSalud, EstadoSenal } from "../../lib/resumenSalud";
import type { MetricaSalud, RegistroSueno, MedicionCorporal } from "../../types/models";

export type TabDestino = "composicion" | "cardio" | "sueno" | "progreso";

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

function colorEstado(estado: EstadoSenal): string {
  if (estado === "alerta")    return "var(--danger)";
  if (estado === "atencion")  return "var(--warning)";
  if (estado === "ok")        return "var(--accent)";
  return "var(--muted)";
}

// `null` (no solo el string "—") a propósito: sin tendencia calculable no hay
// nada que mostrar, ni siquiera un guion suelto flotando junto al valor.
function flechaTendencia(deltaPct: number | undefined): "↑" | "↓" | null {
  if (deltaPct == null || Math.abs(deltaPct) < 0.02) return null;
  return deltaPct > 0 ? "↑" : "↓";
}

function fechaCorta(fecha: string): string {
  const [, mes, dia] = fecha.split("-");
  return `${dia}/${mes}`;
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
  compacta,
  onClick,
}: {
  senal: SenalSalud;
  compacta?: boolean;
  onClick: () => void;
}) {
  const color   = colorEstado(senal.estado);
  const flecha  = flechaTendencia(senal.deltaPct);
  const colFl   = colorFlecha(senal.clave, senal.deltaPct);
  const sparkData = senal.serie14d.map((p) => p.valor);
  const sinJuicio = CLAVES_SIN_SEMAFORO.has(senal.clave);
  const mostrarMotivo = senal.motivo != null && (senal.estado !== "ok" || sinJuicio);

  return (
    <div
      className="card"
      style={{
        cursor: "pointer", userSelect: "none", position: "relative", overflow: "hidden",
        padding: compacta ? "10px 12px" : 16,
      }}
      onClick={onClick}
    >
      {/* Sparkline de fondo, mitad inferior de la card, sutil — nunca compite con el valor. */}
      {sparkData.length >= 2 && (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "50%", opacity: 0.28, pointerEvents: "none" }}>
          <Sparkline data={sparkData} color={sinJuicio ? "var(--muted)" : color} height={compacta ? 26 : 40} />
        </div>
      )}

      <div style={{ position: "relative" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 }}>
          <p className="t-label" style={{ margin: 0, fontSize: compacta ? 10 : undefined }}>{NOMBRE_CLAVE[senal.clave]}</p>
          {!sinJuicio && (
            <span style={{
              width: 8, height: 8, borderRadius: "50%",
              background: color, flexShrink: 0, marginTop: 2,
            }} />
          )}
        </div>

        <div style={{ display: "flex", alignItems: "baseline", flexWrap: "wrap", gap: 6, rowGap: 0 }}>
          <span style={{ fontWeight: 800, fontSize: compacta ? 19 : 26, letterSpacing: "-.02em", lineHeight: 1, whiteSpace: "nowrap" }}>
            {senal.valorTexto ?? (senal.valorActual != null ? senal.valorActual : "—")}
          </span>
          <span style={{ fontSize: compacta ? 11 : 13, color: "var(--muted)", fontWeight: 500, whiteSpace: "nowrap" }}>{senal.unidad}</span>
          {flecha && (
            <span style={{ fontSize: compacta ? 12 : 16, fontWeight: 700, color: colFl, whiteSpace: "nowrap" }}>
              {flecha}
              {Math.abs(senal.deltaPct! * 100) >= 1 &&
                ` ${Math.abs(senal.deltaPct! * 100).toFixed(0)}%`
              }
            </span>
          )}
        </div>

        {senal.fechaUltima && (
          <p style={{ margin: "2px 0 0", fontSize: 10, color: "var(--muted)" }}>
            medida el {fechaCorta(senal.fechaUltima)}
          </p>
        )}

        {mostrarMotivo && (
          <p style={{ margin: "4px 0 0", fontSize: 11, color: sinJuicio ? "var(--muted)" : color, lineHeight: 1.4 }}>
            {senal.motivo}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Presentacional pura: recibe `senales` ya calculadas. Separada de `ResumenTab`
 * para que la ruta de QA (`/qa/salud-resumen`) pueda mockear directamente los
 * datos de entrada sin reconstruir fixtures crudos de Firestore (mismo patrón
 * que `HomeReduxContent`/`QaHomeRedux`).
 */
export function ResumenCards({
  senales, onTabChange, metricasError, onReintentarMetricas,
}: {
  senales: SenalSalud[];
  onTabChange: (tab: TabDestino) => void;
  metricasError?: string | null;
  onReintentarMetricas?: () => void;
}) {
  const conValor = senales.filter((s) => s.valorActual != null);
  // Accionables (FC reposo, sueño, HRV, pasos) a tamaño completo; informativas
  // (peso/presión/spo2, sin semáforo) en grilla compacta de 2 columnas.
  const accionables  = conValor.filter((s) => !CLAVES_SIN_SEMAFORO.has(s.clave));
  const informativas = conValor.filter((s) => CLAVES_SIN_SEMAFORO.has(s.clave));

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
      {accionables.map((senal) => (
        <SenalCard
          key={senal.clave}
          senal={senal}
          onClick={() => onTabChange(TAB_DESTINO[senal.clave])}
        />
      ))}
      {informativas.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {informativas.map((senal) => (
            <SenalCard
              key={senal.clave}
              senal={senal}
              compacta
              onClick={() => onTabChange(TAB_DESTINO[senal.clave])}
            />
          ))}
        </div>
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

  return (
    <ResumenCards
      senales={senales}
      onTabChange={onTabChange}
      metricasError={metricasError}
      onReintentarMetricas={onReintentarMetricas}
    />
  );
}
