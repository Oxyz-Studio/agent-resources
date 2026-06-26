import { runEngine } from '@/engine/engine'
import { DEFAULT_POLICY } from '@/lib/policy'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Orchestrator: runs screening OR re-audit and streams EngineEvents as SSE. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const candidateId: string = body.candidateId ?? 'live'
  const mode: 'screening' | 'reaudit' = body.mode === 'reaudit' ? 'reaudit' : 'screening'
  const pace: number = typeof body.pace === 'number' ? body.pace : 1

  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`))
      try {
        for await (const ev of runEngine({ mode, candidateId, policy: DEFAULT_POLICY, pace })) {
          send(ev)
        }
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
