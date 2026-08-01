import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { RequireAuth } from './components/RequireAuth'
import { LoginPage } from './pages/LoginPage'
import {
  PantryPlaceholder,
  PlanPlaceholder,
  RecipesPlaceholder,
  ShopPlaceholder,
} from './pages/Placeholders'
import './App.css'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route path="/" element={<Navigate to="/plan" replace />} />
        <Route path="/recipes" element={<RecipesPlaceholder />} />
        <Route path="/plan" element={<PlanPlaceholder />} />
        <Route path="/shop" element={<ShopPlaceholder />} />
        <Route path="/pantry" element={<PantryPlaceholder />} />
      </Route>
      <Route path="*" element={<Navigate to="/plan" replace />} />
    </Routes>
  )
}
