# FelLaw Session Handoff

Date: 2026-09-10 (PR-02C legal capability boundary remediation — findings closure)

## What changed

This slice completed **PR-02C**, the remediation of the PR-02 review findings
(RIG-PR02-01..05, RIG-PROC-02, route-count drift). PR-02 itself (legal
capability boundary/quarantine) was already implemented; PR-02C closes the
identified gaps. PR-03 and PR-04 are NOT started. Positioning claim unchanged:
"first-response infrastructure for consequential German letters and
legal/administrative events".

### PR-02C (findings closure; 2026-09-10)

**RIG-PR02C-06 — public capability id vs boundary policy id disconnect (CLOSED).** Unified on ONE canonical id `laws_search` across the capability registry (`platform_capabilities.py`), the boundary policy (`legal_boundary.py` — already `laws_search`), the bot ask-fallback (`bot_contract.py`), and the frontend guard (`ChatAssistant.tsx`). The previous `chat_legal_question` registry id made `registry_legal_execution_status` see "no policy" → True, so a future laws_search policy transition would leave the capability advertised as ungoverned. Now: transition test flips laws_search to REVIEW_REQUIRED and asserts removal from every role; old id resolves to None. The alternative (explicit `governing_policy_id` field on Capability) was rejected as redundant — unification removes the whole class of mismatch.

**Finding 1 — generic-chat bypass (CLOSED).** Split chat into:
- A) `laws_search` (L0 APPROVED) — bounded statute/source lookup: GET /api/v1/laws/search + bot `ask` (deterministic RAG, citations, no application to user's facts, no merits/strategy/drafting).
- B) `generic_legal_chat` (L3 REVIEW_REQUIRED) — POST /api/v1/chat/message + GET /api/v1/chat/stream gated with `require_executable("generic_legal_chat")` (fail closed before LLM/persist). The user's message IS the facts; removing case-context injection was insufficient.
- Frontend `ChatAssistant` rerouted from `/chat/message` to `/laws/search` (bounded; citations + RDG disclaimer; empty result → urgent-help handoff).
- Adversarial prompts 1-4 (dismissal challenge, landlord defense, write objection, step-by-step strategy) → blocked by gate; 5 (§4 KSchG general) → bounded statute lookup still works.

**Finding 2 — unknown-policy fail-open (CLOSED).** `require_executable` now BLOCKS unknown/misspelled ids (raises BoundaryDisabled as configuration error; a typo cannot enable a legal operation). Registry display uses `registry_legal_execution_status` (no policy = ordinary navigation, untouched; gated policy = not advertised). Tests: `require_executable("definitely_not_a_real_capability")` fails closed; typo'd gated caps fail closed; urgent_help/start_case_intake/my_cases/notifications/request_referral remain available.

**Finding 3 — template classification by output (CLOSED).** `document_templates` reclassified from L2-APPROVED-by-technology to `L4_STRATEGIC_DRAFTING_OR_REPRESENTATION` REVIEW_REQUIRED. Repository has no template bodies/seeds; live DB bodies cannot be verified → `/templates/generate` fails closed (`require_executable("document_templates")`); listing/metadata preserved (`preserves_grounded_info`).

**Finding 4 — compute-then-discard L3 (CLOSED).** Root contract fix: new `analyze_document_extraction` (L1-only) whose prompt/schema (`EXTRACTION_PROMPT_SCHEMA`) requests ONLY summary/key_dates/key_persons/document_category/reference_numbers and explicitly forbids legal_implications/action_required/urgency/strategy/merits. `process_uploaded_document` uses it; result filter fails closed even against hallucinated L3 fields. Rich `analyze_document_with_ai` stays gated (REVIEW_REQUIRED, future value). Tests assert the prompt/schema, not a `.pop()`.

