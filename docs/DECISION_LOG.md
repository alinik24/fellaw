# FelLaw Decision Log

## 2026-09-10 — PR-02D boundary identity + fail-closed cleanup + behavioral hardening + isolation

### Decision
Execute PR-02D (only) in an isolated sibling worktree without mutating the dirty `main` checkout, close the remaining narrow boundary inconsistencies, and establish a safe baseline for the next slice.

1. **Isolation (RIG-PROC-03):** create `Legal_Aid/fellaw-pr02d` branch `pr02d-boundary-consistency` from the recorded source HEAD `50ea13da1c2c241c0f3b563026d4ff3d6c40bf32`; transfer ONLY PR-owned cumulative changes (byte-verified); exclude the single PRE-EXISTING/OTHER path; leave the source checkout untouched. Rationale: the active checkout carries cumulative uncommitted PR work plus unrelated pre-existing changes; product edits there would entangle provenance.
2. **Entry-point contradiction:** `laws_search` must not claim `POST /api/v1/chat/message` (owned by `generic_legal_chat`). Entry points are `GET /api/v1/laws/search` + bot ask (bounded). Add a route→policy uniqueness test.
3. **is_executable fail-open:** `is_executable(unknown)` was `True`. Final contract: APPROVED→True; REVIEW_REQUIRED/DISABLED→False; unknown→False. `registry_legal_execution_status(no-policy)` stays True for navigation display. `require_executable(unknown)` already raised; keep. Only production caller (`bot_contract.render_capability`) guarded — no behavior change.
4. **Behavioral hardening (RIG-TEST-02):** replace the static adversarial test with real execution proofs: HTTP endpoint with exploding-DB/-LLM spies; real bot ask with bounded fixture; grounded L0 path with resolved user + citation assertions. Documentation may then claim "1-4 blocked/bounded, 5 grounded" on behavioral evidence.

### Consequences
- `is_executable` now fails closed on unknown ids; no production behavior change (only caller guarded).
- `laws_search` policy entry points truthful; route map uniqueness enforced by test.
- Adversarial claim now backed by executed handler/bot behavior, not policy-table inspection.
- Isolated worktree = clean PR-owned baseline for the next slice; source `main` untouched.

## 2026-09-10 — PR-02C follow-up: RIG-PR02C-06 canonical capability identity

### Decision
Unify the public capability id and the governing boundary policy id on ONE
canonical identity. The registry capability was `chat_legal_question` while
the boundary policy was `laws_search`; `registry_legal_execution_status("chat_legal_question")`
saw no policy and returned True, so a future `laws_search` policy transition
(REVIEW_REQUIRED/DISABLED) would NOT propagate to the public registry — the
capability would remain advertised as ungoverned. Root cause: UI/product
identity preserved while boundary identity was independently renamed.

Resolution (proposed remediation accepted): **one canonical id `laws_search`
across registry, boundary policy, bot ask-fallback, and frontend lookup.**
`platform_capabilities.py` capability id, `bot_contract.py` ask fallback,
and `ChatAssistant.tsx` matchCapability guard all now use `laws_search`.
The old id is removed (negative assertions in tests). The alternative
(explicit governing-policy field on Capability) was rejected as redundant —
unification removes the entire class of mismatch.

### Verification
New test `test_laws_search_policy_transition_propagates_to_registry`:
flipping `laws_search` to REVIEW_REQUIRED in the boundary lookup table
removes the capability from EVERY role's advertisement. `test_capability_lookup`
asserts the old id resolves to None. Boundary + platform suites: 41 passed.

---

## 2026-09-10 — PR-02C legal capability boundary remediation

### Decision
Close the six PR-02 review findings (RIG-PR02-01..05, RIG-PROC-02, route-count drift) with root-contract fixes, not symptom patches. Key architectural decisions:

1. **Generic generative chat is L3 REVIEW_REQUIRED** (`generic_legal_chat` policy). The user's message text IS the concrete facts; binding general chat to "no application to user's facts" is not enforceable by prompt engineering or case-context removal. The bounded A-path (`laws_search`, GET /laws/search + bot ask) remains L0 APPROVED: deterministic RAG statute/source retrieval with citations, no merits/strategy/drafting. This resolves RIG-PR02-01 without an LLM safety classifier or keyword-based primary safety (both explicitly rejected).
2. **`require_executable` fails closed on unknown policy ids.** Unknown/misspelled id -> BoundaryDisabled (configuration error). Registry display uses `registry_legal_execution_status`: no policy = ordinary navigation (untouched); gated policy = not advertised. Typos cannot enable legal operations. (RIG-PR02-02)
3. **Templates classified by OUTPUT, not implementation technology.** `document_templates` -> L4 REVIEW_REQUIRED; generation fails closed because repository template bodies/seeds cannot be verified (live DB unavailable). Listing/metadata preserved. (RIG-PR02-03)
4. **Root-fix document analysis:** new `analyze_document_extraction` L1-only operation (prompt/schema requests only summary/dates/persons/category/reference numbers; explicitly forbids legal_implications/action_required/urgency/strategy/merits). Upload pipeline uses it; result filter fails closed. Rich analyzer stays gated. (RIG-PR02-04)
5. **PUT narrowing:** `RoadmapStepLifecycleUpdate` (status only) + `NarrativeLifecycleUpdate` (is_final only), both `extra="forbid"`. Substantive legal mutation rejected at schema level. (RIG-PR02-05)
6. **Canonical route map:** `BOUNDARY_ROUTE_MAP` (12 routes -> 7 policies), tests derive from it. (route-count drift)

