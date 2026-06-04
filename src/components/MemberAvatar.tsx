// src/components/MemberAvatar.tsx — círculo de iniciales por miembro + stack
// Adaptado de Comidas-Familiares. Colores: CSS tokens --member-* (sync con seed-perfiles.ts).
import type { MiembroId } from "../types/models";

interface Palette { bg: string; fg: string; label: string }

function paletteFor(memberId: MiembroId, colorOverride?: string): Palette {
  const LABELS: Record<MiembroId, string> = {
    juanpablo: "JP", maria: "M", sofia: "S", federico: "F",
  };
  return {
    bg: colorOverride ?? `var(--member-${memberId})`,
    fg: "#fff",
    label: LABELS[memberId] ?? memberId.charAt(0).toUpperCase(),
  };
}

interface MemberAvatarProps {
  memberId: MiembroId;
  /** Color override desde /config/perfiles. Si no se provee, usa el token CSS. */
  color?: string;
  size?: number;
  withName?: boolean;
  displayName?: string;
}

/** Círculo con iniciales y color por miembro. */
export function MemberAvatar({
  memberId, color, size = 28, withName = false, displayName,
}: MemberAvatarProps) {
  const m = paletteFor(memberId, color);

  const circle = (
    <span
      style={{
        width: size, height: size, borderRadius: "50%",
        background: m.bg, color: m.fg,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        fontSize: size <= 24 ? 10 : 13,
        fontWeight: 700, flexShrink: 0, letterSpacing: 0, userSelect: "none",
      }}
    >
      {m.label}
    </span>
  );

  if (!withName) return circle;

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      {circle}
      <span style={{ fontSize: 14, color: "var(--fg)" }}>
        {displayName ?? memberId}
      </span>
    </span>
  );
}

interface AvatarStackProps {
  memberIds: MiembroId[];
  colors?: Partial<Record<MiembroId, string>>;
  size?: number;
  max?: number;
  onClick?: () => void;
}

/** Fila superpuesta de hasta `max` avatares. */
export function AvatarStack({
  memberIds, colors, size = 28, max = 4, onClick,
}: AvatarStackProps) {
  const shown    = memberIds.slice(0, max);
  const overflow = memberIds.length - shown.length;

  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center",
        cursor: onClick ? "pointer" : "default",
        borderRadius: "var(--r-sm)", outline: "none",
      }}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } } : undefined}
    >
      {shown.map((id, i) => (
        <span
          key={id + i}
          style={{
            marginLeft: i === 0 ? 0 : -8,
            border: "2px solid var(--card)",
            borderRadius: "50%", display: "inline-flex",
          }}
        >
          <MemberAvatar memberId={id} color={colors?.[id]} size={size} />
        </span>
      ))}
      {overflow > 0 && (
        <span style={{
          marginLeft: -8, width: size, height: size, borderRadius: "50%",
          background: "var(--border)", color: "var(--muted)",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          fontSize: 10, fontWeight: 600,
          border: "2px solid var(--card)",
        }}>
          +{overflow}
        </span>
      )}
    </span>
  );
}
