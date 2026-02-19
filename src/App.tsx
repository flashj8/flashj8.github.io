import { useState, useMemo, useCallback } from "react";
import { computeSVD, reconstructMatrix } from "./svd";
import type { SVDResult } from "./svd";

// ─── Clean Light Theme ───────────────────────────────────────
const T = {
  bg: "#f5f5f7",
  card: "#ffffff",
  cardAlt: "#fafafa",
  border: "#e5e5e5",
  borderLight: "#f0f0f0",
  fg: "#1d1d1f",
  fg1: "#333336",
  fg2: "#555558",
  fg3: "#86868b",
  fg4: "#aeaeb2",
  blue: "#0071e3",
  blueDk: "#004aad",
  blueLight: "#e8f2fd",
  green: "#28a745",
  greenDk: "#1a7f37",
  greenLight: "#e6f9ed",
  yellow: "#f59e0b",
  yellowDk: "#b45309",
  yellowLight: "#fef9e7",
  red: "#ff3b30",
  redDk: "#cc2d25",
  redLight: "#fdecea",
  orange: "#ff6723",
  orangeDk: "#c44d15",
  purple: "#8b5cf6",
  purpleDk: "#6d28d9",
  aqua: "#06b6d4",
  aquaDk: "#0891b2",
  teal: "#14b8a6",
};

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

const USERS = ["Madox", "Aron", "Louis", "Finely", "Ehsna", "Sacha"];

const INITIAL_RATINGS: number[][] = [
  [5, 1, 2, 0, 1, 5, 3, 4],
  [1, 0, 4, 2, 5, 4, 4, 2],
  [4, 2, 1, 4, 1, 4, 2, 0],
  [0, 4, 5, 1, 5, 2, 5, 1],
  [5, 1, 3, 4, 0, 5, 2, 5],
  [1, 5, 4, 2, 4, 0, 3, 0],
];

