import { expect, test } from '@playwright/test'
import { signup } from './fixtures/helpers'

test.describe('P1 pantry', () => {
  test('first-run staples, status cycle, skip onboard', async ({ page }) => {
    await signup(page)
    await page.goto('/pantry')

    await expect(page.getByRole('heading', { name: 'Common staples' })).toBeVisible()
    await page.getByRole('button', { name: 'Salt', exact: true }).click()
    await page.getByRole('button', { name: 'Olive oil', exact: true }).click()
    await page.getByRole('button', { name: /Add 2 staples/ }).click()

    await expect(page.getByText(/Staples/)).toBeVisible()
    await expect(page.getByText('Salt')).toBeVisible()
    await expect(page.getByText('Olive oil')).toBeVisible()

    const saltRow = page.locator('.pantry-row').filter({ hasText: 'Salt' })
    await saltRow.getByRole('button', { name: 'have' }).click()
    await expect(saltRow.getByRole('button', { name: 'low' })).toBeVisible()
    await saltRow.getByRole('button', { name: 'low' }).click()
    await expect(saltRow.getByRole('button', { name: 'out' })).toBeVisible()
  })

  test('skip first-run onboard', async ({ page }) => {
    await signup(page)
    await page.goto('/pantry')
    await page.getByRole('button', { name: 'You can skip this' }).click()
    await expect(page.getByText(/No pantry items yet/i)).toBeVisible()
  })
})
