import { describe, expect, it } from 'vitest'
import data from '../../content/sims/ladder.json'
import { NEEDS, RUNGS, paramsSchema, recommend } from './model'

const params = paramsSchema.parse(data.params)

describe('customization ladder', () => {
  it('starts with prompting and lets the heaviest need decide', () => {
    expect(recommend([])).toBe('prompting')
    expect(recommend(['facts'])).toBe('rag')
    expect(recommend(['facts', 'behaviour'])).toBe('fine-tuning')
    expect(recommend(['behaviour', 'domain'])).toBe('continued')
    expect(recommend([...NEEDS])).toBe('pretraining')
  })

  it('gives every scenario the rung its needs lead to', () => {
    expect(params.scenarios.filter((s) => recommend(s.needs) !== s.answer).map((s) => s.id)).toEqual([])
  })

  it('lists the rungs in ladder order with rising cost, and uses each in a scenario', () => {
    expect(params.rungs.map((r) => r.id)).toEqual([...RUNGS])
    const levels = params.rungs.map((r) => r.level)
    expect(levels).toEqual([...levels].sort((a, b) => a - b))
    expect(new Set(params.scenarios.map((s) => s.answer)).size).toBe(RUNGS.length)
    expect(params.needs.map((n) => n.id)).toEqual([...NEEDS])
  })
})
