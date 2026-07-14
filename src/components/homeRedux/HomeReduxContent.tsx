import { useId } from "react";
import { Check, TrendingDown, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { WeekChip } from "../../lib/weekChips";

export type HomeReduxDireccion = "pulse" | "premium";

export interface HomeReduxButton {
  label: string;
  variant: "primary" | "secondary";
  icon?: LucideIcon;
  onClick?: () => void;
  disabled?: boolean;
}

export interface HomeReduxData {
  primerNombre: string;
  avatarIniciales: string;
  sesHechas: number;
  sesObj: number;
  diaLabel: string;
  hero: {
    icon: LucideIcon;
    tag: string;
    title: string;
    message?: string;
    buttons: HomeReduxButton[];
  };
  metrics: {
    volumen: string;
    volumenSub: string;
    peso: { valor: string; delta: string | null; deltaFavorable: boolean } | null;
    racha: number;
  };
  weekLabel: string;
  weekChips: WeekChip[];
}

interface Props {
  direccion: HomeReduxDireccion;
  data: HomeReduxData;
  onAvatarClick?: () => void;
}

function AButton({ b }: { b: HomeReduxButton }) {
  const Icon = b.icon;
  return (
    <button className={b.variant === "primary" ? "a-btn1" : "a-btn2"} onClick={b.onClick} disabled={b.disabled}>
      {Icon && <Icon />}
      {b.label}
    </button>
  );
}

function CButton({ b }: { b: HomeReduxButton }) {
  const Icon = b.icon;
  return (
    <button className={b.variant === "primary" ? "c-btn1" : "c-btn2"} onClick={b.onClick} disabled={b.disabled}>
      {Icon && <Icon />}
      {b.label}
    </button>
  );
}

/** Contenido de Home en las direcciones nuevas del handoff (P53). Presentacional puro. */
export function HomeReduxContent({ direccion, data, onAvatarClick }: Props) {
  const { primerNombre, avatarIniciales, sesHechas, sesObj, diaLabel, hero, metrics, weekLabel, weekChips } = data;
  const HeroIcon = hero.icon;
  const gradientId = `hr-pg-${useId()}`;
  const total = sesObj > 0 ? sesObj : 1;
  const pct = Math.min(1, sesHechas / total);

  if (direccion === "pulse") {
    const C = 2 * Math.PI * 66;
    const gapDeg = (16 / C) * 360;
    return (
      <>
        <div className="a-top">
          <div>
            <h1 className="a-hola">Dale, {primerNombre}<span className="acc" style={{ color: "var(--accent-muted)" }}>.</span></h1>
            <div className="a-dia">{diaLabel}</div>
          </div>
          <button className="a-avatar" onClick={onAvatarClick} style={{ border: "1px solid var(--accent-border)", cursor: onAvatarClick ? "pointer" : "default" }}>
            {avatarIniciales}
          </button>
        </div>

        <div className="a-ring">
          <svg width={176} height={176} viewBox="0 0 176 176">
            {Array.from({ length: total }, (_, i) => (
              <circle
                key={i}
                className={`seg ${i < sesHechas ? "on" : ""}`}
                cx={88} cy={88} r={66}
                strokeDasharray={`${C / total - 16} ${C - (C / total - 16)}`}
                transform={`rotate(${gapDeg / 2 + i * (360 / total)} 88 88)`}
              />
            ))}
          </svg>
          <div className="a-ring-c">
            <div className="a-ring-num">{sesHechas}<small>/{sesObj}</small></div>
            <div className="a-ring-lab">sesiones</div>
          </div>
        </div>

        <section className="a-hero">
          <svg className="a-hero-mark" viewBox="0 0 120 120" fill="none">
            <g stroke="currentColor" strokeWidth={13} strokeLinecap="round" strokeLinejoin="round">
              <path d="M30 60 L60 33 L90 60" />
              <path d="M30 87 L60 60 L90 87" />
            </g>
          </svg>
          <div className="a-hero-tag"><HeroIcon /> {hero.tag}</div>
          <h2 className="a-hero-title">{hero.title}</h2>
          {hero.message && <p className="a-hero-msg">{hero.message}</p>}
          {hero.buttons.map((b, i) => <AButton key={i} b={b} />)}
        </section>

        <div className="a-metrics">
          <div className="a-metric">
            <span className="l">Volumen</span>
            <span className="v">{metrics.volumen}</span>
            <span className="a-delta">{metrics.volumenSub}</span>
          </div>
          {metrics.peso && (
            <div className="a-metric">
              <span className="l">Peso</span>
              <span className="v">{metrics.peso.valor}</span>
              {metrics.peso.delta && (
                <span className={`a-delta ${metrics.peso.deltaFavorable ? "down" : ""}`}>{metrics.peso.delta}</span>
              )}
            </div>
          )}
          <div className="a-metric">
            <span className="l">Racha</span>
            <span className="v">{metrics.racha > 0 ? metrics.racha : "—"}</span>
            <span className="a-delta">{metrics.racha === 1 ? "semana" : "semanas"}</span>
          </div>
        </div>

        <section className="a-mob">
          <div className="a-mob-h">
            <span className="a-mob-t">{weekLabel}</span>
            <span className="a-mob-n">{weekChips.filter((c) => c.estado === "done").length}/7</span>
          </div>
          <div className="a-days">
            {weekChips.map((c) => (
              <div key={c.fecha} className={`a-day ${c.estado}`}>
                <span className="c">{c.estado === "done" ? <Check /> : c.estado === "today" ? <HeroIcon /> : <span className="pd" />}</span>
                <span>{c.letter}</span>
              </div>
            ))}
          </div>
        </section>
      </>
    );
  }

  // ── Premium (dir-c v21) ─────────────────────────────────────────────────
  const R = 82;
  const C2 = 2 * Math.PI * R;
  const arc = C2 * pct;
  // Forma + color: la flecha marca la dirección real del delta, el color (pos/neg)
  // marca si es favorable — así no se confunde con el acento cuando ambos son verdes.
  const DeltaIcon = metrics.peso?.delta?.trim().startsWith("-") ? TrendingDown : TrendingUp;
  return (
    <>
      <div className="c-top">
        <div>
          <h1 className="c-hola">Dale, {primerNombre}<span className="acc" style={{ color: "var(--accent-muted)" }}>.</span></h1>
          <div className="c-dia">{diaLabel}</div>
        </div>
        <button className="c-avatar" onClick={onAvatarClick} style={{ cursor: onAvatarClick ? "pointer" : "default" }}>
          {avatarIniciales}
        </button>
      </div>

      <div className="c-ring">
        <svg width={200} height={200} viewBox="0 0 200 200">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" style={{ stopColor: "var(--accent-solid)" }} />
              <stop offset="1" style={{ stopColor: "color-mix(in srgb, var(--accent-solid) 55%, #ffffff)" }} />
            </linearGradient>
          </defs>
          <circle className="tr" cx={100} cy={100} r={R} />
          <g transform="rotate(-90 100 100)">
            <circle className="pr" cx={100} cy={100} r={R} stroke={`url(#${gradientId})`} strokeDasharray={`${arc} ${C2}`} />
          </g>
        </svg>
        <div className="c-ring-c">
          <div className="c-ring-num">{sesHechas}<span className="den">/{sesObj}</span></div>
          <div className="c-ring-sub">sesiones esta semana</div>
        </div>
      </div>

      <section className="c-card pattern">
        <p className="c-lab">{hero.tag}</p>
        <h2 className="c-title"><span className="duo"><HeroIcon /></span>{hero.title}</h2>
        {hero.message && <p className="c-msg">{hero.message}</p>}
        {hero.buttons.map((b, i) => <CButton key={i} b={b} />)}
      </section>

      <div className="c-metrics">
        <div className="c-metric">
          <span className="l">Volumen</span>
          <span className="v">{metrics.volumen}<small>{metrics.volumenSub}</small></span>
          <span className="c-mdelta mut">semana</span>
        </div>
        {metrics.peso && (
          <div className="c-metric">
            <span className="l">Peso</span>
            <span className="v">{metrics.peso.valor}<small>kg</small></span>
            {metrics.peso.delta && (
              <span className={`c-mdelta ${metrics.peso.deltaFavorable ? "pos" : "neg"}`}>
                <DeltaIcon />
                {metrics.peso.delta}
              </span>
            )}
          </div>
        )}
        <div className="c-metric">
          <span className="l">Racha</span>
          <span className="v">{metrics.racha > 0 ? metrics.racha : "—"}</span>
          <span className="c-mdelta mut">{metrics.racha === 1 ? "semana" : "semanas"}</span>
        </div>
      </div>

      <section className="c-card c-mob">
        <div className="c-mob-h">
          <p className="c-lab" style={{ margin: 0 }}>{weekLabel}</p>
          <span className="c-mob-n">{weekChips.filter((c) => c.estado === "done").length}/7</span>
        </div>
        <div className="c-days">
          {weekChips.map((c) => (
            <div key={c.fecha} className={`c-day ${c.estado}`}>
              <span className="k">{c.estado === "done" ? <Check /> : c.estado === "today" ? <HeroIcon /> : <span className="pd" />}</span>
              <span>{c.letter}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
