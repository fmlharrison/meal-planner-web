import { expect, type Page } from '@playwright/test'

export function uniqueEmail(prefix = 'e2e') {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`
}

export const DEFAULT_PASSWORD = 'password123'

/** Clear auth storage so each test starts logged out. */
export async function clearSession(page: Page) {
  await page.goto('/login')
  await page.evaluate(() => {
    localStorage.removeItem('meal_planner_jwt')
    localStorage.removeItem('meal_planner_user')
    localStorage.removeItem('meal_planner_pantry_onboarded')
  })
}

export async function signup(
  page: Page,
  email = uniqueEmail(),
  password = DEFAULT_PASSWORD,
) {
  await clearSession(page)
  await page.goto('/login')
  await page.getByRole('button', { name: 'Sign up' }).click()
  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[type="password"]').first().fill(password)
  await page.locator('input[type="password"]').nth(1).fill(password)
  await page.getByRole('button', { name: 'Create account' }).click()
  await expect(page).toHaveURL(/\/plan/)
  return { email, password }
}

export async function login(page: Page, email: string, password: string) {
  await clearSession(page)
  await page.goto('/login')
  // Default mode is login — fill and submit the form (avoid chip vs submit clash)
  await page.locator('input[type="email"]').fill(email)
  await page.locator('form input[type="password"]').fill(password)
  await page.locator('form').getByRole('button', { name: 'Log in' }).click()
  await expect(page).toHaveURL(/\/plan/)
}

export type IngredientInput = {
  quantity: string
  unit: string
  name: string
  notes?: string
}

export async function createRecipe(
  page: Page,
  opts: {
    title: string
    tags?: string
    servings?: number
    ingredients: IngredientInput[]
  },
) {
  await page.goto('/recipes/new')
  await page.getByPlaceholder('e.g. Miso butter salmon').fill(opts.title)
  if (opts.tags) {
    await page.getByPlaceholder('dinner, quick').fill(opts.tags)
  }

  if (opts.servings != null) {
    // Form defaults to 2 — adjust with stepper (+ / −)
    const delta = opts.servings - 2
    const stepper = page.locator('.stepper').first()
    for (let i = 0; i < Math.abs(delta); i++) {
      await stepper
        .getByRole('button', { name: delta > 0 ? '+' : '−' })
        .click()
    }
  }

  const addBtn = page.getByRole('button', { name: '+ Add ingredient' })
  for (let i = 1; i < opts.ingredients.length; i++) {
    await addBtn.click()
  }

  const rows = page.locator('.ingredient-editor__row')
  for (let i = 0; i < opts.ingredients.length; i++) {
    const row = rows.nth(i)
    const ing = opts.ingredients[i]
    await row.locator('input').nth(0).fill(ing.quantity)
    await row.locator('input').nth(1).fill(ing.unit)
    await row.locator('input').nth(2).fill(ing.name)
    if (ing.notes) await row.locator('input').nth(3).fill(ing.notes)
  }

  await page.getByRole('button', { name: 'Save recipe' }).click()
  await expect(page).toHaveURL(/\/recipes\/\d+/)
  await expect(page.getByRole('heading', { name: opts.title })).toBeVisible()
}

/** Dismiss first-run staple picker if shown, leave pantry ready for add/search. */
export async function ensurePantryEditable(page: Page) {
  await page.goto('/pantry')
  const skip = page.getByRole('button', { name: 'You can skip this' })
  const search = page.getByPlaceholder('Add or search')
  await expect(skip.or(search)).toBeVisible({ timeout: 15_000 })
  if (await skip.isVisible()) {
    await skip.click()
  }
  await expect(search).toBeVisible()
}

/** Open Mon dinner slot (day 0, meal dinner = 3rd column in day row). */
export async function assignToMonDinner(page: Page, recipeTitle: string) {
  await page.goto('/plan')
  await expect(page.getByRole('grid', { name: 'Weekly meal plan' })).toBeVisible()

  const monDinner = page.locator('.plan-slot').nth(2)
  await monDinner.click()

  const sheet = page.getByRole('dialog')
  await expect(sheet).toBeVisible()
  await sheet.getByRole('button', { name: 'all' }).click()
  await sheet.getByPlaceholder('Search recipes').fill(recipeTitle)
  const row = sheet.locator('.assign-list__row').filter({ hasText: recipeTitle })
  await row.getByRole('button', { name: 'Add' }).click()
  await expect(sheet).toBeHidden({ timeout: 15_000 })
  await expect(
    page.locator('.plan-slot--filled').filter({ hasText: recipeTitle }),
  ).toBeVisible()
}

export async function buildShoppingList(page: Page) {
  await page.goto('/plan')
  await page.getByRole('button', { name: 'Build list' }).click()
  await expect(page).toHaveURL(/\/shop/)
}
