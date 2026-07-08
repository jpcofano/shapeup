import { useState } from "react";
import type { SesionCardio, Historial } from "../../types/models";

const ZONA_META: { key: string; label: string }[] = [
  { key: "z1", label: "Z1 recuperación" },
  { key: "z2", label: "Z2 suave"        },
  { key: "z3", label: "Z3 aeróbico"     },
  { key: "z4", label: "Z4 umbral"       },
  { key: "z5", label: "Z5 máximo"       },
];

const MESES_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
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

function mesLabel(yyyyMm: string): string {
  const [y, m] = yyyyMm.split("-");
  return `${MESES_ES[parseInt(m, 10) - 1]} ${y}`;
}

function horaInicio(ms: number): string {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

interface MesGroup {
  mes: string; // "YYYY-MM"
  items: SesionCardio[];
}

function agruparPorMes(
  cardio: SesionCardio[],
  vinculadasIds: Set<string>,
): MesGroup[] {
  // Mapa mes → sesiones
  const byMes = new Map<string, SesionCardio[]>();
  for (const c of cardio) {
    const mes = c.fecha.slice(0, 7); // "YYYY-MM"
    const arr = byMes.get(mes) ?? [];
    arr.push(c);
    byMes.set(mes, arr);
  }
  // Ordenar sesiones dentro del mes: vinculadas primero, luego desc por fecha
  const groups: MesGroup[] = [];
  for (const [mes, items] of byMes) {
    const vinc = items.filter((c) => vinculadasIds.has(c.idCardio));
    const noVinc = items.filter((c) => !vinculadasIds.has(c.idCardio));
    groups.push({ mes, items: [...vinc, ...noVinc] });
  }
  // Ordenar grupos desc por mes
  return groups.sort((a, b) => b.mes.localeCompare(a.mes));
}

const MESES_POR_PAG = 3;

export function CardioTab({ cardio, historial }: { cardio: SesionCardio[]; historial: Historial[] }) {
  const [mesesVisibles, setMesesVisibles] = useState(MESES_POR_PAG);

  if (cardio.length === 0) {
    return (
      <div className="empty-state">
        <p>Sin sesiones de cardio. Importá un ZIP de Samsung Health.</p>
      </div>
    );
  }

  const vinculadasIds = new Set<string>(
    historial
      .filter((h) => h.biometria?.datauuidSamsung)
      .map((h) => `CAR-${h.biometria!.datauuidSamsung}`),
  );
  const totalVinculadas = cardio.filter((c) => vinculadasIds.has(c.idCardio)).length;

  // Distribución de tiempo por zona FC
  const minPorZona: Record<string, number> = {};
  let totalMin = 0;
  for (const c of cardio) {
    if (!c.zonaPrincipal || !c.duracionMin) continue;
    const k = c.zonaPrincipal.toLowerCase();
    minPorZona[k] = (minPorZona[k] ?? 0) + c.duracionMin;
    totalMin += c.duracionMin;
  }

  const grupos = agruparPorMes(cardio, vinculadasIds);
  const gruposVisibles = grupos.slice(0, mesesVisibles);
  const hayMas = grupos.length > mesesVisibles;

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

        <p className="section-title" style={{ marginBottom: 10 }}>
          SESIONES ({cardio.length}
          {totalVinculadas > 0 && ` · ${totalVinculadas} vinculadas`})
        </p>

        {gruposVisibles.map(({ mes, items }) => (
          <div key={mes} style={{ marginBottom: 16 }}>
            <p style={{
              margin: "0 0 8px", fontSize: 11, fontWeight: 700,
              color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em",
            }}>
              {mesLabel(mes)}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {items.map((c) => {
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
                        <span style={{ color: "var(--muted)", fontSize: 12 }}>{c.fecha.slice(8)}</span>
                      </div>
                    </div>
                    <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 3 }}>
                      {c.inicioMs   != null && `${horaInicio(c.inicioMs)} · `}
                      {c.duracionMin != null && `${Math.round(c.duracionMin)} min`}
                      {c.kcal       != null && ` · ${Math.round(c.kcal)} kcal`}
                      {c.fcPromedio != null && ` · FC ${Math.round(c.fcPromedio)} bpm`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {hayMas && (
          <button
            className="btn-secondary"
            style={{ width: "100%", marginTop: 4, fontSize: 13 }}
            onClick={() => setMesesVisibles((v) => v + MESES_POR_PAG)}
          >
            Ver más ({grupos.length - mesesVisibles} {grupos.length - mesesVisibles === 1 ? "mes" : "meses"} más)
          </button>
        )}
      </div>
    </>
  );
}
