import { setToken } from './client'

export async function login(email, password) {
  const r = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await r.json()
  if (!r.ok) throw new Error(data.error || 'Erro ao fazer login')
  setToken(data.token)
  return data
}

export async function register(email, password) {
  const r = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await r.json()
  if (!r.ok) throw new Error(data.error || 'Erro ao registrar')
  setToken(data.token)
  return data
}

export async function verificarSessao() {
  const { getToken } = await import('./client')
  const token = getToken()
  if (!token) return null
  const r = await fetch('/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!r.ok) return null
  return r.json()
}

export function logout() {
  const { setToken } = require('./client')
  setToken(null)
}
