import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import Nav from './components/BottomNav'
import Dashboard from './pages/Dashboard'
import Lancamentos from './pages/Lancamentos'
import Contas from './pages/Contas'
import Dividas from './pages/Dividas'
import Categorias from './pages/Categorias'

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="flex min-h-screen" style={{ background: '#121212' }}>
          <Nav />
          <main className="flex-1 md:ml-52 pb-16 md:pb-0 overflow-x-hidden">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/lancamentos" element={<Lancamentos />} />
              <Route path="/contas" element={<Contas />} />
              <Route path="/dividas" element={<Dividas />} />
              <Route path="/categorias" element={<Categorias />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AppProvider>
  )
}
