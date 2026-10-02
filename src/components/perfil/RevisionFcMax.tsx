import { useEffect, useMemo, useRef, useState } from "react";
import type { Historial, MiembroId, PerfilMiembro } from "../../types/models";
import {
  aplicarRevision, estimarFcMax, tocaRevision,
  ETIQUETA_ORIGEN, SEMANAS_ESTIMACION, TEXTO_EXCLUSION, TEXTO_MOTIVO, type EleccionRevision,
} from "../../lib/fcMaxima";
import { actualizarPerfil } from "../../data/perfiles";

interface Props {
  miembro: MiembroId;
  perfil: PerfilMiembro | undefined;
  /** Sesiones del miembro; `null` mientras cargan. */
  historial: Historial[] | null;
  onGuardado: (perfil: PerfilMiembro) => void;
}

const ddmm = (ymd: string) => `${ymd.slice(8, 10)}/${ymd.slice(5, 7)}`;
const fechaDe = (ms: number) => new Date(ms).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });

/**
 * La revisión de la FC máxima (P97, ADR #045): la estimación de ShapeUp con su
 * evidencia, el valor vigente y el que muestra Samsung, que anota la persona.
 * La persona elige; **nada se cambia solo**. Lo que se eligió queda registrado
 * en el perfil, con la fecha y los datos que se vieron.
 */
export function RevisionFcMax({ miembro, perfil, historial, onGuardado }: Props) {
  const [samsung, setSamsung] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // El aviso de Home trae acá con #revision-fc.
  useEffect(() => {
    if (window.location.hash === "#revision-fc") ref.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const ahora = Date.now();
  const estimacion = useMemo(
    () => (historial ? estimarFcMax(historial, ahora, perfil?.revisionesFcMax, perfil?.fcMaxTeorica) : null),
    // `ahora` cambia en cada render; la estimación no necesita seguirlo al ms.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [historial, perfil?.revisionesFcMax, perfil?.fcMaxTeorica],
  );
  const vigente = perfil?.fcMaxTeorica;
  if (vigente == null) return null;
  const motivo = tocaRevision(perfil, estimacion, ahora);
  const ultima = perfil?.revisionesFcMax?.at(-1);
  const samsungNum = samsung.trim() === "" ? null : Number(samsung);

  async function elegir(eleccion: EleccionRevision) {
    if (!perfil) return;
    setError(null); setAviso(null);
    const r = aplicarRevision(perfil, eleccion, { estimacion, samsung: samsungNum }, Date.now());
    if (!r.ok) { setError(r.error); return; }
    setGuardando(true);
    const w = await actualizarPerfil(miembro, r.cambio);
    setGuardando(false);
    if (!w.ok) { setError(w.error); return; }
    onGuardado({ ...perfil, ...r.cambio });
    setSamsung("");
    setAviso(r.cambio.fcMaxTeorica != null
      ? `Listo: tu FC máxima es ${r.cambio.fcMaxTeorica}. Las zonas nuevas valen para las sesiones que vienen; las pasadas conservan las suyas.`
      : "Listo: quedó registrada la revisión.");
  }

  const columna = { display: "flex", flexDirection: "column" as const, gap: 4, minWidth: 0 };
  const titulo = { margin: 0, fontSize: 11, color: "var(--muted)" };
  const cifra = { margin: 0, fontSize: 22, fontWeight: 700 };

  return (
    <div ref={ref} id="revision-fc" className="card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div>
        <p className="section-title" style={{ margin: 0 }}>FC máxima: revisión</p>
        <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--muted)" }}>
          {motivo
            ? TEXTO_MOTIVO[motivo]
            : `Al día${ultima ? `: la última revisión fue el ${fechaDe(ultima.fechaMs)}` : ""}. Vuelve a tocar a los tres meses, o antes si la estimación supera la vigente.`}
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
        <div style={columna}>
          <p style={titulo}>ShapeUp estima</p>
          <p style={cifra}>{estimacion?.valor ?? "—"}</p>
          {estimacion && estimacion.picos.length > 0 ? (
            <ul style={{ margin: 0, padding: 0, listStyle: "none", fontSize: 11, color: "var(--muted)" }}>
              {estimacion.picos.slice(0, 5).map((p) => (
                <li key={p.idHist} style={p === estimacion.segundoPico ? { color: "var(--fg)", fontWeight: 600 } : undefined}>
                  {ddmm(p.fecha)} · {p.pico}{p === estimacion.segundoPico ? " ← se usa" : ""}
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ margin: 0, fontSize: 11, color: "var(--muted)" }}>
              {historial ? "Faltan sesiones con curva para estimar." : "Cargando…"}
            </p>
          )}
        </div>
        <div style={columna}>
          <p style={titulo}>Vigente</p>
          <p style={cifra}>{vigente}</p>
          <p style={{ margin: 0, fontSize: 11, color: "var(--muted)" }}>
            {perfil?.fcMaxOrigen ? ETIQUETA_ORIGEN[perfil.fcMaxOrigen] : "Origen sin declarar"}
            {perfil?.fcMaxDesdeMs ? ` · desde el ${fechaDe(perfil.fcMaxDesdeMs)}` : ""}
          </p>
        </div>
        <div style={columna}>
          <label htmlFor="fc-samsung" style={titulo}>Samsung muestra</label>
          <input
            id="fc-samsung" type="number" inputMode="numeric" className="form-input"
            placeholder="—" value={samsung} onChange={(e) => setSamsung(e.target.value)}
          />
          <p style={{ margin: 0, fontSize: 11, color: "var(--muted)" }}>
            Samsung Health → Perfil. No se lee sola.
          </p>
        </div>
      </div>

      {estimacion && estimacion.sesionesExcluidas.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 600 }}>Sesiones que no se usaron</p>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", fontSize: 11, color: "var(--muted)" }}>
            {estimacion.sesionesExcluidas.map((x) => (
              <li key={x.idHist}>
                {ddmm(x.fecha)} · {x.nombre || "Sesión"} · {x.pico ?? "—"} · {TEXTO_EXCLUSION[x.motivo]}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p style={{ margin: 0, fontSize: 11, color: "var(--muted)" }}>
        La estimación es el segundo pico más alto de la FC suavizada en las últimas{" "}
        {SEMANAS_ESTIMACION} semanas, solo con sesiones bien medidas. Nunca baja.
      </p>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button className="btn-secondary" style={{ width: "auto", padding: "6px 10px", fontSize: 12 }}
          disabled={guardando || estimacion?.valor == null} onClick={() => void elegir("estimacion")}>
          Usar la de ShapeUp
        </button>
        <button className="btn-secondary" style={{ width: "auto", padding: "6px 10px", fontSize: 12 }}
          disabled={guardando || samsungNum == null} onClick={() => void elegir("samsung")}>
          Usar la de Samsung
        </button>
        <button className="btn-secondary" style={{ width: "auto", padding: "6px 10px", fontSize: 12 }}
          disabled={guardando} onClick={() => void elegir("mantener")}>
          Dejar como está
        </button>
      </div>
      {error && <p style={{ margin: 0, fontSize: 12, color: "var(--danger)" }}>{error}</p>}
      {aviso && <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>{aviso}</p>}
    </div>
  );
}
