import { describe, expect, it } from 'vitest'
import { CASE, FIXTURES, MATCH, MULTI, ORDER, SINGLE } from '../test/fixtures'
import { itemObjectives, itemSchema, scoredCount } from './schema'

const errors = (item: unknown) => itemSchema.safeParse(item).error?.issues.map((i) => i.message) ?? []

describe('item schema', () => {
  it.each(FIXTURES.map((f) => [f.kind, f]))('accepts a valid %s item', (_, item) => {
    expect(errors(item)).toEqual([])
  })

  it('requires the id to match the task', () => {
    expect(errors({ ...SINGLE, id: '1.3-001' })).toContain('id must start with "1.2-"')
  })

  it('requires exactly one key in single items and `select` keys in multi items', () => {
    const twoKeys = { ...SINGLE, options: SINGLE.options.map((o) => ({ ...o, correct: true })) }
    expect(errors(twoKeys)).toContain('has 4 correct options, expected 1')
    expect(errors({ ...MULTI, select: 3, stem: MULTI.stem.replace('TWO', 'THREE') })).toContain('has 2 correct options, expected 3')
  })

  it('requires multi stems to say how many to select', () => {
    expect(errors({ ...MULTI, stem: 'Which services store embeddings?' })).toContain('stem must say "(Select TWO.)"')
  })

  it('checks case parts like standalone questions', () => {
    const part = { ...CASE.parts[1]!, stem: 'No count here' }
    expect(errors({ ...CASE, parts: [CASE.parts[0], part] })).toContain('stem must say "(Select TWO.)"')
  })

  it('rejects duplicate order steps and shared match responses', () => {
    expect(errors({ ...ORDER, steps: ['a', 'b', 'a'] })).toContain('has duplicate steps')
    expect(errors({ ...MATCH, distractors: ['Amazon Polly'] })[0]).toMatch(/own response/)
  })

  it('counts case parts as separate scored questions', () => {
    expect(scoredCount(CASE)).toBe(2)
    expect(scoredCount(SINGLE)).toBe(1)
    expect(itemObjectives(CASE)).toEqual(['5.1.1', '5.1.4'])
  })
})
