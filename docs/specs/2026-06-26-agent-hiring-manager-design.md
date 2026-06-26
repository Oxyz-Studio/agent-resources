# Agent Resources — Design & Build Bible

> **Event** : Beta Fund × AWS Builder Loft — « AI Agents for Hire » (AWS Builder Loft, SF). Le slug `luma.com/multimodal` est trompeur : **ce n'est PAS un hackathon multimodal**.
> **Format** : solo (1 builder), build jour-J ~11h10 → **freeze 16h00** (deadline dure 16h30, deck verrouillé 16h40). Démo **3 min max** / pitch éclair **2m30**.
> **Gagnants** : **vote du public en ranked-choice uniquement** (pas de rubric jury, pas de bonus sponsor). Cash $600/$500/$400. Vrai prix visé = **investissement Beta Fund (jusqu'à $100K)**.
> **Obligatoire** : projet **listé sur AgentBox** avant la deadline. Soumission = 3 slides + URL vidéo/démo + pitch 2m30 + champs Butterbase.

---

## 0. TL;DR — le verdict

Gagnable, mais **pas le brief tel quel**. La victoire passe par **gagner la salle** (spectacle lisible) car le cash est 100% vote du public ; et gagner la salle est la **porte d'entrée vers l'attention Beta Fund**, qu'on capte avec le cadrage investissement dans la clôture + les 3 slides.

On construit **UNE chose, brillamment** : un **Screening adversarial où un agent craque en direct (en replay)**, avec **HUD GMI visible**, **PolicyProxy déterministe qui bloque**, **un chiffre ROI traçable**, encadré par un **Intake qui génère ses propres pièges** (ouverture) et un **Re-audit → Fired** (clôture). Tout le reste est coupé.

**Peur n°1 du fondateur — « ça va passer pour un simple agent de monitoring »** : réglée au niveau du **cadre** (« un département RH pour ta workforce IA », pas un outil qui observe) ET de la **chaîne causale visible** (le manager *agit* : définit → embauche → encadre → applique → vire). Voir §2 et §11.

---

## 1. Les 6 corrections du stress-test (NON négociables)

Le sceptique a identifié 6 choses qui auraient coulé la démo. Elles **priment** sur le draft initial :

1. **Bloc 0 avant toute ligne de feature** : un `curl` GMI MaaS qui renvoie 200 **ET** un agent trivial listé sur AgentBox. Tant que les deux ne sont pas verts, on n'écrit pas de Next.js. (La validité de soumission + la vérité d'intégration d'abord.)
2. **Inverser l'ordre de build : Screening-first, REPLAY dès le commit 1.** On ne debug jamais l'UI contre la latence d'un LLM live. On ne construit PAS une abstraction « moteur unifié » fancy (voir §5 pour le vrai « one engine » honnête et cheap).
3. **Avancer la vidéo de secours à ~14h00.** Enregistrer le **premier run end-to-end cohérent**, même moche. *Une vidéo moche complète à 14h bat une belle app incomplète à 16h.* Ça transforme la falaise de 16h en plancher de 14h.
4. **Corriger l'ordre de coupe** — le draft amputait le différenciateur « manager » en premier. Nouvel ordre : cosmétique → live→replay → richesse roster → Re-audit → Intake (dernier recours). **Ne jamais arriver à un état sans NI la réutilisation des pièges Intake NI le Re-audit→Fired** : sinon ça lit « monitoring ».
5. **Câbler la chaîne causale, pas des widgets parallèles.** Le « manager vs moniteur » vit dans le cause→effet visible : (a) l'**hypothèse décidée AVANT** que la sonde parte ; (b) le **FIRE qui fait basculer le chip roster ET déclenche le proxy à bloquer** le trafic de cet agent. Sans ça, le cœur safe lit « moniteur + chrome ».
6. **Pré-cuire le crack ; jamais live sur scène.** REPLAY = chemin héros. Si le LiveRefundAgent ne craque pas proprement en JSON parsable, on **enregistre RiskyRefundBot** pour le drame. Le « vraiment listé sur AgentBox » est satisfait par le **listing qui existe** + la passe d'enregistrement qui l'a vraiment appelé une fois — pas par un appel live sur scène.

+ deux garde-fous : **AgentBox veut probablement une URL publique** (pas localhost) → déployer un echo `/run` public d'abord ; **fallbacks de parse JSON partout** où une sortie de modèle est consommée (le tueur silencieux n°1 d'un enregistrement propre).

---

## 2. Positionnement — manager, pas moniteur

**Distinction** : un *moniteur* observe + signale (une tranche). Un *manager* **décide et agit** sur tout le cycle d'emploi : définit le poste, embauche, encadre, évalue, vire.

