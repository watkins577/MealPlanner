'use client'
import { useEffect, useState, useCallback } from 'react'
import { ShoppingItem } from '@/lib/types'
import { getMondayOfWeek, formatDateKey, formatWeekRange } from '@/lib/utils'

export default function ShoppingListPage() {
  const [weekOffset, setWeekOffset] = useState(0)
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [generated, setGenerated] = useState(false)

  const monday = getMondayOfWeek(new Date())
  monday.setDate(monday.getDate() + weekOffset * 7)
  const weekStart = formatDateKey(monday)

  const generateList = useCallback(async (week: string) => {
    setLoading(true)
    setGenerated(false)
    setChecked(new Set())
    const res = await fetch(`/api/shopping-list?week=${week}`)
    const data = await res.json()
    setItems(data)
    setGenerated(true)
    setLoading(false)
  }, [])

  useEffect(() => {
    generateList(weekStart)
  }, [weekStart, generateList])

  const toggleChecked = (name: string) => {
    setChecked(prev => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  const uncheckAll = () => setChecked(new Set())
  const checkAll = () => setChecked(new Set(items.map(i => i.name)))

  const copyToClipboard = () => {
    const text = items
      .map(i => {
        const qty = i.amounts.length > 0 ? `(${i.amounts.join(', ')}) ` : ''
        return `${checked.has(i.name) ? '[x]' : '[ ]'} ${qty}${i.name}`
      })
      .join('\n')
    navigator.clipboard.writeText(text)
  }

  const weekLabel = weekOffset === 0 ? 'This Week' : weekOffset === 1 ? 'Next Week' : weekOffset === -1 ? 'Last Week' : `${weekOffset > 0 ? '+' : ''}${weekOffset} weeks`

  const uncheckedItems = items.filter(i => !checked.has(i.name))
  const checkedItems = items.filter(i => checked.has(i.name))

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Shopping List</h1>
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

      {loading && (
        <div className="space-y-2 animate-pulse">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded-lg" />
          ))}
        </div>
      )}

      {!loading && generated && items.length === 0 && (
        <div className="text-center py-20 text-gray-400 bg-white rounded-xl border border-gray-200">
          <p className="text-lg">No meals planned for this week</p>
          <p className="text-sm mt-2">Add meals to your meal plan to generate a shopping list.</p>
          <a href="/meal-plan" className="text-green-600 hover:underline text-sm mt-2 inline-block">Go to Meal Plan &rarr;</a>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="text-sm text-gray-600">
              {uncheckedItems.length} of {items.length} items remaining
            </div>
            <div className="flex gap-2">
              <button onClick={uncheckAll} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Uncheck All</button>
              <button onClick={checkAll} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Check All</button>
              <button onClick={copyToClipboard} className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">Copy List</button>
            </div>
          </div>

          {/* Progress bar */}
          {items.length > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${(checkedItems.length / items.length) * 100}%` }}
              />
            </div>
          )}

          {/* Unchecked items */}
          {uncheckedItems.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {uncheckedItems.map((item, i) => (
                <ItemRow
                  key={item.name}
                  item={item}
                  checked={false}
                  onToggle={() => toggleChecked(item.name)}
                  last={i === uncheckedItems.length - 1}
                />
              ))}
            </div>
          )}

          {/* Checked items */}
          {checkedItems.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-2">Checked off ({checkedItems.length})</h3>
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden opacity-60">
                {checkedItems.map((item, i) => (
                  <ItemRow
                    key={item.name}
                    item={item}
                    checked={true}
                    onToggle={() => toggleChecked(item.name)}
                    last={i === checkedItems.length - 1}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ItemRow({ item, checked, onToggle, last }: {
  item: ShoppingItem
  checked: boolean
  onToggle: () => void
  last: boolean
}) {
  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${last ? '' : 'border-b border-gray-100'}`}
      onClick={onToggle}
    >
      <div className={`w-5 h-5 rounded flex-shrink-0 mt-0.5 border-2 flex items-center justify-center transition-colors ${checked ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
        {checked && <span className="text-white text-xs font-bold">&#10003;</span>}
      </div>
      <div className="flex-1 min-w-0">
        <span className={`text-sm font-medium ${checked ? 'line-through text-gray-400' : 'text-gray-800'}`}>
          {item.name}
          {item.amounts.length > 0 && (
            <span className="font-normal text-gray-500 ml-1.5">({item.amounts.join(', ')})</span>
          )}
        </span>
        {item.recipes.length > 0 && (
          <div className="text-xs text-gray-400 mt-0.5">{item.recipes.join(', ')}</div>
        )}
      </div>
    </div>
  )
}
