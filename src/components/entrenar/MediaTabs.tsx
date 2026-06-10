import { useState, useEffect } from "react";
import { Dumbbell, Play } from "lucide-react";
import type { Ejercicio } from "../../types/models";
import { BodyMap } from "../BodyMap";

type Tab = "foto" | "demo" | "musculo";

interface Props {
  ej: Ejercicio | undefined;
}

/**
 * Segmented control Foto/Demo/Músculo + frame 16:11.
 * - Foto: imagen real o placeholder con Dumbbell.
 * - Demo: foto atenuada + play (placeholder B2 — video real se enchufa cuando exista).
 * - Músculo: BodyMap con el mapa de regiones del ejercicio.
 *
 * Se resetea a "Foto" cuando cambia el ejercicio.
 */
export function MediaTabs({ ej }: Props) {
  const [tab,      setTab]      = useState<Tab>("foto");
  const [playing,  setPlaying]  = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setTab("foto");
    setPlaying(false);
    setImgError(false);
  }, [ej?.idEjercicio]);

  const imgSrc = ej?.imagenes?.[0];

  return (
    <div className="media-tabs">
      {/* Segmented control */}
      <div className="media-seg" role="tablist">
        {(["foto", "demo", "musculo"] as Tab[]).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            className={`media-seg-btn${tab === t ? " active" : ""}`}
            onClick={() => { setTab(t); if (t !== "demo") setPlaying(false); }}
          >
            {t === "foto" ? "Foto" : t === "demo" ? "Demo" : "Músculo"}
          </button>
        ))}
      </div>

      {/* Frame 16:11 */}
      <div className="media-frame">

        {/* ── Foto ── */}
        {tab === "foto" && (
          imgSrc && !imgError ? (
            <img
              src={imgSrc}
              alt={ej?.nombre ?? ""}
              loading="lazy"
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="media-placeholder">
              <Dumbbell size={32} color="var(--muted)" />
            </div>
          )
        )}

        {/* ── Demo ── */}
        {tab === "demo" && (
          playing ? (
            <div className="media-playing">
              <div className="spinner" />
              <span>Reproduciendo demo…</span>
            </div>
          ) : (
            <div className="media-play-overlay" onClick={() => setPlaying(true)}>
              {imgSrc && !imgError && (
                <img
                  src={imgSrc}
                  alt=""
                  aria-hidden
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.35 }}
                  onError={() => {}}
                />
              )}
              <button className="media-play-btn" aria-label="Reproducir demo">
                <Play size={22} fill="var(--on-accent)" color="var(--on-accent)" strokeWidth={0} />
              </button>
              <span className="media-badge">Demo</span>
            </div>
          )
        )}

        {/* ── Músculo ── */}
        {tab === "musculo" && (
          ej ? (
            <div className="media-musc">
              <BodyMap primario={ej.grupoMuscularPrimario} secundarios={ej.gruposSecundarios} />
            </div>
          ) : (
            <div className="media-placeholder">
              <Dumbbell size={32} color="var(--muted)" />
            </div>
          )
        )}

      </div>
    </div>
  );
}
