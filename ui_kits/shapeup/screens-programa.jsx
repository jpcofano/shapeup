/* ShapeUp UI Kit — Flujo de programa semanal (elegir / ver / activar).
   Días POR DÍA DE SEMANA con descansos. Programa activo por miembro. */

const DIA_LETRA = ["L", "M", "M", "J", "V", "S", "D"];
const DIA_NOMBRE = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

function diasActivos(prog) { return prog.dias.filter((d) => d.tipo !== "descanso").length; }

/* Sesión de hoy según el programa activo (por día de semana).
   Devuelve { descanso } si hoy toca descanso, o { rutina, dia } con la rutina del día. */
function sesionDeHoy(prog, hoy = 2) {
  if (!prog) return null;
  const d = prog.dias[hoy];
  if (!d || d.tipo === "descanso") return { descanso: true };
  return { rutina: RUTINAS[d.idRutina], dia: hoy };
}

/* Vista semanal: fila L–D con rutina (chip acento) o descanso (tenue). */
function VistaSemanal({ prog, hoy = 2, compact = false }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 5 }}>
      {prog.dias.map((d, i) => {
        const rutina = d.tipo === "rutina" ? RUTINAS[d.idRutina] : null;
        const esHoy = i === hoy;
        const descanso = d.tipo === "descanso";
        return (
          <div key={i} style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
            padding: compact ? "7px 2px" : "9px 2px", borderRadius: 10,
            background: esHoy ? "var(--accent-dim)" : "transparent",
            border: esHoy ? "1px solid var(--accent)" : "1px solid transparent",
          }}>
            <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".04em", color: esHoy ? "var(--accent)" : "var(--muted)" }}>{DIA_LETRA[i]}</span>
            <span style={{
              width: compact ? 24 : 28, height: compact ? 24 : 28, borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              background: descanso ? "transparent" : "var(--accent-dim)",
              color: descanso ? "var(--muted)" : "var(--accent)",
              border: descanso ? "1px dashed var(--border)" : "none",
            }}>
              {descanso ? <Icon name="moon" size={compact ? 12 : 13} /> : <Icon name="biceps-flexed" size={compact ? 13 : 15} fill="currentColor" stroke={1.6} />}
            </span>
            {!compact && <span style={{ fontSize: 9, color: "var(--muted)", textAlign: "center", lineHeight: 1.2, minHeight: 22 }}>{descanso ? "Descanso" : rutina?.foco}</span>}
          </div>
        );
      })}
    </div>
  );
}

/* Tab "Programas" dentro de Biblioteca */
function ProgramasTab({ memberId, activoId, onActivar, go }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {Object.values(PROGRAMAS).map((p) => {
        const activo = p.id === activoId;
        const nAct = diasActivos(p), nDesc = 7 - nAct;
        return (
          <div key={p.id} className="rutina-card" style={{ borderColor: activo ? "var(--accent)" : "var(--border)" }} onClick={() => go("programaDetalle", { programaId: p.id })}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <p className="rutina-card-title" style={{ margin: 0 }}>{p.nombre}</p>
              {activo && <span className="badge badge-accent" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Icon name="check" size={11} /> Activo</span>}
            </div>
            <div style={{ marginBottom: 10 }}><VistaSemanal prog={p} hoy={-1} compact={true} /></div>
            <div className="rutina-card-meta">
              <Badge kind="muted">{p.objetivo}</Badge><Badge kind="muted">{p.nivel}</Badge>
              <span>· {nAct} días/sem</span><span>· {nDesc} descanso</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* Detalle de programa con "Activar para mí" */
function ProgramaDetalle({ programaId, memberId, activoId, onActivar, go }) {
  const p = PROGRAMAS[programaId];
  const activo = p.id === activoId;
  const nAct = diasActivos(p), nDesc = 7 - nAct;
  return (
    <div className="page">
      <button className="back-btn" onClick={() => go("biblioteca", { tab: "programas" })}><Icon name="chevron-left" size={16} /> Programas</button>
      <div className="page-header"><h1 className="page-title" style={{ fontSize: 23 }}>{p.nombre}</h1></div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <Badge kind="accent">{p.objetivo}</Badge><Badge kind="muted">{p.nivel}</Badge>
        <Badge kind="muted">{nAct} días/sem</Badge><Badge kind="muted">{nDesc} de descanso</Badge>
      </div>

      <div className="card">
        <p className="section-title" style={{ marginBottom: 12 }}>Tu semana</p>
        <VistaSemanal prog={p} hoy={2} />
      </div>

      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        <p className="section-title" style={{ marginBottom: 4 }}>Día por día</p>
        {p.dias.map((d, i) => {
          const rutina = d.tipo === "rutina" ? RUTINAS[d.idRutina] : null;
          return (
            <div key={i} className="bloque-row" style={{ alignItems: "center" }}>
              <span style={{ width: 80, fontSize: 13, fontWeight: 600, color: i === 2 ? "var(--accent)" : "var(--fg)" }}>{DIA_NOMBRE[i]}</span>
              {rutina ? (
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
                  <Icon name="biceps-flexed" size={15} fill="currentColor" stroke={1.6} color="var(--accent)" />
                  <span style={{ fontSize: 14 }}>{rutina.nombre}</span>
                </div>
              ) : (
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, color: "var(--muted)" }}>
                  <Icon name="moon" size={14} /><span style={{ fontSize: 14 }}>Descanso</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {p.comoUsar && (
        <div className="card">
          <p className="section-title" style={{ marginBottom: 6 }}>Cómo usarlo</p>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: "var(--fg)" }}>{p.comoUsar}</p>
        </div>
      )}

      {activo ? (
        <button className="btn-secondary" disabled style={{ opacity: 0.7 }}>
          <Icon name="check" size={16} /> Activo para {MEMBERS[memberId].nombre.split(" ")[0]}
        </button>
      ) : (
        <button className="btn-primary" onClick={() => { onActivar(p.id); go("home"); }}>
          <Icon name="check" size={18} color="var(--on-accent)" /> Activar para mí
        </button>
      )}
    </div>
  );
}

Object.assign(window, { VistaSemanal, ProgramasTab, ProgramaDetalle, DIA_LETRA, DIA_NOMBRE, sesionDeHoy });