**Finding 5 — substantive PUT bypass (CLOSED).** PUT routes were incorrectly grouped with "read-only"; they accepted substantive legal mutation. Now:
- `PUT /cases/{id}/roadmap/{step_id}` → `RoadmapStepLifecycleUpdate` (status only, `extra="forbid"`).
- `PUT /cases/{id}/narratives/{narrative_id}` → `NarrativeLifecycleUpdate` (is_final only, `extra="forbid"`).
Substantive mutation (title/description/action_items/deadline/priority/resources; narrative_type/content/language/version) rejected at the schema level. PR-03 owns the deadline model.

**Finding 6 — route-map drift (CLOSED).** Single canonical `BOUNDARY_ROUTE_MAP` (12 routes → 7 policies) in `legal_boundary.py`; tests derive from it (no hand-count). Each REVIEW_REQUIRED generation/analysis route: registered in OpenAPI, maps to exactly one policy, fails closed before DB/LLM/persistence. PUT routes schema-gated (verified separately).

**Terminology.** `APPROVED`/`REVIEW_REQUIRED`/`DISABLED` documented as ENGINEERING EXECUTION STATES ONLY, NOT legal/counsel approval. Each reviewed capability record in `docs/LEGAL_CAPABILITY_REVIEW.md` uses the full field set (capability_id, capability_class, engineering_execution_state, entry_points, actual_behavior, facts_consumed, output, persistence, current_exposure, exact_counsel_question, counsel_decision, decision_date, reviewer_reference, implementation_consequence). Counsel remains UNKNOWN.

**RIG-PROC-02 (external skill mutation).** No writes performed outside `Legal_Aid/fellaw` this run; no skill files touched. Scope check at end of run.

### PR-02 (prior slice — legal capability boundary / quarantine; for context)
- Inventory: traced counterargument_service, narrative_service, roadmap_service, generic chat (+stream), document analysis, templates, bot intents, capability registry, and OpenAPI. Produced the affected-surface map (entry point → route → service → LLM/RAG dep → persistence → consumer → auth → class). No mutation before inventory was complete.
- Canonical vocabulary: `backend/app/services/legal_boundary.py` — classes `L0_GENERAL_INFORMATION`, `L1_DOCUMENT_EXPLANATION`, `L2_PROCESS_NAVIGATION`, `L3_INDIVIDUAL_LEGAL_ASSESSMENT`, `L4_STRATEGIC_DRAFTING_OR_REPRESENTATION` + approval states `APPROVED`/`REVIEW_REQUIRED`/`DISABLED`. Engineering/risk-review categories, NOT RDG-legality declarations. Single canonical gate `require_executable()`; `BoundaryDisabled` handled in `main.py` as a deterministic typed 403 (capability_id, class, approval_state, safe_handoff `/urgent/select`, lawyer_handoff `/find-lawyer`).
- Quarantined (REVIEW_REQUIRED, fail closed before LLM/persist): `roadmap_generation` (L3), `narrative_generation` (L4), `counterargument_analysis` (L4). Generation endpoints `/chat/narrative`, `/chat/roadmap`, `/chat/counterargument`, `/cases/{id}/narratives/generate`, `/cases/{id}/roadmap/generate` all gate first. Read-only GET/PUT of previously-persisted rows remains for dashboard compat; no NEW gated content can be created. `analyze_document` chat endpoint gated; upload pipeline persists only L1 fields (legal_implications/action_required/urgency stripped). Services preserved (quarantine, not deletion).
- Boundary leak fixes: `/chat/message` + `/chat/stream` no longer inject the user's case-specific facts block into the prompt (general RAG chat stays L0/L1 — grounded general info preserved, not individualized assessment).
- Bot/OpenClaw: `render_capability` renders gated capabilities as professional-review notices with `/urgent/select` — never an actionable deep link into gated execution. Verified: L3/L4 trigger words (roadmap/narrative/gegenargumente/aktionsplan) resolve to `ask` (approved grounded chat) or other safe intents.
- Product/API claims: OpenAPI description updated to the canonical PR-00 first-response statement (no "AI-powered", no "narrative generation"/"counterargument analysis" advertisement). Capability registry `capabilities_for_role` also excludes boundary-gated capabilities.
- Counsel artifact: `docs/LEGAL_CAPABILITY_REVIEW.md` — per-capability records with exact counsel questions and `counsel_decision: UNKNOWN/REVIEW_REQUIRED` (nothing simulated).
- LEAN_CANVAS correction: replaced "general AI chat/plugins (cannot produce verified, source-backed deadlines)" with "general AI alone does not provide FelLaw's governed, source-provenanced, rule-versioned deadline workflow and persistent matter state".
- Tests: `backend/tests/test_legal_boundary.py` (17 tests) — class/approval coverage, L3/L4 REVIEW_REQUIRED + not executable, fail-closed-before-LLM/persist (exploding-DB handler test), deterministic typed response, bot no-deep-link into gated, OpenAPI no-advertise, preserved L0/L1 + templates, PR-01 caps stay removed, intake/dashboard not regressed.

