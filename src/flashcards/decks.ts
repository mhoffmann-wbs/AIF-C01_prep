// Built-in, service and own flashcards behind one shape. Built-in cards form one
// deck per domain; the service deck is generated from the catalog (every
// in-scope service and feature with a one-liner); own decks come from progress.
import { DOMAINS } from '../content/blueprint'
import { CARDS } from '../content/flashcards'
import { SERVICES } from '../content/services'
import type { Progress, UserCard } from '../progress/store'

export interface StudyCard {
  id: string
  front: string
  back: string
  /** Built-in cards only. */
  taskId: string | null
}

export interface Deck {
  /** "d1"…"d5" for domains, "services", or an own deck's id. */
  id: string
  name: string
  own: boolean
  cards: StudyCard[]
}

type Settings = Pick<Progress, 'decks' | 'myCards'>

export const BUILT_IN_CARDS: StudyCard[] = CARDS.map((c) => ({ id: c.id, front: c.front, back: c.back, taskId: c.id.split('-')[0]! }))

/** Ids are `svc-<serviceId>`, so they stay stable while the catalog is in step with the guide. */
export const SERVICE_CARDS: StudyCard[] = SERVICES.filter((s) => s.inScope && s.oneLiner).map((s) => ({
  id: `svc-${s.id}`,
  front: `What is ${s.name} for?`,
  back: s.oneLiner!,
  taskId: null,
}))

export const fromOwn = (c: UserCard): StudyCard => ({ id: c.id, front: c.front, back: c.back, taskId: null })

export const BUILT_IN_DECKS: Deck[] = [
  ...DOMAINS.map((d) => ({
    id: `d${d.id}`,
    name: `${d.id}. ${d.title}`,
    own: false,
    cards: BUILT_IN_CARDS.filter((c) => c.taskId!.startsWith(`${d.id}.`)),
  })).filter((d) => d.cards.length > 0),
  { id: 'services', name: 'AWS services in scope', own: false, cards: SERVICE_CARDS },
]

export function ownDecks({ decks, myCards }: Settings): Deck[] {
  return decks.map((d) => ({ id: d.id, name: d.name, own: true, cards: myCards.filter((c) => c.deckId === d.id).map(fromOwn) }))
}

export const allDecks = (settings: Settings): Deck[] => [...BUILT_IN_DECKS, ...ownDecks(settings)]

/** What a review page asks for: one deck, one task's built-in cards, or (neither) every deck. */
export interface CardQuery {
  deck?: string | null
  task?: string | null
}

export function cardsFor({ deck, task }: CardQuery, settings: Settings): StudyCard[] {
  if (task) return BUILT_IN_CARDS.filter((c) => c.taskId === task)
  const decks = allDecks(settings)
  if (deck) return decks.find((d) => d.id === deck)?.cards ?? []
  return decks.flatMap((d) => d.cards)
}
