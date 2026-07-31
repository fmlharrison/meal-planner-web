import { Link, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'

function PlanPage() {
  return <h1>Plan</h1>
}

function RecipesPage() {
  return <h1>Recipes</h1>
}

function App() {
  return (
    <div className="app">
      <nav>
        <Link to="/plan">Plan</Link>
        <Link to="/recipes">Recipes</Link>
      </nav>
      <main>
        <Routes>
          <Route path="/" element={<Navigate to="/plan" replace />} />
          <Route path="/plan" element={<PlanPage />} />
          <Route path="/recipes" element={<RecipesPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
