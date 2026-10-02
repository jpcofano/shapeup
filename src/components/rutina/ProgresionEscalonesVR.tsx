import { useEffect, useState } from "react";
import type { ConfigProgresion, Ejercicio, Historial, MiembroId, PerfilMiembro, Rutina } from "../../types/models";
import { getPerfiles, actualizarPerfil } from "../../data/perfiles";
import { getConfigProgresion } from "../../data/configProgresion";
import {
  aplicarSubida, escalonDeHoy, etiquetaDificultad, evaluarReglaVR, modosDe,
  CONFIG_PROGRESION_DEFAULT, type EstadoReglaVR, type MotivoReglaVR, type MotivoExclusionVR,
} from "../../lib/escalonesVR";
import { textoEscalon } from "../entrenar/InicioEscalonVR";

interface Props {
  rutina: Rutina;
  historial: Historial[];
  miembro: MiembroId;
  catalogo: Map<string, Ejercicio>;
}

const ESTADO: Record<EstadoReglaVR, string> = {
  "subir": "Subir de escalón",
  "mantener": "Mantener",
  "sin-datos": "Sin datos suficientes",
  "bajar-dificultad": "Bajar la dificultad",
};

/** La condición de la regla que decidió, dicha con los números. Sin interpretación. */
const MOTIVO: Record<MotivoReglaVR, string> = {
  "listo": "FC bajó el umbral o más, todas completadas",
  "fc-subio": "FC subió el umbral o más",
  "no-completo-dos-seguidas": "dos sesiones seguidas sin completar",
  "incompletas": "alguna sesión no contó como completada",
  "fc-sin-bajar": "FC no bajó el umbral",
  "en-el-tope": "último escalón",
  "pocas-sesiones": "faltan sesiones en el escalón",
  "pocas-semanas": "faltan semanas distintas",
  "pasa-techo": "FC sobre el techo de Z3 en dos sesiones seguidas",
  "debajo-techo": "FC no pasó el techo de Z3 en dos sesiones seguidas",
};

const EXCLUSION: Record<MotivoExclusionVR, string> = {
  "fc-dudosa": "FC dudosa",
  "cobertura": "cobertura baja",
  "discrepancia-duracion": "duración que no cierra",
  "sin-fc": "sin FC",
};

const NOMBRE_MODO = { bloques: "Por bloques", corrido: "De corrido" } as const;
const ddmm = (ymd: string) => `${ymd.slice(8, 10)}/${ymd.slice(5, 7)}`;
const conSigno = (n: number) => `${n > 0 ? "+" : ""}${n.toLocaleString("es-AR")}`;

/**
 * La progresión de una rutina de VR por escalones (P98, ADR #046), en la
 * pantalla de la rutina. Por modo y por juego: el escalón actual, el estado de
 * la regla y **solo los datos que usó** —la FC media de la última sesión, la de
 * la referencia, la diferencia contra el umbral y si contó como completada—
 * (enmienda del 01/10). «Subir de escalón» registra la subida en el perfil; la
 * rutina no se toca (ADR #039).
 */
export function ProgresionEscalonesVR({ rutina, historial, miembro, catalogo }: Props) {
  const [perfil, setPerfil] = useState<PerfilMiembro | undefined>(undefined);
  const [config, setConfig] = useState<ConfigProgresion>(CONFIG_PROGRESION_DEFAULT);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPerfiles().then((r) => { if (r.ok) setPerfil(r.value[miembro]); });
    getConfigProgresion().then((r) => { if (r.ok) setConfig(r.value); });
  }, [miembro]);

  const vr = rutina.vr;
  if (!vr || vr.regla === "ninguna") return null;
  const juegos = vr.regla === "bajar-si-pasa-techo" ? [vr.idEjercicio, ...(vr.alternativas ?? [])] : [vr.idEjercicio];

  async function subir(resultado: NonNullable<ReturnType<typeof evaluarReglaVR>>) {
    setError(null);
    const r = aplicarSubida(perfil, rutina, resultado, Date.now());
    if (!r.ok) { setError(r.error); return; }
    setGuardando(true);
    const w = await actualizarPerfil(miembro, { subidasVR: r.subidasVR });
    setGuardando(false);
    if (!w.ok) { setError(w.error); return; }
    setPerfil({ ...(perfil ?? {}), subidasVR: r.subidasVR });
  }

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <p className="section-title" style={{ margin: 0 }}>Progresión</p>
      {modosDe(rutina).flatMap((modo) => juegos.map((juego) => {
        const res = evaluarReglaVR({ historial, rutina, modo, idEjercicio: juego, perfil, config });
        const hoy = escalonDeHoy(rutina, modo, perfil);
        if (!res || !hoy) return null;
        const n = res.numeros;
        const ej = catalogo.get(juego);
        return (
          <div key={`${modo}-${juego}`} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>
              {NOMBRE_MODO[modo]}{juegos.length > 1 ? ` · ${ej?.nombre ?? juego}` : ""}
              {hoy.tope > 1 ? ` · escalón ${hoy.numero} de ${hoy.tope}` : ""}
            </p>
            <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>
              {textoEscalon(hoy.escalon)} · {etiquetaDificultad(hoy.escalon.dificultad, ej?.dificultadesVR)}
            </p>
            <p style={{ margin: 0, fontSize: 13 }}>
              <strong>{ESTADO[res.estado]}</strong> — {MOTIVO[res.motivo]}
            </p>
            <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: "var(--muted)" }}>
              <li>FC media de esta sesión: {n.fcUltima != null ? `${n.fcUltima.toLocaleString("es-AR")} bpm` : "—"}</li>
              {vr.regla === "subir" ? (
                <>
                  <li>Referencia (promedio de las dos primeras del escalón): {n.fcReferencia != null ? `${n.fcReferencia.toLocaleString("es-AR")} bpm` : "—"}</li>
                  <li>Diferencia: {n.diferencia != null ? `${conSigno(n.diferencia)} bpm` : "—"} · umbral ±{n.umbral}</li>
                </>
              ) : (
                <li>Techo de Z3: {n.techoZ3 != null ? `${n.techoZ3} bpm` : "—"}</li>
              )}
              <li>Contó como completada: {n.ultimaCompletada == null ? "—" : n.ultimaCompletada ? "sí" : "no"}</li>
              <li>Sesiones: {n.sesiones.length} · semanas distintas: {n.semanas}</li>
              {n.excluidas.length > 0 && (
                <li>Fuera del cálculo: {n.excluidas.map((x) => `${ddmm(x.fecha)} (${EXCLUSION[x.motivo]})`).join(", ")}</li>
              )}
            </ul>
            {res.estado === "subir" && (
              <button className="btn-primary" style={{ alignSelf: "flex-start" }} disabled={guardando || !perfil}
                onClick={() => void subir(res)}>
                {guardando ? "Guardando…" : `Subir al escalón ${res.escalon + 1}`}
              </button>
            )}
          </div>
        );
      }))}
      {error && <p style={{ margin: 0, fontSize: 12, color: "var(--danger)" }}>{error}</p>}
    </div>
  );
}
