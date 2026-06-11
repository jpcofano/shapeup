import type { CSSProperties } from "react";

interface TabDef<T extends string> {
  key: T;
  label: string;
}

interface TabBarProps<T extends string> {
  tabs: readonly TabDef<T>[];
  active: T;
  onChange: (t: T) => void;
  size?: "sm";
  style?: CSSProperties;
}

export function TabBar<T extends string>({
  tabs, active, onChange, size, style,
}: TabBarProps<T>) {
  const idx = tabs.findIndex((t) => t.key === active);
  const pct = 100 / tabs.length;
  return (
    <div className="tab-bar" style={style}>
      {tabs.map(({ key, label }) => (
        <button
          key={key}
          className={`tab-bar-btn${size === "sm" ? " sm" : ""}${active === key ? " active" : ""}`}
          onClick={() => onChange(key)}
        >
          {label}
        </button>
      ))}
      <span
        className="tab-bar-indicator"
        style={{ width: `${pct}%`, transform: `translateX(${idx * 100}%)` }}
      />
    </div>
  );
}
