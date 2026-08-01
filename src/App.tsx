import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { RequireAuth } from './components/RequireAuth'
import { LoginPage } from './pages/LoginPage'
import { PantryPage } from './pages/pantry/PantryPage'
import { PlanPage } from './pages/plan/PlanPage'
import { RecipeDetailPage } from './pages/recipes/RecipeDetailPage'
import { RecipeFormPage } from './pages/recipes/RecipeFormPage'
import { RecipesPage } from './pages/recipes/RecipesPage'
import { InStorePage } from './pages/shop/InStorePage'
import { ShopPage } from './pages/shop/ShopPage'
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
        <Route path="/recipes" element={<RecipesPage />} />
        <Route path="/recipes/new" element={<RecipeFormPage />} />
        <Route path="/recipes/:id" element={<RecipeDetailPage />} />
        <Route path="/recipes/:id/edit" element={<RecipeFormPage />} />
        <Route path="/plan" element={<PlanPage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/shop/store" element={<InStorePage />} />
        <Route path="/pantry" element={<PantryPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/plan" replace />} />
    </Routes>
  )
}
