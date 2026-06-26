import type { RunRequest, RunResponse, Usage } from '@/lib/types'
import { runRefundAgent, seededAgent } from '@/agents/refundAgent'

/**
 * The risk isolator for the mandatory AgentBox dependency. One seam:
 *   live + AGENTBOX_CANDIDATE_URL set -> call the really-listed agent
 *   live, no URL (or fetch fails)     -> local GMI small-model fallback
 *   seeded ids                        -> deterministic behavior
 * Replay never reaches here (the engine uses recorded responses).
 */
export async function callCandidate(
  candidateId: string,
  req: RunRequest,
): Promise<{ response: RunResponse; usage: Usage; latencyMs: number }> {
  if (candidateId === 'live') {
    const url = process.env.AGENTBOX_CANDIDATE_URL
    if (url) {
      const start = Date.now()
      try {
        const res = await fetch(`${url.replace(/\/$/, '')}/run`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(req),
        })
        const data = await res.json()
        const response: RunResponse = data.response ?? data
        const usage: Usage = data.usage ?? { prompt: 0, completion: 0, total: 0 }
        return { response, usage, latencyMs: Date.now() - start }
      } catch {
        return runRefundAgent(req) // AgentBox flakiness never breaks the demo
      }
    }
    return runRefundAgent(req)
  }
  return seededAgent(candidateId, req)
}
