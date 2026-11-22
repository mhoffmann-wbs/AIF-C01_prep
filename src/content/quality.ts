// Anti-giveaway checks for the question bank (PLAN.md §4). Each check returns a
// list of human-readable problems; an empty list means the bank passes.
import type { ChoiceQuestion, Item } from './schema'

/** Share limits only apply once a pool is big enough for shares to mean anything. */
export const MIN_POOL_FOR_SHARES = 12
export const MAX_SHARE = 0.4

const LETTERS = 'ABCDEF'

type Single = Extract<ChoiceQuestion, { kind: 'single' }>

/** Every single-select question, including case-study parts. */
const singles = (items: Item[]): Single[] =>
  items.flatMap((i) => (i.kind === 'single' ? [i] : i.kind === 'case' ? i.parts.filter((p): p is Single => p.kind === 'single') : []))

export const keyLetter = (q: Single) => LETTERS[q.options.findIndex((o) => o.correct)]!

/** No answer letter may be the key of more than 40% of single-select questions. */
export function keyLetterBalance(items: Item[]): string[] {
  const pool = singles(items)
  if (pool.length < MIN_POOL_FOR_SHARES) return []
  const counts = new Map<string, number>()
  for (const q of pool) counts.set(keyLetter(q), (counts.get(keyLetter(q)) ?? 0) + 1)
  return [...counts]
    .filter(([, n]) => n / pool.length > MAX_SHARE)
    .map(([letter, n]) => `key ${letter} is correct in ${n}/${pool.length} single-select questions (max ${MAX_SHARE * 100}%)`)
}

/** The key may be the strictly longest option in at most 40% of single-select questions. */
export function keyIsLongest(items: Item[]): string[] {
  const pool = singles(items)
  if (pool.length < MIN_POOL_FOR_SHARES) return []
  const longest = pool.filter((q) => {
    const key = q.options.find((o) => o.correct)!.text.length
    return q.options.every((o) => o.correct || o.text.length < key)
  }).length
  return longest / pool.length > MAX_SHARE
    ? [`key is the longest option in ${longest}/${pool.length} single-select questions (max ${MAX_SHARE * 100}%)`]
    : []
}

const norm = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase()

/** Stems (case studies: scenarios) must be unique. */
export function duplicateStems(items: Item[]): string[] {
  const seen = new Map<string, string>()
  const problems: string[] = []
  for (const item of items) {
    const key = norm(item.kind === 'case' ? item.scenario : item.stem)
    const other = seen.get(key)
    if (other) problems.push(`${item.id} duplicates the stem of ${other}`)
    else seen.set(key, item.id)
  }
  return problems
}

const LETTER_REF = /\b([Oo]ption|[Aa]nswer|[Cc]hoice)\s+[A-F]\b|\([A-F]\)|\b[A-F]\)\s/

const explanationTexts = (item: Item): string[] => {
  const choice = (q: ChoiceQuestion) => [q.explanation, ...q.options.map((o) => o.rationale)]
  if (item.kind === 'single' || item.kind === 'multi') return choice(item)
  if (item.kind === 'case') return item.parts.flatMap(choice)
  return [item.explanation]
}

/** Explanations and rationales must not cite option letters, so options can be reordered. */
export function letterReferences(items: Item[]): string[] {
  return items.flatMap((item) => (explanationTexts(item).some((t) => LETTER_REF.test(t)) ? [`${item.id} refers to an option letter`] : []))
}

export const QUALITY_CHECKS = { keyLetterBalance, keyIsLongest, duplicateStems, letterReferences }
