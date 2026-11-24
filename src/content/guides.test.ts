// Guide content tests: each guide is registered under its file name, and its
// in-app links point at real routes.
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { TASK_BY_ID } from './blueprint'
import { GUIDES, GUIDE_ORDER } from './guides'

// Read the raw MDX from disk: the MDX plugin would compile a `?raw` import.
const dir = join(import.meta.dirname, 'guides')
const SOURCES = Object.fromEntries(
  readdirSync(dir)
    .filter((f) => f.endsWith('.mdx'))
    .map((f) => [f.replace(/\.mdx$/, ''), readFileSync(join(dir, f), 'utf8')]),
)

it('lists every guide, and only those', () => {
  expect([...GUIDE_ORDER].sort()).toEqual(Object.keys(SOURCES).sort())
})

describe.each(Object.entries(SOURCES))('guide %s', (slug, source) => {
  it('exports meta with its file name as slug', () => {
    expect(GUIDES.get(slug)?.meta.slug).toBe(slug)
  })

  it('links only to lessons and guides that exist', () => {
    const links = [...source.matchAll(/\]\((\/[^)\s]*)\)/g)].map((m) => m[1]!)
    const lessons = links.filter((l) => l.startsWith('/learn/')).map((l) => l.slice('/learn/'.length))
    const guides = links.filter((l) => l.startsWith('/guides/')).map((l) => l.slice('/guides/'.length))
    expect(lessons.filter((id) => !TASK_BY_ID.has(id))).toEqual([])
    expect(guides.filter((g) => !GUIDES.has(g))).toEqual([])
  })
})
