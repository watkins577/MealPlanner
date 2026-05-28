'use client'
import type { Recipe, Ingredient, MealPlanEntry, MealType, ShoppingItem } from './types'

const RECIPES_KEY = 'mp_recipes'
const MEAL_PLANS_KEY = 'mp_meal_plans'

function nextId(): number {
  return Date.now() + Math.floor(Math.random() * 9999)
}

// ── Recipes ────────────────────────────────────────────────────────────────

export function getRecipes(): Recipe[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(RECIPES_KEY) || '[]') as Recipe[] }
  catch { return [] }
}

function setRecipes(recipes: Recipe[]) {
  localStorage.setItem(RECIPES_KEY, JSON.stringify(recipes))
}

export function getRecipeById(id: number): Recipe | null {
  return getRecipes().find(r => r.id === id) ?? null
}

export interface RecipeInput {
  name: string
  description: string
  servings: number
  prep_time: number | null
  cook_time: number | null
  instructions: string
  source_url: string
  image_url: string
  ingredients: { name: string; amount: string | null; unit: string | null }[]
}

export function createRecipe(input: RecipeInput): Recipe {
  const id = nextId()
  const ingredients: Ingredient[] = input.ingredients
    .filter(i => i.name.trim())
    .map((i, idx) => ({ id: id + idx + 1, recipe_id: id, ...i }))
  const recipe: Recipe = {
    id,
    name: input.name,
    description: input.description || null,
    servings: input.servings,
    prep_time: input.prep_time,
    cook_time: input.cook_time,
    instructions: input.instructions || null,
    source_url: input.source_url || null,
    image_url: input.image_url || null,
    ingredients,
    created_at: new Date().toISOString(),
  }
  const recipes = getRecipes()
  recipes.unshift(recipe)
  setRecipes(recipes)
  return recipe
}

export function updateRecipe(id: number, input: RecipeInput): Recipe {
  const recipes = getRecipes()
  const ingredients: Ingredient[] = input.ingredients
    .filter(i => i.name.trim())
    .map((i, idx) => ({ id: id + idx + 1, recipe_id: id, ...i }))
  const existing = recipes.find(r => r.id === id)
  const updated: Recipe = {
    id,
    name: input.name,
    description: input.description || null,
    servings: input.servings,
    prep_time: input.prep_time,
    cook_time: input.cook_time,
    instructions: input.instructions || null,
    source_url: input.source_url || null,
    image_url: input.image_url || null,
    ingredients,
    created_at: existing?.created_at ?? new Date().toISOString(),
  }
  setRecipes(recipes.map(r => r.id === id ? updated : r))
  return updated
}

export function deleteRecipe(id: number): void {
  setRecipes(getRecipes().filter(r => r.id !== id))
  setMealPlansRaw(getMealPlansRaw().filter(p => p.recipe_id !== id))
}

// ── Meal Plans ─────────────────────────────────────────────────────────────

function getMealPlansRaw(): MealPlanEntry[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(MEAL_PLANS_KEY) || '[]') as MealPlanEntry[] }
  catch { return [] }
}

function setMealPlansRaw(plans: MealPlanEntry[]) {
  localStorage.setItem(MEAL_PLANS_KEY, JSON.stringify(plans))
}

export function getMealPlanForWeek(weekStart: string): MealPlanEntry[] {
  const recipes = getRecipes()
  return getMealPlansRaw()
    .filter(p => p.week_start === weekStart)
    .map(p => {
      const r = recipes.find(r => r.id === p.recipe_id)
      return { ...p, recipe_name: r?.name, recipe_image: r?.image_url ?? null, prep_time: r?.prep_time, cook_time: r?.cook_time }
    })
}

export function setMealPlanEntry(weekStart: string, dayOfWeek: number, mealType: MealType, recipeId: number): MealPlanEntry {
  const plans = getMealPlansRaw()
  const existing = plans.find(p => p.week_start === weekStart && p.day_of_week === dayOfWeek && p.meal_type === mealType)
  const id = existing?.id ?? nextId()
  const entry: MealPlanEntry = { id, week_start: weekStart, day_of_week: dayOfWeek, meal_type: mealType, recipe_id: recipeId }
  if (existing) setMealPlansRaw(plans.map(p => p.id === id ? entry : p))
  else setMealPlansRaw([...plans, entry])
  const r = getRecipes().find(r => r.id === recipeId)
  return { ...entry, recipe_name: r?.name, recipe_image: r?.image_url ?? null }
}

export function deleteMealPlanEntry(id: number): void {
  setMealPlansRaw(getMealPlansRaw().filter(p => p.id !== id))
}

// ── Shopping List ──────────────────────────────────────────────────────────

export function getShoppingList(weekStart: string): ShoppingItem[] {
  const plans = getMealPlansRaw().filter(p => p.week_start === weekStart)
  const recipes = getRecipes()
  const map = new Map<string, { displayName: string; amounts: string[]; recipes: Set<string> }>()

  for (const plan of plans) {
    const recipe = recipes.find(r => r.id === plan.recipe_id)
    if (!recipe?.ingredients?.length) continue
    for (const ing of recipe.ingredients) {
      const key = ing.name.toLowerCase().trim()
      if (!map.has(key)) map.set(key, { displayName: ing.name, amounts: [], recipes: new Set() })
      const entry = map.get(key)!
      const parts = [ing.amount, ing.unit].filter(Boolean)
      if (parts.length) entry.amounts.push(parts.join(' '))
      entry.recipes.add(recipe.name)
    }
  }

  return Array.from(map.values())
    .map(({ displayName, amounts, recipes }) => ({ name: displayName, amounts, recipes: Array.from(recipes) }))
    .sort((a, b) => a.name.localeCompare(b.name))
}
