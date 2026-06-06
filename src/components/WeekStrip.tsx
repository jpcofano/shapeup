import { Bicep } from "./Bicep";

const DAY_LETTERS = ["L", "M", "M", "J", "V", "S", "D"] as const;

interface WeekStripProps {
  semanaInicio: string;
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
        const isToday   = d.dateStr === today;
        const hasSesion = marked.has(i);
        return (
          <div
            key={i}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              padding: "8px 0", borderRadius: 10,
              background: isToday ? "var(--accent-dim)" : "transparent",
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
            {/* Bíceps: lleno hoy, semitransparente otros días de sesión */}
            <span style={{
              color: "var(--accent)",
              opacity: hasSesion ? (isToday ? 1 : 0.45) : 0,
              lineHeight: 0,
            }}>
              <Bicep size={13} />
            </span>
          </div>
        );
      })}
    </div>
  );
}
