import { parseDuration, parseIngredient } from './utils'
import type { RecipeFormData } from '@/components/RecipeForm'

/**
 * Fetches a recipe URL via a CORS proxy, parses JSON-LD structured data,
 * and returns a RecipeFormData object ready for saving.
 * Runs entirely client-side — no server required.
 */
export async function importRecipeFromUrl(url: string): Promise<RecipeFormData> {
  const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`
  let html: string

  try {
    const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(15000) })
    if (!res.ok) throw new Error(`Proxy returned ${res.status}`)
    const json = await res.json()
    html = json.contents
    if (!html) throw new Error('No content returned')
    if (json.status?.http_code >= 400) throw new Error(`Site returned ${json.status.http_code}`)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    throw new Error(`Could not fetch URL: ${msg}`)
  }

  // Parse JSON-LD using the browser's DOMParser — no cheerio needed
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const scripts = Array.from(doc.querySelectorAll('script[type="application/ld+json"]'))

  let recipeData: Record<string, unknown> | null = null
  for (const script of scripts) {
    try {
      const raw = JSON.parse(script.textContent || '')
      const candidates: unknown[] = Array.isArray(raw) ? raw : [raw]
      for (const item of candidates) {
        const obj = item as Record<string, unknown>
        if (obj['@type'] === 'Recipe') { recipeData = obj; break }
        const graph = obj['@graph']
        if (Array.isArray(graph)) {
          const found = (graph as Record<string, unknown>[]).find(g => g['@type'] === 'Recipe')
          if (found) { recipeData = found; break }
        }
      }
    } catch { /* skip malformed blocks */ }
    if (recipeData) break
  }

  if (!recipeData) {
    throw new Error('No recipe data found at this URL. The site may not support structured data.')
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
    Array.isArray(r.recipeYield) ? String((r.recipeYield as unknown[])[0]) : String(r.recipeYield ?? '4')
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

  return { name, description, image_url, prep_time, cook_time, servings, ingredients, instructions, source_url: url }
}
