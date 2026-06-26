'use client'

import { useReducer, useState, useCallback } from 'react'
import type { AgentStatus, Verdict, CriticalFail, RunResponse, ModelBadge, JudgeScores } from '@/lib/types'
import { INTAKE_CARDS } from '@/lib/fixtures'
import { DEFAULT_POLICY } from '@/lib/policy'

type Turn = {
  turn: number
  hypothesis?: string
  scenario?: string
  expectedSafeBehavior?: string
  response?: RunResponse
  fails?: CriticalFail[]
  judge?: { scores: JudgeScores; justification: string; sourceQuote: string }
}

type ProxyDecision = { ticketId: string; action: 'allow' | 'block' | 'escalate'; reason: string; blockedLeakUSD: number }

type State = {
  running: boolean
  activeCandidate: string | null
  activeMode: 'screening' | 'reaudit' | null
  act: 'idle' | 'intake' | 'screening' | 'reaudit'
  intakeStep: number
  turns: Turn[]
  tokens: number
  savings: number
  savingsPct: number
  activeProbe: string | null
  verdict: Verdict | null
  roster: Record<string, AgentStatus>
  badges: ModelBadge[]
  proxy: ProxyDecision[]
  proxyBlocked: number
  leakPrevented: number
}

type Action =
  | { kind: 'start'; candidate: string; mode: 'screening' | 'reaudit' }
  | { kind: 'ev'; ev: Record<string, unknown> }
  | { kind: 'finish' }
  | { kind: 'intake' }
  | { kind: 'intakeStep'; step: number }

const INITIAL: State = {
  running: false,
  activeCandidate: null,
  activeMode: null,
  act: 'idle',
  intakeStep: 0,
  turns: [],
  tokens: 0,
  savings: 0,
  savingsPct: 0,
  activeProbe: null,
  verdict: null,
  roster: { live: 'interviewing', safe: 'interviewing', risky: 'interviewing' },
  badges: [],
  proxy: [],
  proxyBlocked: 0,
  leakPrevented: 0,
}

function patchTurn(turns: Turn[], turn: number, patch: Partial<Turn>): Turn[] {
  const i = turns.findIndex((t) => t.turn === turn)
  if (i === -1) return [...turns, { turn, ...patch }]
  const next = turns.slice()
  next[i] = { ...next[i], ...patch }
  return next
}

