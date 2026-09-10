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

export async function getParcelas(dividaId) {
  const r = await fetch(`/api/dividas/${dividaId}/parcelas`)
  return r.json()
}

export async function pagarParcela(parcelaId, data_pagamento) {
  const r = await fetch(`/api/parcelas/${parcelaId}/pagar`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data_pagamento }),
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
