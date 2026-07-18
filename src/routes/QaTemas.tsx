import { Link } from "react-router-dom";
import { AlertTriangle, Info, Lightbulb } from "lucide-react";
import type { ThemeName, Modo } from "../contexts/ThemeProvider";

// QA visual de los 5 temas × {claro, oscuro} (P65 Fix 1) — sin login: cada
// celda aplica [data-theme]/[data-mode] localmente (mismo patrón que
// QaHomeRedux aplica [data-accent]/[data-mode] por celda). Sirve para
// chequear a ojo que ningún texto/ícono quede ilegible al pasar a claro.

const TEMAS: ThemeName[] = ["ion", "volt", "blaze", "pulse", "indigo"];
const MODOS: Modo[] = ["dark", "light"];

function Muestra({ tema, modo }: { tema: ThemeName; modo: Modo }) {
  return (
    <div
      data-theme={tema}
      data-mode={modo}
      style={{
        background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 16,
        padding: 16, display: "flex", flexDirection: "column", gap: 10, width: 300,
      }}
    >
      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".05em" }}>
        {tema} · {modo === "dark" ? "oscuro" : "claro"}
      </span>

      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
        <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: "var(--fg)" }}>Título de card</p>
        <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>Texto secundario — debe leerse cómodo en los dos modos.</p>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button style={{ background: "var(--accent)", color: "var(--on-accent)", border: "none", borderRadius: 10, padding: "8px 14px", fontWeight: 700, fontSize: 13 }}>
            Botón primario
          </button>
          <span style={{ background: "var(--accent-dim)", color: "var(--accent)", borderRadius: 999, padding: "6px 12px", fontWeight: 700, fontSize: 12 }}>
            Chip acento
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 4 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--danger)", fontSize: 12, fontWeight: 600 }}>
            <AlertTriangle size={13} /> Alerta (texto directo)
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--warning)", fontSize: 12, fontWeight: 600 }}>
            <Lightbulb size={13} /> Atención (texto directo)
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--info)", fontSize: 12, fontWeight: 600 }}>
            <Info size={13} /> Info (texto directo)
          </span>
        </div>
      </div>
    </div>
  );
}

export function QaTemas() {
  return (
    <div style={{ minHeight: "100%", background: "#0f1013", padding: 24, boxSizing: "border-box" }}>
      <div style={{ marginBottom: 20, color: "#e6e7ea", fontFamily: "system-ui, sans-serif" }}>
        <h1 style={{ margin: 0, fontSize: 18 }}>QA — Temas (P65)</h1>
        <p style={{ margin: "4px 0 0", fontSize: 12, color: "#9ca3af" }}>
          5 temas × {"{"}oscuro, claro{"}"} — contraste AA de texto/íconos semánticos, botón primario y chip de acento.
        </p>
        <Link to="/" style={{ color: "#8b90ff", fontSize: 13 }}>← Volver a la app</Link>
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {TEMAS.flatMap((tema) => MODOS.map((modo) => <Muestra key={`${tema}-${modo}`} tema={tema} modo={modo} />))}
      </div>
    </div>
  );
}
