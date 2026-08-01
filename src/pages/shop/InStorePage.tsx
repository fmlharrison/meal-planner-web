import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api, apiErrorMessage } from '../../api/client'
import { queryKeys, useWeekPlan } from '../../api/hooks'
import type { ShoppingListItem } from '../../api/types'
import { mondayOf } from '../../lib/dates'

export function InStorePage() {
  const [params] = useSearchParams()
  const weekStart = params.get('week') ?? mondayOf()
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

  const [hideTicked, setHideTicked] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [manualName, setManualName] = useState('')
  const [manualQty, setManualQty] = useState('1')
  const [manualUnit, setManualUnit] = useState('item')

  const toggleMutation = useMutation({
    mutationFn: (item: ShoppingListItem) =>
      api.patchShopping_list_itemsId(
        { shopping_list_item: { is_checked: !item.is_checked } },
        { params: { id: item.id } },
      ),
    onSuccess: (updated) => {
      if (!planId || !listQuery.data) return
      const next = {
        ...listQuery.data,
        shopping_list_items: (listQuery.data.shopping_list_items ?? []).map(
          (i) => (i.id === updated.id ? updated : i),
        ),
      }
      qc.setQueryData(queryKeys.shoppingList(planId), next)
    },
  })

  const unavailableMutation = useMutation({
    mutationFn: (item: ShoppingListItem) =>
      api.patchShopping_list_itemsId(
        {
          shopping_list_item: {
            excluded_reason: 'unavailable',
            is_checked: false,
          },
        },
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

  const items = useMemo(
    () =>
      (listQuery.data?.shopping_list_items ?? []).filter(
        (i) => !i.excluded_reason || i.excluded_reason === 'unavailable',
      ),
    [listQuery.data],
  )

  // Active shopping items = not pantry/staple excluded
  const shopItems = useMemo(
    () =>
      (listQuery.data?.shopping_list_items ?? []).filter(
        (i) => !i.excluded_reason,
      ),
    [listQuery.data],
  )

  const checkedCount = shopItems.filter((i) => i.is_checked).length
  const total = shopItems.length
  const remaining = total - checkedCount
  const progress = total === 0 ? 0 : checkedCount / total
  const nearDone = total > 0 && remaining <= Math.max(3, Math.ceil(total * 0.25))

  const visible = shopItems.filter((i) => !(hideTicked && i.is_checked))

  if (planQuery.isLoading || listQuery.isLoading) {
    return <p className="muted">Loading list…</p>
  }

  if (!planId || listQuery.isError || !listQuery.data) {
    return (
      <div className="empty-state">
        <h2>No list to shop</h2>
        <Link to={`/shop?week=${weekStart}`} className="btn btn--primary">
          Back to shop
        </Link>
      </div>
    )
  }

  return (
    <div className="instore">
      <div className="instore__header">
        <Link to={`/shop?week=${weekStart}`} className="mono muted">
          ← List
        </Link>
        <div className="instore__progress-label mono">
          {checkedCount} / {total}
        </div>
      </div>

      <div
        className="instore__bar"
        role="progressbar"
        aria-valuenow={checkedCount}
        aria-valuemin={0}
        aria-valuemax={total}
      >
        <div
          className="instore__bar-fill"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {error ? <div className="error-banner">{error}</div> : null}

      {nearDone && remaining > 0 ? (
        <p className="instore__near mono">
          Almost done · showing {remaining} remaining
        </p>
      ) : null}

      {nearDone && remaining === 0 ? (
        <p className="instore__near mono">All items ticked</p>
      ) : null}

      {groupCompleteBanner(shopItems, hideTicked)}

      <ul className="instore-list">
        {visible.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              className={`instore-row ${item.is_checked ? 'instore-row--done' : ''}`}
              onClick={() =>
                toggleMutation.mutate(item, {
                  onError: (err) => setError(apiErrorMessage(err)),
                })
              }
            >
              <span className="instore-row__check" aria-hidden>
                {item.is_checked ? '✓' : ''}
              </span>
              <span className="instore-row__name">
                {item.ingredient?.name ?? `Item #${item.id}`}
              </span>
              <span className="instore-row__qty mono">
                {trimQty(item.quantity)} {item.unit}
              </span>
            </button>
            {nearDone && !item.is_checked ? (
              <button
                type="button"
                className="instore-unavailable mono"
                onClick={() =>
                  unavailableMutation.mutate(item, {
                    onError: (err) => setError(apiErrorMessage(err)),
                  })
                }
              >
                Couldn&apos;t find — mark unavailable
              </button>
            ) : null}
          </li>
        ))}
      </ul>

      {items.length === 0 ? (
        <p className="muted">Nothing on this list.</p>
      ) : null}

      {adding ? (
        <form
          className="manual-add"
          onSubmit={async (e) => {
            e.preventDefault()
            try {
              await addMutation.mutateAsync({
                name: manualName.trim(),
                quantity: Number(manualQty),
                unit: manualUnit.trim() || 'item',
              })
              setManualName('')
              setAdding(false)
            } catch (err) {
              setError(apiErrorMessage(err))
            }
          }}
        >
          <input
            placeholder="Item"
            value={manualName}
            onChange={(e) => setManualName(e.target.value)}
            required
          />
          <input
            className="mono"
            value={manualQty}
            onChange={(e) => setManualQty(e.target.value)}
            required
          />
          <input
            className="mono"
            value={manualUnit}
            onChange={(e) => setManualUnit(e.target.value)}
            required
          />
          <button type="submit" className="btn btn--primary">
            Add
          </button>
        </form>
      ) : null}

      <footer className="instore__footer">
        <button
          type="button"
          className="btn btn--quiet"
          onClick={() => setHideTicked((v) => !v)}
        >
          {hideTicked
            ? 'Show ticked'
            : `Hide ${checkedCount} ticked`}
        </button>
        <button
          type="button"
          className="btn btn--quiet"
          onClick={() => setAdding((v) => !v)}
        >
          + add item
        </button>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => navigate(`/shop?week=${weekStart}`)}
        >
          {remaining === 0 ? 'Finish shopping' : 'Done'}
        </button>
      </footer>
    </div>
  )
}

function groupCompleteBanner(
  items: ShoppingListItem[],
  hideTicked: boolean,
) {
  if (!hideTicked || items.length === 0) return null
  const done = items.filter((i) => i.is_checked).length
  if (done === 0) return null
  return (
    <p className="instore__near mono">
      {done} ticked hidden · showing {items.length - done} remaining
    </p>
  )
}

function trimQty(value: string) {
  const n = Number(value)
  if (!Number.isFinite(n)) return value
  return String(Number(n.toFixed(2)))
}
