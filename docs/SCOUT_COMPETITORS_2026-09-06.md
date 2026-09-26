# FelLaw competitor scout — 2026-09-06

Evidence date: 2026-09-06 (local system date). Web search was rate-limited
(HTTP 429) during this run; direct HTTP checks are recorded below. Marketing
claims are not independently validated. Confidence refers to the observation,
not to the competitor's claim.

## Direct and adjacent competitors

| Product | URL / evidence | Observed capability | Pricing visible | Confidence |
|---|---|---|---|---|
| advocado | https://www.advocado.de/ — official homepage, HTTP 200 | Online lawyer matching; free initial assessment is advertised; digital intake/contact; broad legal topics | First assessment advertised as free; later pricing varies by matter | High for page observation; medium for outcomes |
| anwalt.de | https://www.anwalt.de/ — official homepage, HTTP 403 to automated client | Lawyer directory/marketplace positioning is known from official brand URL; automated observation blocked | Not verified in this run | Low (unreachable to automated client) |
| Frag-einen-Anwalt | https://www.frag-einen-anwalt.de/ — official homepage, HTTP 200 | Consumer posts a legal question; lawyer answers online; topic/category navigation | Question/answer price is selected per request; exact current price not verified | Medium |
| rightmart | https://rightmart.de/ — official homepage, HTTP 200 | Consumer legal help with digital case intake; claims-focused service positioning; lawyer handoff | Matter-dependent; exact current prices not verified | Medium |
| Flightright | https://www.flightright.de/ — official homepage, HTTP 403 to automated client | Flight-delay/cancellation claim handling; specialized mass-claim workflow | Typically success-fee positioning; exact rate not verified | Low (page blocked) |
| CONNY | https://www.conny.de/ — official homepage, HTTP 200 | Tenant/rent legal claims; digital eligibility/intake; specialized consumer legal service | Success-fee / matter-dependent positioning; exact rate not verified | Medium |
| OpenLegalData | https://openlegaldata.io/ — official/open-data project site, HTTP 200 | Legal-data APIs/datasets useful as an infrastructure comparator, not a consumer legal service | Open-data project; commercial terms not assumed | Medium |

## Implications for FelLaw

- Match advocado's low-friction lawyer matching, but differentiate with a
  bilingual, case-specific first-72-hours roadmap. Source: advocado official
  homepage above; repo: `backend/app/services/platform_capabilities.py`.
- Treat Frag-einen-Anwalt as a price/response-time alternative; show a clear
  free-vs-paid boundary before a user starts an intake. Source: official URL
  above; exact price needs a current manual check.
- Do not compete with Flightright/CONNY on a single claim type initially;
  FelLaw's advantage is cross-domain triage and lawyer routing. Sources:
  official URLs above; confidence low/medium because of automated access limits.
- Make lawyer availability, language, jurisdiction, and topic fit explicit;
  a generic directory is not enough for an urgent case. Source: comparison of
  directory/marketplace positioning above; product hypothesis, not verified
  conversion evidence.
- Keep payment, booking, referral acceptance, and verification statuses honest;
  the current capability registry marks incomplete flows rather than promising
  them. Source: `FEATURE_MATRIX.md` and `platform_capabilities.py`.
- Use Telegram for discovery and reminders, but route sensitive documents and
  special-category data to authenticated web/DM flows. Source: GDPR source in
  `SCOUT_DATA_REGULATION_2026-09-06.md` and repo channel design.
- Build a lawyer-reviewed golden set before expanding marketing claims about
  AI document analysis or legal roadmaps. Competitor homepages are marketing
  evidence, not evidence of model quality.

## Research limitations

Automated requests to anwalt.de and Flightright returned HTTP 403. Search was
HTTP 429. No pricing or performance claim marked “not verified” should be used
in customer-facing copy without a manual browser review. Access date is the
system date reported by the run: 2026-09-06.
