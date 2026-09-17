import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { deleteField } from "firebase/firestore";
import {
  EQUIPOS, LUGARES, OBJETIVOS,
  type Equipo, type Lugar, type MiembroId, type Objetivo, type PerfilMiembro,
} from "../../types/models";
import { migrarEquipoPorLugar } from "../../lib/perfil";
import { actualizarPerfil, type PatchPerfil } from "../../data/perfiles";

interface Props {
  miembro: MiembroId;
  /** Perfil actual; `undefined` si el miembro todavía no tiene uno sembrado. */
  perfil:  PerfilMiembro | undefined;
  /** Se llama con el perfil ya guardado, para que la pantalla se vea al día. */
  onGuardado: (perfil: PerfilMiembro) => void;
}

/** Lo editable del perfil. El resto (color, zonas de FC) no pasa por acá. */
interface Borrador {
  lugarHabitual:  Lugar;
  equipoPorLugar: Partial<Record<Lugar, Equipo[]>>;
  objetivos:      Objetivo[];
}

function borradorDe(perfil: PerfilMiembro | undefined): Borrador {
  // `migrarEquipoPorLugar` deja el equipo plano de un perfil sin migrar dentro
  // de su lugar habitual — los demás lugares siguen sin declarar, que no es lo
  // mismo que declarar que no hay nada.
  const migrado = migrarEquipoPorLugar(perfil ?? {});
  return {
    lugarHabitual:  migrado.lugarHabitual ?? "Casa",
    equipoPorLugar: migrado.equipoPorLugar ?? {},
    objetivos:      migrado.objetivos ?? [],
  };
}

function alternar<T>(lista: T[], valor: T): T[] {
  return lista.includes(valor) ? lista.filter((v) => v !== valor) : [...lista, valor];
}

/**
 * Edición del perfil propio (P72): lugar habitual, equipo POR LUGAR y objetivos.
 * Sin guardado automático — se guarda con el botón, y hasta entonces no se
 * escribe nada. El equipo por lugar es lo que P73 va a usar para sustituir
 * ejercicios por los que se pueden hacer donde estás hoy.
 */
export function EditorPerfil({ miembro, perfil, onGuardado }: Props) {
  const original = useMemo(() => borradorDe(perfil), [perfil]);
  const [borrador,  setBorrador]  = useState<Borrador>(original);
  const [abiertos,  setAbiertos]  = useState<Lugar[]>([original.lugarHabitual]);
  const [guardando, setGuardando] = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const hayCambios = JSON.stringify(borrador) !== JSON.stringify(original);

  function toggleEquipo(lugar: Lugar, equipo: Equipo) {
    setBorrador((b) => ({
      ...b,
      equipoPorLugar: {
        ...b.equipoPorLugar,
        [lugar]: alternar(b.equipoPorLugar[lugar] ?? [], equipo),
      },
    }));
  }

  async function guardar() {
    setGuardando(true);
    setError(null);
    const patch: PatchPerfil = {
      lugarHabitual:  borrador.lugarHabitual,
      equipoPorLugar: borrador.equipoPorLugar,
      objetivos:      borrador.objetivos,
      // Guardar migra: el equipo plano ya viajó a `equipoPorLugar`.
      ...(perfil?.equipoDisponible !== undefined ? { equipoDisponible: deleteField() } : {}),
    };
    const r = await actualizarPerfil(miembro, patch);
    setGuardando(false);
    if (!r.ok) { setError(r.error); return; }   // los cambios quedan en el borrador
    const { equipoDisponible: _obsoleto, ...resto } = perfil ?? {};
    onGuardado({ ...resto, ...borrador });
  }

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <p className="section-title" style={{ margin: 0 }}>Entrenamiento</p>

      {/* ── Lugar habitual ───────────────────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>Lugar habitual</p>
        <div className="filter-scroll">
          {LUGARES.map((l) => (
            <button
              key={l}
              className={`filter-chip${borrador.lugarHabitual === l ? " active" : ""}`}
              aria-pressed={borrador.lugarHabitual === l}
              onClick={() => setBorrador((b) => ({ ...b, lugarHabitual: l }))}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* ── Equipo por lugar ─────────────────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>Equipo por lugar</p>
          <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--muted)" }}>
            Con qué contás en cada lado. Sin nada marcado, se asume peso corporal.
          </p>
        </div>

        {LUGARES.map((lugar) => {
          const abierto = abiertos.includes(lugar);
          const equipo  = borrador.equipoPorLugar[lugar];
          const resumen = equipo === undefined
            ? "Sin declarar"
            : `${equipo.length} ${equipo.length === 1 ? "equipo" : "equipos"}`;
          return (
            <div key={lugar} style={{ border: "1px solid var(--border)", borderRadius: "var(--r-sm)" }}>
              <button
                type="button"
                aria-expanded={abierto}
                onClick={() => setAbiertos((a) => alternar(a, lugar))}
                style={{
                  display: "flex", alignItems: "center", gap: 8, width: "100%",
                  padding: "10px 12px", background: "none", border: "none",
                  cursor: "pointer", color: "var(--fg)", textAlign: "left",
                }}
              >
                {abierto ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{lugar}</span>
                <span style={{ fontSize: 11, color: "var(--muted)" }}>{resumen}</span>
              </button>
              {abierto && (
                <div style={{
                  display: "flex", flexWrap: "wrap", gap: 6,
                  padding: "10px 12px 12px", borderTop: "1px solid var(--border)",
                }}>
                  {EQUIPOS.map((e) => {
                    const puesto = (equipo ?? []).includes(e);
                    return (
                      <button
                        key={e}
                        className={`filter-chip${puesto ? " active" : ""}`}
                        aria-pressed={puesto}
                        onClick={() => toggleEquipo(lugar, e)}
                      >
                        {e}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Objetivos ────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>Objetivos</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {OBJETIVOS.map((o) => {
            const puesto = borrador.objetivos.includes(o);
            return (
              <button
                key={o}
                className={`filter-chip${puesto ? " active" : ""}`}
                aria-pressed={puesto}
                onClick={() => setBorrador((b) => ({ ...b, objetivos: alternar(b.objetivos, o) }))}
              >
                {o}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Zonas de FC (solo lectura) ───────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>Zonas de frecuencia cardíaca</p>
        {perfil?.fcMaxTeorica != null ? (
          <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>
            FC máx {perfil.fcMaxTeorica}
            {(["Z2", "Z3", "Z4"] as const)
              .map((z) => {
                const r = perfil.zonasFC?.[z];
                return r ? ` · ${z} ${r.min}–${r.max}` : "";
              })
              .join("")}
          </p>
        ) : (
          <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>Sin configurar.</p>
        )}
        <p style={{ margin: 0, fontSize: 11, color: "var(--muted)" }}>
          Se calculan por edad; no se editan desde acá.
        </p>
      </div>

      {error && (
        <p style={{ margin: 0, fontSize: 12, color: "var(--danger, #f87171)" }}>{error}</p>
      )}

      <button className="btn-primary" disabled={!hayCambios || guardando} onClick={guardar}>
        {guardando ? "Guardando…" : "Guardar"}
      </button>
    </div>
  );
}
