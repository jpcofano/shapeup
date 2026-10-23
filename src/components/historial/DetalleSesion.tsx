import type { ReactNode } from "react";
import { ChevronLeft, ChevronDown, Timer, Flame, Heart, Activity, Moon, ChartLine } from "lucide-react";
import type { BiometriaSesion, Historial } from "../../types/models";
import type { NocheSueno } from "../../lib/sueno";
import type { ComparativaCardiaca } from "../../lib/costoCardiaco";
import { COBERTURA_MINIMA, avisoDeRecorte } from "../../lib/matchBiometrico";
import { motivoSaltoLabel, MOTIVOS_SUSTITUCION } from "../../lib/entrenarState";
import { ZONAS_MOLESTIA } from "../../lib/resumenSesion";
import { explicarSinBiometria } from "../../lib/estadoPuente";
import { textoVentanaAdoptada } from "../../lib/minutosPorZona";
import { seEnriquece } from "../../lib/tipoHistorial";
import { ymdLocal } from "../../lib/semana";
import { lineaCambio } from "../../lib/cambioDia";
import { textoMarca } from "../../lib/marcasSesion";
import { NOMBRE_ZONA } from "../../lib/zonas";
import { tituloSesion, lineaFecha, zonaDominante, horasYMinutos, minutosDelBloque, sinVR } from "../../lib/detalleSesion";
import { BarraZonas } from "../BarraZonas";
import { AnalisisSesion } from "./AnalisisSesion";
import { useMarcasPantalla, BloqueAnalisis, TarjetaFrecuencia } from "./CabeceraMarcas";
import { TiempoEnZonas } from "./TiempoEnZonas";

const MATCH_POR_LABEL: Record<BiometriaSesion["matchPor"], string> = {
  "custom-id": "por ID",
  "ventana":   "por ventana",
  "dia":       "por día (único ShapeUp)",
  "rango":     "por rango horario",
  "directo":   "dato propio",       // entrada externa: el dato es de ella misma (P75)
};

interface Props {
  h: Historial;
  /** El historial del miembro (récord, semana, análisis). `null` mientras carga. */
  historial: Historial[] | null;
  errorHistorial?: string | null;
  nocheAnterior: NocheSueno | null;
  comparativa: ComparativaCardiaca | null;
  /** Última subida del puente, para explicar una sesión sin biometría (P88). */
  ultimaCorrida: number | null;
  /** El nombre de la rutina prevista, si se hizo en su lugar (P102). */
  nombrePrevista: string | null;
  /** La FC de reposo del día, para el análisis; hoy null siempre (P106, sin fuente). */
  fcReposoDia?: number | null;
  onVolver: () => void;
  onCambio: (h: Historial) => void;
}

/**
 * «El reloj midió N de los M minutos.» y, si falta bastante, qué pasó (P78).
 * Información, no un error: sin íconos de alerta ni rojo, en minutos.
 */
function textoCobertura(b: BiometriaSesion, duracionMin: number | null): string | null {
  if (b.coberturaFina == null || duracionMin == null || duracionMin <= 0) return null;
  const medidos = Math.round(b.coberturaFina * duracionMin);
  const faltan = Math.max(0, duracionMin - medidos);
  const frase =
    b.motivoCobertura === "cortado-antes"        ? `el reloj se cortó a los ${medidos} min`
    : b.motivoCobertura === "arranco-tarde"      ? `el reloj arrancó ${faltan} min después que la sesión`
    : b.motivoCobertura === "hueco-entre-tramos" ? `hay ${faltan} min sin registrar en el medio`
    : b.motivoCobertura === "sin-cortar"         ? "el reloj siguió grabando después de terminar"
    : null;
  return `El reloj midió ${medidos} de los ${duracionMin} minutos.`
    + (b.coberturaFina < COBERTURA_MINIMA && frase ? ` Datos parciales: ${frase}.` : "");
}

/**
 * El detalle de una sesión (P109, referencia `docs/prompts/109-diseno/DetalleFinal.html`).
 * Presentacional: `HistorialDetalle` carga los datos y `/qa/sesion` lo usa con
 * la sesión testigo. **La lógica no cambia** (ADR #044 y #047): lo medido y lo
 * interpretado siguen separados; solo cambia cómo se ve.
 */