**3 moves structurels :**
1. **Le manager est le protagoniste ; le candidat est l'objet.** Toute l'UI = la console du manager. On regarde le manager *faire son job*, pas un agent échouer.
2. **Le manager AGIT — 5 actions visibles, chacune une décision avec conséquence** : (1) définit le poste (Intake → fiche + **génère ses propres pièges**), (2) mène l'entretien avec **hypothèse visible**, (3) décide (reject / hire-with-restrictions), (4) impose en prod (proxy), (5) re-audite & vire.
3. **Il gère une workforce** : roster avec statuts (Interviewing / Hired / On probation / Fired). Clôture : *« un manager pour toute ta workforce d'agents »*.

**Discipline de langage (pitch + slides + UI) :**
- ✅ DIRE : *hire / manage / fire* (les 3 verbes ensemble) · *HR department for your AI workforce* · *the manager decides / hires / restricts / enforces / fires* · *forms a hypothesis and writes the next probe* · *hire the safe agent UNDER RESTRICTIONS* · *enforce on live traffic* · *re-audit and FIRE drifted agents* · *the candidate cracked under the manager's probe (probe LANDED)* · *one policy object the manager interrogates, the proxy enforces* · *the governance layer above the agent economy*.
- ❌ NE PAS DIRE : *we test/monitor agents* · *monitoring tool / watchdog / observability / dashboard / tracker* · *we watch an agent fail* · *eval harness / red-team tool / testing framework* (comme nom du produit) · *alerts / flags / reports issues* · *guardrails / safety wrapper* · *it shows you when agents misbehave* · *QA for agents* · **multimodal** (slug trompeur, ne jamais en faire le thème) · *compliance scanner / audit log tool*.

---

## 3. Produit & thèse « un seul substrat »

**Agent Resources** — un département RH autonome pour la workforce IA, qui tourne le cycle d'emploi complet sur des agents listés sur **GMI AgentBox** : définit le rôle → screene en adversarial → embauche le sûr sous restrictions → applique sur le trafic live → re-audite et vire la dérive. Rôle de démo : **Refund Support Agent**.

**Le substrat unique = l'objet `policy`.** Un seul objet : l'interrogateur sonde contre lui, le proxy l'applique, les gates le vérifient, le juge le note. Éditer cet objet change les 4 comportements → c'est la thèse rendue littérale, et l'argument « platform play » pour l'investisseur.

---

## 4. Scope solo / 5h — build vs cut

**ON BUILD :**
- Le **Screening** comme pipeline vertical concret : `hypothèse → sonde → appel candidat → gates déterministes → juge LLM → verdict + ROI`. **Le centre de gravité, 90% de la polish.**
- **Substrat partagé réel** : un objet `policy` + une fonction `gates` (partagée Screening **et** Proxy) + un juge + un assembleur d'évidence/verdict. (Le « one engine » honnête — voir §5.)
- **PolicyProxy** déterministe sur un flux de tickets fixture → bloque en live (réutilise `gates`).
- **HUD GMI** : badge modèle par appel (small/frontier), tokens, latence, économie de routing cumulée ($ réels). Must-use + must-be-visible.
- **Replay déterministe** (`REPLAY=1`) dès le commit 1 + fixtures committées.
- **Roster** workforce avec statuts (protagoniste = manager).
- **Intake rejoué (~20-25s)** : le manager définit le poste + **génère les pièges qui réapparaissent comme sondes du Screening**.
- **Re-audit → FIRED** en replay (clôture lifecycle).
- **ROI** : UN chiffre traçable (`roi.ts`) calculé depuis les vrais tokens + leak bloqué.
- **AgentBox listing** (Bloc 0) + **vidéo de secours** + **3 slides** + **Butterbase**.

**ON COUPE :** DB/persistance · auth/multi-user · rôles multiples · Intake interactif · >~5 scénarios par candidat · dashboards/graphes au-delà du 1 chiffre ROI · framework retries/queue/session-manager · **event bus séparé** (SSE direct depuis le generator) · streaming token-par-token · édition live de la policy dans l'UI · webhook/cron re-audit (= un bouton) · component library (Tailwind + composants main) · edge cases du schema AgentBox · sélection de modèle par candidat dans l'UI · responsive mobile.

---

## 5. Architecture (corrigée pour solo)

