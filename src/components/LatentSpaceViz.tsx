import { useState, useMemo } from "react";
import type { SVDResult } from "../svd";

interface LatentSpaceVizProps {
  svd: SVDResult;
  users: string[];
  movies: string[];
}

export function LatentSpaceViz({ svd, users, movies }: LatentSpaceVizProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const { userPoints, moviePoints, xRange, yRange } = useMemo(() => {
    const { U, S, Vt } = svd;

    if (S.length < 2) {
      // Fallback: use 1D
      const uPts = users.map((name, i) => ({
        name,
        type: "user" as const,
        x: U[i]?.[0] ? U[i][0] * S[0] : 0,
        y: 0,
        color: `hsl(${i * 60}, 60%, 55%)`,
      }));
      const mPts = movies.map((name, j) => ({
        name,
        type: "movie" as const,
        x: Vt[0]?.[j] ? Vt[0][j] * S[0] : 0,
        y: 0,
        color: `hsl(${200 + j * 20}, 70%, 65%)`,
      }));
      const all = [...uPts, ...mPts];
      const xs = all.map((p) => p.x);
      return {
        userPoints: uPts,
        moviePoints: mPts,
        xRange: [Math.min(...xs) - 1, Math.max(...xs) + 1] as [number, number],
        yRange: [-1, 1] as [number, number],
      };
    }

    // U: m×k, project users: u_i scaled by singular values
    const uPts = users.map((name, i) => ({
      name,
      type: "user" as const,
      x: (U[i]?.[0] ?? 0) * S[0],
      y: (U[i]?.[1] ?? 0) * S[1],
      color: `hsl(${i * 60}, 60%, 55%)`,
    }));

    // Vt: k×n, project movies
    const mPts = movies.map((name, j) => ({
      name,
      type: "movie" as const,
      x: (Vt[0]?.[j] ?? 0) * S[0],
      y: (Vt[1]?.[j] ?? 0) * S[1],
      color: `hsl(${200 + j * 20}, 70%, 65%)`,
    }));

    const all = [...uPts, ...mPts];
    const xs = all.map((p) => p.x);
    const ys = all.map((p) => p.y);
    const xPad = (Math.max(...xs) - Math.min(...xs)) * 0.15 + 0.5;
    const yPad = (Math.max(...ys) - Math.min(...ys)) * 0.15 + 0.5;

    return {
      userPoints: uPts,
      moviePoints: mPts,
      xRange: [Math.min(...xs) - xPad, Math.max(...xs) + xPad] as [number, number],
      yRange: [Math.min(...ys) - yPad, Math.max(...ys) + yPad] as [number, number],
    };
  }, [svd, users, movies]);

  const W = 500;
  const H = 400;
  const PAD = 45;

  function toSvgX(x: number) {
    return PAD + ((x - xRange[0]) / (xRange[1] - xRange[0])) * (W - 2 * PAD);
  }
  function toSvgY(y: number) {
    return H - PAD - ((y - yRange[0]) / (yRange[1] - yRange[0])) * (H - 2 * PAD);
  }

  // Zero lines
  const zeroX = toSvgX(0);
  const zeroY = toSvgY(0);

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/80 backdrop-blur-sm overflow-hidden">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        style={{ minHeight: 300 }}
      >
        {/* Background */}
        <rect x={0} y={0} width={W} height={H} fill="transparent" />

        {/* Grid lines */}
        <line x1={PAD} y1={zeroY} x2={W - PAD} y2={zeroY} stroke="#374151" strokeWidth={0.5} strokeDasharray="4,4" />
        <line x1={zeroX} y1={PAD} x2={zeroX} y2={H - PAD} stroke="#374151" strokeWidth={0.5} strokeDasharray="4,4" />

        {/* Axes */}
        <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="#4b5563" strokeWidth={1} />
        <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke="#4b5563" strokeWidth={1} />

        {/* Axis labels */}
        <text x={W / 2} y={H - 8} textAnchor="middle" className="text-[10px] fill-gray-500">
          Component 1
        </text>
        <text
          x={12}
          y={H / 2}
          textAnchor="middle"
          className="text-[10px] fill-gray-500"
          transform={`rotate(-90, 12, ${H / 2})`}
        >
          Component 2
        </text>

        {/* Connection lines from origin for movies */}
        {moviePoints.map((pt) => (
          <line
            key={`line-${pt.name}`}
            x1={zeroX}
            y1={zeroY}
            x2={toSvgX(pt.x)}
            y2={toSvgY(pt.y)}
            stroke={pt.color}
            strokeWidth={0.5}
            opacity={0.3}
          />
        ))}

        {/* Movie points (diamonds) */}
        {moviePoints.map((pt) => {
          const sx = toSvgX(pt.x);
          const sy = toSvgY(pt.y);
          const isHovered = hoveredItem === `movie-${pt.name}`;
          const size = isHovered ? 7 : 5;
          return (
            <g
              key={`movie-${pt.name}`}
              onMouseEnter={() => setHoveredItem(`movie-${pt.name}`)}
              onMouseLeave={() => setHoveredItem(null)}
              className="cursor-pointer"
            >
              <rect
                x={sx - size}
                y={sy - size}
                width={size * 2}
                height={size * 2}
                fill={pt.color}
                opacity={isHovered ? 1 : 0.8}
                transform={`rotate(45, ${sx}, ${sy})`}
                className="transition-all duration-150"
              />
              {isHovered && (
                <>
                  <rect
                    x={sx - pt.name.length * 3.5 - 4}
                    y={sy - 22}
                    width={pt.name.length * 7 + 8}
                    height={16}
                    rx={4}
                    fill="#1f2937"
                    stroke={pt.color}
                    strokeWidth={0.5}
                  />
                  <text
                    x={sx}
                    y={sy - 11}
                    textAnchor="middle"
                    className="text-[10px] font-medium"
                    fill={pt.color}
                  >
                    {pt.name}
                  </text>
                </>
              )}
              {!isHovered && (
                <text
                  x={sx}
                  y={sy + 14}
                  textAnchor="middle"
                  className="text-[8px]"
                  fill={pt.color}
                  opacity={0.7}
                >
                  {pt.name.length > 10 ? pt.name.slice(0, 9) + "…" : pt.name}
                </text>
              )}
            </g>
          );
        })}

        {/* User points (circles) */}
        {userPoints.map((pt) => {
          const sx = toSvgX(pt.x);
          const sy = toSvgY(pt.y);
          const isHovered = hoveredItem === `user-${pt.name}`;
          const r = isHovered ? 9 : 7;
          return (
            <g
              key={`user-${pt.name}`}
              onMouseEnter={() => setHoveredItem(`user-${pt.name}`)}
              onMouseLeave={() => setHoveredItem(null)}
              className="cursor-pointer"
            >
              <circle
                cx={sx}
                cy={sy}
                r={r}
                fill={pt.color}
                opacity={isHovered ? 1 : 0.85}
                stroke={isHovered ? "white" : "none"}
                strokeWidth={2}
                className="transition-all duration-150"
              />
              <text
                x={sx}
                y={sy + 3}
                textAnchor="middle"
                className="text-[9px] font-bold pointer-events-none"
                fill="white"
              >
                {pt.name[0]}
              </text>
              {isHovered && (
                <>
                  <rect
                    x={sx - pt.name.length * 3.5 - 4}
                    y={sy - 24}
                    width={pt.name.length * 7 + 8}
                    height={16}
                    rx={4}
                    fill="#1f2937"
                    stroke={pt.color}
                    strokeWidth={0.5}
                  />
                  <text
                    x={sx}
                    y={sy - 13}
                    textAnchor="middle"
                    className="text-[10px] font-medium"
                    fill={pt.color}
                  >
                    {pt.name}
                  </text>
                </>
              )}
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="px-4 py-3 border-t border-gray-800/50 flex items-center gap-6 text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-gray-400" />
          <span>Users (circles)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 bg-gray-400 rotate-45" />
          <span>Movies (diamonds)</span>
        </div>
        <span className="text-gray-600 text-[10px]">
          Nearby items indicate similar latent preferences
        </span>
      </div>
    </div>
  );
}
