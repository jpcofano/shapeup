/* ShapeUp UI Kit — BodyMap: silueta frente/espalda con músculos resaltados.
   Diagrama funcional esquemático (no decorativo). Las regiones se pintan según
   músculo primario (acento pleno) / secundarios (acento atenuado) / inactivo. */

const MUSCULO_LABEL = {
  pecho: "Pecho", hombros: "Hombros", biceps: "Bíceps", triceps: "Tríceps",
  core: "Core", cuadriceps: "Cuádriceps", antebrazo: "Antebrazo",
  espalda_alta: "Espalda alta", dorsales: "Dorsales", gluteos: "Glúteos",
  isquios: "Isquios", pantorrillas: "Pantorrillas", trapecio: "Trapecio",
};

// Qué vista contiene cada músculo
const VISTA = {
  pecho: "frente", hombros: "frente", biceps: "frente", core: "frente",
  cuadriceps: "frente", antebrazo: "frente",
  espalda_alta: "espalda", dorsales: "espalda", triceps: "espalda",
  gluteos: "espalda", isquios: "espalda", pantorrillas: "espalda", trapecio: "espalda",
};

function BodyMap({ primario, secundarios = [] }) {
  const fill = (m) => primario === m ? "var(--accent)"
    : secundarios.includes(m) ? "color-mix(in srgb, var(--accent) 38%, transparent)"
    : "var(--card-hover)";
  const stroke = "var(--border)";

  // regiones por vista (formas esquemáticas, viewBox 100x220)
  const Front = () => (
    <svg viewBox="0 0 100 220" width="100%" style={{ display: "block" }}>
      <g stroke={stroke} strokeWidth="0.8">
        {/* cabeza */}
        <circle cx="50" cy="18" r="11" fill="var(--card-hover)" />
        {/* cuello */}
        <rect x="44" y="28" width="12" height="7" rx="2" fill="var(--card-hover)" />
        {/* hombros */}
        <ellipse cx="29" cy="44" rx="11" ry="8" fill={fill("hombros")} />
        <ellipse cx="71" cy="44" rx="11" ry="8" fill={fill("hombros")} />
        {/* pecho */}
        <path d="M37 40 H63 Q66 55 50 60 Q34 55 37 40 Z" fill={fill("pecho")} />
        {/* core / abdomen */}
        <rect x="40" y="61" width="20" height="34" rx="5" fill={fill("core")} />
        {/* bíceps */}
        <rect x="20" y="52" width="9" height="26" rx="4" fill={fill("biceps")} />
        <rect x="71" y="52" width="9" height="26" rx="4" fill={fill("biceps")} />
        {/* antebrazos */}
        <rect x="17" y="79" width="8" height="24" rx="4" fill={fill("antebrazo")} />
        <rect x="75" y="79" width="8" height="24" rx="4" fill={fill("antebrazo")} />
        {/* cuádriceps */}
        <rect x="40" y="98" width="9" height="48" rx="5" fill={fill("cuadriceps")} />
        <rect x="51" y="98" width="9" height="48" rx="5" fill={fill("cuadriceps")} />
        {/* pantorrillas (frente, tibial) */}
        <rect x="41" y="150" width="7" height="40" rx="4" fill="var(--card-hover)" />
        <rect x="52" y="150" width="7" height="40" rx="4" fill="var(--card-hover)" />
      </g>
    </svg>
  );

  const Back = () => (
    <svg viewBox="0 0 100 220" width="100%" style={{ display: "block" }}>
      <g stroke={stroke} strokeWidth="0.8">
        <circle cx="50" cy="18" r="11" fill="var(--card-hover)" />
        {/* trapecio */}
        <path d="M40 32 H60 L57 44 H43 Z" fill={fill("trapecio")} />
        {/* hombros post */}
        <ellipse cx="29" cy="46" rx="10" ry="8" fill={fill("hombros")} />
        <ellipse cx="71" cy="46" rx="10" ry="8" fill={fill("hombros")} />
        {/* espalda alta */}
        <rect x="38" y="44" width="24" height="16" rx="4" fill={fill("espalda_alta")} />
        {/* dorsales */}
        <path d="M38 60 H62 L57 92 H43 Z" fill={fill("dorsales")} />
        {/* tríceps */}
        <rect x="20" y="52" width="9" height="26" rx="4" fill={fill("triceps")} />
        <rect x="71" y="52" width="9" height="26" rx="4" fill={fill("triceps")} />
        {/* antebrazos */}
        <rect x="17" y="79" width="8" height="24" rx="4" fill="var(--card-hover)" />
        <rect x="75" y="79" width="8" height="24" rx="4" fill="var(--card-hover)" />
        {/* glúteos */}
        <rect x="40" y="94" width="9" height="20" rx="5" fill={fill("gluteos")} />
        <rect x="51" y="94" width="9" height="20" rx="5" fill={fill("gluteos")} />
        {/* isquios */}
        <rect x="40" y="116" width="9" height="32" rx="5" fill={fill("isquios")} />
        <rect x="51" y="116" width="9" height="32" rx="5" fill={fill("isquios")} />
        {/* pantorrillas */}
        <rect x="41" y="150" width="7" height="40" rx="4" fill={fill("pantorrillas")} />
        <rect x="52" y="150" width="7" height="40" rx="4" fill={fill("pantorrillas")} />
      </g>
    </svg>
  );

  return (
    <div style={{ display: "flex", gap: 14, alignItems: "stretch" }}>
      <div style={{ flex: "0 0 96px", display: "flex", gap: 6 }}>
        <div style={{ flex: 1, textAlign: "center" }}>
          <Front />
          <span style={{ fontSize: 9, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".05em" }}>Frente</span>
        </div>
        <div style={{ flex: 1, textAlign: "center" }}>
          <Back />
          <span style={{ fontSize: 9, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".05em" }}>Espalda</span>
        </div>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, justifyContent: "center" }}>
        <div>
          <span className="t-label" style={{ display: "block", marginBottom: 4 }}>Músculo principal</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 14, fontWeight: 700 }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: "var(--accent)" }} />
            {MUSCULO_LABEL[primario] || primario}
          </span>
        </div>
        {secundarios.length > 0 && (
          <div>
            <span className="t-label" style={{ display: "block", marginBottom: 4 }}>Secundarios</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {secundarios.map((s) => (
                <span key={s} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--muted)" }}>
                  <span style={{ width: 9, height: 9, borderRadius: 2, background: "color-mix(in srgb, var(--accent) 38%, transparent)" }} />
                  {MUSCULO_LABEL[s] || s}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { BodyMap, MUSCULO_LABEL });
