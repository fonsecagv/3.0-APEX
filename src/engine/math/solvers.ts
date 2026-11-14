// Deterministic Numerical Solvers for M05, M07, M10, M12

export function matMul(A: number[][], B: number[][]): number[][] {
  const rows = A.length;
  const cols = B[0].length;
  const inner = B.length;
  const out: number[][] = Array.from({ length: rows }, () => new Array(cols).fill(0));
  for (let i = 0; i < rows; i++) {
    for (let k = 0; k < inner; k++) {
      const aik = A[i][k];
      for (let j = 0; j < cols; j++) {
        out[i][j] += aik * B[k][j];
      }
    }
  }
  return out;
}

export function matVec(A: number[][], v: number[]): number[] {
  return A.map((row) => row.reduce((acc, val, j) => acc + val * v[j], 0));
}

export function transpose(A: number[][]): number[][] {
  const rows = A.length;
  const cols = A[0].length;
  const out: number[][] = Array.from({ length: cols }, () => new Array(rows).fill(0));
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      out[j][i] = A[i][j];
    }
  }
  return out;
}

/**
 * Solve linear system A * x = b via Gaussian elimination with partial pivoting.
 */
export function solveLinearSystem(A: number[][], b: number[]): number[] | null {
  const n = A.length;
  const M = A.map((row, i) => [...row, b[i]]);

  for (let col = 0; col < n; col++) {
    let pivotRow = col;
    let maxVal = Math.abs(M[col][col]);
    for (let r = col + 1; r < n; r++) {
      const val = Math.abs(M[r][col]);
      if (val > maxVal) {
        maxVal = val;
        pivotRow = r;
      }
    }
    if (maxVal < 1e-14) return null; // Singular or near-singular

    if (pivotRow !== col) {
      const tmp = M[col];
      M[col] = M[pivotRow];
      M[pivotRow] = tmp;
    }

    const pivot = M[col][col];
    for (let r = col + 1; r < n; r++) {
      const factor = M[r][col] / pivot;
      for (let c = col; c <= n; c++) {
        M[r][c] -= factor * M[col][c];
      }
    }
  }

  const x = new Array(n).fill(0);
  for (let r = n - 1; r >= 0; r--) {
    let sum = M[r][n];
    for (let c = r + 1; c < n; c++) {
      sum -= M[r][c] * x[c];
    }
    x[r] = sum / M[r][r];
  }
  return x;
}

/**
 * Symmetric Jacobi Eigenvalue solver for small matrices (e.g. 3x3 / 6x6 buckling or J^T*J).
 */
export function symmetricEigenvalues(AInput: number[][], maxSweeps = 60): number[] {
  const n = AInput.length;
  const A = AInput.map((row) => [...row]);

  for (let sweep = 0; sweep < maxSweeps; sweep++) {
    let maxOff = 0;
    let p = 0;
    let q = 1;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const val = Math.abs(A[i][j]);
        if (val > maxOff) {
          maxOff = val;
          p = i;
          q = j;
        }
      }
    }
    if (maxOff < 1e-12) break;

    const app = A[p][p];
    const aqq = A[q][q];
    const apq = A[p][q];
    const tau = (aqq - app) / (2 * apq);
    const t = tau >= 0 ? 1 / (tau + Math.sqrt(1 + tau * tau)) : -1 / (-tau + Math.sqrt(1 + tau * tau));
    const c = 1 / Math.sqrt(1 + t * t);
    const s = t * c;

    A[p][p] = app - t * apq;
    A[q][q] = aqq + t * apq;
    A[p][q] = 0;
    A[q][p] = 0;

    for (let k = 0; k < n; k++) {
      if (k !== p && k !== q) {
        const akp = A[k][p];
        const akq = A[k][q];
        A[k][p] = c * akp - s * akq;
        A[p][k] = A[k][p];
        A[k][q] = s * akp + c * akq;
        A[q][k] = A[k][q];
      }
    }
  }

  return A.map((row, i) => row[i]).sort((a, b) => a - b);
}

