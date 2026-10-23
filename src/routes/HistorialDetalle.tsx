import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type { Historial, MetricaSalud, MiembroId } from "../types/models";
import { getHistorialEntry, getHistorialEnLaApp } from "../data/historial";
import { getRegistrosSueno, getMetricasSalud } from "../data/salud";
import { consolidarNoches } from "../lib/sueno";
import { HAY_FUENTE_FC_REPOSO } from "../lib/resumenSalud";
import type { NocheSueno } from "../lib/sueno";
import { compararConPrevias } from "../lib/costoCardiaco";
import type { ComparativaCardiaca } from "../lib/costoCardiaco";
import { useAuth } from "../auth/useAuth";
import { leerEstadoPuente } from "../data/ingestaSdk";
import { seEnriquece } from "../lib/tipoHistorial";
import { getRutina } from "../data/rutinas";
import { DetalleSesion } from "../components/historial/DetalleSesion";

export function HistorialDetalle() {
  const { id }     = useParams<{ id: string }>();
  const navigate   = useNavigate();
  const [h, setH]  = useState<Historial | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [nocheAnterior, setNocheAnterior] = useState<NocheSueno | null>(null);
  const [fcDia,          setFcDia]        = useState<MetricaSalud | null>(null);
  const [comparativa,    setComparativa]  = useState<ComparativaCardiaca | null>(null);
  /** El historial del miembro: el costo cardíaco lo usa, y el análisis asistido (P93) como contexto. */
  const [historialMiembro, setHistorialMiembro] = useState<Historial[] | null>(null);
  /** Si el historial no se pudo leer: el análisis lo necesita para el récord y la semana (P99). */
  const [errorHistorial, setErrorHistorial] = useState<string | null>(null);
  const { user } = useAuth();
  /** Última subida del puente, solo si hace falta explicar una sesión sin biometría (P88). */
  const [ultimaCorrida,  setUltimaCorrida] = useState<number | null>(null);

  // Hook ANTES de los returns tempranos de abajo (ver el fix del React #310 en
  // EntrenarSesion). Una sola lectura, y solo para sesiones de la app que
  // todavía no tienen biometría: ahí puede ser que simplemente no haya llegado.
  useEffect(() => {
    if (!h || h.biometria || !seEnriquece(h) || !user?.uid) return;
    void leerEstadoPuente(user.uid).then((r) => {
      if (r.ok) setUltimaCorrida(r.value?.ultimaCorridaMs ?? null);
    });
  }, [h, user?.uid]);

  // P102: el nombre de la rutina que tocaba, si esta sesión se hizo en su
  // lugar. Una lectura, solo en ese caso.
  const [nombrePrevista, setNombrePrevista] = useState<string | null>(null);
  useEffect(() => {
    if (!h?.rutinaPrevista) return;
    void getRutina(h.rutinaPrevista).then((r) => { if (r.ok) setNombrePrevista(r.value.nombre); });
  }, [h?.rutinaPrevista]);

  useEffect(() => {
    if (!id) return;
    getHistorialEntry(id).then(async (r) => {
      if (!r.ok) { setError(r.error); setLoading(false); return; }
      setH(r.value);
      setLoading(false);

      // Carga contexto del día: sueño noche anterior consolidada, y el resto del
      // historial del miembro para el insight de costo cardíaco (I2). La FC en
      // reposo no se lee (P106): no hay una fuente real (HAY_FUENTE_FC_REPOSO).
      const entry = r.value;
      const [sRes, fRes, histRes] = await Promise.all([
        getRegistrosSueno(entry.miembro as MiembroId),
        HAY_FUENTE_FC_REPOSO
          ? getMetricasSalud(entry.miembro as MiembroId, "fc-reposo")
          : Promise.resolve({ ok: false as const, error: "sin fuente de FC en reposo" }),
        getHistorialEnLaApp(entry.miembro as MiembroId),
      ]);
      if (sRes.ok) {
        // NocheSueno.fecha = mañana del día en que te levantaste = fecha de la sesión
        const noches = consolidarNoches(sRes.value);
        const noche = noches.find((n) => n.fecha === entry.fechaRealizada);
        if (noche) setNocheAnterior(noche);
      }
      if (fRes.ok) {
        const met = fRes.value.find((m) => m.fecha === entry.fechaRealizada);
        if (met) setFcDia(met);
      }
      if (!histRes.ok) setErrorHistorial(histRes.error);
      if (histRes.ok) {
        setComparativa(compararConPrevias(entry, histRes.value));
        setHistorialMiembro(histRes.value);
      }
    });
  }, [id]);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (error)   return <p className="inline-error" style={{ margin: 16 }}>{error}</p>;
  if (!h)      return null;

  // P109: la pantalla es `DetalleSesion`; acá solo se cargan los datos.
  return (
    <DetalleSesion
      h={h}
      historial={historialMiembro}
      errorHistorial={errorHistorial}
      nocheAnterior={nocheAnterior}
      comparativa={comparativa}
      ultimaCorrida={ultimaCorrida}
      nombrePrevista={nombrePrevista}
      fcReposoDia={fcDia?.valor ?? null}
      onVolver={() => navigate(-1)}
      onCambio={setH}
    />
  );
}
