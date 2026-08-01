import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/recipes', label: 'Recipes' },
  { to: '/plan', label: 'Plan' },
  { to: '/shop', label: 'Shop' },
  { to: '/pantry', label: 'Pantry' },
] as const

export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Primary">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) => (isActive ? 'active' : undefined)}
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  )
}
