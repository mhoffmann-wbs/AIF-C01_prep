import { useSyncExternalStore } from 'react'
import { z } from 'zod'

// All persisted learner state lives behind this module. Bump VERSION and add a
// migration in `load()` and `importProgress()` whenever the shape changes, and
// keep ProgressSchema in step; never read localStorage elsewhere.
const STORAGE_KEY = 'aifc01:progress'
const VERSION = 4

export interface ItemStat {
  attempts: number
  correct: number
  lastCorrect: boolean
  lastAt: number
  /** Consecutive correct answers; a wrong answer resets it to 0. */
  streak: number
}

export interface ScoreRowRecord {
  id: string
  correct: number
  total: number
}

export interface MockResult {
  at: number
  /** Ordering, matching and case-study items were included. */
  extended: boolean
  correct: number
  total: number
  percent: number
  /** Scaled-score estimate (100–1,000). */
  scaled: number
  passed: boolean
  domains: ScoreRowRecord[]
}

/** Spaced-review state of one flashcard (built-in or the learner's own). */
export interface CardStat {
  /** Leitner box 0–5: the higher the box, the longer until the card comes back. */
  box: number
  /** When the card is next due (ms since epoch). */
  due: number
  reviews: number
  /** Times the card was rated Again after it had been learned once. */
  lapses: number
  lastAt: number
}

/** A deck of the learner's own flashcards. */
export interface UserDeck {
  id: string
  name: string
  createdAt: number
}

export interface UserCard {
  id: string
  deckId: string
  front: string
  back: string
  createdAt: number
  updatedAt: number
}

/** A learner's record on one drill deck. */
export interface DrillStat {
  rounds: number
  /** Best round score in percent. */
  best: number
  /** Longest run of correct answers within one round. */
  bestStreak: number
  lastAt: number
}

export interface DrillRound {
  correct: number
  total: number
  streak: number
  /** Card ids answered wrongly and rightly in the round. */
  missed: string[]
  hit: string[]
}

export interface Progress {
  version: typeof VERSION
  /** Include ordering, matching and case-study items in practice and the question bank. */
  extendedInPractice: boolean
  /** Include them in the mock exam. */
  extendedInMock: boolean
  items: Record<string, ItemStat>
  mockResults: MockResult[]
  /** Task ids whose lesson the learner marked as read. */
  lessonsRead: string[]
  /** Per drill deck id. */
  drills: Record<string, DrillStat>
  /** Drill card ids last answered wrongly; a right answer removes one. */
  drillMisses: string[]
  /** Review state per flashcard id, for built-in, service and own cards. */
  cards: Record<string, CardStat>
  decks: UserDeck[]
  myCards: UserCard[]
  /** Per walkthrough id: the indices of the steps the learner ticked off. */
  walkthroughs: Record<string, number[]>
}

function empty(): Progress {
  return { version: VERSION, extendedInPractice: true, extendedInMock: true, items: {}, mockResults: [], lessonsRead: [], drills: {}, drillMisses: [], cards: {}, decks: [], myCards: [], walkthroughs: {} }
}

function load(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return empty()
    const parsed = JSON.parse(raw) as { version?: number }
    // Version 1 had no drills, version 2 no flashcards and version 3 no walkthroughs; the defaults from empty() fill them in.
    if (typeof parsed.version !== 'number' || parsed.version < 1 || parsed.version > VERSION) return empty()
    return { ...empty(), ...parsed, version: VERSION } as Progress
  } catch {
    return empty()
  }
}

let state: Progress = load()
const listeners = new Set<() => void>()

function commit(next: Progress) {
  state = next
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Storage can be unavailable (private mode, quota); keep in-memory state.
  }
  listeners.forEach((l) => l())
}

export function getProgress(): Progress {
  return state
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => void listeners.delete(listener)
}

export function useProgress(): Progress {
  return useSyncExternalStore(subscribe, getProgress)
}

export function recordAnswer(itemId: string, correct: boolean, at: number = Date.now()) {
  const prev = state.items[itemId] ?? { attempts: 0, correct: 0, lastCorrect: false, lastAt: 0, streak: 0 }
  commit({
    ...state,
    items: {
      ...state.items,
      [itemId]: {
        attempts: prev.attempts + 1,
        correct: prev.correct + (correct ? 1 : 0),
        lastCorrect: correct,
        lastAt: at,
        streak: correct ? prev.streak + 1 : 0,
      },
    },
  })
}

export function recordMockResult(result: MockResult) {
  commit({ ...state, mockResults: [...state.mockResults, result] })
}

export function setExtended(which: 'extendedInPractice' | 'extendedInMock', on: boolean) {
  commit({ ...state, [which]: on })
}

export function setLessonRead(taskId: string, read: boolean) {
  const others = state.lessonsRead.filter((id) => id !== taskId)
  commit({ ...state, lessonsRead: read ? [...others, taskId] : others })
}

export function recordDrillRound(deckId: string, round: DrillRound, at: number = Date.now()) {
  const prev = state.drills[deckId] ?? { rounds: 0, best: 0, bestStreak: 0, lastAt: 0 }
  const percent = round.total ? Math.round((round.correct / round.total) * 100) : 0
  const hit = new Set(round.hit)
  const kept = state.drillMisses.filter((id) => !hit.has(id) && !round.missed.includes(id))
  commit({
    ...state,
    drills: {
      ...state.drills,
      [deckId]: {
        rounds: prev.rounds + 1,
        best: Math.max(prev.best, percent),
        bestStreak: Math.max(prev.bestStreak, round.streak),
        lastAt: at,
      },
    },
    drillMisses: [...kept, ...round.missed],
  })
}

