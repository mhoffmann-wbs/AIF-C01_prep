import { describe, expect, it } from 'vitest'
import data from '../../content/sims/fit.json'
import { errorsByDegree, fit, mse, paramsSchema, verdict } from './model'

const params = paramsSchema.parse(data.params)
const results = errorsByDegree(params)

describe('fit explorer', () => {
  it('fits a line exactly through points on a line', () => {
    const line = [0, 1, 2, 3].map((x) => ({ x, y: 2 * x + 1 }))
    const f = fit(line, 1, [0, 3])
    expect(f(10)).toBeCloseTo(21)
    expect(mse(f, line)).toBeCloseTo(0)
  })

  it('lowers training error with every step of complexity', () => {
    const falls = results.slice(1).map((r, i) => r.train < results[i]!.train)
    expect(falls.every(Boolean)).toBe(true)
  })

  it('has a U-shaped validation error with its lowest point at a middle degree', () => {
    const v = results.map((r) => r.validation)
    const best = v.indexOf(Math.min(...v))
    expect(best).toBeGreaterThan(0)
    expect(best).toBeLessThan(4)
    const steps = v.slice(1).map((e, i) => (i + 1 <= best ? e < v[i]! : e > v[i]!))
    expect(steps.every(Boolean)).toBe(true)
  })

  it('labels simple models underfit, the middle good and complex models overfit', () => {
    const verdicts = results.map((r) => verdict(results, r.degree))
    expect(verdicts[0]).toBe('underfitting')
    expect(verdicts).toContain('good')
    expect(verdicts.at(-1)).toBe('overfitting')
    // Verdicts run in order: underfitting, then good, then overfitting.
    const rank = { underfitting: 0, good: 1, overfitting: 2 }
    const ranks = verdicts.map((v) => rank[v])
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b))
  })

  it('keeps the data inside the plot range', () => {
    for (const p of [...params.train, ...params.validation]) {
      expect(p.x).toBeGreaterThanOrEqual(params.xRange[0])
      expect(p.x).toBeLessThanOrEqual(params.xRange[1])
      expect(p.y).toBeGreaterThanOrEqual(params.yRange[0])
      expect(p.y).toBeLessThanOrEqual(params.yRange[1])
    }
  })
})
