import { useMemo, useState } from "react";
import type { Ejercicio, Equipo, Historial, MotivoSustitucion, ZonaMolestia } from "../../types/models";
import { MOTIVOS_SUSTITUCION } from "../../lib/entrenarState";
import { sugerirSustitutos, MAX_ALTERNATIVAS, type Candidato } from "../../lib/sustitucion";
import { filtrarEjercicios } from "../../lib/filtros";

/** Las ocho zonas, con su etiqueta. El orden es de arriba hacia abajo del cuerpo. */
const ZONAS: ReadonlyArray<readonly [ZonaMolestia, string]> = [
  ["hombro", "Hombro"], ["codo", "Codo"], ["muñeca", "Muñeca"], ["espalda", "Espalda"],
  ["cadera", "Cadera"], ["rodilla", "Rodilla"], ["tobillo", "Tobillo"], ["otra", "Otra"],
];

export interface EleccionSustitucion {
  ejercicio: Ejercicio;
  motivo: MotivoSustitucion;
  zona?: ZonaMolestia;
  /** Posición en el ranking desde 1; `0` si vino del buscador. */
  posicion: number;
}

interface Props {
  original: Ejercicio;
  catalogo: Ejercicio[];
  /** El equipo del lugar donde estás (P72). */
  equipo: Equipo[];
  historial: Historial[];
  onElegir: (eleccion: EleccionSustitucion) => void;
  onCancelar: () => void;
  /** Error al traer un ejercicio que no estaba en memoria. */
  error?: string | null;
}

/**
 * Hoja de sustitución en vivo (P73), en dos pasos: primero el motivo, después
 * la elección.
 *
 * **Se ofrece UNO**, destacado, con la razón en una línea. El resto está a un
 * toque de distancia pero no compite con el recomendado: una lista de veinte
 * opciones es la forma de no elegir ninguna.
 */
