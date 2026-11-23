// Fit explorer: least-squares polynomials of rising degree over a small toy
// data set, with training and validation error, to show underfitting, a good
// fit and overfitting. x is scaled to [-1, 1] so high degrees stay stable.
import { z } from 'zod'

const nonEmpty = z.string().trim().min(1)
const point = z.object({ x: z.number(), y: z.number() })

export const paramsSchema = z.object({
  xLabel: nonEmpty,
  yLabel: nonEmpty,
  /** Plot range for x; the data must lie inside it. */
  xRange: z.tuple([z.number(), z.number()]),
  yRange: z.tuple([z.number(), z.number()]),
  /** Points the model learns from, and points it never sees. */
  train: z.array(point).min(8),
  validation: z.array(point).min(8),
  maxDegree: z.number().int().min(4).max(10),
  /** Degree the explorer starts at. */
  start: z.number().int().min(1),
})

export type FitParams = z.infer<typeof paramsSchema>
export type Point = z.infer<typeof point>

const scale = (x: number, [lo, hi]: readonly [number, number]) => (2 * (x - lo)) / (hi - lo) - 1

/** Solves A·c = b by Gaussian elimination with partial pivoting. */
function solve(a: number[][], b: number[]): number[] {
  const n = b.length
  const m = a.map((row, i) => [...row, b[i]!])
  for (let col = 0; col < n; col++) {
    let pivot = col
    for (let r = col + 1; r < n; r++) if (Math.abs(m[r]![col]!) > Math.abs(m[pivot]![col]!)) pivot = r
    ;[m[col], m[pivot]] = [m[pivot]!, m[col]!]
    for (let r = col + 1; r < n; r++) {
      const f = m[r]![col]! / m[col]![col]!
      for (let c = col; c <= n; c++) m[r]![c]! -= f * m[col]![c]!
    }
  }
  const x = Array<number>(n).fill(0)
  for (let r = n - 1; r >= 0; r--) {
    let s = m[r]![n]!
    for (let c = r + 1; c < n; c++) s -= m[r]![c]! * x[c]!
    x[r] = s / m[r]![r]!
  }
  return x
}

/** The least-squares polynomial of the given degree, as a function of x. */
export function fit(points: readonly Point[], degree: number, xRange: readonly [number, number]): (x: number) => number {
  const n = degree + 1
  const ata = Array.from({ length: n }, () => Array<number>(n).fill(0))
  const atb = Array<number>(n).fill(0)
  for (const p of points) {
    const u = scale(p.x, xRange)
    const powers = Array.from({ length: n }, (_, k) => u ** k)
    for (let i = 0; i < n; i++) {
      atb[i]! += powers[i]! * p.y
      for (let j = 0; j < n; j++) ata[i]![j]! += powers[i]! * powers[j]!
    }
  }
  const coef = solve(ata, atb)
  return (x) => {
    const u = scale(x, xRange)
    return coef.reduce((sum, c, k) => sum + c * u ** k, 0)
  }
}

/** Mean squared error of f over the points. */
export const mse = (f: (x: number) => number, points: readonly Point[]) => points.reduce((s, p) => s + (f(p.x) - p.y) ** 2, 0) / points.length

export interface DegreeResult {
  degree: number
  train: number
  validation: number
}

export function errorsByDegree(params: FitParams): DegreeResult[] {
  return Array.from({ length: params.maxDegree }, (_, i) => {
    const f = fit(params.train, i + 1, params.xRange)
    return { degree: i + 1, train: mse(f, params.train), validation: mse(f, params.validation) }
  })
}

export type Verdict = 'underfitting' | 'good' | 'overfitting'

/**
 * The degree with the lowest validation error is the good fit, and any degree
 * whose validation error is within 15% of it counts as good too. Simpler
 * models than that underfit; more complex ones overfit.
 */
export function verdict(results: readonly DegreeResult[], degree: number): Verdict {
  const best = results.reduce((a, b) => (b.validation < a.validation ? b : a))
  const current = results[degree - 1]!
  if (current.validation <= best.validation * 1.15) return 'good'
  return degree < best.degree ? 'underfitting' : 'overfitting'
}