### Terminology
`APPROVED` / `REVIEW_REQUIRED` / `DISABLED` are **engineering execution states only**, not legal/counsel approval. `counsel_decision` remains UNKNOWN for every capability until a written opinion exists. No counsel approval is simulated anywhere.

### Verification
Backend non-live: 59 passed, 10 skipped (live-DB blocked). Boundary suite: 29 passed. Frontend: vitest 46/46, tsc clean, build OK, guard OK. No writes outside `Legal_Aid/fellaw` (scope check at run end).

---

## 2026-09-09 — PR-02 legal capability boundary / quarantine

### Decision
Quarantine every reachable capability that can produce individualized legal
judgment, strategic legal output, or case-specific legal drafting until a
written counsel decision authorizes an operating model. This is an
engineering/risk-review quarantine — it does NOT determine what is legally
permissible under the RDG.

### Canonical vocabulary (adopted unchanged from PR-02 spec)
Capability classes: `L0_GENERAL_INFORMATION`, `L1_DOCUMENT_EXPLANATION`,
`L2_PROCESS_NAVIGATION`, `L3_INDIVIDUAL_LEGAL_ASSESSMENT`,
`L4_STRATEGIC_DRAFTING_OR_REPRESENTATION`.
Approval states: `APPROVED`, `REVIEW_REQUIRED`, `DISABLED`.
Default policy: L3/L4 are REVIEW_REQUIRED (not publicly executable) until
counsel review; L0/L1/L2 are not auto-approved — each implementation is
classified by actual behavior, not name.

### Actions
- **Inventory** (complete, before any mutation): traced `counterargument_service`,
  `narrative_service`, `roadmap_service`, generic chat (`/chat/message`,
  `/chat/stream`), `analyze_document`, templates, bot intents, capability
  registry, and OpenAPI; produced the affected-surface map.
- **Canonical gate**: `backend/app/services/legal_boundary.py` — one
  `require_executable(capability_id)` fail-closed gate (before LLM/persist),
  `BoundaryDisabled` exception + deterministic typed 403 handler in `main.py`
  (capability_id, class, approval_state, safe_handoff `/urgent/select`,
  lawyer_handoff `/find-lawyer`). Capabilities with no policy record are
  outside the legal-judgment surface and are not gated.
- **Quarantined (REVIEW_REQUIRED)**: `roadmap_generation` (L3),
  `narrative_generation` (L4), `counterargument_analysis` (L4). Generation
  endpoints (`/chat/narrative`, `/chat/roadmap`, `/chat/counterargument`,
  `/cases/{id}/narratives/generate`, `/cases/{id}/roadmap/generate`) fail
  closed before any LLM call or persistence. Read-only GET/PUT of
  previously-persisted rows stays operational (dashboard compat); no NEW
  gated content can be created. Service implementations preserved
  (quarantine, not deletion).
- **Boundary-leak fixes**: `/chat/message` + `/chat/stream` no longer inject
  the user's case-specific facts block into the prompt (general RAG chat
  stays L0/L1 — grounded general information preserved, not individualized
  assessment). `analyze_document` chat endpoint gated REVIEW_REQUIRED; upload
  pipeline persists only L1 extraction fields (summary/dates/persons/category)
  and strips `legal_implications`/`action_required`/`urgency`. `document_templates`
  (pure Jinja, no AI) classified L2 APPROVED.
- **Bot/OpenClaw**: `render_capability` renders gated capabilities as
  professional-review notices with `/urgent/select` — never an actionable
  deep link into gated execution. Bot intent scan verified: L3/L4 trigger
  words resolve to `ask` (approved grounded chat) or other safe intents.
- **Product/API claim cleanup**: OpenAPI description updated to the PR-00
  canonical first-response statement (no "AI-powered", no narrative/counterargument
  advertisement). `capabilities_for_role` also excludes boundary-gated caps.
