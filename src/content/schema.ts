// Zod schema for question-bank items. Items live as JSON arrays in
// src/content/questions/<taskId>.json and are rendered generically.
// Cross-checks against the blueprint and the service catalog (task, objective
// and service ids) live in the content tests, so this file stays independent
// of that data.
import { z } from 'zod'

const nonEmpty = z.string().trim().min(1)

const TASK_ID = /^[1-5]\.[1-4]$/

const option = z.object({
  text: nonEmpty,
  correct: z.boolean(),
  /** Why this option is right, or why it misses the stated constraint. */
  rationale: nonEmpty,
})

export const COUNT_WORDS = ['', 'ONE', 'TWO', 'THREE', 'FOUR'] as const

/** Fields every choice question has, including case-study parts. */
const choiceBase = {
  /** Objective ids this question tests, e.g. ["3.2.4"]. */
  objectives: z.array(z.string().regex(/^[1-5]\.[1-4]\.\d+$/)).min(1),
  stem: nonEmpty,
  explanation: nonEmpty,
}

const singleBody = z.object({
  ...choiceBase,
  kind: z.literal('single'),
  options: z.array(option).length(4),
})

const multiBody = z.object({
  ...choiceBase,
  kind: z.literal('multi'),
  /** How many options to pick; the stem must say "(Select TWO.)" etc. */
  select: z.number().int().min(2).max(3),
  options: z.array(option).min(5).max(6),
})

const base = {
  /** `${taskId}-NNN`, e.g. "3.2-014". */
  id: z.string().regex(/^[1-5]\.[1-4]-\d{3}$/),
  taskId: z.string().regex(TASK_ID),
  /** Catalog ids of the AWS services the item is about (services.ts). */
  services: z.array(z.string()).optional(),
  /** AWS documentation backing facts such as quotas, prices or model details. */
  sourceLinks: z.array(z.url()).optional(),
}

const single = singleBody.extend(base)
const multi = multiBody.extend(base)

const order = z.object({
  ...base,
  ...choiceBase,
  kind: z.literal('order'),
  /** The steps in the correct order; the learner starts from a scrambled order. */
  steps: z.array(nonEmpty).min(3).max(5),
})

const match = z.object({
  ...base,
  ...choiceBase,
  kind: z.literal('match'),
  /** Each prompt and the response it matches. */
  pairs: z.array(z.object({ prompt: nonEmpty, answer: nonEmpty })).min(3).max(5),
  /** Extra responses that match no prompt. */
  distractors: z.array(nonEmpty).max(3).optional(),
})

const casePart = z.discriminatedUnion('kind', [singleBody, multiBody])

const caseStudy = z.object({
  ...base,
  kind: z.literal('case'),
  /** Shared scenario shown above every part. */
  scenario: nonEmpty,
  /** Each part is scored separately, as on the exam. */
  parts: z.array(casePart).min(2).max(4),
})

type ChoiceLike = { kind: 'single' | 'multi'; stem: string; options: { text: string; correct: boolean }[]; select?: number }

function checkChoice(q: ChoiceLike, ctx: z.RefinementCtx, path: (string | number)[]) {
  const correct = q.options.filter((o) => o.correct).length
  const want = q.kind === 'single' ? 1 : q.select!
  if (correct !== want) ctx.addIssue({ code: 'custom', path, message: `has ${correct} correct options, expected ${want}` })
  if (q.kind === 'multi' && !q.stem.includes(`(Select ${COUNT_WORDS[want]}.)`))
    ctx.addIssue({ code: 'custom', path, message: `stem must say "(Select ${COUNT_WORDS[want]}.)"` })
  const texts = q.options.map((o) => o.text.trim().toLowerCase())
  if (new Set(texts).size !== texts.length) ctx.addIssue({ code: 'custom', path, message: 'has duplicate options' })
}

export const itemSchema = z.discriminatedUnion('kind', [single, multi, order, match, caseStudy]).superRefine((item, ctx) => {
  if (!item.id.startsWith(`${item.taskId}-`)) ctx.addIssue({ code: 'custom', path: ['id'], message: `id must start with "${item.taskId}-"` })
  switch (item.kind) {
    case 'single':
    case 'multi':
      checkChoice(item, ctx, ['options'])
      break
    case 'case':
      item.parts.forEach((part, i) => checkChoice(part, ctx, ['parts', i]))
      break
    case 'order':
      if (new Set(item.steps).size !== item.steps.length) ctx.addIssue({ code: 'custom', path: ['steps'], message: 'has duplicate steps' })
      break
    case 'match': {
      const responses = [...item.pairs.map((p) => p.answer), ...(item.distractors ?? [])]
      if (new Set(responses).size !== responses.length)
        ctx.addIssue({ code: 'custom', path: ['pairs'], message: 'every prompt needs its own response, distinct from the distractors' })
      break
    }
  }
})

export const itemFileSchema = z.array(itemSchema)

export type Item = z.infer<typeof itemSchema>
export type ItemKind = Item['kind']
export type ChoiceQuestion = z.infer<typeof casePart>

/** MC and MR are the core; the rest sit behind the extended-kinds toggle. */
export const EXTENDED_KINDS: readonly ItemKind[] = ['order', 'match', 'case']
export const isExtended = (item: Item) => EXTENDED_KINDS.includes(item.kind)

/** Objective ids an item tests (case items: the union of their parts'). */
export const itemObjectives = (item: Item): string[] =>
  item.kind === 'case' ? [...new Set(item.parts.flatMap((p) => p.objectives))] : item.objectives

/** Scored questions an item counts as: one per case part, otherwise one. */
export const scoredCount = (item: Item) => (item.kind === 'case' ? item.parts.length : 1)
