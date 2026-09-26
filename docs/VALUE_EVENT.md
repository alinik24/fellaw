# FelLaw Value Event

Status: approved direction, PR-00
Updated: 2026-09-09

## North-star event

`verified_next_action_completed`

A matter qualifies only when the user has:

1. uploaded or submitted a supported consequential notice;
2. confirmed the critical facts used by the response;
3. received a source-backed first response;
4. identified and completed at least one safe next action before the relevant
   action target or verified deadline; or explicitly completed a documented
   human-handoff action when individualized judgment is required.

## Supporting events

```text
notice_upload_started
notice_upload_completed
notice_classified
fact_corrected
deadline_confirmed
first_response_viewed
action_completed
human_review_requested
handoff_created
handoff_accepted
matter_resolved
```

## Do not optimize

These are not north-star metrics:

```text
chat_messages
session_length
number_of_AI_features_used
route_count
model calls
retrieval MRR by itself
```

Retrieval, latency, cost, and model metrics remain secondary engineering
signals. A metric is valid only when measured from real HTTP behavior, real
persisted rows, or real rendered output.

## Safety constraints

Release wording (do not use "100% precise" as a standalone metric — see
below): zero known incorrect statutory deadlines in the professionally
reviewed supported-domain gold set; coverage and abstention are reported
separately.

Statutory-deadline measurement uses separate, independently reported metrics
(a system that answers one easy case out of 100 must not be scored "precise"):

- `deadline_answer_precision`
- `deadline_coverage`
- `deadline_abstention_rate`
- `critical_trigger_recall`
- `exception_detection_recall`

If the trigger or exception state is not verified, abstain with
`NEEDS_CONFIRMATION` rather than guessing.
- Every critical displayed fact has provenance coverage.
- Unsupported/ambiguous cases are abstained from rather than forced through.
- No outcome probability or success prediction is shown.
- A professional handoff is valuable only if the professional does not need to
  repeat the initial intake.
