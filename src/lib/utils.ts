export function getMondayOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export function formatDateKey(date: Date): string {
  return date.toISOString().split('T')[0]
}

export function formatTime(minutes: number | null | undefined): string {
  if (!minutes) return ''
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export function formatWeekRange(monday: Date): string {
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  return `${monday.toLocaleDateString('en-US', opts)} - ${sunday.toLocaleDateString('en-US', { ...opts, year: 'numeric' })}`
}

export function parseDuration(iso?: string): number | null {
  if (!iso) return null
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/)
  if (!match) return null
  return (parseInt(match[1] || '0') * 60) + parseInt(match[2] || '0')
}

const UNITS = new Set(['cup', 'cups', 'tablespoon', 'tablespoons', 'tbsp', 'teaspoon', 'teaspoons', 'tsp', 'pound', 'pounds', 'lb', 'lbs', 'ounce', 'ounces', 'oz', 'gram', 'grams', 'g', 'kilogram', 'kg', 'liter', 'liters', 'ml', 'milliliter', 'milliliters', 'can', 'cans', 'clove', 'cloves', 'piece', 'pieces', 'slice', 'slices', 'bunch', 'handfuls', 'handful', 'pinch', 'dash', 'inch', 'inches', 'package', 'packages', 'pkg'])

export function parseIngredient(text: string): { amount: string | null; unit: string | null; name: string } {
  const numRe = /^([\d¼-¾⅐-⅞]+(?:[\/\s][\d¼-¾⅐-⅞]+)?(?:\.\d+)?(?:\s*-\s*[\d.]+)?)\s*/
  const numMatch = text.match(numRe)

  if (!numMatch) {
    return { amount: null, unit: null, name: text.trim() }
  }

  const amount = numMatch[1].trim()
  const rest = text.slice(numMatch[0].length).trim()

  const wordMatch = rest.match(/^([a-zA-Z]+)\s*(.+)?$/)
  if (wordMatch && UNITS.has(wordMatch[1].toLowerCase())) {
    return { amount, unit: wordMatch[1].toLowerCase(), name: (wordMatch[2] || '').trim() || rest }
  }

  return { amount, unit: null, name: rest.trim() || text.trim() }
}
