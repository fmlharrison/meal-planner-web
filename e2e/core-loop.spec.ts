import { expect, test } from '@playwright/test'
import {
  assignToMonDinner,
  buildShoppingList,
  createRecipe,
  signup,
} from './fixtures/helpers'

test.describe('P0 core planning loop', () => {
  test('signup → recipe → plan → list → pantry skip → in-store tick', async ({
    page,
  }) => {
    await signup(page)

    const recipeTitle = `Loop Salmon ${Date.now()}`
    await createRecipe(page, {
      title: recipeTitle,
      tags: 'dinner',
      ingredients: [
        { quantity: '200', unit: 'g', name: 'Salmon fillet' },
        { quantity: '1', unit: 'tbsp', name: 'E2E Test Oil' },
      ],
    })

    await assignToMonDinner(page, recipeTitle)
    await buildShoppingList(page)

    await expect(page.getByText('Salmon fillet')).toBeVisible()
    await expect(page.getByText('E2E Test Oil')).toBeVisible()

    // Mark oil as staple so regen skips it
    await page.goto('/pantry')
    const skipOrList = page.getByRole('button', { name: 'You can skip this' })
    if (await skipOrList.isVisible().catch(() => false)) {
      await skipOrList.click()
    }
    await page.getByPlaceholder('Add or search').fill('E2E Test Oil')
    await page.getByRole('button', { name: 'Add item' }).click()
    await expect(page.getByText('E2E Test Oil')).toBeVisible()
    // Ensure staple (new items are non-staple; toggle star)
    const oilRow = page.locator('.pantry-row').filter({ hasText: 'E2E Test Oil' })
    await oilRow.getByTitle('Mark staple').click()
    await expect(oilRow.getByTitle('Unmark staple')).toBeVisible()

    await page.goto('/shop')
    await page.getByRole('button', { name: 'Regenerate' }).click()
    await page.getByRole('button', { name: /items skipped/ }).click()
    await expect(
      page.locator('.shop-list--skipped').getByText('E2E Test Oil'),
    ).toBeVisible()
    await expect(page.getByText('Salmon fillet')).toBeVisible()

    await page.getByRole('button', { name: 'Start shopping' }).click()
    await expect(page).toHaveURL(/\/shop\/store/)
    const salmonRow = page.locator('.instore-row').filter({ hasText: 'Salmon fillet' })
    await salmonRow.click()
    await expect(salmonRow).toHaveClass(/instore-row--done/)

    await page.getByRole('button', { name: /Finish shopping|Done/ }).click()
    await expect(page).toHaveURL(/\/shop/)
  })
})
