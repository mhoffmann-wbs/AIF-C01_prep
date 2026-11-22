// Integrity of the real question bank. Targets (PLAN.md §4) are tracked with
// `npm run content:status`, not enforced here.
import { describe, expect, it } from 'vitest'
import { OBJECTIVE_BY_ID, TASK_BY_ID } from './blueprint'
import { ITEMS, QUESTION_FILES } from './bank'
import { QUALITY_CHECKS } from './quality'
import { itemFileSchema, itemObjectives } from './schema'
import { SERVICE_BY_ID } from './services'
import { seededRng } from '../quiz/random'
import { buildMockExam } from '../quiz/sampler'

describe('question bank', () => {
  it.each(Object.keys(QUESTION_FILES))('%s.json is valid and holds only its own task', (taskId) => {
    expect(TASK_BY_ID.has(taskId)).toBe(true)
    const items = itemFileSchema.parse(QUESTION_FILES[taskId])
    for (const item of items) expect(item.taskId).toBe(taskId)
  })

  it('has unique ids', () => {
    expect(new Set(ITEMS.map((i) => i.id)).size).toBe(ITEMS.length)
  })

  it('tags objectives of the item’s own task and services from the catalog', () => {
    for (const item of ITEMS) {
      for (const o of itemObjectives(item)) {
        expect(OBJECTIVE_BY_ID.has(o), `${item.id}: ${o}`).toBe(true)
        expect(o.startsWith(`${item.taskId}.`), `${item.id}: ${o}`).toBe(true)
      }
      for (const s of item.services ?? []) expect(SERVICE_BY_ID.has(s), `${item.id}: ${s}`).toBe(true)
    }
  })

  it.each(Object.entries(QUALITY_CHECKS))('passes %s', (_, check) => {
    expect(check(ITEMS)).toEqual([])
  })

  it('fills a complete mock exam, with and without the extended kinds', () => {
    for (const extended of [false, true]) {
      for (let seed = 0; seed < 5; seed++) expect(buildMockExam(ITEMS, extended, new Set(), seededRng(seed)).shortfall).toBe(0)
    }
  })
})
