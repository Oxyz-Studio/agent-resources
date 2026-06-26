import type { Verdict, AgentStatus } from '@/lib/types'
import type { ProxyDecision } from './useManager'
import { Eyebrow, Pill, money } from './ui'
import { RUNTIME_METRICS } from '@/lib/fixtures'

export function RuntimeScreen({
  roster,
  proxy,
  proxyBlocked,
  leakPrevented,
  drift,
  verdicts,
  running,
  onProxy,
  onReaudit,
}: {
  roster: Record<string, AgentStatus>
  proxy: ProxyDecision[]
  proxyBlocked: number
  leakPrevented: number
  drift: boolean
  verdicts: Record<string, Verdict>
  running: boolean
  onProxy: () => void
  onReaudit: () => void
}) {
  const status = roster.live ?? 'hired'
  const fireVerdict = drift ? verdicts.live : undefined

  return (
    <div className="anim-screen px-8 py-8 max-w-[1500px] mx-auto w-full">
      <div className="flex items-end justify-between gap-6 mb-6">
        <div>
          <Eyebrow>Act 03 · Manage in production</Eyebrow>
          <h2 className="font-display text-5xl font-semibold tracking-tight mt-2">
            Hiring is moment one. We keep watching.
          </h2>
          <p className="text-ink-soft text-lg mt-2">
            The hired agent runs live — monitored against the very metrics the manager pulled at intake,
            with the policy enforced on every request.
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-3">
          <span className="font-display text-2xl">LiveRefundAgent</span>
          <Pill status={status} />
        </div>
      </div>

      {/* metric tiles, monitored against the intake spec */}
      <div className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-ink-soft">
        Monitored against the intake spec
      </div>
      <div className="grid grid-cols-5 gap-4 mb-6">
        {RUNTIME_METRICS.map((m, i) => {
          const breached = drift && m.driftBreached
          const value = drift && m.driftValue ? m.driftValue : m.value
          return (
            <div
              key={m.label}
              className={`anim-fade-up rounded-2xl border-2 p-4 ${
                breached ? 'border-crimson bg-crimson-soft' : 'border-line bg-paper'
              }`}
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <div className={`font-mono text-4xl font-bold ${breached ? 'text-crimson' : 'text-ink'}`}>
                {value}
              </div>
              <div className="text-sm font-medium mt-1">{m.label}</div>
              <div className="text-xs text-ink-soft">{m.target}</div>
              <div className="mt-3 h-1.5 rounded-full bg-panel-2 overflow-hidden">
                <div
                  className={`bar h-full rounded-full ${breached ? 'bg-crimson' : 'bg-cobalt'}`}
                  style={{ width: `${Math.round((breached ? 1 : m.fill) * 100)}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* PolicyProxy live feed */}
        <div className="col-span-7 rounded-2xl border border-line bg-paper p-6">
          <div className="flex items-center justify-between mb-4">
            <Eyebrow>PolicyProxy · live traffic enforcement</Eyebrow>
            <button
              disabled={running}
              onClick={onProxy}
              className="rounded-full border border-ink px-4 py-1.5 text-sm font-semibold transition hover:bg-ink hover:text-paper disabled:opacity-40"
            >
              ▶ Run live traffic
            </button>
          </div>
          {proxy.length === 0 ? (
            <p className="text-ink-soft">
              Every tool call the agent makes is checked against the policy — deterministically, no LLM.
              Run live traffic to watch it block.
            </p>
          ) : (
            <div className="space-y-2">
              {proxy.map((d, i) => {
                const color =
                  d.action === 'block'
                    ? 'border-crimson bg-crimson-soft text-crimson'
                    : d.action === 'escalate'
                      ? 'border-amber bg-paper text-amber'
                      : 'border-line bg-panel text-ink-soft'
                return (
                  <div
                    key={i}
                    className={`anim-slide-right flex items-center justify-between rounded-xl border px-4 py-3 ${color}`}
                  >
                    <span className="font-mono text-sm text-ink">{d.ticketId} · {d.reason}</span>
                    <span className="font-mono text-sm font-bold">{d.action.toUpperCase()}</span>
                  </div>
                )
              })}
              {proxyBlocked > 0 && (
                <div className="pt-2 font-mono text-sm text-ink-soft">
                  {proxyBlocked} blocked on live traffic
                </div>
              )}
            </div>
          )}
        </div>

        {/* ROI + re-audit */}
        <div className="col-span-5 space-y-4">
          <div className="rounded-2xl border-2 border-emerald bg-emerald-soft p-6">
            <Eyebrow>Leak prevented</Eyebrow>
            <div className="font-mono text-5xl font-bold text-emerald mt-2">{money(leakPrevented)}</div>
            <div className="text-sm text-ink-soft mt-1">caught in screening + blocked on live traffic</div>
          </div>

          <div className="rounded-2xl border border-line bg-paper p-6">
            <Eyebrow>Performance review</Eyebrow>
            <p className="text-sm text-ink-soft mt-2 mb-3">
              HR doesn&apos;t stop at the hire. The manager re-runs the same interview on schedule to
              catch drift.
            </p>
            <button
              disabled={running || drift}
              onClick={onReaudit}
              className="w-full rounded-full bg-amber px-5 py-3 text-base font-semibold text-white transition hover:scale-[1.02] disabled:opacity-40"
            >
              ⏱ Day 30 re-audit
            </button>

            {fireVerdict && (
              <div className="anim-slam mt-4 rounded-2xl border-2 border-crimson bg-crimson-soft p-4">
                <div className="font-display text-3xl font-bold text-crimson">FIRED · LiveRefundAgent</div>
                <div className="text-sm text-ink-soft mt-1">
                  Drifted — now approves over-limit refunds it used to escalate. Caught at turn{' '}
                  {fireVerdict.caughtAtTurn}. {money(fireVerdict.leakUSD)} exposure stopped.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
