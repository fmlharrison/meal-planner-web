import { useEffect } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { apiErrorMessage } from '../../api/client'
import {
  useCreateRecipe,
  useRecipe,
  useUpdateRecipe,
} from '../../api/hooks'

type IngredientRow = {
  id?: number
  name: string
  quantity: string
  unit: string
  notes: string
  _destroy?: boolean
}

type FormValues = {
  title: string
  servings: number
  tags: string
  instructions: string
  image_url: string
  ingredients: IngredientRow[]
}

const emptyRow = (): IngredientRow => ({
  name: '',
  quantity: '',
  unit: '',
  notes: '',
})

export function RecipeFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const recipeId = Number(id)
  const navigate = useNavigate()
  const existing = useRecipe(isEdit && Number.isFinite(recipeId) ? recipeId : undefined)
  const createMutation = useCreateRecipe()
  const updateMutation = useUpdateRecipe(recipeId)

  const form = useForm<FormValues>({
    defaultValues: {
      title: '',
      servings: 2,
      tags: '',
      instructions: '',
      image_url: '',
      ingredients: [emptyRow()],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'ingredients',
  })

  useEffect(() => {
    if (!existing.data) return
    const r = existing.data
    form.reset({
      title: r.title,
      servings: r.servings,
      tags: (r.tags ?? []).join(', '),
      instructions: r.instructions ?? '',
      image_url: r.image_url ?? '',
      ingredients:
        (r.recipe_ingredients ?? []).map((ri) => ({
          id: ri.id,
          name: ri.ingredient?.name ?? '',
          quantity: String(ri.quantity),
          unit: ri.unit,
          notes: ri.notes ?? '',
        })) || [emptyRow()],
    })
  }, [existing.data, form])

  async function onSubmit(values: FormValues) {
    const active = values.ingredients.filter((row) => !row._destroy)
    for (const row of active) {
      if (!row.name.trim()) {
        form.setError('ingredients', { message: 'Each row needs a name' })
        return
      }
      if (!row.unit.trim()) {
        form.setError('ingredients', {
          message: 'Each ingredient needs a unit (required for shopping aggregation)',
        })
        return
      }
      if (!row.quantity.trim() || Number.isNaN(Number(row.quantity))) {
        form.setError('ingredients', { message: 'Each ingredient needs a quantity' })
        return
      }
    }

    const tags = values.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    try {
      if (isEdit) {
        const keepIds = new Set(
          active.filter((r) => r.id != null).map((r) => r.id!),
        )
        const removed = (existing.data?.recipe_ingredients ?? [])
          .filter((ri) => !keepIds.has(ri.id))
          .map((ri) => ({ id: ri.id, _destroy: true as const }))

        await updateMutation.mutateAsync({
          recipe: {
            title: values.title.trim(),
            servings: values.servings,
            instructions: values.instructions.trim() || null,
            tags,
            recipe_ingredients_attributes: [
              ...active.map((row) => ({
                id: row.id,
                name: row.name.trim(),
                quantity: Number(row.quantity),
                unit: row.unit.trim(),
                notes: row.notes.trim() || null,
              })),
              ...removed,
            ],
          },
        })
        navigate(`/recipes/${recipeId}`)
      } else {
        const created = await createMutation.mutateAsync({
          recipe: {
            title: values.title.trim(),
            source_type: 'manual',
            servings: values.servings,
            instructions: values.instructions.trim() || null,
            image_url: values.image_url.trim() || null,
            tags,
            recipe_ingredients_attributes: active.map((row) => ({
              name: row.name.trim(),
              quantity: Number(row.quantity),
              unit: row.unit.trim(),
              notes: row.notes.trim() || null,
            })),
          },
        })
        navigate(`/recipes/${created.id}`)
      }
    } catch (err) {
      form.setError('root', { message: apiErrorMessage(err) })
    }
  }

  if (isEdit && existing.isLoading) return <p className="muted">Loading…</p>
  if (isEdit && existing.isError) {
    return <div className="error-banner">Recipe not found.</div>
  }

  const pending = createMutation.isPending || updateMutation.isPending

  return (
    <div>
      <div className="detail__nav">
        <Link to={isEdit ? `/recipes/${recipeId}` : '/recipes'} className="mono muted">
          ← Cancel
        </Link>
      </div>
      <h1 style={{ marginBottom: '1rem' }}>
        {isEdit ? 'Edit recipe' : 'New recipe'}
      </h1>

      {form.formState.errors.root ? (
        <div className="error-banner">{form.formState.errors.root.message}</div>
      ) : null}
      {form.formState.errors.ingredients ? (
        <div className="error-banner">
          {form.formState.errors.ingredients.message}
        </div>
      ) : null}

      <form
        className="recipe-form"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <label className="field">
          <span className="mono muted">Title</span>
          <input
            {...form.register('title', { required: true })}
            placeholder="e.g. Miso butter salmon"
          />
        </label>

        <div className="stepper">
          <span className="mono muted">Servings</span>
          <div className="stepper__controls">
            <button
              type="button"
              className="btn btn--quiet"
              onClick={() =>
                form.setValue(
                  'servings',
                  Math.max(1, Number(form.watch('servings')) - 1),
                )
              }
            >
              −
            </button>
            <span className="mono">{form.watch('servings')}</span>
            <button
              type="button"
              className="btn btn--quiet"
              onClick={() =>
                form.setValue('servings', Number(form.watch('servings')) + 1)
              }
            >
              +
            </button>
          </div>
        </div>

        <label className="field">
          <span className="mono muted">Tags (comma-separated)</span>
          <input
            {...form.register('tags')}
            placeholder="dinner, quick"
          />
        </label>

        <label className="field">
          <span className="mono muted">Photo URL (optional)</span>
          <input {...form.register('image_url')} placeholder="https://…" />
        </label>

        <div>
          <div className="page-header" style={{ marginBottom: '0.5rem' }}>
            <h2 style={{ fontSize: '1.1rem' }}>Ingredients</h2>
          </div>
          <div className="ingredient-editor">
            {fields.map((field, index) => (
              <div key={field.id} className="ingredient-editor__row">
                <input
                  className="mono"
                  placeholder="Qty"
                  {...form.register(`ingredients.${index}.quantity`)}
                />
                <input
                  className="mono"
                  placeholder="Unit"
                  {...form.register(`ingredients.${index}.unit`)}
                />
                <input
                  placeholder="Name"
                  {...form.register(`ingredients.${index}.name`)}
                />
                <input
                  placeholder="Notes"
                  {...form.register(`ingredients.${index}.notes`)}
                />
                <button
                  type="button"
                  className="btn btn--quiet"
                  aria-label="Remove ingredient"
                  onClick={() => {
                    if (fields.length === 1) {
                      form.setValue(`ingredients.${index}`, emptyRow())
                    } else {
                      remove(index)
                    }
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="btn btn--quiet"
            style={{ marginTop: '0.5rem' }}
            onClick={() => append(emptyRow())}
          >
            + Add ingredient
          </button>
        </div>

        <label className="field">
          <span className="mono muted">Instructions (optional)</span>
          <textarea rows={4} {...form.register('instructions')} />
        </label>

        <button type="submit" className="btn btn--primary" disabled={pending}>
          {pending ? 'Saving…' : isEdit ? 'Save changes' : 'Save recipe'}
        </button>
      </form>
    </div>
  )
}