- **Counsel artifact**: `docs/LEGAL_CAPABILITY_REVIEW.md` — per-capability
  records with exact counsel questions; `counsel_decision: UNKNOWN /
  REVIEW_REQUIRED`; no counsel approval simulated.
- **LEAN_CANVAS wording**: replaced the absolute competitor-impossibility
  claim with "general AI alone does not provide FelLaw's governed,
  source-provenanced, rule-versioned deadline workflow and persistent matter
  state".
- **Tests**: `backend/tests/test_legal_boundary.py` (17) — class/approval
  coverage; L3/L4 REVIEW_REQUIRED + not executable; fail-closed before
  LLM/persist (exploding-DB handler test); deterministic typed response;
  bot no-deep-link into gated; OpenAPI no-advertise; preserved L0/L1 +
  templates; PR-01 caps stay removed; intake/dashboard not regressed.

### Verification language
PR-00B/PR-01/PR-01C/PR-02 are **IMPLEMENTED / STATIC+UNIT+BUILD VERIFIED /
LIVE INTEGRATION BLOCKED**. Backend 45 non-live tests pass (17 boundary + 28
caps/overview/bot); the 10 live-DB integration tests are skipped (environment
unavailable) and reported separately — never claimed as passed.

## 2026-09-09 — PR-01C integrity closure (intake funnels + role-correct routing)

### Decision
Close the two remaining integrity gaps before declaring PR-01 done: (1) the five
specialized intake funnels were form-only — they promised "Our AI will analyze… /
Analyze My Case" but performed no analysis and only redirected to
`/user/dashboard`; (2) `platform_overview.deep_links` sent lawyers to the citizen
`/user/dashboard` surface.

### Actions
- **Deleted the five non-persistent specialized funnels** (`NewCaseTrafficViolation`,
  `NewCaseConsumerDispute`, `NewCaseEmploymentInquiry`, `NewCaseFamilyInquiry`,
  `NewCaseVisaImmigration`) — no test/dev consumer exists; Git history is the
  archive. Legacy URLs now `<Navigate to="/new-case" replace />`.
