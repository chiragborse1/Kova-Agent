# Langfuse Observability Plugin

This plugin ships bundled with kova but is **opt-in** — it only loads when
you explicitly enable it.

## Enable

Pick one:

```bash
# Interactive: walks you through credentials + SDK install + enable
kova tools  # → Langfuse Observability

# Manual
pip install langfuse
kova plugins enable observability/langfuse
```

## Required credentials

Set these in `~/.kova/.env` (or via `kova tools`):

```bash
KOVA_LANGFUSE_PUBLIC_KEY=pk-lf-...
KOVA_LANGFUSE_SECRET_KEY=sk-lf-...
KOVA_LANGFUSE_BASE_URL=https://cloud.langfuse.com   # or your self-hosted URL
```

Without the SDK or credentials the hooks no-op silently — the plugin fails
open.

## Verify

```bash
kova plugins list                 # observability/langfuse should show "enabled"
kova chat -q "hello"              # then check Langfuse for a "kova turn" trace
```

## Optional tuning

```bash
KOVA_LANGFUSE_ENV=production       # environment tag
KOVA_LANGFUSE_RELEASE=v1.0.0       # release tag
KOVA_LANGFUSE_SAMPLE_RATE=0.5      # sample 50% of traces
KOVA_LANGFUSE_MAX_CHARS=12000      # max chars per field (default: 12000)
KOVA_LANGFUSE_DEBUG=true           # verbose plugin logging
```

## Disable

```bash
kova plugins disable observability/langfuse
```