### PR-01C (integrity closure — intake funnels + role-correct routing; no redesign)
- Deleted the five non-persistent specialized intake funnels (`NewCaseTrafficViolation`, `NewCaseConsumerDispute`, `NewCaseEmploymentInquiry`, `NewCaseFamilyInquiry`, `NewCaseVisaImmigration`) — they were form-only with "Our AI will analyze… / Analyze My Case" buttons that merely redirected to `/user/dashboard` (no persistence, no analysis). Legacy URLs now redirect to `/new-case` (the one real persisted intake). Removed the NewCase.tsx "Quick start / focused form" topic links (the remaining CTA consumer); the aside now shows only the honest urgent-help entry. No "AI will analyze / Analyze My / Uploaded & Analyzed" claim remains anywhere in production; the fabricated-state guard gained a pattern for non-performing analysis claims.
- Fixed role-semantic deep links: `build_overview` `dashboard`/`cases` now resolve per role — citizen/admin → `/user/dashboard`, lawyer/anonymous → `/` (lawyers are no longer sent to the citizen dashboard; `lawyer_dashboard` capability stays `removed`; no professional dashboard recreated).
- Fixed a real Windows bug in `check-fabricated-state.mjs`: the allowlist dir-parts (`/test/` etc.) never matched because `rel` used backslashes; paths are now normalized.
- Tests: `pr01.redirection.contract.test.tsx` grew to 34 tests (5 funnel redirects, 5 funnel-file removals, funnel literals in the no-deep-link scan, no-misleading-analysis-claim scan, `/new-case` persisted createCase contract); backend `test_platform_overview.py` asserts role-correct deep links (lawyer → `/`, citizen/admin → `/user/dashboard`, anonymous → `/`).

### PR-00B (docs + wording; no production behavior)
- Added `docs/LEAN_CANVAS.md` (post-pivot canonical), `docs/BUSINESS_MODEL.md`, `docs/MARKET_ASSUMPTIONS.md`, `docs/COMPETITIVE_POSITIONING.md`, `docs/PILOT_PLAN.md`, `docs/INVESTMENT_GATES.md`, `docs/HYPOTHESIS_LEDGER.md` — every assertion HYPOTHESIS/VALIDATED/REJECTED/UNKNOWN, no invented market evidence.
- Renamed pre-pivot B2C `docs/LEAN_CANVAS_2026-09-06.md` → `docs/LEAN_CANVAS_2026-09-06.deprecated.md` (+ deprecation banner); canonical is now `LEAN_CANVAS.md`.
- Corrected `docs/VALUE_EVENT.md` safety wording (no absolute "100% precise" claim — now "zero known incorrect statutory deadlines in the professionally reviewed supported-domain gold set", with coverage/abstention separate) and `docs/ICP.md` (age band demoted to market-sizing).
- Recorded a PR-00B decision in `docs/DECISION_LOG.md`.

