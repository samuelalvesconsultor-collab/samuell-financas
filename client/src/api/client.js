export function getToken() {
  return localStorage.getItem('sf_token')
}

export function setToken(t) {
  if (t) localStorage.setItem('sf_token', t)
  else localStorage.removeItem('sf_token')
}

export async function fetchAuth(url, options = {}) {
  const token = getToken()
  const res = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  if (res.status === 401) {
    setToken(null)
    window.location.href = '/login'
    throw new Error('Sessão expirada')
  }
  return res
}
