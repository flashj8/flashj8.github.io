import { useState, useMemo, useCallback } from "react";
import { computeSVD, reconstructMatrix } from "./svd";
import type { SVDResult } from "./svd";

// ─── Data ─────────────────────────────────────────────────────
const MOVIES = [
  "The Matrix",
  "Titanic",
  "Toy Story",
  "The Godfather",
  "Frozen",
  "Inception",
  "Forrest Gump",
  "The Avengers",
];

const USERS = ["Madoxx", "Aron", "Finly", "Sacha", "Ehsna", "Louise"];

const INITIAL_RATINGS: number[][] = [
  [5, 1, 2, 5, 1, 5, 3, 4],
  [1, 5, 4, 2, 5, 1, 4, 2],
  [4, 2, 1, 4, 1, 4, 2, 5],
  [2, 4, 5, 1, 5, 2, 5, 1],
  [5, 1, 3, 4, 2, 5, 2, 5],
  [1, 5, 4, 2, 4, 0, 3, 0],
];

const USER_COLORS = [
  "#e879f9", "#38bdf8", "#4ade80", "#facc15", "#fb923c", "#f87171",
];

const MOVIE_EMOJIS = ["🔫", "🚢", "🧸", "🎩", "❄️", "🌀", "🏃", "🦸"];

