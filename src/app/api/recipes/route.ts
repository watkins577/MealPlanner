import { NextRequest } from 'next/server'
import db from '@/lib/db'

export async function GET() {
  const recipes = db.prepare('SELECT * FROM recipes ORDER BY created_at DESC').all()
  return Response.json(recipes)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { name, description, servings, prep_time, cook_time, instructions, source_url, image_url, ingredients } = body

  const stmt = db.prepare(`
    INSERT INTO recipes (name, description, servings, prep_time, cook_time, instructions, source_url, image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const result = stmt.run(
    name,
    description || null,
    servings || 4,
    prep_time || null,
    cook_time || null,
    instructions || null,
    source_url || null,
    image_url || null
  )
  const recipeId = result.lastInsertRowid

  if (ingredients && ingredients.length > 0) {
    const ingStmt = db.prepare('INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (?, ?, ?, ?)')
    for (const ing of ingredients) {
      ingStmt.run(recipeId, ing.name, ing.amount || null, ing.unit || null)
    }
  }

  const recipe = db.prepare('SELECT * FROM recipes WHERE id = ?').get(recipeId) as Record<string, unknown>
  const ings = db.prepare('SELECT * FROM ingredients WHERE recipe_id = ?').all(recipeId)
  return Response.json({ ...recipe, ingredients: ings }, { status: 201 })
}
