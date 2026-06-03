import { NavLink, Outlet } from "react-router-dom";
import { Home, Library, Dumbbell, Zap, History, User } from "lucide-react";

const NAV = [
  { to: "/",          label: "Inicio",    Icon: Home,    end: true  },
  { to: "/biblioteca", label: "Rutinas",  Icon: Library, end: false },
  { to: "/catalogo",  label: "Catálogo",  Icon: Dumbbell,end: false },
  { to: "/entrenar",  label: "Entrenar",  Icon: Zap,     end: false },
  { to: "/historial", label: "Historial", Icon: History, end: false },
  { to: "/perfil",    label: "Perfil",    Icon: User,    end: false },
] as const;

/** Shell principal: área de contenido + navegación inferior fija. */
export function AppShell() {
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
