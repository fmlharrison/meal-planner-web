import { z } from 'zod'
import { extractBearer } from '../lib/token'

const baseUrl = import.meta.env.VITE_API_URL ?? '/api'

const userSchema = z.object({
  user: z.object({
    id: z.number().int(),
    email: z.string().email(),
  }),
})

export type AuthSessionUser = {
  id: number
  email: string
}

async function parseJson(res: Response) {
  const text = await res.text()
  if (!text) return null
  return JSON.parse(text) as unknown
}

export async function login(email: string, password: string) {
  const res = await fetch(`${baseUrl}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ user: { email, password } }),
  })

  const body = await parseJson(res)
  if (!res.ok) {
    const errors = (body as { error?: string; errors?: string[] } | null)?.errors
    const message =
      (body as { error?: string } | null)?.error ??
      errors?.[0] ??
      'Login failed'
    throw new Error(message)
  }

  const token = extractBearer(res.headers.get('Authorization'))
  if (!token) throw new Error('No auth token returned from login')
  const data = userSchema.parse(body)
  return { token, user: data.user as AuthSessionUser }
}

export async function signup(
  email: string,
  password: string,
  passwordConfirmation: string,
) {
  const res = await fetch(`${baseUrl}/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      user: {
        email,
        password,
        password_confirmation: passwordConfirmation,
      },
    }),
  })

  const body = await parseJson(res)
  if (!res.ok) {
    const errors = (body as { errors?: string[] } | null)?.errors
    throw new Error(errors?.join(', ') ?? 'Signup failed')
  }

  const token = extractBearer(res.headers.get('Authorization'))
  if (!token) throw new Error('No auth token returned from signup')
  const data = userSchema.parse(body)
  return { token, user: data.user as AuthSessionUser }
}

export async function logout(token: string) {
  await fetch(`${baseUrl}/logout`, {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })
}
