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

/** The text that identifies an item in lists: its stem, or a case study's scenario. */
export const itemSummary = (item: Item) => (item.kind === 'case' ? item.scenario : item.stem)

/** Domains lessons may link to: AWS documentation and product pages, and the sites of AWS-built tools. */
const LESSON_LINK = /^https:\/\/(docs\.aws\.amazon\.com|aws\.amazon\.com|kiro\.dev|strandsagents\.com|modelcontextprotocol\.io)\//

export const lessonMetaSchema = z.object({
  taskId: z.string().regex(TASK_ID),
  /** Date the lesson's AWS facts were last checked. */
  updated: z.iso.date(),
  /** One or two sentences: what the learner must take away. */
  tldr: nonEmpty,
  /** Objective ids the lesson teaches; a content test requires all of the task's. */
  objectivesCovered: z.array(z.string()).min(1),
  /** Sources for the lesson's AWS facts. */
  links: z.array(z.object({ title: nonEmpty, url: z.url().regex(LESSON_LINK) })).min(1),
})

export type LessonMeta = z.infer<typeof lessonMetaSchema>

/** A print-ready guide (src/content/guides/<slug>.mdx), e.g. the cheat sheet. */
export const guideMetaSchema = z.object({
  slug: z.string().regex(/^[a-z-]+$/),
  title: nonEmpty,
  /** Date the guide's facts were last checked against the exam guide and AWS pages. */
  updated: z.iso.date(),
  summary: nonEmpty,
  links: z.array(z.object({ title: nonEmpty, url: z.url().regex(LESSON_LINK) })).min(1),
})

export type GuideMeta = z.infer<typeof guideMetaSchema>

// Service-matcher drills (src/content/drills/<deckId>.json). Card ids are
// `<deckId>-NN` and are stored in progress, so never renumber or reuse one.

const drillBase = {
  id: z.string().regex(/^[a-z][a-z0-9-]*$/),
  title: nonEmpty,
  /** One sentence on what the deck drills. */
  description: nonEmpty,
  /** Tasks whose lessons link to the deck. */
  tasks: z.array(z.string().regex(TASK_ID)).min(1),
  sourceLinks: z.array(z.url().regex(LESSON_LINK)).optional(),
}

/** "Which service?": a scenario and four services to pick from. */
const whichDeck = z.object({
  ...drillBase,
  kind: z.literal('which'),
  cards: z
    .array(
      z.object({
        id: z.string(),
        prompt: nonEmpty,
        /** Service id of the answer. */
        answer: nonEmpty,
        /** Exactly three service ids that each miss the scenario. */
        distractors: z.array(nonEmpty).length(3),
        /** Optional note on why the answer fits, shown after the pick. */
        why: nonEmpty.optional(),
      }),
    )
    .min(8),
})

/** Sorter: put each item into one of 2–4 buckets. */
const sortDeck = z.object({
  ...drillBase,
  kind: z.literal('sort'),
  buckets: z.array(z.object({ id: nonEmpty, label: nonEmpty })).min(2).max(4),
  items: z.array(z.object({ id: z.string(), text: nonEmpty, bucket: nonEmpty, why: nonEmpty })).min(8),
})

export const drillDeckSchema = z.discriminatedUnion('kind', [whichDeck, sortDeck]).superRefine((deck, ctx) => {
  const ids = deck.kind === 'which' ? deck.cards.map((c) => c.id) : deck.items.map((i) => i.id)
  ids.forEach((id, i) => {
    if (id !== `${deck.id}-${String(i + 1).padStart(2, '0')}`)
      ctx.addIssue({ code: 'custom', message: `card ${i + 1} must have id ${deck.id}-${String(i + 1).padStart(2, '0')}, not ${id}` })
  })
  if (deck.kind === 'which')
    for (const c of deck.cards)
      if (new Set([c.answer, ...c.distractors]).size !== 4) ctx.addIssue({ code: 'custom', message: `${c.id}: the four services must differ` })
  if (deck.kind === 'sort') {
    const buckets = new Set(deck.buckets.map((b) => b.id))
    for (const i of deck.items) if (!buckets.has(i.bucket)) ctx.addIssue({ code: 'custom', message: `${i.id}: unknown bucket ${i.bucket}` })
  }
})

export type DrillDeck = z.infer<typeof drillDeckSchema>
export type WhichDeck = Extract<DrillDeck, { kind: 'which' }>
export type SortDeck = Extract<DrillDeck, { kind: 'sort' }>

// Built-in flashcards (src/content/flashcards/<taskId>.json). Card ids are
// `<taskId>-cNN` in file order and are stored in progress, so append, never
// renumber. Service cards are generated from the catalog, not written here.
export const cardSchema = z
  .object({
    id: z.string().regex(/^[1-5]\.[1-4]-c\d{2}$/),
    objectiveId: z.string().regex(/^[1-5]\.[1-4]\.\d+$/),
    front: nonEmpty,
    back: nonEmpty,
  })
  .superRefine((card, ctx) => {
    if (!card.objectiveId.startsWith(`${card.id.split('-')[0]}.`))
      ctx.addIssue({ code: 'custom', message: 'objectiveId must belong to the task in the id', path: ['objectiveId'] })
  })

export const cardFileSchema = z.array(cardSchema)

export type Card = z.infer<typeof cardSchema>

// Concept simulators (src/content/sims/<simId>.json). The interactive part is
// a component in src/sims/, registered in src/sims/registry.ts with a Zod
// schema for its `params`; the copy and the parameters stay here as data.
export const simSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9-]*$/),
  title: nonEmpty,
  /** One sentence for the simulator list. */
  description: nonEmpty,
  /** What to try first, shown above the simulator. */
  intro: nonEmpty,
  /** Objective ids the simulator teaches; lessons of their tasks link to it. */
  objectives: z.array(z.string().regex(/^[1-5]\.[1-4]\.\d+$/)).min(1),
  /** Exam-relevant points, shown below the simulator. */
  takeaways: z.array(nonEmpty).min(2),
  /** 2–3 single or multi bank items for "Now you try"; each tests one of the objectives. */
  tryItems: z.array(z.string()).min(2).max(3),
  /** Sources for any AWS fact the simulator states. */
  links: z.array(z.object({ title: nonEmpty, url: z.url().regex(LESSON_LINK) })).optional(),
  /** Simulator-specific copy and parameters, validated by the registry's schema. */
  params: z.unknown(),
})

export type Sim = z.infer<typeof simSchema>
