# Legal Capability Review — Engineering/Counsel Handoff (PR-02 / PR-02C)

Status: **IMPLEMENTED / STATIC+UNIT+BUILD VERIFIED / LIVE INTEGRATION BLOCKED**
Date: 2026-09-09 (PR-02) / 2026-09-10 (PR-02C remediation)
Owner: FelLaw engineering (PR-02 quarantine slice + PR-02C remediation)

This document is an **engineering/risk-review handoff**, not a legal opinion.
Capability classes and approval states are FelLaw's own risk-boundary
vocabulary and say **nothing** about what is legally permissible under the
RDG (Rechtsdienstleistungsgesetz). Whether a feature may ultimately operate
under German law is a question for written counsel review; this document
records the current engineering quarantine and the exact questions for
counsel.

## Canonical vocabulary

Classes: `L0_GENERAL_INFORMATION`, `L1_DOCUMENT_EXPLANATION`,
`L2_PROCESS_NAVIGATION`, `L3_INDIVIDUAL_LEGAL_ASSESSMENT`,
`L4_STRATEGIC_DRAFTING_OR_REPRESENTATION`.

Engineering execution states: `APPROVED`, `REVIEW_REQUIRED`, `DISABLED`.

> **Terminology (PR-02C):** `APPROVED` / `REVIEW_REQUIRED` / `DISABLED` are
> **engineering execution states only** — they describe whether this codebase
> may execute a capability's behavior for public users right now. They are
> **NOT legal or counsel approval.** Counsel approval is tracked separately
> below under `counsel_decision` per capability and remains `UNKNOWN` unless
> a written decision exists. An `APPROVED` engineering state does **not**
> mean the capability is legally permissible under the RDG.

Default policy until written counsel review exists:
- L3 => REVIEW_REQUIRED (disabled from normal public execution)
- L4 => REVIEW_REQUIRED (disabled from normal public execution)
- L0/L1/L2 are not automatically approved; each implementation is reviewed
  for boundary leakage and classified by **actual behavior**, not name.

All counsel decisions below are **UNKNOWN / REVIEW_REQUIRED** unless a
written opinion exists. No counsel approval is simulated anywhere.

---

## Route map (single canonical mapping — PR-02C Finding 6)

`BOUNDARY_ROUTE_MAP` in `backend/app/services/legal_boundary.py` is the
single derived map: execution route -> boundary capability id. Tests iterate
it; no hand-count drift.

| Route | Capability id | Class | Engineering state |
|---|---|---|---|
| GET /api/v1/laws/search | `laws_search` | L0 | APPROVED (bounded lookup) |
| POST /api/v1/chat/message | `generic_legal_chat` | L3 | REVIEW_REQUIRED |
| GET /api/v1/chat/stream | `generic_legal_chat` | L3 | REVIEW_REQUIRED |
| POST /api/v1/chat/analyze-document | `analyze_document` | L1 | REVIEW_REQUIRED (rich) |
| POST /api/v1/templates/generate | `document_templates` | L4 | REVIEW_REQUIRED |
| POST /api/v1/chat/roadmap | `roadmap_generation` | L3 | REVIEW_REQUIRED |
| POST /api/v1/cases/{case_id}/roadmap/generate | `roadmap_generation` | L3 | REVIEW_REQUIRED |
| PUT /api/v1/cases/{case_id}/roadmap/{step_id} | `roadmap_generation` | L3 | schema-gated (status only) |
| POST /api/v1/chat/narrative | `narrative_generation` | L4 | REVIEW_REQUIRED |
| POST /api/v1/cases/{case_id}/narratives/generate | `narrative_generation` | L4 | REVIEW_REQUIRED |
| PUT /api/v1/cases/{case_id}/narratives/{narrative_id} | `narrative_generation` | L4 | schema-gated (is_final only) |
| POST /api/v1/chat/counterargument | `counterargument_analysis` | L4 | REVIEW_REQUIRED |

---

## Reviewed capabilities

### 1. laws_search (bounded general/source lookup)

