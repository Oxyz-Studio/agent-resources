import { runRefundAgent, seededAgent } from '@/agents/refundAgent'
import type { RunRequest } from '@/lib/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * The candidate /run contract — this IS the endpoint deployed + listed on AgentBox.
 * id='live' -> real GMI small model; id='safe'|'risky' -> deterministic seeded agent.
 */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const body = (await req.json().catch(() => ({}))) as RunRequest
  if (!body?.ticket) {
    return Response.json({ error: 'missing ticket' }, { status: 400 })
  }
  const result = id === 'live' ? await runRefundAgent(body) : seededAgent(id, body)
  return Response.json(result)
}
