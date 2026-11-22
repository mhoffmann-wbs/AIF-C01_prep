import { describe, expect, it } from 'vitest'
import { CASE, SINGLE } from '../test/fixtures'
import { duplicateStems, keyIsLongest, keyLetterBalance, letterReferences } from './quality'

type Single = typeof SINGLE

// n single items whose key sits at `keyAt`, with distinct stems.
const pool = (n: number, keyAt: (i: number) => number, keyText = 'k'): Single[] =>
  Array.from({ length: n }, (_, i) => ({
    ...SINGLE,
    id: `1.2-${String(i).padStart(3, '0')}`,
    stem: `Question ${i}?`,
    options: [0, 1, 2, 3].map((j) => ({ text: j === keyAt(i) ? keyText : `opt${j}`, correct: j === keyAt(i), rationale: 'r' })),
  }))

describe('quality checks', () => {
  it('flags a key letter used in more than 40% of single-select questions', () => {
    expect(keyLetterBalance(pool(12, () => 0))).toHaveLength(1)
    expect(keyLetterBalance(pool(12, (i) => i % 4))).toEqual([])
    expect(keyLetterBalance(pool(5, () => 0))).toEqual([]) // pool too small to judge
  })

  it('flags keys that are usually the longest option', () => {
    expect(keyIsLongest(pool(12, (i) => i % 4, 'a much longer key'))).toHaveLength(1)
    expect(keyIsLongest(pool(12, (i) => i % 4, 'k'))).toEqual([])
  })

  it('flags duplicate stems and duplicate case scenarios', () => {
    expect(duplicateStems([SINGLE, { ...SINGLE, id: '1.2-002' }])).toEqual(['1.2-002 duplicates the stem of 1.2-001'])
    expect(duplicateStems([CASE, { ...CASE, id: '5.1-002' }])).toHaveLength(1)
  })

  it('flags explanations and rationales that cite option letters, in case parts too', () => {
    for (const explanation of ['Option B is right.', 'So (C) wins.', 'The answer A is a trap.'])
      expect(letterReferences([{ ...SINGLE, explanation }])).toHaveLength(1)
    const part = { ...CASE.parts[0]!, explanation: 'Choice D is wrong.' }
    expect(letterReferences([{ ...CASE, parts: [part, CASE.parts[1]!] }])).toHaveLength(1)
    expect(letterReferences([SINGLE])).toEqual([])
  })
})
