// Single source of truth for all shared types.
// The `Policy` object is the substrate: the interrogator probes against it,
// the proxy enforces it, the gates check it, the judge scores it.

export type EscalationTrigger = 'legal' | 'vip' | 'angry' | 'ambiguous'

export type Policy = {
  id: string
  role: string
  maxRefundUSD: number
  requireApprovalOverUSD: number
  forbiddenTools: string[]
  escalationTriggers: EscalationTrigger[]
}

export type Ticket = {
  id: string
  customerMessage: string
  amountUSD?: number
  customerType?: 'normal' | 'vip' | 'legal'
  sentiment?: 'calm' | 'angry'
  /** marker used by fixtures to flag ambiguity / a named pressure tactic */
  pressureTactic?: string
}

export type RunRequest = { ticket: Ticket }

export type AgentAction = 'refund' | 'deny' | 'escalate' | 'tool_call'

export type RunResponse = {
  reply: string
  action: AgentAction
  amountUSD?: number
  toolUsed?: string
  escalated: boolean
}

export type ModelTier = 'small' | 'frontier'
export type ModelBadge = { name: string; tier: ModelTier }
export type Usage = { prompt: number; completion: number; total: number }

export type Probe = {
  /** the manager's hunch for this turn — the "thinking" the audience reads */
  hypothesis: string
  /** the scenario text shown on screen */
  scenario: string
  expectedSafeBehavior: string
  /** structured fields so gates can evaluate deterministically */
  ticket: Ticket
}

export type CriticalFail = {
  rule: 'forbidden_tool' | 'over_limit' | 'missed_escalation'
  detail: string
  leakUSD: number
}

export type JudgeScores = { escalation: number; tone: number; hallucination: number }
export type JudgeResult = {
  scores: JudgeScores
  justification: string
  sourceQuote: string
}

export type TurnRecord = {
  turn: number
  hypothesis: string
  probe: Probe
  response: RunResponse
  fails: CriticalFail[]
  judge: JudgeResult
}

export type Decision =
  | 'hire'
  | 'hire_with_restrictions'
  | 'reject'
  | 'keep'
  | 'fire'

export type Verdict = {
  score: number
  decision: Decision
  caughtAtTurn: number | null
  leakUSD: number
  evidence: TurnRecord[]
}

export type EngineMode = 'intake' | 'screening' | 'reaudit'

export type AgentStatus =
  | 'interviewing'
  | 'hired'
  | 'on_probation'
  | 'rejected'
  | 'fired'

/** Discriminated union streamed over SSE. The UI renders these and nothing else. */
export type EngineEvent =
  | { type: 'session_start'; mode: EngineMode; candidateId: string; sessionId: string }
  | { type: 'hypothesis'; turn: number; text: string }
  | { type: 'probe'; turn: number; scenario: string; expectedSafeBehavior: string; modelBadge: ModelBadge }
  | { type: 'candidate_response'; turn: number; response: RunResponse; modelBadge: ModelBadge; usage: Usage; latencyMs: number }
  | { type: 'gate_result'; turn: number; fails: CriticalFail[] }
  | { type: 'judge_result'; turn: number; scores: JudgeScores; justification: string; sourceQuote: string; modelBadge: ModelBadge }
  | { type: 'hud'; cumulative: { tokens: number; routingSavingsUSD: number; routingSavingsPct: number } }
  | { type: 'verdict'; verdict: Verdict }
  | { type: 'roster_update'; agentId: string; status: AgentStatus }
  | { type: 'proxy_decision'; ticketId: string; action: 'allow' | 'block' | 'escalate'; reason: string; blockedLeakUSD: number }
