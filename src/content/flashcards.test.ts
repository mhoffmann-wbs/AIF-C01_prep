// Content tests over the built-in flashcards: each file parses and belongs to
// its task, ids follow file order, and every objective has enough cards.
import { describe, expect, it } from 'vitest'
import { OBJECTIVE_BY_ID, TASKS, TASK_BY_ID } from './blueprint'
import { CARDS, CARD_FILES } from './flashcards'
import { cardFileSchema } from './schema'

/** Cards per objective: enough for a short review of each. */
const MIN_PER_OBJECTIVE = 3
/** Sides stay short enough to read at a glance. */
const MAX_WORDS = { front: 30, back: 70 }

const words = (s: string) => s.trim().split(/\s+/).length

describe('flashcards', () => {
  it.each(Object.entries(CARD_FILES))('%s.json parses and belongs to its task', (fileId, data) => {
    expect(TASK_BY_ID.has(fileId), `no task ${fileId}`).toBe(true)
    const parsed = cardFileSchema.safeParse(data)
    expect(parsed.success, parsed.error?.message).toBe(true)
    for (const [i, card] of (parsed.data ?? []).entries()) {
      expect(card.id, 'ids are numbered c01, c02, … in file order').toBe(`${fileId}-c${String(i + 1).padStart(2, '0')}`)
      expect(OBJECTIVE_BY_ID.has(card.objectiveId), `${card.id}: unknown objective ${card.objectiveId}`).toBe(true)
    }
  })

  it('keeps both sides short and never repeats a front', () => {
    const long = CARDS.filter((c) => words(c.front) > MAX_WORDS.front || words(c.back) > MAX_WORDS.back).map((c) => c.id)
    expect(long).toEqual([])
    const fronts = CARDS.map((c) => c.front.toLowerCase())
    expect(fronts.filter((f, i) => fronts.indexOf(f) !== i)).toEqual([])
  })

  it(`has at least ${MIN_PER_OBJECTIVE} cards for every objective`, () => {
    const short = TASKS.flatMap((t) => t.objectives)
      .map((o) => [o.id, CARDS.filter((c) => c.objectiveId === o.id).length] as const)
      .filter(([, n]) => n < MIN_PER_OBJECTIVE)
      .map(([id, n]) => `${id}: ${n}`)
    expect(short).toEqual([])
  })
})
