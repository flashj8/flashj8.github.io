// Minimal SVD implementation using power iteration / Jacobi-like approach
// For small matrices suitable for this demo

export interface SVDResult {
  U: number[][];
  S: number[];
  Vt: number[][];
}

function matMul(A: number[][], B: number[][]): number[][] {
  const m = A.length;
  const n = B[0].length;
  const p = B.length;
  const C: number[][] = Array.from({ length: m }, () => new Array(n).fill(0));
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      let sum = 0;
      for (let k = 0; k < p; k++) {
        sum += A[i][k] * B[k][j];
      }
      C[i][j] = sum;
    }
  }
  return C;
}

function transpose(A: number[][]): number[][] {
  const m = A.length;
  const n = A[0].length;
  const T: number[][] = Array.from({ length: n }, () => new Array(m).fill(0));
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      T[j][i] = A[i][j];
    }
  }
  return T;
}

function vecNorm(v: number[]): number {
  let s = 0;
  for (const x of v) s += x * x;
  return Math.sqrt(s);
}

function matVecMul(A: number[][], v: number[]): number[] {
  const m = A.length;
  const result = new Array(m).fill(0);
  for (let i = 0; i < m; i++) {
    let s = 0;
    for (let j = 0; j < v.length; j++) {
      s += A[i][j] * v[j];
    }
    result[i] = s;
  }
  return result;
}

function outerProduct(u: number[], v: number[]): number[][] {
  const m = u.length;
  const n = v.length;
  const result: number[][] = Array.from({ length: m }, () => new Array(n).fill(0));
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      result[i][j] = u[i] * v[j];
    }
  }
  return result;
}

function subtractMat(A: number[][], B: number[][]): number[][] {
  const m = A.length;
  const n = A[0].length;
  const C: number[][] = Array.from({ length: m }, () => new Array(n).fill(0));
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      C[i][j] = A[i][j] - B[i][j];
    }
  }
  return C;
}

function scaleMat(A: number[][], s: number): number[][] {
  return A.map(row => row.map(v => v * s));
}

// Power iteration to find dominant singular triplet
function powerIteration(A: number[][], maxIter = 200): { u: number[]; sigma: number; v: number[] } {
  const m = A.length;
  const n = A[0].length;
  const At = transpose(A);
  const AtA = matMul(At, A);

  // Random initial vector
  let v = new Array(n).fill(0).map(() => Math.random() - 0.5);
  let norm = vecNorm(v);
  v = v.map(x => x / norm);

  for (let iter = 0; iter < maxIter; iter++) {
    const vNew = matVecMul(AtA, v);
    norm = vecNorm(vNew);
    if (norm < 1e-12) break;
    v = vNew.map(x => x / norm);
  }

  // u = Av / sigma
  let u = matVecMul(A, v);
  const sigma = vecNorm(u);
  if (sigma > 1e-12) {
    u = u.map(x => x / sigma);
  } else {
    u = new Array(m).fill(0);
  }

  return { u, sigma, v };
}

export function computeSVD(matrix: number[][], k?: number): SVDResult {
  const m = matrix.length;
  const n = matrix[0].length;
  const rank = k ?? Math.min(m, n);

  const U: number[][] = [];
  const S: number[] = [];
  const V: number[][] = [];

  let residual = matrix.map(row => [...row]);

  for (let i = 0; i < rank; i++) {
    const { u, sigma, v } = powerIteration(residual);
    if (sigma < 1e-10) break;
    U.push(u);
    S.push(sigma);
    V.push(v);
    // Deflate
    const outer = outerProduct(u, v);
    residual = subtractMat(residual, scaleMat(outer, sigma));
  }

  // U is stored as rows, transpose to columns
  const Ucols: number[][] = Array.from({ length: m }, () => new Array(U.length).fill(0));
  for (let i = 0; i < U.length; i++) {
    for (let j = 0; j < m; j++) {
      Ucols[j][i] = U[i][j];
    }
  }

  // Vt
  const Vt = V.map(row => [...row]);

  return { U: Ucols, S, Vt };
}

export function reconstructMatrix(svd: SVDResult, k?: number): number[][] {
  const { U, S, Vt } = svd;
  const rank = k ?? S.length;
  const m = U.length;
  const n = Vt[0].length;
  const result: number[][] = Array.from({ length: m }, () => new Array(n).fill(0));

  for (let r = 0; r < rank && r < S.length; r++) {
    for (let i = 0; i < m; i++) {
      for (let j = 0; j < n; j++) {
        result[i][j] += U[i][r] * S[r] * Vt[r][j];
      }
    }
  }
  return result;
}

export { transpose, matMul };
