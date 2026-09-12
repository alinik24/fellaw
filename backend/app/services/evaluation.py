"""Product-correctness evaluation contracts for FelLaw.

These metrics are intentionally separate from retrieval metrics. The module
contains no professional gold data and cannot grant counsel approval.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any

PRIMARY_METRICS = (
    "classification_precision",
    "critical_trigger_recall",
    "critical_date_recall",
    "deadline_answer_precision",
    "deadline_coverage",
    "deadline_abstention_rate",
    "exception_detection_recall",
    "provenance_coverage",
    "unsupported_hallucination_rate",
    "correct_abstention_rate",
    "next_action_comprehension",
    "next_action_completion",
    "handoff_completeness",
    "correction_rate",
    "escalation_rate",
    "time_to_verified_next_action",
    "inference_cost",
)

FIXTURE_CLASSES = (
    "ENGINEERING_SYNTHETIC_DETERMINISTIC",
    "SOURCE_BACKED_DOCUMENT",
    "PROFESSIONALLY_REVIEWED_GOLD",
)


@dataclass(frozen=True)
class EvaluationResult:
    fixture_class: str
    metrics: dict[str, float | None]
    scenario: str
    notes: tuple[str, ...] = ()
    professional_gold_present: bool = False

    def __post_init__(self) -> None:
        if self.fixture_class not in FIXTURE_CLASSES:
            raise ValueError(f"unknown fixture class: {self.fixture_class}")
        if self.fixture_class == "PROFESSIONALLY_REVIEWED_GOLD" and not self.professional_gold_present:
            raise ValueError("professional gold must be explicitly supplied")

    @property
    def professional_release_claim_allowed(self) -> bool:
        return self.professional_gold_present and self.metrics.get("deadline_answer_precision") == 1.0


def empty_metrics() -> dict[str, float | None]:
    return {metric: None for metric in PRIMARY_METRICS}


def evaluate_synthetic_scenario(*, scenario: str, passed: bool, provenance_complete: bool, abstained_correctly: bool) -> EvaluationResult:
    metrics = empty_metrics()
    metrics["provenance_coverage"] = 1.0 if provenance_complete else 0.0
    metrics["correct_abstention_rate"] = 1.0 if abstained_correctly else 0.0
    metrics["classification_precision"] = 1.0 if passed else 0.0
    return EvaluationResult(
        fixture_class="ENGINEERING_SYNTHETIC_DETERMINISTIC",
        metrics=metrics,
        scenario=scenario,
        notes=("Synthetic engineering evidence only; not professional validation.",),
    )


def release_wording(result: EvaluationResult) -> str:
    if result.professional_release_claim_allowed:
        return "Zero known incorrect statutory deadlines in the professionally reviewed supported-domain gold set; coverage and abstention reported separately."
    return "Professional statutory-deadline release wording is unavailable until genuine professionally reviewed supported-domain gold exists."
