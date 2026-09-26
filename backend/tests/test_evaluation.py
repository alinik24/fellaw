from app.services.evaluation import (
    FIXTURE_CLASSES, PRIMARY_METRICS, EvaluationResult,
    empty_metrics, evaluate_synthetic_scenario, release_wording,
)


def test_engineering_fixture_classes_are_explicit_and_separate():
    assert FIXTURE_CLASSES == (
        "ENGINEERING_SYNTHETIC_DETERMINISTIC",
        "SOURCE_BACKED_DOCUMENT",
        "PROFESSIONALLY_REVIEWED_GOLD",
    )
    assert set(empty_metrics()) == set(PRIMARY_METRICS)


def test_synthetic_evaluation_does_not_claim_professional_release():
    result = evaluate_synthetic_scenario(
        scenario="supported employment notice",
        passed=True,
        provenance_complete=True,
        abstained_correctly=True,
    )
    assert result.fixture_class == "ENGINEERING_SYNTHETIC_DETERMINISTIC"
    assert result.professional_gold_present is False
    assert result.professional_release_claim_allowed is False
    assert "unavailable" in release_wording(result)


def test_professional_gold_requires_explicit_evidence():
    try:
        EvaluationResult("PROFESSIONALLY_REVIEWED_GOLD", {}, "fake")
    except ValueError as exc:
        assert "professional gold" in str(exc)
    else:
        raise AssertionError("professional gold must never be implicit")
