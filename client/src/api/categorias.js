export async function getCategorias(arquivada = false) {
  const r = await fetch(`/api/categorias?arquivada=${arquivada}`)
  return r.json()
}

export async function criarCategoria(data) {
  const r = await fetch('/api/categorias', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return r.json()
}

export async function atualizarCategoria(id, data) {
  const r = await fetch(`/api/categorias/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return r.json()
}

export async function arquivarCategoria(id) {
  const r = await fetch(`/api/categorias/${id}/arquivar`, { method: 'PATCH' })
  return r.json()
}
