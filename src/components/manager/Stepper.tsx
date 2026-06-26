import type { Stage } from './useManager'

const STEPS: { id: Stage; n: string; label: string }[] = [
  { id: 'intake', n: '01', label: 'Define the job' },
  { id: 'screening', n: '02', label: 'Screen & hire' },
  { id: 'runtime', n: '03', label: 'Manage in production' },
]

export function Stepper({ stage }: { stage: Stage }) {
  if (stage === 'hero') return null
  const current = STEPS.findIndex((s) => s.id === stage)
  return (
    <nav className="flex items-center gap-3">
      {STEPS.map((s, i) => {
        const active = i === current
        const done = i < current
        return (
          <div key={s.id} className="flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              <span
                className={`grid place-items-center w-7 h-7 rounded-full font-mono text-xs font-bold transition ${
                  active
                    ? 'bg-cobalt text-white'
                    : done
                      ? 'bg-ink text-white'
                      : 'bg-panel-2 text-ink-soft'
                }`}
              >
                {done ? '✓' : s.n}
              </span>
              <span
                className={`text-sm font-semibold tracking-tight transition ${
                  active ? 'text-ink' : done ? 'text-ink-soft' : 'text-ink-soft/50'
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && <span className="w-8 h-px bg-line" />}
          </div>
        )
      })}
    </nav>
  )
}