export function setWalkthroughStep(walkthroughId: string, step: number, done: boolean) {
  const others = (state.walkthroughs[walkthroughId] ?? []).filter((i) => i !== step)
  const steps = done ? [...others, step].sort((a, b) => a - b) : others
  commit({ ...state, walkthroughs: { ...state.walkthroughs, [walkthroughId]: steps } })
}

export function resetWalkthrough(walkthroughId: string) {
  const { [walkthroughId]: _, ...walkthroughs } = state.walkthroughs
  commit({ ...state, walkthroughs })
}

export function recordCardReview(cardId: string, stat: CardStat) {
  commit({ ...state, cards: { ...state.cards, [cardId]: stat } })
}

const newId = (prefix: string) => `${prefix}-${crypto.randomUUID().slice(0, 8)}`

/** Creates an empty deck of own cards and returns its id. */
export function createDeck(name: string, at: number = Date.now()): string {
  const id = newId('d')
  commit({ ...state, decks: [...state.decks, { id, name, createdAt: at }] })
  return id
}

export function renameDeck(deckId: string, name: string) {
  commit({ ...state, decks: state.decks.map((d) => (d.id === deckId ? { ...d, name } : d)) })
}

/** Deletes a deck with its cards and their review state. */
export function deleteDeck(deckId: string) {
  const gone = new Set(state.myCards.filter((c) => c.deckId === deckId).map((c) => c.id))
  commit({
    ...state,
    decks: state.decks.filter((d) => d.id !== deckId),
    myCards: state.myCards.filter((c) => !gone.has(c.id)),
    cards: Object.fromEntries(Object.entries(state.cards).filter(([id]) => !gone.has(id))),
  })
}

export type CardDraft = Pick<UserCard, 'deckId' | 'front' | 'back'>

/** Adds own cards (e.g. one typed in, or a whole uploaded deck) and returns their ids. */
export function addCards(drafts: CardDraft[], at: number = Date.now()): string[] {
  const added = drafts.map((d): UserCard => ({ ...d, id: newId('u'), createdAt: at, updatedAt: at }))
  commit({ ...state, myCards: [...state.myCards, ...added] })
  return added.map((c) => c.id)
}

/** Changes an own card's text. Its review state is kept. */
export function updateCard(cardId: string, change: Pick<UserCard, 'front' | 'back'>, at: number = Date.now()) {
  commit({ ...state, myCards: state.myCards.map((c) => (c.id === cardId ? { ...c, ...change, updatedAt: at } : c)) })
}

export function deleteCard(cardId: string) {
  const { [cardId]: _, ...cards } = state.cards
  commit({ ...state, myCards: state.myCards.filter((c) => c.id !== cardId), cards })
}

// Imports come from files people pick, so they are validated in full before replacing anything.
const count = z.number().int().nonnegative()
const row = z.object({ id: z.string(), correct: count, total: count })
const ProgressSchema = z.object({
  version: z.literal(VERSION),
  extendedInPractice: z.boolean(),
  extendedInMock: z.boolean(),
  items: z.record(
    z.string(),
    z.object({ attempts: count, correct: count, lastCorrect: z.boolean(), lastAt: z.number(), streak: count }),
  ),
  mockResults: z.array(
    z.object({
      at: z.number(),
      extended: z.boolean(),
      correct: count,
      total: count,
      percent: z.number(),
      scaled: z.number(),
      passed: z.boolean(),
      domains: z.array(row),
    }),
  ),
  lessonsRead: z.array(z.string()),
  drills: z.record(z.string(), z.object({ rounds: count, best: z.number().min(0).max(100), bestStreak: count, lastAt: z.number() })),
  drillMisses: z.array(z.string()),
  cards: z.record(z.string(), z.object({ box: z.number().int().min(0).max(5), due: z.number(), reviews: count, lapses: count, lastAt: z.number() })),
  decks: z.array(z.object({ id: z.string(), name: z.string(), createdAt: z.number() })),
  myCards: z.array(
    z.object({ id: z.string(), deckId: z.string(), front: z.string(), back: z.string(), createdAt: z.number(), updatedAt: z.number() }),
  ),
  walkthroughs: z.record(z.string(), z.array(count)),
})

const EXPORT_APP = 'aif-c01-prep'

/** The learner's progress as a JSON document they can save and import elsewhere. */
export function exportProgress(at: Date = new Date()): string {
  return JSON.stringify({ app: EXPORT_APP, exportedAt: at.toISOString(), progress: state }, null, 2)
}

/**
 * Replaces all progress with the contents of an export.
 * Throws an Error with a message for the learner if the file isn't a usable export.
 */
export function importProgress(json: string) {
  let doc: { app?: unknown; progress?: { version?: unknown } }
  try {
    doc = JSON.parse(json)
  } catch {
    throw new Error("This file isn't valid JSON.")
  }
  if (doc?.app !== EXPORT_APP || typeof doc.progress !== 'object' || doc.progress === null) {
    throw new Error("This file isn't an AIF-C01 Prep progress export.")
  }
  const { version } = doc.progress
  if (typeof version === 'number' && version > VERSION) {
    throw new Error('This export comes from a newer version of the app. Reload the app, then import it again.')
  }
  // Older versions lack newer fields; the defaults from empty() fill them in.
  const older = typeof version === 'number' && version >= 1 && version < VERSION
  const result = ProgressSchema.safeParse({ ...empty(), ...doc.progress, ...(older ? { version: VERSION } : {}) })
  if (!result.success) throw new Error('This export is damaged or incomplete, so nothing was imported.')
  commit(result.data)
}

export function resetProgress() {
  commit(empty())
}

/** Re-read from storage. Used by tests after manipulating localStorage directly. */
export function reloadProgress() {
  state = load()
  listeners.forEach((l) => l())
}
