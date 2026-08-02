import { expect, test } from '@playwright/test'
import {
  clearSession,
  DEFAULT_PASSWORD,
  login,
  signup,
  uniqueEmail,
} from './fixtures/helpers'

test.describe('P1 auth', () => {
  test('signup lands on plan', async ({ page }) => {
    await signup(page)
    await expect(page.getByRole('heading', { name: /–/ })).toBeVisible()
  })

  test('login with existing user', async ({ page }) => {
    const email = uniqueEmail('login')
    await signup(page, email, DEFAULT_PASSWORD)
    await login(page, email, DEFAULT_PASSWORD)
    await expect(page).toHaveURL(/\/plan/)
  })

  test('unauthenticated /recipes redirects to /login', async ({ page }) => {
    await clearSession(page)
    await page.goto('/recipes')
    await expect(page).toHaveURL(/\/login/)
  })
})
