'use client'
import { useEffect, useState, useCallback } from 'react'
import { Recipe, MealPlanEntry, MealType, DAYS, MEAL_TYPES } from '@/lib/types'
import { getMondayOfWeek, formatDateKey, formatWeekRange } from '@/lib/utils'

export default function MealPlanPage() {
  const [weekOffset, setWeekOffset] = useState(0)
  const [mealPlan, setMealPlan] = useState<MealPlanEntry[]>([])
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [picker, setPicker] = useState<{ day: number; mealType: MealType } | null>(null)
  const [pickerSearch, setPickerSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const monday = getMondayOfWeek(new Date())
  monday.setDate(monday.getDate() + weekOffset * 7)
  const weekStart = formatDateKey(monday)

  const loadPlan = useCallback(async (week: string) => {
    setLoading(true)
    const res = await fetch(`/api/meal-plan?week=${week}`)
    const data = await res.json()
    setMealPlan(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetch('/api/recipes').then(r => r.json()).then(setRecipes)
  }, [])

  useEffect(() => {
    loadPlan(weekStart)
  }, [weekStart, loadPlan])

  const getEntry = (day: number, mealType: MealType) =>
    mealPlan.find(e => e.day_of_week === day && e.meal_type === mealType)

  const handleAssign = async (recipeId: number) => {
    if (!picker) return
    const res = await fetch('/api/meal-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ week_start: weekStart, day_of_week: picker.day, meal_type: picker.mealType, recipe_id: recipeId }),
    })
    const entry = await res.json()
    setMealPlan(prev => {
      const filtered = prev.filter(e => !(e.day_of_week === picker.day && e.meal_type === picker.mealType))
      return [...filtered, entry]
    })
    setPicker(null)
    setPickerSearch('')
  }

  const handleRemove = async (entry: MealPlanEntry) => {
    await fetch(`/api/meal-plan/${entry.id}`, { method: 'DELETE' })
    setMealPlan(prev => prev.filter(e => e.id !== entry.id))
  }

  const filteredRecipes = recipes.filter(r =>
    r.name.toLowerCase().includes(pickerSearch.toLowerCase())
  )

  const weekLabel = weekOffset === 0 ? 'This Week' : weekOffset === 1 ? 'Next Week' : weekOffset === -1 ? 'Last Week' : `${weekOffset > 0 ? '+' : ''}${weekOffset} weeks`

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Meal Plan</h1>
          <p className="text-gray-500 mt-1">{formatWeekRange(monday)}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setWeekOffset(w => w - 1)} className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">&larr;</button>
          <span className="px-4 py-2 text-sm font-medium text-gray-700 min-w-[100px] text-center">{weekLabel}</span>
          <button onClick={() => setWeekOffset(w => w + 1)} className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">&rarr;</button>
          {weekOffset !== 0 && (
            <button onClick={() => setWeekOffset(0)} className="px-3 py-2 text-sm text-green-600 hover:text-green-700 font-medium">Today</button>
          )}
        </div>
      </div>

      {recipes.length === 0 ? (
        <div className="text-center py-20 text-gray-400 bg-white rounded-xl border border-gray-200">
          <p className="text-lg">No recipes yet</p>
          <p className="text-sm mt-2">Add some recipes first to start planning meals.</p>
          <a href="/recipes" className="text-green-600 hover:underline text-sm mt-2 inline-block">Go to Recipes &rarr;</a>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 w-28">Meal</th>
                  {DAYS.map((day, i) => {
                    const d = new Date(monday)
                    d.setDate(monday.getDate() + i)
                    const isToday = formatDateKey(d) === formatDateKey(new Date())
                    return (
                      <th key={day} className={`text-left py-3 px-3 text-sm font-medium min-w-[120px] ${isToday ? 'text-green-600' : 'text-gray-500'}`}>
                        <div>{day.slice(0, 3)}</div>
                        <div className={`text-xs font-normal ${isToday ? 'text-green-500' : 'text-gray-400'}`}>
                          {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {MEAL_TYPES.map(mealType => (
                  <tr key={mealType} className="border-b border-gray-100 last:border-0">
                    <td className="py-3 px-4 text-sm font-medium text-gray-600 capitalize align-top">{mealType}</td>
                    {DAYS.map((_, dayIdx) => {
                      const entry = getEntry(dayIdx, mealType)
                      return (
                        <td key={dayIdx} className="py-2 px-2 align-top">
                          {entry ? (
                            <div className="group relative bg-green-50 border border-green-200 rounded-lg p-2 text-xs">
                              <div className="font-medium text-gray-800 line-clamp-2 pr-5">{entry.recipe_name}</div>
                              <button
                                onClick={() => handleRemove(entry)}
                                className="absolute top-1.5 right-1.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity text-base leading-none"
                              >
                                &times;
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => { setPicker({ day: dayIdx, mealType }); setPickerSearch('') }}
                              className={`w-full h-10 border-2 border-dashed rounded-lg text-gray-300 hover:border-green-400 hover:text-green-400 transition-colors text-lg ${loading ? 'opacity-40 pointer-events-none' : ''}`}
                            >
                              +
                            </button>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recipe Picker Modal */}
      {picker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[70vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold">
                Pick a recipe for {DAYS[picker.day]} {picker.mealType}
              </h2>
              <button onClick={() => setPicker(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <div className="p-4 border-b border-gray-100">
              <input
                autoFocus
                type="search"
                placeholder="Search recipes..."
                value={pickerSearch}
                onChange={e => setPickerSearch(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="overflow-y-auto flex-1 p-2">
              {filteredRecipes.length === 0 ? (
                <p className="text-center text-gray-400 py-8 text-sm">No recipes found</p>
              ) : (
                filteredRecipes.map(recipe => (
                  <button
                    key={recipe.id}
                    onClick={() => handleAssign(recipe.id)}
                    className="w-full text-left px-4 py-3 rounded-lg hover:bg-green-50 hover:text-green-700 transition-colors text-sm font-medium"
                  >
                    {recipe.name}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
