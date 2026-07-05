import { Sparkline } from "../Sparkline";
import { MiniChart } from "../MiniChart";
import type { RegistroSueno } from "../../types/models";

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="stat">
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

export function SuenoTab({ sueno }: { sueno: RegistroSueno[] }) {
  const conHoras = sueno.filter((r) => r.horas != null && r.horas > 0);

  if (conHoras.length === 0) {
    return (
      <div className="empty-state">
        <p>Sin datos de sueño. Importá un ZIP de Samsung Health.</p>
      </div>
    );
  }

  const ultimas7 = conHoras.slice(0, 7);
  const avg = ultimas7.reduce((s, r) => s + r.horas!, 0) / ultimas7.length;

  const byDay = new Map<string, number>();
  for (const r of conHoras) {
    byDay.set(r.fecha, Math.max(byDay.get(r.fecha) ?? 0, r.horas!));
  }
  const chartData = Array.from(byDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([fecha, horas]) => ({ label: fecha.slice(5), value: horas }));

  const sparkData = Array.from(byDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([, h]) => h);

  return (
    <>
      <div className="card">
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
          <div>
            <p style={{ margin: 0, fontWeight: 800, fontSize: 32, letterSpacing: "-.03em", lineHeight: 1 }}>
              {conHoras[0].horas!.toFixed(1)} <span style={{ fontSize: 16, fontWeight: 600, color: "var(--muted)" }}>h</span>
            </p>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--muted)" }}>última noche</p>
          </div>
          {sparkData.length >= 2 && (
            <div style={{ flex: 1, maxWidth: 120 }}>
              <Sparkline data={sparkData} color="var(--info)" height={36} />
            </div>
          )}
        </div>
        <div className="stats-row">
          <Stat value={`${avg.toFixed(1)} h`} label="promedio 7 noches" />
          <Stat value={String(conHoras.length)} label="registros" />
        </div>
        {chartData.length > 2 && (
          <div style={{ marginTop: 12 }}>
            <MiniChart data={chartData} color="var(--info)" />
          </div>
        )}
      </div>
      <div className="card">
        <p className="section-title" style={{ marginBottom: 10 }}>Historial ({conHoras.length})</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {conHoras.slice(0, 20).map((s) => (
            <div key={s.idSueno} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ color: "var(--muted)" }}>{s.fecha}</span>
              <span>
                {s.horas != null && `${s.horas.toFixed(1)} h`}
                {s.horaAcostarse && ` · acostó ${s.horaAcostarse}`}
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