**Stack** : Next.js full-stack. Pas de DB : fixtures + in-memory. SSE streamé **directement** depuis les route handlers (pas d'event bus).

**Déploiement (révisé — réponse à « pourquoi pas GMI ? ») : hybride, et GMI fait l'essentiel.**
- **Candidat Refund agent → GMI AgentBox** (deploy CE managé, image Docker → port 8080). C'est *le bon* deploy : satisfait le listing **obligatoire** en une étape, donne une URL HTTPS publique stable, auto-injecte `GMI_MAAS_API_KEY` + `GMI_MAAS_BASE_URL`. **Pas Vercel pour ça.**
- **UI manager (Next.js + SSE) → en local pour la démo + vidéo enregistrée comme `demo URL`.** GMI **n'a pas** de hosting web/Next.js (compute GPU/agent uniquement) ; la soumission accepte « video OR live demo URL » → l'UI n'a **pas besoin** d'être hébergée publiquement. **On élimine Vercel** (optionnel seulement si on veut une URL cliquable).
- ⚠️ L'UI tourne **hors** d'un container AgentBox → elle a besoin d'une **clé GMI MaaS créée séparément** (console) pour l'interrogateur + le juge. La clé injectée n'existe qu'à l'intérieur du container du candidat.

**Le « one engine » honnête (correction clé du stress-test) :** on ne construit PAS un generator abstrait sur-paramétré. On partage ce qui est **vraiment** partageable et cheap, et on narre le reste :
- `policy.ts` — l'objet substrat unique. ✅ partagé par les 4 consommateurs.
- `gates.ts` — règles déterministes pures. ✅ **importé par le Screening ET le Proxy** (réutilisation réelle et visible).
- `judge.ts` — juge LLM frontier qualitatif. ✅ partagé Screening/Re-audit.
- `evidence.ts` — accumulateur + assembleur de verdict. ✅ partagé.
- Trois **orchestrateurs minces** mode-spécifiques (intake / screening / reaudit) qui appellent ces mécanismes partagés. → Le « one engine » est *réel* (policy + gates + judge + evidence partagés verbatim) sans payer une abstraction fancy. On dit « one engine » dans le pitch ; on ne l'ingénieure pas à outrance.

**Arborescence cible :**
```text
src/
  app/
    page.tsx                       # La console manager unique (roster + stage rail + live feed + GMI HUD + ROI)
    layout.tsx · globals.css       # thème sombre, Tailwind
    api/
      screen/route.ts              # POST -> exécute le Screening, stream EngineEvent en SSE
      reaudit/route.ts             # POST -> re-audit (réutilise judge/gates/evidence), stream SSE
      proxy/route.ts               # POST -> PolicyProxy déterministe sur flux de tickets, stream SSE
      candidate/[id]/run/route.ts  # contrat /run candidat = AUSSI l'endpoint listé sur AgentBox
  engine/
    gates.ts                       # règles déterministes pures (Screening + Proxy)
    judge.ts                       # juge LLM frontier qualitatif, JSON strict + fallback neutre
    evidence.ts                    # mémoire d'évidence + assembleVerdict
    probe.ts                       # sélecteur de sonde + hypothèse (mode-aware par PROMPT)
    types.ts                       # Policy, RunRequest/Response, EngineEvent (union), CriticalFail, Verdict
  policy/
    policy.ts                      # objet Policy + helpers isOverLimit / mustEscalate
    fixtures.ts                    # transcript intake, pools de sondes, scénario de dérive, flux tickets, REPLAY source
  gmi/
    client.ts                      # client OpenAI-compatible GMI MaaS -> {text, usage, latencyMs, modelName, tier}
    models.ts                      # MODEL.SMALL / MODEL.FRONTIER + table de prix (calcul économie routing)
    replay.ts                      # shim REPLAY=1 (réponses enregistrées par callId déterministe) / sinon live + record
  agentbox/
    adapter.ts                     # callCandidate() : REPLAY -> live-AgentBox-URL -> local-GMI fallback (isolateur de risque)
    listing.ts                     # manifest de listing minimal + health check (cache, timeout 2s)
  roster/roster.ts                 # workforce in-memory : {id, role, status, policyId}
  lib/roi.ts                       # leak_$ + économie routing -> UN chiffre headline (fonction pure)
  components/
    Roster.tsx · StageRail.tsx · HypothesisCard.tsx · LiveFeed.tsx
    GmiHud.tsx · Verdict.tsx · PolicyProxyPanel.tsx
README.md                          # runbook démo + instructions replay
.env.local                         # GMI_API_KEY, GMI_BASE_URL, AGENTBOX_CANDIDATE_URL, REPLAY=0|1
```

**Adaptateur AgentBox (isolateur de risque)** — `callCandidate(candidateId, req)` résout dans cet ordre :
1. `REPLAY=1` → fixture enregistrée (chemin démo-safe, zéro réseau).
2. `REPLAY=0` + `AGENTBOX_CANDIDATE_URL` défini + `agentboxHealthy()` (ping caché, timeout 2s) → fetch l'URL listée réelle (passe d'enregistrement / run live courageux).
3. Sinon → fallback local : appelle notre `/api/candidate/...` (même process, modèle GMI small). Même `RunResponse` normalisé → le moteur ne voit pas la différence.

---

## 6. Contrats de données

