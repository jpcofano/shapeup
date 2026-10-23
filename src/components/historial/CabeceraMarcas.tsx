import { useMemo } from "react";
import { Sparkles } from "lucide-react";
import type { Historial, MarcaSesion } from "../../types/models";
import { marcasDeSesion, separarPorNivel, textoMarca } from "../../lib/marcasSesion";
import { ventanaDelAnalisis } from "../../lib/analisis";
import { CurvaSesion } from "./CurvaSesion";

/**
 * Las marcas de la pantalla de una sesión (P99 §6, P103; P109). Mientras el
 * historial no cargó (o si falló), el récord y la semana no se calculan: con
 * la sesión sola, la semana diría «1 de N» y quedaría mal.
 */
export interface MarcasPantalla {
  marcas: MarcaSesion[];
  calidad?: MarcaSesion;
  badges: MarcaSesion[];
  secundarias: MarcaSesion[];
}

export function useMarcasPantalla(h: Historial, historial: Historial[] | null): MarcasPantalla {
  return useMemo(() => {
    const todas = marcasDeSesion(h, { historial: historial ?? [] });
    const marcas = historial ? todas : todas.filter((m) => m.id !== "record" && m.id !== "semana");
    const { badges, secundarias } = separarPorNivel(marcas);
    return {
      marcas,
      calidad: badges.find((m) => m.id === "calidad"),
      badges: badges.filter((m) => m.id !== "calidad"),
      secundarias,
    };
  }, [h, historial]);
}

/**
 * Arriba del detalle (P109): la calidad, si hay un problema (va primero porque
 * cambia cómo se lee el resto); después, con un análisis de esquema 3, un
 * bloque con el veredicto, los destacados y los badges de nivel 1. Sin
 * análisis (o con esquema 2), los badges van solos: lo medido se ve igual
 * (ADR #044).
 */
export function BloqueAnalisis({ h, calidad, badges }: { h: Historial; calidad?: MarcaSesion; badges: MarcaSesion[] }) {
  const veredicto = h.analisis?.veredicto;
  const destacados = h.analisis?.destacados ?? [];
  const filaBadges = badges.length > 0 && (
    <div data-seccion="badges" className="detalle-badges">
      {badges.map((m) => (
        <span key={m.id} data-marca-id={m.id} className="badge badge-accent">{textoMarca(m)}</span>
      ))}
    </div>
  );

  return (
    <>
      {calidad && (
        <div data-seccion="calidad" className="aviso aviso-warn" style={{ margin: 0 }}>{textoMarca(calidad)}</div>
      )}
      {veredicto ? (
        <div data-seccion="analisis" className="detalle-analisis">
          <div className="detalle-analisis-etiqueta">
            <Sparkles size={16} color="var(--accent)" aria-hidden />
            <span className="t-label">Análisis</span>
          </div>
          <p data-seccion="veredicto" className="detalle-veredicto">{veredicto}</p>
          {destacados.length > 0 && (
            <ul data-seccion="destacados" className="detalle-destacados">
              {destacados.map((d, i) => <li key={i}>{d}</li>)}
            </ul>
          )}
          {filaBadges}
        </div>
      ) : filaBadges}
    </>
  );
}

/** La tarjeta «Frecuencia cardíaca»: la curva pintada por zona y las marcas como chips (P109). */
export function TarjetaFrecuencia({ h, marcas }: { h: Historial; marcas: MarcaSesion[] }) {
  const ventana = ventanaDelAnalisis(h);
  const curva = h.biometria?.curva;
  if (!curva || !ventana) return null;
  return (
    <div data-seccion="curva" className="card" style={{ padding: "16px 12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
      <div className="tarjeta-fc-cabecera">
        <span className="tarjeta-titulo">Frecuencia cardíaca</span>
        <span className="t-secondary">ppm</span>
      </div>
      <CurvaSesion
        curva={curva}
        ventanaInicioMs={ventana.inicioMs}
        duracionS={Math.round((ventana.finMs - ventana.inicioMs) / 1000)}
        zonas={h.biometria?.zonasUsadas}
        marcasApp={marcas}
        marcasAnalisis={h.analisis?.marcasAnalisis}
      />
    </div>
  );
}
