import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api, apiErrorMessage } from '../../api/client'
import { queryKeys, useWeekPlan } from '../../api/hooks'
import type { ShoppingListItem } from '../../api/types'
import { mondayOf } from '../../lib/dates'

export function ShopPage() {
  const [params] = useSearchParams()
  const weekStart =
    params.get('week') && params.get('week')!.length >= 8
      ? params.get('week')!
      : mondayOf()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const planQuery = useWeekPlan(weekStart)
  const planId = planQuery.data?.id

  const listQuery = useQuery({
    queryKey: queryKeys.shoppingList(planId ?? 0),
    enabled: Boolean(planId),
    queryFn: () =>
      api.getMeal_plansMeal_plan_idshopping_list({
        params: { meal_plan_id: planId! },
      }),
    retry: false,
  })

  const regenMutation = useMutation({
    mutationFn: () =>
      api.postMeal_plansMeal_plan_idshopping_list(undefined, {
        params: { meal_plan_id: planId! },
      }),
    onSuccess: (list) => {
      qc.setQueryData(queryKeys.shoppingList(planId!), list)
    },
  })

  const toggleMutation = useMutation({
    mutationFn: (item: ShoppingListItem) =>
      api.patchShopping_list_itemsId(
        { shopping_list_item: { is_checked: !item.is_checked } },
        { params: { id: item.id } },
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.shoppingList(planId!) }),
  })

  const addMutation = useMutation({
    mutationFn: (input: { name: string; quantity: number; unit: string }) =>
      api.postShopping_listsShopping_list_idshopping_list_items(
        {
          shopping_list_item: {
            name: input.name,
            quantity: input.quantity,
            unit: input.unit,
          },
        },
        { params: { shopping_list_id: listQuery.data!.id } },
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.shoppingList(planId!) }),
  })

  const [manualOpen, setManualOpen] = useState(false)
  const [manualName, setManualName] = useState('')
  const [manualQty, setManualQty] = useState('1')
  const [manualUnit, setManualUnit] = useState('item')
  const [skippedOpen, setSkippedOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (planQuery.isLoading) return <p className="muted">Loading…</p>
  if (!planId) return <div className="error-banner">No plan for this week.</div>

  if (listQuery.isLoading) return <p className="muted">Loading list…</p>

  if (listQuery.isError || !listQuery.data) {
    return (
      <div>
        <div className="page-header">
          <h1>Shop</h1>
        </div>
        <div className="empty-state">
          <div className="empty-state__icon" aria-hidden />
          <h2>No list yet</h2>
          <p className="muted">Build one from this week&apos;s plan.</p>
          <button
            type="button"
            className="btn btn--primary"
            disabled={regenMutation.isPending}
            onClick={() =>
              regenMutation.mutate(undefined, {
                onSuccess: () =>
                  qc.invalidateQueries({
                    queryKey: queryKeys.shoppingList(planId),
                  }),
                onError: (err) => setError(apiErrorMessage(err)),
              })
            }
          >
            {regenMutation.isPending ? 'Building…' : 'Build list'}
          </button>
          <Link to={`/plan?week=${weekStart}`} className="mono muted">
            Back to plan
          </Link>
          {error ? <div className="error-banner">{error}</div> : null}
        </div>
      </div>
    )
  }

  const list = listQuery.data
  const items = list.shopping_list_items ?? []
  const active = items.filter((i) => !i.excluded_reason)
  const skipped = items.filter((i) => i.excluded_reason)
  const isFinal = list.status === 'finalized'

  const groups = groupItems(active)

  async function onAddManual(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await addMutation.mutateAsync({
        name: manualName.trim(),
        quantity: Number(manualQty),
        unit: manualUnit.trim() || 'item',
      })
      setManualName('')
      setManualQty('1')
      setManualOpen(false)
    } catch (err) {
      setError(apiErrorMessage(err))
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Shop</h1>
        <span className={`badge ${isFinal ? 'badge--final' : 'badge--draft'} mono`}>
          {isFinal ? 'Final' : 'Draft'}
        </span>
      </div>

      <p className="mono muted" style={{ marginTop: 0 }}>
        {active.length} items · {skipped.length} skipped
      </p>

      {error ? <div className="error-banner">{error}</div> : null}

      {groups.map(([category, rows]) => (
        <section key={category} className="shop-section">
          <h2 className="shop-section__title mono">{category}</h2>
          <ul className="shop-list">
            {rows.map((item) => (
              <li key={item.id} className="shop-list__row">
                {!isFinal ? (
                  <input
                    type="checkbox"
                    checked={item.is_checked}
                    aria-label={`Check ${item.ingredient?.name ?? 'item'}`}
                    onChange={() =>
                      toggleMutation.mutate(item, {
                        onError: (err) => setError(apiErrorMessage(err)),
                      })
                    }
                  />
                ) : null}
                <div className="shop-list__body">
                  <strong>{item.ingredient?.name ?? `Item #${item.id}`}</strong>
                  <span className="mono muted" style={{ fontSize: '0.75rem' }}>
                    {item.source === 'manual' ? 'manual' : 'from plan'}
                  </span>
                </div>
                <span className="mono shop-list__qty">
                  {trimQty(item.quantity)} {item.unit}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {skipped.length > 0 ? (
        <section className="shop-section">
          <button
            type="button"
            className="shop-skipped-toggle mono"
            onClick={() => setSkippedOpen((v) => !v)}
          >
            {skipped.length} items skipped — you already have them{' '}
            {skippedOpen ? '▴' : '▾'}
          </button>
          {skippedOpen ? (
            <ul className="shop-list shop-list--skipped">
              {skipped.map((item) => (
                <li key={item.id} className="shop-list__row">
                  <div className="shop-list__body">
                    <strong>
                      {item.ingredient?.name ?? `Item #${item.id}`}
                    </strong>
                    <span className="mono muted" style={{ fontSize: '0.75rem' }}>
                      {item.excluded_reason}
                    </span>
                  </div>
                  <span className="mono shop-list__qty">
                    {trimQty(item.quantity)} {item.unit}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      {!isFinal ? (
        <>
          {manualOpen ? (
            <form className="manual-add" onSubmit={onAddManual}>
              <input
                placeholder="Item name"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                required
              />
              <input
                className="mono"
                placeholder="Qty"
                value={manualQty}
                onChange={(e) => setManualQty(e.target.value)}
                required
              />
              <input
                className="mono"
                placeholder="Unit"
                value={manualUnit}
                onChange={(e) => setManualUnit(e.target.value)}
                required
              />
              <button
                type="submit"
                className="btn btn--primary"
                disabled={addMutation.isPending}
              >
                Add
              </button>
            </form>
          ) : (
            <button
              type="button"
              className="btn btn--quiet"
              style={{ width: '100%', marginTop: '0.75rem' }}
              onClick={() => setManualOpen(true)}
            >
              + add an item by hand
            </button>
          )}

          <div className="shop-actions">
            <button
              type="button"
              className="btn btn--ghost"
              disabled={regenMutation.isPending}
              onClick={() =>
                regenMutation.mutate(undefined, {
                  onError: (err) => setError(apiErrorMessage(err)),
                })
              }
            >
              {regenMutation.isPending ? 'Regenerating…' : 'Regenerate'}
            </button>
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => navigate(`/shop/store?week=${weekStart}`)}
            >
              Start shopping
            </button>
          </div>
        </>
      ) : (
        <div className="shop-actions">
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => navigate(`/shop/store?week=${weekStart}`)}
          >
            Start in-store mode
          </button>
        </div>
      )}
    </div>
  )
}

/** API omits Ingredient.category — single section until that lands. */
function groupItems(items: ShoppingListItem[]): [string, ShoppingListItem[]][] {
  const sorted = [...items].sort((a, b) =>
    (a.ingredient?.name ?? '').localeCompare(b.ingredient?.name ?? ''),
  )
  return [['To buy', sorted]]
}

function trimQty(value: string) {
  const n = Number(value)
  if (!Number.isFinite(n)) return value
  return String(Number(n.toFixed(2)))
}
