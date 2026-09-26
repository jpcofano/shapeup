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
import { EntrenarSesionLibre } from "./routes/EntrenarSesionLibre";
import { SesionJuego } from "./routes/SesionJuego";
import { Historial } from "./routes/Historial";
import { HistorialDetalle } from "./routes/HistorialDetalle";
import { Perfil } from "./routes/Perfil";
import { Salud } from "./routes/Salud";
import { RutinaDetalle } from "./routes/RutinaDetalle";
import { RutinaForm } from "./routes/RutinaForm";
import { EjercicioForm } from "./routes/EjercicioForm";
import { ProgramaDetalle } from "./routes/ProgramaDetalle";
import { QaHomeRedux } from "./routes/QaHomeRedux";
import { QaSaludResumen } from "./routes/QaSaludResumen";
import { QaTemas } from "./routes/QaTemas";
import { PantallaErrorRuta } from "./components/PantallaError";

const router = createBrowserRouter([
  // Una ruta sin path que envuelve a todas: si cualquier pantalla se rompe al
  // renderizar, se ve PantallaErrorRuta en castellano en vez de la página por
  // defecto de react-router (stack + "Hey developer").
  {
    errorElement: <PantallaErrorRuta />,
    children: [
      // ── Fullscreen (sin AppShell) ──────────────────────────────────────────────
      { path: "/entrenar/libre",                element: <EntrenarSesionLibre /> },
      { path: "/entrenar/juego",                element: <SesionJuego /> },
      { path: "/entrenar/ejercicio/:idEjercicio", element: <EntrenarSesionLibre /> },
      { path: "/entrenar/:rutinaId",            element: <EntrenarSesion /> },
      { path: "/qa/home-redux",                 element: <QaHomeRedux /> },
      { path: "/qa/salud-resumen",              element: <QaSaludResumen /> },
      { path: "/qa/temas",                      element: <QaTemas /> },

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
          { path: "catalogo/nueva",         element: <EjercicioForm /> },
          { path: "catalogo/:id/editar",    element: <EjercicioForm /> },
          { path: "entrenar",               element: <Entrenar /> },
          { path: "programa/:id",            element: <ProgramaDetalle /> },
          { path: "historial",              element: <Historial /> },
          { path: "historial/:id",          element: <HistorialDetalle /> },
          { path: "salud",                  element: <Salud /> },
          { path: "perfil",                 element: <Perfil /> },
        ],
      },
    ],
  },
]);

export default function App() {
  const { user, memberId, loading } = useAuth();

  // QA de theming/mocks (P53, P64, P65): datos mock, sin info de usuario → no requiere login.
  const QA_SIN_LOGIN = ["/qa/home-redux", "/qa/salud-resumen", "/qa/temas"];
  if (QA_SIN_LOGIN.includes(window.location.pathname)) {
    return <RouterProvider router={router} />;
  }

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
