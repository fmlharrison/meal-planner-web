import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  planCountsByRecipeId,
  useRecipes,
  useWeekPlan,
} from '../../api/hooks'
import type { Recipe } from '../../api/types'

export function RecipesPage() {
  const navigate = useNavigate()
  const recipesQuery = useRecipes()
  const weekQuery = useWeekPlan()
  const [search, setSearch] = useState('')
  const [tag, setTag] = useState<string | null>(null)

  const recipes = recipesQuery.data ?? []
  const planCounts = planCountsByRecipeId(weekQuery.data)

  const tagCounts = useMemo(() => {
    const map = new Map<string, number>()
    for (const recipe of recipes) {
      for (const t of recipe.tags ?? []) {
        map.set(t, (map.get(t) ?? 0) + 1)
      }
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1])
  }, [recipes])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return recipes.filter((recipe) => {
      if (tag && !recipe.tags?.includes(tag)) return false
      if (!q) return true
      const hay = [
        recipe.title,
        ...(recipe.tags ?? []),
        ...(recipe.recipe_ingredients ?? []).map((i) => i.ingredient?.name ?? ''),
      ]
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
  }, [recipes, search, tag])

  if (recipesQuery.isLoading) {
    return <p className="muted">Loading recipes…</p>
  }

  if (recipesQuery.isError) {
    return <div className="error-banner">Could not load recipes.</div>
  }

  if (recipes.length === 0) {
    return (
      <div>
        <div className="page-header">
          <h1>Recipes</h1>
        </div>
        <div className="empty-state">
          <div className="empty-state__icon" aria-hidden />
          <h2>Nothing to plan with yet</h2>
          <p className="muted">
            Add three or four meals you cook often. That&apos;s enough to build a
            first week.
          </p>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => navigate('/recipes/new')}
          >
            Add a recipe
          </button>
          <p className="mono muted" style={{ fontSize: '0.75rem' }}>
            Importing from a link comes later.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <h1>Recipes</h1>
        <span className="page-header__count">{recipes.length}</span>
      </div>

      <div className="search-row">
        <input
          type="search"
          placeholder="Search recipes or ingredients"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search recipes"
        />
        <button
          type="button"
          className="btn btn--icon"
          aria-label="Add recipe"
          onClick={() => navigate('/recipes/new')}
        >
          +
        </button>
      </div>

      <div className="chip-row" style={{ marginBottom: '0.75rem' }}>
        <button
          type="button"
          className={`chip ${tag === null ? 'chip--active' : ''}`}
          onClick={() => setTag(null)}
        >
          All {recipes.length}
        </button>
        {tagCounts.map(([t, count]) => (
          <button
            key={t}
            type="button"
            className={`chip ${tag === t ? 'chip--active' : ''}`}
            onClick={() => setTag(t)}
          >
            {t} {count}
          </button>
        ))}
      </div>

      <ul className="recipe-list">
        {filtered.map((recipe) => (
          <RecipeRow
            key={recipe.id}
            recipe={recipe}
            inPlan={planCounts.get(recipe.id) ?? 0}
          />
        ))}
      </ul>
    </div>
  )
}

function RecipeRow({ recipe, inPlan }: { recipe: Recipe; inPlan: number }) {
  const ingredientCount = recipe.recipe_ingredients?.length
  const meta = [
    `${recipe.servings} servings`,
    ingredientCount != null ? `${ingredientCount} ingredients` : null,
    (recipe.tags ?? []).join(', ') || null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <li>
      <Link to={`/recipes/${recipe.id}`} className="recipe-row">
        <div className="recipe-row__thumb" aria-hidden>
          {recipe.image_url ? (
            <img src={recipe.image_url} alt="" />
          ) : (
            <span className="mono">no img</span>
          )}
        </div>
        <div className="recipe-row__body">
          <strong>{recipe.title}</strong>
          <span className="muted" style={{ fontSize: '0.85rem' }}>
            {meta}
          </span>
        </div>
        {inPlan > 0 ? (
          <span className="recipe-row__plan mono">in plan ×{inPlan}</span>
        ) : null}
      </Link>
    </li>
  )
}
