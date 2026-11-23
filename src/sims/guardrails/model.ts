// Guardrails configurator: a guardrail's settings applied to canned chatbot
// exchanges. Detection results (content-filter confidence, denied topics,
// PII spans, grounding scores) are written into the data; the policy logic
// follows the Amazon Bedrock Guardrails documentation: the input is checked
// first, and a blocked input never reaches the model.
import { z } from 'zod'

const nonEmpty = z.string().trim().min(1)
const slug = z.string().regex(/^[a-z][a-z0-9-]*$/)

export const STRENGTHS = ['none', 'low', 'medium', 'high'] as const
export type Strength = (typeof STRENGTHS)[number]
export const CONFIDENCES = ['low', 'medium', 'high'] as const
export type Confidence = (typeof CONFIDENCES)[number]
export type PiiAction = 'off' | 'mask' | 'block'
type Where = 'input' | 'output'

const where = z.enum(['input', 'output'])

export const configSchema = z.object({
  content: z.record(z.string(), z.enum(STRENGTHS)),
  topics: z.array(slug),
  words: z.array(nonEmpty),
  pii: z.record(z.string(), z.enum(['off', 'mask', 'block'])),
  /** 0 means the contextual grounding check is off. */
  grounding: z.number().min(0).max(0.99),
  relevance: z.number().min(0).max(0.99),
})

export type GuardrailConfig = z.infer<typeof configSchema>

export const paramsSchema = z.object({
  categories: z.array(z.object({ id: nonEmpty, label: nonEmpty, inputOnly: z.boolean().optional() })).min(2),
  topics: z.array(z.object({ id: slug, name: nonEmpty, definition: nonEmpty })).min(1),
  words: z.array(nonEmpty).min(1),
  entities: z.array(z.object({ id: z.string().regex(/^[A-Z_]+$/), label: nonEmpty })).min(2),
  /** The source text the grounding check compares answers with. */
  source: nonEmpty,
  /** Cairnway's own setup, one click away. */
  preset: configSchema,
  blockedInput: nonEmpty,
  blockedOutput: nonEmpty,
  exchanges: z
    .array(
      z.object({
        id: slug,
        label: nonEmpty,
        user: nonEmpty,
        response: nonEmpty,
        content: z.array(z.object({ category: nonEmpty, confidence: z.enum(CONFIDENCES), where })).default([]),
        topics: z.array(z.object({ topic: slug, where })).default([]),
        pii: z.array(z.object({ entity: nonEmpty, text: nonEmpty, where })).default([]),
        /** Contextual grounding scores of the response against the source, 0 to 1. */
        grounding: z.number().min(0).max(1),
        relevance: z.number().min(0).max(1),
      }),
    )
    .min(5),
})

export type GuardrailsParams = z.infer<typeof paramsSchema>
export type Exchange = GuardrailsParams['exchanges'][number]

/** Low strength blocks HIGH-confidence findings, medium adds MEDIUM, high adds LOW; none blocks nothing. */
export const blocksAt = (strength: Strength, confidence: Confidence) =>
  strength !== 'none' && CONFIDENCES.indexOf(confidence) >= CONFIDENCES.length - STRENGTHS.indexOf(strength)

/** Whole words or phrases, ignoring case. */
export const containsWord = (text: string, word: string) =>
  new RegExp(`(^|[^\\p{L}\\p{N}])${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^\\p{L}\\p{N}])`, 'iu').test(text)

export interface Outcome {
  /** What the user typed, as the model received it (masked where configured). */
  input: string
  /** What the user sees. */
  reply: string
  blocked: Where | null
  /** One line per policy that acted. */
  reasons: string[]
}

const STRENGTH_LABEL: Record<Strength, string> = { none: 'None', low: 'Low', medium: 'Medium', high: 'High' }

export function applyGuardrail(ex: Exchange, config: GuardrailConfig, params: GuardrailsParams): Outcome {
  function check(text: string, side: Where): { text: string; blocks: string[]; masks: string[] } {
    const blocks: string[] = []
    const masks: string[] = []
    for (const f of ex.content.filter((c) => c.where === side)) {
      const strength = config.content[f.category] ?? 'none'
      if (blocksAt(strength, f.confidence))
        blocks.push(`Content filter: ${f.category} found with ${f.confidence.toUpperCase()} confidence; strength ${STRENGTH_LABEL[strength]} blocks it.`)
    }
    for (const t of ex.topics.filter((x) => x.where === side && config.topics.includes(x.topic)))
      blocks.push(`Denied topic: ${params.topics.find((p) => p.id === t.topic)?.name ?? t.topic}.`)
    for (const word of config.words.filter((w) => containsWord(text, w))) blocks.push(`Word filter: “${word}”.`)
    let masked = text
    for (const p of ex.pii.filter((x) => x.where === side)) {
      const action = config.pii[p.entity] ?? 'off'
      if (action === 'block') blocks.push(`Sensitive information filter: ${p.entity} is set to block.`)
      if (action === 'mask' && masked.includes(p.text)) {
        masked = masked.split(p.text).join(`{${p.entity}}`)
        masks.push(`Sensitive information filter: ${p.entity} masked.`)
      }
    }
    return { text: masked, blocks, masks }
  }

  const input = check(ex.user, 'input')
  if (input.blocks.length > 0) return { input: ex.user, reply: params.blockedInput, blocked: 'input', reasons: [...input.blocks, 'The model was never called.'] }

  const output = check(ex.response, 'output')
  if (config.grounding > 0 && ex.grounding < config.grounding)
    output.blocks.push(`Contextual grounding check: grounding ${ex.grounding.toFixed(2)} is below the threshold ${config.grounding.toFixed(2)}.`)
  if (config.relevance > 0 && ex.relevance < config.relevance)
    output.blocks.push(`Contextual grounding check: relevance ${ex.relevance.toFixed(2)} is below the threshold ${config.relevance.toFixed(2)}.`)
  if (output.blocks.length > 0) return { input: input.text, reply: params.blockedOutput, blocked: 'output', reasons: [...input.masks, ...output.blocks] }
  return { input: input.text, reply: output.text, blocked: null, reasons: [...input.masks, ...output.masks] }
}

/** Everything switched off. */
export const emptyConfig = (params: GuardrailsParams): GuardrailConfig => ({
  content: Object.fromEntries(params.categories.map((c) => [c.id, 'none'])),
  topics: [],
  words: [],
  pii: Object.fromEntries(params.entities.map((e) => [e.id, 'off'])),
  grounding: 0,
  relevance: 0,
})
