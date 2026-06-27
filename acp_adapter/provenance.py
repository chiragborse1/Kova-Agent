"""Derive ACP session-provenance metadata from the existing compression chain.

This is an additive kova extension surfaced under ACP ``_meta.kova`` so
existing ACP clients ignore it. It carries no new persisted state: everything
is derived on demand from the ``sessions`` table (``parent_session_id`` /
``end_reason``), which already models compression-continuation chains.

The ACP/editor ``session_id`` stays the stable public handle. When context
compression rotates the internal kova head, ``build_session_provenance`` lets
a client see the previous/current internal ids and the lineage root without
parsing status text, guessing from token drops, or reading ``state.db``.
"""

from __future__ import annotations

from typing import Any, Dict, Optional

# Bound defensive walks; compression chains this deep are pathological.
_MAX_WALK = 100


def build_session_provenance(
    db: Any,
    acp_session_id: str,
    current_KOVA_SESSION_ID: str,
    *,
    previous_KOVA_SESSION_ID: Optional[str] = None,
) -> Optional[Dict[str, Any]]:
    """Build ``_meta.kova.sessionProvenance`` for an ACP session.

    Args:
        db: A ``SessionDB`` (must expose ``get_session``).
        acp_session_id: The stable ACP/editor-facing session handle.
        current_KOVA_SESSION_ID: The live internal kova DB session id
            (``state.agent.session_id``).
        previous_KOVA_SESSION_ID: The internal id from before the most recent
            turn, when known. Supplied by ``prompt()`` to flag a rotation.

    Returns:
        A dict suitable for ``{"kova": {"sessionProvenance": <dict>}}`` under
        ACP ``_meta``, or ``None`` if the session can't be read.
    """
    try:
        row = db.get_session(current_KOVA_SESSION_ID)
    except Exception:
        return None
    if not row:
        return None

    parent_id = row.get("parent_session_id")
    end_reason = row.get("end_reason")

    # Walk parents to the lineage root and count compression depth. Only
    # compression-split parents (parent.end_reason == 'compression') count
    # toward depth — delegate/branch children share the parent_session_id
    # column but are not compaction boundaries.
    root_id = current_KOVA_SESSION_ID
    compression_depth = 0
    cursor_parent = parent_id
    seen = {current_KOVA_SESSION_ID}
    for _ in range(_MAX_WALK):
        if not cursor_parent or cursor_parent in seen:
            break
        seen.add(cursor_parent)
        try:
            prow = db.get_session(cursor_parent)
        except Exception:
            prow = None
        if not prow:
            break
        root_id = cursor_parent
        if prow.get("end_reason") == "compression":
            compression_depth += 1
        cursor_parent = prow.get("parent_session_id")

    # A session is a compression continuation when its parent was ended with
    # end_reason='compression'. Determine that from the immediate parent.
    is_continuation = False
    if parent_id:
        try:
            immediate_parent = db.get_session(parent_id)
        except Exception:
            immediate_parent = None
        if immediate_parent and immediate_parent.get("end_reason") == "compression":
            is_continuation = True

    rotated = bool(
        previous_KOVA_SESSION_ID
        and previous_KOVA_SESSION_ID != current_KOVA_SESSION_ID
    )

    provenance: Dict[str, Any] = {
        "acpSessionId": acp_session_id,
        "currentKovaSessionId": current_KOVA_SESSION_ID,
        "rootKovaSessionId": root_id,
        "parentKovaSessionId": parent_id,
        "sessionKind": "continuation" if is_continuation else "root",
        "compressionDepth": compression_depth,
    }
    if previous_KOVA_SESSION_ID:
        provenance["previousKovaSessionId"] = previous_KOVA_SESSION_ID
    if rotated:
        # The head moved during the last turn. The only mechanism that rotates
        # the internal id mid-turn is compression-driven session splitting.
        provenance["reason"] = "compression"
        provenance["creatorKind"] = "compression"

    return provenance


def session_provenance_meta(
    db: Any,
    acp_session_id: str,
    current_KOVA_SESSION_ID: str,
    *,
    previous_KOVA_SESSION_ID: Optional[str] = None,
) -> Optional[Dict[str, Any]]:
    """Return a ready ``_meta`` payload: ``{"kova": {"sessionProvenance": ...}}``."""
    prov = build_session_provenance(
        db,
        acp_session_id,
        current_KOVA_SESSION_ID,
        previous_KOVA_SESSION_ID=previous_KOVA_SESSION_ID,
    )
    if prov is None:
        return None
    return {"kova": {"sessionProvenance": prov}}
