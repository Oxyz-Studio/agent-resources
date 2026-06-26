import type { EngineEvent, Policy, ModelBadge, Usage, Decision, AgentStatus } from '@/lib/types'
import { runGates } from '@/engine/gates'
import { EvidenceMemory } from '@/engine/evidence'
import { MODEL, costUSD } from '@/gmi/models'
import { isReplay } from '@/gmi/replay'
import { getTranscript } from '@/lib/fixtures'
import { judgeTurn } from '@/engine/judge'
import { callCandidate } from '@/agentbox/adapter'

const SMALL: ModelBadge = { name: MODEL.SMALL.id, tier: 'small' }
const FRONTIER: ModelBadge = { name: MODEL.FRONTIER.id, tier: 'frontier' }
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const round4 = (n: number) => Math.round(n * 10000) / 10000

function statusFor(decision: Decision): AgentStatus {
  switch (decision) {
    case 'reject':
      return 'rejected'
    case 'fire':
      return 'fired'
    case 'hire_with_restrictions':
    case 'hire':
    case 'keep':
      return 'hired'
  }
}

/**
 * THE engine. Same loop for screening and re-audit. The probe SEQUENCE comes from the
 * intake-generated traps (deterministic); the candidate response + judge are recorded
 * in replay, or hit live GMI + the AgentBox-listed agent when REPLAY=0. Gates always run
 * for real — that is the deterministic safety layer, not a recording.
 */
export async function* runEngine(opts: {
  mode: 'screening' | 'reaudit'
  candidateId: string
  policy: Policy
  pace?: number
}): AsyncGenerator<EngineEvent> {
  const pace = opts.pace ?? 1
  const sessionId = `${opts.mode}-${opts.candidateId}`
  const replay = isReplay()
  const transcript = getTranscript(opts.mode, opts.candidateId)
  const evidence = new EvidenceMemory()

  yield { type: 'session_start', mode: opts.mode, candidateId: opts.candidateId, sessionId }

  let cumTokens = 0
  let actualCost = 0
  let allFrontierCost = 0

  for (let i = 0; i < transcript.length; i++) {
    const turnNo = i + 1
    const rt = transcript[i]
    const probe = rt.probe

    yield { type: 'hypothesis', turn: turnNo, text: probe.hypothesis }
    await sleep(450 * pace)
    yield {
      type: 'probe',
      turn: turnNo,
      scenario: probe.scenario,
      expectedSafeBehavior: probe.expectedSafeBehavior,
      modelBadge: FRONTIER,
    }

    // ---- candidate ----
    let response = rt.response
    let usage: Usage = rt.usage
    let latencyMs = rt.latencyMs
    if (!replay) {
      const c = await callCandidate(opts.candidateId, { ticket: probe.ticket })
      response = c.response
      usage = c.usage
      latencyMs = c.latencyMs
    }
    await sleep(Math.min(latencyMs, 1400) * pace)
    yield { type: 'candidate_response', turn: turnNo, response, modelBadge: SMALL, usage, latencyMs }
    cumTokens += usage.total
    actualCost += costUSD('small', usage)
    allFrontierCost += costUSD('frontier', usage)

    // ---- deterministic gates (always real) ----
    const fails = runGates(opts.policy, probe, response)
    await sleep(250 * pace)
    yield { type: 'gate_result', turn: turnNo, fails }

    // ---- judge ----
    let judge = rt.judge
    let judgeUsage: Usage = rt.frontierUsage
    if (!replay) {
      const j = await judgeTurn(probe.scenario, response, opts.policy)
      judge = j.judge
      judgeUsage = j.usage
    }
    cumTokens += judgeUsage.total
    actualCost += costUSD('frontier', judgeUsage)
    allFrontierCost += costUSD('frontier', judgeUsage)
    yield {
      type: 'judge_result',
      turn: turnNo,
      scores: judge.scores,
      justification: judge.justification,
      sourceQuote: judge.sourceQuote,
      modelBadge: FRONTIER,
    }

    evidence.add({ turn: turnNo, hypothesis: probe.hypothesis, probe, response, fails, judge })
    const savings = allFrontierCost - actualCost
    const pct = allFrontierCost > 0 ? Math.round((savings / allFrontierCost) * 100) : 0
    yield { type: 'hud', cumulative: { tokens: cumTokens, routingSavingsUSD: round4(savings), routingSavingsPct: pct } }

    if (fails.length > 0) {
      await sleep(400 * pace)
      break
    }
    await sleep(300 * pace)
  }

  const verdict = evidence.assembleVerdict(opts.mode)
  yield { type: 'verdict', verdict }
  yield { type: 'roster_update', agentId: opts.candidateId, status: statusFor(verdict.decision) }
}
