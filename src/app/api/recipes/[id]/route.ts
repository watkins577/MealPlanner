import { NextRequest } from 'next/server'
import db from '@/lib/db'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const recipe = db.prepare('SELECT * FROM recipes WHERE id = ?').get(id) as Record<string, unknown> | undefined
  if (!recipe) return Response.json({ error: 'Not found' }, { status: 404 })
  const ingredients = db.prepare('SELECT * FROM ingredients WHERE recipe_id = ? ORDER BY id').all(id)
  return Response.json({ ...recipe, ingredients })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const { name, description, servings, prep_time, cook_time, instructions, source_url, image_url, ingredients } = body

  db.prepare(`
    UPDATE recipes
    SET name=?, description=?, servings=?, prep_time=?, cook_time=?, instructions=?, source_url=?, image_url=?
    WHERE id=?
  `).run(
    name,
    description || null,
    servings || 4,
    prep_time || null,
    cook_time || null,
    instructions || null,
    source_url || null,
    image_url || null,
    id
  )

  if (ingredients) {
    db.prepare('DELETE FROM ingredients WHERE recipe_id = ?').run(id)
    const ingStmt = db.prepare('INSERT INTO ingredients (recipe_id, name, amount, unit) VALUES (?, ?, ?, ?)')
    for (const ing of ingredients) {
      ingStmt.run(id, ing.name, ing.amount || null, ing.unit || null)
    }
  }

  const recipe = db.prepare('SELECT * FROM recipes WHERE id = ?').get(id) as Record<string, unknown>
  const ings = db.prepare('SELECT * FROM ingredients WHERE recipe_id = ? ORDER BY id').all(id)
  return Response.json({ ...recipe, ingredients: ings })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  db.prepare('DELETE FROM recipes WHERE id = ?').run(id)
  return Response.json({ success: true })
}
