interface MarkProps { size?: number; }

/** Doble chevron de ShapeUp en currentColor (hereda el acento del tema). */
export function ShapeUpMark({ size = 32 }: MarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      aria-hidden
      style={{ display: "block", flexShrink: 0 }}
    >
      <g stroke="currentColor" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round">
        <path d="M30 60 L60 33 L90 60" />
        <path d="M30 87 L60 60 L90 87" />
      </g>
    </svg>
  );
}

/** "Shape" en --fg + "Up" en --accent. Texto puro, sin SVG. */
export function ShapeUpWordmark({ size = 20 }: { size?: number }) {
  return (
    <span
      style={{
        fontWeight: 800,
        fontSize: size,
        letterSpacing: "-0.02em",
        lineHeight: 1,
      }}
    >
      <span style={{ color: "var(--fg)" }}>Shape</span>
      <span style={{ color: "var(--accent)" }}>Up</span>
    </span>
  );
}
