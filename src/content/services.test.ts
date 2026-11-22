import { describe, expect, it } from 'vitest'
import { IN_SCOPE_SERVICES, OUT_OF_SCOPE_SERVICES, SERVICES, SERVICE_BY_ID } from './services'

describe('service catalog', () => {
  it('has unique ids and names', () => {
    expect(SERVICE_BY_ID.size).toBe(SERVICES.length)
    expect(new Set(SERVICES.map((s) => s.name)).size).toBe(SERVICES.length)
    for (const s of SERVICES) expect(s.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
  })

  it('lists the guide v1.2 services: 51 in scope, 93 out of scope', () => {
    expect(IN_SCOPE_SERVICES).toHaveLength(51)
    expect(OUT_OF_SCOPE_SERVICES).toHaveLength(93)
  })

  it('describes and links every in-scope service and feature', () => {
    for (const s of SERVICES.filter((x) => x.inScope)) {
      expect(s.oneLiner, s.id).toBeTruthy()
      expect(s.url, s.id).toMatch(/^https:\/\//)
    }
  })

  it('points every feature at an in-scope parent service', () => {
    for (const s of SERVICES.filter((x) => x.featureOf !== undefined)) expect(SERVICE_BY_ID.get(s.featureOf!)?.inScope, s.id).toBe(true)
  })
})
