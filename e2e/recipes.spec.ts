import { expect, test } from '@playwright/test'
import { createRecipe, signup } from './fixtures/helpers'

test.describe('P1 recipes', () => {
  test.beforeEach(async ({ page }) => {
    await signup(page)
  })

  test('empty state CTA opens new recipe form', async ({ page }) => {
    await page.goto('/recipes')
    await expect(page.getByRole('heading', { name: 'Nothing to plan with yet' })).toBeVisible()
    await page.getByRole('button', { name: 'Add a recipe' }).click()
    await expect(page).toHaveURL(/\/recipes\/new/)
  })

  test('create, edit, delete; unit required; servings preview', async ({
    page,
  }) => {
    const title = `Recipe CRUD ${Date.now()}`
    await createRecipe(page, {
      title,
      tags: 'dinner',
      ingredients: [
        { quantity: '100', unit: 'g', name: 'Tofu' },
        { quantity: '1', unit: 'tsp', name: 'Salt' },
      ],
    })

    // Servings preview scales without leaving detail
    await page.getByRole('button', { name: 'More servings' }).click()
    await expect(page.getByText('Preview only')).toBeVisible()
    await expect(page.locator('.ingredient-list__row').first()).toContainText('200')

    // Edit title
    await page.getByRole('link', { name: 'Edit' }).click()
    await expect(page).toHaveURL(/\/edit/)
    const edited = `${title} Edited`
    await page.getByPlaceholder('e.g. Miso butter salmon').fill(edited)
    await page.getByRole('button', { name: 'Save changes' }).click()
    await expect(page.getByRole('heading', { name: edited })).toBeVisible()

    // Validation: unit required on new recipe
    await page.goto('/recipes/new')
    await page.getByPlaceholder('e.g. Miso butter salmon').fill('No Unit Dish')
    const row = page.locator('.ingredient-editor__row').first()
    await row.locator('input').nth(0).fill('1')
    await row.locator('input').nth(1).fill('') // missing unit
    await row.locator('input').nth(2).fill('Onion')
    await page.getByRole('button', { name: 'Save recipe' }).click()
    await expect(
      page.getByText(/needs a unit/i),
    ).toBeVisible()
    await expect(page).toHaveURL(/\/recipes\/new/)

    // Delete
    await page.goto('/recipes')
    await page.getByRole('link', { name: edited }).click()
    page.once('dialog', (d) => d.accept())
    await page.getByRole('button', { name: 'Delete' }).click()
    await expect(page).toHaveURL(/\/recipes/)
    await expect(page.getByRole('link', { name: edited })).toHaveCount(0)
  })
})
