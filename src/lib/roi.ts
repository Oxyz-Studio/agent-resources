import type { ModelTier, Usage } from '@/lib/types'
import { costUSD } from '@/gmi/models'

export type GmiCallRecord = { tier: ModelTier; usage: Usage }

/** The ONE traceable ROI number, derived from real recorded telemetry. */
export function computeROI(input: {
  verdictsLeakUSD: number
  proxyBlockedUSD: number
  calls: GmiCallRecord[]
}): {
  leakPreventedUSD: number
  routingSavingsUSD: number
  totalTokens: number
  headlineUSD: number
} {
  const leakPreventedUSD = input.verdictsLeakUSD + input.proxyBlockedUSD

  const actual = input.calls.reduce((s, c) => s + costUSD(c.tier, c.usage), 0)
  const allFrontier = input.calls.reduce((s, c) => s + costUSD('frontier', c.usage), 0)
  const routingSavingsUSD = Math.max(0, allFrontier - actual)

  const totalTokens = input.calls.reduce((s, c) => s + c.usage.total, 0)

  return {
    leakPreventedUSD: round2(leakPreventedUSD),
    routingSavingsUSD: round4(routingSavingsUSD),
    totalTokens,
    headlineUSD: round2(leakPreventedUSD),
  }
}

const round2 = (n: number) => Math.round(n * 100) / 100
const round4 = (n: number) => Math.round(n * 10000) / 10000
