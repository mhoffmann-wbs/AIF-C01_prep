// Next-token sampler: a toy distribution over possible next words, reshaped by
// temperature, top K and top P. This toy applies temperature first, then
// top K, then top P, and renormalizes what is left.
import { z } from 'zod'
import type { Rng } from '../../quiz/random'

const nonEmpty = z.string().trim().min(1)

export const paramsSchema = z.object({
  scenarios: z
    .array(
      z
        .object({
          id: z.string().regex(/^[a-z][a-z0-9-]*$/),
          label: nonEmpty,
          /** The text before the blank the model fills. */
          prompt: nonEmpty,
          /** What this use case wants, e.g. "one correct fact" or "variety". */
          goal: nonEmpty,
          /** Possible next words and their probabilities at temperature 1, most likely first. */
          tokens: z.array(z.object({ text: nonEmpty, p: z.number().positive() })).min(4).max(10),
        })
        .refine((s) => Math.abs(s.tokens.reduce((sum, t) => sum + t.p, 0) - 1) < 0.005, { message: 'token probabilities must add up to 1' })
        .refine((s) => s.tokens.every((t, i) => i === 0 || t.p <= s.tokens[i - 1]!.p), { message: 'list tokens from most to least likely' }),
    )
    .min(2),
  /** Number of completions one click generates. */
  samples: z.number().int().min(3).max(20),
})

export type SamplerParams = z.infer<typeof paramsSchema>

export interface Settings {
  temperature: number
  topK: number
  topP: number
}

export interface Shaped {
  text: string
  /** Probability at temperature 1 with no cut-off. */
  base: number
  /** Probability after the settings; 0 when cut off. */
  p: number
  kept: boolean
}

/** Applies the settings to the token list (most likely first). Temperature 0 always picks the top token. */
export function reshape(tokens: readonly { text: string; p: number }[], { temperature, topK, topP }: Settings): Shaped[] {
  const weights =
    temperature <= 0 ? tokens.map((_, i) => (i === 0 ? 1 : 0)) : tokens.map((t) => Math.exp(Math.log(t.p) / temperature))
  const total = weights.reduce((a, b) => a + b, 0)
  const scaled = weights.map((w) => w / total)
  // Tokens are sorted, so top K keeps a prefix, and so does top P: the
  // smallest prefix whose probabilities reach P (always at least one token).
  const kept: boolean[] = []
  let cumulative = 0
  scaled.forEach((p, i) => {
    const keep = i < topK && (i === 0 || cumulative < topP - 1e-9) && p > 0
    kept.push(keep)
    if (keep) cumulative += p
  })
  const keptTotal = scaled.reduce((sum, p, i) => sum + (kept[i] ? p : 0), 0)
  return tokens.map((t, i) => ({ text: t.text, base: t.p, p: kept[i] ? scaled[i]! / keptTotal : 0, kept: kept[i]! }))
}

/** Draws one token index from the reshaped distribution. */
export function sample(shaped: readonly Shaped[], rng: Rng = Math.random): number {
  let r = rng()
  for (let i = 0; i < shaped.length; i++) {
    r -= shaped[i]!.p
    if (r < 0 && shaped[i]!.kept) return i
  }
  return shaped.findLastIndex((s) => s.kept)
}
