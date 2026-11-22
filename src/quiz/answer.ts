import type { Item } from '../content/schema'
import { type Response, emptyResponse } from './grade'
import { scrambledOrder } from './random'

/** A blank response; ordering items start scrambled (never already correct). */
export function freshResponse(item: Item): Response {
  if (item.kind !== 'order') return emptyResponse(item)
  const identity = item.steps.map((_, i) => i)
  return emptyResponse(item, scrambledOrder(item.steps.length, [identity]))
}
