'use client'
import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Recipe, MealType, DAYS, MEAL_TYPES } from '@/lib/types'
import { formatTime, getMondayOfWeek, formatDateKey } from '@/lib/utils'
import { getRecipes, getRecipeById, createRecipe, updateRecipe, deleteRecipe, setMealPlanEntry } from '@/lib/storage'
import RecipeCard from '@/components/RecipeCard'
import RecipeForm, { RecipeFormData } from '@/components/RecipeForm'
import ImportModal from '@/components/ImportModal'

// ── Recipes list ──────────────────────────────────────────────────────────

function RecipeList({ onDetail }: { onDetail: (id: number) => void }) {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [search, setSearch] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()

  const load = useCallback(() => setRecipes(getRecipes()), [])

  useEffect(() => {
    load()
    if (searchParams.get('import') === '1') {
      setShowImport(true)
      router.replace('/recipes')
    }
  }, [load, searchParams, router])

  const filtered = recipes.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    (r.description || '').toLowerCase().includes(search.toLowerCase())
  )

  const handleAddSave = async (data: RecipeFormData) => {
    createRecipe(data)
    setShowAddForm(false)
    load()
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Recipes</h1>
          <p className="text-gray-500 mt-1">{recipes.length} recipe{recipes.length !== 1 ? 's' : ''} in your collection</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowImport(true)} className="px-4 py-2.5 border border-green-600 text-green-600 rounded-lg text-sm font-medium hover:bg-green-50 transition-colors">Import from Web</button>
          <button onClick={() => setShowAddForm(true)} className="px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">+ Add Recipe</button>
        </div>
      </div>

      <div className="mb-6">
        <input type="search" placeholder="Search recipes..." value={search} onChange={e => setSearch(e.target.value)} className="w-full max-w-sm border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          {search ? <p>No recipes match &quot;{search}&quot;</p> : (
            <div className="space-y-3"><p className="text-lg">No recipes yet</p><p className="text-sm">Add a recipe manually or import one from the web.</p></div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(recipe => <RecipeCard key={recipe.id} recipe={recipe} onClick={() => onDetail(recipe.id)} />)}
        </div>
      )}

      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">Add Recipe</h2>
              <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <div className="p-6">
              <RecipeForm onSave={handleAddSave} onCancel={() => setShowAddForm(false)} />
            </div>
          </div>
        </div>
      )}

      {showImport && (
        <ImportModal
          onImported={() => { setShowImport(false); load() }}
          onClose={() => setShowImport(false)}
        />
      )}
    </div>
  )
}

// ── Recipe detail ─────────────────────────────────────────────────────────