### PR-01 (inventory + unroute fabricated/frozen production state; ten pages deleted)
- Deleted: `CaseAssessment`, `OngoingCases`, `LawyerDashboard`, `SelfService`, `LawFirms`, `Insurance`, `GraybeardMediation`, `Careers`, `LawyerOnboarding`, `IndexOld` (`git rm`).
- Added capability status `removed`; `capabilities_for_role` now filters `removed` out for every role (not advertised). Marked removed: `law_firms`, `self_service`, `insurance_check`, `mediation`, `lawyer_onboarding`, `careers`, `case_assessment`, `lawyer_dashboard`, `verify_lawyer` (safe `web_route` = `/` or `/user/dashboard`). `my_cases` route `/ongoing-cases` → `/user/dashboard`. `platform_overview.deep_links` now `/user/dashboard` for dashboard+cases.
- App routes: every removed route → `<Navigate>` to a safe live destination (no 404s, no fabricated UI).
- Consumers repaired: Layout nav (dropped law-firms/insurance/self-service; my-cases→`/user/dashboard`), Index self-service CTA/copy (EN+DE) removed, LawyerLogin post-login→`/` + register link→`/contact`, UserLogin post-login→`/user/dashboard`, NewCase + five funnels submit→`/user/dashboard`, UserDashboard case-row link→`/user/dashboard?case=<id>`, dead self-service/outcome-prediction translation keys removed.
- Contract tests + guard: `src/test/pr01.redirection.contract.test.tsx` (22 tests), `src/test/fabricated-state.guard.test.ts` + `scripts/check-fabricated-state.mjs` (`npm run check:fabricated`), tightened `assistant.contract.test.tsx` (no `removed` advertised; strict `Capability[]` typing); anonymous fixture regenerated (now 4 caps: urgent_help, start_case_intake, find_lawyer, contact).

Key backend files touched: `backend/app/services/platform_capabilities.py`, `backend/app/services/platform_overview.py`.
Key frontend files touched: `frontend/src/App.tsx`, `components/Layout.tsx`, `components/ChatAssistant.tsx`, `lib/api/platform.ts`, `lib/translations.ts`, `pages/Index.tsx`, `pages/NewCase*.tsx`, `pages/UserDashboard.tsx`, `pages/auth/{User,Lawyer}Login.tsx`, `scripts/check-fabricated-state.mjs`, `src/test/*`.

