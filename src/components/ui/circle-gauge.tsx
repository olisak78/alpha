import React from "react";

interface CircleGaugeProps {
  value: number; // 0-100
  size?: number; // px
  strokeWidth?: number; // px
  label?: string;
  sublabel?: string;
  colorClass?: string; // e.g., "text-primary"
}

export function CircleGauge({
  value,
  size = 96,
  strokeWidth = 8,
  label,
  sublabel,
  colorClass = "text-primary",
}: CircleGaugeProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  const dash = (clamped / 100) * circumference;

  return (
    <div className="inline-flex flex-col items-center justify-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="block"
        aria-label={label}
        role="img"
      >
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--muted-foreground) / 0.2)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            className={colorClass}
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth={strokeWidth}
            strokeDasharray={`${dash} ${circumference}`}
          />
        </g>
        <text
          x="50%"
          y="50%"
          dominantBaseline="central"
          textAnchor="middle"
          className="fill-foreground text-sm font-semibold"
        >
          {clamped.toFixed(1)}%
        </text>
      </svg>
      {label && <div className="mt-1 text-sm font-medium">{label}</div>}
      {sublabel && <div className="text-xs text-muted-foreground">{sublabel}</div>}
    </div>
  );
}

export default CircleGauge;
