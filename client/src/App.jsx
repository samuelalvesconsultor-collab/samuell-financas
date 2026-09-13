import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import Nav from './components/BottomNav'
import Dashboard from './pages/Dashboard'
import Lancamentos from './pages/Lancamentos'
import Contas from './pages/Contas'
import Dividas from './pages/Dividas'
import Categorias from './pages/Categorias'
import Configuracoes from './pages/Configuracoes'

export default function App() {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  )
}
