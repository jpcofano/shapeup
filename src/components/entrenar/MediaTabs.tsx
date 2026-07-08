import { useState, useEffect, useRef } from "react";
import { Dumbbell, Play } from "lucide-react";
import type { Ejercicio } from "../../types/models";
import { BodyMap } from "../BodyMap";

type Tab = "demo" | "musculo";

interface Props {
  ej: Ejercicio | undefined;
}

/**
 * Determina el modo de visualización del Demo.
 * Precedencia: YouTube exacto > imágenes FEDB (exactas) > video webm no-genérico > vacío.
 * El video genérico (`videoEsGenerico: true`) queda siempre oculto.
 * Exportado para testing.
 */
export function demoMode(
  imagenes: string[],
  videoYoutubeId: string | undefined,
  videoUrl: string | undefined,
  videoEsGenerico: boolean | undefined,
  reducedMotion: boolean,
): "youtube" | "images-animated" | "images-static" | "video" | "empty" {
  if (videoYoutubeId) return "youtube";
  if (imagenes.length >= 2 && !reducedMotion) return "images-animated";
  if (imagenes.length >= 1) return "images-static";
  if (videoUrl && !videoEsGenerico) return "video";
  return "empty";
}

/**
 * Segmented control Demo/Músculo + frame 16:11.
 *
 * Demo — precedencia:
 *  1. videoYoutubeId → iframe youtube-nocookie (demo exacta, fix iOS de paso).
 *  2. imagenes FEDB  → loop animado de 2 frames o estático (demo exacta).
 *  3. videoUrl real  → botón play → <video> webm (demo no-genérica, fallback futuro).
 *  4. vacío          → placeholder (no "Video pronto").
 *
 * Video genérico (videoEsGenerico: true) → siempre oculto.
 */
export function MediaTabs({ ej }: Props) {
  const [tab,       setTab]       = useState<Tab>("demo");
  const [frame,     setFrame]     = useState(0);
  const [playing,   setPlaying]   = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    setTab("demo");
    setFrame(0);
    setPlaying(false);
    setBuffering(false);
    setVideoError(false);
  }, [ej?.idEjercicio]);

  const imagenes = ej?.imagenes ?? [];
  const effectiveVideoUrl = videoError ? undefined : ej?.videoUrl;
  const mode = demoMode(imagenes, ej?.videoYoutubeId, effectiveVideoUrl, ej?.videoEsGenerico, reducedMotion);

  // Interval del loop de imágenes
  useEffect(() => {
    if (tab !== "demo" || mode !== "images-animated") {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      return;
    }
    setFrame(0);
    intervalRef.current = setInterval(() => setFrame((f) => 1 - f), 1200);
    return () => {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    };
  }, [tab, mode]);

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
          <>
            {/* YouTube — demo exacta */}
            {mode === "youtube" && (
              playing ? (
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${ej!.videoYoutubeId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
                  title={ej?.nombre ?? "Demo"}
                />
              ) : (
                <div className="media-play-overlay" onClick={() => setPlaying(true)} style={{ cursor: "pointer" }}>
                  {imagenes[0] ? (
                    <img
                      src={imagenes[0]}
                      alt={ej?.nombre ?? ""}
                      loading="lazy"
                      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <div className="media-placeholder">
                      <Dumbbell size={32} color="var(--muted)" />
                    </div>
                  )}
                  <button className="media-play-btn" aria-label="Reproducir demo">
                    <Play size={22} fill="var(--on-accent)" color="var(--on-accent)" strokeWidth={0} />
                  </button>
                </div>
              )
            )}

            {/* Imágenes FEDB — demo exacta */}
            {(mode === "images-animated" || mode === "images-static") && (
              <div style={{ position: "absolute", inset: 0 }}>
                <img
                  src={imagenes[0]}
                  alt={ej?.nombre ?? ""}
                  loading="lazy"
                  style={{
                    position: "absolute", inset: 0,
                    width: "100%", height: "100%", objectFit: "cover",
                    opacity: frame === 0 || mode === "images-static" ? 1 : 0,
                    transition: mode === "images-animated" ? "opacity 0.25s ease" : "none",
                  }}
                />
                {mode === "images-animated" && imagenes[1] && (
                  <img
                    src={imagenes[1]}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    style={{
                      position: "absolute", inset: 0,
                      width: "100%", height: "100%", objectFit: "cover",
                      opacity: frame === 1 ? 1 : 0,
                      transition: "opacity 0.25s ease",
                    }}
                  />
                )}
              </div>
            )}

            {/* Video webm real (no genérico) — fallback futuro */}
            {mode === "video" && (
              playing ? (
                <>
                  <video
                    key={effectiveVideoUrl}
                    src={effectiveVideoUrl}
                    autoPlay muted loop playsInline controls
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
                <div className="media-play-overlay" onClick={() => setPlaying(true)} style={{ cursor: "pointer" }}>
                  <button className="media-play-btn" aria-label="Reproducir demo">
                    <Play size={22} fill="var(--on-accent)" color="var(--on-accent)" strokeWidth={0} />
                  </button>
                </div>
              )
            )}

            {/* Sin demo disponible */}
            {mode === "empty" && (
              <div className="media-placeholder">
                <Dumbbell size={32} color="var(--muted)" />
              </div>
            )}
          </>
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

      {/* Crédito YouTube */}
      {tab === "demo" && mode === "youtube" && playing && (
        <span className="media-credito">Demo: YouTube</span>
      )}
    </div>
  );
}