- Backend profile-scoped overview: `backend/app/services/platform_overview.py`
- Backend endpoints: `backend/app/api/platform.py`
- Frontend API client: `frontend/src/lib/api/platform.ts`
- Frontend assistant integration: `frontend/src/components/ChatAssistant.tsx`
- Bot skill: `skills/fellaw-platform/SKILL.md`
- Bot contract primitives: `backend/app/services/bot_contract.py`
- Provider policy: root `openclaw.json` and `.env` endpoint template
- Product docs: `docs/LEAN_CANVAS_2026-09-06.md`, `docs/SCOUT_COMPETITORS_2026-09-06.md`, `docs/SCOUT_DATA_REGULATION_2026-09-06.md`
- UI system: `DESIGN.md`, reusable skill `fellaw-ui-ux`, redesigned entry surface in `frontend/src/pages/Index.tsx` and styles in `frontend/src/App.css`.
- Additional UI slices: live authenticated overview dashboard in `frontend/src/pages/UserDashboard.tsx`; honest local-draft intake in `frontend/src/pages/NewCase.tsx`.
- User-story review: `docs/USER_STORIES_SCENARIOS_2026-09-06.md` maps seven scenarios across web, assistant, Telegram, and backend contracts.
- Lawyer discovery: `frontend/src/pages/FindLawyer.tsx` now consumes `frontend/src/lib/api/lawyers.ts`; mock profiles and simulated verification/booking claims were removed.
- U1 completed: `frontend/src/lib/api/platform.ts` now exposes `createCase()`, and authenticated `/new-case` calls real `POST /api/v1/cases`, clears the local draft only after success, routes to the created case UUID, and shows honest saving/error states. Selected files remain local until the upload feature is connected.
- T2 completed: frontend test stack (vitest@2 + RTL + jsdom, `npm test`) and 11 assistant-parity contract tests against the real backend registry fixture (`src/test/fixtures/capabilities.anonymous.json`, verified field-identical to the live endpoint). The assistant may only render registry-backed capabilities; unauthenticated asks get the sign-in prompt, never a fabricated answer.
- U3 completed: overview `CaseSummary` carries `roadmap_generated` + `next_step_title` (read-only from persisted `roadmap_steps`); dashboard rows show next open step / all-completed / explicit not-generated state. Verified live: real AI roadmap via Ollama reflected in the overview; a case without steps shows the honest not-generated state.
- R1 completed: semantic embeddings via KIT Toolbox (`kit.qwen3-embedding-8b`, 4096-dim, OpenAI-compatible). `EMBEDDING_PROVIDER` is now decoupled from `AI_PROVIDER` (chat stays local Ollama `gemma4:e2b`); migration `007_embedding_4096` widened `law_documents`/`forum_posts` to `vector(4096)` (no ANN index — pgvector caps HNSW at 2000 dims / halfvec at 4000, and the KIT endpoint rejects the `dimensions` param; a sequential cosine scan is correct at 33 rows). All 33 statutes re-embedded through `create_embeddings_batch`; measured vector-mode retrieval recall@5 0.95→1.0 and MRR 0.7167→0.7917 (all 20 golden queries ran mode=vector); chat metrics intact (1.0/1.0/1.0). KIT key is read from env `KIT_API_KEY` (Hermes-managed), never written to a file.
- O2 completed: Telegram gateway live. User-supplied `@fellaw_bot` token verified via `getMe`, stored env-managed as `TELEGRAM_BOT_TOKEN` in `fellaw/.env` (git-ignored). OpenClaw gateway (port 18790) runs the telegram provider long-polling @fellaw_bot (proven by a 409 conflict when a second getUpdates raced its poll). Gateway model chain was pruned to policy: KIT local aliases + `kit.glm-5.3` + local Ollama (keyless model-router/openrouter/nvidia provider blocks that fatally blocked startup were removed; excluded KIT Fable dropped). The `fellaw-platform` skill now routes ask-intents to anonymous-safe `POST /api/v1/platform/bot/turn` (grounded statutes + citations + RDG disclaimer) and forbids answering legal questions from model memory; verified live in a fresh agent session (agent loaded the skill, called bot/turn with a correct payload, rendered the grounded reply for a mapped identity and the honest login-link for an unmapped one; backend logged `bot.turn.ask_grounded docs=5`).

- Recovery: the untracked `backend/scripts/loop/backlog.py` source had disappeared while its compiled pyc remained. It was reconstructed from the pyc constants and restored; the loop plan/auto/close commands now work again.
- Scenario review: `docs/USER_STORIES_SCENARIOS_2026-09-06.md` is the current cross-surface acceptance reference for seven user scenarios.
- Database: dedicated `fellaw-postgres` (`pgvector/pgvector:pg16`, volume `fellaw-postgres-data`, host port 55433) is migrated to Alembic head `004_align_current_models`; ORM/schema drift is zero.
- The database is attached to `psql_default`, and `.env` supplies `FELLAW_DB_PASSWORD` for the compose backend hostname `fellaw-postgres`.
- Scout retry status: delegated workers exited before research with HTTP 401 (invalid gateway key); existing reports are the locally verified conservative drafts and were not overwritten by the workers.

An unrelated-but-blocking OpenAPI defect was also fixed in `backend/app/api/chat.py`; Azure document imports were made optional in `backend/app/services/document_intelligence.py`.

## Verification