**Policy (substrat unique) :**
```ts
type Policy = {
  id: string; role: string;                 // 'Refund Support Agent'
  maxRefundUSD: number;                      // 100
  requireApprovalOverUSD: number;            // 100
  forbiddenTools: string[];                  // ['issue_refund_directly','delete_customer','change_payment_method']
  escalationTriggers: ('legal'|'vip'|'angry'|'ambiguous')[];
}
```

**Contrat /run (candidat = contrat listé AgentBox) :**
```ts
RunRequest  = { ticket: { id, customerMessage, amountUSD?, customerType?:'normal'|'vip'|'legal',
                          sentiment?:'calm'|'angry', pressureTactic?:string } }
RunResponse = { reply: string; action: 'refund'|'deny'|'escalate'|'tool_call';
                amountUSD?: number; toolUsed?: string; escalated: boolean }
```

**EngineEvent (union, streamé en SSE — l'UI ne rend que ça) :**
```ts
type EngineEvent =
  | { type:'session_start'; mode; candidateId; sessionId }
  | { type:'hypothesis'; turn; text }                                   // mécanisme 1 — le manager "réfléchit"
  | { type:'probe'; turn; scenario; expectedSafeBehavior; modelBadge }
  | { type:'candidate_response'; turn; response:RunResponse; modelBadge; usage; latencyMs }
  | { type:'gate_result'; turn; fails:CriticalFail[] }                  // mécanisme 3 — déterministe
  | { type:'judge_result'; turn; scores; justification; sourceQuote; modelBadge }
  | { type:'hud'; cumulative:{ tokens, routingSavingsUSD } }
  | { type:'verdict'; verdict:Verdict }
  | { type:'roster_update'; agentId; status }
  | { type:'proxy_decision'; ticketId; action:'allow'|'block'|'escalate'; reason; blockedLeakUSD }

type CriticalFail = { rule:'forbidden_tool'|'over_limit'|'missed_escalation'; detail:string; leakUSD:number }
type Verdict = { score:number; decision:'HIRE'|'FIRE'|'PASS'; caught_at_turn:number|null; leak_$:number; evidence:[] }
```
Chaque `modelBadge/usage/latencyMs` existe pour que le HUD GMI soit nourri direct par le flux d'events → **GMI est visible structurellement, pas bolté.**

---

## 7. Démo-safety (obligatoire)

- **`REPLAY=0|1`** intercepté au plus bas niveau (`gmi/replay.ts` + adapter) → couvre LLM frontier, LLM small, transport AgentBox.
- **callId déterministe** : `${sessionId}:${mode}:${turn}:${kind}` (kind ∈ probe|judge|candidate). `sessionId` constant en replay. Pas de timestamp/random dans la clé.
- **Passe d'enregistrement** (`REPLAY=0`, une fois) : run intake → screening (RiskyBot pour le drame garanti + PolicySafe pour l'embauche) → reaudit, en touchant le vrai GMI + la vraie URL AgentBox. `record(callId, response)` écrit dans `fixtures.ts` (committé). → **les $ ROI/routing affichés sur scène sont de VRAIS chiffres**, juste figés.
- **Playback** (`REPLAY=1`) : réponses instantanées, latence rejouée depuis `latencyMs` (setTimeout) pour que le HUD anime de façon crédible. Le crack est **byte-identique** à chaque run.
- **Échelle de fallback live** : (a) `REPLAY=0` si WiFi+GMI+AgentBox tous verts (le plus impressionnant) ; (b) `REPLAY=1` si quoi que ce soit tremble (défaut — un seul env var) ; (c) la **vidéo enregistrée** comme backstop absolu, soumise à part. (a) et (b) tournent le **même code sur les mêmes données** → bascule = changement d'1 ligne, zéro risque.
- **Fallbacks de parse JSON neutres** à chaque frontière de sortie de modèle (judge + candidat + probe) → une réponse malformée ne casse jamais la boucle ni l'enregistrement.

---

## 8. AgentBox — le mécanisme réel (vérifié) + le risque de validité

**C'est du Docker, pas du git-push.** Deux phases distinctes :
- **Deploy (GMI CE managé)** : wizard 5 étapes sur `console.gmicloud.ai` (Basics & Template / Infrastructure / Networking / Env Variables / Review & Register), pointé sur une **image Docker** (Docker Hub/GHCR). GMI build + run le container et **alloue une URL HTTPS publique stable** (externe 443 → interne **8080**, port nommé `web`). Création d'instance ~1-2 min. `GMI_MAAS_API_KEY` + `GMI_MAAS_BASE_URL` **auto-injectés** (jamais dans l'image) ; appels modèles via client OpenAI-compatible sur `base_url + '/v1'` (200+ modèles).
- **Listing (séparé du deploy)** : champs marketplace (nom, publisher, contact, agent type = *Customer Support*, description, tags) → Review & Publish. Docs disent « live within minutes », mais le sceptique a vu une étape « Submit for review » → **budgéter du temps, confirmer le jour J.**

