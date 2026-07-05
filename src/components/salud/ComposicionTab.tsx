import { Sparkline } from "../Sparkline";
import { MiniChart } from "../MiniChart";
import type { MedicionCorporal } from "../../types/models";

function DeltaLine({ current, prev, label, invert = false }: {
  current: number; prev: number; label: string; invert?: boolean;
}) {
  const delta = current - prev;
  const mejora = invert ? delta > 0 : delta < 0;
  if (delta === 0) return null;
  return (
    <p style={{ margin: "1px 0 0", fontSize: 12,
      color: mejora ? "var(--accent)" : "var(--danger)" }}>
      {delta > 0 ? "+" : ""}{delta.toFixed(1)} {label} vs anterior
    </p>
  );
}

function hace(fecha: string): string {
  const diff = Math.floor((Date.now() - new Date(fecha + "T12:00:00").getTime()) / 86_400_000);
  if (diff <= 0) return "hoy";
  if (diff === 1) return "ayer";
  return `hace ${diff} días`;
}

export function ComposicionTab({ mediciones }: { mediciones: MedicionCorporal[] }) {
  if (mediciones.length === 0) {
    return (
      <div className="empty-state">
        <p>Sin datos de composición. Importá un ZIP de Samsung Health o cargá manualmente.</p>
      </div>
    );
  }
  const last = mediciones[0];
  const prev = mediciones[1] ?? null;

  const hace30Str = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);
  const med30 = [...mediciones].filter((m) => m.fecha >= hace30Str && m.pesoKg != null).reverse();
  const sparkData = med30.map((m) => m.pesoKg!);

  return (
    <>
      <div className="card">
        <p className="t-label" style={{ marginBottom: 4 }}>Peso — {hace(last.fecha)}</p>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginBottom: sparkData.length >= 2 ? 10 : 0 }}>
          <p style={{ margin: 0, fontWeight: 800, fontSize: 32, letterSpacing: "-.03em", lineHeight: 1 }}>
            {last.pesoKg ?? "—"} <span style={{ fontSize: 16, fontWeight: 600, color: "var(--muted)" }}>kg</span>
          </p>
          {prev?.pesoKg != null && last.pesoKg != null && (
            <DeltaLine current={last.pesoKg} prev={prev.pesoKg} label="kg" />
          )}
        </div>
        {sparkData.length >= 2 && (
          <>
            <Sparkline data={sparkData} color="var(--accent)" height={52} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
              <span style={{ fontSize: 9, color: "var(--muted)" }}>
                {med30[0].fecha.slice(5)} · {med30[0].pesoKg} kg
              </span>
              <span style={{ fontSize: 9, color: "var(--muted)" }}>
                {med30[med30.length - 1].fecha.slice(5)} · {med30[med30.length - 1].pesoKg} kg
              </span>
            </div>
          </>
        )}
      </div>

      <div className="card">
        <p className="section-title" style={{ marginBottom: 10 }}>Composición corporal</p>
        <div className="stats-row" style={{ flexWrap: "wrap", gap: 20, alignItems: "flex-start" }}>
          {last.grasaPct != null && (
            <div>
              <p style={{ margin: 0, fontWeight: 800, fontSize: 20 }}>{last.grasaPct.toFixed(1)}%</p>
              {prev?.grasaPct != null && <DeltaLine current={last.grasaPct} prev={prev.grasaPct} label="%" />}
              <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".05em" }}>grasa</p>
              <p style={{ margin: "1px 0 0", fontSize: 10, color: "var(--muted)" }}>{hace(last.fecha)}</p>
            </div>
          )}
          {last.masaMuscularKg != null && (
            <div>
              <p style={{ margin: 0, fontWeight: 800, fontSize: 20 }}>{last.masaMuscularKg.toFixed(1)} kg</p>
              {prev?.masaMuscularKg != null && <DeltaLine current={last.masaMuscularKg} prev={prev.masaMuscularKg} label="kg" invert />}
              <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".05em" }}>músculo</p>
              <p style={{ margin: "1px 0 0", fontSize: 10, color: "var(--muted)" }}>{hace(last.fecha)}</p>
            </div>
          )}
          {last.imc != null && (
            <div>
              <p style={{ margin: 0, fontWeight: 800, fontSize: 20 }}>{last.imc.toFixed(1)}</p>
              <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".05em" }}>IMC</p>
              <p style={{ margin: "1px 0 0", fontSize: 10, color: "var(--muted)" }}>{hace(last.fecha)}</p>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <p className="section-title" style={{ marginBottom: 8 }}>Última medición</p>
        <p style={{ margin: "0 0 8px", fontSize: 12, color: "var(--muted)" }}>{last.fecha} · {hace(last.fecha)}</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px", fontSize: 13 }}>
          {last.pesoKg         != null && <span><span style={{ color: "var(--muted)" }}>Peso </span>{last.pesoKg} kg</span>}
          {last.grasaPct       != null && <span><span style={{ color: "var(--muted)" }}>Grasa </span>{last.grasaPct.toFixed(1)}%</span>}
          {last.masaMuscularKg != null && <span><span style={{ color: "var(--muted)" }}>Músculo </span>{last.masaMuscularKg.toFixed(1)} kg</span>}
          {last.aguaPct        != null && <span><span style={{ color: "var(--muted)" }}>Agua </span>{last.aguaPct.toFixed(1)}%</span>}
        </div>
      </div>

      <div className="card">
        <p className="section-title" style={{ marginBottom: 10 }}>Historial ({mediciones.length})</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {mediciones.slice(0, 20).map((m) => (
            <div key={m.idMedicion} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ color: "var(--muted)" }}>{m.fecha}</span>
              <span>
                {m.pesoKg         != null && `${m.pesoKg} kg`}
                {m.grasaPct       != null && ` · ${m.grasaPct.toFixed(1)}%`}
                {m.masaMuscularKg != null && ` · ${m.masaMuscularKg.toFixed(1)} kg M`}
              </span>
            </div>
          ))}
        </div>
      </div>

      {mediciones.length > 2 && (
        <div className="card">
          <p className="section-title" style={{ marginBottom: 8 }}>Tendencia 12 registros</p>
          <MiniChart
            data={mediciones.slice(0, 12).reverse().map((m) => ({ label: m.fecha.slice(5), value: m.pesoKg ?? 0 }))}
            color="var(--accent)"
          />
        </div>
      )}
    </>
  );
}
