import { parseDuration, parseIngredient } from './utils'
import type { RecipeFormData } from '@/components/RecipeForm'

// ── Proxy chain ───────────────────────────────────────────────────────────
// Tries each proxy in order; returns the first one that delivers usable HTML.

function fetchWithTimeout(url: string, ms: number): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), ms)
  return fetch(url, { signal: ctrl.signal }).finally(() => clearTimeout(timer))
}

interface Proxy {
  name: string
  fetch: (encoded: string) => Promise<string>
}

const PROXIES: Proxy[] = [
  {
    name: 'corsproxy.io',
    fetch: async (encoded) => {
      const res = await fetchWithTimeout(`https://corsproxy.io/?${encoded}`, 12000)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return res.text()
    },
  },
  {
    name: 'allorigins.win',
    fetch: async (encoded) => {
      const res = await fetchWithTimeout(`https://api.allorigins.win/get?url=${encoded}`, 12000)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      if (!json.contents) throw new Error('empty response')
      return json.contents as string
    },
  },
  {
    name: 'codetabs.com',
    fetch: async (encoded) => {
      const res = await fetchWithTimeout(`https://api.codetabs.com/v1/proxy?quest=${encoded}`, 12000)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return res.text()
    },
  },
]

export async function importRecipeFromUrl(url: string): Promise<RecipeFormData> {
  const encoded = encodeURIComponent(url)
  const errors: string[] = []

  for (const proxy of PROXIES) {
    try {
      const html = await proxy.fetch(encoded)
      if (!html || html.length < 200) throw new Error('response too short')
      return importRecipeFromHtml(html, url)
    } catch (e: unknown) {
      errors.push(`${proxy.name}: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  throw new ProxyError(
    `All proxies failed for this site:\n• ${errors.join('\n• ')}\n\nSome sites (AllRecipes, Food Network) block CORS proxies. Use the "Paste HTML" tab instead.`,
    errors
  )
}

export class ProxyError extends Error {
  constructor(message: string, public readonly proxyErrors: string[]) {
    super(message)
  }
}

// ── HTML → RecipeFormData ─────────────────────────────────────────────────

// @type can be a plain string ("Recipe") or an array (["Recipe","NewsArticle"])
function isRecipeType(t: unknown): boolean {
  if (typeof t === 'string') return t === 'Recipe'
  if (Array.isArray(t)) return (t as string[]).includes('Recipe')
  return false
}

export function importRecipeFromHtml(html: string, sourceUrl = ''): RecipeFormData {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const scripts = Array.from(doc.querySelectorAll('script[type="application/ld+json"]'))

  let recipeData: Record<string, unknown> | null = null
  for (const script of scripts) {
    try {
      const raw = JSON.parse(script.textContent || '')
      const candidates: unknown[] = Array.isArray(raw) ? raw : [raw]
      for (const item of candidates) {
        const obj = item as Record<string, unknown>
        if (isRecipeType(obj['@type'])) { recipeData = obj; break }
        const graph = obj['@graph']
        if (Array.isArray(graph)) {
          const found = (graph as Record<string, unknown>[]).find(g => isRecipeType(g['@type']))
          if (found) { recipeData = found; break }
        }
      }
    } catch { /* skip malformed blocks */ }
    if (recipeData) break
  }

  if (!recipeData) {
    throw new Error('No recipe structured data found in this page. The site may not use JSON-LD markup.')
  }

  const r = recipeData
  const name = String(r.name || '')
  const description = String(r.description || '')

  const imageRaw = r.image
  let image_url = ''
  if (typeof imageRaw === 'string') image_url = imageRaw
  else if (Array.isArray(imageRaw)) image_url = String((imageRaw[0] as Record<string, unknown>)?.url ?? imageRaw[0] ?? '')
  else if (imageRaw && typeof imageRaw === 'object') image_url = String((imageRaw as Record<string, unknown>).url ?? '')

  const prep_time = parseDuration(r.prepTime as string | undefined)
  const cook_time = parseDuration((r.cookTime ?? r.totalTime) as string | undefined)
  const servings = parseInt(
    Array.isArray(r.recipeYield)
      ? String((r.recipeYield as unknown[])[0])
      : String(r.recipeYield ?? '4')
  ) || 4

  const rawIngredients: string[] = Array.isArray(r.recipeIngredient) ? (r.recipeIngredient as string[]) : []
  const ingredients = rawIngredients.map(i => {
    const p = parseIngredient(i)
    return { amount: p.amount ?? '', unit: p.unit ?? '', name: p.name }
  })

  const rawInstructions = r.recipeInstructions
  let instructions = ''
  if (typeof rawInstructions === 'string') {
    instructions = rawInstructions
  } else if (Array.isArray(rawInstructions)) {
    instructions = (rawInstructions as unknown[])
      .map(s => typeof s === 'string' ? s : String((s as Record<string, unknown>).text ?? (s as Record<string, unknown>).name ?? ''))
      .filter(Boolean)
      .join('\n\n')
  }

  return { name, description, image_url, prep_time, cook_time, servings, ingredients, instructions, source_url: sourceUrl }
}
