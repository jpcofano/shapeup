import { useState } from "react";
import { Link } from "react-router-dom";
import { Moon } from "lucide-react";
import type { HomeReduxData, HomeReduxDireccion } from "../components/homeRedux/HomeReduxContent";
import { HomeReduxContent } from "../components/homeRedux/HomeReduxContent";
import type { HomeReduxAcento } from "../lib/homeReduxPrefs";

const DIRECCIONES: HomeReduxDireccion[] = ["pulse", "premium"];
const MODOS: ("light" | "dark")[] = ["dark", "light"];
const ACENTOS: HomeReduxAcento[] = ["ion", "volt", "blaze", "indigo", "pulse"];

/**
 * Datos mock fijos (los del prototipo del handoff). Incluye a propósito un delta
 * de peso "desfavorable" (+0.4 kg → badge rojo) para el caso crítico semántico
 * pedido en el README: Volt (acento verde) activo + delta negativo visible sin
 * colisión de color.
 */
const MOCK_DATA: HomeReduxData = {
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
    peso: { valor: "84.6", delta: "+0.4 kg", deltaFavorable: false },
    racha: 3,
  },
  weekLabel: "Movilidad y recuperación",
  weekChips: [
    { letter: "L", fecha: "mock-0", estado: "done" },
    { letter: "M", fecha: "mock-1", estado: "done" },
    { letter: "X", fecha: "mock-2", estado: "today" },
    { letter: "J", fecha: "mock-3", estado: "pending" },
    { letter: "V", fecha: "mock-4", estado: "pending" },
    { letter: "S", fecha: "mock-5", estado: "pending" },
    { letter: "D", fecha: "mock-6", estado: "pending" },
  ],
};

export function QaHomeRedux() {
  const [grises, setGrises] = useState(false);

  return (
    <div style={{ minHeight: "100%", background: "#202127", padding: 24, boxSizing: "border-box" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, color: "#e6e7ea", fontFamily: "system-ui, sans-serif" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 18 }}>QA — Home Redux</h1>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#9ca3af" }}>
            20 combinaciones (2 direcciones × 2 modos × 5 acentos) · datos mock ·
            caso crítico Volt+delta desfavorable incluido en todas las tarjetas.
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
            ACENTOS.map((acento) => (
              <div key={`${direccion}-${modo}-${acento}`} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", fontFamily: "system-ui, sans-serif" }}>
                  {direccion === "pulse" ? "Pulse" : "Premium"} · {modo === "dark" ? "Oscuro" : "Claro"} · {acento}
                </span>
                <div
                  className={direccion === "pulse" ? "dir-a" : "dir-c v21"}
                  data-mode={modo}
                  data-accent={acento}
                  style={{
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                    borderRadius: 20,
                    padding: 16,
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  <HomeReduxContent direccion={direccion} data={MOCK_DATA} />
                </div>
              </div>
            )),
          ),
        )}
      </div>
    </div>
  );
}