/**
 * Seeded Mulberry32 PRNG for reproducible Monte Carlo UQ (M12) and strategy uncertainty (M11).
 */
export function createSeededRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function sampleNormal(rng: () => number, mean = 0, std = 1): number {
  const u1 = Math.max(1e-12, rng());
  const u2 = rng();
  const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return mean + z * std;
}

/**
 * Finite-difference Jacobian J_ij = dy_i / dp_j
 */
export function computeFiniteDiffJacobian(
  fn: (params: number[]) => number[],
  params: number[],
  relStep = 1e-4
): number[][] {
  const y0 = fn(params);
  const m = y0.length;
  const k = params.length;
  const J: number[][] = Array.from({ length: m }, () => new Array(k).fill(0));

  for (let j = 0; j < k; j++) {
    const h = Math.max(1e-6, Math.abs(params[j]) * relStep);
    const pPlus = [...params];
    pPlus[j] += h;
    const yPlus = fn(pPlus);
    for (let i = 0; i < m; i++) {
      J[i][j] = (yPlus[i] - y0[i]) / h;
    }
  }
  return J;
}

/**
 * Levenberg-Marquardt nonlinear least-squares calibration solver (M12).
 * Minimizes sum((y_model(p) - y_obs)^2 / sigma^2) + lambda_reg * ||p - p_prior||^2
 */
export interface LevenbergMarquardtResult {
  params: number[];
  rmse: number;
  mae: number;
  iterations: number;
  converged: boolean;
  residualHistory: number[];
}

export function levenbergMarquardt(
  modelFn: (p: number[]) => number[],
  yObserved: number[],
  initialParams: number[],
  bounds: Array<{ min: number; max: number }>,
  options: {
    weights?: number[];
    maxIterations?: number;
    tol?: number;
    regLambda?: number;
    priorParams?: number[];
  } = {}
): LevenbergMarquardtResult {
  const maxIterations = options.maxIterations ?? 40;
  const tol = options.tol ?? 1e-6;
  const weights = options.weights ?? yObserved.map(() => 1.0);
  const regLambda = options.regLambda ?? 0;
  const prior = options.priorParams ?? initialParams;

  const clampParams = (p: number[]) =>
    p.map((v, idx) => Math.max(bounds[idx].min, Math.min(bounds[idx].max, v)));

  let p = clampParams([...initialParams]);
  let lambda = 1e-2;
  const residualHistory: number[] = [];

  const calcResiduals = (params: number[]) => {
    const yPred = modelFn(params);
    return yPred.map((yp, i) => (yp - yObserved[i]) * weights[i]);
  };

  const calcCost = (r: number[], params: number[]) => {
    const dataCost = r.reduce((acc, ri) => acc + ri * ri, 0);
    const regCost = regLambda * params.reduce((acc, pi, idx) => acc + (pi - prior[idx]) ** 2, 0);
    return dataCost + regCost;
  };

  let r = calcResiduals(p);
  let cost = calcCost(r, p);
  residualHistory.push(Math.sqrt(r.reduce((a, x) => a + x * x, 0) / r.length));

  let converged = false;
  let iter = 0;

  for (iter = 1; iter <= maxIterations; iter++) {
    const J = computeFiniteDiffJacobian(
      (params) => calcResiduals(params),
      p
    );
    const JT = transpose(J);
    const JTJ = matMul(JT, J);
    const JTr = matVec(JT, r);

    const n = p.length;
    const A = JTJ.map((row, i) =>
      row.map((val, j) => (i === j ? val + lambda * (val + 1e-6) + regLambda : val))
    );
    const rhs = JTr.map((val, i) => -(val + regLambda * (p[i] - prior[i])));

    const step = solveLinearSystem(A, rhs);
    if (!step) {
      lambda *= 10;
      continue;
    }

    const pCandidate = clampParams(p.map((v, i) => v + step[i]));
    const rCandidate = calcResiduals(pCandidate);
    const costCandidate = calcCost(rCandidate, pCandidate);

    if (costCandidate < cost) {
      const relImpr = Math.abs(cost - costCandidate) / Math.max(1e-12, cost);
      p = pCandidate;
      r = rCandidate;
      cost = costCandidate;
      lambda = Math.max(1e-7, lambda * 0.3);
      residualHistory.push(Math.sqrt(r.reduce((a, x) => a + x * x, 0) / r.length));
      if (relImpr < tol) {
        converged = true;
        break;
      }
    } else {
      lambda *= 5;
      if (lambda > 1e8) break;
    }
  }

  const yFinal = modelFn(p);
  const rawErrors = yFinal.map((yp, i) => yp - yObserved[i]);
  const rmse = Math.sqrt(rawErrors.reduce((a, e) => a + e * e, 0) / rawErrors.length);
  const mae = rawErrors.reduce((a, e) => a + Math.abs(e), 0) / rawErrors.length;

  return {
    params: p,
    rmse,
    mae,
    iterations: iter,
    converged,
    residualHistory,
  };
}

