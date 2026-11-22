// Lesson content tests: structure, coverage of the exam guide's objectives, and
// service references that resolve to the catalog.
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { TASK_BY_ID } from './blueprint'
import { LESSONS, REQUIRED_SECTIONS } from './lessons'
import { SERVICE_BY_ID } from './services'

// Read the raw MDX from disk: the MDX plugin would compile a `?raw` import.
const dir = join(import.meta.dirname, 'lessons')
const SOURCES = Object.fromEntries(
  readdirSync(dir)
    .filter((f) => f.endsWith('.mdx'))
    .map((f) => [f.replace(/\.mdx$/, ''), readFileSync(join(dir, f), 'utf8')]),
)

describe.each(Object.entries(SOURCES))('lesson %s', (fileId, source) => {
  const lesson = LESSONS.get(fileId)

  it('is named after its task and covers every objective', () => {
    expect(lesson, `${fileId}.mdx must export meta with taskId '${fileId}'`).toBeDefined()
    const task = TASK_BY_ID.get(fileId)
    expect(task, `no task ${fileId}`).toBeDefined()
    expect([...lesson!.meta.objectivesCovered].sort()).toEqual(task!.objectives.map((o) => o.id).sort())
  })

  it('has the required sections in order', () => {
    const positions = REQUIRED_SECTIONS.map((heading) => source.indexOf(`\n${heading}\n`))
    expect(
      REQUIRED_SECTIONS.filter((_, i) => positions[i]! < 0),
      'missing sections',
    ).toEqual([])
    expect([...positions].sort((x, y) => x - y), 'sections out of order').toEqual(positions)
  })

  it('has a Key concepts sub-heading for each objective', () => {
    const start = source.indexOf('\n## Key concepts\n')
    const section = source.slice(start, source.indexOf('\n## ', start + 1))
    expect(section.match(/\n### /g)?.length ?? 0).toBeGreaterThanOrEqual(TASK_BY_ID.get(fileId)!.objectives.length)
  })

  it('lists services that exist in the catalog', () => {
    const ids = [...source.matchAll(/<Services ids=\{\[([^\]]*)\]\}/g)].flatMap((m) => [...m[1]!.matchAll(/'([^']+)'/g)].map((x) => x[1]!))
    expect(ids.length, 'the AWS services section needs a <Services ids={[...]} /> list').toBeGreaterThan(0)
    expect(ids.filter((id) => !SERVICE_BY_ID.has(id))).toEqual([])
  })
})
