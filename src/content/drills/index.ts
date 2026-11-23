// Loads every drill deck in this folder (JSON files named <deckId>.json) and
// adds the in-scope/out-of-scope sorter, which is generated from the service
// catalog so it always matches the exam guide. Content tests validate the files.
import { type DrillDeck, type SortDeck, drillDeckSchema } from '../schema'
import { IN_SCOPE_SERVICES, OUT_OF_SCOPE_SERVICES } from '../services'

const files = import.meta.glob<unknown>('./*.json', { eager: true, import: 'default' })

export const DRILL_FILES: Record<string, unknown> = Object.fromEntries(
  Object.entries(files).map(([path, data]) => [path.replace(/^.*\/(.+)\.json$/, '$1'), data]),
)

/** Exam guide v1.2 lists these services as in or out of scope; card ids are `scope-<serviceId>`. */
export const SCOPE_DECK: SortDeck = {
  id: 'scope',
  kind: 'sort',
  title: 'In scope or out of scope?',
  description: 'Sort AWS services by whether the exam guide lists them as in scope for AIF-C01, so you know what not to study.',
  tasks: ['2.3'],
  buckets: [
    { id: 'in', label: 'In scope' },
    { id: 'out', label: 'Out of scope' },
  ],
  items: [
    ...IN_SCOPE_SERVICES.map((s) => ({ id: `scope-${s.id}`, text: s.name, bucket: 'in', why: `In scope. ${s.oneLiner}` })),
    ...OUT_OF_SCOPE_SERVICES.map((s) => ({
      id: `scope-${s.id}`,
      text: s.name,
      bucket: 'out',
      why: `The exam guide lists it as out of scope (${s.category}).`,
    })),
  ],
}

const byFirstTask = (a: DrillDeck, b: DrillDeck) => a.tasks[0]!.localeCompare(b.tasks[0]!, 'en', { numeric: true }) || a.id.localeCompare(b.id)

export const DRILL_DECKS: DrillDeck[] = [...Object.values(DRILL_FILES).map((data) => drillDeckSchema.parse(data)), SCOPE_DECK].sort(byFirstTask)

export const DRILL_DECK_BY_ID = new Map(DRILL_DECKS.map((d) => [d.id, d]))

/** Every card id of a deck, in deck order. */
export const cardIds = (deck: DrillDeck): string[] => (deck.kind === 'which' ? deck.cards.map((c) => c.id) : deck.items.map((i) => i.id))
