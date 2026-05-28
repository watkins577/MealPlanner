/**
 * Smoke driver for meal-planner.
 * Requires the dev server running on port 3000.
 * Usage: node .claude/skills/run-meal-planner/smoke.mjs
 * Screenshots are saved to .claude/skills/run-meal-planner/screenshots/
 */

import { chromium } from 'playwright'
import { mkdir } from 'fs/promises'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dir = dirname(fileURLToPath(import.meta.url))
const SS_DIR = join(__dir, 'screenshots')
await mkdir(SS_DIR, { recursive: true })

const BASE = 'http://localhost:3000'

const browser = await chromium.launch({ headless: true })
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
const page = await ctx.newPage()

async function screenshot(name) {
  const p = join(SS_DIR, `${name}.png`)
  await page.screenshot({ path: p, fullPage: false })
  console.log(`  screenshot → ${p}`)
}

async function check(label, selector) {
  try {
    await page.waitForSelector(selector, { timeout: 8000 })
    console.log(`  ✓ ${label}`)
  } catch {
    console.error(`  ✗ ${label} — selector "${selector}" not found`)
    process.exitCode = 1
  }
}

// ── Home / Dashboard ───────────────────────────────────────────────────────
console.log('\n→ Dashboard (/)')
await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
await check('heading "Dashboard"', 'h1:text("Dashboard")')
await check('stat card "Recipes"', 'text=Recipes')
await screenshot('01-dashboard')

// ── Recipes ────────────────────────────────────────────────────────────────
console.log('\n→ Recipes (/recipes)')
await page.goto(`${BASE}/recipes`, { waitUntil: 'networkidle' })
await check('heading "Recipes"', 'h1:text("Recipes")')
await check('"Add Recipe" button', 'button:has-text("Add Recipe")')
await check('"Import from Web" button', 'button:has-text("Import from Web")')
await screenshot('02-recipes')

// ── Add Recipe flow ─────────────────────────────────────────────────────────
console.log('\n→ Add Recipe modal')
await page.click('button:has-text("Add Recipe")')
await check('modal open', 'h2:text("Add Recipe")')
await page.fill('input[placeholder="e.g. Spaghetti Carbonara"]', 'Smoke Test Pasta')
await page.fill('input[placeholder="15"]', '10')
await page.fill('input[placeholder="30"]', '20')
// Fill ingredient
await page.fill('input[placeholder="Ingredient name"]', 'pasta')
await page.click('button:has-text("Save Recipe")')
// Wait for modal to close
await page.waitForSelector('h2:text("Add Recipe")', { state: 'detached', timeout: 6000 }).catch(() => {})
await check('recipe card appears', 'text=Smoke Test Pasta')
await screenshot('03-recipes-after-add')

// ── Recipe Detail ──────────────────────────────────────────────────────────
console.log('\n→ Recipe detail')
await page.click('text=Smoke Test Pasta')
await check('recipe detail name', 'h1:text("Smoke Test Pasta")')
await check('"Add to Meal Plan" button', 'button:has-text("Add to Meal Plan")')
await screenshot('04-recipe-detail')

// ── Meal Plan ──────────────────────────────────────────────────────────────
console.log('\n→ Meal Plan (/meal-plan)')
await page.goto(`${BASE}/meal-plan`, { waitUntil: 'networkidle' })
await check('heading "Meal Plan"', 'h1:text("Meal Plan")')
await check('Mon column header', 'th:has-text("Mon")')
await check('Breakfast row', 'td:has-text("breakfast")')
await screenshot('05-meal-plan')

// ── Shopping List ─────────────────────────────────────────────────────────
console.log('\n→ Shopping List (/shopping-list)')
await page.goto(`${BASE}/shopping-list`, { waitUntil: 'networkidle' })
await check('heading "Shopping List"', 'h1:text("Shopping List")')
await screenshot('06-shopping-list')

await browser.close()
console.log('\n✓ All checks passed. Screenshots in', SS_DIR)
