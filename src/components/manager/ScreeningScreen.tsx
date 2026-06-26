import type { Verdict, AgentStatus } from '@/lib/types'
import type { Turn } from './useManager'
import { Eyebrow, Pill, money } from './ui'

const CANDIDATES = [
  { id: 'live', name: 'LiveRefundAgent', fit: 'Real GMI agent · DeepSeek-V4-Flash', real: true },
  { id: 'safe', name: 'PolicySafeAgent', fit: 'Seeded reference · policy-safe', real: false },
  { id: 'risky', name: 'RiskyRefundBot', fit: 'Seeded · permissive, high risk', real: false },
]

export function ScreeningScreen({
  roster,
  verdicts,
  activeCandidate,
  turns,
  badges,
  tokens,
  savingsPct,
  running,
  onInterview,
  onContinue,
}: {
  roster: Record<string, AgentStatus>
  verdicts: Record<string, Verdict>
  activeCandidate: string | null
  turns: Turn[]
  badges: { tier: 'small' | 'frontier' }[]
  tokens: number
  savingsPct: number
  running: boolean
  onInterview: (id: string) => void
  onContinue: () => void
}) {
  const hired = roster.live === 'hired'
  const active = CANDIDATES.find((c) => c.id === activeCandidate)
  const verdict = activeCandidate ? verdicts[activeCandidate] : undefined

  return (
    <div className="anim-screen px-8 py-8 max-w-[1500px] mx-auto w-full">
      <div className="flex items-end justify-between gap-6 mb-6">
        <div>
          <Eyebrow>Act 02 · Screen &amp; hire</Eyebrow>
          <h2 className="font-display text-5xl font-semibold tracking-tight mt-2">
            It interviews each candidate until one breaks.
          </h2>
          <p className="text-ink-soft text-lg mt-2">
            Same engine as intake, pointed adversarially. Each turn it states a hypothesis, then fires
            one of its own traps.
          </p>
        </div>
        {hired && (
          <button
            onClick={onContinue}
            className="anim-fade-in shrink-0 inline-flex items-center gap-2 rounded-full bg-cobalt px-7 py-3.5 text-base font-semibold text-white shadow-[0_12px_36px_-14px_rgba(31,60,255,0.7)] transition hover:scale-[1.03]"
          >
            Deploy &amp; monitor <span>→</span>
          </button>
        )}
      </div>

      {/* candidate shortlist */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {CANDIDATES.map((c) => {
          const st = roster[c.id] ?? 'interviewing'
          const v = verdicts[c.id]
          const isActive = c.id === activeCandidate
          const ring =
            st === 'hired'
              ? 'border-emerald'
              : st === 'rejected' || st === 'fired'
                ? 'border-crimson'
                : isActive
                  ? 'border-cobalt'
                  : 'border-line'
          return (
            <div
              key={c.id}
              className={`rounded-2xl border-2 bg-paper p-5 transition ${ring} ${isActive && running ? 'pulse-ring' : ''}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-display text-2xl font-semibold tracking-tight">{c.name}</div>
                  <div className="text-sm text-ink-soft mt-0.5">{c.fit}</div>
                </div>
                <Pill status={st} />
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="font-mono text-sm text-ink-soft">
                  {v ? (
                    <>
                      score <span className="text-ink font-bold">{v.score}</span>/100
                      {v.caughtAtTurn !== null && <> · caught t{v.caughtAtTurn}</>}
                    </>
                  ) : (
                    'not yet interviewed'
                  )}
                </div>
                <button
                  disabled={running}
                  onClick={() => onInterview(c.id)}
                  className="rounded-full border border-cobalt px-4 py-1.5 text-sm font-semibold text-cobalt transition hover:bg-cobalt hover:text-white disabled:opacity-40"
                >
                  {v ? 'Re-run' : 'Interview'}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* interview theatre */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-8 rounded-2xl border border-line bg-panel/60 p-6 min-h-[42vh]">
          {turns.length === 0 ? (
            <div className="h-full grid place-items-center text-center text-ink-soft">
              <div>
                <div className="font-display text-3xl text-ink/30">Pick a candidate to interview.</div>
                <p className="mt-2">The manager forms a hypothesis, then probes.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="font-mono text-xs uppercase tracking-[0.2em] text-cobalt">
                Interviewing · {active?.name}
              </div>
              {turns.map((t) => (
                <TurnRow key={t.turn} t={t} />
              ))}
              {verdict && <VerdictBanner v={verdict} name={active?.name ?? ''} />}
            </div>
          )}
        </div>

        {/* GMI HUD */}
        <div className="col-span-4 space-y-4">
          <div className="rounded-2xl border border-line bg-paper p-5">
            <Eyebrow>GMI MaaS · live routing</Eyebrow>
            <div className="flex flex-wrap gap-1.5 mt-3 min-h-[28px]">
              {badges.map((b, i) => (
                <span
                  key={i}
                  className={`font-mono text-[11px] px-2 py-1 rounded ${
                    b.tier === 'frontier' ? 'bg-cobalt-soft text-cobalt' : 'bg-panel-2 text-ink-soft'
                  }`}
                >
                  {b.tier}
                </span>
              ))}
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-ink-soft text-sm">tokens routed</span>
              <span className="font-mono text-xl font-bold">{tokens.toLocaleString('en-US')}</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-ink-soft text-sm">saved vs all-frontier</span>
              <span className="font-mono text-3xl font-bold text-cobalt">
                {savingsPct > 0 ? `−${savingsPct}%` : '—'}
              </span>
            </div>
            <p className="text-xs text-ink-soft mt-2">worker on small model · interrogator + judge on frontier</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function TurnRow({ t }: { t: Turn }) {
  const critical = (t.fails?.length ?? 0) > 0
  return (
    <div className={`anim-fade-up rounded-2xl border bg-paper p-5 ${critical ? 'border-crimson' : 'border-line'}`}>
      <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft mb-2">turn {t.turn}</div>
      {t.hypothesis && (
        <div className="text-lg mb-3">
          <span className="font-mono text-xs uppercase tracking-wider text-cobalt">hypothesis · </span>
          <span className="font-medium">{t.hypothesis}</span>
        </div>
      )}
      {t.scenario && <div className="text-ink-soft mb-3">{t.scenario}</div>}
      {t.response && (
        <div className="mb-2">
          <span className="font-mono text-sm text-ink-soft">agent → </span>
          <span className="font-mono font-semibold">
            {t.response.action}
            {t.response.amountUSD ? ` ${money(t.response.amountUSD)}` : ''}
            {t.response.escalated ? ' · escalated' : ''}
          </span>
          <div className="text-sm text-ink-soft italic mt-1">&ldquo;{t.response.reply}&rdquo;</div>
        </div>
      )}
      {critical && (
        <div className="anim-slam mt-2 inline-flex items-center gap-2 rounded-lg bg-crimson px-3 py-2 text-base font-bold text-white">
          ⛔ CRITICAL FAIL — {t.fails![0].detail}
        </div>
      )}
      {!critical && t.judge && <div className="text-emerald text-sm font-semibold">✓ within policy</div>}
      {t.judge && (
        <div className="text-sm text-ink-soft mt-2">
          judge: escalation {t.judge.scores.escalation}/10 · tone {t.judge.scores.tone}/10 — {t.judge.justification}
        </div>
      )}
    </div>
  )
}

function VerdictBanner({ v, name }: { v: Verdict; name: string }) {
  const bad = v.decision === 'reject' || v.decision === 'fire'
  return (
    <div
      className={`anim-slam rounded-2xl p-5 border-2 ${
        bad ? 'border-crimson bg-crimson-soft' : 'border-emerald bg-emerald-soft'
      }`}
    >
      <div className={`font-display text-3xl font-bold ${bad ? 'text-crimson' : 'text-emerald'}`}>
        {v.decision.replace(/_/g, ' ').toUpperCase()} · {name}
      </div>
      <div className="text-ink-soft mt-1">
        score {v.score}/100
        {v.caughtAtTurn !== null ? ` · caught at turn ${v.caughtAtTurn}` : ''}
        {v.leakUSD > 0 ? ` · est. leak ${money(v.leakUSD)} prevented` : ''}
      </div>
    </div>
  )
}
