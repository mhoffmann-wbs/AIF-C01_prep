// Learner responses and all-or-nothing grading for every item kind. A case
// study is graded per part: each part is one scored question, as on the exam.
import type { ChoiceQuestion, Item } from '../content/schema'

export type ChoiceResponse = { kind: 'single'; choice: number | null } | { kind: 'multi'; choices: number[] }

export type Response =
  | ChoiceResponse
  /** Indexes into item.steps, in the order the learner arranged them. */
  | { kind: 'order'; order: number[] }
  /** The response picked for each prompt, by prompt index ('' = none yet). */
  | { kind: 'match'; picks: string[] }
  | { kind: 'case'; parts: ChoiceResponse[] }

const emptyChoice = (q: ChoiceQuestion): ChoiceResponse => (q.kind === 'single' ? { kind: 'single', choice: null } : { kind: 'multi', choices: [] })

export function emptyResponse(item: Item, shuffledOrder?: number[]): Response {
  switch (item.kind) {
    case 'single':
    case 'multi':
      return emptyChoice(item)
    case 'order':
      return { kind: 'order', order: shuffledOrder ?? item.steps.map((_, i) => i) }
    case 'match':
      return { kind: 'match', picks: item.pairs.map(() => '') }
    case 'case':
      return { kind: 'case', parts: item.parts.map(emptyChoice) }
  }
}

function choiceAnswered(q: ChoiceQuestion, r: ChoiceResponse | undefined): boolean {
  if (!r) return false
  if (r.kind === 'single') return r.choice !== null
  return q.kind === 'multi' && r.choices.length === q.select
}

/** Whether the learner has given an answer that can be checked. */
export function isAnswered(item: Item, r: Response): boolean {
  switch (r.kind) {
    case 'single':
    case 'multi':
      return (item.kind === 'single' || item.kind === 'multi') && choiceAnswered(item, r)
    case 'order':
      return true
    case 'match':
      return r.picks.every((p) => p !== '')
    case 'case':
      return item.kind === 'case' && item.parts.every((p, i) => choiceAnswered(p, r.parts[i]))
  }
}

export function choiceCorrect(q: ChoiceQuestion, r: ChoiceResponse | undefined): boolean {
  if (!r || q.kind !== r.kind) return false
  if (r.kind === 'single') return r.choice !== null && !!q.options[r.choice]?.correct
  const key = q.options.flatMap((o, i) => (o.correct ? [i] : []))
  return r.choices.length === key.length && key.every((i) => r.choices.includes(i))
}

/** One result per scored question: a case study gives one per part, every other item one. */
export function gradeParts(item: Item, r: Response): boolean[] {
  switch (item.kind) {
    case 'single':
    case 'multi':
      return [(r.kind === 'single' || r.kind === 'multi') && choiceCorrect(item, r)]
    case 'order':
      return [r.kind === 'order' && r.order.every((step, i) => step === i)]
    case 'match':
      return [r.kind === 'match' && item.pairs.every((p, i) => r.picks[i] === p.answer)]
    case 'case':
      return item.parts.map((p, i) => r.kind === 'case' && choiceCorrect(p, r.parts[i]))
  }
}

/** All-or-nothing: every scored question of the item is right. Practice stats use this. */
export const grade = (item: Item, r: Response) => gradeParts(item, r).every(Boolean)
