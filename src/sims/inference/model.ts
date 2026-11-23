// Inference mode chooser: four yes/no style requirements decide between
// real-time, serverless, asynchronous and batch inference, and workload cards
// carry their requirements so tests can check each card against the rules.
import { z } from 'zod'

const nonEmpty = z.string().trim().min(1)

export const MODES = ['realtime', 'serverless', 'async', 'batch'] as const
export type Mode = (typeof MODES)[number]

export const requirementsSchema = z.object({
  /** One request at a time, or a whole data set in one go. */
  scope: z.enum(['request', 'dataset']),
  /** The caller needs the answer straight away, or can collect it later. */
  wait: z.enum(['now', 'later']),
  /** Normal requests, or large payloads and long processing. */
  size: z.enum(['small', 'large']),
  /** Busy all day, or quiet for long stretches. */
  traffic: z.enum(['steady', 'idle']),
})

export type Requirements = z.infer<typeof requirementsSchema>

const mode = z.enum(MODES)

export const paramsSchema = z.object({
  modes: z.array(z.object({ id: mode, name: nonEmpty, summary: nonEmpty, clue: nonEmpty })).length(4),
  workloads: z
    .array(z.object({ id: z.string().regex(/^[a-z][a-z0-9-]*$/), text: nonEmpty, requirements: requirementsSchema, answer: mode, why: nonEmpty }))
    .min(8),
})

export type InferenceParams = z.infer<typeof paramsSchema>

/** The mode the requirements point to, with the deciding reason. */
export function recommend(r: Requirements): { mode: Mode; reason: string } {
  if (r.scope === 'dataset')
    return { mode: 'batch', reason: 'A whole data set is scored in one job, and no endpoint has to stay running afterwards.' }
  if (r.size === 'large' || r.wait === 'later')
    return { mode: 'async', reason: 'Requests wait in a queue and the result is delivered when ready, which suits large or slow jobs.' }
  if (r.traffic === 'idle')
    return { mode: 'serverless', reason: 'Capacity is provided on demand, so you pay little while idle and accept a short cold start.' }
  return { mode: 'realtime', reason: 'An always-on endpoint answers each request immediately, which suits steady, interactive traffic.' }
}
