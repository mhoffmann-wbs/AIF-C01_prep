import { describe, expect, it } from 'vitest'
import data from '../../content/sims/guardrails.json'
import { applyGuardrail, blocksAt, containsWord, emptyConfig, paramsSchema } from './model'

const params = paramsSchema.parse(data.params)
const ex = (id: string) => params.exchanges.find((e) => e.id === id)!
const off = emptyConfig(params)
const run = (id: string, config = off) => applyGuardrail(ex(id), config, params)

describe('guardrails configurator', () => {
  it('follows the AWS filter-strength table', () => {
    expect(['low', 'medium', 'high'].filter((c) => blocksAt('none', c as never))).toEqual([])
    expect(['low', 'medium', 'high'].filter((c) => blocksAt('low', c as never))).toEqual(['high'])
    expect(['low', 'medium', 'high'].filter((c) => blocksAt('medium', c as never))).toEqual(['medium', 'high'])
    expect(['low', 'medium', 'high'].filter((c) => blocksAt('high', c as never))).toEqual(['low', 'medium', 'high'])
  })

  it('matches word filters as whole words, ignoring case', () => {
    expect(containsWord('Is summit co cheaper?', 'Summit Co')).toBe(true)
    expect(containsWord('Summit Cove campsite', 'Summit Co')).toBe(false)
  })

  it('lets everything through when switched off', () => {
    expect(params.exchanges.filter((e) => applyGuardrail(e, off, params).blocked)).toEqual([])
  })

  it('needs high strength for a low-confidence insult', () => {
    expect(run('mild', { ...off, content: { ...off.content, Insults: 'medium' } }).blocked).toBeNull()
    expect(run('mild', { ...off, content: { ...off.content, Insults: 'high' } }).blocked).toBe('input')
    expect(run('abuse', { ...off, content: { ...off.content, Insults: 'low' } }).blocked).toBe('input')
  })

  it('blocks a blocked input before the model answers', () => {
    const out = run('medical', { ...off, topics: ['medical'] })
    expect(out).toMatchObject({ blocked: 'input', reply: params.blockedInput })
    expect(out.reasons.at(-1)).toMatch(/never called/)
  })

  it('masks PII with its type, or blocks the message', () => {
    const masked = run('pii', { ...off, pii: { ...off.pii, NAME: 'mask', EMAIL: 'mask' } })
    expect(masked.blocked).toBeNull()
    expect(masked.input).toBe("My order hasn't arrived. I'm {NAME}, {EMAIL}, phone 555-0142.")
    expect(masked.reply).toMatch(/^Thanks, \{NAME\}\. I found the order for \{EMAIL\}\./)
    expect(run('pii', { ...off, pii: { ...off.pii, PHONE: 'block' } }).blocked).toBe('input')
  })

  it('blocks ungrounded and irrelevant answers with the grounding check', () => {
    expect(run('hallucination', { ...off, grounding: 0.7 }).blocked).toBe('output')
    expect(run('off-topic', { ...off, grounding: 0.7 }).blocked).toBeNull()
    expect(run('off-topic', { ...off, relevance: 0.5 }).blocked).toBe('output')
  })

  it("lets ordinary questions through Cairnway's own setup and stops the rest", () => {
    const passed = params.exchanges.filter((e) => !applyGuardrail(e, params.preset, params).blocked).map((e) => e.id)
    expect(passed.sort()).toEqual(['mild', 'normal', 'pii'])
  })
})