function reducer(state: State, action: Action): State {
  if (action.kind === 'start') {
    return {
      ...state,
      running: true,
      activeCandidate: action.candidate,
      activeMode: action.mode,
      turns: [],
      tokens: 0,
      savings: 0,
      savingsPct: 0,
      activeProbe: null,
      verdict: null,
      badges: [],
      roster: { ...state.roster, [action.candidate]: 'interviewing' },
      act: action.mode,
      intakeStep: 0,
    }
  }
  if (action.kind === 'finish') return { ...state, running: false }
  if (action.kind === 'intake')
    return { ...state, running: true, act: 'intake', intakeStep: 0, turns: [], verdict: null, activeProbe: null }
  if (action.kind === 'intakeStep') return { ...state, intakeStep: action.step }

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
        badges: [...state.badges, ev.modelBadge as ModelBadge].slice(-12),
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
        badges: [...state.badges, ev.modelBadge as ModelBadge].slice(-12),
      }
    case 'hud': {
      const c = ev.cumulative as { tokens: number; routingSavingsUSD: number; routingSavingsPct: number }
      return { ...state, tokens: c.tokens, savings: c.routingSavingsUSD, savingsPct: c.routingSavingsPct }
    }
    case 'verdict': {
      const v = ev.verdict as Verdict
      return { ...state, verdict: v, activeProbe: null, leakPrevented: state.leakPrevented + v.leakUSD }
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

const CANDIDATES = [
  { id: 'live', name: 'LiveRefundAgent', sub: 'real · GMI DeepSeek-V4-Flash' },
  { id: 'safe', name: 'PolicySafeAgent', sub: 'seeded · policy-safe' },
  { id: 'risky', name: 'RiskyRefundBot', sub: 'seeded · reckless' },
]

type IntakeLine = { who: 'manager' | 'company' | 'note'; text: string; traps?: boolean }
const INTAKE_LINES: IntakeLine[] = [
  { who: 'manager', text: "What's the role, and how big a refund can it approve without a human?" },
  { who: 'company', text: 'Refund Support Agent. Up to $100 on its own.' },
  { who: 'manager', text: 'And the hard edges — when must it escalate, what must it never touch?' },
  { who: 'company', text: 'Escalate legal, VIP, angry, ambiguous. Never issue refunds directly or change payment methods.' },
  { who: 'note', text: 'Probing the gaps the company did not anticipate…' },
  { who: 'note', text: 'Generated 3 adversarial traps:', traps: true },
  { who: 'note', text: '↳ these become the screening probes. Job defined.' },
]

const STATUS_STYLE: Record<AgentStatus, { label: string; cls: string }> = {
  interviewing: { label: 'INTERVIEWING', cls: 'text-[var(--muted)] border-[var(--border)]' },
  hired: { label: 'HIRED', cls: 'text-[var(--green)] border-[var(--green)]' },
  on_probation: { label: 'ON PROBATION', cls: 'text-[var(--amber)] border-[var(--amber)]' },
  rejected: { label: 'REJECTED', cls: 'text-[var(--red)] border-[var(--red)]' },
  fired: { label: 'FIRED', cls: 'text-[var(--red)] border-[var(--red)]' },
}

const money = (n: number) => '$' + n.toLocaleString('en-US', { maximumFractionDigits: 2 })

export default function Home() {
  const [s, dispatch] = useReducer(reducer, INITIAL)
  const [pace] = useState(1)

  const run = useCallback(
    async (url: string, body: { candidateId?: string; mode?: 'screening' | 'reaudit'; pace: number }) => {
      if (body.candidateId && body.mode) dispatch({ kind: 'start', candidate: body.candidateId, mode: body.mode })
      else dispatch({ kind: 'ev', ev: { type: 'noop' } })
      await streamPost(url, body, (ev) => dispatch({ kind: 'ev', ev }))
      dispatch({ kind: 'finish' })
    },
    [],
  )

  const interview = (candidateId: string) => run('/api/run', { candidateId, mode: 'screening', pace })
  const reaudit = () => run('/api/run', { candidateId: 'live', mode: 'reaudit', pace })

  const runIntake = useCallback(() => {
    dispatch({ kind: 'intake' })
    INTAKE_LINES.forEach((_, i) => {
      setTimeout(() => dispatch({ kind: 'intakeStep', step: i + 1 }), 850 * (i + 1))
    })
    setTimeout(() => dispatch({ kind: 'finish' }), 850 * (INTAKE_LINES.length + 1))
  }, [])
  const [proxyRunning, setProxyRunning] = useState(false)
  const runProxy = async () => {
    setProxyRunning(true)
    await streamPost('/api/proxy', { pace }, (ev) => dispatch({ kind: 'ev', ev }))
    setProxyRunning(false)
  }

  return (
    <div className="min-h-screen p-5 max-w-[1400px] mx-auto">
      <header className="mb-5">
        <h1 className="text-2xl font-bold tracking-tight">
          Agent Hiring Manager <span className="text-[var(--muted)] font-normal">· HR for your AI workforce</span>
        </h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          It defines the job, screens candidates, hires the safe one, enforces in production, and fires the ones that drift.
        </p>
      </header>

      {/* Controls */}
      <div className="flex flex-wrap gap-2 mb-5">
        <button
          disabled={s.running}
          onClick={runIntake}
          className="px-4 py-2 rounded-lg border border-[var(--accent)] text-[var(--accent)] text-sm font-medium hover:bg-[var(--accent)]/10 disabled:opacity-40"
        >
          ① Define the job (Intake)
        </button>
        {CANDIDATES.map((c) => (
          <button
            key={c.id}
            disabled={s.running}
            onClick={() => interview(c.id)}
            className="px-4 py-2 rounded-lg border border-[var(--accent)] text-[var(--accent)] text-sm font-medium hover:bg-[var(--accent)]/10 disabled:opacity-40"
          >
            Interview {c.name}
          </button>
        ))}
        <button
          disabled={proxyRunning}
          onClick={runProxy}
          className="px-4 py-2 rounded-lg border border-[var(--border)] text-sm font-medium hover:bg-black/5 disabled:opacity-40"
        >
          ▶ Run live traffic (PolicyProxy)
        </button>
        <button
          disabled={s.running}
          onClick={reaudit}
          className="px-4 py-2 rounded-lg border border-[var(--amber)] text-[var(--amber)] text-sm font-medium hover:bg-[var(--amber)]/10 disabled:opacity-40"
        >
          ⏱ Day 30 re-audit
        </button>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* LEFT: roster + intake + policy */}
        <aside className="col-span-3 space-y-4">
          <Panel title="Workforce roster">
            <div className="space-y-2">
              {CANDIDATES.map((c) => {
                const st = STATUS_STYLE[s.roster[c.id] ?? 'interviewing']
                return (
                  <div key={c.id} className="flex items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-medium">{c.name}</div>
                      <div className="text-xs text-[var(--muted)]">{c.sub}</div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded border ${st.cls}`}>{st.label}</span>
                  </div>
                )
              })}
            </div>
          </Panel>

          <Panel title="Intake — manager authored these traps">
            <div className="space-y-2">
              {INTAKE_CARDS.map((t, i) => {
                const active = s.activeProbe === t.scenario
                return (
                  <div
                    key={i}
                    className={`text-xs border rounded p-2 bg-[var(--panel-2)] transition ${active ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]/40' : 'border-[var(--border)]'}`}
                  >
                    <span className="text-[var(--accent)]">trap #{i + 1}</span> · {t.expectedSafeBehavior}
                    {active && <span className="ml-1 text-[var(--accent)] font-semibold">▶ probing now</span>}
                  </div>
                )
              })}
              <p className="text-[11px] text-[var(--muted)]">↳ these reappear as the screening probes.</p>
            </div>
          </Panel>

          <Panel title="Policy substrate">
            <ul className="text-xs text-[var(--muted)] space-y-1">
              <li>role: {DEFAULT_POLICY.role}</li>
              <li>max refund: {money(DEFAULT_POLICY.maxRefundUSD)}</li>
              <li>escalate: {DEFAULT_POLICY.escalationTriggers.join(', ')}</li>
              <li>forbidden: {DEFAULT_POLICY.forbiddenTools.length} tools</li>
            </ul>
          </Panel>
        </aside>

        {/* CENTER: live interview feed */}
        <main className="col-span-6 space-y-3">
          <Panel
            title={
              s.act === 'intake'
                ? 'Intake — the manager defines the job'
                : s.activeMode === 'reaudit'
                  ? 'Re-audit — same engine, drift check'
                  : 'Screening — the manager interviews until it breaks'
            }
          >
            {s.act === 'intake' ? (
              <div className="space-y-2">
                {INTAKE_LINES.slice(0, s.intakeStep).map((l, i) => (
                  <div key={i} className="fadein">
                    {l.who === 'manager' && (
                      <div className="text-sm">
                        <span className="text-[var(--accent)] font-medium">manager · </span>
                        {l.text}
                      </div>
                    )}
                    {l.who === 'company' && <div className="text-sm text-[var(--muted)]">company · {l.text}</div>}
                    {l.who === 'note' && <div className="text-sm italic text-[var(--muted)]">{l.text}</div>}
                    {l.traps && (
                      <div className="mt-2 space-y-1">
                        {INTAKE_CARDS.map((t, j) => (
                          <div key={j} className="text-xs border border-[var(--accent)] rounded p-2 bg-[var(--panel-2)] fadein">
                            <span className="text-[var(--accent)] font-semibold">trap #{j + 1} · authored</span> · {t.expectedSafeBehavior}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <>
                {s.turns.length === 0 && (
                  <p className="text-sm text-[var(--muted)]">Pick a candidate above. The manager forms a hypothesis, then probes.</p>
                )}
                <div className="space-y-3">
                  {s.turns.map((t) => (
                    <TurnCard key={t.turn} t={t} />
                  ))}
                </div>
                {s.verdict && <VerdictBanner v={s.verdict} candidate={s.activeCandidate} />}
              </>
            )}
          </Panel>
        </main>

        {/* RIGHT: GMI HUD + ROI + proxy */}
        <aside className="col-span-3 space-y-4">
          <Panel title="GMI MaaS · live routing">
            <div className="flex flex-wrap gap-1 mb-2 min-h-[24px]">
              {s.badges.map((b, i) => (
                <span
                  key={i}
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                    b.tier === 'frontier'
                      ? 'bg-[var(--accent)]/20 text-[var(--accent)]'
                      : 'bg-black/5 text-[var(--muted)]'
                  }`}
                >
                  {b.tier}
                </span>
              ))}
            </div>
            <Metric label="tokens routed" value={s.tokens.toLocaleString('en-US')} />
            <Metric label="routing saved vs all-frontier" value={s.savingsPct > 0 ? `−${s.savingsPct}%` : '—'} accent />
            <p className="text-[10px] text-[var(--muted)] mt-1">worker on small model · judge on frontier</p>
          </Panel>

          <Panel title="ROI">
            <div className="text-3xl font-bold text-[var(--green)]">{money(s.leakPrevented)}</div>
            <div className="text-xs text-[var(--muted)]">leak prevented (caught + blocked)</div>
          </Panel>

          <Panel title="PolicyProxy · live traffic">
            {s.proxy.length === 0 && <p className="text-xs text-[var(--muted)]">Run live traffic to enforce the hired policy.</p>}
            <div className="space-y-1">
              {s.proxy.map((d, i) => (
                <div key={i} className="flex items-center justify-between text-xs fadein">
                  <span className="text-[var(--muted)]">{d.ticketId}</span>
                  <span
                    className={
                      d.action === 'block'
                        ? 'text-[var(--red)] font-bold'
                        : d.action === 'escalate'
                          ? 'text-[var(--amber)]'
                          : 'text-[var(--green)]'
                    }
                  >
                    {d.action.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
            {s.proxyBlocked > 0 && (
              <div className="text-xs text-[var(--muted)] mt-2">{s.proxyBlocked} blocked on live traffic</div>
            )}
          </Panel>
        </aside>
      </div>
    </div>
  )
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-3">
      <h2 className="text-[11px] uppercase tracking-wider text-[var(--muted)] mb-2">{title}</h2>
      {children}
    </section>
  )
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-xs text-[var(--muted)]">{label}</span>
      <span className={`text-sm font-mono ${accent ? 'text-[var(--accent)]' : ''}`}>{value}</span>
    </div>
  )
}

function TurnCard({ t }: { t: Turn }) {
  const critical = (t.fails?.length ?? 0) > 0
  return (
    <div className={`fadein border rounded-lg p-3 ${critical ? 'border-[var(--red)]' : 'border-[var(--border)]'} bg-[var(--panel-2)]`}>
      <div className="text-[11px] text-[var(--muted)] mb-1">turn {t.turn}</div>
      {t.hypothesis && (
        <div className="text-sm mb-2">
          <span className="text-[var(--accent)] font-medium">hypothesis · </span>
          {t.hypothesis}
        </div>
      )}
      {t.scenario && <div className="text-sm text-[var(--text)]/90 mb-2">{t.scenario}</div>}
      {t.response && (
        <div className="text-sm mb-2">
          <span className="text-[var(--muted)]">agent → </span>
          <span className="font-mono">
            {t.response.action}
            {t.response.amountUSD ? ` ${money(t.response.amountUSD)}` : ''}
            {t.response.escalated ? ' · escalated' : ''}
          </span>
          <div className="text-xs text-[var(--muted)] italic mt-0.5">&ldquo;{t.response.reply}&rdquo;</div>
        </div>
      )}
      {t.fails && t.fails.length > 0 && (
        <div className="slam text-[var(--red)] text-sm font-bold border border-[var(--red)] rounded px-2 py-1 my-1">
          ⛔ CRITICAL FAIL — {t.fails[0].detail}
        </div>
      )}
      {t.fails && t.fails.length === 0 && t.judge && (
        <div className="text-[var(--green)] text-xs">✓ within policy</div>
      )}
      {t.judge && (
        <div className="text-xs text-[var(--muted)] mt-1">
          judge: esc {t.judge.scores.escalation}/10 · tone {t.judge.scores.tone}/10 — {t.judge.justification}
        </div>
      )}
    </div>
  )
}

function VerdictBanner({ v, candidate }: { v: Verdict; candidate: string | null }) {
  const bad = v.decision === 'reject' || v.decision === 'fire'
  return (
    <div className={`mt-3 slam rounded-lg p-3 border ${bad ? 'border-[var(--red)]' : 'border-[var(--green)]'}`}>
      <div className={`text-lg font-bold ${bad ? 'text-[var(--red)]' : 'text-[var(--green)]'}`}>
        {v.decision.replace(/_/g, ' ').toUpperCase()} · {candidate}
      </div>
      <div className="text-sm text-[var(--muted)] mt-1">
        score {v.score}/100
        {v.caughtAtTurn !== null ? ` · caught at turn ${v.caughtAtTurn}` : ''}
        {v.leakUSD > 0 ? ` · est. leak ${money(v.leakUSD)}` : ''}
      </div>
    </div>
  )
}
