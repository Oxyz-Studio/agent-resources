import type { ModelTier, Usage } from '@/lib/types'

/**
 * Model registry. IDs are env-overridable and MUST be confirmed against
 * `GET {GMI_BASE_URL}/v1/models` on the day (don't ship an obsolete name).
 * Small model = the candidate worker + cheap probes; frontier = interrogator + judge.
 */
export const MODEL = {
  SMALL: {
    id: process.env.GMI_SMALL_MODEL ?? 'Qwen/Qwen2.5-7B-Instruct',
    tier: 'small' as ModelTier,
  },
  FRONTIER: {
    id: process.env.GMI_FRONTIER_MODEL ?? 'deepseek-ai/DeepSeek-V3.2',
    tier: 'frontier' as ModelTier,
  },
}

/** $ per 1M tokens [input, output]. Rough placeholders — refine with real GMI pricing. */
const PRICE: Record<ModelTier, { in: number; out: number }> = {
  small: { in: 0.1, out: 0.3 },
  frontier: { in: 0.6, out: 2.5 },
}

export function costUSD(tier: ModelTier, usage: Usage): number {
  const p = PRICE[tier]
  return (usage.prompt * p.in + usage.completion * p.out) / 1_000_000
}
