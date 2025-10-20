// src/components/XPSparkline.jsx
import React, { useMemo } from "react";

/**
 * props.data = [{ day: "2025-10-20", xp_gained: 20 }, ...]
 */
export default function XPSparkline({ data = [], width = 400, height = 80 }) {
  const pad = 8;

  const points = useMemo(() => {
    if (!data.length) return [];
    const xs = data.map((_, i) => i);
    const ys = data.map(d => d.xp_gained);
    const maxY = Math.max(1, ...ys);
    const stepX = (width - 2*pad) / Math.max(1, xs.length - 1);
    return ys.map((y, i) => {
      const x = pad + i * stepX;
      const ny = (y / maxY);
      const py = height - pad - ny * (height - 2*pad);
      return `${x},${py}`;
    });
  }, [data, width, height]);

  const total = data.reduce((a,b)=>a + (b.xp_gained||0), 0);

  return (
    <div>
      <svg width={width} height={height} className="block">
        <rect x="0" y="0" width={width} height={height} rx="8" className="fill-zinc-950 stroke-zinc-800" />
        {points.length > 1 && (
          <polyline
            points={points.join(" ")}
            fill="none"
            stroke="currentColor"
            className="text-violet-400"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}
      </svg>
      <div className="text-xs text-zinc-400 mt-1">
        Total XP gained (accepted): <b className="text-zinc-200">{total}</b>
      </div>
    </div>
  );
}
