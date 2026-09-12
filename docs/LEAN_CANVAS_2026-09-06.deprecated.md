# FelLaw — Lean Canvas (v1, 2026-09-06)

Status legend for evidence: [repo] = verified in this repository, [scout] = see
docs/SCOUT_*_2026-09-06.md (cited web research), [assumption] = untested, needs
customer interviews.

## 1. Problem
1. People in Germany facing an urgent legal event (eviction notice, dismissal,
   police contact, visa deadline, traffic fine) do not know which deadline
   applies, whether a lawyer is affordable, or what to do in the first 72 h.
   [assumption; supported by urgency flows built in repo: /urgent/select]
2. Lawyer discovery is fragmented: directories list names, not availability,
   language, or fit to a specific case type. [repo: professionals/law_firms
   modules; scout: anwalt.de/advocado positioning]
3. Documents (letters, contracts, Bescheide) are hard to interpret; the
   citizen cannot tell what matters. [repo: document_upload + analysis service]

Existing alternatives: Google + forum threads; anwalt.de / frag-einen-anwalt.de
paid Q&A; Verbraucherzentrale; Beratungshilfe (state-funded initial advice);
Rechtsschutzversicherung hotline; "asking a friend". [scout]

## 2. Customer segments
Primary (citizen, B2C):
- Non-native speakers and first-generation residents in Germany who need
  bilingual (DE/EN) guidance and a low-threshold entry point. [repo: i18n
  LanguageContext, visa/immigration intake]
- Employees and tenants hit by a sudden event with a hard deadline. [repo:
  employment, consumer intake forms]
Secondary (supply side, B2B2C):
- Solo lawyers and small Kanzleien wanting pre-qualified, structured leads.
  [repo: lawyer_onboarding, lawyer_dashboard, referrals]
Early adopters: international students / skilled migrants in university cities
(e.g. Karlsruhe), reached via Telegram communities. [assumption]

## 3. Unique value proposition
"From panic to plan in one conversation": structured, bilingual triage with
deadline awareness, a written legal roadmap, and a warm hand-off to a
matching lawyer — on the web or in Telegram, with the same account.
High-level concept: "Triage nurse for legal problems" — legal *information*
and routing, never RDG-restricted legal *advice*. [repo: RDG disclaimer in
platform capabilities; scout: RDG]

## 4. Solution
- Guided intake per case type → case record + urgency + next deadline.
  [repo: cases, intake forms — implemented]
- Legal roadmap generator (step list with sources) from case data. [repo:
  roadmap service — implemented, quality depends on model stack]
- Document upload + AI extraction/explanation (local OCR path; cloud DocIntel
  optional and now soft-imported). [repo: document_intelligence — partial]
- Lawyer directory + referral, insurance check, mediation pathway. [repo:
  implemented/partial per FEATURE_MATRIX]
- Assistant on web and Telegram sharing one capability registry + overview
  API so both surfaces say the same thing. [repo: /api/v1/platform/* — new]

## 5. Channels
- Telegram bot (OpenClaw gateway) — lowest friction for target segment.
- Web app (React) for forms, uploads, payments.
- Partnerships: university international offices, Mieterverein, Migrant
  advice centres, Verbraucherzentrale referral. [assumption]
- SEO content in DE/EN on "Was tun bei …" deadline questions. [assumption]

## 6. Revenue streams
- Free: triage, information, roadmap skeleton, directory browse.
- Citizen paid: consultation booking fee / fixed-price first consultation
  (status: planned — payment integration missing in repo).
- Lawyer side: per-qualified-lead fee or monthly listing (planned).
- Rechtsschutz insurers: referral/API partnership (long-term, assumption).
Comparable price anchors: frag-einen-anwalt.de pay-per-answer; advocado
fixed-price first consult. [scout]

## 7. Cost structure
- Inference: KIT Toolbox / local Ollama / verified free routes (policy:
  no Azure/paid without approval) → near-zero marginal cost at pilot scale.
- Hosting: Postgres + pgvector, FastAPI, static frontend; one small VM.
- Legal/compliance: RDG review, DSGVO (Art. 9 data), AVV with any processor.
- Content: law-text ingestion from gesetze-im-internet.de (public) and
  curation time.
- Biggest hidden cost: lawyer-side supply acquisition and trust building.

## 8. Key metrics
- Activation: % of started intakes that reach a saved case with a deadline.
- Time-to-first-guidance (target < 3 min in Telegram).
- Roadmap usefulness: thumbs-up rate; % of roadmaps with >= 1 cited section.
- Hand-off: referral requests per 100 cases; lawyer acceptance rate.
- Safety: % of answers carrying RDG disclaimer (must be 100%); zero
  special-category data echoed into group chats.
- Bot/web parity: capability registry drift = 0 (single source of truth).

## 9. Unfair advantage
- Bilingual, migrant-centred UX built from real intake flows (hard to copy
  for lawyer-first directories).
- Cost structure: institution-hosted and local models keep unit economics
  positive at zero revenue.
- One registry powering both web and bot → faster iteration and consistent
  compliance messaging.
- Not yet an advantage: data, brand, lawyer network. Must be earned.

## Riskiest assumptions to test next (in order)
1. Will target users trust and use a Telegram legal-triage bot? (10 user
   interviews + a 2-week pilot with the existing bot.)
2. Will 5 lawyers accept structured leads for a small fee? (Outreach in one
   city.)
3. Is roadmap quality with KIT/local models good enough to be safe? (Golden
   set of 30 cases, reviewed by a lawyer; measure citation accuracy.)
4. RDG boundary: get a written opinion on the exact wording of outputs.

## Links
- Feature reality check: workspace/projects/legal_aid/specs/FEATURE_MATRIX.md
- Capability registry (source of truth): backend/app/services/platform_capabilities.py
- Scout reports: docs/SCOUT_COMPETITORS_2026-09-06.md,
  docs/SCOUT_DATA_REGULATION_2026-09-06.md
