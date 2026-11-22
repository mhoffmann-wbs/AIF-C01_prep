// Prints question-bank coverage per task and objective against the PLAN.md
// targets, with the mix of item kinds. Run: npm run content:status
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { BANK_TARGET, DOMAINS, MIN_ITEMS_PER_OBJECTIVE, tasksOf, questionTarget } from '../src/content/blueprint.ts'
import { type Item, itemObjectives } from '../src/content/schema.ts'

const dir = join(import.meta.dirname, '../src/content/questions')
const items: Item[] = readdirSync(dir)
  .filter((f) => f.endsWith('.json'))
  .flatMap((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')) as Item[])

let have = 0
const kinds: Record<string, number> = {}
for (const d of DOMAINS) {
  console.log(`\nDomain ${d.id}: ${d.title} (${d.weight}%)`)
  for (const t of tasksOf(d.id)) {
    const pool = items.filter((i) => i.taskId === t.id)
    const target = questionTarget(t.id)
    have += Math.min(pool.length, target)
    const mix: Record<string, number> = {}
    for (const i of pool) {
      mix[i.kind] = (mix[i.kind] ?? 0) + 1
      kinds[i.kind] = (kinds[i.kind] ?? 0) + 1
    }
    const mixText = Object.entries(mix)
      .map(([k, n]) => `${k} ${n}`)
      .join(', ')
    console.log(`  ${pool.length >= target ? '✓' : ' '} ${t.id}  ${String(pool.length).padStart(3)} / ${target}  ${mixText}`)
    const thin = t.objectives
      .map((o) => [o.id, pool.filter((i) => itemObjectives(i).includes(o.id)).length] as const)
      .filter(([, n]) => n < MIN_ITEMS_PER_OBJECTIVE)
    if (thin.length) console.log(`        below ${MIN_ITEMS_PER_OBJECTIVE}: ${thin.map(([id, n]) => `${id} (${n})`).join(', ')}`)
  }
}
const extended = (kinds.order ?? 0) + (kinds.match ?? 0) + (kinds.case ?? 0)
console.log(`\nQuestions: ${have} / ${BANK_TARGET} (${Math.round((have / BANK_TARGET) * 100)}%)`)
console.log(`Kinds: ${JSON.stringify(kinds)}; extended ${items.length ? Math.round((extended / items.length) * 100) : 0}% (target ~20%)`)
