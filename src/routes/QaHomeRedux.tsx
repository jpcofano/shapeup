import { useState } from "react";
import { Link } from "react-router-dom";
import { Moon } from "lucide-react";
import type { HomeReduxData, HomeReduxDireccion } from "../components/homeRedux/HomeReduxContent";
import { HomeReduxContent } from "../components/homeRedux/HomeReduxContent";
import type { ThemeName } from "../contexts/ThemeProvider";

const DIRECCIONES: HomeReduxDireccion[] = ["pulse", "premium"];
const MODOS: ("light" | "dark")[] = ["dark", "light"];
const ACENTOS: ThemeName[] = ["ion", "volt", "blaze", "indigo", "pulse"];

const WEEK_CHIPS = [
  { letter: "L", fecha: "mock-0", estado: "done" as const },
  { letter: "M", fecha: "mock-1", estado: "done" as const },
  { letter: "X", fecha: "mock-2", estado: "today" as const },
  { letter: "J", fecha: "mock-3", estado: "pending" as const },
  { letter: "V", fecha: "mock-4", estado: "pending" as const },
  { letter: "S", fecha: "mock-5", estado: "pending" as const },
  { letter: "D", fecha: "mock-6", estado: "pending" as const },
];

function mockData(delta: string, deltaFavorable: boolean): HomeReduxData {
  return {
    primerNombre: "Juan",
    avatarIniciales: "JP",
    sesHechas: 2,
    sesObj: 4,
    diaLabel: "Día 3 de 4 · esta semana",
    hero: {
      icon: Moon,
      tag: "Hoy · miércoles",
      title: "Día de descanso",
      message: "Recuperá. La recuperación también es parte del entrenamiento.",
      buttons: [{ label: "Entrenar igual", variant: "secondary" }],
    },
    metrics: {
      volumen: "3.960",
      volumenSub: "kg semana",
      peso: { valor: "84.6", delta, deltaFavorable },
      racha: 3,
    },
    weekLabel: "Movilidad y recuperación",
    weekChips: WEEK_CHIPS,
  };
}

/**
 * Dos sets de mock: delta desfavorable (rojo, +0.4 kg) y delta favorable
 * (verde, -0.4 kg). El caso crítico semántico que motivó la validación —
 * Volt (acento verde) activo + delta positivo — antes no se veía en ninguna
 * de las 20 combinaciones porque el mock único siempre era desfavorable.
 * Ahora cada combinación se renderiza dos veces (una por set) y la celda
 * acento=volt del set favorable queda además destacada.
 */
const MOCK_NEG = mockData("+0.4 kg", false);
const MOCK_POS = mockData("-0.4 kg", true);
const SETS: { label: string; data: HomeReduxData }[] = [
  { label: "Delta desfavorable (rojo)", data: MOCK_NEG },
  { label: "Delta favorable (verde) — caso crítico Volt", data: MOCK_POS },
];

export function QaHomeRedux() {
  const [grises, setGrises] = useState(false);

  return (
    <div style={{ minHeight: "100%", background: "#202127", padding: 24, boxSizing: "border-box" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, color: "#e6e7ea", fontFamily: "system-ui, sans-serif" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 18 }}>QA — Home Redux</h1>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#9ca3af" }}>
            20 combinaciones (2 direcciones × 2 modos × 5 acentos) × 2 sets de delta
            (rojo/verde) · caso crítico Volt (acento verde) + delta positivo (verde)
            destacado con borde punteado en el segundo bloque.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
            <input type="checkbox" checked={grises} onChange={(e) => setGrises(e.target.checked)} />
            Escala de grises
          </label>
          <Link to="/" style={{ color: "#8b90ff", fontSize: 13 }}>← Volver a la app</Link>
        </div>
      </div>

      {SETS.map(({ label, data }) => (
        <section key={label} style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: "#e6e7ea", fontFamily: "system-ui, sans-serif", margin: "0 0 12px" }}>
            {label}
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 20,
              filter: grises ? "grayscale(1)" : "none",
            }}
          >
            {DIRECCIONES.flatMap((direccion) =>
              MODOS.flatMap((modo) =>
                ACENTOS.map((acento) => {
                  const esCasoCritico = data === MOCK_POS && acento === "volt";
                  return (
                    <div key={`${direccion}-${modo}-${acento}`} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: esCasoCritico ? "#4ade80" : "#9ca3af", fontFamily: "system-ui, sans-serif" }}>
                        {direccion === "pulse" ? "Pulse" : "Premium"} · {modo === "dark" ? "Oscuro" : "Claro"} · {acento}
                        {esCasoCritico ? " · caso crítico" : ""}
                      </span>
                      <div
                        className={direccion === "pulse" ? "dir-a" : "dir-c v21"}
                        data-mode={modo}
                        data-accent={acento}
                        style={{
                          background: "var(--bg)",
                          border: esCasoCritico ? "2px dashed #4ade80" : "1px solid var(--border)",
                          borderRadius: 20,
                          padding: 16,
                          display: "flex",
                          flexDirection: "column",
                          gap: 12,
                        }}
                      >
                        <HomeReduxContent direccion={direccion} data={data} />
                      </div>
                    </div>
                  );
                }),
              ),
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
