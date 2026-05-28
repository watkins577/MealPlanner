import { NextRequest } from 'next/server'
import db from '@/lib/db'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  db.prepare('DELETE FROM meal_plans WHERE id = ?').run(id)
  return Response.json({ success: true })
}
