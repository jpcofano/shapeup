import { Fragment, useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { deleteField } from "firebase/firestore";
import {
  EQUIPOS, LUGARES, OBJETIVOS, ZONAS_FC,
  type Equipo, type Lugar, type MiembroId, type Objetivo, type PerfilMiembro, type ZonaFC,
} from "../../types/models";
import { migrarEquipoPorLugar } from "../../lib/perfil";
import { validarZonas, zonasDesdeFcMax, type ZonasFC } from "../../lib/configuracion";
import { actualizarPerfil, type PatchPerfil } from "../../data/perfiles";

interface Props {
  miembro: MiembroId;
  /** Perfil actual; `undefined` si el miembro todavía no tiene uno sembrado. */
  perfil:  PerfilMiembro | undefined;
  /**
   * Días de entrenamiento del plan activo (P77a). `null` si no hay plan: sin
   * plan no hay contra qué comparar y el campo no se muestra.
   */
  metaDelPlan: number | null;
  /** Se llama con el perfil ya guardado, para que la pantalla se vea al día. */
  onGuardado: (perfil: PerfilMiembro) => void;
}

/** Lo editable del perfil. El color no pasa por acá. */
interface Borrador {
  lugarHabitual:  Lugar;
  equipoPorLugar: Partial<Record<Lugar, Equipo[]>>;
  objetivos:      Objetivo[];
  /** Override de la meta. `null` = sin override: manda el plan (P77a). */
  metaSemanalDias: number | null;
  /** FC máxima; `null` = sin configurar (P86: antes era de solo lectura). */
  fcMaxTeorica: number | null;
  zonasFC: ZonasFC;
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
    metaSemanalDias: migrado.metaSemanalDias ?? null,
    fcMaxTeorica: migrado.fcMaxTeorica ?? null,
    zonasFC: migrado.zonasFC ?? {},
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
export function EditorPerfil({ miembro, perfil, metaDelPlan, onGuardado }: Props) {
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

  const errorZonas = validarZonas(borrador.zonasFC, borrador.fcMaxTeorica);

  function cambiarZona(z: ZonaFC, campo: "min" | "max", texto: string) {
    const n = texto.trim() === "" ? NaN : Math.round(Number(texto));
    setBorrador((b) => {
      const actual = b.zonasFC[z] ?? { min: NaN, max: NaN };
      const nueva = { ...actual, [campo]: n };
      const zonas = { ...b.zonasFC };
      // Las dos vacías = la zona no está configurada.
      if (!Number.isFinite(nueva.min) && !Number.isFinite(nueva.max)) delete zonas[z];
      else zonas[z] = nueva;
      return { ...b, zonasFC: zonas };
    });
  }

  async function guardar() {
    if (errorZonas) { setError(errorZonas); return; }
    setGuardando(true);
    setError(null);
    // Un override igual al del plan NO se escribe (P77a): se borra, para que
    // la meta siga al plan si el plan cambia.
    const meta = borrador.metaSemanalDias;
    const guardarMeta = meta != null && meta > 0 && meta !== metaDelPlan;

    const patch: PatchPerfil = {
      lugarHabitual:  borrador.lugarHabitual,
      equipoPorLugar: borrador.equipoPorLugar,
      objetivos:      borrador.objetivos,
      // Sin FC máx ni zonas, los campos se sacan: vacío es "sin configurar".
      fcMaxTeorica:   borrador.fcMaxTeorica ?? deleteField(),
      zonasFC:        Object.keys(borrador.zonasFC).length > 0 ? borrador.zonasFC : deleteField(),
      ...(guardarMeta
        ? { metaSemanalDias: meta }
        : perfil?.metaSemanalDias !== undefined ? { metaSemanalDias: deleteField() } : {}),
      // Guardar migra: el equipo plano ya viajó a `equipoPorLugar`.
      ...(perfil?.equipoDisponible !== undefined ? { equipoDisponible: deleteField() } : {}),
    };
    const r = await actualizarPerfil(miembro, patch);
    setGuardando(false);
    if (!r.ok) { setError(r.error); return; }   // los cambios quedan en el borrador
    const {
      equipoDisponible: _obsoleto, metaSemanalDias: _vieja, fcMaxTeorica: _fc, zonasFC: _z, ...resto
    } = perfil ?? {};
    const { metaSemanalDias: _borrador, fcMaxTeorica, zonasFC, ...restoBorrador } = borrador;
    onGuardado({
      ...resto, ...restoBorrador,
      ...(guardarMeta ? { metaSemanalDias: meta } : {}),
      ...(fcMaxTeorica != null ? { fcMaxTeorica } : {}),
      ...(Object.keys(zonasFC).length > 0 ? { zonasFC } : {}),
    });
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

      {/* ── Meta de días por semana (P77a) ───────────────────────────────── */}
      {metaDelPlan != null && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>Meta de días por semana</p>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={7}
            className="form-input"
            style={{ maxWidth: 120 }}
            placeholder={String(metaDelPlan)}
            value={borrador.metaSemanalDias ?? ""}
            onChange={(e) => {
              const v = e.target.value.trim();
              const n = v === "" ? null : Number(v);
              setBorrador((b) => ({
                ...b,
                metaSemanalDias: n != null && Number.isFinite(n) && n > 0 ? Math.round(n) : null,
              }));
            }}
          />
          <p style={{ margin: 0, fontSize: 11, color: "var(--muted)" }}>
            Tu plan tiene {metaDelPlan} {metaDelPlan === 1 ? "día" : "días"}. Podés apuntar a
            menos sin cambiar el plan. Vacío usa el del plan.
          </p>
        </div>
      )}

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

      {/* ── Zonas de FC (P86: editables; antes eran de solo lectura) ───────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>Zonas de frecuencia cardíaca</p>
          <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--muted)" }}>
            Deciden la zona de cada sesión. Sin zonas a medida se usan bandas estándar
            de la FC máxima.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <label style={{ fontSize: 12, color: "var(--muted)" }} htmlFor="fc-max">FC máxima</label>
          <input
            id="fc-max"
            type="number"
            inputMode="numeric"
            className="form-input"
            style={{ maxWidth: 90 }}
            value={borrador.fcMaxTeorica ?? ""}
            onChange={(e) => {
              const v = e.target.value.trim();
              const n = v === "" ? null : Math.round(Number(v));
              setBorrador((b) => ({ ...b, fcMaxTeorica: n != null && Number.isFinite(n) ? n : null }));
            }}
          />
          <button
            type="button"
            className="btn-secondary"
            style={{ width: "auto", padding: "6px 10px", fontSize: 12 }}
            disabled={borrador.fcMaxTeorica == null}
            onClick={() => setBorrador((b) => (
              b.fcMaxTeorica == null ? b : { ...b, zonasFC: zonasDesdeFcMax(b.fcMaxTeorica) }
            ))}
          >
            Calcular zonas estándar
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr 1fr", gap: "6px 8px", alignItems: "center", maxWidth: 260 }}>
          {ZONAS_FC.map((z) => {
            const r = borrador.zonasFC[z];
            return (
              <Fragment key={z}>
                <span style={{ fontSize: 12, fontWeight: 600 }}>{z}</span>
                <input
                  type="number" inputMode="numeric" className="form-input" aria-label={`${z} mínimo`}
                  value={r && Number.isFinite(r.min) ? r.min : ""}
                  onChange={(e) => cambiarZona(z, "min", e.target.value)}
                />
                <input
                  type="number" inputMode="numeric" className="form-input" aria-label={`${z} máximo`}
                  value={r && Number.isFinite(r.max) ? r.max : ""}
                  onChange={(e) => cambiarZona(z, "max", e.target.value)}
                />
              </Fragment>
            );
          })}
        </div>
        {errorZonas && <p style={{ margin: 0, fontSize: 11, color: "var(--warning)" }}>{errorZonas}</p>}
        <p style={{ margin: 0, fontSize: 11, color: "var(--muted)" }}>
          Cambiarlas afecta a las sesiones que se enriquezcan de acá en adelante; las ya
          enriquecidas conservan su zona.
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
