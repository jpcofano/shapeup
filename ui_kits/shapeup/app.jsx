/* ShapeUp UI Kit — App shell, navegación inferior y router. */

const NAV = [
  { key: "inicio", label: "Inicio", icon: "house", screen: "home" },
  { key: "rutinas", label: "Rutinas", icon: "library", screen: "biblioteca" },
  { key: "entrenar", label: "Entrenar", icon: "zap", screen: "entrenar" },
  { key: "historial", label: "Historial", icon: "history", screen: "historial" },
  { key: "salud", label: "Salud", icon: "heart", screen: "salud" },
  { key: "perfil", label: "Perfil", icon: "user", screen: "perfil" },
];

// Qué item del nav resaltar según la pantalla
const SCREEN_TO_NAV = {
  home: "inicio", biblioteca: "rutinas", rutinaDetalle: "rutinas",
  entrenar: "entrenar", historial: "historial", historialDetalle: "historial",
  salud: "salud", perfil: "perfil",
};

function EntrenarLanding({ go }) {
  return (
    <div className="page">
      <div className="page-header"><h1 className="page-title">Entrenar</h1></div>
      <p style={{ margin: "-4px 0 0", color: "var(--muted)", fontSize: 14 }}>Elegí qué entrenar hoy.</p>
      {Object.values(RUTINAS).map((r) => (
        <div key={r.id} className="rutina-card" onClick={() => go("sesion", { rutinaId: r.id })}>
          <p className="rutina-card-title">{r.nombre}</p>
          <div className="rutina-card-meta">
            <Badge kind="accent">{r.foco}</Badge><Badge kind="muted">{r.nivel}</Badge>
            <span>· {r.bloques.length} ejercicios</span><span>· ⏱ {r.duracion} min</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function App() {
  const [logged, setLogged] = React.useState(false);
  const [memberId, setMemberId] = React.useState("juanpablo");
  const [screen, setScreen] = React.useState("home");
  const [params, setParams] = React.useState({});
  // Tema POR MIEMBRO — cada uno ajusta el suyo.
  const [themes, setThemes] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem("su-themes")) || {}; } catch (e) { return {}; }
  });
  const DEFAULT_THEMES = { juanpablo: "ion", maria: "pulse", sofia: "grape", federico: "volt" };
  const theme = themes[memberId] || DEFAULT_THEMES[memberId] || "ion";
  const setTheme = (t) => setThemes((prev) => ({ ...prev, [memberId]: t }));

  React.useEffect(() => { window.__setMember = (id) => setMemberId(id); window.__setTheme = setTheme; }, [memberId]);
  React.useEffect(() => { localStorage.setItem("su-themes", JSON.stringify(themes)); }, [themes]);
  // refrescar iconos lucide tras cada render
  React.useEffect(() => { window.lucide && window.lucide.createIcons({ attrs: { "stroke-width": 1.8 } }); });

  const go = (s, p = {}) => { setScreen(s); setParams(p); };

  if (!logged) return <div className="su-app" data-theme={theme} style={appWrap}><Login onLogin={() => { setLogged(true); go("home"); }} /></div>;

  // Pantalla de sesión: fullscreen, sin nav
  if (screen === "sesion") {
    return (
      <div className="su-app" data-theme={theme} style={appWrap}>
        <EntrenarSesion rutinaId={params.rutinaId}
          onSalir={() => go("entrenar")}
          onFinalizar={() => go("historial")} />
      </div>
    );
  }

  const activeNav = SCREEN_TO_NAV[screen];
  let content = null;
  switch (screen) {
    case "home": content = <Home memberId={memberId} go={go} />; break;
    case "biblioteca": content = <Biblioteca go={go} />; break;
    case "rutinaDetalle": content = <RutinaDetalle rutinaId={params.rutinaId} go={go} />; break;
    case "entrenar": content = <EntrenarLanding go={go} />; break;
    case "historial": content = <Historial go={go} />; break;
    case "historialDetalle": content = <HistorialDetalle id={params.id} go={go} />; break;
    case "salud": content = <Salud />; break;
    case "perfil": content = <Perfil memberId={memberId} theme={theme} onTheme={setTheme} onLogout={() => { setLogged(false); }} />; break;
    default: content = <Home memberId={memberId} go={go} />;
  }

  return (
    <div className="su-app" data-theme={theme} style={appWrap}>
      <main style={{ flex: 1, overflowY: "auto", padding: "16px 16px 78px" }}>{content}</main>
      <nav style={navStyle}>
        {NAV.map((n) => {
          const active = n.key === activeNav;
          return (
            <button key={n.key} onClick={() => go(n.screen)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, background: "none", border: "none", cursor: "pointer", color: active ? "var(--accent)" : "var(--muted)", fontSize: 10, fontWeight: 500, fontFamily: "var(--font-sans)" }}>
              <Icon name={n.icon} size={22} color={active ? "var(--accent)" : "var(--muted)"} />
              <span>{n.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

const appWrap = { position: "absolute", inset: 0, display: "flex", flexDirection: "column", background: "var(--bg)", overflow: "hidden" };
const navStyle = { height: 62, background: "var(--card)", borderTop: "1px solid var(--border)", display: "flex", alignItems: "stretch", flexShrink: 0 };

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
