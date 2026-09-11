import { fetchAuth } from './client'

export async function getConfiguracoes() {
  const r = await fetchAuth('/api/configuracoes')
  return r.json()
}

export async function patchConfiguracao(chave, valor) {
  await fetchAuth(`/api/configuracoes/${chave}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ valor }),
  })
}
