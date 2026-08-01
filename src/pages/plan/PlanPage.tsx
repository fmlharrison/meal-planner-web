import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api, apiErrorMessage } from '../../api/client'
import {
  planCountsByRecipeId,
  queryKeys,
  useRecipes,
  useWeekPlan,
} from '../../api/hooks'
import type { MealPlanEntry, Recipe } from '../../api/types'
import { BottomSheet } from '../../components/BottomSheet'
import {
  addDays,
  DAY_LABELS,
  formatWeekRange,
  MEAL_TYPES,
  mondayOf,
  type MealType,
} from '../../lib/dates'

type SlotKey = `${number}-${MealType}`

function slotKey(day: number, meal: MealType): SlotKey {
  return `${day}-${meal}`
}

export function PlanPage() {
  const [params, setParams] = useSearchParams()
  const weekStart = params.get('week') && isMonday(params.get('week')!)
    ? params.get('week')!
    : mondayOf()
  const assignRecipeId = params.get('assign')
    ? Number(params.get('assign'))
    : null

  const navigate = useNavigate()
  const qc = useQueryClient()
  const planQuery = useWeekPlan(weekStart)
  const recipesQuery = useRecipes()
  const [activeSlot, setActiveSlot] = useState<{
    day: number
    meal: MealType
  } | null>(null)
  const [filter, setFilter] = useState<'suggested' | 'all'>('suggested')
  const [search, setSearch] = useState('')
  const [servings, setServings] = useState(2)
  const [error, setError] = useState<string | null>(null)

  const plan = planQuery.data
  const entriesBySlot = useMemo(() => {
    const map = new Map<SlotKey, MealPlanEntry>()
    for (const entry of plan?.meal_plan_entries ?? []) {
      map.set(
        slotKey(entry.day_of_week, entry.meal_type as MealType),
        entry,
      )
    }
    return map
  }, [plan])

  const filled = entriesBySlot.size
  const planCounts = planCountsByRecipeId(plan)

  const assignMutation = useMutation({
    mutationFn: async (input: {
      recipeId: number
      day: number
      meal: MealType
      servings: number
      recipeServings: number
      existingId?: number
    }) => {
      if (!plan) throw new Error('No plan')
      if (input.existingId) {
        await api.deleteMeal_plan_entriesId(undefined, {
          params: { id: input.existingId },
        })
      }
      const base = Math.max(1, input.recipeServings)
      const multiplier = input.servings / base
      return api.postMeal_plansMeal_plan_idmeal_plan_entries(
        {
          meal_plan_entry: {
            recipe_id: input.recipeId,
            day_of_week: input.day,
            meal_type: input.meal,
            servings_multiplier: multiplier,
          },
        },
        { params: { meal_plan_id: plan.id } },
      )
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['weekPlan', weekStart] })
      await qc.invalidateQueries({ queryKey: queryKeys.mealPlans })
      setActiveSlot(null)
      setError(null)
      if (assignRecipeId) {
        const next = new URLSearchParams(params)
        next.delete('assign')
        setParams(next, { replace: true })
      }
    },
  })

  const clearMutation = useMutation({
    mutationFn: (entryId: number) =>
      api.deleteMeal_plan_entriesId(undefined, { params: { id: entryId } }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['weekPlan', weekStart] })
      setActiveSlot(null)
    },
  })

  const buildListMutation = useMutation({
    mutationFn: () => {
      if (!plan) throw new Error('No plan')
      return api.postMeal_plansMeal_plan_idshopping_list(undefined, {
        params: { meal_plan_id: plan.id },
      })
    },
    onSuccess: () => {
      navigate(`/shop?week=${weekStart}`)
    },
  })

  const recipes = recipesQuery.data ?? []
  const sheetRecipes = useMemo(() => {
    if (!activeSlot) return []
    const q = search.trim().toLowerCase()
    return recipes.filter((recipe) => {
      if (filter === 'suggested') {
        const suggested =
          (planCounts.get(recipe.id) ?? 0) > 0 ||
          (recipe.tags ?? []).includes(activeSlot.meal)
        if (!suggested) return false
      }
      if (!q) return true
      return recipe.title.toLowerCase().includes(q)
    })
  }, [activeSlot, recipes, filter, search, planCounts])

  function openSlot(day: number, meal: MealType) {
    const existing = entriesBySlot.get(slotKey(day, meal))
    const preselect =
      assignRecipeId && Number.isFinite(assignRecipeId)
        ? recipes.find((r) => r.id === assignRecipeId)
        : null
    const existingRecipe = existing
      ? recipes.find((r) => r.id === existing.recipe_id)
      : null
    if (preselect) {
      setServings(preselect.servings)
    } else if (existing && existingRecipe) {
      setServings(
        Math.max(
          1,
          Math.round(
            Number(existing.servings_multiplier) * existingRecipe.servings,
          ),
        ),
      )
    } else {
      setServings(2)
    }
    setFilter('suggested')
    setSearch('')
    setActiveSlot({ day, meal })
  }

  function setWeek(next: string) {
    const p = new URLSearchParams(params)
    p.set('week', next)
    setParams(p)
  }

  if (planQuery.isLoading || recipesQuery.isLoading) {
    return <p className="muted">Loading plan…</p>
  }

  if (planQuery.isError || !plan) {
    return <div className="error-banner">Could not load this week&apos;s plan.</div>
  }

  const ingredientEstimate = filled * 6

  return (
    <div className="plan-page">
      <div className="plan-week-nav">
        <button
          type="button"
          className="btn btn--quiet"
          aria-label="Previous week"
          onClick={() => setWeek(addDays(weekStart, -7))}
        >
          ←
        </button>
        <div className="plan-week-nav__label">
          <strong>{formatWeekRange(weekStart)}</strong>
          <span className="mono muted">
            {filled}/21 slots
          </span>
        </div>
        <button
          type="button"
          className="btn btn--quiet"
          aria-label="Next week"
          onClick={() => setWeek(addDays(weekStart, 7))}
        >
          →
        </button>
      </div>

      {assignRecipeId ? (
        <p className="mono muted" style={{ marginBottom: '0.75rem', fontSize: '0.8rem' }}>
          Tap a slot to add the selected recipe
        </p>
      ) : null}

      {error ? <div className="error-banner">{error}</div> : null}

      <div className="plan-grid" role="grid" aria-label="Weekly meal plan">
        <div className="plan-grid__corner" />
        {MEAL_TYPES.map((meal) => (
          <div key={meal} className="plan-grid__head mono">
            {meal.slice(0, 7)}
          </div>
        ))}
        {DAY_LABELS.map((label, day) => (
          <DayRow
            key={label}
            label={label}
            day={day}
            entriesBySlot={entriesBySlot}
            recipes={recipes}
            onOpen={openSlot}
          />
        ))}
      </div>

      <footer className="plan-footer">
        <div>
          <strong>
            {filled} meal{filled === 1 ? '' : 's'}
          </strong>
          <span className="mono muted">
            {' '}
            · ~{ingredientEstimate} ingredient lines
          </span>
        </div>
        <button
          type="button"
          className="btn btn--primary"
          disabled={filled === 0 || buildListMutation.isPending}
          onClick={() =>
            buildListMutation.mutate(undefined, {
              onError: (err) => setError(apiErrorMessage(err)),
            })
          }
        >
          {buildListMutation.isPending ? 'Building…' : 'Build list'}
        </button>
      </footer>

      {activeSlot ? (
        <AssignSheet
          title={`${DAY_LABELS[activeSlot.day]} · ${capitalize(activeSlot.meal)}`}
          filter={filter}
          onFilter={setFilter}
          search={search}
          onSearch={setSearch}
          recipes={sheetRecipes}
          servings={servings}
          onServings={setServings}
          existing={entriesBySlot.get(
            slotKey(activeSlot.day, activeSlot.meal),
          )}
          highlightId={assignRecipeId}
          pending={assignMutation.isPending || clearMutation.isPending}
          onClose={() => setActiveSlot(null)}
          onClear={(entryId) =>
            clearMutation.mutate(entryId, {
              onError: (err) => setError(apiErrorMessage(err)),
            })
          }
          onAdd={(recipe) =>
            assignMutation.mutate(
              {
                recipeId: recipe.id,
                day: activeSlot.day,
                meal: activeSlot.meal,
                servings,
                recipeServings: recipe.servings,
                existingId: entriesBySlot.get(
                  slotKey(activeSlot.day, activeSlot.meal),
                )?.id,
              },
              {
                onError: (err) => setError(apiErrorMessage(err)),
              },
            )
          }
        />
      ) : null}
    </div>
  )
}