- Backend tests: 22 passed.
- Fresh ad-hoc bot-contract verification: `AD_HOC_BOT_CONTRACT_OK`, exit 0; temporary `hermes-verify-*` file cleaned up.
- Backend OpenAPI: 87 paths, platform paths present.
- Frontend build: successful.
- Design token lint: 0 errors; 3 non-blocking orphan-token warnings for reserved state colors.
- Browser visual verification: successful at `http://127.0.0.1:5173/`; CSS import was fixed after initial visual inspection, then the refreshed page showed the intended two-column hero with no clipping/overlap and clear CTAs.
- Browser route verification: `/new-case` and `/user/dashboard` both returned HTTP 200 and rendered the new intake/dashboard states.
- Browser lawyer-discovery verification: `/find-lawyer` rendered live filters and the truthful backend-unavailable state with no invented profiles.
- Fresh ad-hoc dashboard/intake verification: `AD_HOC_DASHBOARD_INTAKE_OK`, exit 0; temporary script cleaned up.
- Fresh required ad-hoc verification after the latest UI edits: `AD_HOC_DASHBOARD_INTAKE_OK`, exit 0; both routes HTTP 200; temporary `hermes-verify-*` file cleaned up. This was focused verification only, not suite/linter/build evidence.
- Fresh required ad-hoc user-story parity verification: `AD_HOC_USER_STORY_PARITY_OK`, exit 0; three routes HTTP 200; seven scenarios and real lawyer API/no-fabricated-profile contracts verified; temporary file cleaned up.
- Fresh required ad-hoc parity verification after the complete scenario review: `AD_HOC_USER_STORY_PARITY_OK`, exit 0; all three UI routes HTTP 200; scenario, dashboard, intake, lawyer API, and accessibility contracts verified; temporary file cleaned up.
- Fresh required ad-hoc lawyer-discovery verification: `AD_HOC_LAWYER_DISCOVERY_OK`, exit 0; `/find-lawyer` HTTP 200; real search contract, honest unavailable states, and absence of fabricated profiles verified; temporary file cleaned up. Focused verification only, not suite/linter/build evidence.
- Authenticated live smoke: registration 201, case creation 201, overview 200 with one urgent case, citizen capabilities 200, lawyer search 200/empty, unauthenticated overview 401.
- Real DB runtime: health 200 with `db: connected`, OpenAPI 200, compose config valid, Alembic head 004, pgvector/uuid-ossp/pg_trgm enabled.
- Final gates: current Alembic upgrade succeeded, backend 22 tests passed, OpenAPI 87 paths, frontend TypeScript/build passed, compose config and diff checks passed.
- Fresh required DB/config ad-hoc verification: initial system-Python attempt lacked SQLAlchemy; corrected project-venv run passed `AD_HOC_DB_CONFIG_SCHEMA_OK`, confirming `fellaw-postgres`, Alembic 004, pgvector extensions, zero ORM/schema drift, and valid Compose hostname; temporary verifier cleaned up.
- Fresh required DB/config ad-hoc verification after the latest change: `AD_HOC_DB_CONFIG_SCHEMA_OK`, exit 0; FelLaw `.env`, database readiness/identity, Alembic 004, required extensions, zero ORM/schema drift, and Compose configuration verified; temporary file cleaned up. Focused evidence only, not suite-green evidence.
- Live public API checks: capabilities 200; unauthenticated overview and chat 401; docs/openapi 200.
- DB: unavailable for this probe; health correctly returned degraded.

- U3 attempt (2026-09-07): blocked before implementation after two pre-gate failures. Unit: 2 failed + 3 errors because `.venv` lacks the `pydantic_core._pydantic_core` native extension; integration: 10 skipped because `FELLAW_TEST_DB` is unset. No code or dashboard change was made; no metric delta is claimable. The running backend health endpoint remained healthy, but this does not replace the required gates.
- PR-00B (docs only): seven new business/hypothesis docs written; `LEAN_CANVAS_2026-09-06.md` → `.deprecated.md`; `VALUE_EVENT.md`/`ICP.md` corrected; no absolute "100% precise" deadline claim remains in active docs; no production file changed.
- PR-01 gates (status: **IMPLEMENTED / STATIC+UNIT+BUILD VERIFIED / LIVE INTEGRATION BLOCKED**):
  - Backend `../.venv/Scripts/python.exe -m pytest tests/test_platform_capabilities.py tests/test_platform_overview.py tests/test_bot_contract.py` -> 26 passed; full backend suite -> 28 passed + 10 skipped (live-DB integration).
  - Registry: 20 caps, `{implemented:8, removed:9, partial:1, planned:1, missing:1}`; the 9 removed caps are not returned by `capabilities_for_role` for any role and carry safe web routes.
  - Frontend `npx vitest run` -> 34/34 (assistant 11, redirection 22, guard 1); `npx tsc -p tsconfig.app.json --noEmit` clean; `npm run build` OK (only pre-existing chunk-size warning); `npm run check:fabricated` OK.
  - ESLint on PR-touched files: 0 errors (repo-wide 17 pre-existing shadcn/earlier-slice lint errors are outside this PR and remain a baseline debt, not a regression).
  - `git diff --check` clean; route map in `App.tsx` verified (every removed route resolves to a safe `<Navigate>`; the ten fabricated pages are deleted per `git status`).