| Field | Value |
|---|---|
| capability_id | `laws_search` |
| capability_class | `L0_GENERAL_INFORMATION` |
| engineering_execution_state | `APPROVED` (bounded A-path) |
| entry_points | `GET /api/v1/laws/search`, bot `ask` intent |
| actual_behavior | Deterministic RAG retrieval of statute/source text; general rule explanation; citations. Bound to retrieval-and-explain; does not assess a case. |
| facts_consumed | The user's search query (retrieval key only). |
| output | Retrieved statute sections + RDG disclaimer. |
| persistence | None (stateless lookup). |
| current_exposure | `laws_search` registry entry (canonical id, == boundary policy id) -> `/api/v1/laws/search`; web assistant + bot use bounded lookup. |
| exact_counsel_question | Is bounded statute/source retrieval with citations and no case-fact application consistent with RDG § 2 (legal information vs. legal services)? |
| counsel_decision | UNKNOWN / REVIEW_REQUIRED (no written opinion) |
| decision_date | — |
| reviewer_reference | — |
| implementation_consequence | Approved for normal public execution as engineering state; counsel review pending. |

### 2. generic_legal_chat (arbitrary generative legal conversation)

| Field | Value |
|---|---|
| capability_id | `generic_legal_chat` |
| capability_class | `L3_INDIVIDUAL_LEGAL_ASSESSMENT` |
| engineering_execution_state | `REVIEW_REQUIRED` (quarantined) |
| entry_points | `POST /api/v1/chat/message`, `GET /api/v1/chat/stream` |
| actual_behavior | General-purpose generative chat. The user's message text IS the concrete facts; cannot be bound to "no application to facts", so it can produce individualized assessment/strategy/drafting. |
| facts_consumed | The user's message text (the concrete facts themselves). |
| output | Free-form generative legal conversation. |
| persistence | Conversation + Message rows (chat history). |
| current_exposure | None (endpoints return the typed 403 quarantine response). |
| exact_counsel_question | Under what bounded behavioral contract (if any) may general-purpose generative legal chat operate without constituting RDG-prohibited legal services? |
| counsel_decision | UNKNOWN / REVIEW_REQUIRED (no written opinion) |
| decision_date | — |
| reviewer_reference | — |
| implementation_consequence | `require_executable("generic_legal_chat")` fails closed on both endpoints until a bounded behavioral contract is demonstrated and counsel review exists. |

### 3. analyze_document (document analysis)

| Field | Value |
|---|---|
| capability_id | `analyze_document` |
| capability_class | `L1_DOCUMENT_EXPLANATION` |
| engineering_execution_state | `REVIEW_REQUIRED` (rich analyzer gated; L1 extraction pipeline preserved) |
| entry_points | `POST /api/v1/chat/analyze-document` (gated); upload pipeline (extraction-only, see below) |
| actual_behavior | Rich analyzer emits summary/dates/persons + legal_implications/action_required/urgency (L3 leakage). The ordinary upload pipeline uses `analyze_document_extraction` (L1-only prompt/schema). |
| facts_consumed | User's concrete document text. |
| output | (rich) analysis incl. legal_implications/action_required/urgency — quarantined; (upload) L1 extraction surface only. |
| persistence | Upload pipeline persists only L1 extraction fields. |
| current_exposure | Rich analyzer: none (gated). L1 extraction: active in upload pipeline. |
| exact_counsel_question | Does the L1 extraction/summary surface exceed what RDG permits as non-legal services when the source document is a legal document? May the L3-leak fields be re-enabled only with licensed supervision? |
| counsel_decision | UNKNOWN / REVIEW_REQUIRED (no written opinion) |
| decision_date | — |
| reviewer_reference | — |
| implementation_consequence | Root contract fix: extraction-only prompt/schema (`EXTRACTION_PROMPT_SCHEMA`) never requests L3 fields; result filter fails closed. Rich analyzer stays gated. |

### 4. document_templates (template generation)

| Field | Value |
|---|---|
| capability_id | `document_templates` |
| capability_class | `L4_STRATEGIC_DRAFTING_OR_REPRESENTATION` |
| engineering_execution_state | `REVIEW_REQUIRED` (generation fails closed) |
| entry_points | `POST /api/v1/templates/generate` (gated); GET listing/metadata (preserved) |
| actual_behavior | Jinja2 rendering of template bodies. Classified by OUTPUT, not implementation technology. Repository contains no template bodies/seeds; live DB bodies cannot be verified -> generation fails closed. |
| facts_consumed | User-supplied template field data (+ template body from DB). |
| output | Generated document file (potential strategic legal document). |
| persistence | GeneratedDocument rows + files on disk (when generation allowed after review). |
| current_exposure | Listing/metadata only; generation returns the typed 403 quarantine response. |
| exact_counsel_question | Which template output types (objection, complaint, termination-related legal correspondence, pleading/court submission, defense/rebuttal) are permissible as self-service process navigation vs. prohibited legal services under RDG? |
| counsel_decision | UNKNOWN / REVIEW_REQUIRED (no written opinion) |
| decision_date | — |
| reviewer_reference | — |
| implementation_consequence | `require_executable("document_templates")` fails closed on generation; listing preserved. Neutral form-filling may be re-enabled per-template only after verified bodies + counsel review. |