function DayRow({
  label,
  day,
  entriesBySlot,
  recipes,
  onOpen,
}: {
  label: string
  day: number
  entriesBySlot: Map<SlotKey, MealPlanEntry>
  recipes: Recipe[]
  onOpen: (day: number, meal: MealType) => void
}) {
  return (
    <>
      <div className="plan-grid__day mono">{label}</div>
      {MEAL_TYPES.map((meal) => {
        const entry = entriesBySlot.get(slotKey(day, meal))
        const recipe = entry
          ? recipes.find((r) => r.id === entry.recipe_id)
          : undefined
        const slotServings = entry
          ? Math.max(
              1,
              Math.round(
                Number(entry.servings_multiplier) * (recipe?.servings ?? 1),
              ),
            )
          : 0
        return (
          <button
            key={meal}
            type="button"
            className={`plan-slot ${entry ? 'plan-slot--filled' : 'plan-slot--empty'}`}
            onClick={() => onOpen(day, meal)}
          >
            {entry ? (
              <>
                <span className="plan-slot__title">
                  {entry.recipe?.title ?? `Recipe #${entry.recipe_id}`}
                </span>
                <span className="plan-slot__meta mono">×{slotServings}</span>
              </>
            ) : (
              <span className="plan-slot__plus">+</span>
            )}
          </button>
        )
      })}
    </>
  )
}

