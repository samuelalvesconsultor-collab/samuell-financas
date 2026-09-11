import { fetchAuth } from './client'

export async function getDashboard(mes) {
  const r = await fetchAuth(`/api/dashboard?mes=${mes}`)
  return r.json()
}
