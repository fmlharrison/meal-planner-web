import type { z } from 'zod'
import { schemas } from '../types/api.zod'

export type Recipe = z.infer<typeof schemas.Recipe>
export type RecipeIngredient = z.infer<typeof schemas.RecipeIngredient>
export type MealPlan = z.infer<typeof schemas.MealPlan>
export type MealPlanEntry = z.infer<typeof schemas.MealPlanEntry>
export type PantryItem = z.infer<typeof schemas.PantryItem>
export type ShoppingList = z.infer<typeof schemas.ShoppingList>
export type ShoppingListItem = z.infer<typeof schemas.ShoppingListItem>
