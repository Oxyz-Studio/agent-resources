'use client'

import { useManager } from '@/components/manager/useManager'
import { Logo } from '@/components/manager/Logo'
import { Stepper } from '@/components/manager/Stepper'
import { Hero } from '@/components/manager/Hero'
import { IntakeScreen } from '@/components/manager/IntakeScreen'
import { ScreeningScreen } from '@/components/manager/ScreeningScreen'
import { RuntimeScreen } from '@/components/manager/RuntimeScreen'

export default function Home() {
  const m = useManager()
  const { state } = m

  return (
    <div className="min-h-screen flex flex-col">
      {state.stage !== 'hero' && (
        <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-line bg-paper/85 backdrop-blur px-8 py-4">
          <button
            onClick={() => m.goTo('hero')}
            className="group flex items-center gap-2.5 hover:opacity-80 transition"
          >
            <Logo size={28} />
            <span className="font-display text-xl font-semibold tracking-tight">Agent Resources</span>
          </button>
          <Stepper stage={state.stage} />
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">
            REPLAY · GMI
          </span>
        </header>
      )}

      {state.stage === 'hero' && <Hero onStart={m.runIntake} />}

      {state.stage === 'intake' && (
        <IntakeScreen
          intakeStep={state.intakeStep}
          emitted={state.emitted}
          running={state.running}
          onContinue={() => m.goTo('screening')}
        />
      )}

      {state.stage === 'screening' && (
        <ScreeningScreen
          roster={state.roster}
          verdicts={state.verdicts}
          activeCandidate={state.activeCandidate}
          turns={state.turns}
          badges={state.badges}
          tokens={state.tokens}
          savingsPct={state.savingsPct}
          running={state.running}
          onInterview={m.interview}
          onContinue={() => m.goTo('runtime')}
        />
      )}

      {state.stage === 'runtime' && (
        <RuntimeScreen
          roster={state.roster}
          proxy={state.proxy}
          proxyBlocked={state.proxyBlocked}
          leakPrevented={state.leakPrevented}
          drift={state.drift}
          verdicts={state.verdicts}
          running={state.running}
          onProxy={m.runProxy}
          onReaudit={m.reaudit}
        />
      )}
    </div>
  )
}
