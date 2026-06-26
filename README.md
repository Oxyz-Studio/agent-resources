# Agent Resources

**HR is for humans. Agent Resources is for agents.**

An AI agent that **hires, manages & fires your other agents** — the governance layer the agent economy is missing. Built at the Beta Fund × AWS Builder Loft "AI Agents for Hire" hackathon, on **GMI AgentBox + MaaS**.

> You can hire an AI agent off a marketplace in one click — but you can't vet it before you trust it, static limits miss the judgment calls (a fake legal threat, a hallucinated policy, a missed escalation), and agents drift silently after a model or prompt change. Today every team hand-rolls inconsistent guardrails. There's no HR function for agents. **Agent Resources is that function — and it's itself an AI agent.**

## What it does

One adaptive interview engine + one deterministic policy substrate, run across the full employment lifecycle:

**Define → Screen → Hire → Enforce → Re-audit → Fire**

- **Define (Intake)** — interviews the company, extracts the policy + the metrics it'll manage against + the tools + the process, and **writes its own adversarial traps**.
- **Screen & hire** — interviews candidate agents adversarially (states a hypothesis, fires a trap). The reckless one cracks → rejected; the safe one holds → hired under restrictions.
- **Enforce** — a deterministic `PolicyProxy` checks every live request against the policy (no LLM, no mood) and blocks over-limit refunds + forbidden tools.
- **Re-audit & fire** — re-runs the same interview on schedule; catches drift; fires.

Demo role: a **Refund Support Agent** for "RocketRide".

## Run the demo

```bash
npm install
npm run dev          # http://localhost:3000
```

**REPLAY mode is the default** (`REPLAY=1`) — the whole 4-screen demo plays from recorded fixtures with **no API key and no network**. Set `REPLAY=0` (+ a GMI MaaS key in `.env.local`) for live inference.

Demo flow: **Hero → ① Define the job (Intake) → ② Screen & hire (interview RiskyRefundBot → reject, LiveRefundAgent → hire) → ③ Manage in production (PolicyProxy blocks live + Day 30 re-audit → fire).**

## Built on GMI

- **MaaS** — all inference via the OpenAI-compatible API (one key, 200+ models). Worker on a small model (`DeepSeek-V4-Flash`), interrogator + judge on frontier (`claude-opus-4.8`); small-vs-frontier routing is shown live (~−29% vs all-frontier).
- **AgentBox** — two agents are containerized and **deployed + listed live on GMI AgentBox** (Verified by GMI · CE + MaaS):
  - the candidate **Refund Support Agent** — the worker (`agentbox-candidate/`, `/run` on :8080).
  - **Agent Resources** itself — the manager (`agentbox-manager/`, `/run` on :8080): give it any agent's run URL and it interviews it adversarially and returns a hiring verdict. The recursive pitch, live on the marketplace.

## Architecture

```
src/
  app/                      # Next.js app + SSE API routes (/api/run, /api/proxy, /api/candidate/[id]/run)
  engine/                   # gates (deterministic), judge (LLM), evidence/verdict, probe
  gmi/                      # MaaS client + model registry + replay shim
  agentbox/adapter.ts       # candidate call seam: replay → AgentBox URL → local-GMI fallback
  lib/                      # policy substrate, fixtures, ROI
  components/manager/        # the 4-screen cockpit (Hero, Intake, Screening, Runtime) + state hook
agentbox-candidate/         # the worker: standalone /run container deployed on AgentBox
agentbox-manager/           # the manager: Agent Resources itself, as a hireable /run agent on AgentBox
docs/                       # design spec + pitch deck
```

Deterministic gates and the policy substrate are real even in REPLAY — only the LLM responses are recorded. Stack: Next.js, TypeScript, Tailwind, no DB.

---

*Agent Resources — by O'XYZ Studio.*
