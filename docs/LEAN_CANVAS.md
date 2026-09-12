# FelLaw — Lean Canvas (post-pivot)

Status: canonical, PR-00B
Updated: 2026-09-09
Status legend: [VALIDATED] verified in this repo/live behaviour · [HYPOTHESIS] unvalidated assumption · [REJECTED] superseded decision · [UNKNOWN] no data yet

## Problem
People receiving a consequential German letter (employment termination, Bußgeldbescheid, administrative/authority decision, tenancy notice) do not reliably understand what arrived, which clock just started, and what the next safe action is. Institutions supporting international employees, students, and residents repeatedly absorb this first-response burden ad hoc. [HYPOTHESIS — indicator: 308,684 German first-instance labour-court judgment proceedings in 2024; no FelLaw-owned usage data yet]

Existing alternatives: general AI chat/plugins (general AI alone does not provide FelLaw's governed, source-provenanced, rule-versioned deadline workflow and persistent matter state); Google/friends/HR/university office (variable quality, no tracking); lawyer matching (terminates before the user knows whether a deadline is at risk); immigration/mobility platforms (serve pre-arrival and visa workflow, not post-arrival cross-domain events). [SCOUT: docs/SCOUT_COMPETITORS_2026-09-06.md, SCOUT_DATA_REGULATION_2026-09-06.md]

## Customer segments
- Institutional buyer (primary payer): employers with international workforces, universities/international offices, employee-benefit/EAP providers, relocation/mobility partners. [HYPOTHESIS H01/H07]
- End user (initially): international professionals/skilled workers already living in Germany receiving consequential correspondence; secondary: international students/researchers. [VALIDATED direction in PRODUCT_CONTRACT.md; market sizing in MARKET_ASSUMPTIONS.md]
- We do NOT serve immigration/relocation workflow (occupied by Localyze/Deel) or Kanzlei intake automation (occupied by JUPUS). [REJECTED]

## Early adopter
Organizations with a concentrated international population and no internal first-response legal-support workflow willing to run a bounded paid pilot. [HYPOTHESIS H01/H08]

## Value proposition (UVP)
"Upload the letter. Know the clock. Know what to do next." FelLaw converts a consequential German document into a source-backed, deadline-aware first-response state and prepares a ready-made dossier for human escalation when individualized judgment is required. [VALIDATED as approved product thesis — PRODUCT_CONTRACT.md]

## Solution
document classification → verified extracted facts (source-anchored) → deterministic deadline/action-trigger layer (code + reviewed rule registry, not LLM) → first-response checklist → reminders → licensed/authorized human handoff with the intake already done. Each displayed critical fact carries provenance and a confirmation/review state. [VALIDATED for architecture intent; implementation deferred to PR-05..PR-08]

## Channels
employer HR/global mobility · university international offices · employee-benefits/EAP · relocation ecosystem partners · later Rechtsschutz insurers/assistance networks. [HYPOTHESIS H01/H08 — no acquisition data yet]

## Revenue model
Institutional paid pilot → annual organization license → per-matter usage → paid licensed first-response review → later API/white-label. Full detail in BUSINESS_MODEL.md. [All pricing HYPOTHESIS; no paid deployments yet. REJECTED: leading with a B2C subscription]

## Cost structure
Engineering; legal-rule review and maintenance; licensed human-capacity for the escalation layer; document QA and professional review; sales/GTM; hosting/inference. [HYPOTHESIS — unit economics UNKNOWN until a pilot]

## Key metrics (north star)
`verified_next_action_completed`; supported-notice classification precision; critical-date extraction recall; deadline answer precision/coverage/abstention; source provenance coverage; handoff packet completeness; correction and escalation rates. Marketing vanity metrics (chat volume, session length, feature count) are explicitly non-goals. [VALIDATED — VALUE_EVENT.md]

## Unfair advantage today
None. [VALIDATED — honest baseline; no moat claim]

## Moat flywheel (target)
reviewed notice taxonomy + rule registry + correction/outcome dataset + institutional distribution + licensed fulfilment network + professional acceptance patterns. Not the LLM. [HYPOTHESIS H02/H05/H06 — accrues only with real reviewed volume]

## Metrics / money bridge to next round
Approx pre-seed target €0.8–1.0M only after: 2+ paid institutional pilots, 1+ licensed fulfilment relationship, real document volume, demonstrably safe deadline performance, professional handoff value, repeatable institutional pipeline. See INVESTMENT_GATES.md. [HYPOTHESIS — no fundraising underway]

Superseded: docs/LEAN_CANVAS_2026-09-06.deprecated.md (pre-pivot B2C canvas, retained for history).
