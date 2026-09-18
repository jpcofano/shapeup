import { RefreshCw, AlertTriangle } from "lucide-react";
import type { EstadoPuente } from "../../data/ingestaSdk";
import type { ResumenSincronizacion } from "../../data/sincronizarPuente";

/** Sin corridas en este lapso, el puente probablemente esté frenado por batería. */
export const HORAS_SIN_CORRER_AVISO = 12;

/** Cuántas actividades que quedan solo en salud se listan antes de resumir. */
const MAX_VISIBLES = 20;

function hace(ms: number, ahora: number): string {
  const horas = Math.floor((ahora - ms) / 3_600_000);
  if (horas < 1) return "hace menos de una hora";
  if (horas < 24) return `hace ${horas} h`;
  const dias = Math.floor(horas / 24);
  return `hace ${dias} ${dias === 1 ? "día" : "días"}`;
}

function fechaHora(ms: number): string {
  const d = new Date(ms);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm} ${hh}:${mi}`;
}

/**
 * Tarjeta "Puente Samsung" (PU4): cuándo corrió por última vez y qué traería.
 * Sin sincronización automática todavía — primero hay que ver que los números
 * den bien.
 */
export function PuentePanel({
  estado, ahora, sincronizando, onSincronizar, error,
}: {
  estado: EstadoPuente | null;
  ahora: number;
  sincronizando: boolean;
  onSincronizar: () => void;
  error?: string | null;
}) {
  const ultima = estado?.ultimaCorridaMs;
  const frenado = ultima != null && ahora - ultima > HORAS_SIN_CORRER_AVISO * 3_600_000;

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div>
        <p className="section-title" style={{ margin: "0 0 2px" }}>Puente Samsung</p>
        <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>
          {ultima != null
            ? <>Última corrida: <strong style={{ color: "var(--fg)" }}>{fechaHora(ultima)}</strong> · {hace(ultima, ahora)}</>
            : "El puente todavía no corrió en este teléfono."}
        </p>
      </div>

      {ultima != null && (
        <p style={{ margin: 0, fontSize: 11, color: "var(--muted)" }}>
          {[
            estado?.leidos     != null && `${estado.leidos} leídos`,
            estado?.subidos    != null && `${estado.subidos} subidos`,
            estado?.sinCambios != null && `${estado.sinCambios} sin cambios`,
            estado?.errores    ? `${estado.errores} errores` : null,
          ].filter(Boolean).join(" · ")}
          {estado?.versionPuente && ` · v${estado.versionPuente}`}
        </p>
      )}

      {frenado && (
        <p style={{
          display: "flex", alignItems: "flex-start", gap: 6, margin: 0,
          fontSize: 12, color: "var(--warning)",
        }}>
          <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          El puente no corre desde {fechaHora(ultima!)}. Revisá las restricciones de
          batería en el teléfono.
        </p>
      )}

      {error && <p className="inline-error" style={{ margin: 0 }}>{error}</p>}

      <button
        className="btn-secondary"
        onClick={onSincronizar}
        disabled={sincronizando}
        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
      >
        <RefreshCw size={15} />
        {sincronizando ? "Leyendo el puente…" : "Sincronizar ahora"}
      </button>
    </div>
  );
}

/** Vista previa de la sincronización: los mismos tres grupos que el ZIP. */
export function PuentePreview({
  resumen, umbralMin, confirmando, onConfirmar, onCancelar,
}: {
  resumen: ResumenSincronizacion;
  umbralMin: number;
  confirmando: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}) {
  const soloSalud = resumen.clasificadas.filter((c) => c.destino === "descartada");
  const total = resumen.clasificadas.length;

  return (
    <div className="modal-backdrop" onClick={onCancelar}>
      <div className="modal-sheet" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span>Puente Samsung — vista previa</span>
        </div>
        <div style={{ padding: "12px 16px", maxHeight: "65vh", overflowY: "auto" }}>
          <p style={{ margin: "0 0 10px", fontSize: 12, color: "var(--muted)" }}>
            {resumen.documentos} documentos → <strong style={{ color: "var(--fg)" }}>{resumen.registros} registros</strong>
            {resumen.rearmados > 0 && ` (${resumen.rearmados} venían partidos)`}
          </p>

          <div style={{ padding: "8px 10px", borderRadius: "var(--r-sm)", background: "var(--card)", border: "1px solid var(--border)" }}>
            <p style={{ margin: "0 0 6px", fontSize: 12, color: "var(--fg)" }}>
              <strong>Actividades:</strong> {total}
            </p>
            <p style={{ margin: "0 0 4px", fontSize: 11, color: "var(--muted)" }}>
              Todas se guardan. Al historial entran:
            </p>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 3 }}>
              {resumen.enriquecen > 0 && (
                <li style={{ fontSize: 12, color: "var(--muted)" }}>
                  <strong style={{ color: "var(--accent)" }}>{resumen.enriquecen}</strong> enriquecen sesiones que ya entrenaste
                </li>
              )}
              {resumen.externas > 0 && (
                <li style={{ fontSize: 12, color: "var(--muted)" }}>
                  <strong style={{ color: "var(--info)" }}>{resumen.externas}</strong> entran como actividad externa
                </li>
              )}
              {resumen.soloSalud > 0 && (
                <li style={{ fontSize: 12, color: "var(--muted)" }}>
                  <strong>{resumen.soloSalud}</strong> quedan solo en salud, por durar menos de {umbralMin} min
                </li>
              )}
            </ul>

            {soloSalud.length > 0 && (
              <details style={{ marginTop: 6 }}>
                <summary style={{ fontSize: 11, color: "var(--muted)", cursor: "pointer" }}>
                  Ver cuáles quedan solo en salud
                </summary>
                <div style={{ marginTop: 4, display: "flex", flexDirection: "column", gap: 2 }}>
                  {soloSalud.slice(0, MAX_VISIBLES).map((d, i) => (
                    <p key={i} style={{ margin: 0, fontSize: 11, color: "var(--muted)" }}>· {d.explicacion}</p>
                  ))}
                  {soloSalud.length > MAX_VISIBLES && (
                    <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--muted)", fontStyle: "italic" }}>
                      y {soloSalud.length - MAX_VISIBLES} más, de {soloSalud.length} en total
                    </p>
                  )}
                </div>
              </details>
            )}
          </div>

          <div style={{ marginTop: 8, padding: "8px 10px", borderRadius: "var(--r-sm)", background: "var(--card)", border: "1px solid var(--border)" }}>
            <p style={{ margin: 0, fontSize: 12, color: "var(--fg)" }}>
              <strong>Mediciones de peso:</strong> {resumen.medicionesAEscribir}
            </p>
            {resumen.medicionesDescartadas.length > 0 && (
              <details style={{ marginTop: 4 }}>
                <summary style={{ fontSize: 11, color: "var(--muted)", cursor: "pointer" }}>
                  {resumen.medicionesDescartadas.length} no entran
                </summary>
                <div style={{ marginTop: 4, display: "flex", flexDirection: "column", gap: 2 }}>
                  {resumen.medicionesDescartadas.slice(0, MAX_VISIBLES).map((d, i) => (
                    <p key={i} style={{ margin: 0, fontSize: 11, color: "var(--muted)" }}>· {d.motivo}</p>
                  ))}
                </div>
              </details>
            )}
          </div>

          {(resumen.ilegibles.length > 0 || resumen.ignorados.length > 0) && (
            <div style={{ marginTop: 8 }}>
              {resumen.ilegibles.map((x, i) => (
                <p key={`il${i}`} style={{ margin: 0, fontSize: 11, color: "var(--warning)" }}>⚠ {x.id}: {x.motivo}</p>
              ))}
              {resumen.ignorados.slice(0, 5).map((x, i) => (
                <p key={`ig${i}`} style={{ margin: 0, fontSize: 11, color: "var(--muted)" }}>· {x.motivo}</p>
              ))}
            </div>
          )}

          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button className="btn-primary" style={{ flex: 1 }} onClick={onConfirmar} disabled={confirmando}>
              {confirmando ? "Guardando…" : "Confirmar"}
            </button>
            <button className="btn-secondary" onClick={onCancelar} disabled={confirmando}>Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  );
}
