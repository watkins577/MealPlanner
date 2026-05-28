---
name: run-meal-planner
description: Build, run, and drive meal-planner. Use when asked to start the meal-planner app, run it, take a screenshot of its UI, verify a feature works, or interact with the running app.
---

A Next.js 16 full-stack meal-planning app (recipes, weekly meal plan, shopping list). Drive it via `.claude/skills/run-meal-planner/smoke.mjs` — a Playwright script that starts against the already-running dev server and produces screenshots.

All paths below are relative to `meal-planner/`.

## Prerequisites

Node.js 24 (installed via winget: `winget install OpenJS.NodeJS.LTS`). No other system packages needed on Windows.

```powershell
# Verify
node --version   # v24+
npm --version    # 11+
```

## Setup

```powershell
npm install
npx playwright install chromium
```

## Build

```powershell
npm run build   # TypeScript check + optimised production build
```

## Run (agent path)

Start the dev server in one step, wait for it, then run the smoke driver:

```powershell
# 1. Start dev server (background)
$env:PATH = [System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH","User")
Start-Process -FilePath "C:\Program Files\nodejs\npm.cmd" -ArgumentList "run","dev" -WorkingDirectory (Get-Location).Path -NoNewWindow

# 2. Wait until it's up (poll port 3000)
$timeout = 30; $elapsed = 0
while ($elapsed -lt $timeout) {
    try { $r = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 2 -EA Stop; break } catch {}
    Start-Sleep 2; $elapsed += 2
}

# 3. Run smoke driver
node .claude/skills/run-meal-planner/smoke.mjs
```

Screenshots land in `.claude/skills/run-meal-planner/screenshots/` as `01-dashboard.png` through `06-shopping-list.png`.

The smoke script covers:
- Dashboard loads with stat cards and weekly grid
- Recipes page: search bar, Add Recipe, Import from Web buttons
- Add Recipe modal: fills a recipe and verifies the card appears
- Recipe detail: verifies name and "Add to Meal Plan" button
- Meal Plan: 7-day × 3-meal grid with dashed "+" slots and date headers
- Shopping List: page loads (empty if no meal plan assigned)

To stop the dev server after:

```powershell
Stop-Process -Name "node" -ErrorAction SilentlyContinue
```

## Run (human path)

```powershell
npm run dev   # → http://localhost:3000  Ctrl-C to stop
```

## Gotchas

- **`npm`/`node` not in PATH in PowerShell** — the installer updates the machine PATH but the current session doesn't see it. Prepend both machine and user PATH explicitly (as shown in the Run section above) or open a fresh terminal.
- **`Start-Process &` ampersand not allowed in PS 5.1** — use `Start-Process -NoNewWindow` instead; bare `&` at the end of a compound statement is a parse error in Windows PowerShell 5.1.
- **`better-sqlite3` native module** — Next.js 16 auto-externalises it (it's in the built-in allowlist), so no `serverExternalPackages` config is needed.
- **`params` is a Promise in Next.js 16** — both `page.tsx` and `route.ts` dynamic-segment handlers must `await params` before destructuring. Older patterns that destructure directly will type-error during build.
- **DB file created on first request** — `data/meal-planner.db` is created lazily when the first API route is hit. The directory is created by `src/lib/db.ts` using `mkdirSync({ recursive: true })`.

## Troubleshooting

- **`spawn npm ENOENT` from preview_start**: the preview tool inherits a minimal PATH that doesn't include the Node.js install. Use `Start-Process` with the full path `C:\Program Files\nodejs\npm.cmd` instead.
- **`'"node"' is not recognized`**: same root cause — set PATH from machine+user env vars before invoking node/npm in the same PowerShell session.
- **TypeScript error `Spread types may only be created from object types`**: `db.prepare(...).get(...)` returns `unknown`. Cast to `Record<string, unknown>` before spreading.
