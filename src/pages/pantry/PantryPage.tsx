import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { api, apiErrorMessage } from '../../api/client'
import { queryKeys, usePantryItems } from '../../api/hooks'
import type { PantryItem } from '../../api/types'

const STATUS_CYCLE = ['have', 'running_low', 'out'] as const
type Status = (typeof STATUS_CYCLE)[number]

const COMMON_STAPLES = [
  'Salt',
  'Black pepper',
  'Olive oil',
  'Butter',
  'Garlic',
  'Onion',
  'Soy sauce',
  'Flour',
  'Rice',
  'Pasta',
  'Eggs',
  'Milk',
]

const STATUS_LABEL: Record<Status, string> = {
  have: 'have',
  running_low: 'low',
  out: 'out',
}

const ONBOARDED_KEY = 'meal_planner_pantry_onboarded'

export function PantryPage() {
  const qc = useQueryClient()
  const pantryQuery = usePantryItems()
  const [filter, setFilter] = useState<'all' | Status>('all')
  const [search, setSearch] = useState('')
  const [addName, setAddName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [selectedStaples, setSelectedStaples] = useState<Set<string>>(
    () => new Set(),
  )
  const [onboarded, setOnboarded] = useState(
    () => localStorage.getItem(ONBOARDED_KEY) === '1',
  )

  const createMutation = useMutation({
    mutationFn: (input: { name: string; is_staple: boolean; status: Status }) =>
      api.postPantry_items({
        pantry_item: {
          name: input.name,
          is_staple: input.is_staple,
          status: input.status,
        },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.pantry }),
  })

  const updateMutation = useMutation({
    mutationFn: (input: {
      id: number
      status?: Status
      is_staple?: boolean
    }) =>
      api.patchPantry_itemsId(
        {
          pantry_item: {
            status: input.status,
            is_staple: input.is_staple,
          },
        },
        { params: { id: input.id } },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.pantry }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      api.deletePantry_itemsId(undefined, { params: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.pantry }),
  })

  const items = pantryQuery.data ?? []

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter((item) => {
      if (filter !== 'all' && item.status !== filter) return false
      if (!q) return true
      return (item.ingredient?.name ?? '').toLowerCase().includes(q)
    })
  }, [items, filter, search])

  const staples = filtered.filter((i) => i.is_staple)
  const other = filtered.filter((i) => !i.is_staple)

  function markOnboarded() {
    localStorage.setItem(ONBOARDED_KEY, '1')
    setOnboarded(true)
  }

  if (pantryQuery.isLoading) return <p className="muted">Loading pantry…</p>
  if (pantryQuery.isError) {
    return <div className="error-banner">Could not load pantry.</div>
  }

  if (items.length === 0 && !onboarded) {
    return (
      <div>
        <div className="page-header">
          <h1>Pantry</h1>
        </div>
        <h2 style={{ fontSize: '1.15rem', marginBottom: '0.35rem' }}>
          Common staples
        </h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Tap what you usually keep around. These won&apos;t show up on shopping
          lists.
        </p>
        <div className="chip-row" style={{ flexWrap: 'wrap', margin: '1rem 0' }}>
          {COMMON_STAPLES.map((staple) => (
            <button
              key={staple}
              type="button"
              className={`chip ${selectedStaples.has(staple) ? 'chip--active' : ''}`}
              onClick={() => {
                setSelectedStaples((prev) => {
                  const next = new Set(prev)
                  if (next.has(staple)) next.delete(staple)
                  else next.add(staple)
                  return next
                })
              }}
            >
              {staple}
            </button>
          ))}
        </div>
        {error ? <div className="error-banner">{error}</div> : null}
        <button
          type="button"
          className="btn btn--primary"
          style={{ width: '100%' }}
          disabled={createMutation.isPending || selectedStaples.size === 0}
          onClick={async () => {
            setError(null)
            try {
              for (const staple of selectedStaples) {
                await createMutation.mutateAsync({
                  name: staple,
                  is_staple: true,
                  status: 'have',
                })
              }
              markOnboarded()
            } catch (err) {
              setError(apiErrorMessage(err))
            }
          }}
        >
          {createMutation.isPending
            ? 'Saving…'
            : `Add ${selectedStaples.size} staples`}
        </button>
        <button
          type="button"
          className="btn btn--quiet"
          style={{ width: '100%', marginTop: '0.5rem' }}
          onClick={markOnboarded}
        >
          You can skip this
        </button>
      </div>
    )
  }

  async function onAdd(e: React.FormEvent) {
    e.preventDefault()
    const value = addName.trim() || search.trim()
    if (!value) return
    setError(null)
    try {
      await createMutation.mutateAsync({
        name: value,
        is_staple: false,
        status: 'have',
      })
      setAddName('')
      setSearch('')
      markOnboarded()
    } catch (err) {
      setError(apiErrorMessage(err))
    }
  }

  function cycleStatus(item: PantryItem) {
    const idx = STATUS_CYCLE.indexOf(item.status)
    const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length]
    updateMutation.mutate(
      { id: item.id, status: next },
      { onError: (err) => setError(apiErrorMessage(err)) },
    )
  }

  return (
    <div>
      <div className="page-header">
        <h1>Pantry</h1>
        <span className="page-header__count">{items.length}</span>
      </div>

      <form className="search-row" onSubmit={onAdd}>
        <input
          type="search"
          placeholder="Add or search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setAddName(e.target.value)
          }}
        />
        <button type="submit" className="btn btn--icon" aria-label="Add item">
          +
        </button>
      </form>

      <div className="chip-row" style={{ marginBottom: '0.75rem' }}>
        {(['all', ...STATUS_CYCLE] as const).map((s) => (
          <button
            key={s}
            type="button"
            className={`chip ${filter === s ? 'chip--active' : ''}`}
            onClick={() => setFilter(s)}
          >
            {s === 'running_low' ? 'low' : s}
          </button>
        ))}
      </div>

      {error ? <div className="error-banner">{error}</div> : null}

      {items.length === 0 ? (
        <p className="muted">No pantry items yet. Type a name and tap +.</p>
      ) : null}

      <PantryGroup
        title="Staples"
        items={staples}
        onCycle={cycleStatus}
        onToggleStaple={(item) =>
          updateMutation.mutate(
            { id: item.id, is_staple: !item.is_staple },
            { onError: (err) => setError(apiErrorMessage(err)) },
          )
        }
        onRemove={(item) => {
          if (confirm(`Remove ${item.ingredient?.name}?`)) {
            deleteMutation.mutate(item.id, {
              onError: (err) => setError(apiErrorMessage(err)),
            })
          }
        }}
      />
      <PantryGroup
        title="Other"
        items={other}
        onCycle={cycleStatus}
        onToggleStaple={(item) =>
          updateMutation.mutate(
            { id: item.id, is_staple: !item.is_staple },
            { onError: (err) => setError(apiErrorMessage(err)) },
          )
        }
        onRemove={(item) => {
          if (confirm(`Remove ${item.ingredient?.name}?`)) {
            deleteMutation.mutate(item.id, {
              onError: (err) => setError(apiErrorMessage(err)),
            })
          }
        }}
      />
    </div>
  )
}

