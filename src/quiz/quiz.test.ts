import { describe, expect, it } from 'vitest'
import { TASKS } from '../content/blueprint'
import { type Item, scoredCount } from '../content/schema'
import { CASE, MATCH, MULTI, ORDER, SINGLE } from '../test/fixtures'
import { freshResponse } from './answer'
import { type Response, emptyResponse, grade, gradeParts, isAnswered } from './grade'
import { practicePool, taskWeights } from './pools'
import { seededRng } from './random'
import { scoreMock } from './results'
import { MOCK_EXTENDED_QUESTIONS, buildFocusSet, buildMixedSet, buildMockExam, orderLeastMastered } from './sampler'

describe('grading', () => {
  it('grades single and multi items all or nothing', () => {
    expect(grade(SINGLE, { kind: 'single', choice: 0 })).toBe(true)
    expect(grade(SINGLE, { kind: 'single', choice: 1 })).toBe(false)
    expect(grade(MULTI, { kind: 'multi', choices: [1, 0] })).toBe(true)
    expect(grade(MULTI, { kind: 'multi', choices: [0, 2] })).toBe(false)
    expect(isAnswered(MULTI, { kind: 'multi', choices: [0] })).toBe(false)
  })

  it('grades ordering by the exact sequence', () => {
    expect(grade(ORDER, { kind: 'order', order: [0, 1, 2] })).toBe(true)
    expect(grade(ORDER, { kind: 'order', order: [1, 0, 2] })).toBe(false)
  })

  it('starts ordering items scrambled', () => {
    for (let n = 0; n < 20; n++) expect(grade(ORDER, freshResponse(ORDER))).toBe(false)
  })

  it('grades matching only when every pair is right', () => {
    const answers = MATCH.pairs.map((p) => p.answer)
    expect(grade(MATCH, { kind: 'match', picks: answers })).toBe(true)
    expect(grade(MATCH, { kind: 'match', picks: [answers[0]!, 'Amazon Lex', answers[2]!] })).toBe(false)
    expect(isAnswered(MATCH, { kind: 'match', picks: [answers[0]!, '', ''] })).toBe(false)
  })

  it('grades each case-study part separately', () => {
    const r: Response = { kind: 'case', parts: [{ kind: 'single', choice: 0 }, { kind: 'multi', choices: [2, 3] }] }
    expect(gradeParts(CASE, r)).toEqual([true, false])
    expect(grade(CASE, r)).toBe(false)
    expect(isAnswered(CASE, emptyResponse(CASE))).toBe(false)
    expect(isAnswered(CASE, r)).toBe(true)
  })
})

// A synthetic bank: `perTask` single items for every task, plus extended items.
function bank(perTask: number, extended = true): Item[] {
  const items: Item[] = []
  for (const t of TASKS) {
    for (let n = 0; n < perTask; n++) {
      items.push({ ...SINGLE, id: `${t.id}-${String(n).padStart(3, '0')}`, taskId: t.id, objectives: [`${t.id}.1`], stem: `${t.id} q${n}` })
    }
    if (extended) {
      items.push({ ...ORDER, id: `${t.id}-900`, taskId: t.id, objectives: [`${t.id}.1`], stem: `${t.id} order` })
      items.push({ ...MATCH, id: `${t.id}-901`, taskId: t.id, objectives: [`${t.id}.1`], stem: `${t.id} match` })
      items.push({ ...CASE, id: `${t.id}-902`, taskId: t.id, parts: CASE.parts.map((p) => ({ ...p, objectives: [`${t.id}.1`] })) })
    }
  }
  return items
}

const questionsPerDomain = (items: Item[]) => {
  const counts: Record<string, number> = {}
  for (const i of items) counts[i.taskId[0]!] = (counts[i.taskId[0]!] ?? 0) + scoredCount(i)
  return counts
}

describe('mock exam', () => {
  it('has 65 core questions in 90 minutes, allocated 13 · 16 · 18 · 9 · 9', () => {
    const exam = buildMockExam(bank(30), false, new Set(), seededRng(1))
    expect(exam).toMatchObject({ questions: 65, minutes: 90, shortfall: 0, extended: false })
    expect(questionsPerDomain(exam.items)).toEqual({ 1: 13, 2: 16, 3: 18, 4: 9, 5: 9 })
    expect(exam.items.every((i) => i.kind === 'single')).toBe(true)
  })

  it('swaps in about 8 extended questions with at most one case study, keeping the domain counts', () => {
    for (let seed = 0; seed < 10; seed++) {
      const exam = buildMockExam(bank(30), true, new Set(), seededRng(seed))
      expect(exam.questions).toBe(65)
      expect(questionsPerDomain(exam.items)).toEqual({ 1: 13, 2: 16, 3: 18, 4: 9, 5: 9 })
      expect(exam.items.filter((i) => i.kind === 'case')).toHaveLength(1)
      const extended = exam.items.filter((i) => i.kind !== 'single').reduce((n, i) => n + scoredCount(i), 0)
      expect(extended).toBe(MOCK_EXTENDED_QUESTIONS)
    }
  })

  it('fills extended slots with core questions when the bank has no extended items', () => {
    const exam = buildMockExam(bank(30, false), true, new Set(), seededRng(2))
    expect(exam.questions).toBe(65)
  })

  it('prefers unseen items', () => {
    const items = bank(30, false)
    const seen = new Set(items.filter((i) => Number(i.id.slice(-3)) < 10).map((i) => i.id))
    const exam = buildMockExam(items, false, seen, seededRng(3))
    expect(exam.items.some((i) => seen.has(i.id))).toBe(false)
  })

  it('scales the time to the real pace when the bank is short', () => {
    const exam = buildMockExam(bank(1, false), false, new Set(), seededRng(4))
    expect(exam.questions).toBe(14)
    expect(exam.shortfall).toBe(51)
    expect(exam.minutes).toBe(Math.round((90 * 14) / 65))
  })
})

describe('practice sets', () => {
  it('leaves out extended kinds when the learner turns them off', () => {
    expect(practicePool(bank(2), false).every((i) => i.kind === 'single')).toBe(true)
    expect(practicePool(bank(2), true).some((i) => i.kind === 'case')).toBe(true)
  })

  it('weights tasks so they sum to 100', () => {
    const total = [...taskWeights().values()].reduce((a, b) => a + b, 0)
    expect(total).toBeCloseTo(100)
  })

  it('draws mixed sets of the requested size without repeats', () => {
    const set = buildMixedSet(bank(5, false), taskWeights(), 25, seededRng(5))
    expect(set).toHaveLength(25)
    expect(new Set(set.map((i) => i.id)).size).toBe(25)
  })

  it('puts least-mastered items first', () => {
    const pool = bank(3, false)
    const streakOf = (id: string) => (id.endsWith('000') ? 0 : 5)
    expect(orderLeastMastered(pool, streakOf, seededRng(6)).slice(0, TASKS.length).every((i) => i.id.endsWith('000'))).toBe(true)
    expect(buildFocusSet(pool, taskWeights(), 10, streakOf, seededRng(7))).toHaveLength(10)
  })
})

describe('mock score', () => {
  it('scores case parts separately and estimates the scaled score', () => {
    const score = scoreMock([SINGLE, CASE], (item) => (item.kind === 'case' ? [true, false] : [true]))
    expect(score).toMatchObject({ correct: 2, total: 3, percent: 67, scaled: 700, passed: true })
    expect(score.domains.find((d) => d.id === '5')).toMatchObject({ correct: 1, total: 2 })
    expect(score.tasks.map((t) => t.id)).toEqual(['1.2', '5.1'])
  })
})
