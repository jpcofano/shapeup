import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Zap, Flame, Check, Moon } from "lucide-react";
import type { Programa, Historial, MedicionCorporal } from "../types/models";
import type { MiembroId } from "../types/models";
import { getProgramaActivo } from "../data/programas";
import { getPerfiles } from "../data/perfiles";
import { getHistorialMiembro } from "../data/historial";
import { getMediciones } from "../data/salud";
import { useAuth } from "../auth/useAuth";
import { MemberAvatar } from "../components/MemberAvatar";
import { WeekStrip } from "../components/WeekStrip";
import { ShapeUpMark, ShapeUpWordmark } from "../components/Brand";
import { VistaSemanal } from "../components/VistaSemanal";
import { proximaSesion, type ProximaSesionResult } from "../lib/proximaSesion";
import { sesionDeHoy, jsDayToNum, type SesionDeHoyResult } from "../lib/sesionDeHoy";
import { getHomeLayout, type HomeLayout } from "../lib/homeLayout";

// ── Helpers ───────────────────────────────────────────────────────────────────

const DIA_SEMANA_IDX: Partial<Record<string, number>> = {
  lunes: 0, martes: 1, "miércoles": 2, jueves: 3, viernes: 4, sábado: 5, domingo: 6,
};
const PRIMER_NOMBRE: Record<MiembroId, string> = {
  juanpablo: "Juan Pablo", maria: "María", sofia: "Sofía", federico: "Federico",
};

function lunesDeSemana(): string {
  const hoy = new Date();
  const dia = hoy.getDay();
  const diff = dia === 0 ? -6 : 1 - dia;
  hoy.setDate(hoy.getDate() + diff);
  return hoy.toISOString().slice(0, 10);
}

function diasEntrenamiento(programa: Programa): number[] {
  return programa.dias
    .filter((d) => d.tipo !== "descanso" && d.diaSemana)
    .map((d) => DIA_SEMANA_IDX[d.diaSemana!])
    .filter((i): i is number => i !== undefined);
}

function calcRacha(hist: Historial[], semanaActual: string): number {
  const porSemana = new Set(hist.map((h) => h.semanaInicio));
  let racha = 0;
  const d = new Date(semanaActual + "T12:00:00");
  while (porSemana.has(d.toISOString().slice(0, 10))) {
    racha++;
    d.setDate(d.getDate() - 7);
  }
  return racha;
}

function fmtKg(kg: number): string {
  return kg >= 1000 ? `${(kg / 1000).toFixed(1)}k` : String(Math.round(kg));
}

// ── ProgressRing ──────────────────────────────────────────────────────────────

const R = 56;
const SIZE = 150;
const C = 2 * Math.PI * R;

function ProgressRing({ done, total }: { done: number; total: number }) {
  const pct      = total > 0 ? Math.min(1, done / total) : 0;
  const target   = C * (1 - pct);
  const complete = done >= total && total > 0;
  const [offset,      setOffset]      = useState(C);
  const [displayDone, setDisplayDone] = useState(0);
  const rafRef      = useRef<number>(0);
  const prevDoneRef = useRef(0);

  useEffect(() => {
    const id = setTimeout(() => setOffset(complete ? 0 : target), 60);
    return () => clearTimeout(id);
  }, [target, complete]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplayDone(done);
      prevDoneRef.current = done;
      return;
    }
    cancelAnimationFrame(rafRef.current);
    const startVal = prevDoneRef.current;
    const endVal   = done;
    const dur      = 420; // --dur-slow
    const t0       = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      setDisplayDone(Math.round(startVal + e * (endVal - startVal)));
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
      else prevDoneRef.current = endVal;
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [done]);

  return (
    <div style={{ position: "relative", width: SIZE, height: SIZE, flexShrink: 0 }}>
      {/* Glow ambiental */}
      <div style={{
        position: "absolute", inset: -24,
        background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)",
        opacity: 0.14, filter: "blur(18px)", borderRadius: "50%", pointerEvents: "none",
      }} />

      <svg width={SIZE} height={SIZE} style={{ transform: "rotate(-90deg)", display: "block" }}>
        <defs>
          <linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   style={{ stopColor: "var(--ring-from)" }} />
            <stop offset="100%" style={{ stopColor: "var(--ring-to)" }} />
          </linearGradient>
        </defs>
        {/* Track */}
        <circle cx={SIZE / 2} cy={SIZE / 2} r={R}
          fill="none" stroke="var(--border)" strokeWidth={10} />
        {/* Progress */}
        {(pct > 0 || complete) && (
          <circle cx={SIZE / 2} cy={SIZE / 2} r={R}
            fill="none" stroke="url(#rg)" strokeWidth={10} strokeLinecap="round"
            strokeDasharray={C} strokeDashoffset={offset}
            className="ring-progress"
            style={{ filter: "drop-shadow(0 0 5px var(--accent))" }}
          />
        )}
      </svg>

      {/* Centro */}
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: 2,
      }}>
        {complete ? (
          <span style={{ color: "var(--accent)" }}><Check size={30} strokeWidth={3} /></span>
        ) : (
          <>
            <span style={{
              fontSize: 26, fontWeight: 800, fontVariantNumeric: "tabular-nums",
              letterSpacing: "-.03em", lineHeight: 1, color: "var(--fg)",
            }}>
              {displayDone}/{total}
            </span>
            <span className="t-label" style={{ fontSize: 10 }}>sesiones</span>
          </>
        )}
      </div>
    </div>
  );
}

