import { fetchAuth } from './client'

export async function getCategorias(arquivada = false) {
  const r = await fetchAuth(`/api/categorias?arquivada=${arquivada}`)
  return r.json()
}

export async function criarCategoria(data) {
  const r = await fetchAuth('/api/categorias', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return r.json()
}

export async function atualizarCategoria(id, data) {
  const r = await fetchAuth(`/api/categorias/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return r.json()
}

export async function arquivarCategoria(id) {
  const r = await fetchAuth(`/api/categorias/${id}/arquivar`, { method: 'PATCH' })
  return r.json()
}
