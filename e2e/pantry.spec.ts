import { expect, test } from '@playwright/test'
import { ensurePantryEditable, signup } from './fixtures/helpers'

test.describe('P1 pantry', () => {
  test('first-run staples, status cycle', async ({ page }) => {
    await signup(page)
    await page.goto('/pantry')

    await expect(
      page.getByRole('heading', { name: 'Common staples' }),
    ).toBeVisible()
    await page.getByRole('button', { name: 'Salt', exact: true }).click()
    await page.getByRole('button', { name: 'Olive oil', exact: true }).click()
    await page.getByRole('button', { name: /Add 2 staples/ }).click()

    await expect(page.getByText(/Staples/)).toBeVisible()
    await expect(page.getByText('Salt')).toBeVisible()
    await expect(page.getByText('Olive oil')).toBeVisible()

    const saltRow = page.locator('.pantry-row').filter({ hasText: 'Salt' })
    const statusChip = saltRow.locator('button.chip')
    await expect(statusChip).toHaveText('have')
    await statusChip.click()
    await expect(statusChip).toHaveText('low')
    await statusChip.click()
    await expect(statusChip).toHaveText('out')
  })

  test('skip first-run onboard', async ({ page }) => {
    await signup(page)
    await ensurePantryEditable(page)
    await expect(page.getByText(/No pantry items yet/i)).toBeVisible()
  })
})
