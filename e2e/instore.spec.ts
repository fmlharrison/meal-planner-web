import { expect, test } from '@playwright/test'
import {
  assignToMonDinner,
  buildShoppingList,
  createRecipe,
  ensurePantryEditable,
  signup,
} from './fixtures/helpers'

test.describe('P1 in-store', () => {
  test('tick, hide ticked, unavailable; finish does not change pantry', async ({
    page,
  }) => {
    await signup(page)

    // Skip pantry onboard so empty pantry stays empty for the assertion
    await ensurePantryEditable(page)

    const title = `InStore ${Date.now()}`
    await createRecipe(page, {
      title,
      tags: 'dinner',
      ingredients: [
        { quantity: '1', unit: 'can', name: 'Chickpeas' },
        { quantity: '2', unit: 'clove', name: 'Garlic' },
      ],
    })
    await assignToMonDinner(page, title)
    await buildShoppingList(page)
    await page.getByRole('button', { name: 'Start shopping' }).click()
    await expect(page).toHaveURL(/\/shop\/store/)

    const chickpea = page.locator('.instore-row').filter({ hasText: 'Chickpeas' })
    const box = await chickpea.boundingBox()
    expect(box).toBeTruthy()
    expect(box!.height).toBeGreaterThanOrEqual(56)

    await chickpea.click()
    await expect(chickpea).toHaveClass(/instore-row--done/)

    await page.getByRole('button', { name: /Hide \d+ ticked/ }).click()
    await expect(chickpea).toBeHidden()

    // Tick remaining or mark unavailable near end
    const garlic = page.locator('.instore-row').filter({ hasText: 'Garlic' })
    if (await garlic.isVisible()) {
      const unavailable = page.getByRole('button', {
        name: /mark unavailable/i,
      })
      if (await unavailable.isVisible().catch(() => false)) {
        await unavailable.click()
      } else {
        await garlic.click()
      }
    }

    await page.getByRole('button', { name: /Finish shopping|Done/ }).click()
    await expect(page).toHaveURL(/\/shop/)

    // Finish shopping must not create pantry items
    await page.goto('/pantry')
    await expect(page.getByText('Chickpeas')).toHaveCount(0)
  })
})
