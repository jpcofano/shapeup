import type { ReactNode } from "react";
import { RefreshCw, AlertTriangle, Clock } from "lucide-react";
import type { EstadoPuente } from "../../data/ingestaSdk";
import type { ResumenSincronizacion } from "../../data/sincronizarPuente";
import {
  textoImportacion, estadoDelPedido, type UltimaImportacion, type PedidoVisto,
} from "../../lib/estadoPuente";
import type { FasePedido } from "../../lib/pedirYTraer";

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

/** Subtítulo de cada mitad de la tarjeta. */
function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--muted)" }}>
        {titulo}
      </p>
      {children}
    </div>
  );
}

/**
 * Tarjeta "Puente Samsung" (PU4). Desde P88 separa dos cosas que antes se
 * mezclaban: lo que el reloj SUBIÓ (la corrida del puente) y lo que la app
 * IMPORTÓ (la última importación, a mano o automática, diciendo cuál). Antes
 * mostraba la subida y la automática, pero no la manual: se sincronizaba a mano,
 * entraban 91 actividades, y la tarjeta seguía mostrando horas viejas.
 */
export function PuentePanel({
  estado, ahora, sincronizando, onSincronizar, error, ultimaImportacion, sesionSinLlegar,
  fase, pedido,
}: {
  estado: EstadoPuente | null;
  ahora: number;
  sincronizando: boolean;
  onSincronizar: () => void;
  error?: string | null;
  /** La última importación en este dispositivo, manual o automática (P88). */
  ultimaImportacion?: UltimaImportacion | null;
  /** Texto si la última sesión terminó después de la última subida (P88). */
  sesionSinLlegar?: string | null;
  /** En qué paso está el botón (P89): pidiéndole al reloj, o importando. */
  fase?: FasePedido | null;
  /** El último pedido al puente (P89), para decir si el reloj respondió. */
  pedido?: PedidoVisto | null;
}) {
  const ultima = estado?.ultimaCorridaMs;
  const frenado = ultima != null && ahora - ultima > HORAS_SIN_CORRER_AVISO * 3_600_000;
  const delPedido = estadoDelPedido(pedido ?? null, ultima, ahora);
  const etiquetaBoton = fase === "pidiendo" ? "Pidiéndole los datos al reloj…"
    : fase === "importando" || sincronizando ? "Importando…"
    : "Sincronizar ahora";

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <p className="section-title" style={{ margin: 0 }}>Puente Samsung</p>

      <Seccion titulo="Del reloj">
        <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>
          {ultima != null
            ? <>El puente subió datos el <strong style={{ color: "var(--fg)" }}>{fechaHora(ultima)}</strong> · {hace(ultima, ahora)}</>
            : "El puente todavía no subió nada desde el teléfono."}
        </p>
      </Seccion>

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

      {pedido && delPedido && (
        <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>
          Último pedido al reloj: {fechaHora(pedido.pedidoMs)} ({delPedido.como}) ·{" "}
          {delPedido.estado === "respondio" ? "respondió"
            : delPedido.estado === "esperando" ? "esperando respuesta"
            : "sin respuesta"}
        </p>
      )}
      {delPedido?.estado === "sin-respuesta" && (
        <p style={{ display: "flex", alignItems: "flex-start", gap: 6, margin: 0, fontSize: 12, color: "var(--warning)" }}>
          <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} aria-hidden />
          El teléfono puede tener la app del puente detenida o con ahorro de batería.
        </p>
      )}

      <Seccion titulo="A la app">
        <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>
          {ultimaImportacion
            ? <>Última importación: <strong style={{ color: "var(--fg)" }}>{fechaHora(ultimaImportacion.ms)}</strong> · {textoImportacion(ultimaImportacion)}</>
            : "Todavía no se importó nada desde este dispositivo."}
        </p>
      </Seccion>

      {sesionSinLlegar && (
        <p style={{ display: "flex", alignItems: "flex-start", gap: 6, margin: 0, fontSize: 12, color: "var(--fg)" }}>
          <Clock size={14} style={{ flexShrink: 0, marginTop: 1, color: "var(--muted)" }} aria-hidden />
          {sesionSinLlegar}
        </p>
      )}

      {error && <p className="inline-error" style={{ margin: 0 }}>{error}</p>}

      <button
        className="btn-secondary"
        onClick={onSincronizar}
        disabled={sincronizando || fase != null}
        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
      >
        <RefreshCw size={15} />
        {etiquetaBoton}
      </button>
    </div>
  );
}

/** Vista previa de la sincronización: los mismos tres grupos que el ZIP. */
export function PuentePreview({
  resumen, umbralMin, confirmando, onConfirmar, onCancelar, aviso,
}: {
  resumen: ResumenSincronizacion;
  umbralMin: number;
  confirmando: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
  /** Si el reloj no mandó nada nuevo (P89): "no contestó a tiempo; esto es lo que ya estaba". */
  aviso?: string | null;
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
          {aviso && (
            <p style={{ margin: "0 0 10px", fontSize: 12, color: "var(--warning)" }}>{aviso}</p>
          )}
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
                  <strong style={{ color: "var(--info)" }}>{resumen.externas}</strong> se ven en el historial como actividad
                </li>
              )}
              {resumen.soloSalud > 0 && (
                <li style={{ fontSize: 12, color: "var(--muted)" }}>
                  <strong>{resumen.soloSalud}</strong> quedan solo en salud, por durar menos de {umbralMin} min o por haberlas detectado el reloj
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
