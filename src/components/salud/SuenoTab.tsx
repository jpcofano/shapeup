import { Sparkline } from "../Sparkline";
import { MiniChart } from "../MiniChart";
import type { RegistroSueno } from "../../types/models";
import { consolidarNoches, promedioNoches, nochesEnVentana } from "../../lib/sueno";
import { ymdLocal } from "../../lib/semana";

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="stat">
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

export function SuenoTab({ sueno }: { sueno: RegistroSueno[] }) {
  const noches = consolidarNoches(sueno);

  if (noches.length === 0) {
    return (
      <div className="empty-state">
        <p>Sin datos de sueño. Importá un ZIP de Samsung Health.</p>
      </div>
    );
  }

  const ultima = noches[0];
  const prom7  = promedioNoches(noches, 7);

  // Noches con dato en los últimos 30 días (anclado en hoy real, no en la última noche)
  const nochesUlt30 = nochesEnVentana(noches, ymdLocal(), 30);

  // Gráfico: últimas 14 fechas con dato
  const chartData = noches.slice(0, 14)
    .reverse()
    .map((n) => ({ label: n.fecha.slice(5), value: n.horasTotal }));

  const sparkData = chartData.map((d) => d.value);

  // Rango de la última noche
  const rangoUltima = ultima.horaAcostarse && ultima.horaLevantarse
    ? `${ultima.horaAcostarse} → ${ultima.horaLevantarse}`
    : ultima.horaAcostarse
    ? `desde ${ultima.horaAcostarse}`
    : undefined;

  return (
    <>
      <div className="card">
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
          <div>
            <p style={{ margin: 0, fontWeight: 800, fontSize: 32, letterSpacing: "-.03em", lineHeight: 1 }}>
              {ultima.horasTotal.toFixed(1)} <span style={{ fontSize: 16, fontWeight: 600, color: "var(--muted)" }}>h</span>
            </p>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--muted)" }}>
              última noche{rangoUltima ? ` · ${rangoUltima}` : ""}
            </p>
          </div>
          {sparkData.length >= 2 && (
            <div style={{ flex: 1, maxWidth: 120 }}>
              <Sparkline data={sparkData} color="var(--info)" height={36} />
            </div>
          )}
        </div>
        <div className="stats-row">
          {prom7 != null && <Stat value={`${prom7} h`} label="promedio 7 noches" />}
          <Stat value={String(nochesUlt30)} label="noches (últ. 30 días)" />
        </div>
        {chartData.length > 2 && (
          <div style={{ marginTop: 12 }}>
            <MiniChart data={chartData} color="var(--info)" />
          </div>
        )}
      </div>
      <div className="card">
        <p className="section-title" style={{ marginBottom: 10 }}>Historial</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {noches.slice(0, 30).map((n) => {
            const rango = n.horaAcostarse && n.horaLevantarse
              ? `${n.horaAcostarse} → ${n.horaLevantarse}`
              : n.horaAcostarse ? `desde ${n.horaAcostarse}` : undefined;
            return (
              <div key={n.fecha}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: "var(--muted)" }}>{n.fecha}</span>
                  <span>
                    {n.horasTotal.toFixed(1)} h
                    {rango && <span style={{ color: "var(--muted)" }}> · {rango}</span>}
                    {n.tramos > 1 && <span style={{ color: "var(--muted)" }}> · {n.tramos} tramos</span>}
                  </span>
                </div>
                {n.horasSiesta != null && (
                  <p style={{ margin: "1px 0 0 0", fontSize: 11, color: "var(--muted)" }}>
                    incl. siesta {n.horasSiesta.toFixed(1)} h
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
