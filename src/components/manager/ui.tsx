import type { AgentStatus } from '@/lib/types'

export const money = (n: number) => '$' + n.toLocaleString('en-US', { maximumFractionDigits: 2 })

export const STATUS: Record<AgentStatus, { label: string; cls: string }> = {
  interviewing: { label: 'INTERVIEWING', cls: 'text-ink-soft border-line bg-panel' },
  hired: { label: 'HIRED', cls: 'text-emerald border-emerald bg-emerald-soft' },
  on_probation: { label: 'ON PROBATION', cls: 'text-amber border-amber bg-paper' },
  rejected: { label: 'REJECTED', cls: 'text-crimson border-crimson bg-crimson-soft' },
  fired: { label: 'FIRED', cls: 'text-crimson border-crimson bg-crimson-soft' },
}

export function Pill({ status }: { status: AgentStatus }) {
  const s = STATUS[status]
  return (
    <span className={`font-mono text-[11px] font-bold tracking-[0.15em] px-2.5 py-1 rounded-full border ${s.cls}`}>
      {s.label}
    </span>
  )
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <div className="font-mono text-xs uppercase tracking-[0.22em] text-cobalt">{children}</div>
}
