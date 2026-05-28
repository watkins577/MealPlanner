'use client'
import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Recipe } from '@/lib/types'
import RecipeCard from '@/components/RecipeCard'
import RecipeForm, { RecipeFormData } from '@/components/RecipeForm'
import ImportModal from '@/components/ImportModal'

function RecipesContent() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()

  const loadRecipes = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/recipes')
    const data = await res.json()
    setRecipes(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadRecipes()
    if (searchParams.get('import') === '1') {
      setShowImport(true)
      router.replace('/recipes')
    }
  }, [loadRecipes, searchParams, router])

  const filtered = recipes.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    (r.description || '').toLowerCase().includes(search.toLowerCase())
  )

  const handleAddSave = async (data: RecipeFormData) => {
    const res = await fetch('/api/recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Failed to save recipe')
    setShowAddForm(false)
    await loadRecipes()
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Recipes</h1>
          <p className="text-gray-500 mt-1">{recipes.length} recipe{recipes.length !== 1 ? 's' : ''} in your collection</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="px-4 py-2.5 border border-green-600 text-green-600 rounded-lg text-sm font-medium hover:bg-green-50 transition-colors"
          >
            Import from Web
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
          >
            + Add Recipe
          </button>
        </div>
      </div>

      <div className="mb-6">
        <input
          type="search"
          placeholder="Search recipes..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full max-w-sm border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 h-64 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          {search ? (
            <p>No recipes match &quot;{search}&quot;</p>
          ) : (
            <div className="space-y-3">
              <p className="text-lg">No recipes yet</p>
              <p className="text-sm">Add a recipe manually or import one from the web.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(recipe => <RecipeCard key={recipe.id} recipe={recipe} />)}
        </div>
      )}

      {/* Add Recipe Modal */}
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
          onImported={() => { setShowImport(false); loadRecipes() }}
          onClose={() => setShowImport(false)}
        />
      )}
    </div>
  )
}

export default function RecipesPage() {
  return (
    <Suspense>
      <RecipesContent />
    </Suspense>
  )
}
