// Minimal SVD via power iteration with deflation
// Safe for small matrices used in this demo

export interface SVDResult {
  U: number[][];  // m × k
  S: number[];    // k singular values
  Vt: number[][]; // k × n
}

function transpose(A: number[][]): number[][] {
  if (A.length === 0) return [];
  const m = A.length;
  const n = A[0].length;
  const T: number[][] = [];
  for (let j = 0; j < n; j++) {
    const row: number[] = [];
    for (let i = 0; i < m; i++) {
      row.push(A[i][j]);
    }
    T.push(row);
  }
  return T;
}

function matMul(A: number[][], B: number[][]): number[][] {
  const m = A.length;
  const p = B.length;
  const n = B[0]?.length ?? 0;
  const C: number[][] = [];
  for (let i = 0; i < m; i++) {
    const row: number[] = [];
    for (let j = 0; j < n; j++) {
      let sum = 0;
      for (let k = 0; k < p; k++) {
        sum += A[i][k] * B[k][j];
      }
      row.push(sum);
    }
    C.push(row);
  }
  return C;
}

function matVecMul(A: number[][], v: number[]): number[] {
  const result: number[] = [];
  for (let i = 0; i < A.length; i++) {
    let s = 0;
    for (let j = 0; j < v.length; j++) {
      s += A[i][j] * v[j];
    }
    result.push(s);
  }
  return result;
}

function vecNorm(v: number[]): number {
  let s = 0;
  for (const x of v) s += x * x;
  return Math.sqrt(s);
}

// Seeded pseudo-random for deterministic results
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function powerIteration(
  A: number[][],
  maxIter = 300
): { u: number[]; sigma: number; v: number[] } {
  const m = A.length;
  const n = A[0].length;
  const At = transpose(A);
  const AtA = matMul(At, A);

  const rand = seededRandom(42 + m * 7 + n * 13);
  let v: number[] = [];
  for (let i = 0; i < n; i++) v.push(rand() - 0.5);
  let norm = vecNorm(v);
  if (norm < 1e-15) {
    v = v.map((_, i) => (i === 0 ? 1 : 0));
    norm = 1;
  }
  v = v.map((x) => x / norm);

  for (let iter = 0; iter < maxIter; iter++) {
    const vNew = matVecMul(AtA, v);
    norm = vecNorm(vNew);
    if (norm < 1e-14) break;
    v = vNew.map((x) => x / norm);
  }

  let u = matVecMul(A, v);
  const sigma = vecNorm(u);
  if (sigma > 1e-14) {
    u = u.map((x) => x / sigma);
  } else {
    u = new Array(m).fill(0);
  }

  return { u, sigma, v };
}

export function computeSVD(matrix: number[][]): SVDResult {
  const m = matrix.length;
  const n = matrix[0]?.length ?? 0;
  if (m === 0 || n === 0) {
    return { U: [], S: [], Vt: [] };
  }

  const maxRank = Math.min(m, n);
  const Us: number[][] = []; // each is length m
  const Ss: number[] = [];
  const Vs: number[][] = []; // each is length n

  let residual = matrix.map((row) => [...row]);

  for (let i = 0; i < maxRank; i++) {
    const { u, sigma, v } = powerIteration(residual);
    if (sigma < 1e-10) break;
    Us.push(u);
    Ss.push(sigma);
    Vs.push(v);
    // Deflate: residual -= sigma * u * v^T
    for (let ri = 0; ri < m; ri++) {
      for (let rj = 0; rj < n; rj++) {
        residual[ri][rj] -= sigma * u[ri] * v[rj];
      }
    }
  }

  // Build U matrix: m × k (columns are u vectors)
  const k = Ss.length;
  const Umat: number[][] = [];
  for (let i = 0; i < m; i++) {
    const row: number[] = [];
    for (let j = 0; j < k; j++) {
      row.push(Us[j][i]);
    }
    Umat.push(row);
  }

  // Vt: k × n (rows are v vectors)
  const Vtmat = Vs.map((v) => [...v]);

  return { U: Umat, S: Ss, Vt: Vtmat };
}

export function reconstructMatrix(
  svd: SVDResult,
  k?: number
): number[][] {
  const { U, S, Vt } = svd;
  if (S.length === 0 || U.length === 0 || Vt.length === 0) {
    // Return zero matrix matching U dimensions
    const m = U.length || 0;
    return Array.from({ length: m }, () => []);
  }

  const rank = Math.min(k ?? S.length, S.length);
  const m = U.length;
  const n = Vt[0].length;
  const result: number[][] = [];

  for (let i = 0; i < m; i++) {
    const row: number[] = [];
    for (let j = 0; j < n; j++) {
      let val = 0;
      for (let r = 0; r < rank; r++) {
        val += U[i][r] * S[r] * Vt[r][j];
      }
      row.push(val);
    }
    result.push(row);
  }
  return result;
}