function PantryGroup({
  title,
  items,
  onCycle,
  onToggleStaple,
  onRemove,
}: {
  title: string
  items: PantryItem[]
  onCycle: (item: PantryItem) => void
  onToggleStaple: (item: PantryItem) => void
  onRemove: (item: PantryItem) => void
}) {
  if (items.length === 0) return null
  return (
    <section className="shop-section">
      <h2 className="shop-section__title mono">
        {title} · {items.length}
      </h2>
      <ul className="shop-list">
        {items.map((item) => (
          <li key={item.id} className="pantry-row">
            <button
              type="button"
              className="pantry-row__main"
              onClick={() => onCycle(item)}
            >
              <strong>{item.ingredient?.name ?? `Item #${item.id}`}</strong>
              <span className="mono muted" style={{ fontSize: '0.75rem' }}>
                {item.status === 'running_low'
                  ? 'will be added to the next list'
                  : item.status === 'out'
                    ? 'out — add to next list'
                    : 'in stock'}
              </span>
            </button>
            <button
              type="button"
              className={`chip ${
                item.status === 'have'
                  ? 'chip--ok'
                  : item.status === 'running_low'
                    ? 'chip--amber'
                    : ''
              }`}
              onClick={() => onCycle(item)}
            >
              {STATUS_LABEL[item.status]}
            </button>
            <button
              type="button"
              className="btn btn--quiet"
              title={item.is_staple ? 'Unmark staple' : 'Mark staple'}
              onClick={() => onToggleStaple(item)}
            >
              {item.is_staple ? '★' : '☆'}
            </button>
            <button
              type="button"
              className="btn btn--quiet"
              aria-label="Remove"
              onClick={() => onRemove(item)}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
