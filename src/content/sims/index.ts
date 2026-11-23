// Loads every concept simulator in this folder (JSON files named <simId>.json).
// Each file's `params` is validated by the simulator's own schema in
// src/sims/registry.ts; content tests check both.
import { type Sim, simSchema } from '../schema'

const files = import.meta.glob<unknown>('./*.json', { eager: true, import: 'default' })

export const SIM_FILES: Record<string, unknown> = Object.fromEntries(
  Object.entries(files).map(([path, data]) => [path.replace(/^.*\/(.+)\.json$/, '$1'), data]),
)

const objectiveOrder = (id: string) => id.split('.').map(Number)
const byFirstObjective = (a: Sim, b: Sim) => {
  const [x, y] = [objectiveOrder(a.objectives[0]!), objectiveOrder(b.objectives[0]!)]
  return x[0]! - y[0]! || x[1]! - y[1]! || x[2]! - y[2]! || a.id.localeCompare(b.id)
}

export const SIMS: Sim[] = Object.values(SIM_FILES)
  .map((data) => simSchema.parse(data))
  .sort(byFirstObjective)

export const SIM_BY_ID = new Map(SIMS.map((s) => [s.id, s]))

/** Task ids the simulator's objectives belong to, in blueprint order. */
export const simTasks = (sim: Sim): string[] => [...new Set(sim.objectives.map((o) => o.split('.').slice(0, 2).join('.')))].sort()
