interface MovieScore {
  movie: string;
  movieIdx: number;
  originalRating: number;
  predictedRating: number;
}

interface RecommendationsTableProps {
  recommendations: MovieScore[][];
  users: string[];
  movies: string[];
  originalRatings: number[][];
  predictedMatrix: number[][];
}

function PredictedBar({ value, max = 5 }: { value: number; max?: number }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const color =
    value >= 4
      ? "from-emerald-500 to-green-400"
      : value >= 3
      ? "from-yellow-500 to-amber-400"
      : value >= 2
      ? "from-orange-500 to-orange-400"
      : "from-red-500 to-red-400";

  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-mono text-gray-400 w-8 text-right">
        {value.toFixed(1)}
      </span>
    </div>
  );
}

export function RecommendationsTable({
  recommendations,
  users,
  movies,
  originalRatings,
  predictedMatrix: _predictedMatrix,
}: RecommendationsTableProps) {
  void _predictedMatrix;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {users.map((user, userIdx) => {
        const topRecs = recommendations[userIdx];
        // Find movies where SVD predicts high score but user gave low/no rating
        const discoveries = topRecs.filter(
          (r) => r.originalRating <= 2 && r.predictedRating >= 3
        );

        return (
          <div
            key={user}
            className="rounded-xl border border-gray-800 bg-gray-900/80 backdrop-blur-sm overflow-hidden"
          >
            {/* User header */}
            <div className="px-4 py-3 bg-gray-900/60 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ background: `hsl(${userIdx * 60}, 60%, 35%)` }}
                >
                  {user[0]}
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{user}</h3>
                  <p className="text-[10px] text-gray-500">
                    {originalRatings[userIdx].filter((v) => v > 0).length}/{movies.length} rated
                  </p>
                </div>
              </div>
              {discoveries.length > 0 && (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-medium">
                  {discoveries.length} new pick{discoveries.length > 1 ? "s" : ""}
                </span>
              )}
            </div>

            {/* Predicted ratings */}
            <div className="p-3 space-y-1.5">
              {topRecs.map((rec) => {
                const isDiscovery = rec.originalRating <= 2 && rec.predictedRating >= 3;
                const isUnrated = rec.originalRating === 0;
                return (
                  <div
                    key={rec.movieIdx}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors ${
                      isDiscovery
                        ? "bg-emerald-500/10 border border-emerald-500/20"
                        : "hover:bg-gray-800/40"
                    }`}
                  >
                    <span className="w-24 truncate font-medium text-gray-300 flex items-center gap-1">
                      {isDiscovery && <span className="text-emerald-400">✦</span>}
                      {isUnrated && <span className="text-yellow-500 text-[10px]">?</span>}
                      {rec.movie}
                    </span>
                    <div className="flex-1">
                      <PredictedBar value={rec.predictedRating} />
                    </div>
                    <span className="text-[10px] text-gray-600 w-6 text-center font-mono">
                      {rec.originalRating === 0 ? "—" : rec.originalRating}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
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
