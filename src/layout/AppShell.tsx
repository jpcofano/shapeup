import { NavLink, Outlet } from "react-router-dom";
import { Home, Library, Heart, Zap, History, User, Sun, Moon } from "lucide-react";
import { useAuth } from "../auth/useAuth";
import { getHomeLayout } from "../lib/homeLayout";
import { useTheme } from "../contexts/ThemeProvider";

const NAV = [
  { to: "/",           label: "Inicio",    Icon: Home,    end: true  },
  { to: "/biblioteca", label: "Rutinas",   Icon: Library, end: false },
  { to: "/entrenar",   label: "Entrenar",  Icon: Zap,     end: false },
  { to: "/historial",  label: "Historial", Icon: History, end: false },
  { to: "/salud",      label: "Salud",     Icon: Heart,   end: false },
  { to: "/perfil",     label: "Perfil",    Icon: User,    end: false },
] as const;

/** Toggle sol/luna del modo claro/oscuro (P65 Fix 2) — visible en toda pantalla
 *  con AppShell (todas salvo las fullscreen de sesión). Flip directo: un tap
 *  fija el modo contrario al efectivo actual, pisando "system" si estaba activo
 *  (igual criterio que cualquier quick-toggle — el control fino de 3 vías vive
 *  en Perfil → Apariencia). */
function ModoToggle() {
  const { modoEfectivo, setModo } = useTheme();
  const esOscuro = modoEfectivo === "dark";
  return (
    <button
      onClick={() => setModo(esOscuro ? "light" : "dark")}
      aria-label={esOscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      style={{
        position: "fixed", bottom: 78, left: 16, zIndex: 90,
        width: 40, height: 40, borderRadius: "50%",
        background: "var(--card)", border: "1px solid var(--border)", color: "var(--muted)",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", boxShadow: "var(--shadow-menu)",
      }}
    >
      {esOscuro ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  );
}

/** Shell principal: área de contenido + navegación inferior fija. */
export function AppShell() {
  const { memberId } = useAuth();
  const layout = memberId ? getHomeLayout(memberId) : "aurora";
  const redux = layout === "pulse" || layout === "premium";
  const { tema, modoEfectivo } = useTheme();

  if (!redux) {
    return (
      <div className="app-shell">
        <main className="app-content">
          <Outlet />
        </main>

        <ModoToggle />

        <nav className="bottom-nav">
          {NAV.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
            >
              <Icon size={22} strokeWidth={1.8} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    );
  }

  const esPulse = layout === "pulse";

  return (
    <div className="app-shell">
      <main className="app-content">
        <Outlet />
      </main>

      <ModoToggle />

      <nav
        className={esPulse ? "dir-a a-nav" : "dir-c v21 c-nav"}
        data-mode={modoEfectivo}
        data-accent={tema}
      >
        {NAV.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => isActive ? "nav-it on" : "nav-it"}
          >
            {esPulse
              ? <Icon size={22} strokeWidth={1.8} />
              : <span className="ic"><Icon size={20} strokeWidth={1.8} /></span>}
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
