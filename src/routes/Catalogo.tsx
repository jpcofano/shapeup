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
        {abierto ? <ChevronUp size={16} color="var(--muted)" /> : <ChevronDown size={16} color="var(--muted)" />}
      </button>

      {/* Detalle expandible */}
      {abierto && (
        <div style={{ padding: "0 14px 14px", borderTop: "1px solid var(--border)" }}>
          {onEdit && (
            <button
              className="btn-secondary"
              style={{ marginTop: 12, marginBottom: 8, width: "100%" }}
              onClick={onEdit}
            >
              Editar ejercicio
            </button>
          )}

          {ej.instrucciones.length > 0 && (
            <section style={{ marginTop: 12 }}>
              <p style={{ margin: "0 0 6px", fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Ejecución
              </p>
              <ol style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 4 }}>
                {ej.instrucciones.map((inst, i) => (
                  <li key={i} style={{ fontSize: 13, lineHeight: 1.5 }}>{inst}</li>
                ))}
              </ol>
            </section>
          )}

          {ej.puntosClave.length > 0 && (
            <section style={{ marginTop: 12, background: "rgba(74,222,128,0.07)", borderRadius: 8, padding: "10px 12px" }}>
              <p style={{ margin: "0 0 6px", fontSize: 11, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Puntos clave
              </p>
              <ul style={{ margin: 0, paddingLeft: 16, display: "flex", flexDirection: "column", gap: 3 }}>
                {ej.puntosClave.map((p, i) => (
                  <li key={i} style={{ fontSize: 13, lineHeight: 1.5 }}>{p}</li>
                ))}
              </ul>
            </section>
          )}

          {ej.erroresComunes.length > 0 && (
            <section style={{ marginTop: 10, background: "rgba(251,191,36,0.07)", borderRadius: 8, padding: "10px 12px" }}>
              <p style={{ margin: "0 0 6px", fontSize: 11, color: "var(--warning)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Errores comunes
              </p>
              <ul style={{ margin: 0, paddingLeft: 16, display: "flex", flexDirection: "column", gap: 3 }}>
                {ej.erroresComunes.map((e, i) => (
                  <li key={i} style={{ fontSize: 13, lineHeight: 1.5 }}>{e}</li>
                ))}
              </ul>
            </section>
          )}

          {ej.consejosSeguridad && ej.consejosSeguridad.length > 0 && (
            <section style={{ marginTop: 10, background: "rgba(248,113,113,0.07)", borderRadius: 8, padding: "10px 12px" }}>
              <p style={{ margin: "0 0 6px", fontSize: 11, color: "var(--danger)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Seguridad
              </p>
              <ul style={{ margin: 0, paddingLeft: 16, display: "flex", flexDirection: "column", gap: 3 }}>
                {ej.consejosSeguridad.map((c, i) => (
                  <li key={i} style={{ fontSize: 13, lineHeight: 1.5 }}>{c}</li>
                ))}
              </ul>
            </section>
          )}

          {ej.gruposSecundarios.length > 0 && (
            <p style={{ margin: "12px 0 0", fontSize: 12, color: "var(--muted)" }}>
              Secundarios: {ej.gruposSecundarios.join(", ")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Pantalla completa ─────────────────────────────────────────────────────────

/** Lista de ejercicios del catálogo con buscador y filtros. Alta/edición solo para el owner. */
export function Catalogo() {
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

  return (
    <div className="page">
      {/* Buscador */}
      <div style={{ position: "relative", marginBottom: 8 }}>
        <Search size={16} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--muted)", pointerEvents: "none" }} />
        <input
          className="form-input"
          style={{ paddingLeft: 32 }}
          placeholder="Buscar ejercicio…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {/* Filtros */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 4 }}>
        <ChipRow label="Área"   all="" value={region}    options={GRUPOS_MUSCULARES_REGION_ORDEN} onChange={(v) => setRegion(v as RegionMuscular | "")} />
        <ChipRow label="Tipo"   all="" value={modalidad} options={MODALIDADES}                    onChange={(v) => setModalidad(v as Modalidad | "")} />
        <ChipRow label="Equipo" all="" value={equipo}    options={EQUIPOS}                        onChange={(v) => setEquipo(v as Equipo | "")} />
        <ChipRow label="Nivel"  all="" value={nivel}     options={NIVELES}                        onChange={(v) => setNivel(v as Nivel | "")} />
      </div>

      {/* Contador */}
      {!loading && !error && (
        <p style={{ margin: "4px 0 8px", fontSize: 12, color: "var(--muted)" }}>
          {visibles.length} ejercicio{visibles.length !== 1 ? "s" : ""}
          {todos.length !== visibles.length ? ` de ${todos.length}` : ""}
        </p>
      )}

      {/* Estados */}
      {loading && <div className="empty-state"><div className="spinner" /></div>}
      {error   && <p className="inline-error">{error}</p>}
      {!loading && !error && visibles.length === 0 && (
        <div className="empty-state">
          <p>{todos.length === 0 ? "No hay ejercicios en el catálogo." : "Sin resultados con estos filtros."}</p>
        </div>
      )}

      {/* Lista */}
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

      {/* FAB: solo owner */}
      {isOwner && (
        <button className="fab" onClick={() => navigate("/catalogo/nueva")} title="Nuevo ejercicio">
          <Plus size={24} />
        </button>
      )}
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
