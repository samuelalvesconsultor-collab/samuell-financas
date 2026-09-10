export async function getDashboard(mes) {
  const r = await fetch(`/api/dashboard?mes=${mes}`)
  return r.json()
}
