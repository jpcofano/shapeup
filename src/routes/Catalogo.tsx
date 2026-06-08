import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ChevronDown, ChevronUp, Search } from "lucide-react";
import type {
  Ejercicio, Modalidad, RegionMuscular, Equipo, Nivel,
} from "../types/models";
import {
  MODALIDADES, GRUPOS_MUSCULARES_REGION_ORDEN, EQUIPOS, NIVELES,
} from "../types/models";
import { getEjercicios } from "../data/ejercicios";
import { filtrarEjercicios } from "../lib/filtros";
import { useAuth } from "../auth/useAuth";

// ── Ficha técnica (chips) ────────────────────────────────────────────────────

function FichaTecnica({ ej }: { ej: Ejercicio }) {
  type FichaRow = { label: string; chips: string[]; accent?: boolean };
  const rows: FichaRow[] = [
    { label: "Primario",    chips: [ej.grupoMuscularPrimario], accent: true },
    ...(ej.gruposSecundarios.length > 0 ? [{ label: "Secundarios", chips: ej.gruposSecundarios }] : []),
    { label: "Nivel",       chips: [ej.nivel] },
    ...(ej.mecanica         ? [{ label: "Mecánica",    chips: [ej.mecanica] }]   : []),
    { label: "Patrón",      chips: [ej.patron] },
    ...(ej.equipo.length > 0 ? [{ label: "Equipo",    chips: ej.equipo }]        : []),
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 10 }}>
      <p className="section-title" style={{ marginBottom: 2 }}>Ficha técnica</p>
      {rows.map(({ label, chips, accent }) => (
        <div key={label} style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
          <span style={{ fontSize: 11, color: "var(--muted)", width: 78, flexShrink: 0, paddingTop: 2 }}>
            {label}
          </span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {chips.map((chip) => (
              <span key={chip} className={`badge ${accent ? "badge-accent" : "badge-muted"}`}>{chip}</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Detalle inline de un ejercicio ───────────────────────────────────────────

function EjercicioCard({ ej, onEdit }: { ej: Ejercicio; onEdit?: () => void }) {
  const [abierto, setAbierto] = useState(false);

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      {/* Cabecera */}
      <button
        style={{
          width: "100%", padding: "12px 14px", background: "none", border: "none",
          display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
          textAlign: "left", color: "inherit",
        }}
        onClick={() => setAbierto((v) => !v)}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 14, lineHeight: 1.3 }}>
            {ej.nombre}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
            <span className="badge badge-accent">{ej.grupoMuscularPrimario}</span>
            <span className="badge badge-muted">{ej.modalidad}</span>
            {ej.equipo.slice(0, 2).map((e) => (
              <span key={e} className="badge badge-muted">{e}</span>
            ))}
            <span className="badge badge-muted">{ej.nivel}</span>
          </div>
        </div>
        {abierto
          ? <ChevronUp size={16} color="var(--muted)" />
          : <ChevronDown size={16} color="var(--muted)" />
        }
      </button>

      {/* Detalle expandible */}
      {abierto && (
        <div style={{ padding: "0 14px 14px", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 10 }}>
          {/* Imagen */}
          {ej.imagenes && ej.imagenes.length > 0 && (
            <img
              src={ej.imagenes[0]}
              alt={ej.nombre}
              loading="lazy"
              style={{ width: "100%", maxHeight: 180, objectFit: "cover", borderRadius: 8, marginTop: 10, display: "block" }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          )}

          {/* Ficha técnica */}
          <FichaTecnica ej={ej} />

          {onEdit && (
            <button
              className="btn-secondary"
              style={{ marginTop: 4, width: "100%" }}
              onClick={onEdit}
            >
              Editar ejercicio
            </button>
          )}

          {ej.instrucciones.length > 0 && (
            <section>
              <p className="section-title" style={{ marginBottom: 6 }}>Ejecución</p>
              <ol style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 4 }}>
                {ej.instrucciones.map((inst, i) => (
                  <li key={i} style={{ fontSize: 13, lineHeight: 1.5 }}>{inst}</li>
                ))}
              </ol>
            </section>
          )}

          {ej.puntosClave.length > 0 && (
            <div className="banner banner-green">
              <p className="banner-title">Puntos clave</p>
              <ul style={{ margin: "4px 0 0", paddingLeft: 16, display: "flex", flexDirection: "column", gap: 3 }}>
                {ej.puntosClave.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>
          )}

          {ej.erroresComunes.length > 0 && (
            <div className="banner banner-amber">
              <p className="banner-title">Errores comunes</p>
              <ul style={{ margin: "4px 0 0", paddingLeft: 16, display: "flex", flexDirection: "column", gap: 3 }}>
                {ej.erroresComunes.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          )}

          {ej.consejosSeguridad && ej.consejosSeguridad.length > 0 && (
            <div className="banner banner-red">
              <p className="banner-title">Seguridad</p>
              <ul style={{ margin: "4px 0 0", paddingLeft: 16, display: "flex", flexDirection: "column", gap: 3 }}>
                {ej.consejosSeguridad.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Pantalla completa ─────────────────────────────────────────────────────────

interface CatalogoProps {
  /** true cuando se renderiza dentro de Biblioteca (sin wrapper .page extra) */
  embedded?: boolean;
}

export function Catalogo({ embedded = false }: CatalogoProps) {
  const navigate           = useNavigate();
  const { memberId }       = useAuth();
  const isOwner            = memberId === "juanpablo";

  const [todos,     setTodos]     = useState<Ejercicio[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  const [busqueda,  setBusqueda]  = useState("");
  const [modalidad, setModalidad] = useState<Modalidad | "">("");
  const [region,    setRegion]    = useState<RegionMuscular | "">("");
  const [equipo,    setEquipo]    = useState<Equipo | "">("");
  const [nivel,     setNivel]     = useState<Nivel | "">("");

  useEffect(() => {
    getEjercicios().then((r) => {
      if (r.ok) setTodos(r.value);
      else      setError(r.error);
      setLoading(false);
    });
  }, []);

  const visibles = filtrarEjercicios(todos, {
    busqueda:  busqueda  || undefined,
    modalidad: modalidad || undefined,
    region:    region    || undefined,
    equipo:    equipo    || undefined,
    nivel:     nivel     || undefined,
  });

  const inner = (
    <>
      {/* Buscador */}
      <div style={{ position: "relative" }}>
        <Search
          size={16}
          style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--muted)", pointerEvents: "none" }}
        />
        <input
          className="form-input"
          style={{ paddingLeft: 32 }}
          placeholder="Buscar ejercicio…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {/* Filtros */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <ChipRow label="Área"   all="" value={region}    options={GRUPOS_MUSCULARES_REGION_ORDEN} onChange={(v) => setRegion(v as RegionMuscular | "")} />
        <ChipRow label="Tipo"   all="" value={modalidad} options={MODALIDADES}                    onChange={(v) => setModalidad(v as Modalidad | "")} />
        <ChipRow label="Equipo" all="" value={equipo}    options={EQUIPOS}                        onChange={(v) => setEquipo(v as Equipo | "")} />
        <ChipRow label="Nivel"  all="" value={nivel}     options={NIVELES}                        onChange={(v) => setNivel(v as Nivel | "")} />
      </div>

      {/* Contador */}
      {!loading && !error && (
        <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>
          {visibles.length} ejercicio{visibles.length !== 1 ? "s" : ""}
          {todos.length !== visibles.length ? ` de ${todos.length}` : ""}
        </p>
      )}

      {loading && <div className="empty-state"><div className="spinner" /></div>}
      {error   && <p className="inline-error">{error}</p>}
      {!loading && !error && visibles.length === 0 && (
        <div className="empty-state">
          <p>{todos.length === 0 ? "No hay ejercicios en el catálogo." : "Sin resultados con estos filtros."}</p>
        </div>
      )}

      {!loading && !error && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {visibles.map((ej) => (
            <EjercicioCard
              key={ej.idEjercicio}
              ej={ej}
              onEdit={isOwner ? () => navigate(`/catalogo/${ej.idEjercicio}/editar`) : undefined}
            />
          ))}
        </div>
      )}

      {/* FAB solo owner */}
      {isOwner && (
        <button className="fab" onClick={() => navigate("/catalogo/nueva")} title="Nuevo ejercicio">
          <Plus size={24} />
        </button>
      )}
    </>
  );

  if (embedded) return <>{inner}</>;

  return (
    <div className="page">
      {inner}
    </div>
  );
}

// ── Chip row ──────────────────────────────────────────────────────────────────

function ChipRow<T extends string>({
  label, all, value, options, onChange,
}: {
  label: string;
  all: T | "";
  value: T | "";
  options: readonly T[];
  onChange: (v: T | "") => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", flexShrink: 0, width: 40 }}>
        {label}
      </span>
      <div className="filter-scroll">
        <button className={`filter-chip ${value === all ? "active" : ""}`} onClick={() => onChange(all)}>
          Todos
        </button>
        {options.map((opt) => (
          <button
            key={opt}
            className={`filter-chip ${value === opt ? "active" : ""}`}
            onClick={() => onChange(value === opt ? all : opt)}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
