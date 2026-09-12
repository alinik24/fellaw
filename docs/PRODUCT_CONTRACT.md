# FelLaw Product Contract

Status: approved direction, PR-00
Updated: 2026-09-09

## Canonical product statement

> FelLaw converts a consequential German document into a source-backed,
> deadline-aware first-response state and prepares escalation when
> individualized legal judgment is required.

## Beachhead

FelLaw initially serves international residents, employees, and students in
Germany after they are already living in Germany and receive a consequential
legal or administrative document or event.

The initial paying customer is institutional: employers, universities,
employee-benefit/EAP providers, mobility/relocation partners, and later
assistance or legal-protection networks.

FelLaw is not an immigration-management product. Immigration and relocation
workflow remain partner/distribution territory unless later evidence changes
that decision.

## Core value loop

```text
upload what arrived
→ identify what it is
→ verify the facts that matter
→ identify the relevant clock
→ show the next safe action
→ track completion
→ prepare a human handoff when needed
```

North-star event: `verified_next_action_completed`.

## Initial supported notice families

1. Employment termination or adverse employment letter
2. Bußgeldbescheid / traffic administrative notice
3. Authority or residence-related administrative decision/request
4. Tenancy termination or landlord notice (after the P1 slice is safe)

`unknown` and `NEEDS_CONFIRMATION` are successful safety states. Unsupported or
ambiguous documents must not receive an invented classification, deadline, or
legal conclusion.

## Six public capabilities

1. `submit_notice`
2. `upload_document`
3. `first_response`
4. `my_matters`
5. `deadline_reminders`
6. `human_handoff`

Generic chat is a contextual interaction inside these flows, not a standalone
product pillar.

## Non-negotiable contracts

- Critical dates come from a reviewed rule registry and deterministic code, or
  directly from the source document. An LLM may extract facts; it may not be
  the authoritative deadline calculator.
- Every displayed critical fact has source provenance and a confirmation or
  review state.
- Product state is persisted in the canonical matter/document/event/action
  path; conversation memory is not a source of truth.
- Human legal judgment and representation use an approved operating model and
  licensed/authorized fulfilment path.
- Web, assistant, and Telegram expose the same capability registry and domain
  contracts.
- No fabricated cases, deadlines, lawyers, prices, outcome probabilities,
  testimonials, partner claims, or completion states.

## Investment gate

Do not raise money on an AI legal platform, AI lawyer, lawyer marketplace, or
all-in-one legal super-app narrative. Institutional fundraising is considered
only after paid pilots, a compliant legal operating model, real supported
notice volume, safe deadline performance, and demonstrated professional
handoff value exist.
