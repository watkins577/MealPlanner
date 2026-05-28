import { NextRequest } from 'next/server'
import db from '@/lib/db'

export async function GET(request: NextRequest) {
  const weekStart = request.nextUrl.searchParams.get('week')
  if (!weekStart) return Response.json({ error: 'week parameter required' }, { status: 400 })

  const plans = db.prepare(`
    SELECT mp.id, mp.week_start, mp.day_of_week, mp.meal_type, mp.recipe_id,
           r.name as recipe_name, r.image_url as recipe_image, r.prep_time, r.cook_time
    FROM meal_plans mp
    JOIN recipes r ON mp.recipe_id = r.id
    WHERE mp.week_start = ?
    ORDER BY mp.day_of_week, mp.meal_type
  `).all(weekStart)

  return Response.json(plans)
}

export async function POST(request: NextRequest) {
  const { week_start, day_of_week, meal_type, recipe_id } = await request.json()

  // REPLACE handles the UNIQUE constraint by updating existing entry
  const result = db.prepare(`
    INSERT OR REPLACE INTO meal_plans (week_start, day_of_week, meal_type, recipe_id)
    VALUES (?, ?, ?, ?)
  `).run(week_start, day_of_week, meal_type, recipe_id)

  const entry = db.prepare(`
    SELECT mp.id, mp.week_start, mp.day_of_week, mp.meal_type, mp.recipe_id,
           r.name as recipe_name, r.image_url as recipe_image
    FROM meal_plans mp
    JOIN recipes r ON mp.recipe_id = r.id
    WHERE mp.id = ?
  `).get(result.lastInsertRowid)

  return Response.json(entry, { status: 201 })
}