// ── Bento tile ────────────────────────────────────────────────────────────────

function BentoTile({ label, children, animClass }: {
  label: string; children: React.ReactNode; animClass?: string;
}) {
  return (
    <div className={`bento-tile ${animClass ?? ""}`.trim()}>
      <span className="t-label">{label}</span>
      {children}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  Home
// ══════════════════════════════════════════════════════════════════════════════

export function Home() {
  const navigate             = useNavigate();
  const { memberId }         = useAuth();

  const [programa,  setPrograma]  = useState<Programa | null>(null);
  const [proxima,   setProxima]   = useState<ProximaSesionResult | null | undefined>(undefined);
  const [hoy,       setHoy]       = useState<SesionDeHoyResult | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [color,     setColor]     = useState<string | undefined>(undefined);
  const [layout,    setLayout]    = useState<HomeLayout>("aurora");

  const [sesHechas,  setSesHechas]  = useState(0);
  const [sesObj,     setSesObj]     = useState(0);
  const [volumen,    setVolumen]    = useState(0);
  const [racha,      setRacha]      = useState(0);
  const [numSemana,  setNumSemana]  = useState<number | null>(null);
  const [lastMed,    setLastMed]    = useState<MedicionCorporal | null>(null);
  const [prevMed,    setPrevMed]    = useState<MedicionCorporal | null>(null);

  const semanaRef = useRef(lunesDeSemana());

  useEffect(() => {
    if (!memberId) return;
    setLayout(getHomeLayout(memberId));
    getPerfiles().then((r) => { if (r.ok) setColor(r.value[memberId as MiembroId]?.color); });

    const semanaInicio = semanaRef.current;
    Promise.all([
      getProgramaActivo(memberId as MiembroId),
      getHistorialMiembro(memberId as MiembroId),
      getMediciones(memberId as MiembroId),
    ]).then(([progR, histR, medR]) => {
      if (histR.ok) {
        const hist = histR.value;
        const esta = hist.filter((h) => h.semanaInicio === semanaInicio);

        const prog = progR.ok ? progR.value : null;
        const obj  = prog ? prog.dias.filter((d) => d.tipo !== "descanso").length : 0;

        setSesHechas(esta.length);
        setSesObj(obj);
        setVolumen(esta.reduce((s, h) => s + (h.tonelajeKg ?? 0), 0));
        setRacha(calcRacha(hist, semanaInicio));

        const semanas = [...new Set(hist.map((h) => h.semanaInicio).filter((s): s is string => !!s))].sort();
        if (semanas.length > 0) {
          const diff = new Date(semanaInicio + "T12:00:00").getTime() - new Date(semanas[0] + "T12:00:00").getTime();
          setNumSemana(Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1);
        }

        if (prog) {
          setPrograma(prog);
          setProxima(proximaSesion(prog, esta));
          const hoyNum = jsDayToNum(new Date().getDay());
          const sesHoy = sesionDeHoy(prog, hoyNum, esta);
          setHoy(sesHoy);
        } else {
          setProxima(null);
          setHoy(null);
        }
      }

      if (medR.ok && medR.value.length > 0) {
        setLastMed(medR.value[0]);
        setPrevMed(medR.value[1] ?? null);
      }

      setLoading(false);
    });
  }, [memberId]);

  const primerNombre  = memberId ? PRIMER_NOMBRE[memberId as MiembroId] : "";
  const semanaCompleta = proxima === null && sesObj > 0;

  const subtitulo = semanaCompleta
    ? "¡Semana completa!"
    : sesObj > 0
    ? numSemana != null
      ? `Semana ${numSemana} · ${sesHechas} de ${sesObj} sesiones`
      : `${sesHechas} de ${sesObj} sesiones esta semana`
    : null;

  const pesoDelta = lastMed?.pesoKg != null && prevMed?.pesoKg != null
    ? lastMed.pesoKg - prevMed.pesoKg
    : null;
  const hasPeso   = lastMed?.pesoKg != null;

  // ── Helpers de sesión resueltos ──────────────────────────────────────────────
  const sesionNombre = hoy?.tipo === "rutina"
    ? hoy.etiqueta.replace(/^[^—–]*[—–]\s*/, "")
    : proxima?.dia
    ? (proxima.dia.etiqueta.replace(/^[^—–]*[—–]\s*/, ""))
    : null;

  const sesionRutinaId = hoy?.tipo === "rutina"
    ? hoy.idRutina
    : proxima?.dia.idRutina ?? null;

  const canStart = hoy?.tipo === "rutina" ? !hoy.yaHecha : !!proxima?.dia.idRutina;

  // ── Stadium layout ────────────────────────────────────────────────────────
  if (!loading && layout === "stadium") {
    return (
      <div className="page">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, color: "var(--accent)" }}>
            <ShapeUpMark size={24} /><ShapeUpWordmark size={16} />
          </div>
          {memberId && (
            <button onClick={() => navigate("/perfil")} style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}>
              <MemberAvatar memberId={memberId as MiembroId} color={color} size={32} />
            </button>
          )}
        </div>

        {/* Hero Stadium */}
        <div className="stadium-hero">
          <div className="stadium-glow" />
          {semanaCompleta ? (
            <div style={{ textAlign: "center", position: "relative" }}>
              <p style={{ fontSize: 22, margin: "0 0 6px" }}>🎉</p>
              <h1 className="stadium-title">¡Semana completa!</h1>
              <button className="btn-secondary" style={{ marginTop: 12 }} onClick={() => navigate("/entrenar")}>
                Elegir otra rutina
              </button>
            </div>
          ) : hoy?.tipo === "descanso" ? (
            <div style={{ textAlign: "center", position: "relative" }}>
              <Moon size={32} color="var(--muted)" strokeWidth={1.5} style={{ marginBottom: 8 }} />
              <h1 className="stadium-title" style={{ fontSize: 24 }}>Día de descanso</h1>
              <p style={{ color: "var(--muted)", fontSize: 13, margin: "4px 0 12px" }}>
                Recuperá. Es parte del entrenamiento.
              </p>
              <button className="btn-secondary" onClick={() => navigate("/entrenar")}>Entrenar igual</button>
            </div>
          ) : sesionNombre ? (
            <div style={{ position: "relative", width: "100%" }}>
              <p className="t-label" style={{ margin: "0 0 8px" }}>
                {hoy?.tipo === "rutina" ? "Hoy toca" : "Próxima sesión"}
              </p>
              <h1 className="stadium-title">{sesionNombre}</h1>
              {canStart && (
                <button
                  className="btn-primary"
                  style={{ width: "100%", marginTop: 16 }}
                  onClick={() => sesionRutinaId && navigate(`/entrenar/${sesionRutinaId}`)}
                >
                  <Zap size={18} /> Empezar ahora
                </button>
              )}
            </div>
          ) : (
            <p style={{ color: "var(--muted)", textAlign: "center" }}>Sin programa activo</p>
          )}
        </div>

        {/* Stats strip horizontal */}
        <div className="stadium-stats">
          <div className="stadium-stat">
            <Flame size={14} fill="var(--accent)" strokeWidth={0} color="var(--accent)" />
            <span className="stadium-stat-value">{racha > 0 ? racha : "—"}</span>
            <span className="stadium-stat-label">racha</span>
          </div>
          <div className="stadium-stat">
            <span className="stadium-stat-value">{volumen > 0 ? fmtKg(volumen) : "—"}</span>
            <span className="stadium-stat-label">kg vol.</span>
          </div>
          <div className="stadium-stat">
            <span className="stadium-stat-value">{sesHechas}/{sesObj > 0 ? sesObj : "—"}</span>
            <span className="stadium-stat-label">sesiones</span>
          </div>
          {hasPeso && (
            <div className="stadium-stat">
              <span className="stadium-stat-value">{lastMed!.pesoKg}</span>
              <span className="stadium-stat-label">kg peso</span>
            </div>
          )}
        </div>

        {programa && (
          <div className="card" style={{ padding: "14px 16px" }}>
            <WeekStrip semanaInicio={semanaRef.current} marcados={diasEntrenamiento(programa)} />
          </div>
        )}
      </div>
    );
  }

  // ── Clásico layout ────────────────────────────────────────────────────────
  if (!loading && layout === "clasico") {
    const pct = sesObj > 0 ? Math.round((sesHechas / sesObj) * 100) : 0;
    return (
      <div className="page">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, color: "var(--accent)" }}>
            <ShapeUpMark size={24} /><ShapeUpWordmark size={16} />
          </div>
          {memberId && (
            <button onClick={() => navigate("/perfil")} style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}>
              <MemberAvatar memberId={memberId as MiembroId} color={color} size={32} />
            </button>
          )}
        </div>

        <h1 style={{ margin: "4px 0 0", fontSize: 26, fontWeight: 800, letterSpacing: "-.02em" }}>
          Dale, {primerNombre}<span style={{ color: "var(--accent)" }}>.</span>
        </h1>

        {programa && (
          <div className="card" style={{ padding: "14px 16px" }}>
            <WeekStrip semanaInicio={semanaRef.current} marcados={diasEntrenamiento(programa)} />
          </div>
        )}

        {/* Tu semana */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span className="section-title">Tu semana</span>
            {racha > 0 && (
              <span style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--accent)", fontSize: 12, fontWeight: 700 }}>
                <Flame size={13} fill="currentColor" strokeWidth={0} /> {racha} {racha === 1 ? "sem" : "sems"} de racha
              </span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ fontSize: 28, fontWeight: 800, fontVariantNumeric: "tabular-nums", letterSpacing: "-.02em" }}>{sesHechas}</span>
              <span style={{ fontSize: 14, color: "var(--muted)" }}>/ {sesObj} sesiones</span>
            </div>
            {volumen > 0 && (
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 18, fontWeight: 800 }}>{fmtKg(volumen)}</div>
                <div className="t-label">kg vol.</div>
              </div>
            )}
          </div>
          <div style={{ height: 6, borderRadius: 999, background: "var(--card-hover)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pct}%`, background: "var(--accent)", borderRadius: 999, transition: "width .4s ease" }} />
          </div>
        </div>

        {/* Hoy toca */}
        {(sesionNombre || semanaCompleta) && (
          <div className="card">
            {semanaCompleta ? (
              <div style={{ textAlign: "center" }}>
                <p style={{ margin: 0, fontWeight: 700 }}>🎉 ¡Semana completa!</p>
                <button className="btn-secondary" style={{ marginTop: 10 }} onClick={() => navigate("/entrenar")}>Elegir otra rutina</button>
              </div>
            ) : hoy?.tipo === "descanso" ? (
              <div style={{ textAlign: "center" }}>
                <Moon size={22} color="var(--muted)" strokeWidth={1.5} style={{ marginBottom: 6 }} />
                <p style={{ margin: 0, fontWeight: 700 }}>Día de descanso</p>
              </div>
            ) : sesionNombre ? (
              <>
                <p className="t-label" style={{ margin: "0 0 4px" }}>Hoy toca</p>
                <p style={{ margin: "0 0 10px", fontWeight: 800, fontSize: 20, letterSpacing: "-.01em" }}>{sesionNombre}</p>
                {canStart && (
                  <button className="btn-primary" style={{ width: "100%" }}
                    onClick={() => sesionRutinaId && navigate(`/entrenar/${sesionRutinaId}`)}>
                    <Zap size={18} /> Empezar
                  </button>
                )}
              </>
            ) : null}
          </div>
        )}
      </div>
    );
  }

  // ── Aurora layout (default) ───────────────────────────────────────────────
  return (
    <div className="page">

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, color: "var(--accent)" }}>
          <ShapeUpMark size={24} />
          <ShapeUpWordmark size={16} />
        </div>
        {memberId && (
          <button onClick={() => navigate("/perfil")}
            style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}>
            <MemberAvatar memberId={memberId as MiembroId} color={color} size={32} />
          </button>
        )}
      </div>

      {/* ── Saludo ──────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: -4 }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: "-.02em", lineHeight: 1.1 }}>
          Dale, {primerNombre}<span style={{ color: "var(--accent)" }}>.</span>
        </h1>
        {subtitulo && (
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--muted)" }}>{subtitulo}</p>
        )}
      </div>

      {loading && (
        <div className="loading-screen" style={{ minHeight: 120 }}><div className="spinner" /></div>
      )}

      {/* ── Hero Aurora ─────────────────────────────────────────────────── */}
      {!loading && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, position: "relative" }}>
          {/* Glow de fondo */}
          <div style={{
            position: "absolute", top: -20, left: "50%", transform: "translateX(-50%)",
            width: 280, height: 180,
            background: "radial-gradient(ellipse, var(--accent) 0%, transparent 70%)",
            opacity: 0.08, filter: "blur(24px)", pointerEvents: "none",
          }} />

          {/* Anillo */}
          <ProgressRing done={sesHechas} total={sesObj > 0 ? sesObj : 1} />

          {/* Glass card — hoy toca / próxima sesión */}
          <div
            className={`glass-card aurora-anim aurora-anim-1`}
            style={{ width: "100%", maxWidth: 360, cursor: programa ? "pointer" : "default" }}
            onClick={() => programa && navigate(`/programa/${programa.idPrograma}`)}
          >
            {semanaCompleta ? (
              <div style={{ textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: 20 }}>🎉</p>
                <p style={{ margin: "6px 0 4px", fontWeight: 700, fontSize: 16 }}>¡Semana completa!</p>
                <p style={{ margin: "0 0 12px", color: "var(--muted)", fontSize: 13 }}>
                  Descansá o elegí otra rutina para seguir.
                </p>
                <button className="btn-secondary" onClick={(e) => { e.stopPropagation(); navigate("/entrenar"); }}>
                  Elegir otra rutina
                </button>
              </div>
            ) : hoy?.tipo === "descanso" ? (
              <div style={{ textAlign: "center" }}>
                <Moon size={28} color="var(--muted)" strokeWidth={1.5} style={{ marginBottom: 8 }} />
                <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: 16 }}>Día de descanso</p>
                <p style={{ margin: "0 0 12px", color: "var(--muted)", fontSize: 13 }}>
                  Recuperá. La recuperación es parte del entrenamiento.
                </p>
                <button
                  className="btn-secondary"
                  onClick={(e) => { e.stopPropagation(); navigate("/entrenar"); }}
                >
                  Entrenar igual
                </button>
              </div>
            ) : hoy?.tipo === "rutina" ? (
              <>
                <p className="t-label" style={{ margin: "0 0 6px" }}>
                  {hoy.yaHecha ? "Ya entrenaste hoy" : "Hoy toca"}
                </p>
                <p style={{ margin: "0 0 8px", fontWeight: 800, fontSize: 18, letterSpacing: "-.01em" }}>
                  {hoy.etiqueta.replace(/^[^—–]*[—–]\s*/, "")}
                </p>
                {!hoy.yaHecha && (
                  <button
                    className="btn-primary"
                    onClick={(e) => { e.stopPropagation(); navigate(`/entrenar/${hoy.idRutina}`); }}
                  >
                    <Zap size={18} /> Empezar
                  </button>
                )}
              </>
            ) : proxima ? (
              <>
                <p className="t-label" style={{ margin: "0 0 6px" }}>
                  Próxima sesión · Día {proxima.indice} de {proxima.total}
                </p>
                <p style={{ margin: "0 0 8px", fontWeight: 800, fontSize: 18, letterSpacing: "-.01em" }}>
                  {proxima.dia.idRutina
                    ? proxima.dia.etiqueta.replace(/^[^—–]*[—–]\s*/, "")
                    : proxima.dia.etiqueta}
                </p>
                {proxima.dia.diaSemana && (
                  <p style={{ margin: "0 0 12px", fontSize: 12, color: "var(--muted)" }}>
                    Planificado: {proxima.dia.diaSemana}
                  </p>
                )}
                <button
                  className="btn-primary"
                  onClick={(e) => { e.stopPropagation(); proxima.dia.idRutina && navigate(`/entrenar/${proxima.dia.idRutina}`); }}
                  disabled={!proxima.dia.idRutina}
                >
                  <Zap size={18} /> Empezar
                </button>
              </>
            ) : (
              <div style={{ textAlign: "center" }}>
                <p style={{ margin: "0 0 12px", color: "var(--muted)", fontSize: 14 }}>
                  No hay un programa activo. Elegí uno en Biblioteca.
                </p>
                <button className="btn-secondary" onClick={(e) => { e.stopPropagation(); navigate("/biblioteca"); }}>
                  Ver programas
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Bento row ───────────────────────────────────────────────────── */}
      {!loading && sesObj > 0 && (
        <div className={`bento-row ${hasPeso ? "bento-row-3" : "bento-row-2"}`}>
          {/* Volumen */}
          <BentoTile label="Volumen" animClass="aurora-anim aurora-anim-2">
            <span className="bento-value">{volumen > 0 ? fmtKg(volumen) : "—"}</span>
            <span style={{ fontSize: 11, color: "var(--muted)" }}>kg esta sem.</span>
          </BentoTile>

          {/* Peso — solo si hay medición */}
          {hasPeso && (
            <BentoTile label="Peso" animClass="aurora-anim aurora-anim-3">
              <span className="bento-value">{lastMed!.pesoKg} kg</span>
              {pesoDelta !== null && (
                <span className="bento-delta" style={{
                  color: pesoDelta < 0 ? "var(--accent)" : pesoDelta > 0 ? "var(--danger)" : "var(--muted)",
                }}>
                  {pesoDelta > 0 ? "+" : ""}{pesoDelta.toFixed(1)} kg
                </span>
              )}
            </BentoTile>
          )}

          {/* Racha */}
          <BentoTile label="Racha" animClass={`aurora-anim ${hasPeso ? "aurora-anim-4" : "aurora-anim-3"}`}>
            <span className="bento-value" style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {racha > 0
                ? <><Flame size={18} fill="var(--accent)" strokeWidth={0} style={{ flexShrink: 0 }} /> {racha}</>
                : "—"}
            </span>
            {racha > 0 && (
              <span style={{ fontSize: 11, color: "var(--muted)" }}>{racha === 1 ? "sem" : "sems"}</span>
            )}
          </BentoTile>
        </div>
      )}

      {/* ── Vista semanal del programa activo (Aurora) ──────────────────── */}
      {!loading && programa && (
        <div
          className="card"
          style={{ padding: "14px 16px", cursor: "pointer" }}
          onClick={() => navigate(`/programa/${programa.idPrograma}`)}
        >
          <p className="t-label" style={{ marginBottom: 10 }}>
            {programa.nombre} · {programa.dias.filter((d) => d.tipo !== "descanso").length} días/sem
          </p>
          <VistaSemanal
            dias={programa.dias}
            hoy={jsDayToNum(new Date().getDay())}
          />
        </div>
      )}
    </div>
  );
}