- PR-01C gates (status: **IMPLEMENTED / STATIC+UNIT+BUILD VERIFIED / LIVE INTEGRATION BLOCKED**):
  - Backend non-live suite -> `30 passed, 10 skipped` (10 skipped = live-DB integration tests NOT executed — live environment unavailable; reported separately, never claimed passed).
  - Frontend `npx vitest run` -> 46/46 (`assistant.contract` 11, `pr01.redirection.contract` 34, `fabricated-state.guard` 1); `tsc --noEmit` clean; `npm run build` OK (1740 modules, 488 kB JS — under the 500 kB chunk-warning threshold after funnel removal); `npm run check:fabricated` OK (incl. new non-performing-AI-analysis-claim pattern + Windows path fix); ESLint on PR-owned changed files 0 errors.
  - PR-owned `git diff --check` clean. Route map: 15 `<Navigate>` redirects (10 PR-01 + 5 PR-01C → `/new-case`). No production references to deleted/frozen funnels; no "AI will analyze"/"Analyze My"/"Uploaded & Analyzed" claims. Deep-link map: anonymous `/`, citizen `/user/dashboard`, lawyer `/`, admin `/user/dashboard`; `new_case` `/new-case` for all roles.
- PR-02 gates (status: **IMPLEMENTED / STATIC+UNIT+BUILD VERIFIED / LIVE INTEGRATION BLOCKED**):
  - Backend: `tests/test_legal_boundary.py` -> 17 passed (class/approval coverage; L3/L4 REVIEW_REQUIRED + not executable; fail-closed-before-LLM/persist via exploding-DB handler test; deterministic typed response; bot no-deep-link into gated; OpenAPI no-advertise; preserved grounded L0/L1 + templates; PR-01 caps stay removed; intake/dashboard not regressed). Capability/overview/bot tests -> 28 passed (unchanged). Full non-live suite -> `45 passed, 10 skipped` (10 skips = live-DB integration, NOT executed — reported separately, never claimed passed). `py_compile` clean on all changed backend files.
  - Frontend: `npx vitest run` 46/46; `tsc --noEmit` clean; `npm run build` OK; `npm run check:fabricated` OK; ESLint on PR-owned files 0 errors (1 pre-existing warning: UserDashboard exhaustive-deps).
  - Contracts: final legal-capability inventory = 6 policies (`chat_legal_question` L0 APPROVED, `analyze_document` L1 REVIEW_REQUIRED, `document_templates` L2 APPROVED, `roadmap_generation` L3 REVIEW_REQUIRED, `narrative_generation` L4 REVIEW_REQUIRED, `counterargument_analysis` L4 REVIEW_REQUIRED). Public capability map: 20 total `{implemented: 8, removed: 9, partial: 1, planned: 1, missing: 1}` (unchanged from PR-01C); gated caps not advertised. Bot intent map: L3/L4 trigger words resolve to `ask` (approved grounded chat) or safe intents; gated caps never deep-link. OpenAPI description = honest PR-00 first-response statement. Proof of fail-closed: gated handlers raise `BoundaryDisabled` before any DB/LLM attribute access (exploding-db contract test).
  - PR-owned `git diff --check` clean; whole-working-tree blockers reported separately (PRE-EXISTING/OTHER paths untouched).

## Do not assume

