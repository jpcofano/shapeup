import { useState } from "react";
import type { Historial, MiembroId } from "../../types/models";
import { useAuth } from "../../auth/useAuth";
import { getPerfiles } from "../../data/perfiles";
import { getRutina } from "../../data/rutinas";
import { getProgramaActivo } from "../../data/programas";
import { leerCurvaDeSesion } from "../../data/ingestaSdk";
import { guardarAnalisis, borrarAnalisis } from "../../data/historial";
import { metaSemanal } from "../../lib/adherencia";
import { armarPaqueteSesion, type PaqueteArmado } from "../../lib/paqueteAnalisis";
import { validarAnalisisSesion } from "../../lib/validarAnalisis";
import { analisisParaGuardar } from "../../lib/analisis";
import { PROMPT_SESION } from "./promptSesion";

/** Por encima de esto, además de copiar se ofrece bajarlo como archivo. */
const GRANDE_BYTES = 30 * 1024;

const kb = (b: number) => `${(b / 1024).toLocaleString("es-AR", { maximumFractionDigits: 1 })} KB`;
const fecha = (ms: number) => new Date(ms).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });

interface Props {
  h: Historial;
  /** El historial del miembro, si ya se cargó (para el contexto). */
  historial: Historial[] | null;
  nocheAnterior: { horasTotal: number; horaAcostarse?: string; horaLevantarse?: string } | null;
  fcReposoDia: number | null;
  /** Después de guardar o borrar, la sesión con el campo nuevo. */
  onCambio: (h: Historial) => void;
}

/**
 * Análisis asistido de la sesión (P93, ADR #044). La app arma el paquete, la
 * persona lo pega en un chat y trae el JSON de vuelta. **Todo lo que se muestra
 * acá es interpretación**, y tiene que verse distinto de un número medido.
 */
