import { NavLink, Outlet } from "react-router-dom";
import { Home, Library, Heart, Zap, History, User } from "lucide-react";
import { useAuth } from "../auth/useAuth";
import { getHomeLayout } from "../lib/homeLayout";
import { getHomeReduxPrefs, resolverModo } from "../lib/homeReduxPrefs";

const NAV = [
  { to: "/",           label: "Inicio",    Icon: Home,    end: true  },
  { to: "/biblioteca", label: "Rutinas",   Icon: Library, end: false },
  { to: "/entrenar",   label: "Entrenar",  Icon: Zap,     end: false },
  { to: "/historial",  label: "Historial", Icon: History, end: false },
  { to: "/salud",      label: "Salud",     Icon: Heart,   end: false },
  { to: "/perfil",     label: "Perfil",    Icon: User,    end: false },
] as const;

/** Shell principal: área de contenido + navegación inferior fija. */
export function AppShell() {
  const { memberId } = useAuth();
  const layout = memberId ? getHomeLayout(memberId) : "aurora";
  const redux = layout === "pulse" || layout === "premium";

  if (!redux) {
    return (
      <div className="app-shell">
        <main className="app-content">
          <Outlet />
        </main>

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

  const prefs = getHomeReduxPrefs(memberId as string);
  const modo = resolverModo(prefs.modo);
  const esPulse = layout === "pulse";

  return (
    <div className="app-shell">
      <main className="app-content">
        <Outlet />
      </main>

      <nav
        className={esPulse ? "dir-a a-nav" : "dir-c v21 c-nav"}
        data-mode={modo}
        data-accent={prefs.acento}
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
