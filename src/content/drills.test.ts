// Content tests over the drill decks: each file parses and is named after its
// deck, decks name real tasks and catalog services, and card ids are unique.
import { describe, expect, it } from 'vitest'
import { seededRng } from '../quiz/random'
import { buildRound } from '../drills/round'
import { TASK_BY_ID } from './blueprint'
import { DRILL_DECKS, DRILL_FILES, SCOPE_DECK, cardIds } from './drills'
import { drillDeckSchema } from './schema'
import { SERVICE_BY_ID } from './services'

describe('drill decks', () => {
  it.each(Object.entries(DRILL_FILES))('%s.json parses and is named after its deck', (fileId, data) => {
    const parsed = drillDeckSchema.safeParse(data)
    expect(parsed.success, parsed.error?.message).toBe(true)
    expect(parsed.data?.id).toBe(fileId)
  })

  it('links decks to real tasks', () => {
    const unknown = DRILL_DECKS.flatMap((d) => d.tasks.filter((t) => !TASK_BY_ID.has(t)).map((t) => `${d.id}: ${t}`))
    expect(unknown).toEqual([])
  })

  it('uses only in-scope catalog services that have a one-liner', () => {
    const problems = DRILL_DECKS.flatMap((d) =>
      d.kind === 'which'
        ? d.cards.flatMap((c) =>
            [c.answer, ...c.distractors].filter((id) => !SERVICE_BY_ID.get(id)?.inScope || !SERVICE_BY_ID.get(id)?.oneLiner).map((id) => `${c.id}: ${id}`),
          )
        : [],
    )
    expect(problems).toEqual([])
  })

  it('has unique card ids across decks', () => {
    const ids = DRILL_DECKS.flatMap(cardIds)
    expect(ids.length).toBe(new Set(ids).size)
  })

  it('generates the scope sorter from every catalog service', () => {
    expect(SCOPE_DECK.items.filter((i) => i.bucket === 'in')).toHaveLength(51)
    expect(SCOPE_DECK.items.filter((i) => i.bucket === 'out')).toHaveLength(93)
  })
})

describe('drill rounds', () => {
  const which = DRILL_DECKS.find((d) => d.kind === 'which')!

  it('asks about distinct cards with the answer among four choices', () => {
    const round = buildRound(which, { rand: seededRng(1) })
    expect(round).toHaveLength(10)
    expect(new Set(round.map((q) => q.id)).size).toBe(10)
    for (const q of round) {
      expect(q.choices).toHaveLength(4)
      expect(q.choices).toContain(q.answer)
    }
  })

  it('balances the buckets of a lopsided sorter', () => {
    const round = buildRound(SCOPE_DECK, { rand: seededRng(2) })
    expect(round.filter((q) => q.answer === 'in')).toHaveLength(5)
    expect(round.filter((q) => q.answer === 'out')).toHaveLength(5)
  })

  it('replays exactly the missed cards', () => {
    const only = new Set(cardIds(which).slice(0, 12))
    expect(new Set(buildRound(which, { only, rand: seededRng(3) }).map((q) => q.id))).toEqual(only)
    const sortOnly = new Set(['scope-bedrock', 'scope-iam', 'scope-shield'])
    expect(new Set(buildRound(SCOPE_DECK, { only: sortOnly }).map((q) => q.id))).toEqual(sortOnly)
  })
})
