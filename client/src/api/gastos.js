import { fetchAuth } from './client'

export const getGastos = mes =>
  fetchAuth(`/api/gastos?mes=${mes}`).then(r => r.json())

export const criarGasto = dados =>
  fetchAuth('/api/gastos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados),
  }).then(r => r.json())

export const deletarGasto = id =>
  fetchAuth(`/api/gastos/${id}`, { method: 'DELETE' }).then(r => r.json())
