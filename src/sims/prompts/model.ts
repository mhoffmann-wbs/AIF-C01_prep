// Prompt technique compare: label the parts of a prompt, compare canned
// outputs of prompting techniques, and run prompt attacks with and without
// a guardrail's prompt attack filter. No model is called.
import { z } from 'zod'

const nonEmpty = z.string().trim().min(1)
const slug = z.string().regex(/^[a-z][a-z0-9-]*$/)

export const paramsSchema = z.object({
  parts: z.object({
    types: z.array(z.object({ id: slug, label: nonEmpty, hint: nonEmpty })).min(3),
    /** The prompt in order, each segment labelled with its part type. */
    segments: z.array(z.object({ text: nonEmpty, type: slug })).min(3),
  }),
  tasks: z
    .array(
      z.object({
        id: slug,
        label: nonEmpty,
        task: nonEmpty,
        techniques: z
          .array(z.object({ id: slug, name: nonEmpty, prompt: nonEmpty, output: nonEmpty, good: z.boolean(), note: nonEmpty }))
          .min(2),
      }),
    )
    .min(2),
  attacks: z
    .array(
      z.object({
        id: slug,
        risk: nonEmpty,
        what: nonEmpty,
        /** Text that reached the model some other way, e.g. a retrieved document. */
        hidden: nonEmpty.optional(),
        user: nonEmpty,
        undefended: nonEmpty,
        /** Whether the prompt attack filter on the tagged user input catches it. */
        filterCatches: z.boolean(),
        defense: nonEmpty,
      }),
    )
    .min(3),
  /** What the user sees when the guardrail blocks an input. */
  blockedMessage: nonEmpty,
})

export type PromptsParams = z.infer<typeof paramsSchema>
export type Attack = PromptsParams['attacks'][number]

/** Indexes of segments labelled correctly. */
export const correctParts = (segments: PromptsParams['parts']['segments'], labels: readonly (string | undefined)[]) =>
  segments.flatMap((s, i) => (labels[i] === s.type ? [i] : []))

/** What the user sees for an attack, with the filter on or off. */
export function attackOutcome(attack: Attack, filterOn: boolean, blockedMessage: string): { blocked: boolean; reply: string } {
  const blocked = filterOn && attack.filterCatches
  return { blocked, reply: blocked ? blockedMessage : attack.undefended }
}
