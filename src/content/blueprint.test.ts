import { describe, expect, it } from 'vitest'
import {
  BANK_TARGET,
  DOMAINS,
  MIN_ITEMS_PER_OBJECTIVE,
  MOCK,
  OBJECTIVE_BY_ID,
  QUESTION_TARGETS,
  TASKS,
  allocateItems,
  estimateScaledScore,
  largestRemainder,
  questionTarget,
} from './blueprint'

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)

describe('blueprint', () => {
  it('matches the guide: 5 domains weighted 20/24/28/14/14, 14 tasks, 69 objectives', () => {
    expect(DOMAINS.map((d) => d.weight)).toEqual([20, 24, 28, 14, 14])
    expect(TASKS.map((t) => t.id)).toEqual(['1.1', '1.2', '1.3', '2.1', '2.2', '2.3', '3.1', '3.2', '3.3', '3.4', '4.1', '4.2', '5.1', '5.2'])
    expect(TASKS.map((t) => t.objectives.length)).toEqual([5, 6, 6, 6, 4, 4, 6, 5, 3, 5, 7, 4, 5, 3])
    expect(OBJECTIVE_BY_ID.size).toBe(69)
  })

  it('numbers objectives within their task', () => {
    for (const t of TASKS) {
      expect(t.id.startsWith(`${t.domainId}.`)).toBe(true)
      t.objectives.forEach((o, i) => expect(o.id).toBe(`${t.id}.${i + 1}`))
    }
  })

  it('splits by largest remainder, deterministically', () => {
    expect(largestRemainder(10, [1, 1, 1])).toEqual([4, 3, 3])
    expect(sum(largestRemainder(65, [20, 24, 28, 14, 14]))).toBe(65)
  })

  it('allocates the 65-item mock as 13 · 16 · 18 · 9 · 9', () => {
    expect([...allocateItems().values()]).toEqual([13, 16, 18, 9, 9])
    expect(MOCK).toEqual({ items: 65, minutes: 90 })
  })

  it('sets per-task question targets that sum to the bank target (PLAN.md §4)', () => {
    expect([...QUESTION_TARGETS.values()]).toEqual([38, 46, 46, 67, 45, 44, 57, 48, 29, 48, 58, 33, 57, 34])
    expect(sum([...QUESTION_TARGETS.values()])).toBe(BANK_TARGET)
    for (const t of TASKS) expect(questionTarget(t.id)).toBeGreaterThanOrEqual(t.objectives.length * MIN_ITEMS_PER_OBJECTIVE)
  })

  it('estimates the scaled score linearly on 100–1,000', () => {
    expect(estimateScaledScore(0)).toBe(100)
    expect(estimateScaledScore(1)).toBe(1000)
    expect(estimateScaledScore(2 / 3)).toBe(700)
  })
})
