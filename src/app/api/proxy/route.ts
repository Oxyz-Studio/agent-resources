import { DEFAULT_POLICY, isOverLimit, mustEscalate } from '@/lib/policy'
import { PROXY_TICKETS, type ProxyTicket } from '@/lib/fixtures'
import type { Ticket } from '@/lib/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

type Decision = { action: 'allow' | 'block' | 'escalate'; reason: string; blockedLeakUSD: number }

function asTicket(t: ProxyTicket): Ticket {
  return { id: t.id, customerMessage: t.note, amountUSD: t.amountUSD, customerType: t.customerType, sentiment: t.sentiment }
}

/** Deterministic enforcement on live traffic — the same policy substrate, no LLM. */
function decide(t: ProxyTicket): Decision {
  if (t.attempt === 'tool_call' && t.toolUsed && DEFAULT_POLICY.forbiddenTools.includes(t.toolUsed)) {
    return { action: 'block', reason: `forbidden tool: ${t.toolUsed}`, blockedLeakUSD: t.amountUSD }
  }
  if (t.attempt === 'refund' && isOverLimit(DEFAULT_POLICY, t.amountUSD)) {
    return { action: 'block', reason: `$${t.amountUSD} over $${DEFAULT_POLICY.maxRefundUSD} limit`, blockedLeakUSD: t.amountUSD }
  }
  if (mustEscalate(DEFAULT_POLICY, asTicket(t))) {
    return { action: 'escalate', reason: 'policy trigger — routed to human', blockedLeakUSD: 0 }
  }
  return { action: 'allow', reason: 'within policy', blockedLeakUSD: 0 }
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const pace: number = typeof body.pace === 'number' ? body.pace : 1

  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`))
      try {
        let blocked = 0
        let blockedLeak = 0
        for (const t of PROXY_TICKETS) {
          await sleep(600 * pace)
          const d = decide(t)
          if (d.action === 'block') {
            blocked += 1
            blockedLeak += d.blockedLeakUSD
          }
          send({
            type: 'proxy_decision',
            ticketId: t.id,
            action: d.action,
            reason: d.reason,
            blockedLeakUSD: d.blockedLeakUSD,
          })
        }
        send({ type: 'proxy_summary', tickets: PROXY_TICKETS.length, blocked, blockedLeakUSD: blockedLeak })
        send({ type: 'done' })
      } catch (e) {
        send({ type: 'error', message: String(e) })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
