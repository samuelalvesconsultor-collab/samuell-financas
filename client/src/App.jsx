import { Component } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import Nav from './components/BottomNav'
import Dashboard from './pages/Dashboard'
import Lancamentos from './pages/Lancamentos'
import Contas from './pages/Contas'
import Dividas from './pages/Dividas'
import Categorias from './pages/Categorias'
import Configuracoes from './pages/Configuracoes'

class ErrorBoundary extends Component {
  state = { hasError: false }
  static getDerivedStateFromError() { return { hasError: true } }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#121212', color: '#fff', gap: 16, padding: 24 }}>
          <p style={{ color: '#ef4444', fontWeight: 600 }}>Algo deu errado ao carregar.</p>
          <button onClick={() => window.location.reload()}
            style={{ padding: '8px 20px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>
            Recarregar
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AppProvider>
          <div className="flex min-h-screen" style={{ background: 'var(--surface)' }}>
            <Nav />
            <main className="flex-1 md:ml-14 pb-16 md:pb-0 min-w-0">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/lancamentos" element={<Lancamentos />} />
                <Route path="/contas" element={<Contas />} />
                <Route path="/dividas" element={<Dividas />} />
                <Route path="/categorias" element={<Categorias />} />
                <Route path="/configuracoes" element={<Configuracoes />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </AppProvider>
      </ErrorBoundary>
    </BrowserRouter>
  )
}
