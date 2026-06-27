---
sidebar_position: 3
title: "Android / Termux"
description: "Run Kova Agent directly on an Android phone with Termux"
---

# kova on Android with Termux

:::warning Tier 2 platform
Termux (Android) is a [Tier 2 platform](./platform-support.md#tier-2). The installer script and documentation here are maintained on a best-effort basis only. Commits to `main` may break these packages at any point in time.
:::

Kova Agent can run directly on an Android phone through [Termux](https://termux.dev/).

It gives you a working local CLI on the phone, plus the core extras that are currently known to install cleanly on Android.

## What is supported in the tested path?

The tested Termux bundle installs:

- the Kova CLI
- cron support
- PTY/background terminal support
- Telegram gateway support (manual / best-effort background runs)
- MCP support
- Honcho memory support
- ACP support

Concretely, it maps to:

```bash
python -m pip install -e '.[termux]' -c constraints-termux.txt
```

## What is not part of the tested path yet?

A few features still need desktop/server-style dependencies that are not published for Android, or have not been validated on phones yet:

- `.[all]` is not supported on Android today
- the `voice` extra is blocked by `faster-whisper -> ctranslate2`, and `ctranslate2` does not publish Android wheels
- automatic browser / Playwright bootstrap is skipped in the Termux installer
- Docker-based terminal isolation is not available inside Termux
- Android may still suspend Termux background jobs, so gateway persistence is best-effort rather than a normal managed service

That does not stop kova from working well as a phone-native CLI agent — it just means the recommended mobile install is intentionally narrower than the desktop/server install.

---

## Option 1: One-line installer

kova now ships a Termux-aware installer path:

```bash
curl -fsSL https://kova-agent.nousresearch.com/install.sh | bash
```

On Termux, the installer automatically:

- uses `pkg` for system packages
- creates the venv with `python -m venv`
- attempts the broad `.[termux-all]` extra first and falls back to the smaller `.[termux]` extra (then a base install) — the curl installer matches this order automatically
- links `kova` into `$PREFIX/bin` so it stays on your Termux PATH
- skips the untested browser / WhatsApp bootstrap

If you want the explicit commands or need to debug a failed install, use the manual path below.

---

## Option 2: Manual install (fully explicit)

### 1. Update Termux and install system packages

```bash
pkg update
pkg install -y git python clang rust make pkg-config libffi openssl nodejs ripgrep ffmpeg
```

Why these packages?

- `python` — runtime + venv support
- `git` — clone/update the repo
- `clang`, `rust`, `make`, `pkg-config`, `libffi`, `openssl` — needed to build a few Python dependencies on Android
- `nodejs` — optional Node runtime for experiments beyond the tested core path
- `ripgrep` — fast file search
- `ffmpeg` — media / TTS conversions

### 2. Clone kova

```bash
git clone https://github.com/NousResearch/Kova-agent.git
cd kova-agent
```

### 3. Create a virtual environment

```bash
python -m venv venv
source venv/bin/activate
export ANDROID_API_LEVEL="$(getprop ro.build.version.sdk)"
python -m pip install --upgrade pip setuptools wheel
```

`ANDROID_API_LEVEL` is important for Rust / maturin-based packages such as `jiter`.

### 4. Install the tested Termux bundle

```bash
python -m pip install -e '.[termux]' -c constraints-termux.txt
```

If you only want the minimal core agent, this also works:

```bash
python -m pip install -e '.' -c constraints-termux.txt
```

### 5. Put `kova` on your Termux PATH

```bash
ln -sf "$PWD/venv/bin/kova" "$PREFIX/bin/kova"
```

`$PREFIX/bin` is already on PATH in Termux, so this makes the `kova` command persist across new shells without re-activating the venv every time.

### 6. Verify the install

```bash
kova version
kova doctor
```

### 7. Start kova

```bash
kova
```

---

## Recommended follow-up setup

### Configure a model

```bash
kova model
```

Or set keys directly in `~/.kova/.env`.

### Re-run the full interactive setup wizard later

```bash
kova setup
```

### Install optional Node dependencies manually

The tested Termux path skips Node/browser bootstrap on purpose. If you want to experiment with browser tooling later:

```bash
pkg install nodejs-lts
npm install
```

The browser tool automatically includes Termux directories (`/data/data/com.termux/files/usr/bin`) in its PATH search, so `agent-browser` and `npx` are discovered without any extra PATH configuration.

Treat browser / WhatsApp tooling on Android as experimental until documented otherwise.

---

## Troubleshooting

### `No solution found` when installing `.[all]`

Use the tested Termux bundle instead:

```bash
python -m pip install -e '.[termux]' -c constraints-termux.txt
```

The blocker is currently the `voice` extra:

- `voice` pulls `faster-whisper`
- `faster-whisper` depends on `ctranslate2`
- `ctranslate2` does not publish Android wheels

### `uv pip install` fails on Android

Use the Termux path with the stdlib venv + `pip` instead:

```bash
python -m venv venv
source venv/bin/activate
export ANDROID_API_LEVEL="$(getprop ro.build.version.sdk)"
python -m pip install --upgrade pip setuptools wheel
python -m pip install -e '.[termux]' -c constraints-termux.txt
```

### `jiter` / `maturin` complains about `ANDROID_API_LEVEL`

Set the API level explicitly before installing:

```bash
export ANDROID_API_LEVEL="$(getprop ro.build.version.sdk)"
python -m pip install -e '.[termux]' -c constraints-termux.txt
```

### `kova doctor` says ripgrep or Node is missing

Install them with Termux packages:

```bash
pkg install ripgrep nodejs
```

### Build failures while installing Python packages

Make sure the build toolchain is installed:

```bash
pkg install clang rust make pkg-config libffi openssl
```

Then retry:

```bash
python -m pip install -e '.[termux]' -c constraints-termux.txt
```

---

## Known limitations on phones

- Docker backend is unavailable
- local voice transcription via `faster-whisper` is unavailable in the tested path
- browser automation setup is intentionally skipped by the installer
- some optional extras may work, but only `.[termux]` and `.[termux-all]` are currently documented as the tested Android bundles

If you hit a new Android-specific issue, please open a GitHub issue with:

- your Android version
- `termux-info`
- `python --version`
- `kova doctor`
- the exact install command and full error output
