'use client'
import { useState } from 'react'
import RecipeForm, { RecipeFormData } from './RecipeForm'
import { importRecipeFromUrl, importRecipeFromHtml, ProxyError } from '@/lib/importRecipe'
import { createRecipe } from '@/lib/storage'

interface Props {
  onImported: () => void
  onClose: () => void
}

type Tab = 'url' | 'paste'
type Step = 'input' | 'review'

export default function ImportModal({ onImported, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('url')
  const [step, setStep] = useState<Step>('input')

  // URL tab state
  const [url, setUrl] = useState('')
  const [urlLoading, setUrlLoading] = useState(false)
  const [urlError, setUrlError] = useState('')
  const [urlProxyErrors, setUrlProxyErrors] = useState<string[]>([])

  // Paste tab state
  const [pastedHtml, setPastedHtml] = useState('')
  const [pasteUrl, setPasteUrl] = useState('')
  const [pasteError, setPasteError] = useState('')

  const [importedData, setImportedData] = useState<RecipeFormData | null>(null)

  const handleUrlFetch = async () => {
    if (!url.trim()) return
    setUrlLoading(true)
    setUrlError('')
    setUrlProxyErrors([])
    try {
      const data = await importRecipeFromUrl(url.trim())
      setImportedData(data)
      setStep('review')
    } catch (e: unknown) {
      if (e instanceof ProxyError) {
        setUrlError('All CORS proxies failed for this site.')
        setUrlProxyErrors(e.proxyErrors)
      } else {
        setUrlError(e instanceof Error ? e.message : 'Import failed')
      }
    } finally {
      setUrlLoading(false)
    }
  }

  const handlePasteParse = () => {
    setPasteError('')
    if (!pastedHtml.trim()) { setPasteError('Paste the page HTML first.'); return }
    try {
      const data = importRecipeFromHtml(pastedHtml, pasteUrl.trim())
      setImportedData(data)
      setStep('review')
    } catch (e: unknown) {
      setPasteError(e instanceof Error ? e.message : 'Could not find recipe data in this HTML.')
    }
  }

  const handleSave = async (data: RecipeFormData) => {
    createRecipe(data)
    onImported()
  }

  const tabCls = (t: Tab) =>
    `px-4 py-2 text-sm font-medium rounded-lg transition-colors ${tab === t ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">
            {step === 'review' ? 'Review Imported Recipe' : 'Import Recipe from Web'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <div className="p-6">
          {step === 'review' && importedData ? (
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
                    id: i, recipe_id: 0, name: ing.name,
                    amount: ing.amount || null, unit: ing.unit || null,
                  })),
                }}
                onSave={handleSave}
                onCancel={onClose}
              />
            </div>
          ) : (
            <div className="space-y-5">
              {/* Tabs */}
              <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
                <button className={tabCls('url')} onClick={() => setTab('url')}>Import from URL</button>
                <button className={tabCls('paste')} onClick={() => setTab('paste')}>Paste HTML</button>
              </div>

              {/* URL tab */}
              {tab === 'url' && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Paste a link from a recipe website. Works with most sites that include structured data.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="https://www.seriouseats.com/..."
                      value={url}
                      onChange={e => setUrl(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleUrlFetch()}
                    />
                    <button
                      onClick={handleUrlFetch}
                      disabled={urlLoading || !url.trim()}
                      className="bg-green-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors whitespace-nowrap"
                    >
                      {urlLoading ? 'Fetching…' : 'Import'}
                    </button>
                  </div>

                  {urlError && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
                      <p className="font-medium text-amber-800">{urlError}</p>
                      {urlProxyErrors.length > 0 && (
                        <details className="mt-2">
                          <summary className="text-amber-700 cursor-pointer text-xs">Show proxy errors</summary>
                          <ul className="mt-1 text-xs text-amber-700 space-y-0.5 font-mono">
                            {urlProxyErrors.map((e, i) => <li key={i}>{e}</li>)}
                          </ul>
                        </details>
                      )}
                      <p className="mt-2 text-amber-700">
                        Sites like AllRecipes and Food Network block CORS proxies.{' '}
                        <button className="underline font-medium" onClick={() => { setTab('paste'); setPasteUrl(url) }}>
                          Try pasting the HTML instead &rarr;
                        </button>
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Paste HTML tab */}
              {tab === 'paste' && (
                <div className="space-y-3">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800 space-y-1">
                    <p className="font-medium">How to get the page HTML:</p>
                    <ol className="list-decimal list-inside space-y-0.5 text-blue-700">
                      <li>Open the recipe page in a new tab</li>
                      <li>Press <kbd className="bg-blue-100 px-1 rounded">Ctrl+U</kbd> (or <kbd className="bg-blue-100 px-1 rounded">Cmd+U</kbd> on Mac) to view source</li>
                      <li>Press <kbd className="bg-blue-100 px-1 rounded">Ctrl+A</kbd> then <kbd className="bg-blue-100 px-1 rounded">Ctrl+C</kbd> to copy all</li>
                      <li>Paste below</li>
                    </ol>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Source URL (optional — for your records)</label>
                    <input
                      type="url"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="https://www.allrecipes.com/recipe/..."
                      value={pasteUrl}
                      onChange={e => setPasteUrl(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Paste page HTML here</label>
                    <textarea
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-500 h-36 resize-y"
                      placeholder="<!DOCTYPE html>..."
                      value={pastedHtml}
                      onChange={e => setPastedHtml(e.target.value)}
                    />
                  </div>

                  {pasteError && <p className="text-red-600 text-sm">{pasteError}</p>}

                  <button
                    onClick={handlePasteParse}
                    disabled={!pastedHtml.trim()}
                    className="w-full bg-green-600 text-white py-2.5 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    Parse Recipe
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
