import { expect, test } from '@playwright/test'
import {
  assignToMonDinner,
  createRecipe,
  signup,
} from './fixtures/helpers'

test.describe('P1 plan builder', () => {
  test.beforeEach(async ({ page }) => {
    await signup(page)
  })

  test('week nav, assign, clear; no leftovers chip', async ({ page }) => {
    const title = `Plan Meal ${Date.now()}`
    await createRecipe(page, {
      title,
      tags: 'dinner',
      ingredients: [{ quantity: '1', unit: 'pack', name: 'Noodles' }],
    })

    await page.goto('/plan')
    const urlBefore = page.url()
    await page.getByRole('button', { name: 'Next week' }).click()
    await expect(page).toHaveURL(/week=/)
    expect(page.url()).not.toBe(urlBefore)
    await page.getByRole('button', { name: 'Previous week' }).click()

    await assignToMonDinner(page, title)
    await expect(
      page.locator('.plan-slot--filled').filter({ hasText: title }),
    ).toContainText('×')

    // Re-open slot: assign sheet has suggested/all only
    await page.locator('.plan-slot--filled').filter({ hasText: title }).click()
    const sheet = page.getByRole('dialog')
    await expect(sheet.getByRole('button', { name: 'suggested' })).toBeVisible()
    await expect(sheet.getByRole('button', { name: 'all' })).toBeVisible()
    await expect(sheet.getByRole('button', { name: /leftover/i })).toHaveCount(0)

    await sheet.getByRole('button', { name: 'Clear slot' }).click()
    await expect(sheet).toBeHidden({ timeout: 15_000 })
    await expect(
      page.locator('.plan-slot--filled').filter({ hasText: title }),
    ).toHaveCount(0)
  })
})
