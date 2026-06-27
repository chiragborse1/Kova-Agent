"""Tests for the Nous-kova-3/4 non-agentic warning detector.

Prior to this check, the warning fired on any model whose name contained
``"kova"`` anywhere (case-insensitive). That false-positived on unrelated
local Modelfiles such as ``kova-brain:qwen3-14b-ctx16k`` — a tool-capable
Qwen3 wrapper that happens to live under the "kova" tag namespace.

``is_nous_KOVA_non_agentic`` should only match the actual Nous Research
kova-3 / kova-4 chat family.
"""

from __future__ import annotations

import pytest

from kova_cli.model_switch import (
    _KOVA_MODEL_WARNING,
    _check_KOVA_model_warning,
    is_nous_KOVA_non_agentic,
)


@pytest.mark.parametrize(
    "model_name",
    [
        "NousResearch/kova-3-Llama-3.1-70B",
        "NousResearch/kova-3-Llama-3.1-405B",
        "kova-3",
        "kova-3",
        "kova-4",
        "kova-4-405b",
        "KOVA_4_70b",
        "openrouter/kova3:70b",
        "openrouter/nousresearch/kova-4-405b",
        "NousResearch/kova3",
        "kova-3.1",
    ],
)
def test_matches_real_nous_KOVA_chat_models(model_name: str) -> None:
    assert is_nous_KOVA_non_agentic(model_name), (
        f"expected {model_name!r} to be flagged as Nous kova 3/4"
    )
    assert _check_KOVA_model_warning(model_name) == _KOVA_MODEL_WARNING


@pytest.mark.parametrize(
    "model_name",
    [
        # Kyle's local Modelfile — qwen3:14b under a custom tag
        "kova-brain:qwen3-14b-ctx16k",
        "kova-brain:qwen3-14b-ctx32k",
        "kova-honcho:qwen3-8b-ctx8k",
        # Plain unrelated models
        "qwen3:14b",
        "qwen3-coder:30b",
        "qwen2.5:14b",
        "claude-opus-4-6",
        "anthropic/claude-sonnet-4.5",
        "gpt-5",
        "openai/gpt-4o",
        "google/gemini-2.5-flash",
        "deepseek-chat",
        # Non-chat kova models we don't warn about
        "kova-llm-2",
        "kova2-pro",
        "nous-kova-2-mistral",
        # Edge cases
        "",
        "kova",  # bare "kova" isn't the 3/4 family
        "kova-brain",
        "brain-kova-3-impostor",  # "3" not preceded by /: boundary
    ],
)
def test_does_not_match_unrelated_models(model_name: str) -> None:
    assert not is_nous_KOVA_non_agentic(model_name), (
        f"expected {model_name!r} NOT to be flagged as Nous kova 3/4"
    )
    assert _check_KOVA_model_warning(model_name) == ""


def test_none_like_inputs_are_safe() -> None:
    assert is_nous_KOVA_non_agentic("") is False
    # Defensive: the helper shouldn't crash on None-ish falsy input either.
    assert _check_KOVA_model_warning("") == ""
