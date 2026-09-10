export async function getDividas(ativa = true) {
  const r = await fetch(`/api/dividas?ativa=${ativa}`)
  return r.json()
}

export async function criarDivida(data) {
  const r = await fetch('/api/dividas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return r.json()
}

export async function atualizarDivida(id, data) {
  const r = await fetch(`/api/dividas/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return r.json()
}

export async function registrarParcela(id) {
  const r = await fetch(`/api/dividas/${id}/parcela`, { method: 'PATCH' })
  return r.json()
}

export async function deletarDivida(id) {
  await fetch(`/api/dividas/${id}`, { method: 'DELETE' })
}
