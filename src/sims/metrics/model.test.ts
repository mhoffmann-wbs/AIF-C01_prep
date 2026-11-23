import { describe, expect, it } from 'vitest'
import data from '../../content/sims/metrics.json'
import { businessCost, confusion, metrics, paramsSchema } from './model'

const params = paramsSchema.parse(data.params)

describe('metrics lab', () => {
  it('reproduces the worked example in lesson 1.3 at the starting threshold', () => {
    const cm = confusion(params.bands, params.threshold)
    expect(cm).toEqual({ tp: 40, fp: 20, fn: 10, tn: 930 })
    const m = metrics(cm)
    expect(m.accuracy).toBeCloseTo(0.97)
    expect(m.precision).toBeCloseTo(2 / 3)
    expect(m.recall).toBeCloseTo(0.8)
    expect(m.f1).toBeCloseTo(0.727, 3)
  })

  it('shows the accuracy trap: never flagging scores 95% accuracy and 0% recall', () => {
    const m = metrics(confusion(params.bands, 1.01))
    expect(m.accuracy).toBeCloseTo(0.95)
    expect(m.recall).toBe(0)
    expect(m.precision).toBeNaN()
  })

  it('trades precision for recall as the threshold falls', () => {
    const high = metrics(confusion(params.bands, 0.8))
    const low = metrics(confusion(params.bands, 0.2))
    expect(low.recall).toBeGreaterThan(high.recall)
    expect(low.precision).toBeLessThan(high.precision)
    expect(metrics(confusion(params.bands, 0)).recall).toBe(1)
  })

  it('prices missed fraud and false alarms', () => {
    expect(businessCost({ tp: 0, fp: 3, fn: 2, tn: 0 }, { missedFraud: 100, falseAlarm: 10 })).toBe(230)
  })
})
