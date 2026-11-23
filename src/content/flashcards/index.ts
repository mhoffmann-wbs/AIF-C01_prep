// Loads every flashcard file in this folder. Files are JSON arrays named
// <taskId>.json; content tests validate them.
import { type Card, cardFileSchema } from '../schema'

const files = import.meta.glob<unknown>('./*.json', { eager: true, import: 'default' })

export const CARD_FILES: Record<string, unknown> = Object.fromEntries(
  Object.entries(files).map(([path, data]) => [path.replace(/^.*\/(.+)\.json$/, '$1'), data]),
)

export const CARDS: Card[] = Object.values(CARD_FILES).flatMap((data) => cardFileSchema.parse(data))
