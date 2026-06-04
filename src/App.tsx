import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { useAuth } from "./auth/useAuth";
import { LoginScreen } from "./auth/LoginScreen";
import { UnauthorizedScreen } from "./auth/UnauthorizedScreen";
import { AppShell } from "./layout/AppShell";
import { Home } from "./routes/Home";
import { Biblioteca } from "./routes/Biblioteca";
import { Catalogo } from "./routes/Catalogo";
import { Entrenar } from "./routes/Entrenar";
import { EntrenarSesion } from "./routes/EntrenarSesion";
import { Historial } from "./routes/Historial";
import { HistorialDetalle } from "./routes/HistorialDetalle";
import { Perfil } from "./routes/Perfil";
import { RutinaDetalle } from "./routes/RutinaDetalle";
import { RutinaForm } from "./routes/RutinaForm";

const router = createBrowserRouter([
  // ── Fullscreen (sin AppShell) ──────────────────────────────────────────────
  { path: "/entrenar/:rutinaId", element: <EntrenarSesion /> },

  // ── App con AppShell ───────────────────────────────────────────────────────
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true,                    element: <Home /> },
      { path: "biblioteca",             element: <Biblioteca /> },
      { path: "biblioteca/nueva",       element: <RutinaForm /> },
      { path: "biblioteca/:id",         element: <RutinaDetalle /> },
      { path: "biblioteca/:id/editar",  element: <RutinaForm /> },
      { path: "catalogo",               element: <Catalogo /> },
      { path: "entrenar",               element: <Entrenar /> },
      { path: "historial",              element: <Historial /> },
      { path: "historial/:id",          element: <HistorialDetalle /> },
      { path: "perfil",                 element: <Perfil /> },
    ],
  },
]);

export default function App() {
  const { user, memberId, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    );
  }

  if (!user)     return <LoginScreen />;
  if (!memberId) return <UnauthorizedScreen />;

  return <RouterProvider router={router} />;
}