/**
 * Nelder-Mead derivative-free simplex optimizer (M12).
 */
export function nelderMead(
  objectiveFn: (p: number[]) => number,
  initialParams: number[],
  bounds: Array<{ min: number; max: number }>,
  maxIterations = 120,
  tol = 1e-6
): { params: number[]; objectiveValue: number; iterations: number; converged: boolean } {
  const n = initialParams.length;
  const clamp = (p: number[]) =>
    p.map((v, i) => Math.max(bounds[i].min, Math.min(bounds[i].max, v)));

  const simplex: Array<{ p: number[]; val: number }> = [];
  const p0 = clamp(initialParams);
  simplex.push({ p: p0, val: objectiveFn(p0) });

  for (let i = 0; i < n; i++) {
    const pi = [...p0];
    const span = bounds[i].max - bounds[i].min;
    pi[i] += Math.max(1e-4, Math.abs(p0[i]) * 0.08, span * 0.05);
    const clamped = clamp(pi);
    simplex.push({ p: clamped, val: objectiveFn(clamped) });
  }

  let iter = 0;
  let converged = false;

  for (iter = 1; iter <= maxIterations; iter++) {
    simplex.sort((a, b) => a.val - b.val);
    if (Math.abs(simplex[n].val - simplex[0].val) < tol) {
      converged = true;
      break;
    }

    // Centroid of best n points
    const centroid = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) centroid[j] += simplex[i].p[j] / n;
    }

    const worst = simplex[n];
    const reflectedP = clamp(centroid.map((c, j) => c + 1.0 * (c - worst.p[j])));
    const reflectedVal = objectiveFn(reflectedP);

    if (reflectedVal >= simplex[0].val && reflectedVal < simplex[n - 1].val) {
      simplex[n] = { p: reflectedP, val: reflectedVal };
    } else if (reflectedVal < simplex[0].val) {
      const expandedP = clamp(centroid.map((c, j) => c + 2.0 * (reflectedP[j] - c)));
      const expandedVal = objectiveFn(expandedP);
      simplex[n] = expandedVal < reflectedVal ? { p: expandedP, val: expandedVal } : { p: reflectedP, val: reflectedVal };
    } else {
      const contractedP = clamp(centroid.map((c, j) => c + 0.5 * (worst.p[j] - c)));
      const contractedVal = objectiveFn(contractedP);
      if (contractedVal < worst.val) {
        simplex[n] = { p: contractedP, val: contractedVal };
      } else {
        for (let i = 1; i <= n; i++) {
          const shrunk = clamp(simplex[0].p.map((b, j) => b + 0.5 * (simplex[i].p[j] - b)));
          simplex[i] = { p: shrunk, val: objectiveFn(shrunk) };
        }
      }
    }
  }

  simplex.sort((a, b) => a.val - b.val);
  return {
    params: simplex[0].p,
    objectiveValue: simplex[0].val,
    iterations: iter,
    converged,
  };
}
