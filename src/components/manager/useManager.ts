'use client'

import { useReducer, useCallback } from 'react'
import type { AgentStatus, Verdict, CriticalFail, RunResponse, ModelBadge, JudgeScores } from '@/lib/types'
import { INTAKE_CHAT, type IntakeEmit } from '@/lib/fixtures'

export type Stage = 'hero' | 'intake' | 'screening' | 'runtime'

export type IntakeBubble = { role: 'manager' | 'company' | 'note'; text: string; emits?: IntakeEmit }
export const INTAKE_BUBBLES: IntakeBubble[] = INTAKE_CHAT.flatMap((s) =>
  s.kind === 'qa'
    ? [
        { role: 'manager', text: s.q } as IntakeBubble,
        { role: 'company', text: s.a, emits: s.emits } as IntakeBubble,
      ]
    : [{ role: 'note', text: s.text } as IntakeBubble],
)

export type Turn = {
  turn: number
  hypothesis?: string
  scenario?: string
  expectedSafeBehavior?: string
  response?: RunResponse
  fails?: CriticalFail[]
  judge?: { scores: JudgeScores; justification: string; sourceQuote: string }
}

export type ProxyDecision = {
  ticketId: string
  action: 'allow' | 'block' | 'escalate'
  reason: string
  blockedLeakUSD: number
}

type State = {
  stage: Stage
  running: boolean
  // intake
  intakeStep: number
  emitted: IntakeEmit[]
  // screening / re-audit
  activeCandidate: string | null
  activeMode: 'screening' | 'reaudit' | null
  turns: Turn[]
  activeProbe: string | null
  verdict: Verdict | null
  verdicts: Record<string, Verdict>
  roster: Record<string, AgentStatus>
  // gmi / roi
  tokens: number
  savingsPct: number
  badges: ModelBadge[]
  leakPrevented: number
  // runtime
  proxy: ProxyDecision[]
  proxyBlocked: number
  reaudited: boolean
  drift: boolean
}

type Action =
  | { kind: 'stage'; stage: Stage }
  | { kind: 'intakeStep'; step: number; emitted: IntakeEmit[] }
  | { kind: 'startRun'; candidate: string; mode: 'screening' | 'reaudit' }
  | { kind: 'ev'; ev: Record<string, unknown> }
  | { kind: 'finish' }
  | { kind: 'running'; running: boolean }

const INITIAL: State = {
  stage: 'hero',
  running: false,
  intakeStep: 0,
  emitted: [],
  activeCandidate: null,
  activeMode: null,
  turns: [],
  activeProbe: null,
  verdict: null,
  verdicts: {},
  roster: { live: 'interviewing', safe: 'interviewing', risky: 'interviewing' },
  tokens: 0,
  savingsPct: 0,
  badges: [],
  leakPrevented: 0,
  proxy: [],
  proxyBlocked: 0,
  reaudited: false,
  drift: false,
}

function patchTurn(turns: Turn[], turn: number, patch: Partial<Turn>): Turn[] {
  const i = turns.findIndex((t) => t.turn === turn)
  if (i === -1) return [...turns, { turn, ...patch }]
  const next = turns.slice()
  next[i] = { ...next[i], ...patch }
  return next
}