function AssignSheet({
  title,
  filter,
  onFilter,
  search,
  onSearch,
  recipes,
  servings,
  onServings,
  existing,
  highlightId,
  pending,
  onClose,
  onClear,
  onAdd,
}: {
  title: string
  filter: 'suggested' | 'all'
  onFilter: (f: 'suggested' | 'all') => void
  search: string
  onSearch: (s: string) => void
  recipes: Recipe[]
  servings: number
  onServings: (n: number) => void
  existing?: MealPlanEntry
  highlightId: number | null
  pending: boolean
  onClose: () => void
  onClear: (id: number) => void
  onAdd: (recipe: Recipe) => void
}) {
  return (
    <BottomSheet title={title} onClose={onClose}>
      <div className="search-row">
        <input
          type="search"
          placeholder="Search recipes"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>
      <div className="chip-row" style={{ marginBottom: '0.75rem' }}>
        <button
          type="button"
          className={`chip ${filter === 'suggested' ? 'chip--active' : ''}`}
          onClick={() => onFilter('suggested')}
        >
          suggested
        </button>
        <button
          type="button"
          className={`chip ${filter === 'all' ? 'chip--active' : ''}`}
          onClick={() => onFilter('all')}
        >
          all
        </button>
      </div>

      <div className="stepper" style={{ marginBottom: '0.75rem' }}>
        <span className="mono muted">Servings for this slot</span>
        <div className="stepper__controls">
          <button
            type="button"
            className="btn btn--quiet"
            onClick={() => onServings(Math.max(1, servings - 1))}
          >
            −
          </button>
          <span className="mono">{servings}</span>
          <button
            type="button"
            className="btn btn--quiet"
            onClick={() => onServings(servings + 1)}
          >
            +
          </button>
        </div>
      </div>

      {existing ? (
        <button
          type="button"
          className="btn btn--quiet"
          style={{ width: '100%', marginBottom: '0.75rem' }}
          disabled={pending}
          onClick={() => onClear(existing.id)}
        >
          Clear slot
        </button>
      ) : null}

      <ul className="assign-list">
        {recipes.length === 0 ? (
          <li className="muted">No recipes match.</li>
        ) : (
          recipes.map((recipe) => (
            <li
              key={recipe.id}
              className={`assign-list__row ${highlightId === recipe.id ? 'assign-list__row--hi' : ''}`}
            >
              <div>
                <strong>{recipe.title}</strong>
                <div className="mono muted" style={{ fontSize: '0.75rem' }}>
                  {recipe.servings} servings default
                </div>
              </div>
              <button
                type="button"
                className="btn btn--primary"
                disabled={pending}
                onClick={() => onAdd(recipe)}
              >
                Add
              </button>
            </li>
          ))
        )}
      </ul>
    </BottomSheet>
  )
}

function isMonday(iso: string) {
  const d = new Date(`${iso}T12:00:00`)
  return !Number.isNaN(d.getTime()) && d.getDay() === 1
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
