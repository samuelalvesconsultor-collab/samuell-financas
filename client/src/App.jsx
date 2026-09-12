import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import Nav from './components/BottomNav'
import FAB from './components/FAB'
import Dashboard from './pages/Dashboard'
import Lancamentos from './pages/Lancamentos'
import Contas from './pages/Contas'
import Dividas from './pages/Dividas'
import Categorias from './pages/Categorias'
import Configuracoes from './pages/Configuracoes'
import Login from './pages/Login'
import { getToken, setToken } from './api/client'

function AppAutenticado({ onLogout }) {
  return (
    <AppProvider>
      <div className="flex min-h-screen" style={{ background: 'var(--surface)' }}>
        <Nav />
        <FAB />
        <main className="flex-1 md:ml-14 pb-16 md:pb-0 min-w-0">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/lancamentos" element={<Lancamentos />} />
            <Route path="/contas" element={<Contas />} />
            <Route path="/dividas" element={<Dividas />} />
            <Route path="/categorias" element={<Categorias />} />
            <Route path="/configuracoes" element={<Configuracoes onLogout={onLogout} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </AppProvider>
  )
}

export default function App() {
  // null = verificando, false = não autenticado, string = email
  const [usuario, setUsuario] = useState(null)

  useEffect(() => {
    const token = getToken()
    if (!token) { setUsuario(false); return }
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => setUsuario(data ? data.email : false))
      .catch(() => setUsuario(false))
  }, [])

  function handleLogin(email) { setUsuario(email) }
  function handleLogout() { setToken(null); setUsuario(false) }

  if (usuario === null) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="w-6 h-6 rounded-full border-2 border-red-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <BrowserRouter>
      {usuario
        ? <AppAutenticado onLogout={handleLogout} />
        : <Routes>
            <Route path="*" element={<Login onLogin={handleLogin} />} />
          </Routes>
      }
    </BrowserRouter>
  )
}
