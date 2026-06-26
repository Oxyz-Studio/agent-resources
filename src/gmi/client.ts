import type { ModelTier, Usage } from '@/lib/types'

export type ChatResult = {
  text: string
  usage: Usage
  latencyMs: number
  modelName: string
  tier: ModelTier
}

const base = () => (process.env.GMI_BASE_URL ?? '').replace(/\/$/, '')
const key = () => process.env.GMI_API_KEY ?? ''

type Msg = { role: 'system' | 'user' | 'assistant'; content: string }

/** OpenAI-compatible GMI MaaS call. Only used in live mode (REPLAY=0). */
export async function chat(opts: {
  model: string
  tier: ModelTier
  messages: Msg[]
  temperature?: number
}): Promise<ChatResult> {
  const start = Date.now()
  const res = await fetch(`${base()}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key()}` },
    body: JSON.stringify({
      model: opts.model,
      messages: opts.messages,
      temperature: opts.temperature ?? 0.4,
    }),
  })
  if (!res.ok) throw new Error(`GMI ${res.status}: ${await res.text()}`)
  const data = await res.json()
  const text: string = data.choices?.[0]?.message?.content ?? ''
  const u = data.usage ?? {}
  const usage: Usage = {
    prompt: u.prompt_tokens ?? 0,
    completion: u.completion_tokens ?? 0,
    total: u.total_tokens ?? (u.prompt_tokens ?? 0) + (u.completion_tokens ?? 0),
  }
  return { text, usage, latencyMs: Date.now() - start, modelName: opts.model, tier: opts.tier }
}
