import { describe, expect, it } from 'vitest'
import data from '../../content/sims/cost.json'
import { batchPerRequest, monthly, onDemandPerRequest, paramsSchema, unitsNeeded } from './model'

const params = paramsSchema.parse(data.params)
const r = params.rates
const preset = (id: string) => params.presets.find((p) => p.id === id)!.workload
const plain = { inputTokens: 1000, outputTokens: 200, requestsPerDay: 1000, cachedPrefix: 0, hitRate: 0 }

describe('token cost calculator', () => {
  it('prices input and output tokens separately per million', () => {
    expect(onDemandPerRequest(plain, r)).toBeCloseTo((1000 * 3 + 200 * 15) / 1e6)
  })

  it('takes the batch discount off the uncached price', () => {
    expect(batchPerRequest(plain, r)).toBeCloseTo(onDemandPerRequest(plain, r) / 2)
  })

  it('charges cache writes above and cache reads below the input rate', () => {
    const allMisses = onDemandPerRequest({ ...plain, cachedPrefix: 800, hitRate: 0 }, r)
    const allHits = onDemandPerRequest({ ...plain, cachedPrefix: 800, hitRate: 1 }, r)
    expect(allMisses).toBeGreaterThan(onDemandPerRequest(plain, r))
    expect(allHits).toBeCloseTo(((200 + 800 * 0.1) * 3 + 200 * 15) / 1e6)
  })

  it('sizes model units for the busiest minute, at least one', () => {
    expect(unitsNeeded(plain, r)).toBe(1)
    expect(unitsNeeded(preset('steady'), r)).toBe(3)
  })

  it('makes each preset tell its story', () => {
    const chat = monthly(preset('chat'), r, params.daysPerMonth)
    expect(chat.onDemand).toBeLessThan(chat.onDemandNoCache / 1.5)
    expect(chat.provisioned).toBeGreaterThan(chat.onDemand * 10)
    const catalog = monthly(preset('catalog'), r, params.daysPerMonth)
    expect(catalog.batch).toBeLessThan(catalog.onDemand)
    const steady = monthly(preset('steady'), r, params.daysPerMonth)
    expect(steady.provisioned).toBeLessThan(steady.onDemand)
  })
})
