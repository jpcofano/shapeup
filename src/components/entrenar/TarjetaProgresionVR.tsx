import type { Palanca, PrescripcionVR, SugerenciaVR } from "../../lib/progresionVR";

/** Lo que la persona eligió, y si vino de la sugerencia o lo puso a mano. */
export interface DecisionVR {
  palanca: Palanca | null;
  aceptada: boolean;
  fuente: "fc" | "descanso" | "manual";
  prescripcion: PrescripcionVR;
}

interface Props {
  sugerencia: SugerenciaVR;
  /** Los parámetros con los que se jugó la última vez. */
  usada: PrescripcionVR;
  /** Resumen medido de la última sesión, para la línea de datos. */
  ultima: {
    fecha: string;
    rondasHechas: number;
    rondasPedidas: number;
    fcTrabajo: number | null;
    zona: string | null;
    zonaObjetivo: string | null;
    /** Rondas descartadas por durar muy poco, con sus duraciones (P79b). */
    descartadas: number;
    durDescartadasSeg: number[];
    /** Descanso medido entre rondas válidas, y la pausa más larga excluida. */
    descansoSeg: number | null;
    pausaMayorSeg: number | null;
    /** Cómo se jugó, medido (P80): de corrido o marcando rondas. */
    modo: "rondas" | "tiempo";
    /** Minutos reales de juego y los que pedía la rutina (P80). */
    minutosReales: number | null;
    objetivoMin: number;
  };
  /** Aviso de §9.3, si la muñeca no viene midiendo en este juego. */
  avisoMuneca?: { juego: string; conArtefactos: number; miradas: number } | null;
  onDecidir: (d: DecisionVR) => void;
}

function fechaCorta(ymd: string): string {
  const [y, m, d] = ymd.split("-");
  const dias = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
  const dia = dias[new Date(Number(y), Number(m) - 1, Number(d)).getDay()];
  return `${dia} ${Number(d)}/${Number(m)}`;
}

/** Las palancas que cambian parámetros; las otras son indicaciones. */
function cambiaParametros(p: Palanca | null): boolean {
  return p === "recortar-descanso" || p === "sumar-ronda" || p === "sumar-tiempo";
}

/**
 * Lo que la app propone al abrir una rutina de VR (P79, §9.2).
 *
 * Una línea de datos —**solo con lo medido**— y una de sugerencia. La
 * sensación de la persona no aparece acá: no entra en la decisión y mostrarla
 * al lado del dato medido invitaría a confundirlas.
 *
 * **La persona siempre tiene la última palabra**: el sistema sugiere, no
 * impone. Y cuando no hay medición con qué decidir, no inventa una sugerencia:
 * lo dice y ofrece las opciones.
 */