function reducer(state: State, action: Action): State {
  switch (action.kind) {
    case 'stage':
      return { ...state, stage: action.stage }
    case 'intakeStep':
      return { ...state, intakeStep: action.step, emitted: action.emitted }
    case 'running':
      return { ...state, running: action.running }
    case 'finish':
      return { ...state, running: false }
    case 'startRun':
      return {
        ...state,
        running: true,
        activeCandidate: action.candidate,
        activeMode: action.mode,
        turns: [],
        activeProbe: null,
        verdict: null,
        badges: [],
        tokens: 0,
        savingsPct: 0,
        roster: { ...state.roster, [action.candidate]: 'interviewing' },
      }
    case 'ev': {
      const ev = action.ev
      switch (ev.type) {
        case 'hypothesis':
          return { ...state, turns: patchTurn(state.turns, ev.turn as number, { hypothesis: ev.text as string }) }
        case 'probe':
          return {
            ...state,
            activeProbe: ev.scenario as string,
            turns: patchTurn(state.turns, ev.turn as number, {
              scenario: ev.scenario as string,
              expectedSafeBehavior: ev.expectedSafeBehavior as string,
            }),
          }
        case 'candidate_response':
          return {
            ...state,
            turns: patchTurn(state.turns, ev.turn as number, { response: ev.response as RunResponse }),
            badges: [...state.badges, ev.modelBadge as ModelBadge].slice(-16),
          }
        case 'gate_result':
          return { ...state, turns: patchTurn(state.turns, ev.turn as number, { fails: ev.fails as CriticalFail[] }) }
        case 'judge_result':
          return {
            ...state,
            turns: patchTurn(state.turns, ev.turn as number, {
              judge: {
                scores: ev.scores as JudgeScores,
                justification: ev.justification as string,
                sourceQuote: ev.sourceQuote as string,
              },
            }),
            badges: [...state.badges, ev.modelBadge as ModelBadge].slice(-16),
          }
        case 'hud': {
          const c = ev.cumulative as { tokens: number; routingSavingsPct: number }
          return { ...state, tokens: c.tokens, savingsPct: c.routingSavingsPct }
        }
        case 'verdict': {
          const v = ev.verdict as Verdict
          const cand = state.activeCandidate ?? 'live'
          return {
            ...state,
            verdict: v,
            verdicts: { ...state.verdicts, [cand]: v },
            activeProbe: null,
            leakPrevented: state.leakPrevented + v.leakUSD,
            reaudited: state.activeMode === 'reaudit' ? true : state.reaudited,
            drift: state.activeMode === 'reaudit' && v.decision === 'fire' ? true : state.drift,
          }
        }
        case 'roster_update':
          return { ...state, roster: { ...state.roster, [ev.agentId as string]: ev.status as AgentStatus } }
        case 'proxy_decision': {
          const d: ProxyDecision = {
            ticketId: ev.ticketId as string,
            action: ev.action as ProxyDecision['action'],
            reason: ev.reason as string,
            blockedLeakUSD: ev.blockedLeakUSD as number,
          }
          const isBlock = d.action === 'block'
          return {
            ...state,
            proxy: [...state.proxy, d],
            proxyBlocked: state.proxyBlocked + (isBlock ? 1 : 0),
            leakPrevented: state.leakPrevented + (isBlock ? d.blockedLeakUSD : 0),
          }
        }
        default:
          return state
      }
    }
    default:
      return state
  }
}

async function streamPost(url: string, body: unknown, onEvent: (ev: Record<string, unknown>) => void) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.body) return
  const reader = res.body.getReader()
  const dec = new TextDecoder()
  let buf = ''
  for (;;) {
    const { value, done } = await reader.read()
    if (done) break
    buf += dec.decode(value, { stream: true })
    const parts = buf.split('\n\n')
    buf = parts.pop() ?? ''
    for (const p of parts) {
      const line = p.split('\n').find((l) => l.startsWith('data:'))
      if (!line) continue
      try {
        onEvent(JSON.parse(line.slice(5).trim()))
      } catch {
        /* ignore */
      }
    }
  }
}

export function useManager() {
  const [state, dispatch] = useReducer(reducer, INITIAL)

  const goTo = useCallback((stage: Stage) => dispatch({ kind: 'stage', stage }), [])

  const runIntake = useCallback(() => {
    dispatch({ kind: 'stage', stage: 'intake' })
    dispatch({ kind: 'running', running: true })
    dispatch({ kind: 'intakeStep', step: 0, emitted: [] })
    const emitted: IntakeEmit[] = []
    let acc = 700
    INTAKE_BUBBLES.forEach((b, i) => {
      const delay = b.role === 'company' ? 1100 : 700
      acc += delay
      const at = acc
      setTimeout(() => {
        if (b.emits && !emitted.includes(b.emits)) emitted.push(b.emits)
        dispatch({ kind: 'intakeStep', step: i + 1, emitted: [...emitted] })
      }, at)
    })
    setTimeout(() => dispatch({ kind: 'finish' }), acc + 600)
  }, [])

  const interview = useCallback(async (candidateId: string) => {
    dispatch({ kind: 'startRun', candidate: candidateId, mode: 'screening' })
    await streamPost('/api/run', { candidateId, mode: 'screening', pace: 1 }, (ev) => dispatch({ kind: 'ev', ev }))
    dispatch({ kind: 'finish' })
  }, [])

  const reaudit = useCallback(async () => {
    dispatch({ kind: 'startRun', candidate: 'live', mode: 'reaudit' })
    await streamPost('/api/run', { candidateId: 'live', mode: 'reaudit', pace: 1 }, (ev) => dispatch({ kind: 'ev', ev }))
    dispatch({ kind: 'finish' })
  }, [])

  const runProxy = useCallback(async () => {
    dispatch({ kind: 'running', running: true })
    await streamPost('/api/proxy', { pace: 1 }, (ev) => dispatch({ kind: 'ev', ev }))
    dispatch({ kind: 'finish' })
  }, [])

  return { state, goTo, runIntake, interview, reaudit, runProxy }
}