export function DetalleSesion({
  h, historial, errorHistorial, nocheAnterior, comparativa, ultimaCorrida, nombrePrevista, fcReposoDia = null, onVolver, onCambio,
}: Props) {
  const { marcas, calidad, badges, secundarias } = useMarcasPantalla(h, historial);
  const { sobre, nombre } = tituloSesion(h);
  const b = h.biometria;
  const cambio = lineaCambio(h, nombrePrevista);

  // Las tarjetas de datos: la que falta no va; si queda una sola en su fila, ocupa las dos columnas.
  const stats = [
    h.duracionRealMin != null && { clave: "duracion", icono: <Timer size={16} />, etiqueta: "Duración", valor: h.duracionRealMin, unidad: "min" },
    b?.kcal != null && { clave: "kcal", icono: <Flame size={16} />, etiqueta: "Calorías", valor: `${b.kcalEstimada ? "~" : ""}${b.kcal}`, unidad: "kcal" },
    b?.fcMedia != null && { clave: "fcMedia", icono: <Heart size={16} />, etiqueta: "FC media", valor: Math.round(b.fcMedia), unidad: "ppm" },
    b?.fcMax != null && { clave: "fcMax", icono: <Activity size={16} />, etiqueta: "FC máxima", valor: b.fcMax, unidad: "ppm" },
  ].filter(Boolean) as { clave: string; icono: ReactNode; etiqueta: string; valor: number | string; unidad: string }[];
  const cobertura = b ? textoCobertura(b, h.duracionRealMin) : null;

  const bloques = h.bloques ?? [];
  const varios = bloques.length > 1;
  const resumenEjercicios = [
    h.totalSeriesHechas != null ? `${h.totalSeriesHechas} ${h.totalSeriesHechas === 1 ? "serie" : "series"}` : null,
    h.tonelajeKg != null && h.tonelajeKg > 0 ? `${h.tonelajeKg.toLocaleString("es")} kg de tonelaje` : null,
    h.rpe != null ? `RPE ${h.rpe}` : null,
  ].filter(Boolean).join(" · ");

  // «Más datos de la curva»: las secundarias de hoy y lo técnico del reloj, plegado.
  const masDatos = [
    secundarias.length > 0 ? secundarias.map((m) => textoMarca(m)).join(" · ") : null,
    comparativa
      ? `FC media ${Math.round(comparativa.fcMediaActual)} · ${comparativa.deltaBpm > 0 ? "+" : ""}${Math.round(comparativa.deltaBpm)} ppm vs tus últimas ${comparativa.sesionesPrevias} sesiones de esta rutina`
      : null,
    b ? `Match ${MATCH_POR_LABEL[b.matchPor]} · ${b.granularidad}` : null,
    b ? avisoDeRecorte(b) : null,
    b?.ventanaAdoptada === "samsung" && b.desfaseDuracionPct != null && b.desfaseDuracionPct !== 0
      ? textoVentanaAdoptada(b.desfaseDuracionPct) : null,
  ].filter((x): x is string => !!x);

  return (
    <div className="page">
      <div className="detalle-header">
        <button type="button" className="btn-redondo" aria-label="Volver al historial" onClick={onVolver}>
          <ChevronLeft size={20} />
        </button>
        <span className="detalle-header-titulo">Historial</span>
        {/* Sin menú de más opciones todavía: el lugar queda para centrar el título. */}
        <span className="btn-redondo-vacio" aria-hidden />
      </div>

      <div data-seccion="titulo" className="detalle-titulo">
        <span className="detalle-sobretitulo">{sobre}</span>
        <h1 className="t-display">{nombre}</h1>
        <span className="detalle-fecha">
          {lineaFecha(h)}
          {h.completitud === "parcial" && <span className="badge badge-warn" style={{ marginLeft: 8 }}>Parcial</span>}
        </span>
        {cambio && <span className="detalle-fecha">{cambio}</span>}
      </div>

      <BloqueAnalisis h={h} calidad={calidad} badges={badges} />

      <TarjetaFrecuencia h={h} marcas={marcas} />
      {!b && (
        <p data-seccion="sin-biometria" style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>
          {/* P88: si terminó después de la última subida del puente, todavía no llegaron. */}
          {(seEnriquece(h) ? explicarSinBiometria(h, ultimaCorrida, ymdLocal()) : null) ?? "Sin datos del reloj para esta sesión."}
        </p>
      )}

      {stats.length > 0 && (
        <div data-seccion="stats" className="stat-grid">
          {stats.map((s, i) => (
            <div key={s.clave} data-stat={s.clave}
              className={`card stat-tile${stats.length % 2 === 1 && i === stats.length - 1 ? " ancho" : ""}`}>
              <div className="stat-tile-etiqueta">{s.icono}{s.etiqueta}</div>
              <span className="stat-tile-valor">{s.valor}<small> {s.unidad}</small></span>
            </div>
          ))}
        </div>
      )}
      {cobertura && <p data-seccion="cobertura" className="detalle-nota">{cobertura}</p>}
      {/* La zona principal de la sesión, cuando ningún ejercicio la muestra (juego, sin ejercicios, varios sin minutos). */}
      {b?.zonaPrincipal && !bloques.some((bl, _i, todos) => zonaDominante(bl) || todos.length === 1) && (
        <p data-seccion="zona-principal" className="detalle-nota" style={{ marginTop: 0 }}>
          Zona principal:{" "}
          <span data-zona-dominante={b.zonaPrincipal} className="chip-zona"
            style={{ background: `var(--zona-${b.zonaPrincipal.toLowerCase()}-dim)`, color: `var(--zona-${b.zonaPrincipal.toLowerCase()})` }}>
            {NOMBRE_ZONA[b.zonaPrincipal]}
          </span>
        </p>
      )}
      {bloques.length === 0 && resumenEjercicios && (
        <p data-seccion="resumen-sin-ejercicios" className="detalle-nota" style={{ marginTop: 0 }}>{resumenEjercicios}</p>
      )}

      {b?.minutosPorZona && (
        <TiempoEnZonas
          porZona={b.minutosPorZona}
          sinDato={b.minutosSinDato}
          bajoZonas={b.minutosBajoZonas}
          zonas={b.zonasUsadas}
          fcMax={b.fcMaxUsada}
        />
      )}

      {/* «Lo que hiciste» (antes «Series registradas»). Una sesión de juego no tiene ejercicios. */}
      {bloques.length > 0 && (
        <div data-seccion="lo-que-hiciste" className="card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <span className="tarjeta-titulo">Lo que hiciste</span>
          {resumenEjercicios && <span className="t-secondary" style={{ marginTop: -6 }}>{resumenEjercicios}</span>}
          {bloques.map((bl, i) => {
            const completadas = bl.series.filter((s) => s.completada);
            const detalle = completadas
              .filter((s) => s.cargaKg != null || s.rir != null)
              .map((s) => [
                s.cargaKg != null ? `${s.reps ?? "?"}×${s.cargaKg}kg` : `${s.reps ?? "?"} reps`,
                s.rir != null ? `RIR ${s.rir}` : null,
              ].filter(Boolean).join(" "))
              .join(", ");
            const minutos = minutosDelBloque(bl);
            const zona = zonaDominante(bl) ?? (bloques.length === 1 ? b?.zonaPrincipal ?? null : null);
            return (
              <div key={i} data-ejercicio={i} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div className="ejercicio-fila">
                  <span className="ejercicio-num">{i + 1}</span>
                  <div className="ejercicio-info">
                    <p className="ejercicio-nombre">{sinVR(bl.nombreEjercicio)}</p>
                    <p className="t-secondary" style={{ margin: "2px 0 0" }}>
                      {completadas.length} de {bl.series.length} series{minutos != null ? ` · ${minutos} min` : ""}
                      {detalle ? ` · ${detalle}` : ""}
                    </p>
                    {bl.idEjercicioOriginal && (
                      <p className="t-secondary" style={{ margin: "2px 0 0" }}>
                        Sustituye a {bl.nombreEjercicioOriginal ?? bl.idEjercicioOriginal}
                        {bl.motivoSustitucion
                          ? ` · ${MOTIVOS_SUSTITUCION.find(([v]) => v === bl.motivoSustitucion)?.[1] ?? bl.motivoSustitucion}`
                          : ""}
                      </p>
                    )}
                    {bl.saltado && (
                      <p style={{ margin: "2px 0 0", fontSize: 13, color: "var(--warning)" }}>
                        {motivoSaltoLabel(bl.motivoSalto) ? `Salteado · ${motivoSaltoLabel(bl.motivoSalto)}` : "Salteado"}
                      </p>
                    )}
                  </div>
                  {zona && (
                    <span data-zona-dominante={zona} className="chip-zona"
                      style={{ background: `var(--zona-${zona.toLowerCase()}-dim)`, color: `var(--zona-${zona.toLowerCase()})` }}>
                      {NOMBRE_ZONA[zona]}
                    </span>
                  )}
                </div>
                {/* Con más de un ejercicio, cada uno suma una barra fina, sin texto. */}
                {varios && bl.minutosPorZona && (
                  <div data-barra-ejercicio={i} style={{ paddingLeft: 48 }}>
                    <BarraZonas porZona={bl.minutosPorZona} bajoZonas={bl.minutosBajoZonas} conLeyenda={false} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Cómo te sentiste (P70): solo si hay algo cargado. */}
      {(h.comoMeSenti || (h.molestias && h.molestias.length > 0) || h.queMejorar || h.notas) && (
        <div className="card">
          <p className="tarjeta-titulo" style={{ margin: "0 0 8px" }}>Cómo te sentiste</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 14 }}>
            {h.comoMeSenti && <p style={{ margin: 0 }}><span style={{ color: "var(--muted)" }}>Sensación: </span>{h.comoMeSenti}</p>}
            {h.molestias && h.molestias.length > 0 && (
              <p style={{ margin: 0 }}>
                <span style={{ color: "var(--muted)" }}>Molestias: </span>
                {h.molestias.map((z) => ZONAS_MOLESTIA.find(([v]) => v === z)?.[1] ?? z).join(", ")}
              </p>
            )}
            {h.queMejorar && <p style={{ margin: 0 }}><span style={{ color: "var(--muted)" }}>Qué mejorar: </span>{h.queMejorar}</p>}
            {h.notas && <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.5 }}>{h.notas}</p>}
          </div>
        </div>
      )}

      {(nocheAnterior || masDatos.length > 0) && (
        <div data-seccion="filas" className="card lista-filas">
          {nocheAnterior && (
            <div data-fila="sueno" className="lista-fila">
              <Moon size={18} aria-hidden />
              <span style={{ flex: 1 }}>
                Dormiste {horasYMinutos(nocheAnterior.horasTotal)} la noche anterior
                {nocheAnterior.horaAcostarse && nocheAnterior.horaLevantarse && (
                  <span className="t-secondary"> · {nocheAnterior.horaAcostarse} → {nocheAnterior.horaLevantarse}</span>
                )}
              </span>
            </div>
          )}
          {masDatos.length > 0 && (
            <details data-fila="mas-datos">
              <summary className="lista-fila">
                <ChartLine size={18} aria-hidden />
                <span style={{ flex: 1 }}>Más datos de la curva</span>
                <ChevronDown size={18} aria-hidden className="fila-chevron" />
              </summary>
              <div data-seccion="secundarias" className="lista-fila-contenido">
                {masDatos.map((t, i) => <p key={i} style={{ margin: i ? "6px 0 0" : 0 }}>{t}</p>)}
              </div>
            </details>
          )}
        </div>
      )}

      {/* P93: el análisis asistido. Interpretación, al final y separada de lo medido (ADR #044). */}
      <AnalisisSesion
        h={h}
        historial={historial}
        errorHistorial={errorHistorial}
        nocheAnterior={nocheAnterior}
        fcReposoDia={fcReposoDia}
        onCambio={onCambio}
      />
    </div>
  );
}