export function TarjetaProgresionVR({ sugerencia, usada, ultima, avisoMuneca, onDecidir }: Props) {
  const sinMedicion = sugerencia.palanca === null;

  // Lo que se descartó se dice, sin opinar sobre la decisión (P79b).
  const nota = (() => {
    const partes: string[] = [];
    if (ultima.modo === "tiempo") return partes;
    if (ultima.descartadas > 0) {
      const durs = [...new Set(ultima.durDescartadasSeg)].sort((a, b) => a - b);
      const rango = durs.length > 1 ? `${durs[0]}–${durs[durs.length - 1]}` : `${durs[0]}`;
      partes.push(`${ultima.descartadas} descartada${ultima.descartadas === 1 ? "" : "s"} por durar ${rango} s`);
    }
    if (ultima.pausaMayorSeg != null) {
      partes.push(`una pausa de ${Math.round(ultima.pausaMayorSeg / 60)} min no se contó como descanso`);
    }
    return partes;
  })();

  // La línea se arma por partes: "N de M rondas [válidas]" y después lo que
  // haya medido, según de dónde salió la decisión.
  const lineaDatos = (() => {
    // Jugada de corrido, lo que se hizo se cuenta en minutos: las rondas no se
    // marcaron porque no se pueden marcar, no porque falten (P80).
    const rondas = ultima.modo === "tiempo" && ultima.minutosReales != null
      ? `${Math.round(ultima.minutosReales)} de ${ultima.objetivoMin} min`
      : `${ultima.rondasHechas} de ${ultima.rondasPedidas} rondas`
        + (ultima.descartadas > 0 ? " válidas" : "");

    if (sinMedicion) return `${rondas} · ${sugerencia.motivo}`;

    if (sugerencia.fuente === "descanso") {
      const medido = ultima.descansoSeg != null
        ? ` · descanso medido ${Math.round(ultima.descansoSeg)} s`
        : "";
      return `${rondas} · sin FC confiable — decidido por el descanso que tomaste${medido}`;
    }

    return rondas
      + (ultima.fcTrabajo != null ? ` · FC de trabajo ${Math.round(ultima.fcTrabajo)}` : "")
      + (ultima.zona ? ` (${ultima.zona})` : "")
      + (ultima.zonaObjetivo ? ` · objetivo ${ultima.zonaObjetivo}` : "");
  })();

  function elegir(palanca: Palanca | null, aceptada: boolean, prescripcion: PrescripcionVR, manual = false) {
    onDecidir({
      palanca,
      aceptada,
      fuente: manual ? "manual" : (sugerencia.fuente === "sin-medicion" ? "manual" : sugerencia.fuente),
      prescripcion,
    });
  }

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <p style={{ margin: 0, fontSize: 11, color: "var(--muted)" }}>
        La última vez · {fechaCorta(ultima.fecha)}
      </p>
      <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>{lineaDatos}</p>
      {nota.length > 0 && (
        <p style={{ margin: 0, fontSize: 11, color: "var(--muted)" }}>
          ({nota.join(" · ")})
        </p>
      )}

      {avisoMuneca && (
        <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>
          En {avisoMuneca.juego} la muñeca no viene midiendo bien:{" "}
          {avisoMuneca.conArtefactos} de tus últimas {avisoMuneca.miradas} sesiones con FC dudosa.
        </p>
      )}

      {sinMedicion ? (
        <>
          <p style={{ margin: "4px 0 0", fontSize: 14, fontWeight: 600 }}>
            Sin una medición confiable no hay con qué decidir. Elegí vos:
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            <button
              className="btn-secondary" style={{ fontSize: 13 }}
              onClick={() => elegir("mantener", false, usada, true)}
            >
              Como la última vez
            </button>
            {ultima.modo === "tiempo" ? (
              <button
                className="btn-secondary" style={{ fontSize: 13 }}
                onClick={() => elegir("sumar-tiempo", true,
                  { ...usada, duracionObjetivoMin: (usada.duracionObjetivoMin ?? 0) + 5 }, true)}
              >
                Sumar 5 min
              </button>
            ) : (
              <>
                <button
                  className="btn-secondary" style={{ fontSize: 13 }}
                  onClick={() => elegir("recortar-descanso", true,
                    { ...usada, descansoSeg: Math.max(30, usada.descansoSeg - 15) }, true)}
                >
                  Recortar descanso
                </button>
                <button
                  className="btn-secondary" style={{ fontSize: 13 }}
                  onClick={() => elegir("sumar-ronda", true, { ...usada, rondas: usada.rondas + 1 }, true)}
                >
                  Sumar ronda
                </button>
              </>
            )}
            <button
              className="btn-secondary" style={{ fontSize: 13 }}
              onClick={() => elegir("bajar", true, usada, true)}
            >
              Más fácil
            </button>
          </div>
        </>
      ) : (
        <>
          <p style={{ margin: "4px 0 0", fontSize: 14, fontWeight: 600 }}>{sugerencia.motivo}</p>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            {cambiaParametros(sugerencia.palanca) ? (
              <>
                <button
                  className="btn-secondary" style={{ fontSize: 13 }}
                  onClick={() => elegir(sugerencia.palanca, false, usada)}
                >
                  Como la última vez
                </button>
                <button
                  className="btn-primary" style={{ fontSize: 13 }}
                  onClick={() => elegir(sugerencia.palanca, true, sugerencia.nuevaPrescripcion)}
                >
                  Aplicar
                </button>
              </>
            ) : (
              <>
                <button
                  className="btn-secondary" style={{ fontSize: 13 }}
                  onClick={() => elegir(sugerencia.palanca, false, usada)}
                >
                  No esta vez
                </button>
                <button
                  className="btn-primary" style={{ fontSize: 13 }}
                  onClick={() => elegir(sugerencia.palanca, true, sugerencia.nuevaPrescripcion)}
                >
                  Entendido
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
