import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { apiErrorMessage } from '../../api/client'
import {
  useDeleteRecipe,
  usePantryItems,
  useRecipe,
} from '../../api/hooks'

export function RecipeDetailPage() {
  const { id } = useParams()
  const recipeId = Number(id)
  const navigate = useNavigate()
  const recipeQuery = useRecipe(Number.isFinite(recipeId) ? recipeId : undefined)
  const pantryQuery = usePantryItems()
  const deleteMutation = useDeleteRecipe()
  const [previewServings, setPreviewServings] = useState<number | null>(null)

  const recipe = recipeQuery.data
  const baseServings = recipe?.servings ?? 1
  const servings = previewServings ?? baseServings
  const scale = servings / baseServings

  const stapleIds = useMemo(() => {
    const set = new Set<number>()
    for (const item of pantryQuery.data ?? []) {
      if (item.is_staple) set.add(item.ingredient_id)
    }
    return set
  }, [pantryQuery.data])

  if (recipeQuery.isLoading) return <p className="muted">Loading…</p>
  if (recipeQuery.isError || !recipe) {
    return <div className="error-banner">Recipe not found.</div>
  }

  async function onDelete() {
    if (!recipe) return
    if (!confirm(`Delete “${recipe.title}”?`)) return
    try {
      await deleteMutation.mutateAsync(recipe.id)
      navigate('/recipes')
    } catch (err) {
      alert(apiErrorMessage(err, 'Could not delete recipe'))
    }
  }

  return (
    <div className="detail">
      <div className="detail__nav">
        <Link to="/recipes" className="mono muted">
          ← Recipes
        </Link>
        <button type="button" className="btn btn--quiet" onClick={onDelete}>
          Delete
        </button>
      </div>

      <div className="detail__photo" aria-hidden>
        {recipe.image_url ? (
          <img src={recipe.image_url} alt="" />
        ) : (
          <span className="mono muted">no photo</span>
        )}
      </div>

      <h1>{recipe.title}</h1>

      <div className="chip-row" style={{ margin: '0.75rem 0' }}>
        {(recipe.tags ?? []).map((t) => (
          <span key={t} className="chip">
            {t}
          </span>
        ))}
      </div>

      <div className="stepper">
        <span className="mono muted">Servings</span>
        <div className="stepper__controls">
          <button
            type="button"
            className="btn btn--quiet"
            aria-label="Fewer servings"
            onClick={() => setPreviewServings(Math.max(1, servings - 1))}
          >
            −
          </button>
          <span className="mono">{servings}</span>
          <button
            type="button"
            className="btn btn--quiet"
            aria-label="More servings"
            onClick={() => setPreviewServings(servings + 1)}
          >
            +
          </button>
        </div>
        {previewServings != null && previewServings !== baseServings ? (
          <span className="mono muted" style={{ fontSize: '0.75rem' }}>
            Preview only — doesn&apos;t change the recipe
          </span>
        ) : null}
      </div>

      <h2 style={{ marginTop: '1.25rem', fontSize: '1.1rem' }}>Ingredients</h2>
      <ul className="ingredient-list">
        {(recipe.recipe_ingredients ?? []).map((ri) => {
          const qty = Number(ri.quantity) * scale
          const qtyLabel = Number.isFinite(qty)
            ? String(Number(qty.toFixed(2)))
            : ri.quantity
          return (
            <li key={ri.id} className="ingredient-list__row">
              <span className="mono">
                {qtyLabel} {ri.unit}
              </span>
              <span>
                {ri.ingredient?.name ?? `Ingredient #${ri.ingredient_id}`}
                {ri.notes ? (
                  <span className="muted"> — {ri.notes}</span>
                ) : null}
              </span>
              {stapleIds.has(ri.ingredient_id) ? (
                <span className="chip chip--ok">staple</span>
              ) : null}
            </li>
          )
        })}
      </ul>

      {recipe.instructions ? (
        <>
          <h2 style={{ marginTop: '1.25rem', fontSize: '1.1rem' }}>Steps</h2>
          <p style={{ whiteSpace: 'pre-wrap' }}>{recipe.instructions}</p>
        </>
      ) : null}

      <div className="detail__actions">
        <Link to={`/recipes/${recipe.id}/edit`} className="btn btn--ghost">
          Edit
        </Link>
        <Link
          to={`/plan?assign=${recipe.id}`}
          className="btn btn--primary"
        >
          Add to plan
        </Link>
      </div>
    </div>
  )
}
