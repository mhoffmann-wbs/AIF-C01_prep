// Token cost calculator: monthly cost of one workload under on-demand,
// batch and Provisioned Throughput pricing, with prompt caching on demand.
// Every rate comes from params and is an illustrative example, not a price.
import { z } from 'zod'

const nonEmpty = z.string().trim().min(1)
const positive = z.number().positive()

export const workloadSchema = z.object({
  inputTokens: z.number().int().min(1),
  outputTokens: z.number().int().min(1),
  requestsPerDay: z.number().int().min(1),
  /** The repeated start of every prompt (instructions, a document) that caching can reuse; part of inputTokens. */
  cachedPrefix: z.number().int().min(0),
  /** Share of requests that find the prefix already in the cache. */
  hitRate: z.number().min(0).max(1),
})

export type Workload = z.infer<typeof workloadSchema>

export const paramsSchema = z.object({
  rates: z.object({
    /** Dollars per million tokens. */
    inputPerMillion: positive,
    outputPerMillion: positive,
    /** Share taken off on-demand prices for batch jobs. */
    batchDiscount: z.number().min(0).max(1),
    /** Dollars per model unit per hour. */
    unitPerHour: positive,
    /** Tokens per minute one model unit can handle. */
    unitTokensPerMinute: positive,
    /** Busiest minute as a multiple of the average minute; units are sized for it. */
    peakFactor: z.number().min(1),
    /** Multiples of the input rate for reading and writing cached tokens. */
    cacheRead: positive,
    cacheWrite: positive,
    /** Output speed, for the response-time estimate. */
    tokensPerSecond: positive,
  }),
  daysPerMonth: z.number().int().min(28).max(31),
  requestSteps: z.array(z.number().int().positive()).min(4),
  presets: z
    .array(
      z.object({
        id: z.string().regex(/^[a-z][a-z0-9-]*$/),
        label: nonEmpty,
        note: nonEmpty,
        /** Someone waits for each answer, so batch doesn't fit. */
        realtime: z.boolean(),
        workload: workloadSchema,
      }),
    )
    .min(2),
})

export type CostParams = z.infer<typeof paramsSchema>
export type Rates = CostParams['rates']

const M = 1_000_000

/** On-demand cost of one request, with prompt caching applied to the prefix. */
export function onDemandPerRequest(w: Workload, r: Rates): number {
  const prefix = Math.min(w.cachedPrefix, w.inputTokens)
  const plainInput = w.inputTokens - prefix
  const prefixFactor = w.hitRate * r.cacheRead + (1 - w.hitRate) * r.cacheWrite
  return ((plainInput + prefix * prefixFactor) * r.inputPerMillion + w.outputTokens * r.outputPerMillion) / M
}

/** Batch cost of one request: on-demand prices without caching, less the batch discount. */
export const batchPerRequest = (w: Workload, r: Rates) =>
  ((w.inputTokens * r.inputPerMillion + w.outputTokens * r.outputPerMillion) / M) * (1 - r.batchDiscount)

/** Model units needed to serve the busiest minute. */
export function unitsNeeded(w: Workload, r: Rates): number {
  const perMinute = (w.requestsPerDay * (w.inputTokens + w.outputTokens)) / (24 * 60)
  return Math.max(1, Math.ceil((perMinute * r.peakFactor) / r.unitTokensPerMinute))
}

export interface Monthly {
  onDemand: number
  /** Same request without the cache, to show what caching saves. */
  onDemandNoCache: number
  batch: number
  provisioned: number
  units: number
  requests: number
  /** Seconds to write the output at the illustrative speed. */
  outputSeconds: number
}

export function monthly(w: Workload, r: Rates, days: number): Monthly {
  const requests = w.requestsPerDay * days
  const units = unitsNeeded(w, r)
  return {
    onDemand: onDemandPerRequest(w, r) * requests,
    onDemandNoCache: onDemandPerRequest({ ...w, cachedPrefix: 0 }, r) * requests,
    batch: batchPerRequest(w, r) * requests,
    provisioned: units * r.unitPerHour * 24 * days,
    units,
    requests,
    outputSeconds: w.outputTokens / r.tokensPerSecond,
  }
}