export function AnalisisSesion({ h, historial, nocheAnterior, fcReposoDia, onCambio }: Props) {
  const { user, memberId } = useAuth();
  const [preparando, setPreparando] = useState(false);
  const [paquete, setPaquete] = useState<PaqueteArmado | null>(null);
  const [copiado, setCopiado] = useState<"si" | "no" | null>(null);
  const [cargando, setCargando] = useState(false);
  const [texto, setTexto] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  async function preparar() {
    setPreparando(true); setError(null); setAviso(null); setCopiado(null);
    const miembro = h.miembro as MiembroId;
    const [perf, rut, prog] = await Promise.all([
      getPerfiles(),
      h.idRutina ? getRutina(h.idRutina) : Promise.resolve(null),
      getProgramaActivo(miembro),
    ]);
    const perfil = perf.ok ? perf.value[miembro] ?? null : null;
    // La curva no se guarda (ADR #016): se vuelve a sacar del crudo del puente,
    // solo si la sesión es de quien la está mirando (es su puente).
    const uuids = h.biometria?.tramosSamsung ?? (h.biometria?.datauuidSamsung ? [h.biometria.datauuidSamsung] : []);
    const curvaRes = user?.uid && memberId === miembro && uuids.length > 0
      ? await leerCurvaDeSesion(user.uid, miembro, uuids)
      : null;
    const armado = armarPaqueteSesion({
      sesion: h,
      prompt: PROMPT_SESION,
      curva: curvaRes?.ok ? curvaRes.value : null,
      contexto: {
        historial: historial ?? [],
        rutina: rut?.ok ? rut.value : null,
        perfil,
        metaSemanalDias: metaSemanal(prog.ok ? prog.value : null, perfil),
        nocheAnterior,
        fcReposoDia,
      },
    });
    setPaquete(armado);
    setPreparando(false);
    try {
      await navigator.clipboard.writeText(armado.texto);
      setCopiado("si");
    } catch {
      setCopiado("no");
    }
  }

  function bajar() {
    if (!paquete) return;
    const url = URL.createObjectURL(new Blob([paquete.texto], { type: "text/markdown" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `analisis-${h.idHist}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function leerArchivo(f: File | undefined) {
    if (!f) return;
    setTexto(await f.text());
  }

  async function guardar() {
    setError(null); setAviso(null);
    // Se valida ANTES de guardar nada: si no valida, no se guarda.
    const v = validarAnalisisSesion(texto, h.idHist);
    if (!v.ok) { setError(v.error); return; }
    if (h.analisis && !window.confirm(
      `Ya hay un análisis cargado el ${fecha(h.analisis.cargadoMs)}. Si guardás este, reemplaza al anterior. ¿Seguir?`,
    )) return;
    setGuardando(true);
    const analisis = analisisParaGuardar(v.value, h, Date.now());
    const r = await guardarAnalisis(h.idHist, analisis);
    setGuardando(false);
    if (!r.ok) { setError(r.error); return; }
    onCambio({ ...h, analisis });
    setTexto(""); setCargando(false);
    const notas = [
      v.value.recuperadoDeTexto ? "había texto alrededor del JSON y se ignoró" : null,
      v.value.descartados.length > 0 ? `se descartaron campos que no son del esquema: ${v.value.descartados.join(", ")}` : null,
    ].filter(Boolean);
    setAviso(notas.length > 0 ? `Guardado (${notas.join("; ")}).` : "Guardado.");
  }

  async function borrar() {
    if (!window.confirm("¿Sacar el análisis de esta sesión? No cambia ningún dato del entrenamiento.")) return;
    setError(null); setAviso(null);
    const r = await borrarAnalisis(h.idHist);
    if (!r.ok) { setError(r.error); return; }
    const { analisis: _fuera, ...resto } = h;
    onCambio(resto);
    setAviso("Análisis sacado.");
  }

  const a = h.analisis;

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <p className="section-title" style={{ margin: 0 }}>Análisis asistido</p>

      {a && (
        <div style={{ border: "1px dashed var(--border)", borderRadius: 10, padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
          <p style={{ margin: 0, fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".05em" }}>
            Interpretación · no es un dato medido · {a.generadoEn} · {a.modelo}
          </p>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>{a.resumen}</p>

          {a.hallazgos.length > 0 && (
            <div>
              <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 600 }}>Hallazgos</p>
              {a.hallazgos.map((x, i) => (
                <div key={i} style={{ display: "flex", flexWrap: "wrap", gap: "2px 12px", marginBottom: 8, fontSize: 13 }}>
                  <div style={{ flex: "1 1 220px" }}>
                    <span style={{ fontWeight: 600 }}>{x.tema}</span>
                    {x.confianza && <span style={{ color: "var(--muted)", fontSize: 11 }}> · confianza {x.confianza}, según el análisis</span>}
                    <p style={{ margin: "2px 0 0", lineHeight: 1.45 }}>{x.detalle}</p>
                  </div>
                  <p style={{ flex: "1 1 180px", margin: 0, fontSize: 12, color: "var(--muted)", lineHeight: 1.45 }}>
                    Evidencia: {x.evidencia}
                  </p>
                </div>
              ))}
            </div>
          )}

          {a.sugerencias.length > 0 && (
            <div>
              <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 600 }}>Sugerencias</p>
              {a.sugerencias.map((x, i) => (
                <p key={i} style={{ margin: "0 0 6px", fontSize: 13, lineHeight: 1.45 }}>
                  {x.accion} <span style={{ color: "var(--muted)" }}>— {x.porque}{x.cuando ? ` (${x.cuando})` : ""}</span>
                </p>
              ))}
            </div>
          )}

          {a.banderas.length > 0 && (
            <div>
              <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 600 }}>Para mirar</p>
              {a.banderas.map((x, i) => (
                <p key={i} style={{ margin: "0 0 6px", fontSize: 13, lineHeight: 1.45 }}>
                  <span className="badge badge-muted" style={{ marginRight: 6 }}>{x.tipo}</span>{x.detalle}
                </p>
              ))}
            </div>
          )}

          {a.datosFaltantes && a.datosFaltantes.length > 0 && (
            <div>
              <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 600 }}>Para completar</p>
              {a.datosFaltantes.map((x, i) => (
                <p key={i} style={{ margin: "0 0 4px", fontSize: 13, color: "var(--muted)" }}>{x}</p>
              ))}
            </div>
          )}

          {a.preguntas.length > 0 && (
            <div>
              <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 600 }}>Preguntas</p>
              {a.preguntas.map((x, i) => (
                <p key={i} style={{ margin: "0 0 4px", fontSize: 13, color: "var(--muted)" }}>{x}</p>
              ))}
            </div>
          )}

          <p style={{ margin: 0, fontSize: 11, color: "var(--muted)" }}>
            Cargado el {fecha(a.cargadoMs)}. Armado con el prompt v{a.armado.versionPrompt}
            {a.armado.versionEnriquecimiento != null ? ` y la biometría v${a.armado.versionEnriquecimiento}` : ", sin biometría"}.
          </p>
          <button className="btn-secondary" style={{ alignSelf: "flex-start" }} onClick={() => void borrar()}>
            Sacar el análisis
          </button>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button className="btn-secondary" disabled={preparando} onClick={() => void preparar()}>
          {preparando ? "Preparando…" : "Preparar análisis"}
        </button>
        <button className="btn-secondary" onClick={() => { setCargando((c) => !c); setError(null); }}>
          {a ? "Cargar otro análisis" : "Cargar análisis"}
        </button>
      </div>

      {paquete && (
        <div style={{ fontSize: 12, color: "var(--muted)", display: "flex", flexDirection: "column", gap: 4 }}>
          <p style={{ margin: 0 }}>
            Paquete de {kb(paquete.bytes)}
            {copiado === "si" ? " · copiado al portapapeles. Pegalo en un chat." : copiado === "no" ? " · no se pudo copiar: bajalo como archivo." : ""}
          </p>
          {!h.biometria && <p style={{ margin: 0 }}>Sin datos del reloj: el análisis puede mirar series y descansos, no lo fisiológico.</p>}
          {paquete.recortes.length > 0 && <p style={{ margin: 0, color: "var(--warning)" }}>Para entrar en 60 KB se recortó: {paquete.recortes.join(", ")}.</p>}
          {paquete.excedeTope && <p style={{ margin: 0, color: "var(--warning)" }}>Aun recortando pasa los 60 KB.</p>}
          {(paquete.bytes > GRANDE_BYTES || copiado === "no") && (
            <button className="btn-secondary" style={{ alignSelf: "flex-start" }} onClick={bajar}>Bajar como archivo</button>
          )}
        </div>
      )}

      {cargando && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <textarea
            className="form-input" rows={6} value={texto} onChange={(e) => setTexto(e.target.value)}
            placeholder="Pegá acá el JSON que devolvió el chat"
            style={{ fontFamily: "monospace", fontSize: 12 }}
          />
          <input type="file" accept=".json,.txt,.md,application/json,text/plain" onChange={(e) => void leerArchivo(e.target.files?.[0])} />
          <button className="btn-primary" disabled={guardando || texto.trim() === ""} onClick={() => void guardar()}>
            {guardando ? "Guardando…" : "Validar y guardar"}
          </button>
        </div>
      )}

      {error && <p style={{ margin: 0, fontSize: 12, color: "var(--danger)" }}>{error}</p>}
      {aviso && <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>{aviso}</p>}
    </div>
  );
}
