'use client'
import { useState } from 'react'
import RecipeForm, { RecipeFormData } from './RecipeForm'
import { importRecipeFromUrl } from '@/lib/importRecipe'
import { createRecipe } from '@/lib/storage'

interface Props {
  onImported: () => void
  onClose: () => void
}

type Step = 'url' | 'review'

export default function ImportModal({ onImported, onClose }: Props) {
  const [step, setStep] = useState<Step>('url')
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [importedData, setImportedData] = useState<RecipeFormData | null>(null)

  const handleFetch = async () => {
    if (!url.trim()) return
    setLoading(true)
    setError('')
    try {
      const data = await importRecipeFromUrl(url.trim())
      setImportedData(data)
      setStep('review')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Import failed — please try another URL')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (data: RecipeFormData) => {
    createRecipe(data)
    onImported()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">
            {step === 'url' ? 'Import Recipe from Web' : 'Review Imported Recipe'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <div className="p-6">
          {step === 'url' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Paste a URL from any recipe website that uses structured data (AllRecipes, Food Network, NYT Cooking, and most modern recipe sites).
              </p>
              <div className="flex gap-2">
                <input
                  type="url"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="https://www.allrecipes.com/recipe/..."
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleFetch()}
                />
                <button
                  onClick={handleFetch}
                  disabled={loading || !url.trim()}
                  className="bg-green-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors whitespace-nowrap"
                >
                  {loading ? 'Fetching...' : 'Import'}
                </button>
              </div>
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <p className="text-xs text-gray-400">
                Import uses a CORS proxy (allorigins.win). Works on most major recipe sites.
              </p>
            </div>
          )}

          {step === 'review' && importedData && (
            <div>
              <p className="text-sm text-gray-500 mb-5">Review and edit the imported recipe before saving.</p>
              <RecipeForm
                initial={{
                  name: importedData.name,
                  description: importedData.description,
                  servings: importedData.servings,
                  prep_time: importedData.prep_time ?? undefined,
                  cook_time: importedData.cook_time ?? undefined,
                  instructions: importedData.instructions,
                  source_url: importedData.source_url,
                  image_url: importedData.image_url,
                  ingredients: importedData.ingredients.map((ing, i) => ({
                    id: i,
                    recipe_id: 0,
                    name: ing.name,
                    amount: ing.amount,
                    unit: ing.unit,
                  })),
                }}
                onSave={handleSave}
                onCancel={onClose}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
