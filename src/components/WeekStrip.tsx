// src/components/WeekStrip.tsx — tira de 7 días para Home.
// Adaptado de Comidas-Familiares; usa tokens ShapeUp (--accent en lugar de --primary).

const DAY_LETTERS = ["L", "M", "M", "J", "V", "S", "D"] as const;

interface WeekStripProps {
  /** Lunes de la semana actual, formato "YYYY-MM-DD". */
  semanaInicio: string;
  /** Índices 0-6 (lunes=0) con sesión programada. */
  marcados?: number[];
}

function todayStr(): string {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
}

/** Tira semanal de 7 días con el día de hoy marcado y puntos en días con entrenamiento. */
export function WeekStrip({ semanaInicio, marcados = [] }: WeekStripProps) {
  const lunes  = new Date(semanaInicio + "T12:00:00");
  const today  = todayStr();
  const marked = new Set(marcados);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(lunes);
    d.setDate(lunes.getDate() + i);
    const ds = [d.getFullYear(), String(d.getMonth() + 1).padStart(2, "0"), String(d.getDate()).padStart(2, "0")].join("-");
    return { letter: DAY_LETTERS[i], n: d.getDate(), dateStr: ds };
  });

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
      {days.map((d, i) => {
        const isToday    = d.dateStr === today;
        const hasSesion  = marked.has(i);
        return (
          <div
            key={i}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              padding: "8px 0", borderRadius: 10,
              background: isToday ? "rgba(74,222,128,0.12)" : "transparent",
            }}
          >
            <span style={{
              fontSize: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: ".05em",
              color: isToday ? "var(--accent)" : "var(--muted)",
            }}>
              {d.letter}
            </span>
            <span style={{
              fontSize: 15, fontWeight: isToday ? 700 : 500,
              color: isToday ? "var(--accent)" : "var(--fg)",
            }}>
              {d.n}
            </span>
            {/* Punto: verde si sesión hoy, muted si sesión otro día, invisible si no */}
            <span style={{
              width: 4, height: 4, borderRadius: "50%",
              background: hasSesion
                ? (isToday ? "var(--accent)" : "var(--muted)")
                : "transparent",
            }} />
          </div>
        );
      })}
    </div>
  );
}
