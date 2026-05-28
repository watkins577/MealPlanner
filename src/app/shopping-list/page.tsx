'use client'
import { useEffect, useState, useCallback } from 'react'
import { ShoppingItem } from '@/lib/types'
import { getMondayOfWeek, formatDateKey, formatWeekRange } from '@/lib/utils'
import { getShoppingList } from '@/lib/storage'

export default function ShoppingListPage() {
  const [weekOffset, setWeekOffset] = useState(0)
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [checked, setChecked] = useState<Set<string>>(new Set())

  const monday = getMondayOfWeek(new Date())
  monday.setDate(monday.getDate() + weekOffset * 7)
  const weekStart = formatDateKey(monday)

  const loadList = useCallback((week: string) => {
    setChecked(new Set())
    setItems(getShoppingList(week))
  }, [])

  useEffect(() => { loadList(weekStart) }, [weekStart, loadList])

  const toggleChecked = (name: string) =>
    setChecked(prev => { const n = new Set(prev); n.has(name) ? n.delete(name) : n.add(name); return n })

  const copyToClipboard = () => {
    const text = items.map(i => `${checked.has(i.name) ? '[x]' : '[ ]'} ${i.amounts.length ? `(${i.amounts.join(', ')}) ` : ''}${i.name}`).join('\n')
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
          {weekOffset !== 0 && <button onClick={() => setWeekOffset(0)} className="px-3 py-2 text-sm text-green-600 hover:text-green-700 font-medium">Today</button>}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20 text-gray-400 bg-white rounded-xl border border-gray-200">
          <p className="text-lg">No meals planned for this week</p>
          <p className="text-sm mt-2">Add meals to your plan to generate a shopping list.</p>
          <a href="/meal-plan" className="text-green-600 hover:underline text-sm mt-2 inline-block">Go to Meal Plan &rarr;</a>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="text-sm text-gray-600">{uncheckedItems.length} of {items.length} items remaining</div>
            <div className="flex gap-2">
              <button onClick={() => setChecked(new Set())} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Uncheck All</button>
              <button onClick={() => setChecked(new Set(items.map(i => i.name)))} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Check All</button>
              <button onClick={copyToClipboard} className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">Copy List</button>
            </div>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${(checkedItems.length / items.length) * 100}%` }} />
          </div>

          {uncheckedItems.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {uncheckedItems.map((item, i) => (
                <ItemRow key={item.name} item={item} checked={false} onToggle={() => toggleChecked(item.name)} last={i === uncheckedItems.length - 1} />
              ))}
            </div>
          )}

          {checkedItems.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-2">Checked off ({checkedItems.length})</h3>
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden opacity-60">
                {checkedItems.map((item, i) => (
                  <ItemRow key={item.name} item={item} checked={true} onToggle={() => toggleChecked(item.name)} last={i === checkedItems.length - 1} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ItemRow({ item, checked, onToggle, last }: { item: ShoppingItem; checked: boolean; onToggle: () => void; last: boolean }) {
  return (
    <div className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${last ? '' : 'border-b border-gray-100'}`} onClick={onToggle}>
      <div className={`w-5 h-5 rounded flex-shrink-0 mt-0.5 border-2 flex items-center justify-center transition-colors ${checked ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
        {checked && <span className="text-white text-xs font-bold">&#10003;</span>}
      </div>
      <div className="flex-1 min-w-0">
        <span className={`text-sm font-medium ${checked ? 'line-through text-gray-400' : 'text-gray-800'}`}>
          {item.name}
          {item.amounts.length > 0 && <span className="font-normal text-gray-500 ml-1.5">({item.amounts.join(', ')})</span>}
        </span>
        {item.recipes.length > 0 && <div className="text-xs text-gray-400 mt-0.5">{item.recipes.join(', ')}</div>}
      </div>
    </div>
  )
}
