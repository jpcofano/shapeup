import { useMemo } from "react";
import type { Historial } from "../../types/models";
import { marcasDeSesion, separarPorNivel, textoMarca } from "../../lib/marcasSesion";
import { ventanaDelAnalisis } from "../../lib/analisis";
import { CurvaSesion } from "./CurvaSesion";

interface Props {
  h: Historial;
  /** El historial del miembro, para el récord y la semana. `null` mientras carga. */
  historial: Historial[] | null;
}

/**
 * Lo primero de la pantalla de una sesión (P99 §6, P103), de arriba hacia abajo:
 *   1. la calidad, si hay un problema: va primero porque cambia cómo se lee el resto;
 *   2. el veredicto del análisis (esquema 3);
 *   3. los badges de nivel 1, en el orden del catálogo;
 *   4. los dos destacados del análisis;
 *   5. la curva, con las marcas que tienen momento o tramo;
 *   6. las secundarias de nivel 2, en una fila discreta y sin color.
 * El detalle del análisis va plegado más abajo (`AnalisisSesion`).
 *
 * **Una sesión sin analizar se ve igual en todo lo medido**: 2 y 4 son lo único
 * que depende del análisis. Las marcas son lo medido (ADR #044).
 */
export function CabeceraMarcas({ h, historial }: Props) {
  // Mientras el historial no cargó (o si falló), el récord y la semana no se
  // calculan: con la sesión sola, la semana diría «1 de N» y quedaría mal.
  const marcas = useMemo(() => {
    const todas = marcasDeSesion(h, { historial: historial ?? [] });
    return historial ? todas : todas.filter((m) => m.id !== "record" && m.id !== "semana");
  }, [h, historial]);
  const { badges, secundarias } = separarPorNivel(marcas);
  const calidad = badges.find((m) => m.id === "calidad");
  const otrosBadges = badges.filter((m) => m.id !== "calidad");
  const a = h.analisis;
  const veredicto = a?.veredicto;
  const destacados = a?.destacados ?? [];
  const ventana = ventanaDelAnalisis(h);
  const curva = h.biometria?.curva;

  if (!calidad && !veredicto && otrosBadges.length === 0 && destacados.length === 0 && !curva && secundarias.length === 0) {
    return null;
  }

  return (
    <div data-testid="cabecera-marcas" style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>
      {calidad && (
        <div data-seccion="calidad" className="aviso aviso-warn" style={{ margin: 0 }}>{textoMarca(calidad)}</div>
      )}

      {veredicto && (
        <p data-seccion="veredicto" style={{ margin: 0, fontSize: 16, fontWeight: 700, lineHeight: 1.35 }}>
          {veredicto}
          <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 500, color: "var(--muted)" }}>· análisis</span>
        </p>
      )}

      {otrosBadges.length > 0 && (
        <div data-seccion="badges" style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {otrosBadges.map((m) => (
            <span key={m.id} data-marca-id={m.id} className="badge badge-accent" style={{ fontSize: 12 }}>
              {textoMarca(m)}
            </span>
          ))}
        </div>
      )}

      {destacados.length > 0 && (
        <div data-seccion="destacados" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {destacados.map((d, i) => (
            <p key={i} style={{ margin: 0, fontSize: 13, lineHeight: 1.45, paddingLeft: 8, borderLeft: "2px dashed var(--border)" }}>
              {d}
            </p>
          ))}
        </div>
      )}

      {curva && ventana && (
        <div data-seccion="curva" className="card" style={{ padding: 10 }}>
          <CurvaSesion
            curva={curva}
            ventanaInicioMs={ventana.inicioMs}
            duracionS={Math.round((ventana.finMs - ventana.inicioMs) / 1000)}
            zonas={h.biometria?.zonasUsadas}
            marcasApp={marcas}
            marcasAnalisis={a?.marcasAnalisis}
          />
        </div>
      )}

      {secundarias.length > 0 && (
        <p data-seccion="secundarias" style={{ margin: 0, fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>
          {secundarias.map((m) => textoMarca(m)).join(" · ")}
        </p>
      )}
    </div>
  );
}
