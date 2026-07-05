import { MiniChart } from "../MiniChart";
import { Sparkline } from "../Sparkline";
import type { MedicionCorporal, Historial } from "../../types/models";

export function ProgresoTab({
  mediciones,
  historial,
}: {
  mediciones: MedicionCorporal[];
  historial: Historial[];
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
      <div className="card">
        <p className="section-title" style={{ marginBottom: 10 }}>Tendencia de peso</p>
        {mediciones.length < 2 ? (
          <p style={{ color: "var(--muted)", fontSize: 13 }}>Necesitás al menos 2 registros para ver tendencia.</p>
        ) : (
          <div className="stats-row" style={{ gap: 20 }}>
            <div>
              <p style={{ margin: 0, fontWeight: 700 }}>{mediciones[0].pesoKg ?? "-"} kg</p>
              {pesoTrend !== null && (
                <p style={{ margin: 0, fontSize: 12, color: pesoTrend < 0 ? "var(--accent)" : pesoTrend > 0 ? "var(--danger)" : "var(--muted)" }}>
                  {pesoTrend > 0 ? "+" : ""}{pesoTrend.toFixed(1)} kg vs anterior
                </p>
              )}
              <p style={{ margin: 0, fontSize: 11, color: "var(--muted)" }}>peso</p>
            </div>
            {mediciones[0].grasaPct != null && (
              <div>
                <p style={{ margin: 0, fontWeight: 700 }}>{mediciones[0].grasaPct}%</p>
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
