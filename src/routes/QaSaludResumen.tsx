import { Link } from "react-router-dom";
import { ResumenCards } from "../components/salud/ResumenTab";
import type { SenalSalud } from "../lib/resumenSalud";

// Datos mockeados directamente como `SenalSalud[]` (mismo patrón que
// QaHomeRedux/HomeReduxContent): evita reconstruir fixtures crudos de
// Firestore solo para ver el resultado visual del rediseño (P64).

function serie(base: number, variacion: number, dias = 14): { fecha: string; valor: number }[] {
  return Array.from({ length: dias }, (_, i) => ({
    fecha: `2026-07-${String(i + 1).padStart(2, "0")}`,
    valor: base + Math.sin(i / 2) * variacion,
  }));
}

// ── Escenario 1: todo en verde ────────────────────────────────────────────────
const TODO_OK: SenalSalud[] = [
  { clave: "fc-reposo", valorActual: 58, unidad: "bpm", baseline: 59, deltaPct: -0.017, estado: "ok", serie14d: serie(58, 1.5) },
  { clave: "sueno",     valorActual: 7.4, unidad: "h",  baseline: 7.2, deltaPct: 0.028, estado: "ok", serie14d: serie(7.4, 0.4) },
  { clave: "peso",      valorActual: 84.6, unidad: "kg", baseline: 85.0, deltaPct: -0.005, estado: "ok", serie14d: serie(84.6, 0.3) },
  { clave: "presion",   valorActual: 118, valorTexto: "118/76", unidad: "mmHg", baseline: 119, deltaPct: -0.008, estado: "ok", serie14d: serie(118, 2), fechaUltima: "2026-07-06" },
  { clave: "spo2",      valorActual: 97, unidad: "%", baseline: 97, estado: "ok", serie14d: serie(97, 0.5), fechaUltima: "2026-07-07" },
];

// ── Escenario 2: mezcla — atención, alerta, motivos, sin tendencia ────────────
const MIXTO: SenalSalud[] = [
  {
    clave: "fc-reposo", valorActual: 68, unidad: "bpm", baseline: 60, deltaPct: 0.133, estado: "alerta",
    motivo: "FC reposo +8.0 bpm vs tus últimas 4 semanas", serie14d: serie(64, 3),
  },
  {
    clave: "sueno", valorActual: 6.1, unidad: "h", baseline: 7.3, deltaPct: -0.164, estado: "atencion",
    motivo: "Promedio 6.1 h/noche (últimas noches)", serie14d: serie(6.5, 0.8),
  },
  {
    // Peso con un solo punto: sin tendencia calculable — no debe mostrar hueco/flecha/sparkline.
    clave: "peso", valorActual: 91.2, unidad: "kg", estado: "ok", serie14d: [],
  },
  {
    // fechaUltima vieja a propósito: valida el formato del texto "medida el DD/MM"
    // (el filtro de recencia en sí vive en calcularResumenSalud, no en esta capa presentacional).
    clave: "presion", valorActual: 148, valorTexto: "148/94", unidad: "mmHg", baseline: 130, deltaPct: 0.138,
    estado: "ok", motivo: "Valor fuera del rango típico — vale la pena comentarlo con tu médico.",
    serie14d: serie(140, 4), fechaUltima: "2026-05-02",
  },
  {
    clave: "spo2", valorActual: 94, unidad: "%", baseline: 97, deltaPct: -0.031, estado: "ok",
    motivo: "Valor fuera del rango típico — vale la pena comentarlo con tu médico.",
    serie14d: serie(95, 1), fechaUltima: "2026-07-05",
  },
];

// ── Escenario 3: solo informativas (sin accionables con dato) ────────────────
const SOLO_INFORMATIVAS: SenalSalud[] = [
  { clave: "peso", valorActual: 78.3, unidad: "kg", estado: "ok", serie14d: [] },
  { clave: "spo2", valorActual: 98, unidad: "%", estado: "ok", serie14d: serie(98, 0.3), fechaUltima: "2026-07-08" },
];

const ESCENARIOS: { label: string; senales: SenalSalud[] }[] = [
  { label: "Todo en verde", senales: TODO_OK },
  { label: "Mezcla: alerta + atención + motivos + sin tendencia", senales: MIXTO },
  { label: "Solo informativas (peso + SpO2)", senales: SOLO_INFORMATIVAS },
  { label: "Sin datos", senales: [] },
];

export function QaSaludResumen() {
  return (
    <div style={{ minHeight: "100%", background: "#0f1013", padding: 24, boxSizing: "border-box" }}>
      <div style={{ marginBottom: 20, color: "#e6e7ea", fontFamily: "system-ui, sans-serif" }}>
        <h1 style={{ margin: 0, fontSize: 18 }}>QA — Salud · Resumen (P64)</h1>
        <p style={{ margin: "4px 0 0", fontSize: 12, color: "#9ca3af" }}>
          Cada columna es un ancho de teléfono (360px) — jerarquía, densidad, motivo visible.
        </p>
        <Link to="/" style={{ color: "#8b90ff", fontSize: 13 }}>← Volver a la app</Link>
      </div>

      <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
        {ESCENARIOS.map(({ label, senales }) => (
          <div key={label} style={{ width: 360, flexShrink: 0 }}>
            <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: "#e6e7ea", fontFamily: "system-ui, sans-serif" }}>
              {label}
            </p>
            <div className="page" style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 20, padding: 16 }}>
              <ResumenCards senales={senales} onTabChange={() => {}} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
