// Scores a finished mock exam like the official report: pass/fail, a scaled
// score (a linear estimate), and results per domain, plus per task.
import { DOMAINS, EXAM_FORMAT, TASKS, estimateScaledScore } from '../content/blueprint'
import type { Item } from '../content/schema'

export interface ScoreRow {
  id: string
  label: string
  correct: number
  total: number
}

export interface MockScore {
  correct: number
  total: number
  percent: number
  /** Estimate on the 100–1,000 scale; always label it as one. */
  scaled: number
  passed: boolean
  domains: ScoreRow[]
  tasks: ScoreRow[]
}

export const percent = (correct: number, total: number) => (total === 0 ? 0 : Math.round((correct / total) * 100))

/** `parts(item)` gives one result per scored question (see gradeParts). */
export function scoreMock(items: readonly Item[], parts: (item: Item) => boolean[]): MockScore {
  const row = (id: string, label: string, xs: readonly Item[]): ScoreRow => {
    const results = xs.flatMap(parts)
    return { id, label, correct: results.filter(Boolean).length, total: results.length }
  }
  const domains = DOMAINS.map((d) => row(d.id, d.title, items.filter((i) => i.taskId.startsWith(`${d.id}.`))))
  const tasks = TASKS.map((t) => row(t.id, t.title, items.filter((i) => i.taskId === t.id))).filter((r) => r.total > 0)
  const all = row('all', 'All', items)
  const scaled = all.total ? estimateScaledScore(all.correct / all.total) : EXAM_FORMAT.scaleMin
  return {
    correct: all.correct,
    total: all.total,
    percent: percent(all.correct, all.total),
    scaled,
    passed: scaled >= EXAM_FORMAT.passScore,
    domains,
    tasks,
  }
}