- **Removed the remaining CTA consumer** in `NewCase.tsx` (the "Quick start /
  focused form" topic links); the aside now shows only the honest urgent-help
  entry. `/new-case` remains the single canonical persisted intake
  (`createCase()` → real `POST /api/v1/cases`).
- **Role-semantic deep links:** `dashboard`/`cases` resolve per role — citizen/admin
  → `/user/dashboard`, lawyer/anonymous → `/`. `lawyer_dashboard` capability stays
  `removed`; no professional dashboard is recreated until an honest one exists.
- **Guard + tests:** fabricated-state guard now flags non-performing analysis
  claims ("AI will analyze", "Analyze My …", "Uploaded & Analyzed") and the
  Windows path-separator bug in the allowlist was fixed; `pr01.redirection.contract`
  covers the 5 funnel redirects, deletion of the 15 removed page files, no
  misleading-analysis claims, and the `/new-case` persisted-create contract;
  backend overview tests assert role-correct deep links.

### Verification language (corrected)
PR-00B/PR-01/PR-01C are **IMPLEMENTED / STATIC+UNIT+BUILD VERIFIED / LIVE
INTEGRATION BLOCKED**. Backend 30 non-live tests pass; the 10 live-DB integration
tests were skipped (environment unavailable) and are reported separately — they
are never claimed as passed. Do not describe the slices as "fully verified".

## 2026-09-09 — PR-01 remove fabricated production surfaces

### Decision
Inventory and unroute every fabricated/frozen production surface. No reachable
production page may present invented legal, professional, financial, partner,
or success/outcome state; no navigation item may lead to a 404; capability
registry and embedded assistant must not advertise pages that no longer exist.

### Actions
- **Deleted ten fabricated production pages** (relying on Git history; not kept
  as dead design archives): `CaseAssessment`, `OngoingCases`, `LawyerDashboard`,
  `SelfService`, `LawFirms`, `Insurance`, `GraybeardMediation`, `Careers`,
  `LawyerOnboarding`, `IndexOld`.
- **Added `removed` capability status.** `capabilities_for_role` filters
  `removed` capabilities out for every role (never advertised to users); they
  remain in the registry only for history and bot intent-mapping. Marked
  removed: `law_firms`, `self_service`, `insurance_check`, `mediation`,
  `lawyer_onboarding`, `careers`, `case_assessment`, `lawyer_dashboard`,
  `verify_lawyer` (safe `web_route` = `/` or `/user/dashboard`). `my_cases`
  route repointed `/ongoing-cases` → `/user/dashboard`.
- **Route repair:** every removed route is now a `<Navigate>` redirect to a safe
  live destination (no 404s, no fabricated UI). Consumers repaired: Layout nav,
  Index CTA/copy (EN+DE), LawyerLogin post-login `/` + register→`/contact`,
  UserLogin post-login `/user/dashboard`, NewCase + five funnels submit
  `/user/dashboard`, UserDashboard case rows `/user/dashboard?case=<id>`, dead
  translation keys removed.
- **Guards + tests:** `scripts/check-fabricated-state.mjs` (`npm run
  check:fabricated`) scans production source for fabricated-state markers;
  `src/test/pr01.redirection.contract.test.tsx` (22 tests) and
  `assistant.contract.test.tsx` (no removed cap advertised) lock the contracts.

### Scope
No database migrations, new dependencies, new LLM integrations, or new product
features. Fabricated matter state and unverified success claims were removed —
nothing was rewritten into a substitute dashboard. The real referral backend
(`/api/v1/professionals/lawyers`) survives; only its fabricated discovery UI and
the invented per-matter assessment UI were removed. PR-01 stops after reporting;
PR-02 is not started in this slice.

## 2026-09-09 — PR-00B business & hypothesis artifacts

### Decision
Add the missing investor/business layer to the PR-00 doctrine set, and correct
two wording defects from PR-00 before proceeding to PR-01.

### Artifacts added
- `docs/LEAN_CANVAS.md` (canonical, post-pivot; old B2C canvas superseded as
  `LEAN_CANVAS_2026-09-06.deprecated.md`)
- `docs/BUSINESS_MODEL.md`
- `docs/MARKET_ASSUMPTIONS.md`
- `docs/COMPETITIVE_POSITIONING.md`
- `docs/PILOT_PLAN.md`
- `docs/INVESTMENT_GATES.md`
- `docs/HYPOTHESIS_LEDGER.md` (H01–H09)

Every business/product assertion is classified HYPOTHESIS / VALIDATED /
REJECTED / UNKNOWN. No scenario estimate is presented as a market fact. No
production behaviour changed in PR-00B.

### Corrections
- Deadline-quality wording is no longer "100% precise" as a standalone metric.
  It now reads "zero known incorrect statutory deadlines in the reviewed
  supported-domain gold set", with `deadline_answer_precision`,
  `deadline_coverage`, `deadline_abstention_rate`, `critical_trigger_recall`,
  and `exception_detection_recall` reported separately. (VALUE_EVENT.md)
- Age band 20–59 is removed as an ICP/product eligibility rule; it remains only
  as a market-sizing segment. (ICP.md, MARKET_ASSUMPTIONS.md)
- Competitive positioning, pricing, and revenue lines are recorded as
  hypotheses / rejected directions, not validated market facts.

### Monetization hypotheses recorded (as experiments, not validated prices)
Institutional paid pilot (€7.5–15k); annual organization license (€18–36k base
+ €10–25/matter); enterprise/API (€50–100k+, later); bounded licensed human
first-response review (€99–199, subject to RDG operating model). Direct B2C
subscription and lawyer-marketplace take-rate are REJECTED for this phase.

## 2026-09-09 — PR-00 product pivot

### Decision

FelLaw is the first-response infrastructure for consequential German letters
and legal/administrative events:

> Upload what arrived → understand what it is → identify the relevant clock →
> know the next safe action → track it → escalate with a ready-made dossier
> when human legal judgment is necessary.

### Rejected narratives

Do not position FelLaw as an AI legal platform, AI lawyer, lawyer marketplace,
all-in-one legal super-app, immigration platform, or Kanzlei automation suite.

### Reason

The repository's breadth creates product, moat, business-model, and trust risk.
Generic chat, RAG, OCR, translation, reminders, document generation, booking,
and matching are not defensible by themselves. Fabricated matter state and
unverified deadlines are existential trust failures.

### Approved first slice

- ICP: international residents, employees, and students already living in
  Germany.
- Buyers: employers, universities, benefits/EAP, mobility partners.
- Notice families: employment termination/adverse employment, traffic penalty,
  authority/residence decision/request; tenancy later.
- Public capabilities: `submit_notice`, `upload_document`, `first_response`,
  `my_matters`, `deadline_reminders`, `human_handoff`.
- Generic chat is secondary and contextual.

### Architecture consequences

- Preserve existing physical case storage unless migration is justified; do
  not rename models for branding alone.
- Separate statutory deadlines from internal action targets.
- Make source-backed facts, correction state, and reviewed rules first-class.
- Keep human legal judgment behind a counsel-approved operating model.
- Freeze horizontal feature work and broad-corpus expansion.
- Replace the autonomous loop objective with first-response correctness,
  abstention, provenance, action completion, handoff quality, latency, and cost.

### Approval sequence

PR-00 through PR-09 are approved as a staged plan. PR-10 onward is frozen until
first-response notice/deadline evaluations pass. This document approves the
product contract and scope reset; it does not claim that later PRs are already
implemented.
