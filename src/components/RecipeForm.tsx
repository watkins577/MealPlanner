'use client'
import { useState } from 'react'
import { Recipe, Ingredient } from '@/lib/types'

interface IngredientDraft {
  amount: string
  unit: string
  name: string
}

interface Props {
  initial?: Partial<Recipe & { ingredients: Ingredient[] }>
  onSave: (data: RecipeFormData) => Promise<void>
  onCancel: () => void
}

export interface RecipeFormData {
  name: string
  description: string
  servings: number
  prep_time: number | null
  cook_time: number | null
  instructions: string
  source_url: string
  image_url: string
  ingredients: IngredientDraft[]
}

export default function RecipeForm({ initial, onSave, onCancel }: Props) {
  const [name, setName] = useState(initial?.name || '')
  const [description, setDescription] = useState(initial?.description || '')
  const [servings, setServings] = useState(String(initial?.servings || 4))
  const [prepTime, setPrepTime] = useState(String(initial?.prep_time || ''))
  const [cookTime, setCookTime] = useState(String(initial?.cook_time || ''))
  const [instructions, setInstructions] = useState(initial?.instructions || '')
  const [sourceUrl, setSourceUrl] = useState(initial?.source_url || '')
  const [imageUrl, setImageUrl] = useState(initial?.image_url || '')
  const [ingredients, setIngredients] = useState<IngredientDraft[]>(
    initial?.ingredients?.map(i => ({ amount: i.amount || '', unit: i.unit || '', name: i.name })) || [{ amount: '', unit: '', name: '' }]
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const addIngredient = () => setIngredients(prev => [...prev, { amount: '', unit: '', name: '' }])
  const removeIngredient = (i: number) => setIngredients(prev => prev.filter((_, idx) => idx !== i))
  const updateIngredient = (i: number, field: keyof IngredientDraft, val: string) =>
    setIngredients(prev => prev.map((ing, idx) => idx === i ? { ...ing, [field]: val } : ing))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError('Recipe name is required'); return }
    setSaving(true)
    setError('')
    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
        servings: parseInt(servings) || 4,
        prep_time: prepTime ? parseInt(prepTime) : null,
        cook_time: cookTime ? parseInt(cookTime) : null,
        instructions: instructions.trim(),
        source_url: sourceUrl.trim(),
        image_url: imageUrl.trim(),
        ingredients: ingredients.filter(i => i.name.trim()),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save recipe')
      setSaving(false)
    }
  }

  const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent'
  const labelCls = 'block text-sm font-medium text-gray-700 mb-1'

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

      <div>
        <label className={labelCls}>Recipe Name *</label>
        <input className={inputCls} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Spaghetti Carbonara" />
      </div>

      <div>
        <label className={labelCls}>Description</label>
        <textarea className={inputCls} rows={2} value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description of the dish" />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelCls}>Servings</label>
          <input type="number" className={inputCls} value={servings} onChange={e => setServings(e.target.value)} min="1" />
        </div>
        <div>
          <label className={labelCls}>Prep Time (min)</label>
          <input type="number" className={inputCls} value={prepTime} onChange={e => setPrepTime(e.target.value)} min="0" placeholder="15" />
        </div>
        <div>
          <label className={labelCls}>Cook Time (min)</label>
          <input type="number" className={inputCls} value={cookTime} onChange={e => setCookTime(e.target.value)} min="0" placeholder="30" />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className={labelCls + ' mb-0'}>Ingredients</label>
          <button type="button" onClick={addIngredient} className="text-sm text-green-600 hover:text-green-700 font-medium">+ Add</button>
        </div>
        <div className="space-y-2">
          {ingredients.map((ing, i) => (
            <div key={i} className="flex gap-2">
              <input
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 w-20"
                placeholder="Qty"
                value={ing.amount}
                onChange={e => updateIngredient(i, 'amount', e.target.value)}
              />
              <input
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 w-24"
                placeholder="Unit"
                value={ing.unit}
                onChange={e => updateIngredient(i, 'unit', e.target.value)}
              />
              <input
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 flex-1"
                placeholder="Ingredient name"
                value={ing.name}
                onChange={e => updateIngredient(i, 'name', e.target.value)}
              />
              {ingredients.length > 1 && (
                <button type="button" onClick={() => removeIngredient(i)} className="text-gray-400 hover:text-red-500 px-1">&#10005;</button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className={labelCls}>Instructions</label>
        <textarea className={inputCls} rows={6} value={instructions} onChange={e => setInstructions(e.target.value)} placeholder="Step-by-step cooking instructions..." />
      </div>

      <div>
        <label className={labelCls}>Image URL</label>
        <input className={inputCls} value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." />
      </div>

      <div>
        <label className={labelCls}>Source URL</label>
        <input className={inputCls} value={sourceUrl} onChange={e => setSourceUrl(e.target.value)} placeholder="https://..." />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 bg-green-600 text-white py-2.5 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving...' : 'Save Recipe'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
