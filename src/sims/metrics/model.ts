// Metrics lab: a fraud model scores orders from 0 to 1, and every order at or
// above the threshold is flagged. The confusion matrix, the model metrics and
// an (invented) business cost follow from the threshold or from typed counts.
import { z } from 'zod'

const nonEmpty = z.string().trim().min(1)
const count = z.number().int().min(0)

export const paramsSchema = z.object({
  /** Orders per score band, lowest band first; each band starts at `from` and ends where the next starts. */
  bands: z
    .array(z.object({ from: z.number().min(0).max(1), fraud: count, legit: count }))
    .min(5)
    .refine((b) => b[0]!.from === 0 && b.every((x, i) => i === 0 || x.from > b[i - 1]!.from), { message: 'bands start at 0 and rise' }),
  /** Threshold the lab starts at. */
  threshold: z.number().min(0).max(1),
  /** Invented costs per order, labelled as illustrative. */
  costs: z.object({ missedFraud: z.number().positive(), falseAlarm: z.number().positive() }),
  /** Labels for the positive and negative class, e.g. "Fraud" and "Legitimate". */
  positive: nonEmpty,
  negative: nonEmpty,
})

export type MetricsParams = z.infer<typeof paramsSchema>
export type Band = MetricsParams['bands'][number]

export interface Confusion {
  tp: number
  fp: number
  fn: number
  tn: number
}

/** Orders in bands that start at or above the threshold are flagged. */
export function confusion(bands: readonly Band[], threshold: number): Confusion {
  const cm = { tp: 0, fp: 0, fn: 0, tn: 0 }
  for (const b of bands) {
    const flagged = b.from >= threshold - 1e-9
    if (flagged) {
      cm.tp += b.fraud
      cm.fp += b.legit
    } else {
      cm.fn += b.fraud
      cm.tn += b.legit
    }
  }
  return cm
}

export interface Metrics {
  accuracy: number
  /** NaN when nothing is flagged: there are no positive predictions to be right about. */
  precision: number
  /** NaN when there are no real positives. */
  recall: number
  f1: number
}

export function metrics({ tp, fp, fn, tn }: Confusion): Metrics {
  const total = tp + fp + fn + tn
  const precision = tp + fp === 0 ? NaN : tp / (tp + fp)
  const recall = tp + fn === 0 ? NaN : tp / (tp + fn)
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : tp + fp === 0 || tp + fn === 0 ? NaN : 0
  return { accuracy: total === 0 ? NaN : (tp + tn) / total, precision, recall, f1 }
}

export const businessCost = ({ fn, fp }: Confusion, costs: MetricsParams['costs']) => fn * costs.missedFraud + fp * costs.falseAlarm
