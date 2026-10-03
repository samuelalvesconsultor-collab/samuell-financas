import { fetchAuth } from './client'

export const getCartoes = () =>
  fetchAuth('/api/cartoes').then(r => r.json())

export const criarCartao = dados =>
  fetchAuth('/api/cartoes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados),
  }).then(r => r.json())

export const atualizarCartao = (id, dados) =>
  fetchAuth(`/api/cartoes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados),
  }).then(r => r.json())

export const deletarCartao = id =>
  fetchAuth(`/api/cartoes/${id}`, { method: 'DELETE' }).then(r => r.json())

export const getGastosCartao = (id, mes) =>
  fetchAuth(`/api/cartoes/${id}/gastos?mes=${mes}`).then(r => r.json())
