import { fetchAuth } from './client'

export async function getLancamentos(params = {}) {
  const q = new URLSearchParams(params).toString()
  const r = await fetchAuth(`/api/lancamentos${q ? '?' + q : ''}`)
  return r.json()
}

export async function criarLancamento(data) {
  const r = await fetchAuth('/api/lancamentos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return r.json()
}

export async function atualizarLancamento(id, data) {
  const r = await fetchAuth(`/api/lancamentos/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return r.json()
}

export async function deletarLancamento(id) {
  await fetchAuth(`/api/lancamentos/${id}`, { method: 'DELETE' })
}
