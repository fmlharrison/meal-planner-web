import { expect, test } from '@playwright/test'
import {
  assignToMonDinner,
  buildShoppingList,
  createRecipe,
  signup,
} from './fixtures/helpers'

test.describe('P1 shopping list', () => {
  test.beforeEach(async ({ page }) => {
    await signup(page)
  })

  test('empty list UX, manual add, regen keeps manual, dual units', async ({
    page,
  }) => {
    await page.goto('/shop')
    await expect(page.getByRole('heading', { name: 'No list yet' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Build list' })).toBeVisible()

    // Dual-unit recipe: same ingredient name, two units → two rows
    const title = `Dual Unit ${Date.now()}`
    await createRecipe(page, {
      title,
      tags: 'dinner',
      ingredients: [
        { quantity: '200', unit: 'g', name: 'Chicken' },
        { quantity: '1', unit: 'pack', name: 'Chicken' },
      ],
    })
    await assignToMonDinner(page, title)
    await buildShoppingList(page)

    const chickenRows = page.locator('.shop-list__row').filter({ hasText: 'Chicken' })
    await expect(chickenRows).toHaveCount(2)
    await expect(page.getByText('tap to fix')).toHaveCount(0)

    // Manual add
    await page.getByRole('button', { name: '+ add an item by hand' }).click()
    await page.getByPlaceholder('Item name').fill('Bananas')
    await page.getByPlaceholder('Qty').fill('6')
    await page.getByPlaceholder('Unit').fill('each')
    await page.getByRole('button', { name: 'Add', exact: true }).click()
    await expect(page.getByText('Bananas')).toBeVisible()

    await page.getByRole('button', { name: 'Regenerate' }).click()
    await expect(page.getByText('Bananas')).toBeVisible()
  })
})
