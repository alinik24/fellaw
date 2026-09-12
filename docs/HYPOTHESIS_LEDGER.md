# FelLaw — Hypothesis Ledger

Status: canonical, PR-00B · Updated: 2026-09-09
Every product/business thesis is classified: HYPOTHESIS / VALIDATED / REJECTED / UNKNOWN.
A hypothesis is UNVALIDATED (HYPOTHESIS) until a live measurement updates it. Do not present scenarios as facts.

| ID | Hypothesis | Current evidence | Test | Pass condition | Kill/Pivot | Status |
|---|---|---|---|---|---|---|
| H01 | Institution is the best payer | assumption; no paid deployment | 15 target-org buyer interviews + 3 structured proposals | ≥2 paid institutional pilots | Pivot GTM / reconsider buyer set | HYPOTHESIS |
| H02 | Supported-notice incidence is high enough | UNKNOWN; no FelLaw frequency data (external signals only, MARKET_ASSUMPTIONS.md) | 3 pilot datasets measure incidents per covered population | Sufficient recurring volume (e.g. >0 qualifying notices/covered person/yr, pilot-defined) | Narrow/change vertical or fallback vertical business | HYPOTHESIS |
| H03 | Employment is a strong initial vertical | UNKNOWN demand; 308,684 DE labour-court first-instance proceedings 2024 [VALIDATED ext. signal only] | Employment-first pilot cohort | Employment events are the top recurring volume in pilot data with acceptable safety | Rank differently / re-prioritize first-response families | HYPOTHESIS |
| H04 | Users understand the next action without generic chat | untested | Usability test on first-response output (no chat assistance) | ≥90% of test users identify the required next action | Redesign first-response output; add guided confirmation | HYPOTHESIS |
| H05 | Professional handoff reduces repeat intake | untested | Lawyer/adviser test with real dossier | ≥70% of professionals accept dossier without repeating the initial intake | Redesign handoff packet / escalation UX | HYPOTHESIS |
| H06 | Supported deadline rules can reach acceptable safe coverage | UNKNOWN; no golden set yet | Reviewed gold set (100–300 professional-reviewed examples), coverage vs abstention measured | Zero known incorrect statutory deadlines in supported gold set; coverage + abstention reported separately | Human-first or vertical pivot; shrink supported domain | HYPOTHESIS |
| H07 | B2B2C economics outperform episodic B2C subscription | assumption; no cohort data (B2C CAC/payback UNKNOWN) | Sales pilot comparing institutional vs consumer acquisition cost | Viable institutional sales cycle and payback vs episodic B2C optics | Change buyer / revisit go-to-market | HYPOTHESIS |
| H08 | Proposed pilot pricing produces real willingness to pay | assumption; no contract/invoice | Paid pilot offer (€7.5–15k) to pilot-eligible institutions | ≥2 signed paid pilots at or near proposed price | Adjust price / drop revenue line | HYPOTHESIS |
| H09 | Post-arrival consequential-event correspondence is painful enough to pay for | assumption; no direct research owned by FelLaw | Buyer interviews + pilot adoption | Institutions/end users prioritize the problem | Recompute problem-value; narrow vertical | HYPOTHESIS |
| H10 | Bilingual + RAG + Telegram is a meaningful advantage | REJECTED — resonant in investment review | (n/a) | (n/a) | Not a moat; do not claim as such | REJECTED |
| H11 | Engineering evaluation (retrieval quality) is the product benchmark | REJECTED — per PR-00/Gate finding, metrics must be product-first (provenance, abstention, deadline, action completion) | (n/a) | (n/a) | Not a moat; do not claim as such | REJECTED |
| H12 | Age band 20–59 is a product eligibility rule | REJECTED — it is only a market-sizing segment | (n/a) | (n/a) | Never an ICP exclusion | REJECTED |
| H13 | "100% precise" as a standalone deadline metric is meaningful | REJECTED — leads to gaming (answer 1 easy case) | (n/a) | (n/a) | Use separate measures (see VALUE_EVENT.md) | REJECTED |

## Ledger protocol
- Evidence is updated only from measured reality (real HTTP behavior, real DB rows, real rendered/pilot output).
- A status flips to VALIDATED only via the stated measurable pass condition.
- A kill/pivot condition triggers a decision record in DECISION_LOG.md.
- Correlation to VALUE_EVENT.md (north star: `verified_next_action_completed`) is required.
