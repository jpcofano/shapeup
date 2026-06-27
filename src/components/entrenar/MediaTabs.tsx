import { useState, useEffect } from "react";
import { Dumbbell, Play } from "lucide-react";
import type { Ejercicio } from "../../types/models";
import { BodyMap } from "../BodyMap";

type Tab = "demo" | "musculo";

interface Props {
  ej: Ejercicio | undefined;
}

/**
 * Segmented control Demo/Músculo + frame 16:11.
 * - Demo: foto como póster → al click reproduce `ej.videoUrl` (autoplay/loop/muted).
 *   Sin video o error de carga: vuelve a la foto + nota "Video pronto".
 * - Músculo: BodyMap con el mapa de regiones del ejercicio.
 *
 * Se resetea a "Demo" cuando cambia el ejercicio.
 */
export function MediaTabs({ ej }: Props) {
  const [tab,        setTab]        = useState<Tab>("demo");
  const [playing,    setPlaying]    = useState(false);
  const [buffering,  setBuffering]  = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [imgError,   setImgError]   = useState(false);

  useEffect(() => {
    setTab("demo");
    setPlaying(false);
    setBuffering(false);
    setVideoError(false);
    setImgError(false);
  }, [ej?.idEjercicio]);

  const imgSrc = ej?.imagenes?.[0];
  const tieneVideo = !!ej?.videoUrl && !videoError;

  return (
    <div className="media-tabs">
      {/* Segmented control */}
      <div className="media-seg" role="tablist">
        {(["demo", "musculo"] as Tab[]).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            className={`media-seg-btn${tab === t ? " active" : ""}`}
            onClick={() => { setTab(t); if (t !== "demo") setPlaying(false); }}
          >
            {t === "demo" ? "Demo" : "Músculo"}
          </button>
        ))}
      </div>

      {/* Frame 16:11 */}
      <div className="media-frame">

        {/* ── Demo ── */}
        {tab === "demo" && (
          playing && tieneVideo ? (
            <>
              <video
                key={ej!.videoUrl}
                src={ej!.videoUrl}
                autoPlay
                muted
                loop
                playsInline
                controls
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                onWaiting={() => setBuffering(true)}
                onCanPlay={() => setBuffering(false)}
                onError={() => { setVideoError(true); setPlaying(false); }}
              />
              {buffering && (
                <div className="media-playing">
                  <div className="spinner" />
                  <span>Cargando demo…</span>
                </div>
              )}
            </>
          ) : (
            <div
              className="media-play-overlay"
              onClick={() => { if (tieneVideo) setPlaying(true); }}
              style={{ cursor: tieneVideo ? "pointer" : "default" }}
            >
              {imgSrc && !imgError ? (
                <img
                  src={imgSrc}
                  alt={ej?.nombre ?? ""}
                  loading="lazy"
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: tieneVideo ? 1 : 0.6 }}
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="media-placeholder">
                  <Dumbbell size={32} color="var(--muted)" />
                </div>
              )}
              {tieneVideo ? (
                <button className="media-play-btn" aria-label="Reproducir demo">
                  <Play size={22} fill="var(--on-accent)" color="var(--on-accent)" strokeWidth={0} />
                </button>
              ) : (
                <span className="media-badge media-badge-muted">Video pronto</span>
              )}
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

      {/* Crédito del clip representativo (Commons) */}
      {tab === "demo" && tieneVideo && ej?.videoEsGenerico && (
        <span className="media-credito">Demo: Wikimedia Commons · CC BY 3.0</span>
      )}
    </div>
  );
}
