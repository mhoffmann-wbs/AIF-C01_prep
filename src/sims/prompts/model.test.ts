import { describe, expect, it } from 'vitest'
import data from '../../content/sims/prompts.json'
import { attackOutcome, correctParts, paramsSchema } from './model'

const params = paramsSchema.parse(data.params)

describe('prompt technique compare', () => {
  it('uses every part type exactly once in the prompt', () => {
    expect(params.parts.segments.map((s) => s.type).sort()).toEqual(params.parts.types.map((t) => t.id).sort())
  })

  it('scores labels per segment', () => {
    const right = params.parts.segments.map((s) => s.type)
    expect(correctParts(params.parts.segments, right)).toHaveLength(params.parts.segments.length)
    expect(correctParts(params.parts.segments, [right[1], right[0]])).toEqual([])
  })

  it('pairs a weak technique with a better one in every task', () => {
    for (const t of params.tasks) {
      expect(t.techniques.some((x) => x.good)).toBe(true)
      expect(t.techniques.some((x) => !x.good)).toBe(true)
    }
  })

  it('blocks what the prompt attack filter catches, only when it is on', () => {
    const hijack = params.attacks.find((a) => a.id === 'hijacking')!
    expect(attackOutcome(hijack, false, params.blockedMessage)).toEqual({ blocked: false, reply: hijack.undefended })
    expect(attackOutcome(hijack, true, params.blockedMessage)).toEqual({ blocked: true, reply: params.blockedMessage })
    const caught = params.attacks.filter((a) => attackOutcome(a, true, params.blockedMessage).blocked).map((a) => a.id)
    expect(caught.sort()).toEqual(['exposure', 'hijacking', 'jailbreaking'])
  })
})
