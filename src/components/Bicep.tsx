import { BicepsFlexed } from "lucide-react";

interface BicepProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

/** BicepsFlexed relleno con currentColor (hereda el acento del tema). */
export function Bicep({ size = 20, className, style }: BicepProps) {
  return (
    <BicepsFlexed
      size={size}
      strokeWidth={1.8}
      fill="currentColor"
      className={className}
      style={style}
    />
  );
}
