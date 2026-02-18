import { useState, useMemo, useCallback } from "react";
import { computeSVD, reconstructMatrix } from "./svd";
import { RatingsTable } from "./components/RatingsTable";
import { RecommendationsTable } from "./components/RecommendationsTable";
import { LatentSpaceViz } from "./components/LatentSpaceViz";
import { SingularValuesChart } from "./components/SingularValuesChart";

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

const USERS = ["Alice", "Bob", "Carol", "Dave", "Eve", "Frank"];

const INITIAL_RATINGS: number[][] = [
  // Matrix, Titanic, ToyStory, Godfather, Frozen, Inception, ForrestG, Avengers
  [5, 1, 2, 5, 1, 5, 3, 4], // Alice - likes action/sci-fi/thriller
  [1, 5, 4, 2, 5, 1, 4, 2], // Bob - likes romance/family/drama
  [4, 2, 1, 4, 1, 4, 2, 5], // Carol - likes action/thriller
  [2, 4, 5, 1, 5, 2, 5, 1], // Dave - likes family/drama/comedy
  [5, 1, 3, 4, 2, 5, 2, 5], // Eve - likes sci-fi/action
  [1, 5, 4, 2, 4, 0, 3, 0], // Frank - some missing ratings (0 = not rated)
];

export function App() {
  const [ratings, setRatings] = useState<number[][]>(
    INITIAL_RATINGS.map((row) => [...row])
  );
  const [kValue, setKValue] = useState(2);

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
    setKValue(2);
  }, []);

  // Compute SVD
  const svdResult = useMemo(() => {
    // Normalize: replace 0s with row mean for SVD computation
    const normalized = ratings.map((row) => {
      const nonZero = row.filter((v) => v > 0);
      const mean = nonZero.length > 0 ? nonZero.reduce((a, b) => a + b, 0) / nonZero.length : 0;
      return row.map((v) => (v === 0 ? mean : v));
    });

    // Center the matrix (subtract global mean)
    const allVals = normalized.flat();
    const globalMean = allVals.reduce((a, b) => a + b, 0) / allVals.length;
    const centered = normalized.map((row) => row.map((v) => v - globalMean));

    const svd = computeSVD(centered);
    const reconstructedCentered = reconstructMatrix(svd, kValue);
    const reconstructed = reconstructedCentered.map((row) =>
      row.map((v) => {
        const val = v + globalMean;
        return Math.max(0, Math.min(5, val));
      })
    );

    return { svd, reconstructed, globalMean, centered };
  }, [ratings, kValue]);

  // Generate recommendations: for each user, find movies they haven't rated highly
  // and rank by predicted score
  const recommendations = useMemo(() => {
    return USERS.map((_, userIdx) => {
      const predicted = svdResult.reconstructed[userIdx];
      const movieScores = MOVIES.map((movie, movieIdx) => ({
        movie,
        movieIdx,
        originalRating: ratings[userIdx][movieIdx],
        predictedRating: predicted[movieIdx],
      }));

      // Sort by predicted rating descending
      const sorted = [...movieScores].sort(
        (a, b) => b.predictedRating - a.predictedRating
      );

      return sorted;
    });
  }, [svdResult, ratings]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-indigo-950 text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-950/60 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M4 11a9 9 0 0 1 9 9" />
                <path d="M4 4a16 16 0 0 1 16 16" />
                <circle cx="5" cy="19" r="1" />
              </svg>
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
              <label className="text-xs text-gray-400 font-medium">SVD Rank (k):</label>
              <input
                type="range"
                min={1}
                max={Math.min(USERS.length, MOVIES.length)}
                value={kValue}
                onChange={(e) => setKValue(Number(e.target.value))}
                className="w-20 accent-violet-500"
              />
              <span className="text-sm font-mono text-violet-400 w-4 text-center">{kValue}</span>
            </div>
            <button
              onClick={handleReset}
              className="px-3 py-2 text-xs font-medium bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Info Banner */}
        <div className="bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20 rounded-xl p-4">
          <p className="text-sm text-gray-300">
            <span className="font-semibold text-violet-400">How it works:</span>{" "}
            SVD decomposes the user-movie ratings matrix <span className="font-mono text-fuchsia-400">R ≈ U·Σ·Vᵀ</span> into
            latent factors. By keeping only the top <span className="font-mono text-violet-400">k={kValue}</span> singular values,
            we capture the dominant patterns (e.g., genre preferences) and predict missing ratings.
            Click any cell below to change ratings and watch the recommendations update in real-time.
          </p>
        </div>

        {/* Section 1: Editable Ratings Table */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="h-6 w-1 rounded-full bg-gradient-to-b from-violet-500 to-fuchsia-500" />
            <h2 className="text-lg font-semibold">User Ratings Matrix</h2>
            <span className="text-xs text-gray-500 ml-2">Click a cell to edit · 0 = not rated</span>
          </div>
          <RatingsTable
            ratings={ratings}
            users={USERS}
            movies={MOVIES}
            onRatingChange={handleRatingChange}
          />
        </section>

        {/* Section 2: Recommendations Table */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="h-6 w-1 rounded-full bg-gradient-to-b from-emerald-500 to-teal-500" />
            <h2 className="text-lg font-semibold">Predicted Ratings & Recommendations</h2>
            <span className="text-xs text-gray-500 ml-2">Reconstructed from rank-{kValue} SVD</span>
          </div>
          <RecommendationsTable
            recommendations={recommendations}
            users={USERS}
            movies={MOVIES}
            originalRatings={ratings}
            predictedMatrix={svdResult.reconstructed}
          />
        </section>

        {/* Section 3: Visualizations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-6 w-1 rounded-full bg-gradient-to-b from-amber-500 to-orange-500" />
              <h2 className="text-lg font-semibold">Latent Space (2D)</h2>
              <span className="text-xs text-gray-500 ml-2">Users & Movies in SVD space</span>
            </div>
            <LatentSpaceViz
              svd={svdResult.svd}
              users={USERS}
              movies={MOVIES}
            />
          </section>

          <section>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-6 w-1 rounded-full bg-gradient-to-b from-rose-500 to-pink-500" />
              <h2 className="text-lg font-semibold">Singular Values</h2>
              <span className="text-xs text-gray-500 ml-2">Energy distribution across components</span>
            </div>
            <SingularValuesChart svd={svdResult.svd} activeK={kValue} />
          </section>
        </div>
      </main>

      <footer className="border-t border-gray-800 mt-12 py-6 text-center text-xs text-gray-600">
        SVD Movie Recommender System · Built with React & Tailwind CSS · Inspired by collaborative filtering research
      </footer>
    </div>
  );
}