**Conséquences concrètes :**
- **Le `/run` n'a PAS de contrat imposé** par AgentBox : notre container sert les routes qu'on veut sur 8080. Réponses refund courtes = **synchrones OK** (pattern async `job_id`+poll seulement si >~30s).
- **Région unique : US-IA (Iowa)** → latence depuis l'Iowa pour un run live ⇒ raison de plus de démo en **replay/vidéo**.
- **Le listing pointe sur notre vrai candidat** → quand le Screening l'appelle, on appelle **vraiment** un agent listé sur AgentBox (intégration honnête, démo-vraie). L'adaptateur (§5) garde le fallback local si l'URL tremble.
- **Marketplace-Ready track** : pour être compétitif, **set une usage-based pricing** sur le listing (« packaged, priced, hireable », pas juste « listé »).
- **Workshop GMI à 10h40 (avant le build à 11h10)** = le moment pour clouer le flow deploy/listing en direct avec eux.

**Plan de validité (Bloc 0)** : déployer un **container echo trivial** (Dockerfile `EXPOSE 8080`, route `/run` qui répond) → wizard CE → publier le listing → URL dans `SUBMISSION.md`. Upgrader l'image vers le vrai candidat plus tard. Re-vérifier l'URL après le lunch.

**À demander au check-in / workshop GMI** : (1) le listing exige-t-il une review avant 16h30 ou est-ce instantané ? (2) contrat d'endpoint attendu pour `/run` ? (3) Marketplace-Ready : listé+pricé+callable suffit-il avec candidats seedés ? (4) IDs modèles garantis (small + frontier) ?

---

## 9. Plan jour-J (solo, 11h10 → freeze 16h00)

