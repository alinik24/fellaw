# FelLaw user stories and scenario matrix

Updated: 2026-09-06
Evidence classes: `[repo]` verified in source, `[runtime]` verified by live probe,
`[assumption]` requires user research, `[blocked]` needs credentials/database.

## Product principle

A person under legal pressure should always see the next safe action, what will
happen before data is shared, and whether a capability is real, partial, or
planned. Web and bot are clients of the same authenticated contracts.

## Personas

- **Citizen in a time-critical situation:** needs immediate triage, privacy,
  deadlines, and a safe lawyer handoff. [repo: urgent flows, platform registry]
- **Citizen with a document/question:** needs understandable legal information,
  source state, and a guided path—not a simulated legal conclusion. [repo:
  chat/document services; legal boundary]
- **International resident/student:** needs DE/EN entry, low-friction intake,
  and help understanding German process vocabulary. [repo: language context,
  immigration intake; assumption: acquisition channel]
- **Lawyer/firm:** needs a qualified, structured lead and honest profile state.
  [repo: professional API/dashboard; supply-side conversion assumption]
- **Admin/reviewer:** needs verification and audit controls before a profile or
  answer is presented as trusted. [repo: verification fields; endpoint gap]

## Scenario stories and acceptance criteria

### S1 — urgent citizen, no account

As a citizen who may be facing police contact, detention, eviction, dismissal,
or an accident, I want one-tap urgent help without first creating an account.

- Web: urgent path is visible from home, intake, and assistant. [repo]
- Bot: urgent intent links to `/urgent/select`; sensitive content is DM-only.
  [repo: bot_contract]
- Output says legal information is not legal advice and escalates to a lawyer.
  [repo]
- Never ask for unnecessary sensitive details in a group chat. [repo]
- Pass: route renders HTTP 200 and no authentication is required for entry.
  [runtime: previous probe]

### S2 — citizen starts an ordinary case

As a citizen with a non-urgent problem, I want to describe it in my own words,
choose a focused case type, and review before submission.

- Web: guided intake, progress `01/03`, local draft, real file selection.
  [repo]
- Files are clearly “selected locally” until an authenticated upload command
  exists; never show “uploaded” or “analyzed” prematurely. [repo]
- Bot: `new_case` is a deep link/preview; it does not create a case from prose.
  [repo]
- Pass: refresh preserves draft; empty description keeps continue disabled.

### S3 — citizen asks a legal question

As a signed-in citizen, I want a cited answer grounded in the FelLaw knowledge
base, with a clear distinction between information and advice.

- Web assistant calls `POST /api/v1/chat/message`. [repo]
- Bot calls the same contract and renders citation fields. [repo]
- Anonymous user receives sign-in route, not fabricated legal content. [repo]
- Pass: 401 is handled as a state, not a blank/error crash. [runtime: probe]
- Blocked: real citation quality requires DB + model credentials.

### S4 — citizen monitors a case

As a signed-in citizen, I want my own cases, urgency, and next deadlines in one
place so I can decide what to do next.

- Web dashboard calls authenticated `/api/v1/platform/overview`; no mock cases.
  [repo]
- Bot uses `/overview/text`; IDs are scoped to the token, never user input.
  [repo]
- Empty, loading, error, and urgent states are explicit. [repo]
- Pass: unauthenticated dashboard offers sign-in and urgent help. [repo]
- Blocked: authenticated fixture requires dedicated FelLaw DB.

### S5 — citizen discovers a lawyer

As a citizen, I want to filter available lawyer profiles by specialisation,
city, language, and transparent fee/free-consultation signals.

- Web calls `GET /api/v1/professionals/lawyers`; only backend-returned profiles
  render. [repo]
- UI labels verified, availability, ratings, fees, and reviews only when fields
  are returned; unknown is shown as unknown. [repo]
- “Book” and “pay” remain preview/deep-link states until those domains exist.
  [repo: registry]
- Bot `find_lawyer` links to web; it does not invent a match. [repo]
- Pass: 200 list, empty list, network error, and filter states are usable.

### S6 — lawyer receives a referral

As a lawyer, I want to review a structured referral and accept it only after
seeing the case context and required confirmation.

- Referral API and dashboard are the domain boundary. [repo]
- Bot mutation is preview-only until identity mapping, authorization,
  idempotency, confirmation, and audit/outbox exist. [repo]
- No claim of lawyer verification unless admin-controlled state is present.
  [repo]
- Blocked: end-to-end requires DB fixtures and a real lawyer account.

### S7 — privacy-sensitive document flow

As a user sharing a document containing health, criminal, immigration, or family
information, I want to know who can access it and where it is sent.

- Intake explains local selection before submission. [repo]
- Bot marks sensitive urgent content for private delivery. [repo]
- Group chats never receive document contents or special-category details.
- Pass: privacy note is visible before the continue action.
- Blocked: retention/deletion/processor controls require production decision.

## Channel parity matrix

| Story | Web | Embedded assistant | Telegram/OpenClaw | Backend contract | Status |
|---|---|---|---|---|---|
| S1 urgent | `/urgent/select` | capability link | `urgent` intent → link | emergency routes | implemented/partial |
| S2 intake | `/new-case*` | `new_case` link | `new_case` preview/link | cases API | partial (submission handoff) |
| S3 question | assistant | chat API + citations | chat API + citations | `/chat/message` | partial (DB/model blocked) |
| S4 monitor | `/user/dashboard` | overview strip | `/overview/text` | `/platform/overview` | implemented/blocked auth DB |
| S5 lawyer | `/find-lawyer` | capability link | `find_lawyer` link | `/professionals/lawyers` | implemented API/UI slice |
| S6 referral | lawyer dashboard | preview/link | `refer_me` preview | referrals API | partial |
| S7 privacy | intake/upload | private-state warning | DM guard | documents/evidence | partial |

## Scenario-derived remaining work

1. Dedicated FelLaw Postgres + pgvector target and authenticated fixtures.
2. Real upload command with processing status, retention, and deletion policy.
3. Telegram gateway adapter: token mapping, API calls, DM routing, rate limits,
   and audit/outbox.
4. Lawyer review/verification/admin workflow; do not label profiles verified
   without it.
5. Calendar/payment domains only after confirmation/idempotency design.
6. Lawyer-reviewed German golden set for RAG citation accuracy.
