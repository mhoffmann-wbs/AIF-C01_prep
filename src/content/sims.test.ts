// Content tests over the concept simulators: each file parses and is named
// after its simulator, has a registered component whose schema accepts its
// params, names real objectives, and points "Now you try" at core bank items
// that test one of those objectives.
import { describe, expect, it } from 'vitest'
import { SIM_REGISTRY } from '../sims/registry'
import { ITEMS } from './bank'
import { OBJECTIVE_BY_ID } from './blueprint'
import { itemObjectives, simSchema } from './schema'
import { SIMS, SIM_FILES } from './sims'

describe('concept simulators', () => {
  it.each(Object.entries(SIM_FILES))('%s.json parses, is named after its simulator and has valid params', (fileId, data) => {
    const parsed = simSchema.safeParse(data)
    expect(parsed.success, parsed.error?.message).toBe(true)
    expect(parsed.data?.id).toBe(fileId)
    const entry = SIM_REGISTRY.get(fileId)
    expect(entry, `no src/sims/${fileId}/index.ts`).toBeDefined()
    const params = entry!.params.safeParse(parsed.data!.params)
    expect(params.success, params.error?.message).toBe(true)
  })

  it('has a content file for every registered component', () => {
    expect([...SIM_REGISTRY.keys()].filter((id) => !(id in SIM_FILES))).toEqual([])
  })

  it('names real objectives', () => {
    expect(SIMS.flatMap((s) => s.objectives.filter((o) => !OBJECTIVE_BY_ID.has(o)).map((o) => `${s.id}: ${o}`))).toEqual([])
  })

  it('uses single or multi bank items that test one of its objectives for "Now you try"', () => {
    const problems = SIMS.flatMap((s) =>
      s.tryItems.flatMap((id) => {
        const item = ITEMS.find((i) => i.id === id)
        if (!item) return [`${s.id}: no item ${id}`]
        if (item.kind !== 'single' && item.kind !== 'multi') return [`${s.id}: ${id} is a ${item.kind} item`]
        return itemObjectives(item).some((o) => s.objectives.includes(o)) ? [] : [`${s.id}: ${id} tests none of its objectives`]
      }),
    )
    expect(problems).toEqual([])
  })

  it('does not reuse a "Now you try" item across simulators', () => {
    const ids = SIMS.flatMap((s) => s.tryItems)
    expect(ids.length).toBe(new Set(ids).size)
  })
})
