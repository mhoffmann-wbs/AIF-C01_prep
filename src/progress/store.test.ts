// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { masteryOf } from './readiness'
import {
  exportProgress,
  getProgress,
  importProgress,
  recordAnswer,
  recordDrillRound,
  recordMockResult,
  reloadProgress,
  resetProgress,
  resetWalkthrough,
  setExtended,
  setLessonRead,
  setWalkthroughStep,
} from './store'

beforeEach(() => {
  localStorage.clear()
  resetProgress()
})

describe('progress store', () => {
  it('records attempts with a streak that a wrong answer resets', () => {
    recordAnswer('3.2-001', true, 1)
    recordAnswer('3.2-001', true, 2)
    expect(getProgress().items['3.2-001']).toMatchObject({ attempts: 2, correct: 2, streak: 2 })
    recordAnswer('3.2-001', false, 3)
    expect(getProgress().items['3.2-001']).toMatchObject({ attempts: 3, correct: 2, streak: 0, lastCorrect: false })
  })

  it('persists to localStorage and survives a reload', () => {
    recordAnswer('1.1-001', true)
    setExtended('extendedInMock', false)
    reloadProgress()
    expect(getProgress().items['1.1-001']?.attempts).toBe(1)
    expect(getProgress().extendedInMock).toBe(false)
  })

  it('starts with the extended kinds on', () => {
    expect(getProgress()).toMatchObject({ extendedInPractice: true, extendedInMock: true })
  })

  it('discards unreadable or other-version data', () => {
    localStorage.setItem('aifc01:progress', '{not json')
    reloadProgress()
    expect(getProgress().items).toEqual({})
    localStorage.setItem('aifc01:progress', JSON.stringify({ version: 99, items: { a: 1 } }))
    reloadProgress()
    expect(getProgress().items).toEqual({})
  })

  it('upgrades older data in storage and in imports', () => {
    const v1 = { version: 1, extendedInPractice: false, extendedInMock: true, items: {}, mockResults: [], lessonsRead: ['1.1'] }
    localStorage.setItem('aifc01:progress', JSON.stringify(v1))
    reloadProgress()
    expect(getProgress()).toMatchObject({ version: 4, extendedInPractice: false, lessonsRead: ['1.1'], drills: {}, drillMisses: [], cards: {}, myCards: [], walkthroughs: {} })
    resetProgress()
    importProgress(JSON.stringify({ app: 'aif-c01-prep', progress: v1 }))
    expect(getProgress()).toMatchObject({ version: 4, lessonsRead: ['1.1'], drillMisses: [], decks: [], walkthroughs: {} })
  })

  it('keeps the best drill round and the cards still missed', () => {
    recordDrillRound('d', { correct: 3, total: 4, streak: 2, missed: ['d-01'], hit: ['d-02', 'd-03', 'd-04'] }, 1)
    recordDrillRound('d', { correct: 1, total: 2, streak: 1, missed: ['d-02'], hit: ['d-01'] }, 2)
    expect(getProgress().drills.d).toEqual({ rounds: 2, best: 75, bestStreak: 2, lastAt: 2 })
    expect(getProgress().drillMisses).toEqual(['d-02'])
  })

  it('marks lessons read and unread', () => {
    setLessonRead('2.1', true)
    setLessonRead('3.1', true)
    setLessonRead('2.1', false)
    expect(getProgress().lessonsRead).toEqual(['3.1'])
  })

  it('ticks walkthrough steps off and resets them', () => {
    setWalkthroughStep('w', 2, true)
    setWalkthroughStep('w', 0, true)
    setWalkthroughStep('w', 2, true)
    expect(getProgress().walkthroughs.w).toEqual([0, 2])
    setWalkthroughStep('w', 0, false)
    expect(getProgress().walkthroughs.w).toEqual([2])
    resetWalkthrough('w')
    expect(getProgress().walkthroughs.w).toBeUndefined()
  })

  it('round-trips an export and rejects files that are not exports', () => {
    recordAnswer('5.1-001', true)
    recordMockResult({ at: 1, extended: true, correct: 50, total: 65, percent: 77, scaled: 792, passed: true, domains: [{ id: '1', correct: 10, total: 13 }] })
    const file = exportProgress()
    resetProgress()
    importProgress(file)
    expect(getProgress().items['5.1-001']?.attempts).toBe(1)
    expect(getProgress().mockResults).toHaveLength(1)
    expect(() => importProgress('nope')).toThrow(/valid JSON/)
    expect(() => importProgress('{"app":"other","progress":{}}')).toThrow(/AIF-C01 Prep/)
    expect(() => importProgress('{"app":"aif-c01-prep","progress":{"version":5}}')).toThrow(/newer version/)
    expect(() => importProgress('{"app":"aif-c01-prep","progress":{"version":1,"items":{"x":{"attempts":-1}}}}')).toThrow(/damaged/)
  })

  it('derives mastery from the latest answer and past misses', () => {
    expect(masteryOf(undefined)).toBe('untested')
    recordAnswer('a', false)
    expect(masteryOf(getProgress().items.a)).toBe('recentError')
    recordAnswer('a', true)
    expect(masteryOf(getProgress().items.a)).toBe('reviewed')
    recordAnswer('b', true)
    expect(masteryOf(getProgress().items.b)).toBe('alwaysCorrect')
  })
})
