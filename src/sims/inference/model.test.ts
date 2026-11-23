import { describe, expect, it } from 'vitest'
import data from '../../content/sims/inference.json'
import { MODES, paramsSchema, recommend } from './model'

const params = paramsSchema.parse(data.params)

describe('inference mode chooser', () => {
  it('recommends each mode for its classic clue', () => {
    const base = { scope: 'request', wait: 'now', size: 'small', traffic: 'steady' } as const
    expect(recommend(base).mode).toBe('realtime')
    expect(recommend({ ...base, traffic: 'idle' }).mode).toBe('serverless')
    expect(recommend({ ...base, size: 'large' }).mode).toBe('async')
    expect(recommend({ ...base, wait: 'later' }).mode).toBe('async')
    expect(recommend({ ...base, scope: 'dataset' }).mode).toBe('batch')
  })

  it('gives every workload the answer its requirements lead to', () => {
    const wrong = params.workloads.filter((w) => recommend(w.requirements).mode !== w.answer).map((w) => w.id)
    expect(wrong).toEqual([])
  })

  it('describes each mode once and uses every mode in the workloads', () => {
    expect(params.modes.map((m) => m.id).sort()).toEqual([...MODES].sort())
    expect(new Set(params.workloads.map((w) => w.answer)).size).toBe(4)
    expect(new Set(params.workloads.map((w) => w.id)).size).toBe(params.workloads.length)
  })
})
