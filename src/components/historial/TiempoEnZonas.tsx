import type { ZonaFC } from "../../types/models";
import { NOMBRE_ZONA } from "../../lib/zonas";

/** De la más intensa a la más baja, como Samsung. */
const ORDEN: ZonaFC[] = ["Z5", "Z4", "Z3", "Z2", "Z1"];

interface Props {
  /** Minutos por zona (`biometria.minutosPorZona`): de la curva si la hay, si no, de las muestras de Samsung. */
  porZona: Partial<Record<ZonaFC, number>>;
  /** Minutos sin dato (el reloj no midió). */
  sinDato?: number;
  /** Minutos por debajo de Z1. */
  bajoZonas?: number;
  /** Los rangos con que se calculó la sesión (`zonasUsadas`), para las ppm. */
  zonas?: Partial<Record<ZonaFC, { min: number; max: number }>>;
  /** La FC máxima de la sesión (`fcMaxUsada`). */
  fcMax?: number;
}

/** «m:ss» desde minutos. */
export function mmssDeMinutos(min: number): string {
  const s = Math.round(min * 60);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

const pct = (n: number) => `${n.toFixed(1).replace(".", ",")} %`;

/**
 * «Tiempo en zonas», estilo Samsung (P109, decisión 4): una barra resumen y una
 * fila por zona, de Z5 a Z1, con el nombre, el rango, el tiempo, el % y una
 * barra sobre su riel. Los % son sobre el tiempo con dato en zona. Al pie, el
 * tiempo sin dato si lo hubo. Sin minutos por zona, no se monta.
 */
export function TiempoEnZonas({ porZona, sinDato, bajoZonas, zonas, fcMax }: Props) {
  const total = ORDEN.reduce((s, z) => s + (porZona[z] ?? 0), 0) + (bajoZonas ?? 0);
  if (total <= 0) return null;
  const parte = (min: number) => (min / total) * 100;
  const presentes = [...ORDEN].reverse().filter((z) => (porZona[z] ?? 0) > 0);
  const masLarga = ORDEN.reduce<ZonaFC | null>((a, z) => ((porZona[z] ?? 0) > (a ? porZona[a] ?? 0 : 0) ? z : a), null);

  return (
    <div data-testid="tiempo-en-zonas" data-seccion="tiempo-en-zonas" className="card tiempo-zonas">
      <div className="tiempo-zonas-cabecera">
        <span className="tarjeta-titulo">Tiempo en zonas</span>
        {fcMax != null && <span className="t-secondary">FC máx. {fcMax}</span>}
      </div>
      <div
        className="tiempo-zonas-resumen"
        role="img"
        aria-label={presentes.map((z) => `${NOMBRE_ZONA[z]} ${pct(parte(porZona[z]!))}`).join(", ")}
      >
        {presentes.map((z) => (
          <div key={z} style={{ width: `${parte(porZona[z]!)}%`, background: `var(--zona-${z.toLowerCase()})` }} />
        ))}
      </div>
      <div className="tiempo-zonas-filas">
        {ORDEN.map((z) => {
          const min = porZona[z] ?? 0;
          const r = zonas?.[z];
          return (
            <div key={z} data-zona={z} className="tiempo-zonas-fila">
              <div className="tiempo-zonas-nombre">
                <span className="punto-zona" style={{ background: `var(--zona-${z.toLowerCase()})` }} />
                <span className="tiempo-zonas-etiqueta">{NOMBRE_ZONA[z]}</span>
                <span className="t-secondary">{z}</span>
                {r && <span className="t-secondary tiempo-zonas-rango">{r.min}–{r.max} ppm</span>}
              </div>
              <div className="tiempo-zonas-valores">
                <span className={`tiempo-zonas-tiempo${z === masLarga ? " fuerte" : ""}`}>{mmssDeMinutos(min)}</span>
                <span className="t-secondary tiempo-zonas-pct">{pct(parte(min))}</span>
                <div className="riel">
                  <div style={{ width: `${parte(min)}%`, background: `var(--zona-${z.toLowerCase()})` }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {(bajoZonas ?? 0) > 0 && (
        <p className="t-secondary" style={{ margin: 0 }}>Debajo de Z1: {mmssDeMinutos(bajoZonas!)}</p>
      )}
      {(sinDato ?? 0) > 0 && (
        <p data-testid="sin-dato" className="t-secondary" style={{ margin: 0 }}>Sin dato: {mmssDeMinutos(sinDato!)}, el reloj no midió.</p>
      )}
    </div>
  );
}
