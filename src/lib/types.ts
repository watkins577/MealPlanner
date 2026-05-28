export interface Ingredient {
  id: number
  recipe_id: number
  name: string
  amount: string | null
  unit: string | null
}

export interface Recipe {
  id: number
  name: string
  description: string | null
  servings: number
  prep_time: number | null
  cook_time: number | null
  instructions: string | null
  source_url: string | null
  image_url: string | null
  created_at: string
  ingredients?: Ingredient[]
}

export interface MealPlanEntry {
  id: number
  week_start: string
  day_of_week: number
  meal_type: MealType
  recipe_id: number
  recipe_name?: string
  recipe_image?: string | null
  prep_time?: number | null
  cook_time?: number | null
}

export interface ShoppingItem {
  name: string
  amounts: string[]
  recipes: string[]
}

export type MealType = 'breakfast' | 'lunch' | 'dinner'
export const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner']
export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
