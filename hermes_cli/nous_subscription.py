"""Stub for removed Nous subscription module.

The Nous Portal integration was removed from the active product surface (see
commit ``869c179`` - "remove Nous Portal from desktop provider setup UI"
and the earlier ``7aafdb8`` - "Remove Nous Portal and rebrand Hermes to Kova
Agent"). The supporting ``nous_subscription`` module was deleted as part of
that work, but several tests and downstream callers still reference the
``NousFeatureState`` / ``NousSubscriptionFeatures`` dataclasses for type
imports, and ``build_nous_subscription_prompt`` in
``agent/prompt_builder.py`` is a no-op that returns ``""``.

This stub preserves the public names so that:

* test files (``tests/agent/test_prompt_builder.py``,
  ``tests/hermes_cli/test_status_model_provider.py``,
  ``tests/hermes_cli/test_setup_model_provider.py``) can import them
  without raising ``ModuleNotFoundError`` at collection time
* ``monkeypatch.setattr("hermes_cli.nous_subscription.<name>", ...)`` works
  in tests that need to replace the underlying callables

The behavior returned is "not subscribed / no managed features", which
matches the actual production behavior now that the portal is gone.
Anyone who wants the real subscription feature back should restore the
original module from upstream history and re-wire the integrations.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Callable, Dict, Optional


@dataclass
class NousFeatureState:
    """Per-tool/feature capability status under a (removed) Nous subscription.

    The 9 positional fields below match the historical constructor signature
    used by the deleted module. Tests still construct ``NousFeatureState``
    with this exact shape. Optional ``available`` and ``direct_override``
    flags are added at the end with sensible defaults so attribute access
    never raises for code paths that consult them.
    """

    key: str
    label: str
    active: bool
    included_by_default: bool
    managed_by_nous: bool
    supported: bool
    requires_opt_in: bool
    in_plan: bool
    current_provider: str = ""
    available: bool = False
    direct_override: bool = False


@dataclass
class NousSubscriptionFeatures:
    """Bundle of subscription feature states. Matches the historical API.

    Supports two access patterns used by the codebase:
      * dict-like: ``features.items()`` / iteration over feature values
      * attribute-like: ``features.modal.managed_by_nous`` (well-known feature
        keys resolve to the corresponding ``NousFeatureState`` via __getattr__)
    """

    subscribed: bool = False
    nous_auth_present: bool = False
    provider_is_nous: bool = False
    features: Dict[str, NousFeatureState] = field(default_factory=dict)

    def items(self) -> Any:
        return self.features.items()

    def __iter__(self):  # type: ignore[no-untyped-def]
        return iter(self.features.values())

    def __getattr__(self, name: str) -> Any:
        # ``features`` is a real field; only consult it for unknown attrs.
        # Avoid recursion during dataclass __init__ by guarding on __dict__.
        feats = self.__dict__.get("features")
        if isinstance(feats, dict) and name in feats:
            return feats[name]
        # Default: a fully-inactive feature so attribute access never raises.
        return NousFeatureState(
            key=name,
            label=name,
            active=False,
            included_by_default=False,
            managed_by_nous=False,
            supported=False,
            requires_opt_in=False,
            in_plan=False,
            current_provider="",
        )


def managed_nous_tools_enabled(*args: Any, **kwargs: Any) -> bool:
    """Always false now that the managed tool gateway is removed."""
    return False


def get_nous_subscription_features(config: Any = None) -> NousSubscriptionFeatures:
    """Return a "no subscription" stub. The real portal is gone."""
    return NousSubscriptionFeatures(
        subscribed=False,
        nous_auth_present=False,
        provider_is_nous=False,
        features={},
    )


def prompt_enable_tool_gateway(config: Any = None) -> None:
    """No-op. The tool-gateway onboarding prompt is gone with the portal."""


def is_managed_tool_gateway_ready(name: str) -> bool:
    """No managed tool gateway exists. Always false."""
    return False


def _has_agent_browser() -> bool:
    """Compatibility probe: does the local agent have a browser available?

    Historical check used by the deleted portal integration. Returns False
    here so setup UX falls back to "no managed browser"; tests that need the
    opposite mock this with ``monkeypatch.setattr``.
    """
    return False


def get_nous_portal_account_info(*args: Any, **kwargs: Any) -> None:
    """Stub. Returns None — the portal auth lookup is gone."""
    return None
