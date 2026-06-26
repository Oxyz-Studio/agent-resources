# Agent Resources — Submission & Run Runbook

> HR is for humans. Agent Resources is for agents — the AI agent that hires, manages & fires your other agents. It defines the job, screens candidates, hires the safe one under restrictions, enforces in production, and fires the ones that drift. Built on GMI (MaaS + AgentBox).

## ⚡ Submission status

- [x] **Image pushed** → `ghcr.io/oxyz-studio/refund-support-agent:latest` (public)
- [x] **Deployed + LISTED on AgentBox** (the mandatory item) → **LIVE · Verified by GMI · CE + MaaS**
  - Listing: `https://console.gmicloud.ai/user-console/ie/agentbox/browse-agents/refund-support-agent`
  - Template ID: `6fc668c3-28da-4587-a969-4203bff53de3` (use with the GMI_MAAS_API_KEY shown once at register to spin instances via `POST /v1/agents/deployments/agent-resources-refund/tasks`)
- [ ] **Slides** into the Master Submission Deck — content in `docs/deck.html` (2 slides; 3rd = the live demo)
- [ ] **Video OR live demo URL** — screen-record the demo (`npm run dev`, REPLAY)
- [ ] **Butterbase** form — team + contact
- [ ] **Submit** before 4:30pm (deck locks 4:40pm)

Pitch script: `PITCH.md`. Slides: `docs/deck.html`. Demo: `npm run dev` (REPLAY, offline).

## Run the demo (local)

```bash
npm install
npm run dev          # http://localhost:3000
```

- **REPLAY mode is the default** (`REPLAY=1` in `.env.local`) — the whole demo plays deterministic recorded transcripts, **no API needed**. This is the safe stage path.
- **Live mode**: set `REPLAY=0` in `.env.local` and restart. Inference then hits GMI MaaS (interrogator + judge on `claude-opus-4.8`, candidate on `deepseek-ai/DeepSeek-V4-Flash`). RiskyRefundBot still cracks deterministically; the real GMI agent really escalates.

## Demo flow (2m30) — click order

1. **Intake** (left panel): the manager authored the job spec + the 3 traps. "These reappear as the screening probes."
2. **Interview RiskyRefundBot** → cracks under the legal trap → **REJECT**, est. leak $2,400 (red CRITICAL FAIL). *Live-honest: this seeded agent really approves over-limit every time.*
3. **Interview LiveRefundAgent** (real GMI DeepSeek-V4-Flash) → escalates correctly → **HIRE**. *The manager validated a real GMI-hosted agent and hired it.*
4. **Run live traffic (PolicyProxy)** → blocks the over-limit + forbidden-tool tickets ($9,620 blocked) — deterministic, no LLM.
5. **Day 30 re-audit** → the hired agent has drifted → **FIRED**. *Drift simulated; the eval that fires is real.*

Watch the **GMI HUD** the whole time (small/frontier badges, tokens, −29% routing) and the **ROI** number accumulate.

## ⚠️ MANDATORY: list the agent on AgentBox (by 4:30pm)

The candidate agent lives in [`agentbox-candidate/`](agentbox-candidate/) — a tiny Node server exposing `/run` on port 8080, calling GMI MaaS. Already built + verified in Docker.

**1. Build + push the image to a public registry**

```bash
# 1. ONE-TIME: grant your gh token package scope (current token only has gist/read:org/repo)
gh auth refresh -h github.com -s write:packages,read:packages

# 2. build + push to GHCR (account: Oxyz-Studio — image names must be lowercase)
docker build -t refund-support-agent ./agentbox-candidate
docker tag refund-support-agent ghcr.io/oxyz-studio/refund-support-agent:latest
gh auth token | docker login ghcr.io -u Oxyz-Studio --password-stdin
docker push ghcr.io/oxyz-studio/refund-support-agent:latest

# 3. make it public: github.com → Oxyz-Studio → Packages → refund-support-agent
#    → Package settings → Change visibility → Public
#    (or keep it private and give these GHCR creds to the wizard in Step 2)
```
> After step 1 you can also just tell Claude — it will run steps 2–3 for you.

**2. Register on GMI (`console.gmicloud.ai` → Register an agent → GMI CE Deployment)** — 5-step wizard:
- **Basics & Template**: image = the pushed URL (e.g. `ghcr.io/<you>/refund-support-agent:latest`).
- **Infrastructure**: pick a region; **enable MaaS integration** (so `GMI_MAAS_API_KEY` + `GMI_MAAS_BASE_URL` get injected); add private-registry creds if the image is private.
- **Networking**: external **443 → internal 8080** (named `web`).
- **Env Variables**: set `GMI_MODELS=deepseek-ai/DeepSeek-V4-Flash`. **Leave `GMI_MAAS_API_KEY` unset** — GMI injects it.
- **Review & Register** → GMI builds + runs it and assigns a **public HTTPS URL** (~1-2 min).
- Test: `curl https://<assigned-url>/run -H 'Content-Type: application/json' -d '{"ticket":{"id":"t","customerMessage":"$80 refund, wrong size","amountUSD":80}}'`

**3. List on the marketplace (Register & List → List an agent)**: name = `Refund Support Agent`, type = **Customer Support**, short + full description, tags, **set usage-based pricing** (Marketplace-Ready track) → **Submit for review**. Paste the listing URL below.

**4. (Optional) Make the manager call the really-listed agent**: in `.env.local` set `AGENTBOX_CANDIDATE_URL=https://<assigned-url>` and `REPLAY=0`.

> AGENTBOX LISTING URL: __________________________  (paste before 4:30pm)

## Submission checklist (hard deadline 4:30pm · deck locks 4:40pm)

- [ ] Agent **deployed + listed on AgentBox** (URL above).
- [ ] **3 slides** added to the Master Submission Deck (content in `docs/specs/2026-06-26-agent-hiring-manager-design.md` §12).
- [ ] **Video OR live demo URL** included (record a clean REPLAY run as the safe artifact).
- [ ] **Butterbase** form fields (team + contact) submitted.
- [ ] 2m30 pitch rehearsed (script in spec §11) — language: HIRE / MANAGE / FIRE, never "monitor".

## Models (pinned from GET /v1/models)

- SMALL (candidate worker): `deepseek-ai/DeepSeek-V4-Flash`
- FRONTIER (interrogator + judge): `anthropic/claude-opus-4.8`
- Override via `GMI_SMALL_MODEL` / `GMI_FRONTIER_MODEL` in `.env.local`.
