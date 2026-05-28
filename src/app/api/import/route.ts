import { NextRequest } from 'next/server'
import * as cheerio from 'cheerio'
import { parseDuration, parseIngredient } from '@/lib/utils'

export async function POST(request: NextRequest) {
  const { url } = await request.json()

  let html: string
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MealPlanner/1.0; +https://github.com/meal-planner)' },
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) return Response.json({ error: `Failed to fetch URL: ${res.status}` }, { status: 422 })
    html = await res.text()
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return Response.json({ error: `Could not reach URL: ${msg}` }, { status: 422 })
  }

  const $ = cheerio.load(html)

  // Try all JSON-LD blocks
  let recipeData: Record<string, unknown> | null = null
  $('script[type="application/ld+json"]').each((_, el) => {
    if (recipeData) return
    try {
      const raw = JSON.parse($(el).html() || '')
      const candidates: unknown[] = Array.isArray(raw) ? raw : [raw]
      for (const item of candidates) {
        const obj = item as Record<string, unknown>
        if (obj['@type'] === 'Recipe') { recipeData = obj; break }
        // Handle @graph
        const graph = obj['@graph']
        if (Array.isArray(graph)) {
          const found = graph.find((g: unknown) => (g as Record<string, unknown>)['@type'] === 'Recipe')
          if (found) { recipeData = found as Record<string, unknown>; break }
        }
      }
    } catch { /* ignore invalid JSON */ }
  })

  if (!recipeData) {
    return Response.json({ error: 'No recipe structured data found at this URL. The site may not support recipe import.' }, { status: 422 })
  }

  const r = recipeData as Record<string, unknown>

  const name = String(r.name || '')
  const description = String(r.description || '')

  const imageRaw = r.image
  let image_url: string | null = null
  if (typeof imageRaw === 'string') image_url = imageRaw
  else if (Array.isArray(imageRaw)) image_url = String((imageRaw[0] as Record<string, unknown>)?.url ?? imageRaw[0] ?? '') || null
  else if (imageRaw && typeof imageRaw === 'object') image_url = String((imageRaw as Record<string, unknown>).url ?? '') || null

  const prep_time = parseDuration(r.prepTime as string | undefined)
  const cook_time = parseDuration((r.cookTime ?? r.totalTime) as string | undefined)

  const servings = parseInt(
    Array.isArray(r.recipeYield) ? String((r.recipeYield as unknown[])[0]) : String(r.recipeYield ?? '4')
  ) || 4

  const rawIngredients: string[] = Array.isArray(r.recipeIngredient) ? r.recipeIngredient as string[] : []
  const ingredients = rawIngredients.map(parseIngredient)

  const rawInstructions = r.recipeInstructions
  let instructions = ''
  if (typeof rawInstructions === 'string') {
    instructions = rawInstructions
  } else if (Array.isArray(rawInstructions)) {
    instructions = (rawInstructions as unknown[]).map((step) => {
      if (typeof step === 'string') return step
      const s = step as Record<string, unknown>
      return String(s.text ?? s.name ?? '')
    }).filter(Boolean).join('\n\n')
  }

  return Response.json({ name, description, image_url, prep_time, cook_time, servings, ingredients, instructions, source_url: url })
}