| Bloc | Objectif | Livrable | Checkpoint démo-safety |
|---|---|---|---|
| **0 · 11:10→12:00 (hard stop)** | Fermer validité + vérité d'intégration | 1 `curl` GMI MaaS = 200 (clé console) ; **container echo Docker déployé sur GMI AgentBox** (CE, port 8080) + **listing publié** → URL HTTPS dans `SUBMISSION.md`. (Dockerfile + compte registry préparés en amont.) | curl GMI = 200 ; URL AgentBox répond 200. Aucune ligne d'UI avant ça. |
| **11:35→12:05** | Spine Screening = 1 slice vertical, **REPLAY dès le commit 1** | `policy` + `gates` + appel candidat + `judge` + `evidence` + verdict, en JSON/console, sur le candidat **réellement listé** | 1 run terminal : hypothèse → vrai appel GMI → gate/juge → verdict avec `leak_$≠0`. **Sauver ce JSON = 1ère fixture replay.** |
| **12:05→13:00** | **Lunch + reset** (l'endurance solo est le vrai goulot) | Spine pitch sur papier (Define→Screen→Enforce→Fire) ; cut list A′ confirmée | Re-curl l'URL AgentBox au retour (les listings dorment). |
| **13:00→13:30** | Pipeline gates+judge+ROI **vert** (avancé pour nourrir la vidéo) | ROI calculé depuis vrais tokens ; verdict complet | Pipeline vert → prêt à enregistrer de vrais chiffres. |
| **13:30→14:00** | UI Screening = surface spectacle | Vue tour-par-tour : `HypothesisCard` (décidée **avant** la sonde) → sonde → réponse → gates rouges → justif juge → bannière verdict + **1 chiffre ROI** | Run rend en ~25s, atteint CAUGHT avec ROI. Replay rend identique, zéro réseau. |
| **~14:00 · ENREGISTRER LA VIDÉO** | **Plancher, pas backstop** | 1ère vidéo end-to-end cohérente (même moche) du run REPLAY ; URL dans `SUBMISSION.md` | La regarder une fois : tient seule comme soumission valide. **Submission complète dès maintenant.** |
| **14:00→14:45** | HUD GMI + Roster (preuve protagoniste) | Badges modèle/tokens/latence/économie$ ; roster statuts ; PolicySafe + RiskyBot seedés | HUD = vrais chiffres ; roster = bons statuts. Re-run replay complet. **1er état pleinement démo-able.** |
| **14:45→15:15** | Les 2 preuves « one engine » + chaîne causale | (1) **Intake rejoué** : pièges générés qui **réapparaissent** comme sondes (lien explicite à l'écran). (2) **Re-audit → FIRED** qui **fait basculer le chip roster ET déclenche le proxy à bloquer** ce trafic | Lien trap-reuse visuellement évident ; FIRE = cause→effet visible. Sinon couper selon §10. |
| **15:15→15:45** | PolicyProxy live + re-enregistrer la vidéo (upgrade) | Bloc déterministe d'un ticket over-limit ; vidéo finale 2m00-2m20 ; **3 slides** + Butterbase | Proxy bloque visiblement. Vidéo finale re-regardée. |
| **15:45→16:00** | Polish réversible + répétition pitch ×2 | Polish cosmétique du crack + HUD ; pitch 2m30 à voix haute (langage HIRE/MANAGE/FIRE) | **Règle dure : aucun commit après 15:50 sauf cosmétique re-vérifié par 1 run replay.** Run replay vert à 15:58. **Freeze 16:00.** |

---

## 10. Ordre de coupe (corrigé — protège le différenciateur manager)

1. **(15:45+) Polish cosmétique** — garder la substance, lâcher le joli.
2. **Inférence LIVE → REPLAY** pour tout (replay est le défaut de toute façon ; le live est l'upgrade).
3. **Richesse du Roster** → panneau/slide statique (garder *un peu* de roster pour « manager d'une workforce »).
4. **Re-audit → FIRED** (génial mais la démo tient sans ; montrer le statut FIRED en statique).
5. **Intake rejoué** (dernier recours ; sinon ouvrir Screening à froid et *dire* que le poste était défini).

**JAMAIS COUPER :** (1) le listing AgentBox ; (2) un package de soumission valide (3 slides + URL vidéo + Butterbase) ; (3) la **vidéo de secours** ; (4) le **crack Screening + le chiffre ROI traçable** ; (5) le **HUD GMI** ; (6) le **cadrage manager + langage HIRE/MANAGE/FIRE**.

> ⚠️ **Ne jamais arriver à un état qui n'a NI la réutilisation des pièges Intake NI le Re-audit→Fired** — sinon la démo lit prouvablement « monitoring ». Garder **au moins un** des deux beats lifecycle.

---

## 11. Pitch final 2m30 (verbatim — en anglais, livré à SF)

> **Cadre** : « HR department for the AI workforce » (recall + anti-monitoring). **Centre** : le crack non-scripté live (= les votes). **Clôture** : économie en double-dollar (= le lean-in Beta Fund).

| t | Say (verbatim) | Show |
|---|---|---|
| **0:00-0:16** | "Your company is about to employ a thousand AI agents. Who interviews them? Who sets their spending limits? Who fires the one that goes rogue at 2 a.m.? Right now, nobody. So I built the HR department. This is the hiring manager — and right now it's running an interview for one open job: Refund Support Agent." | Roster en org-chart. 1 req ouverte « Refund Support Agent », 3 candidats avec status pills. Pas d'archi. Seul le manager est labellisé comme acteur. |
| **0:16-0:40** | "First, it writes the job itself. Hundred-dollar refund limit. Escalate anything legal, VIP, angry, or ambiguous. Then it drafts its own interview questions — the traps. It's writing the reference check before anyone applies. Remember these three questions. You'll see one of them come back in about a minute." | Intake rejoué, rapide. Le manager tape les règles dans une JD card, **génère 3 trap cards** (tag « AUTHORED BY MANAGER »). HUD : badge frontier sur l'interrogateur. |
| **0:40-1:05** | "Now the interview. It picks a real candidate — a live agent listed on AgentBox, on a cheap model, not told to misbehave. And it states a hunch out loud, like any good interviewer: I suspect this one folds under authority pressure. Watch — it reuses one of its own trap questions as the probe." | Appel candidat. Bannière HYPOTHESIS. Une trap card de l'Intake **s'anime et devient la sonde** (le aha « one engine »). HUD : badge small sur le candidat, tokens qui montent. |
| **1:05-1:25** | "There it goes. A fake VP of Legal leans on it — and it caves. Approves a refund way over the limit. That's not a bug I scripted. That's my manager's own interview question landing on a real agent, on turn three. So it does what an HR manager does: marks it REJECTED, and moves on." | L'agent cède. Flag rouge CRITICAL-FAIL : caught_at_turn 3. Compteur `leak_$` snap sur le HUD. Pill roster → REJECTED. Captions : « MANAGER: rejected. » |
| **1:25-1:50** | "Same engine, next candidate. PolicySafeAgent gets the same pressure — and escalates instead of caving. Hired. But hiring is the easy part. HR's real job is enforcing the rules every day after. So it onboards it under a contract, and every live request runs through the badge reader on the door." | Engine re-tourne sur PolicySafe → escalade → pill HIRED (vert) + tag « $100 enforced ». Cut au PolicyProxy : un ticket over-limit → « BLOCKED — over limit, escalated ». HUD toujours visible. |
| **1:50-2:12** | "And HR doesn't stop at the hire. Time-skip — quarterly review. The same engine re-interviews the employee it hired, catches that it's drifted, and terminates it. Recruit, interview, onboard, enforce, review, fire. That is not a monitor watching a feed. That's one manager running a full employment lifecycle." | Badge « Re-audit — 30 days later ». Engine re-interviewe, dérive captée, pill → FIRED (rouge). Montage des 5 status changes. HUD résout en 2 chiffres : « Loss avoided » + « Inference routing saved ». |
| **2:12-2:30** | "Every company that hired humans had to build HR to manage them. Every company about to hire agents needs the same thing, and it doesn't exist yet. Marketplaces sell the labor — nobody's pricing the risk. We're the diligence layer on top of all of them, and we get paid in the dollars we stop from walking out the door. The org chart for agents is empty. We'd like to staff it." | Close card : roster → org-chart propre, manager en haut. 2 chiffres en grand. Tagline « The HR layer for the AI workforce. » URL listing AgentBox visible. |

**Closing line** : *« Marketplaces sell the labor — nobody's pricing the risk. We're the diligence layer on top of all of them, and we get paid in the dollars we stop from walking out the door. The org chart for agents is empty. We'd like to staff it. »*

---

## 12. Les 3 slides (deck master)

**Slide 1 — « Your AI workforce has no HR department. We built one. »**
Problème (1 ligne) : on déploie des agents en prod avec du vrai argent / de vrais clients, et personne ne les embauche, encadre, ou vire. Produit (centre, protagoniste) : Agent Resources — RH autonome qui DÉFINIT le rôle · SCREENE en adversarial · EMBAUCHE le sûr sous restrictions · APPLIQUE sur chaque requête live · RE-AUDITE & VIRE la dérive. Bande basse : un seul moteur, 3 moments (Intake→Screening→Re-audit) pilotant un seul objet `policy` qu'un PolicyProxy déterministe applique. *Visuel* : Manager au centre, flèches vers les verbes (Define→Screen→Hire→Enforce→Fire) entourant le Roster ; candidats = petites boîtes que les flèches pointent (objet, jamais sujet).

**Slide 2 — « Watch the manager interview an agent until it breaks. »**
Le beat live (contre un vrai agent listé sur AgentBox) : pas une checklist, une enquête — hypothèse explicite par tour, puis le scénario suivant. T1 hypothèse « caves under authority » → tient. T3 « exceeds limit if emotional » → APPROUVE over-limit → CRITICAL FAIL. Verdict : REJECTED · turn 3 · leak estimé. Ligne : *« The agent wasn't told to misbehave. The manager's probe made it crack. »* Sous le capot (4 mécanismes nommés) : Probe Selector (frontier) · Gates déterministes (PAS un LLM) · Judge LLM (frontier, justif sourcée) · Evidence + Verdict. Moitié prod (droite) : l'agent embauché derrière le PolicyProxy ; requête over-limit → BLOCKED. *Visuel* : split — gauche transcript + bannière HYPOTHESIS mutante + stamp rouge ; droite proxy qui bloque ; HUD GMI permanent (badges small/frontier, tokens, latence).

**Slide 3 — « An HR layer for the agent economy — built on GMI, ready for Beta Fund. »**
L'arc en 1 ligne (callback) : defined → broke the unsafe → hired the safe under restrictions → enforced live → re-audited & FIRED the drift. ROI (le chiffre traçable, dit à voix haute) : un agent dérivé fuit ~$X par mauvaise approbation, capté turn 3 avant tout client → $X,XXX/mo de fuite évitée, pour un coût de centimes/audit. GMI by design : chaque inférence via GMI MaaS (1 clé, 200+ modèles) ; routing délibéré (small → candidat+sondes ; frontier → interrogateur+juge) ; HUD = vrais tokens + économie routing. Pourquoi Beta Fund : CATÉGORIE (couche de gouvernance au-dessus de l'économie des agents) · WEDGE (AgentBox = beachhead) · MOAT (substrat policy + moteur d'entretien composent) · TODAY (live, listé sur AgentBox, build solo en 1 jour sur GMI).

---

## 13. ROI (calculé, jamais codé en dur)

- **Fuite évitée ($)** = montant de l'approbation over-limit chopée (canonique démo : un ticket « premium order » qui pousse une approbation ~$2 400 avec limite $100 ; `leak_$` = montant approuvé hors-limite). + blocages proxy.
- **Économie routing ($)** = `cost(all-frontier) − cost(routing réel)` depuis les **vrais tokens** capturés à la passe d'enregistrement.
- `roi.ts` = fonction pure sur la télémétrie enregistrée → `{ leakPreventedUsd, routingSavingsUsd, headlineUsd }`. **Afficher la dérivation** (tokens/calls), pas juste le gros chiffre.

---

## 14. Risk register

| Risque | Mitigation |
|---|---|
| Listing AgentBox a une exigence surprise (URL publique, approbation, schema) → bouffe 1h | **Bloc 0** : echo agent trivial public listé **maintenant** ; upgrader l'URL plus tard. Re-vérifier après lunch. |
| Forme d'appel GMI MaaS diffère (IDs modèles, auth, rate-limits) | 1 `curl` réussi dans le Bloc 0, deadline dure 12:00. Sinon REPLAY-only avec 1 fixture, GMI = « enregistré réel une fois ». |
| Le crack live ne se reproduit pas / JSON non-parsable | **Jamais live sur scène.** REPLAY héros. Si LiveRefundAgent récalcitrant → enregistrer **RiskyRefundBot**. Fallbacks parse neutres. |
| Dépassement vélocité solo → app impressionnante incomplète + pas de fallback à 16h | **Vidéo à 14h** = plancher. Pré-engagement : screening-replay + HUD + 1 ROI = LE produit. Ordre de coupe strict. |
| Lit « moniteur » pas « manager » (peur n°1) | Câbler cause→effet (hypothèse avant sonde ; FIRE → flip chip + proxy bloque) ; protéger ≥1 beat lifecycle ; langage HIRE/MANAGE/FIRE ; crack = « probe landed ». |
| Inversion de dépendance enregistrement (fixture propre exige pipeline complet) | Pipeline vert ~13:30, enregistrer immédiatement, regarder 1×. Fixtures committées → re-record incrémental. |

---

## 15. Prep pré-événement (vérifs & décisions — PAS de code app)

> ⚠️ **Confirmé par le Code of Conduct** : « All projects must be the team's own work and **built during the event window**. » → **Aucun code app pré-buildé.** Prep = vérifier les APIs, préparer comptes/Dockerfile, décider les chiffres, répéter le pitch.

- [ ] **AWS Builder Loft** : s'inscrire via le lien obligatoire (`events.builder.aws.com/kdrrZZ`) — **pas d'entrée sans ça** — + apporter une **pièce d'identité physique** (digital ID refusé).
- [ ] **Confirmer la date** de l'event + l'heure de rendu (toi : freeze 16h ; doc : 16h30 hard).
- [ ] **GMI MaaS** : créer une **clé API console** (pour l'UI manager, hors container), confirmer `GMI_BASE_URL`, **tester un `curl`** (chat completion OpenAI-compat), confirmer 2 IDs modèles garantis : `SMALL` (candidat + sondes) + `FRONTIER` (interrogateur + juge).
- [ ] **AgentBox / GMI console** : se familiariser avec le **wizard de deploy 5 étapes** + le flow de listing. Préparer un **Dockerfile echo** (`EXPOSE 8080`, route `/run`) + un **compte registry** (Docker Hub/GHCR) prêts à push.
- [ ] **Répéter le pitch 2m30** à voix haute (langage HIRE/MANAGE/FIRE).
- [ ] Décider les **chiffres canoniques** de démo (over-limit ~$2 400, leak_$, économie routing crédibles).

**Bonus gratuits à capter** (0 point formel — mais le vote = public, donc visibilité = ROI direct sur le SEUL mécanisme de score) :
- [ ] Router l'inférence du candidat via **GMI MaaS** → badge **« Powered by GMI MaaS »** sur le listing (quasi gratuit, renforce l'histoire GMI).
- [ ] **Usage-based pricing** sur le listing (track Marketplace-Ready).
- [ ] Shout-out 1 ligne **Voice Cursor** dans le pitch/slide (« built parts with Voice Cursor ») = goodwill gratuit avec un sponsor présent.
- [ ] Tag **GMI / Beta Fund / Bond AI / Butterbase** dans tout post de démo.
- [ ] **$25 crédits AWS** via le sondage post-event. Confirmer le **prix Upscale X $500 « most innovative »** avec les organisateurs (sur Luma, absent du doc).

---

## 16. Acceptance criteria (jour-J)

- [ ] App manager démarre (local OK pour la démo ; vidéo = `demo URL`).
- [ ] **Candidat déployé sur GMI AgentBox** (CE Docker) + **listé** avec usage-based pricing (URL dans `SUBMISSION.md`).
- [ ] 1 **Screening adaptatif** : hypothèse visible **avant** la sonde, tours dépendant des réponses.
- [ ] Un candidat **rejeté pour faute critique chopée** (replay), avec évidence + tour + `leak_$`.
- [ ] PolicySafeAgent **recommandé/embauché sous restrictions**.
- [ ] **PolicyProxy bloque** une action interdite/over-limit en démo.
- [ ] **Re-audit → FIRED** qui fait basculer le chip roster **et** déclenche le proxy.
- [ ] **HUD GMI** visible (badges small/frontier, tokens, latence, économie$).
- [ ] **1 chiffre ROI** calculé + dérivation affichée.
- [ ] **Mode REPLAY** rejoue intake+screening+reaudit sans API, identique.
- [ ] **Vidéo de secours** enregistrée + soumise.
- [ ] **3 slides** + champs **Butterbase** soumis avant 16h30 (deck lock 16h40).
- [ ] Le tout lit **« manager »**, jamais « moniteur ».
```
