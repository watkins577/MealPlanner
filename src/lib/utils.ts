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

// Common cooking fractions, ordered by denominator
const COOKING_FRACTIONS: [number, string][] = [
  [1 / 8,  '1/8'],
  [1 / 6,  '1/6'],
  [1 / 4,  '1/4'],
  [1 / 3,  '1/3'],
  [3 / 8,  '3/8'],
  [1 / 2,  '1/2'],
  [5 / 8,  '5/8'],
  [2 / 3,  '2/3'],
  [3 / 4,  '3/4'],
  [5 / 6,  '5/6'],
  [7 / 8,  '7/8'],
]

/**
 * Converts a decimal amount string to a human-readable fraction string.
 * e.g. "2.3333332538605" → "2 1/3", "0.5" → "1/2", "1.75" → "1 3/4"
 * Non-decimal strings (already fractions, empty, etc.) are returned as-is.
 */
export function formatAmount(raw: string): string {
  if (!raw || !/^\d+\.?\d*$/.test(raw)) return raw  // already a fraction / text / empty
  const n = parseFloat(raw)
  if (isNaN(n)) return raw
  const whole = Math.floor(n)
  const frac = n - whole
  if (frac < 0.01) return whole > 0 ? String(whole) : raw  // essentially a whole number
  const TOLERANCE = 0.05
  const match = COOKING_FRACTIONS.find(([f]) => Math.abs(frac - f) <= TOLERANCE)
  if (!match) return raw  // can't snap to a common fraction — leave it alone
  return whole > 0 ? `${whole} ${match[1]}` : match[1]
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
