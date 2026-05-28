'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { MealPlanEntry, DAYS, MEAL_TYPES } from '@/lib/types'
import { getMondayOfWeek, formatDateKey, formatWeekRange } from '@/lib/utils'
import { getRecipes, getMealPlanForWeek } from '@/lib/storage'

export default function HomePage() {
  const [recipeCount, setRecipeCount] = useState<number | null>(null)
  const [mealPlan, setMealPlan] = useState<MealPlanEntry[]>([])
  const weekStart = formatDateKey(getMondayOfWeek(new Date()))

  useEffect(() => {
    setRecipeCount(getRecipes().length)
    setMealPlan(getMealPlanForWeek(weekStart))
  }, [weekStart])

  const getMeal = (day: number, meal: string) =>
    mealPlan.find(p => p.day_of_week === day && p.meal_type === meal)

  const plannedCount = mealPlan.length

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">{formatWeekRange(getMondayOfWeek(new Date()))}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Recipes" value={recipeCount === null ? '...' : String(recipeCount)} href="/recipes" description="in your collection" color="green" />
        <StatCard label="Meals Planned" value={`${plannedCount} / 21`} href="/meal-plan" description="this week" color="blue" />
        <StatCard label="Shopping List" value={plannedCount > 0 ? 'Ready' : 'Empty'} href="/shopping-list" description="generate from meal plan" color="amber" />
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">This Week</h2>
          <Link href="/meal-plan" className="text-sm text-green-600 hover:text-green-700 font-medium">Edit plan &rarr;</Link>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-500 w-24">Meal</th>
                  {DAYS.map(d => <th key={d} className="text-left py-3 px-3 font-medium text-gray-500">{d.slice(0, 3)}</th>)}
                </tr>
              </thead>
              <tbody>
                {MEAL_TYPES.map(mealType => (
                  <tr key={mealType} className="border-b border-gray-100 last:border-0">
                    <td className="py-3 px-4 font-medium text-gray-600 capitalize">{mealType}</td>
                    {DAYS.map((_, dayIdx) => {
                      const meal = getMeal(dayIdx, mealType)
                      return (
                        <td key={dayIdx} className="py-3 px-3">
                          {meal ? <span className="text-gray-800 font-medium line-clamp-1">{meal.recipe_name}</span> : <span className="text-gray-300">-</span>}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <QuickAction href="/recipes" title="Browse Recipes" desc="View and manage your recipe collection" />
          <QuickAction href="/recipes?import=1" title="Import Recipe" desc="Add a recipe from any cooking website" />
          <QuickAction href="/shopping-list" title="Shopping List" desc="Get your ingredient list for the week" />
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, href, description, color }: { label: string; value: string; href: string; description: string; color: 'green' | 'blue' | 'amber' }) {
  const colors = { green: 'bg-green-50 text-green-700 border-green-200', blue: 'bg-blue-50 text-blue-700 border-blue-200', amber: 'bg-amber-50 text-amber-700 border-amber-200' }
  return (
    <Link href={href} className={`block p-5 rounded-xl border ${colors[color]} hover:shadow-sm transition-shadow`}>
      <div className="text-3xl font-bold">{value}</div>
      <div className="font-semibold mt-1">{label}</div>
      <div className="text-sm opacity-70 mt-0.5">{description}</div>
    </Link>
  )
}

function QuickAction({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link href={href} className="block p-5 bg-white rounded-xl border border-gray-200 hover:shadow-md hover:border-green-200 transition-all">
      <div className="font-semibold text-gray-900">{title}</div>
      <div className="text-sm text-gray-500 mt-1">{desc}</div>
    </Link>
  )
}
