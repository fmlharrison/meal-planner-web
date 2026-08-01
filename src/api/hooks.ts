import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './client'
import { mondayOf } from '../lib/dates'
import type { MealPlan, Recipe } from './types'

export const queryKeys = {
  recipes: ['recipes'] as const,
  recipe: (id: number) => ['recipes', id] as const,
  mealPlans: ['mealPlans'] as const,
  mealPlan: (id: number) => ['mealPlans', id] as const,
  pantry: ['pantry'] as const,
  shoppingList: (mealPlanId: number) => ['shoppingList', mealPlanId] as const,
}

export function useRecipes() {
  return useQuery({
    queryKey: queryKeys.recipes,
    queryFn: () => api.getRecipes(),
  })
}

export function useRecipe(id: number | undefined) {
  return useQuery({
    queryKey: queryKeys.recipe(id ?? 0),
    queryFn: () => api.getRecipesId({ params: { id: id! } }),
    enabled: Boolean(id),
  })
}

export function useMealPlans() {
  return useQuery({
    queryKey: queryKeys.mealPlans,
    queryFn: () => api.getMeal_plans(),
  })
}

/** Ensure a meal plan exists for the given Monday week_start, return full plan with entries. */
export function useWeekPlan(weekStart = mondayOf()) {
  const queryClient = useQueryClient()
  const plansQuery = useMealPlans()

  return useQuery({
    queryKey: ['weekPlan', weekStart],
    enabled: plansQuery.isSuccess,
    queryFn: async (): Promise<MealPlan> => {
      const plans = plansQuery.data ?? []
      const existing = plans.find((p) => p.week_start_date === weekStart)
      if (existing) {
        return api.getMeal_plansId({ params: { id: existing.id } })
      }
      const created = await api.postMeal_plans({
        meal_plan: { week_start_date: weekStart, status: 'active' },
      })
      await queryClient.invalidateQueries({ queryKey: queryKeys.mealPlans })
      return created
    },
  })
}

export function usePantryItems() {
  return useQuery({
    queryKey: queryKeys.pantry,
    queryFn: () => api.getPantry_items(),
  })
}

export function useCreateRecipe() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Parameters<typeof api.postRecipes>[0]) =>
      api.postRecipes(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.recipes }),
  })
}

export function useUpdateRecipe(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Parameters<typeof api.patchRecipesId>[0]) =>
      api.patchRecipesId(body, { params: { id } }),
    onSuccess: (recipe: Recipe) => {
      qc.invalidateQueries({ queryKey: queryKeys.recipes })
      qc.setQueryData(queryKeys.recipe(id), recipe)
    },
  })
}

export function useDeleteRecipe() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.deleteRecipesId(undefined, { params: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.recipes }),
  })
}

export function planCountsByRecipeId(plan: MealPlan | undefined): Map<number, number> {
  const map = new Map<number, number>()
  for (const entry of plan?.meal_plan_entries ?? []) {
    map.set(entry.recipe_id, (map.get(entry.recipe_id) ?? 0) + 1)
  }
  return map
}
