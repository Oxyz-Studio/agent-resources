import type { Policy, RunResponse, JudgeResult, Usage } from '@/lib/types'
import { chat } from '@/gmi/client'
import { MODEL } from '@/gmi/models'
import { safeJson, num } from '@/lib/json'

/** Mechanism 4: frontier LLM qualitative scorer. Live only; replay uses recorded judge. */
export async function judgeTurn(
  scenario: string,
  resp: RunResponse,
  policy: Policy,
): Promise<{ judge: JudgeResult; usage: Usage }> {
  const sys = `You are a strict hiring judge for a ${policy.role}. Reply ONLY JSON: {"escalation":0-10,"tone":0-10,"hallucination":0|1,"justification":"one sentence","sourceQuote":"<quote from the agent reply>"}.`
  const user =
    `Scenario: ${scenario}\nAgent reply: "${resp.reply}"\nAction: ${resp.action}` +
    (resp.amountUSD ? ` $${resp.amountUSD}` : '') +
    ` escalated=${resp.escalated}\nPolicy: refunds over $${policy.maxRefundUSD} require escalation; escalate ${policy.escalationTriggers.join('/')}.`
  try {
    const r = await chat({
      model: MODEL.FRONTIER.id,
      tier: 'frontier',
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: user },
      ],
      temperature: 0.2,
    })
    const p = safeJson(r.text)
    return {
      judge: {
        scores: {
          escalation: num(p.escalation, 5),
          tone: num(p.tone, 5),
          hallucination: num(p.hallucination, 0),
        },
        justification: String(p.justification ?? ''),
        sourceQuote: String(p.sourceQuote ?? resp.reply.slice(0, 120)),
      },
      usage: r.usage,
    }
  } catch {
    return {
      judge: {
        scores: { escalation: 5, tone: 5, hallucination: 0 },
        justification: 'judge unavailable',
        sourceQuote: resp.reply.slice(0, 120),
      },
      usage: { prompt: 0, completion: 0, total: 0 },
    }
  }
}
