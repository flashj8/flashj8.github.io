import { useMemo, useState } from "react";
import type { SVDResult } from "../svd";

interface SingularValuesChartProps {
  svd: SVDResult;
  activeK: number;
}

export function SingularValuesChart({ svd, activeK }: SingularValuesChartProps) {
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  const { bars, cumulativePercentages } = useMemo(() => {
    const s = svd.S;
    const squared = s.map((v) => v * v);
    const total = squared.reduce((a, b) => a + b, 0);
    const cumulative: number[] = [];
    let cumSum = 0;
    for (const sq of squared) {
      cumSum += sq;
      cumulative.push(total > 0 ? (cumSum / total) * 100 : 0);
    }

    const maxVal = Math.max(...s, 1);
    const barData = s.map((val, i) => ({
      value: val,
      percentage: total > 0 ? (squared[i] / total) * 100 : 0,
      heightPct: (val / maxVal) * 100,
      active: i < activeK,
    }));

    return {
      bars: barData,
      cumulativePercentages: cumulative,
    };
  }, [svd, activeK]);

  const W = 500;
  const H = 340;
  const PAD_LEFT = 50;
  const PAD_RIGHT = 20;
  const PAD_TOP = 30;
  const PAD_BOTTOM = 60;
  const chartW = W - PAD_LEFT - PAD_RIGHT;
  const chartH = H - PAD_TOP - PAD_BOTTOM;

  const barWidth = Math.min(50, (chartW / bars.length) * 0.6);
  const barGap = (chartW - barWidth * bars.length) / (bars.length + 1);

  const maxSingular = Math.max(...bars.map((b) => b.value), 1);

  // Energy captured by active k
  const energyCaptured =
    activeK <= cumulativePercentages.length
      ? cumulativePercentages[activeK - 1]
      : 100;

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/80 backdrop-blur-sm overflow-hidden">
      {/* Energy summary */}
      <div className="px-4 py-3 border-b border-gray-800/50 flex items-center justify-between">
        <div className="text-xs text-gray-400">
          Energy captured with <span className="text-violet-400 font-mono">k={activeK}</span>:
        </div>
        <div className="flex items-center gap-3">
          <div className="w-32 h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-500"
              style={{ width: `${energyCaptured}%` }}
            />
          </div>
          <span className="text-sm font-mono font-bold text-violet-400">
            {energyCaptured.toFixed(1)}%
          </span>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ minHeight: 280 }}>
        {/* Y axis */}
        <line
          x1={PAD_LEFT}
          y1={PAD_TOP}
          x2={PAD_LEFT}
          y2={PAD_TOP + chartH}
          stroke="#4b5563"
          strokeWidth={1}
        />
        {/* X axis */}
        <line
          x1={PAD_LEFT}
          y1={PAD_TOP + chartH}
          x2={W - PAD_RIGHT}
          y2={PAD_TOP + chartH}
          stroke="#4b5563"
          strokeWidth={1}
        />

        {/* Y axis grid lines and labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
          const y = PAD_TOP + chartH * (1 - frac);
          const val = (maxSingular * frac).toFixed(1);
          return (
            <g key={frac}>
              <line
                x1={PAD_LEFT}
                y1={y}
                x2={W - PAD_RIGHT}
                y2={y}
                stroke="#374151"
                strokeWidth={0.5}
                strokeDasharray="3,3"
              />
              <text
                x={PAD_LEFT - 6}
                y={y + 3}
                textAnchor="end"
                className="text-[9px] fill-gray-500"
              >
                {val}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {bars.map((bar, i) => {
          const x = PAD_LEFT + barGap * (i + 1) + barWidth * i;
          const barH = (bar.value / maxSingular) * chartH;
          const y = PAD_TOP + chartH - barH;
          const isHovered = hoveredBar === i;
          const isActive = bar.active;

          return (
            <g
              key={i}
              onMouseEnter={() => setHoveredBar(i)}
              onMouseLeave={() => setHoveredBar(null)}
              className="cursor-pointer"
            >
              {/* Bar */}
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barH}
                rx={3}
                fill={
                  isActive
                    ? isHovered
                      ? "url(#barGradientHover)"
                      : "url(#barGradient)"
                    : isHovered
                    ? "#4b5563"
                    : "#374151"
                }
                opacity={isActive ? 1 : 0.5}
                className="transition-all duration-300"
              />

              {/* Value label */}
              {isHovered && (
                <>
                  <rect
                    x={x + barWidth / 2 - 24}
                    y={y - 26}
                    width={48}
                    height={20}
                    rx={4}
                    fill="#1f2937"
                    stroke={isActive ? "#8b5cf6" : "#6b7280"}
                    strokeWidth={0.5}
                  />
                  <text
                    x={x + barWidth / 2}
                    y={y - 13}
                    textAnchor="middle"
                    className="text-[10px] font-mono font-medium"
                    fill={isActive ? "#a78bfa" : "#9ca3af"}
                  >
                    σ={bar.value.toFixed(2)}
                  </text>
                </>
              )}

              {/* Percentage */}
              <text
                x={x + barWidth / 2}
                y={y - 4}
                textAnchor="middle"
                className="text-[8px] font-mono"
                fill={isActive ? "#a78bfa" : "#6b7280"}
              >
                {bar.percentage.toFixed(0)}%
              </text>

              {/* X label */}
              <text
                x={x + barWidth / 2}
                y={PAD_TOP + chartH + 16}
                textAnchor="middle"
                className="text-[10px] font-mono"
                fill={isActive ? "#a78bfa" : "#6b7280"}
              >
                σ{i + 1}
              </text>

              {/* Active indicator */}
              {isActive && (
                <circle
                  cx={x + barWidth / 2}
                  cy={PAD_TOP + chartH + 28}
                  r={3}
                  fill="#8b5cf6"
                  className="animate-pulse"
                />
              )}
            </g>
          );
        })}

        {/* Cumulative line */}
        {cumulativePercentages.length > 0 && (
          <>
            <polyline
              points={cumulativePercentages
                .map((pct, i) => {
                  const x =
                    PAD_LEFT +
                    barGap * (i + 1) +
                    barWidth * i +
                    barWidth / 2;
                  const y = PAD_TOP + chartH * (1 - pct / 100);
                  return `${x},${y}`;
                })
                .join(" ")}
              fill="none"
              stroke="#f472b6"
              strokeWidth={1.5}
              strokeDasharray="4,2"
              opacity={0.7}
            />
            {cumulativePercentages.map((pct, i) => {
              const x =
                PAD_LEFT + barGap * (i + 1) + barWidth * i + barWidth / 2;
              const y = PAD_TOP + chartH * (1 - pct / 100);
              return (
                <circle
                  key={`cum-${i}`}
                  cx={x}
                  cy={y}
                  r={2.5}
                  fill="#f472b6"
                  opacity={0.8}
                />
              );
            })}
          </>
        )}

        {/* Cutoff line at k */}
        {activeK < bars.length && (
          <line
            x1={
              PAD_LEFT +
              barGap * (activeK + 1) +
              barWidth * activeK -
              barGap / 2
            }
            y1={PAD_TOP}
            x2={
              PAD_LEFT +
              barGap * (activeK + 1) +
              barWidth * activeK -
              barGap / 2
            }
            y2={PAD_TOP + chartH}
            stroke="#ef4444"
            strokeWidth={1}
            strokeDasharray="5,3"
            opacity={0.6}
          />
        )}

        {/* Gradient defs */}
        <defs>
          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#6d28d9" />
          </linearGradient>
          <linearGradient id="barGradientHover" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
        </defs>

        {/* Axis titles */}
        <text
          x={W / 2}
          y={H - 8}
          textAnchor="middle"
          className="text-[10px] fill-gray-500"
        >
          Singular Values
        </text>
        <text
          x={12}
          y={PAD_TOP + chartH / 2}
          textAnchor="middle"
          className="text-[10px] fill-gray-500"
          transform={`rotate(-90, 12, ${PAD_TOP + chartH / 2})`}
        >
          Magnitude
        </text>
      </svg>

      {/* Legend */}
      <div className="px-4 py-3 border-t border-gray-800/50 flex items-center gap-6 text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-violet-600" />
          <span>Active components</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-gray-600" />
          <span>Truncated</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-0.5 w-6 bg-pink-400" style={{ borderTop: "2px dashed #f472b6" }} />
          <span>Cumulative energy</span>
        </div>
      </div>
    </div>
  );
}
