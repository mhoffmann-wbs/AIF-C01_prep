// Which items the learner practises, given the extended-kinds toggle, and the
// blueprint weight of each task.
import { DOMAINS, TASKS, tasksOf } from '../content/blueprint'
import { type Item, isExtended } from '../content/schema'

/** The practice pool: ordering, matching and case-study items only when the learner wants them. */
export function practicePool(bank: readonly Item[], extended: boolean): Item[] {
  return extended ? [...bank] : bank.filter((i) => !isExtended(i))
}

/**
 * Blueprint weight of each task: its domain's weight shared among the domain's
 * tasks by objective count (the same split as the question targets).
 */
export function taskWeights(): Map<string, number> {
  const weights = new Map<string, number>()
  for (const d of DOMAINS) {
    const tasks = tasksOf(d.id)
    const objectives = tasks.reduce((n, t) => n + t.objectives.length, 0)
    for (const t of tasks) weights.set(t.id, (d.weight * t.objectives.length) / objectives)
  }
  return weights
}

export const domainOf = (taskId: string) => TASKS.find((t) => t.id === taskId)!.domainId