### 5. roadmap_generation (individualized action plan)

| Field | Value |
|---|---|
| capability_id | `roadmap_generation` |
| capability_class | `L3_INDIVIDUAL_LEGAL_ASSESSMENT` |
| engineering_execution_state | `REVIEW_REQUIRED` |
| entry_points | `POST /api/v1/chat/roadmap`, `POST /api/v1/cases/{case_id}/roadmap/generate`, `PUT /api/v1/cases/{case_id}/roadmap/{step_id}` (schema-gated: status only) |
| actual_behavior | Generates individualized step-by-step legal action plan (defense strategy, deadlines, court actions) from case facts. |
| facts_consumed | Case state + RAG context. |
| output | RoadmapStep rows (title/description/action_items/deadline/priority/resources). |
| persistence | RoadmapStep rows (generation gated). |
| current_exposure | Generation: none (gated). GET of pre-existing rows + neutral lifecycle PUT (status) remain operational. |
| exact_counsel_question | Does an individualized step-by-step legal action plan with deadlines and defense strategy constitute prohibited legal services under RDG without a licensed lawyer in the loop? Under what operating model could it be offered? |
| counsel_decision | UNKNOWN / REVIEW_REQUIRED (no written opinion) |
| decision_date | — |
| reviewer_reference | — |
| implementation_consequence | Generation endpoints gated; PUT narrowed to `status` only (substantive mutation rejected by schema). PR-03 owns the actual deadline model. |

### 6. narrative_generation (legal drafting)

| Field | Value |
|---|---|
| capability_id | `narrative_generation` |
| capability_class | `L4_STRATEGIC_DRAFTING_OR_REPRESENTATION` |
| engineering_execution_state | `REVIEW_REQUIRED` |
| entry_points | `POST /api/v1/chat/narrative`, `POST /api/v1/cases/{case_id}/narratives/generate`, `PUT /api/v1/cases/{case_id}/narratives/{narrative_id}` (schema-gated: is_final only) |
| actual_behavior | Constructs legally structured documents (Stellungnahmen, Schriftsätze, complaints, letters to opposing counsel) from case state + RAG context. |
| facts_consumed | Case state + RAG context + narrative type. |
| output | Narrative rows (content). |
| persistence | Narrative rows (generation gated). |
| current_exposure | Generation: none (gated). GET of pre-existing rows + neutral lifecycle PUT (is_final) remain operational. |
| exact_counsel_question | Does AI-generated legal drafting for a user's concrete matter constitute prohibited legal services under RDG without a licensed lawyer? |
| counsel_decision | UNKNOWN / REVIEW_REQUIRED (no written opinion) |
| decision_date | — |
| reviewer_reference | — |
| implementation_consequence | Generation endpoints gated; PUT narrowed to `is_final` only. |

### 7. counterargument_analysis (opponent-claim rebuttal)

| Field | Value |
|---|---|
| capability_id | `counterargument_analysis` |
| capability_class | `L4_STRATEGIC_DRAFTING_OR_REPRESENTATION` |
| engineering_execution_state | `REVIEW_REQUIRED` |
| entry_points | `POST /api/v1/chat/counterargument` |
| actual_behavior | Generates suggested rebuttals, legal defenses, cross-examination questions for a user's matter. |
| facts_consumed | Case state + opponent claims. |
| output | Rebuttal/defense/witness-question content. |
| persistence | Conversation + Message rows. |
| current_exposure | None (gated). |
| exact_counsel_question | Does AI-generated rebuttal strategy and defense selection for a concrete matter constitute prohibited legal services under RDG? |
| counsel_decision | UNKNOWN / REVIEW_REQUIRED (no written opinion) |
| decision_date | — |
| reviewer_reference | — |
| implementation_consequence | Endpoint gated. |

