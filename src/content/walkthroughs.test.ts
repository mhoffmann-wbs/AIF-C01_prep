// Walkthrough content tests: structure, a checklist that matches the step
// headings, a teardown, and links to real tasks.
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { TASK_BY_ID } from './blueprint'
import { REQUIRED_SECTIONS, WALKTHROUGH_BY_ID, WALKTHROUGH_ORDER } from './walkthroughs'

// Read the raw MDX from disk: the MDX plugin would compile a `?raw` import.
const dir = join(import.meta.dirname, 'walkthroughs')
const SOURCES = Object.fromEntries(
  readdirSync(dir)
    .filter((f) => f.endsWith('.mdx'))
    .map((f) => [f.replace(/\.mdx$/, ''), readFileSync(join(dir, f), 'utf8')]),
)

/** The `###` headings between `## heading` and the next `## `. */
function subHeadings(source: string, heading: string): string[] {
  const start = source.indexOf(`\n${heading}\n`)
  if (start < 0) return []
  const end = source.indexOf('\n## ', start + 1)
  const section = source.slice(start, end < 0 ? undefined : end)
  return [...section.matchAll(/\n### (.+)/g)].map((m) => m[1]!.trim())
}

it('lists every walkthrough, and only those', () => {
  expect([...WALKTHROUGH_ORDER].sort()).toEqual(Object.keys(SOURCES).sort())
})

describe.each(Object.entries(SOURCES))('walkthrough %s', (id, source) => {
  const meta = WALKTHROUGH_BY_ID.get(id)?.meta

  it('exports meta with its file name as id, for real tasks', () => {
    expect(meta?.id).toBe(id)
    expect(meta!.tasks.filter((t) => !TASK_BY_ID.has(t))).toEqual([])
  })

  it('has the required sections in order', () => {
    const positions = REQUIRED_SECTIONS.map((heading) => source.indexOf(`\n${heading}\n`))
    expect(
      REQUIRED_SECTIONS.filter((_, i) => positions[i]! < 0),
      'missing sections',
    ).toEqual([])
    expect([...positions].sort((x, y) => x - y), 'sections out of order').toEqual(positions)
  })

  it('has a checklist that matches its step and teardown headings', () => {
    const teardown = subHeadings(source, '## Teardown')
    expect(teardown.length, 'the teardown needs at least one ### step').toBeGreaterThan(0)
    expect(meta!.steps).toEqual([...subHeadings(source, '## Steps'), ...teardown])
  })
})