const USER_COLORS = [
  T.blue, T.green, T.orange, T.purple, T.red, T.teal,
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
            className="text-sm leading-none transition-transform duration-100 hover:scale-125"
            style={{
              color: active
                ? display >= 4
                  ? T.orange
                  : display >= 3
                  ? T.yellow
                  : T.fg4
                : T.border,
            }}
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
    <div className="overflow-x-auto rounded-2xl border" style={{ borderColor: T.border, background: T.card }}>
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: `1px solid ${T.borderLight}` }}>
            <th
              className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide sticky left-0 z-10"
              style={{ color: T.fg3, background: T.card }}
            >
              User
            </th>
            {MOVIES.map((movie, i) => (
              <th
                key={movie}
                className="px-3 py-3 text-center text-xs font-medium uppercase tracking-wide whitespace-nowrap"
                style={{ color: T.fg3 }}
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
              className="transition-colors"
              style={{
                borderBottom: `1px solid ${T.borderLight}`,
                background: userIdx % 2 === 0 ? T.card : T.cardAlt,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f4ff")}
              onMouseLeave={(e) =>
                (e.currentTarget.style.background =
                  userIdx % 2 === 0 ? T.card : T.cardAlt)
              }
            >
              <td
                className="px-4 py-2.5 font-medium sticky left-0 z-10"
                style={{
                  color: T.fg1,
                  background: "inherit",
                  borderRight: `1px solid ${T.borderLight}`,
                }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm"
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
                    <span
                      className="text-[10px] font-mono"
                      style={{ color: T.fg4 }}
                    >
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
          (r) =>
            (r.originalRating === 0 && r.predictedRating >= 3.0) ||
            (r.originalRating <= 2 && r.predictedRating >= 3.0) ||
            (r.originalRating > 0 &&
              r.predictedRating - r.originalRating >= 1.5)
        );

        return (
          <div
            key={user}
            className="rounded-2xl overflow-hidden border shadow-sm"
            style={{ borderColor: T.border, background: T.card }}
          >
            <div
              className="px-4 py-3 flex items-center justify-between"
              style={{
                background: T.cardAlt,
                borderBottom: `1px solid ${T.borderLight}`,
              }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm"
                  style={{ background: USER_COLORS[userIdx] }}
                >
                  {user[0]}
                </div>
                <div>
                  <h3
                    className="font-medium text-sm tracking-tight"
                    style={{ color: T.fg }}
                  >
                    {user}
                  </h3>
                  <p className="text-[10px]" style={{ color: T.fg3 }}>
                    {originalRatings[userIdx].filter((v) => v > 0).length}/
                    {MOVIES.length} rated
                  </p>
                </div>
              </div>
              {discoveries.length > 0 && (
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                  style={{
                    background: T.greenLight,
                    color: T.greenDk,
                    border: `1px solid ${T.green}40`,
                  }}
                >
                  {discoveries.length} discover
                  {discoveries.length > 1 ? "ies" : "y"}
                </span>
              )}
            </div>

            <div className="p-3 space-y-1.5">
              {topRecs.map((rec) => {
                const isDiscovery =
                  (rec.originalRating === 0 && rec.predictedRating >= 3.0) ||
                  (rec.originalRating <= 2 && rec.predictedRating >= 3.0) ||
                  (rec.originalRating > 0 &&
                    rec.predictedRating - rec.originalRating >= 1.5);
                const pct = Math.max(
                  0,
                  Math.min(100, (rec.predictedRating / 5) * 100)
                );
                const barColor =
                  rec.predictedRating >= 4
                    ? T.green
                    : rec.predictedRating >= 3
                    ? T.yellow
                    : rec.predictedRating >= 2
                    ? T.orange
                    : T.red;

                return (
                  <div
                    key={rec.movieIdx}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-xl text-xs transition-colors"
                    style={{
                      background: isDiscovery ? T.greenLight : "transparent",
                      border: isDiscovery
                        ? `1px solid ${T.green}30`
                        : "1px solid transparent",
                    }}
                  >
                    <span
                      className="w-28 truncate font-medium flex items-center gap-1"
                      style={{ color: T.fg2 }}
                    >
                      {isDiscovery && (
                        <span style={{ color: T.green }}>✦</span>
                      )}
                      {MOVIE_EMOJIS[rec.movieIdx]} {rec.movie}
                    </span>
                    <div className="flex-1 flex items-center gap-2">
                      <div
                        className="flex-1 h-2 rounded-full overflow-hidden"
                        style={{ background: T.borderLight }}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${pct}%`,
                            background: barColor,
                          }}
                        />
                      </div>
                      <span
                        className="text-xs font-mono w-8 text-right"
                        style={{ color: T.fg2 }}
                      >
                        {rec.predictedRating.toFixed(1)}
                      </span>
                    </div>
                    <span
                      className="text-[10px] w-5 text-center font-mono"
                      style={{ color: T.fg4 }}
                    >
                      {rec.originalRating === 0 ? "—" : rec.originalRating}
                    </span>
                  </div>
                );
              })}
            </div>

            <div
              className="px-4 py-2 flex items-center gap-3 text-[10px]"
              style={{
                borderTop: `1px solid ${T.borderLight}`,
                color: T.fg3,
              }}
            >
              <span>Bar = predicted</span>
              <span>Right # = original</span>
              <span style={{ color: T.green }}>✦ = discovery</span>
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

    const movieColors = [
      T.redDk, T.blue, T.green, T.purple,
      T.aqua, T.orange, T.yellowDk, T.purpleDk,
    ];

    const moviePts = MOVIES.map((name, j) => ({
      name,
      emoji: MOVIE_EMOJIS[j],
      x: (Vt[0]?.[j] ?? 0) * S[0],
      y: has2 ? (Vt[1]?.[j] ?? 0) * S[1] : 0,
      color: movieColors[j % movieColors.length],
    }));

    return { users: userPts, movies: moviePts };
  }, [svd]);

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
      <div
        className="rounded-2xl p-8 text-center border"
        style={{ borderColor: T.border, background: T.card, color: T.fg3 }}
      >
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
    <div
      className="rounded-2xl overflow-hidden border shadow-sm"
      style={{ borderColor: T.border, background: T.card }}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minHeight: 300 }}>
        <rect width={W} height={H} fill={T.card} />

        {/* Grid */}
        <line x1={P} y1={zeroSy} x2={W - P} y2={zeroSy} stroke={T.borderLight} strokeWidth={0.5} strokeDasharray="4,4" />
        <line x1={zeroSx} y1={P} x2={zeroSx} y2={H - P} stroke={T.borderLight} strokeWidth={0.5} strokeDasharray="4,4" />

        {/* Axes */}
        <line x1={P} y1={H - P} x2={W - P} y2={H - P} stroke={T.fg4} strokeWidth={1} />
        <line x1={P} y1={P} x2={P} y2={H - P} stroke={T.fg4} strokeWidth={1} />

        {/* Axis labels */}
        <text x={W / 2} y={H - 8} textAnchor="middle" fill={T.fg3} fontSize={10} fontFamily="Sora">
          Component 1
        </text>
        <text
          x={12}
          y={H / 2}
          textAnchor="middle"
          fill={T.fg3}
          fontSize={10}
          fontFamily="Sora"
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
            opacity={0.2}
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
                opacity={isH ? 1 : 0.7}
                transform={`rotate(45, ${sx}, ${sy})`}
                rx={1}
              />
              {isH ? (
                <>
                  <rect
                    x={sx - 50}
                    y={sy - 26}
                    width={100}
                    height={20}
                    rx={6}
                    fill={T.card}
                    stroke={pt.color}
                    strokeWidth={1}
                    filter="drop-shadow(0 1px 3px rgba(0,0,0,0.1))"
                  />
                  <text x={sx} y={sy - 13} textAnchor="middle" fill={pt.color} fontSize={10} fontWeight="600" fontFamily="Sora">
                    {pt.emoji} {pt.name}
                  </text>
                </>
              ) : (
                <text x={sx} y={sy + 14} textAnchor="middle" fill={T.fg3} fontSize={7} fontFamily="Sora">
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
          const r = isH ? 11 : 9;
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
                stroke={isH ? T.card : "none"}
                strokeWidth={2}
                filter={isH ? "drop-shadow(0 2px 6px rgba(0,0,0,0.15))" : "none"}
              />
              <text
                x={sx}
                y={sy + 4}
                textAnchor="middle"
                fill="white"
                fontSize={10}
                fontWeight="bold"
                fontFamily="Sora"
                style={{ pointerEvents: "none" }}
              >
                {pt.name[0]}
              </text>
              {isH && (
                <>
                  <rect
                    x={sx - 32}
                    y={sy - 28}
                    width={64}
                    height={20}
                    rx={6}
                    fill={T.card}
                    stroke={pt.color}
                    strokeWidth={1}
                    filter="drop-shadow(0 1px 3px rgba(0,0,0,0.1))"
                  />
                  <text x={sx} y={sy - 15} textAnchor="middle" fill={pt.color} fontSize={10} fontWeight="600" fontFamily="Sora">
                    {pt.name}
                  </text>
                </>
              )}
            </g>
          );
        })}
      </svg>

      <div
        className="px-4 py-3 flex items-center gap-6 text-xs"
        style={{ borderTop: `1px solid ${T.borderLight}`, color: T.fg3 }}
      >
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full" style={{ background: T.blue }} />
          <span>Users</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rotate-45 rounded-[1px]" style={{ background: T.orange }} />
          <span>Movies</span>
        </div>
        <span className="text-[10px]" style={{ color: T.fg4 }}>
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
      <div
        className="rounded-2xl p-8 text-center border"
        style={{ borderColor: T.border, background: T.card, color: T.fg3 }}
      >
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
    <div
      className="rounded-2xl overflow-hidden border shadow-sm"
      style={{ borderColor: T.border, background: T.card }}
    >
      {/* Energy header */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ borderBottom: `1px solid ${T.borderLight}` }}
      >
        <div className="text-xs" style={{ color: T.fg2 }}>
          Energy captured with{" "}
          <span className="font-mono font-semibold" style={{ color: T.blue }}>
            k={activeK}
          </span>
          :
        </div>
        <div className="flex items-center gap-3">
          <div
            className="w-32 h-2 rounded-full overflow-hidden"
            style={{ background: T.borderLight }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${data.energyCaptured}%`,
                background: `linear-gradient(to right, ${T.aqua}, ${T.blue})`,
              }}
            />
          </div>
          <span
            className="text-sm font-mono font-bold"
            style={{ color: T.blue }}
          >
            {data.energyCaptured.toFixed(1)}%
          </span>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minHeight: 280 }}>
        <rect width={W} height={H} fill={T.card} />

        <defs>
          <linearGradient id="barActive" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={T.blue} />
            <stop offset="100%" stopColor={T.blueDk} />
          </linearGradient>
          <linearGradient id="barActiveH" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={T.aqua} />
            <stop offset="100%" stopColor={T.blue} />
          </linearGradient>
        </defs>

        {/* Y axis */}
        <line x1={PL} y1={PT} x2={PL} y2={PT + cH} stroke={T.fg4} strokeWidth={1} />
        {/* X axis */}
        <line x1={PL} y1={PT + cH} x2={W - PR} y2={PT + cH} stroke={T.fg4} strokeWidth={1} />

        {/* Y grid */}
        {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
          const y = PT + cH * (1 - frac);
          return (
            <g key={frac}>
              <line x1={PL} y1={y} x2={W - PR} y2={y} stroke={T.borderLight} strokeWidth={0.5} />
              <text x={PL - 6} y={y + 3} textAnchor="end" fill={T.fg3} fontSize={9} fontFamily="Sora">
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
                rx={4}
                fill={
                  bar.active
                    ? isH
                      ? "url(#barActiveH)"
                      : "url(#barActive)"
                    : isH
                    ? T.fg4
                    : T.border
                }
                opacity={bar.active ? 1 : 0.6}
              />

              {isH && (
                <>
                  <rect
                    x={x + barW / 2 - 30}
                    y={y - 28}
                    width={60}
                    height={22}
                    rx={6}
                    fill={T.card}
                    stroke={bar.active ? T.blue : T.fg3}
                    strokeWidth={1}
                    filter="drop-shadow(0 1px 3px rgba(0,0,0,0.08))"
                  />
                  <text
                    x={x + barW / 2}
                    y={y - 14}
                    textAnchor="middle"
                    fill={bar.active ? T.blueDk : T.fg1}
                    fontSize={10}
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    σ={bar.value.toFixed(2)}
                  </text>
                </>
              )}

              <text
                x={x + barW / 2}
                y={y - 4}
                textAnchor="middle"
                fill={bar.active ? T.blueDk : T.fg3}
                fontSize={8}
                fontFamily="monospace"
              >
                {bar.pct.toFixed(0)}%
              </text>

              <text
                x={x + barW / 2}
                y={PT + cH + 16}
                textAnchor="middle"
                fill={bar.active ? T.blue : T.fg3}
                fontSize={10}
                fontFamily="monospace"
              >
                σ{i + 1}
              </text>

              {bar.active && (
                <circle cx={x + barW / 2} cy={PT + cH + 28} r={3} fill={T.blue} />
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
              stroke={T.orange}
              strokeWidth={1.5}
              strokeDasharray="4,2"
              opacity={0.7}
            />
            {data.cumulativePcts.map((pct, i) => {
              const x = PL + barGap * (i + 1) + barW * i + barW / 2;
              const y = PT + cH * (1 - pct / 100);
              return (
                <circle key={i} cx={x} cy={y} r={2.5} fill={T.orange} opacity={0.8} />
              );
            })}
          </>
        )}

        {/* Cutoff line */}
        {activeK < data.bars.length &&
          (() => {
            const cutX =
              PL + barGap * (activeK + 1) + barW * activeK - barGap / 2;
            return (
              <line
                x1={cutX}
                y1={PT}
                x2={cutX}
                y2={PT + cH}
                stroke={T.red}
                strokeWidth={1}
                strokeDasharray="5,3"
                opacity={0.5}
              />
            );
          })()}

        {/* Axis titles */}
        <text x={W / 2} y={H - 8} textAnchor="middle" fill={T.fg3} fontSize={10} fontFamily="Sora">
          Singular Values
        </text>
        <text
          x={12}
          y={PT + cH / 2}
          textAnchor="middle"
          fill={T.fg3}
          fontSize={10}
          fontFamily="Sora"
          transform={`rotate(-90, 12, ${PT + cH / 2})`}
        >
          Magnitude
        </text>
      </svg>

      <div
        className="px-4 py-3 flex items-center gap-6 text-xs"
        style={{ borderTop: `1px solid ${T.borderLight}`, color: T.fg3 }}
      >
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded" style={{ background: T.blue }} />
          <span>Active</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded" style={{ background: T.border }} />
          <span>Truncated</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="h-0.5 w-6"
            style={{ borderTop: `2px dashed ${T.orange}` }}
          />
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
  kValue,
}: {
  original: number[][];
  predicted: number[][];
  kValue: number;
}) {
  const [hoveredCell, setHoveredCell] = useState<{
    r: number;
    c: number;
  } | null>(null);

  const cellSize = 44;
  const labelW = 64;
  const labelH = 70;
  const gapBetween = 40;
  const w1 = labelW + MOVIES.length * cellSize;
  const totalW = w1 + gapBetween + MOVIES.length * cellSize;
  const totalH = labelH + USERS.length * cellSize + 20;

  function getColor(val: number, max: number) {
    const t = Math.max(0, Math.min(1, val / max));
    // Light blue gradient
    const r = Math.round(245 - t * 210);
    const g = Math.round(245 - t * 130);
    const b = Math.round(247 - t * 20);
    return `rgb(${r},${g},${b})`;
  }

  function getTextColor(val: number) {
    return val >= 3.5 ? "#ffffff" : T.fg;
  }

  return (
    <div
      className="rounded-2xl overflow-hidden border shadow-sm"
      style={{ borderColor: T.border, background: T.card }}
    >
      <div className="px-4 py-3" style={{ borderBottom: `1px solid ${T.borderLight}` }}>
        <h3 className="text-sm font-medium tracking-tight" style={{ color: T.fg1 }}>
          Original vs Predicted — Side by Side Heatmap
        </h3>
        <p className="text-[10px] mt-1" style={{ color: T.fg3 }}>
          Left: original ratings (0 = unrated). Right: SVD predicted scores.
          Hover to compare differences.
        </p>
      </div>
      <div className="overflow-x-auto p-4">
        <svg
          viewBox={`0 0 ${totalW + 20} ${totalH}`}
          className="w-full"
          style={{ minHeight: 280 }}
        >
          <rect width={totalW + 20} height={totalH} fill={T.card} />

          {/* Headers */}
          <text
            x={labelW + (MOVIES.length * cellSize) / 2}
            y={14}
            textAnchor="middle"
            fill={T.fg1}
            fontSize={11}
            fontWeight="600"
            fontFamily="Sora"
          >
            Original Ratings
          </text>
          <text
            x={w1 + gapBetween + (MOVIES.length * cellSize) / 2}
            y={14}
            textAnchor="middle"
            fill={T.fg1}
            fontSize={11}
            fontWeight="600"
            fontFamily="Sora"
          >
            SVD Predicted
          </text>

          {/* Original matrix */}
          {USERS.map((user, ui) => (
            <g key={`orow-${ui}`}>
              <text
                x={labelW - 6}
                y={labelH + ui * cellSize + cellSize / 2 + 3}
                textAnchor="end"
                fill={T.fg2}
                fontSize={10}
                fontFamily="Sora"
              >
                {user}
              </text>
              {MOVIES.map((movie, mi) => {
                const x = labelW + mi * cellSize;
                const y = labelH + ui * cellSize;
                const val = original[ui][mi];
                const isH =
                  hoveredCell?.r === ui && hoveredCell?.c === mi;
                return (
                  <g
                    key={`o-${ui}-${mi}`}
                    onMouseEnter={() => setHoveredCell({ r: ui, c: mi })}
                    onMouseLeave={() => setHoveredCell(null)}
                  >
                    {ui === 0 && (
                      <text
                        x={x + cellSize / 2}
                        y={labelH - 8}
                        textAnchor="middle"
                        fill={T.fg3}
                        fontSize={7}
                        fontFamily="Sora"
                        transform={`rotate(-45, ${x + cellSize / 2}, ${
                          labelH - 8
                        })`}
                      >
                        {movie.length > 10
                          ? movie.slice(0, 9) + "…"
                          : movie}
                      </text>
                    )}
                    <rect
                      x={x + 1}
                      y={y + 1}
                      width={cellSize - 2}
                      height={cellSize - 2}
                      rx={6}
                      fill={val === 0 ? T.cardAlt : getColor(val, 5)}
                      stroke={isH ? T.blue : T.borderLight}
                      strokeWidth={isH ? 2 : 0.5}
                    />
                    <text
                      x={x + cellSize / 2}
                      y={y + cellSize / 2 + 4}
                      textAnchor="middle"
                      fill={val === 0 ? T.fg4 : getTextColor(val)}
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
            fill={T.fg4}
            fontSize={20}
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
                const isH =
                  hoveredCell?.r === ui && hoveredCell?.c === mi;
                const origVal = original[ui][mi];
                const diff = origVal > 0 ? val - origVal : 0;
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
                        fill={T.fg3}
                        fontSize={7}
                        fontFamily="Sora"
                        transform={`rotate(-45, ${x + cellSize / 2}, ${
                          labelH - 8
                        })`}
                      >
                        {movie.length > 10
                          ? movie.slice(0, 9) + "…"
                          : movie}
                      </text>
                    )}
                    <rect
                      x={x + 1}
                      y={y + 1}
                      width={cellSize - 2}
                      height={cellSize - 2}
                      rx={6}
                      fill={getColor(val, 5)}
                      stroke={isH ? T.blue : T.borderLight}
                      strokeWidth={isH ? 2 : 0.5}
                    />
                    <text
                      x={x + cellSize / 2}
                      y={
                        y +
                        cellSize / 2 +
                        (isH && origVal > 0 ? -1 : 4)
                      }
                      textAnchor="middle"
                      fill={getTextColor(val)}
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
                        fill={diff >= 0 ? T.green : T.red}
                        fontSize={7}
                        fontFamily="monospace"
                        fontWeight="600"
                      >
                        {diff >= 0 ? "+" : ""}
                        {diff.toFixed(1)}
                      </text>
                    )}
                    {isH && origVal === 0 && (
                      <text
                        x={x + cellSize / 2}
                        y={y + cellSize / 2 + 13}
                        textAnchor="middle"
                        fill={T.blue}
                        fontSize={7}
                        fontFamily="monospace"
                        fontWeight="600"
                      >
                        new!
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
                <rect
                  x={x}
                  y={y - 10}
                  width={20}
                  height={10}
                  rx={3}
                  fill={v === 0 ? T.cardAlt : getColor(v, 5)}
                  stroke={T.borderLight}
                  strokeWidth={0.5}
                />
                <text
                  x={x + 10}
                  y={y + 8}
                  textAnchor="middle"
                  fill={T.fg3}
                  fontSize={7}
                  fontFamily="Sora"
                >
                  {v}
                </text>
              </g>
            );
          })}
          <text
            x={totalW - 150 - 4}
            y={totalH - 10}
            textAnchor="end"
            fill={T.fg3}
            fontSize={8}
            fontFamily="Sora"
          >
            Scale:
          </text>
        </svg>
      </div>

      {/* Explanation */}
      <div
        className="px-5 py-4"
        style={{
          borderTop: `1px solid ${T.borderLight}`,
          background: T.blueLight,
        }}
      >
        <h4
          className="text-xs font-medium tracking-tight mb-2 flex items-center gap-1.5"
          style={{ color: T.blueDk }}
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Why don&apos;t the heatmaps match exactly?
        </h4>
        <p
          className="text-[11px] leading-relaxed"
          style={{ color: T.fg2 }}
        >
          The predicted heatmap is a{" "}
          <strong style={{ color: T.fg }}>
            rank-{kValue} approximation
          </strong>{" "}
          of the original matrix — not a copy. SVD decomposes ratings into{" "}
          {kValue} latent factor{kValue > 1 ? "s" : ""} (think of them as
          hidden themes like &quot;action lover&quot; or &quot;animation
          fan&quot;). When we reconstruct with only the top {kValue} factor
          {kValue > 1 ? "s" : ""}, we{" "}
          <strong style={{ color: T.fg }}>
            smooth out noise and fill in gaps
          </strong>
          :
        </p>
        <ul className="text-[11px] mt-2 space-y-1 list-none" style={{ color: T.fg2 }}>
          <li className="flex items-start gap-1.5">
            <span style={{ color: T.blue }} className="mt-0.5">
              ▸
            </span>
            <span>
              <strong style={{ color: T.fg }}>Rated cells differ</strong>{" "}
              because the low-rank approximation can&apos;t perfectly reproduce
              every individual rating — it captures the dominant patterns while
              discarding minor variations (noise). A user&apos;s &quot;3&quot;
              might predict as 3.4 because similar users tended to rate that
              movie slightly higher.
            </span>
          </li>
          <li className="flex items-start gap-1.5">
            <span style={{ color: T.green }} className="mt-0.5">
              ▸
            </span>
            <span>
              <strong style={{ color: T.fg }}>
                Unrated cells get filled
              </strong>{" "}
              — this is the magic of SVD. By learning latent patterns from
              existing ratings, the model infers what a user{" "}
              <em>would have</em> rated a movie they haven&apos;t seen. A high
              predicted score on an unrated movie = a strong recommendation.
            </span>
          </li>
          <li className="flex items-start gap-1.5">
            <span style={{ color: T.orange }} className="mt-0.5">
              ▸
            </span>
            <span>
              <strong style={{ color: T.fg }}>
                Lower k = more smoothing
              </strong>
              . Try moving the rank slider: at k=1, everything collapses to one
              pattern; at k={Math.min(USERS.length, MOVIES.length)}, the
              approximation is nearly exact. The sweet spot captures real
              preferences without overfitting to noise.
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}

// ─── Decomposed Matrices Visualization ───────────────────────
function DecomposedMatrices({
  svd,
  kValue,
}: {
  svd: SVDResult;
  kValue: number;
}) {
  const { U, S, Vt } = svd;
  const k = Math.min(kValue, S.length);

  if (S.length === 0 || U.length === 0 || Vt.length === 0) {
    return (
      <div
        className="rounded-2xl p-8 text-center border"
        style={{ borderColor: T.border, background: T.card, color: T.fg3 }}
      >
        No SVD decomposition available
      </div>
    );
  }

  const truncU = U.map((row) => row.slice(0, k));
  const truncS = S.slice(0, k);
  const truncVt = Vt.slice(0, k);

  function valColor(val: number, intensity: number): string {
    const clamped = Math.max(-1, Math.min(1, val / intensity));
    if (clamped >= 0) {
      const t = clamped;
      const r = Math.round(245 - t * 210);
      const g = Math.round(245 - t * 130);
      const b = Math.round(247 - t * 20);
      return `rgb(${r},${g},${b})`;
    } else {
      const t = -clamped;
      const r = Math.round(245 + t * 10);
      const g = Math.round(245 - t * 186);
      const b = Math.round(247 - t * 199);
      return `rgb(${r},${g},${b})`;
    }
  }

  function valTextColor(val: number, intensity: number): string {
    const clamped = Math.abs(val / intensity);
    return clamped > 0.6 ? "#ffffff" : T.fg;
  }

  const maxU = Math.max(...truncU.flat().map(Math.abs), 0.01);
  const maxVt = Math.max(...truncVt.flat().map(Math.abs), 0.01);

  const cellW = 52;
  const cellH = 32;
  const labelW = 56;
  const labelH = 24;
  const matGap = 24;

  function renderMatrix(
    data: number[][],
    rows: number,
    cols: number,
    rowLabels: string[],
    colLabels: string[],
    maxAbs: number,
    offsetX: number,
    offsetY: number,
    title: string,
    titleColor: string,
    isDiagonal?: boolean,
  ) {
    const mW = labelW + cols * cellW;
    const mH = labelH + rows * cellH;
    const elements = [];

    elements.push(
      <text
        key="title"
        x={offsetX + mW / 2}
        y={offsetY - 10}
        textAnchor="middle"
        fill={titleColor}
        fontSize={13}
        fontWeight="700"
        fontFamily="Sora"
      >
        {title}
      </text>
    );

    elements.push(
      <text
        key="size"
        x={offsetX + mW / 2}
        y={offsetY + mH + 16}
        textAnchor="middle"
        fill={T.fg3}
        fontSize={9}
        fontFamily="Sora"
      >
        {rows} × {cols}
      </text>
    );

    colLabels.forEach((label, ci) => {
      elements.push(
        <text
          key={`col-${ci}`}
          x={offsetX + labelW + ci * cellW + cellW / 2}
          y={offsetY + labelH - 6}
          textAnchor="middle"
          fill={T.fg3}
          fontSize={8}
          fontFamily="Sora"
        >
          {label}
        </text>
      );
    });

    for (let ri = 0; ri < rows; ri++) {
      elements.push(
        <text
          key={`row-${ri}`}
          x={offsetX + labelW - 6}
          y={offsetY + labelH + ri * cellH + cellH / 2 + 3}
          textAnchor="end"
          fill={T.fg2}
          fontSize={9}
          fontFamily="Sora"
        >
          {rowLabels[ri]}
        </text>
      );

      for (let ci = 0; ci < cols; ci++) {
        const val = data[ri][ci];
        const x = offsetX + labelW + ci * cellW;
        const y = offsetY + labelH + ri * cellH;
        const isActive = isDiagonal ? ri === ci : true;

        elements.push(
          <g key={`cell-${ri}-${ci}`}>
            <rect
              x={x + 1}
              y={y + 1}
              width={cellW - 2}
              height={cellH - 2}
              rx={5}
              fill={isActive ? valColor(val, maxAbs) : T.cardAlt}
              stroke={T.borderLight}
              strokeWidth={0.5}
            />
            <text
              x={x + cellW / 2}
              y={y + cellH / 2 + 4}
              textAnchor="middle"
              fill={isActive ? valTextColor(val, maxAbs) : T.fg4}
              fontSize={val === 0 && isDiagonal && ri !== ci ? 8 : 9}
              fontWeight="600"
              fontFamily="monospace"
            >
              {isDiagonal && ri !== ci ? "0" : val.toFixed(2)}
            </text>
          </g>
        );
      }
    }

    const bx1 = offsetX + labelW - 2;
    const by1 = offsetY + labelH;
    const bx2 = offsetX + labelW + cols * cellW + 2;
    const by2 = offsetY + labelH + rows * cellH;
    const bracketW = 6;

    elements.push(
      <path
        key="lbracket"
        d={`M${bx1},${by1} L${bx1 - bracketW},${by1} L${bx1 - bracketW},${by2} L${bx1},${by2}`}
        fill="none"
        stroke={T.fg3}
        strokeWidth={1.5}
      />
    );
    elements.push(
      <path
        key="rbracket"
        d={`M${bx2},${by1} L${bx2 + bracketW},${by1} L${bx2 + bracketW},${by2} L${bx2},${by2}`}
        fill="none"
        stroke={T.fg3}
        strokeWidth={1.5}
      />
    );

    return { elements, width: mW, height: mH };
  }

  const sigmaMatrix: number[][] = [];
  for (let i = 0; i < k; i++) {
    const row: number[] = [];
    for (let j = 0; j < k; j++) {
      row.push(i === j ? truncS[i] : 0);
    }
    sigmaMatrix.push(row);
  }

  const sigmaLabels = Array.from({ length: k }, (_, i) => `σ${i + 1}`);
  const compLabels = Array.from({ length: k }, (_, i) => `c${i + 1}`);
  const movieShortLabels = MOVIES.map((m) => m.length > 7 ? m.slice(0, 6) + "…" : m);

  const padTop = 36;
  const uResult = renderMatrix(
    truncU, USERS.length, k,
    USERS, compLabels,
    maxU, 0, padTop,
    `U (Users × Components)`, T.blue, false
  );
  const sResult = renderMatrix(
    sigmaMatrix, k, k,
    sigmaLabels, sigmaLabels,
    Math.max(...truncS, 0.01),
    uResult.width + matGap, padTop,
    `Σ (Singular Values)`, T.orange, true
  );
  const vtResult = renderMatrix(
    truncVt, k, MOVIES.length,
    compLabels, movieShortLabels,
    maxVt, uResult.width + matGap + sResult.width + matGap, padTop,
    `Vᵀ (Components × Movies)`, T.green, false
  );

  const totalW = uResult.width + matGap + sResult.width + matGap + vtResult.width + 20;
  const maxH = Math.max(uResult.height, sResult.height, vtResult.height);
  const totalH = padTop + maxH + 34;

  const multX1 = uResult.width + matGap / 2;
  const multX2 = uResult.width + matGap + sResult.width + matGap / 2;
  const multY = padTop + labelH + maxH / 2;

  return (
    <div
      className="rounded-2xl overflow-hidden border shadow-sm"
      style={{ borderColor: T.border, background: T.card }}
    >
      <div
        className="px-5 py-4"
        style={{ borderBottom: `1px solid ${T.borderLight}` }}
      >
        <h3
          className="text-sm font-semibold tracking-tight flex items-center gap-2"
          style={{ color: T.fg }}
        >
          <span className="font-mono text-base" style={{ color: T.blue }}>R</span>
          <span style={{ color: T.fg3 }}>=</span>
          <span className="font-mono text-base" style={{ color: T.blue }}>U</span>
          <span style={{ color: T.fg3 }}>·</span>
          <span className="font-mono text-base" style={{ color: T.orange }}>Σ</span>
          <span style={{ color: T.fg3 }}>·</span>
          <span className="font-mono text-base" style={{ color: T.green }}>Vᵀ</span>
          <span className="text-xs font-normal ml-2" style={{ color: T.fg3 }}>
            — Truncated at rank k={kValue}
          </span>
        </h3>
      </div>

      <div className="overflow-x-auto p-4">
        <svg
          viewBox={`-10 0 ${totalW + 20} ${totalH}`}
          className="w-full"
          style={{ minHeight: 240, maxHeight: 420 }}
        >
          <rect x={-10} y={0} width={totalW + 20} height={totalH} fill={T.card} />

          {uResult.elements}
          {sResult.elements}
          {vtResult.elements}

          <text
            x={multX1}
            y={multY}
            textAnchor="middle"
            fill={T.fg2}
            fontSize={18}
            fontWeight="700"
            fontFamily="Sora"
          >
            ×
          </text>
          <text
            x={multX2}
            y={multY}
            textAnchor="middle"
            fill={T.fg2}
            fontSize={18}
            fontWeight="700"
            fontFamily="Sora"
          >
            ×
          </text>
        </svg>
      </div>

      <div
        className="px-5 py-4 grid grid-cols-1 md:grid-cols-3 gap-4"
        style={{ borderTop: `1px solid ${T.borderLight}` }}
      >
        <div className="rounded-xl p-3" style={{ background: T.blueLight, border: `1px solid ${T.blue}20` }}>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="h-5 w-5 rounded-md flex items-center justify-center text-white text-xs font-bold" style={{ background: T.blue }}>U</div>
            <h4 className="text-xs font-semibold" style={{ color: T.blueDk }}>User–Feature Matrix</h4>
          </div>
          <p className="text-[11px] leading-relaxed" style={{ color: T.fg2 }}>
            Each row represents a user, and each column is a latent feature (hidden preference dimension).
            The values tell you <strong style={{ color: T.fg }}>how strongly each user relates to each latent feature</strong>.
            For example, a high value in feature 1 might indicate a preference for action films.
          </p>
          <p className="text-[10px] mt-1.5 font-mono" style={{ color: T.fg3 }}>
            Shape: {USERS.length} users × {k} components
          </p>
        </div>

        <div className="rounded-xl p-3" style={{ background: T.yellowLight, border: `1px solid ${T.yellow}20` }}>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="h-5 w-5 rounded-md flex items-center justify-center text-white text-xs font-bold" style={{ background: T.orange }}>Σ</div>
            <h4 className="text-xs font-semibold" style={{ color: T.orangeDk }}>Singular Values (Strength)</h4>
          </div>
          <p className="text-[11px] leading-relaxed" style={{ color: T.fg2 }}>
            A diagonal matrix where each value σᵢ represents the <strong style={{ color: T.fg }}>importance or &quot;energy&quot; of each latent feature</strong>.
            Larger singular values mean that feature explains more variance in the data.
            σ₁ is always the largest — the dominant pattern in the ratings.
          </p>
          <p className="text-[10px] mt-1.5 font-mono" style={{ color: T.fg3 }}>
            Shape: {k} × {k} diagonal
          </p>
        </div>

        <div className="rounded-xl p-3" style={{ background: T.greenLight, border: `1px solid ${T.green}20` }}>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="h-5 w-5 rounded-md flex items-center justify-center text-white text-xs font-bold" style={{ background: T.green }}>Vᵀ</div>
            <h4 className="text-xs font-semibold" style={{ color: T.greenDk }}>Movie–Feature Matrix</h4>
          </div>
          <p className="text-[11px] leading-relaxed" style={{ color: T.fg2 }}>
            Each row is a latent feature and each column is a movie. The values indicate <strong style={{ color: T.fg }}>how much each movie belongs to each latent feature</strong>.
            Movies with similar column patterns are perceived similarly by the SVD — this is how it finds &quot;similar movies&quot; even without genre metadata.
          </p>
          <p className="text-[10px] mt-1.5 font-mono" style={{ color: T.fg3 }}>
            Shape: {k} components × {MOVIES.length} movies
          </p>
        </div>
      </div>

      <div
        className="px-5 py-3 text-[11px] leading-relaxed"
        style={{ borderTop: `1px solid ${T.borderLight}`, background: T.yellowLight, color: T.fg2 }}
      >
        <strong style={{ color: T.yellowDk }}>How prediction works:</strong>{" "}
        To predict user <em>i</em>&apos;s rating for movie <em>j</em>, we compute the dot product of
        user <em>i</em>&apos;s row in <span className="font-mono" style={{ color: T.blue }}>U</span>,
        scaled by the singular values in <span className="font-mono" style={{ color: T.orange }}>Σ</span>,
        and movie <em>j</em>&apos;s column in <span className="font-mono" style={{ color: T.green }}>Vᵀ</span>.
        By truncating to only {k} component{k > 1 ? "s" : ""}, we keep the most meaningful patterns and discard noise — this is what enables generalization to unseen ratings.
        {k < S.length && (
          <span style={{ color: T.red }}>
            {" "}Currently using {k} of {S.length} available components, capturing the top patterns while filtering noise.
          </span>
        )}
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

  const svdResult = useMemo(() => {
    try {
      const normalized = ratings.map((row) => {
        const nonZero = row.filter((v) => v > 0);
        const mean =
          nonZero.length > 0
            ? nonZero.reduce((a, b) => a + b, 0) / nonZero.length
            : 2.5;
        return row.map((v) => (v === 0 ? mean : v));
      });

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
      return {
        svd: { U: [], S: [], Vt: [] } as SVDResult,
        predicted: ratings.map((row) =>
          row.map((v) => (v === 0 ? 2.5 : v))
        ),
      };
    }
  }, [ratings, kValue]);

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
    <div className="min-h-screen" style={{ background: T.bg, color: T.fg }}>
      {/* Header */}
      <header
        className="sticky top-0 z-50 shadow-sm"
        style={{
          borderBottom: `1px solid ${T.border}`,
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center shadow-md text-xl"
              style={{
                background: `linear-gradient(135deg, ${T.blue}, ${T.purple})`,
              }}
            >
              🎬
            </div>
            <div>
              <h1
                className="text-xl font-semibold tracking-tight"
                style={{ color: T.fg }}
              >
                SVD Movie Recommender
              </h1>
              <p className="text-xs font-normal" style={{ color: T.fg3 }}>
                Singular Value Decomposition · Interactive Demo · Julian Juang and Luiz Felipe Costa Coimbra
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div
              className="flex items-center gap-2 rounded-xl px-3 py-2"
              style={{ background: T.cardAlt, border: `1px solid ${T.border}` }}
            >
              <label
                className="text-xs font-medium"
                style={{ color: T.fg2 }}
              >
                SVD Rank (k):
              </label>
              <input
                type="range"
                min={1}
                max={maxK}
                value={kValue}
                onChange={(e) => setKValue(Number(e.target.value))}
                className="w-24"
              />
              <span
                className="text-sm font-mono w-4 text-center font-semibold"
                style={{ color: T.blue }}
              >
                {kValue}
              </span>
            </div>
            <button
              onClick={handleReset}
              className="px-3 py-2 text-xs font-medium rounded-xl transition-colors cursor-pointer border"
              style={{
                background: T.card,
                borderColor: T.border,
                color: T.fg2,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = T.cardAlt;
                e.currentTarget.style.borderColor = T.fg4;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = T.card;
                e.currentTarget.style.borderColor = T.border;
              }}
            >
              Reset
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Info */}
        <div
          className="rounded-2xl p-4 border shadow-sm"
          style={{ borderColor: T.border, background: T.card }}
        >
          <p className="text-sm leading-relaxed" style={{ color: T.fg2 }}>
            <span className="font-semibold" style={{ color: T.blue }}>
              How it works:
            </span>{" "}
            SVD decomposes the user-movie ratings matrix{" "}
            <span
              className="font-mono px-1 py-0.5 rounded"
              style={{ color: T.blueDk, background: T.blueLight }}
            >
              R ≈ U·Σ·Vᵀ
            </span>{" "}
            into latent factors. By keeping only the top{" "}
            <span
              className="font-mono font-semibold"
              style={{ color: T.blue }}
            >
              k={kValue}
            </span>{" "}
            singular values, we capture dominant patterns (e.g., genre
            preferences) and predict missing ratings. Click any star below to
            change ratings and see recommendations update live.
          </p>
        </div>

        {/* 1: Ratings Table */}
        <section>
          <SectionHeader
            color={`${T.blue}, ${T.blueDk}`}
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
            color={`${T.green}, ${T.greenDk}`}
            title="Predicted Ratings & Discoveries"
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
            color={`${T.orange}, ${T.orangeDk}`}
            title="Original vs Predicted Heatmap"
            subtitle="Visual comparison of actual and SVD-predicted ratings"
          />
          <HeatmapComparison
            original={ratings}
            predicted={svdResult.predicted}
            kValue={kValue}
          />
        </section>

        {/* 4: Latent Space & Singular Values */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section>
            <SectionHeader
              color={`${T.purple}, ${T.purpleDk}`}
              title="Latent Space (2D)"
              subtitle="Users & Movies projected in SVD space"
            />
            <LatentSpaceViz svd={svdResult.svd} />
          </section>
          <section>
            <SectionHeader
              color={`${T.red}, ${T.redDk}`}
              title="Singular Values"
              subtitle="Energy distribution across components"
            />
            <SingularValuesChart svd={svdResult.svd} activeK={kValue} />
          </section>
        </div>

        {/* 5: Decomposed Matrices */}
        <section>
          <SectionHeader
            color={`${T.yellow}, ${T.yellowDk}`}
            title="SVD Decomposition"
            subtitle="The three matrices that make up the factorization"
          />
          <DecomposedMatrices svd={svdResult.svd} kValue={kValue} />
        </section>
      </main>

      <footer
        className="mt-12 py-6 text-center text-xs font-normal"
        style={{
          borderTop: `1px solid ${T.border}`,
          color: T.fg3,
          background: T.bg,
        }}
      >
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
      <div
        className="h-6 w-1 rounded-full"
        style={{ background: `linear-gradient(to bottom, ${color})` }}
      />
      <h2
        className="text-lg font-semibold tracking-tight"
        style={{ color: T.fg }}
      >
        {title}
      </h2>
      <span className="text-xs font-normal ml-2" style={{ color: T.fg3 }}>
        {subtitle}
      </span>
    </div>
  );
}
