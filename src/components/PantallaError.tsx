// ════════════════════════════════════════════════════════════════════════════
//  components/PantallaError.tsx — lo que se ve cuando algo se rompe.
//
//  Antes, un crash mostraba la pantalla por defecto de react-router: el stack y
//  un "Hey developer 👋". Para quien entrena con el teléfono en la mano eso no
//  dice nada. Esto dice qué pasó en castellano, que lo guardado está a salvo, y
//  ofrece recargar — que además arregla el caso más común después de un deploy:
//  la PWA cacheada pidiendo un archivo que ya no existe.
//
//  Dos usos:
//  - `PantallaErrorRuta`: el `errorElement` del router (errores de render de
//    cualquier pantalla).
//  - `ErrorBoundary`: clase, en main.tsx, para lo que explote fuera del router
//    (autenticación, tema).
// ════════════════════════════════════════════════════════════════════════════
import { Component, type ErrorInfo, type ReactNode } from "react";
import { isRouteErrorResponse, useRouteError } from "react-router-dom";
import { AlertTriangle } from "lucide-react";

/** El mensaje técnico, corto, para el desplegable. Nunca el stack entero. */
export function detalleDe(error: unknown): string {
  if (isRouteErrorResponse(error)) return `${error.status} ${error.statusText}`;
  if (error instanceof Error) return error.message;
  return String(error);
}

/**
 * ¿Es un archivo del build que ya no está? Pasa cuando la app quedó abierta
 * durante un deploy. Recargar lo resuelve; vale la pena decirlo distinto.
 */
export function esVersionVieja(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return /Failed to fetch dynamically imported module|Importing a module script failed|ChunkLoadError|Loading chunk/i.test(msg);
}

export function PantallaError({ error }: { error: unknown }) {
  const vieja = esVersionVieja(error);
  return (
    <div className="page" style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="card" role="alert" style={{ maxWidth: 420, width: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <AlertTriangle size={22} color="var(--warning)" aria-hidden />
          <p style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>
            {vieja ? "Hay una versión nueva de la app" : "Algo se rompió en esta pantalla"}
          </p>
        </div>
        <p style={{ margin: 0, fontSize: 14, color: "var(--muted)", lineHeight: 1.5 }}>
          {vieja
            ? "La app se actualizó mientras estaba abierta. Recargá para usar la versión nueva."
            : "No es algo que hayas hecho mal. Lo que ya estaba guardado sigue guardado, y si estabas entrenando, la sesión en curso quedó en el teléfono."}
        </p>
        <button className="btn-primary" onClick={() => window.location.reload()}>
          Recargar
        </button>
        <button className="btn-secondary" onClick={() => window.location.assign("/")}>
          Ir al inicio
        </button>
        <details>
          <summary style={{ fontSize: 12, color: "var(--muted)", cursor: "pointer" }}>
            Detalle para avisar del error
          </summary>
          <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--muted)", wordBreak: "break-word", fontFamily: "monospace" }}>
            {detalleDe(error)}
          </p>
        </details>
      </div>
    </div>
  );
}

/** El `errorElement` de las rutas. */
export function PantallaErrorRuta() {
  const error = useRouteError();
  return <PantallaError error={error} />;
}

/** Para lo que explote fuera del router. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: unknown }> {
  state: { error: unknown } = { error: null };

  static getDerivedStateFromError(error: unknown) {
    return { error };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error("ErrorBoundary:", error, info.componentStack);
  }

  render() {
    return this.state.error != null ? <PantallaError error={this.state.error} /> : this.props.children;
  }
}
