"""Stub — Nous Portal account helpers removed. Minimal dataclasses retained for backward compatibility."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Literal, Optional


NousAccountInfoSource = Literal["jwt", "account_api", "inference_key", "none", "error"]

TOOL_COVERAGE_CATEGORIES = (
    "firecrawl",
    "fal",
    "fal-video",
    "openai-audio",
    "browser-use",
    "modal",
)


@dataclass(frozen=True)
class NousPortalSubscriptionInfo:
    plan: Optional[str] = None
    tier: Optional[int] = None
    monthly_charge: Optional[float] = None
    monthly_credits: Optional[float] = None
    current_period_end: Optional[str] = None
    credits_remaining: Optional[float] = None
    rollover_credits: Optional[float] = None


@dataclass(frozen=True)
class NousPaidServiceAccessInfo:
    allowed: Optional[bool] = None
    paid_access: Optional[bool] = None
    reason: Optional[str] = None
    organisation_id: Optional[str] = None
    effective_at_ms: Optional[int] = None
    has_active_subscription: Optional[bool] = None
    active_subscription_is_paid: Optional[bool] = None
    subscription_tier: Optional[int] = None
    subscription_monthly_charge: Optional[float] = None
    subscription_credits_remaining: Optional[float] = None
    purchased_credits_remaining: Optional[float] = None
    total_usable_credits: Optional[float] = None


@dataclass(frozen=True)
class NousToolAccessInfo:
    enabled: bool = False
    coverage: dict[str, bool] = field(default_factory=dict)


@dataclass(frozen=True)
class NousPortalAccountInfo:
    logged_in: bool = False
    source: NousAccountInfoSource = "none"
    fresh: bool = False
    user_id: Optional[str] = None
    org_id: Optional[str] = None
    org_slug: Optional[str] = None
    org_name: Optional[str] = None
    client_id: Optional[str] = None
    product_id: Optional[str] = None
    nous_client: Optional[str] = None
    portal_base_url: Optional[str] = None
    inference_base_url: Optional[str] = None
    inference_credential_present: bool = False
    credential_source: Optional[str] = None
    expires_at: Any = None
    email: Optional[str] = None
    privy_did: Optional[str] = None
    subscription: Optional[NousPortalSubscriptionInfo] = None
    paid_service_access: Optional[bool] = None
    paid_service_access_info: Optional[NousPaidServiceAccessInfo] = None
    tool_access: Optional[NousToolAccessInfo] = None
    raw_claims: Optional[dict] = None
    raw_account: Optional[dict] = None
    error: Optional[str] = None

    @property
    def is_paid(self) -> bool:
        return self.paid_service_access is True

    @property
    def is_free_tier(self) -> bool:
        return self.paid_service_access is False

    @property
    def tool_gateway_entitled(self) -> bool:
        if self.paid_service_access is True:
            return True
        return self.tool_access is not None and self.tool_access.enabled

    def tool_gateway_entitled_for(self, category: str) -> bool:
        if self.paid_service_access is True:
            return True
        ta = self.tool_access
        return bool(ta and ta.enabled and ta.coverage.get(category) is True)


def get_nous_portal_account_info(
    *,
    force_fresh: bool = False,
    min_jwt_ttl_seconds: int = 60,
) -> NousPortalAccountInfo:
    """Stub — Nous Portal removed. Returns a logged-out account info."""
    return NousPortalAccountInfo(
        logged_in=False,
        source="none",
        fresh=False,
    )


def reset_nous_portal_account_info_cache() -> None:
    """Stub — cache removed with Nous Portal."""


def nous_portal_billing_url(account_info=None) -> str:
    """Stub — returns default billing URL."""
    if account_info is not None and account_info.portal_base_url:
        return f"{account_info.portal_base_url.rstrip('/')}/billing"
    return "https://portal.nousresearch.com/billing"


def nous_portal_topup_url(account_info=None) -> str:
    """Stub — returns default top-up URL."""
    if account_info is not None and account_info.portal_base_url:
        return f"{account_info.portal_base_url.rstrip('/')}/billing?topup=open"
    return "https://portal.nousresearch.com/billing?topup=open"


def _credit_detail(
    total_usable: Optional[float],
    subscription_credits: Optional[float],
    purchased_credits: Optional[float],
) -> str:
    parts: list = []
    if total_usable is not None:
        parts.append(f"usable ${total_usable:.2f}")
    if subscription_credits is not None:
        parts.append(f"subscription ${subscription_credits:.2f}")
    if purchased_credits is not None:
        parts.append(f"purchased ${purchased_credits:.2f}")
    if not parts:
        return ""
    return f" ({', '.join(parts)})"


def _no_paid_access_message(
    account_info: NousPortalAccountInfo,
    capability: str,
    billing_url: str,
) -> str:
    access = account_info.paid_service_access_info
    has_active_subscription = access.has_active_subscription if access else None
    active_subscription_is_paid = access.active_subscription_is_paid if access else None
    total_usable = access.total_usable_credits if access else None
    subscription_credits = access.subscription_credits_remaining if access else None
    purchased_credits = access.purchased_credits_remaining if access else None

    if has_active_subscription and active_subscription_is_paid:
        credit_detail = _credit_detail(total_usable, subscription_credits, purchased_credits)
        return (
            f"Your Nous Portal credits are exhausted{credit_detail}, so {capability} "
            f"is unavailable. Top up or renew credits at {billing_url}."
        )

    if has_active_subscription and active_subscription_is_paid is False:
        return (
            f"Your current Nous Portal plan does not include paid service access, "
            f"so {capability} is unavailable. Upgrade or add credits at {billing_url}."
        )

    if has_active_subscription is False:
        credit_detail = _credit_detail(total_usable, subscription_credits, purchased_credits)
        return (
            f"Your Nous Portal account has no active subscription or usable credits"
            f"{credit_detail}, so {capability} is unavailable. Subscribe or add credits "
            f"at {billing_url}."
        )

    credit_detail = _credit_detail(total_usable, subscription_credits, purchased_credits)
    return (
        f"Your Nous Portal account has no usable paid credits{credit_detail}, so "
        f"{capability} is unavailable. Add credits or update billing at {billing_url}."
    )


def format_nous_portal_entitlement_message(
    account_info: Optional[NousPortalAccountInfo],
    *,
    capability: str = "this feature",
    include_refresh_hint: bool = True,
    coverage_category: Optional[str] = None,
) -> Optional[str]:
    """Return user-facing guidance for a missing Nous tool-gateway entitlement."""
    billing_url = nous_portal_billing_url(account_info)

    if account_info is not None:
        if coverage_category is not None:
            if account_info.tool_gateway_entitled_for(coverage_category):
                return None
            if account_info.tool_gateway_entitled:
                return (
                    f"{capability} isn't included with your current Nous Portal "
                    f"access. Add credits or a subscription to enable it at {billing_url}."
                )
        elif account_info.tool_gateway_entitled:
            return None

    if account_info is None:
        return (
            f"Hermes could not verify your Nous Portal entitlement, so {capability} "
            f"is unavailable. Run `kova model` to refresh your login, or check "
            f"billing at {billing_url}."
        )

    if not account_info.logged_in:
        if account_info.inference_credential_present:
            return (
                f"Nous inference credentials are configured, but Hermes cannot verify "
                f"your Nous Portal paid access for {capability}. Log in with "
                f"`kova model` to enable Portal-managed features. Billing and "
                f"credits are managed at {billing_url}."
            )
        return (
            f"Log in to Nous Portal to use {capability}: run `kova model`. "
            f"Billing and credits are managed at {billing_url}."
        )

    if account_info.paid_service_access is None:
        detail = (
            f"Hermes could not verify your Nous Portal paid access, so {capability} "
            f"is unavailable."
        )
        if account_info.error:
            detail += f" Account lookup failed: {account_info.error}."
        if include_refresh_hint:
            detail += " Run `kova model` to refresh your session."
        detail += f" Check billing at {billing_url}."
        return detail

    access = account_info.paid_service_access_info
    reason = access.reason if access else None
    if reason == "account_missing":
        return (
            f"Hermes could not find a Nous Portal account or organisation for this "
            f"login, so {capability} is unavailable. Run `kova model` to "
            f"authenticate again; if the problem persists, contact Nous support."
        )

    if reason == "no_usable_credits" or account_info.paid_service_access is False:
        message = _no_paid_access_message(account_info, capability, billing_url)
        if include_refresh_hint and not account_info.fresh:
            message += " If you recently bought credits, run `kova model` to refresh Hermes."
        return message

    return (
        f"Your Nous Portal account does not currently have paid service access, "
        f"so {capability} is unavailable. Add credits or update billing at {billing_url}."
    )
