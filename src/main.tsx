import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AuthProvider } from "./auth/AuthProvider";
import { ThemeProvider } from "./contexts/ThemeProvider";
import { ErrorBoundary } from "./components/PantallaError";
import App from "./App";
import "./index.css";

// ErrorBoundary por fuera de todo: lo que explote antes del router (sesión,
// tema) también muestra la pantalla en castellano con "Recargar". Los errores
// de cada pantalla los agarra el errorElement del router (App.tsx).
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
);
