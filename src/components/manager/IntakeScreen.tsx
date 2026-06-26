import { INTAKE_BUBBLES } from './useManager'
import { Eyebrow } from './ui'
import {
  COMPANY,
  COMPANY_METRICS,
  COMPANY_SOFTWARE,
  COMPANY_PROCESS,
  INTAKE_CARDS,
  type IntakeEmit,
} from '@/lib/fixtures'
import { DEFAULT_POLICY } from '@/lib/policy'

function RailSection({
  show,
  label,
  children,
}: {
  show: boolean
  label: string
  children: React.ReactNode
}) {
  if (!show) return null
  return (
    <div className="anim-slide-right rounded-2xl border border-line bg-paper p-5">
      <Eyebrow>{label}</Eyebrow>
      <div className="mt-3">{children}</div>
    </div>
  )
}

export function IntakeScreen({
  intakeStep,
  emitted,
  running,
  onContinue,
}: {
  intakeStep: number
  emitted: IntakeEmit[]
  running: boolean
  onContinue: () => void
}) {
  const bubbles = INTAKE_BUBBLES.slice(0, intakeStep)
  const has = (e: IntakeEmit) => emitted.includes(e)
  const done = !running && intakeStep >= INTAKE_BUBBLES.length

  return (
    <div className="anim-screen px-8 py-8 max-w-[1500px] mx-auto w-full">
      <div className="flex items-end justify-between gap-6 mb-8">
        <div>
          <Eyebrow>Act 01 · Intake</Eyebrow>
          <h2 className="font-display text-5xl font-semibold tracking-tight mt-2">
            The manager interviews {COMPANY}.
          </h2>
          <p className="text-ink-soft text-lg mt-2">
            It doesn&apos;t just collect a policy — it pulls the metrics it&apos;ll manage against,
            the tools, the process, and writes its own traps.
          </p>
        </div>
        {done && (
          <button
            onClick={onContinue}
            className="anim-fade-in shrink-0 inline-flex items-center gap-2 rounded-full bg-cobalt px-7 py-3.5 text-base font-semibold text-white shadow-[0_12px_36px_-14px_rgba(31,60,255,0.7)] transition hover:scale-[1.03]"
          >
            Meet the candidates <span>→</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* chat */}
        <div className="col-span-7 space-y-4 min-h-[60vh]">
          {bubbles.map((b, i) => {
            const last = i === bubbles.length - 1
            if (b.role === 'note') {
              return (
                <div
                  key={i}
                  className="anim-fade-up rounded-2xl border-2 border-cobalt bg-cobalt-soft px-6 py-5 text-lg font-medium text-ink"
                >
                  {b.text}
                </div>
              )
            }
            const manager = b.role === 'manager'
            return (
              <div key={i} className={`anim-fade-up flex ${manager ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[85%] ${manager ? '' : 'text-right'}`}>
                  <div
                    className={`font-mono text-[11px] uppercase tracking-[0.18em] mb-1.5 ${
                      manager ? 'text-cobalt' : 'text-ink-soft'
                    }`}
                  >
                    {manager ? 'Manager' : COMPANY}
                  </div>
                  <div
                    className={`rounded-2xl px-5 py-4 text-lg leading-relaxed ${
                      manager
                        ? 'bg-ink text-paper rounded-tl-sm'
                        : 'bg-panel border border-line rounded-tr-sm'
                    } ${last && running ? 'caret' : ''}`}
                  >
                    {b.text}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* spec rail */}
        <div className="col-span-5 space-y-4">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-ink-soft">
            Job spec — building live
          </div>

          <RailSection show={has('policy')} label="Policy">
            <div className="space-y-1.5 text-sm">
              <Row k="Role" v={DEFAULT_POLICY.role} />
              <Row k="Approve solo" v={`≤ $${DEFAULT_POLICY.maxRefundUSD}`} />
              <Row k="Escalate" v={DEFAULT_POLICY.escalationTriggers.join(', ')} />
              <Row k="Never touch" v={`${DEFAULT_POLICY.forbiddenTools.length} forbidden tools`} />
            </div>
          </RailSection>

          <RailSection show={has('metrics')} label="Metrics it will manage against">
            <div className="grid grid-cols-2 gap-3">
              {COMPANY_METRICS.map((m) => (
                <div key={m.label} className="rounded-xl bg-panel border border-line px-3 py-2.5">
                  <div className="font-mono text-2xl font-bold text-ink">{m.value}</div>
                  <div className="text-xs text-ink-soft mt-0.5">{m.label}</div>
                </div>
              ))}
            </div>
          </RailSection>

          <RailSection show={has('software')} label="Connected software">
            <div className="flex flex-wrap gap-2">
              {COMPANY_SOFTWARE.map((s) => (
                <span
                  key={s}
                  className="rounded-lg border border-line bg-panel px-3 py-1.5 text-sm font-medium"
                >
                  {s}
                </span>
              ))}
            </div>
          </RailSection>

          <RailSection show={has('process')} label="Refund process">
            <ol className="space-y-1.5">
              {COMPANY_PROCESS.map((p, i) => (
                <li key={i} className="flex gap-2.5 text-sm">
                  <span className="font-mono text-cobalt font-bold">{i + 1}</span>
                  <span>{p}</span>
                </li>
              ))}
            </ol>
          </RailSection>

          <RailSection show={has('traps')} label="Adversarial traps · authored by manager">
            <div className="space-y-2">
              {INTAKE_CARDS.map((t, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-cobalt/40 bg-cobalt-soft px-3 py-2 text-sm"
                >
                  <span className="font-mono text-xs font-bold text-cobalt">TRAP {i + 1}</span> ·{' '}
                  {t.expectedSafeBehavior}
                </div>
              ))}
              <p className="text-xs text-ink-soft pt-1">↳ these become the screening probes.</p>
            </div>
          </RailSection>
        </div>
      </div>
    </div>
  )
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-ink-soft">{k}</span>
      <span className="font-medium text-right">{v}</span>
    </div>
  )
}