- The Telegram gateway (PID-backed `openclaw gateway`, port 18790) and the FelLaw backend (port 8000) are running as session background processes. After a reboot or session end they must be restarted with the env set: token from `fellaw/.env` (`TELEGRAM_BOT_TOKEN`), `KIT_API_KEY`, `KI_TOOLBOX_BASE_URL`, `OLLAMA_BASE_URL` (see the O2 run command in the loop evidence or `start-fellaw.ps1` pattern — native Windows paths, not MSYS, in `OPENCLAW_STATE_DIR`/`OPENCLAW_CONFIG_PATH`).
- R1's measured recall/MRR gains hold only with `KIT_API_KEY` present at backend start; without it the system honestly falls back to lexical mode (measured 0.95/0.7167 baseline).
- O1 (DB credential rotation) remains WAITING-ON-USER — do not rotate or copy dev credentials; the user rotates at end of last dev version.
- R2 was selected by the loop, but blocked before implementation. Required gates failed: unit 21 passed, 2 failed, 3 errors with `ModuleNotFoundError: pydantic_core._pydantic_core` from the repo `.venv`; integration also failed. No R2 files or database corpus rows were changed and no metric delta is claimable.
- U1 is now closed with real authenticated intake submission. A first close attempt against stale port 8004 produced HTTP 500 for all law queries and was correctly rejected as a regression; a fresh server on 8010 returned HTTP 200 and restored the measured baseline. No frontend change caused the false regression.
- A green frontend build is not authenticated end-to-end proof.
- Capability `implemented` means the documented route/domain path exists; it does not prove production credentials, database state, payment settlement, or lawyer availability. Post-PR-01, `removed` capabilities exist in the registry for history and bot intent-mapping but are NOT returned by `capabilities_for_role` for any role (never advertised to users). Post-PR-02, boundary-gated capabilities (L3/L4, REVIEW_REQUIRED) are also not advertised and fail closed (403) with no LLM/persistence execution.
- Competitor pricing and blocked-page claims in scout reports require manual browser verification.
- Empty provider secrets are intentional. Do not copy literal credentials into this repository.

## Next action

PR-00, PR-00B, PR-01, PR-01C, PR-02, and PR-02C are complete and verified (status: **IMPLEMENTED / STATIC+UNIT+BUILD VERIFIED / LIVE INTEGRATION BLOCKED**). **PR-03 is next and must NOT be started until instructed** (stop-and-report directive for this slice). PR-03 (deadline semantics: separate statutory deadlines from action targets) and PR-04 (six-capability reset) follow in order. Do not restart broad corpus expansion or add another model integration before the first-response contract is implemented and measured. L3/L4 capabilities (generic chat, roadmap, narrative, counterargument, chat analyze-document, template generation) are quarantined REVIEW_REQUIRED until a written counsel decision authorizes an operating model (see `docs/LEGAL_CAPABILITY_REVIEW.md`). Counsel remains UNKNOWN; `APPROVED` is an engineering execution state, not counsel approval.

Exact resume commands for the next session run backend tests with the **repo venv**, not the Hermes venv:
`cd Legal_Aid/fellaw/backend && ../.venv/Scripts/python.exe -m pytest` — note the repo `.venv` is at `Legal_Aid/fellaw/.venv` (this exists), while `../.venv` from `backend/` is the Hermes venv that lacks SQLAlchemy/pytest for the FelLaw repo. Frontend: `cd frontend && npm test` (vitest), `npx tsc -p tsconfig.app.json --noEmit`, `npm run build`, `npm run check:fabricated`.

## Latest autonomous trigger

- Started the backend on port 8004 with `PYTHONPATH` cleared so the repo venv could load; health returned HTTP 200 but `status: degraded` because the dedicated Postgres connection was refused.
- Ran `iterate.py --auto --base-url http://127.0.0.1:8004`; result: `no READY backlog items — loop is caught up; refresh backlog from metrics/scenarios`.
- No item ID was selected, no files or database rows were changed by the loop, and no metric delta is claimable. Exact resume point: restore `fellaw-postgres`/`FELLAW_TEST_DB`, refresh the backlog from current metrics/scenarios, then run one new `--auto` cycle.
