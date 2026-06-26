import { Eyebrow } from './ui'

const VERBS = ['Define', 'Screen', 'Hire', 'Enforce', 'Re-audit', 'Fire']

export function Hero({ onStart }: { onStart: () => void }) {
  return (
    <section className="relative flex-1 grid place-items-center overflow-hidden px-8 py-16">
      <div className="absolute inset-0 bg-grid opacity-60 pointer-events-none" />
      <div className="absolute -top-32 -right-24 w-[36rem] h-[36rem] rounded-full bg-cobalt-soft blur-3xl opacity-50 float-y pointer-events-none" />

      <div className="relative max-w-5xl text-center">
        <div className="anim-fade-up" style={{ animationDelay: '0ms' }}>
          <Eyebrow>An HR department for your AI workforce</Eyebrow>
        </div>

        <h1
          className="anim-fade-up font-display font-semibold tracking-[-0.02em] leading-[0.96] mt-6 text-[clamp(2.75rem,7.5vw,6.5rem)]"
          style={{ animationDelay: '90ms' }}
        >
          Hire, manage &amp; fire
          <br />
          the agents you put
          <br />
          <span className="text-cobalt italic">in production.</span>
        </h1>

        <p
          className="anim-fade-up mx-auto mt-8 max-w-2xl text-lg md:text-xl text-ink-soft leading-relaxed"
          style={{ animationDelay: '180ms' }}
        >
          Companies are shipping AI agents that touch real money and real customers — with no
          interview, no restrictions, and no way to fire the one that drifts. We&apos;re the manager.
        </p>

        <div
          className="anim-fade-up mt-10 flex flex-wrap items-center justify-center gap-2"
          style={{ animationDelay: '260ms' }}
        >
          {VERBS.map((v, i) => (
            <span key={v} className="flex items-center gap-2">
              <span className="font-mono text-sm uppercase tracking-widest text-ink">{v}</span>
              {i < VERBS.length - 1 && <span className="text-cobalt">→</span>}
            </span>
          ))}
        </div>

        <div className="anim-fade-up mt-12" style={{ animationDelay: '360ms' }}>
          <button
            onClick={onStart}
            className="group inline-flex items-center gap-3 rounded-full bg-cobalt px-9 py-4 text-lg font-semibold text-white shadow-[0_12px_40px_-12px_rgba(31,60,255,0.6)] transition hover:scale-[1.03] active:scale-100"
          >
            Define the job
            <span className="transition group-hover:translate-x-1">→</span>
          </button>
          <p className="mt-5 font-mono text-xs uppercase tracking-[0.18em] text-ink-soft/70">
            Demo · hiring a Refund Support Agent for RocketRide · powered by GMI
          </p>
        </div>
      </div>
    </section>
  )
}