---

## PR-02C remediation closure status

| Finding | Status | Evidence |
|---|---|---|
| RIG-PR02-01 generic-chat bypass | CLOSED | `generic_legal_chat` policy (L3 REVIEW_REQUIRED) gates POST /chat/message + GET /chat/stream; bot ask + /laws/search remain bounded L0 lookup; ChatAssistant rerouted to `/laws/search`; adversarial tests 1-4 blocked, 5 grounded. |
| RIG-PR02-02 unknown-policy fail-open | CLOSED | `require_executable` raises for unknown/misspelled ids (config error); `registry_legal_execution_status` keeps ordinary nav available; tests for typo + nav caps. |
| RIG-PR02-03 template classification | CLOSED | `document_templates` reclassified L4 REVIEW_REQUIRED by output; generation fails closed (no verified bodies); listing preserved; tests. |
| RIG-PR02-04 compute-then-discard L3 document analysis | CLOSED | Root fix: `analyze_document_extraction` with L1-only prompt/schema; upload pipeline uses it; rich analyzer gated; schema tests (not .pop). |
| RIG-PR02-05 substantive PUT bypass | CLOSED | PUT roadmap narrowed to `status`, narrative to `is_final` (extra=forbid); substantive mutation rejected at schema level; tests. |
| RIG-PROC-02 external skill mutation | CLOSED (none performed this run) | No writes outside `Legal_Aid/fellaw`; filesystem/git scope check clean. |
| route-count drift | CLOSED | Single derived `BOUNDARY_ROUTE_MAP` (12 routes -> 7 policies); tests iterate it; no hand-count. |
| RIG-PR02C-06 public/boundary id disconnect | CLOSED | Registry capability id unified to `laws_search` (== boundary policy id) in platform_capabilities.py, bot_contract.py ask-fallback, ChatAssistant.tsx, tests. Old id `chat_legal_question` gone (negative asserts). New transition test: flipping `laws_search` to REVIEW_REQUIRED removes the capability from every role's advertisement. |
| RIG-PR02C-07 is_executable unknown fail-open | CLOSED (PR-02D) | `is_executable(unknown)` now `False` (was `True`); `require_executable(unknown)` raises `BoundaryDisabled`; `registry_legal_execution_status(no-policy)` stays True for nav display. Only production caller (`bot_contract.render_capability`) guarded by `policy is not None` — no behavior change. `test_is_executable_fail_closed_contract` pins the contract. |
| RIG-TEST-02 adversarial behavioral evidence | CLOSED (PR-02D) | Static policy-table test REPLACED by behavioral proofs: 4A real POST /chat/message × 4 adversarial prompts with exploding-DB/-LLM spies -> BoundaryDisabled before any DB/LLM/persist; 4B real bot_turn ask with bounded fixture -> source retrieval or safe handoff; 4C grounded §4 KSchG with resolved user -> citation + RDG disclaimer. |
| RIG-PROC-03 dirty-checkout isolation | CLOSED (PR-02D) | All PR-02D work in sibling worktree `Legal_Aid/fellaw-pr02d` (branch `pr02d-boundary-consistency`) from recorded HEAD; PR-owned cumulative changes transferred byte-verified; PRE-EXISTING/OTHER (`UrgentSelect.tsx`) excluded; source checkout untouched. |
| entry-point contradiction (laws_search claims POST /chat/message) | CLOSED (PR-02D) | `laws_search` policy entry_points now only `GET /api/v1/laws/search` + bot ask (bounded); `generic_legal_chat` exclusively owns POST /chat/message + GET /chat/stream. `test_route_map_each_route_one_policy` proves route->policy uniqueness. |

## Verification status

- Backend non-live (PR-02D, worktree): `66 passed, 10 skipped` (10 = live-DB integration, NOT executed — reported separately).
- Boundary contract suite: `36 passed` (incl. adversarial BEHAVIORAL 4A/4B/4C, unknown-policy incl. is_executable contract, template, extraction-schema, PUT narrowing, route-map uniqueness, transition propagation).
- Capability/overview/bot suites: `28 passed`; live integration `10 skipped`.
- Frontend: vitest `46/46`, `tsc --noEmit` clean, `build` OK, `check:fabricated` OK.
- Live DB tests: **LIVE INTEGRATION BLOCKED** (not executed; no DB credentials solved/rotated).