export function SustituirEjercicio({
  original, catalogo, equipo, historial, onElegir, onCancelar, error,
}: Props) {
  const [motivo, setMotivo] = useState<MotivoSustitucion | null>(null);
  const [zona, setZona] = useState<ZonaMolestia | null>(null);
  const [verMas, setVerMas] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [todoElCatalogo, setTodoElCatalogo] = useState(false);

  const listo = motivo != null && (motivo !== "dolor" || zona != null);

  const { candidatos, relajado } = useMemo(() => {
    if (!listo) return { candidatos: [] as Candidato[], relajado: false };
    return sugerirSustitutos({
      catalogo, original, equipo, historial,
      motivo: motivo!, zona: zona ?? undefined, now: Date.now(),
    });
  }, [listo, catalogo, original, equipo, historial, motivo, zona]);

  // El buscador muestra por defecto solo lo que podés hacer donde estás.
  const resultados = useMemo(() => {
    if (busqueda.trim().length === 0) return [];
    const base = todoElCatalogo
      ? catalogo
      : catalogo.filter((ej) => ej.equipo.every((e) => e === "Peso corporal" || equipo.includes(e)));
    return filtrarEjercicios(base, { busqueda })
      .filter((ej) => ej.idEjercicio !== original.idEjercicio)
      .slice(0, 8);
  }, [busqueda, todoElCatalogo, catalogo, equipo, original.idEjercicio]);

  function elegirCandidato(c: Candidato, indice: number) {
    onElegir({ ejercicio: c.ejercicio, motivo: motivo!, zona: zona ?? undefined, posicion: indice + 1 });
  }

  function elegirDelBuscador(ej: Ejercicio) {
    // Posición 0: vino del buscador y no de la lista. Es el dato que después
    // dice si el ranking sirve.
    const enRanking = candidatos.findIndex((c) => c.ejercicio.idEjercicio === ej.idEjercicio);
    onElegir({
      ejercicio: ej, motivo: motivo!, zona: zona ?? undefined,
      posicion: enRanking >= 0 ? enRanking + 1 : 0,
    });
  }

  const recomendado = candidatos[0];
  const alternativas = candidatos.slice(1, 1 + MAX_ALTERNATIVAS);

  return (
    <div className="modal-backdrop" onClick={onCancelar}>
      <div
        className="modal-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sustituir-titulo"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="confirmar-body">
          <p id="sustituir-titulo" className="confirmar-titulo">
            Cambiar {original.nombre}
          </p>

          {/* ── Paso 1 — motivo, obligatorio ──────────────────────────────── */}
          <p className="confirmar-texto">¿Por qué?</p>
          <div className="paso-carga-chips" style={{ marginBottom: 8 }}>
            {MOTIVOS_SUSTITUCION.map(([valor, label]) => (
              <button
                key={valor}
                type="button"
                className={`filter-chip motivo-chip${motivo === valor ? " active" : ""}`}
                aria-pressed={motivo === valor}
                onClick={() => { setMotivo(valor); if (valor !== "dolor") setZona(null); }}
              >
                {label}
              </button>
            ))}
          </div>

          {motivo === "dolor" && (
            <>
              <p className="confirmar-texto" style={{ marginTop: 4 }}>¿Dónde?</p>
              <div className="paso-carga-chips" style={{ marginBottom: 8 }}>
                {ZONAS.map(([valor, label]) => (
                  <button
                    key={valor}
                    type="button"
                    className={`filter-chip motivo-chip${zona === valor ? " active" : ""}`}
                    aria-pressed={zona === valor}
                    onClick={() => setZona(valor)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* ── Paso 2 — elección ─────────────────────────────────────────── */}
          {listo && (
            <div style={{ marginTop: 4 }}>
              {relajado && (
                <p style={{ margin: "0 0 8px", fontSize: 12, color: "var(--muted)" }}>
                  No hay opciones de tu nivel: te muestro las que hay.
                </p>
              )}

              {recomendado ? (
                <>
                  <button
                    type="button"
                    className="card"
                    style={{
                      width: "100%", textAlign: "left", cursor: "pointer",
                      border: "1.5px solid var(--accent-border)", padding: "12px 14px",
                    }}
                    onClick={() => elegirCandidato(recomendado, 0)}
                  >
                    <span style={{ display: "block", fontWeight: 700, fontSize: 15 }}>
                      {recomendado.ejercicio.nombre}
                    </span>
                    <span style={{ display: "block", fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                      {recomendado.razon}
                    </span>
                  </button>

                  {alternativas.length > 0 && !verMas && (
                    <button
                      type="button"
                      className="btn-deshacer-serie"
                      style={{ marginTop: 8 }}
                      onClick={() => setVerMas(true)}
                    >
                      Ver más opciones
                    </button>
                  )}

                  {verMas && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                      {alternativas.map((c, i) => (
                        <button
                          key={c.ejercicio.idEjercicio}
                          type="button"
                          className="card"
                          style={{ width: "100%", textAlign: "left", cursor: "pointer", padding: "10px 12px" }}
                          onClick={() => elegirCandidato(c, i + 1)}
                        >
                          <span style={{ display: "block", fontWeight: 600, fontSize: 14 }}>
                            {c.ejercicio.nombre}
                          </span>
                          <span style={{ display: "block", fontSize: 11, color: "var(--muted)" }}>
                            {c.razon}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p style={{ margin: "0 0 8px", fontSize: 13, color: "var(--muted)" }}>
                  Nada del catálogo encaja con ese patrón y ese equipo. Buscá a mano o saltealo.
                </p>
              )}

              {/* ── Buscador ────────────────────────────────────────────── */}
              <input
                className="input"
                style={{ marginTop: 10 }}
                placeholder="Buscar otro ejercicio"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
              <label style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, fontSize: 12, color: "var(--muted)" }}>
                <input
                  type="checkbox"
                  checked={todoElCatalogo}
                  onChange={(e) => setTodoElCatalogo(e.target.checked)}
                />
                Ver todo el catálogo
              </label>

              {resultados.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 8 }}>
                  {resultados.map((ej) => (
                    <button
                      key={ej.idEjercicio}
                      type="button"
                      className="btn-secondary"
                      style={{ justifyContent: "flex-start", fontSize: 13 }}
                      onClick={() => elegirDelBuscador(ej)}
                    >
                      {ej.nombre}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {error && <p className="inline-error" style={{ marginTop: 8 }}>{error}</p>}

          <div className="confirmar-acciones" style={{ marginTop: 12 }}>
            <button type="button" className="btn-secondary" onClick={onCancelar}>
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
