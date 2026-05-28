import { NextRequest } from 'next/server'
import db from '@/lib/db'

interface IngredientRow {
  name: string
  amount: string | null
  unit: string | null
  recipe_name: string
}

export async function GET(request: NextRequest) {
  const weekStart = request.nextUrl.searchParams.get('week')
  if (!weekStart) return Response.json({ error: 'week parameter required' }, { status: 400 })

  const rows = db.prepare(`
    SELECT i.name, i.amount, i.unit, r.name as recipe_name
    FROM meal_plans mp
    JOIN recipes r ON mp.recipe_id = r.id
    JOIN ingredients i ON i.recipe_id = r.id
    WHERE mp.week_start = ?
    ORDER BY i.name COLLATE NOCASE
  `).all(weekStart) as IngredientRow[]

  // Group by normalized ingredient name
  const map = new Map<string, { displayName: string; amounts: string[]; recipes: Set<string> }>()
  for (const row of rows) {
    const key = row.name.toLowerCase().trim()
    if (!map.has(key)) {
      map.set(key, { displayName: row.name, amounts: [], recipes: new Set() })
    }
    const entry = map.get(key)!
    const parts = [row.amount, row.unit].filter(Boolean)
    if (parts.length > 0) entry.amounts.push(parts.join(' '))
    entry.recipes.add(row.recipe_name)
  }

  const items = Array.from(map.values())
    .map(({ displayName, amounts, recipes }) => ({
      name: displayName,
      amounts,
      recipes: Array.from(recipes),
    }))
    .sort((a, b) => a.name.localeCompare(b.name))

  return Response.json(items)
}