function RecipeDetail({ id, onBack }: { id: number; onBack: () => void }) {
  const [recipe, setRecipe] = useState<Recipe | null | undefined>(undefined)
  const [editing, setEditing] = useState(false)
  const [showMealPlan, setShowMealPlan] = useState(false)

  useEffect(() => {
    setRecipe(getRecipeById(id) ?? null)
  }, [id])

  const handleUpdate = async (data: RecipeFormData) => {
    const updated = updateRecipe(id, data)
    setRecipe(updated)
    setEditing(false)
  }

  const handleDelete = () => {
    if (!confirm(`Delete "${recipe?.name}"? This will also remove it from meal plans.`)) return
    deleteRecipe(id)
    onBack()
  }

  if (recipe === undefined) return <div className="animate-pulse h-64 bg-gray-100 rounded-xl" />

  if (!recipe) return (
    <div className="text-center py-20">
      <p className="text-gray-500">Recipe not found.</p>
      <button onClick={onBack} className="text-green-600 hover:underline mt-2 inline-block">Back to Recipes</button>
    </div>
  )

  if (editing) return (
    <div className="max-w-2xl">
      <button onClick={() => setEditing(false)} className="text-sm text-gray-500 hover:text-gray-700 mb-6">&larr; Cancel editing</button>
      <h1 className="text-2xl font-bold mb-6">Edit Recipe</h1>
      <RecipeForm initial={recipe} onSave={handleUpdate} onCancel={() => setEditing(false)} />
    </div>
  )

  return (
    <div className="max-w-3xl">
      <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-700 mb-6 flex items-center gap-1">&larr; Recipes</button>

      {recipe.image_url && (
        <div className="h-72 rounded-2xl overflow-hidden mb-6 bg-gray-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={recipe.image_url} alt={recipe.name} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{recipe.name}</h1>
          {recipe.description && <p className="text-gray-600 mt-2">{recipe.description}</p>}
          {recipe.source_url && (
            <a href={recipe.source_url} target="_blank" rel="noopener noreferrer" className="text-sm text-green-600 hover:underline mt-1 inline-block">View original recipe &rarr;</a>
          )}
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={() => setShowMealPlan(true)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">Add to Meal Plan</button>
          <button onClick={() => setEditing(true)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">Edit</button>
          <button onClick={handleDelete} className="px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50">Delete</button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-8 p-4 bg-gray-50 rounded-xl">
        {recipe.servings && <div><span className="font-medium">Servings:</span> {recipe.servings}</div>}
        {recipe.prep_time && <div><span className="font-medium">Prep:</span> {formatTime(recipe.prep_time)}</div>}
        {recipe.cook_time && <div><span className="font-medium">Cook:</span> {formatTime(recipe.cook_time)}</div>}
        {recipe.prep_time && recipe.cook_time && <div><span className="font-medium">Total:</span> {formatTime(recipe.prep_time + recipe.cook_time)}</div>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Ingredients</h2>
          {recipe.ingredients?.length ? (
            <ul className="space-y-2">
              {recipe.ingredients.map(ing => (
                <li key={ing.id} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0 mt-1.5" />
                  <span>{[ing.amount, ing.unit, ing.name].filter(Boolean).join(' ')}</span>
                </li>
              ))}
            </ul>
          ) : <p className="text-gray-400 text-sm">No ingredients listed.</p>}
        </div>
        <div className="md:col-span-2">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Instructions</h2>
          {recipe.instructions ? (
            <div className="text-gray-700 text-sm space-y-3">
              {recipe.instructions.split(/\n\n+/).map((p, i) => <p key={i}>{p}</p>)}
            </div>
          ) : <p className="text-gray-400 text-sm">No instructions added.</p>}
        </div>
      </div>

      {showMealPlan && <AddToMealPlanModal recipeId={recipe.id} recipeName={recipe.name} onClose={() => setShowMealPlan(false)} />}
    </div>
  )
}

// ── Add to Meal Plan modal ────────────────────────────────────────────────

function AddToMealPlanModal({ recipeId, recipeName, onClose }: { recipeId: number; recipeName: string; onClose: () => void }) {
  const [day, setDay] = useState(0)
  const [mealType, setMealType] = useState<MealType>('dinner')
  const [weekOffset, setWeekOffset] = useState(0)
  const [success, setSuccess] = useState(false)

  const monday = getMondayOfWeek(new Date())
  monday.setDate(monday.getDate() + weekOffset * 7)
  const weekStart = formatDateKey(monday)

  const handleAdd = () => {
    setMealPlanEntry(weekStart, day, mealType, recipeId)
    setSuccess(true)
    setTimeout(onClose, 1200)
  }

  const selCls = 'border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white'

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Add to Meal Plan</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>
        <p className="text-sm text-gray-600 mb-5">Adding <strong>{recipeName}</strong> to your meal plan.</p>

        {success ? (
          <div className="text-center py-4 text-green-600 font-medium">Added successfully!</div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Week</label>
              <div className="flex items-center gap-2">
                <button onClick={() => setWeekOffset(w => w - 1)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600">&larr;</button>
                <span className="text-sm text-gray-700 flex-1 text-center">
                  {weekOffset === 0 ? 'This week' : weekOffset === 1 ? 'Next week' : `${weekOffset > 0 ? '+' : ''}${weekOffset} weeks`}
                </span>
                <button onClick={() => setWeekOffset(w => w + 1)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600">&rarr;</button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
              <select className={selCls + ' w-full'} value={day} onChange={e => setDay(Number(e.target.value))}>
                {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meal</label>
              <div className="flex gap-2">
                {MEAL_TYPES.map(mt => (
                  <button key={mt} type="button" onClick={() => setMealType(mt)} className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${mealType === mt ? 'bg-green-600 text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>{mt}</button>
                ))}
              </div>
            </div>
            <button onClick={handleAdd} className="w-full bg-green-600 text-white py-2.5 rounded-lg font-medium hover:bg-green-700 transition-colors mt-2">Add to Plan</button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Root ──────────────────────────────────────────────────────────────────

function RecipesContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const idParam = searchParams.get('id')
  const recipeId = idParam ? Number(idParam) : null

  if (recipeId !== null) {
    return <RecipeDetail id={recipeId} onBack={() => router.push('/recipes')} />
  }
  return <RecipeList onDetail={id => router.push(`/recipes?id=${id}`)} />
}

export default function RecipesPage() {
  return <Suspense><RecipesContent /></Suspense>
}
