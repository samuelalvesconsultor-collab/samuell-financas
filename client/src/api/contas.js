export async function getContas(mes) {
  const r = await fetch(`/api/contas?mes=${mes}`)
  return r.json()
}

export async function criarConta(data) {
  const r = await fetch('/api/contas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return r.json()
}

export async function atualizarConta(id, data) {
  const r = await fetch(`/api/contas/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return r.json()
}

export async function pagarConta(id, data_pagamento) {
  const r = await fetch(`/api/contas/${id}/pagar`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data_pagamento }),
  })
  return r.json()
}

export async function deletarConta(id) {
  await fetch(`/api/contas/${id}`, { method: 'DELETE' })
}
