import type { SesionCardio, Historial } from "../../types/models";

const ZONA_META: { key: string; label: string }[] = [
  { key: "z1", label: "Z1 recuperación" },
  { key: "z2", label: "Z2 suave"        },
  { key: "z3", label: "Z3 aeróbico"     },
  { key: "z4", label: "Z4 umbral"       },
  { key: "z5", label: "Z5 máximo"       },
];

function ZonaChip({ zona }: { zona: string }) {
  const key = zona.toLowerCase();
  return (
    <span style={{
      padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 600,
      background: `var(--zona-${key}-dim)`,
      color:      `var(--zona-${key})`,
    }}>
      {zona}
    </span>
  );
}

export function CardioTab({ cardio, historial }: { cardio: SesionCardio[]; historial: Historial[] }) {
  if (cardio.length === 0) {
    return (
      <div className="empty-state">
        <p>Sin sesiones de cardio. Importá un ZIP de Samsung Health.</p>
      </div>
    );
  }

  // Set de idCardio referenciados por algún historial (para badge "vinculada").
  // idCardio = "CAR-{datauuidSamsung}", datauuidSamsung es el UUID crudo.
  const vinculadasIds = new Set<string>(
    historial
      .filter((h) => h.biometria?.datauuidSamsung)
      .map((h) => `CAR-${h.biometria!.datauuidSamsung}`),
  );

  // Vinculadas primero, luego el resto.
  const vinculadas   = cardio.filter((c) => vinculadasIds.has(c.idCardio));
  const noVinculadas = cardio.filter((c) => !vinculadasIds.has(c.idCardio));
  const ordenado     = [...vinculadas, ...noVinculadas];

  // Distribución de tiempo por zona FC
  const minPorZona: Record<string, number> = {};
  let totalMin = 0;
  for (const c of cardio) {
    if (!c.zonaPrincipal || !c.duracionMin) continue;
    const k = c.zonaPrincipal.toLowerCase();
    minPorZona[k] = (minPorZona[k] ?? 0) + c.duracionMin;
    totalMin += c.duracionMin;
  }

  return (
    <>
      {totalMin > 0 && (
        <div className="card" style={{ marginBottom: 0 }}>
          <p className="section-title" style={{ marginBottom: 8 }}>Distribución por zona</p>
          <div style={{ display: "flex", height: 10, borderRadius: 999, overflow: "hidden", gap: 1, marginBottom: 10 }}>
            {ZONA_META.map(({ key }) => {
              const pct = ((minPorZona[key] ?? 0) / totalMin) * 100;
              if (pct < 1) return null;
              return (
                <div key={key} style={{
                  width: `${pct}%`, height: "100%",
                  background: `var(--zona-${key})`, minWidth: 3,
                }} />
              );
            })}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {ZONA_META.map(({ key, label }) => {
              const min = minPorZona[key] ?? 0;
              if (min === 0) return null;
              return (
                <span key={key} style={{
                  fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 999,
                  background: `var(--zona-${key}-dim)`, color: `var(--zona-${key})`,
                }}>
                  {label} · {Math.round(min / 60)}h
                </span>
              );
            })}
          </div>
        </div>
      )}

      <div className="card">
        {!totalMin && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
            {ZONA_META.map(({ key, label }) => (
              <span key={key} style={{
                fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 999,
                background: `var(--zona-${key}-dim)`, color: `var(--zona-${key})`,
              }}>{label}</span>
            ))}
          </div>
        )}

        <p className="section-title" style={{ marginBottom: 10 }}>Sesiones ({cardio.length})</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {ordenado.slice(0, 30).map((c) => {
            const esVinculada = vinculadasIds.has(c.idCardio);
            return (
              <div key={c.idCardio} style={{ fontSize: 13 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {c.actividad}
                    </strong>
                    {esVinculada && (
                      <span style={{
                        fontSize: 10, fontWeight: 600, color: "var(--accent)",
                        display: "inline-block", marginTop: 2,
                      }}>
                        vinculada a entrenamiento
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                    {c.zonaPrincipal && <ZonaChip zona={c.zonaPrincipal} />}
                    <span style={{ color: "var(--muted)", fontSize: 12 }}>{c.fecha}</span>
                  </div>
                </div>
                <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 3 }}>
                  {c.duracionMin != null && `${c.duracionMin} min`}
                  {c.kcal        != null && ` · ${c.kcal} kcal`}
                  {c.fcPromedio  != null && ` · FC ~${c.fcPromedio}`}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
