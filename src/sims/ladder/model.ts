// Customization ladder: the ways to adapt a foundation model, cheapest first,
// and a rule that maps a use case's needs to the lowest rung that meets them.
import { z } from 'zod'

const nonEmpty = z.string().trim().min(1)

export const RUNGS = ['prompting', 'rag', 'fine-tuning', 'distillation', 'continued', 'pretraining'] as const
export type Rung = (typeof RUNGS)[number]

export const NEEDS = ['facts', 'behaviour', 'cheaper', 'domain', 'newModel'] as const
export type Need = (typeof NEEDS)[number]

const rung = z.enum(RUNGS)

export const paramsSchema = z.object({
  rungs: z
    .array(
      z.object({
        id: rung,
        name: nonEmpty,
        what: nonEmpty,
        data: nonEmpty,
        costs: nonEmpty,
        /** Relative cost and effort, 1 to 5, for the ladder drawing. */
        level: z.number().int().min(1).max(5),
        /** Changes the model's weights. */
        trains: z.boolean(),
      }),
    )
    .length(RUNGS.length),
  needs: z.array(z.object({ id: z.enum(NEEDS), label: nonEmpty })).length(NEEDS.length),
  scenarios: z
    .array(z.object({ id: z.string().regex(/^[a-z][a-z0-9-]*$/), text: nonEmpty, needs: z.array(z.enum(NEEDS)), answer: rung, why: nonEmpty }))
    .min(8),
})

export type LadderParams = z.infer<typeof paramsSchema>

/**
 * The rung a set of needs points to. The heaviest need decides: building a
 * new model, then teaching a whole field's language, then making a model
 * cheaper, then consistent behaviour from labeled examples, then your own
 * facts. With no special need, prompting is enough.
 */
export function recommend(needs: readonly Need[]): Rung {
  const has = (n: Need) => needs.includes(n)
  if (has('newModel')) return 'pretraining'
  if (has('domain')) return 'continued'
  if (has('cheaper')) return 'distillation'
  if (has('behaviour')) return 'fine-tuning'
  if (has('facts')) return 'rag'
  return 'prompting'
}
