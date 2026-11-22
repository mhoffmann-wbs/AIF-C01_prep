// Builds practice sets and mock exams from the question bank. Mock sizes count
// scored questions, so a case study with three parts fills three slots.
import { DOMAINS, MOCK, allocateItems, largestRemainder, tasksOf } from '../content/blueprint'
import { type Item, isExtended, scoredCount } from '../content/schema'
import { type Rng, shuffle } from './random'

/** Scored questions from ordering, matching and case items in a mock with the extended kinds on. */
export const MOCK_EXTENDED_QUESTIONS = 8

export interface MockExam {
  /** Ordering, matching and case-study items were included. */
  extended: boolean
  items: Item[]
  /** Scored questions (case parts count one each). */
  questions: number
  minutes: number
  /** How many scored questions short of the full length the bank currently is. */
  shortfall: number
}

const questionsIn = (items: readonly Item[]) => items.reduce((n, i) => n + scoredCount(i), 0)

/** Unseen items first, each group in random order. */
const freshFirst = (items: readonly Item[], seen: ReadonlySet<string>, rng: Rng) => {
  const shuffled = shuffle(items, rng)
  return [...shuffled.filter((i) => !seen.has(i.id)), ...shuffled.filter((i) => seen.has(i.id))]
}

/**
 * Picks items worth up to `count` scored questions from `pool`, taking them in
 * turn from each of `taskIds` and preferring items the learner hasn't seen.
 */
function spread(pool: readonly Item[], taskIds: readonly string[], count: number, seen: ReadonlySet<string>, rng: Rng): Item[] {
  const queues = new Map(taskIds.map((id) => [id, freshFirst(pool.filter((i) => i.taskId === id), seen, rng)]))
  const picked: Item[] = []
  let filled = 0
  const order = shuffle(taskIds, rng)
  while (filled < count) {
    const before = filled
    for (const id of order) {
      const queue = queues.get(id)!
      const at = queue.findIndex((i) => filled + scoredCount(i) <= count)
      if (at < 0) continue
      const [next] = queue.splice(at, 1)
      picked.push(next!)
      filled += scoredCount(next!)
      if (filled >= count) break
    }
    if (filled === before) break
  }
  return picked
}

/**
 * Builds a mock exam: each domain gets its blueprint share of the 65 questions
 * (13 · 16 · 18 · 9 · 9). With `extended`, about 8 of them come from ordering,
 * matching and at most one case study, spread over the domains by the same
 * weights. When the bank is short, the time limit is scaled to the real pace.
 */
export function buildMockExam(bank: readonly Item[], extended: boolean, seen: ReadonlySet<string> = new Set(), rng: Rng = Math.random): MockExam {
  const quota = allocateItems(MOCK.items)
  const extendedQuota = new Map(DOMAINS.map((d) => [d.id, 0]))
  const picked: Item[] = []
  const domainOf = (i: Item) => i.taskId.split('.')[0]!

  if (extended) {
    let left = MOCK_EXTENDED_QUESTIONS
    const caseItem = freshFirst(
      bank.filter((i) => i.kind === 'case'),
      seen,
      rng,
    )[0]
    if (caseItem && scoredCount(caseItem) <= left) {
      picked.push(caseItem)
      left -= scoredCount(caseItem)
      quota.set(domainOf(caseItem), quota.get(domainOf(caseItem))! - scoredCount(caseItem))
    }
    const split = largestRemainder(
      left,
      DOMAINS.map((d) => d.weight),
    )
    DOMAINS.forEach((d, n) => extendedQuota.set(d.id, Math.min(split[n]!, quota.get(d.id)!)))
  }

  for (const d of DOMAINS) {
    const taskIds = tasksOf(d.id).map((t) => t.id)
    const inDomain = bank.filter((i) => domainOf(i) === d.id)
    const ext = spread(
      inDomain.filter((i) => i.kind === 'order' || i.kind === 'match'),
      taskIds,
      extendedQuota.get(d.id)!,
      seen,
      rng,
    )
    // Core questions fill the rest, including any extended slots the bank couldn't fill.
    const core = spread(
      inDomain.filter((i) => !isExtended(i)),
      taskIds,
      quota.get(d.id)! - questionsIn(ext),
      seen,
      rng,
    )
    picked.push(...ext, ...core)
  }

  const items = shuffle(picked, rng)
  const questions = questionsIn(items)
  return {
    extended,
    items,
    questions,
    minutes: Math.max(1, Math.round((MOCK.minutes * questions) / MOCK.items)),
    shortfall: MOCK.items - questions,
  }
}

/**
 * Draws an untimed mixed practice set. It samples without replacement, with each
 * task's chance proportional to its blueprint weight (not its pool size), so
 * short sets match the blueprint on average and every task shows up over a few
 * sessions.
 */
export function buildMixedSet(pool: readonly Item[], weights: ReadonlyMap<string, number>, size: number, rng: Rng = Math.random): Item[] {
  const poolSize = new Map<string, number>()
  for (const i of pool) poolSize.set(i.taskId, (poolSize.get(i.taskId) ?? 0) + 1)
  // Efraimidis–Spirakis: key = u^(1/w); the largest keys form a weighted sample.
  const keyed = pool.map((item) => {
    const w = (weights.get(item.taskId) ?? 0) / (poolSize.get(item.taskId) ?? 1)
    return { item, key: w > 0 ? Math.pow(rng(), 1 / w) : -1 }
  })
  keyed.sort((a, b) => b.key - a.key)
  return shuffle(
    keyed.slice(0, size).map((k) => k.item),
    rng,
  )
}

/**
 * A "least mastered" mixed set: per-task counts come from the same weighted
 * draw as `buildMixedSet`; within each task, the items with the lowest
 * correct-answer streak are chosen (never answered counts as 0).
 */
export function buildFocusSet(
  pool: readonly Item[],
  weights: ReadonlyMap<string, number>,
  size: number,
  streakOf: (itemId: string) => number,
  rng: Rng = Math.random,
): Item[] {
  const perTask = new Map<string, number>()
  for (const i of buildMixedSet(pool, weights, size, rng)) perTask.set(i.taskId, (perTask.get(i.taskId) ?? 0) + 1)
  const picked = [...perTask].flatMap(([id, count]) =>
    orderLeastMastered(
      pool.filter((i) => i.taskId === id),
      streakOf,
      rng,
    ).slice(0, count),
  )
  return shuffle(picked, rng)
}

/** Orders a whole pool lowest streak first, in random order within each streak. */
export function orderLeastMastered(pool: readonly Item[], streakOf: (itemId: string) => number, rng: Rng = Math.random): Item[] {
  // Array.prototype.sort is stable, so the shuffle survives within each streak.
  return shuffle(pool, rng).sort((a, b) => streakOf(a.id) - streakOf(b.id))
}
