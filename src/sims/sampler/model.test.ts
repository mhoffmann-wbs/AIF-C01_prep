import { describe, expect, it } from 'vitest'
import { seededRng } from '../../quiz/random'
import { reshape, sample } from './model'

const TOKENS = [
  { text: 'a', p: 0.5 },
  { text: 'b', p: 0.3 },
  { text: 'c', p: 0.15 },
  { text: 'd', p: 0.05 },
]
const ALL = { temperature: 1, topK: TOKENS.length, topP: 1 }
const sum = (xs: { p: number }[]) => xs.reduce((s, x) => s + x.p, 0)

describe('next-token sampler', () => {
  it('leaves the distribution alone at temperature 1 with no cut-off', () => {
    expect(reshape(TOKENS, ALL).map((s) => s.p)).toEqual(TOKENS.map((t) => expect.closeTo(t.p, 9)))
  })

  it('always picks the top token at temperature 0', () => {
    const shaped = reshape(TOKENS, { ...ALL, temperature: 0 })
    expect(shaped.map((s) => s.p)).toEqual([1, 0, 0, 0])
    expect(sample(shaped, seededRng(3))).toBe(0)
  })

  it('sharpens below 1 and flattens above 1', () => {
    const low = reshape(TOKENS, { ...ALL, temperature: 0.5 })
    const high = reshape(TOKENS, { ...ALL, temperature: 2 })
    expect(low[0]!.p).toBeGreaterThan(0.5)
    expect(high[0]!.p).toBeLessThan(0.5)
    expect(high[3]!.p).toBeGreaterThan(0.05)
  })

  it('keeps only the K most likely tokens with top K', () => {
    const shaped = reshape(TOKENS, { ...ALL, topK: 2 })
    expect(shaped.map((s) => s.kept)).toEqual([true, true, false, false])
    expect(sum(shaped)).toBeCloseTo(1)
    expect(shaped[0]!.p).toBeCloseTo(0.625)
  })

  it('keeps the smallest set of tokens that reaches P with top P', () => {
    expect(reshape(TOKENS, { ...ALL, topP: 0.8 }).map((s) => s.kept)).toEqual([true, true, false, false])
    expect(reshape(TOKENS, { ...ALL, topP: 0.81 }).map((s) => s.kept)).toEqual([true, true, true, false])
    expect(reshape(TOKENS, { ...ALL, topP: 0.1 }).map((s) => s.kept)).toEqual([true, false, false, false])
  })

  it('samples only kept tokens, roughly in proportion', () => {
    const shaped = reshape(TOKENS, { ...ALL, topK: 3 })
    const rng = seededRng(42)
    const counts = [0, 0, 0, 0]
    for (let i = 0; i < 4000; i++) counts[sample(shaped, rng)]!++
    expect(counts[3]).toBe(0)
    expect(counts[0]! / 4000).toBeCloseTo(shaped[0]!.p, 1)
  })
})
