import { useState } from "react";

interface RatingsTableProps {
  ratings: number[][];
  users: string[];
  movies: string[];
  onRatingChange: (userIdx: number, movieIdx: number, value: number) => void;
}

const STAR_COLORS = [
  "text-gray-600", // 0
  "text-red-400",   // 1
  "text-orange-400", // 2
  "text-yellow-400", // 3
  "text-lime-400",   // 4
  "text-emerald-400", // 5
];

function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState<number | null>(null);

  return (
    <div className="flex items-center gap-0.5" onMouseLeave={() => setHover(null)}>
      {[1, 2, 3, 4, 5].map((star) => {
        const active = star <= (hover ?? value);
        return (
          <button
            key={star}
            className={`text-sm transition-all duration-100 ${
              active ? STAR_COLORS[hover ?? value] : "text-gray-700"
            } hover:scale-125`}
            onMouseEnter={() => setHover(star)}
            onClick={() => onChange(star === value ? 0 : star)}
            title={star === value ? "Click to clear" : `Rate ${star}`}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}

export function RatingsTable({
  ratings,
  users,
  movies,
  onRatingChange,
}: RatingsTableProps) {
  return (
    <div
      className="overflow-x-auto rounded-xl border border-gray-800 bg-gray-900/80 backdrop-blur-sm shadow-2xl shadow-black/20"
    >
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800">
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-900/60 sticky left-0 z-10">
              User
            </th>
            {movies.map((movie) => (
              <th
                key={movie}
                className="px-3 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap"
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="text-base">🎬</span>
                  <span>{movie}</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {users.map((user, userIdx) => (
            <tr
              key={user}
              className={`border-b border-gray-800/50 transition-colors hover:bg-gray-800/30 ${
                userIdx % 2 === 0 ? "bg-gray-900/30" : ""
              }`}
            >
              <td className="px-4 py-2.5 font-medium text-gray-200 bg-gray-900/60 sticky left-0 z-10 border-r border-gray-800/50">
                <div className="flex items-center gap-2">
                  <div
                    className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{
                      background: `hsl(${userIdx * 60}, 60%, 35%)`,
                    }}
                  >
                    {user[0]}
                  </div>
                  <span>{user}</span>
                </div>
              </td>
              {movies.map((_, movieIdx) => (
                <td
                  key={movieIdx}
                  className="px-3 py-2.5 text-center"
                >
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