// ─── Star Rating Component ───────────────────────────────────
function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const display = hover ?? value;

  return (
    <div
      className="flex items-center gap-0.5"
      onMouseLeave={() => setHover(null)}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const active = star <= display;
        return (
          <button
            key={star}
            type="button"
            className={`text-sm leading-none transition-transform duration-100 hover:scale-125 ${
              active
                ? display >= 4
                  ? "text-emerald-400"
                  : display >= 3
                  ? "text-yellow-400"
                  : "text-orange-400"
                : "text-gray-700 hover:text-gray-500"
            }`}
            onMouseEnter={() => setHover(star)}
            onClick={() => onChange(star === value ? 0 : star)}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}

// ─── Ratings Table ────────────────────────────────────────────
function RatingsTable({
  ratings,
  onRatingChange,
}: {
  ratings: number[][];
  onRatingChange: (u: number, m: number, v: number) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-800 bg-gray-900/80">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800">
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider sticky left-0 bg-gray-900 z-10">
              User
            </th>
            {MOVIES.map((movie, i) => (
              <th
                key={movie}
                className="px-3 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap"
              >
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-base">{MOVIE_EMOJIS[i]}</span>
                  <span className="max-w-[80px] truncate">{movie}</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {USERS.map((user, userIdx) => (
            <tr
              key={user}
              className={`border-b border-gray-800/50 hover:bg-gray-800/30 ${
                userIdx % 2 === 0 ? "bg-gray-900/30" : ""
              }`}
            >
              <td className="px-4 py-2.5 font-medium text-gray-200 sticky left-0 bg-gray-900 z-10 border-r border-gray-800/50">
                <div className="flex items-center gap-2">
                  <div
                    className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold text-gray-950"
                    style={{ background: USER_COLORS[userIdx] }}
                  >
                    {user[0]}
                  </div>
                  <span>{user}</span>
                </div>
              </td>
              {MOVIES.map((_, movieIdx) => (
                <td key={movieIdx} className="px-3 py-2.5 text-center">
                  <div className="flex flex-col items-center gap-0.5">
                    <StarRating
                      value={ratings[userIdx][movieIdx]}
                      onChange={(v) => onRatingChange(userIdx, movieIdx, v)}
                    />
                    <span className="text-[10px] text-gray-600 font-mono">
                      {ratings[userIdx][movieIdx] === 0
                        ? "n/a"
                        : ratings[userIdx][movieIdx]}
                    </span>
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Recommendations Cards ────────────────────────────────────
interface MovieScore {
  movie: string;
  movieIdx: number;
  originalRating: number;
  predictedRating: number;
}

function RecommendationsCards({
  recommendations,
  originalRatings,
}: {
  recommendations: MovieScore[][];
  originalRatings: number[][];
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {USERS.map((user, userIdx) => {
        const topRecs = recommendations[userIdx];
        const discoveries = topRecs.filter(
          (r) => r.originalRating <= 2 && r.predictedRating >= 3
        );

        return (
          <div
            key={user}
            className="rounded-xl border border-gray-800 bg-gray-900/80 overflow-hidden"
          >
            <div className="px-4 py-3 bg-gray-900/60 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold text-gray-950"
                  style={{ background: USER_COLORS[userIdx] }}
                >
                  {user[0]}
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{user}</h3>
                  <p className="text-[10px] text-gray-500">
                    {originalRatings[userIdx].filter((v) => v > 0).length}/
                    {MOVIES.length} rated
                  </p>
                </div>
              </div>
              {discoveries.length > 0 && (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-medium">
                  {discoveries.length} new pick
                  {discoveries.length > 1 ? "s" : ""}
                </span>
              )}
            </div>

            <div className="p-3 space-y-1.5">
              {topRecs.map((rec) => {
                const isDiscovery =
                  rec.originalRating <= 2 && rec.predictedRating >= 3;
                const pct = Math.max(
                  0,
                  Math.min(100, (rec.predictedRating / 5) * 100)
                );
                const barColor =
                  rec.predictedRating >= 4
                    ? "from-emerald-500 to-green-400"
                    : rec.predictedRating >= 3
                    ? "from-yellow-500 to-amber-400"
                    : rec.predictedRating >= 2
                    ? "from-orange-500 to-orange-400"
                    : "from-red-500 to-red-400";

                return (
                  <div
                    key={rec.movieIdx}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors ${
                      isDiscovery
                        ? "bg-emerald-500/10 border border-emerald-500/20"
                        : "hover:bg-gray-800/40"
                    }`}
                  >
                    <span className="w-28 truncate font-medium text-gray-300 flex items-center gap-1">
                      {isDiscovery && (
                        <span className="text-emerald-400">✦</span>
                      )}
                      {MOVIE_EMOJIS[rec.movieIdx]}{" "}
                      {rec.movie}
                    </span>
                    <div className="flex-1 flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-500`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono text-gray-400 w-8 text-right">
                        {rec.predictedRating.toFixed(1)}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-600 w-5 text-center font-mono">
                      {rec.originalRating === 0 ? "—" : rec.originalRating}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="px-4 py-2 border-t border-gray-800/50 flex items-center gap-3 text-[10px] text-gray-600">
              <span>Bar = predicted</span>
              <span>Right # = actual</span>
              <span className="text-emerald-500">✦ = discovery</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Latent Space Visualization ───────────────────────────────
function LatentSpaceViz({ svd }: { svd: SVDResult }) {
  const [hovered, setHovered] = useState<string | null>(null);

  const points = useMemo(() => {
    const { U, S, Vt } = svd;
    if (S.length === 0) return { users: [], movies: [] };

    const has2 = S.length >= 2;

    const userPts = USERS.map((name, i) => ({
      name,
      x: (U[i]?.[0] ?? 0) * S[0],
      y: has2 ? (U[i]?.[1] ?? 0) * S[1] : 0,
      color: USER_COLORS[i],
    }));

    const moviePts = MOVIES.map((name, j) => ({
      name,
      emoji: MOVIE_EMOJIS[j],
      x: (Vt[0]?.[j] ?? 0) * S[0],
      y: has2 ? (Vt[1]?.[j] ?? 0) * S[1] : 0,
      color: `hsl(${200 + j * 20}, 70%, 65%)`,
    }));

    return { users: userPts, movies: moviePts };
  }, [svd]);

  // Calculate ranges
  const allX = [
    ...points.users.map((p) => p.x),
    ...points.movies.map((p) => p.x),
  ];
  const allY = [
    ...points.users.map((p) => p.y),
    ...points.movies.map((p) => p.y),
  ];

  if (allX.length === 0) {
    return (
      <div className="rounded-xl border border-gray-800 bg-gray-900/80 p-8 text-center text-gray-500">
        No SVD data available
      </div>
    );
  }

  const minX = Math.min(...allX);
  const maxX = Math.max(...allX);
  const minY = Math.min(...allY);
  const maxY = Math.max(...allY);
  const padX = Math.max((maxX - minX) * 0.2, 1);
  const padY = Math.max((maxY - minY) * 0.2, 1);
  const xMin = minX - padX;
  const xMax = maxX + padX;
  const yMin = minY - padY;
  const yMax = maxY + padY;

  const W = 500;
  const H = 400;
  const P = 45;

  const toX = (x: number) => P + ((x - xMin) / (xMax - xMin)) * (W - 2 * P);
  const toY = (y: number) =>
    H - P - ((y - yMin) / (yMax - yMin)) * (H - 2 * P);

  const zeroSx = toX(0);
  const zeroSy = toY(0);

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/80 overflow-hidden">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minHeight: 300 }}>
        {/* Zero lines */}
        <line x1={P} y1={zeroSy} x2={W - P} y2={zeroSy} stroke="#374151" strokeWidth={0.5} strokeDasharray="4,4" />
        <line x1={zeroSx} y1={P} x2={zeroSx} y2={H - P} stroke="#374151" strokeWidth={0.5} strokeDasharray="4,4" />

        {/* Axes */}
        <line x1={P} y1={H - P} x2={W - P} y2={H - P} stroke="#4b5563" strokeWidth={1} />
        <line x1={P} y1={P} x2={P} y2={H - P} stroke="#4b5563" strokeWidth={1} />

        {/* Axis labels */}
        <text x={W / 2} y={H - 8} textAnchor="middle" fill="#6b7280" fontSize={10}>
          Component 1
        </text>
        <text
          x={12}
          y={H / 2}
          textAnchor="middle"
          fill="#6b7280"
          fontSize={10}
          transform={`rotate(-90, 12, ${H / 2})`}
        >
          Component 2
        </text>

        {/* Movie connection lines from origin */}
        {points.movies.map((pt) => (
          <line
            key={`mline-${pt.name}`}
            x1={zeroSx}
            y1={zeroSy}
            x2={toX(pt.x)}
            y2={toY(pt.y)}
            stroke={pt.color}
            strokeWidth={0.5}
            opacity={0.25}
          />
        ))}

        {/* Movie points (diamonds) */}
        {points.movies.map((pt) => {
          const sx = toX(pt.x);
          const sy = toY(pt.y);
          const isH = hovered === `m-${pt.name}`;
          const sz = isH ? 7 : 5;
          return (
            <g
              key={`movie-${pt.name}`}
              onMouseEnter={() => setHovered(`m-${pt.name}`)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: "pointer" }}
            >
              <rect
                x={sx - sz}
                y={sy - sz}
                width={sz * 2}
                height={sz * 2}
                fill={pt.color}
                opacity={isH ? 1 : 0.8}
                transform={`rotate(45, ${sx}, ${sy})`}
              />
              {isH ? (
                <>
                  <rect
                    x={sx - 50}
                    y={sy - 24}
                    width={100}
                    height={18}
                    rx={4}
                    fill="#111827"
                    stroke={pt.color}
                    strokeWidth={0.5}
                  />
                  <text x={sx} y={sy - 12} textAnchor="middle" fill={pt.color} fontSize={10} fontWeight="bold">
                    {pt.emoji} {pt.name}
                  </text>
                </>
              ) : (
                <text x={sx} y={sy + 14} textAnchor="middle" fill={pt.color} fontSize={7} opacity={0.6}>
                  {pt.name.length > 10 ? pt.name.slice(0, 9) + "…" : pt.name}
                </text>
              )}
            </g>
          );
        })}

        {/* User points (circles) */}
        {points.users.map((pt) => {
          const sx = toX(pt.x);
          const sy = toY(pt.y);
          const isH = hovered === `u-${pt.name}`;
          const r = isH ? 10 : 8;
          return (
            <g
              key={`user-${pt.name}`}
              onMouseEnter={() => setHovered(`u-${pt.name}`)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: "pointer" }}
            >
              <circle
                cx={sx}
                cy={sy}
                r={r}
                fill={pt.color}
                opacity={isH ? 1 : 0.85}
                stroke={isH ? "white" : "none"}
                strokeWidth={2}
              />
              <text
                x={sx}
                y={sy + 4}
                textAnchor="middle"
                fill="#111827"
                fontSize={10}
                fontWeight="bold"
                style={{ pointerEvents: "none" }}
              >
                {pt.name[0]}
              </text>
              {isH && (
                <>
                  <rect
                    x={sx - 30}
                    y={sy - 26}
                    width={60}
                    height={18}
                    rx={4}
                    fill="#111827"
                    stroke={pt.color}
                    strokeWidth={0.5}
                  />
                  <text x={sx} y={sy - 14} textAnchor="middle" fill={pt.color} fontSize={10} fontWeight="bold">
                    {pt.name}
                  </text>
                </>
              )}
            </g>
          );
        })}
      </svg>

      <div className="px-4 py-3 border-t border-gray-800/50 flex items-center gap-6 text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-gray-400" />
          <span>Users</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 bg-gray-400 rotate-45" />
          <span>Movies</span>
        </div>
        <span className="text-gray-600 text-[10px]">
          Nearby items share similar latent preferences
        </span>
      </div>
    </div>
  );
}

// ─── Singular Values Chart ────────────────────────────────────
function SingularValuesChart({
  svd,
  activeK,
}: {
  svd: SVDResult;
  activeK: number;
}) {
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  const data = useMemo(() => {
    const s = svd.S;
    if (s.length === 0)
      return { bars: [], cumulativePcts: [], energyCaptured: 0 };

    const sq = s.map((v) => v * v);
    const total = sq.reduce((a, b) => a + b, 0);
    const cumPcts: number[] = [];
    let cumSum = 0;
    for (const v of sq) {
      cumSum += v;
      cumPcts.push(total > 0 ? (cumSum / total) * 100 : 0);
    }

    const maxVal = Math.max(...s);
    const bars = s.map((val, i) => ({
      value: val,
      pct: total > 0 ? (sq[i] / total) * 100 : 0,
      heightFrac: maxVal > 0 ? val / maxVal : 0,
      active: i < activeK,
    }));

    const energyCaptured =
      activeK <= cumPcts.length ? cumPcts[activeK - 1] : 100;

    return { bars, cumulativePcts: cumPcts, energyCaptured };
  }, [svd, activeK]);

  if (data.bars.length === 0) {
    return (
      <div className="rounded-xl border border-gray-800 bg-gray-900/80 p-8 text-center text-gray-500">
        No singular values
      </div>
    );
  }

  const W = 500;
  const H = 340;
  const PL = 50;
  const PR = 20;
  const PT = 30;
  const PB = 60;
  const cW = W - PL - PR;
  const cH = H - PT - PB;

  const barW = Math.min(50, (cW / data.bars.length) * 0.6);
  const barGap = (cW - barW * data.bars.length) / (data.bars.length + 1);
  const maxS = Math.max(...data.bars.map((b) => b.value), 1);

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/80 overflow-hidden">
      {/* Energy header */}
      <div className="px-4 py-3 border-b border-gray-800/50 flex items-center justify-between">
        <div className="text-xs text-gray-400">
          Energy captured with{" "}
          <span className="text-violet-400 font-mono">k={activeK}</span>:
        </div>
        <div className="flex items-center gap-3">
          <div className="w-32 h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-500"
              style={{ width: `${data.energyCaptured}%` }}
            />
          </div>
          <span className="text-sm font-mono font-bold text-violet-400">
            {data.energyCaptured.toFixed(1)}%
          </span>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minHeight: 280 }}>
        <defs>
          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#6d28d9" />
          </linearGradient>
          <linearGradient id="barGradH" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
        </defs>

        {/* Y axis */}
        <line x1={PL} y1={PT} x2={PL} y2={PT + cH} stroke="#4b5563" strokeWidth={1} />
        {/* X axis */}
        <line x1={PL} y1={PT + cH} x2={W - PR} y2={PT + cH} stroke="#4b5563" strokeWidth={1} />

        {/* Y grid */}
        {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
          const y = PT + cH * (1 - frac);
          return (
            <g key={frac}>
              <line x1={PL} y1={y} x2={W - PR} y2={y} stroke="#374151" strokeWidth={0.5} strokeDasharray="3,3" />
              <text x={PL - 6} y={y + 3} textAnchor="end" fill="#6b7280" fontSize={9}>
                {(maxS * frac).toFixed(1)}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {data.bars.map((bar, i) => {
          const x = PL + barGap * (i + 1) + barW * i;
          const bH = bar.heightFrac * cH;
          const y = PT + cH - bH;
          const isH = hoveredBar === i;

          return (
            <g
              key={i}
              onMouseEnter={() => setHoveredBar(i)}
              onMouseLeave={() => setHoveredBar(null)}
              style={{ cursor: "pointer" }}
            >
              <rect
                x={x}
                y={y}
                width={barW}
                height={bH}
                rx={3}
                fill={
                  bar.active
                    ? isH
                      ? "url(#barGradH)"
                      : "url(#barGrad)"
                    : isH
                    ? "#4b5563"
                    : "#374151"
                }
                opacity={bar.active ? 1 : 0.5}
              />

              {isH && (
                <>
                  <rect x={x + barW / 2 - 28} y={y - 26} width={56} height={20} rx={4} fill="#111827" stroke={bar.active ? "#8b5cf6" : "#6b7280"} strokeWidth={0.5} />
                  <text x={x + barW / 2} y={y - 13} textAnchor="middle" fill={bar.active ? "#a78bfa" : "#9ca3af"} fontSize={10} fontFamily="monospace" fontWeight="bold">
                    σ={bar.value.toFixed(2)}
                  </text>
                </>
              )}

              <text x={x + barW / 2} y={y - 4} textAnchor="middle" fill={bar.active ? "#a78bfa" : "#6b7280"} fontSize={8} fontFamily="monospace">
                {bar.pct.toFixed(0)}%
              </text>

              <text x={x + barW / 2} y={PT + cH + 16} textAnchor="middle" fill={bar.active ? "#a78bfa" : "#6b7280"} fontSize={10} fontFamily="monospace">
                σ{i + 1}
              </text>

              {bar.active && (
                <circle cx={x + barW / 2} cy={PT + cH + 28} r={3} fill="#8b5cf6" />
              )}
            </g>
          );
        })}

        {/* Cumulative line */}
        {data.cumulativePcts.length > 0 && (
          <>
            <polyline
              points={data.cumulativePcts
                .map((pct, i) => {
                  const x = PL + barGap * (i + 1) + barW * i + barW / 2;
                  const y = PT + cH * (1 - pct / 100);
                  return `${x},${y}`;
                })
                .join(" ")}
              fill="none"
              stroke="#f472b6"
              strokeWidth={1.5}
              strokeDasharray="4,2"
              opacity={0.7}
            />
            {data.cumulativePcts.map((pct, i) => {
              const x = PL + barGap * (i + 1) + barW * i + barW / 2;
              const y = PT + cH * (1 - pct / 100);
              return <circle key={i} cx={x} cy={y} r={2.5} fill="#f472b6" opacity={0.8} />;
            })}
          </>
        )}

        {/* Cutoff line */}
        {activeK < data.bars.length && (() => {
          const cutX = PL + barGap * (activeK + 1) + barW * activeK - barGap / 2;
          return (
            <line
              x1={cutX}
              y1={PT}
              x2={cutX}
              y2={PT + cH}
              stroke="#ef4444"
              strokeWidth={1}
              strokeDasharray="5,3"
              opacity={0.6}
            />
          );
        })()}

        {/* Axis titles */}
        <text x={W / 2} y={H - 8} textAnchor="middle" fill="#6b7280" fontSize={10}>
          Singular Values
        </text>
        <text
          x={12}
          y={PT + cH / 2}
          textAnchor="middle"
          fill="#6b7280"
          fontSize={10}
          transform={`rotate(-90, 12, ${PT + cH / 2})`}
        >
          Magnitude
        </text>
      </svg>

      <div className="px-4 py-3 border-t border-gray-800/50 flex items-center gap-6 text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-violet-600" />
          <span>Active</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-gray-600" />
          <span>Truncated</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-0.5 w-6" style={{ borderTop: "2px dashed #f472b6" }} />
          <span>Cumulative energy</span>
        </div>
      </div>
    </div>
  );
}

// ─── Heatmap Comparison ──────────────────────────────────────
function HeatmapComparison({
  original,
  predicted,
}: {
  original: number[][];
  predicted: number[][];
}) {
  const [hoveredCell, setHoveredCell] = useState<{ r: number; c: number } | null>(null);

  const cellSize = 44;
  const labelW = 60;
  const labelH = 70;
  const gapBetween = 40;
  const w1 = labelW + MOVIES.length * cellSize;
  const totalW = w1 + gapBetween + MOVIES.length * cellSize;
  const totalH = labelH + USERS.length * cellSize + 20;

  function getColor(val: number, max: number) {
    const t = Math.max(0, Math.min(1, val / max));
    // Blue → Green → Yellow → Red
    const r = Math.round(t < 0.5 ? 30 + t * 2 * 100 : 130 + (t - 0.5) * 2 * 125);
    const g = Math.round(t < 0.5 ? 60 + t * 2 * 150 : 210 - (t - 0.5) * 2 * 130);
    const b = Math.round(t < 0.5 ? 180 - t * 2 * 120 : 60 - (t - 0.5) * 2 * 50);
    return `rgb(${r},${g},${b})`;
  }

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/80 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-800/50">
        <h3 className="text-sm font-semibold text-gray-300">Original vs Predicted — Side by Side Heatmap</h3>
        <p className="text-[10px] text-gray-500 mt-1">
          Left: original ratings (0=unrated). Right: SVD predicted scores. Hover to compare.
        </p>
      </div>
      <div className="overflow-x-auto p-4">
        <svg viewBox={`0 0 ${totalW + 20} ${totalH}`} className="w-full" style={{ minHeight: 280 }}>
          {/* Headers */}
          <text x={labelW + (MOVIES.length * cellSize) / 2} y={14} textAnchor="middle" fill="#9ca3af" fontSize={11} fontWeight="bold">
            Original Ratings
          </text>
          <text x={w1 + gapBetween + (MOVIES.length * cellSize) / 2} y={14} textAnchor="middle" fill="#9ca3af" fontSize={11} fontWeight="bold">
            SVD Predicted
          </text>

          {/* Original matrix */}
          {USERS.map((user, ui) => (
            <g key={`orow-${ui}`}>
              <text
                x={labelW - 6}
                y={labelH + ui * cellSize + cellSize / 2 + 3}
                textAnchor="end"
                fill="#9ca3af"
                fontSize={10}
              >
                {user}
              </text>
              {MOVIES.map((movie, mi) => {
                const x = labelW + mi * cellSize;
                const y = labelH + ui * cellSize;
                const val = original[ui][mi];
                const isH = hoveredCell?.r === ui && hoveredCell?.c === mi;
                return (
                  <g
                    key={`o-${ui}-${mi}`}
                    onMouseEnter={() => setHoveredCell({ r: ui, c: mi })}
                    onMouseLeave={() => setHoveredCell(null)}
                  >
                    {/* Column label (only first row) */}
                    {ui === 0 && (
                      <text
                        x={x + cellSize / 2}
                        y={labelH - 8}
                        textAnchor="middle"
                        fill="#6b7280"
                        fontSize={7}
                        transform={`rotate(-45, ${x + cellSize / 2}, ${labelH - 8})`}
                      >
                        {movie.length > 10 ? movie.slice(0, 9) + "…" : movie}
                      </text>
                    )}
                    <rect
                      x={x + 1}
                      y={y + 1}
                      width={cellSize - 2}
                      height={cellSize - 2}
                      rx={4}
                      fill={val === 0 ? "#1f2937" : getColor(val, 5)}
                      stroke={isH ? "#fff" : "#111827"}
                      strokeWidth={isH ? 2 : 1}
                    />
                    <text
                      x={x + cellSize / 2}
                      y={y + cellSize / 2 + 4}
                      textAnchor="middle"
                      fill={val === 0 ? "#4b5563" : "#fff"}
                      fontSize={11}
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {val === 0 ? "—" : val}
                    </text>
                  </g>
                );
              })}
            </g>
          ))}

          {/* Arrow between */}
          <text
            x={w1 + gapBetween / 2}
            y={labelH + (USERS.length * cellSize) / 2 + 4}
            textAnchor="middle"
            fill="#6b7280"
            fontSize={18}
          >
            →
          </text>

          {/* Predicted matrix */}
          {USERS.map((_, ui) => (
            <g key={`prow-${ui}`}>
              {MOVIES.map((movie, mi) => {
                const x = w1 + gapBetween + mi * cellSize;
                const y = labelH + ui * cellSize;
                const val = predicted[ui]?.[mi] ?? 0;
                const isH = hoveredCell?.r === ui && hoveredCell?.c === mi;
                const origVal = original[ui][mi];
                const diff = val - origVal;
                return (
                  <g
                    key={`p-${ui}-${mi}`}
                    onMouseEnter={() => setHoveredCell({ r: ui, c: mi })}
                    onMouseLeave={() => setHoveredCell(null)}
                  >
                    {ui === 0 && (
                      <text
                        x={x + cellSize / 2}
                        y={labelH - 8}
                        textAnchor="middle"
                        fill="#6b7280"
                        fontSize={7}
                        transform={`rotate(-45, ${x + cellSize / 2}, ${labelH - 8})`}
                      >
                        {movie.length > 10 ? movie.slice(0, 9) + "…" : movie}
                      </text>
                    )}
                    <rect
                      x={x + 1}
                      y={y + 1}
                      width={cellSize - 2}
                      height={cellSize - 2}
                      rx={4}
                      fill={getColor(val, 5)}
                      stroke={isH ? "#fff" : "#111827"}
                      strokeWidth={isH ? 2 : 1}
                    />
                    <text
                      x={x + cellSize / 2}
                      y={y + cellSize / 2 + 1}
                      textAnchor="middle"
                      fill="#fff"
                      fontSize={10}
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {val.toFixed(1)}
                    </text>
                    {isH && origVal > 0 && (
                      <text
                        x={x + cellSize / 2}
                        y={y + cellSize / 2 + 13}
                        textAnchor="middle"
                        fill={diff >= 0 ? "#4ade80" : "#f87171"}
                        fontSize={7}
                        fontFamily="monospace"
                      >
                        {diff >= 0 ? "+" : ""}{diff.toFixed(1)}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          ))}

          {/* Color scale */}
          {[0, 1, 2, 3, 4, 5].map((v) => {
            const x = totalW - 150 + v * 22;
            const y = totalH - 12;
            return (
              <g key={`scale-${v}`}>
                <rect x={x} y={y - 10} width={20} height={10} rx={2} fill={v === 0 ? "#1f2937" : getColor(v, 5)} />
                <text x={x + 10} y={y + 8} textAnchor="middle" fill="#6b7280" fontSize={7}>{v}</text>
              </g>
            );
          })}
          <text x={totalW - 150 - 4} y={totalH - 10} textAnchor="end" fill="#6b7280" fontSize={8}>Scale:</text>
        </svg>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────
export function App() {
  const [ratings, setRatings] = useState<number[][]>(
    INITIAL_RATINGS.map((row) => [...row])
  );
  const [kValue, setKValue] = useState(3);

  const handleRatingChange = useCallback(
    (userIdx: number, movieIdx: number, value: number) => {
      setRatings((prev) => {
        const next = prev.map((row) => [...row]);
        next[userIdx][movieIdx] = value;
        return next;
      });
    },
    []
  );

  const handleReset = useCallback(() => {
    setRatings(INITIAL_RATINGS.map((row) => [...row]));
    setKValue(3);
  }, []);

  // SVD computation
  const svdResult = useMemo(() => {
    try {
      // Replace 0s with row-mean
      const normalized = ratings.map((row) => {
        const nonZero = row.filter((v) => v > 0);
        const mean =
          nonZero.length > 0
            ? nonZero.reduce((a, b) => a + b, 0) / nonZero.length
            : 2.5;
        return row.map((v) => (v === 0 ? mean : v));
      });

      // Center
      const allVals = normalized.flat();
      const globalMean =
        allVals.reduce((a, b) => a + b, 0) / allVals.length;
      const centered = normalized.map((row) =>
        row.map((v) => v - globalMean)
      );

      const svd = computeSVD(centered);
      const recon = reconstructMatrix(svd, kValue);
      const predicted = recon.map((row) =>
        row.map((v) => {
          const val = v + globalMean;
          return Math.max(0, Math.min(5, val));
        })
      );

      return { svd, predicted };
    } catch {
      // Fallback
      return {
        svd: { U: [], S: [], Vt: [] } as SVDResult,
        predicted: ratings.map((row) => row.map((v) => (v === 0 ? 2.5 : v))),
      };
    }
  }, [ratings, kValue]);

  // Recommendations
  const recommendations = useMemo(() => {
    return USERS.map((_, userIdx) => {
      const predicted = svdResult.predicted[userIdx];
      const movieScores: MovieScore[] = MOVIES.map((movie, movieIdx) => ({
        movie,
        movieIdx,
        originalRating: ratings[userIdx][movieIdx],
        predictedRating: predicted[movieIdx],
      }));
      return [...movieScores].sort(
        (a, b) => b.predictedRating - a.predictedRating
      );
    });
  }, [svdResult, ratings]);

  const maxK = Math.min(USERS.length, MOVIES.length);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-indigo-950 text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-950/60 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/20 text-xl">
              🎬
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                SVD Movie Recommender
              </h1>
              <p className="text-xs text-gray-500">
                Singular Value Decomposition · Interactive Demo
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-gray-800/60 rounded-lg px-3 py-2 border border-gray-700/50">
              <label className="text-xs text-gray-400 font-medium">
                SVD Rank (k):
              </label>
              <input
                type="range"
                min={1}
                max={maxK}
                value={kValue}
                onChange={(e) => setKValue(Number(e.target.value))}
                className="w-24 accent-violet-500"
              />
              <span className="text-sm font-mono text-violet-400 w-4 text-center">
                {kValue}
              </span>
            </div>
            <button
              onClick={handleReset}
              className="px-3 py-2 text-xs font-medium bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors cursor-pointer"
            >
              Reset
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Info */}
        <div className="bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20 rounded-xl p-4">
          <p className="text-sm text-gray-300 leading-relaxed">
            <span className="font-semibold text-violet-400">How it works:</span>{" "}
            SVD decomposes the user-movie ratings matrix{" "}
            <span className="font-mono text-fuchsia-400">R ≈ U·Σ·Vᵀ</span>{" "}
            into latent factors. By keeping only the top{" "}
            <span className="font-mono text-violet-400">k={kValue}</span>{" "}
            singular values, we capture dominant patterns (e.g., genre
            preferences) and predict missing ratings. Click any star below to
            change ratings and see recommendations update live.
          </p>
        </div>

        {/* 1: Ratings Table */}
        <section>
          <SectionHeader
            color="from-violet-500 to-fuchsia-500"
            title="User Ratings Matrix"
            subtitle="Click stars to edit · 0 = not rated"
          />
          <RatingsTable
            ratings={ratings}
            onRatingChange={handleRatingChange}
          />
        </section>

        {/* 2: Recommendations */}
        <section>
          <SectionHeader
            color="from-emerald-500 to-teal-500"
            title="Predicted Ratings & Recommendations"
            subtitle={`Reconstructed from rank-${kValue} SVD`}
          />
          <RecommendationsCards
            recommendations={recommendations}
            originalRatings={ratings}
          />
        </section>

        {/* 3: Heatmap Comparison */}
        <section>
          <SectionHeader
            color="from-cyan-500 to-blue-500"
            title="Original vs Predicted Heatmap"
            subtitle="Visual comparison of actual and SVD-predicted ratings"
          />
          <HeatmapComparison
            original={ratings}
            predicted={svdResult.predicted}
          />
        </section>

        {/* 4: Latent Space & Singular Values */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section>
            <SectionHeader
              color="from-amber-500 to-orange-500"
              title="Latent Space (2D)"
              subtitle="Users & Movies projected in SVD space"
            />
            <LatentSpaceViz svd={svdResult.svd} />
          </section>
          <section>
            <SectionHeader
              color="from-rose-500 to-pink-500"
              title="Singular Values"
              subtitle="Energy distribution across components"
            />
            <SingularValuesChart svd={svdResult.svd} activeK={kValue} />
          </section>
        </div>
      </main>

      <footer className="border-t border-gray-800 mt-12 py-6 text-center text-xs text-gray-600">
        SVD Movie Recommender System · Built with React & Tailwind CSS
      </footer>
    </div>
  );
}

function SectionHeader({
  color,
  title,
  subtitle,
}: {
  color: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className={`h-6 w-1 rounded-full bg-gradient-to-b ${color}`} />
      <h2 className="text-lg font-semibold">{title}</h2>
      <span className="text-xs text-gray-500 ml-2">{subtitle}</span>
    </div>
  );
}
